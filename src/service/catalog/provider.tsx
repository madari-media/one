import React, { createContext, useContext, useMemo } from 'react';
import { CatalogBaseCallerService, CatalogBaseService } from './base.service';
import { useCatalogConnection } from '@/context/CatalogConnectionContext';
import { TvmazeService } from './tvmaze.service';
import { Meta, MetaExtended, MetaPerson, MetaPersonExtended } from '@/service/type.ts';

interface CatalogProviderProps {
  children: React.ReactNode;
}

const CatalogContext = createContext<CatalogBaseCallerService | null>(null);

export const CatalogProvider: React.FC<CatalogProviderProps> = ({
  children,
}) => {
  const { connections, isLoading, jellyfinService } = useCatalogConnection();

  const catalogService = useMemo(() => {
    if (isLoading) {
      return new CatalogBaseCallerService([]);
    }

    const services: CatalogBaseService[] = connections
      .filter((conn) => conn.enabled)
      .map((conn) => {
        switch (conn.type) {
          case 'jellyfin':
            return jellyfinService as CatalogBaseService;
          case 'tvmaze':
            return new TvmazeService(conn.config) as CatalogBaseService;
          default:
            console.warn(`Unknown catalog type: ${conn.type}`);
            return null;
        }
      })
      .filter((service): service is CatalogBaseService => service !== null);

    return new CatalogBaseCallerService(services);
  }, [connections, isLoading]);

  return (
    <CatalogContext.Provider value={catalogService}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};

// Convenience hooks for common operations
export const useCatalogs = () => {
  const catalog = useCatalog();
  const [catalogs, setCatalogs] = React.useState<
    Awaited<ReturnType<typeof catalog.getAllCatalogs>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        setLoading(true);
        const results = await catalog.getAllCatalogs();
        setCatalogs(results);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch catalogs'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, [catalog]);

  return { catalogs, loading, error };
};

export const useSearch = (query: string) => {
  const catalog = useCatalog();
  const [results, setResults] = React.useState<
    Awaited<ReturnType<typeof catalog.getAllSearchResults>>
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const search = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        const searchResults = await catalog.getAllSearchResults(query);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to search'));
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [catalog, query]);

  return { results, loading, error };
};

export const useCatalogMeta = (catalogId: string) => {
  const catalog = useCatalog();
  const [meta, setMeta] = React.useState<
    Awaited<ReturnType<typeof catalog.getAllCatalogMeta>>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const results = await catalog.getAllCatalogMeta({
          id: catalogId,
          title: '',
        });
        setMeta(results);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to fetch catalog meta'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [catalog, catalogId]);

  return { meta, loading, error };
};

export const useMeta = (metaData: Partial<Meta> | null) => {
  const catalog = useCatalog();
  const [meta, setMeta] =
    React.useState<Awaited<ReturnType<typeof catalog.getFirstMeta>>>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const fetchMeta = async () => {
      try {
        if (!metaData) {
          return setError(new Error('Failed to fetch meta'));
        }

        setLoading(true);
        const result = await catalog.getFirstMeta(metaData);
        setMeta(result);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch meta'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [catalog, metaData]);

  return { meta, loading, error };
};

export const useLoadSeasonDetails = (meta: MetaExtended | null) => {
  const catalog = useCatalog();
  const [selectedSeason, setSelectedSeason] = React.useState<number | null>(
    null,
  );
  const [seasonDetails, setSeasonDetails] = React.useState<
    MetaExtended['seasons'] | null
  >(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadSeason = React.useCallback(
    async (seasonNumber: number) => {
      if (!meta || !meta.id || meta.metaType !== 'tv') {
        setError(new Error('Invalid meta data for loading season details'));
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await catalog.loadSeasonDetails(meta, seasonNumber);
        setSeasonDetails(result ? result : null);
        setSelectedSeason(seasonNumber);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to load season details'),
        );
        setSeasonDetails(null);
      } finally {
        setIsLoading(false);
      }
    },
    [catalog, meta],
  );

  return {
    selectedSeason,
    seasonDetails,
    isLoading,
    error,
    loadSeason,
    clearSeason: () => {
      setSelectedSeason(null);
      setSeasonDetails(null);
      setError(null);
    },
  };
};

export const useLoadRelated = (meta: MetaExtended | null) => {
  const catalog = useCatalog();
  const [related, setRelated] = React.useState<MetaExtended[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const loadRelated = async () => {
      if (!meta || !meta.id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const result = await catalog.loadRelated(meta);
        setRelated(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to load related content'),
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadRelated();
  }, [catalog, meta]);

  return { related, isLoading, error };
};

export const usePerson = (person: MetaPerson | null) => {
  const catalog = useCatalog();
  const [personDetails, setPersonDetails] =
    React.useState<MetaPersonExtended | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!person) {
      setPersonDetails(null);
      return;
    }

    const loadPerson = async () => {
      try {
        setLoading(true);
        setError(null);
        const details = await catalog.person(person);
        setPersonDetails(details);
      } catch (err) {
        console.log(err);
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to load person details'),
        );
        setPersonDetails(null);
      } finally {
        setLoading(false);
      }
    };

    loadPerson();
  }, [catalog, person]);

  return {
    person: personDetails,
    loading,
    error,
  };
};
