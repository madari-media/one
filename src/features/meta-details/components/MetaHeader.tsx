import React, { useState } from 'react';
import { MetaExtended } from '@/service/type';
import { Calendar, Clock, Play, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetaHeaderProps {
  meta: MetaExtended;
  onPlay: () => void;
  watchProgress?: number; // Progress percentage (0-100)
}

export const MetaHeader: React.FC<MetaHeaderProps> = ({ meta, onPlay, watchProgress }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {!isImageLoaded && <div className="absolute inset-0 bg-zinc-800 animate-pulse" />}
        {meta.background && (
          <motion.img
            src={meta.background}
            alt={meta.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: isImageLoaded ? 1 : 0,
              scale: isImageLoaded ? 1 : 1.1 
            }}
            transition={{ duration: 0.8 }}
            onLoad={() => setIsImageLoaded(true)}
          />
        )}
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/80 via-transparent to-zinc-900/60 z-10" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-end p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-end">
            {/* Poster */}
            {meta.poster && (
              <motion.div 
                className="flex-shrink-0 w-40 md:w-48 lg:w-56"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <img
                  src={meta.poster}
                  alt={meta.name}
                  className="w-full rounded-lg shadow-2xl"
                />
                
                {/* Progress bar on poster if available */}
                {watchProgress !== undefined && watchProgress > 0 && (
                  <div className="mt-2 w-full h-1 bg-black/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(watchProgress, 100)}%` }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Details */}
            <motion.div 
              className="flex-1 min-w-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 text-white heading-font">
                {meta.name}
              </h1>
              
              {meta.tagline && (
                <p className="text-lg md:text-xl text-zinc-300 italic mb-4 opacity-90">
                  "{meta.tagline}"
                </p>
              )}

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 text-sm md:text-base">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{meta.voteAverage?.toFixed(1) || 'N/A'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-zinc-300">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(meta.releaseDate).getFullYear()}</span>
                </div>
                
                {meta.runtime && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="w-4 h-4" />
                    <span>{meta.runtime} min</span>
                  </div>
                )}

                {meta.voteCount && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Users className="w-4 h-4" />
                    <span>{meta.voteCount.toLocaleString()} votes</span>
                  </div>
                )}

                <span className="px-2 py-1 bg-zinc-700/60 text-zinc-200 text-xs uppercase rounded font-medium">
                  {meta.metaType}
                </span>
              </div>

              {/* Genres */}
              {meta.genres && meta.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {meta.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-red-600/20 text-red-300 text-sm rounded-full border border-red-600/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6 max-w-3xl line-clamp-3">
                {meta.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <motion.button
                  onClick={onPlay}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-5 h-5" />
                  <span>{watchProgress ? 'Continue Watching' : 'Play'}</span>
                </motion.button>
              </div>

              {/* Watch Progress Info */}
              {watchProgress !== undefined && watchProgress > 0 && (
                <div className="mt-4 text-sm text-zinc-400">
                  <span>{Math.round(watchProgress)}% watched</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};