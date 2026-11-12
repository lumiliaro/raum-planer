/**
 * What changed between two plans, for the undo history. Relies on the plan
 * operations keeping unchanged floor lists, shapes, rooms and underlays by reference.
 */

import type { FloorId, Plan, Room } from "@/lib/plan-schema";

/** Ids of the floors of both plans: those of `a` in order, then the ones only in `b`. */
function allFloorIds(a: Plan, b: Plan): FloorId[] {
    return [...new Set([...a.floors.map((f) => f.id), ...b.floors.map((f) => f.id)])];
}

function floorContentChanged(a: Plan, b: Plan, id: FloorId): boolean {
    return (
        a.shapesByFloor[id] !== b.shapesByFloor[id] ||
        a.roomsByFloor[id] !== b.roomsByFloor[id] ||
        a.underlayByFloor[id] !== b.underlayByFloor[id]
    );
}

/**
 * Floors whose entry differs: added, removed, renamed, or moved. A floor
 * counts as moved if its position among the floors present in both plans
 * differs, so adding or removing one floor does not move the others.
 */
function changedFloorEntries(before: Plan, after: Plan): Set<FloorId> {
    const changed = new Set<FloorId>();
    if (before.floors === after.floors) return changed;
    const beforeById = new Map(before.floors.map((f) => [f.id, f]));
    const afterById = new Map(after.floors.map((f) => [f.id, f]));
    for (const [id, floor] of beforeById) {
        if (afterById.get(id)?.name !== floor.name) changed.add(id);
    }
    for (const id of afterById.keys()) {
        if (!beforeById.has(id)) changed.add(id);
    }
    const commonBefore = before.floors.filter((f) => afterById.has(f.id));
    const commonAfter = after.floors.filter((f) => beforeById.has(f.id));
    commonBefore.forEach((floor, index) => {
        if (commonAfter[index].id !== floor.id) changed.add(floor.id);
    });
    return changed;
}

/**
 * Same content for the history: the floor list, the settings, shapes, rooms and underlays per
 * floor (by reference) and `createdAt`. Ignores the active floor, `updatedAt`
 * and the name, so switching floors or renaming on export is no undo step.
 */
export function sameContent(a: Plan, b: Plan): boolean {
    if (a === b) return true;
    return (
        a.createdAt === b.createdAt &&
        a.floors === b.floors &&
        a.settings === b.settings &&
        allFloorIds(a, b).every((id) => !floorContentChanged(a, b, id))
    );
}

export interface HistoryFocus {
    floorId: FloorId;
    /** The one added or changed shape on `floorId` that exists in `after`, else `null`. */
    shapeId: string | null;
    /** Like `shapeId` for rooms; `null` whenever `shapeId` is set (the shape wins). */
    roomId: string | null;
    /**
     * The one added or changed opening of the only changed room, if nothing but
     * its openings changed (see `onlyOpeningsChanged`) and the opening exists in
     * `after`. `roomId` is then `null`: a change of openings never selects the room.
     */
    openingId: string | null;
}

/** Ids of the items of `after` that were added or changed compared to `before`. */
function touchedIds<T extends { id: string }>(before: readonly T[] | undefined, after: readonly T[] | undefined): string[] {
    const previous = new Map((before ?? []).map((item) => [item.id, item]));
    return (after ?? []).filter((item) => previous.get(item.id) !== item).map((item) => item.id);
}

/** Structural equality of plain JSON values (numbers, strings, arrays, objects). */
function sameValue(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(
        (key) => Object.hasOwn(b, key) && sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
}

/**
 * `true` if the two versions of a room differ in nothing but `openings`: every
 * other field (name, corners, wall thicknesses and any later one) is equal by
 * reference or value.
 */
function onlyOpeningsChanged(before: Room, after: Room): boolean {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    keys.delete("openings");
    return [...keys].every((key) => sameValue(before[key as keyof Room], after[key as keyof Room]));
}

/** Undo/redo changed nothing but the settings: floor, selection and tool stay as they are. */
export interface KeepFocus {
    keep: true;
}

/**
 * Where to look after undo/redo turned `before` into `after`: the only floor
 * whose shapes, rooms, underlay, name or position differ, if it exists in
 * `after` (else `after.activeFloorId`, else the first floor of `after`), and
 * the only shape there that was added or changed, else the only such room –
 * or, if nothing but that room's openings changed, the only such opening. A removed
 * shape, room or opening does not count. The result is always a floor of `after`.
 * If no floor changed but the settings did, the result is `{ keep: true }`.
 */
export function resolveHistoryFocus(before: Plan, after: Plan): HistoryFocus | KeepFocus {
    const entries = changedFloorEntries(before, after);
    const changed = allFloorIds(before, after).filter(
        (id) => entries.has(id) || floorContentChanged(before, after, id),
    );
    const inAfter = (id: FloorId) => after.floors.some((f) => f.id === id);

    if (changed.length === 0 && before.settings !== after.settings) return { keep: true };

    if (changed.length !== 1 || !inAfter(changed[0])) {
        const floorId = inAfter(after.activeFloorId) ? after.activeFloorId : after.floors[0].id;
        return { floorId, shapeId: null, roomId: null, openingId: null };
    }

    const floorId = changed[0];
    const shapes = touchedIds(before.shapesByFloor[floorId], after.shapesByFloor[floorId]);
    const shapeId = shapes.length === 1 ? shapes[0] : null;
    const rooms = touchedIds(before.roomsByFloor[floorId], after.roomsByFloor[floorId]);
    if (shapeId !== null || rooms.length !== 1) return { floorId, shapeId, roomId: null, openingId: null };
    const roomAfter = after.roomsByFloor[floorId].find((r) => r.id === rooms[0])!;
    const roomBefore = before.roomsByFloor[floorId]?.find((r) => r.id === rooms[0]);
    if (!roomBefore || !onlyOpeningsChanged(roomBefore, roomAfter)) {
        return { floorId, shapeId: null, roomId: roomAfter.id, openingId: null };
    }
    const openings = touchedIds(roomBefore.openings, roomAfter.openings);
    return { floorId, shapeId: null, roomId: null, openingId: openings.length === 1 ? openings[0] : null };
}

/**
 * The name to keep after undo/redo. The name is not part of the history:
 * within the same plan (same `createdAt`) the current name stays. Undoing or
 * redoing an import switches to another plan, whose name comes with it.
 */
export function resolveHistoryName(before: Plan, after: Plan): string {
    return before.createdAt === after.createdAt ? before.name : after.name;
}
