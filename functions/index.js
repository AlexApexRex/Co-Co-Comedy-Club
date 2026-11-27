const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const HttpsError = functions.https.HttpsError;
const TEXT_LIMITS = { name: 50, title: 140, joke: 3000, video: 1000, comment: 1200 };
const ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function textField(value, max, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', 'Invalid text field.');
  const text = value.trim();
  if (text.length > max || (required && !text)) throw new HttpsError('invalid-argument', `Text must be between ${required ? 1 : 0} and ${max} characters.`);
  return text;
}
function videoIdFromUrl(raw) {
  const rawUrl = textField(raw, 2048, true);
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  let id;
  if (['youtu.be', 'www.youtu.be'].includes(host)) id = url.pathname.split('/')[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['embed', 'shorts', 'live', 'v', 'e'].includes(parts[0])) id = parts[1];
  }
  return ID_RE.test(id || '') ? id : null;
}
function makeTags(raw) {
  if (!Array.isArray(raw) || raw.length > 5) throw new HttpsError('invalid-argument', 'Use up to five tags.');
  const tags = raw.map((value) => textField(value, 24, true));
  return [...new Set(tags)];
}
function author(data, context) {
  const fromAuth = context.auth?.token?.name;
  return textField(fromAuth || data.authorName || 'Anonymous', TEXT_LIMITS.name, true);
}
function targetRef(key) {
  if (typeof key !== 'string' || !/^(video|joke):[a-zA-Z0-9_-]{1,160}$/.test(key)) throw new HttpsError('invalid-argument', 'Invalid target.');
  const [kind, id] = key.split(':');
  return { kind, id, ref: db.collection('contents').doc(id) };
}
function requireAdmin(context) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Sign in required.');
  return db.collection('users').doc(context.auth.uid).get().then((doc) => {
    if (doc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Administrator access required.');
  });
}
// Limited by hashed client IP; stored limits are server-only. This is friction, not a replacement for App Check / abuse monitoring.
async function checkRate(context, action, max = 6, windowMs = 60000) {
  const ip = context.rawRequest?.ip || context.rawRequest?.socket?.remoteAddress || 'unknown';
  const salt = process.env.RATE_LIMIT_SALT || process.env.GC_RATE_SALT || process.env.GCLOUD_PROJECT || 'good-company';
  const key = crypto.createHash('sha256').update(`${salt}:${ip}:${action}`).digest('hex');
  const ref = db.collection('rateLimits').doc(key);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const data = snap.data();
    const reset = !data || data.windowStart + windowMs <= now;
    const count = reset ? 0 : data.count || 0;
    if (count >= max) throw new HttpsError('resource-exhausted', 'Too many requests. Please try again shortly.');
    tx.set(ref, { count: count + 1, windowStart: reset ? now : data.windowStart, updatedAt: FieldValue.serverTimestamp() });
  });
}
exports.submitContent = functions.https.onCall(async (data, context) => {
  await checkRate(context, 'content', 4);
  const kind = data?.kind;
  if (kind !== 'joke' && kind !== 'video') throw new HttpsError('invalid-argument', 'Choose a joke or video.');
  const title = textField(data.title, TEXT_LIMITS.title, kind === 'video');
  const body = textField(data.body, kind === 'joke' ? TEXT_LIMITS.joke : TEXT_LIMITS.video, kind === 'joke');
  const tags = makeTags(data.tags || []);
  const authorName = author(data, context);
  let videoId = null;
  if (kind === 'video') {
    videoId = videoIdFromUrl(data.url);
    if (!videoId) throw new HttpsError('invalid-argument', 'Enter a supported YouTube URL.');
  }
  // Stable IDs prevent duplicate exact jokes and duplicate video links, even under concurrent requests.
  const digest = kind === 'video' ? videoId : crypto.createHash('sha256').update(body.toLowerCase().replace(/\s+/g, ' ')).digest('hex').slice(0, 32);
  const ref = db.collection('contents').doc(`${kind}_${digest}`);
  const payload = {
    kind, title, body, tags, authorName, authorUid: context.auth?.uid || null,
    ...(videoId ? { url: `https://www.youtube.com/watch?v=${videoId}`, videoId } : {}),
    status: 'pending', featured: false, likes: 0, dislikes: 0, commentCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  };
  try { await ref.create(payload); }
  catch (err) { if (err.code === 6 || err.code === 'already-exists') throw new HttpsError('already-exists', 'This post has already been submitted.'); throw err; }
  return { id: ref.id, pending: true };
});
exports.submitComment = functions.https.onCall(async (data, context) => {
  await checkRate(context, 'comments', 8);
  const target = targetRef(data?.targetKey);
  const body = textField(data.body, TEXT_LIMITS.comment, true);
  const authorName = author(data, context);
  const replyTo = data.replyTo == null || data.replyTo === '' ? null : textField(data.replyTo, 160, true);
  const targetSnap = await target.ref.get();
  if (!targetSnap.exists || targetSnap.data().kind !== target.kind || targetSnap.data().status !== 'approved') throw new HttpsError('not-found', 'This post is not available.');
  if (replyTo) {
    const parent = await db.collection('comments').doc(replyTo).get();
    if (!parent.exists || parent.data().targetKey !== data.targetKey || parent.data().status !== 'approved') throw new HttpsError('invalid-argument', 'Reply target not available.');
  }
  const ref = await db.collection('comments').add({
    targetKey: data.targetKey, body, authorName, authorUid: context.auth?.uid || null,
    replyTo, status: 'pending', createdAt: FieldValue.serverTimestamp(),
  });
  return { id: ref.id, pending: true };
});
exports.castVote = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Sign in to vote.');
  await checkRate(context, 'votes', 30);
  if (!['like', 'dislike'].includes(data?.value)) throw new HttpsError('invalid-argument', 'Invalid vote.');
  const contentId = textField(data.contentId, 160, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(contentId)) throw new HttpsError('invalid-argument', 'Invalid content ID.');
  const contentRef = db.collection('contents').doc(contentId);
  const voteRef = db.collection('votes').doc(`${contentId}_${context.auth.uid}`);
  return db.runTransaction(async (tx) => {
    const [contentDoc, existing] = await Promise.all([tx.get(contentRef), tx.get(voteRef)]);
    if (!contentDoc.exists || contentDoc.data().status !== 'approved') throw new HttpsError('not-found', 'Post not found.');
    const previous = existing.exists ? existing.data().value : null;
    const next = previous === data.value ? null : data.value;
    const likes = Math.max(0, (contentDoc.data().likes || 0) - Number(previous === 'like') + Number(next === 'like'));
    const dislikes = Math.max(0, (contentDoc.data().dislikes || 0) - Number(previous === 'dislike') + Number(next === 'dislike'));
    tx.update(contentRef, { likes, dislikes });
    if (next) tx.set(voteRef, { uid: context.auth.uid, contentId, value: next, updatedAt: FieldValue.serverTimestamp() });
    else if (existing.exists) tx.delete(voteRef);
    return { vote: next, likes, dislikes, score: Math.max(0, likes - dislikes) };
  });
});
exports.reportContent = functions.https.onCall(async (data, context) => {
  await checkRate(context, 'reports', 5);
  const target = targetRef(data?.targetKey);
  const reason = textField(data.reason || 'inappropriate', 250, true);
  const document = await target.ref.get();
  if (!document.exists || document.data().status !== 'approved') throw new HttpsError('not-found', 'Post not found.');
  await db.collection('reports').add({ targetKey: data.targetKey, reason, createdAt: FieldValue.serverTimestamp(), reviewed: false });
  return { success: true };
});
exports.moderateItem = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  if (!['contents', 'comments'].includes(data?.collectionName) || !['approved', 'rejected'].includes(data?.status)) throw new HttpsError('invalid-argument', 'Invalid moderation action.');
  const id = textField(data.id, 160, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new HttpsError('invalid-argument', 'Invalid item ID.');
  const ref = db.collection(data.collectionName).doc(id);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new HttpsError('not-found', 'Item not found.');
    if (doc.data().status === data.status) return;
    const target = data.collectionName === 'comments' ? targetRef(doc.data().targetKey) : null;
    const targetDoc = target ? await tx.get(target.ref) : null;
    if (target && (!targetDoc.exists || targetDoc.data().status !== 'approved')) throw new HttpsError('failed-precondition', 'Parent post is not approved.');
    if (target) {
      const delta = (data.status === 'approved' ? 1 : 0) - (doc.data().status === 'approved' ? 1 : 0);
      tx.update(target.ref, { commentCount: Math.max(0, (targetDoc.data().commentCount || 0) + delta) });
    }
    tx.update(ref, { status: data.status, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: context.auth.uid });
  });
  return { success: true };
});
exports.getReports = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const snap = await db.collection('reports').where('reviewed', '==', false).limit(100).get();
  return { reports: snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: null })) };
});
exports.resolveReport = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const id = textField(data?.id, 160, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new HttpsError('invalid-argument', 'Invalid report ID.');
  await db.collection('reports').doc(id).update({ reviewed: true, reviewedBy: context.auth.uid });
  return { success: true };
});
exports.exportSubmissions = functions.https.onCall(async (data, context) => {
  await requireAdmin(context);
  const snap = await db.collection('contents').limit(1000).get();
  return { count: snap.size, submissions: snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: null })) };
});
