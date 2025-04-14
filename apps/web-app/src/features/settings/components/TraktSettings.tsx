import React from 'react';
import { BarChart2 } from 'lucide-react';

const TraktSettings: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Trakt Integration</h2>
      <p className="text-zinc-400 mb-6">
        Coming soon: Sync your watch history and get personalized
        recommendations from Trakt.
      </p>

      <div className="flex items-center justify-between p-4 bg-zinc-700/50 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-600 rounded-lg">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-medium">Trakt.tv</h3>
            <p className="text-sm text-zinc-400">Connect your Trakt account</p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-zinc-700 text-zinc-400 rounded-lg cursor-not-allowed"
          disabled
        >
          Coming Soon
        </button>
      </div>
    </div>
  );
};

export default TraktSettings;