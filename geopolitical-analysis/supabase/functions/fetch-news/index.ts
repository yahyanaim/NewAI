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
    const { country, category } = await req.json();
    
    // Get NewsAPI key from environment
    const newsApiKey = Deno.env.get('NEWS_API_KEY');
    
    if (!newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    // Build query parameters
    let query = 'geopolitics OR conflict OR diplomacy';
    if (category && category !== 'all') {
      query = category;
    }
    
    let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${newsApiKey}`;
    
    if (country) {
      url = `https://newsapi.org/v2/top-headlines?country=${country.toLowerCase()}&apiKey=${newsApiKey}`;
    }

    // Fetch news from NewsAPI
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'error') {
      throw new Error(data.message || 'NewsAPI error');
    }

    // Transform to our format
    const articles = data.articles.map((article: any) => ({
      id: article.url,
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      imageUrl: article.urlToImage,
      category: category || 'conflict',
      country: country,
    }));

    return new Response(
      JSON.stringify({ data: articles }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('News fetch error:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: 'NEWS_FETCH_FAILED',
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
