import React, { useEffect, useState } from 'react';
import { useContinueWatching } from '@/hooks/useContinueWatching';
import { ContinueWatchingCard } from './continue-watching-card';
import { useAtom } from 'jotai';
import { selectedContentTypeAtom } from '@/layout/atoms';

export const ContinueWatchingSection: React.FC = () => {
  const { items, loading, error, markAsWatched, removeFromContinueWatching } = useContinueWatching();
  const [cardSize, setCardSize] = useState(280);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedContentType] = useAtom(selectedContentTypeAtom);

  useEffect(() => {
    const updateCardSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setCardSize(160);
      } else if (width < 768) {
        setCardSize(200);
      } else if (width < 1024) {
        setCardSize(240);
      } else {
        setCardSize(280);
      }
    };

    updateCardSize();
    window.addEventListener('resize', updateCardSize);
    return () => window.removeEventListener('resize', updateCardSize);
  }, []);

  // Filter items based on selected content type
  const filteredItems = React.useMemo(() => {
    if (selectedContentType === null) return items;
    return items.filter(item => item.meta.metaType === selectedContentType);
  }, [items, selectedContentType]);

  if (loading) {
    return (
      <div className="mb-8 pt-4">
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-4">
          <h2 className="text-lg heading-font sm:text-xl md:text-2xl font-bold text-white">
            Continue Watching
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="px-2 sm:px-4">
          <div className="flex overflow-x-auto pb-2 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-2 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-zinc-800 rounded-lg animate-pulse"
                  style={{
                    width: `${cardSize * 2}px`,
                    height: `${cardSize}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 pt-4">
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-4">
          <h2 className="text-lg heading-font sm:text-xl md:text-2xl font-bold text-white">
            Continue Watching
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-zinc-300 transition-colors"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="px-2 sm:px-4">
          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-red-500 mb-2">Failed to load continue watching</p>
            <p className="text-zinc-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  if (filteredItems.length === 0 && selectedContentType !== null) {
    return (
      <div className="mb-8 pt-4">
        <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-4">
          <h2 className="text-lg heading-font sm:text-xl md:text-2xl font-bold text-white">
            Continue Watching
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:text-zinc-300 transition-colors"
            title={isExpanded ? "Collapse view" : "Expand view"}
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="px-2 sm:px-4">
          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-400">No {selectedContentType === 'movie' ? 'movies' : 'TV shows'} in continue watching</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 pt-4">
      <div className="flex justify-between items-center mb-4 sm:mb-6 px-2 sm:px-4">
        <h2 className="text-lg heading-font sm:text-xl md:text-2xl font-bold text-white">
          Continue Watching
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white hover:text-zinc-300 transition-colors"
          title={isExpanded ? "Collapse view" : "Expand view"}
        >
          {isExpanded ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
          )}
        </button>
      </div>
      
      <div className="px-2 sm:px-4">
        {isExpanded ? (
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.meta.id}
                className="flex-shrink-0"
                style={{
                  width: `${cardSize * 2}px`,
                }}
              >
                <ContinueWatchingCard
                  item={item}
                  onMarkAsWatched={markAsWatched}
                  onRemove={removeFromContinueWatching}
                  cardSize={cardSize}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-2 sm:pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-2 sm:gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.meta.id}
                  className="flex-shrink-0"
                  style={{
                    width: `${cardSize * 2}px`,
                  }}
                >
                  <ContinueWatchingCard
                    item={item}
                    onMarkAsWatched={markAsWatched}
                    onRemove={removeFromContinueWatching}
                    cardSize={cardSize}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};