import { describe, expect, it } from 'vitest';
import { extractYouTubeId, youtubeThumbnail, youtubeEmbed } from './youtube';
const id = 'dQw4w9WgXcQ';
describe('YouTube URLs', () => {
  it.each([
    `https://www.youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}&feature=share`,
    `https://youtu.be/${id}?t=42`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `https://youtube-nocookie.com/embed/${id}`
  ])('extracts video ID from %s', (url) => expect(extractYouTubeId(url)).toBe(id));
  it.each(['https://notyoutube.com/watch?v='+id,'javascript:alert(1)','https://youtube.com/watch?v=abc','not a link','https://youtube.com.evil.test/watch?v='+id])('rejects invalid/malicious %s', (url) => expect(extractYouTubeId(url)).toBeNull());
  it('creates a thumbnail and privacy-first player', () => {
    expect(youtubeThumbnail(id)).toContain(id);
    expect(youtubeEmbed(id, { muted:true, autoplay:true })).toContain('youtube-nocookie.com');
    expect(youtubeEmbed(id, { muted:true, autoplay:true })).toContain('mute=1');
  });
});
