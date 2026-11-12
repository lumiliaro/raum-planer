import { describe, expect, it } from "vitest";
import {
    computeCalibration,
    distancePx,
    formatLengthText,
    gridPxPerMeter,
    parseLengthCm,
    roundImageCoord,
    roundImagePoint,
} from "@/lib/calibration";
import { CalibrationSchema } from "@/lib/calibration-schema";

const P1 = { x: 120.0, y: 160.4 };
const P2 = { x: 1118.6, y: 160.4 };

describe("roundImageCoord", () => {
    it("rounds to 0.1 px", () => {
        expect(roundImageCoord(120.04)).toBe(120);
        expect(roundImageCoord(120.05)).toBe(120.1);
        expect(roundImageCoord(1118.6149)).toBe(1118.6);
        expect(roundImageCoord(160.36)).toBe(160.4);
    });

    it("never returns -0", () => {
        expect(Object.is(roundImageCoord(-0.01), 0)).toBe(true);
    });

    it("rounds both coordinates of a point", () => {
        expect(roundImagePoint({ x: 10.26, y: 3.333 })).toEqual({ x: 10.3, y: 3.3 });
    });
});

describe("distancePx", () => {
    it("measures horizontal distances", () => {
        expect(distancePx(P1, P2)).toBeCloseTo(998.6, 10);
    });

    it("measures diagonal distances", () => {
        expect(distancePx({ x: 0, y: 0 }, { x: 30, y: 40 })).toBe(50);
        expect(distancePx({ x: 30, y: 40 }, { x: 0, y: 0 })).toBe(50);
    });
});

describe("parseLengthCm", () => {
    it.each([
        ["1000", 1000],
        ["412,5", 412.5],
        ["412.5", 412.5],
        [" 80 ", 80],
    ])("accepts %j", (text, expected) => {
        expect(parseLengthCm(text)).toBe(expected);
    });

    it.each(["", "   ", "0", "0,0", "-5", "abc", "1,2,3", "12cm", ",5", "5,"])("rejects %j", (text) => {
        expect(parseLengthCm(text)).toBeNull();
    });
});

describe("computeCalibration", () => {
    it("computes the spec example (outer wall, 1 000 cm)", () => {
        const cal = computeCalibration(P1, P2, 1000);
        expect(cal).toEqual({ p1: P1, p2: P2, realLengthCm: 1000, pxPerCm: 0.9986 });
        expect(gridPxPerMeter(cal!)).toBeCloseTo(99.86, 10);
    });

    it("adds the alignment only when one is chosen", () => {
        expect(computeCalibration(P1, P2, 1000, "horizontal")?.align).toBe("horizontal");
        expect(computeCalibration(P1, P2, 1000, null)).not.toHaveProperty("align");
    });

    it("rounds pxPerCm to four decimals", () => {
        expect(computeCalibration({ x: 0, y: 0 }, { x: 1000, y: 0 }, 3)?.pxPerCm).toBe(333.3333);
    });

    it("returns null when both points coincide", () => {
        expect(computeCalibration(P1, { ...P1 }, 1000)).toBeNull();
    });

    it("returns null for a non-positive length", () => {
        expect(computeCalibration(P1, P2, 0)).toBeNull();
    });
});

describe("formatLengthText", () => {
    it("uses a German comma without grouping or trailing zeros", () => {
        expect(formatLengthText(1000)).toBe("1000");
        expect(formatLengthText(412.5)).toBe("412,5");
        expect(formatLengthText(737)).toBe("737");
    });

    it.each([1000, 412.5, 0.25, 12345.678])("round-trips %d through parseLengthCm", (cm) => {
        expect(parseLengthCm(formatLengthText(cm))).toBe(cm);
    });
});

describe("CalibrationSchema", () => {
    const CAL = { p1: P1, p2: P2, realLengthCm: 1000, pxPerCm: 0.9986 };
    const valid = (value: unknown) => CalibrationSchema.safeParse(value).success;

    it("accepts the spec example without alignment", () => {
        expect(valid(CAL)).toBe(true);
    });

    it("accepts the alignments horizontal and vertical", () => {
        expect(valid({ ...CAL, align: "horizontal" })).toBe(true);
        expect(valid({ ...CAL, align: "vertical" })).toBe(true);
    });

    it("rejects an unknown alignment („schräg“)", () => {
        expect(valid({ ...CAL, align: "diagonal" })).toBe(false);
        expect(valid({ ...CAL, align: null })).toBe(false);
    });

    it("rejects the scale 0 and negative coordinates", () => {
        expect(valid({ ...CAL, pxPerCm: 0 })).toBe(false);
        expect(valid({ ...CAL, p1: { x: -1, y: 0 } })).toBe(false);
    });
});
