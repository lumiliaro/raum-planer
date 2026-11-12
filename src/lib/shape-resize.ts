/**
 * Size rules per shape kind: the size the transformer works with, the smallest
 * valid size, how a new size becomes a patch, and the limits of the dimension
 * fields. Pure, so they are testable without Konva.
 */

import type { PointCm, Shape, ShapePatch } from "@/lib/plan-schema";

export interface SizeCm {
    widthCm: number;
    depthCm: number;
}

/** Dimension fields with exclusive limits (the corner radius of a rectangle is checked in `shape-fields`). */
export type DimensionField = "widthCm" | "depthCm" | "legAWidthCm" | "legBWidthCm" | "baseWidthCm" | "sideWidthCm";

/** Exclusive limits of a dimension field, in cm. */
export interface DimensionLimits {
    minExclusive: number;
    maxExclusive?: number;
}

/** Width and depth of the bounding box; a door is a square of its width. */
export function getSizeCm(shape: Shape): SizeCm {
    switch (shape.kind) {
        case "rect":
        case "ellipse":
        case "l-shape":
        case "u-shape":
        case "corner":
            return { widthCm: shape.widthCm, depthCm: shape.depthCm };
        case "door-swing":
            return { widthCm: shape.widthCm, depthCm: shape.widthCm };
        case "polygon": {
            const xs = shape.pointsCm.map((p) => p.x);
            const ys = shape.pointsCm.map((p) => p.y);
            return { widthCm: Math.max(...xs) - Math.min(...xs), depthCm: Math.max(...ys) - Math.min(...ys) };
        }
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}

/**
 * Smallest width and depth reachable with the handles (inclusive): every gap
 * stays at least as large as the leg next to it, so an L or U stays
 * recognizable. 0 = no limit beyond the general minimum. The form allows every
 * value the schema accepts (`getDimensionLimits`).
 */
export function getMinSizeCm(shape: Shape): SizeCm {
    switch (shape.kind) {
        case "l-shape":
            return { widthCm: 2 * shape.legBWidthCm, depthCm: 2 * shape.legAWidthCm };
        case "u-shape":
            return { widthCm: 3 * shape.sideWidthCm, depthCm: 2 * shape.baseWidthCm };
        case "rect":
        case "ellipse":
        case "corner":
        case "door-swing":
        case "polygon":
            return { widthCm: 0, depthCm: 0 };
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}

/**
 * The patch for a new width and depth. Legs, base and sides stay; a door takes
 * the width only; a rectangle's corner radius shrinks to half the shorter side.
 * Polygons are not resized yet (empty patch).
 */
export function applySizeCm(shape: Shape, size: SizeCm): ShapePatch {
    const { widthCm, depthCm } = size;
    switch (shape.kind) {
        case "rect":
            return {
                widthCm,
                depthCm,
                cornerRadiusCm: Math.min(shape.cornerRadiusCm, Math.min(widthCm, depthCm) / 2),
            };
        case "ellipse":
        case "l-shape":
        case "u-shape":
        case "corner":
            return { widthCm, depthCm };
        case "door-swing":
            return { widthCm };
        case "polygon":
            return {};
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}

/**
 * `requested` if it is at least `min`, otherwise the smallest value on the
 * grid `start − k·step` that is at least `min`. A `start` below `min` stays,
 * so grabbing a handle never enlarges the shape. Start 280 cm, minimum 180 cm,
 * step 5 cm → 180 cm; start 283 cm → 183 cm.
 */
export function clampToGrid(start: number, requested: number, min: number, step: number): number {
    if (requested >= min) return requested;
    if (start <= min) return start;
    return start - Math.floor((start - min) / step + 1e-9) * step;
}

/** A door's hinge as an anchor for `resizeKeepingAnchor`: bottom left of the unmirrored door. */
export const DOOR_HINGE_ANCHOR: PointCm = { x: -0.5, y: 0.5 };

/**
 * New center so that an anchor of the bounding box stays in place on the floor
 * plan when the size changes. `anchor` is given as a fraction of the size in
 * the unmirrored shape (door hinge: `{ x: -0.5, y: 0.5 }`); mirroring and
 * rotation (clockwise, y down, as in Konva) are applied here.
 */
export function resizeKeepingAnchor(shape: Shape, size: SizeCm, anchor: PointCm): PointCm {
    const before = getSizeCm(shape);
    const sx = shape.mirrored ? -1 : 1;
    // Movement of the anchor in local coordinates if the center stayed.
    const dx = sx * anchor.x * (size.widthCm - before.widthCm);
    const dy = anchor.y * (size.depthCm - before.depthCm);
    const rad = (shape.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Move the center the opposite way so the anchor stays.
    return { x: shape.x - (dx * cos - dy * sin), y: shape.y - (dx * sin + dy * cos) };
}

/** Exclusive limits of a dimension field, matching the plan schema. */
export function getDimensionLimits(shape: Shape, field: DimensionField): DimensionLimits {
    const unsupported = () => new Error(`No field ${field} on shape kind ${shape.kind}`);
    switch (shape.kind) {
        case "rect":
        case "ellipse":
        case "corner":
            if (field === "widthCm" || field === "depthCm") return { minExclusive: 0 };
            throw unsupported();
        case "door-swing":
            if (field === "widthCm") return { minExclusive: 0 };
            throw unsupported();
        case "l-shape":
            switch (field) {
                case "widthCm":
                    return { minExclusive: shape.legBWidthCm };
                case "depthCm":
                    return { minExclusive: shape.legAWidthCm };
                case "legAWidthCm":
                    return { minExclusive: 0, maxExclusive: shape.depthCm };
                case "legBWidthCm":
                    return { minExclusive: 0, maxExclusive: shape.widthCm };
                default:
                    throw unsupported();
            }
        case "u-shape":
            switch (field) {
                case "widthCm":
                    return { minExclusive: 2 * shape.sideWidthCm };
                case "depthCm":
                    return { minExclusive: shape.baseWidthCm };
                case "baseWidthCm":
                    return { minExclusive: 0, maxExclusive: shape.depthCm };
                case "sideWidthCm":
                    return { minExclusive: 0, maxExclusive: shape.widthCm / 2 };
                default:
                    throw unsupported();
            }
        case "polygon":
            throw unsupported();
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}
