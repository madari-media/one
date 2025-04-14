import { CatalogBaseService } from '@/service/catalog/base.service.ts';
import {
  Catalog,
  Meta,
  MetaExtended,
  MetaPerson,
  MetaPersonExtended,
} from '@/service/type.ts';
import { TMDB } from '@anthaathi/tmdb-ts';

export class TmdbService implements CatalogBaseService {
  private _tmdb: TMDB;
  private readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
  static PROVIDER = 'tmdb';

  constructor(private config: CatalogConfig) {
    if (!config.apiKey) {
      throw new Error('TMDB API key is required');
    }
    this._tmdb = new TMDB(
      config.apiKey,
      config.baseUrl || 'https://api.themoviedb.org/3',
    );
  }

  async isMetaSupported(meta: Partial<Meta>): Promise<boolean> {
    return (
      meta.provider === TmdbService.PROVIDER ||
      meta.encoded?.startsWith('tmdb') === true
    );
  }

  private getImageUrl(
    path: string | null | undefined,
    size: 'w500' | 'original' = 'w500',
  ): string {
    if (!path) return '';
    return `${this.IMAGE_BASE_URL}/${size}${path}`;
  }

  async search(query: string): Promise<(Meta | MetaPerson)[]> {
    const docs = await this._tmdb.search.multi({
      language: this.config.language as never,
      include_adult: this.config.isAdult,
      query,
    });

    return docs.results.map((res) => {
      if (res.media_type === 'person') {
        return {
          id: res.id,
          type: 'person',
          name: res.name,
          gender: res.gender === 2 ? 'Male' : 'Female',
          poster: this.getImageUrl(res.profile_path),
          provider: TmdbService.PROVIDER,
          encoded: encodeURIComponent(`tmdb/person/${res.id}`),
        };
      }

      if (res.media_type === 'movie') {
        return this.encodeMetaToString({
          releaseDate: res.release_date,
          id: res.id,
          name: res.title,
          description: res.overview,
          background: this.getImageUrl(res.backdrop_path),
          poster: this.getImageUrl(res.poster_path),
          type: 'meta',
          provider: TmdbService.PROVIDER,
          metaType: res.media_type,
        });
      }

      return this.encodeMetaToString({
        id: res.id,
        releaseDate: res.first_air_date,
        poster: this.getImageUrl(res.poster_path),
        background: this.getImageUrl(res.backdrop_path),
        description: res.overview,
        name: res.name,
        type: 'meta',
        provider: TmdbService.PROVIDER,
        metaType: res.media_type,
      });
    });
  }

  async catalogMeta(catalog: Catalog): Promise<Meta[]> {
    switch (catalog.id) {
      case 'tmdb-featured': {
        const trending = await this._tmdb.trending.trending('all', 'day', {
          language: this.config.language as never,
        });

        return trending.results
          .map((item) => {
            const isMovie = item.media_type === 'movie';

            if (item.media_type === 'person') {
              return false;
            }

            return this.encodeMetaToString({
              id: item.id,
              name: isMovie ? item.title : item.name,
              description:
                item.media_type === 'movie' ? item.overview : item.overview,
              poster: this.getImageUrl(item.poster_path),
              background: this.getImageUrl(item.backdrop_path, 'original'),
              releaseDate: isMovie ? item.release_date : item.first_air_date,
              type: 'meta' as const,
              provider: TmdbService.PROVIDER,
              metaType: item.media_type,
            });
          })
          .filter(
            (item) => typeof item !== 'boolean' && item.background,
          ) as Meta[];
      }
      case 'tmdb-trending-movies': {
        const trending = await this._tmdb.trending.trending('movie', 'day', {
          language: this.config.language as never,
        });
        return trending.results.map((movie) =>
          this.encodeMetaToString({
            id: movie.id,
            name: movie.title,
            description: movie.overview,
            poster: this.getImageUrl(movie.poster_path),
            background: this.getImageUrl(movie.backdrop_path),
            releaseDate: movie.release_date,
            type: 'meta',
            metaType: 'movie',
            provider: TmdbService.PROVIDER,
          }),
        );
      }
      case 'tmdb-trending-shows': {
        const trending = await this._tmdb.trending.trending('tv', 'day', {
          language: this.config.language as never,
        });
        return trending.results.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.overview,
            poster: this.getImageUrl(show.poster_path),
            background: this.getImageUrl(show.backdrop_path),
            releaseDate: show.first_air_date,
            type: 'meta',
            metaType: 'tv',
            provider: TmdbService.PROVIDER,
          }),
        );
      }
      case 'tmdb-popular-movies': {
        const popular = await this._tmdb.movies.popular({
          language: this.config.language as never,
        });
        return popular.results.map((movie) =>
          this.encodeMetaToString({
            id: movie.id,
            name: movie.title,
            description: movie.overview,
            poster: this.getImageUrl(movie.poster_path),
            background: this.getImageUrl(movie.backdrop_path),
            releaseDate: movie.release_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'movie',
          }),
        );
      }
      case 'tmdb-popular-shows': {
        const popular = await this._tmdb.tvShows.popular({
          language: this.config.language as never,
        });
        return popular.results.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.overview,
            poster: this.getImageUrl(show.poster_path),
            background: this.getImageUrl(show.backdrop_path),
            releaseDate: show.first_air_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'tv',
          }),
        );
      }
      case 'tmdb-top-rated-movies': {
        const topRated = await this._tmdb.movies.topRated({
          language: this.config.language as never,
        });

        return topRated.results.map((movie) =>
          this.encodeMetaToString({
            id: movie.id,
            name: movie.title,
            description: movie.overview,
            poster: this.getImageUrl(movie.poster_path),
            background: this.getImageUrl(movie.backdrop_path),
            releaseDate: movie.release_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'movie',
          }),
        );
      }
      case 'tmdb-top-rated-shows': {
        const topRated = await this._tmdb.tvShows.topRated({
          language: this.config.language as never,
        });
        return topRated.results.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.overview,
            poster: this.getImageUrl(show.poster_path),
            background: this.getImageUrl(show.backdrop_path),
            releaseDate: show.first_air_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'tv',
          }),
        );
      }
      case 'tmdb-upcoming-movies': {
        const upcoming = await this._tmdb.movies.upcoming({
          language: this.config.language as never,
        });
        return upcoming.results.map((movie) =>
          this.encodeMetaToString({
            id: movie.id,
            name: movie.title,
            description: movie.overview,
            poster: this.getImageUrl(movie.poster_path),
            background: this.getImageUrl(movie.backdrop_path),
            releaseDate: movie.release_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'movie',
          }),
        );
      }
      case 'tmdb-airing-today': {
        const airingToday = await this._tmdb.tvShows.airingToday({
          language: this.config.language as never,
        });
        return airingToday.results.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.overview,
            poster: this.getImageUrl(show.poster_path),
            background: this.getImageUrl(show.backdrop_path),
            releaseDate: show.first_air_date,
            type: 'meta',
            metaType: 'tv',
            provider: TmdbService.PROVIDER,
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
        id: 'tmdb-featured',
        title: 'Featured',
        featured: true,
      },
      {
        id: 'tmdb-trending-movies',
        title: 'Trending Movies',
      },
      {
        id: 'tmdb-trending-shows',
        title: 'Trending TV Shows',
      },
      {
        id: 'tmdb-popular-movies',
        title: 'Popular Movies',
      },
      {
        id: 'tmdb-popular-shows',
        title: 'Popular TV Shows',
      },
      {
        id: 'tmdb-top-rated-movies',
        title: 'Top Rated Movies',
      },
      {
        id: 'tmdb-top-rated-shows',
        title: 'Top Rated TV Shows',
      },
      {
        id: 'tmdb-upcoming-movies',
        title: 'Upcoming Movies',
      },
      {
        id: 'tmdb-airing-today',
        title: 'Airing Today',
      },
    ];
  }

  async meta(meta: Partial<Meta>): Promise<MetaExtended> {
    if (meta.encoded && (!meta.id || !meta.metaType)) {
      const raw = decodeURIComponent(meta.encoded).split('tmdb/')[1];

      meta.id = +raw.split('/')[1];
      meta.metaType = raw.split('/')[0];
    }

    if (!meta.id) {
      throw new Error('Meta ID is required');
    }

    if (meta.metaType === 'movie') {
      const movie = await this._tmdb.movies.details(
        meta.id as number,
        ['credits', 'videos', 'reviews', 'external_ids'],
        this.config.language,
      );

      const castAndCrew = [
        ...(movie.credits?.cast?.map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          image: this.getImageUrl(person.profile_path),
          order: person.order,
          type: 'cast' as const,
        })) || []),
        ...(movie.credits?.crew?.map((person) => ({
          id: person.id,
          name: person.name,
          character: person.job,
          image: this.getImageUrl(person.profile_path),
          order: 99,
          type: 'crew' as const,
        })) || []),
      ].sort((a, b) => a.order - b.order);

      return {
        id: movie.id,
        name: movie.title,
        description: movie.overview,
        poster: this.getImageUrl(movie.poster_path),
        background: this.getImageUrl(movie.backdrop_path, 'original'),
        releaseDate: movie.release_date,
        type: 'meta',
        provider: TmdbService.PROVIDER as never,
        metaType: 'movie',
        encoded: encodeURIComponent(`tmdb/movie/${movie.id}`),
        tagline: movie.tagline,
        runtime: movie.runtime,
        status: movie.status,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        budget: movie.budget,
        revenue: movie.revenue,
        originalLanguage: movie.original_language,
        cast: castAndCrew,
        trailers: movie.videos?.results
          ?.filter(
            (video) => video.site === 'YouTube' && video.type === 'Trailer',
          )
          .map((video) => ({
            id: video.id,
            name: video.name,
            key: video.key,
            site: video.site,
            type: video.type,
          })),
        reviews: movie.reviews?.results?.map((review) => ({
          id: review.id,
          author: review.author,
          content: review.content,
          rating: review.author_details.rating || 0,
          createdAt: review.created_at,
        })),
        productionCompanies: movie.production_companies?.map((company) => ({
          id: company.id,
          name: company.name,
          logoPath: this.getImageUrl(company.logo_path),
          originCountry: company.origin_country,
        })),
        spokenLanguages: movie.spoken_languages?.map((lang) => ({
          iso_639_1: lang.iso_639_1,
          name: lang.name,
        })),
        externalIds: {
          imdbId: movie.external_ids?.imdb_id || '',
          tmdbId: movie.id.toString(),
        },
      };
    } else {
      const show = await this._tmdb.tvShows.details(
        meta.id as number,
        ['credits', 'videos', 'reviews', 'external_ids'],
        this.config.language,
      );

      const castAndCrew = [
        ...(show.credits?.cast?.map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          image: this.getImageUrl(person.profile_path),
          order: person.order,
          type: 'cast' as const,
        })) || []),
        ...(show.credits?.crew?.map((person) => ({
          id: person.id,
          name: person.name,
          character: person.job,
          image: this.getImageUrl(person.profile_path),
          order: 99,
          type: 'crew' as const,
        })) || []),
      ].sort((a, b) => a.order - b.order);

      return {
        id: show.id,
        name: show.name,
        description: show.overview,
        poster: this.getImageUrl(show.poster_path),
        background: this.getImageUrl(show.backdrop_path, 'original'),
        releaseDate: show.first_air_date,
        type: 'meta',
        provider: TmdbService.PROVIDER as never,
        metaType: 'tv',
        encoded: encodeURIComponent(`tmdb/tv/${show.id}`),
        tagline: show.tagline,
        status: show.status,
        voteAverage: show.vote_average,
        voteCount: show.vote_count,
        originalLanguage: show.original_language,
        cast: castAndCrew,
        trailers: show.videos?.results
          ?.filter(
            (video) => video.site === 'YouTube' && video.type === 'Trailer',
          )
          .map((video) => ({
            id: video.id,
            name: video.name,
            key: video.key,
            site: video.site,
            type: video.type,
          })),
        reviews: show.reviews?.results?.map((review) => ({
          id: review.id,
          author: review.author,
          content: review.content,
          rating: review.author_details.rating || 0,
          createdAt: review.created_at,
        })),
        productionCompanies: show.production_companies?.map((company) => ({
          id: company.id,
          name: company.name,
          logoPath: this.getImageUrl(company.logo_path),
          originCountry: company.origin_country,
        })),
        spokenLanguages: show.spoken_languages?.map((lang) => ({
          iso_639_1: lang.iso_639_1,
          name: lang.name,
        })),
        externalIds: {
          imdbId: show.external_ids?.imdb_id || '',
          tmdbId: show.id.toString(),
        },
        totalSeasons: show.number_of_seasons,
        totalEpisodes: show.number_of_episodes,
        seasons: show.seasons?.map((season) => ({
          id: season.id,
          name: season.name,
          overview: season.overview,
          posterPath: this.getImageUrl(season.poster_path),
          seasonNumber: season.season_number,
          airDate: season.air_date,
          episodeCount: season.episode_count,
        })),
      };
    }
  }

  async loadSeasonDetails(
    meta: Partial<Meta>,
    seasonNumber: number,
  ): Promise<MetaExtended['seasons']> {
    const season = await this._tmdb.tvShows.season(+meta.id!, seasonNumber);

    return [
      {
        id: season.id,
        name: season.name,
        overview: season.overview,
        posterPath: this.getImageUrl(season.poster_path),
        seasonNumber: season.season_number,
        airDate: season.air_date,
        episodeCount: season.episodes.length,
        episodes: season.episodes.map((episode) => ({
          id: episode.id,
          name: episode.name,
          overview: episode.overview,
          stillPath: this.getImageUrl(episode.still_path, 'original'),
          episodeNumber: episode.episode_number,
          airDate: episode.air_date,
          runtime: episode.runtime || 0,
          voteAverage: episode.vote_average,
          voteCount: episode.vote_count,
        })),
      },
    ];
  }

  async loadRelated(meta: Partial<Meta>): Promise<MetaExtended[]> {
    if (!meta.id || !meta.metaType) {
      return [];
    }

    try {
      if (meta.metaType === 'movie') {
        const similarMovies = await this._tmdb.movies.similar(
          meta.id as number,
          {
            language: this.config.language as never,
          },
        );

        return similarMovies.results.map((movie) =>
          this.encodeMetaToString({
            id: movie.id,
            name: movie.title,
            description: movie.overview,
            poster: this.getImageUrl(movie.poster_path),
            background: this.getImageUrl(movie.backdrop_path),
            releaseDate: movie.release_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'movie',
          }),
        );
      } else {
        const similarShows = await this._tmdb.tvShows.similar(
          meta.id as number,
          {
            language: this.config.language as never,
          },
        );

        return similarShows.results.map((show) =>
          this.encodeMetaToString({
            id: show.id,
            name: show.name,
            description: show.overview,
            poster: this.getImageUrl(show.poster_path),
            background: this.getImageUrl(show.backdrop_path),
            releaseDate: show.first_air_date,
            type: 'meta',
            provider: TmdbService.PROVIDER,
            metaType: 'tv',
          }),
        );
      }
    } catch (error) {
      console.error('Failed to load related content from TMDB:', error);
      return [];
    }
  }

  private encodeMetaToString(meta: Omit<Meta, 'encoded'>): Meta {
    return {
      ...meta,
      encoded: encodeURIComponent(`tmdb/${meta.metaType}/${meta.id}`),
    };
  }

  async person(person: Partial<MetaPerson>): Promise<MetaPersonExtended> {
    if (person.encoded && !person.id) {
      const raw = decodeURIComponent(person.encoded).split('tmdb/person/')[1];
      person.id = +raw;
    }

    if (!person.id) {
      throw new Error('Person ID is required');
    }

    const details = await this._tmdb.people.details(+person.id, [
      'combined_credits',
    ]);

    return {
      id: details.id,
      type: 'person',
      name: details.name,
      gender: details.gender === 2 ? 'Male' : 'Female',
      poster: this.getImageUrl(details.profile_path),
      provider: TmdbService.PROVIDER,
      encoded: encodeURIComponent(`tmdb/person/${details.id}`),
      biography: details.biography,
      birthday: details.birthday,
      deathday: details.deathday,
      placeOfBirth: details.place_of_birth,
      knownForDepartment: details.known_for_department,
      alsoKnownAs: details.also_known_as,
      credits: {
        cast: details.combined_credits?.cast?.map((credit: any) => ({
          id: credit.id,
          title: credit.title || credit.name || '',
          character: credit.character || '',
          poster: this.getImageUrl(credit.poster_path),
          releaseDate: credit.release_date || credit.first_air_date || '',
          voteAverage: credit.vote_average || 0,
          mediaType: credit.media_type,
        })),
        crew: details.combined_credits?.crew?.map((credit: any) => ({
          id: credit.id,
          title: credit.title || credit.name || '',
          job: credit.job || '',
          poster: this.getImageUrl(credit.poster_path),
          releaseDate: credit.release_date || credit.first_air_date || '',
          voteAverage: credit.vote_average || 0,
          mediaType: credit.media_type,
        })),
      },
    };
  }
}

export interface CatalogConfig {
  baseUrl?: string;
  apiKey?: string;
  language?: string;
  isAdult?: boolean;
  email?: string;
  password?: string;
  region?: string;
  quality?: string;
}
