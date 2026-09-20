import { useState, useEffect } from 'react';
import { Wifi } from 'lucide-react';
import type { IntelEvent } from '@/types';

interface FlashUpdatesHeaderProps {
  intelEvents: IntelEvent[];
}

export function FlashUpdatesHeader({ intelEvents }: FlashUpdatesHeaderProps) {
  const [flashUpdates, setFlashUpdates] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Generate flash updates from high-priority and negative events
    const updates = intelEvents
      .filter(e => e.priority === 'high' || e.sentiment === 'negative')
      .slice(0, 8)
      .map(e => {
        const prefix = e.priority === 'high' && e.sentiment === 'negative' ? 'BREAKING: ' : '';
        return `${prefix}${e.headline}`;
      });

    // Ensure we have at least some updates
    if (updates.length === 0) {
      setFlashUpdates([
        'BREAKING: Global Intelligence Platform Monitoring Geopolitical Events',
        'UN Security Council Addresses Regional Security Concerns',
        'International Observers Report on Conflict Zone Developments',
      ]);
    } else {
      setFlashUpdates(updates);
    }
  }, [intelEvents]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-bg-base border-b border-accent-primary/20">
      <div className="flex items-center h-16 px-4">
        {/* Logo/Brand removed per request; keep placeholder margin to preserve layout */}
        <div className="min-w-[150px] mr-3" aria-hidden />

        {/* Flash Updates - Scrolling Marquee */}
        <div
          className="flex-1 mx-4 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-center gap-4 text-sm text-text-primary">
            <div className="flex items-center gap-2 px-3 py-1 bg-sentiment-negative/20 rounded-full border border-sentiment-negative/30 ml-2 md:ml-4">
              <span className="text-sentiment-negative font-semibold">FLASH UPDATES</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div
                className={`whitespace-nowrap ${!isPaused ? 'animate-marquee' : ''}`}
                style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
              >
                {flashUpdates.map((update, index) => (
                  <span key={index} className="inline-block mr-12">
                    {update}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 min-w-[150px] justify-end">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Wifi className="w-5 h-5 text-live-indicator" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-live-indicator rounded-full animate-ping-slow" />
            </div>
            <span className="text-live-indicator text-sm font-semibold">LIVE</span>
          </div>
          <div className="text-text-tertiary text-xs">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
