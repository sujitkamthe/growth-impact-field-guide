// People: Quaternius natural-proportion characters (CC0) with Idle, Idle_Neutral, Interact, Walk and
// Wave clips. As in Talon World, each character's skinned parts (one per flat colour) are fused into
// ONE skinned mesh with the colours baked into its vertices, so a person is one draw call; recolouring
// those vertex colours by material name gives every villager their own clothes, hair and skin.
//
// Animation is stateless, like the rest of the world: every frame each person's mixer is set to the
// exact clip times and weights the chapter asked for (never accumulated), so seeking just works. A
// walk's clip time comes from the distance walked divided by the speed the Walk clip's feet move at
// (measured from the clip itself), so feet never slide whatever the pace.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { DEG, clamp01, smooth, lerpAngle, polyline, smoothLine, ease } from './util.js';
import { makeBlob } from './village.js';
import * as L from '../layout.js';

export const CLIPS = ['Idle', 'Idle_Neutral', 'Interact', 'Walk', 'Wave'];

// Who's who. colors: the pack's material name -> colour. Casual: White top, Orange trousers, Grey
// shoes. Formal: LimeGreen dress, Red hair and shoes, Gold belt. Suit: Black suit and shoes, White
// shirt. All: Skin, Hair_Blond (the hair), Hair_Brown (brows).
export const LOOKS = {
    // The explorer wears Sahaj indigo (a touch brighter than the brand's, so they read from the high camera).
    explorer: { base: 'Casual', height: 1.72, colors: { White: '#4a4fb3', Orange: '#2f3140', Grey: '#4b3527', Hair_Blond: '#2a1c12', Hair_Brown: '#2a1c12', Skin: '#a9714b' } },
    villagers: [
        { base: 'Suit', height: 1.78, colors: { Black: '#4c5160', White: '#efe9dc', Hair_Blond: '#17110c', Hair_Brown: '#17110c', Skin: '#9a6440' } },
        { base: 'Formal', height: 1.66, colors: { LimeGreen: '#b4573c', Red: '#21160f', Gold: '#d8b45c', Skin: '#7a4a2e' } },
        { base: 'Casual', height: 1.75, colors: { White: '#ece2cc', Orange: '#5b6a3a', Grey: '#3a2a20', Hair_Blond: '#14100c', Hair_Brown: '#14100c', Skin: '#8a5636' } },
        { base: 'Formal', height: 1.68, colors: { LimeGreen: '#d7b469', Red: '#4a2c1a', Gold: '#7a5232', Skin: '#e0b08a' } },
        { base: 'Suit', height: 1.74, colors: { Black: '#7a5a3c', White: '#efe6d4', Hair_Blond: '#c9a36a', Hair_Brown: '#8a6a40', Skin: '#e8c09a' } },
        { base: 'Casual', height: 1.7, colors: { White: '#7f9cb6', Orange: '#3d3a36', Grey: '#2f2a26', Hair_Blond: '#5a3a22', Hair_Brown: '#3a2616', Skin: '#c58c64' } },
        { base: 'Formal', height: 1.64, colors: { LimeGreen: '#5c7f86', Red: '#17110c', Gold: '#c9a050', Skin: '#b07850' } },
        { base: 'Casual', height: 1.77, colors: { White: '#9c6b9e', Orange: '#c9b58f', Grey: '#3a2a20', Hair_Blond: '#1b1410', Hair_Brown: '#1b1410', Skin: '#6e4329' } },
        { base: 'Suit', height: 1.8, colors: { Black: '#2f3b52', White: '#d9e2ea', Hair_Blond: '#3a2616', Hair_Brown: '#2a1a10', Skin: '#c99470' } },
        { base: 'Formal', height: 1.7, colors: { LimeGreen: '#6b8a4a', Red: '#8a3a22', Gold: '#e2c27a', Skin: '#8d5a3b' } },
        { base: 'Casual', height: 1.73, colors: { White: '#e0a83a', Orange: '#4a3a2c', Grey: '#2f2a26', Hair_Blond: '#2d1d12', Hair_Brown: '#2d1d12', Skin: '#5e3a24' } },
    ],
};

function flatCopy(at) {
    if (!at.isInterleavedBufferAttribute) return at.clone();
    const src = at.data.array;
    const out = new src.constructor(at.count * at.itemSize);
    for (let i = 0; i < at.count; i++) for (let k = 0; k < at.itemSize; k++) out[i * at.itemSize + k] = src[i * at.data.stride + at.offset + k];
    return new THREE.BufferAttribute(out, at.itemSize, at.normalized);
}

// One skinned mesh for the whole character, coloured per vertex from its parts' materials.
function fuse(scene, colors = {}) {
    const root = cloneSkinned(scene);
    const meshes = [];
    root.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
    const parts = [];
    for (const m of meshes) {
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        const src = m.geometry;
        const groups = src.groups.length ? src.groups : [{ start: 0, count: src.index ? src.index.count : src.getAttribute('position').count, materialIndex: 0 }];
        for (const grp of groups) {
            const mat = mats[grp.materialIndex ?? 0];
            const g = new THREE.BufferGeometry();
            for (const a of ['position', 'normal', 'skinWeight']) g.setAttribute(a, flatCopy(src.getAttribute(a)));
            g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Uint16Array.from(flatCopy(src.getAttribute('skinIndex')).array), 4));
            const idx = src.index.array.slice(grp.start, grp.start + grp.count);
            g.setIndex(new THREE.BufferAttribute(idx, 1));
            const c = colors[mat.name] ? new THREE.Color(colors[mat.name]) : mat.color.clone();
            const n = g.getAttribute('position').count, col = new Float32Array(n * 3);
            for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
            g.setAttribute('color', new THREE.BufferAttribute(col, 3));
            parts.push({ g, mesh: m });
        }
    }
    // Parts of different meshes carry the same vertices separately; merge them all.
    const merged = mergeGeometries(parts.map(p => p.g));
    const first = meshes[0];
    const body = new THREE.SkinnedMesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 }));
    body.name = 'body';
    body.frustumCulled = false;
    body.position.copy(first.position); body.quaternion.copy(first.quaternion); body.scale.copy(first.scale);
    first.parent.add(body);
    body.bind(first.skeleton, first.bindMatrix);
    for (const m of meshes) m.removeFromParent();
    return root;
}

// The speed (model units a clip-second) at which the Walk clip's planted foot moves backwards,
// i.e. how fast the body must travel for that foot to stay put on the ground.
function measureWalk(model, clip) {
    const mixer = new THREE.AnimationMixer(model);
    const act = mixer.clipAction(clip);
    act.play();
    const foot = model.getObjectByName('FootL') || model.getObjectByName('Foot.L');
    const N = 120, dt = clip.duration / N;
    const ys = [], zs = [];
    const v = new THREE.Vector3();
    const inv = new THREE.Matrix4();
    for (let i = 0; i <= N; i++) {
        act.time = i * dt;
        mixer.update(0);
        model.updateMatrixWorld(true);
        inv.copy(model.matrixWorld).invert();
        foot.getWorldPosition(v).applyMatrix4(inv);
        ys.push(v.y); zs.push(v.z);
    }
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const speeds = [];
    for (let i = 1; i < N; i++) {
        if (ys[i] < minY + (maxY - minY) * 0.12) speeds.push(-(zs[i + 1] - zs[i - 1]) / (2 * dt));
    }
    speeds.sort((a, b) => a - b);
    act.stop();
    mixer.uncacheRoot(model);
    return Math.abs(speeds[Math.floor(speeds.length / 2)] || 1);
}

const pathCache = new Map();
function getPath(path) {
    if (typeof path !== 'string' && !Array.isArray(path)) return path;
    const key = typeof path === 'string' ? path : JSON.stringify(path);
    if (!pathCache.has(key)) {
        const pts = typeof path === 'string' ? L.paths[path] : path;
        if (!pts) throw new Error(`Tour world: unknown path "${path}"`);
        pathCache.set(key, polyline(smoothLine(pts, 6)));
    }
    return pathCache.get(key);
}

export function createPeople({ gltfs, heightAt, patch, scene }) {
    const bases = new Map();
    for (const [name, gltf] of gltfs) {
        const clips = new Map(gltf.animations.map(c => [c.name, c]));
        bases.set(name, { scene: gltf.scene, clips, speed: null });
    }
    const people = [];
    let seed = 0;

    function make(look, { explorer = false } = {}) {
        const base = bases.get(look.base);
        const model = cloneSkinned(fuse(base.scene, look.colors));
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const scale = look.height / (box.max.y - box.min.y);
        if (base.speed === null) base.speed = measureWalk(cloneSkinned(model), base.clips.get('Walk'));
        const body = model.getObjectByName('body');
        body.material = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, transparent: true }));
        body.castShadow = false;
        body.receiveShadow = true;
        const root = new THREE.Group();
        const inner = new THREE.Group();
        inner.scale.setScalar(scale);
        inner.add(model);
        root.add(inner);
        const blob = makeBlob(0.95, 0.95, patch);
        scene.add(root, blob);
        let ring = null;
        if (explorer) {
            // a soft selection ring, as under a selected unit in a strategy game
            ring = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.52, 40), patch(new THREE.MeshBasicMaterial({
                color: '#fff4dc', transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
            })));
            ring.rotation.x = -Math.PI / 2;
            ring.renderOrder = 3;
            scene.add(ring);
        }
        const mixer = new THREE.AnimationMixer(model);
        const actions = {};
        for (const c of CLIPS) {
            const clip = base.clips.get(c);
            if (!clip) continue;
            const a = mixer.clipAction(clip);
            a.play();
            a.enabled = false;
            actions[c] = a;
        }
        const neck = model.getObjectByName('Neck'), head = model.getObjectByName('Head');
        // The pose the mixer last wrote to the bones a nod bends. three's PropertyMixer only writes
        // a bone when its value changes, and the neck's track is constant in most clips, so a nod
        // applied on top would otherwise stay and build up frame after frame. Each commit puts these
        // bones back to the mixer's pose first, then the nod is applied fresh.
        const nodBones = [neck, head].filter(Boolean);
        const mixerPose = nodBones.map(() => new THREE.Quaternion());
        let nodded = false;
        const stride = base.speed * scale;      // metres walked per clip-second
        const phase = (seed++ * 1.37) % 3;

        const st = {};
        const person = {
            name: explorer ? 'explorer' : `villager${people.length}`,
            root, look, stride,
            get pos() { return [st.x, heightAt(st.x, st.z), st.z]; },
            get facing() { return st.facing; },
            _reset(clock) {
                st.visible = explorer;
                st.alpha = 1;
                st.x = L.places.camp[0]; st.z = L.places.camp[1]; st.facing = 45;
                st.base = { clip: 'Idle', t: clock + phase };
                st.over = null;
                st.nod = 0;
                st.clock = clock;
                st.ring = explorer ? 1 : 0;
            },
            // Stands the person at [x, z] facing `facing` degrees (and shows them).
            place([x, z], facing = st.facing) {
                st.x = x; st.z = z; st.facing = facing; st.visible = true;
                return person;
            },
            // Walks along a path (a layout path name or [x, z] points), k 0..1 of the way.
            walk(path, k, { idle = 'Idle' } = {}) {
                const line = getPath(path);
                const d = line.total * clamp01(k);
                const a = line.at(d);
                const b0 = line.at(d - 0.7), b1 = line.at(d + 0.7);
                st.x = a.x; st.z = a.z;
                const dx = b1.x - b0.x, dz = b1.z - b0.z;
                if (dx * dx + dz * dz > 1e-6) st.facing = Math.atan2(dx, -dz) / DEG;
                st.visible = true;
                // ease into and out of the stride over the first and last half metre
                const w = smooth(0, 0.55, Math.min(d, line.total - d));
                st.base = { clip: 'Walk', t: d / stride, w, idle: { clip: idle, t: st.clock + phase } };
                return person;
            },
            // Plays a clip at `seconds` into it (looping). weight < 1 layers it over the base pose.
            play(clip, seconds = 0, { weight = 1 } = {}) {
                if (weight >= 0.999) { st.base = { clip, t: seconds }; st.over = null; }
                else st.over = { clip, t: seconds, w: Math.max(0, weight) };
                return person;
            },
            // Turns towards [x, z] by k (0 keeps the current facing, 1 faces it fully).
            lookAt([x, z], k = 1) {
                const target = Math.atan2(x - st.x, -(z - st.z)) / DEG;
                st.facing = lerpAngle(st.facing, target, clamp01(k));
                return person;
            },
            face(deg) { st.facing = deg; return person; },
            // A small dip of the head: k 0..1 runs one nod.
            nod(k) { st.nod = ease.bump(k); return person; },
            show(alpha = 1) { st.alpha = alpha; st.visible = alpha > 0.002; return person; },
            ring(alpha) { st.ring = alpha; return person; },
            _commit() {
                const vis = st.visible && st.alpha > 0.002;
                root.visible = blob.visible = vis;
                if (ring) ring.visible = vis && st.ring > 0.01;
                if (!vis) return;
                const y = heightAt(st.x, st.z);
                root.position.set(st.x, y, st.z);
                root.rotation.y = (180 - st.facing) * DEG;
                blob.position.set(st.x, y + 0.03, st.z);
                blob.material.opacity = 0.75 * st.alpha;
                if (ring) { ring.position.set(st.x, y + 0.05, st.z); ring.material.opacity = 0.42 * st.ring * st.alpha; }
                body.material.opacity = st.alpha;
                body.material.depthWrite = st.alpha > 0.98;
                // weights: the base clip (with its idle blend for walks) and an optional overlay
                const want = {};
                const add = (clip, t, w) => { if (!actions[clip] || w <= 0) return; want[clip] = want[clip] ? { t: want[clip].t, w: want[clip].w + w } : { t, w }; };
                const over = st.over ? clamp01(st.over.w) : 0;
                const b = st.base;
                if (b.clip === 'Walk' && b.idle) {
                    add('Walk', b.t, (1 - over) * b.w);
                    add(b.idle.clip, b.idle.t, (1 - over) * (1 - b.w));
                } else add(b.clip, b.t, 1 - over);
                if (st.over) add(st.over.clip, st.over.t, over);
                for (const [name, a] of Object.entries(actions)) {
                    const w = want[name];
                    if (!w) { a.enabled = false; continue; }
                    a.enabled = true;
                    a.setEffectiveWeight(w.w);
                    const dur = a.getClip().duration;
                    a.time = ((w.t % dur) + dur) % dur;
                }
                if (nodded) nodBones.forEach((b, i) => b.quaternion.copy(mixerPose[i]));
                mixer.update(0);
                nodBones.forEach((b, i) => mixerPose[i].copy(b.quaternion));
                nodded = false;
                if (st.nod > 0.001 && neck) {
                    // a small forward dip, about 15 degrees at its deepest, shared by neck and head
                    tilt(neck, st.nod * 0.15, root);
                    if (head) tilt(head, st.nod * 0.11, root);
                    nodded = true;
                }
            },
        };
        people.push(person);
        return person;
    }

    const explorer = make(LOOKS.explorer, { explorer: true });
    const villagers = LOOKS.villagers.map(l => make(l));
    return {
        explorer, villagers, all: people,
        reset(clock) { for (const p of people) p._reset(clock); },
        commit() { for (const p of people) p._commit(); },
    };
}

// Tips a bone forward about the character's own sideways axis.
const _qa = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _ax = new THREE.Vector3();
function tilt(bone, angle, root) {
    root.updateMatrixWorld(true);
    root.getWorldQuaternion(_qa);
    _ax.set(1, 0, 0).applyQuaternion(_qa);
    bone.parent.getWorldQuaternion(_qp);
    // in the parent's space: q' = parent^-1 * R(world axis) * parent * q
    const rw = new THREE.Quaternion().setFromAxisAngle(_ax, angle);
    const local = _qp.clone().invert().multiply(rw).multiply(_qp);
    bone.quaternion.premultiply(local);
}
