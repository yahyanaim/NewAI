import { useEffect, useState } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import type { NewsArticle } from '@/types';
import { fetchNews } from '@/lib/api';

interface NewsSidebarProps {
  selectedCountry?: string;
}

export function NewsSidebar({ selectedCountry }: NewsSidebarProps) {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadNews();
    
    // Poll for updates every 2 minutes
    const interval = setInterval(() => {
      loadNews();
    }, 120000);

    return () => clearInterval(interval);
  }, [selectedCountry]);

  async function loadNews() {
    setIsLoading(true);
    try {
      const articles = await fetchNews(selectedCountry);
      setNews(articles);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredNews = filter === 'all' 
    ? news 
    : news.filter(article => article.category === filter);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'conflict', label: 'Conflict' },
    { id: 'diplomacy', label: 'Diplomacy' },
    { id: 'sanctions', label: 'Sanctions' },
  ];

  return (
    <div className="md:fixed md:right-0 md:top-[72px] md:w-[400px] md:h-[calc(100vh-72px)] w-full h-full glass-panel md:border-l border-white/10 depth-elevated transform-3d">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-space-3 md:p-space-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
              <h2 className="text-lg md:text-heading-md font-semibold">Live News</h2>
            </div>
            <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse" />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-caption md:text-body-sm transition-all duration-200 ${
                  filter === cat.id
                    ? 'bg-accent-secondary text-white'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* News list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-space-2 md:p-space-3 space-y-space-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-text-secondary text-sm md:text-base">Loading news...</div>
            </div>
          ) : (
            filteredNews.map(article => (
              <NewsCard key={article.id} article={article} formatTime={formatTime} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface NewsCardProps {
  article: NewsArticle;
  formatTime: (isoString: string) => string;
}

function NewsCard({ article, formatTime }: NewsCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const categoryColors: Record<string, string> = {
    conflict: 'bg-conflict-high',
    diplomacy: 'bg-accent-primary',
    sanctions: 'bg-conflict-medium',
  };

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`bg-bg-elevated border border-white/8 rounded-md p-space-3 transition-all duration-400 perspective-800 transform-3d ${
          isHovered ? 'shadow-near' : 'shadow-mid'
        }`}
        style={{
          transform: isHovered 
            ? 'rotateY(2deg) rotateX(1deg) translateZ(20px)' 
            : 'translateZ(0)',
        }}
      >
        {/* Source and time */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption text-text-tertiary">{article.source}</span>
          <div className="flex items-center gap-1 text-caption text-text-tertiary">
            <Clock className="w-3 h-3" />
            {formatTime(article.publishedAt)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-heading-md text-text-primary mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && (
          <p className="text-body-sm text-text-secondary mb-3 line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Category tag and link */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 rounded-full text-caption text-white ${categoryColors[article.category] || 'bg-bg-base'}`}>
            {article.category}
          </span>
          <ExternalLink className="w-4 h-4 text-text-tertiary" />
        </div>
      </div>
    </a>
  );
}
