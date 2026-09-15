import WebSocketManager from './js/socket.js';

const PLAY = 2, RESULT = 7, RANKING_VS = 14;
const isResult = (s) => s === RESULT || s === RANKING_VS;

const $ = (id) => document.getElementById(id);
const pp = $('pp_box_num');
const ppFcBox = $('pp_fc_box');
const ppBox = $('pp_box');
const ppFcNum = $('pp_fc_num');
const hun = $('green');
const fifty = $('purple');
const miss = $('red');
const hitCountingBox = $('hit_counting_box');
const starNum = $('star_num');
const modsTxt = $('mods_txt');
const arBox = $('ar_box');
const odBox = $('od_box');
const csBox = $('cs_box');
const hpBox = $('hp_box');
const modsLabel = $('mods_txtt');
const modsValue = $('mods_txttt');
const vec = $('vec');
const resultPp = $('result_pp');
const result100 = $('result_100');
const result50 = $('result_50');
const result0 = $('result_0');

const playBoxes = [hitCountingBox, ppBox, ppFcBox, arBox, odBox, hpBox, csBox, modsLabel, modsValue];

if (typeof Odometer !== 'undefined') {
  for (const el of [hun, fifty, miss, pp, ppFcNum]) new Odometer({ el, format: 'd' });
}

// Mod-adjusted value when tosu has computed it, base value otherwise.
const stat = (s) => (s.converted > 0 ? s.converted : s.original);

function revealPlay() {
  let step = 0;
  ppBox.classList.remove('hide');
  let inter;
  inter = setInterval(() => {
    step++;
    if (state !== PLAY) { clearInterval(inter); return; }
    if (step === 1) ppFcBox.classList.remove('hide');
    if (step === 2) hitCountingBox.classList.remove('hide');
    if (step === 3) { modsLabel.classList.remove('hide'); modsValue.classList.remove('hide'); }
    if (step === 4) for (const el of [arBox, odBox, hpBox, csBox]) el.classList.remove('hide');
    if (step >= 5) clearInterval(inter);
  }, 500);
}

function revealResult() {
  let step = 0;
  vec.classList.remove('hide');
  resultPp.classList.remove('hide');
  let inter;
  inter = setInterval(() => {
    step++;
    result100.classList.remove('hide_result');
    if (step === 2) result50.classList.remove('hide_result');
    if (step === 3) result0.classList.remove('hide_result');
    if (step >= 4) clearInterval(inter);
  }, 200);
}

function hideResult() {
  vec.classList.add('hide');
  resultPp.classList.add('hide');
  for (const el of [result100, result50, result0]) el.classList.add('hide_result');
}

let state;

export function update(data) {
  const next = data.state.number;
  const play = data.play;
  const stats = data.beatmap.stats;

  pp.innerHTML = play.pp.current > 0 ? Math.round(play.pp.current) : 0;
  ppFcNum.innerHTML = play.pp.fc > 0 ? Math.round(play.pp.fc) : 0;

  if (state !== next) {
    const prev = state;
    state = next;
    if (next === PLAY) revealPlay();
    if (prev === PLAY && isResult(next)) revealResult();
    if (!isResult(next)) hideResult();
  }

  arBox.innerHTML = `AR: ${stat(stats.ar).toFixed(2)}`;
  odBox.innerHTML = `OD: ${stat(stats.od).toFixed(2)}`;
  csBox.innerHTML = `CS: ${stat(stats.cs).toFixed(2)}`;
  hpBox.innerHTML = `HP: ${stat(stats.hp).toFixed(2)}`;

  if (state !== PLAY) for (const el of playBoxes) el.classList.add('hide');

  modsTxt.innerHTML = play.mods.name ? play.mods.name : 'NM';

  const hits = play.hits;
  hun.innerHTML = hits['100'] > 0 ? hits['100'] : 0;
  fifty.innerHTML = hits['50'] > 0 ? hits['50'] : 0;
  miss.innerHTML = hits['0'] > 0 ? hits['0'] : 0;

  // Result screen has its own snapshot in v2; play.* is stale/reset by then. Older tosu lacks resultsScreen.pp.
  const rs = data.resultsScreen;
  const hitsSrc = isResult(state) && rs?.hits ? rs.hits : play.hits;
  const ppSrc = isResult(state) && rs?.pp ? rs.pp : play.pp;
  resultPp.innerHTML = `${ppSrc.current > 0 ? Math.round(ppSrc.current) : 0}pp`;
  result100.innerHTML = hitsSrc['100'] > 0 ? hitsSrc['100'] : 0;
  result50.innerHTML = hitsSrc['50'] > 0 ? hitsSrc['50'] : 0;
  result0.innerHTML = hitsSrc['0'] > 0 ? hitsSrc['0'] : 0;

  if (stats.stars.total > 0) starNum.innerHTML = stats.stars.total.toFixed(2);
}

if (typeof window.WebSocket === 'function') {
  const socket = new WebSocketManager(window.location.host);
  socket.api_v2(update, ['state', 'play', 'beatmap', 'resultsScreen']);
}
