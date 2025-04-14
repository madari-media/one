import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Meta, MetaPerson } from '../service/type';
import { usePerson } from '../service/catalog/provider';
import { motion } from 'framer-motion';

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

const Shimmer = () => (
  <div className="animate-pulse">
    <div className="h-[40vh] w-full bg-zinc-800" />
    <div className="container mx-auto px-4 -mt-32 relative z-20">
      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0">
          <div className="w-full aspect-[2/3] bg-zinc-800 rounded-lg" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="h-12 w-1/3 bg-zinc-800 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-1/4 bg-zinc-800 rounded" />
            <div className="h-4 w-1/3 bg-zinc-800 rounded" />
            <div className="h-4 w-1/2 bg-zinc-800 rounded" />
          </div>
          <div className="h-32 w-full bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="mt-12 space-y-8">
        <div className="h-8 w-1/4 bg-zinc-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="w-full aspect-[2/3] bg-zinc-800 rounded-lg"
            />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function PersonDetails() {
  const { person: encodedPerson } = useParams<{ person: string }>();
  const navigate = useNavigate();
  const decodedPerson = React.useMemo(() => {
    try {
      return {
        encoded: encodedPerson,
      } as MetaPerson;
    } catch (error) {
      return null;
    }
  }, [encodedPerson]);

  const { person, loading, error } = usePerson(decodedPerson);

  const handleMovieClick = (movie: Meta) => {
    navigate(`/meta/${movie.encoded}`);
  };

  if (loading) {
    return <Shimmer />;
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-zinc-400">
            {error?.message || 'Failed to load person details'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-zinc-900 text-white"
    >
      {/* Background Image */}
      <div className="relative h-[40vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent z-10" />
        {person.poster && (
          <img
            src={person.poster}
            alt={person.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-20">
        <motion.div variants={itemVariants} className="flex gap-8">
          {/* Poster */}
          <div className="w-64 flex-shrink-0">
            {person.poster && (
              <img
                src={person.poster}
                alt={person.name}
                className="w-full aspect-[2/3] rounded-lg shadow-lg object-cover"
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{person.name}</h1>

            {/* Personal Info */}
            <div className="space-y-4 mb-8">
              {person.knownForDepartment && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Known For:</span>
                  <span>{person.knownForDepartment}</span>
                </div>
              )}

              {person.gender && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Gender:</span>
                  <span className="capitalize">{person.gender}</span>
                </div>
              )}

              {person.birthday && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Born:</span>
                  <span>{new Date(person.birthday).toLocaleDateString()}</span>
                  {person.placeOfBirth && (
                    <span className="text-zinc-400">
                      in {person.placeOfBirth}
                    </span>
                  )}
                </div>
              )}

              {person.deathday && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Died:</span>
                  <span>{new Date(person.deathday).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography && (
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Biography</h2>
                <p className="text-zinc-300 leading-relaxed">
                  {person.biography}
                </p>
              </motion.div>
            )}

            {/* Also Known As */}
            {person.alsoKnownAs && person.alsoKnownAs.length > 0 && (
              <motion.div variants={itemVariants} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Also Known As</h2>
                <div className="flex flex-wrap gap-2">
                  {person.alsoKnownAs.map((name, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800 rounded-full text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Credits */}
        {person.credits && (
          <motion.div variants={itemVariants} className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Credits</h2>

            {/* Cast */}
            {person.credits.cast && person.credits.cast.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Acting</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
                  {person.credits.cast.map((credit) => (
                    <div
                      key={credit.id}
                      className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() =>
                        handleMovieClick({
                          encoded: encodeURIComponent(
                            `tmdb/${credit.mediaType}/${credit.id}`,
                          ),
                        } as never)
                      }
                    >
                      {credit.poster && (
                        <img
                          src={credit.poster}
                          alt={credit.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-medium mb-1 line-clamp-1">
                          {credit.title}
                        </h4>
                        <p className="text-sm text-zinc-400 mb-2 line-clamp-1">
                          as {credit.character}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">
                            {credit.releaseDate
                              ? new Date(credit.releaseDate).getFullYear()
                              : 'N/A'}
                          </span>
                          <span className="text-orange-500">
                            {credit.voteAverage.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crew */}
            {person.credits.crew && person.credits.crew.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Production</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
                  {person.credits.crew.map((credit) => (
                    <div
                      key={credit.id}
                      className="bg-zinc-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() =>
                        handleMovieClick({
                          encoded: encodeURIComponent(
                            `tmdb/${credit.mediaType}/${credit.id}`,
                          ),
                        } as never)
                      }
                    >
                      {credit.poster && (
                        <img
                          src={credit.poster}
                          alt={credit.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-medium mb-1 line-clamp-1">
                          {credit.title}
                        </h4>
                        <p className="text-sm text-zinc-400 mb-2 line-clamp-1">
                          {credit.job}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">
                            {credit.releaseDate
                              ? new Date(credit.releaseDate).getFullYear()
                              : 'N/A'}
                          </span>
                          <span className="text-orange-500">
                            {credit.voteAverage.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
