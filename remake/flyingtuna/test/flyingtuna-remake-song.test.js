import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from '../../../test/helpers/fake-dom.js';
import { v2 } from '../../../test/helpers/fixtures.js';

const el = installFakeDom(['main_box', 'song_artist', 'song_title', 'mapper_name_txt', 'diff_name_txt', 'top', 'bottom',
  'percent_num_95', 'percent_num_96', 'percent_num_97', 'percent_num_98', 'percent_num_99', 'percent_num_100']);
const { update } = await import('../FlyingTunaRemakeSong/index.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

test('metadata truncated, pp per accuracy rounded', () => {
  update(v2({
    state: 0,
    beatmap: { artist: 'A very long artist name that overflows', title: 'circles!', mapper: 'peppy_the_mapper_x', version: 'Another Insane Diff' }
  }));
  assert.equal(el('song_artist').innerHTML, 'A very long artist ...');
  assert.equal(el('song_title').innerHTML, 'circles!');
  assert.equal(el('mapper_name_txt').innerHTML, 'peppy_the_ma');
  assert.equal(el('diff_name_txt').innerHTML, 'Another Insa');
  assert.equal(el('percent_num_95').innerHTML, 100);
  assert.equal(el('percent_num_97').innerHTML, 141);
  assert.equal(el('percent_num_100').innerHTML, 261);
});

test('background from folders.beatmap + files.background, refetched only when it changes', async () => {
  update(v2({ state: 0 }));
  await tick();
  assert.equal(el('main_box').style.background, "url('http://127.0.0.1:24050/files/beatmap/1011011%20nekodex%20-%20new%20beginnings/new-beginnings.jpg')");
  const first = el('main_box').style.background;
  update(v2({ state: 0 }));
  await tick();
  assert.equal(el('main_box').style.background, first, 'same map must not refetch');
  update(v2({ state: 0, folders: { beatmap: '2 other' }, files: { background: 'bg.png' } }));
  await tick();
  assert.equal(el('main_box').style.background, "url('http://127.0.0.1:24050/files/beatmap/2%20other/bg.png')");
  update(v2({ state: 0, files: { background: '' } }));
  await tick();
  assert.equal(el('main_box').style.background, "url('images/empty.jpg')");
});

test('pp tables shown only in play', () => {
  update(v2({ state: 5 }));
  assert.equal(el('top').classList.contains('hide'), true);
  update(v2({ state: 2 }));
  assert.equal(el('top').classList.contains('hide'), false);
  assert.equal(el('bottom').classList.contains('hide'), false);
  update(v2({ state: 7 }));
  assert.equal(el('top').classList.contains('hide'), true);
});
