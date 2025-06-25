import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Pause, Play, X } from 'lucide-react';
import Hls from 'hls.js';

import { Queue } from './Queue';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { MediaInfo } from './MediaInfo';
import { TrackSelectors } from './TrackSelectors';

import {
  AudioTrack,
  Chapter,
  HoverState,
  MiniPlayerProps,
  PlayerState,
  QueueItem,
  SubtitleTrack,
  TrackState,
  UIState
} from './types';

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  queue,
  currentIndex,
  onQueueChange,
  onCurrentIndexChange,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const fullscreenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chaptersCache = useRef<Map<string, Chapter[]>>(new Map());

  // State management
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    repeatMode: 'none',
    isShuffled: false,
  });

  const [uiState, setUiState] = useState<UIState>({
    showQueue: false,
    isFullscreen: false,
    showMiniVideo: true,
    showFullscreenControls: true,
    showVolumeSlider: false,
    showAudioTracks: false,
    showSubtitles: false,
    showChapters: false,
  });
  
  const [trackState, setTrackState] = useState<TrackState>({
    selectedAudioTrack: 0,
    selectedSubtitleTrack: -1,
    isSwitchingTracks: false,
  });
  
  const [hoverState, setHoverState] = useState<HoverState>({
    time: null,
    position: 0,
    chapter: null,
  });

  const [miniPlayerSize] = useState({ width: 320, height: 180 });

  // Memoized values
  const currentItem = useMemo(() => queue[currentIndex], [queue, currentIndex]);

  const [itemTypeCache, setItemTypeCache] = useState<Map<string, string>>(new Map());
  const [hlsTracksLoaded, setHlsTracksLoaded] = useState(false);
  const [playbackInfo, setPlaybackInfo] = useState<any>(null);

  const isCurrentItemEpisode = useMemo(() => {
    console.log('🔍 Checking if current item is episode:', {
      title: currentItem?.title,
      subtitle: currentItem?.subtitle,
      jellyfinItemId: currentItem?.jellyfinItemId,
      itemType: itemTypeCache.get(currentItem?.jellyfinItemId || ''),
    });

    // Check if subtitle contains episode pattern (S##E## or similar)
    if (currentItem?.subtitle) {
      const episodePattern = /S\d+E\d+/i;
      if (episodePattern.test(currentItem.subtitle)) {
        console.log('✅ Episode detected from subtitle pattern:', currentItem.subtitle);
        return true;
      }
    }
    
    // Check if we have cached the item type
    const cachedType = itemTypeCache.get(currentItem?.jellyfinItemId || '');
    if (cachedType === 'Episode') {
      console.log('✅ Episode detected from cache');
      return true;
    } else if (cachedType && cachedType !== 'Episode') {
      console.log('❌ Not an episode (from cache):', cachedType);
      return false;
    }
    
    console.log('❓ Episode status unknown - will fetch from API');
    return false;
  }, [currentItem, itemTypeCache]);

  const ticksToSeconds = useCallback((ticks: number) => ticks / 10000000, []);

  // Progress reporting to Jellyfin
  const reportProgress = useCallback(async (positionTicks: number, isPaused: boolean = false) => {
    if (!currentItem?.jellyfinItemId) return;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');
      
      if (!baseUrl || !apiKey || !userId) return;

      await fetch(`${baseUrl}/Sessions/Playing/Progress`, {
        method: 'POST',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: currentItem.jellyfinItemId,
          PositionTicks: positionTicks,
          PlaySessionId: currentItem.playSessionId,
          MediaSourceId: currentItem.jellyfinItemId,
          CanSeek: true,
          IsPaused: isPaused,
          IsMuted: playerState.isMuted,
          VolumeLevel: Math.round(playerState.volume * 100),
          PlayMethod: 'DirectStream',
          RepeatMode: 'RepeatNone',
        }),
      });
    } catch (error) {
      console.error('Error reporting progress:', error);
    }
  }, [currentItem, playerState.isMuted, playerState.volume]);

  const reportPlaybackStart = useCallback(async () => {
    if (!currentItem?.jellyfinItemId) return;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');
      
      if (!baseUrl || !apiKey || !userId) return;

      await fetch(`${baseUrl}/Sessions/Playing`, {
        method: 'POST',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: currentItem.jellyfinItemId,
          PlaySessionId: currentItem.playSessionId,
          MediaSourceId: currentItem.jellyfinItemId,
          CanSeek: true,
          IsPaused: false,
          IsMuted: playerState.isMuted,
          VolumeLevel: Math.round(playerState.volume * 100),
          PlayMethod: 'DirectStream',
          RepeatMode: 'RepeatNone',
        }),
      });
    } catch (error) {
      console.error('Error reporting playback start:', error);
    }
  }, [currentItem, playerState.isMuted, playerState.volume]);

  const reportPlaybackStop = useCallback(async (positionTicks: number) => {
    if (!currentItem?.jellyfinItemId) return;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');
      
      if (!baseUrl || !apiKey || !userId) return;

      await fetch(`${baseUrl}/Sessions/Playing/Stopped`, {
        method: 'POST',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: currentItem.jellyfinItemId,
          PositionTicks: positionTicks,
          PlaySessionId: currentItem.playSessionId,
          MediaSourceId: currentItem.jellyfinItemId,
        }),
      });
    } catch (error) {
      console.error('Error reporting playback stop:', error);
    }
  }, [currentItem]);

  const getCurrentChapter = useMemo(() => {
    if (!currentItem?.chapters || currentItem.chapters.length === 0) return null;
    
    const currentTimeTicks = playerState.currentTime * 10000000;
    const chapters = currentItem.chapters;
    
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTimeTicks >= chapters[i].StartPositionTicks) {
        return { index: i, chapter: chapters[i] };
      }
    }
    
    return { index: 0, chapter: chapters[0] };
  }, [currentItem?.chapters, playerState.currentTime]);

  const getChapterAtTime = useCallback((timeInSeconds: number): Chapter | null => {
    if (!currentItem?.chapters || currentItem.chapters.length === 0) return null;
    
    const timeTicks = timeInSeconds * 10000000;
    
    for (let i = currentItem.chapters.length - 1; i >= 0; i--) {
      if (timeTicks >= currentItem.chapters[i].StartPositionTicks) {
        return currentItem.chapters[i];
      }
    }
    
    return currentItem.chapters[0];
  }, [currentItem?.chapters]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // API Functions
  const fetchChapters = useCallback(async (itemId: string): Promise<Chapter[]> => {
    if (chaptersCache.current.has(itemId)) {
      return chaptersCache.current.get(itemId)!;
    }

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      
      if (!baseUrl || !apiKey) return [];

      const response = await fetch(`${baseUrl}/Items/${itemId}?api_key=${apiKey}&Fields=Chapters`);
      const data = await response.json();
      
      const chapters = data.Chapters || [];
      chaptersCache.current.set(itemId, chapters);
      
      return chapters;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }, []);

  const fetchNextEpisode = useCallback(async (): Promise<QueueItem | null> => {
    if (!currentItem?.jellyfinItemId || !isCurrentItemEpisode) {
      console.log('❌ Not an episode or missing ID:', { 
        jellyfinItemId: currentItem?.jellyfinItemId, 
        isEpisode: isCurrentItemEpisode 
      });
      return null;
    }

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');
      
      if (!baseUrl || !apiKey || !userId) {
        console.log('❌ Missing Jellyfin credentials');
        return null;
      }

      console.log('🔍 Fetching episode metadata for:', currentItem.jellyfinItemId);

      // First, get the current item's metadata to find series info
      const itemResponse = await fetch(
        `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`
      );
      const itemData = await itemResponse.json();
      
      console.log('📺 Current item metadata:', {
        name: itemData.Name,
        type: itemData.Type,
        seriesId: itemData.SeriesId,
        seasonId: itemData.SeasonId,
        indexNumber: itemData.IndexNumber,
        parentIndexNumber: itemData.ParentIndexNumber
      });

      if (!itemData.SeriesId) {
        console.log('❌ No SeriesId found in item metadata');
        return null;
      }

      // Get all episodes from the series
      console.log('🔍 Fetching series episodes for SeriesId:', itemData.SeriesId);
      const episodesResponse = await fetch(
        `${baseUrl}/Shows/${itemData.SeriesId}/Episodes?api_key=${apiKey}&UserId=${userId}&Fields=ParentIndexNumber,IndexNumber&SortBy=ParentIndexNumber,IndexNumber`
      );
      const episodesData = await episodesResponse.json();

      if (!episodesData.Items || episodesData.Items.length === 0) {
        console.log('❌ No episodes found for series');
        return null;
      }

      console.log(`📺 Found ${episodesData.Items.length} episodes in series`);

      // Find current episode and get next one
      const currentEpisodeIndex = episodesData.Items.findIndex((ep: any) => 
        ep.Id === currentItem.jellyfinItemId
      );

      if (currentEpisodeIndex === -1) {
        console.log('❌ Current episode not found in series episode list');
        return null;
      }

      if (currentEpisodeIndex >= episodesData.Items.length - 1) {
        console.log('📺 This is the last episode in the series');
        return null;
      }

      const nextEpisode = episodesData.Items[currentEpisodeIndex + 1];
      console.log('🎯 Found next episode:', {
        name: nextEpisode.Name,
        season: nextEpisode.ParentIndexNumber,
        episode: nextEpisode.IndexNumber
      });

      return {
        id: nextEpisode.Id,
        title: nextEpisode.Name,
        subtitle: `S${nextEpisode.ParentIndexNumber}E${nextEpisode.IndexNumber}`,
        url: `${baseUrl}/Videos/${nextEpisode.Id}/stream?api_key=${apiKey}&UserId=${userId}&DeviceId=web-player`,
        poster: nextEpisode.ImageTags?.Primary 
          ? `${baseUrl}/Items/${nextEpisode.Id}/Images/Primary?api_key=${apiKey}`
          : undefined,
        jellyfinItemId: nextEpisode.Id,
        isEpisode: true,
        seasonId: nextEpisode.SeasonId,
        seriesId: nextEpisode.SeriesId,
        indexNumber: nextEpisode.IndexNumber,
        parentIndexNumber: nextEpisode.ParentIndexNumber,
      };
    } catch (error) {
      console.error('❌ Error fetching next episode:', error);
      return null;
    }
  }, [currentItem, isCurrentItemEpisode]);

  const fetchPreviousEpisode = useCallback(async (): Promise<QueueItem | null> => {
    if (!currentItem?.jellyfinItemId || !isCurrentItemEpisode) {
      console.log('❌ Not an episode or missing ID for previous episode');
      return null;
    }

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');
      
      if (!baseUrl || !apiKey || !userId) {
        console.log('❌ Missing Jellyfin credentials for previous episode');
        return null;
      }

      // First, get the current item's metadata to find series info
      const itemResponse = await fetch(
        `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`
      );
      const itemData = await itemResponse.json();

      if (!itemData.SeriesId) {
        console.log('❌ No SeriesId found for previous episode');
        return null;
      }

      // Get all episodes from the series
      const episodesResponse = await fetch(
        `${baseUrl}/Shows/${itemData.SeriesId}/Episodes?api_key=${apiKey}&UserId=${userId}&Fields=ParentIndexNumber,IndexNumber&SortBy=ParentIndexNumber,IndexNumber`
      );
      const episodesData = await episodesResponse.json();

      if (!episodesData.Items || episodesData.Items.length === 0) {
        console.log('❌ No episodes found for previous episode lookup');
        return null;
      }

      // Find current episode and get previous one
      const currentEpisodeIndex = episodesData.Items.findIndex((ep: any) => 
        ep.Id === currentItem.jellyfinItemId
      );

      if (currentEpisodeIndex === -1) {
        console.log('❌ Current episode not found for previous episode lookup');
        return null;
      }

      if (currentEpisodeIndex === 0) {
        console.log('📺 This is the first episode in the series');
        return null;
      }

      const prevEpisode = episodesData.Items[currentEpisodeIndex - 1];
      console.log('🎯 Found previous episode:', {
        name: prevEpisode.Name,
        season: prevEpisode.ParentIndexNumber,
        episode: prevEpisode.IndexNumber
      });

      return {
        id: prevEpisode.Id,
        title: prevEpisode.Name,
        subtitle: `S${prevEpisode.ParentIndexNumber}E${prevEpisode.IndexNumber}`,
        url: `${baseUrl}/Videos/${prevEpisode.Id}/stream?api_key=${apiKey}&UserId=${userId}&DeviceId=web-player`,
        poster: prevEpisode.ImageTags?.Primary 
          ? `${baseUrl}/Items/${prevEpisode.Id}/Images/Primary?api_key=${apiKey}`
          : undefined,
        jellyfinItemId: prevEpisode.Id,
        isEpisode: true,
        seasonId: prevEpisode.SeasonId,
        seriesId: prevEpisode.SeriesId,
        indexNumber: prevEpisode.IndexNumber,
        parentIndexNumber: prevEpisode.ParentIndexNumber,
      };
    } catch (error) {
      console.error('❌ Error fetching previous episode:', error);
      return null;
    }
  }, [currentItem, isCurrentItemEpisode]);

  // Fetch playback info for better subtitle handling
  const fetchPlaybackInfo = useCallback(async () => {
    if (!currentItem?.jellyfinItemId) return null;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) return null;

      console.log('🔍 Fetching PlaybackInfo for:', currentItem.jellyfinItemId);

      const response = await fetch(
        `${baseUrl}/Items/${currentItem.jellyfinItemId}/PlaybackInfo`,
        {
          method: 'POST',
          headers: {
            'X-Emby-Token': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            UserId: userId,
            StartTimeTicks: currentItem.startPositionTicks || 0,
            IsPlayback: true,
            AutoOpenLiveStream: true,
            MaxStreamingBitrate: 10000000,
            DeviceProfile: {
              MaxStreamingBitrate: 120000000,
              MaxStaticBitrate: 100000000,
              DirectPlayProfiles: [
                { Container: 'webm', Type: 'Video', VideoCodec: 'vp8,vp9,av1', AudioCodec: 'vorbis,opus' },
                { Container: 'mp4,m4v', Type: 'Video', VideoCodec: 'h264,hevc,av1', AudioCodec: 'aac,mp3,mp2,opus,flac,vorbis' },
                { Container: 'hls', Type: 'Video', VideoCodec: 'av1,h264,vp9', AudioCodec: 'aac,mp2,opus,flac' },
              ],
              TranscodingProfiles: [
                {
                  Container: 'mp4',
                  Type: 'Video',
                  AudioCodec: 'aac,opus,flac',
                  VideoCodec: 'av1,h264,vp9',
                  Context: 'Streaming',
                  Protocol: 'hls',
                  MaxAudioChannels: '2',
                  MinSegments: '2',
                  BreakOnNonKeyFrames: true,
                },
              ],
            },
          }),
        }
      );

      if (response.ok) {
        const playbackInfoData = await response.json();
        console.log('✅ Got PlaybackInfo:', playbackInfoData);
        setPlaybackInfo(playbackInfoData);
        return playbackInfoData;
      }
    } catch (error) {
      console.error('❌ Error fetching PlaybackInfo:', error);
    }
    
    return null;
  }, [currentItem?.jellyfinItemId, currentItem?.startPositionTicks]);

  // Video initialization and management
  const initializeVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !currentItem) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    // Clean up existing track elements
    const existingTracks = video.querySelectorAll('track');
    existingTracks.forEach(track => track.remove());
    console.log('🧹 Cleaned up', existingTracks.length, 'existing track elements');
    
    setHlsTracksLoaded(false);

    // Fetch full playback info to get proper MediaStreams data
    const playbackInfo = await fetchPlaybackInfo();
    const mediaStreams = playbackInfo?.MediaSources?.[0]?.MediaStreams || currentItem.mediaStreams || [];

    const isHlsStream = currentItem.url.includes('.m3u8') || currentItem.url.includes('hls');
    
    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      
      hlsRef.current = hls;
      hls.loadSource(currentItem.url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, async () => {
        setTrackState(prev => ({ ...prev, selectedAudioTrack: 0, selectedSubtitleTrack: -1 }));
        
        // Log available subtitle tracks for reference
        if (mediaStreams) {
          const subtitleStreams = mediaStreams.filter((s: any) => s.Type === 'Subtitle');
          console.log('📺 Available subtitle tracks from PlaybackInfo:', subtitleStreams.length);
          subtitleStreams.forEach((stream: any) => {
            console.log(`📺 Subtitle track ${stream.Index}: ${stream.DisplayTitle} (${stream.DeliveryMethod})`);
          });
        }
        
        setHlsTracksLoaded(true);
        
        // Log available tracks
        console.log('📺 Available HLS tracks:', {
          audioTracks: hls.audioTracks,
          subtitleTracks: hls.subtitleTracks,
          videoTextTracks: Array.from(video.textTracks)
        });
        
        // Set resume position if available
        if (currentItem.startPositionTicks && currentItem.startPositionTicks > 0) {
          const resumeSeconds = currentItem.startPositionTicks / 10000000;
          console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
          video.currentTime = resumeSeconds;
        }
        // Auto-play the video
        try {
          await video.play();
          console.log('🎬 Auto-playing video');
        } catch (error) {
          console.log('❌ Auto-play failed, user interaction required:', error);
        }
      });
      
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('Fatal HLS error:', data);
          hls.destroy();
          hlsRef.current = null;
          video.src = currentItem.url;
        }
      });
    } else if (isHlsStream && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentItem.url;
      // Set resume position for native HLS
      video.addEventListener('loadedmetadata', async () => {
        console.log('📺 Available native text tracks:', {
          textTracks: Array.from(video.textTracks).map((track, index) => ({
            index,
            kind: track.kind,
            label: track.label,
            language: track.language,
            mode: track.mode,
          })),
        });
        
        if (currentItem.startPositionTicks && currentItem.startPositionTicks > 0) {
          const resumeSeconds = currentItem.startPositionTicks / 10000000;
          console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
          video.currentTime = resumeSeconds;
        }
        // Auto-play the video
        try {
          await video.play();
          console.log('🎬 Auto-playing video');
        } catch (error) {
          console.log('❌ Auto-play failed, user interaction required:', error);
        }
      }, { once: true });
    } else {
      video.src = currentItem.url;
      // Set resume position for direct streams
      video.addEventListener('loadedmetadata', async () => {
        console.log('📺 Available direct stream text tracks:', {
          textTracks: Array.from(video.textTracks).map((track, index) => ({
            index,
            kind: track.kind,
            label: track.label,
            language: track.language,
            mode: track.mode,
          })),
        });
        
        if (currentItem.startPositionTicks && currentItem.startPositionTicks > 0) {
          const resumeSeconds = currentItem.startPositionTicks / 10000000;
          console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
          video.currentTime = resumeSeconds;
        }
        // Auto-play the video
        try {
          await video.play();
          console.log('🎬 Auto-playing video');
        } catch (error) {
          console.log('❌ Auto-play failed, user interaction required:', error);
        }
      }, { once: true });
    }
  }, [currentItem, fetchPlaybackInfo]);

  // Player control handlers
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [playerState.isPlaying]);

  const handlePrevious = useCallback(async () => {
    if (currentIndex > 0) {
      onCurrentIndexChange(currentIndex - 1);
    } else if (playerState.repeatMode === 'all' && queue.length > 1) {
      onCurrentIndexChange(queue.length - 1);
    } else if (isCurrentItemEpisode && queue.length === 1) {
      try {
        const prevEpisode = await fetchPreviousEpisode();
        if (prevEpisode) {
          onQueueChange([prevEpisode]);
          onCurrentIndexChange(0);
        }
      } catch (error) {
        console.error('Failed to load previous episode:', error);
      }
    }
  }, [currentIndex, playerState.repeatMode, queue.length, isCurrentItemEpisode, onCurrentIndexChange, fetchPreviousEpisode, onQueueChange]);

  const handleNext = useCallback(async () => {
    console.log('⏭️ Next button clicked:', {
      currentIndex,
      queueLength: queue.length,
      isEpisode: isCurrentItemEpisode,
      repeatMode: playerState.repeatMode
    });

    if (currentIndex < queue.length - 1) {
      console.log('⏭️ Moving to next item in queue');
      onCurrentIndexChange(currentIndex + 1);
    } else if (playerState.repeatMode === 'all' && queue.length > 1) {
      console.log('🔄 Repeat all - going to first item');
      onCurrentIndexChange(0);
    } else if (isCurrentItemEpisode && queue.length === 1) {
      console.log('📺 Single episode - fetching next episode');
      try {
        const nextEpisode = await fetchNextEpisode();
        if (nextEpisode) {
          console.log('🎯 Loading next episode:', nextEpisode.title);
          onQueueChange([nextEpisode]);
          onCurrentIndexChange(0);
        } else {
          console.log('🛑 No next episode available');
        }
      } catch (error) {
        console.error('❌ Failed to load next episode:', error);
      }
    } else {
      console.log('🛑 No more content to play');
    }
  }, [currentIndex, queue.length, playerState.repeatMode, isCurrentItemEpisode, onCurrentIndexChange, fetchNextEpisode, onQueueChange]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setPlayerState(prev => ({ ...prev, currentTime: value[0] }));
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setPlayerState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isMuted) {
      video.volume = playerState.volume;
      setPlayerState(prev => ({ ...prev, isMuted: false }));
    } else {
      video.volume = 0;
      setPlayerState(prev => ({ ...prev, isMuted: true }));
    }
  }, [playerState.isMuted, playerState.volume]);

  // Chapter navigation
  const seekToChapter = useCallback((chapterIndex: number) => {
    const video = videoRef.current;
    if (!video || !currentItem?.chapters || chapterIndex >= currentItem.chapters.length) return;

    const chapter = currentItem.chapters[chapterIndex];
    const seekTime = ticksToSeconds(chapter.StartPositionTicks);
    
    video.currentTime = seekTime;
    setPlayerState(prev => ({ ...prev, currentTime: seekTime }));
  }, [currentItem?.chapters, ticksToSeconds]);

  const nextChapter = useCallback(() => {
    if (!getCurrentChapter || !currentItem?.chapters) return;
    
    const nextIndex = getCurrentChapter.index + 1;
    if (nextIndex < currentItem.chapters.length) {
      seekToChapter(nextIndex);
    }
  }, [getCurrentChapter, currentItem?.chapters, seekToChapter]);

  const previousChapter = useCallback(() => {
    if (!getCurrentChapter || !currentItem?.chapters) return;
    
    const video = videoRef.current;
    if (!video) return;

    const currentChapterStart = ticksToSeconds(getCurrentChapter.chapter.StartPositionTicks);
    if (video.currentTime - currentChapterStart > 3) {
      seekToChapter(getCurrentChapter.index);
    } else {
      const prevIndex = getCurrentChapter.index - 1;
      if (prevIndex >= 0) {
        seekToChapter(prevIndex);
      }
    }
  }, [getCurrentChapter, seekToChapter, ticksToSeconds]);

  // Fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    if (!uiState.isFullscreen) {
      setUiState(prev => ({ ...prev, isFullscreen: true }));
      document.body.style.overflow = 'hidden';
    } else {
      setUiState(prev => ({ ...prev, isFullscreen: false }));
      document.body.style.overflow = 'auto';
    }
  }, [uiState.isFullscreen]);

  const handleMouseMove = useCallback(() => {
    setUiState(prev => ({ ...prev, showFullscreenControls: true }));

    if (fullscreenTimeoutRef.current) {
      clearTimeout(fullscreenTimeoutRef.current);
    }

    fullscreenTimeoutRef.current = setTimeout(() => {
      setUiState(prev => ({ ...prev, showFullscreenControls: false }));
    }, 3000);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setUiState(prev => ({ ...prev, isFullscreen: false }));
      // eslint-disable-next-line react-compiler/react-compiler
      document.body.style.overflow = 'auto';
    }
  }, []);

  // Get available tracks
  const getAvailableTracks = useMemo(() => {
    const audioTracks: AudioTrack[] = [];
    const subtitleTracks: SubtitleTrack[] = [];

    // Use PlaybackInfo MediaStreams if available, otherwise fall back to currentItem
    const mediaStreams = playbackInfo?.MediaSources?.[0]?.MediaStreams || currentItem?.mediaStreams || [];

    console.log('🔍 Getting available tracks:', {
      hasPlaybackInfo: !!playbackInfo,
      hasMediaStreams: !!mediaStreams.length,
      mediaStreamsLength: mediaStreams.length,
      hasHlsRef: !!hlsRef.current,
      hlsTracksLoaded,
      hlsSubtitleTracks: hlsRef.current?.subtitleTracks?.length,
      hlsAudioTracks: hlsRef.current?.audioTracks?.length
    });

    if (mediaStreams.length > 0) {
      // Always use PlaybackInfo MediaStreams as the source of truth
      const jellyfinAudioTracks = mediaStreams.filter((stream: any) => stream.Type === 'Audio');
      const jellyfinSubtitleTracks = mediaStreams.filter((stream: any) => stream.Type === 'Subtitle');

      console.log('📺 Jellyfin tracks found:', {
        audioTracks: jellyfinAudioTracks.length,
        subtitleTracks: jellyfinSubtitleTracks.length
      });

      jellyfinAudioTracks.forEach((stream: any) => {
        audioTracks.push({
          id: stream.Index, // Use Jellyfin stream index
          label: stream.DisplayTitle || `${stream.Codec.toUpperCase()} Audio`,
          language: stream.Language || 'Unknown',
          codec: stream.Codec,
          isDefault: stream.IsDefault
        });
      });

      jellyfinSubtitleTracks.forEach((stream: any) => {
        subtitleTracks.push({
          id: stream.Index, // Use Jellyfin stream index
          label: stream.DisplayTitle || `${stream.Language || 'Unknown'} Subtitles`,
          language: stream.Language || 'Unknown',
          codec: stream.Codec,
          isDefault: stream.IsDefault
        });
      });
    }

    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 0,
        label: 'Default Audio',
        language: 'Default'
      });
    }

    console.log('📺 Final tracks:', { audioTracks, subtitleTracks });

    return { audioTracks, subtitleTracks };
  }, [playbackInfo, currentItem?.mediaStreams]);

  // Track selection handlers
  const selectAudioTrack = useCallback(async (trackId: number) => {
    // Implementation for audio track switching
    console.log('Switching to audio track:', trackId);
    
    const video = videoRef.current;
    if (!video) return;

    // For HLS streams
    if (hlsRef.current) {
      try {
        hlsRef.current.audioTrack = trackId;
        console.log('✅ HLS audio track switched to:', trackId);
      } catch (error) {
        console.error('❌ Failed to switch HLS audio track:', error);
      }
    }
    // For native video elements, audio track switching is limited
    
    setTrackState(prev => ({ ...prev, selectedAudioTrack: trackId }));
  }, []);

  const selectSubtitleTrack = useCallback(async (trackId: number) => {
    console.log('🔄 Switching to subtitle track:', trackId);
    
    const video = videoRef.current;
    if (!video || !currentItem?.jellyfinItemId) return;

    try {
      // Find the selected subtitle stream info from PlaybackInfo MediaStreams
      const mediaStreams = playbackInfo?.MediaSources?.[0]?.MediaStreams || currentItem?.mediaStreams || [];
      const selectedStream = mediaStreams.find((s: any) => s.Type === 'Subtitle' && s.Index === trackId);
      
      if (trackId >= 0 && selectedStream) {
        console.log('📺 Selected subtitle stream:', selectedStream);
        
        // For Jellyfin, we need to restart the stream with the new subtitle index
        console.log('📺 Restarting stream with subtitle index:', trackId);
        console.log('📺 Selected stream details:', {
          index: selectedStream.Index,
          displayTitle: selectedStream.DisplayTitle,
          language: selectedStream.Language,
          deliveryMethod: selectedStream.DeliveryMethod
        });
        
        // Store current playback position
        const currentTime = video.currentTime;
        const isPlaying = !video.paused;
        
        // Get new playback info with the selected subtitle
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        const response = await fetch(
          `${baseUrl}/Items/${currentItem.jellyfinItemId}/PlaybackInfo`,
          {
            method: 'POST',
            headers: {
              'X-Emby-Token': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              UserId: userId,
              StartTimeTicks: Math.floor(currentTime * 10000000), // Convert to ticks
              IsPlayback: true,
              AutoOpenLiveStream: true,
              MaxStreamingBitrate: 10000000,
              DeviceProfile: {
                MaxStreamingBitrate: 120000000,
                MaxStaticBitrate: 100000000,
                DirectPlayProfiles: [
                  { Container: 'webm', Type: 'Video', VideoCodec: 'vp8,vp9,av1', AudioCodec: 'vorbis,opus' },
                  { Container: 'mp4,m4v', Type: 'Video', VideoCodec: 'h264,hevc,av1', AudioCodec: 'aac,mp3,mp2,opus,flac,vorbis' },
                  { Container: 'hls', Type: 'Video', VideoCodec: 'av1,h264,vp9', AudioCodec: 'aac,mp2,opus,flac' },
                ],
                TranscodingProfiles: [
                  {
                    Container: 'mp4',
                    Type: 'Video',
                    AudioCodec: 'aac,opus,flac',
                    VideoCodec: 'av1,h264,vp9',
                    Context: 'Streaming',
                    Protocol: 'hls',
                    MaxAudioChannels: '2',
                    MinSegments: '2',
                    BreakOnNonKeyFrames: true,
                  },
                ],
                SubtitleProfiles: [
                  {
                    Format: 'subrip',
                    Method: 'Encode'
                  },
                  {
                    Format: 'ass',
                    Method: 'Encode'
                  },
                  {
                    Format: 'ssa',
                    Method: 'Encode'
                  }
                ],
              },
            }),
          }
        );

        if (response.ok) {
          const newPlaybackInfo = await response.json();
          console.log('📺 New PlaybackInfo response:', newPlaybackInfo);
          const newStreamUrl = newPlaybackInfo.MediaSources?.[0]?.TranscodingUrl;
          
          if (newStreamUrl) {
            const fullStreamUrl = `${baseUrl}${newStreamUrl}`;
            console.log('📺 Got new stream URL with subtitle:', fullStreamUrl);
            
            // Verify the subtitle index in the URL
            const urlMatch = fullStreamUrl.match(/SubtitleStreamIndex=(\d+)/);
            const actualSubtitleIndex = urlMatch ? parseInt(urlMatch[1]) : null;
            console.log('📺 Actual subtitle index in URL:', actualSubtitleIndex, 'vs requested:', trackId);
            
            // Update the HLS source
            if (hlsRef.current) {
              hlsRef.current.loadSource(fullStreamUrl);
              
              // Wait for manifest to be parsed, then seek to previous position
              hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                video.currentTime = currentTime;
                if (isPlaying) {
                  video.play();
                }
              });
            } else {
              // For native HLS support
              video.src = fullStreamUrl;
              video.addEventListener('loadedmetadata', () => {
                video.currentTime = currentTime;
                if (isPlaying) {
                  video.play();
                }
              }, { once: true });
            }
            
            setPlaybackInfo(newPlaybackInfo);
            console.log('✅ Stream restarted with subtitle track:', trackId);
          }
        }
      } else if (trackId === -1) {
        console.log('📺 Disabling subtitles by restarting stream without subtitle');
        
        // Store current playback position
        const currentTime = video.currentTime;
        const isPlaying = !video.paused;
        
        // Get new playback info without subtitle
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        const response = await fetch(
          `${baseUrl}/Items/${currentItem.jellyfinItemId}/PlaybackInfo`,
          {
            method: 'POST',
            headers: {
              'X-Emby-Token': apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              UserId: userId,
              StartTimeTicks: Math.floor(currentTime * 10000000),
              IsPlayback: true,
              AutoOpenLiveStream: true,
              MaxStreamingBitrate: 10000000,
              SubtitleStreamIndex: -1, // Explicitly disable subtitles
              DeviceProfile: {
                MaxStreamingBitrate: 120000000,
                MaxStaticBitrate: 100000000,
                DirectPlayProfiles: [
                  { Container: 'webm', Type: 'Video', VideoCodec: 'vp8,vp9,av1', AudioCodec: 'vorbis,opus' },
                  { Container: 'mp4,m4v', Type: 'Video', VideoCodec: 'h264,hevc,av1', AudioCodec: 'aac,mp3,mp2,opus,flac,vorbis' },
                  { Container: 'hls', Type: 'Video', VideoCodec: 'av1,h264,vp9', AudioCodec: 'aac,mp2,opus,flac' },
                ],
                TranscodingProfiles: [
                  {
                    Container: 'mp4',
                    Type: 'Video',
                    AudioCodec: 'aac,opus,flac',
                    VideoCodec: 'av1,h264,vp9',
                    Context: 'Streaming',
                    Protocol: 'hls',
                    MaxAudioChannels: '2',
                    MinSegments: '2',
                    BreakOnNonKeyFrames: true,
                  },
                ],
                SubtitleProfiles: [
                  {
                    Format: 'subrip',
                    Method: 'Encode'
                  },
                  {
                    Format: 'ass',
                    Method: 'Encode'
                  },
                  {
                    Format: 'ssa',
                    Method: 'Encode'
                  }
                ],
              },
            }),
          }
        );

        if (response.ok) {
          const newPlaybackInfo = await response.json();
          const newStreamUrl = newPlaybackInfo.MediaSources?.[0]?.TranscodingUrl;
          
          if (newStreamUrl) {
            const fullStreamUrl = `${baseUrl}${newStreamUrl}`;
            console.log('📺 Got new stream URL without subtitle:', fullStreamUrl);
            
            // Update the HLS source
            if (hlsRef.current) {
              hlsRef.current.loadSource(fullStreamUrl);
              
              hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                video.currentTime = currentTime;
                if (isPlaying) {
                  video.play();
                }
              });
            } else {
              video.src = fullStreamUrl;
              video.addEventListener('loadedmetadata', () => {
                video.currentTime = currentTime;
                if (isPlaying) {
                  video.play();
                }
              }, { once: true });
            }
            
            setPlaybackInfo(newPlaybackInfo);
            console.log('✅ Stream restarted without subtitles');
          }
        }
      }
      
      setTrackState(prev => ({ ...prev, selectedSubtitleTrack: trackId }));
    } catch (error) {
      console.error('❌ Failed to switch subtitle track:', error);
    }
  }, [playbackInfo, currentItem?.jellyfinItemId, currentItem?.mediaStreams]);

  // UI state handlers
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleClickOutside = useCallback(() => {
    if (uiState.showAudioTracks || uiState.showSubtitles || uiState.showChapters) {
      setUiState(prev => ({ 
        ...prev, 
        showAudioTracks: false, 
        showSubtitles: false, 
        showChapters: false 
      }));
    }
  }, [uiState.showAudioTracks, uiState.showSubtitles, uiState.showChapters]);

  // Effects
  useEffect(() => {
    initializeVideo();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      // Report playback stop when item changes
      const video = videoRef.current;
      if (video && currentItem?.jellyfinItemId && video.currentTime > 0) {
        const positionTicks = Math.floor(video.currentTime * 10000000);
        reportPlaybackStop(positionTicks);
      }
    };
  }, [initializeVideo, currentItem, reportPlaybackStop]);

  useEffect(() => {
    if (!currentItem?.jellyfinItemId || currentItem.chapters) {
      return;
    }

    let isCancelled = false;

    const loadChapters = async () => {
      try {
        const chapters = await fetchChapters(currentItem.jellyfinItemId!);
        
        if (!isCancelled && chapters.length > 0 && !currentItem.chapters) {
          const updatedQueue = [...queue];
          updatedQueue[currentIndex] = { ...currentItem, chapters };
          onQueueChange(updatedQueue);
        }
      } catch (error) {
        console.error('Failed to load chapters:', error);
      }
    };

    loadChapters();

    return () => {
      isCancelled = true;
    };
  }, [currentItem?.jellyfinItemId]);

  // Fetch item type from Jellyfin API
  useEffect(() => {
    if (!currentItem?.jellyfinItemId || itemTypeCache.has(currentItem.jellyfinItemId)) {
      return;
    }

    const fetchItemType = async () => {
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
          console.log('📺 Fetched item type:', data.Type, 'for', currentItem.title);
          setItemTypeCache(prev => new Map(prev).set(currentItem.jellyfinItemId!, data.Type));
        }
      } catch (error) {
        console.error('Error fetching item type:', error);
      }
    };

    fetchItemType();
  }, [currentItem?.jellyfinItemId, itemTypeCache]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
      // Report progress every 10 seconds
      if (Math.floor(video.currentTime) % 10 === 0) {
        const positionTicks = Math.floor(video.currentTime * 10000000);
        reportProgress(positionTicks, video.paused);
      }
    };
    const updateDuration = () => setPlayerState(prev => ({ ...prev, duration: video.duration || 0 }));

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
      reportPlaybackStart();
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
      if (currentItem?.jellyfinItemId) {
        const positionTicks = Math.floor(video.currentTime * 10000000);
        reportProgress(positionTicks, true);
      }
    };

    const handleEnded = async () => {
      console.log('🎬 Video ended - checking next episode options:', {
        repeatMode: playerState.repeatMode,
        currentIndex,
        queueLength: queue.length,
        isEpisode: isCurrentItemEpisode,
        currentItem: currentItem?.title
      });

      // Report playback finished
      if (currentItem?.jellyfinItemId) {
        const positionTicks = Math.floor(video.duration * 10000000);
        await reportPlaybackStop(positionTicks);
      }

      if (playerState.repeatMode === 'one') {
        console.log('🔄 Repeating current item');
        video.currentTime = 0;
        video.play();
      } else if (currentIndex < queue.length - 1) {
        console.log('⏭️ Playing next item in queue');
        handleNext();
      } else if (playerState.repeatMode === 'all' && queue.length > 1) {
        console.log('🔄 Repeat all - going to first item');
        handleNext();
      } else if (isCurrentItemEpisode && queue.length === 1) {
        console.log('📺 Single episode ended - trying to fetch next episode');
        try {
          const nextEpisode = await fetchNextEpisode();
          if (nextEpisode) {
            console.log('🎯 Auto-playing next episode:', nextEpisode.title);
            onQueueChange([nextEpisode]);
            onCurrentIndexChange(0);
          } else {
            console.log('🛑 No next episode found - stopping playback');
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
          }
        } catch (error) {
          console.error('❌ Failed to auto-play next episode:', error);
          setPlayerState(prev => ({ ...prev, isPlaying: false }));
        }
      } else {
        console.log('🛑 No more content - stopping playback');
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [currentIndex, queue.length, playerState.repeatMode, isCurrentItemEpisode, fetchNextEpisode, onQueueChange, onCurrentIndexChange, handleNext, reportProgress, reportPlaybackStart, currentItem]);

  useEffect(() => {
    if (!uiState.isFullscreen) return;

    setUiState(prev => ({ ...prev, showFullscreenControls: true }));

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    fullscreenTimeoutRef.current = setTimeout(() => {
      setUiState(prev => ({ ...prev, showFullscreenControls: false }));
    }, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      if (fullscreenTimeoutRef.current) {
        clearTimeout(fullscreenTimeoutRef.current);
      }
    };
  }, [uiState.isFullscreen, handleMouseMove, handleKeyDown]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (!currentItem) return null;

  return (
    <div className={`fixed bg-zinc-900 border-t border-zinc-800 z-50 transition-all duration-300 ${
      uiState.isFullscreen 
        ? 'inset-0 bg-black border-t-0' 
        : 'bottom-0 left-0 right-0'
    }`}>

      {/* Main Video Element */}
      <video
        ref={videoRef}
        className={
          uiState.isFullscreen
            ? "w-full h-full"
            : uiState.showMiniVideo
              ? "absolute right-4 bg-black rounded-lg cursor-pointer"
              : "hidden"
        }
        style={{
          ...(uiState.isFullscreen
            ? { backgroundColor: 'black' }
            : uiState.showMiniVideo
              ? {
                  backgroundColor: 'black',
                  width: miniPlayerSize.width,
                  height: miniPlayerSize.height,
                  resize: 'both',
                  overflow: 'hidden',
                  minWidth: '240px',
                  minHeight: '135px',
                  maxWidth: '640px',
                  maxHeight: '360px',
                  bottom: '100px'
                }
              : { backgroundColor: 'black' })
        }}
        onPlay={() => setPlayerState(prev => ({ ...prev, isPlaying: true }))}
        onPause={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))}
        onClick={uiState.isFullscreen ? handlePlayPause : toggleFullscreen}
        onMouseMove={uiState.isFullscreen ? handleMouseMove : undefined}
        controls={false}
      />

      {/* Fullscreen Click-to-Play Overlay */}
      {uiState.isFullscreen && !playerState.isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <button
            onClick={handlePlayPause}
            className="bg-black/70 text-white rounded-full p-6 hover:bg-black/90 transition-colors"
          >
            <Play className="w-12 h-12" />
          </button>
        </div>
      )}

      {/* Fullscreen Close Button */}
      {uiState.isFullscreen && (
        <div className={`absolute top-4 right-4 transition-all duration-300 z-50 ${
          uiState.showFullscreenControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            onClick={toggleFullscreen}
            className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Mini Video Overlay Controls */}
      {uiState.showMiniVideo && !uiState.isFullscreen && (
        <div
          className="absolute right-4 pointer-events-none"
          style={{
            width: miniPlayerSize.width,
            height: miniPlayerSize.height,
            bottom: '100px'
          }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              className="bg-black/70 text-white rounded-full p-3 hover:bg-black/90"
            >
              {playerState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
          </div>

          <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="bg-black/70 text-white rounded p-1 hover:bg-black/90"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="bg-black/70 text-white rounded p-1 hover:bg-black/90"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Queue Sidebar */}
      <Queue
        queue={queue}
        currentIndex={currentIndex}
        isVisible={uiState.showQueue}
        onClose={() => setUiState(prev => ({ ...prev, showQueue: false }))}
        onQueueChange={onQueueChange}
        onCurrentIndexChange={onCurrentIndexChange}
      />

      {/* Mini Player Bottom Controls */}
      <div className={`transition-all duration-300 z-40 ${
        uiState.isFullscreen 
          ? `absolute bottom-0 left-0 right-0 ${uiState.showFullscreenControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`
          : 'relative'
      }`}>
        <div className="space-y-2">
          <div className="px-5 py-5 bg-zinc-900/95 backdrop-blur-sm relative">
            <ProgressBar
              playerState={playerState}
              currentItem={currentItem}
              hoverState={hoverState}
              onSeek={handleSeek}
              onChapterSeek={seekToChapter}
              onHoverChange={setHoverState}
              formatTime={formatTime}
              ticksToSeconds={ticksToSeconds}
              getChapterAtTime={getChapterAtTime}
            />

            <div className="flex items-center justify-between">
              <MediaInfo
                currentItem={currentItem}
                getCurrentChapter={getCurrentChapter}
                isCurrentItemEpisode={isCurrentItemEpisode}
                queueLength={queue.length}
              />

              <PlayerControls
                playerState={playerState}
                currentItem={currentItem}
                isCurrentItemEpisode={isCurrentItemEpisode}
                queue={queue}
                currentIndex={currentIndex}
                onPlayPause={handlePlayPause}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onPreviousChapter={previousChapter}
                onNextChapter={nextChapter}
                onShuffleToggle={() => setPlayerState(prev => ({ ...prev, isShuffled: !prev.isShuffled }))}
                onRepeatModeChange={() => {
                  const modes: Array<typeof playerState.repeatMode> = ['none', 'all', 'one'];
                  const currentIndex = modes.indexOf(playerState.repeatMode);
                  setPlayerState(prev => ({ ...prev, repeatMode: modes[(currentIndex + 1) % modes.length] }));
                }}
              />

              <TrackSelectors
                playerState={playerState}
                uiState={uiState}
                trackState={trackState}
                currentItem={currentItem}
                audioTracks={getAvailableTracks.audioTracks}
                subtitleTracks={getAvailableTracks.subtitleTracks}
                onVolumeChange={handleVolumeChange}
                onToggleMute={toggleMute}
                onSelectAudioTrack={selectAudioTrack}
                onSelectSubtitleTrack={selectSubtitleTrack}
                onSeekToChapter={seekToChapter}
                onToggleQueue={() => setUiState(prev => ({ ...prev, showQueue: !prev.showQueue }))}
                onToggleMiniVideo={() => setUiState(prev => ({ ...prev, showMiniVideo: !prev.showMiniVideo }))}
                onToggleFullscreen={toggleFullscreen}
                onClose={onClose}
                onUIStateChange={updateUIState}
                formatTime={formatTime}
                ticksToSeconds={ticksToSeconds}
                getCurrentChapter={getCurrentChapter}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
