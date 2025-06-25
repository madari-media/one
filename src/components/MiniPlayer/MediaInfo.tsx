import React from 'react';
import { Chapter, QueueItem } from './types';

interface MediaInfoProps {
  currentItem: QueueItem;
  getCurrentChapter: { index: number; chapter: Chapter } | null;
  isCurrentItemEpisode: boolean;
  queueLength: number;
}

export const MediaInfo: React.FC<MediaInfoProps> = ({
  currentItem,
  getCurrentChapter,
  isCurrentItemEpisode,
  queueLength,
}) => {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {currentItem.poster && (
        <img
          src={currentItem.poster}
          alt={currentItem.title}
          className="w-12 h-12 rounded object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="text-white text-sm font-medium truncate">
          {currentItem.title}
        </div>
        {getCurrentChapter ? (
          <div className="text-zinc-400 text-xs truncate">
            Chapter {getCurrentChapter.index + 1}: {getCurrentChapter.chapter.Name}
          </div>
        ) : isCurrentItemEpisode ? (
          <div className="text-zinc-400 text-xs truncate">
            {currentItem.subtitle} {queueLength === 1 ? '• Auto-play enabled' : ''}
          </div>
        ) : currentItem.subtitle ? (
          <div className="text-zinc-400 text-xs truncate">
            {currentItem.subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
};