import WebSocketManager from './js/socket.js';

const PLAY = 2;

const ur = document.getElementById('ur');
const counter = new CountUp('ur', 0, 0, 2, 1, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: ' ', decimal: '.' });

let state;

export function update(data) {
  if (state !== data.state.number) {
    state = data.state.number;
    ur.style.opacity = state === PLAY ? 1 : 0;
  }
  counter.update(data.play.unstableRate || 0);
}

if (typeof window.WebSocket === 'function') {
  const socket = new WebSocketManager(window.location.host);
  socket.api_v2(update, ['state', { field: 'play', keys: ['unstableRate'] }]);
}
