import { describe, expect, it } from "vitest";
import fixtureText from "@/lib/__fixtures__/plan-v1.json?raw";
import fixtureV2Text from "@/lib/__fixtures__/plan-v2.json?raw";
import fixtureV3Text from "@/lib/__fixtures__/plan-v3.json?raw";
import fixtureV5Text from "@/lib/__fixtures__/plan-v5.json?raw";
import fixtureV7Text from "@/lib/__fixtures__/plan-v7.json?raw";
import fixtureV8Text from "@/lib/__fixtures__/plan-v8.json?raw";
import { addFloor, addRoom, addShape, createEmptyPlan, setUnderlay, updateSettings } from "@/lib/plan";
import { buildExportFile, serializeExport } from "@/lib/plan-export";
import {
    analyzePlanFile,
    applyImageCheck,
    COLOR_ISSUE_REASON,
    MAX_IMPORT_BYTES,
    readSettings,
    sanitizeWallThicknesses,
    SETTINGS_ISSUE_REASON,
    WALL_ISSUE_REASON,
    type AnalyzeOptions,
    type ImportAnalysis,
    type ImportSuccess,
} from "@/lib/plan-import";
import { migratePlanData, type PlanMigration } from "@/lib/plan-migration";
import { PLAN_SCHEMA_VERSION, PlanSchema, type Opening, type Shape } from "@/lib/plan-schema";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import {
    CAL_EG,
    CAL_OG,
    LEGACY_FLOORS,
    rect,
    rectPoints,
    room,
    STYLE,
    imageId,
    underlay,
    underlayWithoutImage,
    uuid,
} from "@/test/plan-fixtures";

const NOW = new Date("2026-11-11T18:30:00.000Z");

/** Data URL of a file starting like a PNG (the import does not decode it; `applyImageCheck` does). */
const PNG_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";
const CREATED = "2026-11-01T10:00:00.000Z";

/** Fixed clock and counting ids starting at uuid(1000). */
function options(overrides: Partial<AnalyzeOptions> = {}): AnalyzeOptions {
    let next = 1000;
    return { now: NOW, newId: () => uuid(next++), ...overrides };
}

const analyze = (data: unknown, overrides: Partial<AnalyzeOptions> = {}, fileName = "plan.json") =>
    analyzePlanFile(typeof data === "string" ? data : JSON.stringify(data), fileName, options(overrides));

function expectOk(result: ImportAnalysis): ImportSuccess {
    if (!result.ok) throw new Error(`expected success, got ${result.error}`);
    return result;
}

/** A raw plan file of the current version with eg/og/dg; `shapesByFloor` and other fields can be overridden. */
const file = (overrides: Record<string, unknown> = {}) => ({
    schemaVersion: PLAN_SCHEMA_VERSION,
    name: "Umzug",
    createdAt: CREATED,
    updatedAt: CREATED,
    floors: LEGACY_FLOORS,
    activeFloorId: "eg",
    underlayByFloor: {},
    shapesByFloor: { eg: [], og: [], dg: [] },
    roomsByFloor: { eg: [], og: [], dg: [] },
    ...overrides,
});

const rects = (from: number, count: number) => Array.from({ length: count }, (_, i) => rect(from + i));

describe("analyzePlanFile – errors", () => {
    it("reports text that is no JSON", () => {
        expect(analyze("kaputt", {}, "plan.json")).toEqual({ ok: false, fileName: "plan.json", error: "not-json" });
    });

    it.each([
        ["an object without plan", { name: "x" }],
        ["a package.json", { name: "raum-planer", version: "0.0.0", scripts: { dev: "vite" } }],
        ["schemaVersion 0", file({ schemaVersion: 0 })],
        ["schemaVersion as string", file({ schemaVersion: "1" })],
        ["schemaVersion 1.5", file({ schemaVersion: 1.5 })],
        ["an array", [file()]],
        ["null", null],
        ["shapesByFloor missing", { schemaVersion: 1 }],
        ["shapesByFloor as array", file({ shapesByFloor: [] })],
        ["a floor value that is no array", file({ shapesByFloor: { eg: [], og: {}, dg: [] } })],
        ["an empty floor list", file({ floors: [] })],
        ["floors that are no array", file({ floors: { eg: "Erdgeschoss" } })],
        ["a current-version file without floors", file({ floors: undefined })],
        ["only invalid floors", file({ floors: [{ id: "eg" }, 42] })],
    ])("rejects %s as not-a-plan", (_, data) => {
        expect(analyze(data, {}, "package.json")).toEqual({ ok: false, fileName: "package.json", error: "not-a-plan" });
    });
});

describe("analyzePlanFile – fixture and round trip", () => {
    it("migrates the frozen version-1 fixture: floors eg/og/dg, shapes and calibrations unchanged", () => {
        const fixture = JSON.parse(fixtureText);
        const result = expectOk(analyzePlanFile(fixtureText, "plan-v1.json", options()));
        expect(result.relation).toBe("older");
        expect(result.fileVersion).toBe(1);
        expect(result.plan.floors).toEqual(LEGACY_FLOORS);
        expect(result.floors).toEqual(LEGACY_FLOORS);
        expect(result.plan.shapesByFloor).toEqual(fixture.shapesByFloor);
        expect(result.plan.underlayByFloor).toEqual({
            eg: underlayWithoutImage(fixture.calibrationByFloor.eg),
            og: underlayWithoutImage(fixture.calibrationByFloor.og),
            dg: underlayWithoutImage(),
        });
        expect(result.underlayIssues).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
    });

    it("converts the version-2 fixture: underlays without image for eg/og/dg, no underlay warning", () => {
        const fixture = JSON.parse(fixtureV2Text);
        const result = expectOk(analyzePlanFile(fixtureV2Text, "plan-v2.json", options()));
        expect(result.relation).toBe("older");
        expect(result.underlayIssues).toEqual([]);
        expect(result.plan).toEqual(PlanSchema.parse(migratePlanData(fixture, 2, PLAN_SCHEMA_VERSION)));
        const kellerId = fixture.floors[0].id;
        expect(result.plan.underlayByFloor).not.toHaveProperty(kellerId);
        expect(result.plan.underlayByFloor.eg).toEqual(underlayWithoutImage(fixture.calibrationByFloor.eg));
        expect(result.plan.shapesByFloor).toEqual(fixture.shapesByFloor);
    });

    it("converts the version-3 fixture with the Keller's image: empty room lists, only the version warns", () => {
        const fixture = JSON.parse(fixtureV3Text);
        const kellerImage = fixture.underlayByFloor[fixture.floors[0].id].imageId;
        const text = JSON.stringify({ ...fixture, images: { [kellerImage]: PNG_DATA_URL } });
        const result = expectOk(analyzePlanFile(text, "sicherung.json", options()));
        expect(result.relation).toBe("older");
        expect(result.fileVersion).toBe(3);
        expect(result.plan).toEqual(PlanSchema.parse(migratePlanData(fixture, 3, PLAN_SCHEMA_VERSION)));
        expect(result.plan.shapesByFloor).toEqual(fixture.shapesByFloor);
        expect(Object.values(result.plan.roomsByFloor).every((rooms) => rooms.length === 0)).toBe(true);
        expect(result.invalidRooms).toEqual([]);
        expect(result.underlayIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
    });

    it("the fixtures cover all seven kinds, a label, fill: null, calibrations and an underlay with image", () => {
        const plan = PlanSchema.parse(migratePlanData(JSON.parse(fixtureV3Text), 3, PLAN_SCHEMA_VERSION));
        const shapes = Object.values(plan.shapesByFloor).flat();
        expect(new Set(shapes.map((s) => s.kind)).size).toBe(7);
        expect(shapes.some((s) => s.label)).toBe(true);
        expect(shapes.some((s) => s.style.fill === null)).toBe(true);
        const underlays = Object.values(plan.underlayByFloor);
        expect(underlays.filter((u) => u?.calibration)).toHaveLength(3);
        expect(underlays.filter((u) => u?.imageId)).toHaveLength(1);
    });

    it("an exported plan with „Keller“ before „Erdgeschoss“ and a hidden underlay comes back unchanged", () => {
        const at = new Date(CREATED);
        const keller = uuid(500);
        let plan = createEmptyPlan(at, () => "eg");
        plan = {
            ...plan,
            floors: [{ id: keller, name: "Keller" }, ...plan.floors],
            shapesByFloor: { ...plan.shapesByFloor, [keller]: [] },
            roomsByFloor: { ...plan.roomsByFloor, [keller]: [] },
        };
        plan = addShape(plan, "eg", rect(1, { widthCm: 220, depthCm: 95, cornerRadiusCm: 10 }), at);
        plan = addShape(
            plan,
            keller,
            { ...rect(2), kind: "ellipse", widthCm: 80, depthCm: 80, style: { ...STYLE, fill: null } } as never,
            at,
        );
        plan = setUnderlay(plan, "eg", underlay({ ...CAL_EG, align: "horizontal" }, { visible: false, opacity: 0.4 }), at);
        plan = { ...plan, activeFloorId: keller };
        expect(PlanSchema.safeParse(plan).success).toBe(true);

        const result = expectOk(analyze(serializeExport(buildExportFile(plan, new Map([[imageId(1), PNG_DATA_URL]])))));
        expect(result.hasWarnings).toBe(false);
        expect(result.plan).toEqual(plan);
        expect(result.floors.map((f) => f.name)).toEqual(["Keller", "Erdgeschoss"]);
    });
});

describe("analyzePlanFile – shapes", () => {
    it("counts shapes per floor in floor order", () => {
        const result = expectOk(analyze(file({ shapesByFloor: { dg: [], og: rects(100, 9), eg: rects(1, 14) } })));
        expect(Object.entries(result.countsByFloor)).toEqual([
            ["eg", 14],
            ["og", 9],
            ["dg", 0],
        ]);
        expect(result.plan.shapesByFloor.eg).toHaveLength(14);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists an unknown floor with its shape names and does not take them over", () => {
        const kg = [rect(1, { label: "Regal" }), rect(2, { label: "Waschmaschine" }), rect(3, { label: "Trockner" })];
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [rect(4)], og: [], dg: [], kg } })));
        expect(result.unknownFloors).toEqual([{ floorId: "kg", names: ["Regal", "Waschmaschine", "Trockner"], roomNames: [] }]);
        const ids = Object.values(result.plan.shapesByFloor).flat().map((s) => s.id);
        expect(ids).toEqual([uuid(4)]);
        expect(result.plan.shapesByFloor).not.toHaveProperty("kg");
        expect(result.hasWarnings).toBe(true);
    });

    it("names unknown-floor shapes by kind, or „Form“ for unknown kinds", () => {
        const kg = [rect(1), { kind: "schraege-wand" }, { kind: "ellipse", label: "  " }, 42];
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [], og: [], dg: [], kg } })));
        expect(result.unknownFloors[0].names).toEqual(["Rechteck", "Form", "Ellipse", "Form"]);
    });

    it("lists an invalid shape and keeps the others in order", () => {
        const { widthCm: _, ...carpet } = rect(2, { label: "Teppich" }) as Extract<ReturnType<typeof rect>, { kind: "rect" }>;
        const a = rect(1, { label: "A" });
        const b = rect(3, { label: "B" });
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [], og: [a, carpet, b], dg: [] } })));
        expect(result.invalidShapes).toEqual([{ floorId: "og", name: "Teppich", reason: "Breite fehlt" }]);
        expect(result.plan.shapesByFloor.og.map((s) => s.label)).toEqual(["A", "B"]);
        expect(result.countsByFloor.og).toBe(2);
        expect(result.hasWarnings).toBe(true);
    });

    it("names an unlabeled invalid rectangle „Rechteck“ with the corner radius as reason", () => {
        const shape = rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 50 });
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [shape], og: [], dg: [] } })));
        expect(result.invalidShapes).toEqual([{ floorId: "eg", name: "Rechteck", reason: "Eckradius ungültig" }]);
    });

    it("gives a duplicate id on the same floor a new id", () => {
        const cupboard = rect(1, { label: "Schrank" });
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [cupboard, { ...cupboard }], og: [], dg: [] } })));
        expect(result.reassignedIds).toBe(1);
        expect(result.plan.shapesByFloor.eg.map((s) => s.id)).toEqual([uuid(1), uuid(1000)]);
        expect(result.hasWarnings).toBe(true);
    });

    it("gives a duplicate id across floors a new id on the later floor", () => {
        const result = expectOk(analyze(file({ shapesByFloor: { dg: [rect(1)], eg: [rect(1)], og: [] } })));
        expect(result.reassignedIds).toBe(1);
        expect(result.plan.shapesByFloor.eg[0].id).toBe(uuid(1));
        expect(result.plan.shapesByFloor.dg[0].id).toBe(uuid(1000));
    });

    it("never hands out a new id that occurs later in the file", () => {
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [rect(1), rect(1)], og: [rect(1000)], dg: [] } })));
        const ids = Object.values(result.plan.shapesByFloor).flat().map((s) => s.id);
        expect(new Set(ids).size).toBe(3);
        expect(result.reassignedIds).toBe(1);
    });
});

describe("analyzePlanFile – rooms", () => {
    const roomsOf = (from: number, count: number) =>
        Array.from({ length: count }, (_, i) => room(from + i, `Raum ${from + i}`, rectPoints(400 * i, 0, 300, 200)));

    it("counts 5 + 3 rooms per floor in floor order and takes them over unchanged", () => {
        const eg = roomsOf(1, 5);
        const result = expectOk(analyze(file({ roomsByFloor: { dg: [], og: roomsOf(10, 3), eg } })));
        expect(Object.entries(result.roomCountsByFloor)).toEqual([
            ["eg", 5],
            ["og", 3],
            ["dg", 0],
        ]);
        expect(result.plan.roomsByFloor.eg).toEqual(eg);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists the self-intersecting „Abstellraum“ and keeps the other rooms", () => {
        const loop = room(2, "Abstellraum", [
            { x: 0, y: 0 },
            { x: 300, y: 300 },
            { x: 300, y: 0 },
            { x: 0, y: 300 },
        ]);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [room(1), loop, room(3, "Bad")], og: [], dg: [] } })));
        expect(result.invalidRooms).toEqual([{ floorId: "eg", name: "Abstellraum", reason: "Umriss überschneidet sich" }]);
        expect(result.plan.roomsByFloor.eg.map((r) => r.name)).toEqual(["Wohnen", "Bad"]);
        expect(result.roomCountsByFloor.eg).toBe(2);
        expect(result.hasWarnings).toBe(true);
    });

    it("names a room without name „Raum“", () => {
        const { name: _name, ...nameless } = room(1);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [nameless], og: [], dg: [] } })));
        expect(result.invalidRooms).toEqual([{ floorId: "eg", name: "Raum", reason: "Name fehlt" }]);
    });

    it("lists „Waschküche“ under the unknown floor „kg“ and does not take it over", () => {
        const kg = [room(5, "Waschküche")];
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [], og: [], dg: [], kg } })));
        expect(result.unknownFloors).toEqual([{ floorId: "kg", names: [], roomNames: ["Waschküche"] }]);
        expect(result.plan.roomsByFloor).not.toHaveProperty("kg");
        expect(result.hasWarnings).toBe(true);
    });

    it("lists shapes and rooms of one unknown floor together", () => {
        const result = expectOk(
            analyze(
                file({
                    shapesByFloor: { eg: [], og: [], dg: [], kg: [rect(1, { label: "Regal" })] },
                    roomsByFloor: { eg: [], og: [], dg: [], kg: [room(5, "Waschküche")] },
                }),
            ),
        );
        expect(result.unknownFloors).toEqual([{ floorId: "kg", names: ["Regal"], roomNames: ["Waschküche"] }]);
    });

    it("gives a duplicate room id on another floor a new id and counts it", () => {
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [room(1)], og: [room(1, "Schlafen")], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].id).toBe(uuid(1));
        expect(result.plan.roomsByFloor.og[0]).toEqual({ ...room(1, "Schlafen"), id: uuid(1000) });
        expect(result.reassignedRoomIds).toBe(1);
        expect(result.reassignedIds).toBe(0);
        expect(result.hasWarnings).toBe(true);
    });

    it("gives missing room lists empty ones without warning", () => {
        const withoutRooms = expectOk(analyze(file({ roomsByFloor: undefined })));
        expect(withoutRooms.plan.roomsByFloor).toEqual({ eg: [], og: [], dg: [] });
        expect(withoutRooms.hasWarnings).toBe(false);
        const withoutOg = expectOk(analyze(file({ roomsByFloor: { eg: [room(1)] } })));
        expect(withoutOg.plan.roomsByFloor).toEqual({ eg: [room(1)], og: [], dg: [] });
        expect(withoutOg.hasWarnings).toBe(false);
    });

    it.each([
        ["roomsByFloor as array", file({ roomsByFloor: [] })],
        ["a room list that is no array", file({ roomsByFloor: { eg: {}, og: [], dg: [] } })],
    ])("rejects %s as not-a-plan", (_, data) => {
        expect(analyze(data)).toMatchObject({ ok: false, error: "not-a-plan" });
    });

    it("round-trips exported rooms on the ground floor and in the Keller without warning", () => {
        const at = new Date(CREATED);
        const keller = uuid(500);
        let plan = addFloor(createEmptyPlan(at, () => "eg"), keller, "Keller", at);
        plan = addRoom(plan, "eg", room(1), at);
        plan = addRoom(plan, "eg", room(2, "Diele", rectPoints(349, 0, 150.5, 200)), at);
        plan = addRoom(plan, keller, room(3, "Waschküche", rectPoints(0, 0, 250, 180)), at);
        const result = expectOk(analyze(serializeExport(buildExportFile(plan, new Map()))));
        expect(result.hasWarnings).toBe(false);
        expect(result.plan.roomsByFloor).toEqual(plan.roomsByFloor);
        expect(result.plan).toEqual(plan);
    });
});

describe("analyzePlanFile – openings", () => {
    const door = (n: number, overrides: Partial<Opening> = {}): Opening => ({
        id: uuid(n),
        kind: "door",
        edgeIndex: 0,
        offsetCm: 0,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
        ...overrides,
    });
    const win = (n: number, overrides: Partial<Opening> = {}): Opening => ({
        id: uuid(n),
        kind: "window",
        edgeIndex: 1,
        offsetCm: 0,
        widthCm: 120,
        swing: null,
        beforeFullEdge: null,
        ...overrides,
    });
    const rooms = (byFloor: Record<string, unknown[]>) => file({ roomsByFloor: { eg: [], og: [], dg: [], ...byFloor } });
    const passage = (n: number, overrides: Partial<Opening> = {}): Opening => ({
        id: uuid(n),
        kind: "passage",
        edgeIndex: 2,
        offsetCm: 0,
        widthCm: 100,
        swing: null,
        beforeFullEdge: null,
        ...overrides,
    });

    describe("remembered sizes (Gemerkte Maße aus der Datei)", () => {
        /** „Wohnen“ 500 × 400 cm: edges 0 and 2 are 500 cm long. */
        const wohnen = (openings: unknown[]) => ({ ...room(1, "Wohnen", rectPoints(0, 0, 500, 400)), openings });

        it("keeps valid remembered sizes of a window over the whole edge without notice (Gemerkte Maße beim Fenster)", () => {
            const window = win(2, { edgeIndex: 0, offsetCm: 0, widthCm: 500, beforeFullEdge: { offsetCm: 190, widthCm: 120 } });
            const result = expectOk(analyze(rooms({ eg: [wohnen([window])] })));
            expect(result.plan.roomsByFloor.eg[0].openings).toEqual([window]);
            expect(result.invalidOpenings).toEqual([]);
            expect(result.hasWarnings).toBe(false);
        });

        it("takes a door with remembered sizes over with null, without notice (Gemerkte Maße bei der Tür)", () => {
            const bad = { ...room(3, "Bad", rectPoints(0, 0, 300, 250)), openings: [{ ...door(4), beforeFullEdge: { offsetCm: 100, widthCm: 80 } }] };
            const result = expectOk(analyze(rooms({ eg: [bad] })));
            expect(result.plan.roomsByFloor.eg[0].openings).toEqual([door(4)]);
            expect(result.invalidOpenings).toEqual([]);
            expect(result.hasWarnings).toBe(false);
        });

        it("takes a passage with remembered width -10 cm over with null (Negative gemerkte Breite)", () => {
            const raw = { ...passage(5, { edgeIndex: 0, widthCm: 500 }), beforeFullEdge: { offsetCm: 200, widthCm: -10 } };
            const result = expectOk(analyze(rooms({ eg: [wohnen([raw])] })));
            expect(result.plan.roomsByFloor.eg[0].openings).toEqual([passage(5, { edgeIndex: 0, widthCm: 500 })]);
            expect(result.invalidOpenings).toEqual([]);
            expect(result.hasWarnings).toBe(false);
        });

        it("takes a missing or broken field over as null without notice", () => {
            const { beforeFullEdge: _b, ...withoutField } = passage(6, { edgeIndex: 0, widthCm: 500 });
            const broken = { ...win(7, { edgeIndex: 2, widthCm: 500 }), beforeFullEdge: "schmal" };
            const result = expectOk(analyze(rooms({ eg: [wohnen([withoutField, broken])] })));
            expect(result.plan.roomsByFloor.eg[0].openings).toEqual([
                passage(6, { edgeIndex: 0, widthCm: 500 }),
                win(7, { edgeIndex: 2, widthCm: 500 }),
            ]);
            expect(result.hasWarnings).toBe(false);
        });
    });

    it("lists the window that does not fit on the 180 cm edge of „Bad“ and takes the room over without it", () => {
        const kept = door(1, { edgeIndex: 1 });
        const bad = room(2, "Bad", rectPoints(0, 0, 180, 250), [win(3, { edgeIndex: 0, offsetCm: 100 }), kept]);
        const result = expectOk(analyze(rooms({ og: [bad] })));
        expect(result.invalidOpenings).toEqual([
            { floorId: "og", roomName: "Bad", label: "Fenster", reason: "passt nicht auf die Kante" },
        ]);
        expect(result.plan.roomsByFloor.og).toEqual([{ ...bad, openings: [kept] }]);
        expect(result.openingCounts).toEqual({ doors: 1, windows: 0, passages: 0 });
        expect(result.hasWarnings).toBe(true);
    });

    it("names a door on the eighth edge of a 4-corner room „Kante unbekannt“", () => {
        const flur = room(1, "Flur", rectPoints(0, 0, 150, 400), [door(2, { edgeIndex: 7 })]);
        const result = expectOk(analyze(rooms({ eg: [flur] })));
        expect(result.invalidOpenings).toEqual([{ floorId: "eg", roomName: "Flur", label: "Tür", reason: "Kante unbekannt" }]);
        expect(result.plan.roomsByFloor.eg[0].openings).toEqual([]);
    });

    it("gives a room without openings list an empty list without warning", () => {
        const { openings: _openings, ...withoutList } = room(1);
        const result = expectOk(analyze(rooms({ eg: [withoutList] })));
        expect(result.plan.roomsByFloor.eg).toEqual([room(1)]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists an openings value that is no array once and takes the room over", () => {
        const result = expectOk(analyze(rooms({ eg: [{ ...room(1), openings: { 0: door(2) } }] })));
        expect(result.invalidOpenings).toEqual([
            { floorId: "eg", roomName: "Wohnen", label: "Türen und Fenster", reason: "Angaben ungültig" },
        ]);
        expect(result.plan.roomsByFloor.eg).toEqual([room(1)]);
        expect(result.hasWarnings).toBe(true);
    });

    it("gives a duplicate window id in another room a new id and counts it", () => {
        const wohnen = room(1, "Wohnen", undefined, [win(5)]);
        const bad = room(2, "Bad", rectPoints(400, 0, 200, 250), [win(5)]);
        const result = expectOk(analyze(rooms({ eg: [wohnen], og: [bad] })));
        expect(result.plan.roomsByFloor.eg[0].openings[0].id).toBe(uuid(5));
        expect(result.plan.roomsByFloor.og[0].openings).toEqual([{ ...win(5), id: uuid(1000) }]);
        expect(result.reassignedOpeningIds).toBe(1);
        expect(result.reassignedRoomIds).toBe(0);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.hasWarnings).toBe(true);
    });

    it.each([
        ["without swing", (() => {
            const { swing: _swing, ...rest } = door(2);
            return rest;
        })()],
        ["with swing: null", door(2, { swing: null })],
    ])("names a door %s „Aufschlag fehlt“ and takes „Flur“ over without it", (_, rawDoor) => {
        const flur = { ...room(1, "Flur", rectPoints(0, 0, 150, 400)), openings: [rawDoor] };
        const result = expectOk(analyze(rooms({ eg: [flur] })));
        expect(result.invalidOpenings).toEqual([{ floorId: "eg", roomName: "Flur", label: "Tür", reason: "Aufschlag fehlt" }]);
        expect(result.plan.roomsByFloor.eg[0]).toEqual(room(1, "Flur", rectPoints(0, 0, 150, 400)));
    });

    it("counts 7 doors and 4 windows taken over on all floors", () => {
        const eg = room(1, "Wohnen", undefined, [door(10), door(11), door(12), door(13), win(20), win(21)]);
        const og = room(2, "Schlafen", rectPoints(0, 0, 400, 300), [door(14), door(15), door(16), win(22), win(23)]);
        const result = expectOk(analyze(rooms({ eg: [eg], og: [og] })));
        expect(result.openingCounts).toEqual({ doors: 7, windows: 4, passages: 0 });
        expect(result.hasWarnings).toBe(false);
    });

    it("counts 7 doors, 4 windows and 1 passage taken over (Zählung mit Durchgängen)", () => {
        const eg = room(1, "Wohnen", undefined, [door(10), door(11), door(12), door(13), win(20), win(21), passage(30)]);
        const og = room(2, "Schlafen", rectPoints(0, 0, 400, 300), [door(14), door(15), door(16), win(22), win(23)]);
        const result = expectOk(analyze(rooms({ eg: [eg], og: [og] })));
        expect(result.openingCounts).toEqual({ doors: 7, windows: 4, passages: 1 });
        expect(result.hasWarnings).toBe(false);
    });

    it("names a passage with swing „Aufschlag ungültig“ and takes „Eltern“ over without it", () => {
        const kept = door(2);
        const eltern = room(1, "Eltern", rectPoints(0, 0, 420, 330), [
            kept,
            { ...passage(3), swing: { hinge: "start", side: "inside" } },
        ]);
        const result = expectOk(analyze(rooms({ og: [eltern] })));
        expect(result.invalidOpenings).toEqual([
            { floorId: "og", roomName: "Eltern", label: "Durchgang", reason: "Aufschlag ungültig" },
        ]);
        expect(result.plan.roomsByFloor.og).toEqual([{ ...eltern, openings: [kept] }]);
        expect(result.openingCounts).toEqual({ doors: 1, windows: 0, passages: 0 });
    });

    it("round-trips a passage over a whole edge without warning", () => {
        const at = new Date(CREATED);
        const full = passage(2, { edgeIndex: 0, offsetCm: 0, widthCm: 500 });
        let plan = createEmptyPlan(at, () => "eg");
        plan = addRoom(plan, "eg", room(1, "Wohnen", rectPoints(0, 0, 500, 400), [full, passage(3)]), at);
        const result = expectOk(analyze(serializeExport(buildExportFile(plan, new Map()))));
        expect(result.hasWarnings).toBe(false);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.plan).toEqual(plan);
        expect(result.openingCounts).toEqual({ doors: 0, windows: 0, passages: 2 });
    });

    it("round-trips an exported door (left hinge, opening outwards) and a 120 cm window without warning", () => {
        const at = new Date(CREATED);
        const outwards = door(2, { offsetCm: 160, swing: { hinge: "start", side: "outside" } });
        const window120 = win(3, { edgeIndex: 2, offsetCm: 100 });
        let plan = createEmptyPlan(at, () => "eg");
        plan = addRoom(plan, "eg", room(1, "Wohnen", rectPoints(0, 0, 500, 400), [outwards, window120]), at);
        const result = expectOk(analyze(serializeExport(buildExportFile(plan, new Map()))));
        expect(result.hasWarnings).toBe(false);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.plan.roomsByFloor.eg[0].openings).toEqual([outwards, window120]);
        expect(result.plan).toEqual(plan);
    });

    it("takes over a furniture door (door-swing, 80 cm) unchanged", () => {
        const { cornerRadiusCm: _r, depthCm: _d, ...base } = rect(1) as Extract<Shape, { kind: "rect" }>;
        const furnitureDoor: Shape = { ...base, kind: "door-swing", widthCm: 80 };
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [furnitureDoor], og: [], dg: [] } })));
        expect(result.plan.shapesByFloor.eg).toEqual([furnitureDoor]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists an opening of unknown kind from a newer version-12 file", () => {
        const skylight = { ...win(3), kind: "dachfenster" };
        const wohnen = { ...room(1), openings: [door(2), skylight] };
        const result = expectOk(analyze(file({ schemaVersion: 12, roomsByFloor: { eg: [wohnen], og: [], dg: [] } })));
        expect(result.relation).toBe("newer");
        expect(result.invalidOpenings).toEqual([
            { floorId: "eg", roomName: "Wohnen", label: "Tür oder Fenster", reason: "Art unbekannt" },
        ]);
        expect(result.plan.roomsByFloor.eg[0].openings).toEqual([door(2)]);
        expect(result.plan.schemaVersion).toBe(11);
    });
});

describe("analyzePlanFile – wall thicknesses", () => {
    /** „Flur“ with six edges (L-shape). */
    const L_POINTS = [
        { x: 0, y: 0 },
        { x: 400, y: 0 },
        { x: 400, y: 120 },
        { x: 280, y: 120 },
        { x: 280, y: 300 },
        { x: 0, y: 300 },
    ];

    it("lists „Bad“ upstairs with 250 cm and takes it over with 15 cm at every edge", () => {
        const bad = room(2, "Bad", rectPoints(0, 0, 300, 200), [], [15, 15, 250, 15]);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [room(1)], og: [bad], dg: [] } })));
        expect(WALL_ISSUE_REASON).toBe("Wanddicke ungültig, 15 cm verwendet");
        expect(result.wallIssues).toEqual([{ floorId: "og", roomName: "Bad" }]);
        expect(result.hasWarnings).toBe(true);
        expect(result.plan.roomsByFloor.og).toEqual([{ ...bad, wallThicknessCm: [15, 15, 15, 15] }]);
        expect(result.invalidRooms).toEqual([]);
    });

    it("gives edges 5 and 6 of „Flur“ 15 cm when only four values of 24 cm are given", () => {
        const flur = room(3, "Flur", L_POINTS, [], [24, 24, 24, 24]);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [flur], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([24, 24, 24, 24, 15, 15]);
        expect(result.wallIssues).toEqual([{ floorId: "eg", roomName: "Flur" }]);
    });

    it("drops surplus values and reports the room", () => {
        const wohnen = room(1, "Wohnen", rectPoints(0, 0, 500, 400), [], [36.5, 15, 15, 36.5, 24, 24]);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [wohnen], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([36.5, 15, 15, 36.5]);
        expect(result.wallIssues).toEqual([{ floorId: "eg", roomName: "Wohnen" }]);
    });

    it.each([
        ["a missing list", undefined],
        ["a list that is no array", "dick"],
        ["values that are no numbers", ["15", null, 15, 15]],
        ["0 cm and a negative value", [0, -5, 15, 15]],
    ])("replaces %s by 15 cm and reports the room", (_name, wallThicknessCm) => {
        const raw = { ...room(1), wallThicknessCm };
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [raw], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([15, 15, 15, 15]);
        expect(result.wallIssues).toEqual([{ floorId: "eg", roomName: "Wohnen" }]);
        expect(result.hasWarnings).toBe(true);
    });

    it("keeps 36,5 / 15 / 15 / 36,5 cm on a round trip export → import without warning", () => {
        const wohnen = room(1, "Wohnen", rectPoints(0, 0, 500, 400), [], [36.5, 15, 15, 36.5]);
        const plan = addRoom(createEmptyPlan(NOW, () => "eg"), "eg", wohnen, NOW);
        const text = serializeExport(buildExportFile(plan, new Map()));
        const result = expectOk(analyzePlanFile(text, "export.json", options()));
        expect(result.hasWarnings).toBe(false);
        expect(result.wallIssues).toEqual([]);
        expect(result.plan.roomsByFloor.eg[0].wallThicknessCm).toEqual([36.5, 15, 15, 36.5]);
    });

    it("takes over a version-5 file with 15 cm at every edge and only the version warning", () => {
        const fixture = JSON.parse(fixtureV5Text);
        const result = expectOk(analyzePlanFile(fixtureV5Text, "sicherung.json", options()));
        expect(result.relation).toBe("older");
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        const wohnen = result.plan.roomsByFloor.eg[0];
        expect(wohnen.pointsCm).toEqual(fixture.roomsByFloor.eg[0].pointsCm);
        expect(wohnen.openings).toEqual(fixture.roomsByFloor.eg[0].openings.map((o: object) => ({ ...o, beforeFullEdge: null })));
        expect(wohnen.wallThicknessCm).toEqual([15, 15, 15, 15]);
    });

    it("does not report a room that is not taken over", () => {
        const twoCorners = rectPoints(0, 0, 100, 100).slice(0, 2);
        const loop = { ...room(2, "Abstellraum", twoCorners), wallThicknessCm: [500] };
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [loop], og: [], dg: [] } })));
        expect(result.invalidRooms).toHaveLength(1);
        expect(result.wallIssues).toEqual([]);
    });
});

describe("sanitizeWallThicknesses", () => {
    it("keeps a valid list unchanged", () => {
        expect(sanitizeWallThicknesses([36.5, 11.5, 100, 15], 4)).toEqual({ values: [36.5, 11.5, 100, 15], changed: false });
    });

    it("replaces invalid values, fills missing ones and drops surplus ones", () => {
        expect(sanitizeWallThicknesses([120, 24], 3)).toEqual({ values: [15, 24, 15], changed: true });
        expect(sanitizeWallThicknesses([24, 24, 24, 24], 3)).toEqual({ values: [24, 24, 24], changed: true });
        expect(sanitizeWallThicknesses(undefined, 3)).toEqual({ values: [15, 15, 15], changed: true });
        expect(sanitizeWallThicknesses([Number.NaN, Infinity, 15], 3)).toEqual({ values: [15, 15, 15], changed: true });
    });
});

describe("analyzePlanFile – plan data", () => {
    it("fills in a missing name, invalid timestamps and an unknown active floor", () => {
        const { name: _, ...noName } = file({ createdAt: "gestern", activeFloorId: "kg" });
        const result = expectOk(analyze(noName));
        expect(result.filledMetadata).toEqual(["name", "timestamps", "activeFloor"]);
        expect(result.plan.name).toBe("Meine Planung");
        expect(result.plan.createdAt).toBe(NOW.toISOString());
        expect(result.plan.updatedAt).toBe(NOW.toISOString());
        expect(result.plan.activeFloorId).toBe("eg");
        expect(result.hasWarnings).toBe(true);
    });

    it("treats a blank name as missing", () => {
        expect(expectOk(analyze(file({ name: "   " }))).filledMetadata).toEqual(["name"]);
    });

    it("gives a floor without shape list an empty list without warning", () => {
        const result = expectOk(analyze(file({ shapesByFloor: { eg: [rect(1)], og: [] } })));
        expect(result.plan.shapesByFloor.dg).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("keeps name, timestamps and active floor from the file", () => {
        const result = expectOk(analyze(file({ activeFloorId: "og", updatedAt: "2026-11-05T12:00:00.000Z" })));
        expect(result.plan).toMatchObject({
            name: "Umzug",
            createdAt: CREATED,
            updatedAt: "2026-11-05T12:00:00.000Z",
            activeFloorId: "og",
        });
    });
});

describe("analyzePlanFile – floors", () => {
    it("takes over the file's own floors „Keller“, „Wohnung“ in this order", () => {
        const floors = [
            { id: "kg", name: "Keller" },
            { id: "wo", name: "Wohnung" },
        ];
        const result = expectOk(
            analyze(
                file({
                    floors,
                    activeFloorId: "wo",
                    shapesByFloor: { kg: [rect(1)], wo: [rect(2), rect(3)] },
                    roomsByFloor: { kg: [], wo: [] },
                }),
            ),
        );
        expect(result.plan.floors).toEqual(floors);
        expect(Object.keys(result.plan.shapesByFloor)).toEqual(["kg", "wo"]);
        expect(Object.entries(result.countsByFloor)).toEqual([
            ["kg", 1],
            ["wo", 2],
        ]);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists a duplicate id „og“ as „Spitzboden: Kennung doppelt“; the shapes go to the first", () => {
        const floors = [...LEGACY_FLOORS, { id: "og", name: "Spitzboden" }];
        const result = expectOk(analyze(file({ floors, shapesByFloor: { eg: [], og: [rect(1)], dg: [] } })));
        expect(result.invalidFloors).toEqual([{ label: "Spitzboden", reason: "Kennung doppelt" }]);
        expect(result.plan.floors).toEqual(LEGACY_FLOORS);
        expect(result.plan.shapesByFloor.og.map((s) => s.id)).toEqual([uuid(1)]);
        expect(result.hasWarnings).toBe(true);
    });

    it.each([
        ["no name", { id: "kg" }, "kg", "Name fehlt"],
        ["a blank name", { id: "kg", name: "  " }, "kg", "Name fehlt"],
        ["a name of 41 characters", { id: "kg", name: "x".repeat(41) }, "x".repeat(41), "Name zu lang"],
        ["no id", { name: "Keller" }, "Keller", "Kennung fehlt"],
        ["an empty id", { id: "", name: "Keller" }, "Keller", "Kennung fehlt"],
        ["no object", "Keller", "Etage", "Angaben ungültig"],
        ["an id of 65 characters", { id: "k".repeat(65), name: "Keller" }, "Keller", "Angaben ungültig"],
    ])("lists a floor with %s", (_, entry, label, reason) => {
        const result = expectOk(analyze(file({ floors: [...LEGACY_FLOORS, entry] })));
        expect(result.invalidFloors).toEqual([{ label, reason }]);
        expect(result.plan.floors).toEqual(LEGACY_FLOORS);
        expect(result.hasWarnings).toBe(true);
    });

    it("lists the 9th floor with „Höchstens 8 Etagen“; its shapes count as an unknown floor", () => {
        const floors = Array.from({ length: 9 }, (_, i) => ({ id: `f${i + 1}`, name: `Etage ${i + 1}` }));
        const shapesByFloor = Object.fromEntries(floors.map((f) => [f.id, []]));
        const result = expectOk(
            analyze(
                file({
                    floors,
                    activeFloorId: "f1",
                    shapesByFloor: { ...shapesByFloor, f9: [rect(1, { label: "Kiste" })] },
                    roomsByFloor: undefined,
                }),
            ),
        );
        expect(result.plan.floors).toHaveLength(8);
        expect(result.invalidFloors).toEqual([{ label: "Etage 9", reason: "Höchstens 8 Etagen" }]);
        expect(result.unknownFloors).toEqual([{ floorId: "f9", names: ["Kiste"], roomNames: [] }]);
    });

    it("makes the file's first floor active when the active one is unknown", () => {
        const floors = [
            { id: "kg", name: "Keller" },
            { id: "eg", name: "Erdgeschoss" },
        ];
        const result = expectOk(analyze(file({ floors, activeFloorId: "dg", shapesByFloor: { kg: [], eg: [] } })));
        expect(result.plan.activeFloorId).toBe("kg");
        expect(result.filledMetadata).toEqual(["activeFloor"]);
    });

    it("reports an underlay under „kg“ without such a floor as „Etage unbekannt“", () => {
        const result = expectOk(analyze(file({ underlayByFloor: { kg: underlay(CAL_EG) } })));
        expect(result.underlayIssues).toEqual([{ floorId: "kg", reason: "Etage unbekannt" }]);
        expect(result.plan.underlayByFloor).toEqual({});
    });
});

describe("analyzePlanFile – underlays", () => {
    it("takes over valid underlays with calibration, visibility and opacity", () => {
        const eg = underlay({ ...CAL_EG, align: "horizontal" }, { visible: false, opacity: 0.4 });
        const og = underlayWithoutImage(CAL_OG);
        const result = expectOk(analyze(file({ underlayByFloor: { eg, og }, images: { [imageId(1)]: PNG_DATA_URL } })));
        expect(result.plan.underlayByFloor).toEqual({ eg, og });
        expect(result.underlayIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("takes over an underlay with scale 0 without calibration and names the scale; „kg“ is unknown", () => {
        const result = expectOk(
            analyze(
                file({
                    underlayByFloor: { eg: underlay(CAL_EG), og: underlay({ ...CAL_OG, pxPerCm: 0 }), kg: underlay(CAL_EG) },
                    images: { [imageId(1)]: PNG_DATA_URL },
                }),
            ),
        );
        expect(result.underlayIssues).toEqual([
            { floorId: "og", reason: "Maßstab ungültig – ohne Kalibrierung übernommen" },
            { floorId: "kg", reason: "Etage unbekannt" },
        ]);
        expect(result.plan.underlayByFloor).toEqual({ eg: underlay(CAL_EG), og: underlay() });
        expect(result.hasWarnings).toBe(true);
    });

    it("does not take over an underlay with opacity 3 and names the opacity", () => {
        const result = expectOk(analyze(file({ underlayByFloor: { dg: underlay(CAL_EG, { opacity: 3 }) } })));
        expect(result.underlayIssues).toEqual([{ floorId: "dg", reason: "Deckkraft ungültig" }]);
        expect(result.plan.underlayByFloor).toEqual({});
        expect(result.hasWarnings).toBe(true);
    });

    it("names the opacity, not the calibration, when both are invalid", () => {
        const raw = underlay({ ...CAL_EG, pxPerCm: 0 }, { opacity: 3 });
        const result = expectOk(analyze(file({ underlayByFloor: { dg: raw } })));
        expect(result.underlayIssues).toEqual([{ floorId: "dg", reason: "Deckkraft ungültig" }]);
    });

    it("does not take over an image without size", () => {
        const raw = underlay(null, { imageWidthPx: null, imageHeightPx: null });
        const result = expectOk(analyze(file({ underlayByFloor: { eg: raw } })));
        expect(result.underlayIssues).toEqual([{ floorId: "eg", reason: "Bildbreite ungültig" }]);
        expect(result.plan.underlayByFloor).toEqual({});
    });

    it("has no underlay and no warning when underlayByFloor is missing", () => {
        const { underlayByFloor: _, ...noUnderlays } = file();
        const result = expectOk(analyze(noUnderlays));
        expect(result.plan.underlayByFloor).toEqual({});
        expect(result.underlayIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it.each([[[underlay()]], ["eg"], [null]])("reports underlayByFloor %j as unusable", (value) => {
        const result = expectOk(analyze(file({ underlayByFloor: value })));
        expect(result.underlayIssues).toEqual([{ floorId: null, reason: "Angaben ungültig" }]);
        expect(result.plan.underlayByFloor).toEqual({});
        expect(result.hasWarnings).toBe(true);
    });
});

describe("analyzePlanFile – images", () => {
    const images = { [imageId(1)]: PNG_DATA_URL };

    it("round-trips an exported hidden underlay with image, opacity 0.4 and alignment without warning", () => {
        const at = new Date(CREATED);
        const eg = underlay({ ...CAL_EG, align: "horizontal" }, { visible: false, opacity: 0.4 });
        const plan = setUnderlay(addShape(createEmptyPlan(at, () => "eg"), "eg", rect(1), at), "eg", eg, at);
        const result = expectOk(analyze(serializeExport(buildExportFile(plan, new Map([[imageId(1), PNG_DATA_URL]])))));
        expect(result.hasWarnings).toBe(false);
        expect(result.plan).toEqual(plan);
        expect([...result.pendingImages.keys()]).toEqual([imageId(1)]);
        expect(result.pendingImages.get(imageId(1))?.type).toBe("image/png");
    });

    it("takes over an underlay whose image is missing in the file without image, keeping its calibration", () => {
        const result = expectOk(analyze(file({ underlayByFloor: { og: underlay(CAL_OG) }, images: {} })));
        expect(result.plan.underlayByFloor.og).toEqual(underlay(CAL_OG, { imageId: null }));
        expect(result.underlayIssues).toEqual([{ floorId: "og", reason: "Vorlagenbild fehlt" }]);
        expect(result.pendingImages.size).toBe(0);
        expect(result.hasWarnings).toBe(true);
    });

    it.each([
        ["a text data URL", "data:text/plain;base64,YWJj"],
        ["broken Base64", "data:image/png;base64,YW*j"],
        ["no string", 42],
    ])("reports %s as „Vorlagenbild unlesbar“", (_, value) => {
        const result = expectOk(analyze(file({ underlayByFloor: { eg: underlay() }, images: { [imageId(1)]: value } })));
        expect(result.plan.underlayByFloor.eg?.imageId).toBeNull();
        expect(result.underlayIssues).toEqual([{ floorId: "eg", reason: "Vorlagenbild unlesbar" }]);
    });

    it("reads an image shared by two floors once and skips images no underlay refers to", () => {
        const result = expectOk(
            analyze(
                file({
                    underlayByFloor: { eg: underlay(), dg: underlay() },
                    images: { ...images, [imageId(7)]: PNG_DATA_URL },
                }),
            ),
        );
        expect([...result.pendingImages.keys()]).toEqual([imageId(1)]);
        expect(result.hasWarnings).toBe(false);
    });

    it("has no image warning for a file without underlays or without images key", () => {
        expect(expectOk(analyze(file())).hasWarnings).toBe(false);
        const v2 = expectOk(analyzePlanFile(fixtureV2Text, "plan-v2.json", options()));
        expect(v2.underlayIssues).toEqual([]);
        expect(v2.pendingImages.size).toBe(0);
    });

    it("allows files of 50 MB", () => {
        expect(MAX_IMPORT_BYTES).toBe(50 * 1024 * 1024);
    });
});

describe("applyImageCheck", () => {
    const analysis = () =>
        expectOk(
            analyze(
                file({
                    underlayByFloor: {
                        eg: underlay(CAL_EG, { imageWidthPx: 10, imageHeightPx: 10 }),
                        og: underlay(null, { imageId: imageId(2) }),
                    },
                    images: { [imageId(1)]: PNG_DATA_URL, [imageId(2)]: PNG_DATA_URL },
                }),
            ),
        );

    it("takes the real pixel sizes and keeps a matching id", () => {
        const before = analysis();
        const checked = applyImageCheck(
            before,
            new Map([
                [imageId(1), { ok: true, id: imageId(1), widthPx: 1240, heightPx: 1754 }],
                [imageId(2), { ok: true, id: imageId(2), widthPx: 800, heightPx: 600 }],
            ]),
        );
        expect(checked.plan.underlayByFloor.eg).toEqual(underlay(CAL_EG));
        expect(checked.plan.underlayByFloor.og).toMatchObject({ imageWidthPx: 800, imageHeightPx: 600 });
        expect(checked.hasWarnings).toBe(false);
        expect([...checked.pendingImages.keys()]).toEqual([imageId(1), imageId(2)]);
    });

    it("rewrites an id that does not match the bytes", () => {
        const checked = applyImageCheck(
            analysis(),
            new Map([
                [imageId(1), { ok: true, id: imageId(9), widthPx: 1240, heightPx: 1754 }],
                [imageId(2), { ok: true, id: imageId(2), widthPx: 800, heightPx: 600 }],
            ]),
        );
        expect(checked.plan.underlayByFloor.eg?.imageId).toBe(imageId(9));
        expect(checked.pendingImages.has(imageId(9))).toBe(true);
        expect(checked.pendingImages.has(imageId(1))).toBe(false);
    });

    it("turns an undecodable image into „Vorlagenbild unlesbar“ and recomputes hasWarnings", () => {
        const before = analysis();
        expect(before.hasWarnings).toBe(false);
        const checked = applyImageCheck(
            before,
            new Map<string, { ok: true; id: string; widthPx: number; heightPx: number } | { ok: false }>([
                [imageId(1), { ok: false }],
                [imageId(2), { ok: true, id: imageId(2), widthPx: 800, heightPx: 600 }],
            ]),
        );
        expect(checked.plan.underlayByFloor.eg).toEqual(underlay(CAL_EG, { imageId: null, imageWidthPx: 10, imageHeightPx: 10 }));
        expect(checked.underlayIssues).toEqual([{ floorId: "eg", reason: "Vorlagenbild unlesbar" }]);
        expect(checked.pendingImages.has(imageId(1))).toBe(false);
        expect(checked.hasWarnings).toBe(true);
        expect(PlanSchema.safeParse(checked.plan).success).toBe(true);
    });
});

describe("analyzePlanFile – versions", () => {
    /** Test migration 10 → 11 that keeps a valid plan; it marks the name to prove it ran. */
    const addMarker: PlanMigration = (data) => ({ ...data, name: `${String(data.name)} (umgewandelt)` });

    it("migrates an older file", () => {
        const v10 = file({ schemaVersion: 10 });
        const result = expectOk(analyze(v10, { appVersion: 11, migrations: { 10: addMarker } }, "umzug-entwurf.json"));
        expect(result.relation).toBe("older");
        expect(result.fileVersion).toBe(10);
        expect(result.appVersion).toBe(11);
        expect(result.plan.name).toBe("Umzug (umgewandelt)");
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.hasWarnings).toBe(true);
    });

    it("migrates over two versions one after the other", () => {
        const steps: string[] = [];
        const migrations: Record<number, PlanMigration> = {
            1: (d) => (steps.push("1→2"), { ...d, floors: LEGACY_FLOORS }),
            2: (d) => (steps.push("2→3"), d),
            3: (d) => (steps.push("3→4"), d),
        };
        expectOk(analyze(file({ schemaVersion: 1, floors: undefined }), { appVersion: 4, migrations }));
        expect(steps).toEqual(["1→2", "2→3", "3→4"]);
    });

    it("fails with both versions when the migration is missing", () => {
        expect(analyze(file({ schemaVersion: 1 }), { migrations: {} }, "alt.json")).toEqual({
            ok: false,
            fileName: "alt.json",
            error: "migration-failed",
            fromVersion: 1,
            toVersion: PLAN_SCHEMA_VERSION,
        });
    });

    it("fails when the migration throws or breaks the shape lists", () => {
        const throwing: PlanMigration = () => {
            throw new Error("nope");
        };
        const breaking: PlanMigration = (d) => ({ ...d, shapesByFloor: "weg" });
        const v1 = file({ schemaVersion: 1, floors: undefined });
        expect(analyze(v1, { migrations: { 1: throwing } })).toMatchObject({ error: "migration-failed" });
        expect(analyze(v1, { migrations: { 1: breaking } })).toMatchObject({ error: "migration-failed" });
    });

    it("takes over what a newer file's version understands", () => {
        const slanted = { ...rect(99), kind: "schraege-wand", angleDeg: 30 };
        const eg = [...rects(1, 5).map((s) => ({ ...s, futureField: true })), slanted];
        const result = expectOk(analyze(file({ schemaVersion: 12, shapesByFloor: { eg, og: [], dg: [] } }), {}, "neu.json"));
        expect(result.relation).toBe("newer");
        expect(result.fileVersion).toBe(12);
        expect(result.appVersion).toBe(11);
        expect(result.countsByFloor.eg).toBe(5);
        expect(result.invalidShapes).toEqual([
            { floorId: "eg", name: "Form", reason: "Formtyp „schraege-wand“ unbekannt" },
        ]);
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.plan.shapesByFloor.eg[0]).not.toHaveProperty("futureField");
        expect(result.hasWarnings).toBe(true);
    });
});

describe("analyzePlanFile – room lock (Sperre eines Raums aus der Datei)", () => {
    it("keeps „Wohnen“ locked without notice (Gesperrter Raum in der Datei)", () => {
        const wohnen = room(1, "Wohnen", undefined, [], undefined, null, true);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [wohnen], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg).toEqual([wohnen]);
        expect(result.hasWarnings).toBe(false);
    });

    it("takes over „Bad“ with locked: „ja“ not locked, corners unchanged and without notice (Ungültige Sperrangabe)", () => {
        const bad = { ...room(2, "Bad", rectPoints(0, 0, 300, 200)), locked: "ja" };
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [room(1)], og: [bad], dg: [] } })));
        expect(result.plan.roomsByFloor.og).toEqual([{ ...bad, locked: false }]);
        expect(result.invalidRooms).toEqual([]);
        expect(result.colorIssues).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it.each([
        ["a number", 1],
        ["null", null],
        ["an object", { locked: true }],
    ])("takes over a room with %s as lock not locked", (_name, locked) => {
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [{ ...room(1), locked }], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].locked).toBe(false);
        expect(result.hasWarnings).toBe(false);
    });

    it("takes over a room without lock in a version-11 file not locked, without notice", () => {
        const { locked: _l, ...withoutLock } = room(1);
        const result = expectOk(analyze(file({ schemaVersion: 11, roomsByFloor: { eg: [withoutLock], og: [], dg: [] } })));
        expect(result.relation).toBe("same");
        expect(result.plan.roomsByFloor.eg[0].locked).toBe(false);
        expect(result.invalidRooms).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });
});

describe("analyzePlanFile – room colors (Raumfarbe aus der Datei)", () => {
    it("lists „Bad“ upstairs with the color „blau“ and takes it over without color, corners unchanged", () => {
        const bad = { ...room(2, "Bad", rectPoints(0, 0, 300, 200)), color: "blau" };
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [room(1)], og: [bad], dg: [] } })));
        expect(COLOR_ISSUE_REASON).toBe("Farbe ungültig, Standard verwendet");
        expect(result.colorIssues).toEqual([{ floorId: "og", roomName: "Bad" }]);
        expect(result.hasWarnings).toBe(true);
        expect(result.plan.roomsByFloor.og).toEqual([{ ...bad, color: null }]);
        expect(result.invalidRooms).toEqual([]);
        expect(result.wallIssues).toEqual([]);
    });

    it.each([
        ["#FFF", "#FFF"],
        ["a number", 42],
        ["an object", { r: 1 }],
    ])("replaces %s by „Standard“ and reports the room", (_name, color) => {
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [{ ...room(1), color }], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].color).toBeNull();
        expect(result.colorIssues).toEqual([{ floorId: "eg", roomName: "Wohnen" }]);
    });

    it("takes over a missing color as „Standard“ without entry", () => {
        const { color: _c, ...withoutColor } = room(1);
        const result = expectOk(analyze(file({ roomsByFloor: { eg: [withoutColor], og: [], dg: [] } })));
        expect(result.plan.roomsByFloor.eg[0].color).toBeNull();
        expect(result.colorIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("keeps #BBF7D0 and no color on a round trip export → import without warning (Rundreise mit Farben)", () => {
        const kind1 = room(1, "Kind 1", rectPoints(0, 0, 300, 300), [], undefined, "#BBF7D0");
        const flur = room(2, "Flur", rectPoints(400, 0, 150, 300));
        let plan = addRoom(createEmptyPlan(NOW, () => "eg"), "eg", kind1, NOW);
        plan = addRoom(plan, "eg", flur, NOW);
        const text = serializeExport(buildExportFile(plan, new Map()));
        expect(JSON.parse(text).roomsByFloor.eg.map((r: { color: unknown }) => r.color)).toEqual(["#BBF7D0", null]);
        const result = expectOk(analyzePlanFile(text, "export.json", options()));
        expect(result.hasWarnings).toBe(false);
        expect(result.colorIssues).toEqual([]);
        expect(result.plan.roomsByFloor.eg.map((r) => [r.name, r.color])).toEqual([
            ["Kind 1", "#BBF7D0"],
            ["Flur", null],
        ]);
    });

    it("takes over a version-7 file with rooms without color and only the version warning (Dateien der Version 7)", () => {
        const result = expectOk(analyzePlanFile(fixtureV7Text, "sicherung.json", options()));
        expect(result.relation).toBe("older");
        expect(result.colorIssues).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        const rooms = Object.values(result.plan.roomsByFloor).flat();
        expect(rooms.every((r) => r.color === null)).toBe(true);
        expect(rooms.flatMap((r) => r.openings.map((o) => o.kind))).toContain("passage");
    });
});

describe("analyzePlanFile – settings (Einstellungen aus der Datei)", () => {
    const changed = { ...FACTORY_SETTINGS, defaultWallThicknessCm: 11.5, snapStepCm: 2.5, fineSnapStepCm: 0.5, gridStepCm: 50 };

    it("takes over the settings of the file (Einstellungen werden übernommen)", () => {
        const result = expectOk(analyze(file({ settings: changed })));
        expect(result.plan.settings).toEqual(changed);
        expect(result.settingsIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("lists a grid of 0 cm, uses 100 cm and keeps the other values of the file (Ungültiger Rasterabstand)", () => {
        const result = expectOk(analyze(file({ settings: { ...changed, gridStepCm: 0 } })));
        expect(result.settingsIssues).toEqual([{ key: "gridStepCm", label: "Rasterabstand" }]);
        expect(SETTINGS_ISSUE_REASON).toBe("ungültig, Werkseinstellung verwendet");
        expect(result.hasWarnings).toBe(true);
        expect(result.plan.settings).toEqual({ ...changed, gridStepCm: 100 });
    });

    it("uses the factory settings without a report when the settings are missing in a version-9 file", () => {
        const result = expectOk(analyze(file()));
        expect(result.plan.settings).toEqual(FACTORY_SETTINGS);
        expect(result.settingsIssues).toEqual([]);
        expect(result.hasWarnings).toBe(false);
    });

    it("keeps 11,5 cm walls and a 2,5 cm snap step on a round trip export → import without warning (Einstellungen in der Datei)", () => {
        const plan = updateSettings(createEmptyPlan(NOW, () => "eg"), { defaultWallThicknessCm: 11.5, snapStepCm: 2.5 }, NOW);
        const text = serializeExport(buildExportFile(plan, new Map()));
        expect(JSON.parse(text).settings).toMatchObject({ defaultWallThicknessCm: 11.5, snapStepCm: 2.5 });
        const result = expectOk(analyzePlanFile(text, "export.json", options()));
        expect(result.hasWarnings).toBe(false);
        expect(result.settingsIssues).toEqual([]);
        expect(result.plan.settings).toEqual(plan.settings);
    });

    it("gives a version-8 file the factory settings and keeps its room colors, only the version warns (Dateien der Version 8)", () => {
        const result = expectOk(analyzePlanFile(fixtureV8Text, "sicherung.json", options()));
        expect(result.relation).toBe("older");
        expect(result.settingsIssues).toEqual([]);
        expect(result.colorIssues).toEqual([]);
        expect(result.plan.settings).toEqual(FACTORY_SETTINGS);
        const rooms = Object.values(result.plan.roomsByFloor).flat();
        expect(rooms.map((r) => r.color)).toEqual(["#BBF7D0", "#BFDBFE"]);
    });
});

describe("readSettings", () => {
    it("lists each missing or invalid value in the order of the dialog and keeps the valid ones", () => {
        const { settings, settingsIssues } = readSettings({ wallColor: "grau", doorWidthCm: 88.5, snapStepCm: "5" });
        expect(settingsIssues.map((i) => i.label)).toEqual([
            "Wanddicke neuer Räume",
            "Wandfarbe",
            "Farbe neuer Räume",
            "Rasterabstand",
            "Fangschritt",
            "Feiner Fangschritt (Alt)",
            "Fenster",
            "Durchgang",
        ]);
        expect(settings).toEqual({ ...FACTORY_SETTINGS, doorWidthCm: 88.5 });
    });

    it("lists every value for settings that are no object", () => {
        const { settings, settingsIssues } = readSettings("schnell");
        expect(settingsIssues).toHaveLength(9);
        expect(settings).toEqual(FACTORY_SETTINGS);
    });

    it("sets a fine step above the snap step to its factory value and lists it", () => {
        const { settings, settingsIssues } = readSettings({ ...FACTORY_SETTINGS, snapStepCm: 2.5, fineSnapStepCm: 4 });
        expect(settings).toMatchObject({ snapStepCm: 2.5, fineSnapStepCm: 1 });
        expect(settingsIssues).toEqual([{ key: "fineSnapStepCm", label: "Feiner Fangschritt (Alt)" }]);
    });

    it("sets it to the snap step if that is below the factory fine step", () => {
        const { settings } = readSettings({ ...FACTORY_SETTINGS, snapStepCm: 0.5, fineSnapStepCm: 4 });
        expect(settings).toMatchObject({ snapStepCm: 0.5, fineSnapStepCm: 0.5 });
    });

    it("lists the fine step once when it was invalid already", () => {
        const { settingsIssues } = readSettings({ ...FACTORY_SETTINGS, snapStepCm: 0.5, fineSnapStepCm: -1 });
        expect(settingsIssues).toEqual([{ key: "fineSnapStepCm", label: "Feiner Fangschritt (Alt)" }]);
    });

    it("gives the plan its own settings object", () => {
        expect(readSettings(undefined).settings).not.toBe(FACTORY_SETTINGS);
    });
});
