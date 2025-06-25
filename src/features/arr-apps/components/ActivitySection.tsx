import React, { useEffect, useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Film,
  HardDrive,
  Info,
  Monitor,
  Pause,
  Play,
  Timer,
  Trash2,
  Wifi,
  Zap
} from 'lucide-react';
import { SonarrService } from '@/service/arr/sonarr.service';
import { RadarrService } from '@/service/arr/radarr.service';
import { ActivityItem } from '@/service/arr/base-arr.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

const ActivitySection: React.FC = () => {
  const { connections } = useArrApps();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeWithFiles, setRemoveWithFiles] = useState(false);
  const [addToBlocklist, setAddToBlocklist] = useState(false);
  const [skipRedownload, setSkipRedownload] = useState(false);

  useEffect(() => {
    loadActivityData();
    const interval = setInterval(loadActivityData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [connections]);

  const loadActivityData = async () => {
    try {
      const items: ActivityItem[] = [];

      // Load from Sonarr
      const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
      if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
        const sonarrService = new SonarrService({
          baseUrl: sonarrConnection.config.baseUrl,
          apiKey: sonarrConnection.config.apiKey,
        });
        const sonarrItems = await sonarrService.getActivity();
        items.push(...sonarrItems);
      }

      // Load from Radarr
      const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
      if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
        const radarrService = new RadarrService({
          baseUrl: radarrConnection.config.baseUrl,
          apiKey: radarrConnection.config.apiKey,
        });
        const radarrItems = await radarrService.getActivity();
        items.push(...radarrItems);
      }

      // Sort by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(items);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'downloading':
        return <Download className="w-4 h-4 text-chart-1" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeLeft = (timeString: string) => {
    if (!timeString || timeString === '00:00:00') return 'Unknown';
    return timeString;
  };

  const handleActivityClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setShowDialog(true);
  };

  const getProtocolIcon = (protocol: string) => {
    return protocol?.toLowerCase() === 'torrent' ? '🌱' : '📡';
  };

  const getQualityColor = (quality: string) => {
    const q = quality?.toLowerCase() || '';
    if (q.includes('2160p') || q.includes('4k')) return 'bg-chart-4/20 text-chart-4 border border-chart-4/30';
    if (q.includes('1080p')) return 'bg-chart-1/20 text-chart-1 border border-chart-1/30';
    if (q.includes('720p')) return 'bg-green-500/20 text-green-500 border border-green-500/30';
    if (q.includes('480p')) return 'bg-chart-2/20 text-chart-2 border border-chart-2/30';
    return 'bg-muted/50 text-muted-foreground border border-border';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'downloading': return 'bg-chart-1/20 text-chart-1 border border-chart-1/30';
      case 'completed': return 'bg-green-500/20 text-green-500 border border-green-500/30';
      case 'failed': return 'bg-destructive/20 text-destructive border border-destructive/30';
      case 'queued': return 'bg-chart-2/20 text-chart-2 border border-chart-2/30';
      case 'paused': return 'bg-muted/50 text-muted-foreground border border-border';
      default: return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const calculateProgress = (activity: ActivityItem) => {
    if (!activity.size || !activity.sizeleft) return 0;
    return ((activity.size - activity.sizeleft) / activity.size) * 100;
  };

  const handleRemoveClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    // Reset all options when opening dialog
    setRemoveWithFiles(false);
    setAddToBlocklist(false);
    setSkipRedownload(false);
    setShowRemoveDialog(true);
  };

  const handleRemoveConfirm = async () => {
    if (!selectedActivity) return;

    setRemoving(true);
    try {
      const isSeries = !!selectedActivity.series;
      const connection = isSeries 
        ? connections.find(c => c.type === 'sonarr' && c.enabled)
        : connections.find(c => c.type === 'radarr' && c.enabled);

      if (!connection?.config.baseUrl || !connection?.config.apiKey) {
        throw new Error('App not configured');
      }

      // Build query parameters
      const params = new URLSearchParams({
        removeFromClient: removeWithFiles.toString(),
        blocklist: addToBlocklist.toString(),
        skipRedownload: skipRedownload.toString()
      });

      // Remove from queue using the queue API
      const response = await fetch(`${connection.config.baseUrl}/api/v3/queue/${selectedActivity.id}?${params}`, {
        method: 'DELETE',
        headers: {
          'X-Api-Key': connection.config.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Remove failed: ${response.status}`);
      }

      const actions = [];
      if (removeWithFiles) actions.push('removed from download client');
      if (addToBlocklist) actions.push('added to blocklist');
      if (skipRedownload) actions.push('marked to skip redownload');
      
      const message = actions.length > 0 
        ? `Removed from queue and ${actions.join(', ')}`
        : 'Removed from queue only';
      
      alert(message);
      
      // Refresh activity data
      await loadActivityData();
      
      setShowRemoveDialog(false);
      setShowDialog(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Remove failed:', error);
      alert('Remove failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRemoving(false);
    }
  };

  const renderRemoveDialog = () => {
    if (!selectedActivity) return null;

    return (
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle>Remove from Queue</DialogTitle>
                <DialogDescription>Remove this download?</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">{selectedActivity.sourceTitle}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(selectedActivity.status || selectedActivity.eventType)}`}>
                  {selectedActivity.status || selectedActivity.eventType}
                </span>
                {selectedActivity.downloadClient && (
                  <span>via {selectedActivity.downloadClient}</span>
                )}
              </div>
              {selectedActivity.size && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Size: {formatBytes(selectedActivity.size)}
                  {selectedActivity.sizeleft !== undefined && selectedActivity.sizeleft > 0 && (
                    <span> • {formatBytes(selectedActivity.sizeleft)} remaining</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <h5 className="text-sm font-medium text-muted-foreground mb-3">Removal Options</h5>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeWithFiles}
                    onChange={(e) => setRemoveWithFiles(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-primary bg-input border-border rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Remove from download client
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      Delete the files from {selectedActivity.downloadClient || 'download client'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToBlocklist}
                    onChange={(e) => setAddToBlocklist(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-primary bg-input border-border rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Add to blocklist
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      Prevent this specific release from being downloaded again
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipRedownload}
                    onChange={(e) => setSkipRedownload(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-primary bg-input border-border rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm text-muted-foreground block">
                      Skip redownload
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      Don't automatically search for this {selectedActivity.series ? 'episode' : 'movie'} again
                    </span>
                  </div>
                </label>
              </div>
              
              {(removeWithFiles || addToBlocklist || skipRedownload) && (
                <div className="mt-4 p-3 bg-chart-2/20 border border-chart-2/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-300">
                      <p className="font-medium mb-1">Warning:</p>
                      <ul className="space-y-1">
                        {removeWithFiles && (
                          <li>• Downloaded files will be permanently deleted</li>
                        )}
                        {addToBlocklist && (
                          <li>• This release will be blocked from future downloads</li>
                        )}
                        {skipRedownload && (
                          <li>• Automatic searching for this content will be disabled</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setShowRemoveDialog(false)}
              className="px-3 py-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-md transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveConfirm}
              disabled={removing}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-md transition-colors font-medium text-sm"
            >
              {removing ? (
                <>
                  <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Remove
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDetailDialog = () => {
    if (!selectedActivity) return null;

    const progress = calculateProgress(selectedActivity);

    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedActivity.sourceTitle}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 text-sm rounded ${getStatusBadgeColor(selectedActivity.status || selectedActivity.eventType)}`}>
                {selectedActivity.status || selectedActivity.eventType}
              </span>
              {selectedActivity.quality?.quality && (
                <span className={`px-3 py-1 text-sm rounded ${getQualityColor(selectedActivity.quality.quality.name)}`}>
                  {selectedActivity.quality.quality.name}
                </span>
              )}
              {selectedActivity.protocol && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  {getProtocolIcon(selectedActivity.protocol)}
                  {selectedActivity.protocol.toUpperCase()}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Progress Bar */}
            {selectedActivity.size && selectedActivity.sizeleft !== undefined && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Download Progress</span>
                  <span className="text-sm text-muted-foreground">{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-input rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                  <span>{formatBytes((selectedActivity.size || 0) - (selectedActivity.sizeleft || 0))} / {formatBytes(selectedActivity.size || 0)}</span>
                  {selectedActivity.timeleft && (
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      {formatTimeLeft(selectedActivity.timeleft)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">General Information</h3>
                
                {selectedActivity.series && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Series:</span>
                    <span className="text-sm text-foreground">{selectedActivity.series.title}</span>
                  </div>
                )}

                {selectedActivity.movie && (
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Movie:</span>
                    <span className="text-sm text-foreground">{selectedActivity.movie.title}</span>
                  </div>
                )}

                {selectedActivity.seasonNumber && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Season:</span>
                    <span className="text-sm text-foreground">{selectedActivity.seasonNumber}</span>
                  </div>
                )}

                {selectedActivity.indexer && (
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Indexer:</span>
                    <span className="text-sm text-foreground">{selectedActivity.indexer}</span>
                  </div>
                )}

                {selectedActivity.downloadClient && (
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Download Client:</span>
                    <span className="text-sm text-foreground">{selectedActivity.downloadClient}</span>
                  </div>
                )}

                {selectedActivity.languages && selectedActivity.languages.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedActivity.languages.map((lang, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-input rounded">{lang.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Technical Details</h3>
                
                {selectedActivity.downloadId && (
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Download ID:</span>
                    <span className="text-sm text-foreground font-mono text-xs">{selectedActivity.downloadId}</span>
                  </div>
                )}

                {selectedActivity.trackedDownloadStatus && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Download Status:</span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      selectedActivity.trackedDownloadStatus === 'ok' ? 'bg-green-600' : 
                      selectedActivity.trackedDownloadStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {selectedActivity.trackedDownloadStatus}
                    </span>
                  </div>
                )}

                {selectedActivity.trackedDownloadState && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Download State:</span>
                    <span className="text-sm text-foreground">{selectedActivity.trackedDownloadState}</span>
                  </div>
                )}

                {selectedActivity.customFormatScore !== undefined && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Custom Format Score:</span>
                    <span className="text-sm text-foreground">{selectedActivity.customFormatScore}</span>
                  </div>
                )}

                {selectedActivity.added && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Added:</span>
                    <span className="text-sm text-foreground">{formatDate(selectedActivity.added)}</span>
                  </div>
                )}

                {selectedActivity.estimatedCompletionTime && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">ETA:</span>
                    <span className="text-sm text-foreground">{formatDate(selectedActivity.estimatedCompletionTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleRemoveClick(selectedActivity)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Queue
                </button>

                {selectedActivity.status === 'downloading' && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-md transition-colors font-medium text-sm"
                    title="Pause download (Feature coming soon)"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}

                {(selectedActivity.status === 'paused' || selectedActivity.status === 'queued') && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-md transition-colors font-medium text-sm"
                    title="Resume download (Feature coming soon)"
                  >
                    <Play className="w-4 h-4" />
                    Resume
                  </button>
                )}

                {selectedActivity.downloadId && (
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-md transition-colors font-medium text-sm"
                    title="View in download client"
                    onClick={() => {
                      if (selectedActivity.downloadId) {
                        navigator.clipboard.writeText(selectedActivity.downloadId);
                        alert('Download ID copied to clipboard');
                      }
                    }}
                  >
                    <Info className="w-4 h-4" />
                    Copy Download ID
                  </button>
                )}
              </div>
            </div>

            {/* Error Messages */}
            {selectedActivity.errorMessage && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-destructive mb-3">Error Message</h3>
                <div className="bg-destructive/20 border border-destructive/30 rounded-lg p-3">
                  <p className="text-destructive text-sm">{selectedActivity.errorMessage}</p>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {selectedActivity.statusMessages && selectedActivity.statusMessages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-3">Status Messages</h3>
                <div className="space-y-2">
                  {selectedActivity.statusMessages.map((msg, i) => (
                    <div key={i} className="bg-chart-2/20 border border-chart-2/30 rounded-lg p-3">
                      <p className="text-yellow-300 font-medium text-sm mb-1">{msg.title}</p>
                      {msg.messages.map((message, j) => (
                        <p key={j} className="text-yellow-200 text-sm">{message}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Output Path */}
            {selectedActivity.outputPath && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Output Path</h3>
                <div className="bg-input/50 rounded-lg p-3">
                  <code className="text-muted-foreground text-sm break-all">{selectedActivity.outputPath}</code>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading activity...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Activity</h2>
        <button
          onClick={loadActivityData}
          className="px-3 py-1 bg-input hover:bg-muted text-muted-foreground text-sm rounded transition-colors"
        >
          Refresh
        </button>
      </div>
      <p className="text-muted-foreground mb-6">
        Current queue and recent activity from your Arr applications.
      </p>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity) => {
            const progress = calculateProgress(activity);
            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="bg-card dark:bg-card/50 rounded-lg p-4 border border-border hover:bg-accent/30 transition-all cursor-pointer hover:border-muted-foreground/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getEventIcon(activity.eventType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground truncate">{activity.sourceTitle}</h3>
                        {activity.protocol && (
                          <span className="text-lg">{getProtocolIcon(activity.protocol)}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(activity.status || activity.eventType)}`}>
                          {activity.status || activity.eventType}
                        </span>
                        
                        {activity.quality?.quality && (
                          <span className={`px-2 py-1 text-xs rounded ${getQualityColor(activity.quality.quality.name)}`}>
                            {activity.quality.quality.name}
                          </span>
                        )}

                        {activity.trackedDownloadStatus && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            activity.trackedDownloadStatus === 'ok' ? 'bg-green-600' : 
                            activity.trackedDownloadStatus === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                          }`}>
                            {activity.trackedDownloadStatus}
                          </span>
                        )}

                        {activity.languages && activity.languages.length > 0 && (
                          <span className="px-2 py-1 text-xs bg-muted rounded">
                            {activity.languages[0]?.name}
                            {activity.languages.length > 1 && ` +${activity.languages.length - 1}`}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {activity.size && activity.sizeleft !== undefined && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {formatBytes((activity.size || 0) - (activity.sizeleft || 0))} / {formatBytes(activity.size || 0)}
                            </span>
                            <span className="text-xs text-muted-foreground">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {(activity.series || activity.movie) && (
                          <span>
                            {activity.series?.title || activity.movie?.title}
                          </span>
                        )}
                        
                        {activity.seasonNumber && (
                          <span>Season {activity.seasonNumber}</span>
                        )}

                        {activity.indexer && (
                          <span>{activity.indexer}</span>
                        )}

                        {activity.downloadClient && (
                          <span>{activity.downloadClient}</span>
                        )}

                        {activity.timeleft && activity.timeleft !== '00:00:00' && (
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatTimeLeft(activity.timeleft)}
                          </span>
                        )}
                      </div>

                      {/* Error Message Preview */}
                      {activity.errorMessage && (
                        <div className="mt-2 text-xs text-destructive truncate">
                          ⚠️ {activity.errorMessage}
                        </div>
                      )}

                      {/* Status Messages Preview */}
                      {activity.statusMessages && activity.statusMessages.length > 0 && (
                        <div className="mt-2 text-xs text-yellow-400 truncate">
                          💬 {activity.statusMessages[0]?.messages[0]}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(activity.date)}
                    </div>
                    <div className="text-xs text-muted-foreground/70">Click for details</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Activity</h3>
            <p>
              No recent activity found. Activity will appear here when downloads are in progress.
            </p>
          </div>
        )}
      </div>
      
      {/* Detail Dialog */}
      {renderDetailDialog()}
      
      {/* Remove Dialog */}
      {renderRemoveDialog()}
    </div>
  );
};

export default ActivitySection;