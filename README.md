# tosu-overlays

osu! stream overlays, ported from [gosumemory](https://github.com/l3lackShark/gosumemory) to the [tosu](https://github.com/tosuapp/tosu) `/websocket/v2` API.

Three remake themes under `remake/`, one folder each:

Code is not update since 2020 i just reupload to keep archive and not tested

```
remake/
  flyingtuna/   FlyingTunaRemake, FlyingTunaRemakeSong, design-assets (psd, OBS layer reference)
  ryuk/         PPCounter, UnstableRate
  sotarks/      SotarksRemake, design-assets (psd sources for both colour variants)
```

| Theme | Overlay | URL | Resolution | Shows |
|---|---|---|---|---|
| flyingtuna | `FlyingTunaRemake` | `http://127.0.0.1:24050/FlyingTunaRemake/` | 1920 x 1080 | pp, pp for FC, 100/50/miss, stars, mods, AR/OD/CS/HP, result-screen recap |
| flyingtuna | `FlyingTunaRemakeSong` | `http://127.0.0.1:24050/FlyingTunaRemakeSong/` | 1920 x 1080 | artist/title/mapper/diff, beatmap background, pp at 95–100% |
| ryuk | `PPCounter` | `http://127.0.0.1:24050/PPCounter/` | 1920 x 1080 | pp, SS pp, pp for FC, grade, 100/50/miss, slider breaks |
| ryuk | `UnstableRate` | `http://127.0.0.1:24050/UnstableRate/` | 300 x 100 | unstable rate during gameplay |
| sotarks | `SotarksRemake` | `http://127.0.0.1:24050/SotarksRemake/` | 1920 x 1080 | full-screen: song box + ranked status + mod icons, play cut-in, CS/AR/OD/HP/stars, pp at 96–100%, 100/50/miss, strain-graph progress bar with live pp |

## Install

1. Install and run [tosu](https://github.com/tosuapp/tosu/releases).
2. Copy the overlay folders you want (e.g. `remake/flyingtuna/FlyingTunaRemake`, not the theme folder itself) into tosu's `static/` directory next to `tosu.exe`.
3. In OBS add a Browser source with the URL from the table above. Reference OBS layer setup for the FlyingTuna theme is in `remake/flyingtuna/design-assets/obs_settings/`.

SotarksRemake ships two colour variants: default `images/` and `images_purple/`. To use purple, swap the folder names.

Each folder has a `metadata.txt`, so the overlays also appear in the tosu dashboard (`http://127.0.0.1:24050`).

## Development

Overlay logic lives in each folder's `index.js`, which exports `update(data)` and connects through the vendored `js/socket.js` (tosu's `WebSocketManager`). Each theme has its own `test/` folder. Tests drive `update()` against v2 payload fixtures with a minimal fake DOM (shared helpers in `test/helpers/`):

```sh
npm test
```

## Testing on macOS (osu! in Wineskin)

`tools/run-tosu-wine.sh` runs the latest tosu inside the `osu!Stable.app` prefix so it can read the game's memory, and copies every overlay here into tosu's `static/` folder (tosu 4.x refuses symlinked paths). After editing an overlay, run `tools/sync-overlays.sh` to re-copy; no tosu restart needed. The wrapper's wine 6.0.2 lacks two kernel32 exports that tosu needs, so the script first runs `tools/patch-wine-kernel32.py`, which adds them to the 64-bit `kernel32.dll` (backup kept as `kernel32.dll.orig`, `--restore` undoes it). Then open `http://127.0.0.1:24050/<Overlay>/` in a browser or OBS.

## gosumemory → tosu field map

```
menu.state                  → state.number
gameplay.hits[100/50/0]     → play.hits["100"/"50"/"0"]
gameplay.hits.sliderBreaks  → play.hits.sliderBreaks
gameplay.hits.unstableRate  → play.unstableRate
gameplay.hits.grade.current → play.rank.current  (XH/X/SH/S/A/B/C/D)
gameplay.pp.current/fc      → play.pp.current/fc
menu.mods.str               → play.mods.name
menu.bm.stats.AR/OD/CS/HP   → beatmap.stats.{ar,od,cs,hp}.converted (fallback .original)
menu.bm.stats.SR            → beatmap.stats.stars.total
menu.bm.metadata.*          → beatmap.{artist,title,mapper,version}
menu.pp["95".."100"]        → performance.accuracy["95".."100"]
menu.pp.strains             → performance.graph.series (aim+speed summed for osu!, all series otherwise)
menu.isChatEnabled          → settings.chatVisibilityStatus.number
menu.bm.rankedStatus        → beatmap.status.number
menu.bm.set                 → beatmap.set
menu.bm.time.current/full   → beatmap.time.live / beatmap.time.lastObject
/Songs/<bg path>            → /files/beatmap/background
result screen counts        → resultsScreen.hits / resultsScreen.pp
```
