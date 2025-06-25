export interface Meta {
  id: string | number;
  encoded: string;
  name: string;
  description: string;
  poster: string;
  background: string;
  releaseDate: string;
  type: 'meta';
  provider: string;
  metaType: string;
  genres?: string[];
}

export interface MetaPerson {
  id: string | number;
  encoded: string;
  type: 'person';
  gender: string;
  name: string;
  poster: string;
  provider: string;
}

export interface Catalog {
  id: string;
  title: string;
  featured?: boolean;
}

export interface MetaExtended extends Meta {
  provider: string;
  cast?: {
    id: string | number;
    name: string;
    character: string;
    image: string;
    order: number;
    type: 'cast' | 'crew';
  }[];
  trailers?: {
    id: string | number;
    name: string;
    key: string;
    site: string;
    type: string;
  }[];
  reviews?: {
    id: string | number;
    author: string;
    content: string;
    rating: number;
    createdAt: string;
  }[];
  runtime?: number;
  status?: string;
  tagline?: string;
  voteAverage?: number;
  voteCount?: number;
  budget?: number;
  revenue?: number;
  originalLanguage?: string;
  productionCompanies?: {
    id: number;
    name: string;
    logoPath: string;
    originCountry: string;
  }[];
  spokenLanguages?: {
    iso_639_1: string;
    name: string;
  }[];
  externalIds?: {
    imdbId: string;
    tmdbId: string;
  };
  seasons?: {
    id: number;
    name: string;
    overview: string;
    posterPath: string;
    seasonNumber: number;
    airDate: string;
    episodeCount: number;
    episodes?: {
      id: number;
      name: string;
      overview: string;
      stillPath: string;
      episodeNumber: number;
      airDate: string;
      runtime: number;
      voteAverage: number;
      voteCount: number;
    }[];
  }[];
  totalSeasons?: number;
  totalEpisodes?: number;
}

export interface MetaPersonExtended extends MetaPerson {
  biography?: string;
  birthday?: string;
  deathday?: string;
  placeOfBirth?: string;
  knownForDepartment?: string;
  alsoKnownAs?: string[];
  credits?: {
    cast?: {
      id: number;
      title: string;
      character: string;
      poster: string;
      releaseDate: string;
      voteAverage: number;
      mediaType: 'movie' | 'tv';
    }[];
    crew?: {
      id: number;
      title: string;
      job: string;
      poster: string;
      releaseDate: string;
      voteAverage: number;
      mediaType: 'movie' | 'tv';
    }[];
  };
}
