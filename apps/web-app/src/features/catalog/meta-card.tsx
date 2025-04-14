import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Meta } from '../../service/type';
import { motion } from 'framer-motion';

interface MetaCardProps {
  meta: Meta;
}

export const MetaCard: React.FC<MetaCardProps> = ({ meta }) => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleClick = () => {
    navigate(`/meta/${meta.encoded}`);
  };

  return (
    <motion.div
      className="group relative w-full cursor-pointer h-full rounded-lg overflow-hidden shadow-none hover:shadow-sm"
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg mb-1 line-clamp-1 heading-font">
            {meta.name}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-300">
            <span>{meta.releaseDate}</span>
            <span>•</span>
            <span className="uppercase">{meta.metaType}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
