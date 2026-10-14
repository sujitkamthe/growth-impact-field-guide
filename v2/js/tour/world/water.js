// Water: the lake, the river and the creek share one level, so they are one flat mesh built from
// the terrain cells that dip below the water line, each vertex carrying its depth. Seen from the
// high game camera the water is shaded cheaply (depth tint, sky fresnel, sun glint, shoreline foam);
// when the camera comes down low (the lake's reflection beat) the same mesh turns into a planar
// Reflector that renders the scene mirrored, at half resolution.

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { WARFOG_GLSL } from './warfog.js';
import { WATER_Y } from '../layout.js';

const WaterShader = {
    name: 'TourWater',
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uReflect: { value: 0 },
        uSkyTop: { value: new THREE.Color() },
        uSkyHor: { value: new THREE.Color() },
        uSunDir: { value: new THREE.Vector3(0, 1, 0) },
        uSunCol: { value: new THREE.Color() },
        uShallow: { value: new THREE.Color('#79bdb4') },
        uDeep: { value: new THREE.Color('#2d6a86') },
    }]),
    vertexShader: /* glsl */`
        uniform mat4 textureMatrix;
        attribute float depth;
        varying vec4 vUv;
        varying vec3 vWorld;
        varying float vDepth;
        #include <fog_pars_vertex>
        void main() {
            vUv = textureMatrix * vec4(position, 1.0);
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            vDepth = depth;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
        }`,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float uReflect;
        uniform vec3 uSkyTop, uSkyHor, uSunDir, uSunCol, uShallow, uDeep;
        varying vec4 vUv;
        varying vec3 vWorld;
        varying float vDepth;
        ${WARFOG_GLSL}
        #include <fog_pars_fragment>
        void main() {
            vec2 p = vWorld.xz;
            float t = uWfTime;
            // ripples: two drifting noise layers bend the normal a little
            vec2 q = p * 0.55 + vec2(t * 0.22, t * 0.05);
            float n1 = wfNoise(q), n2 = wfNoise(q * 2.1 - vec2(t * 0.1, -t * 0.17));
            float ex = wfNoise(q + vec2(0.15, 0.0)) - n1, ez = wfNoise(q + vec2(0.0, 0.15)) - n1;
            // still water when the camera is down at its level, livelier from above
            float rip = 1.0 - 0.8 * uReflect;
            vec3 N = normalize(vec3((-ex * 1.2 - (n2 - 0.5) * 0.06) * rip, 1.0, -ez * 1.2 * rip));
            vec3 V = normalize(cameraPosition - vWorld);
            float fres = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
            vec3 R = reflect(-V, N);
            vec3 sky = mix(uSkyHor, uSkyTop, smoothstep(0.0, 0.7, R.y));
            vec3 refl = sky;
            if (uReflect > 0.001) {
                vec4 uv = vUv;
                uv.xy += N.xz * 0.08 * uv.w;
                vec3 mirror = texture2DProj(tDiffuse, uv).rgb * vec3(0.82, 0.9, 0.93);
                refl = mix(sky, mirror, uReflect);
            }
            float d = clamp(vDepth, 0.0, 3.0);
            vec3 body = mix(uShallow, uDeep, smoothstep(0.05, 1.4, d));
            // a lighter rim on the shallows, a gently moving line of foam at the shore
            float foam = (1.0 - smoothstep(0.0, 0.16, d)) * (0.55 + 0.45 * wfNoise(p * 3.0 + t * 0.4));
            vec3 col = mix(body, refl, clamp(mix(fres, 0.72, uReflect), 0.0, 1.0));
            float spec = pow(max(dot(R, uSunDir), 0.0), 180.0);
            col += uSunCol * spec * 1.6;
            col = mix(col, vec3(0.93, 0.95, 0.92), foam * 0.75);
            // under the shroud the water lies darker than the land, so the river and lake still read
            float wv = wfVis(vWorld.xz);
            col = wfApply(col, vWorld) * mix(0.62, 1.0, wv);
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
        }`,
};

// Builds the water mesh from the terrain grid: every cell with a corner below the water line.
export function createWater(terrain, warfogUniforms) {
    const { N, step, half, heights } = terrain;
    const idx = new Map();
    const pos = [], depth = [], index = [];
    const vert = (i, j) => {
        const key = j * (N + 1) + i;
        if (idx.has(key)) return idx.get(key);
        const x = -half + i * step, z = -half + j * step;
        // the mesh lies in its local XY plane (a Reflector's normal is +Z); rotated flat, local y = -z
        pos.push(x, -z, 0);
        depth.push(WATER_Y - heights[key]);
        idx.set(key, pos.length / 3 - 1);
        return pos.length / 3 - 1;
    };
    const h = (i, j) => heights[j * (N + 1) + i];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const lo = Math.min(h(i, j), h(i + 1, j), h(i, j + 1), h(i + 1, j + 1));
        if (lo > WATER_Y + 0.02) continue;
        const a = vert(i, j), b = vert(i + 1, j), c = vert(i, j + 1), d = vert(i + 1, j + 1);
        // counter-clockwise seen from +Z (local), which is up once rotated flat
        index.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('depth', new THREE.Float32BufferAttribute(depth, 1));
    geo.setIndex(index);
    geo.computeBoundingSphere();

    const water = new Reflector(geo, {
        textureWidth: 512, textureHeight: 512, clipBias: 0.002, multisample: 0, shader: WaterShader, color: 0xffffff,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = WATER_Y;
    water.name = 'water';
    water.material.fog = true;
    water.material.uniforms = { ...water.material.uniforms, ...warfogUniforms };
    // Several uniforms objects were cloned; keep the fog-of-war ones shared with the world.
    Object.assign(water.material.uniforms, warfogUniforms);
    water.receiveShadow = false;

    const render = water.onBeforeRender;
    let reflect = 0;
    water.onBeforeRender = function (renderer, scene, camera, ...rest) {
        if (reflect > 0.001) render.call(this, renderer, scene, camera, ...rest);
    };
    const u = water.material.uniforms;
    return {
        mesh: water,
        // k: how much of the mirrored scene to show (0 skips the reflection pass entirely).
        setReflect(k) { reflect = k; u.uReflect.value = k; },
        setSky(top, hor, sunDir, sunCol) {
            u.uSkyTop.value.copy(top); u.uSkyHor.value.copy(hor);
            u.uSunDir.value.copy(sunDir); u.uSunCol.value.copy(sunCol);
        },
        setSize(w, hgt) { water.getRenderTarget().setSize(Math.max(64, Math.round(w)), Math.max(64, Math.round(hgt))); },
    };
}
