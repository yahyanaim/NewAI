import { useState, useEffect } from 'react';
import { X, Cloud, Sun, CloudRain, Wind, Thermometer, Calendar, Droplets, MapPin, Eye, Gauge, Sunrise, Sunset, Navigation, XCircle } from 'lucide-react';

interface WeatherDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: {
        lat: number;
        lng: number;
        name: string;
    };
}

interface DailyForecast {
    date: string;
    dayName: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    code: number;
    sunrise: string;
    sunset: string;
    uvIndex: number;
    rainProb?: number;
}

export function WeatherDetailsModal({ isOpen, onClose, location }: WeatherDetailsModalProps) {
    const [forecast, setForecast] = useState<DailyForecast[]>([]);
    const [currentDetails, setCurrentDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isOpen && location) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    // Fetch comprehensive weather data
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
                    );
                    const data = await response.json();

                    // Format Times
                    const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    setCurrentDetails({
                        temp: data.current.temperature_2m,
                        feelsLike: data.current.apparent_temperature,
                        humidity: data.current.relative_humidity_2m,
                        wind: data.current.wind_speed_10m,
                        windDir: getWindDirection(data.current.wind_direction_10m),
                        precip: data.current.precipitation,
                        condition: data.current.weather_code,
                        pressure: data.current.surface_pressure,
                        visibility: (data.current.visibility / 1000).toFixed(1), // Convert m to km
                        isDay: data.current.is_day,
                        sunrise: formatTime(data.daily.sunrise[0]),
                        sunset: formatTime(data.daily.sunset[0]),
                        uvIndex: data.daily.uv_index_max[0]
                    });

                    // Map daily forecast
                    const daily = data.daily.time.map((date: string, index: number) => ({
                        date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
                        shortDay: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                        tempMax: data.daily.temperature_2m_max[index],
                        tempMin: data.daily.temperature_2m_min[index],
                        code: data.daily.weather_code[index],
                        condition: getConditionLabel(data.daily.weather_code[index]),
                        sunrise: formatTime(data.daily.sunrise[index]),
                        sunset: formatTime(data.daily.sunset[index]),
                        uvIndex: data.daily.uv_index_max[index],
                        rainProb: data.daily.precipitation_probability_max?.[index] || 0
                    }));

                    // Take next 5 days for the bottom forecast
                    setForecast(daily.slice(0, 5));
                } catch (error) {
                    console.error('Failed to fetch weather details:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchDetails();
        }
    }, [isOpen, location]);

    if (!isOpen) return null;

    const getConditionLabel = (code: number) => {
        if (code <= 3) return 'Clear';
        if (code <= 48) return 'Foggy';
        if (code <= 67) return 'Rainy';
        if (code <= 77) return 'Snowy';
        if (code >= 95) return 'Stormy';
        return 'Cloudy';
    };

    const getWindDirection = (degrees: number) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(degrees / 45) % 8];
    };

    const getWeatherIcon = (code: number, className = "w-6 h-6") => {
        if (code <= 3) return <Sun className={`${className} text-yellow-300 drop-shadow-lg`} />;
        if (code <= 67) return <CloudRain className={`${className} text-blue-200 drop-shadow-md`} />;
        if (code >= 95) return <Wind className={`${className} text-gray-300 drop-shadow-md`} />;
        if (code > 70 && code <= 77) return <Cloud className={`${className} text-white drop-shadow-lg`} />;
        return <Cloud className={`${className} text-blue-100 drop-shadow-md`} />;
    };

    // Large icon for main display
    const getMainWeatherIcon = (code: number) => {
        const className = "w-32 h-32 drop-shadow-2xl filter";
        if (code <= 3) return <Sun className={`${className} text-yellow-400`} />;
        if (code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
        if (code >= 95) return <Wind className={`${className} text-gray-400`} />;
        return <Cloud className={`${className} text-blue-200`} />;
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
            {/* Main Container - Glassmorphism Blue Style */}
            <div className="w-full max-w-5xl bg-gradient-to-br from-[#4A8DB7]/90 to-[#2C5F85]/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative flex flex-col p-6 md:p-8">

                {loading ? (
                    <div className="flex-1 flex items-center justify-center min-h-[400px]">
                        <div className="flex flex-col items-center gap-4 text-white">
                            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="animate-pulse tracking-widest text-sm font-medium">LOADING WEATHER DATA...</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 h-full text-white">

                        {/* TOP ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

                            {/* TOP LEFT: Local Weather Report (Current) */}
                            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                                {/* Header Line */}
                                <div className="flex items-start justify-between border-b border-white/20 pb-4 mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold tracking-widest uppercase opacity-80 mb-1">Local Weather Report</h3>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-yellow-300" />
                                            {/* CITY NAME - CLEAR BOLD FONT */}
                                            <span className="text-xl font-bold uppercase tracking-wider text-white drop-shadow-md">{location.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* CLOCK - CLEAR MONO FONT */}
                                        <div className="text-3xl font-mono font-bold text-white drop-shadow-md">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-xs opacity-70 uppercase tracking-widest">{currentTime.toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center flex-1 justify-center relative z-10">
                                    {/* Main Icon */}
                                    <div className="mb-4 transform hover:scale-105 transition-transform duration-500">
                                        {getMainWeatherIcon(currentDetails?.condition)}
                                    </div>

                                    <div className="text-center">
                                        <h2 className="text-3xl font-bold uppercase tracking-wide mb-1 shadow-black/10 drop-shadow-md">
                                            {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                        </h2>
                                        <p className="text-lg font-medium opacity-90 uppercase tracking-widest mb-6">
                                            {getConditionLabel(currentDetails?.condition)}
                                        </p>
                                    </div>

                                    <div className="flex items-end gap-4 mt-auto">
                                        <div className="text-6xl font-bold leading-none tracking-tight drop-shadow-lg">
                                            {Math.round(currentDetails?.temp)}°C
                                        </div>
                                        <div className="text-2xl font-medium opacity-70 mb-2">
                                            / {Math.round(currentDetails?.temp * 9 / 5 + 32)}°F
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-6 text-sm font-medium opacity-90">
                                    <Navigation className="w-4 h-4" />
                                    <span>{currentDetails?.wind} km/h {currentDetails?.windDir}</span>
                                </div>
                            </div>

                            {/* TOP RIGHT: Detailed Forecast Report (Metrics List) */}
                            <div className="bg-white/10 border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[300px]">
                                <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-2">
                                    <h3 className="text-sm font-bold tracking-widest uppercase opacity-80">Detailed Forecast Report</h3>
                                </div>

                                <div className="flex-1 flex flex-col justify-center space-y-3 font-mono text-sm tracking-wide">
                                    {/* Metrics Rows */}
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Thermometer className="w-3 h-3" /> Feels Like</span>
                                        <span className="font-bold text-lg">{currentDetails?.feelsLike}°C</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Droplets className="w-3 h-3" /> Humidity</span>
                                        <span className="font-bold text-lg">{currentDetails?.humidity}%</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Sun className="w-3 h-3" /> UV Index</span>
                                        <span className="font-bold text-lg">{currentDetails?.uvIndex}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Eye className="w-3 h-3" /> Visibility</span>
                                        <span className="font-bold text-lg">{currentDetails?.visibility} km</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Gauge className="w-3 h-3" /> Pressure</span>
                                        <span className="font-bold text-lg">{currentDetails?.pressure} hPa</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><CloudRain className="w-3 h-3" /> Precipitation</span>
                                        <span className="font-bold text-lg">{currentDetails?.precip} mm</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-1">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Sunrise className="w-3 h-3" /> Sunrise</span>
                                        <span className="font-bold text-lg">{currentDetails?.sunrise}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="uppercase opacity-70 flex items-center gap-2"><Sunset className="w-3 h-3" /> Sunset</span>
                                        <span className="font-bold text-lg">{currentDetails?.sunset}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM ROW: 5-Day Forecast Columns */}
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 divide-x divide-white/10">
                                {forecast.map((day, idx) => (
                                    <div key={idx} className={`flex flex-col items-center text-center ${idx > 1 ? 'hidden md:flex' : 'flex'}`}>
                                        <span className="text-sm font-bold uppercase tracking-widest mb-1 opacity-90">
                                            {day.dayName.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider mb-4 opacity-60">
                                            {day.date}
                                        </span>

                                        <div className="mb-4 transform hover:scale-110 transition-transform">
                                            {getWeatherIcon(day.code, "w-12 h-12")}
                                        </div>

                                        <div className="mt-auto">
                                            <div className="text-xl font-bold mb-1">
                                                {Math.round(day.tempMax)}°C
                                            </div>
                                            <div className="text-sm opacity-70 font-medium">
                                                {Math.round(day.tempMax * 9 / 5 + 32)}°F
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs font-medium text-blue-200 bg-blue-500/20 px-2 py-0.5 rounded-full">
                                            {day.rainProb}% Rain
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Info & Close Button */}
                        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] opacity-50 uppercase tracking-widest px-2 gap-4">
                            <div className="flex items-center gap-4">
                                <span>{location.name} • Live Data</span>
                                <span>Updated: {new Date().toLocaleTimeString()}</span>
                            </div>

                            {/* BOTTOM CLOSE BUTTON */}
                            <button
                                onClick={onClose}
                                className="px-8 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold transition-all flex items-center gap-2 hover:gap-3"
                            >
                                Close Modal <XCircle className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
