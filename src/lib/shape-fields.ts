/**
 * Reading, checking and converting the values of the properties form. Each
 * commit of a field becomes one patch for `updateShape`; the plan schema stays
 * the final check. Limits with equality read "höchstens", exclusive limits
 * "größer als"/"kleiner als".
 */

import { formatCm, formatPx } from "@/lib/format";
import type { Shape, ShapePatch } from "@/lib/plan-schema";
import { DOOR_HINGE_ANCHOR, getDimensionLimits, resizeKeepingAnchor, type DimensionField } from "@/lib/shape-resize";

export type NumberFieldKey = DimensionField | "cornerRadiusCm" | "x" | "y" | "rotationDeg" | "strokeWidth";

export type FieldResult = { ok: true; patch: ShapePatch } | { ok: false; error: string };

/** Largest stroke width in screen px, as in `ShapeStyleSchema`. */
export const MAX_STROKE_WIDTH_PX = 20;

export const NOT_A_NUMBER = "Bitte eine Zahl eingeben";

/** Optional sign (`-` or `−`), digits with comma or point as decimal separator. */
const DECIMAL_PATTERN = /^[-−]?(\d+([.,]\d*)?|[.,]\d+)$/;

/** Rounds to 0,1, never `-0`. */
function round1(value: number): number {
    const rounded = Math.round(value * 10) / 10;
    return rounded === 0 ? 0 : rounded;
}

/** `"238,5"` → `238.5`, `"412.44"` → `412.4`, `"−30"` → `-30`; anything else → `null`. */
export function parseDecimal(text: string): number | null {
    const trimmed = text.trim();
    if (!DECIMAL_PATTERN.test(trimmed)) return null;
    const value = Number(trimmed.replace("−", "-").replace(",", "."));
    return Number.isFinite(value) ? round1(value) : null;
}

/** Normalizes to 0 ≤ deg < 360 with 0,1° precision, without snapping. */
export function normalizeRotationDeg(deg: number): number {
    const normalized = round1((((deg % 360) + 360) % 360));
    return normalized >= 360 ? 0 : normalized;
}

/** Upper limit for the hint, rounded down so the shown value itself is accepted. */
export function formatMaxCm(max: number): string {
    return formatCm(Math.floor(max * 10 + 1e-9) / 10);
}

const ok = (patch: ShapePatch): FieldResult => ({ ok: true, patch });
const fail = (error: string): FieldResult => ({ ok: false, error });

/**
 * Turns the text of a number field into a patch, or an error with the violated
 * limit. Same value as before → empty patch.
 */
export function applyNumberField(shape: Shape, field: NumberFieldKey, text: string): FieldResult {
    const value = parseDecimal(text);
    if (value === null) return fail(NOT_A_NUMBER);

    switch (field) {
        case "x":
        case "y":
            return ok(value === shape[field] ? {} : { [field]: value });

        case "rotationDeg": {
            const rotationDeg = normalizeRotationDeg(value);
            return ok(rotationDeg === shape.rotationDeg ? {} : { rotationDeg });
        }

        case "strokeWidth":
            if (value <= 0) return fail(`Muss größer als ${formatPx(0)} sein`);
            if (value > MAX_STROKE_WIDTH_PX) return fail(`Darf höchstens ${formatPx(MAX_STROKE_WIDTH_PX)} sein`);
            return ok(value === shape.style.strokeWidth ? {} : { style: { ...shape.style, strokeWidth: value } });

        case "widthCm":
        case "depthCm":
        case "legAWidthCm":
        case "legBWidthCm":
        case "baseWidthCm":
        case "sideWidthCm":
            return applyDimension(shape, field, value);

        case "cornerRadiusCm": {
            if (shape.kind !== "rect") throw new Error(`No corner radius on shape kind ${shape.kind}`);
            if (value < 0) return fail("Darf nicht negativ sein");
            const max = Math.min(shape.widthCm, shape.depthCm) / 2;
            if (value > max) return fail(`Darf höchstens ${formatMaxCm(max)} sein`);
            return ok(value === shape.cornerRadiusCm ? {} : { cornerRadiusCm: value });
        }

        default: {
            const unhandled: never = field;
            throw new Error(`Unknown field: ${unhandled as string}`);
        }
    }
}

/**
 * A dimension within its exclusive limits (`getDimensionLimits`). The center
 * stays, except for a door: its hinge stays in place on the floor plan. A
 * rectangle's corner radius shrinks to half the shorter side if needed.
 */
function applyDimension(shape: Shape, field: DimensionField, value: number): FieldResult {
    const { minExclusive, maxExclusive } = getDimensionLimits(shape, field);
    if (value <= minExclusive) return fail(`Muss größer als ${formatCm(minExclusive)} sein`);
    if (maxExclusive !== undefined && value >= maxExclusive) return fail(`Muss kleiner als ${formatCm(maxExclusive)} sein`);
    const current = (shape as unknown as Record<DimensionField, number>)[field];
    if (value === current) return ok({});

    if (shape.kind === "door-swing") {
        const center = resizeKeepingAnchor(shape, { widthCm: value, depthCm: value }, DOOR_HINGE_ANCHOR);
        return ok({ widthCm: value, x: round1(center.x), y: round1(center.y) });
    }
    if (shape.kind === "rect") {
        const widthCm = field === "widthCm" ? value : shape.widthCm;
        const depthCm = field === "depthCm" ? value : shape.depthCm;
        const maxRadius = Math.min(widthCm, depthCm) / 2;
        if (shape.cornerRadiusCm > maxRadius) return ok({ [field]: value, cornerRadiusCm: maxRadius });
    }
    return ok({ [field]: value });
}

/** Trimmed text; an empty text removes the label. */
export function applyLabelField(text: string): ShapePatch {
    const label = text.trim();
    return { label: label === "" ? undefined : label };
}
