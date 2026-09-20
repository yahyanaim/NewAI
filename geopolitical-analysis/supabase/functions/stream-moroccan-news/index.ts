// Real-time Moroccan News Streaming Edge Function
// Fetches news from Moroccan sources and stores in database for real-time updates

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
    console.log('Starting real-time news fetch and database storage...');
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }
    
    const articles: any[] = [];
    
    // Fetch from multiple Moroccan sources in parallel
    const sources = [
      fetchMedias24RSS(),
      fetchMedias24JSON(),
      fetchHespressRSS(),
      fetchH24InfoJSON(),
    ];
    
    const results = await Promise.allSettled(sources);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
        console.log(`Source ${index + 1} success: ${result.value.length} articles`);
      } else {
        console.error(`Source ${index + 1} failed:`, result.reason);
      }
    });
    
    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(articles.map(article => [article.link, article])).values()
    );
    
    console.log(`Total unique articles fetched: ${uniqueArticles.length}`);
    
    // Store articles in database (upsert to avoid duplicates)
    let insertedCount = 0;
    let updatedCount = 0;
    
    for (const article of uniqueArticles) {
      try {
        // Analyze sentiment
        const sentiment = analyzeSentiment(article.title, article.description || '');
        const priority = analyzePriority(article.title, article.description || '', article.source);
        const category = classifyCategory(article.title, article.description || '');
        
        // Check if article exists
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/moroccan_news_articles?link=eq.${encodeURIComponent(article.link)}`,
          {
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const existing = await checkResponse.json();
        
        if (existing && existing.length > 0) {
          // Update existing article
          const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/moroccan_news_articles?id=eq.${existing[0].id}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                title: article.title,
                description: article.description || '',
                content: article.content || article.description || '',
                sentiment,
                priority,
                category,
                updated_at: new Date().toISOString(),
              }),
            }
          );
          
          if (updateResponse.ok) {
            updatedCount++;
          }
        } else {
          // Insert new article
          const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/moroccan_news_articles`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                title: article.title,
                link: article.link,
                pub_date: article.pubDate || new Date().toISOString(),
                description: article.description || '',
                content: article.content || article.description || '',
                source: article.source,
                category,
                guid: article.guid,
                sentiment,
                priority,
              }),
            }
          );
          
          if (insertResponse.ok) {
            insertedCount++;
          } else {
            const errorText = await insertResponse.text();
            console.error('Insert failed:', errorText);
          }
        }
      } catch (error) {
        console.error('Error storing article:', error);
      }
    }
    
    console.log(`Database update complete: ${insertedCount} inserted, ${updatedCount} updated`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        fetched: uniqueArticles.length,
        inserted: insertedCount,
        updated: updatedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Real-time news streaming error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'NEWS_STREAMING_FAILED',
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Sentiment analysis
function analyzeSentiment(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  const positiveKeywords = ['agreement', 'cooperation', 'growth', 'success', 'improve', 'advance', 'invest', 'développement', 'croissance', 'accord', 'progrès'];
  const negativeKeywords = ['crisis', 'conflict', 'protest', 'strike', 'tension', 'decline', 'concern', 'crise', 'conflit', 'manifestation', 'baisse'];
  
  const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
  const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Priority analysis
function analyzePriority(title: string, description: string, source: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  const highPriorityKeywords = ['urgent', 'breaking', 'crisis', 'emergency', 'major', 'significant', 'royal', 'government', 'security', 'roi', 'gouvernement'];
  const credibleSources = ['Médias24', 'Hespress', 'H24info'];
  
  const hasHighPriorityKeyword = highPriorityKeywords.some(kw => text.includes(kw));
  const isCredibleSource = credibleSources.includes(source);
  
  if (hasHighPriorityKeyword && isCredibleSource) return 'high';
  if (hasHighPriorityKeyword || isCredibleSource) return 'normal';
  return 'low';
}

// Category classification
function classifyCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.match(/econom|trade|business|invest|market|financial|commerc|économ/)) return 'economic';
  if (text.match(/military|defense|security|armed forces|armée|défense/)) return 'military';
  if (text.match(/diplomat|foreign|international|bilateral|relations|étranger/)) return 'diplomatic';
  return 'political';
}

// Parse RSS XML using regex
function parseRSSWithRegex(xmlText: string, sourceName: string): any[] {
  const articles: any[] = [];
  
  try {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = xmlText.match(itemRegex) || [];
    
    items.forEach(itemBlock => {
      const title = (itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                    itemBlock.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = itemBlock.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemBlock.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = (itemBlock.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                          itemBlock.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const content = (itemBlock.match(/<content:encoded><!\[CDATA\[(.*?)\]\]><\/content:encoded>/) || [])[1] || description;
      const guid = (itemBlock.match(/<guid[^>]*>(.*?)<\/guid>/) || [])[1] || link;
      
      if (title && link) {
        articles.push({
          title: decodeHTMLEntities(title),
          link: link.trim(),
          pubDate: pubDate.trim() || new Date().toISOString(),
          description: decodeHTMLEntities(description),
          content: decodeHTMLEntities(content),
          source: sourceName,
          guid: guid.trim(),
        });
      }
    });
  } catch (error) {
    console.error(`RSS parsing error for ${sourceName}:`, error);
  }
  
  return articles;
}

// Decode HTML entities
function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

// Remove HTML tags
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

// Fetch Médias24 RSS
async function fetchMedias24RSS(): Promise<any[]> {
  try {
    const response = await fetch('https://medias24.com/feed', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Médias24');
  } catch (error) {
    console.error('Médias24 RSS error:', error);
    return [];
  }
}

// Fetch Médias24 JSON API
async function fetchMedias24JSON(): Promise<any[]> {
  try {
    const response = await fetch('https://medias24.com/wp-json/wp/v2/posts?per_page=20', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const posts = await response.json();
    
    return posts.map((post: any) => ({
      title: stripHTML(post.title?.rendered || ''),
      link: post.link || '',
      pubDate: post.date || new Date().toISOString(),
      description: stripHTML(post.excerpt?.rendered || ''),
      content: stripHTML(post.content?.rendered || ''),
      source: 'Médias24',
      guid: `medias24-${post.id}`,
    }));
  } catch (error) {
    console.error('Médias24 JSON error:', error);
    return [];
  }
}

// Fetch Hespress RSS
async function fetchHespressRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://en.hespress.com/feed', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Hespress');
  } catch (error) {
    console.error('Hespress RSS error:', error);
    return [];
  }
}

// Fetch H24info JSON API
async function fetchH24InfoJSON(): Promise<any[]> {
  try {
    const response = await fetch('https://h24info.ma/wp-json/wp/v2/posts?per_page=20', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const posts = await response.json();
    
    return posts.map((post: any) => ({
      title: stripHTML(post.title?.rendered || ''),
      link: post.link || '',
      pubDate: post.date || new Date().toISOString(),
      description: stripHTML(post.excerpt?.rendered || ''),
      content: stripHTML(post.content?.rendered || ''),
      source: 'H24info',
      guid: `h24info-${post.id}`,
    }));
  } catch (error) {
    console.error('H24info JSON error:', error);
    return [];
  }
}
