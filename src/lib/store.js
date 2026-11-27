import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isFirebaseConfigured } from '../firebase';
import { demoContents, demoComments } from '../data/mockData';
import { voteDelta } from './content';

const DEMO_KEY = 'good-company-demo-v1';
const copy = (data) => JSON.parse(JSON.stringify(data));
let demo = (() => {
  try {
    const stored = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
    if (stored?.contents && stored?.comments) return stored;
  } catch { /* private browsing */ }
  return { contents: copy(demoContents), comments: copy(demoComments), votes: {} };
})();
const listeners = new Set();
function emit() {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(demo)); } catch { /* optional */ }
  listeners.forEach((cb) => cb());
}
export function subscribeFeed(callback, onError) {
  if (!isFirebaseConfigured) {
    const notify = () => callback(copy(demo.contents));
    listeners.add(notify); notify();
    return () => listeners.delete(notify);
  }
  return onSnapshot(query(collection(db, 'contents'), where('status', '==', 'approved')),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))), onError);
}
export function subscribeComments(targetKey, callback, onError) {
  if (!isFirebaseConfigured) {
    const notify = () => callback(copy(demo.comments.filter((c) => c.targetKey === targetKey)));
    listeners.add(notify); notify();
    return () => listeners.delete(notify);
  }
  return onSnapshot(query(collection(db, 'comments'), where('targetKey', '==', targetKey), where('status', '==', 'approved')),
    (snapshot) => callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id }))), onError);
}
export async function submitContent(payload) {
  if (!isFirebaseConfigured) {
    const id = `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    demo.contents.unshift({ ...payload, id, status: 'approved', likes: 0, dislikes: 0, commentCount: 0, createdAt: new Date().toISOString() });
    emit();
    return { id, pending: false, demo: true };
  }
  return (await httpsCallable(functions, 'submitContent')(payload)).data;
}
export async function submitComment(payload) {
  if (!isFirebaseConfigured) {
    const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    demo.comments.push({ ...payload, id, createdAt: new Date().toISOString(), status: 'approved' });
    const item = demo.contents.find((it) => `${it.kind}:${it.id}` === payload.targetKey);
    if (item) item.commentCount = (item.commentCount || 0) + 1;
    emit(); return { id, pending: false, demo: true };
  }
  return (await httpsCallable(functions, 'submitComment')(payload)).data;
}
export async function ownVote(contentId, uid) {
  if (!uid) return null;
  if (!isFirebaseConfigured) return demo.votes[`${contentId}_${uid}`] || null;
  const snap = await getDoc(doc(db, 'votes', `${contentId}_${uid}`));
  return snap.exists() ? snap.data().value : null;
}
export async function saveVote(contentId, value, uid) {
  if (!uid) throw Error('Please sign in to vote.');
  if (!isFirebaseConfigured) {
    const key = `${contentId}_${uid}`;
    const previous = demo.votes[key] || null;
    const next = previous === value ? null : value;
    const index = demo.contents.findIndex((i) => i.id === contentId);
    if (index >= 0) demo.contents[index] = voteDelta(demo.contents[index], previous, next);
    if (next) demo.votes[key] = next; else delete demo.votes[key];
    emit();
    return { vote: next };
  }
  return (await httpsCallable(functions, 'castVote')({ contentId, value })).data;
}
export async function reportContent(targetKey, reason) {
  if (!isFirebaseConfigured) return { demo: true };
  return (await httpsCallable(functions, 'reportContent')({ targetKey, reason })).data;
}
export async function getAdminQueue() {
  if (!isFirebaseConfigured) return [];
  const [contents, comments] = await Promise.all([
    getDocs(query(collection(db, 'contents'), where('status', '==', 'pending'))),
    getDocs(query(collection(db, 'comments'), where('status', '==', 'pending'))),
  ]);
  return [
    ...contents.docs.map((d) => ({ ...d.data(), id: d.id, collectionName: 'contents' })),
    ...comments.docs.map((d) => ({ ...d.data(), id: d.id, collectionName: 'comments' })),
  ];
}
export async function moderateItem(collectionName, id, status) {
  if (!isFirebaseConfigured) throw Error('Admin actions are unavailable in demo mode.');
  return (await httpsCallable(functions, 'moderateItem')({ collectionName, id, status })).data;
}
export function subscribeRole(uid, callback) {
  if (!isFirebaseConfigured || !uid) { callback(null); return () => {}; }
  return onSnapshot(doc(db, 'users', uid), (snapshot) => callback(snapshot.data()?.role === 'admin' ? 'admin' : null), () => callback(null));
}

export async function getReports() {
  if (!isFirebaseConfigured) return [];
  return (await httpsCallable(functions, 'getReports')({})).data.reports || [];
}
export async function resolveReport(id) {
  if (!isFirebaseConfigured) throw Error('Admin actions are unavailable in demo mode.');
  return (await httpsCallable(functions, 'resolveReport')({ id })).data;
}
