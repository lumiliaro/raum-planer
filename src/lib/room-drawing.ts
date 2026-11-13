/**
 * Pure logic of drawing a room corner by corner: snapping the direction to the
 * axes, edges of a typed length, snapping to corners and checking whether a
 * corner may be set or the outline closed. All in cm.
 */

import type { PointCm, Room } from "@/lib/plan-schema";
import {
    DEFAULT_WALL_THICKNESS_CM,
    distanceCm,
    GEOMETRY_EPS_CM,
    hasNoZeroEdges,
    isSimplePolygon,
    MIN_EDGE_CM,
    roundPointCm,
    segmentsIntersect,
} from "@/lib/room-geometry";
import { edgeOutwardNormals } from "@/lib/room-snap";

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

/**
 * Where a wall line comes from: one side of a room's wall – the edge itself
 * (`inner`) or the edge moved outwards by its wall thickness (`outer`) – or
 * one side of a free wall (see `wallSideLines` in `wall-geometry.ts`).
 */
export type WallLineSource =
    | { kind: "room"; roomId: string; edgeIndex: number; face: "inner" | "outer" }
    | { kind: "wall"; wallId: string; side: "left" | "right" };

/** One side of a wall, with its source. */
export interface WallLine {
    source: WallLineSource;
    /** At the edge's start corner (`outer`: moved outwards, not the mitred corner of the wall band). */
    start: PointCm;
    end: PointCm;
    /** Length of the edge in cm, the same on both sides. */
    lengthCm: number;
    /** Unit normal: out of the room for a room's wall, away from the center line for a free wall. */
    outwardNormal: PointCm;
}

/** `true` if both sources name the same side of the same wall. */
export function sameWallLineSource(a: WallLineSource, b: WallLineSource): boolean {
    if (a.kind === "room" && b.kind === "room") return a.roomId === b.roomId && a.edgeIndex === b.edgeIndex && a.face === b.face;
    if (a.kind === "wall" && b.kind === "wall") return a.wallId === b.wallId && a.side === b.side;
    return false;
}

/**
 * The side of a wall line on which its distances are labelled, along
 * `outwardNormal`: away from the wall material, so into the room (`-1`) for
 * the inner side of a room's wall, else outwards (`1`).
 */
export function wallLineLabelSide(line: WallLine): 1 | -1 {
    return line.source.kind === "room" && line.source.face === "inner" ? -1 : 1;
}

/** The end of a wall line a position is measured from. */
export type WallEnd = "start" | "end";

/** A point on a wall line, `offsetCm` from the end `fromEnd`. */
export interface WallPosition {
    line: WallLine;
    fromEnd: WallEnd;
    offsetCm: number;
    /** The point, rounded to 0.1 cm. */
    point: PointCm;
}

/** Rounds to 0.1 cm (never `-0`). */
const roundCm = (value: number): number => Math.round(value * 10) / 10 + 0;

/**
 * The wall lines of all rooms: per edge longer than 0 cm the edge itself and
 * the edge moved outwards by its wall thickness.
 */
export function wallLines(rooms: readonly Room[]): WallLine[] {
    const lines: WallLine[] = [];
    for (const room of rooms) {
        const points = room.pointsCm;
        const normals = edgeOutwardNormals(points);
        points.forEach((start, edgeIndex) => {
            const normal = normals[edgeIndex];
            if (!normal) return;
            const end = points[(edgeIndex + 1) % points.length];
            const lengthCm = distanceCm(start, end);
            const thickness = room.wallThicknessCm[edgeIndex] ?? DEFAULT_WALL_THICKNESS_CM;
            const shift = (p: PointCm): PointCm => ({ x: p.x + normal.x * thickness, y: p.y + normal.y * thickness });
            const outwardNormal = { ...normal };
            lines.push({
                source: { kind: "room", roomId: room.id, edgeIndex, face: "inner" },
                start: { ...start },
                end: { ...end },
                lengthCm,
                outwardNormal,
            });
            lines.push({
                source: { kind: "room", roomId: room.id, edgeIndex, face: "outer" },
                start: shift(start),
                end: shift(end),
                lengthCm,
                outwardNormal,
            });
        });
    }
    return lines;
}

/** The point on `line` `offsetCm` from the end `fromEnd`, rounded to 0.1 cm. */
export function pointOnWall(line: WallLine, fromEnd: WallEnd, offsetCm: number): PointCm {
    const [from, to] = fromEnd === "start" ? [line.start, line.end] : [line.end, line.start];
    const f = line.lengthCm > 0 ? offsetCm / line.lengthCm : 0;
    return roundPointCm({ x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f });
}

/** Distances of a wall position to the start and the end of its line, in cm (0.1 cm). */
export function wallDistances(position: WallPosition): { fromStartCm: number; fromEndCm: number } {
    const { line, fromEnd, offsetCm } = position;
    const fromStartCm = roundCm(fromEnd === "start" ? offsetCm : line.lengthCm - offsetCm);
    return { fromStartCm, fromEndCm: roundCm(line.lengthCm - fromStartCm) };
}

/**
 * The wall position for the pointer: on the nearest wall line at most
 * `radiusCm` across and between its ends (the earlier line on a tie). The
 * distance from the nearer end is rounded to `stepCm` and kept on the line.
 * `null` if no line is near.
 */
export function snapToWall(
    pointer: PointCm,
    lines: readonly WallLine[],
    { radiusCm, stepCm }: { radiusCm: number; stepCm: number },
): WallPosition | null {
    let best: { line: WallLine; t: number } | null = null;
    let bestDistance = Infinity;
    for (const line of lines) {
        const length = line.lengthCm;
        if (length <= 0) continue;
        const dx = (line.end.x - line.start.x) / length;
        const dy = (line.end.y - line.start.y) / length;
        const rx = pointer.x - line.start.x;
        const ry = pointer.y - line.start.y;
        const t = rx * dx + ry * dy;
        if (t < 0 || t > length) continue;
        const across = Math.abs(rx * dy - ry * dx);
        if (across <= radiusCm && across < bestDistance) {
            best = { line, t };
            bestDistance = across;
        }
    }
    if (!best) return null;
    const { line, t } = best;
    const fromEnd: WallEnd = t <= line.lengthCm / 2 ? "start" : "end";
    const raw = fromEnd === "start" ? t : line.lengthCm - t;
    const offsetCm = roundCm(Math.min(line.lengthCm, Math.max(0, Math.round(raw / stepCm) * stepCm)));
    return { line, fromEnd, offsetCm, point: pointOnWall(line, fromEnd, offsetCm) };
}

/** The wall line a typed distance is measured on, and the end it is measured from. */
export interface WallAnchor {
    source: WallLineSource;
    fromEnd: WallEnd;
}

/** The anchor of a wall position (its line and reference end). */
export function wallAnchorOf({ line, fromEnd }: WallPosition): WallAnchor {
    return { source: line.source, fromEnd };
}

/** The anchor's wall line among the current `lines`; `null` if its room, edge or wall is gone. */
export function wallLineFor(lines: readonly WallLine[], anchor: WallAnchor): WallLine | null {
    return lines.find((l) => sameWallLineSource(l.source, anchor.source)) ?? null;
}

const OFFSET_PATTERN = /^\d+([.,]\d+)?$/;

/** A typed distance on a wall: `"12,5"` / `"12.5"` → `12.5`, `"0"` → `0`; empty or non-numeric → `null`. */
export function parseOffsetCm(text: string): number | null {
    const trimmed = text.trim();
    if (!OFFSET_PATTERN.test(trimmed)) return null;
    const value = Number(trimmed.replace(",", "."));
    return Number.isFinite(value) && value >= 0 ? value : null;
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
    /** The first corner snapped onto a wall line (shown with its distances to the wall ends). */
    wall?: WallPosition;
}

export interface DraftPointerOptions {
    /** Snap radius for corners and guides in cm (8 screen px). */
    radiusCm: number;
    /** Shift: free angle instead of 0°/90°/180°/270°. */
    free: boolean;
    /** Snap to guides („Einrasten“ on and Ctrl not held). */
    guides: boolean;
    /** Wall lines the first corner snaps onto; `null` = off (Ctrl held or „Einrasten“ off). */
    walls: readonly WallLine[] | null;
    /** Step along a wall line in cm (fine step while Alt is held). */
    stepCm: number;
}

/**
 * The next corner for the pointer: the start point or a room corner within
 * `radiusCm` wins; then, for the first corner only, a position on one of
 * `walls` within `radiusCm` (no guides); otherwise the end of the edge in the snapped direction
 * (`free`: the pointer itself), the first corner being the rounded pointer.
 * With `guides` that point then snaps to guides through the other corners:
 * on a straight edge only across the edge, so it stays straight; for the
 * first corner and with `free` on each axis.
 */
export function resolveDraftPointer(
    points: readonly PointCm[],
    pointer: PointCm,
    roomCorners: readonly PointCm[],
    { radiusCm, free, guides, walls, stepCm }: DraftPointerOptions,
): DraftPointer {
    const start = points[0];
    const corner = snapToCorner(pointer, start ? [start, ...roomCorners] : roomCorners, radiusCm);
    if (corner) {
        const point = roundPointCm(corner);
        const closes = points.length >= 3 && point.x === start.x && point.y === start.y;
        return { point, snapped: true, closes, guides: [] };
    }
    if (points.length === 0 && walls) {
        const wall = snapToWall(pointer, walls, { radiusCm, stepCm });
        if (wall) return { point: wall.point, snapped: false, closes: false, guides: [], wall };
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
