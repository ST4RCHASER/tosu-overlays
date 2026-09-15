import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from '../../../test/helpers/fake-dom.js';
import { v2 } from '../../../test/helpers/fixtures.js';

const el = installFakeDom(['count_100', 'count_50', 'count_0', 'pp_current_num', 'pp_ss_num', 'fc', 'sb', 'fc_box', 'rank', 'box']);
const { update } = await import('../PPCounter/index.js');

test('grade mapping: XH silver S+, X gold S+, SH silver S, A green', () => {
  update(v2({ state: 2, play: { rank: { current: 'XH' } } }));
  assert.equal(el('rank').innerHTML, 'S+');
  assert.equal(el('rank').style.color, '#D3D3D3');
  update(v2({ state: 2, play: { rank: { current: 'X' } } }));
  assert.equal(el('rank').innerHTML, 'S+');
  assert.equal(el('rank').style.color, '#d6c253');
  update(v2({ state: 2, play: { rank: { current: 'SH' } } }));
  assert.equal(el('rank').innerHTML, 'S');
  assert.equal(el('rank').style.color, '#D3D3D3');
  update(v2({ state: 2, play: { rank: { current: 'A' } } }));
  assert.equal(el('rank').innerHTML, 'A');
  assert.equal(el('rank').style.color, '#7ed653');
});

test('pp numbers go to CountUp targets', () => {
  update(v2({ state: 2, play: { pp: { current: 123.4, fc: 200.2 } }, performance: { accuracy: { 100: 333.3 } } }));
  assert.equal(el('pp_current_num').lastCountUp, 123.4);
  assert.equal(el('fc').lastCountUp, 200.2);
  assert.equal(el('pp_ss_num').lastCountUp, 333.3);
});

test('hit counts, miss box, slider breaks only in play states', () => {
  update(v2({ state: 2, play: { hits: { 100: 3, 50: 2, 0: 1, sliderBreaks: 4 } } }));
  assert.equal(el('count_100').innerHTML, 3);
  assert.equal(el('count_50').innerHTML, 2);
  assert.equal(el('count_0').innerHTML, 1);
  assert.equal(el('fc_box').classList.contains('box_hide'), false);
  assert.equal(el('sb').innerHTML, '4xSB');
  assert.equal(el('sb').classList.contains('box_hide'), false);

  update(v2({ state: 5, play: { hits: { 0: 1, sliderBreaks: 4 } } }));
  assert.equal(el('fc_box').classList.contains('box_hide'), true);
  assert.equal(el('sb').classList.contains('box_hide'), true);
});

test('box gets .play on song-select -> play transition, loses it on play -> menu', () => {
  update(v2({ state: 5 }));
  update(v2({ state: 2 }));
  assert.equal(el('box').classList.contains('play'), true);
  update(v2({ state: 7 }));
  assert.equal(el('box').classList.contains('play'), true);
  update(v2({ state: 5 }));
  assert.equal(el('box').classList.contains('play'), false);
});
