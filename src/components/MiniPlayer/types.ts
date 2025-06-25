export interface Chapter {
  StartPositionTicks: number;
  Name: string;
  ImageTag?: string;
}

export interface QueueItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  poster?: string;
  duration?: number;
  jellyfinItemId?: string; // The actual Jellyfin item ID for track switching
  playSessionId?: string; // PlaySession ID for stopping active encodings
  chapters?: Chapter[]; // Chapter information
  startPositionTicks?: number; // Resume position in ticks (from API call)
  // Episode information
  isEpisode?: boolean;
  seasonId?: string;
  seriesId?: string;
  indexNumber?: number; // Episode number
  parentIndexNumber?: number; // Season number
  mediaStreams?: Array<{
    Index: number;
    Type: string;
    Codec: string;
    Language?: string;
    DisplayTitle: string;
    IsDefault: boolean;
    Width?: number;
    Height?: number;
    BitRate?: number;
  }>;
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