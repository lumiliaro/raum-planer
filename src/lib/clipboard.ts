/**
 * The app's own clipboard for rooms and shapes (session only, never the
 * system clipboard): what a copy takes over and where it lands. Pure
 * functions; the store keeps the `ClipboardState` and adds the copies.
 */

import { MAX_ROOM_NAME_LENGTH, type FloorId, type Room, type Shape } from "@/lib/plan-schema";
import { roundCm, translatePoints } from "@/lib/room-geometry";

/** Each paste lies this far right and down from the one before (cm, in x and y). */
export const PASTE_OFFSET_CM = 50;

export const COPY_NAME_SUFFIX = " (Kopie)";

export type ClipboardItem = { kind: "shape"; shape: Shape } | { kind: "room"; room: Room };

/**
 * A snapshot of the copied or cut room or shape. `cut` is only `true` when the
 * original was actually deleted. `pastesByFloor` counts the pastes per floor
 * since the last copy or cut.
 */
export interface ClipboardState {
    item: ClipboardItem;
    sourceFloorId: FloorId;
    cut: boolean;
    pastesByFloor: Record<FloorId, number>;
}

/**
 * How many `PASTE_OFFSET_CM` steps the next paste on `floorId` lies away from
 * the original: on the source floor after a copy 1, 2, …; on another floor or
 * after a cut 0, 1, ….
 */
export function pasteOffsetSteps(clip: ClipboardState, floorId: FloorId): number {
    return (clip.pastesByFloor[floorId] ?? 0) + (floorId === clip.sourceFloorId && !clip.cut ? 1 : 0);
}

/** `true` for the first paste after a cut that deleted the original: a room keeps its name. */
export function isFirstPasteAfterCut(clip: ClipboardState): boolean {
    return clip.cut && Object.values(clip.pastesByFloor).every((n) => n === 0);
}

/**
 * The name of a room copy: `name (Kopie)`, shortened before the suffix so it
 * stays within `MAX_ROOM_NAME_LENGTH`. A name already ending on the suffix stays.
 */
export function copyName(name: string): string {
    const trimmed = name.trim();
    if (trimmed.endsWith(COPY_NAME_SUFFIX)) return trimmed;
    const base = trimmed.slice(0, MAX_ROOM_NAME_LENGTH - COPY_NAME_SUFFIX.length).trimEnd();
    return base + COPY_NAME_SUFFIX;
}

/** Copy of a shape with a new id, moved by `dx`/`dy` cm (rounded to 0.1 cm) and never locked. */
export function copyShape(shape: Shape, dx: number, dy: number, newId: string): Shape {
    const { locked: _locked, ...rest } = shape;
    return { ...rest, id: newId, x: roundCm(shape.x + dx), y: roundCm(shape.y + dy) };
}

/**
 * Copy of a room moved by `dx`/`dy` cm: new ids for the room and each opening
 * (`newId` is called once per id), never locked, the name with „ (Kopie)“
 * unless `keepName`. Openings stay on their edges, wall thicknesses and color stay.
 */
export function copyRoom(room: Room, dx: number, dy: number, newId: () => string, { keepName = false } = {}): Room {
    return {
        ...room,
        id: newId(),
        name: keepName ? room.name : copyName(room.name),
        pointsCm: translatePoints(room.pointsCm, dx, dy),
        openings: room.openings.map((o) => ({ ...o, id: newId() })),
        wallThicknessCm: [...room.wallThicknessCm],
        locked: false,
    };
}
