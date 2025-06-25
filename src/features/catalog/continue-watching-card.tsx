import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ContinueWatchingItem } from '@/hooks/useContinueWatching';

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onMarkAsWatched: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  cardSize: number;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  item,
  cardSize,
}) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
    navigate(`/meta/${item.meta.encoded}`);
  };

  const formatTime = (ticks: number) => {
    const seconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getRemainingTime = () => {
    const remainingTicks = item.totalTicks - item.currentTicks;
    return formatTime(remainingTicks);
  };

  const getDisplayTitle = () => {
    if (item.episodeNumber && item.seasonNumber) {
      return `S${item.seasonNumber}E${item.episodeNumber} • ${item.meta.name}`;
    }
    return item.meta.name;
  };

  return (
    <motion.div
      className={`relative w-full cursor-pointer rounded-lg overflow-hidden transition-all duration-150 ${
        isClicked ? 'scale-95 brightness-75' : 'hover:brightness-110'
      }`}
      style={{
        width: `${cardSize * 2}px`,
        height: `${cardSize}px`,
      }}
      onClick={handleClick}
      title={getDisplayTitle()}
    >
      <div className="absolute inset-0">
        {!isImageLoaded && <div className="absolute inset-0 bg-zinc-800" />}
        {item.meta.poster && (
          <motion.img
            src={item.meta.poster}
            alt={item.meta.name}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: isImageLoaded ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            onLoad={() => setIsImageLoaded(true)}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none">

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-10">
        <div
          className="h-full bg-red-500 transition-all duration-300"
          style={{ width: `${Math.min(item.progressPercentage, 100)}%` }}
        />
      </div>
        <div className="absolute bottom-1 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 heading-font">
            {getDisplayTitle()}
          </h3>
          <div className="mt-1 flex items-center justify-between text-sm text-gray-300">
            <span>{Math.round(item.progressPercentage)}% watched</span>
            <span>{getRemainingTime()} left</span>
          </div>
        </div>
      </div>

    </motion.div>
  );
};