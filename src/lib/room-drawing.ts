/**
 * Pure logic of drawing a room corner by corner: snapping the direction to the
 * axes, edges of a typed length, snapping to corners and checking whether a
 * corner may be set or the outline closed. All in cm.
 */

import type { PointCm } from "@/lib/plan-schema";
import {
    distanceCm,
    GEOMETRY_EPS_CM,
    hasNoZeroEdges,
    isSimplePolygon,
    MIN_EDGE_CM,
    roundPointCm,
    segmentsIntersect,
} from "@/lib/room-geometry";

export { roundPointCm };

/** Corners snap when the pointer is at most this many screen pixels away. */
export const CORNER_SNAP_RADIUS_PX = 8;

/** A unit vector. */
export interface Direction {
    x: number;
    y: number;
}

/**
 * Direction of the edge from `from` towards the pointer. Without `free` it
 * snaps to the nearest of 0°, 90°, 180° and 270° (horizontal on a tie); with
 * `free` it follows the pointer. `null` if the pointer lies on `from`.
 */
export function snapDirection(from: PointCm, pointer: PointCm, free: boolean): Direction | null {
    const dx = pointer.x - from.x;
    const dy = pointer.y - from.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) return null;
    if (free) return { x: dx / length, y: dy / length };
    return Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
}

/** The point `lengthCm` from `from` in `direction`, rounded to 0.1 cm. */
export function pointAtDistance(from: PointCm, direction: Direction, lengthCm: number): PointCm {
    return roundPointCm({ x: from.x + direction.x * lengthCm, y: from.y + direction.y * lengthCm });
}

/**
 * End of the edge shown towards the pointer: the pointer projected onto the
 * snapped direction (the pointer itself with `free`), rounded to 0.1 cm.
 * `null` if the pointer lies on `from`.
 */
export function edgeEndAtPointer(from: PointCm, pointer: PointCm, free: boolean): PointCm | null {
    const direction = snapDirection(from, pointer, free);
    if (!direction) return null;
    const length = (pointer.x - from.x) * direction.x + (pointer.y - from.y) * direction.y;
    return pointAtDistance(from, direction, length);
}

/** The corner nearest to the pointer within `radiusCm`, or `null`. */
export function snapToCorner(pointer: PointCm, corners: readonly PointCm[], radiusCm: number): PointCm | null {
    let best: PointCm | null = null;
    let bestDistance = radiusCm;
    for (const corner of corners) {
        const distance = distanceCm(pointer, corner);
        if (distance <= bestDistance) {
            best = corner;
            bestDistance = distance;
        }
    }
    return best ? { ...best } : null;
}

/**
 * `true` if `p` may be the next corner after `points`: its edge is at least
 * 0.1 cm long and shares no point with the edges drawn so far, except the
 * corner it starts at. The very first point is always allowed.
 */
export function canAppendPoint(points: readonly PointCm[], p: PointCm): boolean {
    const count = points.length;
    if (count === 0) return true;
    const last = points[count - 1];
    if (distanceCm(last, p) < MIN_EDGE_CM - GEOMETRY_EPS_CM) return false;
    if (count >= 2) {
        // The previous edge only shares the corner `last`: no doubling back on its line.
        const before = points[count - 2];
        const pOnPrevious = segmentsIntersect(before, last, p, p);
        const beforeOnNew = segmentsIntersect(last, p, before, before);
        if (pOnPrevious || beforeOnNew) return false;
    }
    for (let j = 0; j + 2 < count; j++) {
        if (segmentsIntersect(points[j], points[j + 1], last, p)) return false;
    }
    return true;
}

/**
 * `true` if the outline can be closed: at least 3 corners, no edge of 0 cm
 * (also not the closing one) and no self-intersection.
 */
export function canClose(points: readonly PointCm[]): boolean {
    return points.length >= 3 && hasNoZeroEdges(points) && isSimplePolygon(points);
}

/** A horizontal (`axis: "y"`) or vertical (`axis: "x"`) guide through a corner. */
export interface DraftGuide {
    /** The coordinate the guide fixes: `x` for a vertical guide, `y` for a horizontal one. */
    axis: "x" | "y";
    valueCm: number;
    /** The corner the guide runs through (where it is drawn from). */
    from: PointCm;
}

/**
 * Corners the guides run through: the corners set so far except the last one
 * (a guide through it would give an edge of 0 cm or the edge itself), then the
 * corners of the other rooms. On a tie the earlier one wins, so own corners
 * come first.
 */
export function draftGuideSources(points: readonly PointCm[], roomCorners: readonly PointCm[]): PointCm[] {
    return [...points.slice(0, -1), ...roomCorners];
}

/**
 * Snaps `point` per requested axis to the nearest guide through one of
 * `sources` within `radiusCm` (the first one on a tie). Returns the point and
 * the guides that took effect (at most one per axis).
 */
export function snapToGuides(
    point: PointCm,
    sources: readonly PointCm[],
    axes: readonly ("x" | "y")[],
    radiusCm: number,
): { point: PointCm; guides: DraftGuide[] } {
    const result = { ...point };
    const guides: DraftGuide[] = [];
    for (const axis of axes) {
        let best: PointCm | null = null;
        let bestDistance = radiusCm;
        for (const source of sources) {
            const distance = Math.abs(source[axis] - point[axis]);
            if (distance < bestDistance || (!best && distance <= bestDistance)) {
                best = source;
                bestDistance = distance;
            }
        }
        if (best) {
            result[axis] = best[axis];
            guides.push({ axis, valueCm: best[axis], from: { ...best } });
        }
    }
    return { point: roundPointCm(result), guides };
}

/** What a click at the pointer would do while drawing a room. */
export interface DraftPointer {
    /** The corner a click would set; `null` if the pointer lies on the last corner. */
    point: PointCm | null;
    /** `point` snapped to the start point or a corner of a room (shown with a ring). */
    snapped: boolean;
    /** A click closes the outline: the pointer snapped to the start point with at least 3 corners set. */
    closes: boolean;
    /** The guides `point` snapped to (0–2), drawn dashed while drawing. */
    guides: DraftGuide[];
}

export interface DraftPointerOptions {
    /** Snap radius for corners and guides in cm (8 screen px). */
    radiusCm: number;
    /** Shift: free angle instead of 0°/90°/180°/270°. */
    free: boolean;
    /** Snap to guides („Einrasten“ on and Ctrl not held). */
    guides: boolean;
}

/**
 * The next corner for the pointer: the start point or a room corner within
 * `radiusCm` wins; otherwise the end of the edge in the snapped direction
 * (`free`: the pointer itself), the first corner being the rounded pointer.
 * With `guides` that point then snaps to guides through the other corners:
 * on a straight edge only across the edge, so it stays straight; for the
 * first corner and with `free` on each axis.
 */
export function resolveDraftPointer(
    points: readonly PointCm[],
    pointer: PointCm,
    roomCorners: readonly PointCm[],
    { radiusCm, free, guides }: DraftPointerOptions,
): DraftPointer {
    const start = points[0];
    const corner = snapToCorner(pointer, start ? [start, ...roomCorners] : roomCorners, radiusCm);
    if (corner) {
        const point = roundPointCm(corner);
        const closes = points.length >= 3 && point.x === start.x && point.y === start.y;
        return { point, snapped: true, closes, guides: [] };
    }
    const last = points.at(-1);
    const end = last ? edgeEndAtPointer(last, pointer, free) : roundPointCm(pointer);
    if (!end || !guides) return { point: end, snapped: false, closes: false, guides: [] };
    const axes: ("x" | "y")[] = !last || free ? ["x", "y"] : end.y === last.y ? ["x"] : ["y"];
    const snapped = snapToGuides(end, draftGuideSources(points, roomCorners), axes, radiusCm);
    // A guide must not pull the corner onto the last one (an edge of 0 cm).
    if (last && snapped.point.x === last.x && snapped.point.y === last.y) {
        return { point: end, snapped: false, closes: false, guides: [] };
    }
    return { point: snapped.point, snapped: false, closes: false, guides: snapped.guides };
}
