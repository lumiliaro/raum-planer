/**
 * What „Einpassen“ shows on a floor: everything visible there. Pure.
 */

import { placedOutlineCm } from "@/lib/outline";
import type { Room, Shape, Underlay, Wall } from "@/lib/plan-schema";
import { wallBandOutline } from "@/lib/room-geometry";
import { underlayBoundsCm } from "@/lib/underlay";
import { wallBandOutline as freeWallBandOutline } from "@/lib/wall-geometry";
import type { RectCm } from "@/lib/viewport";

/** Shown on a floor without visible content: 0 … 10 m in both directions. */
export const EMPTY_FLOOR_BOUNDS: RectCm = { x: 0, y: 0, width: 1000, height: 1000 };

export interface FloorContent {
    /** `underlayBoundsCm` of a visible underlay with image, else `null`. */
    underlayRect: RectCm | null;
    shapes: readonly Shape[];
    /** Count with their wall band. */
    rooms?: readonly Room[];
    /** Free walls; count with their thickness. */
    walls?: readonly Wall[];
}

/**
 * The underlay's rectangle if it counts for fitting: it is visible and its
 * image is shown (`imageShown`: loaded, not missing or still loading).
 */
export function visibleUnderlayRect(underlay: Underlay | undefined, imageShown: boolean): RectCm | null {
    return underlay?.visible && imageShown ? underlayBoundsCm(underlay) : null;
}

/**
 * Union of the underlay rectangle, the rotated outlines of all shapes and the
 * rooms including their wall band and the bands of the free walls;
 * `EMPTY_FLOOR_BOUNDS` if there is nothing.
 */
export function floorContentBounds({ underlayRect, shapes, rooms = [], walls = [] }: FloorContent): RectCm {
    const xs: number[] = [];
    const ys: number[] = [];
    if (underlayRect) {
        xs.push(underlayRect.x, underlayRect.x + underlayRect.width);
        ys.push(underlayRect.y, underlayRect.y + underlayRect.height);
    }
    for (const shape of shapes) {
        for (const p of placedOutlineCm(shape) ?? []) {
            xs.push(p.x);
            ys.push(p.y);
        }
    }
    for (const room of rooms) {
        for (const p of wallBandOutline(room.pointsCm, room.wallThicknessCm)) {
            xs.push(p.x);
            ys.push(p.y);
        }
    }
    for (const wall of walls) {
        for (const p of freeWallBandOutline(wall)) {
            xs.push(p.x);
            ys.push(p.y);
        }
    }
    if (xs.length === 0) return { ...EMPTY_FLOOR_BOUNDS };
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
