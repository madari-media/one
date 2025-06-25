import React from 'react';
import { Button } from '@/components/ui/button';
import { CornerUpLeft, CornerUpRight, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { Chapter, PlayerState, QueueItem } from './types';

interface PlayerControlsProps {
  playerState: PlayerState;
  isCurrentItemEpisode: boolean;
  queue: QueueItem[];
  currentIndex: number;
  chapters: Chapter[];
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  onShuffleToggle: () => void;
  onRepeatModeChange: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  playerState,
  chapters,
  onPlayPause,
  onPrevious,
  onNext,
  onPreviousChapter,
  onNextChapter,
  onShuffleToggle,
  onRepeatModeChange,
}) => {
  const hasChapters = chapters && chapters.length > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Shuffle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShuffleToggle}
        className={`p-1.5 rounded transition-all ${
          playerState.isShuffled ? 'text-red-400' : 'text-zinc-400 hover:text-white'
        }`}
        title="Shuffle"
      >
        <Shuffle className="w-4 h-4" />
      </Button>

      {/* Chapter Previous Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onPreviousChapter}
        disabled={!hasChapters}
        className={`p-1.5 rounded ${
          !hasChapters
            ? 'text-zinc-600 cursor-not-allowed'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
        title="Previous Chapter"
      >
        <CornerUpLeft className="w-4 h-4" />
      </Button>

      {/* Previous Track */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onPrevious} 
        className="p-1.5 rounded text-white hover:bg-white/10"
        title="Previous"
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      {/* Play/Pause */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onPlayPause}
        className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white"
        title={playerState.isPlaying ? 'Pause' : 'Play'}
      >
        {playerState.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </Button>

      {/* Next Track */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onNext} 
        className="p-1.5 rounded text-white hover:bg-white/10"
        title="Next"
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      {/* Chapter Next Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onNextChapter}
        disabled={!hasChapters}
        className={`p-1.5 rounded ${
          !hasChapters
            ? 'text-zinc-600 cursor-not-allowed'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
        }`}
        title="Next Chapter"
      >
        <CornerUpRight className="w-4 h-4" />
      </Button>

      {/* Repeat */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRepeatModeChange}
        className={`p-1.5 rounded transition-all relative ${
          playerState.repeatMode !== 'none' ? 'text-red-400' : 'text-zinc-400 hover:text-white'
        }`}
        title={`Repeat: ${playerState.repeatMode}`}
      >
        <Repeat className="w-4 h-4" />
        {playerState.repeatMode === 'one' && (
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px]">
            1
          </span>
        )}
      </Button>
    </div>
  );
};