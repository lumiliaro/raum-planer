/**
 * What „Einpassen“ shows on a floor: everything visible there. Pure.
 */

import { getOutlineCm } from "@/lib/outline";
import type { Room, Shape, Underlay } from "@/lib/plan-schema";
import { wallBandOutline } from "@/lib/room-geometry";
import { underlayBoundsCm } from "@/lib/underlay";
import type { Point, RectCm } from "@/lib/viewport";

/** Shown on a floor without visible content: 0 … 10 m in both directions. */
export const EMPTY_FLOOR_BOUNDS: RectCm = { x: 0, y: 0, width: 1000, height: 1000 };

export interface FloorContent {
    /** `underlayBoundsCm` of a visible underlay with image, else `null`. */
    underlayRect: RectCm | null;
    shapes: readonly Shape[];
    /** Count with their wall band. */
    rooms?: readonly Room[];
}

/**
 * The underlay's rectangle if it counts for fitting: it is visible and its
 * image is shown (`imageShown`: loaded, not missing or still loading).
 */
export function visibleUnderlayRect(underlay: Underlay | undefined, imageShown: boolean): RectCm | null {
    return underlay?.visible && imageShown ? underlayBoundsCm(underlay) : null;
}

/** The shape's outline in cm with its rotation and position; `null` for kinds without outline. */
function placedOutlineCm(shape: Shape): Point[] | null {
    const outline = getOutlineCm(shape);
    if (!outline) return null;
    const rad = (shape.rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return outline.map((p) => ({ x: shape.x + p.x * cos - p.y * sin, y: shape.y + p.x * sin + p.y * cos }));
}

/**
 * Union of the underlay rectangle, the rotated outlines of all shapes and the
 * rooms including their wall band; `EMPTY_FLOOR_BOUNDS` if there is nothing.
 */
export function floorContentBounds({ underlayRect, shapes, rooms = [] }: FloorContent): RectCm {
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
    if (xs.length === 0) return { ...EMPTY_FLOOR_BOUNDS };
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}
