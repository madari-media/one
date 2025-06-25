import React, { useEffect, useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileX,
  Film,
  Grid,
  List,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  Tv,
  XCircle
} from 'lucide-react';
import { SonarrService } from '@/service/arr/sonarr.service';
import { RadarrService } from '@/service/arr/radarr.service';
import { MovieInfo, SeriesInfo } from '@/service/arr/base-arr.service';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Episode {
  id: number;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: string;
  hasFile: boolean;
  monitored: boolean;
  overview?: string;
  stillPath?: string;
}

interface Release {
  guid: string;
  quality: string;
  qualityVersion: number;
  releaseGroup: string;
  title: string;
  size: number;
  indexer: string;
  indexerId: number;
  infoUrl: string;
  approved: boolean;
  temporarilyRejected: boolean;
  rejected: boolean;
  rejections: string[];
  publishDate: string;
  commentUrl: string;
  downloadUrl: string;
  magnet_uri: string;
  protocol: string;
  seeders?: number;
  leechers?: number;
  language: string;
  age: number;
}

interface SearchState {
  isSearching: boolean;
  searchType: 'automatic' | 'interactive';
  releases: Release[];
  searchId?: string;
  error?: string;
}

interface DetailedSeriesInfo extends SeriesInfo {
  episodes?: Episode[];
}

interface DetailedMovieInfo extends MovieInfo {
  runtime?: number;
  genres?: string[];
  ratings?: { imdb?: number; tmdb?: number; rottenTomatoes?: number };
  studio?: string;
  certification?: string;
}

type SortField = 'title' | 'year' | 'status' | 'added' | 'size';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const SeriesMoviesSection: React.FC = () => {
  const { connections } = useArrApps();
  const [series, setSeries] = useState<SeriesInfo[]>([]);
  const [movies, setMovies] = useState<MovieInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<DetailedSeriesInfo | DetailedMovieInfo | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    searchType: 'automatic',
    releases: [],
  });
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchTarget, setSearchTarget] = useState<{
    type: 'series' | 'season' | 'episode' | 'movie';
    item: any;
    episodeId?: number;
    seasonNumber?: number;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, [connections]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      // Load series from Sonarr
      const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
      if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
        const sonarrService = new SonarrService({
          baseUrl: sonarrConnection.config.baseUrl,
          apiKey: sonarrConnection.config.apiKey,
        });
        const seriesData = await sonarrService.getItems() as SeriesInfo[];
        setSeries(seriesData);
      }

      // Load movies from Radarr
      const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
      if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
        const radarrService = new RadarrService({
          baseUrl: radarrConnection.config.baseUrl,
          apiKey: radarrConnection.config.apiKey,
        });
        const moviesData = await radarrService.getItems() as MovieInfo[];
        setMovies(moviesData);
      }
    } catch (error) {
      console.error('Failed to load series/movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItemDetails = async (item: SeriesInfo | MovieInfo) => {
    setLoadingDetails(true);
    try {
      if ('seasons' in item) {
        // Load series details with episodes
        const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
        if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
          // Fetch episodes for the series
          try {
            const episodesResponse = await fetch(`${sonarrConnection.config.baseUrl}/api/v3/episode?seriesId=${item.id}`, {
              headers: { 'X-Api-Key': sonarrConnection.config.apiKey },
            });
            const episodes = await episodesResponse.json();
            
            const detailedSeries: DetailedSeriesInfo = {
              ...item,
              episodes: episodes.map((ep: any) => ({
                id: ep.id,
                title: ep.title,
                episodeNumber: ep.episodeNumber,
                seasonNumber: ep.seasonNumber,
                airDate: ep.airDate,
                hasFile: ep.hasFile,
                monitored: ep.monitored,
                overview: ep.overview,
              })),
            };
            setSelectedItem(detailedSeries);
          } catch (error) {
            setSelectedItem(item as DetailedSeriesInfo);
          }
        }
      } else {
        // Load movie details
        const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
        if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
          try {
            const movieResponse = await fetch(`${radarrConnection.config.baseUrl}/api/v3/movie/${item.id}`, {
              headers: { 'X-Api-Key': radarrConnection.config.apiKey },
            });
            const movieDetails = await movieResponse.json();
            
            const detailedMovie: DetailedMovieInfo = {
              ...item,
              runtime: movieDetails.runtime,
              genres: movieDetails.genres?.map((g: any) => g.name) || [],
              ratings: {
                imdb: movieDetails.ratings?.imdb?.value,
                tmdb: movieDetails.ratings?.tmdb?.value,
                rottenTomatoes: movieDetails.ratings?.rottenTomatoes?.value,
              },
              studio: movieDetails.studio,
              certification: movieDetails.certification,
            };
            setSelectedItem(detailedMovie);
          } catch (error) {
            setSelectedItem(item as DetailedMovieInfo);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load item details:', error);
      setSelectedItem(item as DetailedSeriesInfo | DetailedMovieInfo);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleItemClick = async (item: SeriesInfo | MovieInfo) => {
    setShowDetailsDialog(true);
    await loadItemDetails(item);
  };

  const performInteractiveSearch = async (target: {
    type: 'series' | 'season' | 'episode' | 'movie';
    item: any;
    episodeId?: number;
    seasonNumber?: number;
  }) => {
    setSearchTarget(target);
    setSearchState({ isSearching: true, searchType: 'interactive', releases: [] });
    setShowSearchDialog(true);

    try {
      let endpoint = '';
      const isSeries = target.type !== 'movie';
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      // Determine the correct search endpoint
      switch (target.type) {
        case 'series':
          endpoint = `/api/v3/release?seriesId=${target.item.id}`;
          break;
        case 'season':
          endpoint = `/api/v3/release?seriesId=${target.item.id}&seasonNumber=${target.seasonNumber}`;
          break;
        case 'episode':
          endpoint = `/api/v3/release?episodeId=${target.episodeId}`;
          break;
        case 'movie':
          endpoint = `/api/v3/release?movieId=${target.item.id}`;
          break;
      }

      const response = await fetch(`${connection.config.baseUrl}${endpoint}`, {
        headers: { 'X-Api-Key': connection.config.apiKey },
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const releases = await response.json();
      
      setSearchState({
        isSearching: false,
        searchType: 'interactive',
        releases: releases.map((release: any) => ({
          guid: release.guid,
          quality: release.quality?.quality?.name || 'Unknown',
          qualityVersion: release.quality?.revision?.version || 1,
          releaseGroup: release.releaseGroup || 'Unknown',
          title: release.title,
          size: release.size || 0,
          indexer: release.indexer,
          indexerId: release.indexerId,
          infoUrl: release.infoUrl,
          approved: release.approved,
          temporarilyRejected: release.temporarilyRejected,
          rejected: release.rejected,
          rejections: release.rejections || [],
          publishDate: release.publishDate,
          commentUrl: release.commentUrl,
          downloadUrl: release.downloadUrl,
          protocol: release.protocol,
          seeders: release.seeders,
          leechers: release.leechers,
          language: release.language?.name || 'Unknown',
          age: release.age,
        })),
      });
    } catch (error) {
      console.error('Interactive search failed:', error);
      setSearchState({
        isSearching: false,
        searchType: 'interactive',
        releases: [],
        error: error instanceof Error ? error.message : 'Search failed',
      });
    }
  };

  const performAutomaticSearch = async (target: {
    type: 'series' | 'season' | 'episode' | 'movie';
    item: any;
    episodeId?: number;
    seasonNumber?: number;
  }) => {
    setSearchState({ isSearching: true, searchType: 'automatic', releases: [] });

    try {
      let endpoint = '';
      const isSeries = target.type !== 'movie';
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      // Determine the correct search endpoint
      switch (target.type) {
        case 'series':
          endpoint = `/api/v3/command`;
          break;
        case 'season':
          endpoint = `/api/v3/command`;
          break;
        case 'episode':
          endpoint = `/api/v3/command`;
          break;
        case 'movie':
          endpoint = `/api/v3/command`;
          break;
      }

      const payload = {
        name: isSeries ? 'EpisodeSearch' : 'MoviesSearch',
        ...(target.type === 'episode' && { episodeIds: [target.episodeId] }),
        ...(target.type === 'season' && { seriesId: target.item.id, seasonNumber: target.seasonNumber }),
        ...(target.type === 'series' && { seriesId: target.item.id }),
        ...(target.type === 'movie' && { movieIds: [target.item.id] }),
      };

      const response = await fetch(`${connection.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'X-Api-Key': connection.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      setSearchState({
        isSearching: false,
        searchType: 'automatic',
        releases: [],
      });

      // Show success message
      alert('Automatic search started successfully!');
    } catch (error) {
      console.error('Automatic search failed:', error);
      setSearchState({
        isSearching: false,
        searchType: 'automatic',
        releases: [],
        error: error instanceof Error ? error.message : 'Search failed',
      });
    }
  };

  const downloadRelease = async (release: Release) => {
    if (!searchTarget) return;

    try {
      const isSeries = searchTarget.type !== 'movie';
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      console.log(release);

      const payload = {
        guid: release.guid,
        indexer: release.indexer,
        indexerId: release.indexerId,
      };

      const response = await fetch(`${connection.config.baseUrl}/api/v3/release`, {
        method: 'POST',
        headers: {
          'X-Api-Key': connection.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      alert('Download started successfully!');
      setShowSearchDialog(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const filteredAndSortedItems = () => {
    const items = activeTab === 'series' ? series : movies;
    
    // Filter by search query
    let filtered = items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Sort items
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'title':
          aVal = a.title;
          bVal = b.title;
          break;
        case 'year':
          aVal = a.year || 0;
          bVal = b.year || 0;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          aVal = a.title;
          bVal = b.title;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      }
    });

    return filtered;
  };

  const toggleSeasonExpansion = (seasonNumber: number) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonNumber)) {
      newExpanded.delete(seasonNumber);
    } else {
      newExpanded.add(seasonNumber);
    }
    setExpandedSeasons(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'continuing':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'ended':
        return <Pause className="w-4 h-4 text-red-500" />;
      case 'downloaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'continuing':
        return 'bg-green-600';
      case 'ended':
        return 'bg-red-600';
      case 'downloaded':
        return 'bg-green-600';
      case 'missing':
        return 'bg-red-600';
      default:
        return 'bg-yellow-600';
    }
  };

  const renderSearchDialog = () => {
    if (!searchTarget) return null;

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatAge = (age: number) => {
      if (age < 60) return `${age}m`;
      if (age < 1440) return `${Math.floor(age / 60)}h`;
      return `${Math.floor(age / 1440)}d`;
    };

    const getQualityColor = (quality: string) => {
      const q = quality.toLowerCase();
      if (q.includes('2160p') || q.includes('4k')) return 'bg-purple-600';
      if (q.includes('1080p')) return 'bg-blue-600';
      if (q.includes('720p')) return 'bg-green-600';
      if (q.includes('480p')) return 'bg-yellow-600';
      return 'bg-zinc-600';
    };

    const getProtocolIcon = (protocol: string) => {
      return protocol.toLowerCase() === 'torrent' ? '🌱' : '📡';
    };

    return (
      <Dialog open={showSearchDialog} onOpenChange={(open) => {
        setShowSearchDialog(open);
        if (!open) setSearchState(prev => ({ ...prev, releases: [] }));
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Interactive Search</DialogTitle>
            <DialogDescription className="text-zinc-400 mt-1">
              {searchTarget.type === 'series' && `${searchTarget.item.title} - All Episodes`}
              {searchTarget.type === 'season' && `${searchTarget.item.title} - Season ${searchTarget.seasonNumber}`}
              {searchTarget.type === 'episode' && `${searchTarget.item.title} - Episode ${searchTarget.episodeId}`}
              {searchTarget.type === 'movie' && searchTarget.item.title}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {searchState.isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-zinc-400">Searching for releases...</span>
              </div>
            ) : searchState.error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium text-red-400 mb-2">Search Failed</h3>
                  <p className="text-zinc-400">{searchState.error}</p>
                  <button
                    onClick={() => {
                      if (searchTarget) {
                        performInteractiveSearch(searchTarget);
                      }
                    }}
                    className="mt-4 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium text-sm"
                  >
                    Retry Search
                  </button>
                </div>
              </div>
            ) : searchState.releases.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileX className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">No Releases Found</h3>
                  <p className="text-zinc-400">No releases found for this search. Try adjusting your indexers or search criteria.</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-zinc-400">
                    Found {searchState.releases.length} release{searchState.releases.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-600 rounded"></div>
                      Approved
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                      Pending
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-600 rounded"></div>
                      Rejected
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {searchState.releases.map((release, index) => (
                    <div
                      key={index}
                      className={`bg-zinc-700/50 rounded-lg p-4 border-l-4 ${
                        release.rejected
                          ? 'border-red-500'
                          : release.temporarilyRejected
                          ? 'border-yellow-500'
                          : release.approved
                          ? 'border-green-500'
                          : 'border-zinc-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getProtocolIcon(release.protocol)}</span>
                            <span className={`px-2 py-1 text-xs rounded ${getQualityColor(release.quality)}`}>
                              {release.quality}
                            </span>
                            <span className="px-2 py-1 text-xs bg-zinc-600 rounded">
                              {release.language}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {formatAge(release.age)}
                            </span>
                            {release.seeders !== undefined && (
                              <span className="text-xs text-green-400">
                                ↑{release.seeders} ↓{release.leechers}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-white mb-1 truncate" title={release.title}>
                            {release.title}
                          </h4>
                          
                          <div className="flex items-center gap-4 text-sm text-zinc-400">
                            <span>{release.indexer}</span>
                            <span>{formatBytes(release.size)}</span>
                            <span>{release.releaseGroup}</span>
                          </div>

                          {release.rejections.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-red-400 mb-1">Rejections:</p>
                              <div className="flex flex-wrap gap-1">
                                {release.rejections.map((rejection, i) => (
                                  <span key={i} className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">
                                    {rejection}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {release.infoUrl && (
                            <button
                              onClick={() => window.open(release.infoUrl, '_blank')}
                              className="p-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded transition-colors"
                              title="View Info"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => downloadRelease(release)}
                            className={`px-4 py-2 rounded transition-colors ${
                              release.rejected
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : release.temporarilyRejected
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                            title={release.rejected ? `Download anyway (Rejected: ${release.rejections.join(', ')})` : 'Download'}
                          >
                            <Download className="w-4 h-4 inline mr-2" />
                            {release.rejected ? 'Download Anyway' : 'Download'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderGridItem = (item: SeriesInfo | MovieInfo) => (
    <div
      key={item.id}
      className="bg-zinc-700/50 rounded-lg overflow-hidden hover:bg-zinc-700/70 transition-all duration-200 cursor-pointer group"
      onClick={() => handleItemClick(item)}
    >
      <div className="relative">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-zinc-600 flex items-center justify-center">
            {activeTab === 'series' ? (
              <Tv className="w-16 h-16 text-zinc-400" />
            ) : (
              <Film className="w-16 h-16 text-zinc-400" />
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Eye className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{item.title}</h3>
        {item.year && <p className="text-sm text-zinc-400">({item.year})</p>}
        {'seasons' in item && item.seasons && (
          <p className="text-xs text-zinc-400 mt-1">
            {item.seasons.length} seasons
          </p>
        )}
        {'network' in item && item.network && (
          <p className="text-xs text-zinc-300 mt-1">{item.network}</p>
        )}
      </div>
    </div>
  );

  const renderListItem = (item: SeriesInfo | MovieInfo) => (
    <div
      key={item.id}
      className="bg-zinc-700/50 rounded-lg overflow-hidden hover:bg-zinc-700/70 transition-colors cursor-pointer"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex items-center p-4">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-16 h-24 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-24 bg-zinc-600 rounded flex items-center justify-center">
            {activeTab === 'series' ? (
              <Tv className="w-8 h-8 text-zinc-400" />
            ) : (
              <Film className="w-8 h-8 text-zinc-400" />
            )}
          </div>
        )}
        <div className="ml-4 flex-1">
          <h3 className="font-semibold text-white">{item.title}</h3>
          {item.year && <p className="text-sm text-zinc-400">({item.year})</p>}
          {'network' in item && item.network && (
            <p className="text-sm text-zinc-300 mt-1">{item.network}</p>
          )}
          {'seasons' in item && item.seasons && (
            <p className="text-xs text-zinc-400 mt-1">
              {item.seasons.length} seasons
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon(item.status)}
            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-zinc-600 rounded transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-zinc-600 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsDialog = () => {
    if (!selectedItem) return null;

    const isSeries = 'seasons' in selectedItem;

    return (
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedItem.title}</DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-zinc-400">Loading details...</span>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex gap-6 mb-6">
                  {selectedItem.poster ? (
                    <img
                      src={selectedItem.poster}
                      alt={selectedItem.title}
                      className="w-48 h-72 object-cover rounded"
                    />
                  ) : (
                    <div className="w-48 h-72 bg-zinc-600 rounded flex items-center justify-center">
                      {isSeries ? (
                        <Tv className="w-16 h-16 text-zinc-400" />
                      ) : (
                        <Film className="w-16 h-16 text-zinc-400" />
                      )}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(selectedItem.status)}
                      <span className={`px-3 py-1 text-sm rounded ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                      {selectedItem.year && (
                        <span className="text-zinc-400">({selectedItem.year})</span>
                      )}
                    </div>

                    {selectedItem.overview && (
                      <p className="text-zinc-300 mb-4 leading-relaxed">
                        {selectedItem.overview}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {isSeries && 'network' in selectedItem && selectedItem.network && (
                        <div>
                          <span className="text-zinc-400">Network:</span>
                          <span className="ml-2 text-white">{selectedItem.network}</span>
                        </div>
                      )}
                      
                      {!isSeries && 'runtime' in selectedItem && selectedItem.runtime && (
                        <div>
                          <span className="text-zinc-400">Runtime:</span>
                          <span className="ml-2 text-white">{selectedItem.runtime} min</span>
                        </div>
                      )}

                      {!isSeries && 'genres' in selectedItem && selectedItem.genres && selectedItem.genres.length > 0 && (
                        <div>
                          <span className="text-zinc-400">Genres:</span>
                          <span className="ml-2 text-white">{selectedItem.genres.join(', ')}</span>
                        </div>
                      )}

                      {(selectedItem as DetailedMovieInfo).tmdbId && (
                        <div>
                          <span className="text-zinc-400">TMDB ID:</span>
                          <span className="ml-2 text-white">{selectedItem.tmdbId}</span>
                        </div>
                      )}

                      {selectedItem.imdbId && (
                        <div>
                          <span className="text-zinc-400">IMDB ID:</span>
                          <span className="ml-2 text-white">{selectedItem.imdbId}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <button 
                        onClick={loadData}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Refresh
                      </button>
                      <button 
                        onClick={() => performAutomaticSearch({ 
                          type: isSeries ? 'series' : 'movie', 
                          item: selectedItem 
                        })}
                        disabled={searchState.isSearching}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded transition-colors"
                      >
                        {searchState.isSearching && searchState.searchType === 'automatic' ? (
                          <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 inline mr-2" />
                        )}
                        Auto Search
                      </button>
                      <button 
                        onClick={() => performInteractiveSearch({ 
                          type: isSeries ? 'series' : 'movie', 
                          item: selectedItem 
                        })}
                        disabled={searchState.isSearching}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded transition-colors"
                      >
                        <Search className="w-4 h-4 inline mr-2" />
                        Interactive Search
                      </button>
                      <button className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded transition-colors">
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Seasons and Episodes for Series */}
                {isSeries && selectedItem.seasons && (
                  <div className="border-t border-zinc-700 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Seasons & Episodes</h3>
                    <div className="space-y-4">
                      {selectedItem.seasons.map((season) => (
                        <div key={season.seasonNumber} className="bg-zinc-700/30 rounded-lg">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleSeasonExpansion(season.seasonNumber)}
                              className="flex-1 flex items-center justify-between p-4 hover:bg-zinc-700/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {expandedSeasons.has(season.seasonNumber) ? (
                                  <ChevronDown className="w-5 h-5" />
                                ) : (
                                  <ChevronRight className="w-5 h-5" />
                                )}
                                <span className="font-medium">
                                  Season {season.seasonNumber}
                                </span>
                                <span className="text-zinc-400">
                                  ({season.episodeCount} episodes)
                                </span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  season.monitored ? 'bg-green-600' : 'bg-zinc-600'
                                }`}>
                                  {season.monitored ? 'Monitored' : 'Not Monitored'}
                                </span>
                              </div>
                            </button>
                            <div className="flex items-center gap-1 p-2">
                              <button
                                onClick={() => performAutomaticSearch({
                                  type: 'season',
                                  item: selectedItem,
                                  seasonNumber: season.seasonNumber,
                                })}
                                disabled={searchState.isSearching}
                                className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded transition-colors"
                                title="Auto Search Season"
                              >
                                <Search className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => performInteractiveSearch({
                                  type: 'season',
                                  item: selectedItem,
                                  seasonNumber: season.seasonNumber,
                                })}
                                disabled={searchState.isSearching}
                                className="p-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded transition-colors"
                                title="Interactive Search Season"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {expandedSeasons.has(season.seasonNumber) && selectedItem.episodes && (
                            <div className="px-4 pb-4">
                              <div className="space-y-2">
                                {selectedItem.episodes
                                  .filter(ep => ep.seasonNumber === season.seasonNumber)
                                  .map((episode) => (
                                    <div
                                      key={episode.id}
                                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">
                                            E{episode.episodeNumber.toString().padStart(2, '0')}
                                          </span>
                                          <span className="text-white">{episode.title}</span>
                                          {episode.hasFile ? (
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                          ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                          )}
                                        </div>
                                        {episode.airDate && (
                                          <p className="text-xs text-zinc-400 mt-1">
                                            {new Date(episode.airDate).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                          episode.monitored ? 'bg-green-600' : 'bg-zinc-600'
                                        }`}>
                                          {episode.monitored ? 'Monitored' : 'Unmonitored'}
                                        </span>
                                        <button
                                          onClick={() => performAutomaticSearch({
                                            type: 'episode',
                                            item: selectedItem,
                                            episodeId: episode.id,
                                          })}
                                          disabled={searchState.isSearching}
                                          className="p-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded transition-colors"
                                          title="Auto Search Episode"
                                        >
                                          <Search className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => performInteractiveSearch({
                                            type: 'episode',
                                            item: selectedItem,
                                            episodeId: episode.id,
                                          })}
                                          disabled={searchState.isSearching}
                                          className="p-1 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white rounded transition-colors"
                                          title="Interactive Search Episode"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        <span className="ml-3 text-zinc-400">Loading...</span>
      </div>
    );
  }

  const items = filteredAndSortedItems();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Series & Movies</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex bg-zinc-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-red-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list' ? 'bg-red-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex bg-zinc-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('series')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'series'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Tv className="w-4 h-4 inline mr-2" />
            Series ({series.length})
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'movies'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Film className="w-4 h-4 inline mr-2" />
            Movies ({movies.length})
          </button>
        </div>

        <div className="flex-1 relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles..."
            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-zinc-400" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="all">All Status</option>
          <option value="continuing">Continuing</option>
          <option value="ended">Ended</option>
          <option value="downloaded">Downloaded</option>
          <option value="missing">Missing</option>
        </select>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="title">Sort by Title</option>
          <option value="year">Sort by Year</option>
          <option value="status">Sort by Status</option>
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
        >
          {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' 
          : 'space-y-4'
      }`}>
        {items.length > 0 ? (
          items.map(item => viewMode === 'grid' ? renderGridItem(item) : renderListItem(item))
        ) : (
          <div className="text-center py-12 text-zinc-400 col-span-full">
            {activeTab === 'series' ? (
              <>
                <Tv className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No series found. Make sure Sonarr is configured and enabled.</p>
              </>
            ) : (
              <>
                <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No movies found. Make sure Radarr is configured and enabled.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Details Dialog */}
      {renderDetailsDialog()}

      {/* Interactive Search Dialog */}
      {renderSearchDialog()}
    </div>
  );
};

export default SeriesMoviesSection;