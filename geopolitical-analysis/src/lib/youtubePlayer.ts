// YouTube embed player helper
//
// The channel live embed (/embed/live_stream?channel=...) cannot be driven through
// the usual `videoId` based IFrame API, because YouTube resolves the video id itself.
// What we *can* do is talk to the iframe over the YouTube postMessage protocol, the
// same protocol the official IFrame API uses internally:
//
//   https://developers.google.com/youtube/iframe_api_reference
//
// Adding `enablejsapi=1` to the embed URL makes the player accept commands from, and
// broadcast events to, the parent window. That gives us:
//   * real play / pause / mute control (no iframe reloads),
//   * onStateChange -> know when the stream is actually PLAYING,
//   * onError       -> know when a channel is offline / not embeddable.

export interface YouTubePlayerHandlers {
  onReady?: () => void;
  onPlaying?: () => void;
  onPaused?: () => void;
  onBuffering?: () => void;
  onCued?: () => void;
  onEnded?: () => void;
  /** YouTube error codes: 2 (bad id), 5 (html5), 100 (removed), 101/150 (embed disabled) */
  onError?: (code: number | string) => void;
}

export interface AttachedYouTubePlayer {
  play: () => void;
  pause: () => void;
  mute: () => void;
  unMute: () => void;
  /** True when the official IFrame API object is driving the player. */
  usingApi: () => boolean;
  destroy: () => void;
}

const IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';
const IFRAME_API_TIMEOUT_MS = 8000;

type YTPlayerInstance = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (element: HTMLElement | string, options: Record<string, unknown>) => YTPlayerInstance;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace | null> | null = null;

/** Injects https://www.youtube.com/iframe_api exactly once per page. */
export function loadYouTubeIframeApi(): Promise<YTNamespace | null> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YTNamespace | null>(resolve => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    let settled = false;
    const finish = (value: YTNamespace | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timeoutId = setTimeout(
      () => finish(window.YT?.Player ? window.YT : null),
      IFRAME_API_TIMEOUT_MS,
    );

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        previousReady?.();
      } catch {
        // never let a foreign hook break the handshake
      }
      clearTimeout(timeoutId);
      finish(window.YT?.Player ? window.YT : null);
    };

    if (!document.getElementById('youtube-iframe-api')) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api';
      script.src = IFRAME_API_SRC;
      script.async = true;
      script.onerror = () => {
        clearTimeout(timeoutId);
        finish(null);
      };
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

function postCommand(iframe: HTMLIFrameElement, func: string, args: unknown[] = []) {
  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
}

function sendListeningHandshake(iframe: HTMLIFrameElement, playerId: string) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'listening', id: playerId, channel: 'widget' }),
    '*',
  );
}

function parsePlayerMessage(data: unknown): { event: string; info?: unknown } | null {
  if (typeof data !== 'string' || data[0] !== '{') return null;

  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.event === 'string') return parsed;
  } catch {
    return null;
  }

  return null;
}

// YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
function handleStateChange(state: number, handlers: YouTubePlayerHandlers) {
  switch (state) {
    case 1:
      handlers.onPlaying?.();
      break;
    case 2:
      handlers.onPaused?.();
      break;
    case 3:
      handlers.onBuffering?.();
      break;
    case 5:
      handlers.onCued?.();
      break;
    case 0:
      handlers.onEnded?.();
      break;
    default:
      break;
  }
}

/**
 * Attaches event handling + remote control to an already rendered YouTube iframe.
 * Safe to call again for a remounted iframe; always pair it with `destroy()`.
 */
export function attachYouTubePlayer(
  iframe: HTMLIFrameElement,
  handlers: YouTubePlayerHandlers,
): AttachedYouTubePlayer {
  const playerId = iframe.id || `yt-player-${Math.random().toString(36).slice(2)}`;
  iframe.id = playerId;

  let apiPlayer: YTPlayerInstance | null = null;
  let destroyed = false;

  const dispatch = (event: string, info?: unknown) => {
    if (destroyed) return;

    switch (event) {
      case 'onReady':
        handlers.onReady?.();
        break;
      case 'onStateChange':
        handleStateChange(Number(info), handlers);
        break;
      case 'onError':
        handlers.onError?.(typeof info === 'number' || typeof info === 'string' ? info : 'unknown');
        break;
      default:
        break;
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (destroyed) return;

    // Only accept messages coming from the embedded player itself.
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    const parsed = parsePlayerMessage(event.data);
    if (!parsed) return;

    dispatch(parsed.event, parsed.info);
  };

  const onIframeLoad = () => {
    // Re-announce ourselves whenever the iframe document (re)loads.
    sendListeningHandshake(iframe, playerId);
  };

  window.addEventListener('message', onMessage);
  iframe.addEventListener('load', onIframeLoad);
  // The iframe may already be loaded by the time we attach.
  onIframeLoad();

  // Prefer the official API when it is reachable; the raw protocol keeps working
  // for events either way.
  loadYouTubeIframeApi().then(YT => {
    if (destroyed || !YT?.Player) return;

    try {
      apiPlayer = new YT.Player(iframe, {
        events: {
          onReady: () => dispatch('onReady'),
          onStateChange: (event: { data: number }) => handleStateChange(Number(event.data), handlers),
          onError: (event: { data: number | string }) => dispatch('onError', event.data),
        },
      });
    } catch {
      apiPlayer = null;
    }
  });

  return {
    play: () => (apiPlayer ? apiPlayer.playVideo() : postCommand(iframe, 'playVideo')),
    pause: () => (apiPlayer ? apiPlayer.pauseVideo() : postCommand(iframe, 'pauseVideo')),
    mute: () => (apiPlayer ? apiPlayer.mute() : postCommand(iframe, 'mute')),
    unMute: () => (apiPlayer ? apiPlayer.unMute() : postCommand(iframe, 'unMute')),
    usingApi: () => Boolean(apiPlayer),
    destroy: () => {
      destroyed = true;
      window.removeEventListener('message', onMessage);
      iframe.removeEventListener('load', onIframeLoad);

      try {
        apiPlayer?.destroy();
      } catch {
        // ignore
      }
      apiPlayer = null;
    },
  };
}
