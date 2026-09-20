import { useState, useEffect } from 'react';
import { Radio, Rss } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { FlashUpdatesHeader } from './components/FlashUpdatesHeader';
import { LiveSignalsFeed } from './components/LiveSignalsFeed';
import { YouTubeNewsCenter } from './components/YouTubeNewsCenter';
import { AIAssessmentPanel } from './components/AIAssessmentPanel';
import { RadioPlayer } from './components/RadioPlayer';
import { WeatherTicker } from './components/WeatherTicker';
import { NewNewsNotification } from './components/NewNewsNotification';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { FavoritesDashboard } from './components/FavoritesDashboard';
import { useAuth } from './contexts/AuthContext';
import { useFavorites } from './contexts/FavoritesContext';
import { fetchConflictData } from './lib/api';
import { generateIntelEventsFromConflicts } from './lib/intelAPI';
import { supabase } from './lib/supabase';
import {
  fetchRecentNewsFromDatabase,
  fetchHistoricalNewsFromDatabase,
  triggerNewsFetch,
  convertDatabaseArticleToIntelEvent,
  fetchGlobalNews
} from './lib/realtimeNewsAPI';
import type { ConflictIntensity, IntelEvent } from './types';
import type { DBMoroccanNewsArticle } from './lib/supabase';
import './App.css';

function App() {
  const { user } = useAuth();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const [conflictData, setConflictData] = useState<ConflictIntensity[]>([]);
  const [intelEvents, setIntelEvents] = useState<IntelEvent[]>([]);
  const [newsEvents, setNewsEvents] = useState<IntelEvent[]>([]);
  const [globalNewsEvents, setGlobalNewsEvents] = useState<IntelEvent[]>([]); // Separated global news state
  const [historicalNewsEvents, setHistoricalNewsEvents] = useState<IntelEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<IntelEvent | null>(null);
  const [weatherCountry, setWeatherCountry] = useState<string>('Morocco'); // Separated weather state
  const [isMobile, setIsMobile] = useState(false);
  const [showRadio, setShowRadio] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newNewsCount, setNewNewsCount] = useState(0);
  const [unacknowledgedNewsCount, setUnacknowledgedNewsCount] = useState(0);
  const [showNewNewsAlert, setShowNewNewsAlert] = useState(false);
  const [latestNewsHeadline, setLatestNewsHeadline] = useState('');
  const [latestNewsCountry, setLatestNewsCountry] = useState<string>('');
  const [newArticleIds, setNewArticleIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showFavoritesDashboard, setShowFavoritesDashboard] = useState(false);

  useEffect(() => {
    loadInitialData();
    loadMoroccanNews();
    loadHistoricalNews();

    // Trigger initial news fetch from edge function
    triggerNewsFetch();

    // Set up Supabase Realtime subscription for automatic news updates
    console.log('Setting up Supabase Realtime subscription...');

    const subscription = supabase
      .channel('moroccan_news_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'moroccan_news_articles',
        },
        (payload) => {
          console.log('New news article received via Realtime:', payload);

          // Convert database article to IntelEvent
          const newArticle = payload.new as DBMoroccanNewsArticle;
          const newEvent = convertDatabaseArticleToIntelEvent(newArticle);

          // Mark as new article
          setNewArticleIds((prev) => new Set(prev).add(newEvent.id));

          // Remove from new articles after 2 minutes
          setTimeout(() => {
            setNewArticleIds((prev) => {
              const updated = new Set(prev);
              updated.delete(newEvent.id);
              return updated;
            });
          }, 120000); // 2 minutes

          // Add to news events with smooth transition
          setNewsEvents((prev) => [newEvent, ...prev]);

          // Update banner notification state
          setNewNewsCount((prev) => prev + 1);
          setUnacknowledgedNewsCount((prev) => prev + 1);
          setLatestNewsHeadline(newArticle.title);
          setLatestNewsCountry('Morocco'); // Explicitly set for Moroccan news
          setShowNewNewsAlert(true);

          // Also show toast notification (less prominent, backup)
          toast(
            <div className="flex items-center gap-2">
              <Rss className="w-4 h-4 text-accent-primary animate-pulse" />
              <div>
                <p className="font-semibold text-sm">New Moroccan News</p>
                <p className="text-xs text-text-secondary line-clamp-1">{newArticle.title}</p>
              </div>
            </div>,
            {
              duration: 4000,
              position: 'top-right',
            }
          );

          console.log('News events updated with real-time article');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'moroccan_news_articles',
        },
        (payload) => {
          console.log('News article updated via Realtime:', payload);

          // Update existing article
          const updatedArticle = payload.new as DBMoroccanNewsArticle;
          const updatedEvent = convertDatabaseArticleToIntelEvent(updatedArticle);

          setNewsEvents((prev) =>
            prev.map((event) =>
              event.id === `realtime-news-${updatedArticle.id}` ? updatedEvent : event
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');

        if (status === 'SUBSCRIBED') {
          toast.success('Real-time news streaming active', {
            duration: 3000,
            position: 'bottom-right',
          });
        }
      });

    // Trigger news fetch every 5 minutes
    const newsFetchInterval = setInterval(() => {
      console.log('Triggering periodic news fetch...');
      triggerNewsFetch();
    }, 300000); // 5 minutes

    // Refresh UCDP conflict data every 10 minutes
    const conflictInterval = setInterval(() => {
      loadInitialData();
    }, 600000);

    // Refresh historical news every 30 minutes
    const historicalInterval = setInterval(() => {
      loadHistoricalNews();
    }, 1800000);

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      subscription.unsubscribe();
      clearInterval(newsFetchInterval);
      clearInterval(conflictInterval);
      clearInterval(historicalInterval);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Simulator Effect: Inject random global events to keep feed alive
  // Real Global News Fetcher (Replaces Simulator)
  useEffect(() => {
    // Initial fetch
    const fetchGlobal = async () => {
      const globalEvents = await fetchGlobalNews();
      if (globalEvents.length > 0) {
        console.log('Injected real global news events:', globalEvents.length);

        // Use functional update to append new global events to existing global events list
        // Note: fetchGlobalNews currently returns ~15 items. If we just Prepend, list grows indefinitely.
        // We probably want to replace or keep a capped history of global news. 
        // For 'disappearing' issue, let's just REPLACE the global news chunk or careful merge.
        // Actually, previous logic was `[...globalEvents, ...prev]`. 
        // If we want a dynamic feed that refreshes, maybe we just want the freshest?
        // Let's stick to appending new ones but filtered by ID if we could, 
        // but since IDs are time-based, they are always "new".
        // Let's just keep the last 50 global events to prevent leaks.

        setGlobalNewsEvents(prev => {
          const newEvents = globalEvents.filter(
            event => !prev.some(existing => existing.id === event.id)
          );
          const combined = [...newEvents, ...prev];
          return combined.slice(0, 100); // Increased limit slightly to 100
        });

        // Notifications logic remains same
        setNewNewsCount(prev => prev + globalEvents.length);
        setLatestNewsHeadline(globalEvents[0].headline);
        setLatestNewsCountry('Global News');
        setShowNewNewsAlert(true);
      }
    };

    fetchGlobal();

    // Fetch every 2 minutes for updates
    const interval = setInterval(fetchGlobal, 120000);

    return () => clearInterval(interval);
  }, []);

  async function loadInitialData() {
    try {
      // Fetch real UCDP conflict data
      const conflicts = await fetchConflictData();
      setConflictData(conflicts);

      // Generate intelligence events from real conflict data with AI analysis
      const events = await generateIntelEventsFromConflicts(conflicts);
      setIntelEvents(events);

      // Auto-select first event for AI Panel (User Request)
      if (events.length > 0 && !selectedEvent) {
        setSelectedEvent(events[0]);
      }

      // Explicitly set Weather default to Morocco (User Request)
      setWeatherCountry('Morocco');

      // If no conflict data loaded, ensure we have fallback data
      if (events.length === 0) {
        console.warn('No conflict data loaded, using fallback...');
        const fallbackEvents = [
          {
            id: 'conflict-1',
            headline: 'Regional Security Coordination Meeting in North Africa',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            location: { lat: 28.0339, lng: 1.6596, country: 'Algeria', region: 'North Africa' },
            regions: ['Maghreb'],
            sentiment: 'neutral' as const,
            priority: 'normal' as const,
            source: 'UCDP',
            category: 'political' as const,
            actors: ['Regional governments'],
            description: 'Coordination meeting on regional security initiatives.',
            content: 'Regional security authorities meet to discuss coordinated responses.',
            scores: { geopolitical: 60, geoeconomic: 55, security: 65, diplomatic: 60, stability: 70 },
            aiAnalysis: 'This regional security meeting reflects ongoing cooperation efforts in North Africa. The initiative suggests diplomatic engagement and potential for multilateral security frameworks.',
            confidence: 'high' as const
          },
          {
            id: 'conflict-2',
            headline: 'Economic Integration Summit in Western Sahara',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            location: { lat: 23.4162, lng: -7.0044, country: 'Morocco', region: 'North Africa' },
            regions: ['Maghreb'],
            sentiment: 'positive' as const,
            priority: 'high' as const,
            source: 'UCDP',
            category: 'economic' as const,
            actors: ['King Mohammed VI', 'Regional partners'],
            description: 'Economic integration discussions focusing on development initiatives.',
            content: 'Morocco leads economic integration discussions with regional partners.',
            scores: { geopolitical: 70, geoeconomic: 80, security: 55, diplomatic: 75, stability: 85 },
            aiAnalysis: 'This economic summit represents significant diplomatic progress in Western Sahara. The initiative demonstrates Morocco\'s leadership in regional economic integration.',
            confidence: 'high' as const
          }
        ];
        setIntelEvents(fallbackEvents);
        setSelectedEvent(fallbackEvents[0]);
        setWeatherCountry('Morocco');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Fallback to curated events if API fails
      const fallbackEvents = [
        {
          id: 'conflict-1',
          headline: 'Regional Security Coordination Meeting in North Africa',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          location: { lat: 28.0339, lng: 1.6596, country: 'Algeria', region: 'North Africa' },
          regions: ['Maghreb'],
          sentiment: 'neutral' as const,
          priority: 'normal' as const,
          source: 'UCDP',
          category: 'political' as const,
          actors: ['Regional governments'],
          description: 'Coordination meeting on regional security initiatives.',
          content: 'Regional security authorities meet to discuss coordinated responses.',
          scores: { geopolitical: 60, geoeconomic: 55, security: 65, diplomatic: 60, stability: 70 },
          aiAnalysis: 'This regional security meeting reflects ongoing cooperation efforts in North Africa. The initiative suggests diplomatic engagement and potential for multilateral security frameworks.',
          confidence: 'high' as const
        },
        {
          id: 'conflict-2',
          headline: 'Economic Integration Summit in Western Sahara',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          location: { lat: 23.4162, lng: -7.0044, country: 'Morocco', region: 'North Africa' },
          regions: ['Maghreb'],
          sentiment: 'positive' as const,
          priority: 'high' as const,
          source: 'UCDP',
          category: 'economic' as const,
          actors: ['King Mohammed VI', 'Regional partners'],
          description: 'Economic integration discussions focusing on development initiatives.',
          content: 'Morocco leads economic integration discussions with regional partners.',
          scores: { geopolitical: 70, geoeconomic: 80, security: 55, diplomatic: 75, stability: 85 },
          aiAnalysis: 'This economic summit represents significant diplomatic progress in Western Sahara. The initiative demonstrates Morocco\'s leadership in regional economic integration.',
          confidence: 'high' as const
        }
      ];
      setIntelEvents(fallbackEvents);
      // Ensure AI panel has content but weather stays Morocco
      if (fallbackEvents.length > 0) {
        setSelectedEvent(fallbackEvents[0]);
      }
      setWeatherCountry('Morocco');
    }
  }

  async function loadMoroccanNews() {
    try {
      console.log('Fetching recent Moroccan news from database...');
      const newsIntelEvents = await fetchRecentNewsFromDatabase();
      console.log(`Fetched ${newsIntelEvents.length} recent Moroccan news articles from database`);

      setNewsEvents(newsIntelEvents);
    } catch (error) {
      console.error('Error loading Moroccan news from database:', error);
      setNewsEvents([]);
    }
  }

  async function loadHistoricalNews() {
    try {
      console.log('Fetching historical Moroccan news from database...');
      const historicalIntelEvents = await fetchHistoricalNewsFromDatabase();
      console.log(`Fetched ${historicalIntelEvents.length} historical Moroccan news articles from database`);

      setHistoricalNewsEvents(historicalIntelEvents);
    } catch (error) {
      console.error('Error loading historical Moroccan news from database:', error);
    }
  }

  const handleEventSelect = (event: IntelEvent) => {
    setSelectedEvent(event);
    setWeatherCountry(event.location?.country || 'Morocco');
  };

  const handleCloseAssessment = () => {
    setSelectedEvent(null);
  };



  // Handle pin/unpin actions
  const handlePin = (eventId: string) => {
    console.log('Pinning event:', eventId);
    setPinnedIds((prev) => new Set([...prev, eventId]));
    toast.success('Event pinned to top');
  };

  const handleUnpin = (eventId: string) => {
    console.log('Unpinning event:', eventId);
    setPinnedIds((prev) => {
      const updated = new Set(prev);
      updated.delete(eventId);
      return updated;
    });
    toast.info('Event unpinned');
  };

  // Handle favorite toggle
  const handleToggleFavorite = async (event: IntelEvent) => {
    if (!user) {
      toast.error('Please sign in to save favorites', {
        action: {
          label: 'Sign In',
          onClick: () => setShowAuthModal(true)
        },
        duration: 4000
      });
      return;
    }

    try {
      const wasFavorited = isFavorite(event.id);
      await toggleFavorite(event);

      // Show success message
      if (!wasFavorited) {
        toast.success('Added to favorites', {
          description: event.headline.slice(0, 50) + (event.headline.length > 50 ? '...' : ''),
          duration: 3000
        });
      } else {
        toast.info('Removed from favorites', {
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      const errMsg = error && (error as any).message ? (error as any).message : JSON.stringify(error);
      toast.error('Failed to update favorites', {
        description: errMsg || 'Please try again. If the problem persists, try signing out and back in.',
        duration: 7000,
      });
    }
  };

  // Get favorited IDs as a Set
  const favoritedIds = new Set(favorites.map(fav => fav.event_id));

  // Desktop: Three-column layout
  // Mobile: Stacked with tabs
  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-x-hidden">
      <Toaster richColors closeButton />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />

      {/* Favorites Dashboard */}
      <FavoritesDashboard
        isOpen={showFavoritesDashboard}
        onClose={() => setShowFavoritesDashboard(false)}
        onEventSelect={handleEventSelect}
      />

      {/* New News Alert Banner */}
      {showNewNewsAlert && (
        <NewNewsNotification
          newsCount={newNewsCount}
          latestHeadline={latestNewsHeadline}
          country={latestNewsCountry}
          onDismiss={() => {
            setShowNewNewsAlert(false);
            setNewNewsCount(0);
          }}
        />
      )}
      {/* Flash Updates Header */}
      <FlashUpdatesHeader intelEvents={[...intelEvents, ...newsEvents, ...globalNewsEvents]} />

      {/* Top-left: show Sign Up when not signed in, otherwise show UserProfile */}
      <div className="fixed left-10 top-[5px] z-50">
        {user ? (
          <UserProfile onViewFavorites={() => setShowFavoritesDashboard(true)} />
        ) : (
          <button
            onClick={() => {
              setAuthModalMode('register');
              setShowAuthModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white font-bold rounded-lg shadow-lg hover:opacity-95 transition-opacity text-sm"
          >
            <span>Sign Up</span>
          </button>
        )}
      </div>



      {/* Main Content - Three Column Layout with proper spacing for logo */}
      <main className="fixed top-16 left-0 right-0 bottom-0 flex">
        {!isMobile ? (
          <>
            {/* Left Panel - Live Signals Feed (30%) */}
            <div className="w-full md:w-[30%] h-full">
              <LiveSignalsFeed
                intelEvents={[...intelEvents, ...newsEvents, ...globalNewsEvents]}
                historicalEvents={historicalNewsEvents}
                onEventSelect={handleEventSelect}
                selectedEventId={selectedEvent?.id}
                newArticleIds={newArticleIds}
                pinnedIds={pinnedIds}
                onPin={handlePin}
                onUnpin={handleUnpin}
                newNewsCount={newArticleIds.size}
                favoritedIds={favoritedIds}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>

            {/* Center Panel - Live News Streams (40%) */}
            <div className="w-full md:w-[40%] h-full relative">
              <YouTubeNewsCenter
                conflictData={conflictData}
                intelEvents={[...intelEvents, ...newsEvents, ...globalNewsEvents]}
                selectedEventId={selectedEvent?.id}
                onEventClick={handleEventSelect}
              />
            </div>

            {/* Right Panel - AI Assessment (30%) */}
            <div className="w-full md:w-[30%] h-full">
              <AIAssessmentPanel
                event={selectedEvent}
                onClose={handleCloseAssessment}
                onAuthRequired={() => {
                  setAuthModalMode('register');
                  setShowAuthModal(true);
                }}
              />
            </div>
          </>
        ) : (
          // Mobile Layout - Simplified
          <div className="w-full h-full flex flex-col">
            {/* Mobile Live News - 60% */}
            <div className="h-[60%] relative">
              <YouTubeNewsCenter
                conflictData={conflictData}
                intelEvents={[...intelEvents, ...newsEvents, ...globalNewsEvents]}
                selectedEventId={selectedEvent?.id}
                onEventClick={handleEventSelect}
              />
            </div>

            {/* Mobile Event Feed - 40% */}
            <div className="h-[40%] overflow-hidden">
              {selectedEvent ? (
                <AIAssessmentPanel
                  event={selectedEvent}
                  onClose={handleCloseAssessment}
                  onAuthRequired={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                />
              ) : (
                <LiveSignalsFeed
                  intelEvents={[...intelEvents, ...newsEvents, ...globalNewsEvents]}
                  historicalEvents={historicalNewsEvents}
                  onEventSelect={handleEventSelect}
                  selectedEventId={selectedEvent?.id}
                  newArticleIds={newArticleIds}
                  pinnedIds={pinnedIds}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
                  newNewsCount={newArticleIds.size}
                  favoritedIds={favoritedIds}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Weather Ticker Bar - Replacing static footer */}
      {!isMobile && !showRadio && (
        <WeatherTicker
          selectedCountry={weatherCountry}
          onCountrySelect={setWeatherCountry}
        />
      )}

      {/* Radio Toggle Button (when radio is hidden) - Adjusted position */}
      {!showRadio && (
        <button
          onClick={() => setShowRadio(true)}
          className="fixed bottom-12 left-4 z-50 flex items-center gap-2 px-4 py-3 bg-bg-surface border border-accent-primary/30 rounded-lg shadow-teal-glow hover:bg-accent-primary/20 transition-all group"
          title="Open Moroccan Radio"
        >
          <Radio className="w-5 h-5 text-accent-primary group-hover:animate-pulse" />
          <span className="text-sm font-medium text-text-primary">Moroccan Radio</span>
        </button>
      )}

      {/* Radio Player */}
      {showRadio && (
        <RadioPlayer onClose={() => setShowRadio(false)} />
      )}
    </div>
  );
}

// Note: generateIntelEventsFromConflicts is now imported from lib/intelAPI.ts
// This provides enhanced intelligence event generation based on real UCDP conflict data
// with sophisticated sentiment analysis and AI-powered scoring algorithms

export default App;
