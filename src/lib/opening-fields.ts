/**
 * Reading and checking the fields of an opening's properties form: width and
 * distance to the left corner (seen from inside). Each commit becomes one patch
 * for `updateOpening`; the plan schema stays the final check.
 */

import { formatCm } from "@/lib/format";
import { leftDistanceCm, offsetFromLeftDistance, OPENING_FIT_EPS_CM, type EdgeFrame } from "@/lib/opening-geometry";
import { defaultOpeningWidthCm, type OpeningWidths } from "@/lib/opening-placement";
import type { Opening, OpeningKind, OpeningPatch } from "@/lib/plan-schema";
import { roundCm } from "@/lib/room-geometry";
import { formatMaxCm, NOT_A_NUMBER, parseDecimal } from "@/lib/shape-fields";

export type OpeningFieldResult = { ok: true; patch: OpeningPatch } | { ok: false; error: string };

const ok = (patch: OpeningPatch): OpeningFieldResult => ({ ok: true, patch });
const fail = (error: string): OpeningFieldResult => ({ ok: false, error });

/** Tiny negative offsets from rounding become 0. */
const nonNegative = (value: number) => (value < 0 && value > -1e-6 ? 0 : value);

/**
 * New width (0,1 cm precision) that keeps the distance to the left corner.
 * Greater than 0 cm and at most edge length minus that distance; the
 * unchanged width gives an empty patch.
 */
export function applyOpeningWidth(frame: EdgeFrame, opening: Opening, text: string): OpeningFieldResult {
    const widthCm = parseDecimal(text);
    if (widthCm === null) return fail(NOT_A_NUMBER);
    if (widthCm <= 0) return fail(`Muss größer als ${formatCm(0)} sein`);
    if (widthCm === opening.widthCm) return ok({});
    const left = leftDistanceCm(frame, opening);
    const max = frame.lengthCm - left;
    if (widthCm > max + 1e-6) return fail(`Darf höchstens ${formatMaxCm(max)} sein`);
    return ok({ widthCm, offsetCm: nonNegative(offsetFromLeftDistance(frame, widthCm, left)) });
}

/**
 * New distance to the left corner (0,1 cm precision), keeping the width: at
 * least 0 cm and at most edge length minus width. The distance shown unchanged
 * gives an empty patch.
 */
export function applyOpeningLeftDistance(frame: EdgeFrame, opening: Opening, text: string): OpeningFieldResult {
    const left = parseDecimal(text);
    if (left === null) return fail(NOT_A_NUMBER);
    if (left < 0) return fail("Darf nicht negativ sein");
    if (left === roundCm(leftDistanceCm(frame, opening))) return ok({});
    const max = frame.lengthCm - opening.widthCm;
    if (left > max + 1e-6) return fail(`Darf höchstens ${formatMaxCm(max)} sein`);
    return ok({ offsetCm: nonNegative(offsetFromLeftDistance(frame, opening.widthCm, left)) });
}

/** The opening covers its whole edge: offset ≈ 0 cm and width ≈ edge length (the tick of „Ganze Kante“). */
export function isFullEdge(frame: EdgeFrame, opening: Pick<Opening, "offsetCm" | "widthCm">): boolean {
    return Math.abs(opening.offsetCm) <= OPENING_FIT_EPS_CM && Math.abs(opening.widthCm - frame.lengthCm) <= OPENING_FIT_EPS_CM;
}

/**
 * Sizes an opening gets when „Ganze Kante“ is unchecked without usable
 * remembered sizes: the default width of its kind from the settings, centered;
 * on an edge at most that long half the edge length, centered. Never the
 * whole edge, so unchecking is always possible.
 */
export function fallbackOpeningSize(
    kind: OpeningKind,
    lengthCm: number,
    widths: OpeningWidths,
): { offsetCm: number; widthCm: number } {
    const defaultWidth = defaultOpeningWidthCm(kind, widths);
    const widthCm = lengthCm <= defaultWidth ? lengthCm / 2 : defaultWidth;
    return { offsetCm: (lengthCm - widthCm) / 2, widthCm };
}

/**
 * Patch for checking (`checked`) or unchecking „Ganze Kante“ of a window or
 * passage. Checking makes it as wide as the edge at offset 0 cm and remembers
 * the sizes before; unchecking restores them if they still fit on the edge and
 * are not the whole edge themselves, otherwise `fallbackOpeningSize`, and
 * forgets them. `null` if there is nothing to do (already in that state, or a
 * door, which has no „Ganze Kante“).
 */
export function toggleFullEdge(
    frame: EdgeFrame,
    opening: Pick<Opening, "kind" | "offsetCm" | "widthCm" | "beforeFullEdge">,
    checked: boolean,
    widths: OpeningWidths,
): OpeningPatch | null {
    if (opening.kind === "door") return null;
    const full = isFullEdge(frame, opening);
    if (checked) {
        if (full) return null;
        return {
            offsetCm: 0,
            widthCm: frame.lengthCm,
            beforeFullEdge: { offsetCm: opening.offsetCm, widthCm: opening.widthCm },
        };
    }
    if (!full) return null;
    const remembered = opening.beforeFullEdge;
    const usable =
        remembered !== null &&
        remembered.offsetCm + remembered.widthCm <= frame.lengthCm + OPENING_FIT_EPS_CM &&
        !isFullEdge(frame, remembered);
    const sizes = usable ? remembered : fallbackOpeningSize(opening.kind, frame.lengthCm, widths);
    return { offsetCm: sizes.offsetCm, widthCm: sizes.widthCm, beforeFullEdge: null };
}
