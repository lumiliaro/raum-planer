/**
 * Pure geometry of free walls: a straight piece given by the start and end
 * point of its center line (absolute, in cm) and its thickness, half of it on
 * each side of the center line. No React or Konva dependencies.
 */

import type { PointCm, Wall } from "@/lib/plan-schema";
import { boundsCm, distanceCm, roundCm, roundPointCm } from "@/lib/room-geometry";
import type { RectCm } from "@/lib/viewport";

/** Length of the center line in cm. */
export function wallLengthCm(wall: Pick<Wall, "startCm" | "endCm">): number {
    return distanceCm(wall.startCm, wall.endCm);
}

/** Unit vector from start to end; `null` for a wall of 0 cm. */
export function wallDirection(wall: Pick<Wall, "startCm" | "endCm">): PointCm | null {
    const length = wallLengthCm(wall);
    if (length === 0) return null;
    return { x: (wall.endCm.x - wall.startCm.x) / length, y: (wall.endCm.y - wall.startCm.y) / length };
}

/**
 * Unit normal of the wall: the direction turned by 90° (towards +y for a wall
 * running towards +x). `null` for a wall of 0 cm.
 */
export function wallNormal(wall: Pick<Wall, "startCm" | "endCm">): PointCm | null {
    const d = wallDirection(wall);
    return d ? { x: -d.y, y: d.x } : null;
}

/**
 * Corners of the wall band: the rectangle around the center line, half the
 * thickness to each side. With `capStart`/`capEnd` the band reaches half the
 * thickness beyond that end (to close a corner with another wall). Order:
 * start on the normal side, end on the normal side, end on the other side,
 * start on the other side. Empty for a wall of 0 cm.
 */
export function wallBandOutline(wall: Wall, capStart = false, capEnd = false): PointCm[] {
    const d = wallDirection(wall);
    if (!d) return [];
    const half = wall.thicknessCm / 2;
    const n = { x: -d.y, y: d.x };
    const s = { x: wall.startCm.x - (capStart ? d.x * half : 0), y: wall.startCm.y - (capStart ? d.y * half : 0) };
    const e = { x: wall.endCm.x + (capEnd ? d.x * half : 0), y: wall.endCm.y + (capEnd ? d.y * half : 0) };
    const off = (p: PointCm, sign: 1 | -1): PointCm => ({ x: p.x + sign * n.x * half, y: p.y + sign * n.y * half });
    return [off(s, 1), off(e, 1), off(e, -1), off(s, -1)];
}

/** Which ends of a wall lie exactly on an end of another wall (compared at 0.1 cm). */
export interface JoinedEnds {
    start: boolean;
    end: boolean;
}

const pointKey = (p: PointCm): string => {
    const r = roundPointCm(p);
    return `${r.x}|${r.y}`;
};

/**
 * For every wall (by id) the ends that touch an end of another wall of the
 * list. Their band is drawn half the thickness longer there, so the corner is
 * closed (see `wallBandOutline`).
 */
export function joinedEnds(walls: readonly Wall[]): Map<string, JoinedEnds> {
    const owners = new Map<string, Set<string>>();
    const add = (p: PointCm, id: string) => {
        const key = pointKey(p);
        const set = owners.get(key) ?? new Set<string>();
        set.add(id);
        owners.set(key, set);
    };
    for (const wall of walls) {
        add(wall.startCm, wall.id);
        add(wall.endCm, wall.id);
    }
    const sharedByOther = (p: PointCm, id: string) => [...(owners.get(pointKey(p)) ?? [])].some((other) => other !== id);
    return new Map(
        walls.map((wall) => [wall.id, { start: sharedByOther(wall.startCm, wall.id), end: sharedByOther(wall.endCm, wall.id) }]),
    );
}

/**
 * The wall with its end moved along the wall's direction so that the center
 * line is `lengthCm` long; the start stays. Rounded to 0.1 cm. `null` for a
 * length not greater than 0 cm or a wall of 0 cm.
 */
export function setWallLength(wall: Wall, lengthCm: number): Wall | null {
    const d = wallDirection(wall);
    if (!d || !(lengthCm > 0)) return null;
    const endCm = roundPointCm({ x: wall.startCm.x + d.x * lengthCm, y: wall.startCm.y + d.y * lengthCm });
    return { ...wall, endCm };
}

/** Both ends moved by `dx`/`dy` cm, rounded to 0.1 cm. */
export function translateWall(wall: Wall, dx: number, dy: number): Wall {
    return {
        ...wall,
        startCm: { x: roundCm(wall.startCm.x + dx), y: roundCm(wall.startCm.y + dy) },
        endCm: { x: roundCm(wall.endCm.x + dx), y: roundCm(wall.endCm.y + dy) },
    };
}

/** One side of a free wall: the center line moved by half the thickness. */
export interface WallSide {
    /** `"left"`: towards `wallNormal`, `"right"`: away from it. */
    side: "left" | "right";
    start: PointCm;
    end: PointCm;
    /** Unit normal pointing away from the center line. */
    normal: PointCm;
}

/** The two sides of the wall, each as long as the center line. Empty for a wall of 0 cm. */
export function wallSideLines(wall: Wall): WallSide[] {
    const n = wallNormal(wall);
    if (!n) return [];
    const half = wall.thicknessCm / 2;
    const shift = (p: PointCm, sign: 1 | -1): PointCm => ({ x: p.x + sign * n.x * half, y: p.y + sign * n.y * half });
    return [
        { side: "left", start: shift(wall.startCm, 1), end: shift(wall.endCm, 1), normal: { ...n } },
        { side: "right", start: shift(wall.startCm, -1), end: shift(wall.endCm, -1), normal: { x: -n.x, y: -n.y } },
    ];
}

/** Bounding rectangle of the wall band (without corner caps). */
export function wallBounds(wall: Wall): RectCm {
    return boundsCm(wallBandOutline(wall));
}

/** Both ends of every wall, start before end, in list order. */
export function wallEnds(walls: readonly Wall[]): PointCm[] {
    return walls.flatMap((w) => [{ ...w.startCm }, { ...w.endCm }]);
}
