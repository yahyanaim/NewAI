import { X, Heart, Clock, MapPin, TrendingUp, Trash2 } from 'lucide-react';
import { useFavorites } from '@/contexts/FavoritesContext';
import { StarRating } from './StarRating';
import { toast } from 'sonner';
import type { IntelEvent } from '@/types';

interface FavoritesDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSelect: (event: IntelEvent) => void;
}

export function FavoritesDashboard({ isOpen, onClose, onEventSelect }: FavoritesDashboardProps) {
  const { favorites, loading, removeFavorite, setRating } = useFavorites();

  if (!isOpen) return null;

  const handleEventClick = (event: IntelEvent) => {
    onEventSelect(event);
    onClose();
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'negative':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'normal':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-elevated border border-border-primary rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary/20 border border-accent-primary/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">My Favorites</h2>
              <p className="text-sm text-text-tertiary">{favorites.length} saved items</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-bg-card border border-border-primary flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-text-tertiary" />
              </div>
              <p className="text-text-secondary text-lg font-medium mb-2">No favorites yet</p>
              <p className="text-text-tertiary text-sm max-w-sm">
                Start saving interesting events by clicking the heart icon on news items
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {favorites.map((favorite) => {
                const event = favorite.event_data;
                return (
                  <div
                    key={favorite.id}
                    className="bg-bg-card border border-border-primary rounded-lg p-4 hover:border-accent-primary/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1"
                        onClick={() => handleEventClick(event)}
                      >
                        {/* Title */}
                        <h3 className="text-text-primary font-medium mb-2 group-hover:text-accent-primary transition-colors">
                          {event.headline}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {/* Location */}
                          <div className="flex items-center gap-1 text-text-tertiary">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{event.location.country}</span>
                          </div>

                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-text-tertiary">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(favorite.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Sentiment Badge */}
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getSentimentColor(event.sentiment)}`}>
                            {event.sentiment}
                          </span>

                          {/* Priority Badge */}
                          <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${getPriorityColor(event.priority)}`}>
                            {event.priority}
                          </span>

                          {/* Category */}
                          <div className="flex items-center gap-1 text-accent-primary">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="text-xs font-medium">{event.category}</span>
                          </div>

                          {/* Rating */}
                          <div className="ml-auto flex flex-col items-end gap-1">
                            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-semibold">Your Rating</span>
                            <StarRating
                              rating={favorite.rating}
                              onRate={async (val) => {
                                try {
                                  await setRating(event, val);
                                  toast.success('Rating updated', {
                                    description: `Report re-analyzed at ${val} stars.`,
                                    duration: 2000
                                  });
                                } catch (error) {
                                  toast.error('Failed to update rating');
                                }
                              }}
                              size={14}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await removeFavorite(event.id);
                            toast.info('Removed from favorites');
                          } catch (error) {
                            toast.error('Failed to remove favorite');
                          }
                        }}
                        className="flex-shrink-0 p-2 text-text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
