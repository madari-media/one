import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAppAuth } from './AppAuthContext';
import { CatalogConfig } from '@/service/catalog/tmdb.service';
import { getLanguages, Language } from '@/service/language.service';

export interface CatalogConnection {
  type: string;
  config: CatalogConfig;
  enabled: boolean;
}

interface CatalogConnectionContextType {
  connections: CatalogConnection[];
  addConnection: (connection: CatalogConnection) => void;
  removeConnection: (type: string) => void;
  updateConnection: (type: string, config: Partial<CatalogConfig>) => void;
  toggleConnection: (type: string) => void;
  enableConnection: (type: string) => void;
  disableConnection: (type: string) => void;
  isLoading: boolean;
  languages: Language[];
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'catalog_connections';
const DEFAULT_CONNECTIONS: CatalogConnection[] = [
  {
    type: 'tmdb',
    config: {
      baseUrl:
        import.meta.env.VITE_APP_TMDB_BASE_URL ||
        'https://api.themoviedb.org/3',
      apiKey: import.meta.env.VITE_APP_TMDB_API_KEY!,
      language: 'en-US',
      isAdult: false,
    },
    enabled: true,
  },
];

const CatalogConnectionContext = createContext<
  CatalogConnectionContextType | undefined
>(undefined);

interface CatalogConnectionProviderProps {
  children: ReactNode;
}

function defaultValue(): { catalog: CatalogConnection[] } {
  const stored = localStorage.getItem(STORAGE_KEY);

  return stored ? JSON.parse(stored) : { catalog: DEFAULT_CONNECTIONS };
}

export function CatalogConnectionProvider({
  children,
}: CatalogConnectionProviderProps) {
  const { isAuthenticated } = useAppAuth();
  const [connections, setConnections] = useState<CatalogConnection[]>(
    defaultValue().catalog,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const loadedLanguages = await getLanguages();
        setLanguages(loadedLanguages);
      } catch (error) {
        console.error('Error loading languages:', error);
      }
    };

    loadLanguages();
  }, []);

  useEffect(() => {
    const loadConnections = async () => {
      try {
        if (isAuthenticated) {
          const response = await fetch('/connections');
          if (response.ok) {
            const data = await response.json();
            // Ensure all connections have the enabled property
            const connectionsWithEnabled = (data.catalog || []).map(
              (conn: any) => ({
                ...conn,
                enabled: conn.enabled ?? true,
              }),
            );
            setConnections(connectionsWithEnabled);
          } else {
            throw new Error('Failed to fetch connections');
          }
        }
      } catch (error) {
        console.error('Error loading connections:', error);
        setConnections(DEFAULT_CONNECTIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadConnections();
  }, [isAuthenticated]);

  const addConnection = (connection: CatalogConnection) => {
    setConnections((prev) => [...prev, { ...connection, enabled: true }]);
  };

  const removeConnection = (type: string) => {
    setConnections((prev) => prev.filter((conn) => conn.type !== type));
  };

  const updateConnection = (type: string, config: Partial<CatalogConfig>) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type
          ? { ...conn, config: { ...conn.config, ...config } }
          : conn,
      ),
    );
  };

  const toggleConnection = (type: string) => {
    setConnections((prev) => {
      const existingConnection = prev.find((conn) => conn.type === type);

      if (existingConnection) {
        // Toggle the existing connection
        return prev.map((conn) =>
          conn.type === type ? { ...conn, enabled: !conn.enabled } : conn,
        );
      } else {
        const defaultConfig: CatalogConfig = {
          baseUrl:
            type === 'tmdb'
              ? import.meta.env.VITE_APP_TMDB_BASE_URL ||
                'https://api.themoviedb.org/3'
              : 'https://api.tvmaze.com',
          apiKey:
            type === 'tmdb' ? import.meta.env.VITE_APP_TMDB_API_KEY || '' : '',
          language: type === 'tmdb' ? 'en-US' : 'en',
          isAdult: false,
        };

        return [...prev, { type, config: defaultConfig, enabled: true }];
      }
    });
  };

  const enableConnection = (type: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type ? { ...conn, enabled: true } : conn,
      ),
    );
  };

  const disableConnection = (type: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type ? { ...conn, enabled: false } : conn,
      ),
    );
  };

  const saveToStorage = () => {
    if (!isAuthenticated) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ catalog: connections }),
      );
    }
  };

  const value = {
    connections,
    addConnection,
    removeConnection,
    updateConnection,
    toggleConnection,
    enableConnection,
    disableConnection,
    isLoading,
    languages,
    selectedLanguage,
    setSelectedLanguage,
    saveToStorage,
  };

  return (
    <CatalogConnectionContext.Provider value={value}>
      {children}
    </CatalogConnectionContext.Provider>
  );
}

export function useCatalogConnection() {
  const context = useContext(CatalogConnectionContext);
  if (context === undefined) {
    throw new Error(
      'useCatalogConnection must be used within a CatalogConnectionProvider',
    );
  }
  return context;
}
