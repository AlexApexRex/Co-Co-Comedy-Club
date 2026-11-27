import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import ContentCard from '../components/ContentCard';
export default function Profile() {
  const { uid } = useParams(); const { user } = useAuth(); const { items } = useContent();
  const posts = items.filter((it) => it.authorUid === uid);
  const own = user?.uid === uid;
  return <main className="container page-shell"><div className="page-heading"><span className="eyebrow">PROFILE</span><h1>{own ? user.displayName || 'Your profile' : posts[0]?.authorName || 'Community member'}</h1><p>Public posts and shared discoveries.</p></div>
    {posts.length ? <div className="post-stack content-column">{posts.map((it) => <ContentCard key={it.id} item={it}/>)}</div> : <div className="empty-state"><h2>No public posts yet.</h2><p>Only approved posts appear here.</p>{own && <Link className="btn btn-primary" to="/submit">Make a post</Link>}</div>}
  </main>;
}
