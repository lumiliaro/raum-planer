/**
 * Reading and checking the fields of a room's properties form: the name, one
 * length and one wall thickness per edge. The plan schema stays the final check.
 */

import { formatCm, openingKindName } from "@/lib/format";
import { reanchorOpenings } from "@/lib/opening-reanchor";
import { MAX_ROOM_NAME_LENGTH, type PointCm, type Room } from "@/lib/plan-schema";
import { edgeLengthsCm, MAX_WALL_THICKNESS_CM, roundCm, setEdgeLength } from "@/lib/room-geometry";
import { NOT_A_NUMBER, parseDecimal } from "@/lib/shape-fields";

export type RoomFieldResult<T> = { ok: true; value: T | null } | { ok: false; error: string };

/** Trimmed name of 1 to 40 characters; the unchanged name gives `value: null`. */
export function applyRoomNameField(room: Room, text: string): RoomFieldResult<string> {
    const name = text.trim();
    if (name === "") return { ok: false, error: "Bitte einen Namen eingeben" };
    if (name.length > MAX_ROOM_NAME_LENGTH) return { ok: false, error: `Höchstens ${MAX_ROOM_NAME_LENGTH} Zeichen` };
    return { ok: true, value: name === room.name ? null : name };
}

/**
 * New corners for the typed length of edge `index` (0-based), see
 * `setEdgeLength`; the length shown unchanged gives `value: null`. Rejected
 * if an opening would no longer fit its edge (see `reanchorOpenings`).
 */
export function applyEdgeLengthField(room: Room, index: number, text: string): RoomFieldResult<PointCm[]> {
    const lengthCm = parseDecimal(text);
    if (lengthCm === null) return { ok: false, error: NOT_A_NUMBER };
    if (lengthCm <= 0) return { ok: false, error: `Muss größer als ${formatCm(0)} sein` };
    if (lengthCm === roundCm(edgeLengthsCm(room.pointsCm)[index])) return { ok: true, value: null };
    const result = setEdgeLength(room.pointsCm, index, lengthCm);
    if (result.ok) {
        const reanchored = reanchorOpenings(room.pointsCm, result.points, room.openings);
        if (reanchored.ok) return { ok: true, value: result.points };
        return { ok: false, error: `Geht nicht: ${openingKindName(reanchored.kind)} auf Kante ${reanchored.edgeIndex + 1} passt nicht mehr` };
    }
    if (result.reason === "too-short") return { ok: false, error: `Geht nicht: Kante ${result.edgeIndex + 1} würde zu kurz` };
    return { ok: false, error: "Geht nicht: Der Umriss würde sich überschneiden" };
}

/**
 * New wall thicknesses for the typed thickness of edge `index` (0-based),
 * rounded to 0.1 cm; the other edges keep theirs. More than 0 cm and at most
 * `MAX_WALL_THICKNESS_CM`; the thickness shown unchanged gives `value: null`.
 */
export function applyWallThicknessField(room: Room, index: number, text: string): RoomFieldResult<number[]> {
    const parsed = parseDecimal(text);
    if (parsed === null) return { ok: false, error: NOT_A_NUMBER };
    const thicknessCm = roundCm(parsed);
    if (thicknessCm <= 0) return { ok: false, error: `Muss größer als ${formatCm(0)} sein` };
    if (thicknessCm > MAX_WALL_THICKNESS_CM) return { ok: false, error: `Darf höchstens ${formatCm(MAX_WALL_THICKNESS_CM)} sein` };
    if (thicknessCm === room.wallThicknessCm[index]) return { ok: true, value: null };
    return { ok: true, value: room.wallThicknessCm.with(index, thicknessCm) };
}
