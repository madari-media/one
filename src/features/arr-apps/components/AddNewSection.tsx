import React, { useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import { Film, FolderOpen, Gauge, Loader2, Monitor, Plus, Search, Settings, Tv } from 'lucide-react';
import { SonarrService } from '@/service/arr/sonarr.service';
import { RadarrService } from '@/service/arr/radarr.service';
import { SearchResult } from '@/service/arr/base-arr.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

interface QualityProfile {
  id: number;
  name: string;
}

interface RootFolder {
  id: number;
  path: string;
  freeSpace: number;
}

interface LanguageProfile {
  id: number;
  name: string;
}

interface AddConfiguration {
  qualityProfileId: number;
  languageProfileId?: number;
  rootFolderPath: string;
  monitored: boolean;
  searchForMissingEpisodes: boolean;
  searchForMovie: boolean;
  seasonFolder: boolean;
  addOptions: {
    monitor: string;
    searchForMissingEpisodes?: boolean;
    searchForMovie?: boolean;
  };
}

const AddNewSection: React.FC = () => {
  const { connections } = useArrApps();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState<'series' | 'movies'>('series');
  
  // Dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [adding, setAdding] = useState(false);
  
  // Configuration options
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([]);
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([]);
  const [languageProfiles, setLanguageProfiles] = useState<LanguageProfile[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Form state
  const [config, setConfig] = useState<AddConfiguration>({
    qualityProfileId: 1,
    languageProfileId: 1,
    rootFolderPath: '',
    monitored: true,
    searchForMissingEpisodes: true,
    searchForMovie: true,
    seasonFolder: true,
    addOptions: {
      monitor: 'all',
      searchForMissingEpisodes: true,
      searchForMovie: true,
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      let results: SearchResult[] = [];

      if (searchType === 'series') {
        const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
        if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
          const sonarrService = new SonarrService({
            baseUrl: sonarrConnection.config.baseUrl,
            apiKey: sonarrConnection.config.apiKey,
          });
          results = await sonarrService.search(searchQuery);
        }
      } else {
        const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
        if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
          const radarrService = new RadarrService({
            baseUrl: radarrConnection.config.baseUrl,
            apiKey: radarrConnection.config.apiKey,
          });
          results = await radarrService.search(searchQuery);
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const loadConfigurationOptions = async (type: 'series' | 'movies') => {
    setLoadingOptions(true);
    try {
      const connection = type === 'series' 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      // Load quality profiles
      const qualityResponse = await fetch(`${connection.config.baseUrl}/api/v3/qualityprofile`, {
        headers: { 'X-Api-Key': connection.config.apiKey }
      });
      const qualities = await qualityResponse.json();
      setQualityProfiles(qualities);

      // Load root folders
      const rootResponse = await fetch(`${connection.config.baseUrl}/api/v3/rootfolder`, {
        headers: { 'X-Api-Key': connection.config.apiKey }
      });
      const roots = await rootResponse.json();
      setRootFolders(roots);

      // Load language profiles (Sonarr only)
      if (type === 'series') {
        const langResponse = await fetch(`${connection.config.baseUrl}/api/v3/languageprofile`, {
          headers: { 'X-Api-Key': connection.config.apiKey }
        });
        const languages = await langResponse.json();
        setLanguageProfiles(languages);
      }

      // Set default values
      setConfig(prev => ({
        ...prev,
        qualityProfileId: qualities[0]?.id || 1,
        languageProfileId: type === 'series' ? (languageProfiles[0]?.id || 1) : undefined,
        rootFolderPath: roots[0]?.path || '',
      }));

    } catch (error) {
      console.error('Failed to load configuration options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleAddClick = async (result: SearchResult) => {
    setSelectedResult(result);
    await loadConfigurationOptions(searchType);
    setShowAddDialog(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedResult) return;

    setAdding(true);
    try {
      if (searchType === 'series' && selectedResult.tvdbId) {
        const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
        if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
          const sonarrService = new SonarrService({
            baseUrl: sonarrConnection.config.baseUrl,
            apiKey: sonarrConnection.config.apiKey,
          });
          
          // Use the enhanced addSeries method with full configuration
          await sonarrService.addSeries(
            selectedResult.tvdbId,
            config.qualityProfileId,
            config.languageProfileId || 1,
            config.rootFolderPath
          );
          alert('Series added successfully!');
        }
      } else if (searchType === 'movies' && selectedResult.tmdbId) {
        const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
        if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
          const radarrService = new RadarrService({
            baseUrl: radarrConnection.config.baseUrl,
            apiKey: radarrConnection.config.apiKey,
          });
          
          // Use the enhanced addMovie method with full configuration  
          await radarrService.addMovie(
            selectedResult.tmdbId,
            config.qualityProfileId,
            config.rootFolderPath
          );
          alert('Movie added successfully!');
        }
      }
      
      setShowAddDialog(false);
      setSelectedResult(null);
    } catch (error) {
      console.error('Failed to add:', error);
      alert('Failed to add. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderAddDialog = () => {
    if (!selectedResult) return null;

    const isSeries = searchType === 'series';

    return (
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) setSelectedResult(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${isSeries ? 'bg-blue-600' : 'bg-yellow-600'}`}>
                {isSeries ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Add {isSeries ? 'Series' : 'Movie'}</DialogTitle>
                <DialogDescription>{selectedResult.title} {selectedResult.year && `(${selectedResult.year})`}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {loadingOptions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                <span className="ml-3 text-zinc-400">Loading configuration options...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preview */}
                <div className="md:col-span-1">
                  {selectedResult.images && selectedResult.images.length > 0 ? (
                    <img
                      src={selectedResult.images[0]}
                      alt={selectedResult.title}
                      className="w-full rounded-lg shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-zinc-700 rounded-lg flex items-center justify-center">
                      {isSeries ? <Tv className="w-16 h-16 text-zinc-400" /> : <Film className="w-16 h-16 text-zinc-400" />}
                    </div>
                  )}
                  
                  {selectedResult.overview && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-white mb-2">Overview</h3>
                      <p className="text-sm text-zinc-300">{selectedResult.overview}</p>
                    </div>
                  )}
                </div>

                {/* Configuration */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Configuration</h3>
                    
                    {/* Quality Profile */}
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <Gauge className="w-4 h-4" />
                          Quality Profile
                        </label>
                        <select
                          value={config.qualityProfileId}
                          onChange={(e) => setConfig(prev => ({ ...prev, qualityProfileId: parseInt(e.target.value) }))}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          {qualityProfiles.map(profile => (
                            <option key={profile.id} value={profile.id}>{profile.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Language Profile (Sonarr only) */}
                      {isSeries && languageProfiles.length > 0 && (
                        <div>
                          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                            <Settings className="w-4 h-4" />
                            Language Profile
                          </label>
                          <select
                            value={config.languageProfileId || 1}
                            onChange={(e) => setConfig(prev => ({ ...prev, languageProfileId: parseInt(e.target.value) }))}
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            {languageProfiles.map(profile => (
                              <option key={profile.id} value={profile.id}>{profile.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Root Folder */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                          <FolderOpen className="w-4 h-4" />
                          Download Location
                        </label>
                        <select
                          value={config.rootFolderPath}
                          onChange={(e) => setConfig(prev => ({ ...prev, rootFolderPath: e.target.value }))}
                          className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          {rootFolders.map(folder => (
                            <option key={folder.id} value={folder.path}>
                              {folder.path} ({formatBytes(folder.freeSpace)} free)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Monitoring Options */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Monitoring Options</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={config.monitored}
                          onChange={(e) => setConfig(prev => ({ ...prev, monitored: e.target.checked }))}
                          className="w-4 h-4 text-red-500 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500"
                        />
                        <Monitor className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">Monitor for new episodes/releases</span>
                      </label>

                      {isSeries ? (
                        <>
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={config.searchForMissingEpisodes}
                              onChange={(e) => setConfig(prev => ({ ...prev, searchForMissingEpisodes: e.target.checked }))}
                              className="w-4 h-4 text-red-500 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500"
                            />
                            <Search className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-300">Search for missing episodes</span>
                          </label>

                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={config.seasonFolder}
                              onChange={(e) => setConfig(prev => ({ ...prev, seasonFolder: e.target.checked }))}
                              className="w-4 h-4 text-red-500 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500"
                            />
                            <FolderOpen className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-300">Use season folders</span>
                          </label>

                          <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">Monitor Episodes</label>
                            <select
                              value={config.addOptions.monitor}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                addOptions: { ...prev.addOptions, monitor: e.target.value }
                              }))}
                              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="all">All Episodes</option>
                              <option value="future">Future Episodes</option>
                              <option value="missing">Missing Episodes</option>
                              <option value="existing">Existing Episodes</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.searchForMovie}
                            onChange={(e) => setConfig(prev => ({ ...prev, searchForMovie: e.target.checked }))}
                            className="w-4 h-4 text-red-500 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500"
                          />
                          <Search className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm text-zinc-300">Search for movie on add</span>
                        </label>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-700">
            <button
              onClick={() => {
                setShowAddDialog(false);
                setSelectedResult(null);
              }}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdd}
              disabled={adding}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add {isSeries ? 'Series' : 'Movie'}
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const sonarrEnabled = connections.some(c => c.type === 'sonarr' && c.enabled);
  const radarrEnabled = connections.some(c => c.type === 'radarr' && c.enabled);

  if (!sonarrEnabled && !radarrEnabled) {
    return (
      <div className="text-center py-12">
        <Plus className="w-12 h-12 mx-auto mb-4 text-zinc-400 opacity-50" />
        <h3 className="text-lg font-medium text-zinc-300 mb-2">No Apps Configured</h3>
        <p className="text-zinc-400">
          Please configure and enable Sonarr or Radarr to add new content.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Add New Content</h2>
      
      {/* Search Type Toggle */}
      <div className="flex bg-zinc-700 rounded-lg p-1 mb-6 w-fit">
        {sonarrEnabled && (
          <button
            onClick={() => setSearchType('series')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              searchType === 'series'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Tv className="w-4 h-4 inline mr-2" />
            Series
          </button>
        )}
        {radarrEnabled && (
          <button
            onClick={() => setSearchType('movies')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              searchType === 'movies'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Film className="w-4 h-4 inline mr-2" />
            Movies
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search for ${searchType}...`}
            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-zinc-400" />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {searchResults.map((result, index) => (
          <div key={index} className="bg-zinc-700/50 rounded-lg p-4 hover:bg-zinc-700/70 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                {result.images && result.images.length > 0 ? (
                  <img
                    src={result.images[0]}
                    alt={result.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-24 bg-zinc-600 rounded flex items-center justify-center">
                    {searchType === 'series' ? (
                      <Tv className="w-8 h-8 text-zinc-400" />
                    ) : (
                      <Film className="w-8 h-8 text-zinc-400" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{result.title}</h3>
                  {result.year && (
                    <p className="text-sm text-zinc-400">({result.year})</p>
                  )}
                  {result.overview && (
                    <p className="text-sm text-zinc-300 mt-2 line-clamp-3">
                      {result.overview}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {result.tvdbId && (
                      <span className="text-xs text-zinc-400">TVDB: {result.tvdbId}</span>
                    )}
                    {result.tmdbId && (
                      <span className="text-xs text-zinc-400">TMDB: {result.tmdbId}</span>
                    )}
                    {result.imdbId && (
                      <span className="text-xs text-zinc-400">IMDB: {result.imdbId}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAddClick(result)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium text-sm"
              >
                <Settings className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        ))}

        {searchResults.length === 0 && searchQuery && !searching && (
          <div className="text-center py-8 text-zinc-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>
      
      {/* Add Configuration Dialog */}
      {renderAddDialog()}
    </div>
  );
};

export default AddNewSection;