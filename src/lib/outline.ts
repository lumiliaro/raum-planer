/**
 * Outline of a shape as a closed point list in cm, relative to the shape's
 * center and without its rotation. x points right, y points down (as in the
 * floor plan image). Drawing and tests use the same outline.
 */

import type { PointCm, Shape } from "@/lib/plan-schema";
import type { RectCm } from "@/lib/viewport";

/** Centroid of a quarter ellipse, as a fraction of its radii from the right angle: 4 / (3π). */
const QUARTER_CENTROID = 4 / (3 * Math.PI);

/**
 * Where a shape's label sits, in cm relative to its center and without its
 * rotation; mirrored like the outline. Always inside the outline: the center
 * of rectangle and ellipse, the middle of leg A (L-shape) or of the base
 * (U-shape), the centroid of the quarter ellipse (corner) or of the swing (door).
 */
export function getLabelAnchorCm(shape: Shape): PointCm {
    const anchor = baseLabelAnchor(shape);
    return { x: noNegZero(shape.mirrored ? -anchor.x : anchor.x), y: noNegZero(anchor.y) };
}

function baseLabelAnchor(shape: Shape): PointCm {
    switch (shape.kind) {
        case "rect":
        case "ellipse":
        case "polygon":
            return { x: 0, y: 0 };
        case "l-shape":
            return { x: 0, y: shape.depthCm / 2 - shape.legAWidthCm / 2 };
        case "u-shape":
            return { x: 0, y: shape.depthCm / 2 - shape.baseWidthCm / 2 };
        case "corner":
            return {
                x: -shape.widthCm / 2 + QUARTER_CENTROID * shape.widthCm,
                y: shape.depthCm / 2 - QUARTER_CENTROID * shape.depthCm,
            };
        case "door-swing": {
            const w = shape.widthCm;
            return { x: -w / 2 + QUARTER_CENTROID * w, y: w / 2 - QUARTER_CENTROID * w };
        }
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}

/** Maximum distance between the polygon and the exact curve (sagitta), in cm. */
export const MAX_CURVE_DEVIATION_CM = 0.5;

/** Ellipses get at least this many points (a multiple of 4). */
const MIN_ELLIPSE_POINTS = 32;
/** Target maximum segment length of an ellipse, in cm. */
const ELLIPSE_SEGMENT_CM = 4;

/**
 * Returns the outline, or `null` for shape kinds whose outline is not defined
 * yet (polygon). A mirrored shape is mirrored at the vertical axis through its
 * center; the order of the points stays the same, so a door's first point is
 * always its hinge and the second the end of its leaf.
 */
export function getOutlineCm(shape: Shape): PointCm[] | null {
    const points = baseOutline(shape);
    if (!points) return null;
    return shape.mirrored ? points.map((p) => ({ x: noNegZero(-p.x), y: p.y })) : points;
}

function baseOutline(shape: Shape): PointCm[] | null {
    switch (shape.kind) {
        case "rect":
            return rectOutline(shape.widthCm, shape.depthCm, shape.cornerRadiusCm);
        case "ellipse":
            return ellipseOutline(shape.widthCm / 2, shape.depthCm / 2);
        case "l-shape":
            return lShapeOutline(shape.widthCm, shape.depthCm, shape.legAWidthCm, shape.legBWidthCm);
        case "u-shape":
            return uShapeOutline(shape.widthCm, shape.depthCm, shape.baseWidthCm, shape.sideWidthCm);
        case "corner":
            return cornerOutline(shape.widthCm, shape.depthCm);
        case "door-swing":
            return doorOutline(shape.widthCm);
        case "polygon":
            return null;
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}

/**
 * The shape's outline in cm with its rotation and position (absolute);
 * `null` for kinds without outline. Exact at multiples of 90°.
 */
export function placedOutlineCm(shape: Shape): PointCm[] | null {
    const outline = getOutlineCm(shape);
    if (!outline) return null;
    const [cos, sin] = unitAt(shape.rotationDeg);
    return outline.map((p) => ({ x: shape.x + p.x * cos - p.y * sin, y: shape.y + p.x * sin + p.y * cos }));
}

/**
 * Smallest axis-parallel rectangle around the rotated, placed outline (its
 * AABB); `null` for kinds without outline.
 */
export function shapeBoundsCm(shape: Shape): RectCm | null {
    const points = placedOutlineCm(shape);
    if (!points) return null;
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Arcs get at least this many segments. */
const MIN_ARC_SEGMENTS = 6;

/** `cos`/`sin` of an angle in degrees, exact at multiples of 90°. */
function unitAt(deg: number): [number, number] {
    const quarter = deg / 90;
    if (Number.isInteger(quarter)) {
        const q = ((quarter % 4) + 4) % 4;
        return ([[1, 0], [0, 1], [-1, 0], [0, -1]] as const)[q] as [number, number];
    }
    const rad = (deg * Math.PI) / 180;
    return [Math.cos(rad), Math.sin(rad)];
}

/**
 * Points of an elliptic arc around `(cx, cy)` with radii `rx`, `ry`, evenly
 * spaced over the parameter angle from `fromDeg` to `toDeg` (y points down, so
 * angles grow clockwise on screen), including both ends. The number of
 * segments keeps every chord within `MAX_CURVE_DEVIATION_CM` of the curve.
 */
export function sampleEllipseArc(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fromDeg: number,
    toDeg: number,
): PointCm[] {
    const spanRad = (Math.abs(toDeg - fromDeg) * Math.PI) / 180;
    const r = Math.max(rx, ry);
    // Largest angle step whose chord deviates at most the tolerance from a circle of radius r.
    const maxStep = 2 * Math.acos(1 - Math.min(2, MAX_CURVE_DEVIATION_CM / r));
    const n = Math.max(MIN_ARC_SEGMENTS, Math.ceil(spanRad / maxStep - 1e-9));
    const points: PointCm[] = [];
    for (let i = 0; i <= n; i++) {
        const deg = i === n ? toDeg : fromDeg + ((toDeg - fromDeg) * i) / n;
        const [c, s] = unitAt(deg);
        points.push({ x: noNegZero(cx + rx * c), y: noNegZero(cy + ry * s) });
    }
    return points;
}

/**
 * Leg A along the bottom edge (thickness `a` upwards), leg B along the left
 * edge (thickness `b` to the right); like the tool icon.
 */
function lShapeOutline(w: number, d: number, a: number, b: number): PointCm[] {
    const hw = w / 2;
    const hd = d / 2;
    return [
        { x: -hw, y: hd },
        { x: hw, y: hd },
        { x: hw, y: hd - a },
        { x: -hw + b, y: hd - a },
        { x: -hw + b, y: -hd },
        { x: -hw, y: -hd },
    ].map(cleanPoint);
}

/** Base along the bottom edge (thickness `c` upwards), sides of thickness `s` along left and right; open at the top. */
function uShapeOutline(w: number, d: number, c: number, s: number): PointCm[] {
    const hw = w / 2;
    const hd = d / 2;
    return [
        { x: -hw, y: -hd },
        { x: -hw + s, y: -hd },
        { x: -hw + s, y: hd - c },
        { x: hw - s, y: hd - c },
        { x: hw - s, y: -hd },
        { x: hw, y: -hd },
        { x: hw, y: hd },
        { x: -hw, y: hd },
    ].map(cleanPoint);
}

/** Right angle bottom left, arc from the bottom right to the top left corner; like the tool icon. */
function cornerOutline(w: number, d: number): PointCm[] {
    const corner = { x: -w / 2, y: d / 2 };
    return [cleanPoint(corner), ...sampleEllipseArc(corner.x, corner.y, w, d, 0, -90)];
}

/** Hinge bottom left, open leaf along the left edge, swing around the hinge to the bottom right corner. */
function doorOutline(w: number): PointCm[] {
    const hinge = { x: -w / 2, y: w / 2 };
    return [cleanPoint(hinge), ...sampleEllipseArc(hinge.x, hinge.y, w, w, -90, 0)];
}

function cleanPoint(p: PointCm): PointCm {
    return { x: noNegZero(p.x), y: noNegZero(p.y) };
}

/** Smallest number of segments (≥ 2) for a quarter arc whose sagitta stays within the limit. */
export function quarterArcSegments(radiusCm: number): number {
    let n = 2;
    while (radiusCm * (1 - Math.cos(Math.PI / (4 * n))) > MAX_CURVE_DEVIATION_CM) n++;
    return n;
}

/** Number of ellipse points: a multiple of 4 (contains the four vertices), at least 32. */
export function ellipsePointCount(a: number, b: number): number {
    // Ramanujan's approximation of the perimeter.
    const perimeter = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    return Math.max(MIN_ELLIPSE_POINTS, 4 * Math.ceil(perimeter / (4 * ELLIPSE_SEGMENT_CM)));
}

/**
 * `(cos τ, sin τ)` for `n + 1` angles evenly spaced over a quarter turn,
 * with exact values at both ends.
 */
function quarterUnitPoints(n: number): Array<[number, number]> {
    const result: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) {
        if (i === 0) result.push([1, 0]);
        else if (i === n) result.push([0, 1]);
        else {
            const t = (i * Math.PI) / (2 * n);
            result.push([Math.cos(t), Math.sin(t)]);
        }
    }
    return result;
}

function rectOutline(widthCm: number, depthCm: number, radiusCm: number): PointCm[] {
    const hw = widthCm / 2;
    const hh = depthCm / 2;
    if (radiusCm <= 0) {
        return [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh },
        ];
    }

    const r = radiusCm;
    const unit = quarterUnitPoints(quarterArcSegments(r));
    const points: PointCm[] = [];
    const arc = (cx: number, cy: number, map: (c: number, s: number) => [number, number]) => {
        for (const [c, s] of unit) {
            const [dx, dy] = map(c, s);
            points.push({ x: noNegZero(cx + r * dx), y: noNegZero(cy + r * dy) });
        }
    };
    // Clockwise on screen, starting where the top edge leaves the top-left arc.
    arc(hw - r, -hh + r, (c, s) => [s, -c]); // top right: from (hw − r, −hh) to (hw, −hh + r)
    arc(hw - r, hh - r, (c, s) => [c, s]); // bottom right
    arc(-hw + r, hh - r, (c, s) => [-s, c]); // bottom left
    arc(-hw + r, -hh + r, (c, s) => [-c, -s]); // top left: ends at (−hw + r, −hh)
    return dropRepeatedPoints(points);
}

function ellipseOutline(a: number, b: number): PointCm[] {
    const unit = quarterUnitPoints(ellipsePointCount(a, b) / 4).slice(0, -1);
    const points: PointCm[] = [];
    // Parameter t = 0 … 2π, built from one quarter so the four vertices are exact.
    for (const [c, s] of unit) points.push({ x: a * c, y: b * s });
    for (const [c, s] of unit) points.push({ x: -a * s, y: b * c });
    for (const [c, s] of unit) points.push({ x: -a * c, y: -b * s });
    for (const [c, s] of unit) points.push({ x: a * s, y: -b * c });
    return points.map((p) => ({ x: noNegZero(p.x), y: noNegZero(p.y) }));
}

/** Removes consecutive duplicates, including last = first (arcs meeting at r = half side). */
function dropRepeatedPoints(points: PointCm[]): PointCm[] {
    const result = points.filter((p, i) => {
        const prev = points[(i + points.length - 1) % points.length];
        return i === 0 ? true : p.x !== prev.x || p.y !== prev.y;
    });
    const first = result[0];
    const last = result[result.length - 1];
    if (result.length > 1 && first.x === last.x && first.y === last.y) result.pop();
    return result;
}

function noNegZero(v: number): number {
    return v === 0 ? 0 : v;
}
