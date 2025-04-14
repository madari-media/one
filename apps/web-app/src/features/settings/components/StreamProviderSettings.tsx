import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, Tv2 } from 'lucide-react';
import { useCatalogConnection } from '@/context/CatalogConnectionContext';

const StreamProviderSettings: React.FC = () => {
  const { connections, updateConnection, addConnection } =
    useCatalogConnection();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  useEffect(() => {
    // Initialize connections if they don't exist
    if (!connections.find((conn) => conn.type === 'netflix')) {
      addConnection({
        type: 'netflix',
        config: {
          email: '',
          password: '',
          region: 'US',
          quality: 'high',
        },
        enabled: true,
      });
    }
    if (!connections.find((conn) => conn.type === 'prime')) {
      addConnection({
        type: 'prime',
        config: {
          email: '',
          password: '',
          region: 'US',
          quality: 'high',
        },
        enabled: true,
      });
    }
    if (!connections.find((conn) => conn.type === 'tvmaze')) {
      addConnection({
        type: 'tvmaze',
        config: {
          language: 'en',
        },
        enabled: true,
      });
    }
  }, [connections, addConnection]);

  const toggleExpanded = (provider: string) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  const handleConfigChange = (type: string, key: string, value: string) => {
    updateConnection(type, { [key]: value });
  };

  return (
    <div className="pt-12">
      <h2 className="text-xl font-semibold mb-4">Stream Providers</h2>
      <p className="text-zinc-400 mb-6">
        Connect your streaming services to track your watch history and get
        personalized recommendations.
      </p>

      <div className="space-y-4">
        {/* Netflix Settings */}
        <div className="bg-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-600 rounded-lg">
                <PlayCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Netflix</h3>
                <p className="text-sm text-zinc-400">
                  Connect your Netflix account
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                Connect
              </button>
              <button
                onClick={() => toggleExpanded('netflix')}
                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                {expandedProvider === 'netflix' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {expandedProvider === 'netflix' && (
            <div className="p-4 border-t border-zinc-600 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={
                    connections.find((conn) => conn.type === 'netflix')?.config
                      .email || ''
                  }
                  onChange={(e) =>
                    handleConfigChange('netflix', 'email', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your Netflix email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={
                    connections.find((conn) => conn.type === 'netflix')?.config
                      .password || ''
                  }
                  onChange={(e) =>
                    handleConfigChange('netflix', 'password', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your Netflix password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Region
                </label>
                <select
                  value={
                    connections.find((conn) => conn.type === 'netflix')?.config
                      .region || 'US'
                  }
                  onChange={(e) =>
                    handleConfigChange('netflix', 'region', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Streaming Quality
                </label>
                <select
                  value={
                    connections.find((conn) => conn.type === 'netflix')?.config
                      .quality || 'high'
                  }
                  onChange={(e) =>
                    handleConfigChange('netflix', 'quality', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low (480p)</option>
                  <option value="medium">Medium (720p)</option>
                  <option value="high">High (1080p)</option>
                  <option value="ultra">Ultra (4K)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Amazon Prime Settings */}
        <div className="bg-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Tv2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Amazon Prime</h3>
                <p className="text-sm text-zinc-400">
                  Connect your Amazon Prime account
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                Connect
              </button>
              <button
                onClick={() => toggleExpanded('prime')}
                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                {expandedProvider === 'prime' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {expandedProvider === 'prime' && (
            <div className="p-4 border-t border-zinc-600 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={
                    connections.find((conn) => conn.type === 'prime')?.config
                      .email || ''
                  }
                  onChange={(e) =>
                    handleConfigChange('prime', 'email', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your Amazon email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={
                    connections.find((conn) => conn.type === 'prime')?.config
                      .password || ''
                  }
                  onChange={(e) =>
                    handleConfigChange('prime', 'password', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your Amazon password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Region
                </label>
                <select
                  value={
                    connections.find((conn) => conn.type === 'prime')?.config
                      .region || 'US'
                  }
                  onChange={(e) =>
                    handleConfigChange('prime', 'region', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Streaming Quality
                </label>
                <select
                  value={
                    connections.find((conn) => conn.type === 'prime')?.config
                      .quality || 'high'
                  }
                  onChange={(e) =>
                    handleConfigChange('prime', 'quality', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="low">Low (480p)</option>
                  <option value="medium">Medium (720p)</option>
                  <option value="high">High (1080p)</option>
                  <option value="ultra">Ultra (4K)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* TVMaze Settings */}
        <div className="bg-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <Tv2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">TVMaze</h3>
                <p className="text-sm text-zinc-400">
                  TV show information provider
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleExpanded('tvmaze')}
                className="p-2 hover:bg-zinc-600 rounded-lg transition-colors"
              >
                {expandedProvider === 'tvmaze' ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {expandedProvider === 'tvmaze' && (
            <div className="p-4 border-t border-zinc-600 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Language
                </label>
                <select
                  value={
                    connections.find((conn) => conn.type === 'tvmaze')?.config
                      .language || 'en'
                  }
                  onChange={(e) =>
                    handleConfigChange('tvmaze', 'language', e.target.value)
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamProviderSettings;