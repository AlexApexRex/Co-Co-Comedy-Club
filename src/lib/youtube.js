const ID = /^[a-zA-Z0-9_-]{11}$/;
export function extractYouTubeId(raw) {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    let id = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'watch') id = url.searchParams.get('v');
      else if (['shorts', 'embed', 'live', 'v', 'e'].includes(parts[0])) id = parts[1];
    }
    return ID.test(id || '') ? id : null;
  } catch { return null; }
}
export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}
export function youtubeThumbnail(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
export function youtubeEmbed(id, { autoplay = false, muted = false } = {}) {
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (autoplay) params.set('autoplay', '1');
  if (muted) params.set('mute', '1');
  if (muted) params.set('controls', '0');
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
