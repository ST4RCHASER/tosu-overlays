import WebSocketManager from './js/socket.js';

// osu! stable client states (tosu state.number uses the same enum)
const EDIT = 1, PLAY = 2, SELECT_EDIT = 4, SELECT_PLAY = 5, RESULT = 7, MATCH_SETUP = 12, SELECT_MULTI = 13, RANKING_VS = 14;
const BOXES_VISIBLE_STATES = new Set([SELECT_PLAY, SELECT_EDIT, SELECT_MULTI, RESULT, PLAY, EDIT, RANKING_VS]);
const PROGRESS_WIDTH = 1110;
const CUTIN_MS = 1500;
const SMOOTH_WINDOW = 2;

const $ = (id) => document.getElementById(id);
const diffBoxes = [1, 2, 3, 4, 5].map((i) => $(`diff_box_${i}`));
const ppPercentBox = $('pp_percent_box');
const countingBox = $('counting_box');
const count100 = $('count_100');
const count50 = $('count_50');
const count0 = $('count_0');
const csBox = $('cs_box');
const arBox = $('ar_box');
const starBox = $('star_box');
const odBox = $('od_box');
const hpBox = $('hp_box');
const ppBoxes = { 100: $('pp_100'), 99: $('pp_99'), 98: $('pp_98'), 97: $('pp_97'), 96: $('pp_96') };
const progressChart = $('progress');
const progressBox = $('progress_box');
const miniPpBox = $('mini_pp');
const miniPpNum = $('mini_pp_num');
const cutin = $('cutin');
const cutinTitle = $('cutin_title');
const cutinArtist = $('cutin_artist');
const cutinBgBox = $('cutin_bgbox');
const cutinDiff = $('cutin_diff');
const cutinMapper = $('cutin_mapper');
const cutinBgView = $('cutin_bg_view');
const songBox = $('song_box');
const songBoxImg = $('song_box_img');
const songBoxTitle = $('song_box_title');
const songBoxArtist = $('song_box_artist');
const songBoxStatus = $('song_box_status');
const songBoxDiff = $('song_box_diff');
const songBoxMapId = $('song_box_map_id');
const modsBox = $('mods');

const MOD_IMAGES = {
  ez: 'easy', nf: 'nofail', ht: 'halftime', hr: 'hardrock', sd: 'suddendeath', pf: 'perfect', dt: 'doubletime',
  nc: 'nightcore', hd: 'hidden', fl: 'flashlight', rx: 'relax', ap: 'autopilot', so: 'spunout', at: 'autoplay',
  cn: 'cinema', v2: 'v2'
};

const MAP_STATUS = {
  0: ['UNKNOWN', '#7F7F7F'],
  1: ['UN SUBMIT', '#8866EE'],
  2: ['WIP', '#FFCC22'],
  4: ['RANKED', '#66CCFF'],
  5: ['APPROVED', '#88B300'],
  6: ['QUALIFIED', '#88B300'],
  7: ['LOVED', '#FF66AA']
};

const animeConfig = { easing: 'easeOutExpo' };

function chartConfig(border, fill) {
  return {
    type: 'line',
    data: { labels: [], datasets: [{ borderColor: border, backgroundColor: fill, data: [], fill: true }] },
    options: {
      tooltips: { enabled: false },
      legend: { display: false },
      elements: { line: { tension: 0.4, cubicInterpolationMode: 'monotone' }, point: { radius: 0 } },
      responsive: false,
      scales: { x: { display: false }, y: { display: false } }
    }
  };
}
const config = chartConfig('rgba(93, 98, 169, 0.6)', 'rgba(93, 98, 169, 0.4)');
const configSecond = chartConfig('rgba(93, 98, 169, 1)', 'rgba(93, 98, 169, 0.5)');
let lineChart, lineChartSecond;
if (typeof Chart !== 'undefined') {
  lineChart = new Chart($('canvas').getContext('2d'), config);
  lineChartSecond = new Chart($('canvasSecond').getContext('2d'), configSecond);
}

// Moving-average smoothing of the strain curve (same window as the original overlay).
function smooth(arr, windowSize) {
  if (!Array.isArray(arr)) return [];
  return arr.map((_, i) => {
    const from = Math.max(0, i - windowSize);
    const to = Math.min(arr.length, i + windowSize + 1);
    let sum = 0;
    for (let j = from; j < to; j++) sum += arr[j];
    return sum / (to - from);
  });
}

// tosu splits strains per skill; gosu shipped one combined curve. Sum aim+speed for osu!, all series otherwise.
function combinedStrains(graph) {
  const series = graph?.series ?? [];
  if (series.length === 0) return [];
  const osu = series.filter((s) => s.name === 'aim' || s.name === 'speed');
  const use = osu.length > 0 ? osu : series;
  const len = Math.max(...use.map((s) => s.data.length));
  const out = new Array(len).fill(0);
  for (const s of use) s.data.forEach((v, i) => { out[i] += v; });
  return out;
}

function diffColor(stars) {
  if (stars >= 6.5) return '#000000';
  if (stars >= 5.3) return '#8866EE';
  if (stars >= 4.0) return '#FF66AA';
  if (stars >= 2.7) return '#FFCC22';
  if (stars >= 2.0) return '#66CCFF';
  return '#88B300';
}

// Prefer tosu's structured mod list; fall back to chunking the acronym string.
function modAcronyms(mods) {
  const list = Array.isArray(mods.array) && mods.array.length > 0
    ? mods.array.map((m) => m.acronym.toLowerCase())
    : (mods.name || '').toLowerCase().match(/.{1,2}/g) ?? [];
  const set = new Set(list);
  if (set.has('nc')) set.delete('dt');
  if (set.has('pf')) set.delete('sd');
  return [...set];
}

function renderMods(mods) {
  modsBox.innerHTML = '';
  for (const acr of modAcronyms(mods)) {
    if (!MOD_IMAGES[acr]) continue;
    const mod = document.createElement('div');
    mod.setAttribute('class', 'mod');
    const img = document.createElement('img');
    img.setAttribute('src', `images/mods/${MOD_IMAGES[acr]}.png`);
    mod.appendChild(img);
    modsBox.appendChild(mod);
  }
}

const setDiffBoxClass = (cls, on) => diffBoxes.forEach((b) => (on ? b.classList.add(cls) : b.classList.remove(cls)));
const toggle = (el, cls, on) => (on ? el.classList.add(cls) : el.classList.remove(cls));

// Mod-adjusted value when tosu has computed it, base value otherwise.
const stat = (s) => (s.converted > 0 ? s.converted : s.original);

let state, chatState, mapStatus, mapSetId, title, artist, mapper, difficultyName, bgKey, modsKey, strainsKey, graphLen;
let hit100, hit50, hitMiss, currentPp, fullTime, seek, cutinUntil = 0, songBoxShown = false;
let mapAttribute = { cs: 0, ar: 0, star: 0, od: 0, hp: 0 };
let animateNumber, animatePpCounter;
const ppScore = { 100: 0, 99: 0, 98: 0, 97: 0, 96: 0 };

// Served by every tosu version as /files/beatmap/<beatmap folder>/<file>; the 2.6+ shortcut /files/beatmap/background is not.
function backgroundUrl(data) {
  const folder = data.folders?.beatmap;
  const file = data.files?.background;
  if (!folder || !file) return '';
  return `http://${window.location.host}/files/beatmap/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

function setBackground(url) {
  const css = url ? `url('${url}')` : 'none';
  cutinBgView.style.background = css;
  cutinBgBox.style.background = css;
  songBoxImg.style.background = css;
}

function applyChatLayout() {
  setDiffBoxClass('chat_diff_box', chatState === 2);
  toggle(progressBox, 'chat', chatState > 0);
  toggle(miniPpBox, 'chat', chatState > 0);
  const chatMode = (chatState === 1 && state !== PLAY) || chatState > 1;
  toggle(ppPercentBox, 'chat_mode', chatMode);
  toggle(countingBox, 'chat_mode', chatMode);
}

function applyStateLayout() {
  const visible = BOXES_VISIBLE_STATES.has(state);
  setDiffBoxClass('hide_diff_box', !visible);
  toggle(ppPercentBox, 'hide_box', !visible);
  toggle(countingBox, 'hide_box', !visible);

  const playing = state === PLAY;
  setDiffBoxClass('center_diff_box', playing);
  toggle(ppPercentBox, 'top', playing);
  toggle(countingBox, 'top', playing);
  toggle(countingBox, 'hide', !playing);
  toggle(progressBox, 'hide', !playing);

  const editing = state === EDIT;
  setDiffBoxClass('edit_diff_box', editing);
  toggle(ppPercentBox, 'edit', editing);
  toggle(countingBox, 'edit', editing);
  toggle(progressBox, 'edit', editing);
  toggle(miniPpBox, 'edit', editing);
}

export function update(data) {
  const bm = data.beatmap;
  const next = data.state.number;

  // Cut-in auto-hide (time based, independent of tosu's poll rate).
  if (!cutin.classList.contains('hide') && (state !== PLAY || Date.now() >= cutinUntil)) cutin.classList.add('hide');

  const bgUrl = backgroundUrl(data);
  if (bgKey !== bgUrl) {
    bgKey = bgUrl;
    setBackground(bgUrl);
  }
  if (title !== bm.title) {
    title = bm.title ?? '';
    cutinTitle.innerHTML = title;
    toggle(songBoxTitle, 'scroll', title.length > 30);
    songBoxTitle.innerHTML = title;
  }
  if (artist !== bm.artist) {
    artist = bm.artist;
    cutinArtist.innerHTML = artist;
    songBoxArtist.innerHTML = artist;
  }
  if (mapper !== bm.mapper) {
    mapper = bm.mapper;
    cutinMapper.innerHTML = `Creator: ${mapper}`;
  }
  if (difficultyName !== bm.version) {
    difficultyName = bm.version;
    cutinDiff.innerHTML = difficultyName;
    songBoxDiff.innerHTML = difficultyName;
  }

  const nextChat = data.settings.chatVisibilityStatus.number;
  const chatChanged = chatState !== nextChat;
  chatState = nextChat;

  if (state !== next) {
    const enteringPlay = next === PLAY && (state === SELECT_PLAY || state === MATCH_SETUP);
    state = next;
    if (enteringPlay && (title ?? '').length > 1) {
      cutin.classList.remove('hide');
      cutinUntil = Date.now() + CUTIN_MS;
    }
    applyStateLayout();
    applyChatLayout();
  } else if (chatChanged) {
    applyChatLayout();
  }

  // Song box: shown in menu/play when chat is not fullscreen, after a short delay.
  if ((state === PLAY || state === 0) && (title ?? '').length > 0 && chatState < 2) {
    songBoxDiff.style.backgroundColor = diffColor(bm.stats.stars.total);
    if (!songBoxShown) {
      songBoxShown = true;
      setTimeout(() => songBox.classList.remove('hide'), 2500);
    }
  } else {
    songBox.classList.add('hide');
    songBoxShown = false;
  }

  const hits = data.play.hits;
  if (hit100 !== hits['100']) { hit100 = hits['100']; count100.innerHTML = hit100 > 0 ? hit100 : 0; }
  if (hit50 !== hits['50']) { hit50 = hits['50']; count50.innerHTML = hit50 > 0 ? hit50 : 0; }
  if (hitMiss !== hits['0']) { hitMiss = hits['0']; count0.innerHTML = hitMiss > 0 ? hitMiss : 0; }

  const acc = data.performance.accuracy;
  const ppChanged = Object.keys(ppScore).some((k) => acc[k] !== ppScore[k]);
  if (ppChanged && !(animatePpCounter && !animatePpCounter.completed)) {
    animatePpCounter = anime({
      ...animeConfig,
      targets: ppScore,
      100: acc['100'], 99: acc['99'], 98: acc['98'], 97: acc['97'], 96: acc['96'],
      update: () => { for (const k of Object.keys(ppBoxes)) ppBoxes[k].innerHTML = ppScore[k].toFixed(0); }
    });
  }

  const graph = data.performance.graph;
  const nextStrainsKey = graph ? `${bm.checksum}:${graph.series?.map((s) => `${s.name}${s.data.length}`).join(',')}` : '';
  if (strainsKey !== nextStrainsKey && lineChart) {
    strainsKey = nextStrainsKey;
    const smoothed = smooth(combinedStrains(graph), SMOOTH_WINDOW);
    config.data.datasets[0].data = smoothed;
    config.data.labels = smoothed;
    configSecond.data.datasets[0].data = smoothed;
    configSecond.data.labels = smoothed;
    lineChart.update();
    lineChartSecond.update();
  }

  if (fullTime !== bm.time.lastObject) fullTime = bm.time.lastObject;
  if (seek !== bm.time.live && fullTime > 0) {
    seek = bm.time.live;
    const px = Math.round((PROGRESS_WIDTH / fullTime) * seek);
    progressChart.style.width = `${px}px`;
    miniPpBox.style.marginLeft = `${px}px`;
  }

  if (currentPp !== data.play.pp.current) {
    currentPp = data.play.pp.current;
    miniPpNum.innerHTML = currentPp > 0 ? Math.round(currentPp) : 0;
  }
  toggle(miniPpBox, 'hide', !(state === PLAY && currentPp > 0));

  if (mapStatus !== bm.status.number) {
    mapStatus = bm.status.number;
    const [text, color] = MAP_STATUS[mapStatus] ?? [`UNKNOWN/${mapStatus}`, '#7F7F7F'];
    songBoxStatus.innerHTML = text;
    songBoxStatus.style.backgroundColor = color;
  }
  if (mapSetId !== bm.set) {
    mapSetId = bm.set;
    songBoxMapId.innerHTML = mapSetId < 1 ? 'Not available' : mapSetId;
  }

  const nextModsKey = data.play.mods.array ? data.play.mods.array.map((m) => m.acronym).join('') : data.play.mods.name;
  if (modsKey !== nextModsKey) {
    modsKey = nextModsKey;
    renderMods(data.play.mods);
  }

  animateStats(bm.stats);
}

function animateStats(stats) {
  const target = { cs: stat(stats.cs), ar: stat(stats.ar), od: stat(stats.od), hp: stat(stats.hp), star: stats.stars.total };
  const changed = Object.keys(target).some((k) => target[k] !== mapAttribute[k]);
  if (!changed || (animateNumber && !animateNumber.completed)) return;
  animateNumber = anime({
    ...animeConfig,
    targets: mapAttribute,
    ...target,
    update: () => {
      csBox.innerHTML = mapAttribute.cs.toFixed(2);
      arBox.innerHTML = mapAttribute.ar.toFixed(2);
      odBox.innerHTML = mapAttribute.od.toFixed(2);
      hpBox.innerHTML = mapAttribute.hp.toFixed(2);
      starBox.innerHTML = mapAttribute.star.toFixed(2);
    },
    complete: () => { mapAttribute = { ...target }; }
  });
}

if (typeof window.WebSocket === 'function') {
  const socket = new WebSocketManager(window.location.host);
  socket.api_v2(update, ['state', 'settings', 'beatmap', 'play', 'performance', 'folders', 'files']);
}
