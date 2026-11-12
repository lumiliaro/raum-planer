/** Lines of the grid shown on a floor without visible underlay. Pure. */

import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import type { RectCm } from "@/lib/viewport";

/** Factory grid spacing in cm; the plan's settings decide. */
export const GRID_STEP_CM = FACTORY_SETTINGS.gridStepCm;

/** Grid lines closer than this on screen are thinned out. */
export const MIN_GRID_SPACING_PX = 4;

/**
 * The spacing actually drawn at zoom `scale` (screen px per cm): `stepCm`
 * times the smallest of 1, 2, 5, 10, 20, 50, … that keeps the lines at least
 * `MIN_GRID_SPACING_PX` apart. Only the drawing is thinned; the setting stays.
 */
export function visibleGridStepCm(stepCm: number, scale: number): number {
    if (!(stepCm > 0 && scale > 0)) return stepCm;
    for (let decade = 1; ; decade *= 10) {
        for (const factor of [1, 2, 5]) {
            const step = stepCm * factor * decade;
            if (step * scale >= MIN_GRID_SPACING_PX || !Number.isFinite(step)) return step;
        }
    }
}

/** Multiples of `stepCm` in `from … to` (both included). */
function multiplesIn(from: number, to: number, stepCm: number): number[] {
    const values: number[] = [];
    // `|| 0` turns -0 into 0.
    for (let i = Math.ceil(from / stepCm); i * stepCm <= to; i++) values.push(i * stepCm || 0);
    return values;
}

/** Positions of the vertical (`xs`) and horizontal (`ys`) grid lines in the visible area; none for an empty area. */
export function gridLines(visible: RectCm, stepCm = GRID_STEP_CM): { xs: number[]; ys: number[] } {
    if (!(visible.width > 0 && visible.height > 0 && stepCm > 0)) return { xs: [], ys: [] };
    return {
        xs: multiplesIn(visible.x, visible.x + visible.width, stepCm),
        ys: multiplesIn(visible.y, visible.y + visible.height, stepCm),
    };
}
