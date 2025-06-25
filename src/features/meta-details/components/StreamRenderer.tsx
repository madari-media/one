import React, { useEffect, useState } from 'react';
import { MetaExtended } from '@/service/type';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, Copy, Download, Loader2, Play, Plus } from 'lucide-react';
import { useCatalogConnection } from '@/context/CatalogConnectionContext';
import { usePlayer } from '@/context/PlayerContext';
import { copyToClipboard, getAvailablePlayers, MediaPlayer, playInPlayer } from '@/service/stream/media-player.service';

interface StreamRendererProps {
  meta: MetaExtended;
  seasonNumber?: number;
  episodeNumber?: number;
  isOpen: boolean;
  onClose: () => void;
}

interface PlaybackInfo {
  MediaSources: {
    Id: string;
    Name: string;
    Path: string;
    Container: string;
    Size: number;
    TranscodingUrl?: string;
    SupportsDirectPlay: boolean;
    SupportsDirectStream: boolean;
    SupportsTranscoding: boolean;
    MediaStreams: Array<{
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
  }[];
  PlaySessionId: string;
}

interface StreamSource {
  source: {
    url: string;
    type: 'hls' | 'm3u8' | 'dash' | 'link' | 'direct';
  };
  title: string;
  description: string;
}


export const StreamRenderer: React.FC<StreamRendererProps> = ({
  meta,
  seasonNumber,
  episodeNumber,
  isOpen,
  onClose,
}) => {
  const { jellyfinService } = useCatalogConnection();
  const { playNow, addToQueue } = usePlayer();
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackInfo | null>(null);
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const availablePlayers = getAvailablePlayers();

  useEffect(() => {
    const fetchPlaybackInfo = async () => {
      if (!isOpen || !meta.id) return;

      setIsLoading(true);
      try {
        // For TV shows, we need to get the episode ID
        let itemId = meta.id.toString();
        
        if (seasonNumber && episodeNumber && meta.metaType === 'tv') {
          // Get the specific episode ID from season details
          const seasonDetails = await jellyfinService.loadSeasonDetails(meta, seasonNumber);
          const episode = seasonDetails![0]?.episodes?.find(ep => ep.episodeNumber === episodeNumber);
          if (episode) {
            itemId = episode.id.toString();
          }
        }

        // First fetch the item data to get the current playback position
        const itemResponse = await fetch(
          `${jellyfinService.getServerUrl()}/Users/${localStorage.getItem('jellyfin_user_id')}/Items/${itemId}`,
          {
            headers: {
              'X-Emby-Token': localStorage.getItem('jellyfin_api_key') || '',
              'Content-Type': 'application/json',
            },
          }
        );

        let startTimeTicks = 0;
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          startTimeTicks = itemData.UserData?.PlaybackPositionTicks || 0;
        }

        const response = await fetch(
          `${jellyfinService.getServerUrl()}/Items/${itemId}/PlaybackInfo`,
          {
            method: 'POST',
            headers: {
              'X-Emby-Token': localStorage.getItem('jellyfin_api_key') || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              UserId: localStorage.getItem('jellyfin_user_id'),
              StartTimeTicks: startTimeTicks,
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
          const data = await response.json();
          setPlaybackInfo(data);
          
          // Convert Jellyfin MediaSources to StreamSource format
          const streamSources: StreamSource[] = data.MediaSources?.map((mediaSource: any) => {
            const streamUrl = getStreamUrl(mediaSource);
            const streamType = getStreamType(mediaSource);
            
            return {
              source: {
                url: streamUrl || '',
                type: streamType,
              },
              title: mediaSource.Name || 'Unknown',
              description: `${mediaSource.Container} - ${Math.round(mediaSource.Size / 1024 / 1024)}MB - ${getCapabilities(mediaSource)}`,
            };
          }).filter((source: StreamSource) => source.source.url) || [];
          
          setSources(streamSources);
        }
      } catch (error) {
        console.error('Error fetching playback info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaybackInfo();
  }, [isOpen, meta, seasonNumber, episodeNumber, jellyfinService]);

  const getStreamUrl = (mediaSource: any) => {
    const baseUrl = jellyfinService.getServerUrl();
    const apiKey = localStorage.getItem('jellyfin_api_key');
    
    if (mediaSource.SupportsDirectPlay) {
      return `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}&Static=true`;
    } else if (mediaSource.TranscodingUrl) {
      return `${baseUrl}${mediaSource.TranscodingUrl}`;
    } else if (mediaSource.SupportsDirectStream) {
      return `${baseUrl}/Videos/${mediaSource.Id}/stream?api_key=${apiKey}`;
    }
    return null;
  };

  const getStreamType = (mediaSource: any): StreamSource['source']['type'] => {
    if (mediaSource.TranscodingUrl) {
      if (mediaSource.TranscodingUrl.includes('.m3u8')) return 'hls';
      if (mediaSource.TranscodingUrl.includes('.mpd')) return 'dash';
      return 'm3u8'; // Default for transcoding
    }
    return 'direct'; // Direct play/stream
  };

  const getCapabilities = (mediaSource: any): string => {
    const caps = [];
    if (mediaSource.SupportsDirectPlay) caps.push('Direct Play');
    if (mediaSource.SupportsDirectStream) caps.push('Direct Stream');
    if (mediaSource.SupportsTranscoding) caps.push('Transcoding');
    return caps.join(', ') || 'Unknown';
  };

  const handlePlayerClick = async (player: MediaPlayer, source: StreamSource) => {
    switch (source.source.type) {
      case 'hls':
      case 'm3u8':
      case 'dash':
      case 'link':
      case 'direct':
        await playInPlayer(player, source.source.url);
        break;
    }
  };

  const handlePlayNow = (source: StreamSource) => {
    // Find the corresponding MediaSource to get MediaStreams
    const mediaSource = playbackInfo?.MediaSources?.find(ms => 
      getStreamUrl(ms) === source.source.url
    );

    // For TV shows, we need to get the actual episode ID
    const actualItemId = (seasonNumber && episodeNumber && meta.metaType === 'tv') 
      ? mediaSource?.Id 
      : meta.id.toString();

    const queueItem = {
      jellyfinItemId: actualItemId || meta.id.toString(),
      title: meta.name,
    };
    
    playNow(queueItem);
    onClose(); // Close the stream dialog
  };

  const handleAddToQueue = (source: StreamSource) => {
    // Find the corresponding MediaSource to get MediaStreams
    const mediaSource = playbackInfo?.MediaSources?.find(ms => 
      getStreamUrl(ms) === source.source.url
    );

    // For TV shows, we need to get the actual episode ID
    const actualItemId = (seasonNumber && episodeNumber && meta.metaType === 'tv') 
      ? mediaSource?.Id 
      : meta.id.toString();

    const queueItem = {
      jellyfinItemId: actualItemId || meta.id.toString(),
      title: meta.name,
    };
    
    addToQueue(queueItem);
  };

  const handleCopyClick = async (source: StreamSource) => {
    const success = await copyToClipboard(source.source.url);
    if (success) {
      setCopiedUrl(source.source.url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const handleDownload = (source: StreamSource) => {
    const a = document.createElement('a');
    a.href = source.source.url;
    a.download = `${meta.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 !max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {meta.name}
            {seasonNumber && episodeNumber && (
              <span className="text-zinc-400 ml-2">
                - S{seasonNumber}E{episodeNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              No streams available
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Available Streams
                </h3>
                <span className="text-sm text-zinc-400">
                  {sources.length} {sources.length === 1 ? 'stream' : 'streams'} found
                </span>
              </div>
              
              {sources.map((source, index) => (
                <div
                  key={`${source.title}-${index}`}
                  className="bg-zinc-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{source.title}</h4>
                      <div className="text-sm text-zinc-400">{source.description}</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Type: {source.source.type.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Play Now */}
                    <button
                      onClick={() => handlePlayNow(source)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Play Now
                    </button>

                    {/* Add to Queue */}
                    <button
                      onClick={() => handleAddToQueue(source)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Queue
                    </button>
                    
                    {/* External Players */}
                    {availablePlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => handlePlayerClick(player, source)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
                      >
                        <span>{player.icon}</span>
                        <span>{player.name}</span>
                      </button>
                    ))}
                    
                    {/* Copy URL */}
                    <button
                      onClick={() => handleCopyClick(source)}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                    >
                      {copiedUrl === source.source.url ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy URL
                        </>
                      )}
                    </button>
                    
                    {/* Download */}
                    <button
                      onClick={() => handleDownload(source)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};