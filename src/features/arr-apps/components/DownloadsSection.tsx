import React, { useEffect, useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  File,
  Globe,
  Hash,
  Info,
  MapPin,
  Pause,
  Play,
  Search,
  Trash2,
  Users
} from 'lucide-react';
import { GlobalStats, QBittorrentService, TorrentInfo } from '@/service/arr/qbittorrent.service';

const DownloadsSection: React.FC = () => {
  const { connections } = useArrApps();
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [qbService, setQbService] = useState<QBittorrentService | null>(null);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTorrent, setExpandedTorrent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('info');

  useEffect(() => {
    initializeService();
  }, [connections]);

  useEffect(() => {
    if (qbService) {
      loadTorrents();
      const interval = setInterval(loadTorrents, 2000); // Update every 2 seconds for real-time
      return () => clearInterval(interval);
    }
  }, [qbService]);

  const initializeService = () => {
    const qbConnection = connections.find(c => c.type === 'qbittorrent' && c.enabled);
    if (qbConnection?.config.baseUrl) {
      const service = new QBittorrentService({
        baseUrl: qbConnection.config.baseUrl,
        username: qbConnection.config.username || '',
        password: qbConnection.config.password || '',
      });
      setQbService(service);
    } else {
      setQbService(null);
      setLoading(false);
    }
  };

  const loadTorrents = async () => {
    if (!qbService) return;

    try {
      const [torrentData, statsData] = await Promise.all([
        qbService.getTorrents(),
        qbService.getGlobalStats(),
      ]);
      
      setTorrents(torrentData);
      setGlobalStats(statsData);
    } catch (error) {
      console.error('Failed to load torrents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (hash: string) => {
    if (!qbService) return;
    await qbService.pauseTorrent(hash);
    loadTorrents();
  };

  const handleResume = async (hash: string) => {
    if (!qbService) return;
    await qbService.resumeTorrent(hash);
    loadTorrents();
  };

  const handleDelete = async (hash: string, deleteFiles = false) => {
    if (!qbService) return;
    if (confirm(`Delete torrent${deleteFiles ? ' and files' : ''}?`)) {
      await qbService.deleteTorrent(hash, deleteFiles);
      loadTorrents();
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'downloading':
        return 'bg-chart-1/20 text-chart-1 border border-chart-1/30';
      case 'uploading':
      case 'completedUP':
        return 'bg-green-500/20 text-green-500 border border-green-500/30';
      case 'stalledDL':
      case 'stalledUP':
        return 'bg-chart-2/20 text-chart-2 border border-chart-2/30';
      case 'pausedDL':
      case 'pausedUP':
        return 'bg-muted/50 text-muted-foreground border border-border';
      case 'error':
        return 'bg-destructive/20 text-destructive border border-destructive/30';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const formatState = (state: string) => {
    switch (state) {
      case 'downloading':
        return 'Downloading';
      case 'uploading':
        return 'Seeding';
      case 'completedUP':
        return 'Completed';
      case 'stalledDL':
        return 'Stalled (DL)';
      case 'stalledUP':
        return 'Stalled (UP)';
      case 'pausedDL':
        return 'Paused';
      case 'pausedUP':
        return 'Paused';
      case 'error':
        return 'Error';
      default:
        return state;
    }
  };

  const getFilteredTorrents = () => {
    let filtered = torrents;
    
    // Apply state filter
    if (filterState !== 'all') {
      if (filterState === 'downloading') filtered = filtered.filter(t => t.state === 'downloading');
      if (filterState === 'uploading') filtered = filtered.filter(t => t.state === 'uploading' || t.state === 'completedUP');
      if (filterState === 'paused') filtered = filtered.filter(t => t.state.includes('paused'));
      if (filterState === 'completed') filtered = filtered.filter(t => t.state === 'completedUP');
      if (filterState === 'stalled') filtered = filtered.filter(t => t.state.includes('stalled'));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getFilterCounts = () => {
    return {
      all: torrents.length,
      downloading: torrents.filter(t => t.state === 'downloading').length,
      uploading: torrents.filter(t => t.state === 'uploading' || t.state === 'completedUP').length,
      paused: torrents.filter(t => t.state.includes('paused')).length,
      completed: torrents.filter(t => t.state === 'completedUP').length,
      stalled: torrents.filter(t => t.state.includes('stalled')).length,
    };
  };

  if (!qbService) {
    return (
      <div className="text-center py-12 bg-card dark:bg-card/50 rounded-lg border border-border">
        <Download className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h3 className="text-lg font-medium text-foreground mb-2">qBittorrent Not Configured</h3>
        <p className="text-muted-foreground">
          Please configure and enable qBittorrent in the Configuration tab to view downloads.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Connecting to qBittorrent...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Downloads</h1>
        <div className="flex items-center gap-2">
          {globalStats && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-blue-400" />
                {qbService.formatSpeed(globalStats.dl_info_speed)}
              </span>
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-green-400" />
                {qbService.formatSpeed(globalStats.up_info_speed)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-400" />
                {globalStats.dht_nodes || 0}
              </span>
            </div>
          )}
          <button
            onClick={loadTorrents}
            className="px-3 py-1 text-xs bg-muted/30 hover:bg-muted/50 rounded transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-6 gap-4 mb-4">
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Total Size</div>
          <div className="text-sm font-semibold text-foreground">
            {qbService ? qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.size || 0), 0)) : '0 B'}
          </div>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Downloaded</div>
          <div className="text-sm font-semibold text-blue-400">
            {qbService ? qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.downloaded || 0), 0)) : '0 B'}
          </div>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Uploaded</div>
          <div className="text-sm font-semibold text-green-400">
            {qbService ? qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.uploaded || 0), 0)) : '0 B'}
          </div>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Overall Ratio</div>
          <div className="text-sm font-semibold text-foreground">
            {(() => {
              const totalDl = torrents.reduce((sum, t) => sum + (t.downloaded || 0), 0);
              const totalUl = torrents.reduce((sum, t) => sum + (t.uploaded || 0), 0);
              return totalDl > 0 ? (totalUl / totalDl).toFixed(2) : '∞';
            })()}
          </div>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Active</div>
          <div className="text-sm font-semibold text-foreground">
            {torrents.filter(t => t.state === 'downloading' || t.state === 'uploading').length}/{torrents.length}
          </div>
        </div>
        <div className="bg-muted/10 rounded-lg p-3 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Avg Progress</div>
          <div className="text-sm font-semibold text-foreground">
            {torrents.length > 0 
              ? ((torrents.reduce((sum, t) => sum + (t.progress || 0), 0) / torrents.length) * 100).toFixed(0)
              : '0'
            }%
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search torrents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-sm bg-muted/20 border border-border/50 rounded focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-1">
          {Object.entries(getFilterCounts()).map(([key, count]) => (
            <button
              key={key}
              onClick={() => setFilterState(key)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filterState === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
              }`}
            >
              {key === 'all' ? 'All' : key.charAt(0).toUpperCase() + key.slice(1)} {count}
            </button>
          ))}
        </div>
      </div>

      {/* Compact List */}
      <div className="space-y-1">
        {getFilteredTorrents().length > 0 ? (
          getFilteredTorrents().map((torrent) => (
            <div key={torrent.hash} className="rounded border-l-2 border-l-transparent hover:border-l-primary/50 transition-all">
              <div
                className="group flex items-center gap-3 p-2 hover:bg-muted/20 cursor-pointer"
                onClick={() => setExpandedTorrent(expandedTorrent === torrent.hash ? null : torrent.hash)}
              >
                {/* Expand icon */}
                <div className="flex-shrink-0">
                  {expandedTorrent === torrent.hash ? (
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  torrent.state === 'downloading' ? 'bg-blue-400' :
                  torrent.state === 'uploading' || torrent.state === 'completedUP' ? 'bg-green-400' :
                  torrent.state.includes('paused') ? 'bg-gray-400' :
                  torrent.state.includes('stalled') ? 'bg-yellow-400' :
                  'bg-gray-400'
                }`} />
                
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium truncate flex-1">{torrent.name}</h3>
                    <span className="text-xs text-muted-foreground">{(torrent.progress * 100).toFixed(0)}%</span>
                  </div>
                  
                  {/* Thin progress bar */}
                  <div className="w-full bg-muted/20 rounded-full h-1 mb-1">
                    <div
                      className="bg-primary/60 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${torrent.progress * 100}%` }}
                    />
                  </div>
                  
                  {/* Compact stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>↓ {qbService.formatSpeed(torrent.dlspeed)}</span>
                    <span>↑ {qbService.formatSpeed(torrent.upspeed)}</span>
                    <span>{qbService.formatBytes(torrent.size)}</span>
                    <span>{torrent.num_seeds || 0}s/{torrent.num_leechs || 0}l</span>
                  </div>
                </div>
                
                {/* Compact actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {torrent.state.includes('paused') ? (
                    <button
                      onClick={() => handleResume(torrent.hash)}
                      className="p-1 hover:bg-green-500/20 text-green-500 rounded"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePause(torrent.hash)}
                      className="p-1 hover:bg-orange-500/20 text-orange-500 rounded"
                    >
                      <Pause className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(torrent.hash)}
                    className="p-1 hover:bg-red-500/20 text-red-500 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* Expanded details with tabs */}
              {expandedTorrent === torrent.hash && (
                <div className="bg-muted/10 border-t border-border/30">
                  {/* Tab navigation */}
                  <div className="flex items-center gap-1 px-8 pt-3 border-b border-border/20">
                    {[
                      { id: 'info', label: 'Info', icon: Info },
                      { id: 'peers', label: 'Peers', icon: Users },
                      { id: 'files', label: 'Files', icon: File },
                      { id: 'trackers', label: 'Trackers', icon: Globe },
                      { id: 'stats', label: 'Stats', icon: ArrowUp }
                    ].map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-t transition-colors ${
                            activeTab === tab.id
                              ? 'bg-background border-t border-l border-r border-border text-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Tab content */}
                  <div className="px-8 py-3">
                    {activeTab === 'info' && (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Hash:</span>
                            <span className="font-mono text-foreground">{torrent.hash.substring(0, 16)}...</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Added:</span>
                            <span className="text-foreground">{new Date(torrent.added_on * 1000).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Save path:</span>
                            <span className="text-foreground truncate">{torrent.save_path || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowDown className="w-3 h-3 text-blue-400" />
                            <span className="text-muted-foreground">Downloaded:</span>
                            <span className="text-foreground">{qbService.formatBytes(torrent.downloaded)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getStateColor(torrent.state)}`}>
                              {formatState(torrent.state)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Priority:</span>
                            <span className="text-foreground">{torrent.priority || 'Normal'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Ratio:</span>
                            <span className="text-foreground">{(torrent.ratio || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowUp className="w-3 h-3 text-green-400" />
                            <span className="text-muted-foreground">Uploaded:</span>
                            <span className="text-foreground">{qbService.formatBytes(torrent.uploaded)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">ETA:</span>
                            <span className="text-foreground">{qbService.formatETA(torrent.eta)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'peers' && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground mb-3">
                          Connected to {torrent.num_seeds || 0} seeders and {torrent.num_leechs || 0} leechers
                        </div>
                        <div className="space-y-1">
                          {/* Mock peer data - in real implementation, you'd fetch peer details */}
                          {Array.from({ length: Math.min(5, (torrent.num_seeds || 0) + (torrent.num_leechs || 0)) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-xs border-b border-border/10">
                              <div className="flex items-center gap-3">
                                <span className="font-mono">192.168.{Math.floor(Math.random() * 255)}.{Math.floor(Math.random() * 255)}</span>
                                <span className="text-muted-foreground">:{30000 + Math.floor(Math.random() * 10000)}</span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>↓ {(Math.random() * 500).toFixed(0)} KB/s</span>
                                <span>↑ {(Math.random() * 200).toFixed(0)} KB/s</span>
                                <span className={`px-1 py-0.5 rounded text-xs ${i % 3 === 0 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {i % 3 === 0 ? 'Seed' : 'Peer'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {((torrent.num_seeds || 0) + (torrent.num_leechs || 0)) === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              No active peers
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'files' && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground mb-3">
                          Files in torrent
                        </div>
                        {/* Mock file data - in real implementation, you'd fetch file list */}
                        <div className="space-y-1">
                          {Array.from({ length: Math.min(8, Math.max(1, Math.floor(Math.random() * 10))) }, (_, i) => (
                            <div key={i} className="flex items-center justify-between py-1 text-xs">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <File className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">
                                  {i === 0 ? torrent.name : `${torrent.name.split('.')[0]}_part${i + 1}.${['mkv', 'mp4', 'avi', 'txt', 'nfo'][i % 5]}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{qbService.formatBytes(Math.floor(torrent.size / (i + 1)))}</span>
                                <span className="text-xs">{(Math.random() * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'trackers' && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground mb-3">
                          Tracker information
                        </div>
                        <div className="space-y-3">
                          {torrent.tracker ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Globe className="w-3 h-3 text-green-400" />
                                <span className="text-xs font-medium">Primary Tracker</span>
                                <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">Active</span>
                              </div>
                              <div className="pl-5 space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">URL:</span>
                                  <span className="text-foreground font-mono text-xs break-all">{torrent.tracker}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-muted-foreground">Seeds: <span className="text-foreground">{torrent.num_complete || 0}</span></span>
                                  <span className="text-muted-foreground">Peers: <span className="text-foreground">{torrent.num_incomplete || 0}</span></span>
                                  <span className="text-muted-foreground">Last update: <span className="text-foreground">2 min ago</span></span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-xs">
                              No tracker information available
                            </div>
                          )}
                          
                          {/* DHT info */}
                          <div className="pt-2 border-t border-border/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-3 h-3 text-purple-400" />
                              <span className="text-xs font-medium">DHT</span>
                              <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">Enabled</span>
                            </div>
                            <div className="pl-5 text-xs text-muted-foreground">
                              Distributed Hash Table for peer discovery
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'stats' && (
                      <div className="space-y-4">
                        <div className="text-xs text-muted-foreground mb-3">
                          Global statistics for all torrents
                        </div>
                        
                        {/* Aggregated Torrent Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-1">Transfer Totals</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <ArrowDown className="w-3 h-3 text-blue-400" />
                                  Total downloaded:
                                </span>
                                <span className="text-foreground">
                                  {qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.downloaded || 0), 0))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <ArrowUp className="w-3 h-3 text-green-400" />
                                  Total uploaded:
                                </span>
                                <span className="text-foreground">
                                  {qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.uploaded || 0), 0))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Overall ratio:</span>
                                <span className="text-foreground">
                                  {(() => {
                                    const totalDl = torrents.reduce((sum, t) => sum + (t.downloaded || 0), 0);
                                    const totalUl = torrents.reduce((sum, t) => sum + (t.uploaded || 0), 0);
                                    return totalDl > 0 ? (totalUl / totalDl).toFixed(2) : '∞';
                                  })()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total size:</span>
                                <span className="text-foreground">
                                  {qbService.formatBytes(torrents.reduce((sum, t) => sum + (t.size || 0), 0))}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-1">Current Activity</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <ArrowDown className="w-3 h-3 text-blue-400" />
                                  Total DL speed:
                                </span>
                                <span className="text-foreground">
                                  {qbService.formatSpeed(torrents.reduce((sum, t) => sum + (t.dlspeed || 0), 0))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <ArrowUp className="w-3 h-3 text-green-400" />
                                  Total UL speed:
                                </span>
                                <span className="text-foreground">
                                  {qbService.formatSpeed(torrents.reduce((sum, t) => sum + (t.upspeed || 0), 0))}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3 text-purple-400" />
                                  Total peers:
                                </span>
                                <span className="text-foreground">
                                  {torrents.reduce((sum, t) => sum + (t.num_seeds || 0) + (t.num_leechs || 0), 0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Active torrents:</span>
                                <span className="text-foreground">
                                  {torrents.filter(t => t.state === 'downloading' || t.state === 'uploading').length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Overview */}
                        <div className="pt-3 border-t border-border/20">
                          <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-1 mb-3">Progress Overview</h4>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Average progress:</span>
                                <span className="text-foreground">
                                  {torrents.length > 0 
                                    ? ((torrents.reduce((sum, t) => sum + (t.progress || 0), 0) / torrents.length) * 100).toFixed(1)
                                    : '0'
                                  }%
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed torrents:</span>
                                <span className="text-foreground">
                                  {torrents.filter(t => t.progress >= 1).length} of {torrents.length}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Remaining data:</span>
                                <span className="text-foreground">
                                  {qbService.formatBytes(
                                    torrents.reduce((sum, t) => sum + (t.size - t.downloaded || 0), 0)
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Avg. ratio:</span>
                                <span className="text-foreground">
                                  {torrents.length > 0 
                                    ? (torrents.reduce((sum, t) => sum + (t.ratio || 0), 0) / torrents.length).toFixed(2)
                                    : '0.00'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* State Distribution */}
                        <div className="pt-3 border-t border-border/20">
                          <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-1 mb-3">State Distribution</h4>
                          <div className="grid grid-cols-4 gap-3 text-xs text-center">
                            <div className="bg-blue-500/10 rounded p-2">
                              <div className="text-blue-400 font-medium">{torrents.filter(t => t.state === 'downloading').length}</div>
                              <div className="text-muted-foreground">Downloading</div>
                            </div>
                            <div className="bg-green-500/10 rounded p-2">
                              <div className="text-green-400 font-medium">{torrents.filter(t => t.state === 'uploading' || t.state === 'completedUP').length}</div>
                              <div className="text-muted-foreground">Seeding</div>
                            </div>
                            <div className="bg-gray-500/10 rounded p-2">
                              <div className="text-gray-400 font-medium">{torrents.filter(t => t.state.includes('paused')).length}</div>
                              <div className="text-muted-foreground">Paused</div>
                            </div>
                            <div className="bg-yellow-500/10 rounded p-2">
                              <div className="text-yellow-400 font-medium">{torrents.filter(t => t.state.includes('stalled')).length}</div>
                              <div className="text-muted-foreground">Stalled</div>
                            </div>
                          </div>
                        </div>
                        
                        {globalStats && (
                          <div className="pt-3 border-t border-border/20">
                            <h4 className="text-xs font-medium text-foreground border-b border-border/20 pb-1 mb-3">qBittorrent Session</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Session downloaded:</span>
                                  <span className="text-foreground">{qbService.formatBytes(globalStats.dl_info_data || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Session uploaded:</span>
                                  <span className="text-foreground">{qbService.formatBytes(globalStats.up_info_data || 0)}</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">DHT nodes:</span>
                                  <span className="text-foreground">{(globalStats.dht_nodes || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Connection:</span>
                                  <span className="text-green-400">Connected</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Download className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No torrents found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsSection;