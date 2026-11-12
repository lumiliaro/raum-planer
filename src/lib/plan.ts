/**
 * Pure plan operations. Each takes a plan and returns a plan; a rejected change
 * returns the very same object, so callers detect "no change" by reference.
 * Content changes (shapes, rooms, underlays, floors) set `updatedAt`; switching the
 * active floor does not.
 */

import { CalibrationSchema, type Calibration } from "@/lib/calibration-schema";
import { reanchorOpenings } from "@/lib/opening-reanchor";
import { FACTORY_SETTINGS, PlanSettingsSchema, sameSettings, type SettingsPatch } from "@/lib/plan-settings";
import { translatePoints } from "@/lib/room-geometry";
import {
    FloorSchema,
    MAX_FLOORS,
    OpeningSchema,
    PLAN_SCHEMA_VERSION,
    RoomSchema,
    ShapeSchema,
    type Floor,
    type FloorId,
    type Opening,
    type OpeningPatch,
    type Plan,
    type PointCm,
    type Room,
    type Shape,
    type ShapePatch,
    type Underlay,
    UnderlaySchema,
} from "@/lib/plan-schema";

export const DEFAULT_PLAN_NAME = "Meine Planung";
export const DEFAULT_FLOOR_NAME = "Erdgeschoss";
export const NEW_FLOOR_NAME = "Neue Etage";
/** New rooms are called „Raum 1“, „Raum 2“, … */
export const ROOM_NAME_PREFIX = "Raum";

export type ReorderDirection = "forward" | "backward" | "front" | "back";
export type FloorMoveDirection = "up" | "down";

/** One floor „Erdgeschoss“ without shapes and rooms, with a new id (not `eg`, which stays reserved for floors taken over from version 1). */
export function createEmptyPlan(now: Date, newId: () => string): Plan {
    const timestamp = now.toISOString();
    const floorId = newId();
    return {
        schemaVersion: PLAN_SCHEMA_VERSION,
        name: DEFAULT_PLAN_NAME,
        createdAt: timestamp,
        updatedAt: timestamp,
        floors: [{ id: floorId, name: DEFAULT_FLOOR_NAME }],
        activeFloorId: floorId,
        underlayByFloor: {},
        shapesByFloor: { [floorId]: [] },
        roomsByFloor: { [floorId]: [] },
        settings: { ...FACTORY_SETTINGS },
    };
}

export function hasFloor(plan: Plan, floorId: FloorId): boolean {
    return plan.floors.some((f) => f.id === floorId);
}

/** „Neue Etage“, else „Neue Etage 2“, „Neue Etage 3“, … – the first name not in use. */
export function nextFloorName(floors: readonly Floor[]): string {
    const names = new Set(floors.map((f) => f.name));
    if (!names.has(NEW_FLOOR_NAME)) return NEW_FLOOR_NAME;
    let n = 2;
    while (names.has(`${NEW_FLOOR_NAME} ${n}`)) n++;
    return `${NEW_FLOOR_NAME} ${n}`;
}

/**
 * Appends a floor without shapes, rooms and underlay and makes it active.
 * Rejects at `MAX_FLOORS`, for an id in use and for an invalid name.
 */
export function addFloor(plan: Plan, id: FloorId, name: string, now: Date): Plan {
    const parsed = FloorSchema.safeParse({ id, name });
    if (!parsed.success || plan.floors.length >= MAX_FLOORS) return plan;
    if (hasFloor(plan, id) || Object.hasOwn(plan.shapesByFloor, id) || Object.hasOwn(plan.roomsByFloor, id)) return plan;
    return {
        ...plan,
        updatedAt: now.toISOString(),
        floors: [...plan.floors, parsed.data],
        activeFloorId: id,
        shapesByFloor: { ...plan.shapesByFloor, [id]: [] },
        roomsByFloor: { ...plan.roomsByFloor, [id]: [] },
    };
}

/** Sets the trimmed name (1–40 characters). Rejects an unknown id, an invalid or unchanged name. */
export function renameFloor(plan: Plan, id: FloorId, name: string, now: Date): Plan {
    const index = plan.floors.findIndex((f) => f.id === id);
    const parsed = FloorSchema.safeParse({ id, name });
    if (index < 0 || !parsed.success || parsed.data.name === plan.floors[index].name) return plan;
    return { ...plan, updatedAt: now.toISOString(), floors: plan.floors.with(index, parsed.data) };
}

/** Index of the floor and of its neighbour in `direction`, or `null` at the edge or for an unknown id. */
function floorMoveIndices(plan: Plan, id: FloorId, direction: FloorMoveDirection) {
    const from = plan.floors.findIndex((f) => f.id === id);
    if (from < 0) return null;
    const to = direction === "up" ? from - 1 : from + 1;
    return to < 0 || to >= plan.floors.length ? null : { from, to };
}

/** Swaps the floor with its neighbour; "up" = towards the front of the list. The active floor stays. */
export function moveFloor(plan: Plan, id: FloorId, direction: FloorMoveDirection, now: Date): Plan {
    const move = floorMoveIndices(plan, id, direction);
    if (!move) return plan;
    const { from, to } = move;
    const floors = plan.floors.with(from, plan.floors[to]).with(to, plan.floors[from]);
    return { ...plan, updatedAt: now.toISOString(), floors };
}

/** `true` if `moveFloor` with these arguments would change the order. */
export function canMoveFloor(plan: Plan, id: FloorId, direction: FloorMoveDirection): boolean {
    return floorMoveIndices(plan, id, direction) !== null;
}

/** `true` if `removeFloor` would remove the floor: it exists and is not the only one. */
export function canRemoveFloor(plan: Plan, id: FloorId): boolean {
    return plan.floors.length > 1 && hasFloor(plan, id);
}

/**
 * Removes the floor with its shapes, rooms and underlay; other floors stay the
 * same objects. If it was active, the following floor becomes active, for the
 * last floor the previous one. The only floor is never removed.
 */
export function removeFloor(plan: Plan, id: FloorId, now: Date): Plan {
    if (!canRemoveFloor(plan, id)) return plan;
    const index = plan.floors.findIndex((f) => f.id === id);
    const floors = plan.floors.toSpliced(index, 1);
    const { [id]: _removedShapes, ...shapesByFloor } = plan.shapesByFloor;
    const { [id]: _removedRooms, ...roomsByFloor } = plan.roomsByFloor;
    const { [id]: _removedUnderlay, ...underlayByFloor } = plan.underlayByFloor;
    const activeFloorId = plan.activeFloorId === id ? floors[Math.min(index, floors.length - 1)].id : plan.activeFloorId;
    return { ...plan, updatedAt: now.toISOString(), floors, activeFloorId, shapesByFloor, roomsByFloor, underlayByFloor };
}

function withShapes(plan: Plan, floorId: FloorId, shapes: Shape[], now: Date): Plan {
    return {
        ...plan,
        updatedAt: now.toISOString(),
        shapesByFloor: { ...plan.shapesByFloor, [floorId]: shapes },
    };
}

/** Appends a valid shape (it lies on top). Rejects invalid shapes and ids used on any floor. */
export function addShape(plan: Plan, floorId: FloorId, shape: Shape, now: Date): Plan {
    const shapes = plan.shapesByFloor[floorId];
    const parsed = ShapeSchema.safeParse(shape);
    if (!shapes || !parsed.success) return plan;
    const idTaken = Object.values(plan.shapesByFloor).some((list) => list.some((s) => s.id === parsed.data.id));
    if (idTaken) return plan;
    return withShapes(plan, floorId, [...shapes, parsed.data], now);
}

/** Merges `patch` into the shape, keeping its id, kind and position in the drawing order. */
export function updateShape(plan: Plan, floorId: FloorId, id: string, patch: ShapePatch, now: Date): Plan {
    const shapes = plan.shapesByFloor[floorId];
    const index = shapes?.findIndex((s) => s.id === id) ?? -1;
    if (index < 0) return plan;
    const current = shapes[index];
    const parsed = ShapeSchema.safeParse({ ...current, ...patch, id: current.id, kind: current.kind });
    if (!parsed.success) return plan;
    return withShapes(plan, floorId, shapes.with(index, parsed.data), now);
}

export function removeShape(plan: Plan, floorId: FloorId, id: string, now: Date): Plan {
    const shapes = plan.shapesByFloor[floorId];
    if (!shapes?.some((s) => s.id === id)) return plan;
    return withShapes(
        plan,
        floorId,
        shapes.filter((s) => s.id !== id),
        now,
    );
}

/** Current and target index of a reorder, or `null` if the shape is missing or already at the target. */
function reorderIndices(plan: Plan, floorId: FloorId, id: string, direction: ReorderDirection) {
    const shapes = plan.shapesByFloor[floorId];
    const from = shapes?.findIndex((s) => s.id === id) ?? -1;
    if (from < 0) return null;
    const last = shapes.length - 1;
    const to = {
        forward: Math.min(from + 1, last),
        backward: Math.max(from - 1, 0),
        front: last,
        back: 0,
    }[direction];
    return to === from ? null : { shapes, from, to };
}

/** Moves a shape within the drawing order; "forward"/"front" = towards the top (end of the list). */
export function reorderShape(plan: Plan, floorId: FloorId, id: string, direction: ReorderDirection, now: Date): Plan {
    const move = reorderIndices(plan, floorId, id, direction);
    if (!move) return plan;
    const { shapes, from, to } = move;
    const next = shapes.toSpliced(from, 1).toSpliced(to, 0, shapes[from]);
    return withShapes(plan, floorId, next, now);
}

/** `true` if `reorderShape` with these arguments would change the order. */
export function canReorder(plan: Plan, floorId: FloorId, id: string, direction: ReorderDirection): boolean {
    return reorderIndices(plan, floorId, id, direction) !== null;
}

function withRooms(plan: Plan, floorId: FloorId, rooms: Room[], now: Date): Plan {
    return {
        ...plan,
        updatedAt: now.toISOString(),
        roomsByFloor: { ...plan.roomsByFloor, [floorId]: rooms },
    };
}

/** „Raum n“ with the smallest n ≥ 1 no room of the list is called. */
export function nextRoomName(rooms: readonly Room[]): string {
    const names = new Set(rooms.map((r) => r.name));
    let n = 1;
    while (names.has(`${ROOM_NAME_PREFIX} ${n}`)) n++;
    return `${ROOM_NAME_PREFIX} ${n}`;
}

/** Appends a valid room (it lies on top of the floor's rooms). Rejects invalid rooms and ids used on any floor. */
export function addRoom(plan: Plan, floorId: FloorId, room: Room, now: Date): Plan {
    const rooms = plan.roomsByFloor[floorId];
    const parsed = RoomSchema.safeParse(room);
    if (!rooms || !hasFloor(plan, floorId) || !parsed.success) return plan;
    const idTaken = Object.values(plan.roomsByFloor).some((list) => list.some((r) => r.id === parsed.data.id));
    if (idTaken) return plan;
    return withRooms(plan, floorId, [...rooms, parsed.data], now);
}

/** Changeable fields of a room; the id stays. */
export interface RoomPatch {
    name?: string;
    pointsCm?: PointCm[];
    /** One value per edge, replaced as a whole. Changes neither corners nor openings. */
    wallThicknessCm?: number[];
    /** `#RRGGBB` or `null` („Standard“). Changes neither corners, walls nor openings. */
    color?: string | null;
    /** Locks or unlocks the room (see `room-lock.ts`). Changes nothing else. */
    locked?: boolean;
}

/**
 * Merges `patch` (name, corner points, wall thicknesses, color, lock) into the room,
 * keeping its id and its place in the list. New corners re-anchor the room's
 * openings (see `reanchorOpenings`). Rejects a change after which the room
 * would be invalid or an opening would no longer fit, and one that changes nothing.
 */
export function updateRoom(plan: Plan, floorId: FloorId, id: string, patch: RoomPatch, now: Date): Plan {
    const rooms = plan.roomsByFloor[floorId];
    const index = rooms?.findIndex((r) => r.id === id) ?? -1;
    if (index < 0) return plan;
    const current = rooms[index];
    let openings = current.openings;
    if (patch.pointsCm) {
        const reanchored = reanchorOpenings(current.pointsCm, patch.pointsCm, current.openings);
        if (!reanchored.ok) return plan;
        openings = reanchored.openings;
    }
    const parsed = RoomSchema.safeParse({ ...current, ...patch, id: current.id, openings });
    if (!parsed.success) return plan;
    const next = parsed.data;
    const samePoints =
        next.pointsCm.length === current.pointsCm.length &&
        next.pointsCm.every((p, i) => p.x === current.pointsCm[i].x && p.y === current.pointsCm[i].y);
    const sameWalls =
        next.wallThicknessCm.length === current.wallThicknessCm.length &&
        next.wallThicknessCm.every((t, i) => t === current.wallThicknessCm[i]);
    if (next.name === current.name && samePoints && sameWalls && next.color === current.color && next.locked === current.locked) {
        return plan;
    }
    return withRooms(plan, floorId, rooms.with(index, next), now);
}

/** Moves all corners of the room by `dx`/`dy` cm; shapes stay where they are. Rejects a move by 0. */
export function moveRoom(plan: Plan, floorId: FloorId, id: string, dx: number, dy: number, now: Date): Plan {
    if (dx === 0 && dy === 0) return plan;
    const room = plan.roomsByFloor[floorId]?.find((r) => r.id === id);
    if (!room) return plan;
    return updateRoom(plan, floorId, id, { pointsCm: translatePoints(room.pointsCm, dx, dy) }, now);
}

export function removeRoom(plan: Plan, floorId: FloorId, id: string, now: Date): Plan {
    const rooms = plan.roomsByFloor[floorId];
    if (!rooms?.some((r) => r.id === id)) return plan;
    return withRooms(
        plan,
        floorId,
        rooms.filter((r) => r.id !== id),
        now,
    );
}

/** Where an opening is: its room on the floor and both indices. */
export interface OpeningLocation {
    room: Room;
    roomIndex: number;
    opening: Opening;
    index: number;
}

/** The opening with id `openingId` among the rooms of the floor, or `null`. */
export function findOpening(plan: Plan, floorId: FloorId, openingId: string): OpeningLocation | null {
    const rooms = plan.roomsByFloor[floorId] ?? [];
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
        const room = rooms[roomIndex];
        const index = room.openings.findIndex((o) => o.id === openingId);
        if (index >= 0) return { room, roomIndex, opening: room.openings[index], index };
    }
    return null;
}

function openingIdTaken(plan: Plan, id: string): boolean {
    return Object.values(plan.roomsByFloor).some((rooms) => rooms.some((r) => r.openings.some((o) => o.id === id)));
}

/**
 * Gives room `roomIndex` of the floor these openings, if the room stays valid.
 * Corners and unchanged openings keep their references (for `plan-diff`).
 */
function withOpenings(plan: Plan, floorId: FloorId, roomIndex: number, openings: Opening[], now: Date): Plan {
    const rooms = plan.roomsByFloor[floorId];
    const room = { ...rooms[roomIndex], openings };
    if (!RoomSchema.safeParse(room).success) return plan;
    return withRooms(plan, floorId, rooms.with(roomIndex, room), now);
}

/** Appends a valid opening to the room. Rejects one that does not fit the room and ids used on any floor. */
export function addOpening(plan: Plan, floorId: FloorId, roomId: string, opening: Opening, now: Date): Plan {
    const rooms = plan.roomsByFloor[floorId];
    const roomIndex = rooms?.findIndex((r) => r.id === roomId) ?? -1;
    const parsed = OpeningSchema.safeParse(opening);
    if (roomIndex < 0 || !parsed.success || openingIdTaken(plan, parsed.data.id)) return plan;
    return withOpenings(plan, floorId, roomIndex, [...rooms[roomIndex].openings, parsed.data], now);
}

const sameOpening = (a: Opening, b: Opening) =>
    a.edgeIndex === b.edgeIndex &&
    a.offsetCm === b.offsetCm &&
    a.widthCm === b.widthCm &&
    a.swing?.hinge === b.swing?.hinge &&
    a.swing?.side === b.swing?.side &&
    a.beforeFullEdge?.offsetCm === b.beforeFullEdge?.offsetCm &&
    a.beforeFullEdge?.widthCm === b.beforeFullEdge?.widthCm;

/**
 * A patch that changes width or offset in another way than „Ganze Kante“
 * (fields, dragging) forgets the remembered sizes, so a later unchecking does
 * not bring back outdated ones. A patch with the key `beforeFullEdge` (from
 * `toggleFullEdge`) sets it itself.
 */
function forgetOutdatedSizes(opening: Opening, patch: OpeningPatch): OpeningPatch {
    if (Object.hasOwn(patch, "beforeFullEdge")) return patch;
    const changesSize =
        (patch.widthCm !== undefined && patch.widthCm !== opening.widthCm) ||
        (patch.offsetCm !== undefined && patch.offsetCm !== opening.offsetCm);
    return changesSize ? { ...patch, beforeFullEdge: null } : patch;
}

/**
 * Merges `patch` into the opening, keeping its id, kind and place in the list.
 * Rejects a change after which it would be invalid or no longer fit, and one
 * that changes nothing. Changing width or offset forgets the remembered sizes
 * for „Ganze Kante“ unless the patch sets them (see `forgetOutdatedSizes`).
 */
export function updateOpening(plan: Plan, floorId: FloorId, openingId: string, patch: OpeningPatch, now: Date): Plan {
    const found = findOpening(plan, floorId, openingId);
    if (!found) return plan;
    const { room, roomIndex, opening, index } = found;
    const merged = { ...opening, ...forgetOutdatedSizes(opening, patch), id: opening.id, kind: opening.kind };
    const parsed = OpeningSchema.safeParse(merged);
    if (!parsed.success || sameOpening(parsed.data, opening)) return plan;
    return withOpenings(plan, floorId, roomIndex, room.openings.with(index, parsed.data), now);
}

export function removeOpening(plan: Plan, floorId: FloorId, openingId: string, now: Date): Plan {
    const found = findOpening(plan, floorId, openingId);
    if (!found) return plan;
    return withOpenings(plan, floorId, found.roomIndex, found.room.openings.toSpliced(found.index, 1), now);
}

/** Changes only the active floor; not a content change, so `updatedAt` stays. */
export function setActiveFloor(plan: Plan, floorId: FloorId): Plan {
    if (plan.activeFloorId === floorId || !hasFloor(plan, floorId)) return plan;
    return { ...plan, activeFloorId: floorId };
}

/** Sets the trimmed name. An empty or unchanged name is rejected (same object). */
export function renamePlan(plan: Plan, name: string, now: Date): Plan {
    const trimmed = name.trim();
    if (trimmed === "" || trimmed === plan.name) return plan;
    return { ...plan, name: trimmed, updatedAt: now.toISOString() };
}

/**
 * Sets or replaces the underlay of a floor; `null` removes it. Other floors
 * and all shapes stay unchanged. Rejects an unknown floor, an invalid
 * underlay and removing a missing one.
 */
export function setUnderlay(plan: Plan, floorId: FloorId, underlay: Underlay | null, now: Date): Plan {
    if (!hasFloor(plan, floorId)) return plan;
    if (underlay === null) {
        if (!Object.hasOwn(plan.underlayByFloor, floorId)) return plan;
        const { [floorId]: _removed, ...underlayByFloor } = plan.underlayByFloor;
        return { ...plan, updatedAt: now.toISOString(), underlayByFloor };
    }
    const parsed = UnderlaySchema.safeParse(underlay);
    if (!parsed.success) return plan;
    return {
        ...plan,
        updatedAt: now.toISOString(),
        underlayByFloor: { ...plan.underlayByFloor, [floorId]: parsed.data },
    };
}

/** Fields of an underlay `updateUnderlay` changes. */
export type UnderlayPatch = Partial<Pick<Underlay, "visible" | "opacity">>;

/**
 * Merges `patch` (visible, opacity) into the floor's underlay. Rejects a floor
 * without underlay, an invalid value and a patch that changes nothing.
 */
export function updateUnderlay(plan: Plan, floorId: FloorId, patch: UnderlayPatch, now: Date): Plan {
    const current = plan.underlayByFloor[floorId];
    if (!current || !hasFloor(plan, floorId)) return plan;
    const changed = (Object.keys(patch) as (keyof UnderlayPatch)[]).some(
        (key) => patch[key] !== undefined && patch[key] !== current[key],
    );
    if (!changed) return plan;
    return setUnderlay(plan, floorId, { ...current, ...patch }, now);
}

/**
 * Sets or replaces the calibration of a floor's underlay; image, visibility
 * and opacity stay. Rejects an invalid calibration and a floor without underlay.
 */
export function setCalibration(plan: Plan, floorId: FloorId, calibration: Calibration, now: Date): Plan {
    const current = plan.underlayByFloor[floorId];
    const parsed = CalibrationSchema.safeParse(calibration);
    if (!parsed.success || !current) return plan;
    return setUnderlay(plan, floorId, { ...current, calibration: parsed.data }, now);
}

/**
 * Merges `patch` into the plan's settings. Rejects (same object) invalid
 * settings and a patch that changes nothing (colors compared ignoring case).
 * Rooms and openings stay untouched: the defaults only apply to new ones.
 */
export function updateSettings(plan: Plan, patch: SettingsPatch, now: Date): Plan {
    const parsed = PlanSettingsSchema.safeParse({ ...plan.settings, ...patch });
    if (!parsed.success || sameSettings(parsed.data, plan.settings)) return plan;
    return { ...plan, settings: parsed.data, updatedAt: now.toISOString() };
}

/** All settings back to the factory settings, in one step; same object if they already are. */
export function resetSettings(plan: Plan, now: Date): Plan {
    return updateSettings(plan, FACTORY_SETTINGS, now);
}

/**
 * `true` if replacing the plan would lose anything: at least one shape, room
 * or underlay. Empty floors do not count; they are quickly created again.
 */
export function planHasContent(plan: Plan): boolean {
    return (
        Object.values(plan.shapesByFloor).some((shapes) => shapes.length > 0) ||
        Object.values(plan.roomsByFloor).some((rooms) => rooms.length > 0) ||
        Object.keys(plan.underlayByFloor).length > 0
    );
}
