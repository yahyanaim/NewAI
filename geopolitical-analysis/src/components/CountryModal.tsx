import { useEffect, useState } from 'react';
import { X, MapPin, Users, TrendingUp, Calendar, Download, FileText } from 'lucide-react';
import type { Country, ConflictEvent } from '@/types';
import { fetchCountryDetails, fetchCountryConflictEvents } from '@/lib/api';
import { downloadCountryReport } from '@/lib/pdf-generator';

interface CountryModalProps {
  countryCode: string | null;
  onClose: () => void;
}

export function CountryModal({ countryCode, onClose }: CountryModalProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [events, setEvents] = useState<ConflictEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!countryCode) return;

    loadCountryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  async function handleDownloadReport() {
    if (!country) return;
    
    try {
      setDownloadingPDF(true);
      await downloadCountryReport(countryCode, country.name);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  }

  async function loadCountryData() {
    if (!countryCode) return;

    setIsLoading(true);
    try {
      const [countryData, eventsData] = await Promise.all([
        fetchCountryDetails(countryCode),
        fetchCountryConflictEvents(countryCode),
      ]);

      setCountry(countryData);
      setEvents(eventsData);
      console.debug('CountryModal loaded countryData', countryData?.flag);
    } catch (error) {
      console.error('Error loading country data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!countryCode) return null;

  // Mock timeline data
  const timelineData = [
    { month: 'Apr', events: 45 },
    { month: 'May', events: 62 },
    { month: 'Jun', events: 58 },
    { month: 'Jul', events: 71 },
    { month: 'Aug', events: 83 },
    { month: 'Sep', events: 76 },
    { month: 'Oct', events: 92 },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-[600px] h-full bg-bg-elevated shadow-float depth-floating transform-3d overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideInRight 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div className="h-full overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">Loading country data...</div>
            </div>
          ) : country ? (
            <>
              {/* Header */}
              <div className="relative p-space-6 border-b border-white/10">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleDownloadReport}
                    disabled={downloadingPDF}
                    className="p-2 rounded-lg bg-bg-surface/50 hover:bg-accent-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download PDF Report"
                  >
                    {downloadingPDF ? (
                      <FileText className="w-6 h-6 text-accent-primary animate-pulse" />
                    ) : (
                      <Download className="w-6 h-6 text-accent-primary" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg bg-bg-surface/50 hover:bg-bg-surface transition-colors"
                  >
                    <X className="w-6 h-6 text-text-secondary" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {country.flag && country.flag.toString().startsWith('http') && !imageError ? (
                    <img
                      src={country.flag}
                      alt={country.name}
                      className="w-16 h-12 object-cover rounded-md shadow-mid"
                      onError={() => {
                        console.warn('Flag image failed to load, falling back to emoji');
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <div className="w-16 h-12 flex items-center justify-center text-2xl rounded-md shadow-mid bg-bg-surface">
                      <span aria-hidden>{country.flag}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-heading-lg font-semibold text-text-primary">
                      {country.name}
                    </h2>
                    <p className="text-body text-text-secondary">
                      {country.region}
                    </p>
                  </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <div className="text-body-sm text-text-tertiary">Capital</div>
                    <div className="text-body text-text-primary font-medium">
                      {country.capital || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-body-sm text-text-tertiary">Population</div>
                    <div className="text-body text-text-primary font-medium">
                      {country.population.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-body-sm text-text-tertiary">Area</div>
                    <div className="text-body text-text-primary font-medium">
                      {country.area.toLocaleString()} km²
                    </div>
                  </div>
                  <div>
                    <div className="text-body-sm text-text-tertiary">ISO Code</div>
                    <div className="text-body text-text-primary font-medium">
                      {country.iso3}
                    </div>
                  </div>
                </div>
              </div>

              {/* Conflict Timeline Chart */}
              <div className="p-space-6 border-b border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-accent-primary" />
                  <h3 className="text-heading-md font-semibold">Conflict Activity Timeline</h3>
                </div>
                <div className="h-[300px] bg-bg-surface rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {timelineData.map((data, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-body-sm text-text-tertiary mb-1">{data.month}</div>
                          <div 
                            className="bg-accent-primary rounded-t-md mx-auto" 
                            style={{ 
                              width: '40px', 
                              height: `${(data.events / 100) * 150}px`,
                              minHeight: '20px'
                            }}
                          />
                          <div className="text-caption text-text-secondary mt-1">{data.events}</div>
                        </div>
                      ))}
                    </div>
                    <p className="text-body-sm text-text-tertiary">
                      Monthly conflict event count trend
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Events */}
              <div className="p-space-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                  <h3 className="text-heading-md font-semibold">Recent Events</h3>
                </div>
                <div className="space-y-3">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-text-secondary">Country not found</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

interface EventCardProps {
  event: ConflictEvent;
}

function EventCard({ event }: EventCardProps) {
  const intensityColors = {
    low: 'bg-conflict-low',
    medium: 'bg-conflict-medium',
    high: 'bg-conflict-high',
    critical: 'bg-conflict-critical',
  };

  return (
    <div className="bg-bg-surface rounded-md p-4 border border-white/5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${intensityColors[event.intensity]}`} />
          <span className="text-body font-medium text-text-primary">{event.eventType}</span>
        </div>
        <span className="text-body-sm text-text-tertiary">
          {new Date(event.date).toLocaleDateString()}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-2">
        <MapPin className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
        <span className="text-body-sm text-text-secondary">{event.location}</span>
      </div>

      <p className="text-body-sm text-text-secondary mb-3">
        {event.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
          <Users className="w-4 h-4" />
          <span>{event.actors.join(', ')}</span>
        </div>
        {event.fatalities > 0 && (
          <span className="text-body-sm text-conflict-high font-medium">
            {event.fatalities} fatalities
          </span>
        )}
      </div>
    </div>
  );
}
