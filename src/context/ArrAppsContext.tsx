import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface ArrAppConfig {
  baseUrl?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  enabled?: boolean;
}

export interface ArrAppConnection {
  type: 'sonarr' | 'radarr' | 'qbittorrent';
  name: string;
  config: ArrAppConfig;
  enabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking' | 'error';
}

interface ArrAppsContextType {
  connections: ArrAppConnection[];
  addConnection: (connection: ArrAppConnection) => void;
  removeConnection: (type: string) => void;
  updateConnection: (type: string, config: Partial<ArrAppConfig>) => void;
  toggleConnection: (type: string) => void;
  enableConnection: (type: string) => void;
  disableConnection: (type: string) => void;
  checkConnectionStatus: (type: string) => Promise<void>;
  isLoading: boolean;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'arr_apps_connections';
const DEFAULT_CONNECTIONS: ArrAppConnection[] = [];

const ArrAppsContext = createContext<ArrAppsContextType | undefined>(undefined);

interface ArrAppsProviderProps {
  children: ReactNode;
}

function getStoredConnections(): ArrAppConnection[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CONNECTIONS;
}

export function ArrAppsProvider({ children }: ArrAppsProviderProps) {
  const [connections, setConnections] = useState<ArrAppConnection[]>(
    getStoredConnections()
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const addConnection = (connection: ArrAppConnection) => {
    setConnections((prev) => [
      ...prev,
      { ...connection, enabled: true, connectionStatus: 'disconnected' }
    ]);
  };

  const removeConnection = (type: string) => {
    setConnections((prev) => prev.filter((conn) => conn.type !== type));
  };

  const updateConnection = (type: string, config: Partial<ArrAppConfig>) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type
          ? { ...conn, config: { ...conn.config, ...config } }
          : conn
      )
    );
  };

  const toggleConnection = (type: string) => {
    setConnections((prev) => {
      const existingConnection = prev.find((conn) => conn.type === type);

      if (existingConnection) {
        return prev.map((conn) =>
          conn.type === type ? { ...conn, enabled: !conn.enabled } : conn
        );
      } else {
        const appName = type === 'sonarr' ? 'Sonarr' : type === 'radarr' ? 'Radarr' : 'qBittorrent';
        const newConnection: ArrAppConnection = {
          type: type as 'sonarr' | 'radarr' | 'qbittorrent',
          name: appName,
          config: { baseUrl: '', apiKey: '', enabled: true },
          enabled: true,
          connectionStatus: 'disconnected'
        };
        return [...prev, newConnection];
      }
    });
  };

  const enableConnection = (type: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type ? { ...conn, enabled: true } : conn
      )
    );
  };

  const disableConnection = (type: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type ? { ...conn, enabled: false } : conn
      )
    );
  };

  const checkConnectionStatus = async (type: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
        conn.type === type ? { ...conn, connectionStatus: 'checking' } : conn
      )
    );

    try {
      const connection = connections.find((conn) => conn.type === type);
      if (!connection?.config.baseUrl) {
        throw new Error('Missing base URL');
      }

      let isConnected = false;

      if (type === 'qbittorrent') {
        // qBittorrent uses username/password authentication
        const { QBittorrentService } = await import('@/service/arr/qbittorrent.service');
        const qbService = new QBittorrentService({
          baseUrl: connection.config.baseUrl,
          username: connection.config.username || '',
          password: connection.config.password || '',
        });
        isConnected = await qbService.testConnection();
      } else {
        // Sonarr/Radarr use API key authentication
        if (!connection?.config.apiKey) {
          throw new Error('Missing API key');
        }
        const response = await fetch(`${connection.config.baseUrl}/api/v3/system/status`, {
          headers: {
            'X-Api-Key': connection.config.apiKey,
          },
        });
        isConnected = response.ok;
      }

      if (isConnected) {
        setConnections((prev) =>
          prev.map((conn) =>
            conn.type === type ? { ...conn, connectionStatus: 'connected' } : conn
          )
        );
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error(`Connection test failed for ${type}:`, error);
      setConnections((prev) =>
        prev.map((conn) =>
          conn.type === type ? { ...conn, connectionStatus: 'error' } : conn
        )
      );
    }
  };

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  };

  useEffect(() => {
    saveToStorage();
  }, [connections]);

  const value = {
    connections,
    addConnection,
    removeConnection,
    updateConnection,
    toggleConnection,
    enableConnection,
    disableConnection,
    checkConnectionStatus,
    isLoading,
    saveToStorage,
  };

  return (
    <ArrAppsContext.Provider value={value}>
      {children}
    </ArrAppsContext.Provider>
  );
}

export function useArrApps() {
  const context = useContext(ArrAppsContext);
  if (context === undefined) {
    throw new Error('useArrApps must be used within an ArrAppsProvider');
  }
  return context;
}