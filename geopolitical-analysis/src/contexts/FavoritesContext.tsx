/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import type { IntelEvent } from '@/types';

interface FavoriteItem {
  id: number;
  user_id: string;
  event_id: string;
  event_title: string;
  event_data: IntelEvent;
  rating?: number;
  created_at: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  isFavorite: (eventId: string) => boolean;
  addFavorite: (event: IntelEvent) => Promise<void>;
  removeFavorite: (eventId: string) => Promise<void>;
  toggleFavorite: (event: IntelEvent) => Promise<void>;
  setRating: (event: IntelEvent, rating: number) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const SESSION_KEY = (uid: string) => `app:favorites:${uid}`;

  // Load favorites from the DB
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error, status, statusText } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        console.error('Status Code:', status);
        console.error('Status Text:', statusText);
        return;
      }
      console.log('Favorites loaded successfully:', data?.length || 0, 'items');

      const list = (data || []).map((item: any) => ({
        ...item,
        // Fallback: if top-level rating is missing, try to extract from JSONB
        rating: item.rating !== null && item.rating !== undefined ? item.rating : item.event_data?.rating
      })) as FavoriteItem[];
      setFavorites(list);
      try {
        sessionStorage.setItem(SESSION_KEY(user.id), JSON.stringify(list));
      } catch (err) {
        console.debug('Failed to persist favorites to sessionStorage', err);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Restore from sessionStorage quickly, then sync with server
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      try { sessionStorage.removeItem('app:favorites'); } catch (e) { console.debug('Failed clearing session favorites', e); }
      return;
    }

    try {
      const raw = sessionStorage.getItem(SESSION_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw) as FavoriteItem[];
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch (err) {
      console.debug('Failed to read session favorites', err);
    }

    // Background sync
    loadFavorites();
  }, [user, loadFavorites]);

  // Persist whenever favorites change for the current user
  useEffect(() => {
    if (!user) return;
    try {
      sessionStorage.setItem(SESSION_KEY(user.id), JSON.stringify(favorites));
    } catch (err) {
      console.debug('Failed to persist favorites to sessionStorage (on change)', err);
    }
  }, [favorites, user]);

  function isFavorite(eventId: string): boolean {
    return favorites.some(f => f.event_id === eventId);
  }

  async function addFavorite(event: IntelEvent) {
    if (!user) throw new Error('User must be logged in to add favorites');
    if (processingIds.has(event.id)) return;
    setProcessingIds(prev => new Set(prev).add(event.id));

    try {
      await performAddFavorite(event);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
  }

  // Internal helper that doesn't have its own processingIds guard
  async function performAddFavorite(event: IntelEvent) {
    if (!user) return;

    // Check if already in favorites to avoid accidental duplicates
    if (favorites.some(f => f.event_id === event.id)) return;

    const optimistic: FavoriteItem = {
      id: Date.now(),
      user_id: user.id,
      event_id: event.id,
      event_title: event.headline,
      event_data: event,
      rating: event.rating,
      created_at: new Date().toISOString(),
    };

    // optimistic update + persist immediately
    setFavorites(prev => {
      // Final check within the update to be extra safe
      if (prev.some(f => f.event_id === event.id)) return prev;
      const next = [optimistic, ...prev];
      try { sessionStorage.setItem(SESSION_KEY(user.id), JSON.stringify(next)); } catch (e) { console.debug('Failed to persist optimistic favorite', e); }
      return next;
    });

    // Use upsert to handle potential race conditions gracefully
    const { error } = await supabase
      .from('user_favorites')
      .upsert({
        user_id: user.id,
        event_id: event.id,
        event_title: event.headline,
        event_data: { ...event, rating: event.rating },
        rating: event.rating
      }, {
        onConflict: 'user_id,event_id'
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error adding favorite:', error);
      // revert optimistic
      setFavorites(prev => prev.filter(f => f.event_id !== event.id));
      throw error;
    }

    // ensure server state is reflected
    await loadFavorites();
  }

  async function removeFavorite(eventId: string) {
    if (!user) throw new Error('User must be logged in to remove favorites');
    if (processingIds.has(eventId)) return;
    setProcessingIds(prev => new Set(prev).add(eventId));

    const prev = [...favorites];
    setFavorites(prevState => {
      const next = prevState.filter(f => f.event_id !== eventId);
      try { sessionStorage.setItem(SESSION_KEY(user.id), JSON.stringify(next)); } catch (e) { console.debug('Failed to persist optimistic removal', e); }
      return next;
    });

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error removing favorite:', error);
      // try to recover from server
      await loadFavorites();
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      throw error;
    }

    await loadFavorites();
    setProcessingIds(prev => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
  }

  async function toggleFavorite(event: IntelEvent) {
    if (isFavorite(event.id)) {
      await removeFavorite(event.id);
    } else {
      await addFavorite(event);
    }
  }

  async function setRating(event: IntelEvent, rating: number) {
    if (!user) throw new Error('User must be logged in to rate news');
    if (processingIds.has(event.id)) return;
    setProcessingIds(prev => new Set(prev).add(event.id));

    try {
      // If not already favorited, add it first (auto-favoriting)
      if (!isFavorite(event.id)) {
        await performAddFavorite({ ...event, rating });
      }

      // Determine current favorites count for optimistic update
      setFavorites(prev => {
        const exists = prev.some(f => f.event_id === event.id);
        if (!exists) return prev;
        return prev.map(f => f.event_id === event.id ? { ...f, rating, event_data: { ...f.event_data, rating } } : f);
      });

      // Update rating in the database - Store both as a column and inside event_data
      const { error } = await supabase
        .from('user_favorites')
        .update({
          rating,
          event_data: { ...event, rating }
        })
        .eq('user_id', user.id)
        .eq('event_id', event.id);

      if (error) {
        console.error('Error updating rating:', error);
        // Revert local state on error
        await loadFavorites();
        throw error;
      }
    } catch (error) {
      console.error('setRating error:', error);
      throw error;
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
    }
  }

  async function refreshFavorites() {
    await loadFavorites();
  }

  return (
    <FavoritesContext.Provider value={{ favorites, loading, isFavorite, addFavorite, removeFavorite, toggleFavorite, setRating, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const c = useContext(FavoritesContext);
  if (!c) throw new Error('useFavorites must be used within a FavoritesProvider');
  return c;
}
