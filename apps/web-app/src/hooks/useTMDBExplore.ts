import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useDebounce } from './useDebounce';
import { useTMDBConfig } from './useTMDBConfig';
import { Meta } from '@/service/type';

export interface TMDBFilters {
  query?: string;
  page?: number;
  includeAdult?: boolean;
  language?: string;
  year?: number;
  genre?: number;
  genres?: number[];
  sortBy?: 'popularity.desc' | 'release_date.desc' | 'vote_average.desc';
  mediaType?: 'movie' | 'tv';
  region?: string;
  voteAverage?: number;
  quickFilter?: string;
}

export interface Region {
  code: string;
  name: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface QuickFilter {
  id: string;
  sortBy?: string;
  voteAverage?: number;
  genres?: number[];
  region?: string;
}

export const useTMDBExplore = (filters: TMDBFilters) => {
  const { config, isLoading: isConfigLoading } = useTMDBConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter states
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>(
    (searchParams.get('media_type') as 'movie' | 'tv') || 'movie',
  );
  const [sortBy, setSortBy] = useState<TMDBFilters['sortBy']>(
    (searchParams.get('sort_by') as TMDBFilters['sortBy']) || 'popularity.desc',
  );
  const [ratingRange, setRatingRange] = useState<[number, number]>([
    Number(searchParams.get('vote_average.gte')) || 0,
    10,
  ]);
  const [yearRange, setYearRange] = useState<[number, number]>([
    Number(searchParams.get('year.gte')) || 1900,
    Number(searchParams.get('year.lte')) || new Date().getFullYear(),
  ]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>(
    searchParams.get('with_genres')
      ? searchParams.get('with_genres')!.split(',').map(Number)
      : [],
  );
  const [selectedRegion, setSelectedRegion] = useState<string>(
    searchParams.get('region') || filters.region || 'US',
  );
  const [activeQuickFilter, setActiveQuickFilter] = useState(
    searchParams.get('quick_filter') || '',
  );

  // Results state
  const [results, setResults] = useState<Meta[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get('page')) || 1,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Data states
  const [regions, setRegions] = useState<Region[]>([]);
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);
  const [tvGenres, setTvGenres] = useState<Genre[]>([]);

  // Debounced values
  const debouncedRatingRange = useDebounce(ratingRange, 500);
  const debouncedYearRange = useDebounce(yearRange, 500);

  // Check if any filters are active
  const hasActiveFilters =
    selectedGenres.length > 0 ||
    ratingRange[0] > 0 ||
    yearRange[0] > 1900 ||
    yearRange[1] < new Date().getFullYear() ||
    activeQuickFilter !== '';

  const fetchTMDB = async (
    endpoint: string,
    params: Record<string, any> = {},
  ) => {
    // Only include parameters that have values
    const queryParams = new URLSearchParams();

    // Always include language if specified
    if (filters.language) {
      queryParams.set('language', filters.language);
    }

    // Add other parameters only if they have values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, value.toString());
      }
    });

    const response = await fetch(
      `${config.baseUrl}${endpoint}?${queryParams}`,
      {
        headers: {
          ...(config.apiKey?.startsWith('ey')
            ? {
                Authorization: `Bearer ${config.apiKey}`,
              }
            : {
                api_key: config.apiKey ?? 'API KEY IS NOT AVAILABLE',
              }),
        },
      },
    );
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }
    return response.json();
  };

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      if (isConfigLoading || !config.apiKey) return;

      try {
        const response = await fetchTMDB('/configuration/countries');
        const formattedRegions = response.map((country: any) => ({
          code: country.iso_3166_1,
          name: country.english_name,
        }));
        setRegions(formattedRegions);
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      }
    };

    fetchRegions();
  }, [config, isConfigLoading]);

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      if (isConfigLoading || !config.apiKey) return;

      try {
        // Fetch movie genres
        const movieResponse = await fetchTMDB('/genre/movie/list');
        const formattedMovieGenres = movieResponse.genres.map((genre: any) => ({
          id: genre.id,
          name: genre.name,
        }));
        setMovieGenres(formattedMovieGenres);

        // Fetch TV genres
        const tvResponse = await fetchTMDB('/genre/tv/list');
        const formattedTvGenres = tvResponse.genres.map((genre: any) => ({
          id: genre.id,
          name: genre.name,
        }));
        setTvGenres(formattedTvGenres);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
      }
    };

    fetchGenres();
  }, [config, isConfigLoading]);

  // Build query parameters
  const buildQueryParams = useCallback(
    (page: number): Record<string, any> => {
      const params: Record<string, any> = {
        page,
      };

      // Add language if specified
      if (filters.language) {
        params.language = filters.language;
      }

      // Add region if specified
      if (selectedRegion) {
        params.region = selectedRegion;
      }

      // Add sort_by if specified
      if (sortBy) {
        params.sort_by = sortBy;
      }

      // Add selected genres if any
      if (selectedGenres.length > 0) {
        params.with_genres = selectedGenres.join(','); // Support multiple genres
      }

      // Add rating filter if set
      if (debouncedRatingRange[0] > 0) {
        params['vote_average.gte'] = debouncedRatingRange[0];
      }
      if (debouncedRatingRange[1] < 10) {
        params['vote_average.lte'] = debouncedRatingRange[1];
      }

      // Add year filters for movies
      if (mediaType === 'movie') {
        if (debouncedYearRange[0] > 1900) {
          params['primary_release_date.gte'] = `${debouncedYearRange[0]}-01-01`;
        }
        if (debouncedYearRange[1] < new Date().getFullYear()) {
          params['primary_release_date.lte'] = `${debouncedYearRange[1]}-12-31`;
        }
      } else {
        // For TV shows
        if (debouncedYearRange[0] > 1900) {
          params['first_air_date.gte'] = `${debouncedYearRange[0]}-01-01`;
        }
        if (debouncedYearRange[1] < new Date().getFullYear()) {
          params['first_air_date.lte'] = `${debouncedYearRange[1]}-12-31`;
        }
      }

      // Add include_adult if specified
      if (filters.includeAdult !== undefined) {
        params.include_adult = filters.includeAdult;
      }

      return params;
    },
    [
      mediaType,
      sortBy,
      selectedGenres,
      debouncedRatingRange,
      debouncedYearRange,
      filters.language,
      selectedRegion,
      filters.includeAdult,
    ],
  );

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      const params = buildQueryParams(1);

      try {
        let response;
        if (filters.query) {
          // Search functionality
          response = await fetchTMDB('/search/multi', {
            query: filters.query,
            include_adult: filters.includeAdult,
            ...params,
          });
        } else {
          if (mediaType === 'movie') {
            response = await fetchTMDB('/discover/movie', params);
          } else {
            response = await fetchTMDB('/discover/tv', params);
          }
        }

        const formattedResults = response.results
          .filter((item: any) => item.media_type !== 'person')
          .map((item: any) => ({
            id: item.id,
            name: item.media_type === 'movie' ? item.title : item.name,
            description: item.overview,
            poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            background: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
            type: 'meta',
            provider: 'tmdb',
            metaType: item.media_type || mediaType,
            releaseDate:
              item.media_type === 'movie'
                ? item.release_date
                : item.first_air_date,
            encoded: encodeURIComponent(
              `tmdb/${item.media_type || mediaType}/${item.id}`,
            ),
          }));

        setResults(formattedResults);
        setTotalResults(response.total_results);
        setTotalPages(response.total_pages);
        setHasNextPage(response.page < response.total_pages);
      } catch (error) {
        console.error('Error fetching results:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }

      // Update URL params
      const newSearchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          newSearchParams.set(key, value.toString());
        }
      });

      setSearchParams(newSearchParams);
    };

    fetchResults();
  }, [
    mediaType,
    sortBy,
    selectedGenres,
    debouncedRatingRange,
    debouncedYearRange,
    activeQuickFilter,
    filters.query,
    filters.includeAdult,
    filters.language,
    selectedRegion,
    buildQueryParams,
    setSearchParams,
  ]);

  // Load more items for infinite scrolling
  const loadMoreItems = useCallback(async () => {
    if (isLoading || currentPage >= totalPages) return;

    const nextPage = currentPage + 1;
    setIsLoading(true);

    try {
      const params = buildQueryParams(nextPage);
      let response;

      if (filters.query) {
        response = await fetchTMDB('/search/multi', {
          query: filters.query,
          include_adult: filters.includeAdult,
          ...params,
        });
      } else {
        if (mediaType === 'movie') {
          response = await fetchTMDB('/discover/movie', params);
        } else {
          response = await fetchTMDB('/discover/tv', params);
        }
      }

      const newResults = response.results
        .filter((item: any) => item.media_type !== 'person')
        .map((item: any) => ({
          id: item.id,
          name: item.media_type === 'movie' ? item.title : item.name,
          description: item.overview,
          poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
          background: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
          type: 'meta',
          provider: 'tmdb',
          metaType: item.media_type || mediaType,
          releaseDate:
            item.media_type === 'movie'
              ? item.release_date
              : item.first_air_date,
          encoded: encodeURIComponent(
            `tmdb/${item.media_type || mediaType}/${item.id}`,
          ),
        }));

      // Merge results, filtering out any duplicates by ID
      const uniqueResults = Array.from(
        new Map(
          [...results, ...newResults].map((item) => [item.id, item]),
        ).values(),
      );

      setResults(uniqueResults);
      setCurrentPage(nextPage);
      setHasNextPage(nextPage < response.total_pages);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    currentPage,
    totalPages,
    results,
    buildQueryParams,
    filters.query,
    filters.includeAdult,
    mediaType,
  ]);

  // Handle media type change
  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as 'movie' | 'tv');
    setActiveQuickFilter('');
  };

  // Handle sort change
  const handleSortChange = (value: string) => {
    const sortValue = value as TMDBFilters['sortBy'];
    if (sortValue) {
      setSortBy(sortValue);
    }
    setActiveQuickFilter(''); // Clear quick filter when manually sorting
  };

  // Handle genre selection
  const toggleGenre = (genreId: number) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        return prev.filter((id) => id !== genreId);
      } else {
        return [...prev, genreId];
      }
    });
    setActiveQuickFilter(''); // Clear quick filter when manually selecting genres
  };

  // Handle rating change
  const handleRatingChange = (value: [number, number]) => {
    setRatingRange(value);
    setActiveQuickFilter(''); // Clear quick filter when manually adjusting rating
  };

  // Handle year change
  const handleYearChange = (value: [number, number]) => {
    setYearRange(value);
    setActiveQuickFilter(''); // Clear quick filter when manually adjusting year
  };

  // Handle region change
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setActiveQuickFilter(''); // Clear quick filter when manually changing region
  };

  // Set quick filter and update other filters accordingly
  const setQuickFilter = (filter: QuickFilter | null) => {
    if (!filter) {
      setActiveQuickFilter('');
      return;
    }

    setActiveQuickFilter(filter.id);

    // Update specific filters based on quick filter properties
    if (filter.sortBy) {
      setSortBy(filter.sortBy as TMDBFilters['sortBy'] as never);
    }

    if (filter.voteAverage !== undefined) {
      setRatingRange([filter.voteAverage, 10]);
    } else {
      setRatingRange([0, 10]);
    }

    if (filter.genres && filter.genres.length > 0) {
      setSelectedGenres(filter.genres);
    } else {
      setSelectedGenres([]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedGenres([]);
    setRatingRange([0, 10]);
    setYearRange([1900, new Date().getFullYear()]);
    setSortBy('popularity.desc');
    setActiveQuickFilter('');
  };

  // Handle page change
  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    // Filter states
    mediaType,
    sortBy,
    ratingRange,
    yearRange,
    genres: mediaType === 'movie' ? movieGenres : tvGenres,
    selectedGenres,
    selectedRegion,
    regions,
    filterExpanded: false,
    activeQuickFilter,

    // Results states
    results,
    totalResults,
    totalPages,
    currentPage,
    isLoading,
    loading: isLoading, // Alias for backward compatibility
    error,
    hasNextPage,

    // Filter handlers
    handleMediaTypeChange,
    handleSortChange,
    handleRatingChange,
    handleYearChange,
    handleRegionChange,
    toggleGenre,
    clearFilters,
    changePage,
    loadMoreItems,

    // Quick filter handler
    setQuickFilter,

    // Helper functions
    hasActiveFilters,

    // Additional data
    movieGenres,
    tvGenres,
  };
};
