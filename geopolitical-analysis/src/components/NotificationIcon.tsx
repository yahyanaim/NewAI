import { Bell } from 'lucide-react';

interface NotificationIconProps {
  count: number;
  onClick: () => void;
}

export function NotificationIcon({ count, onClick }: NotificationIconProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 bg-bg-surface border border-accent-primary/30 rounded-full hover:bg-accent-primary/20 transition-all duration-200 hover:scale-110 group"
      title={`${count} new articles`}
    >
      {/* Bell Icon */}
      <Bell className={`w-5 h-5 text-accent-primary ${count > 0 ? 'animate-icon-pulse' : ''}`} />
      
      {/* Badge Counter */}
      {count > 0 && (
        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-sentiment-negative rounded-full border-2 border-bg-base animate-badge-pop">
          <span className="text-xs font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        </div>
      )}
      
      {/* Tooltip on hover */}
      <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-bg-elevated border border-accent-primary/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        <span className="text-xs text-text-primary">
          {count === 0 ? 'No new articles' : `${count} new ${count === 1 ? 'article' : 'articles'}`}
        </span>
      </div>
    </button>
  );
}
