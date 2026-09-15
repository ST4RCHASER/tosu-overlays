import WebSocketManager from './js/socket.js';

const PLAY = 2, SELECT_PLAY = 5, RESULT = 7, MATCH_SETUP = 12, RANKING_VS = 14;
const IN_PLAY_STATES = new Set([PLAY, RESULT, RANKING_VS]);

const hun = document.getElementById('count_100');
const fifty = document.getElementById('count_50');
const miss = document.getElementById('count_0');
const sb = document.getElementById('sb');
const fcBox = document.getElementById('fc_box');
const rank = document.getElementById('rank');
const box = document.getElementById('box');

const animation = {
  ppNum: new CountUp('pp_current_num', 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.' }),
  ppSs: new CountUp('pp_ss_num', 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.' }),
  ppFc: new CountUp('fc', 0, 0, 0, 0.5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.' })
};

// tosu gives the grade directly: XH/SH = silver (HD/FL), X/S = gold.
const GRADES = {
  XH: { text: 'S+', color: '#D3D3D3' },
  X: { text: 'S+', color: '#d6c253' },
  SH: { text: 'S', color: '#D3D3D3' },
  S: { text: 'S', color: '#d6c253' },
  A: { text: 'A', color: '#7ed653' },
  B: { text: 'B', color: '#53d4d6' },
  C: { text: 'C', color: '#d6538e' }
};
const GRADE_FALLBACK = { text: 'D', color: '#d65353' };

let state;

export function update(data) {
  const grade = GRADES[data.play.rank.current] ?? { ...GRADE_FALLBACK, text: data.play.rank.current || 'D' };
  rank.style.color = grade.color;
  rank.style.textShadow = `0 0 5px ${grade.color}`;
  rank.innerHTML = grade.text;

  animation.ppSs.update(data.performance.accuracy['100'] || 0);
  animation.ppNum.update(data.play.pp.current || 0);
  animation.ppFc.update(data.play.pp.fc || 0);

  const next = data.state.number;
  if (state !== next) {
    const enterPlay = next === PLAY && (state === SELECT_PLAY || state === MATCH_SETUP || state === RESULT);
    const playToResult = state === PLAY && next === RESULT;
    if (enterPlay || playToResult) box.classList.add('play');
    else box.classList.remove('play');
    state = next;
  }

  const hits = data.play.hits;
  hun.innerHTML = hits['100'] > 0 ? hits['100'] : 0;
  fifty.innerHTML = hits['50'] > 0 ? hits['50'] : 0;
  miss.innerHTML = hits['0'] > 0 ? hits['0'] : 0;

  const inPlay = IN_PLAY_STATES.has(state);
  if (hits['0'] > 0 && inPlay) fcBox.classList.remove('box_hide');
  else fcBox.classList.add('box_hide');

  if (hits.sliderBreaks > 0 && inPlay) {
    sb.innerHTML = `${hits.sliderBreaks}xSB`;
    sb.classList.remove('box_hide');
  } else {
    sb.innerHTML = '0xSB';
    sb.classList.add('box_hide');
  }
}

if (typeof window.WebSocket === 'function') {
  const socket = new WebSocketManager(window.location.host);
  socket.api_v2(update, ['state', 'play', 'performance']);
}
