import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Genre, Region, TMDBFilters } from '@/hooks/useTMDBExplore';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface ExploreFiltersProps {
  filters: TMDBFilters;
  onFiltersChange: (filters: TMDBFilters) => void;
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  movieGenres?: Genre[];
  tvGenres?: Genre[];
  ratingRange?: [number, number];
  yearRange?: [number, number];
  onRatingChange: (range: [number, number]) => void;
  onYearChange: (range: [number, number]) => void;
  onSortChange: (sort: string) => void;
  onGenreToggle: (id: number) => void;
  onClearFilters: () => void;
  selectedGenres?: number[];
}

type SortByOption =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'release_date.desc'
  | 'primary_release_date.desc'
  | 'revenue.desc'
  | 'vote_count.desc';

interface SortOption {
  value: SortByOption;
  label: string;
}

const sortOptions: SortOption[] = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Recently Released' },
  { value: 'primary_release_date.desc', label: 'Release Date' },
  { value: 'revenue.desc', label: 'Highest Revenue' },
  { value: 'vote_count.desc', label: 'Most Voted' },
];

export const ExploreFilters: React.FC<ExploreFiltersProps> = ({
  filters,
  onFiltersChange,
  regions,
  selectedRegion,
  onRegionChange,
  movieGenres = [],
  tvGenres = [],
  ratingRange = [0, 10],
  yearRange = [1900, new Date().getFullYear()],
  onRatingChange,
  onYearChange,
  onSortChange,
  onGenreToggle,
  onClearFilters,
  selectedGenres = [],
}) => {
  const handleMediaTypeChange = (mediaType: 'movie' | 'tv') => {
    onFiltersChange({ ...filters, mediaType });
  };

  const handleSortChange = (sortBy: SortByOption) => {
    onSortChange(sortBy);
  };

  const handleGenreChange = (genreId: number) => {
    onGenreToggle(genreId);
  };

  const handleLanguageChange = (language: string) => {
    onFiltersChange({ ...filters, language });
  };

  const handleAdultChange = (checked: boolean) => {
    onFiltersChange({ ...filters, includeAdult: checked });
  };

  const clearFilters = () => {
    onClearFilters();
  };

  const currentGenres = filters.mediaType === 'movie' ? movieGenres : tvGenres;

  return (
    <div className="w-full mt-14 h-full bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-zinc-100" />
            <h2 className="text-lg font-semibold text-zinc-100 heading-font">
              Filters
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-100 hover:text-white hover:bg-zinc-800"
            onClick={clearFilters}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* Media Type */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Type</h3>
            <div className="flex gap-2">
              <Button
                variant={
                  filters.mediaType === 'movie' ? 'destructive' : 'default'
                }
                className="flex-1"
                size="sm"
                onClick={() => handleMediaTypeChange('movie')}
              >
                Movies
              </Button>
              <Button
                variant={filters.mediaType === 'tv' ? 'destructive' : 'default'}
                size="sm"
                onClick={() => handleMediaTypeChange('tv')}
                className="flex-1"
              >
                TV Shows
              </Button>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Sort By</h3>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Select sort option" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-100 hover:bg-zinc-800"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating Range */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Rating</h3>
            <div className="px-2">
              <Slider
                value={ratingRange}
                onValueChange={onRatingChange}
                min={0}
                max={10}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-zinc-400 mt-2">
                <span>{ratingRange[0].toFixed(1)}</span>
                <span>{ratingRange[1].toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Year</h3>
            <div className="px-2">
              <Slider
                value={yearRange}
                onValueChange={onYearChange}
                min={1900}
                max={new Date().getFullYear()}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-zinc-400 mt-2">
                <span>{yearRange[0]}</span>
                <span>{yearRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Region */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Region</h3>
            <select
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {regions.map((region) => (
                <option
                  key={region.code}
                  value={region.code}
                  className="bg-zinc-900 text-zinc-100"
                >
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-zinc-100">Language</h3>
            <Input
              type="text"
              placeholder="en-US"
              value={filters.language || ''}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Genres */}
          <div className="space-y-2 mb-5">
            <h3 className="text-sm font-medium text-zinc-100">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {currentGenres?.map((genre) => (
                <Button
                  key={genre.id}
                  size="sm"
                  variant={
                    selectedGenres.map((res) => +res).includes(genre.id)
                      ? 'destructive'
                      : 'default'
                  }
                  onClick={() => handleGenreChange(genre.id)}
                >
                  {genre.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Rating */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-100">Content Rating</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeAdult"
              checked={filters.includeAdult}
              onCheckedChange={handleAdultChange}
              className="border-zinc-700 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            />
            <Label
              htmlFor="includeAdult"
              className="text-sm text-zinc-100 cursor-pointer"
            >
              Include Adult Content
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
