/**
 * Results of moving and transforming a shape on the canvas, as valid shapes
 * for `updateShape`. Positions and sizes are computed in cm, never read back
 * from pixels, so typed values stay exact.
 */

import type { Shape } from "@/lib/plan-schema";
import { applySizeCm } from "@/lib/shape-resize";
import { snapRotationDeg } from "@/lib/snap";

/** Smallest width/depth after a transform, in cm. */
export const MIN_SIZE_CM = 1;

export interface TransformResult {
    xCm: number;
    yCm: number;
    widthCm: number;
    depthCm: number;
    rotationDeg: number;
}

/** Changes below this are float residue from Konva, not a rotation. */
const ROTATION_EPSILON_DEG = 0.01;

/** True if `nextDeg` differs from `prevDeg` by more than float residue (compared modulo 360). */
function wasRotated(prevDeg: number, nextDeg: number): boolean {
    const diff = (((nextDeg - prevDeg) % 360) + 360) % 360;
    return Math.min(diff, 360 - diff) > ROTATION_EPSILON_DEG;
}

/** Rounds to 0,1 cm (removes float residue), never `-0`. */
export function roundCm(value: number): number {
    const rounded = Math.round(value * 10) / 10;
    return rounded === 0 ? 0 : rounded;
}

/** New position = start position + (already snapped) offset in cm. Size and rotation stay. */
export function moveBy<S extends Shape>(shape: S, dxCm: number, dyCm: number): S {
    return { ...shape, x: roundCm(shape.x + dxCm), y: roundCm(shape.y + dyCm) };
}

/**
 * Applies the transformer's result: rounds position and size to 0,1 cm,
 * enforces the minimum size, turns the size into the kind's dimensions
 * (`applySizeCm`: legs keep their thickness, a door takes the width, a corner
 * radius shrinks) and – only if the shape was actually rotated – snaps and
 * normalizes the rotation. A pure resize keeps a typed rotation such as 93°.
 */
export function applyTransform<S extends Shape>(shape: S, t: TransformResult): S {
    const size = {
        widthCm: Math.max(MIN_SIZE_CM, roundCm(t.widthCm)),
        depthCm: Math.max(MIN_SIZE_CM, roundCm(t.depthCm)),
    };
    return {
        ...shape,
        ...applySizeCm(shape, size),
        x: roundCm(t.xCm),
        y: roundCm(t.yCm),
        rotationDeg: wasRotated(shape.rotationDeg, t.rotationDeg) ? snapRotationDeg(t.rotationDeg) : shape.rotationDeg,
    };
}
