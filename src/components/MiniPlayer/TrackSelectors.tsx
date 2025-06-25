import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  AudioLines,
  BookOpen,
  List,
  Loader2,
  Maximize2,
  Minimize2,
  Subtitles,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { AudioTrack, Chapter, PlayerState, SubtitleTrack, TrackState, UIState } from './types';

interface TrackSelectorsProps {
  playerState: PlayerState;
  uiState: UIState;
  trackState: TrackState;
  chapters: Chapter[];
  audioTracks: AudioTrack[];
  subtitleTracks: SubtitleTrack[];
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  onSelectAudioTrack: (trackId: number) => void;
  onSelectSubtitleTrack: (trackId: number) => void;
  onSeekToChapter: (chapterIndex: number) => void;
  onToggleQueue: () => void;
  onToggleMiniVideo: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onUIStateChange: (updates: Partial<UIState>) => void;
  formatTime: (seconds: number) => string;
  ticksToSeconds: (ticks: number) => number;
  getCurrentChapter: { index: number; chapter: Chapter } | null;
}

export const TrackSelectors: React.FC<TrackSelectorsProps> = ({
  playerState,
  uiState,
  trackState,
  chapters,
  audioTracks,
  subtitleTracks,
  onVolumeChange,
  onToggleMute,
  onSelectAudioTrack,
  onSelectSubtitleTrack,
  onSeekToChapter,
  onToggleQueue,
  onToggleMiniVideo,
  onToggleFullscreen,
  onClose,
  onUIStateChange,
  formatTime,
  ticksToSeconds,
  getCurrentChapter,
}) => {
  return (
    <div className="flex items-center gap-1 min-w-0 flex-1 justify-end">
      {/* Time Display */}
      <span className="text-xs text-zinc-400 font-mono min-w-[80px] text-right">
        {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
      </span>

      {/* Volume Control */}
      <div className="flex items-center w-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMute}
          onMouseEnter={() => onUIStateChange({ showVolumeSlider: true })}
          className="p-1.5 rounded text-zinc-400 hover:text-white"
        >
          {playerState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>

        <div
          className={`transition-all duration-200 overflow-hidden ${
            uiState.showVolumeSlider ? 'w-16 ml-1' : 'w-0'
          }`}
          onMouseEnter={() => onUIStateChange({ showVolumeSlider: true })}
          onMouseLeave={() => onUIStateChange({ showVolumeSlider: false })}
        >
          <Slider
            value={[playerState.isMuted ? 0 : playerState.volume]}
            max={1}
            step={0.01}
            onValueChange={onVolumeChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Audio Track Selector */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUIStateChange({ showAudioTracks: !uiState.showAudioTracks })}
          className={`p-1.5 rounded ${
            uiState.showAudioTracks ? 'text-red-400' : 'text-zinc-400 hover:text-white'
          }`}
          title="Audio Tracks"
        >
          {trackState.isSwitchingTracks ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AudioLines className="w-4 h-4" />
          )}
        </Button>

        {uiState.showAudioTracks && (
          <div
            className="absolute bottom-full right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg min-w-[200px] z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              <div className="text-white text-sm font-medium mb-2">
                Audio Tracks ({audioTracks.length})
              </div>
              {audioTracks.length > 0 ? (
                audioTracks.map((track) => (
                  <button
                    key={track.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectAudioTrack(track.id);
                      onUIStateChange({ showAudioTracks: false });
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      trackState.selectedAudioTrack === track.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {track.label} ({track.language})
                  </button>
                ))
              ) : (
                <div className="text-zinc-400 text-sm">No audio tracks available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Selector */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUIStateChange({ showSubtitles: !uiState.showSubtitles })}
          className={`p-1.5 rounded ${
            uiState.showSubtitles ? 'text-red-400' : 'text-zinc-400 hover:text-white'
          }`}
          title="Subtitles"
        >
          {trackState.isSwitchingTracks ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Subtitles className="w-4 h-4" />
          )}
        </Button>

        {uiState.showSubtitles && (
          <div
            className="absolute bottom-full right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg min-w-[200px] z-[9999]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              <div className="text-white text-sm font-medium mb-2">
                Subtitles ({subtitleTracks.length})
              </div>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectSubtitleTrack(-1);
                  onUIStateChange({ showSubtitles: false });
                }}
                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                  trackState.selectedSubtitleTrack === -1
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Off
              </button>
              {subtitleTracks.length > 0 ? (
                subtitleTracks.map((track) => (
                  <button
                    key={track.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectSubtitleTrack(track.id);
                      onUIStateChange({ showSubtitles: false });
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                      trackState.selectedSubtitleTrack === track.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {track.label} ({track.language})
                  </button>
                ))
              ) : (
                <div className="text-zinc-400 text-sm">No subtitle tracks available</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chapters Selector */}
      {chapters && chapters.length > 0 && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUIStateChange({ showChapters: !uiState.showChapters })}
            className={`p-1.5 rounded ${
              uiState.showChapters ? 'text-red-400' : 'text-zinc-400 hover:text-white'
            }`}
            title="Chapters"
          >
            <BookOpen className="w-4 h-4" />
          </Button>

          {uiState.showChapters && (
            <div
              className="absolute bottom-full right-0 mb-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg min-w-[300px] max-w-[400px] z-50 max-h-64 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                <div className="text-white text-sm font-medium mb-2">
                  Chapters ({chapters.length})
                </div>
                {chapters.map((chapter, index) => {
                  const chapterTime = ticksToSeconds(chapter.StartPositionTicks);
                  const isCurrentChapter = getCurrentChapter?.index === index;
                  return (
                    <button
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSeekToChapter(index);
                        onUIStateChange({ showChapters: false });
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-3 ${
                        isCurrentChapter
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-mono text-zinc-400 min-w-[60px]">
                        {formatTime(chapterTime)}
                      </div>
                      <div className="flex-1 truncate">
                        {chapter.Name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleQueue}
        className={`p-1.5 rounded ${
          uiState.showQueue ? 'text-red-400' : 'text-zinc-400 hover:text-white'
        }`}
        title="Queue"
      >
        <List className="w-4 h-4" />
      </Button>

      {/* Mini Video Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMiniVideo}
        className={`p-1.5 rounded ${
          uiState.showMiniVideo ? 'text-red-400' : 'text-zinc-400 hover:text-white'
        }`}
        title="Picture in Picture"
      >
        <Minimize2 className="w-4 h-4" />
      </Button>

      {/* Fullscreen */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleFullscreen}
        className="p-1.5 rounded text-zinc-400 hover:text-white"
        title="Fullscreen"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>

      {/* Close */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="p-1.5 rounded text-zinc-400 hover:text-red-400"
        title="Close Player"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};