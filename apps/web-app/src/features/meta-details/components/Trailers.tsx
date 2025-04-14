import React from 'react';
import { MetaExtended } from '@/service/type';

interface TrailersProps {
  meta: MetaExtended;
  selectedTrailer: string | number | null;
  onTrailerSelect: (trailerId: string | number) => void;
}

export const Trailers: React.FC<TrailersProps> = ({
  meta,
  selectedTrailer,
  onTrailerSelect,
}) => {
  if (!meta.trailers || meta.trailers.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Trailers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meta.trailers.map((trailer) => (
          <div
            key={trailer.id}
            className="aspect-video w-full max-w-md mx-auto"
          >
            {selectedTrailer === trailer.id ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
                title={trailer.name}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full cursor-pointer group"
                onClick={() => onTrailerSelect(trailer.id)}
              >
                <img
                  src={`https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`}
                  alt={trailer.name}
                  className="w-full h-full rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/30 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};