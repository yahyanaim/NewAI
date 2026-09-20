import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, MapPin } from 'lucide-react';
import { LOCATION_COORDS } from '../lib/intelAPI';
import { WeatherDetailsModal } from './WeatherDetailsModal';

interface WeatherData {
    temp: number;
    condition: string;
    windSpeed: number;
    location: string;
}

interface WeatherTickerProps {
    selectedCountry?: string;
    onCountrySelect?: (country: string) => void;
}

export function WeatherTicker({ selectedCountry = 'Morocco', onCountrySelect }: WeatherTickerProps) {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [tickerItems, setTickerItems] = useState<WeatherData[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Capitals to cycle through for the ticker
    const capitals = ['USA', 'GBR', 'FRA', 'RUS', 'CHN', 'ISR', 'UKR', 'IRN'];

    // Fetch weather from Open-Meteo
    const fetchWeather = async (lat: number, lng: number, locationName: string) => {
        try {
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m`
            );
            const data = await response.json();
            const current = data.current;

            // Map WMO codes to conditions
            const getCondition = (code: number) => {
                if (code <= 3) return 'Clear/Cloudy';
                if (code <= 48) return 'Fog';
                if (code <= 67) return 'Rain';
                if (code <= 77) return 'Snow';
                return 'Storm';
            };

            return {
                temp: current.temperature_2m,
                condition: getCondition(current.weather_code),
                windSpeed: current.wind_speed_10m,
                location: locationName
            };
        } catch (err) {
            console.error('Weather fetch error:', err);
            return null;
        }
    };

    // Load ticker items (Major Capitals)
    useEffect(() => {
        const loadTicker = async () => {
            const items = await Promise.all(
                capitals.map(async (code) => {
                    const coords = LOCATION_COORDS[code];
                    if (!coords) return null;
                    return await fetchWeather(coords.lat, coords.lng, code);
                })
            );
            setTickerItems(items.filter(Boolean) as WeatherData[]);
        };
        loadTicker();

        // Refresh every 30 mins
        const interval = setInterval(loadTicker, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Load selected country weather
    useEffect(() => {
        if (selectedCountry) {
            const loadSelected = async () => {
                setLoading(true);
                // Find coords by country name matching mock DB
                let targetCoords = null;
                let targetCode = 'UNKNOWN';

                const cleanName = selectedCountry.trim();
                const upperName = cleanName.toUpperCase();

                // Try direct code match or known overrides
                if (upperName === 'MOROCCO' || upperName === 'MAR') {
                    targetCoords = { lat: 34.0209, lng: -6.8416, name: 'Morocco (Rabat)' };
                } else if (upperName === 'USA' || upperName === 'UNITED STATES') {
                    targetCoords = LOCATION_COORDS['USA'] ? { ...LOCATION_COORDS['USA'], name: 'USA (DC)' } : { lat: 38.9, lng: -77.0, name: 'USA' };
                } else if (upperName === 'GBR' || upperName === 'UK' || upperName === 'UNITED KINGDOM') {
                    targetCoords = LOCATION_COORDS['GBR'] ? { ...LOCATION_COORDS['GBR'], name: 'UK (London)' } : { lat: 51.5, lng: -0.1, name: 'UK' };
                } else if (upperName === 'FRA' || upperName === 'FRANCE') {
                    targetCoords = LOCATION_COORDS['FRA'] ? { ...LOCATION_COORDS['FRA'], name: 'France (Paris)' } : { lat: 48.8, lng: 2.3, name: 'France' };
                } else {
                    // Try to match specific capitals/countries we know from LOCATION_COORDS keys (ISO codes or Full Names)
                    // Check if name is a Key
                    if (LOCATION_COORDS[cleanName]) {
                        targetCoords = { ...LOCATION_COORDS[cleanName], name: cleanName };
                    } else {
                        // Check if name matches any key case-insensitive
                        const keyMatch = Object.keys(LOCATION_COORDS).find(k => k.toUpperCase() === upperName);
                        if (keyMatch && LOCATION_COORDS[keyMatch]) {
                            targetCoords = { ...LOCATION_COORDS[keyMatch], name: cleanName };
                        }
                    }
                }

                if (!targetCoords) {
                    // Fallback for demo: random coords close to equator if unknown
                    targetCoords = { lat: 34.0, lng: -6.8, name: selectedCountry };
                }

                const data = await fetchWeather(targetCoords.lat, targetCoords.lng, selectedCountry);
                if (data) {
                    setWeatherData(data);
                }
                setLoading(false);
            };
            loadSelected();
        }
    }, [selectedCountry]);

    const getWeatherIcon = (condition: string) => {
        switch (condition) {
            case 'Rain': return <CloudRain className="w-4 h-4 text-blue-400" />;
            case 'Clear/Cloudy': return <Sun className="w-4 h-4 text-yellow-400" />;
            case 'Storm': return <Wind className="w-4 h-4 text-gray-400" />;
            default: return <Cloud className="w-4 h-4 text-gray-400" />;
        }
    };

    // Default coords for Morocco/Rabat if selectedCountry is Morocco or unknown
    const getCoords = (name: string) => {
        if (!name) return { lat: 34.0209, lng: -6.8416, name: 'Morocco (Rabat)' };

        const cleanName = name.trim();
        const upperName = cleanName.toUpperCase();

        // Try direct code match or known overrides
        if (upperName === 'MOROCCO' || upperName === 'MAR') return { lat: 34.0209, lng: -6.8416, name: 'Morocco (Rabat)' };
        if (upperName === 'USA' || upperName === 'UNITED STATES') return LOCATION_COORDS['USA'] ? { ...LOCATION_COORDS['USA'], name: 'USA (DC)' } : { lat: 38.9, lng: -77.0, name: 'USA' };
        if (upperName === 'GBR' || upperName === 'UK' || upperName === 'UNITED KINGDOM') return LOCATION_COORDS['GBR'] ? { ...LOCATION_COORDS['GBR'], name: 'UK (London)' } : { lat: 51.5, lng: -0.1, name: 'UK' };
        if (upperName === 'FRA' || upperName === 'FRANCE') return LOCATION_COORDS['FRA'] ? { ...LOCATION_COORDS['FRA'], name: 'France (Paris)' } : { lat: 48.8, lng: 2.3, name: 'France' };

        // Try to match specific capitals/countries we know from LOCATION_COORDS keys (ISO codes or Full Names)
        // Check if name is a Key
        if (LOCATION_COORDS[cleanName]) return { ...LOCATION_COORDS[cleanName], name: cleanName };

        // Check if name matches any key case-insensitive
        const keyMatch = Object.keys(LOCATION_COORDS).find(k => k.toUpperCase() === upperName);
        if (keyMatch && LOCATION_COORDS[keyMatch]) return { ...LOCATION_COORDS[keyMatch], name: cleanName };

        // Ultimate fallback (Rabat)
        // console.warn(`WeatherTicker: No coordinates found for ${name}, defaulting to Morocco.`);
        return { lat: 34.0209, lng: -6.8416, name: 'Morocco' };
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-40 h-10 bg-bg-surface border-t border-accent-primary/20 flex items-center shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">

                {/* Label */}
                <div className="px-4 h-full flex items-center bg-accent-primary text-bg-base font-bold text-xs uppercase tracking-wider shrink-0 cursor- help" title="Global Meteorological Data">
                    <Thermometer className="w-4 h-4 mr-2" />
                    {selectedCountry || 'MOROCCO'}
                </div>

                {/* Selected Country Display (Clickable to Open Modal) */}
                {selectedCountry && weatherData && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-4 px-6 h-full bg-accent-primary/10 border-r border-accent-primary/20 shrink-0 hover:bg-accent-primary/20 transition-colors cursor-pointer group"
                        title="Click for detailed forecast"
                    >
                        <div className="flex items-center gap-2 group-hover:scale-105 transition-transform">
                            <MapPin className="w-4 h-4 text-accent-primary" />
                            <span className="font-bold text-text-primary text-sm">{weatherData.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {getWeatherIcon(weatherData.condition)}
                            <span className="text-text-primary font-mono font-bold">{weatherData.temp}°C</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-secondary">
                            <Wind className="w-3 h-3" />
                            {weatherData.windSpeed} km/h
                        </div>
                    </button>
                )}

                {/* Ticker marquee - Clickable Items to Select Country */}
                <div className="flex-1 overflow-hidden relative h-full flex items-center">
                    <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-8">
                        {/* Duplicate list for seamless loop */}
                        {[...tickerItems, ...tickerItems].map((item, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    onCountrySelect?.(item.location);
                                    setShowModal(true);
                                }}
                                className="inline-flex items-center gap-3 text-sm hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
                                title="Click to view weather details"
                            >
                                <span className="font-bold text-text-secondary">{item.location}</span>
                                <span className="flex items-center gap-1 text-text-primary">
                                    {getWeatherIcon(item.condition)}
                                    {item.temp}°C
                                </span>
                                <span className="text-text-tertiary text-xs">|</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Attribution */}
                <div className="px-4 h-full flex items-center bg-bg-surface border-l border-accent-primary/20 shrink-0 z-10">
                    <span className="text-[10px] text-text-tertiary font-medium uppercase tracking-wider">
                        Intelligence Platform | LiveStream News | By Yahia Naim
                    </span>
                </div>

                <style>
                    {`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 30s linear infinite;
              }
            `}
                </style>
            </div>

            {/* Weather Detail Modal */}
            <WeatherDetailsModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                location={getCoords(selectedCountry || 'Morocco')}
            />
        </>
    );
}
