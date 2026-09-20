// Radio station fetching from RadioBrowser.info API
// Free public API for live radio streaming

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  tags: string;
  codec: string;
  bitrate: number;
  votes: number;
  clickcount: number;
}

// RadioBrowser.info API endpoints (multiple for redundancy)
const API_ENDPOINTS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

// Rotate through endpoints for reliability
let currentEndpointIndex = 0;

function getApiEndpoint(): string {
  const endpoint = API_ENDPOINTS[currentEndpointIndex];
  currentEndpointIndex = (currentEndpointIndex + 1) % API_ENDPOINTS.length;
  return endpoint;
}

// Fetch Moroccan radio stations
export async function fetchMoroccanRadioStations(): Promise<RadioStation[]> {
  try {
    const endpoint = getApiEndpoint();
    const response = await fetch(`${endpoint}/json/stations/bycountry/morocco`, {
      headers: {
        'User-Agent': 'GeoIntelPro/1.0',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const stations: RadioStation[] = await response.json();
    
    // Sort by votes and click count for quality
    return stations
      .filter(station => station.url_resolved) // Only stations with working URLs
      .sort((a, b) => (b.votes + b.clickcount) - (a.votes + a.clickcount))
      .slice(0, 20); // Top 20 stations
  } catch (error) {
    console.error('Error fetching Moroccan radio stations:', error);
    return [];
  }
}

// Fetch Arabic/Maghreb radio stations for broader coverage
export async function fetchArabicRadioStations(): Promise<RadioStation[]> {
  try {
    const endpoint = getApiEndpoint();
    const response = await fetch(`${endpoint}/json/stations/bylanguage/arabic`, {
      headers: {
        'User-Agent': 'GeoIntelPro/1.0',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const stations: RadioStation[] = await response.json();
    
    // Filter for Maghreb region countries
    const maghrebCountries = ['morocco', 'algeria', 'tunisia', 'libya', 'mauritania'];
    
    return stations
      .filter(station => 
        station.url_resolved && 
        maghrebCountries.some(country => 
          station.country.toLowerCase().includes(country) ||
          station.countrycode.toLowerCase().includes(country.slice(0, 2))
        )
      )
      .sort((a, b) => (b.votes + b.clickcount) - (a.votes + a.clickcount))
      .slice(0, 15);
  } catch (error) {
    console.error('Error fetching Arabic radio stations:', error);
    return [];
  }
}

// Get all available stations (Moroccan + Arabic)
export async function fetchAllRadioStations(): Promise<RadioStation[]> {
  try {
    const [moroccan, arabic] = await Promise.allSettled([
      fetchMoroccanRadioStations(),
      fetchArabicRadioStations(),
    ]);

    const allStations: RadioStation[] = [];

    if (moroccan.status === 'fulfilled') allStations.push(...moroccan.value);
    if (arabic.status === 'fulfilled') allStations.push(...arabic.value);

    // Deduplicate by station UUID
    const uniqueStations = Array.from(
      new Map(allStations.map(station => [station.stationuuid, station])).values()
    );

    return uniqueStations;
  } catch (error) {
    console.error('Error fetching all radio stations:', error);
    return [];
  }
}

// Report station click to RadioBrowser (helps with statistics)
export async function reportStationClick(stationUuid: string): Promise<void> {
  try {
    const endpoint = getApiEndpoint();
    await fetch(`${endpoint}/json/url/${stationUuid}`, {
      headers: {
        'User-Agent': 'GeoIntelPro/1.0',
      },
    });
  } catch (error) {
    console.error('Error reporting station click:', error);
  }
}

// Preset popular Moroccan stations (fallback if API fails)
export const PRESET_MOROCCAN_STATIONS: Partial<RadioStation>[] = [
  {
    name: 'Radio 2M',
    country: 'Morocco',
    language: 'arabic',
    tags: 'news,talk,music',
  },
  {
    name: 'Medi 1 Radio',
    country: 'Morocco',
    language: 'arabic,french',
    tags: 'news,talk,music',
  },
  {
    name: 'Hit Radio Morocco',
    country: 'Morocco',
    language: 'arabic,french',
    tags: 'pop,music',
  },
  {
    name: 'Atlantic Radio',
    country: 'Morocco',
    language: 'arabic,french',
    tags: 'music,variety',
  },
];
