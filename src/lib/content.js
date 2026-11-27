export const displayedScore = (item) => Math.max(0, Math.max(0, Number(item?.likes) || 0) - Math.max(0, Number(item?.dislikes) || 0));
export function voteDelta(item, previous, next) {
  return {
    ...item,
    likes: Math.max(0, (item.likes || 0) - Number(previous === 'like') + Number(next === 'like')),
    dislikes: Math.max(0, (item.dislikes || 0) - Number(previous === 'dislike') + Number(next === 'dislike')),
  };
}
export function timeLabel(timestamp) {
  const d = timestamp?.toDate?.() || (timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp || Date.now()));
  if (Number.isNaN(d.getTime())) return 'Just now';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}
export function sortItems(items, sort) {
  const list = [...items];
  const date = (i) => i.createdAt?.toMillis?.() || new Date(i.createdAt || 0).getTime() || 0;
  if (sort === 'top') list.sort((a, b) => displayedScore(b) - displayedScore(a) || date(b) - date(a));
  else if (sort === 'discussed') list.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0) || date(b) - date(a));
  else if (sort === 'trending') list.sort((a, b) => ((displayedScore(b) * 3 + (b.commentCount || 0)) / (1 + Math.max(0, Date.now() - date(b)) / 86400000)) - ((displayedScore(a) * 3 + (a.commentCount || 0)) / (1 + Math.max(0, Date.now() - date(a)) / 86400000)));
  else list.sort((a, b) => date(b) - date(a));
  return list;
}
export function publicAuthor(item) { return item?.authorName?.trim() || 'Anonymous'; }
export function contentPath(item) { return `/${item.kind === 'joke' ? 'jokes' : 'videos'}/${encodeURIComponent(item.id)}`; }
