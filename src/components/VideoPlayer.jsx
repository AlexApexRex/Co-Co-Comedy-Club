import { useEffect, useRef, useState } from 'react';
import { youtubeEmbed, youtubeThumbnail, youtubeWatchUrl } from '../lib/youtube';
export default function VideoPlayer({ videoId, title, eager = false }) {
  const [mode, setMode] = useState(eager ? 'playing' : 'thumb');
  const timer = useRef(null);
  const onHover = () => {
    if (mode !== 'thumb' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
    timer.current = window.setTimeout(() => setMode((m) => m === 'thumb' ? 'preview' : m), 850);
  };
  const onLeave = () => {
    window.clearTimeout(timer.current);
    setMode((m) => m === 'preview' ? 'thumb' : m);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!videoId) return <div className="video-frame invalid">Video unavailable</div>;
  return <div className="video-frame" onMouseEnter={onHover} onMouseLeave={onLeave}>
    {mode === 'thumb' ? <>
      <img className="video-thumb" loading="lazy" src={youtubeThumbnail(videoId)} alt={`Preview thumbnail for ${title}`} />
      <button className="play-button" aria-label={`Play ${title}`} onClick={() => setMode('playing')}><span aria-hidden="true">▶</span></button>
      <span className="video-caption">YOUTUBE VIDEO</span>
    </> : <iframe title={`${title}${mode === 'preview' ? ' muted preview' : ''}`} className="video-iframe" src={youtubeEmbed(videoId, { autoplay: true, muted: mode === 'preview' })} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>}
    {mode === 'preview' && <button className="preview-action preview-cover" onClick={() => setMode('playing')} aria-label={`Play ${title} with sound`}>Play with sound ↗</button>}
    {mode === 'playing' && <a className="youtube-fallback" target="_blank" rel="noopener noreferrer" href={youtubeWatchUrl(videoId)}>Watch on YouTube ↗</a>}
  </div>;
}
