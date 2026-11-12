/**
 * Snapping for moving, resizing and rotating shapes. The grid is relative to
 * the start of a drag: a 37 cm position moved by 13 cm ends at 52 cm.
 */

import { FACTORY_SETTINGS, type PlanSettings } from "@/lib/plan-settings";

/** Factory step for moving and resizing, in cm; the plan's settings decide. */
export const SNAP_STEP_CM = FACTORY_SETTINGS.snapStepCm;
/** Factory step while Alt is held, in cm; the plan's settings decide. */
export const FINE_SNAP_STEP_CM = FACTORY_SETTINGS.fineSnapStepCm;

/** Rotation snaps to these angles when at most `ROTATION_SNAP_TOLERANCE_DEG` away. */
export const ROTATION_SNAPS_DEG = [0, 90, 180, 270] as const;
export const ROTATION_SNAP_TOLERANCE_DEG = 5;

/** The snap step of the plan's settings, the fine one while Alt is held. */
export function snapStepCm(altKey: boolean, settings: Pick<PlanSettings, "snapStepCm" | "fineSnapStepCm">): number {
    return altKey ? settings.fineSnapStepCm : settings.snapStepCm;
}

/** Rounds `delta` to the nearest multiple of `step` (never `-0`). */
export function snapDelta(delta: number, step: number): number {
    const snapped = Math.round(delta / step) * step;
    return snapped === 0 ? 0 : snapped;
}

/** Normalizes to 0 ≤ deg < 360, snaps to 0/90/180/270 within 5°, otherwise rounds to whole degrees. */
export function snapRotationDeg(deg: number): number {
    const normalized = ((deg % 360) + 360) % 360;
    for (const target of [...ROTATION_SNAPS_DEG, 360]) {
        if (Math.abs(normalized - target) <= ROTATION_SNAP_TOLERANCE_DEG) return target % 360;
    }
    const rounded = Math.round(normalized) % 360;
    return rounded === 0 ? 0 : rounded;
}

/**
 * Konva's transformer box: `x`/`y` = rotated top-left corner,
 * `rotation` in radians, all in absolute (screen) coordinates.
 */
export interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

/** Smallest width and height of a box; a single number applies to both. */
export type MinBoxSize = number | { width: number; height: number };

/** `next`'s edges in the local axes of `start` (origin = start's top-left corner). */
function localEdges(start: Box, next: Box) {
    const cos = Math.cos(start.rotation);
    const sin = Math.sin(start.rotation);
    const dx = next.x - start.x;
    const dy = next.y - start.y;
    const left = dx * cos + dy * sin;
    const top = -dx * sin + dy * cos;
    return { left, top, right: left + next.width, bottom: top + next.height };
}

/** Box from local edges of `start`, with start's rotation. */
function fromLocalEdges(start: Box, left: number, top: number, right: number, bottom: number): Box {
    const cos = Math.cos(start.rotation);
    const sin = Math.sin(start.rotation);
    return {
        x: start.x + left * cos - top * sin,
        y: start.y + left * sin + top * cos,
        width: right - left,
        height: bottom - top,
        rotation: start.rotation,
    };
}

/**
 * Snaps a resize: each edge of `next` that moved relative to `start` moves by a
 * multiple of `step` instead; unmoved edges stay exactly where they were.
 * Width and height never drop below their minimum (no flipping), also when the
 * pointer jumps far past it. The rotation of `start` is kept. `step` and `min`
 * use the box's unit (screen pixels).
 */
export function snapResizeBox(start: Box, next: Box, step: number, min: MinBoxSize): Box {
    const minWidth = typeof min === "number" ? min : min.width;
    const minHeight = typeof min === "number" ? min : min.height;
    const edges = localEdges(start, next);
    const [left, right] = snapAxis(edges.left, edges.right, start.width, step, minWidth);
    const [top, bottom] = snapAxis(edges.top, edges.bottom, start.height, step, minHeight);
    return fromLocalEdges(start, left, top, right, bottom);
}

/**
 * Like `snapResizeBox` for a square (a door): the width snaps, the height
 * follows it. The corner opposite the dragged one stays in place.
 */
export function snapSquareResizeBox(start: Box, next: Box, step: number, min: number): Box {
    const edges = localEdges(start, next);
    const [left, right] = snapAxis(edges.left, edges.right, start.width, step, min);
    const size = right - left;
    const eps = 1e-6 * Math.max(1, Math.abs(start.height));
    // The edge that moved in depth direction follows; the other one stays.
    const topMoved = Math.abs(edges.top) > eps;
    const top = topMoved ? start.height - size : 0;
    return fromLocalEdges(start, left, top, right, top + size);
}

/** One axis in local coordinates: the start edges are `0` and `size`. */
function snapAxis(nextLow: number, nextHigh: number, size: number, step: number, min: number): [number, number] {
    const eps = 1e-6 * Math.max(1, Math.abs(size));
    const lowMoved = Math.abs(nextLow) > eps;
    const highMoved = Math.abs(nextHigh - size) > eps;
    let low = lowMoved ? snapDelta(nextLow, step) : 0;
    let high = highMoved ? size + snapDelta(nextHigh - size, step) : size;
    if (high - low < min) {
        // Keep the edge that did not move; with both moving, keep the low one.
        if (lowMoved && !highMoved) low = high - min;
        else high = low + min;
    }
    return [low, high];
}
