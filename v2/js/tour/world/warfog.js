// Fog of war, as in a real-time strategy game's shroud: outside the revealed circles the valley is
// still there but dimmed and drained of colour under a cool blue-grey wash, so hills, the water,
// woods and buildings read as muted shapes, and it deepens the further the land lies from anywhere
// explored and towards the map's rim. The boundary is a clean soft gradient a few metres wide with
// only a fine drifting texture in it.
//
// How it works: the reveal circles are painted into a small mask canvas, which is uploaded as a
// texture only when they change. Red holds the revealed areas themselves; green holds a wide halo
// around them, so the shroud can deepen with distance. Every world material samples the mask at its
// own world position (patch(material) adds this through onBeforeCompile) and mixes its lit colour
// towards the shroud, so terrain, trees, houses, water and people are all treated alike and their
// shadows still match. The minimap draws the same circles.

import * as THREE from 'three';
import { clamp } from './util.js';

const SIZE = 256;
const NEAR = 30;      // metres: how far from explored land the shroud keeps deepening

export const WARFOG_GLSL = /* glsl */`
uniform sampler2D uWfMask;
uniform vec3 uWfRect;
uniform vec3 uWfColor;
uniform vec3 uWfLight;
uniform float uWfTime;
uniform float uWfOn;
float wfHash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float wfNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(wfHash(i), wfHash(i + vec2(1.0, 0.0)), u.x), mix(wfHash(i + vec2(0.0, 1.0)), wfHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// Raw mask (0 fogged .. 1 revealed) at a ground position; the edge wavers a little with fine noise.
float wfMaskAt(vec2 xz) {
    vec2 w = vec2(wfNoise(xz * 0.22 + uWfTime * 0.05), wfNoise(xz * 0.22 + 31.7 - uWfTime * 0.04)) - 0.5;
    float m = texture2D(uWfMask, (xz + w * 1.6 - uWfRect.xy) * uWfRect.z).r;
    return m + (wfNoise(xz * 0.9 + uWfTime * 0.12) - 0.5) * 0.08;
}
float wfVis(vec2 xz) { return uWfOn < 0.5 ? 1.0 : smoothstep(0.22, 0.78, wfMaskAt(xz)); }
// How near explored land is: 1 at its edge, 0 some thirty metres into the shroud.
float wfNear(vec2 xz) { return texture2D(uWfMask, (xz - uWfRect.xy) * uWfRect.z).g; }
vec3 wfShroud(vec3 col, vec3 wpos, float v) {
    float near = smoothstep(0.0, 1.0, wfNear(wpos.xz));
    float rim = smoothstep(60.0, 100.0, max(abs(wpos.x), abs(wpos.z)));
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    // drained of colour and cooled, but keeping the light and shade that give the land its shape
    vec3 washed = mix(vec3(lum), col, 0.14) * vec3(0.66, 0.78, 1.0);
    float dim = mix(0.24, 0.4, near) * (1.0 - 0.5 * rim);
    vec3 s = washed * dim + uWfColor * mix(0.16, 0.09, near) * (1.0 - 0.4 * rim);
    // a faint, fine drift of mist inside the boundary band only
    float band = clamp(v * (1.0 - v) * 4.0, 0.0, 1.0);
    vec2 q = wpos.xz * 0.45 + vec2(uWfTime * 0.18, -uWfTime * 0.11);
    float n = wfNoise(q) * 0.6 + wfNoise(q * 2.3 + 7.0) * 0.4;
    return s + uWfLight * band * smoothstep(0.35, 0.85, n) * 0.07;
}
vec3 wfApply(vec3 col, vec3 wpos) {
    if (uWfOn < 0.5) return col;
    float v = wfVis(wpos.xz);
    if (v > 0.999) return col;
    return mix(wfShroud(col, wpos, v), col, v);
}
`;

export function createWarFog(half) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // The minimap's layer: a dim shroud with the revealed circles punched out, darker far away.
    const holes = document.createElement('canvas');
    holes.width = holes.height = SIZE;
    const hctx = holes.getContext('2d');
    const deep = document.createElement('canvas');
    deep.width = deep.height = SIZE;
    const dctx = deep.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

    const uniforms = {
        uWfMask: { value: texture },
        uWfRect: { value: new THREE.Vector3(-half, -half, 1 / (2 * half)) },
        uWfColor: { value: new THREE.Color('#343e4c') },
        uWfLight: { value: new THREE.Color('#9aa6b6') },
        uWfTime: { value: 0 },
        uWfOn: { value: 1 },
    };

    let key = '';
    let current = [];
    const toPx = v => ((v + half) / (2 * half)) * SIZE;
    const pxPerM = SIZE / (2 * half);
    // A radial gradient from inner to outer radius (metres), opaque inside, in the given rgb.
    const radial = (c, cx, cy, inner, outer, rgb) => {
        const g = c.createRadialGradient(cx, cy, inner * pxPerM, cx, cy, outer * pxPerM);
        g.addColorStop(0, `rgba(${rgb},1)`);
        g.addColorStop(0.5, `rgba(${rgb},0.5)`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        c.fillStyle = g;
        c.beginPath();
        c.arc(cx, cy, outer * pxPerM, 0, Math.PI * 2);
        c.fill();
    };
    // Paint the reveal circles. Each is clear to about r and fades out over a few metres.
    function set(reveals = []) {
        const k = reveals.map(r => `${r.x.toFixed(2)},${r.z.toFixed(2)},${r.r.toFixed(2)}`).join('|');
        if (k === key) return;
        key = k;
        current = reveals;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, SIZE, SIZE);
        ctx.globalCompositeOperation = 'lighter';
        hctx.globalCompositeOperation = dctx.globalCompositeOperation = 'source-over';
        hctx.clearRect(0, 0, SIZE, SIZE);
        dctx.clearRect(0, 0, SIZE, SIZE);
        hctx.fillStyle = 'rgba(30, 37, 50, 0.5)';
        hctx.fillRect(0, 0, SIZE, SIZE);
        dctx.fillStyle = 'rgba(14, 17, 24, 0.42)';
        dctx.fillRect(0, 0, SIZE, SIZE);
        hctx.globalCompositeOperation = dctx.globalCompositeOperation = 'destination-out';
        for (const { x, z, r } of reveals) {
            if (!(r > 0.05)) continue;
            const f = clamp(r * 0.22, 1.5, 4.5);
            const cx = toPx(x), cy = toPx(z);
            // red: the revealed area itself; green: a wide halo, for how deep the shroud lies
            radial(ctx, cx, cy, Math.max(0, r - f * 0.6), r + f * 0.4, '255,0,0');
            radial(ctx, cx, cy, r * 0.85, r + NEAR, '0,255,0');
            radial(hctx, cx, cy, Math.max(0, r - f * 0.6), r + f * 0.4, '0,0,0');
            radial(dctx, cx, cy, r * 0.85, r + NEAR, '0,0,0');
        }
        ctx.globalCompositeOperation = 'source-over';
        hctx.globalCompositeOperation = 'source-over';
        hctx.drawImage(deep, 0, 0);
        texture.needsUpdate = true;
    }

    // Adds the shroud to a built-in material (standard, lambert, basic, points), keeping its own
    // shading. fade: multiply by visibility instead (for additive glows, which must simply vanish).
    function patch(material, { fade = false } = {}) {
        const prev = material.onBeforeCompile;
        material.onBeforeCompile = (shader, renderer) => {
            prev?.(shader, renderer);
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = shader.vertexShader
                .replace('#include <common>', '#include <common>\nvarying vec3 vWfPos;')
                .replace('#include <project_vertex>', `#include <project_vertex>
                    vec4 wfW = vec4(transformed, 1.0);
                    #ifdef USE_BATCHING
                        wfW = batchingMatrix * wfW;
                    #endif
                    #ifdef USE_INSTANCING
                        wfW = instanceMatrix * wfW;
                    #endif
                    vWfPos = (modelMatrix * wfW).xyz;`);
            shader.fragmentShader = shader.fragmentShader
                .replace('#include <common>', `#include <common>\nvarying vec3 vWfPos;\n${WARFOG_GLSL}`)
                .replace('#include <tonemapping_fragment>', `${fade ? 'gl_FragColor.rgb *= wfVis(vWfPos.xz);' : 'gl_FragColor.rgb = wfApply(gl_FragColor.rgb, vWfPos);'}\n#include <tonemapping_fragment>`);
        };
        const prevKey = material.customProgramCacheKey?.bind(material);
        material.customProgramCacheKey = () => `warfog${fade ? '-fade' : ''}|${prevKey ? prevKey() : ''}`;
        material.needsUpdate = true;
        return material;
    }

    return {
        canvas, holes, texture, uniforms, set, patch,
        get reveals() { return current; },
        get key() { return key; },
        setColor(fog, light) { uniforms.uWfColor.value.copy(fog); uniforms.uWfLight.value.copy(light); },
    };
}
