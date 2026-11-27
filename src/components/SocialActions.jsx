import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthDialog } from '../context/AuthDialogContext';
import { useSaved } from '../context/SavedContext';
import { useContent } from '../context/ContentContext';
import { displayedScore, contentPath } from '../lib/content';
import { ownVote, saveVote, reportContent } from '../lib/store';

export default function SocialActions({ item, detail = false }) {
  const { user } = useAuth(); const openAuth = useAuthDialog(); const { has, toggle } = useSaved();
  const { adjustVote } = useContent(); const [vote, setVote] = useState(null);
  const [pending, setPending] = useState(false); const [voteReady, setVoteReady] = useState(!user); const [message, setMessage] = useState('');
  useEffect(() => {
    let active = true; setVote(null); setVoteReady(!user);
    if (user) ownVote(item.id, user.uid).then((v) => { if (active) setVote(v); }).catch(() => {}).finally(() => { if (active) setVoteReady(true); });
    return () => { active = false; };
  }, [item.id, user?.uid]);
  const choose = async (value) => {
    if (!user) { openAuth(); return; }
    if (pending || !voteReady) return;
    const next = vote === value ? null : value; const previous = vote;
    setPending(true); setMessage(''); setVote(next);
    adjustVote(item.id, previous, next);
    try { const result = await saveVote(item.id, value, user.uid); setVote(result.vote); }
    catch (err) { adjustVote(item.id, next, previous); setVote(previous); setMessage(err.message || 'Vote could not be saved.'); }
    finally { setPending(false); }
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${contentPath(item)}`); setMessage('Link copied!'); }
    catch { setMessage('Copy the address from your browser to share.'); }
  };
  const report = async () => {
    if (!window.confirm('Report this post to the moderators?')) return;
    try { await reportContent(`${item.kind}:${item.id}`, 'inappropriate'); setMessage('Thanks, your report was sent.'); }
    catch (e) { setMessage(e.message || 'Could not send report.'); }
  };
  return <div className="social-wrap">
    <div className="social-actions">
      <div className="vote-group" aria-label="Votes">
        <button title={user ? 'Like' : 'Sign in to vote'} aria-label="Like" aria-pressed={vote === 'like'} disabled={pending || !voteReady} className={vote === 'like' ? 'selected' : ''} onClick={() => choose('like')}>↑</button>
        <span aria-label={`Score ${displayedScore(item)}`} className="score">{displayedScore(item)}</span>
        <button title={user ? 'Dislike' : 'Sign in to vote'} aria-label="Dislike" aria-pressed={vote === 'dislike'} disabled={pending || !voteReady} className={vote === 'dislike' ? 'selected' : ''} onClick={() => choose('dislike')}>↓</button>
      </div>
      {detail ? <span className="action-link">◌ {item.commentCount || 0} comments</span> : <Link className="action-link" to={contentPath(item)}>◌ {item.commentCount || 0} comments</Link>}
      <button className="action-link" onClick={() => toggle(item.id)} aria-pressed={has(item.id)}>{has(item.id) ? '▣ Saved' : '▢ Save'}</button>
      <button className="action-link" onClick={share}>↗ Share</button>
      <button className="action-link report-link" onClick={report} title="Report post">···</button>
    </div>
    {message && <p className="inline-status" role="status">{message}</p>}
  </div>;
}
