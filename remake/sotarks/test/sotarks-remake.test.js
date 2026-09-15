import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from '../../../test/helpers/fake-dom.js';
import { v2 } from '../../../test/helpers/fixtures.js';

const el = installFakeDom([]);
const { update } = await import('../SotarksRemake/index.js');

test('song box + cut-in metadata, ranked status, set id', () => {
  update(v2({ state: 5, beatmap: { title: 'circles!', artist: 'nekodex', mapper: 'peppy', version: 'Insane', status: { number: 7 }, set: 12345 } }));
  assert.equal(el('song_box_title').innerHTML, 'circles!');
  assert.equal(el('cutin_title').innerHTML, 'circles!');
  assert.equal(el('song_box_artist').innerHTML, 'nekodex');
  assert.equal(el('cutin_mapper').innerHTML, 'Creator: peppy');
  assert.equal(el('song_box_diff').innerHTML, 'Insane');
  assert.equal(el('song_box_status').innerHTML, 'LOVED');
  assert.equal(el('song_box_status').style.backgroundColor, '#FF66AA');
  assert.equal(el('song_box_map_id').innerHTML, 12345);
  update(v2({ state: 5, beatmap: { set: -1 } }));
  assert.equal(el('song_box_map_id').innerHTML, 'Not available');
});

test('long title gets scroll class, diff color follows total stars', () => {
  update(v2({ state: 0, beatmap: { title: 'A title that is definitely longer than thirty chars', stats: { stars: { live: 0, total: 5.5 } } } }));
  assert.equal(el('song_box_title').classList.contains('scroll'), true);
  assert.equal(el('song_box_diff').style.backgroundColor, '#8866EE');
  assert.equal(el('song_box').classList.contains('hide'), false);
});

test('song select -> play: cut-in shows, boxes move to play layout; menu hides boxes', () => {
  update(v2({ state: 5, beatmap: { title: 'circles!' } }));
  update(v2({ state: 2, beatmap: { title: 'circles!' } }));
  assert.equal(el('cutin').classList.contains('hide'), false);
  assert.equal(el('diff_box_1').classList.contains('center_diff_box'), true);
  assert.equal(el('pp_percent_box').classList.contains('top'), true);
  assert.equal(el('counting_box').classList.contains('hide'), false);
  assert.equal(el('progress_box').classList.contains('hide'), false);
  update(v2({ state: 0 }));
  assert.equal(el('diff_box_1').classList.contains('hide_diff_box'), true);
  assert.equal(el('pp_percent_box').classList.contains('hide_box'), true);
  assert.equal(el('progress_box').classList.contains('hide'), true);
  assert.equal(el('diff_box_1').classList.contains('center_diff_box'), false);
});

test('editor state applies edit layout', () => {
  update(v2({ state: 1 }));
  assert.equal(el('diff_box_2').classList.contains('edit_diff_box'), true);
  assert.equal(el('mini_pp').classList.contains('edit'), true);
  update(v2({ state: 5 }));
  assert.equal(el('diff_box_2').classList.contains('edit_diff_box'), false);
});

test('chat visibility drives chat layout classes', () => {
  update(v2({ state: 5, settings: { chatVisibilityStatus: { number: 2 } } }));
  assert.equal(el('diff_box_3').classList.contains('chat_diff_box'), true);
  assert.equal(el('progress_box').classList.contains('chat'), true);
  assert.equal(el('pp_percent_box').classList.contains('chat_mode'), true);
  update(v2({ state: 5, settings: { chatVisibilityStatus: { number: 0 } } }));
  assert.equal(el('diff_box_3').classList.contains('chat_diff_box'), false);
  assert.equal(el('pp_percent_box').classList.contains('chat_mode'), false);
});

test('hits, pp percent table, stats via anime', () => {
  update(v2({ state: 2, play: { hits: { 100: 4, 50: 2, 0: 1 } }, performance: { accuracy: { 100: 300.4, 99: 250.6, 96: 100 } } }));
  assert.equal(el('count_100').innerHTML, 4);
  assert.equal(el('count_50').innerHTML, 2);
  assert.equal(el('count_0').innerHTML, 1);
  assert.equal(el('pp_100').innerHTML, '300');
  assert.equal(el('pp_99').innerHTML, '251');
  assert.equal(el('pp_96').innerHTML, '100');
  assert.equal(el('cs_box').innerHTML, '5.20');
  assert.equal(el('ar_box').innerHTML, '10.33');
  assert.equal(el('star_box').innerHTML, '6.37');
});

test('mini pp shown in play with rounded number, hidden otherwise', () => {
  update(v2({ state: 2, play: { pp: { current: 123.7 } } }));
  assert.equal(el('mini_pp_num').innerHTML, 124);
  assert.equal(el('mini_pp').classList.contains('hide'), false);
  update(v2({ state: 5, play: { pp: { current: 123.7 } } }));
  assert.equal(el('mini_pp').classList.contains('hide'), true);
});

test('progress bar width from beatmap time', () => {
  update(v2({ state: 2, beatmap: { time: { live: 50000, lastObject: 100000 } } }));
  assert.equal(el('progress').style.width, '555px');
  assert.equal(el('mini_pp').style.marginLeft, '555px');
});

test('strain graph sums aim+speed and feeds both charts', () => {
  const before = Chart.instances[0].updates;
  update(v2({ state: 5, performance: { graph: { series: [{ name: 'aim', data: [1, 2, 3] }, { name: 'speed', data: [1, 1, 1] }, { name: 'flashlight', data: [9, 9, 9] }], xaxis: [0, 1, 2] } } }));
  assert.equal(Chart.instances.length, 2);
  assert.equal(Chart.instances[0].updates, before + 1);
  assert.deepEqual(Chart.instances[0].config.data.datasets[0].data, [3, 3, 3]);
  // same graph again: no redundant redraw
  update(v2({ state: 5, performance: { graph: { series: [{ name: 'aim', data: [1, 2, 3] }, { name: 'speed', data: [1, 1, 1] }, { name: 'flashlight', data: [9, 9, 9] }], xaxis: [0, 1, 2] } } }));
  assert.equal(Chart.instances[0].updates, before + 1);
});

test('mod icons from mods.array, NC hides DT, PF hides SD', () => {
  update(v2({ state: 5, play: { mods: { name: 'HDDTNCPFSD', array: [{ acronym: 'HD' }, { acronym: 'DT' }, { acronym: 'NC' }, { acronym: 'PF' }, { acronym: 'SD' }] } } }));
  const srcs = el('mods').children.map((m) => m.children[0].attributes.src);
  assert.deepEqual(srcs, ['images/mods/hidden.png', 'images/mods/nightcore.png', 'images/mods/perfect.png']);
  update(v2({ state: 5, play: { mods: { name: '', array: [] } } }));
  assert.equal(el('mods').children.length, 0);
});

test('mod icons fall back to parsing mods.name', () => {
  update(v2({ state: 5, play: { mods: { name: 'HRFL' } } }));
  const srcs = el('mods').children.map((m) => m.children[0].attributes.src);
  assert.deepEqual(srcs, ['images/mods/hardrock.png', 'images/mods/flashlight.png']);
});

test('backgrounds come from /files/beatmap/<folder>/<file>', () => {
  update(v2({ state: 5, folders: { beatmap: 'A B' }, files: { background: 'c d.jpg' } }));
  const css = "url('http://127.0.0.1:24050/files/beatmap/A%20B/c%20d.jpg')";
  assert.equal(el('song_box_img').style.background, css);
  assert.equal(el('cutin_bg_view').style.background, css);
  assert.equal(el('cutin_bgbox').style.background, css);
});
