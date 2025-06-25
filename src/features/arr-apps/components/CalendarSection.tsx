import React, { useEffect, useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Film,
  Filter,
  Info,
  Loader2,
  Monitor,
  RefreshCw,
  Search,
  Tv
} from 'lucide-react';
import { SonarrService } from '@/service/arr/sonarr.service';
import { RadarrService } from '@/service/arr/radarr.service';
import { CalendarItem } from '@/service/arr/base-arr.service';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  formatDistanceToNow,
  isPast as isPastFns,
  isSameDay,
  isSameMonth,
  isToday as isTodayFns,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CalendarSection: React.FC = () => {
  const { connections } = useArrApps();
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'tv'>('all');

  useEffect(() => {
    loadCalendarData();
  }, [connections]);

  const loadCalendarData = async () => {
    setLoading(true);
    
    try {
      const items: CalendarItem[] = [];

      // Load from Sonarr
      const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
      if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
        console.log('Loading Sonarr calendar data from:', sonarrConnection.config.baseUrl);
        const sonarrService = new SonarrService({
          baseUrl: sonarrConnection.config.baseUrl,
          apiKey: sonarrConnection.config.apiKey,
        });
        const sonarrItems = await sonarrService.getCalendar();
        console.log('Sonarr calendar items:', sonarrItems.length, sonarrItems);
        items.push(...sonarrItems);
      } else {
        console.log('Sonarr not configured or disabled');
      }

      // Load from Radarr
      const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
      if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
        console.log('Loading Radarr calendar data from:', radarrConnection.config.baseUrl);
        const radarrService = new RadarrService({
          baseUrl: radarrConnection.config.baseUrl,
          apiKey: radarrConnection.config.apiKey,
        });
        const radarrItems = await radarrService.getCalendar();
        console.log('Radarr calendar items:', radarrItems.length, radarrItems);
        items.push(...radarrItems);
      } else {
        console.log('Radarr not configured or disabled');
      }

      console.log('Total calendar items:', items.length);

      // Sort by air date
      items.sort((a, b) => new Date(a.airDate).getTime() - new Date(b.airDate).getTime());
      setCalendarItems(items);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM dd, yyyy');
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isTodayFns(date)) {
      return 'Today';
    } else if (isPastFns(date)) {
      return `${formatDistanceToNow(date)} ago`;
    } else {
      return `in ${formatDistanceToNow(date)}`;
    }
  };

  const getDateStatus = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = addDays(startOfDay(now), 1);
    const nextWeek = addDays(startOfDay(now), 7);
    
    if (isTodayFns(date)) {
      return { status: 'today', color: 'text-primary font-medium' };
    } else if (isWithinInterval(date, { start: tomorrow, end: addDays(tomorrow, 1) })) {
      return { status: 'tomorrow', color: 'text-chart-2 font-medium' };
    } else if (isWithinInterval(date, { start: tomorrow, end: nextWeek })) {
      return { status: 'thisWeek', color: 'text-chart-3' };
    } else if (isPastFns(date)) {
      return { status: 'past', color: 'text-muted-foreground' };
    } else {
      return { status: 'future', color: 'text-foreground' };
    }
  };

  const isToday = (dateString: string) => {
    return isTodayFns(new Date(dateString));
  };

  const handleItemClick = (item: CalendarItem) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  const performAutomaticSearch = async (item: CalendarItem) => {
    if (!item) return;
    
    setIsSearching(true);
    try {
      const isSeries = !!item.series;
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      const endpoint = isSeries 
        ? `/api/v3/command`
        : `/api/v3/command`;

      const payload = isSeries
        ? {
            name: 'EpisodeSearch',
            episodeIds: [item.id]
          }
        : {
            name: 'MoviesSearch',
            movieIds: [item.id]
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

      alert('Automatic search started successfully!');
    } catch (error) {
      console.error('Automatic search failed:', error);
      alert('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  const performInteractiveSearch = async (item: CalendarItem) => {
    if (!item) return;

    setIsSearching(true);
    try {
      const isSeries = !!item.series;
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      const endpoint = isSeries 
        ? `/api/v3/release?episodeId=${item.id}`
        : `/api/v3/release?movieId=${item.id}`;

      const releases = await fetch(`${connection.config.baseUrl}${endpoint}`, {
        headers: {
          'X-Api-Key': connection.config.apiKey,
        },
      });

      if (!releases.ok) {
        throw new Error(`Interactive search failed: ${releases.status}`);
      }

      const releasesData = await releases.json();
      console.log('Available releases:', releasesData);
      
      if (releasesData.length === 0) {
        alert('No releases found for this item.');
      } else {
        alert(`Found ${releasesData.length} releases. Interactive search functionality can be expanded here.`);
      }
    } catch (error) {
      console.error('Interactive search failed:', error);
      alert('Interactive search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  const renderDetailDialog = () => {
    if (!selectedItem) return null;

    const isSeries = !!selectedItem.series;
    const itemData = isSeries ? selectedItem.series : selectedItem.movie;

    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${isSeries ? 'bg-blue-600' : 'bg-yellow-600'}`}>
                {isSeries ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{selectedItem.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className={`text-sm ${getDateStatus(selectedItem.airDate).color}`}>
                      {formatRelativeTime(selectedItem.airDate)}
                    </span>
                  </div>
                  <span className="text-sm text-zinc-400">
                    {formatDate(selectedItem.airDate)}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Poster */}
              {itemData?.poster && (
                <div className="md:col-span-1">
                  <img
                    src={itemData.poster}
                    alt={itemData.title}
                    className="w-full rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Details */}
              <div className={`${itemData?.poster ? 'md:col-span-2' : 'md:col-span-3'} space-y-6`}>
                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm rounded ${
                      selectedItem.hasFile ? 'bg-green-600' : 'bg-zinc-600'
                    }`}>
                      {selectedItem.hasFile ? 'Downloaded' : 'Missing'}
                    </span>
                    {itemData?.status && (
                      <span className="px-3 py-1 text-sm bg-blue-600 rounded">
                        {itemData.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">Type:</span>
                        <span className="text-sm text-white">{isSeries ? 'TV Episode' : 'Movie'}</span>
                      </div>
                      
                      {itemData?.year && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm text-zinc-300">Year:</span>
                          <span className="text-sm text-white">{itemData.year}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm text-zinc-300">Air Date:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">{formatDate(selectedItem.airDate)}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            getDateStatus(selectedItem.airDate).status === 'today' ? 'bg-red-600' :
                            getDateStatus(selectedItem.airDate).status === 'tomorrow' ? 'bg-orange-600' :
                            getDateStatus(selectedItem.airDate).status === 'thisWeek' ? 'bg-yellow-600' :
                            getDateStatus(selectedItem.airDate).status === 'past' ? 'bg-zinc-600' :
                            'bg-blue-600'
                          }`}>
                            {formatRelativeTime(selectedItem.airDate)}
                          </span>
                        </div>
                      </div>

                      {itemData?.status && (
                        <div className="flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-zinc-400" />
                          <span className="text-sm text-zinc-300">Status:</span>
                          <span className="text-sm text-white">{itemData.status}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Actions</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => performAutomaticSearch(selectedItem)}
                        disabled={isSearching}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-md transition-colors font-medium text-sm"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Automatic Search
                      </button>

                      <button
                        onClick={() => performInteractiveSearch(selectedItem)}
                        disabled={isSearching}
                        className="flex items-center gap-2 px-3 py-1.5 bg-accent dark:bg-accent/80 hover:bg-accent/90 dark:hover:bg-accent/70 disabled:bg-accent/50 disabled:cursor-not-allowed text-accent-foreground rounded-md transition-colors font-medium text-sm"
                      >
                        {isSearching ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        Interactive Search
                      </button>

                      {!selectedItem.hasFile && (
                        <button
                          className="flex items-center gap-2 px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white rounded-md transition-colors font-medium text-sm"
                          title="Download when available"
                        >
                          <Download className="w-4 h-4" />
                          Monitor
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Episode/Movie Info */}
            {isSeries && selectedItem.series && (
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <h3 className="text-lg font-semibold text-white mb-3">Series Information</h3>
                <div className="bg-zinc-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Tv className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">{selectedItem.series.title}</span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    This episode is part of the series "{selectedItem.series.title}" 
                    {selectedItem.series.year && ` (${selectedItem.series.year})`}
                  </p>
                </div>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading calendar...</span>
      </div>
    );
  }

  const filteredItems = calendarItems.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'movies') return !!item.movie;
    if (filterType === 'tv') return !!item.series;
    return true;
  });

  const getItemsForDate = (date: Date) => {
    return filteredItems.filter(item => 
      isSameDay(new Date(item.airDate), date)
    );
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(selectedDate));
    const end = endOfWeek(endOfMonth(selectedDate));
    return eachDayOfInterval({ start, end });
  };

  const handlePreviousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Release Calendar</h2>
          <p className="text-muted-foreground mt-1">
            Track upcoming releases from your monitored series and movies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-card dark:bg-card/50 rounded-lg p-1 border border-border">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
          <div className="flex items-center bg-card dark:bg-card/50 rounded-lg p-1 border border-border">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('movies')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'movies' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setFilterType('tv')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filterType === 'tv' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              TV Shows
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-card dark:bg-card/50 rounded-xl border border-border p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-foreground">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-muted/50 dark:bg-muted/20 p-3 text-center">
                <span className="text-sm font-medium text-muted-foreground">{day}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {getDaysInMonth().map((day, index) => {
              const items = getItemsForDate(day);
              const isCurrentMonth = isSameMonth(day, selectedDate);
              const isToday = isTodayFns(day);
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 bg-background dark:bg-background/50 ${
                    !isCurrentMonth ? 'opacity-40' : ''
                  } ${
                    isToday ? 'ring-2 ring-primary ring-inset' : ''
                  } hover:bg-accent/50 transition-colors cursor-pointer`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      isToday ? 'text-primary' : 'text-foreground'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {items.length > 0 && (
                      <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                        {items.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="text-xs p-1 rounded bg-muted/50 dark:bg-muted/30 hover:bg-muted transition-colors truncate cursor-pointer"
                        title={item.title}
                      >
                        <div className="flex items-center gap-1">
                          {item.series ? (
                            <Tv className="w-3 h-3 text-chart-1 flex-shrink-0" />
                          ) : (
                            <Film className="w-3 h-3 text-chart-2 flex-shrink-0" />
                          )}
                          <span className="truncate">{item.title}</span>
                        </div>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={`${item.series?.id || item.movie?.id}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className={`bg-card dark:bg-card/50 rounded-lg p-4 hover:bg-accent/50 dark:hover:bg-accent/30 transition-all cursor-pointer border border-border hover:border-primary/50 ${
                isToday(item.airDate) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    item.series ? 'bg-chart-1/20' : 'bg-chart-2/20'
                  }`}>
                    {item.series ? (
                      <Tv className="w-5 h-5 text-chart-1" />
                    ) : (
                      <Film className="w-5 h-5 text-chart-2" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-zinc-400" />
                        <span className={`text-sm ${getDateStatus(item.airDate).color}`}>
                          {formatRelativeTime(item.airDate)}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {formatDate(item.airDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded font-medium ${
                    item.hasFile ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    {item.hasFile ? 'Downloaded' : 'Missing'}
                  </span>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card dark:bg-card/50 rounded-lg border border-border">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Releases</h3>
              <p>
                No upcoming episodes or movies found. Make sure your apps are configured and you have monitored content.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Detail Dialog */}
      {renderDetailDialog()}
    </div>
  );
};

export default CalendarSection;