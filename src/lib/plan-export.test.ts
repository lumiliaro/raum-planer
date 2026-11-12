import { describe, expect, it } from "vitest";
import { edgeFrame } from "@/lib/opening-geometry";
import { toggleFullEdge } from "@/lib/opening-fields";
import { addFloor, addOpening, addRoom, addShape, createEmptyPlan, moveFloor, removeFloor, setUnderlay, updateOpening } from "@/lib/plan";
import { analyzePlanFile } from "@/lib/plan-import";
import {
    buildExportFile,
    exportFileBase,
    exportFileName,
    localDateKey,
    serializeExport,
} from "@/lib/plan-export";
import type { Opening, Plan } from "@/lib/plan-schema";
import { CAL_EG, imageId, legacyPlan, rect, rectPoints, room, underlay, uuid } from "@/test/plan-fixtures";

const NOW = new Date("2026-11-11T10:00:00.000Z");

const PNG_URL = "data:image/png;base64,iVBORw0KGgo=";
const JPEG_URL = "data:image/jpeg;base64,/9j/4AAQ";

/** The export file text of a plan without images. */
const serializePlan = (plan: Plan) => serializeExport(buildExportFile(plan, new Map()));

const planWithShapes = () => {
    let plan = legacyPlan(NOW);
    plan = addShape(plan, "eg", rect(1, { widthCm: 220, depthCm: 95 }), NOW);
    plan = addShape(plan, "og", rect(2, { label: "Bett", widthCm: 180, depthCm: 200 }), NOW);
    return plan;
};

describe("serializeExport", () => {
    it("is indented and ends with a line break", () => {
        const text = serializePlan(legacyPlan(NOW));
        expect(text).toContain('\n  "schemaVersion": 11,\n');
        expect(text.endsWith("}\n")).toBe(true);
    });

    it("parses back to the same plan plus an empty image list", () => {
        const plan = planWithShapes();
        expect(JSON.parse(serializePlan(plan))).toEqual({ ...plan, images: {} });
    });

    it("contains only the plan's keys", () => {
        const parsed = JSON.parse(serializePlan(planWithShapes()));
        expect(Object.keys(parsed).sort()).toEqual([
            "activeFloorId",
            "createdAt",
            "floors",
            "images",
            "name",
            "roomsByFloor",
            "schemaVersion",
            "settings",
            "shapesByFloor",
            "underlayByFloor",
            "updatedAt",
        ]);
        expect(parsed.schemaVersion).toBe(11);
    });

    it("contains the ground floor's room „Wohnen“ with its four corners, and empty room lists", () => {
        const plan = addRoom(planWithShapes(), "eg", room(10), NOW);
        expect(JSON.parse(serializePlan(plan)).roomsByFloor).toEqual({
            eg: [
                {
                    id: uuid(10),
                    name: "Wohnen",
                    pointsCm: [
                        { x: 0, y: 0 },
                        { x: 337.5, y: 0 },
                        { x: 337.5, y: 560 },
                        { x: 0, y: 560 },
                    ],
                    openings: [],
                    wallThicknessCm: [15, 15, 15, 15],
                    color: null,
                    locked: false,
                },
            ],
            og: [],
            dg: [],
        });
    });

    it("contains the floors with id and name in their order", () => {
        let plan = removeFloor(legacyPlan(NOW), "dg", NOW);
        plan = addFloor(plan, uuid(100), "Keller", NOW);
        plan = moveFloor(moveFloor(plan, uuid(100), "up", NOW), uuid(100), "up", NOW);
        expect(JSON.parse(serializePlan(plan)).floors).toEqual([
            { id: uuid(100), name: "Keller" },
            { id: "eg", name: "Erdgeschoss" },
            { id: "og", name: "Obergeschoss" },
        ]);
    });

    it("keeps the shapes with their sizes under their floor", () => {
        const parsed = JSON.parse(serializePlan(planWithShapes()));
        expect(parsed.shapesByFloor.eg).toHaveLength(1);
        expect(parsed.shapesByFloor.eg[0]).toMatchObject({ widthCm: 220, depthCm: 95 });
        expect(parsed.shapesByFloor.og[0]).toMatchObject({ widthCm: 180, depthCm: 200 });
        expect(parsed.shapesByFloor.dg).toEqual([]);
    });

    it("writes an empty shape list for each floor of an empty plan", () => {
        const parsed = JSON.parse(serializePlan(legacyPlan(NOW)));
        expect(parsed.shapesByFloor).toEqual({ eg: [], og: [], dg: [] });
    });

    it("contains the underlay with calibration and alignment of the ground floor only", () => {
        const eg = underlay({ ...CAL_EG, align: "horizontal" });
        const plan = setUnderlay(legacyPlan(NOW), "eg", eg, NOW);
        const parsed = JSON.parse(serializeExport(buildExportFile(plan, new Map([[imageId(1), PNG_URL]]))));
        expect(parsed.underlayByFloor.eg).toEqual(eg);
        expect(parsed.underlayByFloor).not.toHaveProperty("og");
    });
});

describe("buildExportFile", () => {
    const withUnderlays = () => {
        let plan = legacyPlan(NOW);
        plan = setUnderlay(plan, "eg", underlay(CAL_EG), NOW);
        plan = setUnderlay(plan, "og", underlay(null, { visible: false, opacity: 0.4 }), NOW);
        return setUnderlay(plan, "dg", underlay(null, { imageId: imageId(2) }), NOW);
    };
    const images = new Map([
        [imageId(1), PNG_URL],
        [imageId(2), JPEG_URL],
        [imageId(9), PNG_URL],
    ]);

    it("puts images as the last key", () => {
        const text = serializeExport(buildExportFile(withUnderlays(), images));
        expect(Object.keys(JSON.parse(text)).at(-1)).toBe("images");
        expect(text).toContain(`"${imageId(1)}": "${PNG_URL}"`);
    });

    it("contains an image used by two floors once, and no unreferenced image", () => {
        const file = buildExportFile(withUnderlays(), images);
        expect(file.images).toEqual({ [imageId(1)]: PNG_URL, [imageId(2)]: JPEG_URL });
        expect(file.underlayByFloor.eg?.imageId).toBe(imageId(1));
        expect(file.underlayByFloor.og?.imageId).toBe(imageId(1));
    });

    it("exports an underlay whose image is not there with imageId null, sizes and calibration", () => {
        const file = buildExportFile(withUnderlays(), new Map([[imageId(2), JPEG_URL]]));
        expect(file.underlayByFloor.eg).toEqual(underlay(CAL_EG, { imageId: null }));
        expect(file.images).toEqual({ [imageId(2)]: JPEG_URL });
    });

    it("keeps visibility and opacity and leaves the plan untouched", () => {
        const plan = withUnderlays();
        const before = structuredClone(plan);
        const file = buildExportFile(plan, new Map());
        expect(file.underlayByFloor.og).toMatchObject({ visible: false, opacity: 0.4, imageId: null });
        expect(plan).toEqual(before);
    });

    it("contains version 11 and the floors, but no view state", () => {
        const file = buildExportFile(withUnderlays(), images);
        expect(file.schemaVersion).toBe(11);
        expect(file.floors).toEqual(legacyPlan(NOW).floors);
        const text = serializeExport(file);
        for (const key of ["viewports", "scale", "propertiesPanel", "exportCounter", "imageAvailability"]) {
            expect(text).not.toContain(key);
        }
    });
});

describe("exportFileBase", () => {
    it("writes out umlauts and ß and replaces other characters by hyphens", () => {
        expect(exportFileBase("Möbel Größe/Übersicht")).toBe("moebel-groesse-uebersicht");
    });

    it("removes other accents and trims hyphens at the edges", () => {
        expect(exportFileBase("  Café — Entwurf! ")).toBe("cafe-entwurf");
    });

    it.each(["  ", "!!!", ""])("falls back to „raumplaner“ for %j", (name) => {
        expect(exportFileBase(name)).toBe("raumplaner");
    });
});

describe("exportFileName", () => {
    it("builds date, name and version", () => {
        expect(exportFileName("Meine Planung", new Date(2026, 10, 11, 9, 0), 1)).toBe("2026-11-11-meine-planung_1.json");
        expect(exportFileName("Umzug", new Date(2026, 10, 11), 3)).toBe("2026-11-11-umzug_3.json");
    });

    it("simplifies the name", () => {
        expect(exportFileName("Möbel Größe/Übersicht", new Date(2026, 11, 3, 12, 0), 1)).toBe(
            "2026-12-03-moebel-groesse-uebersicht_1.json",
        );
    });

    it.each(["  ", "!!!"])("uses „raumplaner“ for %j", (name) => {
        expect(exportFileName(name, new Date(2026, 10, 11), 1)).toBe("2026-11-11-raumplaner_1.json");
    });

    it("uses the local date shortly before midnight", () => {
        expect(exportFileName("Umzug", new Date(2026, 10, 11, 23, 59, 59), 1)).toBe("2026-11-11-umzug_1.json");
        expect(localDateKey(new Date(2026, 0, 1, 0, 0, 1))).toBe("2026-01-01");
    });
});

describe("room lock in the export file", () => {
    it("keeps locked: true on a round trip export → import without warning", () => {
        const wohnen = room(1, "Wohnen", undefined, [], undefined, null, true);
        const flur = room(2, "Flur", rectPoints(400, 0, 150, 300));
        let plan = addRoom(createEmptyPlan(NOW, () => "eg"), "eg", wohnen, NOW);
        plan = addRoom(plan, "eg", flur, NOW);
        const text = serializePlan(plan);
        expect(JSON.parse(text).roomsByFloor.eg.map((r: { locked: unknown }) => r.locked)).toEqual([true, false]);
        const result = analyzePlanFile(text, "export.json", { now: NOW, newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.hasWarnings).toBe(false);
        expect(result.plan.roomsByFloor.eg.map((r) => [r.name, r.locked])).toEqual([
            ["Wohnen", true],
            ["Flur", false],
        ]);
    });
});

describe("remembered sizes in the export file (Gemerkte Maße in der Exportdatei)", () => {
    const NOW = new Date("2026-11-12T10:00:00.000Z");
    const kueche = room(1, "Küche", rectPoints(0, 0, 500, 300));
    const wohnenRoom = room(2, "Wohnen", rectPoints(600, 0, 400, 300));
    const passage: Opening = { id: uuid(3), kind: "passage", edgeIndex: 0, offsetCm: 200, widthCm: 100, swing: null, beforeFullEdge: null };
    const window: Opening = { id: uuid(4), kind: "window", edgeIndex: 0, offsetCm: 140, widthCm: 120, swing: null, beforeFullEdge: null };
    const opening = (plan: Plan, roomIndex: number) => plan.roomsByFloor.eg[roomIndex].openings[0];
    const toggle = (plan: Plan, roomIndex: number, checked: boolean) => {
        const r = plan.roomsByFloor.eg[roomIndex];
        const patch = toggleFullEdge(edgeFrame(r.pointsCm, 0), r.openings[0], checked, plan.settings);
        if (!patch) throw new Error("nothing to toggle");
        return updateOpening(plan, "eg", r.openings[0].id, patch, NOW);
    };

    it("keeps them over export and import without warning (Rundreise mit gemerkten Maßen)", () => {
        let plan = createEmptyPlan(NOW, () => "eg");
        plan = addOpening(addRoom(plan, "eg", kueche, NOW), "eg", kueche.id, passage, NOW);
        plan = addOpening(addRoom(plan, "eg", wohnenRoom, NOW), "eg", wohnenRoom.id, window, NOW);
        plan = toggle(toggle(plan, 0, true), 1, true);
        expect(opening(plan, 0)).toMatchObject({ widthCm: 500, offsetCm: 0, beforeFullEdge: { offsetCm: 200, widthCm: 100 } });
        expect(opening(plan, 1)).toMatchObject({ widthCm: 400, offsetCm: 0, beforeFullEdge: { offsetCm: 140, widthCm: 120 } });

        const text = serializeExport(buildExportFile(plan, new Map()));
        expect(JSON.parse(text).roomsByFloor.eg[0].openings[0].beforeFullEdge).toEqual({ offsetCm: 200, widthCm: 100 });
        const result = analyzePlanFile(text, "export.json", { now: NOW, newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.hasWarnings).toBe(false);
        expect(result.plan.roomsByFloor).toEqual(plan.roomsByFloor);

        const back = toggle(toggle(result.plan, 0, false), 1, false);
        expect(opening(back, 0)).toEqual(passage);
        expect(opening(back, 1)).toEqual(window);
    });
});
