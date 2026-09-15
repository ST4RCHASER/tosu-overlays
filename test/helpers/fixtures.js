// Slices of a real /websocket/v2 payload, enough for the overlays under test.
export function v2({ state = 0, play = {}, beatmap = {}, performance = {}, resultsScreen = {}, settings = {}, folders = {}, files = {} } = {}) {
  return {
    state: { number: state, name: '' },
    folders: { game: 'C:\\osu!', songs: 'C:\\osu!\\Songs', beatmap: '1011011 nekodex - new beginnings', ...folders },
    files: { beatmap: 'x.osu', background: 'new-beginnings.jpg', audio: 'audio.mp3', ...files },
    settings: {
      chatVisibilityStatus: { number: 0, name: 'hidden', ...settings.chatVisibilityStatus }
    },
    beatmap: {
      checksum: 'abc',
      status: { number: 4, name: 'ranked' },
      set: 575767,
      time: { live: 0, firstObject: 0, lastObject: 0, mp3Length: 0, ...beatmap.time },
      artist: 'nekodex', title: 'circles!', mapper: 'peppy', version: 'Insane',
      ...beatmap,
      stats: {
        stars: { live: 5.1, total: 6.37 },
        ar: { original: 9, converted: 10.33 },
        cs: { original: 4, converted: 5.2 },
        od: { original: 8, converted: 9.5 },
        hp: { original: 6, converted: 7 },
        ...(beatmap.stats ?? {})
      }
    },
    play: {
      hits: { 0: 0, 50: 0, 100: 0, 300: 0, geki: 0, katu: 0, sliderBreaks: 0, ...play.hits },
      combo: { current: 0, max: 0, ...play.combo },
      mods: { number: 0, name: '', ...play.mods },
      rank: { current: 'X', maxThisPlay: 'X', ...play.rank },
      pp: { current: 0, fc: 0, maxAchievedThisPlay: 0, ...play.pp },
      unstableRate: play.unstableRate ?? 0
    },
    performance: {
      accuracy: { 95: 100.4, 96: 120, 97: 140.6, 98: 170, 99: 210, 100: 260.9, ...performance.accuracy },
      graph: { series: [], xaxis: [], ...performance.graph }
    },
    resultsScreen: {
      hits: { 0: 0, 50: 0, 100: 0, 300: 0, geki: 0, katu: 0, ...resultsScreen.hits },
      rank: 'X',
      pp: { current: 0, fc: 0, ...resultsScreen.pp }
    }
  };
}
