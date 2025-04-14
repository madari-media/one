import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { MetaExtended, MetaPerson } from '@/service/type';
import { Avatar } from './Avatar';

interface CastAndCrewProps {
  meta: MetaExtended;
}

export const CastAndCrew: React.FC<CastAndCrewProps> = ({ meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const INITIAL_DISPLAY_COUNT = 8;

  if (!meta.cast || meta.cast.length === 0) {
    return null;
  }

  const displayedCast = isExpanded
    ? meta.cast
    : meta.cast.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = meta.cast.length > INITIAL_DISPLAY_COUNT;

  const handlePersonClick = (person: MetaPerson) => {
    navigate(`/person/${person.encoded}`);
  };

  return (
    <div className="mt-8 md:mt-12">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        Cast & Crew
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayedCast.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 md:gap-4 cursor-pointer hover:bg-zinc-800 p-2 rounded-lg transition-colors"
            onClick={() =>
              handlePersonClick({
                encoded: encodeURIComponent(`tmdb/person/${person.id}`),
              } as never)
            }
          >
            <Avatar
              name={person.name}
              image={person.image}
              className="w-12 h-12 md:w-16 md:h-16"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base truncate">
                {person.name}
              </h3>
              <p className="text-xs md:text-sm text-zinc-400 truncate">
                {person.character}
              </p>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 md:mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            {isExpanded
              ? 'Show Less'
              : `Show More (${meta.cast.length - INITIAL_DISPLAY_COUNT} more)`}
          </button>
        </div>
      )}
    </div>
  );
};