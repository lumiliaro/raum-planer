/**
 * Pure calibration math: scale of a floor plan from two image points and a
 * known real length. No React or Konva dependencies.
 */

import type { Calibration, CalibrationAlign, ImagePoint } from "@/lib/calibration-schema";

/** Rounds an image coordinate to 0.1 px (the precision shown and stored). */
export function roundImageCoord(value: number): number {
    // `|| 0` turns -0 into 0.
    return Math.round(value * 10) / 10 || 0;
}

export function roundImagePoint(point: ImagePoint): ImagePoint {
    return { x: roundImageCoord(point.x), y: roundImageCoord(point.y) };
}

export function distancePx(p1: ImagePoint, p2: ImagePoint): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

const LENGTH_PATTERN = /^\d+([.,]\d+)?$/;

/** `"412,5"` / `"412.5"` → `412.5`; empty, non-numeric or ≤ 0 → `null`. */
export function parseLengthCm(text: string): number | null {
    const trimmed = text.trim();
    if (!LENGTH_PATTERN.test(trimmed)) return null;
    const value = Number(trimmed.replace(",", "."));
    return Number.isFinite(value) && value > 0 ? value : null;
}

const lengthTextFormat = new Intl.NumberFormat("de-DE", { useGrouping: false, maximumFractionDigits: 20 });

/** Counterpart of `parseLengthCm` for prefilling the field: `412.5` → `"412,5"`, `1000` → `"1000"`. */
export function formatLengthText(cm: number): string {
    return lengthTextFormat.format(cm);
}

function round4(value: number): number {
    return Math.round(value * 10_000) / 10_000;
}

/**
 * Expects already rounded points (the ones shown to the user). `align`
 * (optional) turns the underlay so the line lies horizontal or vertical.
 * Returns `null` when both points coincide.
 */
export function computeCalibration(
    p1: ImagePoint,
    p2: ImagePoint,
    realLengthCm: number,
    align: CalibrationAlign | null = null,
): Calibration | null {
    const distance = distancePx(p1, p2);
    if (distance === 0 || !(realLengthCm > 0)) return null;
    return {
        p1: { ...p1 },
        p2: { ...p2 },
        realLengthCm,
        pxPerCm: round4(distance / realLengthCm),
        ...(align ? { align } : {}),
    };
}

/** Screen-independent grid size: image px for 1 m, from the rounded `pxPerCm`. */
export function gridPxPerMeter(cal: Calibration): number {
    return cal.pxPerCm * 100;
}
