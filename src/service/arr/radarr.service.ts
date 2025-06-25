import { ActivityItem, BaseArrService, CalendarItem, HistoryItem, MovieInfo, SearchResult } from './base-arr.service';

export class RadarrService extends BaseArrService {
  async getItems(): Promise<MovieInfo[]> {
    try {
      const movies = await this.makeRequest<any[]>('/api/v3/movie');
      return movies.map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        overview: m.overview,
        status: m.status,
        poster: m.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl,
        tmdbId: m.tmdbId,
        imdbId: m.imdbId,
      }));
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      return [];
    }
  }

  async getCalendar(start?: string, end?: string): Promise<CalendarItem[]> {
    try {
      const startDate = start || new Date().toISOString().split('T')[0];
      const endDate = end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`Radarr: Fetching calendar from ${startDate} to ${endDate}`);
      const movies = await this.makeRequest<any[]>(`/api/v3/calendar?start=${startDate}&end=${endDate}`);
      console.log(`Radarr: Raw API response:`, movies.length, movies);
      
      const mappedMovies = movies.map(movie => ({
        id: movie.id,
        title: movie.title,
        airDate: movie.digitalRelease || movie.physicalRelease || movie.inCinemas,
        hasFile: movie.hasFile,
        movie: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          status: movie.status,
          poster: movie.images?.find((img: any) => img.coverType === 'poster')?.remoteUrl,
          tmdbId: movie.tmdbId,
          imdbId: movie.imdbId,
        },
      }));
      
      console.log(`Radarr: Mapped calendar items:`, mappedMovies.length, mappedMovies);
      return mappedMovies;
    } catch (error) {
      console.error('Failed to fetch Radarr calendar:', error);
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
        movie: item.movie ? {
          id: item.movie.id,
          title: item.movie.title,
          status: item.movie.status,
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
        movie: item.movie ? {
          id: item.movie.id,
          title: item.movie.title,
          status: item.movie.status,
        } : undefined,
      }));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      const results = await this.makeRequest<any[]>(`/api/v3/movie/lookup?term=${encodeURIComponent(query)}`);
      return results.map(result => ({
        title: result.title,
        year: result.year,
        tmdbId: result.tmdbId,
        imdbId: result.imdbId,
        overview: result.overview,
        images: result.images?.map((img: any) => img.remoteUrl) || [],
      }));
    } catch (error) {
      console.error('Failed to search movies:', error);
      return [];
    }
  }

  async addMovie(tmdbId: number, qualityProfileId: number = 1, rootFolderPath: string = '/movies'): Promise<boolean> {
    try {
      const lookupResult = await this.makeRequest<any[]>(`/api/v3/movie/lookup?term=tmdb:${tmdbId}`);
      if (lookupResult.length === 0) {
        throw new Error('Movie not found');
      }

      const movie = lookupResult[0];
      const payload = {
        ...movie,
        qualityProfileId,
        rootFolderPath,
        monitored: true,
        addOptions: {
          monitor: 'movieOnly',
          searchForMovie: true,
        },
      };

      await this.makeRequest('/api/v3/movie', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return true;
    } catch (error) {
      console.error('Failed to add movie:', error);
      return false;
    }
  }
}