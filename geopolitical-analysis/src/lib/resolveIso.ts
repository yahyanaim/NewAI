// Lightweight resolver to normalize country inputs to ISO2 codes
// Used when upstream data may provide full country names or non-standard codes.
const COMMON_MAP: Record<string, string> = {
  'united kingdom': 'gb',
  'uk': 'gb',
  'great britain': 'gb',
  'england': 'gb',
  'scotland': 'gb',
  'wales': 'gb',
  'qatar': 'qa',
  'france': 'fr',
  'morocco': 'ma',
  'algeria': 'dz',
  'tunisia': 'tn',
  'libya': 'ly',
  'mauritania': 'mr',
  'united states': 'us',
  'usa': 'us',
  'united arab emirates': 'ae',
  'south korea': 'kr',
  'north korea': 'kp',
  'russia': 'ru',
  'iran': 'ir',
  'germany': 'de',
  'spain': 'es',
  'italy': 'it'
};

export function resolveIso2(countrycode?: string | null, country?: string | null): string | undefined {
  // Prefer explicit country name mapping when available (some upstream sources have incorrect countrycode)
  if (country && typeof country === 'string') {
    const key = country.trim().toLowerCase();
    if (COMMON_MAP[key]) return COMMON_MAP[key];

    // Sometimes the country string contains comma-separated parts (e.g., "United Kingdom, England")
    const primary = key.split(',')[0].trim();
    if (COMMON_MAP[primary]) return COMMON_MAP[primary];

    // If the country string already looks like a two-letter code
    if (/^[a-z]{2}$/.test(primary)) return primary;
  }

  // Fallback to countrycode when country name is not helpful
  if (countrycode && typeof countrycode === 'string') {
    const cleaned = countrycode.trim().toLowerCase();
    if (/^[a-z]{2}$/.test(cleaned)) return cleaned;
    // Some sources may provide full names in the countrycode field
    if (COMMON_MAP[cleaned]) return COMMON_MAP[cleaned];
  }

  return undefined;
}

export default resolveIso2;
