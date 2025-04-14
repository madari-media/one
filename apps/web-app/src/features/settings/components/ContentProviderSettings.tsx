import React, { useEffect, useMemo, useState } from 'react';
import { useCatalogConnection } from '@/context/CatalogConnectionContext';
import {
  ChevronDown,
  ChevronUp,
  Film,
  Plus,
  Trash2,
  Tv,
  X,
} from 'lucide-react';

const AVAILABLE_PROVIDERS = [
  {
    id: 'tmdb',
    name: 'TMDB',
    description: 'The Movie Database',
    icon: Film,
    color: 'bg-red-600',
  },
  {
    id: 'tvmaze',
    name: 'TVMaze',
    description: 'TV Show Database',
    icon: Tv,
    color: 'bg-green-600',
  },
];

const ContentProviderSettings: React.FC = () => {
  const {
    connections,
    toggleConnection,
    updateConnection,
    removeConnection,
    languages,
    saveToStorage,
  } = useCatalogConnection();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<
    (typeof AVAILABLE_PROVIDERS)[0] | null
  >(null);
  const [formData, setFormData] = useState({
    apiKey: '',
    language: 'en-US',
    isAdult: false,
  });

  const sortedLanguages = useMemo(() => {
    const english = languages.find((lang) => lang.code === 'en');
    const otherLanguages = languages.filter((lang) => lang.code !== 'en');
    return english ? [english, ...otherLanguages] : languages;
  }, [languages]);

  const toggleExpanded = (provider: string) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  useEffect(() => {
    saveToStorage();
  }, [connections]);

  const handleConfigChange = (
    type: string,
    key: string,
    value: string | boolean,
  ) => {
    updateConnection(type, { [key]: value });
  };

  const handleAddProvider = (provider: (typeof AVAILABLE_PROVIDERS)[0]) => {
    setSelectedProvider(provider);
    setFormData({
      apiKey: '',
      language: provider.id === 'tmdb' ? 'en-US' : 'en',
      isAdult: false,
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!selectedProvider) return;

    toggleConnection(selectedProvider.id);
    updateConnection(selectedProvider.id, formData);
    setShowAddDialog(false);
    setSelectedProvider(null);
  };

  const availableProviders = AVAILABLE_PROVIDERS.filter(
    (provider) => !connections.some((conn) => conn.type === provider.id),
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Content Providers</h2>
      <p className="text-zinc-400 mb-6">
        Choose which content providers to use for discovering movies and TV
        shows.
      </p>

      {/* Available Providers */}
      {availableProviders.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Available Providers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-zinc-700/50 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 ${provider.color} rounded-lg`}>
                      <provider.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddProvider(provider)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Provider Dialog */}
      {showAddDialog && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Add {selectedProvider.name}
              </h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Enter your ${selectedProvider.name} API key`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {sortedLanguages.map((lang) => (
                    <option
                      key={lang.code}
                      value={
                        lang.code === 'en' && selectedProvider.id === 'tmdb'
                          ? 'en-US'
                          : lang.code
                      }
                    >
                      {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>
              {selectedProvider.id === 'tmdb' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isAdult"
                    checked={formData.isAdult}
                    onChange={(e) =>
                      setFormData({ ...formData, isAdult: e.target.checked })
                    }
                    className="w-4 h-4 text-red-500 bg-zinc-700 border-zinc-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="isAdult" className="text-sm text-zinc-300">
                    Include adult content
                  </label>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Add Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Providers */}
      <div className="space-y-4">
        {connections.map((connection) => {
          const provider = AVAILABLE_PROVIDERS.find(
            (p) => p.id === connection.type,
          );
          if (!provider) return null;

          return (
            <div
              key={connection.type}
              className="bg-zinc-700/50 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 ${provider.color} rounded-lg`}>
                    <provider.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={connection.enabled}
                      onChange={() => toggleConnection(connection.type)}
                    />
                    <div className="w-11 h-6 bg-zinc-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-500/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-red-500"></div>
                  </label>
                  <button
                    onClick={() => removeConnection(connection.type)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    title="Remove provider"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => toggleExpanded(connection.type)}
                    className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                  >
                    {expandedProvider === connection.type ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedProvider === connection.type && (
                <div className="p-4 border-t border-zinc-600 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={connection.config.apiKey || ''}
                      onChange={(e) =>
                        handleConfigChange(
                          connection.type,
                          'apiKey',
                          e.target.value,
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder={`Enter your ${provider.name} API key`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Language
                    </label>
                    <select
                      value={
                        connection.config.language ||
                        (connection.type === 'tmdb' ? 'en-US' : 'en')
                      }
                      onChange={(e) =>
                        handleConfigChange(
                          connection.type,
                          'language',
                          e.target.value,
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {sortedLanguages.map((lang) => (
                        <option
                          key={lang.code}
                          value={
                            lang.code === 'en' && connection.type === 'tmdb'
                              ? 'en-US'
                              : lang.code
                          }
                        >
                          {lang.name} ({lang.nativeName})
                        </option>
                      ))}
                    </select>
                  </div>
                  {connection.type === 'tmdb' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${connection.type}-adult`}
                        checked={connection.config.isAdult || false}
                        onChange={(e) =>
                          handleConfigChange(
                            connection.type,
                            'isAdult',
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 text-red-500 bg-zinc-800 border-zinc-700 rounded focus:ring-red-500"
                      />
                      <label
                        htmlFor={`${connection.type}-adult`}
                        className="text-sm text-zinc-300"
                      >
                        Include adult content
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContentProviderSettings;
