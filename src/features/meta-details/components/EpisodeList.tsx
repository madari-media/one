import React, { useState } from 'react';
import { MetaExtended } from '@/service/type';
import { AnimatePresence, motion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';

interface EpisodeListProps {
  selectedSeason: number;
  seasonDetails: MetaExtended['seasons'] | null;
  loading: boolean;
  error: Error | null;
  onClearSeason: () => void;
  onPlay: (episodeNumber: number) => void;
}

const formatTimeUntil = (airDate: string) => {
  const now = new Date();
  const airDateObj = new Date(airDate);
  const diffTime = airDateObj.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return null;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
  return `In ${Math.floor(diffDays / 30)} months`;
};

const formatAiringDate = (date: string) => {
  const airDate = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return airDate.toLocaleDateString('en-US', options);
};

export const EpisodeList: React.FC<EpisodeListProps> = ({
  selectedSeason,
  seasonDetails,
  loading,
  error,
  onClearSeason,
  onPlay,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const INITIAL_DISPLAY_COUNT = 12;

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-lg">
          Failed to load season details: {error.message}
        </p>
        <button
          onClick={onClearSeason}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!seasonDetails || seasonDetails.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-400 text-lg">
          No episodes found for this season
        </p>
      </div>
    );
  }

  const episodes = seasonDetails[0].episodes || [];
  const displayedEpisodes = isExpanded
    ? episodes
    : episodes.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMoreEpisodes = episodes.length > INITIAL_DISPLAY_COUNT;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setIsExpanded(true);
    setIsLoadingMore(false);
  };

  return (
    <div className="mt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {displayedEpisodes.map((episode, index) => {
            const isUpcoming = new Date(episode.airDate) > new Date();
            const timeUntil = isUpcoming
              ? formatTimeUntil(episode.airDate)
              : null;
            const airingDate = isUpcoming
              ? formatAiringDate(episode.airDate)
              : null;
            const hasRating = episode.voteCount > 0;

            return (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`bg-zinc-800 rounded-lg cursor-pointer overflow-hidden group relative shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                  isUpcoming && !episode.stillPath ? 'opacity-75' : ''
                }`}
              >
                {isUpcoming && !episode.stillPath && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-2xl font-bold text-white mb-2">
                        Coming Soon
                      </div>
                      {timeUntil && (
                        <div className="text-lg text-zinc-200">{timeUntil}</div>
                      )}
                      {airingDate && (
                        <div className="text-sm text-zinc-300 mt-2">
                          Airing on {airingDate}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="relative aspect-video overflow-hidden">
                  {episode.stillPath ? (
                    <>
                      <img
                        src={episode.stillPath}
                        alt={episode.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {isUpcoming && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center">
                          <div className="text-center p-4">
                            <div className="text-2xl font-bold text-white mb-2">
                              Coming Soon
                            </div>
                            {timeUntil && (
                              <div className="text-lg text-zinc-200">
                                {timeUntil}
                              </div>
                            )}
                            {airingDate && (
                              <div className="text-sm text-zinc-300 mt-2">
                                Airing on {airingDate}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {!isUpcoming && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => onPlay(episode.episodeNumber)}
                            className="flex flex-col items-center gap-3 transform hover:scale-105 transition-transform duration-300"
                          >
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 hover:scale-110 transition-all duration-300 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                              <PlayCircle className="w-8 h-8" />
                            </div>
                            <span className="text-white font-medium text-lg">
                              Play Now
                            </span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                      <span className="text-2xl font-bold text-zinc-400">
                        {selectedSeason === 0 ? 'Special' : 'Episode'}{' '}
                        {episode.episodeNumber}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold heading-font text-white">
                      {episode.episodeNumber}. {episode.name}
                    </h3>
                  </div>
                  <p className="text-zinc-400 line-clamp-2 mb-4 text-sm">
                    {episode.overview}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {episode.runtime} min
                    </span>
                    {hasRating && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {episode.voteAverage.toFixed(1)}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(episode.airDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {hasMoreEpisodes && !isExpanded && (
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleLoadMore}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2 mx-auto"
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>Show All Episodes</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
};
