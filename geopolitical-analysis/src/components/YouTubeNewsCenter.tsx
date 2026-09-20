import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Flag from './Flag';
import resolveIso2 from '@/lib/resolveIso';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, Wifi, WifiOff, RefreshCw, AlertCircle, ExternalLink, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import type { ConflictIntensity, IntelEvent } from '@/types';
import { youtubeLiveService, type LiveChannelData, type EmbedAttempt } from '@/services/youtubeLiveService';
import { attachYouTubePlayer, type AttachedYouTubePlayer } from '@/lib/youtubePlayer';

/** If the embedded player has not reported PLAYING within this window the channel is considered offline. */
const STREAM_START_TIMEOUT_MS = 20000;

interface YouTubeNewsCenterProps {
  conflictData: ConflictIntensity[];
  intelEvents: IntelEvent[];
  selectedEventId?: string;
  onEventClick: (event: IntelEvent) => void;
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------
// The channel list now lives in the live service (src/services/youtubeLiveService.ts).
// This component used to duplicate it with hardcoded video ids that went stale, which
// is exactly why several channels ended up showing "Video unavailable".

export function YouTubeNewsCenter({ conflictData, intelEvents, selectedEventId, onEventClick }: YouTubeNewsCenterProps) {
  const [currentChannelIndex, setCurrentChannelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // muted autoplay is what browsers allow
  const [autoRotate, setAutoRotate] = useState(true);
  const [showChannelList, setShowChannelList] = useState(false);
  const [lastRotation, setLastRotation] = useState(Date.now());
  const [channels, setChannels] = useState<LiveChannelData[]>(() => youtubeLiveService.getChannels());
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  // 'channel' -> /embed/live_stream?channel=<id> (YouTube resolves the CURRENT
  // broadcast), 'video' -> the pinned video id, used as a second chance.
  const [embedAttempt, setEmbedAttempt] = useState<EmbedAttempt>('channel');
  const [playbackIssue, setPlaybackIssue] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const playerRef = useRef<AttachedYouTubePlayer | null>(null);
  const mutedRef = useRef<boolean>(isMuted);
  const tuneInAtRef = useRef<number>(Date.now());
  const failureHandledRef = useRef<boolean>(false);

  const currentChannel = channels[currentChannelIndex];

  const isoMap: Record<string, string> = {
    dw: 'de',
    aljazeera: 'qa',
    france24: 'fr',
    skynews: 'gb',
    trt: 'tr',
    euronews: 'eu',
    wion: 'in',
    nhk: 'jp',
    ndtv: 'in',
    i24news: 'il',
    cgtn: 'cn',
    rt: 'ru',
    abc: 'us',
    nbc: 'us',
    lbc: 'gb',
    sky_aus: 'au',
    cbc: 'ca',
    '2m_morocco': 'ma',
    alaoula: 'ma',
    medi1tv: 'ma',
    espn_fc: 'us',
    olympic: 'un',
    fifa: 'un',
  };

  // Start the live service. It no longer fabricates live video ids: channels are
  // tracked here so a channel that failed to play can be skipped / retried later.
  useEffect(() => {
    let statusInterval: NodeJS.Timeout | null = null;

    const initializeService = async () => {
      try {
        console.log('YouTubeNewsCenter: Starting live service...');

        // 30 min -> retries channels whose "unavailable" mark has expired
        youtubeLiveService.startAutoUpdate(30);

        await refreshChannels();

        // Keeps the channel list in sync with status changes coming from the player
        statusInterval = setInterval(() => {
          void refreshChannels();
        }, 60000);
      } catch (error) {
        console.error('YouTubeNewsCenter: Failed to initialize service:', error);
        setUpdateError('Failed to initialize live service');
        setIsLoading(false);
      }
    };

    initializeService();

    return () => {
      youtubeLiveService.stopAutoUpdate();
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [refreshChannels]);

  // Refresh channels from live service
  const refreshChannels = useCallback(async () => {
    try {
      setUpdateError(null);
      await youtubeLiveService.updateAllChannels();
      const updatedChannels = youtubeLiveService.getChannels();
      setChannels(updatedChannels);
      setLastUpdate(new Date());
      setIsLoading(false);

      const stats = youtubeLiveService.getStats();
      console.log(`YouTubeNewsCenter: Channels updated. ${stats.live}/${stats.total} live`);
    } catch (error) {
      console.error('YouTubeNewsCenter: Failed to refresh channels:', error);
      setUpdateError('Failed to refresh channels');
      setIsLoading(false);
    }
  }, []);

  // Auto-rotate channels every 2 minutes, skipping channels known to be unavailable
  useEffect(() => {
    if (!autoRotate || channels.length === 0) return;

    const interval = setInterval(() => {
      setCurrentChannelIndex(prev => youtubeLiveService.getNextPlayableIndex(prev));
      setLastRotation(Date.now());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRotate, channels]);

  // Every channel change (or manual re-tune) starts a fresh attempt
  useEffect(() => {
    setEmbedAttempt('channel');
    setPlaybackIssue(null);
    setIsPlaying(true);
    setIsLoading(true);
    failureHandledRef.current = false;
    tuneInAtRef.current = Date.now();
  }, [currentChannelIndex, reloadToken]);

  const handleChannelChange = (index: number) => {
    setCurrentChannelIndex(index);
    setShowChannelList(false);
    setLastRotation(Date.now());
  };

  const togglePlayPause = () => {
    const player = playerRef.current;

    if (isPlaying) {
      player?.pause();
      setIsPlaying(false);
    } else {
      player?.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    const nextMuted = !isMuted;

    if (player) {
      if (nextMuted) {
        player.mute();
      } else {
        player.unMute();
      }
    }

    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
  };

  const resetRotation = () => {
    setAutoRotate(!autoRotate);
  };

  const goToNextChannel = useCallback(() => {
    setCurrentChannelIndex(prev => youtubeLiveService.getNextPlayableIndex(prev));
    setShowChannelList(false);
    setLastRotation(Date.now());
  }, []);

  /** Manual second chance for the channel currently on screen. */
  const retuneCurrentChannel = () => {
    if (currentChannel) {
      youtubeLiveService.clearUnavailable(currentChannel.id);
      setChannels(youtubeLiveService.getChannels());
    }
    setReloadToken(token => token + 1);
  };

  const refreshLiveStatus = async () => {
    setIsLoading(true);
    // Give every channel - including the ones that failed earlier - a fresh chance
    channels.forEach(channel => youtubeLiveService.clearUnavailable(channel.id));
    await refreshChannels();
    setReloadToken(token => token + 1);
    toast.success('Retuning Frequencies', {
      description: 'Global news signals refreshed.',
      duration: 2000
    });
  };

  // ---------------------------------------------------------------------------
  // Player wiring
  //
  // The iframe is created with enablejsapi=1 so the embedded player reports real
  // events (playing / buffering / error) and accepts play, pause and mute commands.
  // That feedback is what allows us to detect a channel that does not work instead
  // of silently showing a dead player.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const iframe = iframeRef.current;
    const channel = currentChannel;
    if (!iframe || !channel) return;

    let disposed = false;
    let eventsSeen = false;
    let failureHandled = false;
    failureHandledRef.current = false;

    const failPlayback = async (reason: string) => {
      if (disposed || failureHandled) return;

      // No event ever reached us -> the postMessage channel is unusable, so the
      // channel cannot be judged. Keep it and let YouTube's own controls work.
      if (!eventsSeen) {
        setIsLoading(false);
        return;
      }

      // Second chance with the pinned video id (validated through oEmbed first)
      if (embedAttempt === 'channel' && channel.fallbackVideoId) {
        const usable = await youtubeLiveService.isFallbackUsable(channel.id);
        if (disposed || failureHandled) return;
        if (usable) {
          console.warn(`YouTubeNewsCenter: ${channel.name} channel embed failed, retrying pinned video`);
          setEmbedAttempt('video');
          return;
        }
      }

      failureHandled = true;
      failureHandledRef.current = true;

      youtubeLiveService.markUnavailable(channel.id, reason);
      setChannels(youtubeLiveService.getChannels());
      setPlaybackIssue(`${channel.name} is not streaming right now`);
      setIsLoading(false);

      if (youtubeLiveService.getPlayableChannels().length > 0) {
        toast.error(`${channel.name} unavailable`, {
          description: 'Moving to the next live channel...',
          duration: 3000,
        });
        window.setTimeout(() => {
          if (!disposed) goToNextChannel();
        }, 4000);
      } else {
        toast.error('No live channel responded', {
          description: 'Use "Watch on YouTube" to open the channel directly.',
          duration: 6000,
        });
      }
    };

    const player = attachYouTubePlayer(iframe, {
      onReady: () => {
        eventsSeen = true;
        if (mutedRef.current) {
          playerRef.current?.mute();
        } else {
          playerRef.current?.unMute();
        }
      },
      onPlaying: () => {
        eventsSeen = true;
        failureHandled = true;
        failureHandledRef.current = true;
        setPlaybackIssue(null);
        setIsPlaying(true);
        setIsLoading(false);
        youtubeLiveService.markPlaying(channel.id);
        setChannels(youtubeLiveService.getChannels());
        setLastUpdate(new Date());
      },
      onPaused: () => {
        eventsSeen = true;
        setIsPlaying(false);
      },
      onBuffering: () => {
        eventsSeen = true;
        setIsLoading(true);
      },
      onError: code => {
        eventsSeen = true;
        void failPlayback(`Player error ${code}`);
      },
    });

    playerRef.current = player;

    // Nothing playing after 6s: reveal the player anyway, its own UI still works.
    const revealTimer = window.setTimeout(() => {
      if (!disposed) setIsLoading(false);
    }, 6000);

    // Still nothing after 20s: treat the channel as offline.
    const livenessTimer = window.setTimeout(() => {
      if (!disposed) void failPlayback('Stream did not start');
    }, STREAM_START_TIMEOUT_MS);

    return () => {
      disposed = true;
      window.clearTimeout(revealTimer);
      window.clearTimeout(livenessTimer);
      player.destroy();

      if (playerRef.current === player) {
        playerRef.current = null;
      }
    };
  }, [currentChannel?.id, embedAttempt, reloadToken, goToNextChannel]);

  // Keep the mute preference reachable from inside the player callbacks
  useEffect(() => {
    mutedRef.current = isMuted;
  }, [isMuted]);

  // Embed URL: channel live stream first, pinned video id as the retry.
  // Starts muted because muted autoplay is the only kind browsers always allow.
  const embedUrl = useMemo(() => {
    if (!currentChannel) return 'about:blank';

    return youtubeLiveService.getEmbedUrl(currentChannel, embedAttempt, {
      autoplay: true,
      muted: true,
      origin: typeof window === 'undefined' ? undefined : window.location.origin,
    });
  }, [currentChannel, embedAttempt]);

  // Show loading state
  if (isLoading && !currentChannel) {
    return (
      <div className="w-full h-full glass-panel flex items-center justify-center animate-pulse-subtle">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <RefreshCw className="w-12 h-12 text-accent-primary animate-spin" />
            <div className="absolute inset-0 bg-accent-primary/20 blur-xl rounded-full" />
          </div>
          <p className="text-lg font-bold text-white tracking-widest uppercase opacity-70">
            Scanning Global Frequencies
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (updateError && !currentChannel) {
    return (
      <div className="w-full h-full bg-bg-base flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{updateError}</p>
          <button
            onClick={refreshLiveStatus}
            className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentChannel) {
    return (
      <div className="w-full h-full bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">No channels available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-bg-base relative overflow-hidden">
      {/* YouTube Player */}
      <div className="w-full h-full relative">
        <iframe
          key={`${currentChannel.id}-${embedAttempt}-${reloadToken}`}
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={`${currentChannel.name} Live Stream`}
        />

        {/* Loading overlay */}
        {isLoading && !playbackIssue && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-500 pointer-events-none">
            <div className="text-center scale-75">
              <RefreshCw className="w-10 h-10 text-accent-primary animate-spin mx-auto mb-4" />
              <p className="text-xs font-bold text-accent-primary uppercase tracking-[0.2em]">Synchronizing</p>
            </div>
          </div>
        )}

        {/* Playback issue overlay - shown when the channel has no live stream
            (or refuses embedding) after both embed attempts were tried. */}
        {playbackIssue && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="text-center max-w-sm px-6">
              <AlertCircle className="w-9 h-9 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-black text-white uppercase tracking-wider mb-1">
                {currentChannel.name}
              </p>
              <p className="text-xs text-white/70 leading-relaxed mb-4">{playbackIssue}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={retuneCurrentChannel}
                  className="px-3 py-2 bg-accent-primary text-white text-xs font-bold rounded-lg hover:bg-accent-primary/80 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={goToNextChannel}
                  className="px-3 py-2 bg-white/10 border border-white/15 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                >
                  Next channel
                </button>
                <a
                  href={youtubeLiveService.getWatchUrl(currentChannel)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-white/10 border border-white/15 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors inline-flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Video Overlay Controls */}
        <div className="absolute bottom-12 left-6 right-6 glass-panel rounded-xl p-3 shadow-2xl animate-floating z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="flex items-center justify-center w-9 h-9 bg-accent-primary rounded-full hover:scale-110 active:scale-95 glow-on-hover shadow-lg transition-all duration-300"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-white" />
                ) : (
                  <Play className="w-4 h-4 text-white ml-0.5" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="flex items-center justify-center w-9 h-9 bg-bg-surface/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-accent-primary/20 hover:scale-110 active:scale-95 transition-all duration-300"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-accent-primary" />
                ) : (
                  <Volume2 className="w-4 h-4 text-accent-primary" />
                )}
              </button>

              <div className="h-6 w-px bg-white/10 mx-1" />

              <button
                onClick={goToNextChannel}
                className="flex items-center justify-center w-9 h-9 bg-bg-surface/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-accent-primary/20 hover:scale-110 active:scale-95 transition-all duration-300"
                title="Next channel"
              >
                <SkipForward className="w-4 h-4 text-accent-primary" />
              </button>

              <button
                onClick={() => setShowChannelList(!showChannelList)}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-surface/40 backdrop-blur-md border border-white/0 hover:border-white/10 rounded-lg hover:bg-accent-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white group-hover:text-accent-primary">
                    {currentChannel.name}
                  </span>
                </div>
              </button>

              <button
                onClick={refreshLiveStatus}
                className={`flex items-center justify-center w-9 h-9 bg-bg-surface/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-accent-primary/20 hover:scale-110 active:scale-95 transition-all duration-300 ${isLoading ? 'bg-accent-primary/20' : ''}`}
                title="Refresh Live Status"
              >
                <RefreshCw className={`w-4 h-4 text-accent-primary ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={resetRotation}
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${autoRotate
                  ? 'bg-accent-primary shadow-lg shadow-accent-primary/40'
                  : 'bg-bg-surface/40 backdrop-blur-md border border-white/10 hover:bg-accent-primary/20'
                  }`}
                title={autoRotate ? 'Stop Auto-Rotate' : 'Start Auto-Rotate'}
              >
                <RotateCcw className={`w-4 h-4 ${autoRotate ? 'text-white' : 'text-accent-primary'}`} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg transition-all duration-500 ${currentChannel.isLive
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-heartbeat'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}>
                {currentChannel.isLive ? (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    OFFLINE
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Channel List Overlay */}
        {showChannelList && (
          <div className="absolute top-24 left-6 bg-bg-surface/80 backdrop-blur-xl border border-white/10 rounded-xl p-3 w-64 max-h-[50vh] overflow-y-auto shadow-2xl z-30 animate-slide-up custom-scrollbar">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                News Grid
              </h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-accent-primary font-bold">
                  {channels.filter(c => c.isLive).length}/{channels.length} LIVE
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {channels.map((channel, index) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelChange(index)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group ${index === currentChannelIndex
                    ? 'bg-accent-primary/20 border border-accent-primary/40 shadow-inner'
                    : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                    }`}
                >
                  <div className="relative">
                    <div className="w-10 h-7 rounded overflow-hidden flex items-center justify-center bg-black/40 border border-white/10">
                      {(() => {
                        const resolved = resolveIso2(isoMap[channel.id], channel.country);
                        return <Flag iso2={resolved} className="w-full h-full object-cover" />;
                      })()}
                    </div>
                    {channel.isLive && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-surface animate-pulse" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${index === currentChannelIndex
                      ? 'text-accent-primary'
                      : channel.status === 'unavailable'
                        ? 'text-white/35 line-through'
                        : 'text-white/80 group-hover:text-white'}`}>
                      {channel.name}
                    </div>
                    <div className="text-[10px] text-white/40 group-hover:text-white/60">
                      {channel.status === 'unavailable' ? 'no live stream' : channel.country}
                    </div>
                  </div>

                  {index === currentChannelIndex && (
                    <div className="w-1.5 h-1.5 bg-accent-primary rounded-full shadow-[0_0_8px_rgba(0,206,209,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Auto-rotation indicator */}
        {autoRotate && (
          <div className="absolute top-4 right-4 bg-accent-primary/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-xs font-medium text-white">
                Auto-rotating channels
              </span>
            </div>
          </div>
        )}

        {/* Current channel info */}
        <div className="absolute top-10 left-6 glass-panel rounded-xl p-3 max-w-xs shadow-2xl z-20 animate-floating border-l-4 border-l-accent-primary">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-7 h-4 rounded overflow-hidden shadow-sm border border-white/10">
              {(() => {
                const resolved = resolveIso2(isoMap[currentChannel.id], currentChannel.country);
                return <Flag value={currentChannel.logo} iso2={resolved} className="w-full h-full object-cover" />;
              })()}
            </div>
            <h2 className="text-base font-black text-white tracking-tight">
              {currentChannel.name}
            </h2>
          </div>
          <p className="text-[10px] text-white/60 leading-relaxed mb-2.5 font-medium">
            {currentChannel.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-accent-primary/20 rounded-md text-[10px] font-bold text-accent-primary uppercase tracking-wider border border-accent-primary/20">
              {currentChannel.region}
            </span>
            <span className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] font-bold text-white/40 uppercase tracking-wider border border-white/5">
              {currentChannel.language}
            </span>
          </div>
        </div>

        {/* Live Events Counter */}
        <div className="absolute bottom-32 right-6 glass-panel rounded-xl p-3 shadow-2xl z-20 animate-floating border-r-4 border-r-red-500/50">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Global Signals</span>
            </div>
            <div className="text-xl font-black text-white leading-none">
              {intelEvents.length.toString().padStart(2, '0')}
            </div>
            {lastUpdate && (
              <div className="text-[9px] font-bold text-accent-primary/60 mt-1.5 border-t border-white/5 pt-1.5">
                SYNCED: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden events overlay for click interaction */}
      <div className="absolute inset-0 pointer-events-none">
        {intelEvents.map((event) => (
          <div
            key={event.id}
            className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 ${event.id === selectedEventId ? 'scale-110 z-10' : 'hover:scale-105'
              }`}
            style={{
              left: `${20 + (event.location.lng + 180) * (60 / 360)}%`,
              top: `${90 - (event.location.lat + 90) * (180 / 180)}%`,
            }}
            onClick={() => onEventClick(event)}
          >
            <div
              className={`w-3 h-3 rounded-full border-2 ${event.id === selectedEventId
                ? 'bg-accent-primary border-white shadow-lg shadow-accent-primary/50'
                : 'bg-red-500 border-white hover:bg-red-400'
                } animate-pulse`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
