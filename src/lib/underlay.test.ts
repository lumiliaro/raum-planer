import { describe, expect, it } from "vitest";
import type { Calibration } from "@/lib/calibration-schema";
import { setUnderlay } from "@/lib/plan";
import {
    cmToImagePoint,
    imagePointToCm,
    needsCalibrationReset,
    underlayWithImage,
    referencedImageIds,
    underlayBoundsCm,
    underlayGroupAttrs,
    underlayRotationDeg,
    underlayStatus,
    type UnderlayGeometry,
} from "@/lib/underlay";
import { CAL_EG, imageId, legacyPlan, underlay, underlayWithoutImage } from "@/test/plan-fixtures";

/** Calibration with the given line and scale. */
const cal = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    align?: Calibration["align"],
    pxPerCm = 1,
): Calibration => ({ p1, p2, realLengthCm: 1000, pxPerCm, ...(align ? { align } : {}) });

const HALF = cal({ x: 0, y: 0 }, { x: 500, y: 0 }, undefined, 0.5);
const SKEWED = cal({ x: 100, y: 100 }, { x: 1100, y: 120 }, "horizontal");

const geometry = (calibration: Calibration | null, width = 1240, height = 1754): UnderlayGeometry => ({
    imageWidthPx: width,
    imageHeightPx: height,
    calibration,
});

const expectPoint = (actual: { x: number; y: number }, expected: { x: number; y: number }) => {
    expect(actual.x).toBeCloseTo(expected.x, 9);
    expect(actual.y).toBeCloseTo(expected.y, 9);
};

describe("underlayRotationDeg", () => {
    it("is 0 without calibration or alignment", () => {
        expect(underlayRotationDeg(null)).toBe(0);
        expect(underlayRotationDeg(cal({ x: 100, y: 100 }, { x: 1100, y: 120 }))).toBe(0);
    });

    it("turns a skewed line (100, 100) → (1100, 120) horizontal by about −1.15°", () => {
        expect(underlayRotationDeg(SKEWED)).toBeCloseTo(-1.1458, 3);
    });

    it("turns a vertical line horizontal by ±90°", () => {
        const deg = underlayRotationDeg(cal({ x: 200, y: 100 }, { x: 200, y: 900 }, "horizontal"));
        expect(Math.abs(deg)).toBeCloseTo(90, 9);
    });

    it("turns an almost vertical line vertical by a small angle", () => {
        const deg = underlayRotationDeg(cal({ x: 200, y: 100 }, { x: 210, y: 900 }, "vertical"));
        expect(deg).toBeCloseTo(0.716, 2);
    });

    it("turns a horizontal line vertical by 90°", () => {
        expect(underlayRotationDeg(cal({ x: 0, y: 0 }, { x: 100, y: 0 }, "vertical"))).toBe(90);
    });

    it("does not depend on the direction of the line", () => {
        const back = cal({ x: 1100, y: 120 }, { x: 100, y: 100 }, "horizontal");
        expect(underlayRotationDeg(back)).toBeCloseTo(underlayRotationDeg(SKEWED), 9);
    });

    it("always lies in (−90°, 90°]", () => {
        for (let deg = -360; deg <= 360; deg += 7.5) {
            const rad = (deg * Math.PI) / 180;
            const line = cal({ x: 500, y: 500 }, { x: 500 + 100 * Math.cos(rad), y: 500 + 100 * Math.sin(rad) }, "horizontal");
            const result = underlayRotationDeg(line);
            expect(result).toBeGreaterThan(-90);
            expect(result).toBeLessThanOrEqual(90);
            const vertical = underlayRotationDeg({ ...line, align: "vertical" });
            expect(vertical).toBeGreaterThan(-90);
            expect(vertical).toBeLessThanOrEqual(90);
        }
    });
});

describe("imagePointToCm", () => {
    it("is 1 px = 1 cm without calibration", () => {
        expectPoint(imagePointToCm({ x: 100, y: 50 }, geometry(null)), { x: 100, y: 50 });
    });

    it("at 0.5 px/cm without alignment: (100, 50) px → (200, 100) cm and (0, 0) px → (0, 0) cm", () => {
        expectPoint(imagePointToCm({ x: 100, y: 50 }, geometry(HALF)), { x: 200, y: 100 });
        expectPoint(imagePointToCm({ x: 0, y: 0 }, geometry(HALF)), { x: 0, y: 0 });
    });

    it("ignores the image size without rotation, also while it is unknown", () => {
        expectPoint(imagePointToCm({ x: 100, y: 50 }, underlayWithoutImage(HALF)), { x: 200, y: 100 });
    });

    it("puts both ends of the measured line on the same height after aligning it horizontally", () => {
        const g = geometry(SKEWED);
        const a = imagePointToCm(SKEWED.p1, g);
        const b = imagePointToCm(SKEWED.p2, g);
        expect(a.y).toBeCloseTo(b.y, 9);
        expect(b.x - a.x).toBeCloseTo(Math.hypot(1000, 20), 9);
    });

    it("keeps the image center in place when rotating", () => {
        expectPoint(imagePointToCm({ x: 620, y: 877 }, geometry(SKEWED)), { x: 620, y: 877 });
    });

    it("round-trips through cmToImagePoint", () => {
        for (const c of [null, HALF, SKEWED, { ...SKEWED, pxPerCm: 0.7, align: "vertical" as const }]) {
            for (const p of [
                { x: 0, y: 0 },
                { x: 100, y: 50 },
                { x: 1240, y: 1754 },
                { x: 333.3, y: 12.7 },
            ]) {
                expectPoint(cmToImagePoint(imagePointToCm(p, geometry(c)), geometry(c)), p);
            }
        }
    });
});

describe("underlayBoundsCm", () => {
    it("is null without image size", () => {
        expect(underlayBoundsCm(underlayWithoutImage(HALF))).toBeNull();
    });

    it("is the image scaled by the calibration without rotation", () => {
        expect(underlayBoundsCm(geometry(HALF))).toEqual({ x: 0, y: 0, width: 2480, height: 3508 });
    });

    it("swaps width and height of an image turned by 90° and keeps its center", () => {
        const turned = geometry(cal({ x: 200, y: 100 }, { x: 200, y: 900 }, "horizontal"));
        const bounds = underlayBoundsCm(turned)!;
        expect(bounds.width).toBeCloseTo(1754, 9);
        expect(bounds.height).toBeCloseTo(1240, 9);
        expect(bounds.x + bounds.width / 2).toBeCloseTo(620, 9);
        expect(bounds.y + bounds.height / 2).toBeCloseTo(877, 9);
    });
});

describe("underlayGroupAttrs", () => {
    it("places the group so that the image corner lies at the origin without rotation", () => {
        expect(underlayGroupAttrs(geometry(HALF))).toEqual({
            x: 1240,
            y: 1754,
            offsetX: 620,
            offsetY: 877,
            scaleX: 2,
            scaleY: 2,
            rotation: 0,
        });
    });

    it("maps image pixels like imagePointToCm (same transform as Konva)", () => {
        const g = geometry({ ...SKEWED, pxPerCm: 0.8 });
        const a = underlayGroupAttrs(g);
        const rad = (a.rotation * Math.PI) / 180;
        for (const p of [
            { x: 0, y: 0 },
            { x: 1240, y: 300 },
        ]) {
            // Konva: translate(x, y) · rotate · scale · translate(−offset)
            const sx = (p.x - a.offsetX) * a.scaleX;
            const sy = (p.y - a.offsetY) * a.scaleY;
            const konva = { x: a.x + sx * Math.cos(rad) - sy * Math.sin(rad), y: a.y + sx * Math.sin(rad) + sy * Math.cos(rad) };
            expectPoint(konva, imagePointToCm(p, g));
        }
    });
});

describe("referencedImageIds", () => {
    it("lists every image once and leaves out underlays without image", () => {
        const at = new Date("2026-11-11T10:00:00.000Z");
        let plan = legacyPlan(at);
        plan = setUnderlay(plan, "eg", underlay(), at);
        plan = setUnderlay(plan, "og", underlay(null, { imageId: imageId(1) }), at);
        plan = setUnderlay(plan, "dg", underlayWithoutImage(), at);
        expect(referencedImageIds(plan)).toEqual([imageId(1)]);
        plan = setUnderlay(plan, "dg", underlay(null, { imageId: imageId(2) }), at);
        expect(referencedImageIds(plan).sort()).toEqual([imageId(1), imageId(2)]);
        expect(referencedImageIds(legacyPlan(at))).toEqual([]);
    });
});

describe("underlayWithImage", () => {
    const SAME = { id: imageId(2), widthPx: 1240, heightPx: 1754 };
    const LARGER = { id: imageId(3), widthPx: 2480, heightPx: 3508 };
    const ALIGNED = { ...CAL_EG, align: "horizontal" as const };

    it("creates a visible, fully opaque, uncalibrated underlay without one", () => {
        expect(underlayWithImage(undefined, LARGER)).toEqual({
            imageId: imageId(3),
            imageWidthPx: 2480,
            imageHeightPx: 3508,
            calibration: null,
            visible: true,
            opacity: 1,
        });
        expect(needsCalibrationReset(undefined, LARGER)).toBe(false);
    });

    it("keeps the calibration of an underlay without image and sets the sizes", () => {
        const current = underlayWithoutImage(ALIGNED);
        expect(needsCalibrationReset(current, LARGER)).toBe(false);
        expect(underlayWithImage(current, LARGER)).toEqual(underlay(ALIGNED, { imageId: imageId(3), imageWidthPx: 2480, imageHeightPx: 3508 }));
    });

    it("keeps the calibration when the image is missing in the browser", () => {
        const current = underlay(ALIGNED);
        expect(needsCalibrationReset(current, LARGER, { imageMissing: true })).toBe(false);
        expect(underlayWithImage(current, LARGER, { imageMissing: true }).calibration).toEqual(ALIGNED);
    });

    it("keeps the calibration for the same pixel sizes", () => {
        const current = underlay(ALIGNED);
        expect(needsCalibrationReset(current, SAME)).toBe(false);
        expect(underlayWithImage(current, SAME)).toEqual(underlay(ALIGNED, { imageId: imageId(2) }));
    });

    it("needs a reset for other pixel sizes; with resetCalibration it is not calibrated", () => {
        const current = underlay(ALIGNED);
        expect(needsCalibrationReset(current, LARGER)).toBe(true);
        expect(underlayWithImage(current, LARGER, { resetCalibration: true }).calibration).toBeNull();
    });

    it("never needs a reset for an uncalibrated underlay", () => {
        expect(needsCalibrationReset(underlay(), LARGER)).toBe(false);
    });

    it("keeps visibility and opacity in every case", () => {
        const hidden = { visible: false, opacity: 0.4 };
        for (const [current, options] of [
            [underlay(ALIGNED, hidden), {}],
            [underlay(ALIGNED, hidden), { resetCalibration: true }],
            [underlay(ALIGNED, hidden), { imageMissing: true }],
            [{ ...underlayWithoutImage(ALIGNED), ...hidden }, {}],
        ] as const) {
            expect(underlayWithImage(current, LARGER, options)).toMatchObject(hidden);
        }
    });
});

describe("underlayStatus", () => {
    it("is none without underlay", () => {
        expect(underlayStatus(undefined, undefined)).toBe("none");
    });

    it("is missing without image or when the browser lacks it", () => {
        expect(underlayStatus(underlayWithoutImage(CAL_EG), undefined)).toBe("missing");
        expect(underlayStatus(underlay(CAL_EG), "missing")).toBe("missing");
    });

    it("tells calibrated from uncalibrated while loading and when ready", () => {
        expect(underlayStatus(underlay(CAL_EG), undefined)).toBe("calibrated");
        expect(underlayStatus(underlay(), "loading")).toBe("uncalibrated");
        expect(underlayStatus(underlay(), "ready")).toBe("uncalibrated");
    });
});
