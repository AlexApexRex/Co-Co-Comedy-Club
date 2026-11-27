import { useEffect, useState } from 'react';
import { subscribeComments, submitComment } from '../lib/store';
import { publicAuthor, timeLabel } from '../lib/content';
import { useAuth } from '../context/AuthContext';
import { SITE } from '../config';
export default function Comments({ item }) {
  const targetKey = `${item.kind}:${item.id}`; const { user } = useAuth();
  const [comments, setComments] = useState([]); const [loaded, setLoaded] = useState(false); const [err, setErr] = useState('');
  const [name, setName] = useState(''); const [body, setBody] = useState(''); const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(''); const [shown, setShown] = useState(10); const [status, setStatus] = useState('');
  useEffect(() => {
    setLoaded(false);
    return subscribeComments(targetKey, (data) => {
      setComments([...data].sort((a, b) => new Date(a.createdAt?.toDate?.() || a.createdAt || 0) - new Date(b.createdAt?.toDate?.() || b.createdAt || 0)));
      setLoaded(true);
    }, (e) => { setErr(e.message); setLoaded(true); });
  }, [targetKey]);
  const submit = async (event) => {
    event.preventDefault(); if (busy || !body.trim()) return;
    setBusy(true); setErr(''); setStatus('');
    try {
      const result = await submitComment({ targetKey, body: body.trim(), authorName: user?.displayName || name.trim() || SITE.defaultGuestName, replyTo: replyTo || null });
      setBody(''); setReplyTo('');
      setStatus(result.pending ? 'Comment sent for moderator review. It will appear when approved.' : result.demo ? 'Demo comment added locally on this device.' : 'Comment posted!');
    } catch (error) { setErr(error.message || 'Could not post comment.'); }
    finally { setBusy(false); }
  };
  return <section className="comments-panel" aria-labelledby="comments-title">
    <div className="comments-heading"><div><span className="eyebrow">THE CONVERSATION</span><h2 id="comments-title">Join the discussion</h2></div><span className="comment-count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span></div>
    <form className="comment-form" onSubmit={submit}>
      {replyTo && <div className="reply-note">Replying to a comment <button type="button" onClick={() => setReplyTo('')}>Cancel ×</button></div>}
      {!user && <label className="input-label">Nickname <span>(optional; not verified)</span><input className="field" maxLength={50} placeholder="Anonymous" value={name} onChange={(e) => setName(e.target.value)}/></label>}
      <label className="input-label">Your comment<textarea className="field text-area" required maxLength={SITE.maxCommentLength} placeholder="Add something to the conversation..." rows={3} value={body} onChange={(e) => setBody(e.target.value)}/></label>
      <div className="form-bottom"><small>{body.length}/{SITE.maxCommentLength} · No account required</small><button disabled={busy || !body.trim()} className="btn btn-primary">{busy ? 'Sending…' : 'Post comment ↗'}</button></div>
      {status && <p className="form-success" role="status">{status}</p>}
      {err && <p role="alert" className="form-error">{err}</p>}
    </form>
    <div className="comments-list">{!loaded ? <p className="muted">Loading comments…</p> : !comments.length ? <div className="empty-comments">No comments yet. Start the conversation.</div> : comments.slice(0, shown).map((c) => <div className="comment" key={c.id} style={{ marginLeft: c.replyTo ? 20 : 0 }}><div className="comment-avatar">{publicAuthor(c).slice(0,1).toUpperCase()}</div><div className="comment-content"><div className="comment-meta"><strong>{publicAuthor(c)}</strong>{!c.authorUid && <span>guest</span>}<span>· {timeLabel(c.createdAt)}</span></div><p>{c.body}</p><button className="reply-button" onClick={() => { setReplyTo(c.id); document.querySelector('.comment-form textarea')?.focus(); }}>↳ Reply</button></div></div>)}</div>
    {comments.length > shown && <button className="btn btn-outline" onClick={() => setShown((n) => n+10)}>Show more comments</button>}
  </section>;
}
