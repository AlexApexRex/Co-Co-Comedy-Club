import { createContext, useContext, useMemo, useState } from 'react';
const KEY = 'good-company-saved';
const SavedContext = createContext(null);
function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]').filter((i) => typeof i === 'string'); }
  catch { return []; }
}
export function SavedProvider({ children }) {
  const [ids, setIds] = useState(read);
  const value = useMemo(() => ({
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => setIds((old) => {
      const updated = old.includes(id) ? old.filter((i) => i !== id) : [...old, id];
      try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch { /* memory only */ }
      return updated;
    })
  }), [ids]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}
export const useSaved = () => useContext(SavedContext);
