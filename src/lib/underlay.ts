/**
 * Geometry of an underlay in the cm world. Pure; canvas, calibration overlay
 * and fitting use the same transformation.
 *
 *     k = pxPerCm (1 without calibration)    θ = underlayRotationDeg(calibration)
 *     c = image center in px
 *     cm(p) = c / k + R(θ) · (p − c) / k      θ = 0  →  cm(p) = p / k
 *
 * R(θ) turns clockwise on screen (y down), like Konva's `rotation`.
 */

import type { Calibration } from "@/lib/calibration-schema";
import type { ImageId, Plan, Underlay } from "@/lib/plan-schema";
import type { Point, RectCm } from "@/lib/viewport";

/** What the geometry needs of an underlay. */
export type UnderlayGeometry = Pick<Underlay, "imageWidthPx" | "imageHeightPx" | "calibration">;

/** Maps any angle onto (−90°, 90°]: the measured line has no direction, so θ and θ ± 180° are the same. */
function normalizeHalfTurn(deg: number): number {
    const mod = ((deg % 180) + 180) % 180;
    // `|| 0` turns -0 into 0.
    return (mod > 90 ? mod - 180 : mod) || 0;
}

/**
 * Rotation of the underlay in degrees that turns the measured line P1→P2
 * exactly horizontal or vertical, the smallest one, in (−90°, 90°].
 * 0 without calibration or alignment.
 */
export function underlayRotationDeg(calibration: Calibration | null): number {
    if (!calibration?.align) return 0;
    const { p1, p2, align } = calibration;
    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    return normalizeHalfTurn(align === "horizontal" ? -angle : 90 - angle);
}

function scaleOf(underlay: UnderlayGeometry): number {
    return underlay.calibration?.pxPerCm ?? 1;
}

/**
 * Image center in px. Without known size (image missing) the origin: it only
 * matters for a rotated underlay, whose size is known once its image was loaded.
 */
function centerOf(underlay: UnderlayGeometry): Point {
    const { imageWidthPx: w, imageHeightPx: h } = underlay;
    return w !== null && h !== null ? { x: w / 2, y: h / 2 } : { x: 0, y: 0 };
}

function rotate(point: Point, deg: number): Point {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

/** Image pixel → cm. */
export function imagePointToCm(point: Point, underlay: UnderlayGeometry): Point {
    const k = scaleOf(underlay);
    const c = centerOf(underlay);
    const turned = rotate({ x: point.x - c.x, y: point.y - c.y }, underlayRotationDeg(underlay.calibration));
    return { x: (c.x + turned.x) / k, y: (c.y + turned.y) / k };
}

/** cm → image pixel; inverse of `imagePointToCm`. */
export function cmToImagePoint(point: Point, underlay: UnderlayGeometry): Point {
    const k = scaleOf(underlay);
    const c = centerOf(underlay);
    const back = rotate({ x: point.x * k - c.x, y: point.y * k - c.y }, -underlayRotationDeg(underlay.calibration));
    return { x: c.x + back.x, y: c.y + back.y };
}

/** Axis-parallel rectangle around the (rotated) image in cm; `null` while its size is unknown. */
export function underlayBoundsCm(underlay: UnderlayGeometry): RectCm | null {
    const { imageWidthPx: w, imageHeightPx: h } = underlay;
    if (w === null || h === null) return null;
    const corners = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
    ].map((p) => imagePointToCm(p, underlay));
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** Attributes of the Konva group holding image and calibration overlay; children are in image px. */
export function underlayGroupAttrs(underlay: UnderlayGeometry) {
    const k = scaleOf(underlay);
    const c = centerOf(underlay);
    return {
        x: c.x / k,
        y: c.y / k,
        offsetX: c.x,
        offsetY: c.y,
        scaleX: 1 / k,
        scaleY: 1 / k,
        rotation: underlayRotationDeg(underlay.calibration),
    };
}

/** Every image a floor's underlay refers to, each once. */
export function referencedImageIds(plan: Plan): ImageId[] {
    const ids = new Set<ImageId>();
    for (const underlay of Object.values(plan.underlayByFloor)) {
        if (underlay?.imageId) ids.add(underlay.imageId);
    }
    return [...ids];
}

/** A checked image file, ready to become the image of an underlay. */
export interface UnderlayImage {
    id: ImageId;
    widthPx: number;
    heightPx: number;
}

export interface UnderlayImageOptions {
    /** The current image is not in the browser (`imageAvailability` „missing“); the caller knows. */
    imageMissing?: boolean;
    /** The user agreed to drop the calibration (see `needsCalibrationReset`). */
    resetCalibration?: boolean;
}

/**
 * `true` if the new image would make the current calibration wrong: the
 * underlay is calibrated, its image is there and has other pixel sizes. The
 * user is asked first.
 */
export function needsCalibrationReset(
    current: Underlay | undefined,
    image: UnderlayImage,
    { imageMissing = false }: UnderlayImageOptions = {},
): boolean {
    if (!current?.calibration || current.imageId === null || imageMissing) return false;
    return current.imageWidthPx !== image.widthPx || current.imageHeightPx !== image.heightPx;
}

/**
 * The underlay after uploading or replacing its image. A new underlay is
 * visible, fully opaque and not calibrated. An existing one keeps visibility,
 * opacity and – unless `needsCalibrationReset` or `resetCalibration` – its
 * calibration with alignment.
 */
export function underlayWithImage(
    current: Underlay | undefined,
    image: UnderlayImage,
    options: UnderlayImageOptions = {},
): Underlay {
    const base = current ?? { calibration: null, visible: true, opacity: 1 };
    const dropCalibration = options.resetCalibration || needsCalibrationReset(current, image, options);
    return {
        imageId: image.id,
        imageWidthPx: image.widthPx,
        imageHeightPx: image.heightPx,
        calibration: dropCalibration ? null : base.calibration,
        visible: base.visible,
        opacity: base.opacity,
    };
}

/**
 * State of an underlay image in this session, keyed by image id. A missing
 * entry means „loading“: the canvas has not finished looking for it yet.
 */
export type ImageAvailability = "loading" | "ready" | "missing";

/**
 * What the status bar says about a floor's underlay: none, image missing
 * (no image, or known to be missing in the browser), or calibrated or not.
 * While the image loads, it counts as there.
 */
export type UnderlayStatus = "none" | "missing" | "uncalibrated" | "calibrated";

export function underlayStatus(underlay: Underlay | undefined, availability: ImageAvailability | undefined): UnderlayStatus {
    if (!underlay) return "none";
    if (underlay.imageId === null || availability === "missing") return "missing";
    return underlay.calibration ? "calibrated" : "uncalibrated";
}
