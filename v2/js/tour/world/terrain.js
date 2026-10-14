// The valley floor: a gentle rolling heightfield with the lake and river carved in, flattened where
// buildings stand, drawn as a faceted low-poly mesh and painted with a ground texture (grass with
// variation, dirt roads, fields, sandy banks, the cobbled square).

import * as THREE from 'three';
import { fbm, noise, smooth, mix, polyline, smoothLine, rng } from './util.js';
import * as L from '../layout.js';

const riverLine = polyline(smoothLine(L.river.points, 6));
const creekLine = polyline(smoothLine(L.creek.points, 6));
export const roadLines = L.roads.map(r => ({ w: r.w, line: polyline(smoothLine(r.points, 5)) }));

function natural(x, z) {
    const r = Math.hypot(x, z * 1.08);
    let h = 0.45 + 0.85 * fbm(x * 0.021, z * 0.021, 3, 7) + 0.3 * fbm(x * 0.075, z * 0.075, 2, 11);
    h += 1.1 * (r / 70) ** 2 + 9 * smooth(62, 115, r);          // the valley's sides rise beyond the map
    for (const [hx, hz, hh, hr] of L.hills) {
        const d2 = (x - hx) ** 2 + (z - hz) ** 2;
        h += hh * Math.exp(-d2 / (hr * hr * 0.55));
    }
    return h;
}
const flatTargets = L.flats.map(([x, z, r]) => [x, z, r, natural(x, z)]);

// Water carves a bowl with a gently sloping bank, so shores read as beaches, not cliffs.
function carve(h, d, halfWidth, depth) {
    const t = d < halfWidth ? L.WATER_Y - 0.2 - depth * (1 - (d / halfWidth) ** 2) : L.WATER_Y - 0.2 + (d - halfWidth) * 0.42;
    return Math.min(h, t);
}

// The analytic height (used to build the mesh; heightAt() reads the mesh itself).
export function heightFn(x, z) {
    let h = natural(x, z);
    for (const [fx, fz, fr, target] of flatTargets) {
        const d = Math.hypot(x - fx, z - fz);
        if (d < fr) h = mix(h, target, 1 - smooth(fr * 0.55, fr, d));
    }
    // a slight dip along roads, so they look worn into the ground
    for (const r of roadLines) {
        const d = r.line.dist(x, z, r.w + 1);
        if (d < r.w + 1) h -= 0.06 * (1 - smooth(r.w * 0.5, r.w + 1, d));
    }
    const e = Math.hypot((x - L.lake.x) / L.lake.rx, (z - L.lake.z) / L.lake.rz);
    h = carve(h, e * Math.min(L.lake.rx, L.lake.rz), Math.min(L.lake.rx, L.lake.rz), 1.8);
    h = carve(h, riverLine.dist(x, z, 40), L.river.halfWidth, 1.3);
    h = carve(h, creekLine.dist(x, z, 40), L.creek.halfWidth, 0.8);
    return h;
}

// Distance from the water's edge (negative in the water), or Infinity when further than about 8 m.
export const waterDistance = (x, z) => {
    const e = Math.hypot((x - L.lake.x) / L.lake.rx, (z - L.lake.z) / L.lake.rz);
    const lakeD = (e - 1) * Math.min(L.lake.rx, L.lake.rz);
    return Math.min(lakeD, riverLine.dist(x, z, 11) - L.river.halfWidth, creekLine.dist(x, z, 10) - L.creek.halfWidth);
};
// Distance from a road's edge, or Infinity when further than about 8 m.
export const roadDistance = (x, z) => {
    let best = Infinity;
    for (const r of roadLines) best = Math.min(best, r.line.dist(x, z, r.w + 8) - r.w);
    return best;
};
export { riverLine, creekLine };

export function createTerrain() {
    const half = L.MAP.terrainHalf;
    const N = 176;                       // cells a side (1.25 m)
    const step = (2 * half) / N;
    const H = new Float32Array((N + 1) * (N + 1));
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) H[j * (N + 1) + i] = heightFn(-half + i * step, -half + j * step);
    const hv = (i, j) => H[j * (N + 1) + i];

    // Non-indexed so every triangle keeps its own flat normal: the faceted low-poly look.
    const tris = N * N * 2;
    const pos = new Float32Array(tris * 9), uv = new Float32Array(tris * 6);
    let p = 0, u = 0;
    const put = (i, j) => {
        const x = -half + i * step, z = -half + j * step;
        pos[p++] = x; pos[p++] = hv(i, j); pos[p++] = z;
        uv[u++] = i / N; uv[u++] = j / N;
    };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        put(i, j); put(i, j + 1); put(i + 1, j);
        put(i + 1, j); put(i, j + 1); put(i + 1, j + 1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    // Height on the mesh's own triangles, so props sit exactly on the faceted surface.
    function heightAt(x, z) {
        const gx = (x + half) / step, gz = (z + half) / step;
        const i = Math.max(0, Math.min(N - 1, Math.floor(gx))), j = Math.max(0, Math.min(N - 1, Math.floor(gz)));
        const fx = Math.min(1, Math.max(0, gx - i)), fz = Math.min(1, Math.max(0, gz - j));
        const a = hv(i, j), b = hv(i + 1, j), c = hv(i, j + 1), d = hv(i + 1, j + 1);
        return fx + fz <= 1 ? a + (b - a) * fx + (c - a) * fz : d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
    }

    const { canvas, mapCanvas } = paintGround(half, heightAt);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.flipY = false;
    map.anisotropy = 8;
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    const material = new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    mesh.name = 'terrain';
    return { mesh, heightAt, half, N, step, heights: H, mapCanvas };
}

// ---- Ground painting ---------------------------------------------------------------------------

const GRASS = [[118, 168, 74], [138, 182, 82], [102, 152, 66], [160, 186, 92], [92, 140, 62]];

function paintGround(half, heightAt) {
    const SIZE = 2048, LOW = 512;
    const toPx = (v, size) => ((v + half) / (2 * half)) * size;

    // 1. Grass, coloured by noise and height, at low resolution, then scaled up smoothly.
    const low = document.createElement('canvas');
    low.width = low.height = LOW;
    const lctx = low.getContext('2d');
    const img = lctx.createImageData(LOW, LOW);
    for (let j = 0; j < LOW; j++) for (let i = 0; i < LOW; i++) {
        const x = -half + ((i + 0.5) / LOW) * 2 * half, z = -half + ((j + 0.5) / LOW) * 2 * half;
        const n1 = fbm(x * 0.03, z * 0.03, 3, 3) * 0.5 + 0.5;
        const n2 = noise(x * 0.16, z * 0.16, 5);
        const h = heightAt(x, z);
        let r = mix(GRASS[2][0], GRASS[1][0], n1), g = mix(GRASS[2][1], GRASS[1][1], n1), b = mix(GRASS[2][2], GRASS[1][2], n1);
        // sunny meadow patches
        const meadow = smooth(0.58, 0.8, noise(x * 0.045 + 9, z * 0.045 - 3, 21));
        r = mix(r, GRASS[3][0], meadow * 0.7); g = mix(g, GRASS[3][1], meadow * 0.7); b = mix(b, GRASS[3][2], meadow * 0.7);
        // fine mottling
        const m = (n2 - 0.5) * 16;
        r += m; g += m * 1.1; b += m * 0.6;
        // higher ground a little drier, the far slopes darker (forest floor)
        const dry = smooth(2.5, 7, h);
        r = mix(r, 150, dry * 0.25); g = mix(g, 165, dry * 0.15); b = mix(b, 86, dry * 0.2);
        const edge = smooth(58, 80, Math.hypot(x, z));
        r = mix(r, 84, edge * 0.55); g = mix(g, 124, edge * 0.5); b = mix(b, 62, edge * 0.5);
        // banks: wet mud and sand where the ground meets the water
        const wd = waterDistance(x, z);
        const sand = 1 - smooth(0.2, 2.4, wd);
        r = mix(r, 205, sand * 0.85); g = mix(g, 190, sand * 0.85); b = mix(b, 140, sand * 0.85);
        const mud = 1 - smooth(-1.2, 0.4, wd);
        r = mix(r, 120, mud); g = mix(g, 128, mud); b = mix(b, 96, mud);
        const o = (j * LOW + i) * 4;
        img.data[o] = r; img.data[o + 1] = g; img.data[o + 2] = b; img.data[o + 3] = 255;
    }
    lctx.putImageData(img, 0, 0);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(low, 0, 0, SIZE, SIZE);
    const s = SIZE / (2 * half);              // px per metre
    const P = ([x, z]) => [toPx(x, SIZE), toPx(z, SIZE)];
    const R = rng(42);

    // 2. Fields: tilled soil with rows.
    for (const pl of L.plots) {
        const [cx, cz] = P(pl.at);
        const w = pl.w * s, d = pl.d * s;
        ctx.save();
        ctx.translate(cx, cz);
        ctx.fillStyle = 'rgba(122, 96, 62, 0.9)';
        roundRect(ctx, -w / 2 - 0.4 * s, -d / 2 - 0.4 * s, w + 0.8 * s, d + 0.8 * s, 0.8 * s);
        ctx.fill();
        ctx.fillStyle = 'rgba(92, 70, 44, 0.85)';
        const rows = Math.max(2, Math.round(pl.d / 1.2));
        for (let k = 0; k < rows; k++) {
            const y = -d / 2 + (k + 0.5) * (d / rows);
            ctx.fillRect(-w / 2, y - 0.22 * s, w, 0.44 * s);
        }
        ctx.restore();
    }

    // 3. Roads: a worn verge, the dirt, then a lighter, trodden centre.
    const stroke = (pts, width, style) => {
        ctx.beginPath();
        pts.forEach((p, k) => { const [x, y] = P(p); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.lineWidth = width * s;
        ctx.strokeStyle = style;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };
    for (const r of roadLines) stroke(r.line.points, r.w * 2 + 1.6, 'rgba(150, 160, 88, 0.55)');
    for (const r of roadLines) stroke(r.line.points, r.w * 2, 'rgb(190, 156, 104)');
    for (const r of roadLines) stroke(r.line.points, r.w * 1.1, 'rgba(212, 182, 128, 0.85)');
    // pebbles and ruts
    for (const r of roadLines) {
        const line = r.line;
        for (let d = 0; d < line.total; d += 0.35) {
            const a = line.at(d);
            const off = (R() - 0.5) * r.w * 1.8;
            const [x, y] = P([a.x - a.dz * off, a.z + a.dx * off]);
            ctx.fillStyle = R() < 0.5 ? 'rgba(160, 128, 84, 0.55)' : 'rgba(226, 202, 152, 0.55)';
            ctx.fillRect(x, y, 2 + R() * 3, 2 + R() * 3);
        }
    }

    // 4. The square: packed earth with cobbles.
    {
        const [cx, cz] = P(L.places.square);
        const r = 9 * s;
        const grad = ctx.createRadialGradient(cx, cz, r * 0.6, cx, cz, r * 1.15);
        grad.addColorStop(0, 'rgb(206, 190, 158)');
        grad.addColorStop(0.75, 'rgba(198, 176, 134, 0.95)');
        grad.addColorStop(1, 'rgba(190, 160, 110, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(cx, cz, r * 1.15, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 2200; k++) {
            const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.95;
            const x = cx + Math.cos(a) * d, y = cz + Math.sin(a) * d;
            const sz = (0.28 + R() * 0.2) * s;
            const v = 170 + R() * 40;
            ctx.fillStyle = `rgba(${v}, ${v - 12}, ${v - 34}, 0.8)`;
            roundRect(ctx, x - sz / 2, y - sz / 2, sz, sz * (0.7 + R() * 0.4), sz * 0.25);
            ctx.fill();
        }
    }

    // 5. Packed earth around houses and the camp.
    const pad = ([x, z], rx, rz, alpha = 0.55) => {
        const [cx, cz] = P([x, z]);
        ctx.save();
        ctx.translate(cx, cz);
        ctx.scale(1, rz / rx);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * s);
        g.addColorStop(0, `rgba(176, 150, 104, ${alpha})`);
        g.addColorStop(1, 'rgba(176, 150, 104, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, rx * s, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    };
    for (const h of L.houses) pad(h.at, h.w * 2.6, h.w * 2.2, 0.45);
    pad(L.places.campfire, 4.5, 4.5, 0.7);
    pad(L.places.tent, 4, 4, 0.4);
    pad(L.places.crossroads, 3.2, 3.2, 0.6);
    pad(L.places.market, 7, 6, 0.55);
    pad(L.places.stoneRing, 7, 7, 0.35);

    // A small copy for the minimap.
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = mapCanvas.height = 256;
    const mctx = mapCanvas.getContext('2d');
    const crop = (L.MAP.half / half);
    mctx.drawImage(canvas, SIZE * (1 - crop) / 2, SIZE * (1 - crop) / 2, SIZE * crop, SIZE * crop, 0, 0, 256, 256);
    return { canvas, mapCanvas };
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}
