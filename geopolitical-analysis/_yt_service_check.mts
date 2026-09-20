// Temporary verification script for the rewritten YouTube live service.
// Run with: node --experimental-strip-types _yt_service_check.mts
import { youtubeLiveService, isVideoEmbeddable } from './src/services/youtubeLiveService.ts';

const channel = youtubeLiveService.getChannel('dw');
console.log('channels loaded:', youtubeLiveService.getChannels().length);
console.log('dw channel:', channel?.name, channel?.channelId);
console.log('embed (channel attempt):');
console.log('  ', youtubeLiveService.getEmbedUrl(channel!, 'channel', { autoplay: true, muted: true, origin: 'http://localhost:5173' }));
console.log('embed (video attempt):');
console.log('  ', youtubeLiveService.getEmbedUrl(channel!, 'video', { autoplay: true, muted: true, origin: 'http://localhost:5173' }));
console.log('watch url:', youtubeLiveService.getWatchUrl(channel!));
console.log('next playable from 0:', youtubeLiveService.getNextPlayableIndex(0));

youtubeLiveService.markUnavailable('dw', 'test');
console.log('after markUnavailable -> dw isLive:', youtubeLiveService.getChannel('dw')?.isLive, 'status:', youtubeLiveService.getChannel('dw')?.status);
console.log('next playable from 0 (dw skipped):', youtubeLiveService.getNextPlayableIndex(0));
youtubeLiveService.markPlaying('dw');
console.log('after markPlaying -> dw status:', youtubeLiveService.getChannel('dw')?.status);
console.log('stats:', JSON.stringify(youtubeLiveService.getStats()));

// oEmbed round trip against a known live stream (needs network)
console.log('oembed al jazeera live:', await isVideoEmbeddable('gCNeDWCI0vo'));
console.log('oembed dead id:', await isVideoEmbeddable('pqabxBEaoG4'));
