import { Link } from 'react-router-dom';
import VideoPlayer from './VideoPlayer';
import SocialActions from './SocialActions';
import { contentPath, publicAuthor, timeLabel } from '../lib/content';
import { extractYouTubeId } from '../lib/youtube';
export default function ContentCard({ item, detail = false }) {
  const route = contentPath(item);
  return <article className={`content-card ${detail ? 'detail-card' : ''} ${item.kind === 'joke' ? 'joke-card' : 'clip-card'}`}>
    <div className="post-meta">
      <span className={`kind-pill ${item.kind === 'joke' ? 'joke-pill' : ''}`}>{item.kind === 'joke' ? '✳ JOKE' : '▶ VIDEO'}</span>
      <span>by {publicAuthor(item)}{item.authorUid ? '' : ' · guest'}</span><span className="meta-dot">·</span><time>{timeLabel(item.createdAt)}</time>
    </div>
    {item.title && (detail ? <h1 className="post-title">{item.title}</h1> : <h2 className="post-title"><Link to={route}>{item.title}</Link></h2>)}
    {item.kind === 'joke'
      ? <p className="joke-body">{item.body}</p>
      : <><VideoPlayer videoId={item.videoId || extractYouTubeId(item.url)} title={item.title || 'Video'} />
          {item.body && <p className="post-description">{item.body}</p>}</>}
    {item.tags?.length > 0 && <div className="tag-row">{item.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}</div>}
    {item.kind === 'joke' && !detail && <Link className="read-more" to={route}>Join the discussion <span aria-hidden="true">↗</span></Link>}
    <SocialActions item={item} detail={detail} />
  </article>;
}
