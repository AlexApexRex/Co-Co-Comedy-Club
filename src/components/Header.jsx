import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthDialog } from '../context/AuthDialogContext';
import { SITE } from '../config';
const nav = [{ to: '/videos', label: 'Videos' }, { to: '/jokes', label: 'Jokes' }, { to: '/saved', label: 'Saved' }];
export default function Header() {
  const auth = useAuth(); const openAuth = useAuthDialog(); const loc = useLocation();
  return <header className="site-header">
    <div className="container header-row">
      <Link to="/" className="brand" aria-label={`${SITE.name}, home`}><span className="brand-mark">g<span>.</span></span><span>{SITE.name}</span></Link>
      <nav aria-label="Main navigation" className="primary-nav">
        {nav.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <Link to="/submit" className="btn btn-primary header-create"><span aria-hidden="true">＋</span> Create post</Link>
        {auth.user ? <div className="user-menu"><Link className="avatar" to={`/profile/${auth.user.uid}`} title="Your public profile">{(auth.user.displayName || auth.user.email || 'M').slice(0, 1).toUpperCase()}</Link><button className="text-button" onClick={async () => { try { await auth.signOut(); } catch (e) { window.alert(e.message); } }}>Sign out</button></div>
          : <button className="btn btn-outline login-action" onClick={() => openAuth()}>Sign in</button>}
      </div>
    </div>
    <nav className="mobile-nav container" aria-label="Mobile navigation">
      {nav.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{label}</NavLink>)}
      <Link to="/submit" className={`nav-link ${loc.pathname.startsWith('/submit') ? 'active' : ''}`}>Create ＋</Link>
    </nav>
  </header>;
}
