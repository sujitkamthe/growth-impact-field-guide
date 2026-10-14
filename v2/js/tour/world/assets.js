// Loads the tour's models (Kenney Nature, Fantasy Town and Survival kits and Quaternius people, all
// CC0, in v2/assets/tour) and turns each prop into one plain geometry with its colours baked into the
// vertices. The Kenney kits colour either by material (Nature) or by a small colour-swatch texture
// (Town, Survival); baking both into vertex colours lets every static prop in the valley share one
// material, so the whole village merges into a handful of draw calls.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const ASSET_ROOT = new URL('../../../assets/tour/', import.meta.url);

// Every prop the world uses, by kit. Keep this list in step with what is on disk (see the prune
// note in WORLD.md): anything not listed here can be deleted from v2/assets/tour.
export const PROPS = {
    nature: [
        'tree_default', 'tree_oak', 'tree_detailed', 'tree_fat', 'tree_tall', 'tree_simple', 'tree_cone',
        'tree_default_dark', 'tree_oak_dark', 'tree_pineRoundA', 'tree_pineRoundC', 'tree_pineDefaultA', 'tree_pineTallA',
        'tree_default_fall', 'tree_oak_fall',
        'plant_bush', 'plant_bushLarge', 'plant_bushDetailed', 'plant_bushSmall',
        'flower_redA', 'flower_yellowA', 'flower_purpleA', 'flower_yellowB', 'flower_redB',
        'grass', 'grass_large', 'grass_leafs',
        'rock_largeA', 'rock_largeB', 'rock_largeC', 'rock_smallA', 'rock_smallC', 'rock_smallE', 'rock_tallA', 'rock_tallE',
        'stone_tallB',
        'tent_detailedOpen', 'campfire_stones', 'campfire_logs', 'log', 'log_stack', 'stump_round',
        'fence_simple',
        'crops_cornStageD', 'crops_cornStageC', 'crops_wheatStageB', 'crops_wheatStageA', 'crops_leafsStageB', 'crop_pumpkin', 'crop_carrot', 'crop_melon',
        'lily_large', 'lily_small', 'canoe', 'mushroom_red', 'mushroom_tan', 'pot_large',
    ],
    town: [
        'wall-wood', 'wall-wood-door', 'wall-wood-window-shutters', 'wall-wood-window-small',
        'wall', 'wall-door', 'wall-window-shutters', 'wall-window-small', 'chimney',
        'windmill', 'watermill', 'fountain-round-detail',
        'stall-green', 'stall-red', 'stall', 'stall-bench', 'cart', 'cart-high', 'lantern',
    ],
    survival: ['workbench', 'chest', 'barrel', 'box', 'box-large', 'bucket', 'resource-wood', 'bedroll', 'tool-hoe'],
};
export const PEOPLE = ['Casual', 'Formal', 'Suit'];

// The Nature kit's own palette is a cool mint; these warmer colours (sRGB) suit the valley. Keyed by
// the kit's material names, applied while baking.
const NATURE_PALETTE = {
    leafsGreen: '#7cae48', leafsDark: '#4a8446', grass: '#80b64e', leafsFall: '#df8f3f',
    woodBark: '#8b5e3c', woodBarkDark: '#6c4b35', woodBirch: '#efe6d2', woodInner: '#d8b07c',
    wood: '#b27c50', woodDark: '#7a5236', dirt: '#948a7c', dirtDark: '#6f5a44',
    stone: '#bdb7aa', stoneDark: '#8e887d', colorRed: '#c9503e', colorYellow: '#f1c24c', colorPurple: '#9a72c6',
};
const paletteCache = new Map();
const paletteColor = name => {
    if (!(name in NATURE_PALETTE)) return null;
    if (!paletteCache.has(name)) paletteCache.set(name, new THREE.Color(NATURE_PALETTE[name]));
    return paletteCache.get(name);
};

// Reads a texture's pixels once, so vertex colours can be sampled from it.
const pixelCache = new WeakMap();
function pixels(texture) {
    const img = texture.image;
    if (pixelCache.has(img)) return pixelCache.get(img);
    const w = img.width, h = img.height;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const out = { w, h, data: ctx.getImageData(0, 0, w, h).data };
    pixelCache.set(img, out);
    return out;
}

const _c = new THREE.Color(), _v = new THREE.Vector3(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();

// Bakes every mesh under root into one non-indexed geometry with position, normal and color, in
// root's space. Textured parts take each vertex's colour from the texture at its UV.
export function bake(root) {
    root.updateMatrixWorld(true);
    const inv = root.matrixWorld.clone().invert();
    const parts = [];
    root.traverse(o => {
        if (!o.isMesh) return;
        const g = o.geometry;
        const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
        _nm.getNormalMatrix(m);
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const pos = g.getAttribute('position'), nor = g.getAttribute('normal'), uv = g.getAttribute('uv');
        const index = g.index;
        const count = index ? index.count : pos.count;
        const groups = g.groups.length ? g.groups : [{ start: 0, count, materialIndex: 0 }];
        for (const grp of groups) {
            const mat = mats[grp.materialIndex ?? 0] || mats[0];
            const map = mat.map && mat.map.image ? pixels(mat.map) : null;
            const base = (!map && paletteColor(mat.name)) || mat.color;
            const n = grp.count;
            const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
            for (let k = 0; k < n; k++) {
                const i = index ? index.getX(grp.start + k) : grp.start + k;
                _v.fromBufferAttribute(pos, i).applyMatrix4(m);
                P.set([_v.x, _v.y, _v.z], k * 3);
                if (nor) _n.fromBufferAttribute(nor, i).applyMatrix3(_nm).normalize(); else _n.set(0, 1, 0);
                N.set([_n.x, _n.y, _n.z], k * 3);
                _c.copy(base);
                if (map && uv) {
                    const u = uv.getX(i), v = uv.getY(i);
                    const px = Math.min(map.w - 1, Math.max(0, Math.floor((u - Math.floor(u)) * map.w)));
                    const py = Math.min(map.h - 1, Math.max(0, Math.floor((v - Math.floor(v)) * map.h)));
                    const o4 = (py * map.w + px) * 4;
                    const t = new THREE.Color().setRGB(map.data[o4] / 255, map.data[o4 + 1] / 255, map.data[o4 + 2] / 255, THREE.SRGBColorSpace);
                    _c.multiply(t);
                }
                C.set([_c.r, _c.g, _c.b], k * 3);
            }
            const out = new THREE.BufferGeometry();
            out.setAttribute('position', new THREE.BufferAttribute(P, 3));
            out.setAttribute('normal', new THREE.BufferAttribute(N, 3));
            out.setAttribute('color', new THREE.BufferAttribute(C, 3));
            parts.push(out);
        }
    });
    const merged = mergeGeometries(parts);
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
}

// Loads every prop and person, reporting progress as { loaded, total } (bytes are not known up
// front for every file, so this counts files, with people weighted for their size).
export async function loadAssets(onProgress = () => {}) {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const jobs = [];
    for (const [kit, names] of Object.entries(PROPS)) for (const n of names) jobs.push({ key: n, url: `${kit}/${n}.glb`, weight: 1, kind: 'prop' });
    for (const n of PEOPLE) jobs.push({ key: n, url: `people/${n}.glb`, weight: 12, kind: 'person' });
    const total = jobs.reduce((s, j) => s + j.weight, 0);
    let loaded = 0;
    onProgress({ loaded, total });
    const props = new Map(), people = new Map();
    // A few at a time: the browser queues the rest anyway, and progress then moves steadily.
    const queue = jobs.slice();
    async function worker() {
        while (queue.length) {
            const job = queue.shift();
            const gltf = await loader.loadAsync(new URL(job.url, ASSET_ROOT).href);
            if (job.kind === 'prop') props.set(job.key, bake(gltf.scene));
            else people.set(job.key, gltf);
            loaded += job.weight;
            onProgress({ loaded, total });
        }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
    return {
        // A prop's baked geometry (shared; clone before changing it).
        geo(name) {
            const g = props.get(name);
            if (!g) throw new Error(`Tour world: unknown prop "${name}"`);
            return g;
        },
        has: name => props.has(name),
        people,
    };
}
