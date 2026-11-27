import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeFeed } from '../lib/store';
import { voteDelta } from '../lib/content';

const ContentContext = createContext(null);
export function ContentProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    return subscribeFeed((next) => { setItems(next); setLoading(false); setError(''); }, (err) => {
      setLoading(false); setError(err?.message || 'Could not load the feed.');
    });
  }, []);
  const value = useMemo(() => ({
    items, loading, error,
    adjustVote: (id, previous, next) => setItems((old) => old.map((i) => i.id === id ? voteDelta(i, previous, next) : i)),
  }), [items, loading, error]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw Error('useContent must be used within ContentProvider');
  return ctx;
}
