import { describe, expect, it } from "vitest";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { FloorSchema, MAX_FLOORS, OpeningSchema, PlanSchema, RoomSchema, ShapeSchema, UnderlaySchema } from "@/lib/plan-schema";
import { CAL_EG, STYLE, underlay, underlayWithoutImage, uuid } from "@/test/plan-fixtures";

const base = { id: uuid(1), x: 250, y: 120, rotationDeg: 0, mirrored: false, style: STYLE };

const VALID = {
    rect: { ...base, kind: "rect", widthCm: 220, depthCm: 95, cornerRadiusCm: 10 },
    ellipse: { ...base, kind: "ellipse", widthCm: 120, depthCm: 80 },
    "l-shape": { ...base, kind: "l-shape", widthCm: 280, depthCm: 200, legAWidthCm: 90, legBWidthCm: 90 },
    "u-shape": { ...base, kind: "u-shape", widthCm: 300, depthCm: 250, baseWidthCm: 60, sideWidthCm: 60 },
    corner: { ...base, kind: "corner", widthCm: 90, depthCm: 90 },
    "door-swing": { ...base, kind: "door-swing", widthCm: 88.5 },
    polygon: {
        ...base,
        kind: "polygon",
        pointsCm: [
            { x: -50, y: -40 },
            { x: 50, y: -40 },
            { x: 0, y: 40 },
        ],
    },
};

const valid = (shape: unknown) => ShapeSchema.safeParse(shape).success;

const emptyPlan = {
    schemaVersion: 11,
    name: "Meine Planung",
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    floors: [
        { id: "eg", name: "Erdgeschoss" },
        { id: "og", name: "Obergeschoss" },
        { id: "dg", name: "Dachgeschoss" },
    ],
    activeFloorId: "eg",
    underlayByFloor: {},
    shapesByFloor: { eg: [], og: [], dg: [] },
    roomsByFloor: { eg: [], og: [], dg: [] },
    settings: { ...FACTORY_SETTINGS },
};

describe("ShapeSchema", () => {
    it.each(Object.entries(VALID))("accepts a valid %s", (_, shape) => {
        expect(valid(shape)).toBe(true);
    });

    it("accepts a shape with optional label and lock", () => {
        expect(valid({ ...VALID.rect, label: "Sofa", locked: true })).toBe(true);
    });

    it("accepts fill: null (outline only)", () => {
        expect(
            valid({ ...VALID.rect, rotationDeg: 90, style: { fill: null, stroke: "#18181B", strokeWidth: 1, opacity: 1 } }),
        ).toBe(true);
    });

    it("rejects a width of 0 cm", () => {
        expect(valid({ ...VALID.ellipse, widthCm: 0, depthCm: 80 })).toBe(false);
    });

    it("rejects a corner radius above half of the shorter side", () => {
        const r = (cornerRadiusCm: number) => ({ ...VALID.rect, widthCm: 200, depthCm: 90, cornerRadiusCm });
        expect(valid(r(50))).toBe(false);
        expect(valid(r(45))).toBe(true);
        expect(valid(r(0))).toBe(true);
        expect(valid(r(-1))).toBe(false);
    });

    it("reports a too-large corner radius at the cornerRadiusCm path", () => {
        const result = ShapeSchema.safeParse({ ...VALID.rect, widthCm: 200, depthCm: 90, cornerRadiusCm: 50 });
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].path).toEqual(["cornerRadiusCm"]);
    });

    it("reports the plausibility rules of L- and U-shapes at the affected field", () => {
        const path = (shape: unknown) => ShapeSchema.safeParse(shape).error?.issues[0].path;
        expect(path({ ...VALID["l-shape"], legAWidthCm: 200 })).toEqual(["legAWidthCm"]);
        expect(path({ ...VALID["l-shape"], legBWidthCm: 280 })).toEqual(["legBWidthCm"]);
        expect(path({ ...VALID["u-shape"], baseWidthCm: 250 })).toEqual(["baseWidthCm"]);
        expect(path({ ...VALID["u-shape"], sideWidthCm: 150 })).toEqual(["sideWidthCm"]);
    });

    it("rejects an L-shape whose leg A is not thinner than the depth", () => {
        expect(valid({ ...VALID["l-shape"], legAWidthCm: 200 })).toBe(false);
        expect(valid({ ...VALID["l-shape"], legBWidthCm: 280 })).toBe(false);
    });

    it("rejects a U-shape whose sides together are not narrower than the width", () => {
        expect(valid({ ...VALID["u-shape"], widthCm: 300, sideWidthCm: 150 })).toBe(false);
        expect(valid({ ...VALID["u-shape"], baseWidthCm: 250 })).toBe(false);
    });

    it("rejects a polygon with 2 points", () => {
        expect(
            valid({
                ...VALID.polygon,
                pointsCm: [
                    { x: 0, y: 0 },
                    { x: 100, y: 0 },
                ],
            }),
        ).toBe(false);
    });

    it("rejects an unknown kind", () => {
        expect(valid({ ...VALID.rect, kind: "dreieck" })).toBe(false);
    });

    it("rejects a rotation of 360°", () => {
        expect(valid({ ...VALID.rect, rotationDeg: 360 })).toBe(false);
        expect(valid({ ...VALID.rect, rotationDeg: 359.9 })).toBe(true);
    });

    it("rejects an opacity of 1.5", () => {
        expect(valid({ ...VALID.rect, style: { ...STYLE, opacity: 1.5 } })).toBe(false);
    });

    it("rejects the colour 'blau'", () => {
        expect(valid({ ...VALID.rect, style: { ...STYLE, fill: "blau" } })).toBe(false);
        expect(valid({ ...VALID.rect, style: { ...STYLE, stroke: "blau" } })).toBe(false);
    });

    it("rejects a stroke width of 0", () => {
        expect(valid({ ...VALID.rect, style: { ...STYLE, strokeWidth: 0 } })).toBe(false);
    });

    it("rejects Infinity as position", () => {
        expect(valid({ ...VALID.rect, x: Infinity })).toBe(false);
        expect(valid({ ...VALID.rect, y: Number.NaN })).toBe(false);
    });

    it("strips unknown extra fields", () => {
        const parsed = ShapeSchema.parse({ ...VALID.rect, zIndex: 3, style: { ...STYLE, shadow: true } });
        expect(parsed).not.toHaveProperty("zIndex");
        expect(parsed.style).not.toHaveProperty("shadow");
        expect(parsed).toEqual(VALID.rect);
    });
});

describe("PlanSchema", () => {
    const validPlan = (plan: unknown) => PlanSchema.safeParse(plan).success;

    it("accepts an empty plan without calibration", () => {
        expect(validPlan(emptyPlan)).toBe(true);
    });

    it("accepts shapes on several floors", () => {
        expect(
            validPlan({
                ...emptyPlan,
                shapesByFloor: { eg: [VALID.rect, { ...VALID.ellipse, id: uuid(2) }], og: [{ ...VALID.corner, id: uuid(3) }], dg: [] },
            }),
        ).toBe(true);
    });

    it("rejects shapes under 'keller' without such a floor", () => {
        expect(validPlan({ ...emptyPlan, shapesByFloor: { ...emptyPlan.shapesByFloor, keller: [] } })).toBe(false);
    });

    it("rejects a floor without shape list", () => {
        expect(validPlan({ ...emptyPlan, shapesByFloor: { eg: [], og: [] } })).toBe(false);
    });

    it("rejects schemaVersion 10 and 12", () => {
        expect(validPlan({ ...emptyPlan, schemaVersion: 10 })).toBe(false);
        expect(validPlan({ ...emptyPlan, schemaVersion: 12 })).toBe(false);
    });

    it("accepts a calibrated underlay on the ground floor and an uncalibrated one upstairs", () => {
        expect(validPlan({ ...emptyPlan, underlayByFloor: { eg: underlay(CAL_EG), og: underlay() } })).toBe(true);
    });

    it("rejects an underlay under 'keller' without such a floor", () => {
        expect(validPlan({ ...emptyPlan, underlayByFloor: { keller: underlay(CAL_EG) } })).toBe(false);
    });

    it("rejects an underlay whose calibration has pxPerCm 0", () => {
        expect(validPlan({ ...emptyPlan, underlayByFloor: { eg: underlay({ ...CAL_EG, pxPerCm: 0 }) } })).toBe(false);
    });

    it("no longer knows calibrationByFloor", () => {
        const parsed = PlanSchema.parse({ ...emptyPlan, calibrationByFloor: { eg: CAL_EG } });
        expect(parsed).not.toHaveProperty("calibrationByFloor");
    });

    it("rejects an invalid active floor or timestamp", () => {
        expect(validPlan({ ...emptyPlan, activeFloorId: "keller" })).toBe(false);
        expect(validPlan({ ...emptyPlan, updatedAt: "gestern" })).toBe(false);
        expect(validPlan({ ...emptyPlan, name: "" })).toBe(false);
    });

    it("rejects a duplicate shape id on two floors", () => {
        expect(validPlan({ ...emptyPlan, shapesByFloor: { eg: [VALID.rect], og: [VALID.rect], dg: [] } })).toBe(false);
        expect(validPlan({ ...emptyPlan, shapesByFloor: { eg: [VALID.rect, VALID.rect], og: [], dg: [] } })).toBe(false);
    });

    it("strips unknown extra fields", () => {
        const parsed = PlanSchema.parse({ ...emptyPlan, ui: { propertiesPanelOpen: false } });
        expect(parsed).not.toHaveProperty("ui");
        expect(parsed).toEqual(emptyPlan);
    });
});

describe("UnderlaySchema", () => {
    const valid = (value: unknown) => UnderlaySchema.safeParse(value).success;

    it("accepts an underlay without image, with unknown size and a calibration", () => {
        expect(valid(underlayWithoutImage({ ...CAL_EG, pxPerCm: 0.9986 }))).toBe(true);
    });

    it("accepts an uncalibrated, hidden underlay with image", () => {
        expect(valid(underlay(null, { visible: false, opacity: 0.4 }))).toBe(true);
    });

    it("rejects an opacity of 0.05 and accepts 0.1 and 1", () => {
        expect(valid(underlay(null, { opacity: 0.05 }))).toBe(false);
        expect(valid(underlay(null, { opacity: 0.1 }))).toBe(true);
        expect(valid(underlay(null, { opacity: 1 }))).toBe(true);
        expect(valid(underlay(null, { opacity: 1.1 }))).toBe(false);
    });

    it("rejects an image without size", () => {
        expect(valid(underlay(null, { imageWidthPx: null, imageHeightPx: null }))).toBe(false);
    });

    it("rejects only one of width and height", () => {
        expect(valid(underlay(null, { imageHeightPx: null }))).toBe(false);
        expect(valid(underlay(null, { imageId: null, imageWidthPx: null }))).toBe(false);
    });

    it("accepts a known size without image (image missing after a reload)", () => {
        expect(valid(underlay(null, { imageId: null }))).toBe(true);
    });

    it("rejects an id that is no SHA-256 hex", () => {
        expect(valid(underlay(null, { imageId: "eg.png" }))).toBe(false);
        expect(valid(underlay(null, { imageId: "A".repeat(64) }))).toBe(false);
        expect(valid(underlay(null, { imageId: "a".repeat(63) }))).toBe(false);
    });

    it("rejects a size of 0 or fractional pixels", () => {
        expect(valid(underlay(null, { imageWidthPx: 0 }))).toBe(false);
        expect(valid(underlay(null, { imageHeightPx: 12.5 }))).toBe(false);
    });
});

describe("floors", () => {
    const validPlan = (plan: unknown) => PlanSchema.safeParse(plan).success;
    const KELLER_ID = uuid(100);
    const withFloors = (floors: { id: string; name: string }[]) => ({
        ...emptyPlan,
        floors,
        activeFloorId: floors[0]?.id ?? "eg",
        shapesByFloor: Object.fromEntries(floors.map((f) => [f.id, []])),
        roomsByFloor: Object.fromEntries(floors.map((f) => [f.id, []])),
    });

    it("accepts „Keller“, „Erdgeschoss“, „Dachgeschoss“ in this order", () => {
        const floors = [
            { id: KELLER_ID, name: "Keller" },
            { id: "eg", name: "Erdgeschoss" },
            { id: "dg", name: "Dachgeschoss" },
        ];
        const parsed = PlanSchema.parse(withFloors(floors));
        expect(parsed.floors).toEqual(floors);
    });

    it("rejects a plan without floor and one with 9 floors", () => {
        expect(validPlan({ ...emptyPlan, floors: [], shapesByFloor: {}, roomsByFloor: {} })).toBe(false);
        const nine = Array.from({ length: MAX_FLOORS + 1 }, (_, i) => ({ id: `f${i}`, name: `Etage ${i}` }));
        expect(validPlan(withFloors(nine))).toBe(false);
        expect(validPlan(withFloors(nine.slice(0, MAX_FLOORS)))).toBe(true);
    });

    it("rejects a name of only spaces and one with 41 characters", () => {
        expect(validPlan(withFloors([{ id: "eg", name: "   " }]))).toBe(false);
        expect(validPlan(withFloors([{ id: "eg", name: "x".repeat(41) }]))).toBe(false);
        expect(validPlan(withFloors([{ id: "eg", name: "x".repeat(40) }]))).toBe(true);
    });

    it("trims the name", () => {
        expect(FloorSchema.parse({ id: "eg", name: "  Keller " }).name).toBe("Keller");
        expect(PlanSchema.parse(withFloors([{ id: "eg", name: "  Keller " }])).floors[0].name).toBe("Keller");
    });

    it("rejects a duplicate floor id", () => {
        const plan = withFloors([{ id: "og", name: "Obergeschoss" }]);
        expect(validPlan({ ...plan, floors: [...plan.floors, { id: "og", name: "Spitzboden" }] })).toBe(false);
    });

    it("rejects an active floor not in the list", () => {
        expect(validPlan({ ...withFloors([{ id: "eg", name: "Erdgeschoss" }]), activeFloorId: "og" })).toBe(false);
    });

    it("rejects an empty floor id", () => {
        expect(validPlan(withFloors([{ id: "", name: "Erdgeschoss" }]))).toBe(false);
    });
});

const pts = (...coords: [number, number][]) => coords.map(([x, y]) => ({ x, y }));

const WOHNEN = {
    id: uuid(10),
    name: "Wohnen",
    pointsCm: pts([0, 0], [337.5, 0], [337.5, 560], [0, 560]),
    openings: [],
    wallThicknessCm: [15, 15, 15, 15],
    color: null,
    locked: false,
};

describe("RoomSchema (Gültiger Raum)", () => {
    const valid = (room: unknown) => RoomSchema.safeParse(room).success;

    it("accepts „Wohnen“ with (0, 0), (337,5, 0), (337,5, 560), (0, 560)", () => {
        expect(valid(WOHNEN)).toBe(true);
    });

    it("rejects two corners", () => {
        expect(valid({ ...WOHNEN, pointsCm: pts([0, 0], [300, 0]) })).toBe(false);
    });

    it("rejects a self-intersecting outline", () => {
        expect(valid({ ...WOHNEN, pointsCm: pts([0, 0], [300, 300], [300, 0], [0, 300]) })).toBe(false);
    });

    it("rejects a doubled corner (edge of 0 cm)", () => {
        expect(valid({ ...WOHNEN, pointsCm: pts([0, 0], [300, 0], [300, 0], [300, 200]) })).toBe(false);
    });

    it("trims the name and accepts 1 to 40 characters", () => {
        expect(RoomSchema.parse({ ...WOHNEN, name: "  Küche " }).name).toBe("Küche");
        expect(valid({ ...WOHNEN, name: "   " })).toBe(false);
        expect(valid({ ...WOHNEN, name: "x".repeat(40) })).toBe(true);
        expect(valid({ ...WOHNEN, name: "x".repeat(41) })).toBe(false);
    });

    it("rejects an id that is no UUID and a point that is no number", () => {
        expect(valid({ ...WOHNEN, id: "wohnen" })).toBe(false);
        expect(valid({ ...WOHNEN, pointsCm: [{ x: "0", y: 0 }, ...WOHNEN.pointsCm.slice(1)] })).toBe(false);
    });
});

describe("PlanSchema rooms (Räume im Plan)", () => {
    const validPlan = (plan: unknown) => PlanSchema.safeParse(plan).success;
    const DIELE = {
        id: uuid(11),
        name: "Diele",
        pointsCm: pts([349, 0], [500, 0], [500, 200], [349, 200]),
        openings: [],
        wallThicknessCm: [15, 15, 15, 15],
        color: null,
        locked: false,
    };

    it("keeps two ground-floor rooms and an empty list upstairs", () => {
        const plan = PlanSchema.parse({ ...emptyPlan, roomsByFloor: { eg: [WOHNEN, DIELE], og: [], dg: [] } });
        expect(plan.roomsByFloor.og).toEqual([]);
        expect(plan.roomsByFloor.eg).toEqual([WOHNEN, DIELE]);
    });

    it("rejects a room under „keller“ without such a floor", () => {
        expect(validPlan({ ...emptyPlan, roomsByFloor: { ...emptyPlan.roomsByFloor, keller: [WOHNEN] } })).toBe(false);
    });

    it("rejects a floor without room list and a plan without roomsByFloor", () => {
        expect(validPlan({ ...emptyPlan, roomsByFloor: { eg: [], og: [] } })).toBe(false);
        const { roomsByFloor: _rooms, ...withoutRooms } = emptyPlan;
        expect(validPlan(withoutRooms)).toBe(false);
    });

    it("rejects the same room id on the ground floor and upstairs", () => {
        expect(validPlan({ ...emptyPlan, roomsByFloor: { eg: [WOHNEN], og: [{ ...DIELE, id: WOHNEN.id }], dg: [] } })).toBe(
            false,
        );
    });

    it("rejects an invalid room", () => {
        expect(validPlan({ ...emptyPlan, roomsByFloor: { eg: [{ ...WOHNEN, pointsCm: WOHNEN.pointsCm.slice(0, 2) }], og: [], dg: [] } })).toBe(
            false,
        );
    });
});

/** Room 500 × 400 cm; edge 0 (top) is 500 cm long. */
const RAUM = {
    id: uuid(20),
    name: "Wohnen",
    pointsCm: pts([0, 0], [500, 0], [500, 400], [0, 400]),
    openings: [],
    wallThicknessCm: [15, 15, 15, 15],
    color: null,
    locked: false,
};
const DOOR = {
    id: uuid(30),
    kind: "door",
    edgeIndex: 0,
    offsetCm: 160,
    widthCm: 80,
    swing: { hinge: "start", side: "inside" },
    beforeFullEdge: null,
};
const WINDOW = { id: uuid(31), kind: "window", edgeIndex: 0, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
const PASSAGE = { id: uuid(33), kind: "passage", edgeIndex: 0, offsetCm: 0, widthCm: 500, swing: null, beforeFullEdge: null };

describe("RoomSchema openings (Gültige Öffnung)", () => {
    const withOpening = (opening: unknown) => RoomSchema.safeParse({ ...RAUM, openings: [opening] }).success;

    it("accepts a room without openings", () => {
        expect(RoomSchema.safeParse(RAUM).success).toBe(true);
    });

    it("rejects a room without openings field", () => {
        const { openings: _openings, ...withoutOpenings } = RAUM;
        expect(RoomSchema.safeParse(withoutOpenings).success).toBe(false);
    });

    it("accepts a door of 80 cm at 160 cm on a 500 cm edge", () => {
        expect(withOpening(DOOR)).toBe(true);
    });

    it("accepts an opening ending exactly at the corner", () => {
        expect(withOpening({ ...WINDOW, offsetCm: 380 })).toBe(true);
    });

    it("rejects a window of 120 cm at 400 cm on a 500 cm edge", () => {
        expect(withOpening({ ...WINDOW, offsetCm: 400 })).toBe(false);
    });

    it("rejects the fifth edge of a room with 4 corners", () => {
        expect(withOpening({ ...DOOR, edgeIndex: 4 })).toBe(false);
        expect(withOpening({ ...DOOR, edgeIndex: 3 })).toBe(true);
    });

    it("rejects a window with swing", () => {
        expect(withOpening({ ...WINDOW, swing: { hinge: "start", side: "inside" } })).toBe(false);
    });

    it("rejects a door without swing", () => {
        expect(withOpening({ ...DOOR, swing: null })).toBe(false);
        const { swing: _swing, ...withoutSwing } = DOOR;
        expect(withOpening(withoutSwing)).toBe(false);
    });

    it("accepts a passage of 500 cm at 0 cm over a whole 500 cm edge", () => {
        expect(withOpening(PASSAGE)).toBe(true);
    });

    it("rejects a passage with swing", () => {
        expect(withOpening({ ...PASSAGE, swing: { hinge: "start", side: "inside" } })).toBe(false);
    });

    it("rejects the unknown kind „bogen“", () => {
        expect(withOpening({ ...PASSAGE, kind: "bogen" })).toBe(false);
    });

    it("rejects a width of 0 cm, a negative offset, an unknown kind and an invalid swing", () => {
        expect(withOpening({ ...DOOR, widthCm: 0 })).toBe(false);
        expect(withOpening({ ...DOOR, offsetCm: -1 })).toBe(false);
        expect(withOpening({ ...WINDOW, kind: "skylight" })).toBe(false);
        expect(withOpening({ ...DOOR, swing: { hinge: "left", side: "inside" } })).toBe(false);
    });

    it("checks a single opening without room context", () => {
        expect(OpeningSchema.safeParse({ ...DOOR, edgeIndex: 99 }).success).toBe(true);
        expect(OpeningSchema.safeParse({ ...DOOR, edgeIndex: 1.5 }).success).toBe(false);
    });
});

describe("OpeningSchema beforeFullEdge (Gemerkte Maße für Ganze Kante im Plan)", () => {
    const withOpening = (opening: unknown) => RoomSchema.safeParse({ ...RAUM, openings: [opening] }).success;

    it("accepts a passage without remembered sizes", () => {
        expect(withOpening(PASSAGE)).toBe(true);
    });

    it("accepts a passage over the whole edge with remembered sizes 100/200 (Durchgang mit gemerkten Maßen)", () => {
        expect(withOpening({ ...PASSAGE, beforeFullEdge: { offsetCm: 200, widthCm: 100 } })).toBe(true);
    });

    it("accepts a window with remembered sizes 120/190 (Fenster mit gemerkten Maßen)", () => {
        const window = { ...WINDOW, offsetCm: 0, widthCm: 500, beforeFullEdge: { offsetCm: 190, widthCm: 120 } };
        expect(withOpening(window)).toBe(true);
    });

    it("does not check whether the remembered sizes fit on the edge", () => {
        const kurz = { ...RAUM, pointsCm: pts([0, 0], [150, 0], [150, 400], [0, 400]) };
        const passage = { ...PASSAGE, widthCm: 150, beforeFullEdge: { offsetCm: 200, widthCm: 100 } };
        expect(RoomSchema.safeParse({ ...kurz, openings: [passage] }).success).toBe(true);
    });

    it("rejects a door with remembered sizes (Tür mit gemerkten Maßen)", () => {
        expect(withOpening({ ...DOOR, beforeFullEdge: { offsetCm: 100, widthCm: 80 } })).toBe(false);
    });

    it("rejects a remembered width of 0 cm and a remembered offset of -1 cm", () => {
        expect(withOpening({ ...PASSAGE, beforeFullEdge: { offsetCm: 200, widthCm: 0 } })).toBe(false);
        expect(withOpening({ ...PASSAGE, beforeFullEdge: { offsetCm: -1, widthCm: 100 } })).toBe(false);
    });

    it("rejects an opening without the field", () => {
        const { beforeFullEdge: _b, ...without } = PASSAGE;
        expect(withOpening(without)).toBe(false);
    });

    it("accepts a plan with a door and a passage without remembered sizes (Öffnung ohne gemerkte Maße)", () => {
        const room = { ...RAUM, openings: [DOOR, { ...PASSAGE, edgeIndex: 1, widthCm: 400 }] };
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [room], og: [], dg: [] } }).success).toBe(true);
    });
});

describe("PlanSchema openings (Türen und Fenster im Plan)", () => {
    const FLUR = { ...RAUM, id: uuid(21), name: "Flur" };
    const BAD = { ...RAUM, id: uuid(22), name: "Bad" };

    it("accepts „Flur“ with an empty list of openings", () => {
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [FLUR], og: [], dg: [] } }).success).toBe(true);
    });

    it("rejects the same opening id in „Flur“ and „Bad“", () => {
        const plan = {
            ...emptyPlan,
            roomsByFloor: { eg: [{ ...FLUR, openings: [DOOR] }], og: [{ ...BAD, openings: [DOOR] }], dg: [] },
        };
        expect(PlanSchema.safeParse(plan).success).toBe(false);
        const distinct = { ...plan, roomsByFloor: { ...plan.roomsByFloor, og: [{ ...BAD, openings: [{ ...DOOR, id: uuid(32) }] }] } };
        expect(PlanSchema.safeParse(distinct).success).toBe(true);
    });

    it("accepts „Eltern“ with a passage of 100 cm at 210 cm on a 330 cm edge (Raum mit Durchgang)", () => {
        const eltern = {
            ...RAUM,
            id: uuid(23),
            name: "Eltern",
            pointsCm: pts([0, 0], [420, 0], [420, 330], [0, 330]),
            openings: [{ ...PASSAGE, edgeIndex: 1, offsetCm: 210, widthCm: 100 }],
        };
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [eltern], og: [], dg: [] } }).success).toBe(true);
    });

    it("rejects the same opening id twice in one room", () => {
        const plan = { ...emptyPlan, roomsByFloor: { eg: [{ ...FLUR, openings: [DOOR, { ...WINDOW, id: DOOR.id }] }], og: [], dg: [] } };
        expect(PlanSchema.safeParse(plan).success).toBe(false);
    });
});

describe("RoomSchema wall thicknesses (Wanddicke je Kante)", () => {
    const valid = (wallThicknessCm: unknown) => RoomSchema.safeParse({ ...RAUM, wallThicknessCm }).success;

    it("accepts „Flur“ with 36,5 / 11,5 / 11,5 / 15 cm", () => {
        expect(valid([36.5, 11.5, 11.5, 15])).toBe(true);
    });

    it("accepts exactly 100 cm and rejects 120 cm", () => {
        expect(valid([36.5, 15, 15, 100])).toBe(true);
        expect(valid([36.5, 15, 15, 120])).toBe(false);
    });

    it("rejects 0 cm and a negative thickness", () => {
        expect(valid([0, 15, 15, 15])).toBe(false);
        expect(valid([-5, 15, 15, 15])).toBe(false);
    });

    it("rejects three values for four edges, five values and a missing field", () => {
        expect(valid([15, 15, 15])).toBe(false);
        expect(valid([15, 15, 15, 15, 15])).toBe(false);
        const { wallThicknessCm: _w, ...withoutField } = RAUM;
        expect(RoomSchema.safeParse(withoutField).success).toBe(false);
    });

    it("rejects a value that is no number", () => {
        expect(valid(["15", 15, 15, 15])).toBe(false);
    });

    it("accepts a plan with „Flur“ and these wall thicknesses (Wanddicken im Plan)", () => {
        const flur = { ...RAUM, name: "Flur", wallThicknessCm: [36.5, 11.5, 11.5, 15] };
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [flur], og: [], dg: [] } }).success).toBe(true);
    });
});

describe("RoomSchema color (Raumfarbe)", () => {
    const valid = (color: unknown) => RoomSchema.safeParse({ ...RAUM, color }).success;

    it("accepts null („Standard“) and #BBF7D0", () => {
        expect(valid(null)).toBe(true);
        expect(valid("#BBF7D0")).toBe(true);
        expect(valid("#bbf7d0")).toBe(true);
    });

    it("rejects „grün“, #FFF and a missing field", () => {
        expect(valid("grün")).toBe(false);
        expect(valid("#FFF")).toBe(false);
        const { color: _c, ...withoutField } = RAUM;
        expect(RoomSchema.safeParse(withoutField).success).toBe(false);
    });

    it("accepts a plan with „Flur“ without room color (Raumfarbe im Plan)", () => {
        const flur = { ...RAUM, name: "Flur", color: null };
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [flur], og: [], dg: [] } }).success).toBe(true);
    });
});

describe("RoomSchema locked (Sperre eines Raums im Plan)", () => {
    const valid = (locked: unknown) => RoomSchema.safeParse({ ...RAUM, locked }).success;

    it("accepts a locked and an unlocked room (Gesperrter Raum)", () => {
        expect(valid(true)).toBe(true);
        expect(valid(false)).toBe(true);
        const flur = { ...RAUM, name: "Flur", locked: true };
        expect(PlanSchema.safeParse({ ...emptyPlan, roomsByFloor: { eg: [flur], og: [], dg: [] } }).success).toBe(true);
    });

    it("rejects a room without locked (Raum ohne Sperrangabe)", () => {
        const { locked: _l, ...withoutField } = RAUM;
        expect(RoomSchema.safeParse(withoutField).success).toBe(false);
    });

    it("rejects locked: „ja“", () => {
        expect(valid("ja")).toBe(false);
    });
});

describe("PlanSchema settings (Einstellungen im Plan)", () => {
    it("rejects a plan without settings (Plan ohne Einstellungen)", () => {
        const { settings: _s, ...withoutSettings } = emptyPlan;
        expect(PlanSchema.safeParse(withoutSettings).success).toBe(false);
    });

    it("rejects a plan with invalid settings", () => {
        expect(PlanSchema.safeParse({ ...emptyPlan, settings: { ...FACTORY_SETTINGS, gridStepCm: 5 } }).success).toBe(false);
    });

    it("accepts a plan with changed, valid settings", () => {
        const settings = { ...FACTORY_SETTINGS, defaultWallThicknessCm: 11.5, snapStepCm: 2.5, defaultRoomColor: "#BBF7D0" };
        expect(PlanSchema.safeParse({ ...emptyPlan, settings }).success).toBe(true);
    });
});
