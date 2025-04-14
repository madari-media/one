import React, { useEffect, useState } from 'react';
import { MetaExtended } from '@/service/type';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  Copy,
  Filter,
  Globe,
  Loader2,
  Play,
  Shield,
} from 'lucide-react';
import { useExtensionContext } from '@/context/ExtensionContext';
import { Stream } from '@/service/stream/base-stream.service';
import {
  copyToClipboard,
  getAvailablePlayers,
  MediaPlayer,
  playInPlayer,
} from '@/service/stream/media-player.service';

interface StreamRendererProps {
  meta: MetaExtended;
  seasonNumber?: number;
  episodeNumber?: number;
  isOpen: boolean;
  onClose: () => void;
}

type StreamSource = Stream & {
  isVerified: boolean;
  subtitles: string[];
  extensionId: string;
};

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  meta,
  seasonNumber,
  episodeNumber,
  isOpen,
  onClose,
}) => {
  const { getStreams, extensions } = useExtensionContext();
  const [sources, setSources] = useState<StreamSource[]>([]);
  const [selectedSource] = useState<StreamSource | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSource, setCopiedSource] = useState<string | null>(null);
  const availablePlayers = getAvailablePlayers();

  useEffect(() => {
    const fetchStreams = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      const newSources: StreamSource[] = [];

      try {
        for await (const [extensionId, streams] of getStreams(
          meta,
          seasonNumber && episodeNumber
            ? {
                season: seasonNumber,
                episode: episodeNumber,
              }
            : undefined,
        )) {
          newSources.push(
            ...streams.map((stream) => ({
              ...stream,
              isVerified: true,
              subtitles: [],
              extensionId,
            })),
          );
        }
      } catch (error) {
        console.error('Error fetching streams:', error);
      } finally {
        setSources(newSources);
        setIsLoading(false);
      }
    };

    fetchStreams();
  }, [isOpen, meta, getStreams]);

  const filteredSources = sources.filter((source) => {
    return (
      (selectedExtension === 'All' ||
        source.extensionId === selectedExtension) &&
      source.source
    );
  });

  const getSourceTypeIcon = (source: StreamSource) => {
    const firstSource = source.source;
    if (!firstSource) return null;

    switch (firstSource.type) {
      case 'hls':
      case 'm3u8':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'dash':
        return <Shield className="w-4 h-4 text-green-500" />;
      default:
        return <Play className="w-4 h-4 text-blue-500" />;
    }
  };

  const extensionOptions = ['All', ...extensions.map((ext) => ext.id)];

  const handlePlayerClick = async (
    player: MediaPlayer,
    source: StreamSource,
  ) => {
    switch (source.source.type) {
      case 'hls':
      case 'm3u8':
      case 'dash':
      case 'link':
        await playInPlayer(player, source.source.url);
    }
  };

  const handleCopyClick = async (source: StreamSource) => {
    const firstSource = source.source;
    if (firstSource) {
      const success = await copyToClipboard(firstSource.url);
      if (success) {
        setCopiedSource(
          `${source.title}-${source.description}-${source.extensionId}`,
        );
        setTimeout(() => setCopiedSource(null), 2000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 !max-w-7xl">
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

        <div className="space-y-8">
          {/* Extension Filter */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Extensions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {extensionOptions.map((extensionId) => (
                <button
                  key={extensionId}
                  onClick={() => setSelectedExtension(extensionId)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedExtension === extensionId
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {extensionId}
                </button>
              ))}
            </div>
          </div>

          {/* Sources List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Available Streams
              </h3>
              <span className="text-sm text-zinc-400">
                {filteredSources.length}{' '}
                {filteredSources.length === 1 ? 'stream' : 'streams'} found
              </span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredSources.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  No streams found
                </div>
              ) : (
                filteredSources.map((source, index) => (
                  <div
                    key={source.title + source.description + index}
                    className={`w-full p-4 rounded-xl transition-all duration-200 ${
                      selectedSource?.title === source.title &&
                      selectedSource.description === source.description
                        ? 'bg-zinc-700 shadow-lg shadow-zinc-700/20'
                        : 'bg-zinc-800 hover:bg-zinc-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSourceTypeIcon(source)}
                        <span className="font-medium heading-font text-white">
                          {source.title}
                        </span>
                        {source.isVerified && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Globe className="w-4 h-4" />
                        <span>{source.extensionId}</span>
                      </div>
                    </div>
                    <div className="mt-1 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <pre className="w-full font-sans text-wrap">
                          {source.description}
                        </pre>
                      </div>
                      {source.subtitles.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {source.subtitles.map((subtitle) => (
                            <span
                              key={subtitle}
                              className="px-2.5 py-1 text-xs bg-zinc-700 rounded-full text-zinc-300"
                            >
                              {subtitle}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-wrap gap-2">
                          {availablePlayers.map((player) => (
                            <button
                              key={player.id}
                              onClick={() => handlePlayerClick(player, source)}
                              className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white flex items-center gap-2"
                            >
                              <span>{player.icon}</span>
                              <span>{player.name}</span>
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCopyClick(source)}
                          className="px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white flex items-center gap-2"
                        >
                          {copiedSource ===
                          `${source.title}-${source.description}-${source.extensionId}` ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy URL</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
