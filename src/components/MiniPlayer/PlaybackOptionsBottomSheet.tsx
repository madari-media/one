import React, { useCallback, useMemo } from 'react';
import { Settings, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlaybackOptions, BitratePreset } from './types';

interface PlaybackOptionsBottomSheetProps {
  playbackOptions: PlaybackOptions;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaybackOptionsChange: (options: Partial<PlaybackOptions>) => void;
  maxAvailableBitrate?: number;
}

export const PlaybackOptionsBottomSheet: React.FC<PlaybackOptionsBottomSheetProps> = ({
  playbackOptions,
  isOpen,
  onOpenChange,
  onPlaybackOptionsChange,
  maxAvailableBitrate = 120000000, // Default 120 Mbps
}) => {
  // Generate bitrate presets based on max available bitrate
  const generateBitratePresets = useCallback((maxBitrate: number): BitratePreset[] => {
    const presetDefinitions = [
      { id: 'auto', label: 'Auto (Best Quality)', bitrate: maxBitrate },
      { id: '40mb', label: '40 Mbps', bitrate: 40000000 },
      { id: '20mb', label: '20 Mbps', bitrate: 20000000 },
      { id: '6mb', label: '6 Mbps', bitrate: 6000000 },
      { id: '4mb', label: '4 Mbps', bitrate: 4000000 },
      { id: '3mb', label: '3 Mbps', bitrate: 3000000 },
      { id: '1.5mb', label: '1.5 Mbps', bitrate: 1500000 },
      { id: '720kbps', label: '720 Kbps', bitrate: 720000 },
      { id: '420kbps', label: '420 Kbps', bitrate: 420000 },
    ];

    return presetDefinitions.map(preset => ({
      ...preset,
      enabled: preset.bitrate <= maxBitrate,
    }));
  }, []);

  const availableBitrates = useMemo(() => 
    generateBitratePresets(maxAvailableBitrate), 
    [maxAvailableBitrate, generateBitratePresets]
  );

  const aspectRatios = [
    { value: 'auto', label: 'Auto' },
    { value: '16:9', label: '16:9 (Widescreen)' },
    { value: '4:3', label: '4:3 (Standard)' },
    { value: '21:9', label: '21:9 (Ultrawide)' },
    { value: '1:1', label: '1:1 (Square)' },
  ] as const;

  const playbackSpeeds = [
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x (Normal)' },
    { value: 1.25, label: '1.25x' },
    { value: 1.5, label: '1.5x' },
    { value: 1.75, label: '1.75x' },
    { value: 2, label: '2x' },
  ];

  const formatBitrate = (bitrate: number): string => {
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(1)} Mbps`;
    } else if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(0)} Kbps`;
    }
    return `${bitrate} bps`;
  };

  const getCurrentBitrateLabel = (): string => {
    if (playbackOptions.selectedBitrate === null) return 'Auto (Best Quality)';
    const preset = availableBitrates.find(p => p.bitrate === playbackOptions.selectedBitrate);
    return preset ? preset.label : formatBitrate(playbackOptions.selectedBitrate);
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`p-1.5 rounded ${
            isOpen ? 'text-red-400' : 'text-zinc-400 hover:text-white'
          }`}
          title="Playback Options"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 bg-zinc-900 border border-zinc-700 text-white p-0 max-h-[500px] overflow-hidden"
        side="top"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          e.stopPropagation();
        }}
        onInteractOutside={(e) => {
          e.stopPropagation();
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white" />
            <h2 className="text-base font-semibold text-white">Playback Options</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="p-1 text-zinc-400 hover:text-white h-6 w-6"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div 
          className="px-4 py-4 space-y-4 max-h-80 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Bitrate Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Quality (Bitrate)</label>
            <div className="relative">
              <select
                value={playbackOptions.selectedBitrate || 'auto'}
                onChange={(e) => {
                  const value = e.target.value === 'auto' ? null : parseInt(e.target.value);
                  onPlaybackOptionsChange({ selectedBitrate: value });
                }}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {availableBitrates
                  .filter(preset => preset.enabled)
                  .map(preset => (
                    <option 
                      key={preset.id} 
                      value={preset.id === 'auto' ? 'auto' : preset.bitrate}
                    >
                      {preset.label}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
            <p className="text-xs text-zinc-400">
              Current: {getCurrentBitrateLabel()}
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Aspect Ratio</label>
            <div className="relative">
              <select
                value={playbackOptions.aspectRatio}
                onChange={(e) => {
                  onPlaybackOptionsChange({ 
                    aspectRatio: e.target.value as PlaybackOptions['aspectRatio'] 
                  });
                }}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {aspectRatios.map(ratio => (
                  <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Playback Speed */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Playback Speed</label>
            <div className="relative">
              <select
                value={playbackOptions.playbackSpeed}
                onChange={(e) => {
                  onPlaybackOptionsChange({ 
                    playbackSpeed: parseFloat(e.target.value) 
                  });
                }}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white appearance-none cursor-pointer hover:bg-zinc-700 transition-colors"
              >
                {playbackSpeeds.map(speed => (
                  <option key={speed.value} value={speed.value}>
                    {speed.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Subtitle Offset */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Subtitle Offset</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={playbackOptions.subtitleOffset}
                onChange={(e) => {
                  onPlaybackOptionsChange({ 
                    subtitleOffset: parseFloat(e.target.value) 
                  });
                }}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center gap-1 min-w-16">
                <input
                  type="number"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={playbackOptions.subtitleOffset}
                  onChange={(e) => {
                    const value = Math.max(-10, Math.min(10, parseFloat(e.target.value) || 0));
                    onPlaybackOptionsChange({ subtitleOffset: value });
                  }}
                  className="w-12 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-xs text-center"
                />
                <span className="text-xs text-zinc-400">s</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              {playbackOptions.subtitleOffset > 0 
                ? `Subtitles delayed by ${playbackOptions.subtitleOffset}s`
                : playbackOptions.subtitleOffset < 0
                ? `Subtitles advanced by ${Math.abs(playbackOptions.subtitleOffset)}s`
                : 'Subtitles in sync'
              }
            </p>
          </div>

          {/* Reset to Defaults */}
          <div className="pt-2 border-t border-zinc-700">
            <button
              onClick={() => {
                onPlaybackOptionsChange({
                  selectedBitrate: null,
                  aspectRatio: 'auto',
                  playbackSpeed: 1,
                  subtitleOffset: 0,
                });
              }}
              className="w-full px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};