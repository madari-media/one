import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meta } from '../../service/type';
import { useNavigate } from 'react-router';

interface FeaturedCatalogProps {
  meta: Meta[];
  currentIndex: number;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  onPlay?: (id: string) => void;
}

export const FeaturedCatalog: React.FC<FeaturedCatalogProps> = ({
  meta,
  currentIndex,
  onScrollLeft,
  onScrollRight,
  onPlay = () => {},
}) => {
  const navigate = useNavigate();
  const [, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleMoreInfo = () => {
    const currentMeta = meta[currentIndex];
    if (currentMeta) {
      navigate(`/meta/${currentMeta.encoded}`);
    }
  };

  const handlePlay = () => {
    const currentMeta = meta[currentIndex];
    if (currentMeta) {
      onPlay(currentMeta.id.toString());
    }
  };

  // Timer and progress bar logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const startTimer = () => {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 0;
          }
          return prev + 100 / 30; // 30 seconds total
        });
      }, 1000);

      timeout = setTimeout(() => {
        if (!isPaused) {
          onScrollRight();
        }
      }, 30000); // 30 seconds
    };

    if (!isPaused) {
      startTimer();
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentIndex, isPaused, onScrollRight]);

  // Preload adjacent images for smoother experience
  useEffect(() => {
    const imagesToPreload = [];

    if (meta[currentIndex]) {
      // Add background image
      if (meta[currentIndex].background) {
        imagesToPreload.push(meta[currentIndex].background);
      }

      // Add poster image if available
      if (meta[currentIndex].poster) {
        imagesToPreload.push(meta[currentIndex].poster);
      }
    }

    // Preload next item images
    const nextIndex = (currentIndex + 1) % meta.length;
    if (meta[nextIndex]) {
      if (meta[nextIndex].background) {
        imagesToPreload.push(meta[nextIndex].background);
      }
      if (meta[nextIndex].poster) {
        imagesToPreload.push(meta[nextIndex].poster);
      }
    }

    // Preload previous item images
    const prevIndex = (currentIndex - 1 + meta.length) % meta.length;
    if (meta[prevIndex]) {
      if (meta[prevIndex].background) {
        imagesToPreload.push(meta[prevIndex].background);
      }
      if (meta[prevIndex].poster) {
        imagesToPreload.push(meta[prevIndex].poster);
      }
    }

    // Create image objects to trigger browser caching
    imagesToPreload.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [meta, currentIndex]);

  return (
    <div
      className="relative h-[55vh] md:h-[65vh] overflow-hidden group pb-6 rounded-lg"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPaused(false);
      }}
    >
      <AnimatePresence mode="wait" custom={currentIndex}>
        <motion.div
          key={currentIndex}
          custom={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            duration: 0.8,
            ease: [0.32, 0.72, 0, 1],
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <AnimatePresence mode="wait">
              {!isImageLoaded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-800 animate-pulse"
                />
              )}
            </AnimatePresence>
            {meta[currentIndex]?.background && (
              <motion.img
                src={meta[currentIndex].background}
                alt={meta[currentIndex].name}
                className="w-full h-full object-cover hidden md:block"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: isImageLoaded ? 1 : 0,
                  scale: isImageLoaded ? 1 : 1.1,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onLoad={() => setIsImageLoaded(true)}
              />
            )}
            {meta[currentIndex]?.poster && (
              <motion.img
                src={meta[currentIndex].poster}
                alt={meta[currentIndex].name}
                className="w-full h-full object-cover md:hidden"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: isImageLoaded ? 1 : 0,
                  scale: isImageLoaded ? 1 : 1.1,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onLoad={() => setIsImageLoaded(true)}
              />
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 via-black/20" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
            <div className="flex items-end gap-4 sm:gap-6">
              {/* Poster - Hidden on mobile */}
              <div className="w-48 flex-shrink-0 hidden md:block relative">
                {meta[currentIndex]?.poster && (
                  <motion.img
                    src={meta[currentIndex].poster}
                    alt={meta[currentIndex].name}
                    className="w-full rounded-lg shadow-lg"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{
                      opacity: isImageLoaded ? 1 : 0,
                      scale: isImageLoaded ? 1 : 1.1,
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    onLoad={() => setIsImageLoaded(true)}
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold heading-font text-white mb-2">
                  {meta[currentIndex]?.name || ''}
                </h3>
                <p className="text-white/90 text-base sm:text-lg line-clamp-2 mb-4">
                  {meta[currentIndex]?.description || ''}
                </p>
                <div className="flex items-center gap-4">
                  <Button
                    className="bg-white heading-font hover:bg-white/90 text-black font-medium rounded-md px-4 sm:px-6 py-2 flex items-center gap-2 transition-all cursor-pointer text-sm sm:text-base"
                    variant="default"
                    size="lg"
                    onClick={handlePlay}
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                    Play
                  </Button>
                  <Button
                    className="bg-gray-500/60 heading-font hover:bg-gray-600/80 text-white font-medium rounded-md px-4 sm:px-6 py-2 backdrop-blur-sm cursor-pointer text-sm sm:text-base"
                    variant="secondary"
                    size="lg"
                    onClick={handleMoreInfo}
                  >
                    More Info
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 h-1.5 sm:h-2 w-24 sm:w-32 rounded-sm bg-white/50 overflow-hidden z-10">
        <div
          className="h-full bg-white transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Arrows */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onScrollLeft}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onScrollRight}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-4 rounded-full transition-colors duration-300 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </motion.button>
    </div>
  );
};
