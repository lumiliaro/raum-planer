/**
 * Snapping a dragged room to the walls of the other rooms on its floor: a room
 * whose edge lies parallel and opposite to an edge of another room "sticks" to
 * it at the distance of the thicker of both walls, so both wall bands overlap
 * and look like one wall. Sticking uses a hysteresis (capture close, release
 * further away), the corners of a stuck edge snap flush with the neighbour's
 * corners, and a room can stick to two non-parallel walls at once.
 *
 * Pure logic without React or Konva: the canvas keeps the `sticks` between two
 * pointer moves and passes thresholds already converted from screen pixels to cm.
 */

import type { PointCm, Room } from "@/lib/plan-schema";
import { DEFAULT_WALL_THICKNESS_CM, GEOMETRY_EPS_CM, signedArea2 } from "@/lib/room-geometry";

/** A wall captures a dragged room from this distance on, in screen pixels. */
export const WALL_SNAP_CAPTURE_PX = 8;
/** A stuck room tears off beyond this distance across the wall, in screen pixels. */
export const WALL_SNAP_RELEASE_PX = 24;

/** Two edge directions within this angle count as parallel. */
const PARALLEL_TOLERANCE_DEG = 0.5;
const PARALLEL_COS = Math.cos((PARALLEL_TOLERANCE_DEG * Math.PI) / 180);
/** At most this many walls hold a room at once. */
const MAX_STICKS = 2;

/** One wall the dragged room sticks to. */
export interface WallStick {
    /** The neighbouring room. */
    roomId: string;
    /** Edge of the neighbouring room. */
    edgeIndex: number;
    /** Edge of the dragged room. */
    movingEdgeIndex: number;
    /** Unit normal of the neighbour's edge, pointing to the dragged room (its outward normal). */
    normal: PointCm;
    /** Offset along `normal` (in delta coordinates) that puts the room into the stuck position. */
    offsetCm: number;
}

export interface RoomDragSnapInput {
    /** Corners of the dragged room at the start of the drag. */
    points: readonly PointCm[];
    wallThicknessCm: readonly number[];
    /** The other rooms of the floor, locked ones included. */
    others: readonly Room[];
    /** Pointer offset since the drag start in cm, not snapped. */
    rawDelta: PointCm;
    /** Offset snapped to the grid (per axis). */
    gridDelta: PointCm;
    /** Sticks of the previous pointer move (`[]` at the start). */
    sticks: readonly WallStick[];
    /** Capture distance in cm (`WALL_SNAP_CAPTURE_PX / scale`). */
    captureCm: number;
    /** Release distance in cm (`WALL_SNAP_RELEASE_PX / scale`). */
    releaseCm: number;
}

export interface RoomDragSnapResult {
    /** Offset to apply to the room. */
    delta: PointCm;
    /** Current sticks, for the next call and for marking the walls. */
    sticks: WallStick[];
}

const dot = (a: PointCm, b: PointCm) => a.x * b.x + a.y * b.y;
const sub = (a: PointCm, b: PointCm): PointCm => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: PointCm, b: PointCm): PointCm => ({ x: a.x + b.x, y: a.y + b.y });
const scaled = (a: PointCm, f: number): PointCm => ({ x: a.x * f, y: a.y * f });

/**
 * Unit outward normal of every edge (edge `i` from point `i` to point `i + 1`),
 * from the winding order like `wallBandOutline`; `null` for an edge of length 0.
 */
export function edgeOutwardNormals(points: readonly PointCm[]): (PointCm | null)[] {
    const clockwise = signedArea2(points) >= 0;
    return points.map((start, i) => {
        const end = points[(i + 1) % points.length];
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        if (length < GEOMETRY_EPS_CM) return null;
        const dir = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
        return clockwise ? { x: dir.y, y: -dir.x } : { x: -dir.y, y: dir.x };
    });
}

/** Geometry of a pair of facing edges for a given pointer offset. */
interface Pair {
    stick: WallStick;
    /** Deviation of the pointer position from the stuck position along the normal. */
    deviationCm: number;
    /** Along-wall correction that makes the nearest corners flush (pointer position). */
    cornerShiftCm: number;
}

/**
 * Edge `m` of the dragged room against edge `n` of `other`: `null` unless they
 * are parallel, opposite (outward normals point at each other) and overlap
 * along the wall in the pointer position.
 */
function facingPair(
    input: RoomDragSnapInput,
    movingNormals: readonly (PointCm | null)[],
    m: number,
    other: Room,
    otherNormals: readonly (PointCm | null)[],
    n: number,
): Pair | null {
    const normal = otherNormals[n];
    const movingNormal = movingNormals[m];
    if (!normal || !movingNormal || dot(normal, movingNormal) > -PARALLEL_COS) return null;

    const pts = input.points;
    const m0 = pts[m];
    const m1 = pts[(m + 1) % pts.length];
    const n0 = other.pointsCm[n];
    const n1 = other.pointsCm[(n + 1) % other.pointsCm.length];
    const along = { x: -normal.y, y: normal.x };

    // Overlap along the wall, dragged edge in the pointer position.
    const a0 = dot(sub(n0, n0), along);
    const a1 = dot(sub(n1, n0), along);
    const b0 = dot(sub(add(m0, input.rawDelta), n0), along);
    const b1 = dot(sub(add(m1, input.rawDelta), n0), along);
    const overlap = Math.min(Math.max(a0, a1), Math.max(b0, b1)) - Math.max(Math.min(a0, a1), Math.min(b0, b1));
    if (overlap <= GEOMETRY_EPS_CM) return null;

    const gap = Math.max(
        input.wallThicknessCm[m] ?? DEFAULT_WALL_THICKNESS_CM,
        other.wallThicknessCm[n] ?? DEFAULT_WALL_THICKNESS_CM,
    );
    const offsetCm = gap - dot(sub(m0, n0), normal);
    const deviationCm = offsetCm - dot(input.rawDelta, normal);

    let cornerShiftCm = Infinity;
    for (const b of [b0, b1]) {
        for (const a of [a0, a1]) {
            if (Math.abs(a - b) < Math.abs(cornerShiftCm)) cornerShiftCm = a - b;
        }
    }

    return {
        stick: { roomId: other.id, edgeIndex: n, movingEdgeIndex: m, normal, offsetCm },
        deviationCm,
        cornerShiftCm,
    };
}

const isParallel = (a: PointCm, b: PointCm) => Math.abs(dot(a, b)) >= PARALLEL_COS;

/**
 * Offset of a dragged room: the grid offset, across a stuck wall replaced by
 * the stuck position. Existing sticks hold while the pointer stays within
 * `releaseCm` of the stuck position (both directions) and the edges still
 * overlap; new sticks need `captureCm`, the closest wins, and a second one
 * must not be parallel to the first. With one stick the corners of the stuck
 * edge snap flush with the neighbour's corners within `captureCm`; with two
 * the walls fix the position completely.
 */
export function snapRoomDrag(input: RoomDragSnapInput): RoomDragSnapResult {
    const movingNormals = edgeOutwardNormals(input.points);
    const othersById = new Map(input.others.map((room) => [room.id, room]));
    const normalsById = new Map(input.others.map((room) => [room.id, edgeOutwardNormals(room.pointsCm)]));

    const pairOf = (other: Room, m: number, n: number) =>
        facingPair(input, movingNormals, m, other, normalsById.get(other.id) ?? [], n);

    // Existing sticks first (hysteresis), then new ones.
    const kept: Pair[] = [];
    for (const stick of input.sticks) {
        const other = othersById.get(stick.roomId);
        if (!other || stick.movingEdgeIndex >= input.points.length || stick.edgeIndex >= other.pointsCm.length) continue;
        const pair = pairOf(other, stick.movingEdgeIndex, stick.edgeIndex);
        if (!pair || Math.abs(pair.deviationCm) > input.releaseCm) continue;
        if (kept.some((k) => isParallel(k.stick.normal, pair.stick.normal))) continue;
        kept.push(pair);
        if (kept.length === MAX_STICKS) break;
    }

    if (kept.length < MAX_STICKS) {
        const candidates: Pair[] = [];
        for (const other of input.others) {
            for (let m = 0; m < input.points.length; m++) {
                for (let n = 0; n < other.pointsCm.length; n++) {
                    const pair = pairOf(other, m, n);
                    if (pair && Math.abs(pair.deviationCm) <= input.captureCm) candidates.push(pair);
                }
            }
        }
        candidates.sort((a, b) => Math.abs(a.deviationCm) - Math.abs(b.deviationCm));
        for (const pair of candidates) {
            if (kept.length === MAX_STICKS) break;
            if (kept.some((k) => isParallel(k.stick.normal, pair.stick.normal))) continue;
            kept.push(pair);
        }
    }

    const sticks = kept.map((pair) => pair.stick);
    if (kept.length === 0) return { delta: { ...input.gridDelta }, sticks };

    if (kept.length === 1) {
        const [{ stick, cornerShiftCm }] = kept;
        const along = { x: -stick.normal.y, y: stick.normal.x };
        const alongCm =
            Math.abs(cornerShiftCm) <= input.captureCm
                ? dot(input.rawDelta, along) + cornerShiftCm
                : dot(input.gridDelta, along);
        return { delta: add(scaled(stick.normal, stick.offsetCm), scaled(along, alongCm)), sticks };
    }

    // Two non-parallel walls: delta · n1 = o1 and delta · n2 = o2.
    const [s1, s2] = sticks;
    const det = s1.normal.x * s2.normal.y - s1.normal.y * s2.normal.x;
    const delta = {
        x: (s1.offsetCm * s2.normal.y - s2.offsetCm * s1.normal.y) / det,
        y: (s1.normal.x * s2.offsetCm - s2.normal.x * s1.offsetCm) / det,
    };
    return { delta, sticks };
}
