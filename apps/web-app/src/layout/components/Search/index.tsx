import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Meta, MetaPerson } from '@/service/type';
import { useSearch } from '@/service/catalog/provider';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { results, loading: isSearching } = useSearch(searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Navigate to details page when a search result is clicked
  const handleMetaClick = (result: Meta) => {
    navigate(`/meta/${result.encoded}`);
    clearSearch();
  };

  const handlePersonClick = (result: MetaPerson) => {
    navigate(`/person/${result.encoded}`);
    clearSearch();
  };

  const renderMetaResult = (result: Meta) => (
    <div
      key={`${result.metaType}-${result.id}`}
      className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition-colors"
      onClick={() => handleMetaClick(result)}
    >
      <div className="w-12 h-18 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
        {result.poster ? (
          <img
            src={result.poster}
            alt={result.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium text-sm truncate">
          {result.name}
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="capitalize">{result.metaType}</span>
          {result.releaseDate && (
            <>
              <span>•</span>
              <span>{new Date(result.releaseDate).getFullYear()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderPersonResult = (result: MetaPerson) => (
    <div
      key={`person-${result.id}`}
      className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition-colors"
      onClick={() => handlePersonClick(result)}
    >
      <div className="w-12 h-18 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
        {result.poster ? (
          <img
            src={result.poster}
            alt={result.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium text-sm truncate">
          {result.name}
        </h4>
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="capitalize">Person</span>
          <span>•</span>
          <span>{result.gender}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`relative transition-all duration-300 ease-in-out ${
        isFocused ? 'w-full max-w-4xl' : 'w-full max-w-md'
      }`}
      ref={searchRef}
    >
      <SearchIcon
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
        size={18}
      />
      <Input
        type="text"
        placeholder="Search movies, TV shows..."
        className={`pl-10 pr-10 bg-zinc-800/50 border-zinc-700 text-zinc-300 placeholder:text-zinc-500 rounded-xl focus:border-orange-500 focus:ring-orange-500/20 w-full transition-all duration-300 ${
          isFocused ? 'bg-zinc-800/80' : ''
        }`}
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={() => {
          setIsFocused(true);
          if (searchQuery.length >= 3) {
            setShowResults(true);
          }
        }}
        onBlur={() => {
          if (!searchQuery) {
            setIsFocused(false);
          }
        }}
      />
      {searchQuery && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
          onClick={clearSearch}
        >
          <X size={16} />
        </button>
      )}

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="inline-block w-6 h-6 border-2 border-zinc-500 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-zinc-400 text-sm mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[60vh] overflow-y-auto">
              {results.map((result) =>
                result.type === 'meta'
                  ? renderMetaResult(result as Meta)
                  : renderPersonResult(result as MetaPerson),
              )}
            </div>
          ) : searchQuery.length >= 3 ? (
            <div className="p-4 text-center text-zinc-400">
              No results found for "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
