// Edge Function: Aggregate global news from multiple free sources
// Sources: GDELT (free), Guardian RSS (free), UCDP data enrichment

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { category, limit = 20 } = await req.json().catch(() => ({ limit: 20 }));

    // Build GDELT query based on category
    let query = 'geopolitics OR conflict OR diplomacy OR sanctions OR war OR international relations';
    if (category === 'conflict') {
      query = 'conflict OR war OR military OR armed forces OR battle';
    } else if (category === 'diplomacy') {
      query = 'diplomacy OR diplomatic OR negotiation OR treaty OR summit';
    } else if (category === 'sanctions') {
      query = 'sanctions OR embargo OR trade restrictions OR economic measures';
    }

    // Get recent date for GDELT (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch from GDELT DOC 2.0 API (free, no key required)
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&format=json&startdatetime=${dateStr}000000&sort=datedesc`;

    const gdeltResponse = await fetch(gdeltUrl, {
      headers: {
        'User-Agent': 'GeopoliticalAnalysisPlatform/1.0'
      }
    });

    if (!gdeltResponse.ok) {
      throw new Error(`GDELT API error: ${gdeltResponse.status}`);
    }

    const gdeltData = await gdeltResponse.json();

    // Parse GDELT articles
    const articles = [];
    
    if (gdeltData.articles && Array.isArray(gdeltData.articles)) {
      for (const article of gdeltData.articles.slice(0, limit)) {
        articles.push({
          id: `gdelt-${article.url}`,
          title: article.title || 'Untitled',
          description: article.seendate ? `Published: ${new Date(article.seendate).toLocaleString()}` : '',
          url: article.url,
          source: article.domain || 'GDELT',
          publishedAt: article.seendate || new Date().toISOString(),
          category: category || 'general',
          imageUrl: article.socialimage || null,
        });
      }
    }

    // Also fetch from Guardian RSS (free, no key required)
    try {
      const guardianRssUrl = 'https://www.theguardian.com/world/rss';
      const guardianResponse = await fetch(guardianRssUrl);
      
      if (guardianResponse.ok) {
        const rssText = await guardianResponse.text();
        
        // Parse RSS using regex (DOMParser not available in Deno edge functions)
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/;
        const linkRegex = /<link>(.*?)<\/link>/;
        const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>/;
        const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
        
        let match;
        let guardianCount = 0;
        
        while ((match = itemRegex.exec(rssText)) !== null && guardianCount < 10) {
          const item = match[1];
          const title = titleRegex.exec(item)?.[1];
          const link = linkRegex.exec(item)?.[1];
          const description = descRegex.exec(item)?.[1];
          const pubDate = pubDateRegex.exec(item)?.[1];
          
          if (title && link) {
            articles.push({
              id: `guardian-${link}`,
              title: title,
              description: description || '',
              url: link,
              source: 'The Guardian',
              publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
              category: 'diplomacy',
              imageUrl: null,
            });
            guardianCount++;
          }
        }
      }
    } catch (guardianError) {
      console.error('Guardian RSS fetch failed:', guardianError);
      // Continue with GDELT data only
    }

    // Sort by date (newest first)
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return new Response(JSON.stringify({
      data: {
        articles: articles.slice(0, limit),
        totalCount: articles.length,
        sources: ['GDELT', 'The Guardian'],
        lastUpdate: new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('News aggregation error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'NEWS_AGGREGATION_ERROR',
        message: error.message || 'Failed to fetch news'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
