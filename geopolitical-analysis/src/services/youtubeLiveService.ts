// YouTube Live Stream Service
//
// WHY THIS FILE WAS REWRITTEN
// -----------------------------------------------------------------------------
// 24/7 news channels rotate the video ID of their live broadcast (it changes every
// few hours/days). The previous implementation pinned one "fallback" video ID per
// channel and blindly reported `isLive: true`, so most channels ended up embedding
// a dead/foreign ID and YouTube answered "Video unavailable".
//
// The strategy used now:
//   1. Primary  -> embed the CHANNEL live stream:
//        https://www.youtube.com/embed/live_stream?channel=<CHANNEL_ID>
//      YouTube resolves the channel's CURRENT live broadcast at playback time, so
//      the player can never point at a stale broadcast.
//   2. Fallback -> retry once with the channel's known live video ID
//      (re-validated in the browser through YouTube's CORS-enabled oEmbed API).
//   3. Failure  -> the channel is marked unavailable (persisted locally, and
//      automatically re-tried after OFFLINE_TTL_MS) so the auto-rotation skips it
//      instead of parking the viewer on a dead player.

export type ChannelStatus = 'idle' | 'playing' | 'unavailable';
export type EmbedAttempt = 'channel' | 'video';

export interface LiveChannelData {
  id: string;
  name: string;
  country: string;
  description: string;
  logo: string;
  language: string;
  region: string;
  /** YouTube *channel* id (starts with UC...). The live stream is resolved from this. */
  channelId: string;
  /** YouTube @handle for reliable "Watch on YouTube" links (e.g. @SkyNews). */
  youtubeHandle?: string;
  /** Optional pinned video id, used only as a second attempt when the channel embed fails. */
  fallbackVideoId?: string;
  /** Whether a live broadcast is expected for this channel. */
  isLive: boolean;
  /** Runtime state driven by real player feedback (never simulated). */
  status: ChannelStatus;
  lastChecked: number;
  error?: string;
}

interface ChannelConfiguration {
  id: string;
  name: string;
  country: string;
  description: string;
  logo: string;
  language: string;
  region: string;
  channelId: string;
  /** YouTube @handle used for reliable "Watch on YouTube" links (e.g. @SkyNews). */
  youtubeHandle?: string;
  fallbackVideoId?: string;
}

const OFFLINE_STORAGE_KEY = 'geointel.youtube.offlineChannels';
/** Unavailable channels are re-tried after this delay, they may come back online. */
const OFFLINE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// Channel configurations – verified September 2026.
//
// All entries use CHANNEL ids (UC…). The embed URL is built as
//   /embed/live_stream?channel=<channelId>
// which makes YouTube resolve the channel's CURRENT live broadcast at playback
// time, so the player can never point at a stale broadcast.
//
// fallbackVideoId is intentionally omitted for most channels – live streams
// rotate their video id every few hours/days, so pinned ids go stale fast and
// cause false-hope retry loops.
//
// BBC News was removed – it does NOT have a free 24/7 YouTube live stream
// (geo-restricted / behind YouTube TV in most regions).
// ---------------------------------------------------------------------------
const NEWS_CHANNEL_CONFIGURATIONS: ChannelConfiguration[] = [
  {
    id: 'aljazeera',
    name: 'Al Jazeera English',
    country: 'Qatar',
    description: 'Breaking news and current affairs from the Middle East',
    logo: '🇶🇦',
    language: 'English',
    region: 'Middle East',
    channelId: 'UCNye-wNBqNL5ZzHSJj3l8Bg',
    youtubeHandle: 'aljazeeraenglish',
  },
  {
    id: 'france24',
    name: 'France 24 English',
    country: 'France',
    description: 'International news from France 24',
    logo: '🇫🇷',
    language: 'English',
    region: 'Europe',
    channelId: 'UCQ4Hj5DF7VTDOj-_FclBAeg',
    youtubeHandle: 'France24_en',
  },
  {
    id: 'skynews',
    name: 'Sky News',
    country: 'United Kingdom',
    description: 'Breaking news and current affairs from the UK',
    logo: '🇬🇧',
    language: 'English',
    region: 'Europe',
    channelId: 'UCoMdktPbSTixAyNGwb-UYkQ',
    youtubeHandle: 'SkyNews',
  },
  {
    id: 'dw',
    name: 'DW News',
    country: 'Germany',
    description: 'Deutsche Welle - International news from Germany',
    logo: '🇩🇪',
    language: 'English',
    region: 'Europe',
    channelId: 'UCknLrEdhRCp1aegoMqRaCZg',
    youtubeHandle: 'daboradio',
  },
  {
    id: 'trt',
    name: 'TRT World',
    country: 'Turkey',
    description: 'International news from Turkey',
    logo: '🇹🇷',
    language: 'English',
    region: 'Europe/Asia',
    channelId: 'UCGrNz-aDmcr2uuto8_DL2jg',
    youtubeHandle: 'trtworld',
  },
  {
    id: 'euronews',
    name: 'Euronews English',
    country: 'France',
    description: 'European and international news',
    logo: '🇪🇺',
    language: 'English',
    region: 'Europe',
    channelId: 'UC4AEUDQKjjAk5Z-jN5KcJag',
    youtubeHandle: 'euronews',
  },
  {
    id: 'wion',
    name: 'WION',
    country: 'India',
    description: 'World Is One News - Global perspective from India',
    logo: '🇮🇳',
    language: 'English',
    region: 'Asia',
    channelId: 'UC_gUM8rL-Lrg6O3adPW9K1g',
    youtubeHandle: 'WIONews',
  },
  {
    id: 'nhk',
    name: 'NHK World',
    country: 'Japan',
    description: 'Japanese public broadcaster - International news',
    logo: '🇯🇵',
    language: 'English',
    region: 'Asia',
    channelId: 'UCSPEjw8F2nQDtmUKPFNF7_A',
    youtubeHandle: 'NHKWORLDJAPAN',
  },
  {
    id: 'ndtv',
    name: 'NDTV 24x7',
    country: 'India',
    description: 'Leading Indian news channel - Live 24/7',
    logo: '🇮🇳',
    language: 'English',
    region: 'Asia',
    channelId: 'UCZ0-N38sJ5p9H6a7_28g-tA',
    youtubeHandle: 'NDTV',
  },
];

// ---------------------------------------------------------------------------
// Player URL helpers
// ---------------------------------------------------------------------------

const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed';

interface EmbedOptions {
  autoplay?: boolean;
  muted?: boolean;
  origin?: string;
}

/**
 * YouTube's oEmbed endpoint is CORS enabled, so the browser can ask YouTube
 * whether a specific video still exists / is embeddable without any API key.
 */
export async function isVideoEmbeddable(videoId: string): Promise<boolean> {
  if (!videoId || videoId.length < 6) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`,
    )}&format=json`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    // 200 => exists and embeddable, 401/403/404 => deleted, private or embed disabled
    if (!response.ok) return false;

    const data = await response.json();
    return Boolean(data && data.title);
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

function buildEmbedUrl(path: string, options: EmbedOptions): string {
  const params = new URLSearchParams({
    autoplay: options.autoplay === false ? '0' : '1',
    mute: options.muted ? '1' : '0',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    iv_load_policy: '3',
    // Required so the parent page can listen to onReady / onStateChange / onError
    enablejsapi: '1',
  });

  if (options.origin) {
    params.set('origin', options.origin);
  }

  // 'live_stream?channel=...' already carries a query string
  const separator = path.includes('?') ? '&' : '?';

  return `${YOUTUBE_EMBED_BASE}/${path}${separator}${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class YouTubeLiveService {
  private channels: Map<string, LiveChannelData> = new Map();
  private offlineSince: Map<string, number> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isUpdating = false;

  constructor() {
    this.loadOfflineMarks();
    this.initializeChannels();
  }

  private initializeChannels() {
    NEWS_CHANNEL_CONFIGURATIONS.forEach(config => {
      const unavailable = this.isMarkedUnavailable(config.id);

      this.channels.set(config.id, {
        ...config,
        isLive: !unavailable,
        status: unavailable ? 'unavailable' : 'idle',
        lastChecked: 0,
      });
    });
  }

  // --- persistence ---------------------------------------------------------

  private loadOfflineMarks() {
    try {
      const raw = window.localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (!raw) return;

      const parsed: Record<string, number> = JSON.parse(raw);
      Object.entries(parsed).forEach(([id, timestamp]) => {
        if (Date.now() - timestamp < OFFLINE_TTL_MS) {
          this.offlineSince.set(id, timestamp);
        }
      });
    } catch {
      // localStorage unavailable (private mode / SSR) - status stays in memory
    }
  }

  private persistOfflineMarks() {
    try {
      const payload: Record<string, number> = {};
      this.offlineSince.forEach((timestamp, id) => {
        payload[id] = timestamp;
      });
      window.localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }

  private isMarkedUnavailable(id: string): boolean {
    const since = this.offlineSince.get(id);
    if (!since) return false;
    if (Date.now() - since > OFFLINE_TTL_MS) {
      this.offlineSince.delete(id);
      this.persistOfflineMarks();
      return false;
    }
    return true;
  }

  // --- urls ----------------------------------------------------------------

  /**
   * Embed URL for a channel.
   *
   * attempt === 'channel' -> /embed/live_stream?channel=<channelId>
   *   YouTube resolves the channel's CURRENT live broadcast, so this never
   *   points at a broadcast that already ended.
   * attempt === 'video'   -> /embed/<fallbackVideoId> (pinned id, second try)
   */
  public getEmbedUrl(
    channel: LiveChannelData,
    attempt: EmbedAttempt = 'channel',
    options: EmbedOptions = {},
  ): string {
    if (attempt === 'video' && channel.fallbackVideoId) {
      return buildEmbedUrl(channel.fallbackVideoId, options);
    }

    if (channel.channelId) {
      return buildEmbedUrl(`live_stream?channel=${channel.channelId}`, options);
    }

    return channel.fallbackVideoId ? buildEmbedUrl(channel.fallbackVideoId, options) : 'about:blank';
  }

  /** Public "watch on YouTube" target, used when a channel cannot be embedded. */
  public getWatchUrl(channel: LiveChannelData): string {
    if (channel.youtubeHandle) {
      return `https://www.youtube.com/@${channel.youtubeHandle}/live`;
    }
    return `https://www.youtube.com/channel/${channel.channelId}/live`;
  }

  public getChannelUrl(channel: LiveChannelData): string {
    return `https://www.youtube.com/channel/${channel.channelId}`;
  }

  // --- live status (driven by real player feedback) -------------------------

  /** Called when the embedded player actually started playing. */
  public markPlaying(id: string): LiveChannelData | null {
    const channel = this.channels.get(id);
    if (!channel) return null;

    const updated: LiveChannelData = {
      ...channel,
      status: 'playing',
      isLive: true,
      lastChecked: Date.now(),
      error: undefined,
    };
    this.channels.set(id, updated);

    if (this.offlineSince.has(id)) {
      this.offlineSince.delete(id);
      this.persistOfflineMarks();
    }

    return updated;
  }

  /** Called when every embed attempt for this channel failed (offline / unavailable). */
  public markUnavailable(id: string, reason?: string): LiveChannelData | null {
    const channel = this.channels.get(id);
    if (!channel) return null;

    const updated: LiveChannelData = {
      ...channel,
      status: 'unavailable',
      isLive: false,
      lastChecked: Date.now(),
      error: reason ?? 'Stream unavailable',
    };
    this.channels.set(id, updated);

    this.offlineSince.set(id, Date.now());
    this.persistOfflineMarks();

    return updated;
  }

  /** Clears the unavailable mark so a channel gets another chance on the next attempt. */
  public clearUnavailable(id: string): LiveChannelData | null {
    const channel = this.channels.get(id);
    if (!channel) return null;

    this.offlineSince.delete(id);
    this.persistOfflineMarks();

    const updated: LiveChannelData = {
      ...channel,
      status: 'idle',
      isLive: true,
      lastChecked: Date.now(),
      error: undefined,
    };
    this.channels.set(id, updated);

    return updated;
  }

  public isUnavailable(id: string): boolean {
    const channel = this.channels.get(id);
    return channel ? channel.status === 'unavailable' : false;
  }

  /** Verifies the pinned fallback video id through the CORS-enabled oEmbed API. */
  public async isFallbackUsable(id: string): Promise<boolean> {
    const channel = this.channels.get(id);
    if (!channel?.fallbackVideoId) return false;
    return isVideoEmbeddable(channel.fallbackVideoId);
  }

  // --- accessors -----------------------------------------------------------

  public getChannels(): LiveChannelData[] {
    return Array.from(this.channels.values());
  }

  public getChannel(channelId: string): LiveChannelData | null {
    return this.channels.get(channelId) || null;
  }

  /** Channels worth tuning into, i.e. everything that is not marked unavailable. */
  public getPlayableChannels(): LiveChannelData[] {
    return this.getChannels().filter(channel => channel.status !== 'unavailable');
  }

  /**
   * Index of the next playable channel after `fromIndex`, so rotation never parks
   * the viewer on a channel that is known to be unavailable.
   */
  public getNextPlayableIndex(fromIndex: number): number {
    const channels = this.getChannels();
    if (channels.length === 0) return 0;

    for (let step = 1; step <= channels.length; step++) {
      const index = (fromIndex + step) % channels.length;
      if (channels[index].status !== 'unavailable') return index;
    }

    // every channel is marked unavailable - fall back to a straight rotation
    return (fromIndex + 1) % channels.length;
  }

  /**
   * Kept for API compatibility with the previous implementation.
   *
   * The old version "fetched" live video ids here, which is impossible without a
   * YouTube Data API key, so it silently wrote stale ids into every channel.
   * Live status is now reported by the embedded player itself (markPlaying /
   * markUnavailable), so this only refreshes the offline bookkeeping.
   */
  public async updateAllChannels(): Promise<void> {
    if (this.isUpdating) return;
    this.isUpdating = true;

    try {
      this.channels.forEach((channel, id) => {
        if (channel.status === 'unavailable' && !this.isMarkedUnavailable(id)) {
          this.channels.set(id, {
            ...channel,
            status: 'idle',
            isLive: true,
            lastChecked: Date.now(),
            error: undefined,
          });
        }
      });
    } finally {
      this.isUpdating = false;
    }
  }

  public startAutoUpdate(intervalMinutes: number = 30): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateAllChannels();

    this.updateInterval = setInterval(() => {
      // retries channels whose offline mark expired
      this.updateAllChannels();
    }, intervalMinutes * 60 * 1000);
  }

  public stopAutoUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  public getStats() {
    const channels = this.getChannels();
    return {
      total: channels.length,
      live: channels.filter(c => c.isLive).length,
      playing: channels.filter(c => c.status === 'playing').length,
      unavailable: channels.filter(c => c.status === 'unavailable').length,
      withVideo: channels.filter(c => c.fallbackVideoId).length,
      lastUpdate: Date.now(),
      errors: channels.filter(c => c.error).length,
    };
  }
}

// Export singleton instance
export const youtubeLiveService = new YouTubeLiveService();

