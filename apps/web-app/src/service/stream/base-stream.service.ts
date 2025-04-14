import { MetaExtended } from '@/service/type.ts';

export interface BaseStreamService {
  loadStream(meta: Partial<MetaExtended>): Stream[];
}

export interface Stream {
  title: string;
  description: string;
  source:
    | LinkSource
    | IFrameSource
    | ExternalUrl
    | HLSSource
    | DASHSource
    | M3U8Source;
}

export interface LinkSource {
  type: 'link';
  url: string;
}

export interface IFrameSource {
  type: 'iframe';
  url: string;
}

export interface ExternalUrl {
  type: 'externalUrl';
  url: string;
}

export interface HLSSource {
  type: 'hls';
  url: string;
}

export interface DASHSource {
  type: 'dash';
  url: string;
}

export interface M3U8Source {
  type: 'm3u8';
  url: string;
}
