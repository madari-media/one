import React from 'react';
import { MetaExtended } from '@/service/type';
import { Building, Calendar, DollarSign, ExternalLink, Languages, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetaInfoProps {
  meta: MetaExtended;
  onPlay: () => void;
  watchProgress?: number;
}

export const MetaInfo: React.FC<MetaInfoProps> = ({ meta, watchProgress }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Extended Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Basic Info Card */}
        <motion.div 
          className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Basic Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-400">Release Date:</span>
              <span className="text-white">{new Date(meta.releaseDate).toLocaleDateString()}</span>
            </div>
            {meta.runtime && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Runtime:</span>
                <span className="text-white">{meta.runtime} minutes</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-400">Type:</span>
              <span className="text-white capitalize">{meta.metaType}</span>
            </div>
            {meta.status && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Status:</span>
                <span className="text-white">{meta.status}</span>
              </div>
            )}
            {meta.originalLanguage && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Language:</span>
                <span className="text-white">{meta.originalLanguage.toUpperCase()}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Ratings Card */}
        <motion.div 
          className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Star className="w-5 h-5" />
            Ratings & Reviews
          </h3>
          <div className="space-y-3">
            {meta.voteAverage && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Average Rating:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-medium">{meta.voteAverage.toFixed(1)}/10</span>
                </div>
              </div>
            )}
            {meta.voteCount && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Total Votes:</span>
                <span className="text-white">{meta.voteCount.toLocaleString()}</span>
              </div>
            )}
            {watchProgress !== undefined && watchProgress > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-400">Watch Progress:</span>
                <span className="text-white">{Math.round(watchProgress)}%</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Financial Info Card (for movies) */}
        {(meta.budget || meta.revenue) && (
          <motion.div 
            className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Box Office
            </h3>
            <div className="space-y-3">
              {meta.budget && meta.budget > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Budget:</span>
                  <span className="text-white">{formatCurrency(meta.budget)}</span>
                </div>
              )}
              {meta.revenue && meta.revenue > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Revenue:</span>
                  <span className="text-white">{formatCurrency(meta.revenue)}</span>
                </div>
              )}
              {meta.budget && meta.revenue && meta.budget > 0 && meta.revenue > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Profit:</span>
                  <span className={`font-medium ${meta.revenue > meta.budget ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(meta.revenue - meta.budget)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TV Show Info Card */}
        {meta.metaType === 'tv' && (meta.totalSeasons || meta.totalEpisodes) && (
          <motion.div 
            className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Series Info
            </h3>
            <div className="space-y-3">
              {meta.totalSeasons && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Seasons:</span>
                  <span className="text-white">{meta.totalSeasons}</span>
                </div>
              )}
              {meta.totalEpisodes && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Episodes:</span>
                  <span className="text-white">{meta.totalEpisodes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* External Links Card */}
        {meta.externalIds && (meta.externalIds.imdbId || meta.externalIds.tmdbId) && (
          <motion.div 
            className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              External Links
            </h3>
            <div className="space-y-3">
              {meta.externalIds.imdbId && (
                <a
                  href={`https://imdb.com/title/${meta.externalIds.imdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-zinc-300">IMDb</span>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              )}
              {meta.externalIds.tmdbId && (
                <a
                  href={`https://themoviedb.org/${meta.metaType}/${meta.externalIds.tmdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                >
                  <span className="text-zinc-300">TMDb</span>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Production Companies */}
      {meta.productionCompanies && meta.productionCompanies.length > 0 && (
        <motion.div 
          className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Building className="w-5 h-5" />
            Production Companies
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {meta.productionCompanies.map((company) => (
              <div key={company.id} className="flex items-center gap-3 p-3 bg-zinc-700/30 rounded-lg">
                {company.logoPath && (
                  <img 
                    src={`https://image.tmdb.org/t/p/w92${company.logoPath}`}
                    alt={company.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate">{company.name}</div>
                  <div className="text-zinc-400 text-xs">{company.originCountry}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Spoken Languages */}
      {meta.spokenLanguages && meta.spokenLanguages.length > 0 && (
        <motion.div 
          className="bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-zinc-700/50"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <Languages className="w-5 h-5" />
            Spoken Languages
          </h3>
          <div className="flex flex-wrap gap-2">
            {meta.spokenLanguages.map((language) => (
              <span
                key={language.iso_639_1}
                className="px-3 py-1 bg-zinc-700/50 text-zinc-300 text-sm rounded-full"
              >
                {language.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
