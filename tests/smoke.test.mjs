import test from 'node:test';
import assert from 'node:assert/strict';
import { extractYouTubeId, youtubeEmbed } from '../src/lib/youtube.js';
import { displayedScore, voteDelta, sortItems, contentPath } from '../src/lib/content.js';

test('YouTube URL extraction supports five popular formats', () => {
  const id = 'dQw4w9WgXcQ';
  for (const url of [
    `https://youtu.be/${id}`,
    `https://www.youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`
  ]) assert.equal(extractYouTubeId(url), id);
});
test('rejects invalid YouTube host and ID', () => {
  assert.equal(extractYouTubeId('https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=bad'), null);
  assert.equal(extractYouTubeId('javascript:alert(1)'), null);
});
test('privacy-conscious autoplay uses mute', () => {
  const url = youtubeEmbed('dQw4w9WgXcQ',{autoplay:true,muted:true});
  assert.match(url,/youtube-nocookie.com/); assert.match(url,/mute=1/);
});
test('displayed votes never go negative even when dislikes outnumber likes', () => {
  for(const [likes,dislikes,expected] of [[10,3,7],[5,5,0],[2,8,0],[0,6,0],[8,0,8],[0,10,0],[0,100,0]]) assert.equal(displayedScore({likes,dislikes}),expected);
});
test('vote changing/removal updates internal counts', () => {
  const changed = voteDelta({likes:1,dislikes:0},'like','dislike');
  assert.deepEqual(changed,{likes:0,dislikes:1});
  assert.deepEqual(voteDelta(changed,'dislike',null),{likes:0,dislikes:0});
});
test('top sort clamps score and post links are real', () => {
  const sorted=sortItems([{id:'a',likes:0,dislikes:10},{id:'b',likes:2,dislikes:1}],'top');
  assert.equal(sorted[0].id,'b');
  assert.equal(contentPath({id:'a',kind:'joke'}),'/jokes/a');
});
