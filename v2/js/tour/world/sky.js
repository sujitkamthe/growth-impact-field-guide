// Light and sky: a warm sun with soft shadows, a hemisphere fill, a gradient sky dome with a glow
// around the sun, distance haze, and the time of day (6 sunrise to 19 dusk) that moves them all.
// The shadow map is redrawn only when the sun has moved, not every frame.

import * as THREE from 'three';
import { clamp, DEG, mix } from './util.js';

// Keyframes by hour: sky top and horizon, sun colour and strength, hemisphere sky/ground and
// strength, haze, and the fog of war's tint.
const KEYS = [
    { h: 5.5, top: '#3e5584', hor: '#e9a27c', sun: '#ff8a4a', si: 1.2, hs: '#8d9cc4', hg: '#4c4038', hi: 0.75, haze: '#d9a88e', fog: '#353a44' },
    { h: 6.5, top: '#5878ac', hor: '#f2c39a', sun: '#ffb57a', si: 2.0, hs: '#a9b9da', hg: '#5e5442', hi: 0.95, haze: '#ecc9a8', fog: '#404650' },
    { h: 8.5, top: '#6a9fd8', hor: '#d7e5ee', sun: '#ffe2bd', si: 2.9, hs: '#cfe0f5', hg: '#6c6a4c', hi: 1.15, haze: '#d6e3ea', fog: '#49505b' },
    { h: 12.5, top: '#5a96dc', hor: '#dbe9f3', sun: '#fff5e4', si: 3.2, hs: '#d8e7f8', hg: '#737152', hi: 1.25, haze: '#dce8ef', fog: '#4d545f' },
    { h: 15.5, top: '#6496d2', hor: '#e5e4d8', sun: '#ffe6c2', si: 3.0, hs: '#d8e2ef', hg: '#726a4c', hi: 1.18, haze: '#e2e2d6', fog: '#4b525d' },
    { h: 17.5, top: '#5371a8', hor: '#f0b583', sun: '#ffa865', si: 2.3, hs: '#b4bcd8', hg: '#5e4e3c', hi: 0.98, haze: '#eabd96', fog: '#414652' },
    { h: 19, top: '#2e3c69', hor: '#d27f62', sun: '#ff7444', si: 1.25, hs: '#7c84ae', hg: '#3a3036', hi: 0.7, haze: '#a98276', fog: '#2e323d' },
    { h: 20, top: '#1d2546', hor: '#8a5a5a', sun: '#ff6a40', si: 0.6, hs: '#5a6090', hg: '#2a2430', hi: 0.55, haze: '#5f4e58', fog: '#22252b' },
];
const COLOR_KEYS = ['top', 'hor', 'sun', 'hs', 'hg', 'haze', 'fog'];
const parsed = KEYS.map(k => {
    const o = { ...k };
    for (const c of COLOR_KEYS) o[c] = new THREE.Color(k[c]);
    return o;
});

export function createSky(scene, renderer, half) {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x666655, 1.2);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    const sc = sun.shadow.camera;
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half;
    sc.near = 1; sc.far = 400;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 2.5;
    sun.shadow.autoUpdate = false;
    scene.add(sun, sun.target);

    // The sky dome: a gradient from horizon to zenith, with a soft glow around the sun.
    const skyUniforms = {
        uTop: { value: new THREE.Color() },
        uHor: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) },
        uSunCol: { value: new THREE.Color() },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: /* glsl */`
            varying vec3 vDir;
            void main() {
                vDir = normalize(position);
                vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_Position = p.xyww;
            }`,
        fragmentShader: /* glsl */`
            uniform vec3 uTop, uHor, uSunDir, uSunCol;
            varying vec3 vDir;
            void main() {
                vec3 d = normalize(vDir);
                float h = clamp(d.y, -1.0, 1.0);
                vec3 col = mix(uHor, uTop, pow(smoothstep(-0.02, 0.6, h), 0.75));
                col = mix(col, uHor * 0.85, smoothstep(0.0, -0.3, h));
                float s = max(dot(d, uSunDir), 0.0);
                col += uSunCol * (pow(s, 8.0) * 0.25 + pow(s, 120.0) * 0.6) * smoothstep(-0.15, 0.05, h);
                gl_FragColor = vec4(col, 1.0);
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }`,
    }));
    dome.renderOrder = -10;
    dome.frustumCulled = false;
    scene.add(dome);

    scene.fog = new THREE.Fog(0xdde8ee, 200, 600);

    const state = { hours: -1, sunDir: new THREE.Vector3(), fogColor: new THREE.Color(), fogLight: new THREE.Color(), dusk: 0 };
    const lastShadowDir = new THREE.Vector3(0, -1, 0);
    let shadowDirty = true;

    // Interpolates the keyframes at hour h into the lights and the sky.
    function apply(h) {
        h = clamp(h, KEYS[0].h, KEYS.at(-1).h);
        if (h === state.hours) return;
        state.hours = h;
        let i = 1;
        while (i < parsed.length - 1 && parsed[i].h < h) i++;
        const a = parsed[i - 1], b = parsed[i];
        const k = clamp((h - a.h) / (b.h - a.h), 0, 1);
        const col = c => new THREE.Color().copy(a[c]).lerp(b[c], k);
        skyUniforms.uTop.value.copy(col('top'));
        skyUniforms.uHor.value.copy(col('hor'));
        sun.color.copy(col('sun'));
        sun.intensity = mix(a.si, b.si, k);
        hemi.color.copy(col('hs'));
        hemi.groundColor.copy(col('hg'));
        hemi.intensity = mix(a.hi, b.hi, k);
        scene.fog.color.copy(col('haze'));
        state.fogColor.copy(col('fog'));
        state.fogLight.copy(col('fog')).lerp(col('hor'), 0.28).multiplyScalar(1.3);
        state.dusk = clamp((h - 16.5) / 2.5, 0, 1);

        // The sun's path: rising in the east, high in the south at midday, setting in the west.
        const t = clamp((h - 6) / 13, -0.05, 1.05);
        const az = (90 + 180 * t) * DEG;
        const el = (4 + Math.sin(Math.PI * clamp(t, 0, 1)) * 54) * DEG;
        state.sunDir.set(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
        skyUniforms.uSunDir.value.copy(state.sunDir);
        skyUniforms.uSunCol.value.copy(sun.color).multiplyScalar(0.6);
        sun.position.copy(state.sunDir).multiplyScalar(220);
        sun.target.position.set(0, 0, 0);
        sun.updateMatrixWorld();
        sun.target.updateMatrixWorld();
        if (state.sunDir.angleTo(lastShadowDir) > 0.15 * DEG) shadowDirty = true;
    }

    return {
        sun, hemi, dome, state, apply,
        // Call once a frame before rendering: redraws the shadow map if the sun moved.
        updateShadows(force = false) {
            if (shadowDirty || force) {
                sun.shadow.needsUpdate = true;
                lastShadowDir.copy(state.sunDir);
                shadowDirty = false;
            }
        },
        invalidateShadows() { shadowDirty = true; },
        // Haze distance follows the camera, so close shots stay crisp and far ones soften.
        setHaze(cameraDistance) {
            scene.fog.near = cameraDistance + 40;
            scene.fog.far = cameraDistance * 2.4 + 260;
        },
    };
}
