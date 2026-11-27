import { Link, useParams } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import ContentCard from '../components/ContentCard';
import Comments from '../components/Comments';
export default function Detail({ kind }) {
  const { id } = useParams(); const { items, loading, error } = useContent();
  const item = items.find((i) => i.id === id && i.kind === kind);
  return <main className="container detail-page"><Link className="back-link" to={kind === 'joke' ? '/jokes' : '/videos'}>← Back to {kind === 'joke' ? 'jokes' : 'videos'}</Link>
    {loading ? <div className="skeleton-card"/> : error ? <p className="notice error">{error}</p> : !item ? <div className="empty-state"><h1>Couldn't find that post.</h1><p>It may be awaiting approval, removed, or the link may be incorrect.</p><Link className="btn btn-primary" to="/">Go home</Link></div> : <><ContentCard item={item} detail/><Comments item={item}/></>}
  </main>;
}
