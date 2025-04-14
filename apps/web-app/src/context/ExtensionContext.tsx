import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAppAuth } from './AppAuthContext';
import { Stream } from '@/service/stream/base-stream.service';
import { Meta } from '@/service/type';
import { useExtension } from '@/hooks/useExtension';

export interface ExtensionConfig {
  [key: string]: any;
}

export interface Extension {
  id: string;
  script: string;
  configs: ExtensionConfig[];
  enabled: boolean;
}

interface ExtensionContextType {
  extensions: Extension[];
  addExtension: (extension: Omit<Extension, 'enabled'>) => void;
  updateExtension: (id: string, extension: Partial<Extension>) => void;
  addExtensionConfig: (id: string, config: ExtensionConfig | null) => void;
  updateExtensionConfig: (
    id: string,
    configIndex: number,
    config: ExtensionConfig | null,
  ) => void;
  removeExtensionConfig: (id: string, configIndex: number) => void;
  getExtensionConfigs: (id: string) => ExtensionConfig[] | undefined;
  removeExtension: (id: string) => void;
  getStreams: (
    input: Meta,
    season?: { season: number; episode: number },
  ) => AsyncGenerator<[string, Stream[]], void, unknown>;
  isLoading: boolean;
}

const STORAGE_KEY = 'extensions';
const DEFAULT_EXTENSIONS: Extension[] = [];

const ExtensionContext = createContext<ExtensionContextType | undefined>(
  undefined,
);

interface ExtensionProviderProps {
  children: ReactNode;
}

function defaultValue(): { extensions: Extension[] } {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { extensions: DEFAULT_EXTENSIONS };
}

export function ExtensionProvider({ children }: ExtensionProviderProps) {
  const { isAuthenticated } = useAppAuth();
  const [extensions, setExtensions] = useState<Extension[]>(
    defaultValue().extensions,
  );
  const [isLoading, setIsLoading] = useState(true);

  const { callGetStreams } = useExtension(
    extensions.map((ext) => ({ id: ext.id, script: ext.script })),
  );

  useEffect(() => {
    const loadExtensions = async () => {
      try {
        if (isAuthenticated) {
          const response = await fetch('/extensions');
          if (response.ok) {
            const data = await response.json();
            setExtensions(data.extensions || []);
          } else {
            throw new Error('Failed to fetch extensions');
          }
        }
      } catch (error) {
        console.error('Error loading extensions:', error);
        setExtensions(DEFAULT_EXTENSIONS);
      } finally {
        setIsLoading(false);
      }
    };

    loadExtensions();
  }, [isAuthenticated]);

  const addExtension = (extension: Omit<Extension, 'enabled'>) => {
    setExtensions((prev) => [...prev, { ...extension, enabled: true }]);
  };

  const updateExtension = (id: string, extension: Partial<Extension>) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === id ? { ...ext, ...extension } : ext)),
    );
  };

  const addExtensionConfig = (id: string, config: ExtensionConfig) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id
          ? { ...ext, configs: [...(ext.configs || []), config] }
          : ext,
      ),
    );
  };

  const updateExtensionConfig = (
    id: string,
    configIndex: number,
    config: ExtensionConfig,
  ) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id
          ? {
              ...ext,
              configs: ext.configs.map((c, i) =>
                i === configIndex ? config : c,
              ),
            }
          : ext,
      ),
    );
  };

  const removeExtensionConfig = (id: string, configIndex: number) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        ext.id === id
          ? {
              ...ext,
              configs: ext.configs.filter((_, i) => i !== configIndex),
            }
          : ext,
      ),
    );
  };

  const getExtensionConfigs = (id: string) => {
    return extensions.find((ext) => ext.id === id)?.configs;
  };

  const removeExtension = (id: string) => {
    setExtensions((prev) => prev.filter((ext) => ext.id !== id));
  };

  const getStreams = async function* (
    input: Meta,
    season?: {
      season: number;
      episode: number;
    },
  ): AsyncGenerator<[string, Stream[]], void, unknown> {
    const enabledExtensions = extensions.filter((ext) => ext.enabled);

    for (const extension of enabledExtensions) {
      try {
        const allStreams: Stream[] = [];
        for (const config of extension.configs || []) {
          const streams = await callGetStreams(
            extension.id,
            config,
            input,
            season,
          );
          allStreams.push(...streams);
        }
        yield [extension.id, allStreams];
      } catch (error) {
        console.error(
          `Error getting streams from extension ${extension.id}:`,
          error,
        );
        yield [extension.id, []];
      }
    }
  };

  const saveToStorage = () => {
    if (!isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ extensions }));
    }
  };

  useEffect(() => {
    saveToStorage();
  }, [extensions, isAuthenticated]);

  const value: ExtensionContextType = {
    extensions,
    addExtension,
    updateExtension,
    addExtensionConfig: addExtensionConfig as never,
    updateExtensionConfig: updateExtensionConfig as never,
    removeExtensionConfig,
    getExtensionConfigs,
    removeExtension,
    getStreams,
    isLoading,
  };

  return (
    <ExtensionContext.Provider value={value}>
      {children}
    </ExtensionContext.Provider>
  );
}

export function useExtensionContext() {
  const context = useContext(ExtensionContext);
  if (context === undefined) {
    throw new Error(
      'useExtensionContext must be used within an ExtensionProvider',
    );
  }
  return context;
}
