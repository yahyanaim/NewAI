// Edge Function: Fetch and calculate conflict intensity for all countries
// Sources: UCDP API (free), GDELT events (free)

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
    // Fetch from UCDP API - Georeferenced Event Dataset (GED)
    // Latest version: v24.1 (as of 2024)
    const ucdpUrl = 'https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=1000';
    
    const ucdpResponse = await fetch(ucdpUrl, {
      headers: {
        'User-Agent': 'GeopoliticalAnalysisPlatform/1.0'
      }
    });

    if (!ucdpResponse.ok) {
      throw new Error(`UCDP API error: ${ucdpResponse.status}`);
    }

    const ucdpData = await ucdpResponse.json();
    
    // Process UCDP events and calculate intensity by country
    const countryIntensity: Record<string, {
      eventCount: number;
      fatalities: number;
      recentEvents: any[];
      iso3?: string;
    }> = {};

    // Country code mapping (UCDP uses different codes than ISO3)
    const countryCodeMap: Record<string, string> = {
      '645': 'SYR', // Syria
      '678': 'YEM', // Yemen
      '700': 'AFG', // Afghanistan
      '369': 'UKR', // Ukraine
      '775': 'MMR', // Myanmar
      '530': 'ETH', // Ethiopia
      '625': 'SDN', // Sudan
      '520': 'SOM', // Somalia
      '490': 'COD', // DR Congo
      '645': 'IRQ', // Iraq
      '666': 'PSE', // Palestine
      '666': 'ISR', // Israel
      '620': 'LBY', // Libya
      '615': 'EGY', // Egypt
      '517': 'KEN', // Kenya
      '581': 'NGA', // Nigeria
      '483': 'CMR', // Cameroon
      '404': 'RUS', // Russia
      '710': 'CHN', // China
      '731': 'PRK', // North Korea
      '732': 'KOR', // South Korea
    };

    if (ucdpData.Result && Array.isArray(ucdpData.Result)) {
      for (const event of ucdpData.Result) {
        const countryId = event.country_id?.toString() || event.country?.toString();
        const iso3 = countryCodeMap[countryId] || event.country;
        
        if (!iso3) continue;

        if (!countryIntensity[iso3]) {
          countryIntensity[iso3] = {
            eventCount: 0,
            fatalities: 0,
            recentEvents: [],
            iso3: iso3
          };
        }

        countryIntensity[iso3].eventCount++;
        countryIntensity[iso3].fatalities += event.best_est || event.deaths_a || event.deaths_b || 0;
        
        if (countryIntensity[iso3].recentEvents.length < 5) {
          countryIntensity[iso3].recentEvents.push({
            date: event.date_start,
            type: event.type_of_violence === 1 ? 'State-based conflict' :
                  event.type_of_violence === 2 ? 'Non-state conflict' :
                  'One-sided violence',
            fatalities: event.best_est || 0,
            location: event.where_description || 'Unknown',
          });
        }
      }
    }

    // Calculate intensity levels based on event count and fatalities
    const intensityData = Object.keys(countryIntensity).map(iso3 => {
      const data = countryIntensity[iso3];
      let intensity: 'low' | 'medium' | 'high' | 'critical';
      
      // Intensity scoring algorithm
      const score = (data.eventCount * 0.4) + (data.fatalities * 0.6);
      
      if (score > 200) {
        intensity = 'critical';
      } else if (score > 100) {
        intensity = 'high';
      } else if (score > 30) {
        intensity = 'medium';
      } else {
        intensity = 'low';
      }

      return {
        country: iso3,
        intensity,
        eventCount: data.eventCount,
        fatalities: data.fatalities,
        recentEvents: data.recentEvents,
        lastUpdate: new Date().toISOString(),
      };
    });

    // Calculate global metrics
    const totalEvents = intensityData.reduce((sum, d) => sum + d.eventCount, 0);
    const activeConflicts = intensityData.filter(d => 
      d.intensity === 'high' || d.intensity === 'critical'
    ).length;
    const totalFatalities = intensityData.reduce((sum, d) => sum + d.fatalities, 0);

    return new Response(JSON.stringify({
      data: {
        conflictIntensity: intensityData,
        globalMetrics: {
          totalEvents,
          activeConflicts,
          totalFatalities,
          countriesTracked: intensityData.length,
          lastUpdate: new Date().toISOString(),
        },
        dataSource: 'UCDP Georeferenced Event Dataset v24.1',
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Conflict intensity error:', error);

    return new Response(JSON.stringify({
      error: {
        code: 'CONFLICT_INTENSITY_ERROR',
        message: error.message || 'Failed to fetch conflict data'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
