import { useEffect, useState } from 'react';
import { Meta } from '@/service/type';
import { useCatalogConnection } from '@/context/CatalogConnectionContext';

export interface ContinueWatchingItem {
  meta: Meta;
  progressPercentage: number;
  currentTicks: number;
  totalTicks: number;
  lastPlayedDate: string;
  episodeNumber?: number;
  seasonNumber?: number;
}

export const useContinueWatching = () => {
  const { jellyfinService } = useCatalogConnection();
  const [items, setItems] = useState<ContinueWatchingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContinueWatching = async () => {
    if (!jellyfinService.isAuthenticated()) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const baseUrl = jellyfinService.getServerUrl();
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) {
        throw new Error('Missing authentication data');
      }

      const response = await fetch(`${baseUrl}/Users/${userId}/Items/Resume?limit=20`, {
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch continue watching items');
      }

      const data = await response.json();
      const resumeItems = data.Items || [];

      const continueWatchingItems: ContinueWatchingItem[] = resumeItems.map((item: any) => {
        const progressPercentage = item.UserData?.PlaybackPositionTicks && item.RunTimeTicks
          ? (item.UserData.PlaybackPositionTicks / item.RunTimeTicks) * 100
          : 0;

        return {
          meta: {
            id: item.Id,
            name: item.Name,
            description: item.Overview || '',
            poster: `${baseUrl}/Items/${item.Id}/Images/Primary`,
            background: `${baseUrl}/Items/${item.Id}/Images/Backdrop/0`,
            releaseDate: item.ProductionYear?.toString() || item.PremiereDate || '',
            type: 'meta' as const,
            provider: 'jellyfin',
            metaType: item.Type === 'Movie' ? 'movie' : 'tv',
            encoded: encodeURIComponent(`jellyfin/${item.Type.toLowerCase()}/${item.Id}`),
          },
          progressPercentage,
          currentTicks: item.UserData?.PlaybackPositionTicks || 0,
          totalTicks: item.RunTimeTicks || 0,
          lastPlayedDate: item.UserData?.LastPlayedDate || new Date().toISOString(),
          episodeNumber: item.Type === 'Episode' ? item.IndexNumber : undefined,
          seasonNumber: item.Type === 'Episode' ? item.ParentIndexNumber : undefined,
        };
      });

      setItems(continueWatchingItems);
    } catch (err) {
      console.error('Error fetching continue watching:', err);
      setError(err instanceof Error ? err.message : 'Failed to load continue watching');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContinueWatching();
  }, [jellyfinService]);

  const markAsWatched = async (itemId: string) => {
    if (!jellyfinService.isAuthenticated()) return;

    try {
      const baseUrl = jellyfinService.getServerUrl();
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) return;

      await fetch(`${baseUrl}/Users/${userId}/PlayedItems/${itemId}`, {
        method: 'POST',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      // Refresh the list
      fetchContinueWatching();
    } catch (error) {
      console.error('Error marking item as watched:', error);
    }
  };

  const removeFromContinueWatching = async (itemId: string) => {
    if (!jellyfinService.isAuthenticated()) return;

    try {
      const baseUrl = jellyfinService.getServerUrl();
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) return;

      // Reset playback position to 0
      await fetch(`${baseUrl}/Users/${userId}/PlayingItems/${itemId}/Progress`, {
        method: 'DELETE',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
      });

      // Refresh the list
      fetchContinueWatching();
    } catch (error) {
      console.error('Error removing from continue watching:', error);
    }
  };

  return {
    items,
    loading,
    error,
    refresh: fetchContinueWatching,
    markAsWatched,
    removeFromContinueWatching,
  };
};