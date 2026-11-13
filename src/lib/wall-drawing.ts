/**
 * Pure logic of drawing a free wall with the tool „Wand“ and of dragging one
 * of its ends: where the start or end point lands for the pointer. Built on
 * the snapping blocks of drawing a room (`room-drawing.ts`). All in cm.
 */

import type { PointCm, Room, Wall } from "@/lib/plan-schema";
import {
    edgeEndAtPointer,
    snapDirection,
    snapToCorner,
    snapToGuides,
    snapToWall,
    wallLines,
    type Direction,
    type DraftGuide,
    type WallLine,
    type WallPosition,
} from "@/lib/room-drawing";
import { distanceCm, GEOMETRY_EPS_CM, MIN_EDGE_CM, roundPointCm } from "@/lib/room-geometry";
import { wallEnds, wallSideLines } from "@/lib/wall-geometry";

/** The two sides of every free wall as wall lines; `exceptId` leaves one wall out (the one being dragged). */
export function freeWallLines(walls: readonly Wall[], exceptId?: string): WallLine[] {
    return walls
        .filter((wall) => wall.id !== exceptId)
        .flatMap((wall) =>
            wallSideLines(wall).map(
                (side): WallLine => ({
                    source: { kind: "wall", wallId: wall.id, side: side.side },
                    start: side.start,
                    end: side.end,
                    lengthCm: distanceCm(side.start, side.end),
                    outwardNormal: side.normal,
                }),
            ),
        );
}

/** Below this |sin| of the angle between the wall and a wall line, they count as parallel. */
const PARALLEL_EPS = 1e-6;

/**
 * Where the wall from `start` in `direction` meets the nearest wall line the
 * pointer lies at most `radiusCm` beside: the intersection must lie between
 * the line's ends, ahead of `start` (at least 0.1 cm) and at most `radiusCm`
 * from the pointer. Lines parallel to the wall do not count. Rounded to
 * 0.1 cm; `null` if no line qualifies.
 */
export function snapEndToWallLine(
    start: PointCm,
    direction: Direction,
    pointer: PointCm,
    lines: readonly WallLine[],
    radiusCm: number,
): PointCm | null {
    let best: PointCm | null = null;
    let bestDistance = Infinity;
    for (const line of lines) {
        if (line.lengthCm <= 0) continue;
        const ux = (line.end.x - line.start.x) / line.lengthCm;
        const uy = (line.end.y - line.start.y) / line.lengthCm;
        const across = Math.abs((pointer.x - line.start.x) * uy - (pointer.y - line.start.y) * ux);
        if (across > radiusCm) continue;
        const cross = direction.x * uy - direction.y * ux;
        if (Math.abs(cross) < PARALLEL_EPS) continue;
        // start + t·direction = line.start + s·u
        const wx = line.start.x - start.x;
        const wy = line.start.y - start.y;
        const t = (wx * uy - wy * ux) / cross;
        const s = (wx * direction.y - wy * direction.x) / cross;
        if (t < MIN_EDGE_CM - GEOMETRY_EPS_CM || s < -GEOMETRY_EPS_CM || s > line.lengthCm + GEOMETRY_EPS_CM) continue;
        const hit = { x: start.x + direction.x * t, y: start.y + direction.y * t };
        const distance = distanceCm(hit, pointer);
        if (distance <= radiusCm && distance < bestDistance) {
            best = hit;
            bestDistance = distance;
        }
    }
    return best ? roundPointCm(best) : null;
}

/** What a click (or releasing a dragged end) at the pointer would set while drawing a wall. */
export interface WallPointer {
    /** The point a click would set; `null` if the pointer lies on the start point. */
    point: PointCm | null;
    /** `point` snapped to a room corner, a wall end or (end point) a wall line; shown with a ring. */
    snapped: boolean;
    /** The guides `point` snapped to (0–2), drawn dashed. */
    guides: DraftGuide[];
    /** The start point snapped onto a wall line (shown with its distances to the wall ends). */
    wall?: WallPosition;
}

export interface WallPointerOptions {
    /** Snap radius for corners, wall lines and guides in cm (8 screen px). */
    radiusCm: number;
    /** Shift: free angle instead of 0°/90°/180°/270°. */
    free: boolean;
    /** Snap to guides and wall lines („Einrasten“ on and Ctrl not held). */
    snap: boolean;
    /** Step along a wall line for the start point in cm (fine step while Alt is held). */
    stepCm: number;
}

/** What the pointer snaps to: room corners and the ends of the other walls, the wall lines. */
export interface WallSnapTargets {
    /** Room corners and ends of the other walls; corners snap, guides run through them. */
    corners: readonly PointCm[];
    /** Sides of the rooms' walls and of the other free walls. */
    lines: readonly WallLine[];
}

/**
 * The snap targets on a floor: room corners and wall lines of all rooms, ends
 * and sides of all free walls except `exceptId` (the wall whose end is dragged).
 */
export function wallSnapTargets(rooms: readonly Room[], walls: readonly Wall[], exceptId?: string): WallSnapTargets {
    const others = walls.filter((w) => w.id !== exceptId);
    return {
        corners: [...rooms.flatMap((r) => r.pointsCm), ...wallEnds(others)],
        lines: [...wallLines(rooms), ...freeWallLines(others)],
    };
}

/** The drawing tools that use the draft: „Raum“ and „Wand“. */
export type DraftTool = "room" | "wall";

/**
 * What the pointer snaps to while drawing: with „Raum“ the rooms' corners and
 * wall lines, with „Wand“ also the free walls' ends and sides (`wallSnapTargets`).
 */
export function draftTargets(tool: DraftTool, rooms: readonly Room[], walls: readonly Wall[]): WallSnapTargets {
    if (tool === "wall") return wallSnapTargets(rooms, walls);
    return { corners: rooms.flatMap((room) => room.pointsCm), lines: wallLines(rooms) };
}

/**
 * The start point (`start` = `null`) or the end point for the pointer.
 * Start: a corner within `radiusCm` wins, then a position on a wall line, then
 * the rounded pointer snapped to guides on each axis. End: a corner wins, then
 * the intersection with a wall line (`snapEndToWallLine`), then the end in the
 * snapped direction (`free`: the pointer), snapped to guides across a straight
 * wall or, with `free`, on each axis. Without `snap` neither wall lines nor
 * guides take effect.
 */
export function resolveWallPointer(
    start: PointCm | null,
    pointer: PointCm,
    { corners, lines }: WallSnapTargets,
    { radiusCm, free, snap, stepCm }: WallPointerOptions,
): WallPointer {
    const corner = snapToCorner(pointer, corners, radiusCm);
    if (corner) return { point: roundPointCm(corner), snapped: true, guides: [] };

    if (!start) {
        if (snap) {
            const wall = snapToWall(pointer, lines, { radiusCm, stepCm });
            if (wall) return { point: wall.point, snapped: false, guides: [], wall };
        }
        const point = roundPointCm(pointer);
        if (!snap) return { point, snapped: false, guides: [] };
        const guided = snapToGuides(point, corners, ["x", "y"], radiusCm);
        return { point: guided.point, snapped: false, guides: guided.guides };
    }

    const direction = snapDirection(start, pointer, free);
    if (!direction) return { point: null, snapped: false, guides: [] };
    if (snap) {
        const onLine = snapEndToWallLine(start, direction, pointer, lines, radiusCm);
        if (onLine) return { point: onLine, snapped: true, guides: [] };
    }
    const end = edgeEndAtPointer(start, pointer, free);
    if (!end || !snap) return { point: end, snapped: false, guides: [] };
    const axes: ("x" | "y")[] = free ? ["x", "y"] : end.y === start.y ? ["x"] : ["y"];
    const guided = snapToGuides(end, corners, axes, radiusCm);
    // A guide must not pull the end onto the start (a wall of 0 cm).
    if (guided.point.x === start.x && guided.point.y === start.y) return { point: end, snapped: false, guides: [] };
    return { point: guided.point, snapped: false, guides: guided.guides };
}
