/**
 * Editing rules for locked rooms. A lock fixes the corners (position, edge
 * lengths) and the wall thicknesses and prevents deleting the room; name,
 * color and the lock itself stay changeable. An allow list, so later geometry
 * fields of a room count as locked without touching this file. Openings are
 * not covered. Not a validity rule of the format: import, undo and redo set
 * locked rooms freely.
 */

import type { RoomPatch } from "@/lib/plan";
import type { Room } from "@/lib/plan-schema";

export const ROOM_LOCK_ALLOWED_FIELDS: readonly string[] = Object.freeze(["name", "color", "locked"]);

/** `true` if the room is not locked or the patch touches only allowed fields. */
export function isRoomPatchAllowed(room: Room, patch: RoomPatch): boolean {
    return !room.locked || Object.keys(patch).every((key) => ROOM_LOCK_ALLOWED_FIELDS.includes(key));
}

export function canDeleteRoom(room: Room): boolean {
    return !room.locked;
}
