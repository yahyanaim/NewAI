// Cron Job: Enhanced Moroccan News Stream - Every 3 minutes
// No JWT authentication for cron compatibility

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
    console.log('[CRON] Starting enhanced news fetch...');
    
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error('Supabase configuration missing');
    }
    
    const articles: any[] = [];
    
    // Enhanced sources including more frequent updaters
    const sources = [
      // Existing sources
      fetchMedias24RSS(),
      fetchMedias24JSON(),
      fetchHespressRSS(),
      fetchH24InfoJSON(),
      // New additional sources
      fetchLe360RSS(),
      fetchChallengeRSS(),
      fetchAfricaNewsRSS(),
      fetchReutersMoroccoRSS(),
      // Very frequent updates
      fetchLeSoirRSS(),
      fetchTelquelRSS(),
    ];
    
    const results = await Promise.allSettled(sources);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        articles.push(...result.value);
        console.log(`[CRON] Source ${index + 1} success: ${result.value.length} articles`);
      } else {
        console.error(`[CRON] Source ${index + 1} failed:`, result.reason);
      }
    });
    
    // Deduplicate by URL
    const uniqueArticles = Array.from(
      new Map(articles.map(article => [article.link, article])).values()
    );
    
    console.log(`[CRON] Total unique articles fetched: ${uniqueArticles.length}`);
    
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
            console.error('[CRON] Insert failed:', errorText);
          }
        }
      } catch (error) {
        console.error('[CRON] Error storing article:', error);
      }
    }
    
    console.log(`[CRON] Database update complete: ${insertedCount} inserted, ${updatedCount} updated`);
    
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
    console.error('[CRON] Enhanced news fetch error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'CRON_ENHANCED_NEWS_FAILED',
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

// Enhanced sentiment analysis
function analyzeSentiment(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  const positiveKeywords = [
    'agreement', 'cooperation', 'growth', 'success', 'improve', 'advance', 'invest',
    'développement', 'croissance', 'accord', 'progrès', 'roi', 'royal', 'inaugure',
    'inaugurated', 'launch', 'opening', 'new', 'modern', 'infrastructure'
  ];
  
  const negativeKeywords = [
    'crisis', 'conflict', 'protest', 'strike', 'tension', 'decline', 'concern',
    'crise', 'conflit', 'manifestation', 'baisse', 'arrested', 'fraud', 'floods',
    'casualties', 'death', 'killed', 'crash', 'accident'
  ];
  
  const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;
  const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Enhanced priority analysis
function analyzePriority(title: string, description: string, source: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  const highPriorityKeywords = [
    'urgent', 'breaking', 'crisis', 'emergency', 'major', 'significant', 'royal',
    'roi', 'gouvernement', 'king', 'government', 'security', 'terrorism', 'death',
    'fatal', 'arrested', 'inaugurated', 'signed', 'agreement', 'summit'
  ];
  
  const credibleSources = ['Médias24', 'Hespress', 'H24info', 'Le360', 'Challenge', 'Reuters'];
  
  const hasHighPriorityKeyword = highPriorityKeywords.some(kw => text.includes(kw));
  const isCredibleSource = credibleSources.includes(source);
  
  if (hasHighPriorityKeyword && isCredibleSource) return 'high';
  if (hasHighPriorityKeyword || isCredibleSource) return 'normal';
  return 'low';
}

// Enhanced category classification
function classifyCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.match(/econom|trade|business|invest|market|financial|commerc|économ|budget|dirham/)) return 'economic';
  if (text.match(/military|defense|security|armed forces|police|crime|prison|arrested/)) return 'military';
  if (text.match(/diplomat|foreign|international|bilateral|relations|sahara|espagne|france/)) return 'diplomatic';
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
    console.error(`[CRON] RSS parsing error for ${sourceName}:`, error);
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

// Existing source functions
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
    console.error('[CRON] Médias24 RSS error:', error);
    return [];
  }
}

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
    console.error('[CRON] Médias24 JSON error:', error);
    return [];
  }
}

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
    console.error('[CRON] Hespress RSS error:', error);
    return [];
  }
}

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
    console.error('[CRON] H24info JSON error:', error);
    return [];
  }
}

// NEW ADDITIONAL SOURCES

async function fetchLe360RSS(): Promise<any[]> {
  try {
    const response = await fetch('https://www.le360.ma/rss', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Le360');
  } catch (error) {
    console.error('[CRON] Le360 RSS error:', error);
    return [];
  }
}

async function fetchChallengeRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://www.challenge.ma/feed', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Challenge');
  } catch (error) {
    console.error('[CRON] Challenge RSS error:', error);
    return [];
  }
}

async function fetchAfricaNewsRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://www.africanews.com/feed/', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'AfricaNews');
  } catch (error) {
    console.error('[CRON] AfricaNews RSS error:', error);
    return [];
  }
}

async function fetchReutersMoroccoRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://www.reutersagency.com/feed/?post_type=best_of_news&taxonomy=&taxonomy=&s=Morocco&order=date', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Reuters');
  } catch (error) {
    console.error('[CRON] Reuters Morocco RSS error:', error);
    return [];
  }
}

async function fetchLeSoirRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://www.lesoir.ma/feed/', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'LeSoir');
  } catch (error) {
    console.error('[CRON] LeSoir RSS error:', error);
    return [];
  }
}

async function fetchTelquelRSS(): Promise<any[]> {
  try {
    const response = await fetch('https://telquel.ma/feed/', {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; GeoIntelPro/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const text = await response.text();
    return parseRSSWithRegex(text, 'Telquel');
  } catch (error) {
    console.error('[CRON] Telquel RSS error:', error);
    return [];
  }
}