import { useState, useEffect, useRef } from 'react';
import Flag from './Flag';
import resolveIso2 from '@/lib/resolveIso';
import { Radio, Play, Pause, Volume2, VolumeX, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fetchAllRadioStations, reportStationClick, type RadioStation } from '@/lib/radioAPI';

interface RadioPlayerProps {
  onClose?: () => void;
}

export function RadioPlayer({ onClose }: RadioPlayerProps) {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousVolumeRef = useRef(0.7);

  // Load radio stations
  useEffect(() => {
    loadStations();
  }, []);

  async function loadStations() {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedStations = await fetchAllRadioStations();
      
      if (fetchedStations.length === 0) {
        setError('No stations available. Please try again later.');
      } else {
        setStations(fetchedStations);
        // Auto-select first station
        setSelectedStation(fetchedStations[0]);
      }
    } catch (err) {
      console.error('Error loading radio stations:', err);
      setError('Failed to load radio stations.');
    } finally {
      setIsLoading(false);
    }
  }

  // Update audio element when station changes
  useEffect(() => {
    if (audioRef.current && selectedStation) {
      audioRef.current.src = selectedStation.url_resolved;
      audioRef.current.volume = volume;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [selectedStation, isPlaying, volume]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    if (!audioRef.current || !selectedStation) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Report click to RadioBrowser for statistics
      reportStationClick(selectedStation.stationuuid);
      
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play station. Try another station.');
      });
      setIsPlaying(true);
    }
  };

  const handleStationChange = (stationUuid: string) => {
    const station = stations.find(s => s.stationuuid === stationUuid);
    if (station) {
      setSelectedStation(station);
      setError(null);
      // If currently playing, the new station will auto-play via useEffect
    }
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-3 bg-bg-surface border border-accent-primary/30 rounded-lg shadow-teal-glow hover:bg-bg-elevated transition-colors"
        >
          <Radio className="w-5 h-5 text-accent-primary" />
                  {isPlaying && (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-live-indicator rounded-full animate-pulse-slow" />
                    {(() => {
                      const resolved = resolveIso2(selectedStation?.countrycode, selectedStation?.country);
                      try {
                        console.debug('RadioFlag resolve:', { station: selectedStation?.name, country: selectedStation?.country, countrycode: selectedStation?.countrycode, resolved });
                      } catch (err) { console.debug('RadioFlag log failed', err); }
                      const isMorocco = resolved === 'ma';
                      return (
                        <>
                          <Flag iso2={resolved} className="w-4 h-3" />
                          <span className="text-sm text-text-primary font-medium">
                            {isMorocco ? '🇲🇦 ' : ''}{selectedStation?.name || 'Radio'}
                          </span>
                        </>
                      );
                    })()}
                </div>
              )}
          <ChevronUp className="w-4 h-4 text-text-secondary" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-surface border-t border-accent-primary/20 shadow-teal-glow">
      <audio ref={audioRef} preload="none" />
      
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Radio Icon & Station Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Radio className="w-5 h-5 text-accent-primary flex-shrink-0" />
            
            {isLoading ? (
              <div className="text-sm text-text-tertiary">Loading stations...</div>
            ) : error ? (
              <div className="text-sm text-sentiment-negative">{error}</div>
            ) : (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Station Selector */}
                    <div className="flex items-center gap-2">
                      {(() => {
                        const resolved = resolveIso2(selectedStation?.countrycode, selectedStation?.country);
                        const isMorocco = resolved === 'ma';
                        return resolved ? (
                          <Flag iso2={resolved} className="w-4 h-3" />
                        ) : (
                          // fallback to emoji when no iso available
                          <Flag iso2={resolved} className="w-4 h-3" />
                        );
                      })()}
                      <select
                        value={selectedStation?.stationuuid || ''}
                        onChange={(e) => handleStationChange(e.target.value)}
                        className="bg-bg-elevated border border-accent-primary/20 rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary/40 min-w-[200px] max-w-[300px]"
                        disabled={isLoading}
                      >
                  {stations.map(station => {
                    const sIso = resolveIso2(station.countrycode, station.country);
                    const prefix = sIso === 'ma' ? '🇲🇦 ' : '';
                    return (
                      <option key={station.stationuuid} value={station.stationuuid}>
                        {prefix}{station.name} {station.country && `(${station.country})`}
                      </option>
                    );
                  })}
                      </select>
                    </div>

                {/* Now Playing Info */}
                {isPlaying && selectedStation && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 bg-live-indicator rounded-full animate-pulse-slow flex-shrink-0" />
                    <span className="text-xs text-text-tertiary truncate">
                      {selectedStation.tags || 'Now Playing'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Play/Pause Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              disabled={!selectedStation || isLoading}
              className={`p-2 rounded-full transition-all ${
                isPlaying
                  ? 'bg-accent-primary text-bg-base hover:bg-accent-primary/80'
                  : 'bg-bg-elevated text-accent-primary hover:bg-accent-primary/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Right: Volume & Controls */}
          <div className="flex items-center gap-3">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVolumeToggle}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-bg-elevated rounded-full appearance-none cursor-pointer accent-accent-primary"
              />
              
              <span className="text-xs text-text-tertiary w-8 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>

            {/* Minimize/Close Buttons */}
            <div className="flex items-center gap-1 pl-2 border-l border-accent-primary/20">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-secondary hover:text-sentiment-negative transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
