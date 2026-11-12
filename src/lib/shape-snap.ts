/**
 * Snapping of a dragged shape to the snap lines of its room: room center,
 * middle of openings, walls and other shapes in the room. Everything is an
 * axis-parallel line `x = c` or `y = c`; each axis snaps on its own, the
 * nearest line within the tolerance wins, otherwise the grid relative to the
 * drag start applies. Pure, no React or Konva dependencies.
 */

import { edgeFrame, openingMisfit, pointOnEdge } from "@/lib/opening-geometry";
import { shapeBoundsCm } from "@/lib/outline";
import type { PointCm, Room, Shape } from "@/lib/plan-schema";
import { boundsCm, containsPoint, GEOMETRY_EPS_CM, roundCm } from "@/lib/room-geometry";
import { edgeOutwardNormals } from "@/lib/room-snap";
import { snapDelta } from "@/lib/snap";

/** A shape snaps when it is at most this many screen pixels away from a line. */
export const SHAPE_SNAP_TOLERANCE_PX = 8;

export type SnapAxis = "x" | "y";
/** Side or middle of the dragged shape's axis-parallel bounding box. */
export type SnapFeature = "min" | "center" | "max";
export type SnapLineKind = "wall" | "opening" | "room-center" | "shape";

/** An axis-parallel snap line `axis = valueCm` and the features of the dragged shape that may snap to it. */
export interface SnapLine {
    axis: SnapAxis;
    valueCm: number;
    kind: SnapLineKind;
    features: SnapFeature[];
}

/** On a tie the earlier kind wins. */
const KIND_PRIORITY: Record<SnapLineKind, number> = { wall: 0, opening: 1, "room-center": 2, shape: 3 };

/**
 * All snap lines of a room: its center (middle of the bounding box of its
 * corners), the middle of every opening that fits on a horizontal or vertical
 * edge, the inner side of every horizontal or vertical edge and the sides and
 * middle of the bounding boxes of `shapesInRoom` (the caller leaves out the
 * dragged shape). Slanted edges and shapes without outline give no lines.
 */
export function roomSnapLines(room: Room, shapesInRoom: readonly Shape[]): SnapLine[] {
    const points = room.pointsCm;
    const lines: SnapLine[] = [];

    const box = boundsCm(points);
    lines.push({ axis: "x", valueCm: box.x + box.width / 2, kind: "room-center", features: ["center"] });
    lines.push({ axis: "y", valueCm: box.y + box.height / 2, kind: "room-center", features: ["center"] });

    const normals = edgeOutwardNormals(points);
    const edgeAxis = (i: number): SnapAxis | null => {
        const a = points[i];
        const b = points[(i + 1) % points.length];
        if (!normals[i]) return null;
        if (Math.abs(b.y - a.y) <= GEOMETRY_EPS_CM) return "y";
        if (Math.abs(b.x - a.x) <= GEOMETRY_EPS_CM) return "x";
        return null;
    };

    points.forEach((a, i) => {
        const axis = edgeAxis(i);
        const normal = normals[i];
        if (!axis || !normal) return;
        // The room lies against the outward normal: a wall with the room below it takes the shape's top (`min`).
        const outward = axis === "y" ? normal.y : normal.x;
        lines.push({ axis, valueCm: axis === "y" ? a.y : a.x, kind: "wall", features: [outward < 0 ? "min" : "max"] });
    });

    for (const opening of room.openings) {
        if (openingMisfit(points, opening)) continue;
        const edgeAxisOfOpening = edgeAxis(opening.edgeIndex);
        if (!edgeAxisOfOpening) continue;
        const middle = pointOnEdge(edgeFrame(points, opening.edgeIndex), opening.offsetCm + opening.widthCm / 2);
        // Across the wall: a horizontal edge gives a vertical line and vice versa.
        const axis: SnapAxis = edgeAxisOfOpening === "y" ? "x" : "y";
        lines.push({ axis, valueCm: middle[axis], kind: "opening", features: ["center"] });
    }

    for (const shape of shapesInRoom) {
        const b = shapeBoundsCm(shape);
        if (!b) continue;
        for (const [axis, lo, size] of [["x", b.x, b.width], ["y", b.y, b.height]] as const) {
            lines.push({ axis, valueCm: lo, kind: "shape", features: ["min", "max"] });
            lines.push({ axis, valueCm: lo + size / 2, kind: "shape", features: ["center"] });
            lines.push({ axis, valueCm: lo + size, kind: "shape", features: ["max", "min"] });
        }
    }
    return lines;
}

/** Sides of the dragged shape's bounding box along one axis, relative to its center (`min` ≤ 0 ≤ `max` as a rule). */
export interface ShapeExtent {
    min: number;
    max: number;
}

export interface ShapeMoveSnapInput {
    /** Shape center at drag start. */
    startCm: PointCm;
    /** Offset of the pointer since drag start, without grid or snapping. */
    rawDeltaCm: PointCm;
    /** Grid step for an axis without snap line. */
    stepCm: number;
    /** Bounding box of the shape relative to its center, per axis. */
    extentCm: Record<SnapAxis, ShapeExtent>;
    lines: readonly SnapLine[];
    toleranceCm: number;
}

export interface ShapeMoveSnapResult {
    /** Offset to apply to the shape, rounded to 0.1 cm. */
    deltaCm: PointCm;
    /** The line each axis snapped to, `null` = grid. */
    hits: Record<SnapAxis, SnapLine | null>;
}

function featureOffset(feature: SnapFeature, extent: ShapeExtent): number {
    if (feature === "min") return extent.min;
    if (feature === "max") return extent.max;
    return (extent.min + extent.max) / 2;
}

/** The nearest line within the tolerance and the snapped center on `axis`, or `null`. */
function snapAxis(
    axis: SnapAxis,
    rawCenter: number,
    extent: ShapeExtent,
    lines: readonly SnapLine[],
    toleranceCm: number,
): { center: number; line: SnapLine } | null {
    let best: { center: number; line: SnapLine; distance: number } | null = null;
    for (const line of lines) {
        if (line.axis !== axis) continue;
        for (const feature of line.features) {
            const offset = featureOffset(feature, extent);
            const distance = Math.abs(rawCenter + offset - line.valueCm);
            if (distance > toleranceCm) continue;
            const better =
                !best ||
                distance < best.distance - 1e-9 ||
                (Math.abs(distance - best.distance) <= 1e-9 && KIND_PRIORITY[line.kind] < KIND_PRIORITY[best.line.kind]);
            if (better) best = { center: line.valueCm - offset, line, distance };
        }
    }
    return best && { center: best.center, line: best.line };
}

/**
 * Snaps a shape move per axis: the line nearest to the raw position within
 * `toleranceCm` wins (ties: wall, opening, room center, shape); an axis
 * without such a line moves on the grid relative to the start.
 */
export function snapShapeMove(input: ShapeMoveSnapInput): ShapeMoveSnapResult {
    const { startCm, rawDeltaCm, stepCm, extentCm, lines, toleranceCm } = input;
    const axisResult = (axis: SnapAxis) => {
        const hit = snapAxis(axis, startCm[axis] + rawDeltaCm[axis], extentCm[axis], lines, toleranceCm);
        return hit
            ? { delta: roundCm(hit.center - startCm[axis]), line: hit.line }
            : { delta: roundCm(snapDelta(rawDeltaCm[axis], stepCm)), line: null };
    };
    const x = axisResult("x");
    const y = axisResult("y");
    return { deltaCm: { x: x.delta, y: y.delta }, hits: { x: x.line, y: y.line } };
}

/** Distance of `p` to the segment `a`–`b`. */
function segmentDistance(p: PointCm, a: PointCm, b: PointCm): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function onOutline(points: readonly PointCm[], p: PointCm): boolean {
    return points.some((a, i) => segmentDistance(p, a, points[(i + 1) % points.length]) <= GEOMETRY_EPS_CM);
}

/** The first room in `rooms` that contains `point` (its outline counts as inside), else `null`. */
export function roomAtPoint<R extends Pick<Room, "pointsCm">>(rooms: readonly R[], point: PointCm): R | null {
    return rooms.find((room) => containsPoint(room.pointsCm, point) || onOutline(room.pointsCm, point)) ?? null;
}
