export interface Chapter {
  StartPositionTicks: number;
  Name: string;
  ImageTag?: string;
}

export interface QueueItem {
  jellyfinItemId: string;
  title: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  isShuffled: boolean;
}

export interface UIState {
  showQueue: boolean;
  isFullscreen: boolean;
  showMiniVideo: boolean;
  showFullscreenControls: boolean;
  showVolumeSlider: boolean;
  showAudioTracks: boolean;
  showSubtitles: boolean;
  showChapters: boolean;
}

export interface TrackState {
  selectedAudioTrack: number;
  selectedSubtitleTrack: number;
  isSwitchingTracks: boolean;
}

export interface HoverState {
  time: number | null;
  position: number;
  chapter: Chapter | null;
}

export interface DragState {
  isDragging: boolean;
  draggedIndex: number;
  dragOverIndex: number;
}

export interface MiniPlayerProps {
  queue: QueueItem[];
  currentIndex: number;
  onQueueChange: (queue: QueueItem[]) => void;
  onCurrentIndexChange: (index: number) => void;
  onClose: () => void;
}

export interface AudioTrack {
  id: number;
  label: string;
  language: string;
  codec?: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: number;
  label: string;
  language: string;
  codec?: string;
  isDefault?: boolean;
}