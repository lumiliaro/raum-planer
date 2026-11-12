import { describe, expect, it } from "vitest";
import {
    formatAreaM2,
    formatCm,
    formatDeg,
    formatDegrees,
    formatImageCoord,
    formatInputNumber,
    formatOpeningCount,
    formatPx,
    formatPxPerCm,
    formatRoomCount,
    formatShapeCount,
    formatZoomPercent,
    openingKindName,
} from "@/lib/format";

describe("formatZoomPercent", () => {
    it("rounds to a whole number with a space before %", () => {
        expect(formatZoomPercent(0.87)).toBe("87 %");
        expect(formatZoomPercent(0.8749)).toBe("87 %");
        expect(formatZoomPercent(8)).toBe("800 %");
        expect(formatZoomPercent(0.1)).toBe("10 %");
    });
});

describe("formatPxPerCm", () => {
    it("uses a German decimal comma and four decimals", () => {
        expect(formatPxPerCm(0.9986)).toBe("0,9986");
        expect(formatPxPerCm(1.5)).toBe("1,5000");
    });
});

describe("formatImageCoord", () => {
    it("uses one decimal, a German comma and a non-breaking space for thousands", () => {
        expect(formatImageCoord(120)).toBe("120,0");
        expect(formatImageCoord(1118.6)).toBe("1 118,6");
        expect(formatImageCoord(998.6)).toBe("998,6");
        expect(formatImageCoord(99.86)).toBe("99,9");
    });
});

describe("formatCm", () => {
    it("uses at most one decimal, a German comma and a non-breaking space for thousands", () => {
        expect(formatCm(100)).toBe("100 cm");
        expect(formatCm(424.5)).toBe("424,5 cm");
        expect(formatCm(0.1)).toBe("0,1 cm");
        expect(formatCm(1000)).toBe("1\u00A0000 cm");
        expect(formatCm(52.04)).toBe("52 cm");
        expect(formatCm(-0.04)).toBe("0 cm");
    });
});

describe("formatDeg", () => {
    it("appends the degree sign without a space", () => {
        expect(formatDeg(90)).toBe("90°");
        expect(formatDeg(0)).toBe("0°");
        expect(formatDeg(48)).toBe("48°");
    });
});

describe("formatDegrees", () => {
    it("shows one decimal with a German comma and a real minus sign", () => {
        expect(formatDegrees(-1.146)).toBe("\u22121,1°");
        expect(formatDegrees(0)).toBe("0,0°");
        expect(formatDegrees(90)).toBe("90,0°");
        expect(formatDegrees(0.716)).toBe("0,7°");
    });

    it("never shows −0,0°", () => {
        expect(formatDegrees(-0.04)).toBe("0,0°");
        expect(formatDegrees(-0)).toBe("0,0°");
    });
});

describe("formatPx", () => {
    it("uses at most one decimal and a German comma", () => {
        expect(formatPx(1.5)).toBe("1,5 px");
        expect(formatPx(20)).toBe("20 px");
    });
});

describe("formatInputNumber", () => {
    it("uses at most one decimal, a German comma and no thousands separator", () => {
        expect(formatInputNumber(1000)).toBe("1000");
        expect(formatInputNumber(424.5)).toBe("424,5");
        expect(formatInputNumber(52.04)).toBe("52");
        expect(formatInputNumber(-30)).toBe("-30");
    });

    it("never shows -0", () => {
        expect(formatInputNumber(-0)).toBe("0");
        expect(formatInputNumber(-0.04)).toBe("0");
    });
});

describe("formatShapeCount", () => {
    it("uses singular only for exactly one shape", () => {
        expect(formatShapeCount(0)).toBe("0 Formen");
        expect(formatShapeCount(1)).toBe("1 Form");
        expect(formatShapeCount(23)).toBe("23 Formen");
    });
});

describe("formatRoomCount", () => {
    it("uses singular only for exactly one room", () => {
        expect(formatRoomCount(0)).toBe("0 Räume");
        expect(formatRoomCount(1)).toBe("1 Raum");
        expect(formatRoomCount(8)).toBe("8 Räume");
    });

    it("uses the dative plural after „mit“", () => {
        expect(formatRoomCount(3, { dative: true })).toBe("3 Räumen");
        expect(formatRoomCount(1, { dative: true })).toBe("1 Raum");
    });
});

describe("formatOpeningCount", () => {
    it.each([
        [7, 4, "7 Türen und 4 Fenster"],
        [1, 1, "1 Tür und 1 Fenster"],
        [0, 2, "0 Türen und 2 Fenster"],
    ])("%i doors and %i windows → %s", (doors, windows, text) => {
        expect(formatOpeningCount(doors, windows)).toBe(text);
    });

    it.each([
        [7, 4, 0, "7 Türen und 4 Fenster"],
        [7, 4, 1, "7 Türen, 4 Fenster und 1 Durchgang"],
        [0, 0, 2, "0 Türen, 0 Fenster und 2 Durchgänge"],
    ])("%i doors, %i windows and %i passages → %s", (doors, windows, passages, text) => {
        expect(formatOpeningCount(doors, windows, passages)).toBe(text);
    });
});

describe("openingKindName", () => {
    it.each([
        ["door", "Tür"],
        ["window", "Fenster"],
        ["passage", "Durchgang"],
    ] as const)("%s → %s", (kind, name) => {
        expect(openingKindName(kind)).toBe(name);
    });
});

describe("formatAreaM2", () => {
    it("shows two decimals with a comma and m²", () => {
        expect(formatAreaM2(12.5)).toBe("12,50 m²");
        expect(formatAreaM2(7)).toBe("7,00 m²");
        expect(formatAreaM2(3.14159)).toBe("3,14 m²");
    });

    it("uses a non-breaking space for thousands", () => {
        expect(formatAreaM2(1234.5)).toBe("1 234,50 m²");
    });
});
