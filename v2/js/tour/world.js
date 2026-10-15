// The tour's world: a low-poly valley seen from a strategy game's high camera, covered in fog of
// war, with an explorer and villagers. createWorld() loads the models, builds the valley from
// layout.js and returns the API chapters choreograph (see WORLD.md for the contract).
//
// Every frame the player calls reset(), the chapter's update() sets what it wants, then render()
// applies it all at once. Nothing carries over from one frame to the next except caches, so the
// player can pause, seek and skip freely.

import * as THREE from 'three';
import * as layout from './layout.js';
import { loadAssets } from './world/assets.js';
import { createTerrain } from './world/terrain.js';
import { createWarFog } from './world/warfog.js';
import { createSky } from './world/sky.js';
import { createWater } from './world/water.js';
import { scatter, swayMaterial } from './world/scatter.js';
import { buildVillage } from './world/village.js';
import { createPeople } from './world/people.js';
import { createHud } from './world/hud.js';
import { DEG, clamp01, mix, ease, lerpAngle, smooth, seg } from './world/util.js';

const { SHOTS, REVEALS, states } = layout;
const tick = () => new Promise(r => setTimeout(r, 0));

export async function createWorld(canvas, hudRoot, { reducedMotion = false, onProgress = () => {} } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    // the sun's own shadow.autoUpdate is off; sky.updateShadows() asks for a redraw when it moves

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.5, 2500);

    // ---- Load ------------------------------------------------------------------------------
    const progress = k => onProgress(Math.max(0, Math.min(1, k)));
    progress(0);
    const assets = await loadAssets(({ loaded, total }) => progress((loaded / total) * 0.82));
    await tick();

    // ---- Build -----------------------------------------------------------------------------
    const terrain = createTerrain();
    progress(0.86);
    await tick();
    const fog = createWarFog(layout.MAP.terrainHalf);
    const clockU = fog.uniforms.uWfTime;          // one clock uniform for every shader
    const sky = createSky(scene, renderer, layout.MAP.half + 8);

    // Terrain: the painted ground plus a fine mottle so close shots don't look smeared.
    terrain.mesh.material.onBeforeCompile = shader => {
        shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
            diffuseColor.rgb *= 0.92 + 0.08 * wfNoise(vWfPos.xz * 1.7) + 0.06 * wfNoise(vWfPos.xz * 6.3);`);
    };
    fog.patch(terrain.mesh.material);
    scene.add(terrain.mesh);
    // Beyond the terrain, a wide apron under permanent fog, so high shots never see past the edge.
    const apron = new THREE.Mesh(new THREE.RingGeometry(layout.MAP.terrainHalf - 8, 1400, 48, 1).rotateX(-Math.PI / 2),
        fog.patch(new THREE.MeshBasicMaterial({ color: 0x555555 })));
    apron.position.y = 9.5;
    scene.add(apron);

    const propMat = fog.patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 }));
    const plantMat = fog.patch(swayMaterial(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), clockU));
    const vegetation = scatter(assets, terrain.heightAt, plantMat);
    // rocks don't sway
    vegetation.children.forEach(m => { if (/^rock|^stone|lily/.test(m.name)) m.material = propMat; });
    scene.add(vegetation);
    progress(0.9);
    await tick();

    const water = createWater(terrain, fog.uniforms);
    scene.add(water.mesh);

    const village = buildVillage({ assets, heightAt: terrain.heightAt, material: propMat, patch: fog.patch, clock: clockU });
    scene.add(village.group);
    progress(0.95);
    await tick();

    // People walk on the ground, except on the bridge, where they follow its arched deck (the
    // terrain under it is the river bed).
    const [bridgeX] = layout.places.bridge;
    const deckZ = [-7.6, -15.6];
    const deckEnds = deckZ.map(z => terrain.heightAt(bridgeX, z) + 0.05);
    const walkHeight = (x, z) => {
        const k = (z - deckZ[0]) / (deckZ[1] - deckZ[0]);
        if (Math.abs(x - bridgeX) > 1.3 || k < 0 || k > 1) return terrain.heightAt(x, z);
        return deckEnds[0] + (deckEnds[1] - deckEnds[0]) * k + Math.sin(Math.PI * k) * 0.9 + 0.08;
    };
    const people = createPeople({ gltfs: assets.people, heightAt: walkHeight, patch: fog.patch, scene });

    const hud = createHud(hudRoot);

    // ---- Camera ------------------------------------------------------------------------------
    let current = { ...SHOTS.start };
    const target = new THREE.Vector3();
    const resolve = s => (typeof s === 'string' ? SHOTS[s] : s);
    function applyShot(s) {
        current = s;
        const yaw = s.yaw * DEG, pitch = s.pitch * DEG;
        target.set(...s.target);
        camera.position.set(
            target.x + s.distance * Math.sin(yaw) * Math.cos(pitch),
            target.y + s.distance * Math.sin(pitch),
            target.z + s.distance * Math.cos(yaw) * Math.cos(pitch),
        );
        camera.lookAt(target);
        // shots are framed for 16:9; on narrower screens keep the same width in view
        const ref = 16 / 9;
        let fov = s.fov ?? 28;
        if (camera.aspect < ref) {
            const h = 2 * Math.atan(Math.tan((fov * DEG) / 2) * ref);
            fov = Math.min(75, (2 * Math.atan(Math.tan(h / 2) / camera.aspect)) / DEG);
        }
        if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
        camera.updateMatrixWorld();
    }
    function shot(s) {
        s = resolve(s);
        const full = { target: [0, 0, 0], distance: 40, yaw: 0, pitch: 50, fov: 28, ...s };
        applyShot(full);
        return full;
    }
    // Glides between two shots: k 0..1 is eased here, distance changes geometrically.
    function lerpShot(a, b, k, { eased = true } = {}) {
        a = { fov: 28, ...resolve(a) }; b = { fov: 28, ...resolve(b) };
        const e = eased ? ease.inOut(clamp01(k)) : clamp01(k);
        return shot({
            target: a.target.map((v, i) => mix(v, b.target[i], e)),
            distance: Math.exp(mix(Math.log(a.distance), Math.log(b.distance), e)),
            yaw: lerpAngle(a.yaw, b.yaw, e),
            pitch: mix(a.pitch, b.pitch, e),
            fov: mix(a.fov, b.fov, e),
        });
    }

    // ---- Per-frame state ----------------------------------------------------------------------
    let clock = 0, hours = states.start.hours, reveals = REVEALS.start;

    const fogApi = {
        set(list) { reveals = list || []; },
        get reveals() { return reveals; },
        // Between two cumulative lists: the circles b adds over a grow in one after another as k
        // goes 0..1 (each eased), so a chapter can lift the fog over its places in order.
        between(a, b, k) {
            const extra = b.slice(a.length);
            if (!extra.length) return b.slice();
            const n = extra.length;
            return [...a, ...extra.map((c, i) => ({ ...c, r: c.r * ease.out(clamp01(k * n - i)) }))].filter(c => c.r > 0.05);
        },
        // One circle growing from nothing: r * eased k.
        grow(c, k) { return { ...c, r: c.r * ease.out(clamp01(k)) }; },
        // Puts a chapter prop's material under the shroud like the world's own.
        patch: (material, opts) => fog.patch(material, opts),
    };

    function reset(clockSeconds) {
        clock = typeof clockSeconds === 'number' ? clockSeconds : (typeof clockSeconds?.clock === 'number' ? clockSeconds.clock : performance.now() / 1000);
        people.reset(clock);
        village.reset();
        hud.clear();
        reveals = REVEALS.start;
        hours = states.start.hours;
        applyShot({ ...SHOTS.start });
    }

    // Applies a named chapter-boundary state (layout.states): shot, explorer, reveals, hours.
    function applyState(name) {
        const s = states[name];
        if (!s) throw new Error(`Tour world: unknown state "${name}"`);
        shot(s.shot);
        people.explorer.place(s.explorer.at, s.explorer.facing);
        reveals = s.reveals;
        hours = s.hours;
        return s;
    }

    function render() {
        clockU.value = clock;
        sky.apply(hours);
        fog.setColor(sky.state.fogColor, sky.state.fogLight);
        water.setSky(sky.dome.material.uniforms.uTop.value, sky.dome.material.uniforms.uHor.value, sky.state.sunDir, sky.sun.color);
        fog.set(reveals);
        people.commit();
        village.apply(clock, sky.state.dusk);
        sky.setHaze(current.distance);
        water.setReflect(1 - smooth(13, 24, current.pitch));
        sky.updateShadows();
        hud.commit();
        renderer.render(scene, camera);
    }

    function resize() {
        const w = canvas.clientWidth || canvas.width || 1, h = canvas.clientHeight || canvas.height || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        applyShot(current);
        const pr = renderer.getPixelRatio();
        water.setSize(w * pr * 0.5, h * pr * 0.5);
    }

    function dispose() {
        scene.traverse(o => {
            o.geometry?.dispose();
            const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
            mats.forEach(m => { m.map?.dispose(); m.dispose(); });
        });
        fog.texture.dispose();
        water.mesh.getRenderTarget().dispose();
        hud.el.remove();
        renderer.dispose();
    }

    const world = {
        THREE, scene, camera, renderer, layout, reducedMotion,
        // timing helpers for chapters: clamp01, seg(t, a, b), mix, smooth, ease.{inOut, sine, out, in, bump}
        util: { clamp01, seg, mix, smooth, ease },
        SHOTS, REVEALS, states,
        explorer: people.explorer,
        villagers: people.villagers,
        heightAt: terrain.heightAt,
        shot, lerpShot,
        get currentShot() { return current; },
        fog: fogApi,
        discover(name, k = 1) {
            const lm = layout.landmarks[name];
            if (!lm) throw new Error(`Tour world: unknown landmark "${name}"`);
            village.flag(name, k);
            if (k > 0 && k < 1) hud.toast(lm.label, k, { label: 'Discovered' });
        },
        banners(key, k) { village.banners(key, k); },
        props: village.props,
        setTimeOfDay(h) { hours = h; },
        get timeOfDay() { return hours; },
        get clock() { return clock; },
        hud,
        applyState,
        reset, render, resize, dispose,
    };

    resize();
    reset(0);
    // Compile every shader now (including the reflection and dusk lights) so the film never stalls.
    renderer.compile(scene, camera);
    sky.updateShadows(true);
    render();
    progress(1);
    return world;
}
