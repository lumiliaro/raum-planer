/**
 * Pure geometry of rooms: closed outlines of absolute points in cm. The last
 * edge runs from the last point back to the first; edge `i` (0-based) runs
 * from point `i` to point `i + 1`. No React or Konva dependencies.
 */

import type { PointCm } from "@/lib/plan-schema";
import type { RectCm } from "@/lib/viewport";

/** Points are stored with this precision (0.1 cm). */
export const ROOM_POINT_PRECISION_CM = 0.1;
/** An edge counts as present from this length on. */
export const MIN_EDGE_CM = 0.1;
/** Tolerance of geometric comparisons in cm. */
export const GEOMETRY_EPS_CM = 0.01;
/** Wall thickness of every edge of a newly drawn room, in cm. */
export const DEFAULT_WALL_THICKNESS_CM = 15;
/** Upper limit of a wall thickness in cm. */
export const MAX_WALL_THICKNESS_CM = 100;

/** Rounds a coordinate to 0.1 cm, never `-0`. */
export function roundCm(value: number): number {
    return Math.round(value * 10) / 10 || 0;
}

export function roundPointCm(point: PointCm): PointCm {
    return { x: roundCm(point.x), y: roundCm(point.y) };
}

export function distanceCm(a: PointCm, b: PointCm): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Lengths of all edges, edge `i` from point `i` to point `i + 1` (the last one closes the outline). */
export function edgeLengthsCm(points: readonly PointCm[]): number[] {
    return points.map((p, i) => distanceCm(p, points[(i + 1) % points.length]));
}

/** `true` if every edge is at least `MIN_EDGE_CM` long. */
export function hasNoZeroEdges(points: readonly PointCm[]): boolean {
    return edgeLengthsCm(points).every((length) => length >= MIN_EDGE_CM - GEOMETRY_EPS_CM);
}

/** Distance of `p` to the segment `a`–`b`. */
function pointSegmentDistance(p: PointCm, a: PointCm, b: PointCm): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return distanceCm(p, a);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
    return distanceCm(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Signed distance of `p` to the line through `a`–`b`; the sign tells the side. */
function signedLineDistance(p: PointCm, a: PointCm, b: PointCm): number {
    const length = distanceCm(a, b);
    return ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / length;
}

/**
 * `true` if the closed segments `a`–`b` and `c`–`d` share a point: they cross,
 * touch or overlap (with a tolerance of `GEOMETRY_EPS_CM`).
 */
export function segmentsIntersect(a: PointCm, b: PointCm, c: PointCm, d: PointCm): boolean {
    const near = (p: PointCm, s: PointCm, e: PointCm) => pointSegmentDistance(p, s, e) <= GEOMETRY_EPS_CM;
    if (near(a, c, d) || near(b, c, d) || near(c, a, b) || near(d, a, b)) return true;
    if (distanceCm(a, b) < GEOMETRY_EPS_CM || distanceCm(c, d) < GEOMETRY_EPS_CM) return false;
    const d1 = signedLineDistance(a, c, d);
    const d2 = signedLineDistance(b, c, d);
    const d3 = signedLineDistance(c, a, b);
    const d4 = signedLineDistance(d, a, b);
    return d1 * d2 < 0 && d3 * d4 < 0;
}

/**
 * `true` if the closed outline does not intersect itself: non-adjacent edges
 * share no point, adjacent edges only their common corner (no edge doubling
 * back on the line of its predecessor). Fewer than 3 points are never simple.
 */
export function isSimplePolygon(points: readonly PointCm[]): boolean {
    const n = points.length;
    if (n < 3) return false;
    const at = (i: number) => points[i % n];
    for (let i = 0; i < n; i++) {
        // Adjacent edge i+1: the far ends must not lie on the other edge.
        const a = at(i);
        const b = at(i + 1);
        const c = at(i + 2);
        if (pointSegmentDistance(c, a, b) <= GEOMETRY_EPS_CM || pointSegmentDistance(a, b, c) <= GEOMETRY_EPS_CM) {
            return false;
        }
        // Non-adjacent edges j > i+1 (the last edge is adjacent to edge 0).
        for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            if (segmentsIntersect(a, b, at(j), at(j + 1))) return false;
        }
    }
    return true;
}

/** Smallest axis-parallel rectangle around the points; an empty list gives a 0 × 0 rectangle at the origin. */
export function boundsCm(points: readonly PointCm[]): RectCm {
    if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** `true` if `p` lies inside the outline (even-odd rule; points on the outline count as either). */
export function containsPoint(points: readonly PointCm[], p: PointCm): boolean {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i];
        const b = points[j];
        if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
            inside = !inside;
        }
    }
    return inside;
}

/** Area centroid of a simple polygon; the vertex average for a degenerate one. */
function centroid(points: readonly PointCm[]): PointCm {
    let area2 = 0;
    let cx = 0;
    let cy = 0;
    points.forEach((a, i) => {
        const b = points[(i + 1) % points.length];
        const cross = a.x * b.y - b.x * a.y;
        area2 += cross;
        cx += (a.x + b.x) * cross;
        cy += (a.y + b.y) * cross;
    });
    if (Math.abs(area2) < 1e-9) {
        const n = Math.max(points.length, 1);
        return {
            x: points.reduce((sum, p) => sum + p.x, 0) / n,
            y: points.reduce((sum, p) => sum + p.y, 0) / n,
        };
    }
    return { x: cx / (3 * area2), y: cy / (3 * area2) };
}

/**
 * Where the room's name goes: the area centroid if it lies inside the room,
 * else the middle of the longest horizontal section through the room at the
 * centroid's height (e.g. for an L-shape).
 */
export function labelPointCm(points: readonly PointCm[]): PointCm {
    const c = centroid(points);
    if (containsPoint(points, c)) return c;
    const xs: number[] = [];
    points.forEach((a, i) => {
        const b = points[(i + 1) % points.length];
        // Half-open rule so a vertex on the line is counted once.
        if (a.y > c.y !== b.y > c.y) xs.push(a.x + ((c.y - a.y) * (b.x - a.x)) / (b.y - a.y));
    });
    xs.sort((p, q) => p - q);
    let best: { from: number; to: number } | null = null;
    for (let i = 0; i + 1 < xs.length; i += 2) {
        if (!best || xs[i + 1] - xs[i] > best.to - best.from) best = { from: xs[i], to: xs[i + 1] };
    }
    if (!best) {
        const bounds = boundsCm(points);
        return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    }
    return { x: (best.from + best.to) / 2, y: c.y };
}

/** Twice the signed area (shoelace formula, screen coordinates): positive = clockwise on screen. */
export function signedArea2(points: readonly PointCm[]): number {
    return points.reduce((sum, a, i) => {
        const b = points[(i + 1) % points.length];
        return sum + a.x * b.y - b.x * a.y;
    }, 0);
}

/** Inner area of the room in m², always positive (either winding order). */
export function roomAreaM2(points: readonly PointCm[]): number {
    return Math.abs(signedArea2(points)) / 2 / 10_000;
}

/** Below this cross product of two unit directions, neighbouring edges count as parallel. */
const PARALLEL_EPS = 1e-9;
/** A corner of the wall band reaches at most this multiple of the thicker wall away from the room's corner. */
const WALL_MITER_LIMIT = 2;

/**
 * Outer outline of a room together with its wall band: edge `i` moved
 * `thicknesses[i]` outwards, neighbouring edges joined at the intersection of
 * their moved lines (miter). Parallel neighbours (collinear points) get both
 * end points instead, a step if their thicknesses differ; so does a corner
 * whose miter would lie more than `2 × ` the thicker wall away from the room's
 * corner (bevel at very sharp angles). Same order as `points`; the band is
 * this polygon minus the room's inside. A self-intersecting result (very thick
 * walls on very short edges) is drawn with the non-zero rule.
 */
export function wallBandOutline(points: readonly PointCm[], thicknesses: readonly number[]): PointCm[] {
    const n = points.length;
    if (n < 3) return points.map((p) => ({ ...p }));
    const clockwise = signedArea2(points) >= 0;
    const edges = points.map((start, i) => {
        const end = points[(i + 1) % n];
        const length = distanceCm(start, end);
        const dir = length === 0 ? { x: 1, y: 0 } : { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
        const outward = clockwise ? { x: dir.y, y: -dir.x } : { x: -dir.y, y: dir.x };
        return { dir, outward, thickness: thicknesses[i] ?? DEFAULT_WALL_THICKNESS_CM };
    });
    const result: PointCm[] = [];
    const push = (p: PointCm) => {
        const last = result[result.length - 1];
        if (!last || distanceCm(last, p) > GEOMETRY_EPS_CM) result.push(p);
    };
    for (let j = 0; j < n; j++) {
        const corner = points[j];
        const before = edges[(j + n - 1) % n];
        const after = edges[j];
        // End of the moved edge before the corner, start of the moved edge after it.
        const a = { x: corner.x + before.outward.x * before.thickness, y: corner.y + before.outward.y * before.thickness };
        const b = { x: corner.x + after.outward.x * after.thickness, y: corner.y + after.outward.y * after.thickness };
        const cross = before.dir.x * after.dir.y - before.dir.y * after.dir.x;
        if (Math.abs(cross) < PARALLEL_EPS) {
            push(a);
            push(b);
            continue;
        }
        const s = ((b.x - a.x) * after.dir.y - (b.y - a.y) * after.dir.x) / cross;
        const miter = { x: a.x + before.dir.x * s, y: a.y + before.dir.y * s };
        if (distanceCm(miter, corner) > WALL_MITER_LIMIT * Math.max(before.thickness, after.thickness)) {
            push(a);
            push(b);
        } else {
            push(miter);
        }
    }
    if (result.length > 1 && distanceCm(result[0], result[result.length - 1]) <= GEOMETRY_EPS_CM) result.pop();
    return result;
}

/** All points moved by `dx`/`dy`, rounded to 0.1 cm. */
export function translatePoints(points: readonly PointCm[], dx: number, dy: number): PointCm[] {
    return points.map((p) => roundPointCm({ x: p.x + dx, y: p.y + dy }));
}

export type SetEdgeLengthResult =
    | { ok: true; points: PointCm[] }
    | { ok: false; reason: "too-short"; edgeIndex: number }
    | { ok: false; reason: "intersects" };

/**
 * Gives edge `index` (0-based) the length `lengthCm`: the two points after the
 * edge move by the difference in the edge's direction. The following edge is
 * moved in parallel, the one after it compensates, all others stay. Rejects a
 * change after which an edge would be shorter than `MIN_EDGE_CM` or point the
 * other way (`too-short` with that edge), or the outline would intersect itself.
 * The resulting points are rounded to 0.1 cm.
 */
export function setEdgeLength(points: readonly PointCm[], index: number, lengthCm: number): SetEdgeLengthResult {
    const n = points.length;
    const start = points[index];
    const end = points[(index + 1) % n];
    const current = distanceCm(start, end);
    if (!(lengthCm >= MIN_EDGE_CM) || current === 0) return { ok: false, reason: "too-short", edgeIndex: index };
    const delta = lengthCm - current;
    const ux = (end.x - start.x) / current;
    const uy = (end.y - start.y) / current;
    const moved = new Set([(index + 1) % n, (index + 2) % n]);
    const next = points.map((p, i) => (moved.has(i) ? roundPointCm({ x: p.x + delta * ux, y: p.y + delta * uy }) : { ...p }));
    for (let offset = 0; offset < n; offset++) {
        const i = (index + offset) % n;
        const before = { x: points[(i + 1) % n].x - points[i].x, y: points[(i + 1) % n].y - points[i].y };
        const after = { x: next[(i + 1) % n].x - next[i].x, y: next[(i + 1) % n].y - next[i].y };
        const length = Math.hypot(after.x, after.y);
        const flipped = before.x * after.x + before.y * after.y <= 0;
        if (length < MIN_EDGE_CM - GEOMETRY_EPS_CM || flipped) return { ok: false, reason: "too-short", edgeIndex: i };
    }
    if (!isSimplePolygon(next)) return { ok: false, reason: "intersects" };
    return { ok: true, points: next };
}
