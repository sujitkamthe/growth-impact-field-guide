// Shared choreography helpers for the tour chapters (principles, scopes, areas; others may import).
// Everything here is a pure function of time, so chapters stay stateless (see WORLD.md).
//
// People move along "legs": a leg is a path of [x, z] points plus a travel profile, keys of
// [seconds, metres along the path, metres a second] joined by cubic Hermite curves, so speed changes
// smoothly. `stroll()` makes a plain walk at a real pace; `catchUp()` makes a walk whose middle runs
// faster, for stretches the camera has left behind (a game cinematic's camera leads ahead to the next
// place and the walker arrives in frame at a real pace). `follow()` puts a person on a list of legs.

import { polyline, smoothLine, clamp01, mix, ease, angleDelta } from '../world/util.js';

export const PACE = 1.4;            // metres a second: an unhurried walk
const RAMP = 0.7;                   // seconds to get into or out of the stride

// at(i, f): the moment a fraction f of the way through beat i.
export function beatClock(time) {
    const { beatStarts, beatEnds } = time;
    return (i, f = 0) => beatStarts[i] + (beatEnds[i] - beatStarts[i]) * f;
}

// The smoothed polyline person.walk() follows for these points (same smoothing, same length).
const lines = new Map();
export function line(points) {
    const key = JSON.stringify(points);
    if (!lines.has(key)) lines.set(key, polyline(smoothLine(points, 6)));
    return lines.get(key);
}

// Distance along a leg at time t from keys [[t, d, v], ...].
export function travel(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
        const [t1, d1, v1] = keys[i];
        if (t < t1) {
            const [t0, d0, v0] = keys[i - 1];
            const T = t1 - t0, s = (t - t0) / T, s2 = s * s, s3 = s2 * s;
            return (2 * s3 - 3 * s2 + 1) * d0 + (s3 - 2 * s2 + s) * T * v0 + (-2 * s3 + 3 * s2) * d1 + (s3 - s2) * T * v1;
        }
    }
    return keys[keys.length - 1][1];
}

// A plain walk of `length` metres from rest at t0 to rest, at `pace`: { keys, end } (end = arrival).
export function stroll(t0, length, { pace = PACE, ramp = RAMP } = {}) {
    const r = Math.min(ramp, length / pace);
    const cruise = (length - pace * r) / pace;
    const end = t0 + 2 * r + cruise;
    return { end, keys: [[t0, 0, 0], [t0 + r, pace * r / 2, pace], [t0 + r + cruise, length - pace * r / 2, pace], [end, length, 0]] };
}

// A walk from rest at t0 to rest at t1 over `length` metres that is seen at a real pace for its first
// `head` and last `tail` metres; the stretch between (off camera) takes whatever time is left.
export function catchUp(t0, t1, length, { head = 0, tail = 0, pace = PACE, ramp = RAMP } = {}) {
    const k = [[t0, 0, 0]];
    const r = ramp, rd = pace * r / 2;
    let ta = t0 + r, da = rd;
    if (head > 0) { k.push([ta, da, pace]); ta += head / pace; da += head; }
    let tb = t1 - r, db = length - rd;
    const tailKey = [tb, db, pace];
    if (tail > 0) { tb -= tail / pace; db -= tail; }
    k.push([ta, da, pace], [tb, db, pace]);
    if (tail > 0) k.push(tailKey);
    k.push([t1, length, 0]);
    // drop duplicate times
    return k.filter((x, i) => i === 0 || x[0] > k[i - 1][0] + 1e-6);
}

// Puts `person` on a chronological list of legs { points, keys, idle }: before the first leg they
// stand at its start, between legs at the last one's end (facing the way they arrived), and on a
// leg they walk it. Returns { i, d, length, moving }.
export function follow(person, legs, t) {
    let i = 0;
    while (i + 1 < legs.length && t >= legs[i + 1].keys[0][0]) i++;
    const leg = legs[i];
    const L = line(leg.points);
    const d = Math.min(L.total, Math.max(0, travel(leg.keys, t)));
    person.walk(leg.points, d / L.total, leg.idle ? { idle: leg.idle } : undefined);
    const last = leg.keys[leg.keys.length - 1][0];
    return { i, d, length: L.total, moving: t > leg.keys[0][0] && t < last };
}

// Where a person following `legs` stands at time t, as [x, z] (for cameras and fog).
export function posOn(legs, t) {
    let i = 0;
    while (i + 1 < legs.length && t >= legs[i + 1].keys[0][0]) i++;
    const L = line(legs[i].points);
    const a = L.at(Math.min(L.total, Math.max(0, travel(legs[i].keys, t))));
    return [a.x, a.z];
}

// A camera that rides a list of keys [[t, shot], ...]: each shot a SHOTS name, a shot object, or a
// function of t returning one (to follow someone). Between keys it glides with a sine ease.
export function camera(world, t, keys) {
    const get = s => (typeof s === 'function' ? s(t) : s);
    if (t <= keys[0][0]) return world.shot(get(keys[0][1]));
    for (let i = 1; i < keys.length; i++) {
        if (t < keys[i][0]) {
            const [t0, a] = keys[i - 1], [t1, b] = keys[i];
            return world.lerpShot(get(a), get(b), ease.sine((t - t0) / (t1 - t0)), { eased: false });
        }
    }
    return world.shot(get(keys[keys.length - 1][1]));
}

// A shot with its target moved to [x, z] (height from the ground plus `lift`).
export function aim(world, shot, [x, z], lift = 0.9) {
    const s = typeof shot === 'string' ? world.SHOTS[shot] : shot;
    return { ...s, target: [x, world.heightAt(x, z) + lift, z] };
}

// Fog: `base` plus circles growing in, each { c, k } with k 0..1 (circles at k <= 0 are left out).
export function reveal(world, base, growing) {
    const out = base.slice();
    for (const { c, k } of growing) if (k > 0) out.push(world.fog.grow(c, k));
    return out;
}

// A circle that shrinks back to nothing as k goes 0 -> 1 (the fog rolling in again).
export function recede(c, k) {
    const e = ease.inOut(clamp01(k));
    return { ...c, r: c.r * (1 - e) };
}

// Turns a person towards the facing `deg` (degrees) by k, the short way round.
export function turnTo(person, deg, k) {
    return person.face(person.facing + angleDelta(person.facing, deg) * clamp01(k));
}

// A slow look around: the facing swings left and right of `base` by `amp` degrees and settles back.
export function lookAround(base, k, amp = 50) {
    if (k <= 0 || k >= 1) return base;
    return base + amp * Math.sin(k * Math.PI * 2) * ease.bump(Math.min(1, k * 1.25));
}

// An envelope over k: 0 at both ends, 1 in the middle, with soft shoulders `edge` wide.
const envelope = (k, edge = 0.18) => (k <= 0 || k >= 1 ? 0 : ease.sine(clamp01(k / edge)) * ease.sine(clamp01((1 - k) / edge)));

// A wave over k (layered over standing), the clip at `seconds`.
export function wave(person, k, seconds) {
    const w = envelope(k);
    return w > 0 ? person.play('Wave', seconds, { weight: Math.min(0.995, w) }) : person;
}

// Busy hands (Interact) over k, layered over standing, the clip at `seconds`.
export function work(person, k, seconds) {
    const w = envelope(k, 0.12);
    return w > 0 ? person.play('Interact', seconds, { weight: Math.min(0.995, w) }) : person;
}

// Landmarks discovered by the end of each chapter, so later chapters can keep their pennants up.
export const DISCOVERED = {
    afterPrinciples: ['crossroads', 'stoneRing', 'noticeBoard', 'lake'],
    afterScopes: ['crossroads', 'stoneRing', 'noticeBoard', 'lake', 'plot', 'neighbours', 'village'],
    afterAreas: ['crossroads', 'stoneRing', 'noticeBoard', 'lake', 'plot', 'neighbours', 'village', 'market', 'houses'],
};
export function keepDiscovered(world, list) {
    for (const name of list) world.discover(name, 1);
}

// ---- The village cast -------------------------------------------------------------------------------
// Who does what in Principles, Scopes and Areas, by villager index. The rest of the village (and these
// villagers once their part is done) follows _shared2.js's villageDay() and chatting() by the clock,
// which the later chapters use too, so every chapter boundary joins without anyone moving.
//   0      the neighbour in the wheat (Scopes), who goes to help in the garden (Areas)
//   1      watching from the square's south side
//   2      the cart hand, who loads the cart and pulls it over the bridge (Areas)
//   3, 6   the pair who wave by the lake (Principles), then walk on: 6 to chat in the square, 3 to buy
//          at the green stall (Scopes)
//   4, 5   reading the notice board (Principles, Scopes), then over to chat in the square (Areas)
export const CAST = {
    neighbour: { who: 0, at: [-15.4, 28.7], facing: 35, end: [-16.9, 31.0], endFacing: 350 },
    watcher: { who: 1, at: [2.6, 9.8], facing: 358.6 },
    cartHand: { who: 2, at: [9.0, -3.0], facing: 108 },
    readers: [{ who: 4, at: [-6.0, 8.4], facing: 72 }, { who: 5, at: [-6.1, 10.2], facing: 104 }],
    // the lake pair: where Principles leaves them, and their walks on in Scopes (ending on their
    // villageDay/chatting spots)
    pair: [
        { who: 6, from: [-7.3, 6.8], arrived: 155.3, path: [[-7.3, 6.8], [-5.6, 7.5], [-2.6, 7.8], [0.6, 8.8]], facing: 95 },
        { who: 3, from: [-8.2, 7.6], arrived: 149.0, path: [[-8.2, 7.6], [-7.6, 6.2], [-6.6, 3.2], [-4.0, 2.3], [-1.0, 1.9], [2.0, 1.8], [6.0, 0.6], [9.6, 1.6], [11.9, 1.9]], facing: 96, act: 'Interact', phase: 0.2 },
    ],
};

// Compass bearing (degrees clockwise from north) from a to b.
export function bearing([ax, az], [bx, bz]) {
    return (Math.atan2(bx - ax, -(bz - az)) * 180) / Math.PI;
}

// ---- The five principles' signs ---------------------------------------------------------------------
// A post with a painted plank at each principle's landmark, turned to face the camera that finds it.
// Principles raises them one by one; later chapters can build their own set and stand them all
// (buildSigns(world) in build, signs.set(i, 1) for each in update) so they stay in the world.
export const PRINCIPLE_SIGNS = [
    { n: 1, name: 'Growth is self-directed', at: [-31.4, 23.2], facing: 168 },     // the crossroads
    { n: 2, name: 'Clarity without hierarchy', at: [-35.2, 4.8], facing: 163 },    // inside the stone ring
    { n: 3, name: 'Transparency and trust', at: [-4.6, 5.2], facing: 292 },        // by the notice board
    { n: 4, name: 'Feedback is a habit', at: [-12.0, 6.6], facing: 323 },          // on the lake path
    { n: 5, name: 'Honest reflection', at: [-17.4, -0.9], facing: 16 },            // at the lake shore
];

function signTexture(THREE, renderer, text) {
    const W = 1024, H = 273;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const draw = () => {
        const c = canvas.getContext('2d');
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#d2a06a'); g.addColorStop(1, '#b8844f');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // a little grain
        c.globalAlpha = 0.13; c.strokeStyle = '#6b4325'; c.lineWidth = 3;
        for (let i = 0; i < 9; i++) {
            const y = 26 + i * 27 + Math.sin(i * 2.3) * 6;
            c.beginPath(); c.moveTo(0, y);
            for (let x = 0; x <= W; x += 64) c.lineTo(x, y + Math.sin(x * 0.011 + i) * 5);
            c.stroke();
        }
        c.globalAlpha = 1;
        c.strokeStyle = '#5a361d'; c.lineWidth = 14; c.strokeRect(7, 7, W - 14, H - 14);
        c.fillStyle = '#2a170b';
        c.textAlign = 'center'; c.textBaseline = 'middle';
        let size = 100;
        const font = sz => `600 ${sz}px "IBM Plex Sans", "Segoe UI", system-ui, sans-serif`;
        c.font = font(size);
        while (c.measureText(text).width > W - 110 && size > 40) { size -= 2; c.font = font(size); }
        c.fillText(text, W / 2, H / 2 + 4);
        tex.needsUpdate = true;
    };
    draw();
    if (document.fonts?.load) document.fonts.load('600 80px "IBM Plex Sans"').then(draw, () => {});
    return tex;
}

export function buildSigns(world) {
    const { THREE } = world;
    const group = new THREE.Group();
    group.name = 'principle-signs';
    const wood = world.fog.patch(new THREE.MeshStandardMaterial({ color: '#7a4f2e', roughness: 0.9 }), { sink: true });
    const edge = world.fog.patch(new THREE.MeshStandardMaterial({ color: '#a8743f', roughness: 0.9 }), { sink: true });
    const postGeo = new THREE.BoxGeometry(0.16, 2.4, 0.16).translate(0, 1.2, 0);
    const plankGeo = new THREE.BoxGeometry(3.0, 0.8, 0.09);
    const capGeo = new THREE.BoxGeometry(3.14, 0.08, 0.18);
    const lanternGeo = new THREE.BoxGeometry(0.2, 0.28, 0.2);
    const lanternMat = new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false });
    const glowTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const x = c.getContext('2d');
        const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
        return t;
    })();
    const signs = PRINCIPLE_SIGNS.map(({ n, name, at, facing }) => {
        const face = world.fog.patch(new THREE.MeshStandardMaterial({ map: signTexture(THREE, world.renderer, `${n} · ${name}`), roughness: 0.85 }), { sink: true });
        const g = new THREE.Group();
        const post = new THREE.Mesh(postGeo, wood);
        const plank = new THREE.Mesh(plankGeo, [edge, edge, edge, edge, face, edge]);
        plank.position.set(0, 1.86, 0.1);
        plank.rotation.x = -0.12;                    // leaning back a touch, towards a camera above
        const cap = new THREE.Mesh(capGeo, wood);
        cap.position.set(0, 2.3, 0.08);
        for (const m of [post, plank, cap]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
        // a lantern hung from the cap's end, and its glow (bright even under the shroud)
        const lantern = new THREE.Mesh(lanternGeo, lanternMat);
        lantern.position.set(1.42, 2.05, 0.12);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffbe6a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        glow.position.copy(lantern.position);
        glow.scale.setScalar(3.2);
        g.add(lantern, glow);
        g.rotation.y = ((180 - facing) * Math.PI) / 180;
        g.visible = false;
        group.add(g);
        return { g, at, glow };
    });
    return {
        group,
        // k 0..1: the sign rises out of the ground (0 hidden, 1 standing); glow: its lantern, 0..1
        set(i, k, glow = 0.3) {
            const { g, at } = signs[i];
            g.visible = k > 0.001;
            if (!g.visible) return;
            signs[i].glow.material.opacity = 0.85 * clamp01(glow) * clamp01(k * 2);
            signs[i].glow.visible = glow > 0.01;
            const e = ease.out(clamp01(k));
            g.position.set(at[0], world.heightAt(at[0], at[1]) - 2.6 * (1 - e), at[1]);
            g.rotation.z = 0.06 * Math.sin(e * Math.PI);     // a small wobble as it settles
        },
        all(k = 1, glow = 0.3) { for (let i = 0; i < signs.length; i++) this.set(i, k, glow); },
    };
}

// ---- Reach rings ------------------------------------------------------------------------------------
// The scopes drawn as a strategy game draws a selected unit's radius (layout.SCOPE_RINGS): a crisp
// glowing line hugging the ground with a soft halo, a faint inner glow for the scope in play, and a
// small floating name. A ring can be solid (the explorer's own reach), dashed and faint (the next
// scope, not yet theirs) or dimmed (an inner ring), and the Team ring has an arc per area, which
// fills in the area's colour.
export const AREA_GLOW = { cd: '#2fc4ad', pt: '#5b8fef', oc: '#e7a63e' };
export const AREA_NAMES = { cd: 'Client & Delivery', pt: 'People & Team', oc: 'Org & Community' };
// Sahaj lavender and indigo: the line, its brighter core, the faint inner glow, and the explorer's own ring
const RING = { line: '#c9cbf7', core: '#dcdcfb', fill: '#8d90e0', own: '#e3e4ff' };

// A ribbon on the ground round centre c from radius r0 (alpha a0) to r1 (alpha a1), from bearing
// `from` clockwise over `span` degrees, so a draw range sweeps it on. dash: metres on/off (0 = solid).
function ribbon(world, c, r0, r1, a0, a1, from, span, lift, colour = RING.line, dash = 0) {
    const THREE = world.THREE;
    const rm = Math.max(r0, r1);
    const n = Math.max(24, Math.round(rm * 7 * (span / 360)));
    const pos = [], col = [], idx = [];
    const water = world.layout.WATER_Y;
    const y = (x, z) => Math.max(world.heightAt(x, z), water + 0.03) + lift;
    for (let i = 0; i <= n; i++) {
        const b = ((from + (i / n) * span) * Math.PI) / 180;
        const sx = Math.sin(b), sz = -Math.cos(b);
        for (const [r, a] of [[r0, a0], [r1, a1]]) {
            const x = c[0] + sx * r, z = c[1] + sz * r;
            pos.push(x, y(x, z), z);
            col.push(1, 1, 1, a);
        }
        const arc = (i / n) * (span * Math.PI / 180) * rm;
        const on = !dash || Math.floor(arc / dash) % 2 === 0;
        if (i < n && on) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    g.setIndex(idx);
    const m = new THREE.MeshBasicMaterial({
        color: colour, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false,
        polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = 4;
    mesh.frustumCulled = false;
    mesh.visible = false;
    return { mesh, count: idx.length };
}

// A floating name in the HUD's font, a constant size on screen. accent: the pill's border colour.
export function floatingLabel(world, text, { accent = '#9fa2ee', size = 1 } = {}) {
    const THREE = world.THREE;
    const c = document.createElement('canvas');
    c.width = 768; c.height = 128;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    let aspect = 4;
    const draw = () => {
        const x = c.getContext('2d');
        x.clearRect(0, 0, c.width, c.height);
        x.font = '600 58px "IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
        const w = Math.min(c.width - 8, x.measureText(text).width + 64);
        const l = (c.width - w) / 2;
        x.fillStyle = 'rgba(51, 53, 125, 0.85)';          // Sahaj indigo
        x.beginPath(); x.roundRect(l, 20, w, 88, 44); x.fill();
        x.strokeStyle = accent; x.lineWidth = 5; x.stroke();
        x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText(text, c.width / 2, 67);
        tex.needsUpdate = true;
    };
    draw();
    if (document.fonts?.load) document.fonts.load('600 58px "IBM Plex Sans"').then(draw, () => {});
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, toneMapped: false }));
    s.scale.set(0.023 * (c.width / c.height) * size, 0.023 * size, 1);
    s.renderOrder = 6;
    s.visible = false;
    void aspect;
    return s;
}

// Builds every ring in layout.SCOPE_RINGS (or `keys` of them). labelAt: bearing for each name.
export function buildRings(world, { labelAt = {}, keys = Object.keys(world.layout.SCOPE_RINGS) } = {}) {
    const group = new world.THREE.Group();
    group.name = 'reach-rings';
    const defs = world.layout.SCOPE_RINGS;
    const rings = {};
    for (const key of keys) {
        const { name, c, r, arcs } = defs[key];
        const at = labelAt[key] ?? 20;
        const w = 0.22 + r * 0.011;                                  // wider lines for wider rings
        const part = (r0, r1, a0, a1, lift, colour = RING.line, dash = 0, from = at, span = 360) => {
            const p = ribbon(world, c, r0, r1, a0, a1, from, span, lift, colour, dash);
            group.add(p.mesh);
            return p;
        };
        const R = {
            core: part(r - w / 2, r + w / 2, 1, 1, 0.14, RING.core),
            haloIn: part(r - w * 2.4, r, 0, 1, 0.12),
            haloOut: part(r, r + w * 2.4, 1, 0, 0.12),
            fill: part(Math.max(0.5, r - Math.min(r * 0.35, 9)), r, 0, 1, 0.1, RING.fill),
            dash: part(r - w * 0.4, r + w * 0.4, 1, 1, 0.14, RING.line, Math.max(1.2, r * 0.045)),
            arcs: {},
        };
        for (const [area, [a0, a1]] of Object.entries(arcs || {})) {
            const span = ((a1 - a0) % 360 + 360) % 360;
            R.arcs[area] = {
                core: part(r - w * 0.75, r + w * 0.75, 1, 1, 0.16, AREA_GLOW[area], 0, a0, span),
                glow: part(r - w * 3, r + w * 3, 0, 0, 0.13, AREA_GLOW[area], 0, a0, span),
                glowIn: part(r - w * 3.2, r, 0, 1, 0.13, AREA_GLOW[area], 0, a0, span),
                glowOut: part(r, r + w * 3.2, 1, 0, 0.13, AREA_GLOW[area], 0, a0, span),
            };
        }
        const b = (at * Math.PI) / 180;
        const lr = r + w * 3;
        const lx = c[0] + Math.sin(b) * lr, lz = c[1] - Math.cos(b) * lr;
        R.tag = floatingLabel(world, name, { accent: '#9fa2ee' });
        R.tag.position.set(lx, Math.max(world.heightAt(lx, lz), world.layout.WATER_Y) + 1.6, lz);
        group.add(R.tag);
        rings[key] = R;
    }
    const coreCol = new world.THREE.Color(RING.core), lineCol = new world.THREE.Color(RING.line), ownCol = new world.THREE.Color(RING.own);
    const show = (p, k, opacity) => {
        p.mesh.visible = k > 0.002 && opacity > 0.002;
        p.mesh.geometry.setDrawRange(0, Math.floor((p.count / 6) * clamp01(k)) * 6);
        p.mesh.material.opacity = opacity;
    };
    return {
        group,
        // draw: 0..1 swept on; alpha: overall; fill: inner glow (the scope in play); pulse: 0..1 bump;
        // dashed: 0 solid .. 1 dashed and faint (not yet the explorer's); dim: 0..1 towards an inner ring
        // own: 0..1 towards the explorer's own ring (brightest)
        set(key, { draw = 0, alpha = 1, fill = 0, pulse = 0, dashed = 0, dim = 0, label = 1, own = 0 } = {}) {
            const R = rings[key];
            R.core.mesh.material.color.copy(coreCol).lerp(ownCol, clamp01(own));
            R.haloIn.mesh.material.color.copy(lineCol).lerp(ownCol, clamp01(own) * 0.6);
            R.haloOut.mesh.material.color.copy(R.haloIn.mesh.material.color);
            const a = alpha * (1 - 0.62 * dim);
            const solid = a * (1 - dashed);
            show(R.core, draw, solid * (0.9 + 0.1 * pulse));
            show(R.haloIn, draw, solid * (0.32 + 0.2 * own + 0.5 * pulse));
            show(R.haloOut, draw, solid * (0.32 + 0.2 * own + 0.5 * pulse));
            show(R.fill, draw, a * (0.16 * fill + 0.22 * pulse));
            show(R.dash, draw, alpha * dashed * 0.75);
            R.tag.visible = draw > 0.15 && alpha * label > 0.002;
            R.tag.material.opacity = alpha * label * (1 - 0.35 * dim) * clamp01((draw - 0.15) / 0.25);
        },
        // an area's arc on a ring filling in its colour, k 0..1 sweeping round it
        arc(key, area, k, alpha = 1) {
            const A = rings[key].arcs[area];
            show(A.core, k, alpha);
            show(A.glowIn, k, alpha * 0.4);
            show(A.glowOut, k, alpha * 0.4);
            A.glow.mesh.visible = false;
        },
    };
}

// A district's name floating over it (Areas, Growth): built once, shown with set(area, k).
export const DISTRICT_LABELS = { cd: [16.4, 1.6, 5.0], pt: [-4.0, 18.6, 4.6], oc: [4.4, 0.8, 4.2] };   // [x, z, height]
export function buildDistrictLabels(world) {
    const group = new world.THREE.Group();
    const tags = {};
    for (const [area, [x, z, h]] of Object.entries(DISTRICT_LABELS)) {
        const tag = floatingLabel(world, AREA_NAMES[area], { accent: AREA_GLOW[area], size: 1.05 });
        tag.position.set(x, world.heightAt(x, z) + h, z);
        group.add(tag);
        tags[area] = tag;
    }
    return {
        group,
        set(area, k) {
            const tag = tags[area];
            tag.visible = k > 0.002;
            tag.material.opacity = ease.out(clamp01(k));
        },
    };
}

// The HUD's three area rows, each with its own rating slot: empty (dashed) until `marked` has the
// area, then a soft mark in the area's colour, no rating words (the rows render their rating as markup).
export function areaSlots(marked) {
    return ['cd', 'pt', 'oc'].map(area => ({
        area,
        rating: marked.includes(area) ? '<span style="color:var(--tw-area);font-size:1.15em;line-height:1">●</span>' : null,
    }));
}

export { clamp01, mix, ease };
