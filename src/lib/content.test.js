import { describe, expect, it } from 'vitest';
import { displayedScore, sortItems, voteDelta, contentPath } from './content';
describe('vote score', () => {
  it.each([
    [10, 3, 7], [5, 5, 0], [2, 8, 0], [0, 6, 0], [8, 0, 8], [0, 10, 0], [0, 100, 0]
  ])('clamps %i likes and %i dislikes to %i', (likes, dislikes, result) => {
    expect(displayedScore({ likes, dislikes })).toBe(result);
  });
  it('switches votes and removes existing votes without double counting', () => {
    const before = { likes: 1, dislikes: 0 };
    const switched = voteDelta(before, 'like', 'dislike');
    expect(switched).toEqual({ likes: 0, dislikes: 1 });
    expect(voteDelta(switched, 'dislike', null)).toEqual({ likes: 0, dislikes: 0 });
  });
  it('uses a nonnegative score for top sort', () => {
    const a = { id:'a', likes:0, dislikes:10 };
    const b = { id:'b', likes:4, dislikes:1 };
    expect(sortItems([a,b], 'top')[0].id).toBe('b');
    expect(displayedScore(a)).toBe(0);
  });
  it('builds direct links to posts', () => {
    expect(contentPath({ kind:'joke', id:'abc' })).toBe('/jokes/abc');
  });
});
