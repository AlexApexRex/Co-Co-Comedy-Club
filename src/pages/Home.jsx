import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { sortItems } from '../lib/content';
import ContentCard from '../components/ContentCard';
import { SITE } from '../config';
export default function Home() {
  const { items, loading, error } = useContent();
  const videos = sortItems(items.filter((i) => i.kind === 'video'), 'trending');
  const jokes = sortItems(items.filter((i) => i.kind === 'joke'), 'trending');
  return <>
    <section className="hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow"><span className="live-dot"/> THE GOOD STUFF, ALL IN ONE PLACE</span>
          <h1>Better shared.<br/><em>Even funnier.</em></h1>
          <p>{SITE.description}</p>
          <div className="hero-actions"><Link to="/videos" className="btn btn-primary">Explore the feed <span>↗</span></Link><Link to="/submit" className="btn btn-soft">Share something <span>＋</span></Link></div>
          <p className="hero-footnote">No account needed to post, comment, or explore.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit orbit-1"/><div className="art-orbit orbit-2"/>
          <div className="art-ticket ticket-top"><span>FRIENDSHIP FEED / 001</span><strong>good<br/>company<span className="orange-dot">.</span></strong><small>Made for the group chat.</small></div>
          <div className="art-symbol">✳</div>
          <div className="art-ticket ticket-bottom"><span>BEST ENJOYED TOGETHER</span><div className="art-faces"><i>☺</i><i>✦</i><i>☻</i><i>✳</i></div><small>Keep the good stuff going ↗</small></div>
        </div>
      </div>
    </section>
    <main className="container home-content">
      <div className="section-heading"><div><span className="eyebrow">YOUR DAILY DOSE</span><h2>What's good lately<span className="accent-period">.</span></h2><p>Fresh finds, good laughs, and the conversations that follow.</p></div><Link to="/videos" className="section-link">See all videos ↗</Link></div>
      {error && <p className="notice error" role="alert">{error}</p>}
      {loading ? <div className="grid-two"><div className="skeleton-card"/><div className="skeleton-card"/></div> :
        videos.length ? <div className="grid-two">{videos.slice(0,2).map((item) => <ContentCard key={item.id} item={item}/>)}</div>
        : <div className="empty-state"><h3>No videos just yet</h3><p>Be the first to get the feed going.</p><Link to="/submit/video" className="btn btn-primary">Share a video</Link></div>}
      <div className="home-jokes-heading section-heading"><div><span className="eyebrow">FOR A QUICK LAUGH</span><h2>From the joke book<span className="accent-period">.</span></h2><p>One-liners, observations, and whatever made someone laugh.</p></div><Link to="/jokes" className="section-link">All jokes ↗</Link></div>
      {loading ? <div className="grid-two"><div className="skeleton-card"/><div className="skeleton-card"/></div> :
        jokes.length ? <div className="grid-two">{jokes.slice(0,2).map((item) => <ContentCard key={item.id} item={item}/>)}</div>
        : <div className="empty-state"><h3>Zero jokes? Unacceptable.</h3><Link to="/submit/joke" className="btn btn-primary">Post the first joke</Link></div>}
      <div className="invitation-strip"><div><span className="eyebrow">THIS SPACE IS YOURS</span><h2>Got something worth sharing?</h2><p>A favorite video, a ridiculous thought, a perfectly timed pun. We're listening.</p></div><Link className="btn btn-light" to="/submit">Make a post ↗</Link></div>
    </main>
  </>;
}
