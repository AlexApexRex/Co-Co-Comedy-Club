import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Detail from './pages/Detail';
import Submit from './pages/Submit';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import { AuthDialogProvider } from './context/AuthDialogContext';
import { useSaved } from './context/SavedContext';
import { SITE } from './config';
import { isFirebaseConfigured } from './firebase';

function Saved() { const { ids } = useSaved(); return <Feed savedIds={ids}/>; }
function Page() {
  const location = useLocation();
  return <div className="app-root">
    <a className="skip-link" href="#main-content">Skip to content</a>
    {!isFirebaseConfigured && <div className="demo-banner">PREVIEW MODE <span>·</span> Posts, comments, and votes are saved locally. Connect Firebase to go live.</div>}
    <Header />
    <div id="main-content" key={location.pathname}>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/videos" element={<Feed kind="video"/>}/>
        <Route path="/jokes" element={<Feed kind="joke"/>}/>
        <Route path="/videos/:id" element={<Detail kind="video"/>}/>
        <Route path="/jokes/:id" element={<Detail kind="joke"/>}/>
        <Route path="/submit" element={<Submit/>}/>
        <Route path="/submit/:kind" element={<Submit/>}/>
        <Route path="/saved" element={<Saved/>}/>
        <Route path="/profile/:uid" element={<Profile/>}/>
        <Route path="/admin" element={<Admin/>}/>
        <Route path="/feed" element={<Navigate to="/videos" replace/>}/>
        <Route path="*" element={<main className="container page-shell empty-state"><h1>Wrong turn?</h1><p>That page isn't here, but the good stuff is.</p><Link to="/" className="btn btn-primary">Take me home</Link></main>}/>
      </Routes>
    </div>
    <footer className="site-footer"><div className="container footer-row"><Link to="/" className="brand"><span className="brand-mark">g<span>.</span></span>{SITE.name}</Link><p>Find something good. Pass it on.</p><div><Link to="/videos">Videos</Link><Link to="/jokes">Jokes</Link><Link to="/submit">Contribute</Link></div></div></footer>
  </div>;
}
export default function App() { return <AuthDialogProvider><Page/></AuthDialogProvider>; }
