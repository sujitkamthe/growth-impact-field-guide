// Small shared helpers for the tour world: timing curves, a seeded random generator, value noise
// and polylines (the explorer's paths, roads and the river are all polylines of [x, z] points).

export const clamp01 = x => Math.min(1, Math.max(0, x));
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// Progress of t through [a, b], clamped to 0..1.
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const mix = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const DEG = Math.PI / 180;

export const ease = {
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: t => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t)),
    out: t => 1 - Math.pow(1 - clamp01(t), 3),
    in: t => Math.pow(clamp01(t), 3),
    // Rises to 1 and settles back, for a nod or a pulse.
    bump: t => Math.sin(Math.PI * clamp01(t)),
};

// Shortest signed difference between two angles in degrees.
export const angleDelta = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;
export const lerpAngle = (a, b, k) => a + angleDelta(a, b) * k;

// mulberry32: a small, fast seeded generator, so the valley is the same on every load.
export function rng(seed = 1) {
    let s = seed >>> 0;
    const next = () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (a, b) => a + (b - a) * next();
    next.pick = arr => arr[Math.floor(next() * arr.length) % arr.length];
    return next;
}

function hash2(ix, iz, seed) {
    let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in 0..1.
export function noise(x, z, seed = 0) {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
    const c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
    return mix(mix(a, b, ux), mix(c, d, ux), uz);
}

// Fractal noise in roughly -1..1.
export function fbm(x, z, octaves = 4, seed = 0) {
    let sum = 0, amp = 1, norm = 0, f = 1;
    for (let i = 0; i < octaves; i++) {
        sum += (noise(x * f, z * f, seed + i * 17) * 2 - 1) * amp;
        norm += amp;
        amp *= 0.5;
        f *= 2.03;
    }
    return sum / norm;
}

// A polyline of [x, z] points with arc-length lookup.
export function polyline(points) {
    const cum = [0];
    for (let i = 1; i < points.length; i++) {
        const [ax, az] = points[i - 1], [bx, bz] = points[i];
        cum.push(cum[i - 1] + Math.hypot(bx - ax, bz - az));
    }
    const total = cum[cum.length - 1];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [x, z] of points) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
    return {
        points, cum, total,
        // Position and unit direction at distance d along the line (clamped to its ends).
        at(d) {
            d = clamp(d, 0, total);
            let i = 1;
            while (i < cum.length - 1 && cum[i] < d) i++;
            const [ax, az] = points[i - 1], [bx, bz] = points[i];
            const len = cum[i] - cum[i - 1] || 1;
            const k = (d - cum[i - 1]) / len;
            return { x: mix(ax, bx, k), z: mix(az, bz, k), dx: (bx - ax) / len, dz: (bz - az) / len };
        },
        // Shortest distance from (x, z) to the line; Infinity if it is certainly more than maxD.
        dist(x, z, maxD = Infinity) {
            if (x < minX - maxD || x > maxX + maxD || z < minZ - maxD || z > maxZ + maxD) return Infinity;
            let best = Infinity;
            for (let i = 1; i < points.length; i++) {
                const [ax, az] = points[i - 1], [bx, bz] = points[i];
                // skip segments whose bounding box is already further than the best so far
                const ox = Math.max(Math.min(ax, bx) - x, 0, x - Math.max(ax, bx));
                const oz = Math.max(Math.min(az, bz) - z, 0, z - Math.max(az, bz));
                if (ox > best || oz > best) continue;
                best = Math.min(best, distToSegment(x, z, points[i - 1], points[i]));
            }
            return best;
        },
    };
}

export function distToSegment(px, pz, [ax, az], [bx, bz]) {
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    const k = clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1);
    return Math.hypot(px - (ax + dx * k), pz - (az + dz * k));
}

// Catmull-Rom smoothing of a polyline, so hand-placed paths curve naturally.
export function smoothLine(points, steps = 6) {
    if (points.length < 3) return points.slice();
    const out = [];
    const P = i => points[clamp(i, 0, points.length - 1)];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        for (let s = 0; s < steps; s++) {
            const t = s / steps, t2 = t * t, t3 = t2 * t;
            const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
            out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
        }
    }
    out.push(points[points.length - 1]);
    return out;
}
