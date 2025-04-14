import React from 'react';
import { MetaExtended } from '@/service/type';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

interface MetaInfoProps {
  meta: MetaExtended;
  onPlay: () => void;
}

export const MetaInfo: React.FC<MetaInfoProps> = ({ meta, onPlay }) => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Poster */}
      <div className="w-full lg:w-64 flex-shrink-0 relative group">
        {meta.poster && (
          <>
            <img
              src={meta.poster}
              alt={meta.name}
              className="w-full rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg flex items-center justify-center">
              <button
                onClick={onPlay}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <span className="text-white font-medium text-lg">Play Now</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 heading-font">
          {meta.name}
        </h1>
        {meta.tagline && (
          <p className="text-lg md:text-xl text-zinc-400 italic mb-4">
            {meta.tagline}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-6">
          <span className="text-zinc-400">
            {new Date(meta.releaseDate).getFullYear()}
          </span>
          <span className="text-zinc-400">•</span>
          <span className="uppercase text-zinc-400">{meta.metaType}</span>
          {meta.runtime && (
            <>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-400">{meta.runtime} min</span>
            </>
          )}
          {meta.voteAverage && (
            <>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-400">
                {meta.voteAverage.toFixed(1)} ({meta.voteCount} votes)
              </span>
            </>
          )}
        </div>
        <div className="flex flex-row md:flex-row items-start gap-6">
          <p className="text-base md:text-lg text-zinc-300 flex-1">
            {meta.description}
          </p>
        </div>
        <div className="mt-10">
          <Button onClick={onPlay} variant="destructive" size="lg">
            <PlayCircle className="w-5 h-5" />
            <span className="font-medium">Play</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
