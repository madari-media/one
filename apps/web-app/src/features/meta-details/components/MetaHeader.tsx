import React from 'react';
import { MetaExtended } from '@/service/type';

interface MetaHeaderProps {
  meta: MetaExtended;
  onPlay: () => void;
}

export const MetaHeader: React.FC<MetaHeaderProps> = ({ meta }) => {
  return (
    <>
      <div className="relative h-[50vh] md:h-[50vh] w-full hidden md:block">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
        {meta.background && (
          <img
            src={meta.background}
            alt={meta.name}
            className="w-full h-full object-cover object-top"
          />
        )}
      </div>
      <div className="pb-24 md:hidden"></div>
    </>
  );
};