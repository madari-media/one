import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Meta } from '../../service/type';
import { motion } from 'framer-motion';

interface MetaCardProps {
  meta: Meta;
  progress?: number; // Progress percentage (0-100)
  cardSize: number;
}

export const MetaCard: React.FC<MetaCardProps> = ({ meta, progress, cardSize }) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 150);
    navigate(`/meta/${meta.encoded}`);
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
      title={meta.name}
    >
      <div className="absolute inset-0">
        {!isImageLoaded && <div className="absolute inset-0 bg-zinc-800" />}
        {meta.poster && (
          <motion.img
            src={meta.poster}
            alt={meta.name}
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
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60 z-10">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}

        <div className="absolute bottom-1 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 heading-font">
            {meta.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-300">
            <span>{meta.releaseDate}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
