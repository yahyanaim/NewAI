import { X, AlertCircle, Rss } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NewNewsNotificationProps {
  newsCount: number;
  latestHeadline: string;
  country?: string;
  onDismiss: () => void;
}

export function NewNewsNotification({ newsCount, latestHeadline, country, onDismiss }: NewNewsNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="notification-banner fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="bg-gradient-to-r from-accent-primary to-accent-secondary shadow-2xl rounded-xl border border-accent-primary/50 overflow-hidden">
        {/* Alert stripe */}
        <div className="h-1 bg-gradient-to-r from-white/80 via-white/40 to-white/80 animate-pulse" />

        <div className="p-4 flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Rss className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-white" />
              <h3 className="text-lg font-bold text-white">
                {country && country !== 'Global News' ? `New ${country} News Alert` : 'Global News Alert'}
              </h3>
            </div>
            <p className="text-white/90 font-medium mb-2">
              {newsCount} {newsCount === 1 ? 'article' : 'articles'} just arrived
            </p>
            <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">
              {latestHeadline}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors group"
            aria-label="Dismiss notification"
          >
            <X className="w-5 h-5 text-white/80 group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
