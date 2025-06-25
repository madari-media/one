export interface ArrServiceConfig {
  baseUrl: string;
  apiKey: string;
}

export interface SeriesInfo {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  network?: string;
  status: string;
  poster?: string;
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  seasons?: Season[];
}

export interface MovieInfo {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  status: string;
  poster?: string;
  tmdbId?: number;
  imdbId?: string;
}

export interface Season {
  seasonNumber: number;
  episodeCount: number;
  monitored: boolean;
}

export interface CalendarItem {
  id: number;
  title: string;
  airDate: string;
  hasFile: boolean;
  series?: SeriesInfo;
  movie?: MovieInfo;
}

export interface ActivityItem {
  id: number;
  eventType: string;
  sourceTitle: string;
  date: string;
  downloadId?: string;
  series?: SeriesInfo;
  movie?: MovieInfo;
  // Extended queue information
  seriesId?: number;
  episodeId?: number;
  seasonNumber?: number;
  languages?: Array<{ id: number; name: string }>;
  quality?: {
    quality: {
      id: number;
      name: string;
      source: string;
      resolution?: number;
    };
    revision: {
      version: number;
      real: number;
      isRepack: boolean;
    };
  };
  customFormats?: any[];
  customFormatScore?: number;
  size?: number;
  title?: string;
  added?: string;
  status?: string;
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  statusMessages?: Array<{
    title: string;
    messages: string[];
  }>;
  errorMessage?: string;
  protocol?: string;
  downloadClient?: string;
  downloadClientHasPostImportCategory?: boolean;
  indexer?: string;
  episodeHasFile?: boolean;
  sizeleft?: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  outputPath?: string;
}

export interface HistoryItem {
  id: number;
  sourceTitle: string;
  quality: {
    quality: {
      name: string;
    };
  };
  date: string;
  eventType: string;
  series?: SeriesInfo;
  movie?: MovieInfo;
}

export interface SearchResult {
  title: string;
  year?: number;
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  overview?: string;
  images?: string[];
}

export abstract class BaseArrService {
  protected config: ArrServiceConfig;

  constructor(config: ArrServiceConfig) {
    this.config = config;
  }

  protected async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'X-Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/api/v3/system/status');
      return true;
    } catch (error) {
      return false;
    }
  }

  abstract getItems(): Promise<SeriesInfo[] | MovieInfo[]>;
  abstract getCalendar(start?: string, end?: string): Promise<CalendarItem[]>;
  abstract getActivity(): Promise<ActivityItem[]>;
  abstract getHistory(): Promise<HistoryItem[]>;
  abstract search(query: string): Promise<SearchResult[]>;
}