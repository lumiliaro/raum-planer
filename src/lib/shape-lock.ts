/**
 * Editing rules for locked shapes. A lock fixes position, rotation, mirroring
 * and size; label, style and the lock itself stay changeable. An allow list,
 * so fields of later shape kinds count as geometry without touching this file.
 * Not a validity rule of the format: import, undo and redo set locked shapes freely.
 * The position is fixed except when the room the shape lies in is moved: then
 * `moveRoom` takes the locked shape along, as the lock guards against editing
 * the shape itself, not against moving its room.
 */

import type { Shape, ShapePatch } from "@/lib/plan-schema";

export const LOCK_ALLOWED_FIELDS: readonly string[] = Object.freeze(["label", "style", "locked"]);

/** `true` if the shape is not locked or the patch touches only allowed fields. */
export function isPatchAllowed(shape: Shape, patch: ShapePatch): boolean {
    return !shape.locked || Object.keys(patch).every((key) => LOCK_ALLOWED_FIELDS.includes(key));
}

export function canDelete(shape: Shape): boolean {
    return !shape.locked;
}
