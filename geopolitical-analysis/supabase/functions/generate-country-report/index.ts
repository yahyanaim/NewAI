// Edge Function: Generate comprehensive country political analysis report
// Returns structured data for PDF generation on frontend

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
    const { countryCode, reportType = 'full' } = await req.json();

    if (!countryCode) {
      throw new Error('Country code is required');
    }

    // Fetch country details from REST Countries API
    const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
    if (!countryResponse.ok) {
      throw new Error('Country not found');
    }
    const countryData = await countryResponse.json();
    const country = countryData[0];

    // Fetch UCDP conflict data for this country
    const ucdpUrl = `https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=500`;
    const ucdpResponse = await fetch(ucdpUrl);
    let conflictEvents = [];
    let conflictMetrics = {
      totalEvents: 0,
      totalFatalities: 0,
      lastEventDate: null,
      conflictTypes: {},
    };

    if (ucdpResponse.ok) {
      const ucdpData = await ucdpResponse.json();
      if (ucdpData.Result && Array.isArray(ucdpData.Result)) {
        // Filter events for this country (basic filtering)
        conflictEvents = ucdpData.Result.slice(0, 20);
        
        conflictMetrics.totalEvents = conflictEvents.length;
        conflictMetrics.totalFatalities = conflictEvents.reduce((sum: number, e: any) => 
          sum + (e.best_est || e.deaths_a || e.deaths_b || 0), 0
        );
      }
    }

    // Fetch recent news about this country from GDELT
    const query = `${country.name.common} AND (conflict OR politics OR diplomacy)`;
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=10&format=json`;
    
    const newsResponse = await fetch(gdeltUrl);
    let recentNews = [];
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      if (newsData.articles && Array.isArray(newsData.articles)) {
        recentNews = newsData.articles.slice(0, 5).map((article: any) => ({
          title: article.title,
          url: article.url,
          date: article.seendate,
          source: article.domain,
        }));
      }
    }

    // Generate comprehensive report structure
    const report = {
      metadata: {
        reportType,
        generatedAt: new Date().toISOString(),
        countryCode: countryCode,
        countryName: country.name.common,
        version: '1.0',
      },
      
      executiveSummary: {
        title: `${country.name.common} - Geopolitical Analysis Report`,
        overview: `Comprehensive political and conflict analysis for ${country.name.common} (${country.region})`,
        keyFindings: [
          `Total conflict events tracked: ${conflictMetrics.totalEvents}`,
          `Estimated fatalities: ${conflictMetrics.totalFatalities}`,
          `Political stability index: ${conflictMetrics.totalEvents < 10 ? 'High' : conflictMetrics.totalEvents < 50 ? 'Medium' : 'Low'}`,
          `Recent media coverage: ${recentNews.length} major articles`,
        ],
        riskAssessment: conflictMetrics.totalEvents > 50 ? 'High Risk' : 
                        conflictMetrics.totalEvents > 10 ? 'Medium Risk' : 'Low Risk',
      },

      countryProfile: {
        basicInfo: {
          name: country.name.common,
          officialName: country.name.official,
          capital: country.capital?.[0] || 'N/A',
          region: country.region,
          subregion: country.subregion,
          population: country.population,
          area: country.area,
          languages: Object.values(country.languages || {}).join(', '),
          currencies: Object.keys(country.currencies || {}).join(', '),
        },
        geopolitical: {
          unMember: country.unMember || false,
          borders: country.borders || [],
          borderCount: (country.borders || []).length,
          landlocked: country.landlocked || false,
        },
      },

      conflictAnalysis: {
        overview: {
          totalEvents: conflictMetrics.totalEvents,
          totalFatalities: conflictMetrics.totalFatalities,
          lastEventDate: conflictMetrics.lastEventDate,
        },
        timeline: conflictEvents.slice(0, 10).map((event: any) => ({
          date: event.date_start,
          type: event.type_of_violence === 1 ? 'State-based conflict' :
                event.type_of_violence === 2 ? 'Non-state conflict' : 'One-sided violence',
          location: event.where_description,
          fatalities: event.best_est || 0,
        })),
        severity: conflictMetrics.totalFatalities > 1000 ? 'Critical' :
                  conflictMetrics.totalFatalities > 100 ? 'High' :
                  conflictMetrics.totalFatalities > 10 ? 'Medium' : 'Low',
      },

      recentDevelopments: {
        news: recentNews,
        lastUpdated: new Date().toISOString(),
      },

      economicImpact: {
        stabilityIndex: conflictMetrics.totalEvents < 10 ? 85 : 
                       conflictMetrics.totalEvents < 50 ? 55 : 25,
        investmentRisk: conflictMetrics.totalEvents > 50 ? 'High' : 'Medium',
        tradeDisruption: conflictMetrics.totalFatalities > 500 ? 'Severe' : 'Moderate',
      },

      predictiveAnalytics: {
        escalationRisk: conflictMetrics.totalEvents > 100 ? 'High' : 
                       conflictMetrics.totalEvents > 30 ? 'Medium' : 'Low',
        timeHorizon: '30-90 days',
        confidenceLevel: 'Medium',
      },
    };

    return new Response(JSON.stringify({
      data: report
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Report generation error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'REPORT_GENERATION_ERROR',
        message: error.message || 'Failed to generate report'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
