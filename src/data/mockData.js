const now = Date.now();
const day = 86400000;
export const demoContents = [
  { id: 'clip-1', kind: 'video', title: 'A classic from the internet', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', videoId: 'dQw4w9WgXcQ', body: 'Sometimes an old favorite is exactly what the group chat needs.', authorName: 'Alex', tags: ['Throwback', 'Music'], likes: 19, dislikes: 3, commentCount: 2, featured: true, status: 'approved', createdAt: new Date(now-day).toISOString() },
  { id: 'clip-2', kind: 'video', title: 'A short film worth sharing', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', videoId: 'aqz-KE-bpKQ', body: 'For when you need a little cinematic escape.', authorName: 'Jamie', tags: ['Animation', 'Favorites'], likes: 12, dislikes: 2, commentCount: 1, status: 'approved', createdAt: new Date(now-2*day).toISOString() },
  { id: 'clip-3', kind: 'video', title: 'Something delightful to revisit', url: 'https://youtu.be/jNQXAC9IVRw', videoId: 'jNQXAC9IVRw', body: 'The early days of sharing videos.', authorName: 'Morgan', tags: ['Throwback'], likes: 9, dislikes: 1, commentCount: 0, status: 'approved', createdAt: new Date(now-4*day).toISOString() },
  { id: 'joke-1', kind: 'joke', title: 'A little self-awareness', body: 'I told my computer I needed a break.\nNow it keeps showing me beach wallpapers.', authorName: 'Sam', tags: ['One-liners'], likes: 27, dislikes: 5, commentCount: 2, featured: true, status: 'approved', createdAt: new Date(now-3*3600000).toISOString() },
  { id: 'joke-2', kind: 'joke', title: '', body: 'My calendar and I have a lot in common.\nWe are both fully booked and somehow still behind.', authorName: 'Taylor', tags: ['Everyday'], likes: 14, dislikes: 2, commentCount: 1, status: 'approved', createdAt: new Date(now-day).toISOString() },
  { id: 'joke-3', kind: 'joke', title: 'The group chat', body: 'Nobody:\nAbsolutely nobody:\nThe group chat at 2 a.m.: What if we all learned pottery?', authorName: 'Anonymous', tags: ['Relatable'], likes: 3, dislikes: 9, commentCount: 0, status: 'approved', createdAt: new Date(now-3*day).toISOString() },
];
export const demoComments = [
  { id: 'c1', targetKey: 'video:clip-1', body: 'This is never going to get old.', authorName: 'Chris', createdAt: new Date(now-day/2).toISOString() },
  { id: 'c2', targetKey: 'video:clip-1', body: 'I knew what was coming and still clicked.', authorName: 'Riley', createdAt: new Date(now-day/3).toISOString() },
  { id: 'c3', targetKey: 'video:clip-2', body: 'Such a good watch!', authorName: 'Jo', createdAt: new Date(now-day).toISOString() },
  { id: 'c4', targetKey: 'joke:joke-1', body: 'Mine recommends mountain cabins.', authorName: 'Jess', createdAt: new Date(now-2*3600000).toISOString() },
  { id: 'c5', targetKey: 'joke:joke-1', body: 'Honestly, fair.', authorName: 'Quinn', createdAt: new Date(now-3600000).toISOString() },
  { id: 'c6', targetKey: 'joke:joke-2', body: 'Too real.', authorName: 'Anonymous', createdAt: new Date(now-day/3).toISOString() }
];
