import React from 'react';
import { Chapter, HoverState, PlayerState, QueueItem } from './types';

interface ProgressBarProps {
  playerState: PlayerState;
  currentItem: QueueItem | null;
  hoverState: HoverState;
  onSeek: (value: number[]) => void;
  onChapterSeek: (chapterIndex: number) => void;
  onHoverChange: (hoverState: HoverState) => void;
  formatTime: (seconds: number) => string;
  ticksToSeconds: (ticks: number) => number;
  getChapterAtTime: (timeInSeconds: number) => Chapter | null;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  playerState,
  currentItem,
  hoverState,
  onSeek,
  onChapterSeek,
  onHoverChange,
  formatTime,
  ticksToSeconds,
  getChapterAtTime,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-700 z-10">
      {/* Hover timestamp and chapter tooltip */}
      {hoverState.time !== null && (
        <div
          className="absolute -top-16 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none z-10 transform -translate-x-1/2 min-w-max"
          style={{ left: `${hoverState.position}%` }}
        >
          <div>{formatTime(hoverState.time)}</div>
          {hoverState.chapter && (
            <div className="text-zinc-300 mt-1 text-[10px]">{hoverState.chapter.Name}</div>
          )}
        </div>
      )}

      <div
        className="relative h-1 bg-zinc-700 hover:h-2 transition-all duration-200 cursor-pointer group"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percentage = (e.clientX - rect.left) / rect.width;
          const time = percentage * (playerState.duration || 0);
          const chapter = getChapterAtTime(time);
          onHoverChange({ time, position: percentage * 100, chapter });
        }}
        onMouseLeave={() => onHoverChange({ time: null, position: 0, chapter: null })}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percentage = (e.clientX - rect.left) / rect.width;
          const time = percentage * (playerState.duration || 0);
          onSeek([time]);
        }}
      >
        {/* Progress */}
        <div
          className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-200"
          style={{ width: `${playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0}%` }}
        />

        {/* Hover thumb */}
        <div
          className="absolute top-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${hoverState.position}%` }}
        />

        {/* Chapter Markers */}
        {currentItem?.chapters && playerState.duration > 0 && currentItem.chapters.map((chapter, index) => {
          const chapterTime = ticksToSeconds(chapter.StartPositionTicks);
          const position = (chapterTime / playerState.duration) * 100;
          return (
            <div
              key={index}
              className="absolute top-0 w-0.5 h-full bg-yellow-400 opacity-60 cursor-pointer hover:opacity-100"
              style={{ left: `${position}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onChapterSeek(index);
              }}
              title={chapter.Name}
            />
          );
        })}

        {/* Current position thumb */}
        <div
          className="absolute top-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};