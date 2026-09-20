import { useState, useEffect, useRef } from 'react';
import { Activity, Clock, Search, Zap, History, AlertCircle, Pin, PinOff, Bell, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFavorites } from '@/contexts/FavoritesContext';
import { StarRating } from './StarRating';
import Flag from './Flag';
import type { IntelEvent } from '@/types';

interface LiveSignalsFeedProps {
  intelEvents: IntelEvent[];
  historicalEvents: IntelEvent[];
  onEventSelect: (event: IntelEvent) => void;
  selectedEventId?: string;
  newArticleIds?: Set<string>;
  pinnedIds?: Set<string>;
  onPin?: (eventId: string) => void;
  onUnpin?: (eventId: string) => void;
  newNewsCount?: number;
  favoritedIds?: Set<string>;
  onToggleFavorite?: (event: IntelEvent) => Promise<void> | void;
}

export function LiveSignalsFeed({ intelEvents, historicalEvents, onEventSelect, selectedEventId, newArticleIds = new Set(), pinnedIds = new Set(), onPin, onUnpin, newNewsCount = 0, favoritedIds = new Set(), onToggleFavorite }: LiveSignalsFeedProps) {
  const { favorites, setRating } = useFavorites();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  const [pingedItems, setPingedItems] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [filter, setFilter] = useState<{
    sentiment: 'all' | 'positive' | 'negative' | 'neutral';
    priority: 'all' | 'high' | 'normal' | 'low';
    search: string;
  }>({
    sentiment: 'all',
    priority: 'all',
    search: '',
  });
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Common search suggestions
  const searchSuggestions = [
    'political', 'pol', 'government', 'election',
    'military', 'mil', 'army', 'defense', 'war',
    'economic', 'eco', 'economy', 'business', 'finance',
    'diplomatic', 'dip', 'international', 'relations',
    'sports', 'sport', 'football', 'basketball',
    'technology', 'tech', 'innovation', 'ai',
    'health', 'medical', 'covid',
    'culture', 'art', 'entertainment',
    // Conflict-specific search terms
    'ukraine', 'russia', 'putin', 'zelensky', 'kyiv', 'moscow',
    'palestine', 'israel', 'gaza', 'hamas', 'netanyahu',
    'war', 'conflict', 'invasion', 'attack', 'bombing', 'ceasefire'
  ];

  // Conflict detection function
  const isConflictNews = (event: IntelEvent) => {
    const conflictKeywords = [
      // Ukraine-Russia War
      'ukraine', 'russia', 'ukrainian', 'russian', 'putin', 'zelensky', 'kyiv', 'moscow',
      'donetsk', 'luhansk', 'crimea', 'kursk', 'kherson', 'mariupol', 'severodonetsk',

      // Palestine-Israel Conflict
      'palestine', 'israel', 'palestinian', 'israeli', 'gaza', 'west bank', 'hamas', 'hezbollah',
      'tel aviv', 'jerusalem', 'ramallah', 'netanya', 'rafah', 'bethlehem', 'nablus',

      // General conflict terms
      'war', 'conflict', 'invasion', 'attack', 'bombing', 'strike', 'offensive', 'counteroffensive',
      'ceasefire', 'peace talks', 'hostilities', 'military operation', 'armed', 'violence'
    ];

    const searchText = [
      event.headline.toLowerCase(),
      event.description.toLowerCase(),
      event.location.country.toLowerCase(),
      event.location.region.toLowerCase(),
      ...event.actors.map(actor => actor.toLowerCase()),
      ...event.regions.map(region => region.toLowerCase())
    ].join(' ');

    return conflictKeywords.some(keyword => searchText.includes(keyword));
  };
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update timestamp when events change
  useEffect(() => {
    setLastUpdate(new Date());
    setIsUpdating(true);
    const timer = setTimeout(() => setIsUpdating(false), 500);
    return () => clearTimeout(timer);
  }, [intelEvents]);

  // Update current time every second for accurate article age calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle ping action
  const handlePing = (eventId: string) => {
    setPingedItems(prev => new Set(prev).add(eventId));
    // Remove ping state after animation completes
    setTimeout(() => {
      setPingedItems(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }, 600);
  };

  // Calculate article age in seconds
  const getArticleAgeInSeconds = (timestamp: Date): number => {
    return Math.floor((currentTime.getTime() - timestamp.getTime()) / 1000);
  };

  // Parse search text to extract news type and other keywords
  const parseSearchQuery = (searchText: string) => {
    const normalizedText = searchText.toLowerCase().trim();

    // Comprehensive keyword mapping with partial matching
    const keywordMappings = {
      // Political
      'political': 'political', 'politics': 'political', 'pol': 'political', 'gov': 'political', 'government': 'political', 'election': 'political', 'vote': 'political', 'parliament': 'political', 'congress': 'political', 'senate': 'political',
      // Military
      'military': 'military', 'army': 'military', 'defense': 'military', 'defence': 'military', 'war': 'military', 'conflict': 'military', 'soldier': 'military', 'combat': 'military', 'troops': 'military', 'mil': 'military',
      // Economic
      'economic': 'economic', 'economy': 'economic', 'business': 'economic', 'finance': 'economic', 'financial': 'economic', 'market': 'economic', 'trade': 'economic', 'company': 'economic', 'corporate': 'economic', 'money': 'economic', 'eco': 'economic', 'econ': 'economic', 'bank': 'economic',
      // Diplomatic
      'diplomatic': 'diplomatic', 'diplomacy': 'diplomatic', 'international': 'diplomatic', 'foreign': 'diplomatic', 'embassy': 'diplomatic', 'treaty': 'diplomatic', 'agreement': 'diplomatic', 'negotiation': 'diplomatic', 'relations': 'diplomatic', 'dip': 'diplomatic',
      // Sports
      'sports': 'sports', 'sport': 'sports', 'football': 'sports', 'basketball': 'sports', 'soccer': 'sports', 'tennis': 'sports', 'olympics': 'sports', 'championship': 'sports', 'tournament': 'sports', 'team': 'sports', 'player': 'sports', 'game': 'sports', 'match': 'sports',
      // Technology
      'technology': 'technology', 'tech': 'technology', 'innovation': 'technology', 'digital': 'technology', 'software': 'technology', 'computer': 'technology', 'internet': 'technology', 'ai': 'technology', 'artificial': 'technology', 'robot': 'technology', 'cyber': 'technology',
      // Health
      'health': 'health', 'medical': 'health', 'medicine': 'health', 'hospital': 'health', 'doctor': 'health', 'patient': 'health', 'disease': 'health', 'treatment': 'health', 'vaccine': 'health', 'covid': 'health', 'pandemic': 'health',
      // Culture
      'culture': 'culture', 'cultural': 'culture', 'entertainment': 'culture', 'art': 'culture', 'music': 'culture', 'movie': 'culture', 'film': 'culture', 'celebrity': 'culture', 'festival': 'culture', 'tradition': 'culture',
      // Conflict News
      'ukraine': 'military', 'russia': 'military', 'ukrainian': 'military', 'russian': 'military', 'putin': 'military', 'zelensky': 'military', 'kyiv': 'military', 'moscow': 'military', 'donetsk': 'military', 'luhansk': 'military', 'crimea': 'military',
      'palestine': 'military', 'israel': 'military', 'palestinian': 'military', 'israeli': 'military', 'gaza': 'military', 'hamas': 'military', 'hezbollah': 'military', 'netanyahu': 'military', 'jerusalem': 'military',
      'invasion': 'military', 'attack': 'military', 'bombing': 'military', 'strike': 'military', 'offensive': 'military', 'ceasefire': 'military', 'hostilities': 'military', 'violence': 'military'
    };

    // Find the first matching keyword (check for exact match first, then partial)
    let detectedType = null;
    let remainingText = normalizedText;

    // First try exact keyword matches
    for (const [keyword, category] of Object.entries(keywordMappings)) {
      if (normalizedText.includes(keyword)) {
        detectedType = category;
        // Remove the keyword from search text to allow additional filtering
        remainingText = remainingText.replace(keyword, '').trim();
        break;
      }
    }

    return { type: detectedType, text: remainingText };
  };

  const { type: detectedCategory, text: normalizedSearch } = parseSearchQuery(filter.search);

  const filteredEvents = intelEvents.filter(event => {
    const matchesSentiment = filter.sentiment === 'all' || event.sentiment === filter.sentiment;
    const matchesPriority = filter.priority === 'all' || event.priority === filter.priority;
    const matchesCategory = !detectedCategory || event.category === detectedCategory;
    const matchesSearch = normalizedSearch === '' || normalizedSearch.length === 0 ||
      event.headline.toLowerCase().includes(normalizedSearch) ||
      event.location.country.toLowerCase().includes(normalizedSearch) ||
      event.description.toLowerCase().includes(normalizedSearch);

    return matchesSentiment && matchesPriority && matchesCategory && matchesSearch;
  });

  // Sort events: pinned events first, then by recency
  // use [...array] to avoid mutating the original array reference if filteredEvents is cached
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Pinned events come first
    const aPinned = pinnedIds.has(a.id);
    const bPinned = pinnedIds.has(b.id);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    // Finally, sort by timestamp (newest first)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const formatTimestamp = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  return (
    <div className="w-full h-full bg-bg-surface border-r border-accent-primary/20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-accent-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold">Live Signals</h2>
            {isUpdating && (
              <div className="flex items-center gap-1 px-2 py-1 bg-accent-primary/20 rounded-full">
                <Zap className="w-3 h-3 text-accent-primary animate-pulse" />
                <span className="text-xs text-accent-primary font-medium">UPDATING</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Bell notification showing new news count */}
            {newNewsCount > 0 && (
              <div className="relative flex items-center gap-1.5 px-2.5 py-1 bg-accent-primary/20 border border-accent-primary/40 rounded-full">
                <Bell className="w-3.5 h-3.5 text-accent-primary animate-icon-pulse" />
                <span className="text-xs text-accent-primary font-bold">{newNewsCount}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-live-indicator rounded-full animate-pulse-slow" />
              <span className="text-live-indicator text-xs font-semibold">LIVE</span>
            </div>
          </div>
        </div>

        {/* Last Update Indicator & Event Count */}
        <div className="flex items-center justify-between text-xs text-text-tertiary mb-3">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span className="text-accent-primary font-medium">
            {detectedCategory ? `${filteredEvents.length} ${detectedCategory} events` : `${intelEvents.length} events`}
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search events... (try 'eco', 'pol', 'mil', 'sport', 'tech', etc.)"
            value={filter.search}
            onChange={(e) => {
              setFilter({ ...filter, search: e.target.value });
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => setShowSuggestions(filter.search.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full pl-10 pr-4 py-2 bg-bg-elevated border border-accent-primary/20 rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent-primary/40"
          />
          {/* Show detected category */}
          {detectedCategory && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="px-2 py-1 bg-accent-primary/20 text-accent-primary text-xs rounded-full">
                {detectedCategory}
              </span>
            </div>
          )}

          {/* Autocomplete Suggestions */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-bg-elevated border border-accent-primary/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {searchSuggestions
                .filter(suggestion =>
                  suggestion.toLowerCase().includes(filter.search.toLowerCase())
                )
                .slice(0, 8)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setFilter({ ...filter, search: suggestion });
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-accent-primary/10 first:rounded-t-lg last:rounded-b-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))
              }
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Sentiment Filter */}
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Sentiment
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterButton
              active={filter.sentiment === 'all'}
              onClick={() => setFilter({ ...filter, sentiment: 'all' })}
              small
            >
              All
            </FilterButton>
            <FilterButton
              active={filter.sentiment === 'positive'}
              onClick={() => setFilter({ ...filter, sentiment: 'positive' })}
              small
              color="green"
            >
              Positive
            </FilterButton>
            <FilterButton
              active={filter.sentiment === 'negative'}
              onClick={() => setFilter({ ...filter, sentiment: 'negative' })}
              small
              color="red"
            >
              Negative
            </FilterButton>
            <FilterButton
              active={filter.sentiment === 'neutral'}
              onClick={() => setFilter({ ...filter, sentiment: 'neutral' })}
              small
              color="orange"
            >
              Neutral
            </FilterButton>
          </div>

          {/* Priority Filter */}
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 mt-3">
            Priority
          </div>
          <div className="flex gap-2 flex-wrap">
            <FilterButton
              active={filter.priority === 'all'}
              onClick={() => setFilter({ ...filter, priority: 'all' })}
              small
            >
              All Priority
            </FilterButton>
            <FilterButton
              active={filter.priority === 'high'}
              onClick={() => setFilter({ ...filter, priority: 'high' })}
              small
              color="red"
            >
              High
            </FilterButton>
            <FilterButton
              active={filter.priority === 'normal'}
              onClick={() => setFilter({ ...filter, priority: 'normal' })}
              small
              color="blue"
            >
              Normal
            </FilterButton>
            <FilterButton
              active={filter.priority === 'low'}
              onClick={() => setFilter({ ...filter, priority: 'low' })}
              small
              color="gray"
            >
              Low
            </FilterButton>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
      >
        {sortedEvents.map((event, index) => {
          const ageInSeconds = getArticleAgeInSeconds(event.timestamp);
          const isUltraNew = ageInSeconds <= 10;
          const isTopNews = index < 3; // Top 3 articles get prominent ping buttons
          const eventIsConflict = isConflictNews(event);

          return (
            <EventCard
              key={event.id}
              event={event}
              isSelected={event.id === selectedEventId}
              onClick={() => onEventSelect(event)}
              formatTimestamp={formatTimestamp}
              isNew={newArticleIds.has(event.id)}
              isUltraNew={isUltraNew}
              isPinged={pingedItems.has(event.id)}
              onPing={() => handlePing(event.id)}
              isTopNews={isTopNews}
              isPinned={pinnedIds.has(event.id)}
              onPin={() => onPin?.(event.id)}
              onUnpin={() => onUnpin?.(event.id)}
              isConflictNews={eventIsConflict}
              isFavorited={favoritedIds.has(event.id)}
              onToggleFavorite={() => onToggleFavorite?.(event)}
              rating={favorites.find(f => f.event_id === event.id)?.rating}
              onRate={async (val) => {
                await setRating(event, val);
                toast.success('Rating updated', {
                  description: `Assigned ${val} stars to this report.`,
                  duration: 2000
                });
              }}
              delay={index * 50}
            />
          );
        })}
        {filteredEvents.length === 0 && (
          <div className="text-center text-text-tertiary py-8">
            No events match the current filters
          </div>
        )}

        {/* Historical News Section - Past 24 Hours */}
        {historicalEvents.length > 0 && (
          <div className="mt-6 border-t border-accent-primary/20 pt-4">
            <div className="flex items-center gap-2 mb-3 px-2">
              <History className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <Flag iso2="ma" className="w-4 h-3 inline-block" />
                <span>Moroccan News - Past 24 Hours ({historicalEvents.length})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {historicalEvents.slice(0, 20).map(event => (
                <HistoricalEventCard
                  key={event.id}
                  event={event}
                  isSelected={event.id === selectedEventId}
                  onClick={() => onEventSelect(event)}
                  formatTimestamp={formatTimestamp}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: 'green' | 'red' | 'orange' | 'gray' | 'blue';
  small?: boolean;
}

function FilterButton({ active, onClick, children, color, small }: FilterButtonProps) {
  const getColors = () => {
    if (!active) return 'bg-bg-elevated text-text-secondary hover:text-text-primary';

    switch (color) {
      case 'green': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'gray': return 'bg-text-tertiary/20 text-text-tertiary border-text-tertiary/30';
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-accent-primary/20 text-accent-primary border-accent-primary/30';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-3 ${small ? 'py-1' : 'py-1.5'} rounded-full text-caption transition-all duration-200 ${active ? 'border' : ''
        } ${getColors()}`}
    >
      {children}
    </button>
  );
}

interface EventCardProps {
  event: IntelEvent;
  isSelected: boolean;
  onClick: () => void;
  formatTimestamp: (date: Date) => string;
  isNew?: boolean;
  isUltraNew?: boolean;
  isPinged?: boolean;
  onPing?: () => void;
  isTopNews?: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  isConflictNews?: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: () => Promise<void> | void;
  rating?: number;
  onRate?: (rating: number) => Promise<void> | void;
  delay?: number;
}

function EventCard({
  event,
  isSelected,
  onClick,
  formatTimestamp,
  isNew = false,
  isUltraNew = false,
  isPinged = false,
  onPing,
  isTopNews = false,
  isPinned = false,
  onPin,
  onUnpin,
  isConflictNews = false,
  isFavorited = false,
  onToggleFavorite,
  rating,
  onRate,
  delay = 0
}: EventCardProps) {
  const getSentimentColor = () => {
    switch (event.sentiment) {
      case 'positive': return 'bg-sentiment-positive text-bg-base';
      case 'negative': return 'bg-sentiment-negative text-white';
      case 'neutral': return 'bg-sentiment-neutral text-bg-base';
    }
  };

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'high': return 'bg-sentiment-negative/20 text-sentiment-negative border-sentiment-negative/30';
      case 'normal': return 'bg-accent-primary/20 text-accent-primary border-accent-primary/30';
      case 'low': return 'bg-text-tertiary/20 text-text-tertiary border-text-tertiary/30';
    }
  };

  return (
    <div
      className="relative animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
      style={{ animationDelay: `${delay}ms` }}
    >
      <button
        onClick={onClick}
        className={`relative w-full text-left p-3 pl-16 rounded-xl transition-all duration-500 backdrop-blur-md active:scale-[0.96] active:brightness-125 hover:translate-x-1.5 group/card ${isSelected
          ? 'bg-accent-primary/20 border-2 border-accent-primary shadow-[0_0_20px_rgba(38,145,175,0.3)] ring-1 ring-accent-primary/20 scale-[1.01] z-10'
          : 'bg-bg-elevated/40 border border-accent-primary/20 hover:bg-bg-elevated/60 hover:border-accent-primary/40 hover:shadow-[0_0_12px_rgba(38,145,175,0.15)] shadow-sm'
          } ${isUltraNew
            ? '!border-2 !border-accent-primary/40 animate-ultra-new ring-1 ring-accent-primary/10'
            : isNew
              ? 'bg-gradient-to-r from-accent-primary/10 to-transparent !border-l-[6px] !border-l-accent-primary animate-border-pulse shadow-[0_0_12px_rgba(0,206,209,0.2)] ring-1 ring-accent-primary/10'
              : ''
          } ${isPinged
            ? 'ring-2 ring-accent-primary animate-ping-glow'
            : ''
          }`}
      >
        {/* Timestamp with priority and sentiment badges side by side */}
        <div className="flex items-center justify-between mb-2 pr-24">
          <div className="flex items-center gap-4 text-caption text-text-tertiary">
            <Clock className="w-3 h-3" />
            <span className="relative">
              {formatTimestamp(event.timestamp)}
            </span>
          </div>
          {/* Priority and Sentiment badges side by side (shift left ~30px) */}
          <div className="flex items-center gap-2">
            {/* Priority Badge */}
            <div className={`px-2 py-0.5 rounded border text-caption font-medium ${getPriorityColor()}`}>
              {event.priority.toUpperCase()}
            </div>
            {/* Sentiment Badge */}
            <div className={`px-2 py-0.5 rounded-full text-caption font-semibold ${getSentimentColor()}`}>
              {event.sentiment.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2">
          {event.headline}
        </h3>

        {/* Conflict News Badge */}
        {isConflictNews && (
          <div className="mb-2">
            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-semibold rounded border border-red-500/30 flex items-center gap-1 w-fit">
              ⚠️ CONFLICT ZONE
            </span>
          </div>
        )}

        {/* Location with Flag */}
        <div className="pr-24">
          <span className="text-caption text-text-tertiary flex items-center gap-2 font-medium">
            {event.location.country.toLowerCase() === 'morocco' ? (
              <>
                <Flag iso2="ma" className="w-4 h-3 inline-block shadow-sm" />
                <span className="tracking-wide">Morocco</span>
              </>
            ) : (
              <span className="tracking-wide">{event.location.country}</span>
            )}
          </span>
        </div>

        {/* Source with Moroccan News Badge & Rating */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-caption text-text-tertiary">{event.source}</span>
            {event.id.startsWith('moroccan-news-') && (
              <span className="px-1.5 py-0.5 bg-accent-secondary/20 text-accent-secondary text-[10px] font-semibold rounded border border-accent-secondary/30">
                MOROCCAN NEWS
              </span>
            )}
            {event.id.startsWith('global-news-') && (
              <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded border border-blue-500/30">
                GLOBAL NEWS
              </span>
            )}
          </div>

          <StarRating rating={rating} onRate={onRate} size={12} />
        </div>
      </button>

      {/* Ping Button - Prominent for Top News with proper spacing from timestamp */}
      {onPing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPing();
          }}
          className={`absolute top-2.5 left-4 z-10 transition-all duration-200 hover:scale-110 ${isTopNews
            ? 'p-2 bg-sentiment-negative hover:bg-sentiment-negative/80 border-2 border-white rounded-full animate-top-ping shadow-lg'
            : 'p-1.5 bg-bg-elevated/90 hover:bg-accent-primary/20 border border-accent-primary/30 rounded-full'
            }`}
          title={isTopNews ? 'Top News - Click to highlight' : 'Highlight this event'}
        >
          <AlertCircle className={`${isTopNews ? 'w-4 h-4 text-white' : 'w-3.5 h-3.5 text-accent-primary'
            }`} />
        </button>
      )}

      {/* Share Button - Added beside Pin button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          const shareData = {
            title: event.headline,
            text: `${event.headline}\n\n${event.description}\n\nRead more on our platform.`,
            url: window.location.href
          };

          try {
            if (navigator.share) {
              await navigator.share(shareData);
            } else {
              await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`);
              // We might want to show a toast here if we had access to it, 
              // but for now visual feedback on button might be enough or we assume user knows.
              // Actually, let's just log for now as simple feedback.
              console.log('Copied to clipboard');
            }
          } catch (err) {
            console.error('Error sharing:', err);
          }
        }}
        className="absolute top-2.5 z-10 p-1.5 border rounded-full transition-all duration-200 hover:scale-110 bg-bg-elevated/95 hover:bg-accent-primary/20 border-accent-primary/30 text-accent-primary"
        style={{ right: 'calc(5rem - 5px)' }} // Positioned to the left of Pin button
        title="Share this article"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {/* Pin/Unpin Button - Moved further to the right */}
      {(onPin || onUnpin) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isPinned) {
              onUnpin?.();
            } else {
              onPin?.();
            }
          }}
          className={`absolute top-2.5 z-10 p-1.5 border rounded-full transition-all duration-200 hover:scale-110 ${isPinned
            ? 'bg-accent-primary border-accent-primary text-white shadow-md'
            : 'bg-bg-elevated/95 hover:bg-accent-primary/20 border-accent-primary/30 text-accent-primary'
            }`}
          style={{ right: 'calc(3rem - 5px)' }}
          title={isPinned ? 'Unpin this article' : 'Pin this article'}
        >
          {isPinned ? (
            <PinOff className="w-3.5 h-3.5" />
          ) : (
            <Pin className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Favorite Button - Heart icon with better spacing */}
      {onToggleFavorite && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!onToggleFavorite) return;
            try {
              await onToggleFavorite();
            } catch (err) {
              // Surface errors here to avoid unhandled promise rejections
              console.error('Error toggling favorite (EventCard):', err);
            }
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 border rounded-full transition-all duration-200 hover:scale-110 ${isFavorited
            ? 'bg-red-500 border-red-500 text-white shadow-md'
            : 'bg-bg-elevated/95 hover:bg-red-500/20 border-red-500/30 text-red-400'
            }`}
          title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}

// Historical Event Card Component (Compact Version)
interface HistoricalEventCardProps {
  event: IntelEvent;
  isSelected: boolean;
  onClick: () => void;
  formatTimestamp: (date: Date) => string;
}

function HistoricalEventCard({ event, isSelected, onClick, formatTimestamp }: HistoricalEventCardProps) {
  const getSentimentColor = () => {
    switch (event.sentiment) {
      case 'positive': return 'bg-sentiment-positive text-bg-base';
      case 'negative': return 'bg-sentiment-negative text-white';
      case 'neutral': return 'bg-sentiment-neutral text-bg-base';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 pl-16 rounded-lg transition-all duration-300 backdrop-blur-md active:scale-[0.97] hover:translate-x-1 ${isSelected
        ? 'bg-accent-primary/25 border-2 border-accent-primary shadow-[0_0_20px_rgba(38,145,175,0.3)] scale-[1.01] z-10'
        : 'bg-bg-elevated/40 border border-accent-primary/20 hover:bg-bg-elevated/60 hover:border-accent-primary/40'
        }`}
    >
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-accent-primary rounded-r-full animate-pulse" />
      )}
      {/* Compact Timestamp & Badge */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
          <Clock className="w-3 h-3" />
          {formatTimestamp(event.timestamp)}
        </div>
        <div className="flex items-center gap-1.5" style={{ marginLeft: '-10px' }}>
          <div className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${getSentimentColor()}`}>
            {event.sentiment.toUpperCase()}
          </div>
          <span className="px-1.5 py-0.5 bg-text-tertiary/20 text-text-tertiary text-[10px] font-semibold rounded border border-text-tertiary/30">
            HISTORY
          </span>
        </div>
      </div>

      {/* Compact Headline */}
      <h3 className="text-xs font-semibold text-text-primary mb-1.5 line-clamp-2">
        {event.headline}
      </h3>

      {/* Compact Source */}
      <div className="flex items-center justify-between text-[11px] text-text-tertiary">
        <span>{event.source}</span>
        <span className="flex items-center gap-2">
          <span>{event.location.country}</span>
        </span>
      </div>
    </button>
  );
}
