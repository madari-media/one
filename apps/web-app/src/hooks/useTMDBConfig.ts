import { useCatalogConnection } from '@/context/CatalogConnectionContext';
import { CatalogConfig } from '@/service/catalog/tmdb.service';

export const useTMDBConfig = (): {
  config: CatalogConfig;
  isLoading: boolean;
} => {
  const { connections, isLoading } = useCatalogConnection();

  const tmdbConfig = connections.find((conn) => conn.type === 'tmdb')
    ?.config || {
    baseUrl:
      import.meta.env.VITE_APP_TMDB_BASE_URL || 'https://api.themoviedb.org/3',
    apiKey: import.meta.env.VITE_APP_TMDB_API_KEY || '',
    language: 'en-US',
    isAdult: false,
  };

  return {
    config: tmdbConfig,
    isLoading,
  };
};