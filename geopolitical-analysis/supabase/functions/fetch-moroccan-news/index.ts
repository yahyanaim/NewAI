// Moroccan News Fetching Edge Function
// Server-side fetching bypasses Cloudflare browser challenges

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
    console.log('Fetching Moroccan news from server-side...');
    
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
    
    // Sort by date (newest first)
    const sortedArticles = uniqueArticles.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime();
      const dateB = new Date(b.pubDate).getTime();
      return dateB - dateA;
    });
    
    console.log(`Total unique articles: ${sortedArticles.length}`);
    
    return new Response(
      JSON.stringify({ 
        data: sortedArticles,
        count: sortedArticles.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Moroccan news fetch error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'MOROCCAN_NEWS_FETCH_FAILED',
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

// Parse RSS XML using regex (DOMParser not reliable in Deno)
function parseRSSWithRegex(xmlText: string, sourceName: string): any[] {
  const articles: any[] = [];
  
  try {
    // Extract all <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = xmlText.match(itemRegex) || [];
    
    items.forEach(itemBlock => {
      // Extract fields using regex
      const title = (itemBlock.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                    itemBlock.match(/<title>(.*?)<\/title>/))?.[1] || '';
      const link = itemBlock.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const pubDate = itemBlock.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
      const description = (itemBlock.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || 
                          itemBlock.match(/<description>(.*?)<\/description>/))?.[1] || '';
      const guid = (itemBlock.match(/<guid[^>]*>(.*?)<\/guid>/) || [])[1] || link;
      
      if (title && link) {
        articles.push({
          title: decodeHTMLEntities(title),
          link: link.trim(),
          pubDate: pubDate.trim(),
          description: decodeHTMLEntities(description),
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
      pubDate: post.date || '',
      description: stripHTML(post.excerpt?.rendered || ''),
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
      pubDate: post.date || '',
      description: stripHTML(post.excerpt?.rendered || ''),
      source: 'H24info',
      guid: `h24info-${post.id}`,
    }));
  } catch (error) {
    console.error('H24info JSON error:', error);
    return [];
  }
}
