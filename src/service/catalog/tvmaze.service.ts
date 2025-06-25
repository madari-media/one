import { CatalogBaseService } from '@/service/catalog/base.service.ts';
import { Catalog, Meta, MetaExtended, MetaPerson, MetaPersonExtended } from '@/service/type.ts';

export class TvmazeService implements CatalogBaseService {
  private readonly API_BASE_URL = 'https://api.tvmaze.com';
  static PROVIDER = 'tvmaze';

  constructor(_: CatalogConfig) {}

  async isMetaSupported(meta: Partial<Meta>): Promise<boolean> {
    return (
      meta.provider === TvmazeService.PROVIDER ||
      meta.encoded?.startsWith('tvmaze') === true
    );
  }

  private getImageUrl(path: string | null | undefined): string {
    if (!path) return '';
    return path;
  }

  private async fetchData<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async search(query: string): Promise<(Meta | MetaPerson)[]> {
    const data = await this.fetchData<any[]>(
      `${this.API_BASE_URL}/search/shows?q=${encodeURIComponent(query)}`,
    );

    return data.map((item) => {
      const show = item.show;
      return this.encodeMetaToString({
        id: show.id,
        name: show.name,
        description: show.summary?.replace(/<[^>]*>/g, '') || '',
        poster: this.getImageUrl(show.image?.medium),
        background: this.getImageUrl(show.image?.original),
        releaseDate: show.premiered || '',
        type: 'meta',
        provider: TvmazeService.PROVIDER,
        metaType: 'tv',
      });
    });
  }

  async catalogMeta(catalog: Catalog): Promise<Meta[]> {
    switch (catalog.id) {
      case 'tvmaze-featured':
      case 'tvmaze-trending-shows': {
        const data = await this.fetchData<any[]>(`${this.API_BASE_URL}/shows`);
        return data.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.summary?.replace(/<[^>]*>/g, '') || '',
            poster: this.getImageUrl(show.image?.medium),
            background: this.getImageUrl(show.image?.original),
            releaseDate: show.premiered || '',
            type: 'meta',
            provider: TvmazeService.PROVIDER,
            metaType: 'tv',
          }),
        );
      }
      default:
        return [];
    }
  }

  async catalogs(): Promise<Catalog[]> {
    return [
      {
        id: 'tvmaze-featured',
        title: 'Featured',
        featured: true,
      },
      {
        id: 'tvmaze-trending-shows',
        title: 'Trending TV Shows',
      },
    ];
  }

  async meta(meta: Partial<Meta>): Promise<MetaExtended> {
    if (meta.encoded && (!meta.id || !meta.metaType)) {
      const raw = decodeURIComponent(meta.encoded).split('tvmaze/')[1];
      meta.id = +raw.split('/')[1];
      meta.metaType = raw.split('/')[0];
    }

    if (!meta.id) {
      throw new Error('Meta ID is required');
    }

    const [show, cast, seasons] = await Promise.all([
      this.fetchData<any>(
        `${this.API_BASE_URL}/shows/${meta.id}?embed[]=episodes`,
      ),
      this.fetchData<any[]>(`${this.API_BASE_URL}/shows/${meta.id}/cast`),
      this.fetchData<any[]>(`${this.API_BASE_URL}/shows/${meta.id}/seasons`),
    ]);

    const castAndCrew = cast.map((person) => ({
      id: person.person.id,
      name: person.person.name,
      character: person.character.name,
      image: this.getImageUrl(person.person.image?.medium),
      order: person.person.id,
      type: 'cast' as const,
    }));

    return {
      id: show.id,
      name: show.name,
      description: show.summary?.replace(/<[^>]*>/g, '') || '',
      poster: this.getImageUrl(show.image?.medium),
      background: this.getImageUrl(show.image?.original),
      releaseDate: show.premiered || '',
      type: 'meta',
      provider: TvmazeService.PROVIDER as never,
      metaType: 'tv',
      encoded: encodeURIComponent(`tvmaze/tv/${show.id}`),
      status: show.status,
      runtime: show.runtime,
      originalLanguage: show.language,
      cast: castAndCrew,
      totalSeasons: seasons.length,
      totalEpisodes: show._embedded?.episodes?.length || 0,
      externalIds: {
        imdbId: show.externals?.imdb || '',
        tmdbId: '', // TVMaze doesn't provide TMDB IDs
      },
      seasons: seasons.map((season) => ({
        id: season.id,
        name: season.name,
        overview: season.summary?.replace(/<[^>]*>/g, '') || '',
        posterPath: this.getImageUrl(season.image?.medium),
        seasonNumber: season.number,
        airDate: season.premiereDate || '',
        episodeCount: season.episodeOrder || 0,
      })),
    };
  }

  async loadSeasonDetails(
    meta: Partial<Meta>,
    seasonNumber: number,
  ): Promise<MetaExtended['seasons']> {
    // First get the season ID
    const seasons = await this.fetchData<any[]>(
      `${this.API_BASE_URL}/shows/${meta.id}/seasons`,
    );

    const season = seasons.find((s) => s.number === seasonNumber);
    if (!season) {
      throw new Error(`Season ${seasonNumber} not found`);
    }

    // Then get episodes using the season ID
    const episodes = await this.fetchData<any[]>(
      `${this.API_BASE_URL}/seasons/${season.id}/episodes`,
    );

    return [
      {
        id: season.id,
        name: `Season ${seasonNumber}`,
        overview: season.summary?.replace(/<[^>]*>/g, '') || '',
        posterPath: this.getImageUrl(season.image?.medium),
        seasonNumber,
        airDate: season.premiereDate || '',
        episodeCount: episodes.length,
        episodes: episodes.map((episode) => ({
          id: episode.id,
          name: episode.name,
          overview: episode.summary?.replace(/<[^>]*>/g, '') || '',
          stillPath: this.getImageUrl(episode.image?.medium),
          episodeNumber: episode.number,
          airDate: episode.airdate,
          runtime: episode.runtime || 0,
          voteAverage: 0,
          voteCount: 0,
        })),
      },
    ];
  }

  async loadRelated(meta: Partial<Meta>): Promise<MetaExtended[]> {
    if (!meta.id || meta.metaType !== 'tv') {
      return [];
    }

    try {
      // TVMaze doesn't have a direct similar shows endpoint, so we'll use the show's genres
      // to find similar shows
      const show = await this.fetchData<any>(
        `${this.API_BASE_URL}/shows/${meta.id}`,
      );

      if (!show.genres || show.genres.length === 0) {
        return [];
      }

      // Get shows with similar genres
      const similarShows = await this.fetchData<any[]>(
        `${this.API_BASE_URL}/shows?page=0`,
      );

      // Filter and sort shows by genre similarity
      const relatedShows = similarShows
        .filter((similarShow) => {
          if (!similarShow.genres || similarShow.id === show.id) {
            return false;
          }
          return similarShow.genres.some((genre: string) =>
            show.genres.includes(genre),
          );
        })
        .slice(0, 10) // Limit to 10 similar shows
        .map((similarShow) =>
          this.encodeMetaToString({
            id: similarShow.id,
            name: similarShow.name,
            description: similarShow.summary?.replace(/<[^>]*>/g, '') || '',
            poster: this.getImageUrl(similarShow.image?.medium),
            background: this.getImageUrl(similarShow.image?.original),
            releaseDate: similarShow.premiered || '',
            type: 'meta',
            provider: TvmazeService.PROVIDER,
            metaType: 'tv',
          }),
        );

      return relatedShows;
    } catch (error) {
      console.error('Failed to load related content from TVMaze:', error);
      return [];
    }
  }

  async person(_: Partial<MetaPerson>): Promise<MetaPersonExtended> {
    throw new Error('Person details not supported by TVMaze');
  }

  private encodeMetaToString(meta: Omit<Meta, 'encoded'>): Meta {
    return {
      ...meta,
      encoded: encodeURIComponent(`tvmaze/${meta.metaType}/${meta.id}`),
    };
  }
}

export interface CatalogConfig {
  baseUrl?: string;
  language?: string;
  isAdult?: boolean;
  email?: string;
  password?: string;
  region?: string;
  quality?: string;
}