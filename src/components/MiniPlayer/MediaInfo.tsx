import React, { useEffect, useState } from 'react';
import { Chapter, QueueItem } from './types';

interface MediaInfoProps {
  currentItem: QueueItem;
  getCurrentChapter: { index: number; chapter: Chapter } | null;
  isCurrentItemEpisode: boolean;
  queueLength: number;
}

interface ItemDetails {
  poster?: string;
  subtitle?: string;
}

export const MediaInfo: React.FC<MediaInfoProps> = ({
  currentItem,
  getCurrentChapter,
  isCurrentItemEpisode,
  queueLength,
}) => {
  const [itemDetails, setItemDetails] = useState<ItemDetails>({});

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!currentItem?.jellyfinItemId) return;

      try {
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        const response = await fetch(
          `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setItemDetails({
            poster: data.ImageTags?.Primary 
              ? `${baseUrl}/Items/${currentItem.jellyfinItemId}/Images/Primary?api_key=${apiKey}`
              : undefined,
            subtitle: data.Type === 'Episode' 
              ? `S${data.ParentIndexNumber}E${data.IndexNumber}`
              : undefined
          });
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
      }
    };

    fetchItemDetails();
  }, [currentItem?.jellyfinItemId]);

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {itemDetails.poster && (
        <img
          src={itemDetails.poster}
          alt={currentItem.title}
          className="w-12 h-12 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="text-white text-sm font-medium truncate">
          {currentItem.title}
        </div>
        <div className="text-zinc-400 text-xs truncate">
          {isCurrentItemEpisode && itemDetails.subtitle && (
            <>
              {itemDetails.subtitle}
              {getCurrentChapter && ' • '}
              {queueLength === 1 && !getCurrentChapter && ' • Auto-play enabled'}
            </>
          )}
          {getCurrentChapter && (
            <>
              Chapter {getCurrentChapter.index + 1}: {getCurrentChapter.chapter.Name}
            </>
          )}
          {!isCurrentItemEpisode && itemDetails.subtitle && (
            <>{itemDetails.subtitle}</>
          )}
        </div>
      </div>
    </div>
  );
};