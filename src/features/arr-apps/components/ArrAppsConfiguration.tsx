import React, { useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import { CheckCircle, ChevronDown, ChevronUp, Clock, Download, Film, Plus, Trash2, Tv, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AVAILABLE_APPS = [
  {
    id: 'sonarr',
    name: 'Sonarr',
    description: 'Series Management',
    icon: Tv,
    color: 'bg-blue-600',
    defaultPort: '8989',
  },
  {
    id: 'radarr',
    name: 'Radarr',
    description: 'Movie Management',
    icon: Film,
    color: 'bg-yellow-600',
    defaultPort: '7878',
  },
  {
    id: 'qbittorrent',
    name: 'qBittorrent',
    description: 'Torrent Client',
    icon: Download,
    color: 'bg-green-600',
    defaultPort: '8080',
  },
];

const ArrAppsConfiguration: React.FC = () => {
  const {
    connections,
    toggleConnection,
    updateConnection,
    removeConnection,
    checkConnectionStatus,
  } = useArrApps();
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<(typeof AVAILABLE_APPS)[0] | null>(null);
  const [formData, setFormData] = useState({
    baseUrl: '',
    apiKey: '',
    username: '',
    password: '',
  });

  const toggleExpanded = (appType: string) => {
    setExpandedApp(expandedApp === appType ? null : appType);
  };

  const handleConfigChange = (
    type: string,
    key: string,
    value: string | boolean,
  ) => {
    updateConnection(type, { [key]: value });
  };

  const handleAddApp = (app: (typeof AVAILABLE_APPS)[0]) => {
    setSelectedApp(app);
    setFormData({
      baseUrl: `http://localhost:${app.defaultPort}`,
      apiKey: '',
      username: '',
      password: '',
    });
    setShowAddDialog(true);
  };

  const handleSubmit = () => {
    if (!selectedApp) return;

    toggleConnection(selectedApp.id);
    updateConnection(selectedApp.id, formData);
    setShowAddDialog(false);
    setSelectedApp(null);
  };

  const handleTestConnection = async (type: string) => {
    await checkConnectionStatus(type);
  };

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <XCircle className="w-5 h-5 text-zinc-500" />;
    }
  };

  const availableApps = AVAILABLE_APPS.filter(
    (app) => !connections.some((conn) => conn.type === app.id),
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Arr Apps Configuration</h2>
      <p className="text-zinc-400 mb-6">
        Configure your Sonarr, Radarr, and qBittorrent applications.
      </p>

      {/* Available Apps */}
      {availableApps.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Available Apps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableApps.map((app) => (
              <div
                key={app.id}
                className="bg-card dark:bg-card/50 rounded-lg border border-border dark:border-border/50 overflow-hidden hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 ${app.color} rounded-lg`}>
                      <app.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{app.name}</h3>
                      <p className="text-sm text-zinc-400">
                        {app.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddApp(app)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium text-sm"
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

      {/* Add App Dialog */}
      {selectedApp && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Add {selectedApp.name}
              </DialogTitle>
            </DialogHeader>
          <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Base URL
                </label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, baseUrl: e.target.value })
                  }
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`http://localhost:${selectedApp.defaultPort}`}
                />
              </div>
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
                  placeholder={`Enter your ${selectedApp.name} API key`}
                />
              </div>
              {selectedApp.id === 'qbittorrent' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Username (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Password (optional)
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Password"
                    />
                  </div>
                </>
              )}
          </div>
          <DialogFooter>
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
              Add App
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}

      {/* Configured Apps */}
      <div className="space-y-4">
        {connections.map((connection) => {
          const app = AVAILABLE_APPS.find(
            (a) => a.id === connection.type,
          );
          if (!app) return null;

          return (
            <div
              key={connection.type}
              className="bg-zinc-700/50 rounded-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 ${app.color} rounded-lg`}>
                    <app.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{app.name}</h3>
                    <p className="text-sm text-zinc-400">
                      {app.description}
                    </p>
                  </div>
                  {getConnectionStatusIcon(connection.connectionStatus)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(connection.type)}
                    disabled={connection.connectionStatus === 'checking'}
                    className="px-3 py-1.5 bg-accent dark:bg-accent/80 hover:bg-accent/90 dark:hover:bg-accent/70 disabled:bg-accent/50 disabled:cursor-not-allowed text-accent-foreground text-sm rounded-md transition-colors font-medium"
                  >
                    {connection.connectionStatus === 'checking' ? 'Testing...' : 'Test'}
                  </button>
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
                    title="Remove app"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => toggleExpanded(connection.type)}
                    className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
                  >
                    {expandedApp === connection.type ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedApp === connection.type && (
                <div className="p-4 border-t border-zinc-600 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Base URL
                    </label>
                    <input
                      type="text"
                      value={connection.config.baseUrl || ''}
                      onChange={(e) =>
                        handleConfigChange(
                          connection.type,
                          'baseUrl',
                          e.target.value,
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder={`http://localhost:${app.defaultPort}`}
                    />
                  </div>
                  {connection.type !== 'qbittorrent' && (
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
                        placeholder={`Enter your ${app.name} API key`}
                      />
                    </div>
                  )}
                  {connection.type === 'qbittorrent' && (
                    <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-sm text-blue-300">
                        qBittorrent uses username/password authentication. Configure below or leave empty if no authentication is required.
                      </p>
                    </div>
                  )}
                  {connection.type === 'qbittorrent' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Username (optional)
                        </label>
                        <input
                          type="text"
                          value={connection.config.username || ''}
                          onChange={(e) =>
                            handleConfigChange(
                              connection.type,
                              'username',
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Username"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Password (optional)
                        </label>
                        <input
                          type="password"
                          value={connection.config.password || ''}
                          onChange={(e) =>
                            handleConfigChange(
                              connection.type,
                              'password',
                              e.target.value,
                            )
                          }
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Password"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleTestConnection(connection.type)}
                      disabled={connection.connectionStatus === 'checking'}
                      className="px-3 py-1.5 bg-accent dark:bg-accent/80 hover:bg-accent/90 dark:hover:bg-accent/70 disabled:bg-accent/50 disabled:cursor-not-allowed text-accent-foreground text-sm rounded-md transition-colors font-medium"
                    >
                      {connection.connectionStatus === 'checking' ? 'Testing Connection...' : 'Test Connection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {connections.length === 0 && availableApps.length === 0 && (
        <div className="text-center py-8 text-zinc-400">
          <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>All available apps have been configured.</p>
        </div>
      )}
    </div>
  );
};

export default ArrAppsConfiguration;