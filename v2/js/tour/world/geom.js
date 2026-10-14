// Hand-made low-poly pieces in the same format as the baked props (non-indexed position, normal,
// color), so they merge with them: coloured primitives, gable and pyramid roofs, banner cloth.

import * as THREE from 'three';

const lin = c => (c instanceof THREE.Color ? c : new THREE.Color(c));

// Any three geometry, flattened to non-indexed triangles with flat normals and one colour.
export function colored(geo, color, { flat = true } = {}) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    g.deleteAttribute('uv');
    if (flat) g.computeVertexNormals();
    const c = lin(color), n = g.getAttribute('position').count;
    const C = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) C.set([c.r, c.g, c.b], i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    return g;
}

export const box = (w, h, d, color) => colored(new THREE.BoxGeometry(w, h, d), color);
export const cyl = (r0, r1, h, color, seg = 6) => colored(new THREE.CylinderGeometry(r0, r1, h, seg), color);

// Builds a geometry from triangles given as arrays of [x, y, z] and a colour per triangle.
function fromTris(tris) {
    const P = new Float32Array(tris.length * 9), C = new Float32Array(tris.length * 9);
    tris.forEach(([a, b, c, col], i) => {
        P.set([...a, ...b, ...c], i * 9);
        const k = lin(col);
        for (let v = 0; v < 3; v++) C.set([k.r, k.g, k.b], i * 9 + v * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    g.setAttribute('color', new THREE.BufferAttribute(C, 3));
    g.computeVertexNormals();
    return g;
}
const quad = (a, b, c, d, col) => [[a, b, c, col], [a, c, d, col]];

export const ROOFS = {
    terracotta: { top: '#c46a43', edge: '#8e4a33', under: '#6a4634' },
    brown: { top: '#94653f', edge: '#6d4a30', under: '#57402f' },
    slate: { top: '#617284', edge: '#465363', under: '#4a4744' },
    thatch: { top: '#c79d58', edge: '#9b7741', under: '#6d5536' },
};

// A gable roof over a W x D footprint (ridge along x), its eaves at y = 0, with overhangs, a
// thickness, a ridge cap and the gable triangles filled in wallColor.
export function gableRoof(W, D, { roof = 'terracotta', wallColor = '#e9dcc2', pitch = 0.72, over = 0.45, gableOver = 0.32, t = 0.2 } = {}) {
    const c = ROOFS[roof] || ROOFS.terracotta;
    const hx = W / 2 + gableOver, hz = D / 2 + over;
    const rise = (D / 2) * pitch;
    const eaveY = -over * pitch;
    const tris = [];
    for (const side of [1, -1]) {
        // top surface from the eave (z = side*hz) up to the ridge (z = 0)
        const e0 = [-hx, eaveY, side * hz], e1 = [hx, eaveY, side * hz];
        const r0 = [-hx, rise, 0], r1 = [hx, rise, 0];
        const top = side > 0 ? quad(e0, e1, r1, r0, c.top) : quad(e1, e0, r0, r1, c.top);
        tris.push(...top);
        // underside, a little lower
        const u0 = [-hx, eaveY - t, side * hz], u1 = [hx, eaveY - t, side * hz];
        const v0 = [-hx, rise - t, 0], v1 = [hx, rise - t, 0];
        tris.push(...(side > 0 ? quad(u1, u0, v0, v1, c.under) : quad(u0, u1, v1, v0, c.under)));
        // eave edge
        tris.push(...(side > 0 ? quad(u0, u1, e1, e0, c.edge) : quad(u1, u0, e0, e1, c.edge)));
        // gable edges (the slab's ends)
        for (const sx of [1, -1]) {
            const a = [sx * hx, eaveY, side * hz], b = [sx * hx, rise, 0], bb = [sx * hx, rise - t, 0], aa = [sx * hx, eaveY - t, side * hz];
            const flip = (sx > 0) !== (side > 0);
            tris.push(...(flip ? quad(a, b, bb, aa, c.edge) : quad(aa, bb, b, a, c.edge)));
        }
    }
    // ridge cap
    const rc = 0.16;
    tris.push(...quad([-hx - 0.04, rise - 0.02, rc], [hx + 0.04, rise - 0.02, rc], [hx + 0.04, rise + rc * 0.6, 0], [-hx - 0.04, rise + rc * 0.6, 0], c.edge));
    tris.push(...quad([hx + 0.04, rise - 0.02, -rc], [-hx - 0.04, rise - 0.02, -rc], [-hx - 0.04, rise + rc * 0.6, 0], [hx + 0.04, rise + rc * 0.6, 0], c.edge));
    // gable walls (just inside the walls' outer faces)
    const gx = W / 2 - 0.02, gz = D / 2 - 0.02, gr = (D / 2 - 0.02) * pitch;
    tris.push([[gx, 0, gz], [gx, 0, -gz], [gx, gr, 0], wallColor]);
    tris.push([[-gx, 0, -gz], [-gx, 0, gz], [-gx, gr, 0], wallColor]);
    // a ceiling, so nothing shows through from a low angle
    tris.push(...quad([-gx, 0.01, gz], [gx, 0.01, gz], [gx, 0.01, -gz], [-gx, 0.01, -gz], c.under).map(([a, b, cc, col]) => [cc, b, a, col]));
    return { geo: fromTris(tris), rise };
}

// A pyramid roof (the windmill's cap, a well's hood).
export function pyramidRoof(W, D, h, roof = 'slate', over = 0.4) {
    const c = ROOFS[roof] || ROOFS.slate;
    const x = W / 2 + over, z = D / 2 + over, y0 = -over * 0.5;
    const apex = [0, h, 0];
    const pts = [[-x, y0, z], [x, y0, z], [x, y0, -z], [-x, y0, -z]];
    const tris = [];
    for (let i = 0; i < 4; i++) tris.push([pts[i], pts[(i + 1) % 4], apex, i % 2 ? c.top : c.edge]);
    tris.push([pts[0], pts[3], pts[2], c.under], [pts[0], pts[2], pts[1], c.under]);
    return fromTris(tris);
}

// Banner cloth hanging from y = 0 down to -h, with a notched (swallow-tail) foot.
export function clothGeometry(w = 0.9, h = 2, segs = 8) {
    const g = new THREE.PlaneGeometry(w, h, 2, segs);
    g.translate(0, -h / 2, 0);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getY(i) + h) < 1e-4 && Math.abs(pos.getX(i)) < 1e-4) pos.setY(i, -h + 0.32);
    }
    g.deleteAttribute('uv');
    g.computeVertexNormals();
    return g;
}

// Moves a geometry so its bounding box is centred on x and z (some Kenney pieces sit at a tile edge).
export function centreXZ(geo) {
    const g = geo.clone();
    g.computeBoundingBox();
    const b = g.boundingBox;
    g.translate(-(b.min.x + b.max.x) / 2, 0, -(b.min.z + b.max.z) / 2);
    return g;
}

// Remaps colours: fn(color) -> color, on a copy.
export function recolor(geo, fn) {
    const g = geo.clone();
    const C = g.getAttribute('color');
    const c = new THREE.Color();
    for (let i = 0; i < C.count; i++) {
        c.setRGB(C.getX(i), C.getY(i), C.getZ(i));
        fn(c);
        C.setXYZ(i, c.r, c.g, c.b);
    }
    return g;
}
