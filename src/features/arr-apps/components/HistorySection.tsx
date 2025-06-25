import React, { useEffect, useState } from 'react';
import { useArrApps } from '@/context/ArrAppsContext';
import { Activity, Calendar, CheckCircle, Clock, Download, Film, Info, Monitor, XCircle } from 'lucide-react';
import { SonarrService } from '@/service/arr/sonarr.service';
import { RadarrService } from '@/service/arr/radarr.service';
import { HistoryItem } from '@/service/arr/base-arr.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const HistorySection: React.FC = () => {
  const { connections } = useArrApps();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    loadHistoryData();
  }, [connections]);

  const loadHistoryData = async () => {
    setLoading(true);
    
    try {
      const items: HistoryItem[] = [];

      // Load from Sonarr
      const sonarrConnection = connections.find(c => c.type === 'sonarr' && c.enabled);
      if (sonarrConnection?.config.baseUrl && sonarrConnection?.config.apiKey) {
        const sonarrService = new SonarrService({
          baseUrl: sonarrConnection.config.baseUrl,
          apiKey: sonarrConnection.config.apiKey,
        });
        const sonarrItems = await sonarrService.getHistory();
        items.push(...sonarrItems);
      }

      // Load from Radarr
      const radarrConnection = connections.find(c => c.type === 'radarr' && c.enabled);
      if (radarrConnection?.config.baseUrl && radarrConnection?.config.apiKey) {
        const radarrService = new RadarrService({
          baseUrl: radarrConnection.config.baseUrl,
          apiKey: radarrConnection.config.apiKey,
        });
        const radarrItems = await radarrService.getHistory();
        items.push(...radarrItems);
      }

      // Sort by date (newest first)
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'grabbed':
      case 'downloadfolderimported':
        return <Download className="w-4 h-4 text-blue-500" />;
      case 'downloadfailed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'episodefilerenamed':
      case 'moviefilerenamed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'grabbed':
        return 'bg-chart-1/20 text-chart-1 border border-chart-1/30';
      case 'downloadfolderimported':
      case 'episodefilerenamed':
      case 'moviefilerenamed':
        return 'bg-green-500/20 text-green-500 border border-green-500/30';
      case 'downloadfailed':
        return 'bg-destructive/20 text-destructive border border-destructive/30';
      default:
        return 'bg-muted/50 text-muted-foreground border border-border';
    }
  };

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case 'grabbed':
        return 'Grabbed';
      case 'downloadfolderimported':
        return 'Imported';
      case 'downloadfailed':
        return 'Failed';
      case 'episodefilerenamed':
        return 'Renamed';
      case 'moviefilerenamed':
        return 'Renamed';
      default:
        return eventType;
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

  const handleItemClick = (item: HistoryItem) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  const getQualityColor = (quality: string) => {
    const q = quality?.toLowerCase() || '';
    if (q.includes('2160p') || q.includes('4k')) return 'bg-chart-4/20 text-chart-4 border border-chart-4/30';
    if (q.includes('1080p')) return 'bg-chart-1/20 text-chart-1 border border-chart-1/30';
    if (q.includes('720p')) return 'bg-green-500/20 text-green-500 border border-green-500/30';
    if (q.includes('480p')) return 'bg-chart-2/20 text-chart-2 border border-chart-2/30';
    return 'bg-muted/50 text-muted-foreground border border-border';
  };

  const renderDetailDialog = () => {
    if (!selectedItem) return null;

    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedItem.sourceTitle}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 text-sm rounded ${getEventColor(selectedItem.eventType)}`}>
                {formatEventType(selectedItem.eventType)}
              </span>
              {selectedItem.quality?.quality && (
                <span className={`px-3 py-1 text-sm rounded ${getQualityColor(selectedItem.quality.quality.name)}`}>
                  {selectedItem.quality.quality.name}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">General Information</h3>
                
                {selectedItem.series && (
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Series:</span>
                    <span className="text-sm text-foreground">{selectedItem.series.title}</span>
                  </div>
                )}

                {selectedItem.movie && (
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Movie:</span>
                    <span className="text-sm text-foreground">{selectedItem.movie.title}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm text-foreground">{new Date(selectedItem.date).toLocaleString()}</span>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">Technical Details</h3>
                
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Event Type:</span>
                  <span className="text-sm text-foreground">{formatEventType(selectedItem.eventType)}</span>
                </div>

                {selectedItem.quality && (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Quality:</span>
                    <span className="text-sm text-foreground">{selectedItem.quality.quality.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading history...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">History</h2>
        <button
          onClick={loadHistoryData}
          className="px-3 py-1 bg-input hover:bg-muted text-muted-foreground text-sm rounded transition-colors"
        >
          Refresh
        </button>
      </div>
      <p className="text-muted-foreground mb-6">
        Download and import history from your Arr applications.
      </p>

      <div className="space-y-3">
        {history.length > 0 ? (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-card dark:bg-card/50 rounded-lg p-4 border border-border hover:bg-accent/30 transition-all cursor-pointer hover:border-muted-foreground/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getEventIcon(item.eventType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-foreground truncate">{item.sourceTitle}</h3>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs rounded ${getEventColor(item.eventType)}`}>
                        {formatEventType(item.eventType)}
                      </span>
                      
                      {item.quality?.quality && (
                        <span className={`px-2 py-1 text-xs rounded ${getQualityColor(item.quality.quality.name)}`}>
                          {item.quality.quality.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {(item.series || item.movie) && (
                        <span>
                          {item.series?.title || item.movie?.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.date)}
                  </div>
                  <div className="text-xs text-muted-foreground/70">Click for details</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No History</h3>
            <p>
              No download history found. History will appear here after downloads complete.
            </p>
          </div>
        )}
      </div>
      
      {/* Detail Dialog */}
      {renderDetailDialog()}
    </div>
  );
};

export default HistorySection;