import { MetaCard } from '@/features/catalog/meta-card';
import { TMDBFilters, useTMDBExplore } from '@/hooks/useTMDBExplore';
import { Meta } from '@/service/type';
import { ExploreFilters } from '@/features/explore/filters';
import { Button } from '@/components/ui/button';

const getStoredRegion = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('preferredRegion') || 'US';
  }
  return 'US';
};

const defaultFilters: TMDBFilters = {
  mediaType: 'movie',
  sortBy: 'popularity.desc' as const,
  page: 1,
  region: getStoredRegion(),
};

export default function ExplorePage() {
  const {
    results,
    loading,
    error,
    totalPages,
    regions,
    movieGenres,
    tvGenres,
    ratingRange,
    yearRange,
    selectedRegion,
    handleRatingChange,
    handleYearChange,
    handleSortChange,
    handleRegionChange,
    toggleGenre,
    clearFilters,
    handleMediaTypeChange,
    loadMoreItems,
    selectedGenres,
  } = useTMDBExplore(defaultFilters);

  const handleRegionChangeWithStorage = (region: string) => {
    localStorage.setItem('preferredRegion', region);
    handleRegionChange(region);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zinc-100 mb-4">
            Error loading content
          </h2>
          <p className="text-zinc-400">{error.message}</p>
          <Button
            variant="outline"
            className="mt-4 text-zinc-100 hover:bg-zinc-800"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="p-4 sm:p-2 sm:pt-6 max-w-[2000px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <div className="lg:w-72 lg:min-w-[280px] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            <ExploreFilters
              filters={defaultFilters}
              onFiltersChange={(newFilters) => {
                if (newFilters.mediaType) {
                  handleMediaTypeChange(newFilters.mediaType);
                }
              }}
              regions={regions}
              selectedRegion={selectedRegion}
              onRegionChange={handleRegionChangeWithStorage}
              movieGenres={movieGenres}
              tvGenres={tvGenres}
              ratingRange={ratingRange}
              yearRange={yearRange}
              onRatingChange={handleRatingChange}
              onYearChange={handleYearChange}
              onSortChange={handleSortChange}
              onGenreToggle={toggleGenre}
              onClearFilters={clearFilters}
              selectedGenres={selectedGenres}
            />
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="items-center justify-between mb-6 hidden lg:flex">
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 heading-font">
                Explore
              </h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-4">
              {loading && results.length === 0
                ? [...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-full aspect-[2/3] bg-zinc-900 rounded-lg animate-pulse"
                    />
                  ))
                : results.map((item: Meta) => (
                    <div key={item.id} className="w-full aspect-[2/3]">
                      <MetaCard meta={item} />
                    </div>
                  ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => loadMoreItems()}>Load more</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
