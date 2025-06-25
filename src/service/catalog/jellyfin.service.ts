import { CatalogBaseService } from '@/service/catalog/base.service.ts';
import { Catalog, Meta, MetaExtended, MetaPerson, MetaPersonExtended } from '@/service/type.ts';
import { CatalogConfig } from './tvmaze.service.ts';

export class JellyfinService implements CatalogBaseService {
  static PROVIDER = 'jellyfin';
  private apiKey?: string;
  private userId?: string;

  constructor(private config: CatalogConfig) {
    // Load saved authentication data
    const savedApiKey = localStorage.getItem('jellyfin_api_key');
    const savedUserId = localStorage.getItem('jellyfin_user_id');
    const savedServerUrl = localStorage.getItem('jellyfin_server_url');
    
    if (savedApiKey && savedUserId && savedServerUrl) {
      this.apiKey = savedApiKey;
      this.userId = savedUserId;
      this.config.baseUrl = savedServerUrl;
    }
  }

  private get baseUrl(): string {
    return this.config.baseUrl || '';
  }

  private get headers(): HeadersInit {
    if (!this.apiKey) {
      throw new Error('Not authenticated with Jellyfin');
    }
    return {
      'X-Emby-Token': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async authenticate(serverUrl: string, username: string, password: string): Promise<void> {
    this.config.baseUrl = serverUrl;
    
    const authResponse = await fetch(`${serverUrl}/Users/AuthenticateByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Authorization': `MediaBrowser Client="One", Device="Browser", DeviceId="${this.getDeviceId()}", Version="1.0.0"`,
      },
      body: JSON.stringify({
        Username: username,
        Pw: password,
      }),
    });

    if (!authResponse.ok) {
      throw new Error('Authentication failed');
    }

    const authData = await authResponse.json();
    this.apiKey = authData.AccessToken;
    this.userId = authData.User.Id;
    
    // Save authentication data to localStorage
    localStorage.setItem('jellyfin_api_key', this.apiKey!);
    localStorage.setItem('jellyfin_user_id', this.userId!);
    localStorage.setItem('jellyfin_server_url', serverUrl);
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('jellyfin_device_id');
    if (!deviceId) {
      deviceId = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jellyfin_device_id', deviceId);
    }
    return deviceId;
  }

  async isMetaSupported(meta: Partial<Meta>): Promise<boolean> {
    return (
      meta.provider === JellyfinService.PROVIDER ||
      meta.encoded?.startsWith('jellyfin') === true
    );
  }

  private getImageUrl(itemId: string, imageType: string = 'Primary'): string {
    if (!itemId || !this.baseUrl) return '';
    return `${this.baseUrl}/Items/${itemId}/Images/${imageType}`;
  }

  private getBackdropUrl(itemId: string): string {
    if (!itemId || !this.baseUrl) return '';
    return `${this.baseUrl}/Items/${itemId}/Images/Backdrop/0`;
  }

  async search(query: string): Promise<(Meta | MetaPerson)[]> {
    const response = await fetch(
      `${this.baseUrl}/Search/Hints?searchTerm=${encodeURIComponent(query)}&limit=50`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error('Search failed');
    }

    const data = await response.json();
    
    return data.SearchHints.map((item: any) => {
      if (item.Type === 'Person') {
        return {
          id: item.ItemId,
          encoded: encodeURIComponent(`jellyfin/person/${item.ItemId}`),
          type: 'person',
          gender: '',
          name: item.Name,
          poster: this.getImageUrl(item.ItemId),
          provider: JellyfinService.PROVIDER,
        } as MetaPerson;
      }

      return {
        id: item.ItemId,
        name: item.Name,
        description: '',
        poster: this.getImageUrl(item.ItemId),
        background: this.getBackdropUrl(item.ItemId),
        releaseDate: item.ProductionYear?.toString() || '',
        type: 'meta',
        provider: JellyfinService.PROVIDER,
        metaType: item.Type === 'Movie' ? 'movie' : 'tv',
        encoded: encodeURIComponent(`jellyfin/${item.Type.toLowerCase()}/${item.ItemId}`),
      } as Meta;
    });
  }

  async catalogMeta(catalog: Catalog): Promise<Meta[]> {
    let endpoint = '';
    
    switch (catalog.id) {
      case 'jellyfin-continue':
        endpoint = `/Users/${this.userId}/Items/Resume`;
        break;
      case 'jellyfin-latest-movies':
        endpoint = `/Users/${this.userId}/Items/Latest?includeItemTypes=Movie`;
        break;
      case 'jellyfin-latest-shows':
        endpoint = `/Users/${this.userId}/Items/Latest?includeItemTypes=Series`;
        break;
      case 'jellyfin-movies':
        endpoint = `/Users/${this.userId}/Items?includeItemTypes=Movie&recursive=true&sortBy=DateCreated&sortOrder=Descending`;
        break;
      case 'jellyfin-shows':
        endpoint = `/Users/${this.userId}/Items?includeItemTypes=Series&recursive=true&sortBy=DateCreated&sortOrder=Descending`;
        break;
      default:
        return [];
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch catalog');
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : data.Items || [];

    return items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      description: item.Overview || '',
      poster: this.getImageUrl(item.Id),
      background: this.getBackdropUrl(item.Id),
      releaseDate: item.ProductionYear?.toString() || '',
      type: 'meta',
      provider: JellyfinService.PROVIDER,
      metaType: item.Type === 'Movie' ? 'movie' : 'tv',
      encoded: encodeURIComponent(`jellyfin/${item.Type.toLowerCase()}/${item.Id}`),
    }));
  }

  async catalogs(): Promise<Catalog[]> {
    return [
      {
        id: 'jellyfin-continue',
        title: 'Continue Watching',
        featured: true,
      },
      {
        id: 'jellyfin-latest-movies',
        title: 'Latest Movies',
      },
      {
        id: 'jellyfin-latest-shows',
        title: 'Latest TV Shows',
      },
      {
        id: 'jellyfin-movies',
        title: 'Movies',
      },
      {
        id: 'jellyfin-shows',
        title: 'TV Shows',
      },
    ];
  }

  async meta(meta: Partial<Meta>): Promise<MetaExtended> {
    if (meta.encoded && (!meta.id || !meta.metaType)) {
      const raw = decodeURIComponent(meta.encoded).split('jellyfin/')[1];
      const [type, id] = raw.split('/');
      meta.id = id;
      meta.metaType = type;
    }

    if (!meta.id) {
      throw new Error('Meta ID is required');
    }

    const response = await fetch(
      `${this.baseUrl}/Users/${this.userId}/Items/${meta.id}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch item details');
    }

    const item = await response.json();
    
    // Check if this is an episode and get series background if needed
    let backgroundUrl = this.getBackdropUrl(item.Id);
    if (item.Type === 'Episode' && item.SeriesId) {
      // Check if episode has its own backdrop
      const episodeBackdropResponse = await fetch(backgroundUrl, { method: 'HEAD' });
      if (!episodeBackdropResponse.ok) {
        // Episode doesn't have backdrop, use series backdrop
        backgroundUrl = this.getBackdropUrl(item.SeriesId);
      }
    }

    // Fetch people
    const peopleResponse = await fetch(
      `${this.baseUrl}/Items/${meta.id}/People`,
      { headers: this.headers }
    );
    
    const people = peopleResponse.ok ? await peopleResponse.json() : [];

    const result: MetaExtended = {
      id: item.Id,
      name: item.Name,
      description: item.Overview || '',
      poster: this.getImageUrl(item.Id),
      background: backgroundUrl,
      releaseDate: item.ProductionYear?.toString() || item.PremiereDate || '',
      type: 'meta',
      provider: JellyfinService.PROVIDER,
      metaType: item.Type === 'Movie' ? 'movie' : item.Type === 'Episode' ? 'episode' : 'tv',
      encoded: encodeURIComponent(`jellyfin/${item.Type.toLowerCase()}/${item.Id}`),
      runtime: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 600000000) : undefined,
      status: item.Status || '',
      tagline: item.Tagline || '',
      voteAverage: item.CommunityRating || 0,
      originalLanguage: item.OriginalTitle ? 'en' : '',
      cast: people.map((person: any, index: number) => ({
        id: person.Id,
        name: person.Name,
        character: person.Role || '',
        image: this.getImageUrl(person.Id),
        order: index,
        type: 'cast' as const,
      })),
      externalIds: {
        imdbId: item.ProviderIds?.Imdb || '',
        tmdbId: item.ProviderIds?.Tmdb || '',
      },
    };

    // For TV shows, add season information
    if (item.Type === 'Series') {
      const seasonsResponse = await fetch(
        `${this.baseUrl}/Shows/${item.Id}/Seasons?userId=${this.userId}`,
        { headers: this.headers }
      );

      if (seasonsResponse.ok) {
        const seasons = await seasonsResponse.json();
        result.seasons = seasons.Items.map((season: any) => ({
          id: season.Id,
          name: season.Name,
          overview: season.Overview || '',
          posterPath: this.getImageUrl(season.Id),
          seasonNumber: season.IndexNumber || 0,
          airDate: season.PremiereDate || '',
          episodeCount: season.ChildCount || 0,
        }));
        result.totalSeasons = seasons.Items.length;
      }
    }

    return result;
  }

  async loadSeasonDetails(
    meta: Partial<Meta>,
    seasonNumber: number,
  ): Promise<MetaExtended['seasons']> {
    // First get the season ID
    const seasonsResponse = await fetch(
      `${this.baseUrl}/Shows/${meta.id}/Seasons?userId=${this.userId}`,
      { headers: this.headers }
    );

    if (!seasonsResponse.ok) {
      throw new Error('Failed to fetch seasons');
    }

    const seasons = await seasonsResponse.json();
    const season = seasons.Items.find((s: any) => s.IndexNumber === seasonNumber);
    
    if (!season) {
      throw new Error(`Season ${seasonNumber} not found`);
    }

    // Get episodes for the season
    const episodesResponse = await fetch(
      `${this.baseUrl}/Shows/${meta.id}/Episodes?seasonId=${season.Id}&userId=${this.userId}`,
      { headers: this.headers }
    );

    if (!episodesResponse.ok) {
      throw new Error('Failed to fetch episodes');
    }

    const episodes = await episodesResponse.json();

    return [
      {
        id: season.Id,
        name: season.Name,
        overview: season.Overview || '',
        posterPath: this.getImageUrl(season.Id),
        seasonNumber,
        airDate: season.PremiereDate || '',
        episodeCount: episodes.Items.length,
        episodes: episodes.Items.map((episode: any) => ({
          id: episode.Id,
          name: episode.Name,
          overview: episode.Overview || '',
          stillPath: this.getImageUrl(episode.Id),
          episodeNumber: episode.IndexNumber || 0,
          airDate: episode.PremiereDate || '',
          runtime: episode.RunTimeTicks ? Math.round(episode.RunTimeTicks / 600000000) : 0,
          voteAverage: episode.CommunityRating || 0,
          voteCount: 0,
        })),
      },
    ];
  }

  async loadRelated(meta: Partial<Meta>): Promise<MetaExtended[]> {
    const response = await fetch(
      `${this.baseUrl}/Items/${meta.id}/Similar?userId=${this.userId}&limit=10`,
      { headers: this.headers }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const items = data.Items || [];

    return Promise.all(
      items.map((item: any) => this.meta({
        id: item.Id,
        provider: JellyfinService.PROVIDER,
        metaType: item.Type === 'Movie' ? 'movie' : 'tv',
      }))
    );
  }

  async person(person: Partial<MetaPerson>): Promise<MetaPersonExtended> {
    if (!person.id) {
      throw new Error('Person ID is required');
    }

    const response = await fetch(
      `${this.baseUrl}/Persons/${person.id}`,
      { headers: this.headers }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch person details');
    }

    const data = await response.json();

    return {
      id: data.Id,
      encoded: encodeURIComponent(`jellyfin/person/${data.Id}`),
      type: 'person',
      gender: '',
      name: data.Name,
      poster: this.getImageUrl(data.Id),
      provider: JellyfinService.PROVIDER,
      biography: data.Overview || '',
      birthday: data.PremiereDate || '',
      deathday: data.EndDate || '',
      placeOfBirth: '',
    };
  }

  isAuthenticated(): boolean {
    return !!this.apiKey && !!this.userId;
  }

  getServerUrl(): string {
    return this.config.baseUrl || '';
  }

  async logout(): Promise<void> {
    if (this.apiKey) {
      try {
        await fetch(`${this.baseUrl}/Sessions/Logout`, {
          method: 'POST',
          headers: this.headers,
        });
      } catch (error) {
        console.error('Error during logout:', error);
      }
    }
    
    // Clear authentication data
    this.apiKey = undefined;
    this.userId = undefined;
    this.config.baseUrl = undefined;
    
    // Clear localStorage
    localStorage.removeItem('jellyfin_api_key');
    localStorage.removeItem('jellyfin_user_id');
    localStorage.removeItem('jellyfin_server_url');
  }
}