import { Globe2, Activity } from 'lucide-react';
import type { GlobalMetrics } from '@/types';

interface NavigationProps {
  metrics: GlobalMetrics;
}

export function Navigation({ metrics }: NavigationProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[72px] glass-panel border-b border-white/10">
      <div className="h-full px-3 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 md:gap-3">
          <Globe2 className="w-8 h-8 md:w-10 md:h-10 text-accent-primary" />
          <div className="hidden sm:block">
            <h1 className="text-lg md:text-xl font-semibold text-text-primary">
              Geopolitical Analysis
            </h1>
            <p className="text-caption text-text-tertiary hidden md:block">
              Real-time Global Conflict Monitoring
            </p>
          </div>
          <h1 className="text-base font-semibold text-text-primary sm:hidden">
            GeoAnalysis
          </h1>
        </div>

        {/* Global Metrics */}
        <div className="flex items-center gap-2 md:gap-8">
          <div className="flex items-center gap-1 md:gap-2">
            <Activity className="w-4 h-4 md:w-5 md:h-5 text-conflict-high" />
            <div>
              <div className="text-caption md:text-body-sm text-text-secondary hidden md:block">Active Conflicts</div>
              <div className="text-sm md:text-heading-md font-semibold text-text-primary">
                {metrics.activeConflicts}
              </div>
            </div>
          </div>
          
          <div className="h-6 md:h-8 w-px bg-white/10" />
          
          <div className="flex items-center gap-1 md:gap-2">
            <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
            <div>
              <div className="text-caption md:text-body-sm text-text-secondary hidden md:block">Total Events</div>
              <div className="text-sm md:text-heading-md font-semibold text-text-primary">
                {metrics.totalEvents.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div className="h-6 md:h-8 w-px bg-white/10 hidden sm:block" />
          
          <div className="hidden sm:block">
            <div className="text-caption md:text-body-sm text-text-secondary">Last Update</div>
            <div className="text-xs md:text-body text-text-primary">
              {formatTime(metrics.lastUpdate)}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
