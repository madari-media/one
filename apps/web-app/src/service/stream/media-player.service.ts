export interface MediaPlayer {
  id: string;
  name: string;
  icon: string;
  command: string;
  platforms: ('windows' | 'macos' | 'linux' | 'android' | 'ios')[];
  os: 'android' | 'ios' | 'mac' | 'mac2' | 'mac3' | 'web';
}

export const AVAILABLE_PLAYERS: MediaPlayer[] = [
  {
    id: 'android/chooser',
    name: 'App Chooser',
    icon: '📱',
    command: 'chooser',
    platforms: ['android'],
    os: 'android',
  },
  {
    id: 'android/org.videolan.vlc',
    name: 'VLC',
    icon: '🎬',
    command: 'org.videolan.vlc',
    platforms: ['android'],
    os: 'android',
  },
  {
    id: 'android/com.mxtech.videoplayer.ad',
    name: 'MX Player',
    icon: '🎥',
    command: 'com.mxtech.videoplayer.ad',
    platforms: ['android'],
    os: 'android',
  },
  {
    id: 'ios/infuse',
    name: 'Infuse',
    icon: '🍎',
    command: 'infuse',
    platforms: ['ios'],
    os: 'ios',
  },
  {
    id: 'ios/vlc',
    name: 'VLC',
    icon: '🎬',
    command: 'vlc',
    platforms: ['ios'],
    os: 'ios',
  },
  {
    id: 'mac/infuse',
    name: 'Infuse',
    icon: '🍎',
    command: 'infuse',
    platforms: ['macos'],
    os: 'mac',
  },
  {
    id: 'mac2/iina',
    name: 'IINA',
    icon: '🎞️',
    command: 'iina',
    platforms: ['macos'],
    os: 'mac2',
  },
  {
    id: 'mac3/nplayer-mac',
    name: 'nPlayer',
    icon: '🎥',
    command: 'nplayer-mac',
    platforms: ['macos'],
    os: 'mac3',
  },
  {
    id: 'windows/vlc',
    name: 'VLC',
    icon: '🎬',
    command: 'vlc',
    platforms: ['windows'],
    os: 'web',
  },
  {
    id: 'windows/potplayer',
    name: 'PotPlayer',
    icon: '🎥',
    command: 'potplayer',
    platforms: ['windows'],
    os: 'web',
  },
  {
    id: 'linux/vlc',
    name: 'VLC',
    icon: '🎬',
    command: 'vlc',
    platforms: ['linux'],
    os: 'web',
  },
  {
    id: 'linux/mpv',
    name: 'MPV',
    icon: '🎥',
    command: 'mpv',
    platforms: ['linux'],
    os: 'web',
  },
];

export function getAvailablePlayers(): MediaPlayer[] {
  const platform = getPlatform();
  return AVAILABLE_PLAYERS.filter((player) =>
    player.platforms.includes(platform),
  );
}

export function getPlatform():
  | 'windows'
  | 'macos'
  | 'linux'
  | 'android'
  | 'ios' {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('win')) return 'windows';
  if (userAgent.includes('mac')) return 'macos';
  return 'linux';
}

export async function playInPlayer(
  player: MediaPlayer,
  url: string,
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    let intentUrl = '';

    // For direct links
    if (player.os === 'android') {
      intentUrl = `intent://${url.replace('https://', '')}#Intent;type=video/any;scheme=https${
        player.command !== 'chooser' ? ';package=' + player.command : ''
      };end`;
    } else if (player.os === 'ios') {
      intentUrl = `${player.command}://${url.replace('https://', '')}`;
    } else if (player.os === 'mac') {
      intentUrl = `${player.command}://${url.replace('https://', '')}`;
    } else if (player.os === 'mac2') {
      intentUrl = `${player.command}://weblink?url=${url}`;
    } else if (player.os === 'mac3') {
      intentUrl = `${player.command}://weblink?url=${url}&new_window=1`;
    } else if (player.os === 'web' && player.command === 'vlc') {
      intentUrl = `vlc://${url.replace('https://', '')}`;
    } else {
      intentUrl = url;
    }

    if (intentUrl) {
      if (player.os === 'web' && player.command !== 'vlc') {
        window.open(intentUrl, '_blank');
      } else {
        window.location.href = intentUrl;
      }
    }
  } catch (error) {
    console.error('Error playing in player:', error);
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}
