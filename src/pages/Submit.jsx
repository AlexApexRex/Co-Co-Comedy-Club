import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase';
import { submitContent } from '../lib/store';
import { extractYouTubeId, youtubeThumbnail } from '../lib/youtube';
import { SITE } from '../config';

export default function Submit({ typeOverride }) {
  const params = useParams(); const navigate = useNavigate();
  const { user } = useAuth(); const kind = typeOverride || params.kind;
  const [form, setForm] = useState({ title: '', body: '', url: '', authorName: '', tags: '' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const videoId = extractYouTubeId(form.url);
  if (kind !== 'video' && kind !== 'joke') return <main className="container page-shell"><div className="page-heading"><span className="eyebrow">YOUR TURN</span><h1>Put something good out there.</h1><p>Got a clip or a joke? Pick your format and make somebody's day.</p></div><div className="choose-grid"><Link className="choose-card" to="/submit/video"><span className="choose-icon">▶</span><span className="eyebrow">01 / WATCH</span><h2>Share a video ↗</h2><p>Found something funny or fascinating on YouTube? Send it our way.</p></Link><Link className="choose-card" to="/submit/joke"><span className="choose-icon">✳</span><span className="eyebrow">02 / LAUGH</span><h2>Post a joke ↗</h2><p>A one-liner, a story, or a terrible pun. There's room for all of it.</p></Link></div></main>;
  const isVideo = kind === 'video';
  function change(field, value) { setForm((f) => ({ ...f, [field]: value })); setError(''); setSuccess(''); }
  async function onSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const title = form.title.trim(); const body = form.body.trim();
    if (isVideo && !videoId) return setError('Please enter a valid YouTube video link.');
    if (isVideo && !title) return setError('Add a title for your video.');
    if (!isVideo && !body) return setError('Write your joke first.');
    if (!isVideo && body.length > SITE.maxJokeLength) return setError('Your joke is too long.');
    const tags = [...new Set(form.tags.split(',').map((t) => t.trim()).filter(Boolean))].slice(0, 5);
    setBusy(true); setError('');
    try {
      const payload = { kind, title, body, authorName: user?.displayName || form.authorName.trim() || SITE.defaultGuestName, tags, ...(isVideo ? { url: form.url.trim(), videoId } : {}) };
      const result = await submitContent(payload);
      if (result.pending) {
        setSuccess('Thanks! Your post is awaiting moderator approval. It will appear in the feed once approved.');
        setForm({ title: '', body: '', url: '', authorName: '', tags: '' });
      } else {
        setSuccess(result.demo ? 'Added to your local demo feed. This is a preview, not a live submission.' : 'Post published!');
        if (result.id) navigate(`/${isVideo ? 'videos' : 'jokes'}/${result.id}`);
      }
    } catch (err) { setError(err?.message || 'Submission failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <main className="container create-page"><Link className="back-link" to="/submit">← Choose another post type</Link><div className="create-grid">
    <section><span className="eyebrow">{isVideo ? 'SHARE A DISCOVERY' : 'THE JOKE BOOK'}</span><h1>{isVideo ? 'Show us what you found.' : 'Make somebody laugh.'}</h1><p className="muted create-intro">{isVideo ? 'Paste a YouTube link, add a little context, and pass it on.' : 'One-liners, observations, full-blown stories. Keep it fun and keep it yours.'}</p>
      <form onSubmit={onSubmit} className="create-form">
        {!user && <label className="input-label">Nickname <span>(optional; not verified)</span><input className="field" maxLength={50} placeholder="Anonymous" value={form.authorName} onChange={(e) => change('authorName', e.target.value)}/></label>}
        {isVideo && <label className="input-label">YouTube URL <span>required</span><input className="field" type="url" required placeholder="https://youtube.com/watch?v=..." value={form.url} maxLength={2048} onChange={(e) => change('url', e.target.value)}/>{form.url && !videoId && <small className="form-error">Use a valid YouTube video URL, including Shorts.</small>}</label>}
        <label className="input-label">{isVideo ? 'Video title' : 'Joke title'} <span>{isVideo ? 'required' : 'optional'}</span><input className="field" required={isVideo} maxLength={140} placeholder={isVideo ? 'Give this clip a name' : 'A little intro, if you like'} value={form.title} onChange={(e) => change('title', e.target.value)}/></label>
        <label className="input-label">{isVideo ? 'Add a note' : 'Your joke'} <span>{isVideo ? 'optional' : 'required'}</span><textarea className="field text-area" rows={isVideo ? 4 : 8} required={!isVideo} maxLength={isVideo ? 1000 : SITE.maxJokeLength} placeholder={isVideo ? 'What makes this worth watching?' : 'Okay, so here’s the funny part…'} value={form.body} onChange={(e) => change('body', e.target.value)}/><small className="field-help">{form.body.length}/{isVideo ? 1000 : SITE.maxJokeLength}</small></label>
        <label className="input-label">Tags <span>optional · up to 5</span><input className="field" maxLength={160} placeholder={isVideo ? 'Comedy, Throwback, Animals' : 'One-liners, Everyday, Stories'} value={form.tags} onChange={(e) => change('tags', e.target.value)}/><small className="field-help">Separate tags with commas</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <div role="status" className="notice success">{success}</div>}
        <button className="btn btn-primary btn-large" type="submit" disabled={busy || (isVideo && !videoId)}>{busy ? 'Posting…' : isVideo ? 'Share this video ↗' : 'Post your joke ↗'}</button>
        <p className="fine-print">{isFirebaseConfigured ? 'Submissions are reviewed before appearing publicly. No sign-in required.' : 'Preview mode: posts are saved locally in this browser only.'}</p>
      </form>
    </section>
    <aside className="create-aside">{isVideo && videoId ? <div className="preview-panel"><span className="eyebrow">LINK PREVIEW</span><img src={youtubeThumbnail(videoId)} alt="YouTube video preview" /><h3>{form.title || 'Your video preview'}</h3><p>Thumbnail loads automatically. The player opens when someone taps play.</p></div> : <div className="create-tip"><span className="tip-symbol">✳</span><span className="eyebrow">A QUICK REMINDER</span><h2>The best posts feel personal.</h2><p>{isVideo ? 'A little context turns a link into a great recommendation.' : 'Tell it how you’d tell a friend. New lines and punchlines are welcome.'}</p><div className="side-divider"/><small>Be kind. Be original. Have fun.</small></div>}</aside>
  </div></main>;
}
