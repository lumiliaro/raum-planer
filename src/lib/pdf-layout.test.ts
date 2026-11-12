import { describe, expect, it } from "vitest";
import {
    defaultPdfOptions,
    drawingAreaMm,
    drawingTransform,
    fitAreaMm,
    fitScaleDenominator,
    fitsAtScale,
    formatPrintDate,
    pageScale,
    pageSizeMm,
    paperMm,
    pdfFileName,
    pdfIssues,
    printContentBounds,
    scaleBarMeters,
    type PdfOptions,
    type PrintFloorContent,
} from "@/lib/pdf-layout";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import type { Plan, Room, Shape, Underlay } from "@/lib/plan-schema";

const IMAGE_ID = "a".repeat(64);

/** A rectangular room from (x, y) with inner size w × h and the same wall on every edge. */
function room(x: number, y: number, w: number, h: number, wallCm = 15): Room {
    return {
        id: crypto.randomUUID(),
        name: "Raum",
        pointsCm: [
            { x, y },
            { x: x + w, y },
            { x: x + w, y: y + h },
            { x, y: y + h },
        ],
        openings: [],
        wallThicknessCm: [wallCm, wallCm, wallCm, wallCm],
        color: null,
        locked: false,
    };
}

function bed(x: number, y: number): Shape {
    return {
        id: crypto.randomUUID(),
        kind: "rect",
        x,
        y,
        rotationDeg: 0,
        mirrored: false,
        style: { fill: "#FFFFFF", stroke: "#000000", strokeWidth: 1, opacity: 1 },
        widthCm: 180,
        depthCm: 200,
        cornerRadiusCm: 0,
    };
}

/** 2000 × 1000 px image, uncalibrated: 2000 × 1000 cm from the origin. */
const underlay: Underlay = {
    imageId: IMAGE_ID,
    imageWidthPx: 2000,
    imageHeightPx: 1000,
    calibration: null,
    visible: false,
    opacity: 0.5,
};

function plan(floors: Array<{ name: string; rooms?: Room[]; shapes?: Shape[]; underlay?: Underlay }>): Plan {
    const ids = floors.map(() => crypto.randomUUID());
    return {
        schemaVersion: 11,
        name: "Umzug",
        createdAt: "2026-11-12T00:00:00.000Z",
        updatedAt: "2026-11-12T00:00:00.000Z",
        activeFloorId: ids[0],
        floors: floors.map((f, i) => ({ id: ids[i], name: f.name })),
        underlayByFloor: Object.fromEntries(floors.flatMap((f, i) => (f.underlay ? [[ids[i], f.underlay]] : []))),
        roomsByFloor: Object.fromEntries(floors.map((f, i) => [ids[i], f.rooms ?? []])),
        shapesByFloor: Object.fromEntries(floors.map((f, i) => [ids[i], f.shapes ?? []])),
        settings: { ...FACTORY_SETTINGS },
    } as Plan;
}

const content = (c: Partial<PrintFloorContent>): PrintFloorContent => ({
    rooms: [],
    shapes: [],
    underlay: undefined,
    imageAvailable: false,
    ...c,
});

const portrait = drawingAreaMm("portrait");
const landscape = drawingAreaMm("landscape");

describe("defaultPdfOptions", () => {
    it("checks all floors, portrait, 1:100, furniture and room labels on, dimensions, underlay and grid off", () => {
        const p = plan([{ name: "Erdgeschoss" }, { name: "Obergeschoss" }]);
        expect(defaultPdfOptions(p)).toEqual({
            floorIds: p.floors.map((f) => f.id),
            orientation: "portrait",
            scale: 100,
            furniture: true,
            roomLabels: true,
            dimensions: false,
            underlay: false,
            grid: false,
        });
    });
});

describe("page and drawing area", () => {
    it("is A4 in both orientations", () => {
        expect(pageSizeMm("portrait")).toEqual({ width: 210, height: 297 });
        expect(pageSizeMm("landscape")).toEqual({ width: 297, height: 210 });
    });

    it("leaves 190 × 250 mm (portrait) and 277 × 163 mm (landscape), 1 cm from the left", () => {
        expect(portrait).toMatchObject({ x: 10, width: 190, height: 250 });
        expect(landscape).toMatchObject({ x: 10, width: 277, height: 163 });
        expect(portrait.y).toBe(landscape.y);
    });
});

describe("printContentBounds", () => {
    it("counts rooms with their walls", () => {
        expect(printContentBounds(content({ rooms: [room(0, 0, 400, 300)] }), defaultPdfOptions({ floors: [] }))).toEqual({
            x: -15,
            y: -15,
            width: 430,
            height: 330,
        });
    });

    it("counts furniture only with „Möbel“", () => {
        const c = content({ rooms: [room(0, 0, 400, 300)], shapes: [bed(3000, 150)] });
        const on = printContentBounds(c, { furniture: true, underlay: false })!;
        const off = printContentBounds(c, { furniture: false, underlay: false })!;
        expect(on.x + on.width).toBe(3090);
        expect(off.width).toBe(430);
    });

    it("counts the underlay only with „Vorlage“ and its image there", () => {
        const c = content({ rooms: [room(0, 0, 400, 300)], underlay, imageAvailable: true });
        expect(printContentBounds(c, { furniture: true, underlay: true })!.width).toBe(2015);
        expect(printContentBounds(c, { furniture: true, underlay: false })!.width).toBe(430);
        expect(printContentBounds({ ...c, imageAvailable: false }, { furniture: true, underlay: true })!.width).toBe(430);
    });

    it("is null for an empty floor, also with furniture or underlay switched off", () => {
        expect(printContentBounds(content({}), { furniture: true, underlay: true })).toBeNull();
        expect(printContentBounds(content({ shapes: [bed(0, 0)] }), { furniture: false, underlay: false })).toBeNull();
        expect(
            printContentBounds(content({ underlay, imageAvailable: true }), { furniture: true, underlay: false }),
        ).toBeNull();
    });
});

describe("room for dimensions", () => {
    /** One room of 1385 × 500 cm with its walls: exactly 277 × 100 mm, landscape at 1:50. */
    const exact = plan([{ name: "Erdgeschoss", rooms: [room(0, 0, 1355, 470)] }]);
    const opts = (dimensions: boolean, scale: PdfOptions["scale"]): PdfOptions => ({
        ...defaultPdfOptions(exact),
        orientation: "landscape",
        scale,
        dimensions,
    });

    it("does not change the content's bounds", () => {
        const c = content({ rooms: [room(0, 0, 400, 300)], shapes: [bed(100, 100)] });
        const base = { furniture: true, underlay: false };
        expect(printContentBounds(c, { ...base, dimensions: true } as PdfOptions)).toEqual(printContentBounds(c, base));
    });

    it("leaves the area as it is without „Maße“ and takes 3,3 mm from every side with it", () => {
        expect(fitAreaMm(landscape, { dimensions: false })).toEqual({ width: 277, height: 163 });
        const smaller = fitAreaMm(landscape, { dimensions: true });
        expect(smaller.width).toBeCloseTo(277 - 6.6, 9);
        expect(smaller.height).toBeCloseTo(163 - 6.6, 9);
    });

    it("fits content that just fits at 1:50 at a smaller scale with „Maße“", () => {
        const bounds = printContentBounds(content({ rooms: exact.roomsByFloor[exact.activeFloorId] }), opts(false, "fit"))!;
        expect(pageScale(bounds, fitAreaMm(landscape, { dimensions: false }), "fit")).toBe(50);
        expect(pageScale(bounds, fitAreaMm(landscape, { dimensions: true }), "fit")).toBeGreaterThan(50);
    });

    it("reports content that just fits at 1:50 as too large with „Maße“", () => {
        expect(pdfIssues(exact, opts(false, 50), new Set()).tooLarge).toEqual([]);
        expect(pdfIssues(exact, opts(true, 50), new Set()).tooLarge).toEqual(["Erdgeschoss"]);
    });
});

describe("scale", () => {
    it("fits 1385 × 500 cm in landscape at 1:50, 277 × 100 mm", () => {
        const bounds = { x: 0, y: 0, width: 1385, height: 500 };
        expect(fitScaleDenominator(bounds, landscape)).toBe(50);
        expect(paperMm(bounds.width, 50)).toBeCloseTo(277, 9);
        expect(paperMm(bounds.height, 50)).toBeCloseTo(100, 9);
    });

    it("fits 2000 × 1000 cm in portrait at 1:106", () => {
        expect(fitScaleDenominator({ x: 0, y: 0, width: 2000, height: 1000 }, portrait)).toBe(106);
    });

    it("never goes below 1:1", () => {
        expect(fitScaleDenominator({ x: 0, y: 0, width: 1, height: 1 }, portrait)).toBe(1);
    });

    it("1200 × 900 cm fits neither orientation at 1:50, but portrait at 1:100", () => {
        const bounds = { x: 0, y: 0, width: 1200, height: 900 };
        expect(fitsAtScale(bounds, portrait, 50)).toBe(false);
        expect(fitsAtScale(bounds, landscape, 50)).toBe(false);
        expect(fitsAtScale(bounds, portrait, 100)).toBe(true);
    });

    it("prints an empty floor at 1:100 and keeps fixed scales", () => {
        expect(pageScale(null, portrait, "fit")).toBe(100);
        expect(pageScale(null, portrait, 50)).toBe(100);
        expect(pageScale({ x: 0, y: 0, width: 100, height: 100 }, portrait, 50)).toBe(50);
        expect(pageScale({ x: 0, y: 0, width: 2000, height: 1000 }, portrait, "fit")).toBe(106);
    });
});

describe("drawingTransform", () => {
    it("centers 430 × 330 cm at 1:100 in the portrait area", () => {
        const bounds = { x: -15, y: -15, width: 430, height: 330 };
        const t = drawingTransform(bounds, portrait, 100);
        expect(t.mmPerCm).toBe(0.1);
        const left = t.originMm.x + bounds.x * t.mmPerCm;
        const top = t.originMm.y + bounds.y * t.mmPerCm;
        expect(left).toBeCloseTo((190 - 43) / 2, 9);
        expect(top).toBeCloseTo((250 - 33) / 2, 9);
        // A 500-cm edge is 5 cm on paper.
        expect(500 * t.mmPerCm).toBe(50);
    });
});

describe("scaleBarMeters", () => {
    it("picks the longest length up to 10 cm on paper", () => {
        expect(scaleBarMeters(100)).toBe(10);
        expect(scaleBarMeters(50)).toBe(5);
        expect(scaleBarMeters(106)).toBe(10);
        expect(paperMm(1000, 106)).toBeCloseTo(94.34, 2);
        expect(scaleBarMeters(250)).toBe(20);
        expect(scaleBarMeters(1000)).toBe(50);
    });

    it("falls back to 1 m below 1:10", () => {
        expect(scaleBarMeters(10)).toBe(1);
        expect(scaleBarMeters(5)).toBe(1);
    });
});

describe("pdfIssues", () => {
    const big = room(0, 0, 1170, 870); // 1200 × 900 cm with walls
    const p = plan([{ name: "Erdgeschoss", rooms: [big] }, { name: "Obergeschoss", rooms: [big] }, { name: "Dachgeschoss" }]);
    const opts = (o: Partial<PdfOptions>): PdfOptions => ({ ...defaultPdfOptions(p), ...o });

    it("reports no floor", () => {
        expect(pdfIssues(p, opts({ floorIds: [] }), new Set())).toEqual({ noFloor: true, tooLarge: [] });
    });

    it("lists floors too large in floor order", () => {
        const floorIds = [p.floors[1].id, p.floors[2].id, p.floors[0].id];
        expect(pdfIssues(p, opts({ floorIds, scale: 50 }), new Set()).tooLarge).toEqual(["Erdgeschoss", "Obergeschoss"]);
        expect(pdfIssues(p, opts({ floorIds, scale: 50, orientation: "landscape" }), new Set()).tooLarge).toHaveLength(2);
        expect(pdfIssues(p, opts({ floorIds, scale: 100 }), new Set()).tooLarge).toEqual([]);
        expect(pdfIssues(p, opts({ floorIds, scale: "fit" }), new Set()).tooLarge).toEqual([]);
    });

    it("only checks selected floors", () => {
        expect(pdfIssues(p, opts({ floorIds: [p.floors[1].id], scale: 50 }), new Set()).tooLarge).toEqual(["Obergeschoss"]);
    });

    it("counts far furniture only with „Möbel“", () => {
        const q = plan([{ name: "Erdgeschoss", rooms: [room(0, 0, 400, 300)], shapes: [bed(3000, 0)] }]);
        const o = { ...defaultPdfOptions(q) };
        expect(pdfIssues(q, o, new Set()).tooLarge).toEqual(["Erdgeschoss"]);
        expect(pdfIssues(q, { ...o, furniture: false }, new Set()).tooLarge).toEqual([]);
    });

    it("counts the underlay only if its image is there", () => {
        const q = plan([{ name: "Erdgeschoss", rooms: [room(0, 0, 400, 300)], underlay }]);
        const o = { ...defaultPdfOptions(q), underlay: true };
        expect(pdfIssues(q, o, new Set([IMAGE_ID])).tooLarge).toEqual(["Erdgeschoss"]);
        expect(pdfIssues(q, o, new Set()).tooLarge).toEqual([]);
    });
});

describe("file name and date", () => {
    const date = new Date(2026, 10, 12, 9, 30);

    it("builds the file name like the plan export", () => {
        expect(pdfFileName("Umzug", date)).toBe("2026-11-12-umzug-grundriss.pdf");
        expect(pdfFileName("Möbel Größe", date)).toBe("2026-11-12-moebel-groesse-grundriss.pdf");
    });

    it("formats the print date as DD.MM.YYYY", () => {
        expect(formatPrintDate(date)).toBe("12.11.2026");
        expect(formatPrintDate(new Date(2027, 0, 5))).toBe("05.01.2027");
    });
});
