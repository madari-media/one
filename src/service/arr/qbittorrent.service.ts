export interface QBittorrentConfig {
  baseUrl: string;
  username?: string;
  password?: string;
}

export interface TorrentInfo {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  priority: number;
  num_seeds: number;
  num_leechs: number;
  ratio: number;
  eta: number;
  state: string;
  category: string;
  tags: string;
  save_path: string;
  completed: number;
  max_ratio: number;
  max_seeding_time: number;
  ratio_limit: number;
  seeding_time_limit: number;
  seen_complete: number;
  last_activity: number;
  time_active: number;
  completion_on: number;
  added_on: number;
  amount_left: number;
  auto_tmm: boolean;
  availability: number;
  content_path: string;
  dl_limit: number;
  downloaded: number;
  downloaded_session: number;
  f_l_piece_prio: boolean;
  force_start: boolean;
  magnet_uri: string;
  num_complete: number;
  num_incomplete: number;
  seq_dl: boolean;
  super_seeding: boolean;
  total_size: number;
  tracker: string;
  up_limit: number;
  uploaded: number;
  uploaded_session: number;
}

export interface GlobalStats {
  dl_info_speed: number;
  dl_info_data: number;
  up_info_speed: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  dht_nodes: number;
  connection_status: string;
}

export class QBittorrentService {
  private config: QBittorrentConfig;
  private cookieJar: string = '';

  constructor(config: QBittorrentConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      'Referer': this.config.baseUrl,
      'Cookie': this.cookieJar,
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      // Update cookies if provided
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        this.cookieJar = setCookie;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle both JSON and text responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return (await response.text()) as unknown as T;
      }
    } catch (error) {
      console.error(`qBittorrent API request failed: ${url}`, error);
      throw error;
    }
  }

  async login(): Promise<boolean> {
    try {
      if (!this.config.username || !this.config.password) {
        // If no credentials provided, try without authentication
        return true;
      }

      const formData = new URLSearchParams();
      formData.append('username', this.config.username);
      formData.append('password', this.config.password);

      const response = await this.makeRequest<string>('/api/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': this.config.baseUrl,
        },
        body: formData,
      });

      return response === 'Ok.';
    } catch (error) {
      console.error('Failed to login to qBittorrent:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/api/v2/auth/logout', {
        method: 'POST',
      });
      this.cookieJar = '';
    } catch (error) {
      console.error('Failed to logout from qBittorrent:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // First try to login if credentials are provided
      if (this.config.username && this.config.password) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          return false;
        }
      }

      // Test API access by getting app version
      const version = await this.makeRequest<string>('/api/v2/app/version');
      return typeof version === 'string' && version.length > 0;
    } catch (error) {
      console.error('qBittorrent connection test failed:', error);
      return false;
    }
  }

  async getTorrents(): Promise<TorrentInfo[]> {
    try {
      // Ensure we're logged in
      if (this.config.username && this.config.password && !this.cookieJar) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      const torrents = await this.makeRequest<TorrentInfo[]>('/api/v2/torrents/info');
      return torrents || [];
    } catch (error) {
      console.error('Failed to fetch torrents:', error);
      return [];
    }
  }

  async getGlobalStats(): Promise<GlobalStats | null> {
    try {
      if (this.config.username && this.config.password && !this.cookieJar) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      const stats = await this.makeRequest<GlobalStats>('/api/v2/transfer/info');
      return stats;
    } catch (error) {
      console.error('Failed to fetch global stats:', error);
      return null;
    }
  }

  async pauseTorrent(hash: string): Promise<boolean> {
    try {
      if (this.config.username && this.config.password && !this.cookieJar) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      const formData = new URLSearchParams();
      formData.append('hashes', hash);

      await this.makeRequest('/api/v2/torrents/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      return true;
    } catch (error) {
      console.error('Failed to pause torrent:', error);
      return false;
    }
  }

  async resumeTorrent(hash: string): Promise<boolean> {
    try {
      if (this.config.username && this.config.password && !this.cookieJar) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      const formData = new URLSearchParams();
      formData.append('hashes', hash);

      await this.makeRequest('/api/v2/torrents/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      return true;
    } catch (error) {
      console.error('Failed to resume torrent:', error);
      return false;
    }
  }

  async deleteTorrent(hash: string, deleteFiles: boolean = false): Promise<boolean> {
    try {
      if (this.config.username && this.config.password && !this.cookieJar) {
        const loginSuccess = await this.login();
        if (!loginSuccess) {
          throw new Error('Login failed');
        }
      }

      const formData = new URLSearchParams();
      formData.append('hashes', hash);
      formData.append('deleteFiles', deleteFiles.toString());

      await this.makeRequest('/api/v2/torrents/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete torrent:', error);
      return false;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatSpeed(bytesPerSecond: number): string {
    return this.formatBytes(bytesPerSecond) + '/s';
  }

  formatETA(seconds: number): string {
    if (seconds === -1 || seconds === 8640000) return '∞';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  }
}