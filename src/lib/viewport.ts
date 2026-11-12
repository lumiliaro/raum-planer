/**
 * Pure view math for the floor plan stage. No React or Konva dependencies.
 *
 * Coordinates: "world" = cm (shapes, underlays, later rooms),
 * "screen" = CSS pixels inside the stage.
 */

export interface Size {
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

/** Axis-parallel rectangle in cm: top-left corner and size. */
export interface RectCm {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Viewport {
    /** Screen pixels per cm (1 = 100 %). */
    scale: number;
    /** Screen position of (0 cm, 0 cm). */
    x: number;
    y: number;
}

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 8;

/** Zoom step for buttons and keyboard shortcuts. */
export const ZOOM_STEP = 1.25;

export const FIT_PADDING_PX = 24;

export function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** Fits the whole rectangle (cm) into the view with padding and centers it. */
export function fitViewport(bounds: RectCm, view: Size, paddingPx = FIT_PADDING_PX): Viewport {
    const availableW = Math.max(1, view.width - 2 * paddingPx);
    const availableH = Math.max(1, view.height - 2 * paddingPx);
    // A rectangle without extent (one point) would give an infinite scale; the clamp takes the maximum.
    const width = Math.max(bounds.width, Number.MIN_VALUE);
    const height = Math.max(bounds.height, Number.MIN_VALUE);
    const scale = clampScale(Math.min(availableW / width, availableH / height));
    return {
        scale,
        x: (view.width - bounds.width * scale) / 2 - bounds.x * scale,
        y: (view.height - bounds.height * scale) / 2 - bounds.y * scale,
    };
}

export function screenToWorld(vp: Viewport, point: Point): Point {
    return {
        x: (point.x - vp.x) / vp.scale,
        y: (point.y - vp.y) / vp.scale,
    };
}

export function worldToScreen(vp: Viewport, point: Point): Point {
    return {
        x: point.x * vp.scale + vp.x,
        y: point.y * vp.scale + vp.y,
    };
}

/** The part of the world (cm) the view shows. */
export function visibleRectCm(vp: Viewport, view: Size): RectCm {
    const topLeft = screenToWorld(vp, { x: 0, y: 0 });
    return { x: topLeft.x, y: topLeft.y, width: view.width / vp.scale, height: view.height / vp.scale };
}

/** Zooms by `factor` while keeping the world point under `point` fixed on screen. */
export function zoomAt(vp: Viewport, point: Point, factor: number): Viewport {
    const scale = clampScale(vp.scale * factor);
    const anchor = screenToWorld(vp, point);
    return {
        scale,
        x: point.x - anchor.x * scale,
        y: point.y - anchor.y * scale,
    };
}

export function zoomAtCenter(vp: Viewport, view: Size, factor: number): Viewport {
    return zoomAt(vp, { x: view.width / 2, y: view.height / 2 }, factor);
}

/**
 * Zoom factor for a wheel event. Exponential, so a mouse wheel (few large
 * deltas) and a touchpad (many small deltas) feel the same.
 */
export function wheelFactor(deltaY: number): number {
    return Math.exp(-deltaY * 0.0015);
}
