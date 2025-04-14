import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  useLoadRelated,
  useLoadSeasonDetails,
  useMeta,
} from '../service/catalog/provider';
import { MetaExtended } from '../service/type';
import { MetaHeader } from '../features/meta-details/components/MetaHeader';
import { MetaInfo } from '../features/meta-details/components/MetaInfo';
import { SeasonSelector } from '../features/meta-details/components/SeasonSelector';
import { EpisodeList } from '../features/meta-details/components/EpisodeList';
import { CastAndCrew } from '../features/meta-details/components/CastAndCrew';
import { Trailers } from '../features/meta-details/components/Trailers';
import { Reviews } from '../features/meta-details/components/Reviews';
import { motion } from 'framer-motion';
import { StreamRenderer } from '../features/meta-details/components/StreamRenderer';

const Shimmer = () => (
  <div className="relative overflow-hidden">
    <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-zinc-800 rounded w-1/2 mb-4"></div>
    <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-zinc-900 text-white">
    {/* Header Skeleton */}
    <div className="relative h-[50vh] md:h-[50vh] w-full bg-zinc-800">
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
    </div>

    <div className="container mx-auto px-4 md:px-6 -mt-24 md:-mt-32 relative z-20">
      {/* Meta Info Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 mb-12">
        <div className="relative overflow-hidden w-full md:w-64 h-96 bg-zinc-800 rounded-lg">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
        </div>
        <div className="flex-1 space-y-4">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
            <div className="h-12 bg-zinc-800 rounded w-3/4"></div>
          </div>
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
            <div className="h-6 bg-zinc-800 rounded w-1/2"></div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="relative overflow-hidden">
                <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                <div className="h-4 bg-zinc-800 rounded w-24"></div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Shimmer />
            <Shimmer />
          </div>
        </div>
      </div>

      {/* Season Selector Skeleton */}
      <div className="mb-12">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
          <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative overflow-hidden">
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
              <div className="h-12 bg-zinc-800 rounded-lg w-32"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Episodes Skeleton */}
      <div className="space-y-4 mb-12">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
          <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row gap-4 bg-zinc-800 rounded-lg p-4"
          >
            <div className="relative overflow-hidden w-full md:w-48 h-32 bg-zinc-700 rounded-lg">
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                <div className="h-6 bg-zinc-700 rounded w-3/4"></div>
              </div>
              <div className="space-y-2">
                <Shimmer />
              </div>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                    <div className="h-4 bg-zinc-700 rounded w-24"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trailers Skeleton */}
      <div className="mb-12">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
          <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden aspect-video bg-zinc-800 rounded-lg"
            >
              <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Cast & Crew Skeleton */}
      <div className="mb-12">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
          <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="relative overflow-hidden w-12 h-12 md:w-16 md:h-16 bg-zinc-800 rounded-full">
                <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
              </div>
              <div className="space-y-2">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-4 bg-zinc-800 rounded w-24"></div>
                </div>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-3 bg-zinc-800 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews Skeleton */}
      <div>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
          <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-4 bg-zinc-700 rounded w-32"></div>
                </div>
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer"></div>
                  <div className="h-4 bg-zinc-700 rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <Shimmer />
                <Shimmer />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    filter: 'brightness(0.8)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default function MetaDetails() {
  const { meta: encodedMeta } = useParams<{ meta: string }>();
  const navigate = useNavigate();
  const [selectedTrailer, setSelectedTrailer] = React.useState<
    string | number | null
  >(null);
  const [isStreamDialogOpen, setIsStreamDialogOpen] = React.useState(false);
  const [selectedEpisode, setSelectedEpisode] = React.useState<{
    seasonNumber: number;
    episodeNumber: number;
  } | null>(null);
  const [isRelatedExpanded, setIsRelatedExpanded] = React.useState(false);
  const INITIAL_RELATED_COUNT = 4;

  const decodedMeta = React.useMemo(() => {
    try {
      return {
        encoded: encodedMeta,
      } as MetaExtended;
    } catch (error) {
      return null;
    }
  }, [encodedMeta]);

  const { meta, loading, error } = useMeta(decodedMeta);
  const {
    selectedSeason,
    seasonDetails,
    isLoading: loadingSeason,
    error: seasonError,
    loadSeason,
    clearSeason,
  } = useLoadSeasonDetails(meta);
  const { related } = useLoadRelated(meta);

  useEffect(() => {
    if (meta && meta.metaType === 'tv' && !selectedSeason) {
      loadSeason(1);
    }
  }, [meta, selectedSeason, loadSeason]);

  const handlePlay = (seasonNumber?: number, episodeNumber?: number) => {
    setSelectedEpisode(
      seasonNumber && episodeNumber ? { seasonNumber, episodeNumber } : null,
    );
    setIsStreamDialogOpen(true);
  };

  const handleRelatedClick = (relatedMeta: MetaExtended) => {
    navigate(`/meta/${relatedMeta.encoded}`);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !meta) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-zinc-900 text-white flex items-center justify-center"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-zinc-400">
            {error?.message || 'Failed to load content'}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-zinc-900 text-white"
    >
      <MetaHeader meta={meta} onPlay={() => handlePlay()} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-16 md:-mt-24 lg:-mt-32 relative z-20">
        <motion.div
          variants={itemVariants}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
        >
          <MetaInfo meta={meta} onPlay={() => handlePlay()} />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
        >
          <SeasonSelector
            meta={meta}
            selectedSeason={selectedSeason}
            onSeasonSelect={loadSeason}
          />
        </motion.div>

        {selectedSeason !== null && (
          <motion.div
            variants={itemVariants}
            className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
          >
            <EpisodeList
              selectedSeason={selectedSeason}
              seasonDetails={seasonDetails}
              loading={loadingSeason}
              error={seasonError}
              onClearSeason={clearSeason}
              onPlay={(episodeNumber) =>
                handlePlay(selectedSeason, episodeNumber)
              }
            />
          </motion.div>
        )}

        <motion.div
          variants={itemVariants}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
        >
          <Trailers
            meta={meta}
            selectedTrailer={selectedTrailer}
            onTrailerSelect={setSelectedTrailer}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
        >
          <CastAndCrew meta={meta} />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mb-6 sm:mb-8 md:mb-10 lg:mb-12"
        >
          <Reviews meta={meta} />
        </motion.div>

        {related.length > 0 && (
          <motion.div
            variants={itemVariants}
            className="mt-6 sm:mt-8 md:mt-10 lg:mt-12"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6">
              Related Content
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {(isRelatedExpanded
                ? related
                : related.slice(0, INITIAL_RELATED_COUNT)
              ).map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleRelatedClick(item)}
                >
                  <img
                    src={item.poster}
                    alt={item.name}
                    className="w-full h-40 sm:h-48 md:h-56 lg:h-64 object-cover"
                  />
                  <div className="p-2 sm:p-3 md:p-4">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            {related.length > INITIAL_RELATED_COUNT && (
              <div className="mt-4 sm:mt-5 md:mt-6 text-center">
                <button
                  onClick={() => setIsRelatedExpanded(!isRelatedExpanded)}
                  className="group relative flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-full overflow-hidden transition-all duration-300 mx-auto"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-red-800/50 group-hover:from-red-600/70 group-hover:to-red-800/70 transition-all duration-300" />
                  <div className="absolute inset-0 backdrop-blur-sm" />
                  <div className="relative flex items-center gap-2">
                    {isRelatedExpanded ? (
                      <>
                        <span className="text-xs sm:text-sm font-medium">
                          Show Less
                        </span>
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:-translate-y-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm font-medium">
                          Show More ({related.length - INITIAL_RELATED_COUNT}{' '}
                          more)
                        </span>
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:translate-y-0.5 transition-transform"
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
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}

        <div className="pb-6 sm:pb-8 md:pb-10 lg:pb-12"> </div>
      </div>

      <StreamRenderer
        meta={meta}
        seasonNumber={selectedEpisode?.seasonNumber}
        episodeNumber={selectedEpisode?.episodeNumber}
        isOpen={isStreamDialogOpen}
        onClose={() => setIsStreamDialogOpen(false)}
      />
    </motion.div>
  );
}
