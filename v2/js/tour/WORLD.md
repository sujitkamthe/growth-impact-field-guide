# Tour: the world and the contract

Read `STORYBOARD.md` first. This file is the contract between the world (`world.js` and friends), the chapters (`chapters/<id>.js`) and the player (`player.js`, `../views/tour.js`), so each can be built separately. `chapters/arrival.js` is the worked example.

## Modules

| File | What it is |
|---|---|
| `script.js` | Narration: `CHAPTERS` (id, title, beats) and `VOICES`. Read-only for everyone but the lead. |
| `layout.js` | The map: every place as named `[x, z]` coordinates (`places`), the explorer's walkable `paths`, painted `roads`, `houses`, `plots`, area `districts` and their banners, `landmarks` (for `discover`), camera `SHOTS`, cumulative fog `REVEALS` and the chapter-boundary `states`. Chapters refer to places by name. |
| `world.js` | `createWorld(canvas, hudRoot, { reducedMotion, onProgress })` → `Promise<world>`: loads assets, builds the valley, people, fog and HUD. `onProgress(k)` gets a fraction 0–1. |
| `world/` | The world's parts: `assets.js` (loading, baking props to vertex colours), `terrain.js`, `warfog.js` (fog of war), `water.js`, `sky.js` (sun, sky, time of day), `scatter.js` (vegetation), `village.js` (buildings and props), `people.js`, `hud.js` + `hud.css`, `geom.js`, `util.js`. |
| `chapters/<id>.js` | One per chapter id in `script.js`. |
| `preview.html` | Dev preview of one chapter with a scrubber, or of the world itself (see its header comment). |

Imports: `import * as THREE from 'three'` and `'three/addons/...'` through the import map in `index.html` (`preview.html` has its own). Vendored add-ons: `loaders/GLTFLoader.js`, `utils/SkeletonUtils.js`, `utils/BufferGeometryUtils.js`, `objects/Reflector.js`, `libs/meshopt_decoder.module.js` (the people models are meshopt-compressed). Assets: `v2/assets/tour/{nature,town,survival,people}`, all CC0, licences beside them; only what `world/assets.js` lists is kept (`PROPS`), so add a model there before using it.

## Coordinates

Metres on the ground as `[x, z]`: +x east, −z north (the default camera looks north). Heights are y. Facing angles are degrees clockwise from north seen from above: 0 north, 90 east, 180 south, 270 west. The valley is 140 × 140 m (x and z from −70 to 70); the terrain runs on to ±110 under permanent fog.

## The frame contract

Every frame the player does: `world.reset(time.clock)` → hide every chapter group → show the active one → `chapter.update(world, group, time)` → `world.render()`. A frame never depends on the one before, so pause, seek and skip just work. `time` is `{ t, duration, beat, beatT, beatStarts, beatEnds, clock }`: seconds into the chapter, its length, the current beat, progress through it (0–1), each beat's start and end, and `clock`, the seconds since the film started. Beat lengths come from the narration audio and vary, so key motion to beats, finish each beat's motion by about 80% of it, and make each beat's end state read on its own (reduced motion renders only end states).

`reset(clock)` takes the film clock so the looping ambience (windmill and mill wheel, water, wind in the trees and banners, flames, idle breathing, the fog's drift) is deterministic. If the player calls `reset()` with no argument the world falls back to wall-clock time, which still looks right but is not repeatable.

```js
export default {
    id: 'scopes',
    build(world) { return new world.THREE.Group(); },  // once: chapter-only props
    update(world, group, time) { /* set everything from time */ },
};
```

## The world API (what `world` offers chapters)

- `world.THREE`, `world.scene`, `world.camera`, `world.renderer`, `world.layout` (all of `layout.js`), `world.reducedMotion`, and `world.SHOTS`, `world.REVEALS`, `world.states` (the same objects as in `layout.js`).
- `world.util`: timing helpers `clamp01(x)`, `seg(t, a, b)` (progress of t through a..b, clamped), `mix(a, b, k)`, `smooth(a, b, x)`, and `ease.{inOut, sine, out, in, bump}`.
- `world.clock` (the clock this frame was reset with), `world.timeOfDay`, `world.currentShot`.

**Camera**
- `world.shot(s)`: `s` is a `SHOTS` name or `{ target: [x, y, z], distance, yaw, pitch, fov }`; returns the full shot. `yaw` is where the camera stands around the target in degrees (0 south of it looking north, 90 east of it looking west), `pitch` degrees down from level, `fov` vertical degrees. The game view is pitch about 50° with a telephoto fov of 28°. Shots are framed for 16:9; narrower screens keep the same width in view.
- `world.lerpShot(a, b, k, { eased = true })`: glides between two shots (names or objects); k is eased inside, distance changes geometrically, yaw takes the short way round.
- Shots in `layout.js`: `overview`, `close` (the film's last), `arrivalHigh`, `start`, `camp`, `campClose`, `crossroads`, `stoneRing`, `stoneRingHigh`, `noticeBoard`, `noticeBoardClose`, `lake` (low, for the reflection), `lakeHigh`, `plot`, `neighbours`, `village`, `square`, `market`, `houses`, `bridge`, `wider`, `fire`. Follow the explorer with `world.shot({ ...SHOTS.camp, target: world.explorer.pos })`.
- The lake mirrors the scene only when the camera is low (pitch under about 20°); from above the water is shaded without the extra pass.

**People**: `world.explorer` and `world.villagers` (11, each dressed differently; index them freely). Every method returns the person, so calls chain.
- `person.place([x, z], facing)`: stands them there (on the ground) and shows them.
- `person.walk(path, k, { idle = 'Idle' })`: `path` is a `layout.paths` name or an array of `[x, z]`; k 0–1 along it. Positions them, faces the direction of travel, plays Walk with its phase from the distance walked (about 1.0 m per clip-second, measured from the clip's feet, so the stride matches any pace and feet never slide) and eases into the idle clip over the first and last half metre. Pass an eased k for natural starts and stops; real walking pace is about 1.4 m/s.
- `person.play(clip, seconds, { weight = 1 })`: clips `Idle`, `Idle_Neutral`, `Walk`, `Wave`, `Interact`, at `seconds` into the clip (looping). With weight < 1 the clip is layered over the current pose (for a wave while standing, say).
- `person.lookAt([x, z], k)`: turns towards a point by k (0 keeps the facing). `person.face(deg)` sets the facing outright.
- `person.nod(k)`: one small dip of the head as k runs 0 → 1.
- `person.show(alpha)`: fades them (0 hides).
- `explorer.ring(alpha)`: the soft selection ring under the explorer (shown by default).
- Read-only: `person.pos` (`[x, y, z]` of their feet), `person.facing`, `person.stride`.
- `world.reset()` hides every villager and puts the explorer at `places.camp`, idle, facing 45°.

**Ground**: `world.heightAt(x, z)` is the exact height of the (faceted) terrain, for placing chapter props.

**Fog of war**
- `world.fog.set(reveals)`: `reveals` is the whole list of `{ x, z, r }` circles for this frame (everything revealed so far plus anything growing now). Each circle is clear to about r and fades out over a few metres, with a faint fine drift of mist in the edge. Outside them the valley lies under a strategy game's shroud: still legible but dimmed, drained of colour and cooled, with hills, the river and lake (darker), woods and buildings as muted shapes and their shadows intact; it deepens with distance from explored land and towards the map's rim.
- `world.fog.between(a, b, k)`: from one cumulative list to a longer one, the extra circles growing in one after another as k goes 0 → 1.
- `world.fog.grow(circle, k)`: one circle at eased radius `r * k`.
- `world.fog.patch(material)`: puts a chapter prop's material (standard, lambert, basic or points) under the shroud like the world's own; call once in `build`. `{ fade: true }` makes an additive glow simply vanish under it instead.
- `world.REVEALS`: cumulative lists at chapter ends: `start`, `afterArrival`, `afterPrinciples`, `afterScopes` (= `afterAreas`, `afterExpectations`, `afterFeedback`, `afterSelfAssessment`: the village and its edges), `afterGrowth` (across the river), `final`, and `scopeWider` (the Scopes chapter's "Wider" beat: the fog rolled back across the river for a moment; it should roll in again by the chapter's end, since the explorer first crosses the bridge in Growth).

**Places**
- `world.discover(name, k)`: raises a small red pennant at a landmark (`layout.landmarks`: `camp`, `crossroads`, `stoneRing`, `noticeBoard`, `lake`, `plot`, `neighbours`, `village`, `market`, `houses`, `bridge`, `hamlet`, `windmill`) and, while 0 < k < 1, shows the HUD's "Discovered" toast with its label. Keep calling it with k ≥ 1 in later frames to keep the pennant up.
- `world.banners(areaKey, k)`: unfurls an area's banners (`cd`, `pt`, `oc`), each a moment after the last. Furled, a banner is a short roll of colour under its crossbar.
- `world.props`:
  - `noticeSheet.show(k)` (0 hidden → 1 pinned to the board, rising from the hand) and `noticeSheet.write(k)` (0 blank → 1 four lines of writing).
  - `cart.place([x, z], facing)`, `cart.along(path, k)` (rolls along a path name or points, tilting with the ground; `paths.cartRoute` runs from the market over the bridge), `cart.load(k)` (crates appear one by one), `cart.show(on)`. By default it stands empty at `places.cart`.
  - `campfire.light(k)`: the evening fire in the square at `places.fire`, with log seats; k fades it in. The camp's own fire always burns.
  - `ratingFlags.raise(i, k)`: the three flags by the fountain (0 Client & Delivery, 1 People & Team, 2 Building Sahaj) rise on their poles as k goes 0 → 1.
  - `windmill`, `watermill`: their pivots (they turn by themselves with the clock).

**Light**: `world.setTimeOfDay(hours)`, about 6 (sunrise) to 19 (dusk), up to 20 for night falling; moves the sun (east, south, west), its colour, the sky, the haze and the fog's tint, and lights the lanterns and windows from about 17. The shadow map is redrawn only when the sun moves, so a sun that sweeps every frame costs more; fine for one chapter.

**HUD** (in `hudRoot`; the player positions that element over the canvas and the HUD fills it)
- `hud.quest(title, progress)`: the quest box, top left. `progress` like `'3/5'` draws segments; `null` hides them.
- `hud.toast(text, k, { label })`: a toast, top centre, fading in and out over k (visible for 0 < k < 1). `discover()` uses it with the label "Discovered".
- `hud.notes(count)`: the notes counter under the quest box.
- `hud.card(lines, k, { label = 'A note' })`: a parchment card on the right, fading in and out over k, one numbered line per entry.
- `hud.rows(rows, k)`: area rows under the quest box; `rows` is `[{ area: 'cd', rating: 'Meets' | null }]` or `[['cd', 'Meets'], ...]`. A null rating shows an empty dashed slot; a newly set one pops.
- `hud.clear()` (reset does it) and `hud.show(on)`.

**Lifecycle**: `world.reset(clock)`, `world.render()`, `world.resize()` (call on container resize), `world.dispose()`, and `world.applyState(name)`, which applies a `layout.states` entry (shot, explorer position and facing, reveals, time of day): handy for a chapter's first frame.

## Rules

- Chapters only choreograph: they place people, move the camera, set reveals and the time of day, and call the HUD. Anything a chapter builds itself goes in its own group (use `world.heightAt` to stand it on the ground). Its materials are not shrouded unless you pass them through `world.fog.patch(material)`, so either do that or keep chapter props inside revealed areas.
- Chapter boundaries join up: each chapter's first frame matches the previous chapter's last (camera shot, explorer position, reveals, time of day). The joins are `layout.states` (`start`, `afterArrival`, `afterPrinciples`, `afterScopes`, `afterAreas`, `afterExpectations`, `afterFeedback`, `afterSelfAssessment`, `afterGrowth`, `end`); start a chapter from the previous state and end on your own. Your strengths (`strengths`) sits between Areas and Your quest and starts and ends on `afterAreas`, so it has no state of its own.
- Calm, game-like motion: eased camera glides, real walking speeds (about 1.4 m/s), no snapping. No "level up" language or effects.

## Performance notes

One draw call per person (Talon World's fused skinned mesh), one for the whole merged village, one per vegetation model (instanced); the fog of war is computed in the materials themselves and costs no draw calls, so a full view is 50–70. On an M-series MacBook at 2560 × 1440 the GPU spends about 5 ms a frame (under 11 ms at worst) in the overview with growing reveals, in the lake shot with its reflection, and while the sun sweeps. Building the world takes about 0.3 s after the 2.3 MB of models arrive.
