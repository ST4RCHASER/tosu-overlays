import WebSocketManager from './js/socket.js';

const PLAY = 2;
const EMPTY_BG = "url('images/empty.jpg')";

const $ = (id) => document.getElementById(id);
const bg = $('main_box');
const songArtist = $('song_artist');
const songTitle = $('song_title');
const mapperName = $('mapper_name_txt');
const diffName = $('diff_name_txt');
const top = $('top');
const bottom = $('bottom');
const percent = Object.fromEntries(['95', '96', '97', '98', '99', '100'].map((k) => [k, $(`percent_num_${k}`)]));

function truncate(str, length = 100, ending = '...') {
  str = str ?? '';
  return str.length > length ? str.substring(0, length - ending.length) + ending : str;
}

let state;
let bgKey;

// Served by every tosu version as /files/beatmap/<beatmap folder>/<file>; the 2.6+ shortcut /files/beatmap/background is not.
function backgroundUrl(data) {
  const folder = data.folders?.beatmap;
  const file = data.files?.background;
  if (!folder || !file) return null;
  return `http://${window.location.host}/files/beatmap/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
}

function loadBackground(url) {
  if (!url) { bg.style.background = EMPTY_BG; return; }
  const img = new Image();
  img.onload = () => { bg.style.background = `url('${url}')`; };
  img.onerror = () => { bg.style.background = EMPTY_BG; };
  img.src = url;
}

export function update(data) {
  const bm = data.beatmap;
  songTitle.innerHTML = truncate(bm.title, 22);
  songArtist.innerHTML = truncate(bm.artist, 22);
  mapperName.innerHTML = truncate(bm.mapper, 12, '');
  diffName.innerHTML = truncate(bm.version, 12, '');

  const acc = data.performance.accuracy;
  for (const k of Object.keys(percent)) percent[k].innerHTML = Math.round(acc[k] || 0);

  const bgUrl = backgroundUrl(data);
  if (bgKey !== bgUrl) {
    bgKey = bgUrl;
    loadBackground(bgUrl);
  }

  if (state !== data.state.number) {
    state = data.state.number;
    if (state === PLAY) {
      top.classList.remove('hide');
      setTimeout(() => { if (state === PLAY) bottom.classList.remove('hide'); }, 500);
    } else {
      top.classList.add('hide');
      bottom.classList.add('hide');
    }
  }
}

if (typeof window.WebSocket === 'function') {
  const socket = new WebSocketManager(window.location.host);
  socket.api_v2(update, ['state', 'beatmap', 'performance', 'folders', 'files']);
}
