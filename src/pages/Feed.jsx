import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { sortItems } from '../lib/content';
import ContentCard from '../components/ContentCard';

export default function Feed({ kind, savedIds = null }) {
  const { items, loading, error } = useContent();
  const [sort, setSort] = useState('new');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('all');
  const [shown, setShown] = useState(12);
  const base = useMemo(() => items.filter((i) => (!kind || i.kind === kind) && (!savedIds || savedIds.includes(i.id))), [items, kind, savedIds]);
  const tags = useMemo(() => [...new Set(base.flatMap((i) => i.tags || []))].sort(), [base]);
  const filtered = useMemo(() => sortItems(base.filter((i) => {
    const query = `${i.title || ''} ${i.body || ''} ${i.authorName || ''} ${(i.tags || []).join(' ')}`.toLowerCase();
    return query.includes(search.trim().toLowerCase()) && (tag === 'all' || (i.tags || []).includes(tag));
  }), sort), [base, search, tag, sort]);
  const title = savedIds ? 'Your saved stuff' : kind === 'joke' ? 'A little laugh goes a long way.' : 'Press play on something good.';
  const subtitle = savedIds ? 'Bookmarked on this device. Your little collection of favorites.' : kind === 'joke' ? 'Good jokes. Bad puns. Great conversations. All welcome here.' : 'The best videos are the ones you send to someone else.';
  return <main className="container page-shell">
    <div className="page-heading">
      <span className="eyebrow">{savedIds ? 'YOUR COLLECTION' : kind === 'joke' ? 'THE JOKE BOOK' : 'THE VIDEO FEED'}</span>
      <h1>{title}</h1><p>{subtitle}</p>
      {!savedIds && <div className="page-actions"><Link to={`/submit/${kind}`} className="btn btn-primary">＋ {kind === 'joke' ? 'Post a joke' : 'Share a video'}</Link></div>}
    </div>
    <div className="feed-layout">
      <section aria-label="Posts">
        <div className="filter-toolbar">
          <label className="search-field"><span aria-hidden="true">⌕</span><input aria-label="Search posts" placeholder="Search the good stuff..." value={search} onChange={(e) => { setSearch(e.target.value); setShown(12); }}/></label>
          <label className="sort-field">Sort by <select aria-label="Sort posts" value={sort} onChange={(e) => setSort(e.target.value)}><option value="new">Newest</option><option value="trending">Trending</option><option value="top">Highest rated</option><option value="discussed">Most discussed</option></select></label>
        </div>
        {tags.length > 0 && <div className="category-bar" aria-label="Filter by tag"><button className={tag === 'all' ? 'chosen' : ''} onClick={() => setTag('all')}>All posts</button>{tags.map((t) => <button className={tag === t ? 'chosen' : ''} key={t} onClick={() => setTag(t)}>#{t}</button>)}</div>}
        {error && <p className="notice error" role="alert">{error}</p>}
        {loading ? <><div className="skeleton-card"/><div className="skeleton-card"/></> :
          filtered.length ? <div className="post-stack">{filtered.slice(0, shown).map((item) => <ContentCard key={item.id} item={item}/>)}{filtered.length > shown && <button className="btn btn-outline w-full" onClick={() => setShown((n) => n + 12)}>Load more</button>}</div>
          : <div className="empty-state"><span className="empty-symbol">✳</span><h2>Nothing here yet.</h2><p>{search || tag !== 'all' ? 'Try a different search or category.' : savedIds ? 'Save a post to find it here later.' : 'Be the first to start the conversation.'}</p>{!savedIds && <Link className="btn btn-primary" to={`/submit/${kind}`}>Create a post ↗</Link>}</div>}
      </section>
      <aside className="feed-aside"><div className="side-panel"><span className="eyebrow">THE VIBE</span><h2>Good stuff deserves good company.</h2><p>Save what you love, share what makes you laugh, and say something nice in the comments.</p><div className="side-divider"/><p className="side-fact"><span>01</span> Share without signing in</p><p className="side-fact"><span>02</span> Join the discussion</p><p className="side-fact"><span>03</span> Sign in only to vote</p></div><div className="side-note">A little corner of the internet, made for good conversations. ✳</div></aside>
    </div>
  </main>;
}
