import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Pause, Play, X, Expand } from 'lucide-react';
import Hls from 'hls.js';

import { Queue } from './Queue';
import { PlayerControls } from './PlayerControls';
import { ProgressBar } from './ProgressBar';
import { MediaInfo } from './MediaInfo';
import { TrackSelectors } from './TrackSelectors';
import { PlaybackOptionsBottomSheet } from './PlaybackOptionsBottomSheet';

import {
  AudioTrack,
  Chapter,
  HoverState,
  MiniPlayerProps,
  PlayerState,
  QueueItem,
  SubtitleTrack,
  TrackState,
  UIState,
  PlaybackOptions,
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
    showPlaybackOptions: false,
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

  const [itemTypeCache, setItemTypeCache] = useState<Map<string, string>>(
    new Map(),
  );
  const [hlsTracksLoaded, setHlsTracksLoaded] = useState(false);
  const [playbackInfo, setPlaybackInfo] = useState<any>(null);

  // New state for simplified QueueItem interface
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [mediaStreams, setMediaStreams] = useState<any[]>([]);
  const [playSessionId, setPlaySessionId] = useState<string>('');
  const [startPositionTicks, setStartPositionTicks] = useState<number>(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Playback options state
  const [playbackOptions, setPlaybackOptions] = useState<PlaybackOptions>({
    selectedBitrate: null, // Auto/max quality by default
    availableBitrates: [],
    aspectRatio: 'auto',
    playbackSpeed: 1,
    subtitleOffset: 0,
  });

  const isCurrentItemEpisode = useMemo(() => {
    console.log('🔍 Checking if current item is episode:', {
      title: currentItem?.title,
      jellyfinItemId: currentItem?.jellyfinItemId,
      itemType: itemTypeCache.get(currentItem?.jellyfinItemId || ''),
    });

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
  const reportProgress = useCallback(
    async (positionTicks: number, isPaused: boolean = false) => {
      if (!currentItem?.jellyfinItemId || !playSessionId) return;

      try {
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        // Determine actual play method based on media source
        const mediaSource = playbackInfo?.MediaSources?.[0];
        let playMethod = 'DirectStream';
        if (mediaSource?.TranscodingUrl) {
          playMethod = 'Transcode';
        } else if (mediaSource?.SupportsDirectPlay) {
          playMethod = 'DirectPlay';
        }

        console.log('📊 Reporting progress:', {
          positionTicks,
          isPaused,
          playMethod,
          sessionId: playSessionId,
        });

        await fetch(`${baseUrl}/Sessions/Playing/Progress`, {
          method: 'POST',
          headers: {
            'X-Emby-Token': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ItemId: currentItem.jellyfinItemId,
            PositionTicks: positionTicks,
            PlaySessionId: playSessionId,
            MediaSourceId: currentItem.jellyfinItemId,
            CanSeek: true,
            IsPaused: isPaused,
            IsMuted: playerState.isMuted,
            VolumeLevel: Math.round(playerState.volume * 100),
            PlayMethod: playMethod,
            RepeatMode: 'RepeatNone',
          }),
        });
      } catch (error) {
        console.error('Error reporting progress:', error);
      }
    },
    [
      currentItem,
      playerState.isMuted,
      playerState.volume,
      playSessionId,
      playbackInfo,
    ],
  );

  const reportPlaybackStart = useCallback(async () => {
    if (!currentItem?.jellyfinItemId || !playSessionId) return;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) return;

      // Determine actual play method based on media source
      const mediaSource = playbackInfo?.MediaSources?.[0];
      let playMethod = 'DirectStream';
      if (mediaSource?.TranscodingUrl) {
        playMethod = 'Transcode';
      } else if (mediaSource?.SupportsDirectPlay) {
        playMethod = 'DirectPlay';
      }

      console.log('▶️ Reporting playback start:', {
        itemId: currentItem.jellyfinItemId,
        playMethod,
        sessionId: playSessionId,
      });

      await fetch(`${baseUrl}/Sessions/Playing`, {
        method: 'POST',
        headers: {
          'X-Emby-Token': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ItemId: currentItem.jellyfinItemId,
          PlaySessionId: playSessionId,
          MediaSourceId: currentItem.jellyfinItemId,
          CanSeek: true,
          IsPaused: false,
          IsMuted: playerState.isMuted,
          VolumeLevel: Math.round(playerState.volume * 100),
          PlayMethod: playMethod,
          RepeatMode: 'RepeatNone',
        }),
      });
    } catch (error) {
      console.error('Error reporting playback start:', error);
    }
  }, [
    currentItem,
    playerState.isMuted,
    playerState.volume,
    playSessionId,
    playbackInfo,
  ]);

  const reportPlaybackStop = useCallback(
    async (positionTicks: number) => {
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
            PlaySessionId: playSessionId,
            MediaSourceId: currentItem.jellyfinItemId,
          }),
        });
      } catch (error) {
        console.error('Error reporting playback stop:', error);
      }
    },
    [currentItem],
  );

  const getCurrentChapter = useMemo(() => {
    if (!chapters || chapters.length === 0) return null;

    const currentTimeTicks = playerState.currentTime * 10000000;

    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTimeTicks >= chapters[i].StartPositionTicks) {
        return { index: i, chapter: chapters[i] };
      }
    }

    return { index: 0, chapter: chapters[0] };
  }, [chapters, playerState.currentTime]);

  const getChapterAtTime = useCallback(
    (timeInSeconds: number): Chapter | null => {
      if (!chapters || chapters.length === 0) return null;

      const timeTicks = timeInSeconds * 10000000;

      for (let i = chapters.length - 1; i >= 0; i--) {
        if (timeTicks >= chapters[i].StartPositionTicks) {
          return chapters[i];
        }
      }

      return chapters[0];
    },
    [chapters],
  );

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // API Functions
  const fetchChapters = useCallback(
    async (itemId: string): Promise<Chapter[]> => {
      if (chaptersCache.current.has(itemId)) {
        return chaptersCache.current.get(itemId)!;
      }

      try {
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');

        if (!baseUrl || !apiKey) return [];

        const response = await fetch(
          `${baseUrl}/Items/${itemId}?api_key=${apiKey}&Fields=Chapters`,
        );
        const data = await response.json();

        const chapters = data.Chapters || [];
        chaptersCache.current.set(itemId, chapters);

        return chapters;
      } catch (error) {
        console.error('Error fetching chapters:', error);
        return [];
      }
    },
    [],
  );

  const fetchNextEpisode = useCallback(async (): Promise<QueueItem | null> => {
    if (!currentItem?.jellyfinItemId || !isCurrentItemEpisode) {
      console.log('❌ Not an episode or missing ID:', {
        jellyfinItemId: currentItem?.jellyfinItemId,
        isEpisode: isCurrentItemEpisode,
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

      console.log(
        '🔍 Fetching episode metadata for:',
        currentItem.jellyfinItemId,
      );

      // First, get the current item's metadata to find series info
      const itemResponse = await fetch(
        `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`,
      );
      const itemData = await itemResponse.json();

      console.log('📺 Current item metadata:', {
        name: itemData.Name,
        type: itemData.Type,
        seriesId: itemData.SeriesId,
        seasonId: itemData.SeasonId,
        indexNumber: itemData.IndexNumber,
        parentIndexNumber: itemData.ParentIndexNumber,
      });

      if (!itemData.SeriesId) {
        console.log('❌ No SeriesId found in item metadata');
        return null;
      }

      // Get all episodes from the series
      console.log(
        '🔍 Fetching series episodes for SeriesId:',
        itemData.SeriesId,
      );
      const episodesResponse = await fetch(
        `${baseUrl}/Shows/${itemData.SeriesId}/Episodes?api_key=${apiKey}&UserId=${userId}&Fields=ParentIndexNumber,IndexNumber&SortBy=ParentIndexNumber,IndexNumber`,
      );
      const episodesData = await episodesResponse.json();

      if (!episodesData.Items || episodesData.Items.length === 0) {
        console.log('❌ No episodes found for series');
        return null;
      }

      console.log(`📺 Found ${episodesData.Items.length} episodes in series`);

      // Find current episode and get next one
      const currentEpisodeIndex = episodesData.Items.findIndex(
        (ep: any) => ep.Id === currentItem.jellyfinItemId,
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
        episode: nextEpisode.IndexNumber,
      });

      return {
        jellyfinItemId: nextEpisode.Id,
        title: nextEpisode.Name,
      };
    } catch (error) {
      console.error('❌ Error fetching next episode:', error);
      return null;
    }
  }, [currentItem, isCurrentItemEpisode]);

  const fetchPreviousEpisode =
    useCallback(async (): Promise<QueueItem | null> => {
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
          `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`,
        );
        const itemData = await itemResponse.json();

        if (!itemData.SeriesId) {
          console.log('❌ No SeriesId found for previous episode');
          return null;
        }

        // Get all episodes from the series
        const episodesResponse = await fetch(
          `${baseUrl}/Shows/${itemData.SeriesId}/Episodes?api_key=${apiKey}&UserId=${userId}&Fields=ParentIndexNumber,IndexNumber&SortBy=ParentIndexNumber,IndexNumber`,
        );
        const episodesData = await episodesResponse.json();

        if (!episodesData.Items || episodesData.Items.length === 0) {
          console.log('❌ No episodes found for previous episode lookup');
          return null;
        }

        // Find current episode and get previous one
        const currentEpisodeIndex = episodesData.Items.findIndex(
          (ep: any) => ep.Id === currentItem.jellyfinItemId,
        );

        if (currentEpisodeIndex === -1) {
          console.log(
            '❌ Current episode not found for previous episode lookup',
          );
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
          episode: prevEpisode.IndexNumber,
        });

        return {
          jellyfinItemId: prevEpisode.Id,
          title: prevEpisode.Name,
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
            StartTimeTicks: startPositionTicks || 0,
            IsPlayback: true,
            AutoOpenLiveStream: true,
            MaxStreamingBitrate: 10000000,
            DeviceProfile: {
              MaxStreamingBitrate: 120000000,
              MaxStaticBitrate: 100000000,
              DirectPlayProfiles: [
                {
                  Container: 'webm',
                  Type: 'Video',
                  VideoCodec: 'vp8,vp9,av1',
                  AudioCodec: 'vorbis,opus',
                },
                {
                  Container: 'mp4,m4v',
                  Type: 'Video',
                  VideoCodec: 'h264,hevc,av1',
                  AudioCodec: 'aac,mp3,mp2,opus,flac,vorbis',
                },
                {
                  Container: 'hls',
                  Type: 'Video',
                  VideoCodec: 'av1,h264,vp9',
                  AudioCodec: 'aac,mp2,opus,flac',
                },
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
        },
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
  }, [currentItem?.jellyfinItemId, startPositionTicks]);

  // Helper functions for simplified QueueItem interface
  const generateStreamUrl = useCallback((playbackInfo: any): string => {
    if (!playbackInfo?.MediaSources?.[0]) return '';

    const baseUrl = localStorage.getItem('jellyfin_server_url');
    const apiKey = localStorage.getItem('jellyfin_api_key');
    const mediaSource = playbackInfo.MediaSources[0];

    if (mediaSource.SupportsDirectPlay) {
      return `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&Static=true`;
    } else if (mediaSource.TranscodingUrl) {
      return `${baseUrl}${mediaSource.TranscodingUrl}`;
    } else if (mediaSource.SupportsDirectStream) {
      return `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}`;
    }
    return '';
  }, []);

  const fetchItemMetadata = useCallback(async () => {
    if (!currentItem?.jellyfinItemId) return;

    try {
      const baseUrl = localStorage.getItem('jellyfin_server_url');
      const apiKey = localStorage.getItem('jellyfin_api_key');
      const userId = localStorage.getItem('jellyfin_user_id');

      if (!baseUrl || !apiKey || !userId) return;

      // Fetch item details including resume position
      const response = await fetch(
        `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`,
      );

      if (response.ok) {
        const data = await response.json();
        setStartPositionTicks(data.UserData?.PlaybackPositionTicks || 0);

        // Cache item type for episode detection
        setItemTypeCache((prev) =>
          new Map(prev).set(currentItem.jellyfinItemId, data.Type),
        );

        // Fetch chapters if available
        if (data.Chapters?.length > 0) {
          setChapters(data.Chapters);
        }
      }
    } catch (error) {
      console.error('Error fetching item metadata:', error);
    }
  }, [currentItem?.jellyfinItemId]);

  const initializePlaybackSession = useCallback(async () => {
    if (!currentItem?.jellyfinItemId) return null;

    // First fetch metadata
    await fetchItemMetadata();

    // Then fetch playback info
    const playbackInfoResult = await fetchPlaybackInfo();
    if (playbackInfoResult) {
      setPlaybackInfo(playbackInfoResult);
      setPlaySessionId(playbackInfoResult.PlaySessionId || '');

      // Generate stream URL
      const url = generateStreamUrl(playbackInfoResult);
      setStreamUrl(url);

      // Set media streams
      if (playbackInfoResult.MediaSources?.[0]?.MediaStreams) {
        setMediaStreams(playbackInfoResult.MediaSources[0].MediaStreams);
      }

      return url;
    }
    return null;
  }, [
    currentItem?.jellyfinItemId,
    fetchItemMetadata,
    fetchPlaybackInfo,
    generateStreamUrl,
  ]);

  // Simple HLS source reload for track switching (without API calls)
  const reloadHlsSource = useCallback(
    (newUrl: string, currentTime: number, isPlaying: boolean) => {
      const video = videoRef.current;
      if (!video || !hlsRef.current) return;

      console.log('🔄 Reloading HLS source without API calls');

      hlsRef.current.loadSource(newUrl);

      const handleManifestParsed = () => {
        video.currentTime = currentTime;
        if (isPlaying) {
          video.play();
        }
        setTrackState((prev) => ({ ...prev, isSwitchingTracks: false }));
        hlsRef.current?.off(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
      };

      hlsRef.current.on(Hls.Events.MANIFEST_PARSED, handleManifestParsed);
    },
    [],
  );

  // Video initialization and management
  const initializeVideo = useCallback(
    async (url?: string, skipApiCalls = false) => {
      const video = videoRef.current;
      const videoUrl = url || streamUrl;
      if (!video || !currentItem || !videoUrl) {
        console.log('🚫 Cannot initialize video:', {
          video: !!video,
          currentItem: !!currentItem,
          videoUrl,
        });
        return;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      // Clean up existing track elements
      const existingTracks = video.querySelectorAll('track');
      existingTracks.forEach((track) => track.remove());
      console.log(
        '🧹 Cleaned up',
        existingTracks.length,
        'existing track elements',
      );

      setHlsTracksLoaded(false);

      // Only fetch playback info if not skipping API calls (e.g., during track switching)
      if (!skipApiCalls) {
        await fetchPlaybackInfo();
      }

      const isHlsStream =
        videoUrl.includes('.m3u8') || videoUrl.includes('hls');

      if (isHlsStream && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hlsRef.current = hls;
        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          setTrackState((prev) => ({
            ...prev,
            selectedAudioTrack: 0,
            selectedSubtitleTrack: -1,
          }));

          // Log available subtitle tracks for reference
          if (mediaStreams) {
            const subtitleStreams = mediaStreams.filter(
              (s: any) => s.Type === 'Subtitle',
            );
            console.log(
              '📺 Available subtitle tracks from PlaybackInfo:',
              subtitleStreams.length,
            );
            subtitleStreams.forEach((stream: any) => {
              console.log(
                `📺 Subtitle track ${stream.Index}: ${stream.DisplayTitle} (${stream.DeliveryMethod})`,
              );
            });
          }

          setHlsTracksLoaded(true);

          // Log available tracks
          console.log('📺 Available HLS tracks:', {
            audioTracks: hls.audioTracks,
            subtitleTracks: hls.subtitleTracks,
            videoTextTracks: Array.from(video.textTracks),
          });

          // Set resume position if available
          if (startPositionTicks && startPositionTicks > 0) {
            const resumeSeconds = startPositionTicks / 10000000;
            console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
            video.currentTime = resumeSeconds;
          }
          // Auto-play the video
          try {
            await video.play();
            console.log('🎬 Auto-playing video');
          } catch (error) {
            console.log(
              '❌ Auto-play failed, user interaction required:',
              error,
            );
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('Fatal HLS error:', data);
            hls.destroy();
            hlsRef.current = null;
            video.src = videoUrl;
          }
        });
      } else if (
        isHlsStream &&
        video.canPlayType('application/vnd.apple.mpegurl')
      ) {
        video.src = videoUrl;
        // Set resume position for native HLS
        video.addEventListener(
          'loadedmetadata',
          async () => {
            console.log('📺 Available native text tracks:', {
              textTracks: Array.from(video.textTracks).map((track, index) => ({
                index,
                kind: track.kind,
                label: track.label,
                language: track.language,
                mode: track.mode,
              })),
            });

            if (startPositionTicks && startPositionTicks > 0) {
              const resumeSeconds = startPositionTicks / 10000000;
              console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
              video.currentTime = resumeSeconds;
            }
            // Auto-play the video
            try {
              await video.play();
              console.log('🎬 Auto-playing video');
            } catch (error) {
              console.log(
                '❌ Auto-play failed, user interaction required:',
                error,
              );
            }
          },
          { once: true },
        );
      } else {
        video.src = videoUrl;
        // Set resume position for direct streams
        video.addEventListener(
          'loadedmetadata',
          async () => {
            console.log('📺 Available direct stream text tracks:', {
              textTracks: Array.from(video.textTracks).map((track, index) => ({
                index,
                kind: track.kind,
                label: track.label,
                language: track.language,
                mode: track.mode,
              })),
            });

            if (startPositionTicks && startPositionTicks > 0) {
              const resumeSeconds = startPositionTicks / 10000000;
              console.log('🎬 Resuming from:', resumeSeconds, 'seconds');
              video.currentTime = resumeSeconds;
            }
            // Auto-play the video
            try {
              await video.play();
              console.log('🎬 Auto-playing video');
            } catch (error) {
              console.log(
                '❌ Auto-play failed, user interaction required:',
                error,
              );
            }
          },
          { once: true },
        );
      }
    },
    [currentItem, fetchPlaybackInfo],
  );

  // Player control handlers
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
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
  }, [
    currentIndex,
    playerState.repeatMode,
    queue.length,
    isCurrentItemEpisode,
    onCurrentIndexChange,
    fetchPreviousEpisode,
    onQueueChange,
  ]);

  const handleNext = useCallback(async () => {
    console.log('⏭️ Next button clicked:', {
      currentIndex,
      queueLength: queue.length,
      isEpisode: isCurrentItemEpisode,
      repeatMode: playerState.repeatMode,
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
  }, [
    currentIndex,
    queue.length,
    playerState.repeatMode,
    isCurrentItemEpisode,
    onCurrentIndexChange,
    fetchNextEpisode,
    onQueueChange,
  ]);

  const handleSeek = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setPlayerState((prev) => ({ ...prev, currentTime: value[0] }));
  }, []);

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setPlayerState((prev) => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isMuted) {
      video.volume = playerState.volume;
      setPlayerState((prev) => ({ ...prev, isMuted: false }));
    } else {
      video.volume = 0;
      setPlayerState((prev) => ({ ...prev, isMuted: true }));
    }
  }, [playerState.isMuted, playerState.volume]);

  // Chapter navigation
  const seekToChapter = useCallback(
    (chapterIndex: number) => {
      const video = videoRef.current;
      if (!video || !chapters || chapterIndex >= chapters.length) return;

      const chapter = chapters[chapterIndex];
      const seekTime = ticksToSeconds(chapter.StartPositionTicks);

      video.currentTime = seekTime;
      setPlayerState((prev) => ({ ...prev, currentTime: seekTime }));
    },
    [chapters, ticksToSeconds],
  );

  const nextChapter = useCallback(() => {
    if (!getCurrentChapter || !chapters) return;

    const nextIndex = getCurrentChapter.index + 1;
    if (nextIndex < chapters.length) {
      seekToChapter(nextIndex);
    }
  }, [getCurrentChapter, chapters, seekToChapter]);

  const previousChapter = useCallback(() => {
    if (!getCurrentChapter || !chapters) return;

    const video = videoRef.current;
    if (!video) return;

    const currentChapterStart = ticksToSeconds(
      getCurrentChapter.chapter.StartPositionTicks,
    );
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
      setUiState((prev) => ({ ...prev, isFullscreen: true }));
      document.body.style.overflow = 'hidden';
    } else {
      setUiState((prev) => ({ ...prev, isFullscreen: false }));
      document.body.style.overflow = 'auto';
    }
  }, [uiState.isFullscreen]);

  // Browser fullscreen functionality
  const toggleBrowserFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling browser fullscreen:', error);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setUiState((prev) => ({ ...prev, showFullscreenControls: true }));

    if (fullscreenTimeoutRef.current) {
      clearTimeout(fullscreenTimeoutRef.current);
    }

    fullscreenTimeoutRef.current = setTimeout(() => {
      setUiState((prev) => ({ ...prev, showFullscreenControls: false }));
    }, 3000);
  }, []);

  // Get available tracks (moved here to avoid circular dependency)
  const getAvailableTracks = useMemo(() => {
    const audioTracks: AudioTrack[] = [];
    const subtitleTracks: SubtitleTrack[] = [];

    // Use PlaybackInfo MediaStreams if available, otherwise fall back to currentItem
    const currentMediaStreams =
      playbackInfo?.MediaSources?.[0]?.MediaStreams || mediaStreams || [];

    console.log('🔍 Getting available tracks:', {
      hasPlaybackInfo: !!playbackInfo,
      hasMediaStreams: !!currentMediaStreams.length,
      mediaStreamsLength: currentMediaStreams.length,
      hasHlsRef: !!hlsRef.current,
      hlsTracksLoaded,
      hlsSubtitleTracks: hlsRef.current?.subtitleTracks?.length,
      hlsAudioTracks: hlsRef.current?.audioTracks?.length,
    });

    if (currentMediaStreams.length > 0) {
      // Always use PlaybackInfo MediaStreams as the source of truth
      const jellyfinAudioTracks = currentMediaStreams.filter(
        (stream: any) => stream.Type === 'Audio',
      );
      const jellyfinSubtitleTracks = currentMediaStreams.filter(
        (stream: any) => stream.Type === 'Subtitle',
      );

      console.log('📺 Jellyfin tracks found:', {
        audioTracks: jellyfinAudioTracks.length,
        subtitleTracks: jellyfinSubtitleTracks.length,
      });

      jellyfinAudioTracks.forEach((stream: any) => {
        audioTracks.push({
          id: stream.Index, // Use Jellyfin stream index
          label: stream.DisplayTitle || `${stream.Codec.toUpperCase()} Audio`,
          language: stream.Language || 'Unknown',
          codec: stream.Codec,
          isDefault: stream.IsDefault,
        });
      });

      jellyfinSubtitleTracks.forEach((stream: any) => {
        subtitleTracks.push({
          id: stream.Index, // Use Jellyfin stream index
          label:
            stream.DisplayTitle || `${stream.Language || 'Unknown'} Subtitles`,
          language: stream.Language || 'Unknown',
          codec: stream.Codec,
          isDefault: stream.IsDefault,
        });
      });
    }

    if (audioTracks.length === 0) {
      audioTracks.push({
        id: 0,
        label: 'Default Audio',
        language: 'Default',
      });
    }

    console.log('📺 Final tracks:', { audioTracks, subtitleTracks });

    return { audioTracks, subtitleTracks };
  }, [playbackInfo, mediaStreams, hlsTracksLoaded]);

  // Track selection handlers (moved here to avoid circular dependency)
  const selectAudioTrack = useCallback(
    async (trackId: number) => {
      console.log('🔄 Switching to audio track:', trackId);

      const video = videoRef.current;
      if (!video || !currentItem?.jellyfinItemId || !playbackInfo) return;

      try {
        setTrackState((prev) => ({ ...prev, isSwitchingTracks: true }));

        console.log('📺 Generating new stream URL with audio track:', trackId);

        const currentTime = video.currentTime;
        const isPlaying = !video.paused;

        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');

        if (!baseUrl || !apiKey) return;

        // Use existing playback info but modify the stream URL to include audio track
        const mediaSource = playbackInfo.MediaSources?.[0];
        if (!mediaSource) return;

        let newStreamUrl: string;

        if (mediaSource.SupportsDirectPlay) {
          // For direct play, add audio stream index parameter
          newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&Static=true&AudioStreamIndex=${trackId}`;
        } else if (mediaSource.TranscodingUrl) {
          // For transcoding, modify the existing URL to replace audio track
          let transcodingUrl = mediaSource.TranscodingUrl;

          // Remove existing AudioStreamIndex if present
          transcodingUrl = transcodingUrl.replace(
            /[&?]AudioStreamIndex=\d+/g,
            '',
          );

          // Add the new AudioStreamIndex
          const separator = transcodingUrl.includes('?') ? '&' : '?';
          newStreamUrl = `${baseUrl}${transcodingUrl}${separator}AudioStreamIndex=${trackId}`;
        } else if (mediaSource.SupportsDirectStream) {
          // For direct stream, add audio stream index parameter
          newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&AudioStreamIndex=${trackId}`;
        } else {
          console.error('❌ No supported stream method found');
          return;
        }

        console.log(
          '📺 Generated new stream URL with audio track:',
          newStreamUrl,
        );

        if (hlsRef.current) {
          reloadHlsSource(newStreamUrl, currentTime, isPlaying);
        } else {
          video.src = newStreamUrl;
          video.addEventListener(
            'loadedmetadata',
            () => {
              video.currentTime = currentTime;
              if (isPlaying) {
                video.play();
              }
              setTrackState((prev) => ({ ...prev, isSwitchingTracks: false }));
            },
            { once: true },
          );
        }

        setStreamUrl(newStreamUrl);
        setTrackState((prev) => ({ ...prev, selectedAudioTrack: trackId }));
        console.log('✅ Stream restarted with audio track:', trackId);
      } catch (error) {
        console.error('❌ Failed to switch audio track:', error);
        setTrackState((prev) => ({ ...prev, isSwitchingTracks: false }));
      }
    },
    [currentItem?.jellyfinItemId, playbackInfo, reloadHlsSource],
  );

  const selectSubtitleTrack = useCallback(
    async (trackId: number) => {
      console.log('🔄 Switching to subtitle track:', trackId);

      const video = videoRef.current;
      if (!video || !currentItem?.jellyfinItemId || !playbackInfo) return;

      try {
        setTrackState((prev) => ({ ...prev, isSwitchingTracks: true }));

        console.log(
          '📺 Generating new stream URL with subtitle track:',
          trackId,
        );

        const currentTime = video.currentTime;
        const isPlaying = !video.paused;

        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');

        if (!baseUrl || !apiKey) return;

        // Use existing playback info but modify the stream URL to include subtitle track
        const mediaSource = playbackInfo.MediaSources?.[0];
        if (!mediaSource) return;

        console.log('📺 Available media source:', mediaSource);

        console.log('📺 Original TranscodingUrl:', mediaSource.TranscodingUrl);

        let newStreamUrl: string;

        if (mediaSource.SupportsDirectPlay) {
          // For direct play, add subtitle stream index parameter
          const subtitleParam =
            trackId >= 0 ? `&SubtitleStreamIndex=${trackId}` : '';
          newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&Static=true${subtitleParam}`;
          console.log('📺 Using DirectPlay method');
        } else if (mediaSource.TranscodingUrl) {
          // For transcoding, modify the existing URL to replace subtitle track
          let transcodingUrl = mediaSource.TranscodingUrl;
          console.log('📺 Before removal:', transcodingUrl);

          // Remove existing SubtitleStreamIndex if present
          transcodingUrl = transcodingUrl.replace(
            /[&?]SubtitleStreamIndex=\d+/g,
            '',
          );
          console.log('📺 After removal:', transcodingUrl);

          // Add the new SubtitleStreamIndex if trackId >= 0
          if (trackId >= 0) {
            const separator = transcodingUrl.includes('?') ? '&' : '?';
            newStreamUrl = `${baseUrl}${transcodingUrl}${separator}SubtitleStreamIndex=${trackId}`;
            console.log('📺 Added new subtitle index:', trackId);
          } else {
            newStreamUrl = `${baseUrl}${transcodingUrl}`;
            console.log('📺 Disabled subtitles (trackId -1)');
          }
          console.log('📺 Using Transcoding method');
        } else if (mediaSource.SupportsDirectStream) {
          // For direct stream, add subtitle stream index parameter
          const subtitleParam =
            trackId >= 0 ? `&SubtitleStreamIndex=${trackId}` : '';
          newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}${subtitleParam}`;
          console.log('📺 Using DirectStream method');
        } else {
          console.error('❌ No supported stream method found');
          return;
        }

        console.log('📺 Generated new stream URL with subtitle:', newStreamUrl);

        if (hlsRef.current) {
          reloadHlsSource(newStreamUrl, currentTime, isPlaying);
        } else {
          video.src = newStreamUrl;
          video.addEventListener(
            'loadedmetadata',
            () => {
              video.currentTime = currentTime;
              if (isPlaying) {
                video.play();
              }
              setTrackState((prev) => ({ ...prev, isSwitchingTracks: false }));
            },
            { once: true },
          );
        }

        setStreamUrl(newStreamUrl);
        setTrackState((prev) => ({ ...prev, selectedSubtitleTrack: trackId }));
        console.log('✅ Stream restarted with subtitle track:', trackId);
      } catch (error) {
        console.error('❌ Failed to switch subtitle track:', error);
        setTrackState((prev) => ({ ...prev, isSwitchingTracks: false }));
      }
    },
    [currentItem?.jellyfinItemId, playbackInfo, reloadHlsSource],
  );

  // Extract max bitrate from playback info
  const maxAvailableBitrate = useMemo(() => {
    if (!playbackInfo?.MediaSources?.[0]?.MediaStreams) return 120000000; // Default 120 Mbps

    const videoStreams = playbackInfo.MediaSources[0].MediaStreams.filter(
      (stream: any) => stream.Type === 'Video',
    );

    const maxBitrate = Math.max(
      ...videoStreams.map((stream: any) => stream.BitRate || 0),
      120000000, // Minimum fallback
    );

    return maxBitrate;
  }, [playbackInfo]);

  // Handle bitrate changes using existing playback info
  const handleBitrateChange = useCallback(
    (newBitrate: number | null) => {
      if (!currentItem?.jellyfinItemId || !playbackInfo) return;

      try {
        const video = videoRef.current;
        if (!video) return;

        const currentTime = video.currentTime;
        const isPlaying = !video.paused;

        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');

        if (!baseUrl || !apiKey) return;

        // Use existing playback info but modify the stream URL to include bitrate limit
        const mediaSource = playbackInfo.MediaSources?.[0];
        if (!mediaSource) return;

        let newStreamUrl: string;

        if (
          mediaSource.SupportsDirectPlay &&
          (!newBitrate || newBitrate >= maxAvailableBitrate)
        ) {
          // Use direct play for high bitrates or auto mode
          newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&Static=true`;
        } else if (mediaSource.TranscodingUrl) {
          // For transcoding, modify the existing URL to include bitrate limit
          let transcodingUrl = mediaSource.TranscodingUrl;

          // Remove existing MaxStreamingBitrate if present
          transcodingUrl = transcodingUrl.replace(
            /[&?]MaxStreamingBitrate=\d+/g,
            '',
          );

          // Add the new MaxStreamingBitrate if specified
          if (newBitrate) {
            const separator = transcodingUrl.includes('?') ? '&' : '?';
            newStreamUrl = `${baseUrl}${transcodingUrl}${separator}MaxStreamingBitrate=${newBitrate}`;
          } else {
            newStreamUrl = `${baseUrl}${transcodingUrl}`;
          }
        } else if (mediaSource.SupportsDirectStream) {
          // For direct stream, add bitrate parameter if needed
          if (newBitrate && newBitrate < maxAvailableBitrate) {
            newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&MaxStreamingBitrate=${newBitrate}`;
          } else {
            newStreamUrl = `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}`;
          }
        } else {
          console.error('❌ No supported stream method found');
          return;
        }

        console.log(
          '📺 Generated new stream URL with bitrate limit:',
          newStreamUrl,
        );

        // Reload video source
        if (hlsRef.current) {
          reloadHlsSource(newStreamUrl, currentTime, isPlaying);
        } else {
          video.src = newStreamUrl;
          video.addEventListener(
            'loadedmetadata',
            () => {
              video.currentTime = currentTime;
              if (isPlaying) {
                video.play();
              }
            },
            { once: true },
          );
        }

        setStreamUrl(newStreamUrl);
        console.log(
          '✅ Bitrate changed to:',
          newBitrate ? `${newBitrate / 1000000} Mbps` : 'Auto',
        );
      } catch (error) {
        console.error('❌ Failed to change bitrate:', error);
      }
    },
    [
      currentItem?.jellyfinItemId,
      playbackInfo,
      maxAvailableBitrate,
      reloadHlsSource,
    ],
  );

  // Playback options handlers
  const updatePlaybackOptions = useCallback(
    (updates: Partial<PlaybackOptions>) => {
      setPlaybackOptions((prev) => ({ ...prev, ...updates }));

      const video = videoRef.current;
      if (!video) return;

      // Apply bitrate changes
      if (updates.selectedBitrate !== undefined) {
        handleBitrateChange(updates.selectedBitrate);
      }

      // Apply playback speed changes immediately
      if (updates.playbackSpeed !== undefined) {
        video.playbackRate = updates.playbackSpeed;
      }

      // Aspect ratio changes are handled through state and applied via CSS

      // Apply subtitle offset changes
      if (updates.subtitleOffset !== undefined && video.textTracks.length > 0) {
        // Update subtitle timing offset for all active text tracks
        Array.from(video.textTracks).forEach((track) => {
          if (track.mode === 'showing' && track.cues) {
            // Note: TextTrack cue timing offset requires more complex implementation
            // This is a placeholder for subtitle timing adjustment
            console.log('📺 Subtitle offset changed:', updates.subtitleOffset);
          }
        });
      }
    },
    [handleBitrateChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Prevent default behavior for our handled keys
      const preventDefaultKeys = [
        'Space',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'KeyK',
        'KeyJ',
        'KeyL',
        'KeyF',
        'KeyT',
        'KeyM',
        'KeyC',
        'Digit0',
        'Digit1',
        'Digit2',
        'Digit3',
        'Digit4',
        'Digit5',
        'Digit6',
        'Digit7',
        'Digit8',
        'Digit9',
        'Comma',
        'Period',
        'Home',
        'End',
        'Escape',
      ];

      if (preventDefaultKeys.includes(e.code) || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }

      switch (e.code) {
        // Play/Pause
        case 'Space':
        case 'KeyK':
          handlePlayPause();
          break;

        // Seek backward/forward
        case 'ArrowLeft':
        case 'KeyJ':
          video.currentTime = Math.max(
            0,
            video.currentTime - (e.shiftKey ? 10 : 5),
          );
          break;

        case 'ArrowRight':
        case 'KeyL':
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + (e.shiftKey ? 10 : 5),
          );
          break;

        // Volume control
        case 'ArrowUp':
          e.preventDefault();
          const newVolumeUp = Math.min(1, playerState.volume + 0.1);
          video.volume = newVolumeUp;
          setPlayerState((prev) => ({
            ...prev,
            volume: newVolumeUp,
            isMuted: false,
          }));
          break;

        case 'ArrowDown':
          e.preventDefault();
          const newVolumeDown = Math.max(0, playerState.volume - 0.1);
          video.volume = newVolumeDown;
          setPlayerState((prev) => ({
            ...prev,
            volume: newVolumeDown,
            isMuted: newVolumeDown === 0,
          }));
          break;

        // Mute/Unmute
        case 'KeyM':
          toggleMute();
          break;

        // Fullscreen
        case 'KeyF':
          toggleFullscreen();
          break;

        // Browser fullscreen
        case 'KeyT':
          if (uiState.isFullscreen) {
            toggleBrowserFullscreen();
          }
          break;

        // Picture in Picture
        case 'KeyI':
          if (!uiState.isFullscreen) {
            setUiState((prev) => ({
              ...prev,
              showMiniVideo: !prev.showMiniVideo,
            }));
          }
          break;

        // Captions/Subtitles toggle
        case 'KeyC':
          if (getAvailableTracks.subtitleTracks.length > 0) {
            const currentTrack = trackState.selectedSubtitleTrack;
            const nextTrack =
              currentTrack === -1
                ? getAvailableTracks.subtitleTracks[0].id
                : -1;
            selectSubtitleTrack(nextTrack);
          }
          break;

        // Speed controls
        case 'Comma': { // < key - decrease speed
          const currentSpeed = playbackOptions.playbackSpeed;
          const newSpeedDown = Math.max(0.25, currentSpeed - 0.25);
          updatePlaybackOptions({ playbackSpeed: newSpeedDown });
          break;
        }

        case 'Period': { // > key - increase speed
          const currentSpeedUp = playbackOptions.playbackSpeed;
          const newSpeedUp = Math.min(2, currentSpeedUp + 0.25);
          updatePlaybackOptions({ playbackSpeed: newSpeedUp });
          break;
        }

        // Jump to specific time (0-9 keys = 0%-90%)
        case 'Digit0':
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9': {
          const digit = parseInt(e.code.slice(-1));
          const percentage = digit / 10;
          video.currentTime = video.duration * percentage;
          break;
        }

        // Go to beginning/end
        case 'Home':
          video.currentTime = 0;
          break;

        case 'End':
          video.currentTime = video.duration;
          break;

        // Next/Previous (if available)
        case 'KeyN':
          if (e.shiftKey) {
            handleNext();
          }
          break;

        case 'KeyP':
          if (e.shiftKey) {
            handlePrevious();
          }
          break;

        // Chapter navigation
        case 'KeyW':
          nextChapter();
          break;

        case 'KeyQ':
          previousChapter();
          break;

        // Exit fullscreen
        case 'Escape':
          if (uiState.isFullscreen) {
            setUiState((prev) => ({ ...prev, isFullscreen: false }));
            document.body.style.overflow = 'auto';
          }
          break;

        default:
          break;
      }
    },
    [
      handlePlayPause,
      playerState.volume,
      toggleMute,
      toggleFullscreen,
      toggleBrowserFullscreen,
      uiState.isFullscreen,
      uiState.showMiniVideo,
      getAvailableTracks.subtitleTracks,
      trackState.selectedSubtitleTrack,
      selectSubtitleTrack,
      playbackOptions.playbackSpeed,
      updatePlaybackOptions,
      handleNext,
      handlePrevious,
      nextChapter,
      previousChapter,
    ],
  );

  // UI state handlers
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleClickOutside = useCallback(() => {
    if (
      uiState.showAudioTracks ||
      uiState.showSubtitles ||
      uiState.showChapters ||
      uiState.showPlaybackOptions
    ) {
      setUiState((prev) => ({
        ...prev,
        showAudioTracks: false,
        showSubtitles: false,
        showChapters: false,
        showPlaybackOptions: false,
      }));
    }
  }, [
    uiState.showAudioTracks,
    uiState.showSubtitles,
    uiState.showChapters,
    uiState.showPlaybackOptions,
  ]);

  // Effects
  useEffect(() => {
    const initialize = async () => {
      const url = await initializePlaybackSession();
      if (url) {
        await initializeVideo(url);
      }
    };

    initialize();

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
  }, [
    initializePlaybackSession,
    initializeVideo,
    currentItem,
    reportPlaybackStop,
  ]);

  useEffect(() => {
    if (!currentItem?.jellyfinItemId || chapters.length > 0) {
      return;
    }

    let isCancelled = false;

    const loadChapters = async () => {
      try {
        const fetchedChapters = await fetchChapters(
          currentItem.jellyfinItemId!,
        );

        if (!isCancelled && fetchedChapters.length > 0) {
          setChapters(fetchedChapters);
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
    if (
      !currentItem?.jellyfinItemId ||
      itemTypeCache.has(currentItem.jellyfinItemId)
    ) {
      return;
    }

    const fetchItemType = async () => {
      try {
        const baseUrl = localStorage.getItem('jellyfin_server_url');
        const apiKey = localStorage.getItem('jellyfin_api_key');
        const userId = localStorage.getItem('jellyfin_user_id');

        if (!baseUrl || !apiKey || !userId) return;

        const response = await fetch(
          `${baseUrl}/Items/${currentItem.jellyfinItemId}?api_key=${apiKey}&UserId=${userId}`,
        );

        if (response.ok) {
          const data = await response.json();
          console.log(
            '📺 Fetched item type:',
            data.Type,
            'for',
            currentItem.title,
          );
          setItemTypeCache((prev) =>
            new Map(prev).set(currentItem.jellyfinItemId!, data.Type),
          );
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
      setPlayerState((prev) => ({ ...prev, currentTime: video.currentTime }));
      // Report progress every 10 seconds
      if (Math.floor(video.currentTime) % 10 === 0) {
        const positionTicks = Math.floor(video.currentTime * 10000000);
        reportProgress(positionTicks, video.paused);
      }
    };
    const updateDuration = () =>
      setPlayerState((prev) => ({ ...prev, duration: video.duration || 0 }));

    const handlePlay = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      reportPlaybackStart();
    };

    const handlePause = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
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
        currentItem: currentItem?.title,
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
            setPlayerState((prev) => ({ ...prev, isPlaying: false }));
          }
        } catch (error) {
          console.error('❌ Failed to auto-play next episode:', error);
          setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        }
      } else {
        console.log('🛑 No more content - stopping playback');
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
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
  }, [
    currentIndex,
    queue.length,
    playerState.repeatMode,
    isCurrentItemEpisode,
    fetchNextEpisode,
    onQueueChange,
    onCurrentIndexChange,
    handleNext,
    reportProgress,
    reportPlaybackStart,
    currentItem,
  ]);

  // Keyboard shortcuts effect (always active when player is mounted)
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Fullscreen mouse/timeout effects
  useEffect(() => {
    if (!uiState.isFullscreen) return;

    setUiState((prev) => ({ ...prev, showFullscreenControls: true }));

    document.addEventListener('mousemove', handleMouseMove);

    fullscreenTimeoutRef.current = setTimeout(() => {
      setUiState((prev) => ({ ...prev, showFullscreenControls: false }));
    }, 3000);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (fullscreenTimeoutRef.current) {
        clearTimeout(fullscreenTimeoutRef.current);
      }
    };
  }, [uiState.isFullscreen, handleMouseMove]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (!currentItem) return null;

  return (
    <div
      className={`fixed bg-zinc-900 border-t border-zinc-800 z-50 transition-all duration-300 ${
        uiState.isFullscreen
          ? 'inset-0 bg-black border-t-0'
          : 'bottom-0 left-0 right-0'
      }`}
    >
      {/* Main Video Element */}
      <video
        ref={videoRef}
        className={
          uiState.isFullscreen
            ? 'w-full h-full'
            : uiState.showMiniVideo
              ? 'absolute right-4 bg-black rounded-lg cursor-pointer'
              : 'hidden'
        }
        style={{
          ...(uiState.isFullscreen
            ? {
                backgroundColor: 'black',
                aspectRatio:
                  playbackOptions.aspectRatio === 'auto'
                    ? ''
                    : playbackOptions.aspectRatio,
                objectFit:
                  playbackOptions.aspectRatio === 'auto' ? 'contain' : 'fill',
              }
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
                  bottom: '100px',
                  aspectRatio:
                    playbackOptions.aspectRatio === 'auto'
                      ? ''
                      : playbackOptions.aspectRatio,
                  objectFit:
                    playbackOptions.aspectRatio === 'auto' ? 'contain' : 'fill',
                }
              : {
                  backgroundColor: 'black',
                  aspectRatio:
                    playbackOptions.aspectRatio === 'auto'
                      ? ''
                      : playbackOptions.aspectRatio,
                  objectFit:
                    playbackOptions.aspectRatio === 'auto' ? 'contain' : 'fill',
                }),
        }}
        onPlay={() => setPlayerState((prev) => ({ ...prev, isPlaying: true }))}
        onPause={() =>
          setPlayerState((prev) => ({ ...prev, isPlaying: false }))
        }
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

      {/* Fullscreen Top Controls */}
      {uiState.isFullscreen && (
        <div
          className={`absolute top-4 right-4 flex gap-2 transition-all duration-300 z-50 ${
            uiState.showFullscreenControls
              ? 'opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={toggleBrowserFullscreen}
            className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition-colors"
            title="Browser Fullscreen"
          >
            <Expand className="w-6 h-6" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition-colors"
            title="Exit Fullscreen"
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
            bottom: '100px',
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
              {playerState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
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
        onClose={() => setUiState((prev) => ({ ...prev, showQueue: false }))}
        onQueueChange={onQueueChange}
        onCurrentIndexChange={onCurrentIndexChange}
      />

      {/* Mini Player Bottom Controls */}
      <div
        className={`transition-all duration-300 z-40 ${
          uiState.isFullscreen
            ? `absolute bottom-0 left-0 right-0 ${uiState.showFullscreenControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`
            : 'relative'
        }`}
      >
        <div className="space-y-2">
          <div className="px-5 py-5 bg-zinc-900/95 backdrop-blur-sm relative">
            <ProgressBar
              playerState={playerState}
              chapters={chapters}
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
                isCurrentItemEpisode={isCurrentItemEpisode}
                queue={queue}
                currentIndex={currentIndex}
                chapters={chapters}
                onPlayPause={handlePlayPause}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onPreviousChapter={previousChapter}
                onNextChapter={nextChapter}
                onShuffleToggle={() =>
                  setPlayerState((prev) => ({
                    ...prev,
                    isShuffled: !prev.isShuffled,
                  }))
                }
                onRepeatModeChange={() => {
                  const modes: Array<typeof playerState.repeatMode> = [
                    'none',
                    'all',
                    'one',
                  ];
                  const currentIndex = modes.indexOf(playerState.repeatMode);
                  setPlayerState((prev) => ({
                    ...prev,
                    repeatMode: modes[(currentIndex + 1) % modes.length],
                  }));
                }}
              />

              <div className="flex items-center gap-1 flex-1 justify-end">
                <TrackSelectors
                  playerState={playerState}
                  uiState={uiState}
                  trackState={trackState}
                  chapters={chapters}
                  audioTracks={getAvailableTracks.audioTracks}
                  subtitleTracks={getAvailableTracks.subtitleTracks}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={toggleMute}
                  onSelectAudioTrack={selectAudioTrack}
                  onSelectSubtitleTrack={selectSubtitleTrack}
                  onSeekToChapter={seekToChapter}
                  onToggleQueue={() =>
                    setUiState((prev) => ({
                      ...prev,
                      showQueue: !prev.showQueue,
                    }))
                  }
                  onToggleMiniVideo={() =>
                    setUiState((prev) => ({
                      ...prev,
                      showMiniVideo: !prev.showMiniVideo,
                    }))
                  }
                  onToggleFullscreen={toggleFullscreen}
                  onToggleBrowserFullscreen={toggleBrowserFullscreen}
                  onClose={onClose}
                  onUIStateChange={updateUIState}
                  formatTime={formatTime}
                  ticksToSeconds={ticksToSeconds}
                  getCurrentChapter={getCurrentChapter}
                />

                <PlaybackOptionsBottomSheet
                  playbackOptions={playbackOptions}
                  isOpen={uiState.showPlaybackOptions}
                  onOpenChange={(open) =>
                    setUiState((prev) => ({
                      ...prev,
                      showPlaybackOptions: open,
                    }))
                  }
                  onPlaybackOptionsChange={updatePlaybackOptions}
                  maxAvailableBitrate={maxAvailableBitrate}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
