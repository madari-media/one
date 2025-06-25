import { ActivityItem, BaseArrService, CalendarItem, HistoryItem, SearchResult, SeriesInfo } from './base-arr.service';

export class SonarrService extends BaseArrService {
  async getItems(): Promise<SeriesInfo[]> {
    try {
      const series = await this.makeRequest<any[]>('/api/v3/series');
      return series.map(s => ({
        id: s.id,
        title: s.title,
        year: s.year,
        overview: s.overview,
        network: s.network,
        status: s.status,
        poster: s.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl,
        tvdbId: s.tvdbId,
        seasons: s.seasons?.map((season: any) => ({
          seasonNumber: season.seasonNumber,
          episodeCount: season.statistics?.episodeCount || 0,
          monitored: season.monitored,
        })),
      }));
    } catch (error) {
      console.error('Failed to fetch series:', error);
      return [];
    }
  }

  async getCalendar(start?: string, end?: string): Promise<CalendarItem[]> {
    try {
      const startDate = start || new Date().toISOString().split('T')[0];
      const endDate = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Sonarr: Fetching calendar from ${startDate} to ${endDate}`);
      const episodes = await this.makeRequest<any[]>(`/api/v3/calendar?start=${startDate}&end=${endDate}`);
      console.log(`Sonarr: Raw API response:`, episodes.length, episodes);
      
      // Get series information for all episodes
      const seriesCache = new Map();
      const uniqueSeriesIds = [...new Set(episodes.map(ep => ep.seriesId))];
      
      console.log(`Sonarr: Fetching series data for IDs:`, uniqueSeriesIds);
      
      // Fetch series data for all unique series IDs
      for (const seriesId of uniqueSeriesIds) {
        try {
          const series = await this.makeRequest<any>(`/api/v3/series/${seriesId}`);
          seriesCache.set(seriesId, series);
        } catch (error) {
          console.error(`Failed to fetch series ${seriesId}:`, error);
        }
      }
      
      const mappedEpisodes = episodes.map(episode => {
        const series = seriesCache.get(episode.seriesId);
        return {
          id: episode.id,
          title: series 
            ? `${series.title} - S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')} - ${episode.title}`
            : `Series ${episode.seriesId} - S${episode.seasonNumber.toString().padStart(2, '0')}E${episode.episodeNumber.toString().padStart(2, '0')} - ${episode.title}`,
          airDate: episode.airDate,
          hasFile: episode.hasFile,
          series: series ? {
            id: series.id,
            title: series.title,
            year: series.year,
            status: series.status,
            poster: series.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl,
          } : {
            id: episode.seriesId,
            title: `Series ${episode.seriesId}`,
            year: 0,
            status: 'unknown',
          },
        };
      });
      
      console.log(`Sonarr: Mapped calendar items:`, mappedEpisodes.length, mappedEpisodes);
      return mappedEpisodes;
    } catch (error) {
      console.error('Failed to fetch Sonarr calendar:', error);
      return [];
    }
  }

  async getActivity(): Promise<ActivityItem[]> {
    try {
      const response = await this.makeRequest<any>('/api/v3/queue');
      const activity = response.records || response; // Handle both paginated and non-paginated responses
      return activity.map((item: any) => ({
        id: item.id,
        eventType: item.status,
        sourceTitle: item.title,
        date: item.estimatedCompletionTime || item.added || new Date().toISOString(),
        downloadId: item.downloadId,
        series: item.series ? {
          id: item.series.id,
          title: item.series.title,
          status: item.series.status,
        } : undefined,
        // Extended information
        seriesId: item.seriesId,
        episodeId: item.episodeId,
        seasonNumber: item.seasonNumber,
        languages: item.languages,
        quality: item.quality,
        customFormats: item.customFormats,
        customFormatScore: item.customFormatScore,
        size: item.size,
        title: item.title,
        added: item.added,
        status: item.status,
        trackedDownloadStatus: item.trackedDownloadStatus,
        trackedDownloadState: item.trackedDownloadState,
        statusMessages: item.statusMessages,
        errorMessage: item.errorMessage,
        protocol: item.protocol,
        downloadClient: item.downloadClient,
        downloadClientHasPostImportCategory: item.downloadClientHasPostImportCategory,
        indexer: item.indexer,
        episodeHasFile: item.episodeHasFile,
        sizeleft: item.sizeleft,
        timeleft: item.timeleft,
        estimatedCompletionTime: item.estimatedCompletionTime,
        outputPath: item.outputPath,
      }));
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      return [];
    }
  }

  async getHistory(): Promise<HistoryItem[]> {
    try {
      const response = await this.makeRequest<any>('/api/v3/history');
      const history = response.records || response; // Handle both paginated and non-paginated responses
      return history.map((item: any) => ({
        id: item.id,
        sourceTitle: item.sourceTitle,
        quality: item.quality,
        date: item.date,
        eventType: item.eventType,
        series: item.series ? {
          id: item.series.id,
          title: item.series.title,
          status: item.series.status,
        } : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const results = await this.makeRequest<any[]>(`/api/v3/series/lookup?term=${encodeURIComponent(query)}`);
      return results.map(result => ({
        title: result.title,
        year: result.year,
        tvdbId: result.tvdbId,
        overview: result.overview,
        images: result.images?.map((img: any) => img.remoteUrl) || [],
      }));
    } catch (error) {
      console.error('Failed to search series:', error);
      return [];
    }
  }

  async addSeries(tvdbId: number, qualityProfileId: number = 1, languageProfileId: number = 1, rootFolderPath: string = '/tv'): Promise<boolean> {
    try {
      const lookupResult = await this.makeRequest<any[]>(`/api/v3/series/lookup?term=tvdb:${tvdbId}`);
      if (lookupResult.length === 0) {
        throw new Error('Series not found');
      }

      const series = lookupResult[0];
      const payload = {
        ...series,
        qualityProfileId,
        languageProfileId,
        rootFolderPath,
        monitored: true,
        addOptions: {
          monitor: 'all',
          searchForMissingEpisodes: true,
        },
      };

      await this.makeRequest('/api/v3/series', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error('Failed to add series:', error);
      return false;
    }
  }
}