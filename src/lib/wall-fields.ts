/**
 * Reading and checking the fields of a free wall's properties form: its
 * length and its thickness. The plan schema stays the final check.
 */

import { formatCm } from "@/lib/format";
import type { PointCm, Wall } from "@/lib/plan-schema";
import { MAX_WALL_THICKNESS_CM, roundCm } from "@/lib/room-geometry";
import { NOT_A_NUMBER, parseDecimal } from "@/lib/shape-fields";
import { setWallLength, wallLengthCm } from "@/lib/wall-geometry";

export type WallFieldResult<T> = { ok: true; value: T | null } | { ok: false; error: string };

/**
 * The new end for the typed length: the start stays, the end moves along the
 * wall (see `setWallLength`). More than 0 cm; the length shown unchanged
 * (rounded to 0.1 cm) gives `value: null`.
 */
export function applyWallLengthField(wall: Wall, text: string): WallFieldResult<PointCm> {
    const parsed = parseDecimal(text);
    if (parsed === null) return { ok: false, error: NOT_A_NUMBER };
    const lengthCm = roundCm(parsed);
    if (lengthCm <= 0) return { ok: false, error: `Muss größer als ${formatCm(0)} sein` };
    if (lengthCm === roundCm(wallLengthCm(wall))) return { ok: true, value: null };
    const next = setWallLength(wall, lengthCm);
    if (!next) return { ok: false, error: `Muss größer als ${formatCm(0)} sein` };
    return { ok: true, value: next.endCm };
}

/**
 * The typed thickness, rounded to 0.1 cm: more than 0 cm and at most
 * `MAX_WALL_THICKNESS_CM`; the thickness shown unchanged gives `value: null`.
 */
export function applyWallThicknessOfWallField(wall: Wall, text: string): WallFieldResult<number> {
    const parsed = parseDecimal(text);
    if (parsed === null) return { ok: false, error: NOT_A_NUMBER };
    const thicknessCm = roundCm(parsed);
    if (thicknessCm <= 0) return { ok: false, error: `Muss größer als ${formatCm(0)} sein` };
    if (thicknessCm > MAX_WALL_THICKNESS_CM) return { ok: false, error: `Darf höchstens ${formatCm(MAX_WALL_THICKNESS_CM)} sein` };
    if (thicknessCm === wall.thicknessCm) return { ok: true, value: null };
    return { ok: true, value: thicknessCm };
}
