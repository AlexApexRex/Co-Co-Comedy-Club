import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminQueue, moderateItem, getReports, resolveReport } from '../lib/store';
export default function Admin() {
  const { user, role, loading } = useAuth();
  const [queue, setQueue] = useState([]); const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  const refresh = async () => {
    try {
      const [pending, reported] = await Promise.all([getAdminQueue(), getReports()]);
      setQueue(pending); setReports(reported); setError('');
    } catch (e) { setError(e.message); }
  };
  useEffect(() => { if (role === 'admin') refresh(); }, [role]);
  if (loading) return <main className="container page-shell">Checking your access…</main>;
  if (!user || role !== 'admin') return <main className="container page-shell"><h1>Admin access only</h1><p className="muted mt-4">This area is restricted to authorized moderators.</p></main>;
  const moderate = async (item, status) => {
    setBusy(item.id); setError('');
    try { await moderateItem(item.collectionName, item.id, status); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };
  const dismiss = async (id) => {
    setBusy(id); setError('');
    try { await resolveReport(id); await refresh(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };
  return <main className="container page-shell"><div className="page-heading"><span className="eyebrow">MODERATION</span><h1>Keep things good.</h1><p>Review submissions and community reports.</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <h2 className="post-title">Pending submissions ({queue.length})</h2>
    {!queue.length ? <div className="empty-state"><h2>All caught up.</h2><p>There are no posts awaiting approval.</p><button className="btn btn-outline" onClick={refresh}>Refresh queue</button></div> : <div className="post-stack">{queue.map((item) => <article key={item.id} className="content-card"><div className="eyebrow">{item.collectionName === 'comments' ? 'COMMENT' : item.kind?.toUpperCase()} · PENDING</div><h2 className="post-title">{item.title || 'Untitled'}</h2><p className="joke-body">{item.body}</p>{item.url && <p><a className="text-link" target="_blank" rel="noopener noreferrer" href={item.url}>View submitted video ↗</a></p>}<p className="muted">Submitted by {item.authorName || 'Anonymous'}</p><div className="flex gap-3 mt-5"><button className="btn btn-primary" disabled={!!busy} onClick={() => moderate(item, 'approved')}>Approve</button><button className="btn btn-outline" disabled={!!busy} onClick={() => moderate(item, 'rejected')}>Reject</button></div></article>)}</div>}
    <h2 className="post-title mt-10">Community reports ({reports.length})</h2>
    {!reports.length ? <p className="muted">Nothing has been reported.</p> : <div className="post-stack">{reports.map((report) => <article key={report.id} className="content-card"><span className="eyebrow">REPORT</span><h3>{report.targetKey}</h3><p className="muted">{report.reason}</p><div className="flex gap-3 mt-5"><button disabled={!!busy} className="btn btn-outline" onClick={() => dismiss(report.id)}>Mark reviewed</button><button disabled={!!busy} className="btn btn-primary" onClick={async () => {
      const [kind,id] = report.targetKey.split(':');
      setBusy(id);
      try { await moderateItem('contents', id, 'rejected'); await resolveReport(report.id); await refresh(); }
      catch (error) { setError(error.message); }
      finally { setBusy(''); }
    }}>Remove post</button></div></article>)}</div>}
  </main>;
}
