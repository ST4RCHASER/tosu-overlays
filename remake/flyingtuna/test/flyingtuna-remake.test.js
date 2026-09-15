import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from '../../../test/helpers/fake-dom.js';
import { v2 } from '../../../test/helpers/fixtures.js';

const ids = ['pp_box_num', 'pp_fc_box', 'pp_box', 'pp_fc_num', 'green', 'purple', 'red', 'hit_counting_box',
  'star_num', 'mods_txt', 'ar_box', 'od_box', 'cs_box', 'hp_box', 'mods_txtt', 'mods_txttt',
  'vec', 'result_pp', 'result_100', 'result_50', 'result_0'];
const el = installFakeDom(ids);
const { update } = await import('../FlyingTunaRemake/index.js');

test('play state: pp, fc pp, hits, stars, mods, converted stats', () => {
  update(v2({ state: 5 }));
  update(v2({
    state: 2,
    play: { pp: { current: 245.6, fc: 310.2 }, hits: { 100: 5, 50: 1, 0: 2 }, mods: { name: 'HDDT' } }
  }));
  assert.equal(el('pp_box_num').innerHTML, 246);
  assert.equal(el('pp_fc_num').innerHTML, 310);
  assert.equal(el('green').innerHTML, 5);
  assert.equal(el('purple').innerHTML, 1);
  assert.equal(el('red').innerHTML, 2);
  assert.equal(el('star_num').innerHTML, '6.37');
  assert.equal(el('mods_txt').innerHTML, 'HDDT');
  assert.equal(el('ar_box').innerHTML, 'AR: 10.33');
  assert.equal(el('od_box').innerHTML, 'OD: 9.50');
  assert.equal(el('cs_box').innerHTML, 'CS: 5.20');
  assert.equal(el('hp_box').innerHTML, 'HP: 7.00');
  assert.equal(el('pp_box').classList.contains('hide'), false);
  assert.equal(el('hit_counting_box').classList.contains('hide'), false);
  assert.equal(el('ar_box').classList.contains('hide'), false);
});

test('NM shown when no mods; original stats used when converted missing', () => {
  update(v2({ state: 2, play: { mods: { name: '' } }, beatmap: { stats: { ar: { original: 9, converted: 0 } } } }));
  assert.equal(el('mods_txt').innerHTML, 'NM');
  assert.equal(el('ar_box').innerHTML, 'AR: 9.00');
});

test('result screen reads resultsScreen hits/pp and reveals result elements', () => {
  update(v2({ state: 2 }));
  update(v2({
    state: 7,
    play: { hits: { 100: 99, 50: 99, 0: 99 } },
    resultsScreen: { hits: { 100: 7, 50: 3, 0: 1 }, pp: { current: 199.7 } }
  }));
  assert.equal(el('result_pp').innerHTML, '200pp');
  assert.equal(el('result_100').innerHTML, 7);
  assert.equal(el('result_50').innerHTML, 3);
  assert.equal(el('result_0').innerHTML, 1);
  assert.equal(el('vec').classList.contains('hide'), false);
  assert.equal(el('result_pp').classList.contains('hide'), false);
  assert.equal(el('result_100').classList.contains('hide_result'), false);
  assert.equal(el('pp_box').classList.contains('hide'), true);
});

test('leaving result screen hides result elements', () => {
  update(v2({ state: 5 }));
  assert.equal(el('vec').classList.contains('hide'), true);
  assert.equal(el('result_pp').classList.contains('hide'), true);
  assert.equal(el('result_0').classList.contains('hide_result'), true);
});

test('result screen on tosu < 2.6 (no resultsScreen.pp) falls back to play.pp', () => {
  update(v2({ state: 2 }));
  const d = v2({ state: 7, play: { pp: { current: 88.4 }, hits: { 100: 1 } }, resultsScreen: { hits: { 100: 9 } } });
  delete d.resultsScreen.pp;
  delete d.resultsScreen.rank;
  update(d);
  assert.equal(el('result_pp').innerHTML, '88pp');
  assert.equal(el('result_100').innerHTML, 9);
});
