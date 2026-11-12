import { describe, expect, it } from "vitest";
import { MigrationError, migratePlanData, PLAN_MIGRATIONS, type PlanMigration } from "@/lib/plan-migration";
import { PLAN_SCHEMA_VERSION, PlanSchema } from "@/lib/plan-schema";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import planV1Text from "@/lib/__fixtures__/plan-v1.json?raw";
import planV2Text from "@/lib/__fixtures__/plan-v2.json?raw";
import planV3Text from "@/lib/__fixtures__/plan-v3.json?raw";
import planV4Text from "@/lib/__fixtures__/plan-v4.json?raw";
import planV5Text from "@/lib/__fixtures__/plan-v5.json?raw";
import planV6Text from "@/lib/__fixtures__/plan-v6.json?raw";
import planV7Text from "@/lib/__fixtures__/plan-v7.json?raw";
import planV8Text from "@/lib/__fixtures__/plan-v8.json?raw";
import planV9Text from "@/lib/__fixtures__/plan-v9.json?raw";
import planV10Text from "@/lib/__fixtures__/plan-v10.json?raw";
import { analyzePlanFile } from "@/lib/plan-import";

const TEST_MIGRATIONS: Record<number, PlanMigration> = {
    1: (data) => ({ ...data, steps: [...((data.steps as string[]) ?? []), "1→2"] }),
    2: (data) => ({ ...data, steps: [...((data.steps as string[]) ?? []), "2→3"] }),
};

const expectMigrationError = (fn: () => unknown, from: number, to: number) => {
    let error: unknown;
    try {
        fn();
    } catch (e) {
        error = e;
    }
    expect(error).toBeInstanceOf(MigrationError);
    expect(error).toMatchObject({ fromVersion: from, toVersion: to });
};

describe("migratePlanData", () => {
    it("applies two migrations one after the other", () => {
        const result = migratePlanData({ schemaVersion: 1, name: "x" }, 1, 3, TEST_MIGRATIONS);
        expect(result).toEqual({ schemaVersion: 3, name: "x", steps: ["1→2", "2→3"] });
    });

    it("sets schemaVersion after each step even if the migration does not", () => {
        const seen: unknown[] = [];
        const migrations: Record<number, PlanMigration> = {
            1: (data) => ({ ...data }),
            2: (data) => {
                seen.push(data.schemaVersion);
                return { ...data };
            },
        };
        expect(migratePlanData({ schemaVersion: 1 }, 1, 3, migrations).schemaVersion).toBe(3);
        expect(seen).toEqual([2]);
    });

    it("fails for a missing step", () => {
        expectMigrationError(() => migratePlanData({ schemaVersion: 1 }, 1, 3, { 1: TEST_MIGRATIONS[1] }), 1, 3);
    });

    it("fails for a throwing step", () => {
        const throwing: PlanMigration = () => {
            throw new Error("cannot handle");
        };
        expectMigrationError(() => migratePlanData({ schemaVersion: 1 }, 1, 2, { 1: throwing }), 1, 2);
    });

    it.each([null, [], "plan", 42])("fails for a step returning %j", (value) => {
        const bad = (() => value) as unknown as PlanMigration;
        expectMigrationError(() => migratePlanData({ schemaVersion: 1 }, 1, 2, { 1: bad }), 1, 2);
    });

    it("leaves the data unchanged for from === to", () => {
        const raw = { schemaVersion: 1, name: "x" };
        expect(migratePlanData(raw, 1, 1, {})).toBe(raw);
    });

    it("does not pick up inherited properties as migrations", () => {
        expectMigrationError(() => migratePlanData({ schemaVersion: 1 }, 1, 2, Object.create({ 1: () => ({}) })), 1, 2);
    });
});

describe("PLAN_MIGRATIONS", () => {
    it("has a migration for every version 1 … PLAN_SCHEMA_VERSION − 1", () => {
        for (let version = 1; version < PLAN_SCHEMA_VERSION; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });
});

describe("migration 1 → 2", () => {
    const planV1 = JSON.parse(planV1Text) as Record<string, unknown>;
    const migrated = migratePlanData(structuredClone(planV1), 1, 2);

    it("adds Erdgeschoss, Obergeschoss, Dachgeschoss with the ids eg, og, dg in this order", () => {
        expect(migrated.schemaVersion).toBe(2);
        expect(migrated.floors).toEqual([
            { id: "eg", name: "Erdgeschoss" },
            { id: "og", name: "Obergeschoss" },
            { id: "dg", name: "Dachgeschoss" },
        ]);
    });

    it("keeps shapes (coordinates, sizes, order) and calibrations unchanged", () => {
        expect(migrated.shapesByFloor).toEqual(planV1.shapesByFloor);
        expect(migrated.calibrationByFloor).toEqual(planV1.calibrationByFloor);
        expect(migrated.activeFloorId).toBe(planV1.activeFloorId);
        expect(migrated.name).toBe(planV1.name);
        expect(migrated.createdAt).toBe(planV1.createdAt);
        expect(migrated.updatedAt).toBe(planV1.updatedAt);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV1);
        PLAN_MIGRATIONS[1](input);
        expect(input).toEqual(planV1);
    });
});

describe("fixture plan-v2.json", () => {
    const planV2 = JSON.parse(planV2Text) as Record<string, unknown> & {
        floors: { id: string; name: string }[];
        shapesByFloor: Record<string, unknown[]>;
    };
    const migratedV1 = migratePlanData(JSON.parse(planV1Text), 1, 2);

    it("has „Keller“ in front of the migrated floors", () => {
        expect(planV2.schemaVersion).toBe(2);
        expect(planV2.floors.map((f) => f.name)).toEqual(["Keller", "Erdgeschoss", "Obergeschoss", "Dachgeschoss"]);
        expect(planV2.shapesByFloor[planV2.floors[0].id]).toHaveLength(1);
    });

    it("is the migrated plan-v1.json plus the Keller", () => {
        const [keller, ...rest] = planV2.floors;
        const { [keller.id]: _kellerShapes, ...otherShapes } = planV2.shapesByFloor;
        expect({ ...planV2, floors: rest, shapesByFloor: otherShapes }).toEqual(migratedV1);
    });
});

describe("migration 2 → 3", () => {
    const planV2 = JSON.parse(planV2Text) as Record<string, unknown> & {
        floors: { id: string }[];
        calibrationByFloor: Record<string, unknown>;
        shapesByFloor: Record<string, unknown[]>;
    };
    const kellerId = planV2.floors[0].id;
    /** Through 2 → 3 and the later steps; the current schema checks the result. */
    const toCurrent = (data: Record<string, unknown>) => PlanSchema.parse(migratePlanData(data, 2, PLAN_SCHEMA_VERSION));
    const migrated = toCurrent(structuredClone(planV2));
    const noImage = { imageId: null, imageWidthPx: null, imageHeightPx: null, visible: true, opacity: 1 };

    it("gives eg, og, dg an underlay without image with their calibration or none", () => {
        expect(migratePlanData(structuredClone(planV2), 2, 3).schemaVersion).toBe(3);
        expect(migrated.underlayByFloor).toEqual({
            eg: { ...noImage, calibration: planV2.calibrationByFloor.eg },
            og: { ...noImage, calibration: planV2.calibrationByFloor.og },
            dg: { ...noImage, calibration: null },
        });
    });

    it("gives the Keller no underlay and removes calibrationByFloor", () => {
        expect(migrated.underlayByFloor).not.toHaveProperty(kellerId);
        expect(migratePlanData(structuredClone(planV2), 2, 3)).not.toHaveProperty("calibrationByFloor");
    });

    it("keeps all shapes (coordinates, sizes, order), floors and plan data", () => {
        expect(migrated.shapesByFloor).toEqual(planV2.shapesByFloor);
        expect(migrated.floors).toEqual(planV2.floors);
        expect(migrated.activeFloorId).toBe(planV2.activeFloorId);
        expect(migrated.name).toBe(planV2.name);
        expect(migrated.createdAt).toBe(planV2.createdAt);
        expect(migrated.updatedAt).toBe(planV2.updatedAt);
    });

    it("runs plan-v1.json through 1 → 2 → 3 into a valid plan", () => {
        const planV1 = JSON.parse(planV1Text) as Record<string, unknown> & { calibrationByFloor: Record<string, unknown> };
        const fromV1 = PlanSchema.parse(migratePlanData(planV1, 1, PLAN_SCHEMA_VERSION));
        expect(Object.keys(fromV1.underlayByFloor)).toEqual(["eg", "og", "dg"]);
        expect(fromV1.underlayByFloor.eg?.calibration).toEqual(planV1.calibrationByFloor.eg ?? null);
    });

    it("turns an invalid old calibration into calibration: null", () => {
        const eg = { ...(planV2.calibrationByFloor.eg as object), pxPerCm: 0 };
        const data = { ...structuredClone(planV2), calibrationByFloor: { eg } };
        const result = toCurrent(data);
        expect(result.underlayByFloor.eg).toEqual({ ...noImage, calibration: null });
    });

    it("gives no underlay to og if og is not in floors", () => {
        const data = structuredClone(planV2);
        data.floors = data.floors.filter((f) => f.id !== "og");
        const { og: _og, ...shapes } = data.shapesByFloor;
        data.shapesByFloor = shapes;
        data.activeFloorId = "eg";
        const result = toCurrent(data);
        expect(Object.keys(result.underlayByFloor)).toEqual(["eg", "dg"]);
    });

    it("copes with a missing or broken calibrationByFloor", () => {
        const { calibrationByFloor: _cal, ...withoutCalibrations } = structuredClone(planV2);
        expect(toCurrent(withoutCalibrations).underlayByFloor.eg?.calibration).toBeNull();
        const broken = { ...structuredClone(planV2), calibrationByFloor: "eg" };
        expect(toCurrent(broken).underlayByFloor.og?.calibration).toBeNull();
    });

    it("does not change its input", () => {
        const input = structuredClone(planV2);
        PLAN_MIGRATIONS[2](input);
        expect(input).toEqual(planV2);
    });
});

describe("fixture plan-v3.json", () => {
    const toCurrent = (data: Record<string, unknown>, from: number) =>
        PlanSchema.parse(migratePlanData(data, from, PLAN_SCHEMA_VERSION));
    const planV3 = toCurrent(JSON.parse(planV3Text), 3);
    const migratedV2 = toCurrent(JSON.parse(planV2Text), 2);
    const kellerId = planV3.floors[0].id;

    it("is version 3 and passes PlanSchema after the migration to the current version", () => {
        expect(JSON.parse(planV3Text).schemaVersion).toBe(3);
        expect(planV3.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
    });

    it("is the migrated plan-v2.json plus a half-transparent underlay with image and alignment on the Keller", () => {
        const { [kellerId]: keller, ...others } = planV3.underlayByFloor;
        expect({ ...planV3, underlayByFloor: others }).toEqual(migratedV2);
        expect(keller).toMatchObject({ imageWidthPx: 1240, imageHeightPx: 1754, opacity: 0.4 });
        expect(keller?.imageId).toMatch(/^[0-9a-f]{64}$/);
        expect(keller?.calibration?.align).toBe("horizontal");
    });
});

describe("migration 3 → 4", () => {
    const planV3 = JSON.parse(planV3Text) as Record<string, unknown> & { floors: { id: string }[] };
    const migrated = migratePlanData(structuredClone(planV3), 3, 4);

    it("gives every floor an empty room list and keeps everything else", () => {
        expect(migrated.schemaVersion).toBe(4);
        expect(migrated.roomsByFloor).toEqual(Object.fromEntries(planV3.floors.map((f) => [f.id, []])));
        const { schemaVersion: _a, roomsByFloor: _b, ...rest } = migrated;
        const { schemaVersion: _c, ...v3Rest } = planV3;
        expect(rest).toEqual(v3Rest);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV3), 3, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("runs plan-v1.json through all steps into a valid plan of the current version", () => {
        const planV1 = JSON.parse(planV1Text) as Record<string, unknown> & { shapesByFloor: unknown };
        const fromV1 = PlanSchema.parse(migratePlanData(planV1, 1, PLAN_SCHEMA_VERSION));
        expect(fromV1.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(fromV1.roomsByFloor).toEqual({ eg: [], og: [], dg: [] });
        expect(fromV1.shapesByFloor).toEqual(planV1.shapesByFloor);
    });

    it.each([
        ["missing", undefined],
        ["no array", "eg"],
        ["of no objects", ["eg", 3]],
    ])("leaves roomsByFloor empty for floors %s, so the schema decides", (_name, floors) => {
        const result = migratePlanData({ ...structuredClone(planV3), floors }, 3, 4);
        expect(result.roomsByFloor).toEqual({});
        expect(PlanSchema.safeParse(result).success).toBe(false);
    });

    it("skips broken entries of the floor list", () => {
        const floors = [{ id: "eg", name: "Erdgeschoss" }, { name: "ohne Kennung" }, null];
        expect(migratePlanData({ floors }, 3, 4).roomsByFloor).toEqual({ eg: [] });
    });

    it("does not change its input", () => {
        const input = structuredClone(planV3);
        PLAN_MIGRATIONS[3](input);
        expect(input).toEqual(planV3);
    });
});

describe("fixture plan-v4.json", () => {
    const planV4 = JSON.parse(planV4Text) as Record<string, unknown> & {
        floors: { id: string }[];
        roomsByFloor: Record<string, { pointsCm: unknown[] }[]>;
    };

    it("is version 4 with two floors, a room of 4 and one of 6 corners without openings, shapes and an underlay", () => {
        expect(planV4.schemaVersion).toBe(4);
        expect(planV4.floors).toHaveLength(2);
        const rooms = planV4.floors.map((f) => planV4.roomsByFloor[f.id]);
        expect(rooms.map((list) => list.map((r) => r.pointsCm.length))).toEqual([[4], [6]]);
        expect(rooms.flat().every((r) => !Object.hasOwn(r, "openings"))).toBe(true);
        expect(Object.keys(planV4.underlayByFloor as object)).toHaveLength(1);
    });

    it("becomes a plan of the current version via analyzePlanFile without invalid entries", () => {
        const result = analyzePlanFile(planV4Text, "plan-v4.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds).toBe(0);
    });
});

describe("migration 4 → 5", () => {
    const planV4 = JSON.parse(planV4Text) as Record<string, unknown> & {
        roomsByFloor: Record<string, Record<string, unknown>[]>;
    };
    const migrated = migratePlanData(structuredClone(planV4), 4, 5) as typeof planV4;

    it("gives every room an empty list of openings", () => {
        expect(migrated.schemaVersion).toBe(5);
        for (const rooms of Object.values(migrated.roomsByFloor)) {
            for (const r of rooms) expect(r.openings).toEqual([]);
        }
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV4), 4, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps all other fields of the rooms and of the plan", () => {
        const stripped = Object.fromEntries(
            Object.entries(migrated.roomsByFloor).map(([id, rooms]) => [id, rooms.map(({ openings: _o, ...r }) => r)]),
        );
        expect(stripped).toEqual(planV4.roomsByFloor);
        const { schemaVersion: _a, roomsByFloor: _b, ...rest } = migrated;
        const { schemaVersion: _c, roomsByFloor: _d, ...v4Rest } = planV4;
        expect(rest).toEqual(v4Rest);
    });

    it("keeps an existing openings value as it is", () => {
        const data = { roomsByFloor: { eg: [{ name: "Flur", openings: "kaputt" }] } };
        expect(migratePlanData(data, 4, 5).roomsByFloor).toEqual(data.roomsByFloor);
    });

    it.each([
        ["no roomsByFloor", {}],
        ["roomsByFloor that is no object", { roomsByFloor: "eg" }],
        ["a room list that is no array", { roomsByFloor: { eg: "Flur" } }],
        ["entries that are no room objects", { roomsByFloor: { eg: [null, 3, "Flur", ["x"]] } }],
    ])("leaves %s unchanged", (_name, data) => {
        const result = migratePlanData(structuredClone(data), 4, 5);
        const { schemaVersion: _v, ...rest } = result;
        expect(rest).toEqual(data);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV4);
        PLAN_MIGRATIONS[4](input);
        expect(input).toEqual(planV4);
    });
});

describe("fixture plan-v5.json", () => {
    type RawRoom = { name: string; pointsCm: unknown[]; openings: { kind: string }[] };
    const planV5 = JSON.parse(planV5Text) as Record<string, unknown> & {
        floors: { id: string }[];
        roomsByFloor: Record<string, RawRoom[]>;
        shapesByFloor: Record<string, unknown[]>;
    };

    it("is version 5 with two floors, a rectangle with door and window, an L-shaped room and shapes, without wall thicknesses", () => {
        expect(planV5.schemaVersion).toBe(5);
        expect(planV5.floors).toHaveLength(2);
        const rooms = planV5.floors.map((f) => planV5.roomsByFloor[f.id]);
        expect(rooms.map((list) => list.map((r) => r.pointsCm.length))).toEqual([[4], [6]]);
        expect(rooms[0][0].openings.map((o) => o.kind)).toEqual(["door", "window"]);
        expect(rooms.flat().every((r) => !Object.hasOwn(r, "wallThicknessCm"))).toBe(true);
        expect(Object.values(planV5.shapesByFloor).flat().length).toBeGreaterThan(0);
    });

    it("is the migrated plan-v4.json plus a door and a window in „Wohnen“", () => {
        const fromV4 = migratePlanData(JSON.parse(planV4Text), 4, 5) as typeof planV5;
        const withoutOpenings = structuredClone(planV5);
        for (const rooms of Object.values(withoutOpenings.roomsByFloor)) for (const r of rooms) r.openings = [];
        const { updatedAt: _a, ...rest } = withoutOpenings;
        const { updatedAt: _b, ...v4Rest } = fromV4;
        expect(rest).toEqual(v4Rest);
    });

    it("becomes a plan of the current version via analyzePlanFile without any warning but the version", () => {
        const result = analyzePlanFile(planV5Text, "plan-v5.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        expect(result.openingCounts).toEqual({ doors: 1, windows: 1, passages: 0 });
    });
});

describe("migration 5 → 6", () => {
    type RawRoom = Record<string, unknown> & { pointsCm: unknown[] };
    const planV5 = JSON.parse(planV5Text) as Record<string, unknown> & { roomsByFloor: Record<string, RawRoom[]> };
    const migrated = migratePlanData(structuredClone(planV5), 5, 6) as typeof planV5;

    it("gives every edge of every room 15 cm wall thickness", () => {
        expect(migrated.schemaVersion).toBe(6);
        for (const rooms of Object.values(migrated.roomsByFloor)) {
            for (const r of rooms) expect(r.wallThicknessCm).toEqual(r.pointsCm.map(() => 15));
        }
        expect(Object.values(migrated.roomsByFloor).flat().map((r) => (r.wallThicknessCm as number[]).length)).toEqual([4, 6]);
        expect(PlanSchema.safeParse(migratePlanData(migrated, 6, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps rooms, openings, shapes, floors and underlays unchanged", () => {
        const stripped = Object.fromEntries(
            Object.entries(migrated.roomsByFloor).map(([id, rooms]) => [id, rooms.map(({ wallThicknessCm: _w, ...r }) => r)]),
        );
        expect(stripped).toEqual(planV5.roomsByFloor);
        const { schemaVersion: _a, roomsByFloor: _b, ...rest } = migrated;
        const { schemaVersion: _c, roomsByFloor: _d, ...v5Rest } = planV5;
        expect(rest).toEqual(v5Rest);
    });

    it("keeps an existing wallThicknessCm value as it is", () => {
        const data = { roomsByFloor: { eg: [{ name: "Flur", pointsCm: [{}, {}, {}], wallThicknessCm: "kaputt" }] } };
        expect(migratePlanData(structuredClone(data), 5, 6).roomsByFloor).toEqual(data.roomsByFloor);
    });

    it("leaves a room without a pointsCm list unchanged", () => {
        const data = { roomsByFloor: { eg: [{ name: "Flur" }, { name: "Bad", pointsCm: "kaputt" }] } };
        expect(migratePlanData(structuredClone(data), 5, 6).roomsByFloor).toEqual(data.roomsByFloor);
    });

    it.each([
        ["no roomsByFloor", {}],
        ["roomsByFloor that is no object", { roomsByFloor: "eg" }],
        ["a room list that is no array", { roomsByFloor: { eg: "Flur" } }],
        ["entries that are no room objects", { roomsByFloor: { eg: [null, 3, "Flur", ["x"]] } }],
    ])("leaves %s unchanged", (_name, data) => {
        const { schemaVersion: _v, ...rest } = migratePlanData(structuredClone(data), 5, 6);
        expect(rest).toEqual(data);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV5);
        PLAN_MIGRATIONS[5](input);
        expect(input).toEqual(planV5);
    });
});

describe("fixture plan-v6.json", () => {
    type RawRoom = { name: string; pointsCm: unknown[]; openings: { kind: string }[]; wallThicknessCm: number[] };
    const planV6 = JSON.parse(planV6Text) as Record<string, unknown> & {
        floors: { id: string }[];
        roomsByFloor: Record<string, RawRoom[]>;
    };

    it("is version 6 with „Wohnen“ (walls 36.5/15/15/15 cm, door and window) and passes the schema", () => {
        expect(planV6.schemaVersion).toBe(6);
        const wohnen = planV6.roomsByFloor[planV6.floors[0].id][0];
        expect(wohnen.name).toBe("Wohnen");
        expect(wohnen.wallThicknessCm).toEqual([36.5, 15, 15, 15]);
        expect(wohnen.openings.map((o) => o.kind)).toEqual(["door", "window"]);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV6), 6, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("is the migrated plan-v5.json with a thicker outer wall on edge 0 of „Wohnen“", () => {
        const fromV5 = migratePlanData(JSON.parse(planV5Text), 5, 6) as typeof planV6;
        fromV5.roomsByFloor[fromV5.floors[0].id][0].wallThicknessCm[0] = 36.5;
        const { updatedAt: _a, ...rest } = planV6;
        const { updatedAt: _b, ...v5Rest } = fromV5;
        expect(rest).toEqual(v5Rest);
    });
});

describe("migration 6 → 7", () => {
    const planV6 = JSON.parse(planV6Text) as Record<string, unknown>;

    it("keeps all data and only sets version 7", () => {
        const migrated = migratePlanData(structuredClone(planV6), 6, 7);
        expect(migrated.schemaVersion).toBe(7);
        const { schemaVersion: _a, ...rest } = migrated;
        const { schemaVersion: _b, ...v6Rest } = planV6;
        expect(rest).toEqual(v6Rest);
        expect(PlanSchema.safeParse(migratePlanData(migrated, 7, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV6);
        PLAN_MIGRATIONS[6](input);
        expect(input).toEqual(planV6);
    });

    it("has a migration for every version 1 … 6", () => {
        for (let version = 1; version <= 6; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });

    it("turns plan-v6.json via analyzePlanFile into the current version without any warning but the version (Dateien der Version 6)", () => {
        const result = analyzePlanFile(planV6Text, "plan-v6.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        // The fixture carries no image data, so only the underlay's image reference is dropped („Vorlagenbild fehlt“).
        const { schemaVersion: _a, underlayByFloor, ...rest } = result.plan;
        const migrated = migratePlanData(structuredClone(planV6), 6, PLAN_SCHEMA_VERSION);
        const { schemaVersion: _b, underlayByFloor: v6Underlays, ...v6Rest } = migrated as typeof migrated & {
            underlayByFloor: Record<string, Record<string, unknown>>;
        };
        expect(rest).toEqual(v6Rest);
        expect(underlayByFloor.eg).toEqual({ ...v6Underlays.eg, imageId: null });
    });
});

describe("fixture plan-v7.json", () => {
    type RawRoom = { name: string; openings: { kind: string }[] };
    const planV7 = JSON.parse(planV7Text) as Record<string, unknown> & {
        floors: { id: string }[];
        roomsByFloor: Record<string, RawRoom[]>;
    };

    it("is version 7 with „Wohnen“ (door, window) and „Flur“ (passage) and passes the schema", () => {
        expect(planV7.schemaVersion).toBe(7);
        const rooms = planV7.floors.flatMap((f) => planV7.roomsByFloor[f.id]);
        expect(rooms.map((r) => r.name)).toEqual(["Wohnen", "Flur"]);
        expect(rooms.map((r) => r.openings.map((o) => o.kind))).toEqual([["door", "window"], ["passage"]]);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV7), 7, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("is the migrated plan-v6.json plus a passage in „Flur“", () => {
        const fromV6 = migratePlanData(JSON.parse(planV6Text), 6, 7) as typeof planV7;
        const flur = fromV6.roomsByFloor[fromV6.floors[1].id][0];
        flur.openings.push(planV7.roomsByFloor[planV7.floors[1].id][0].openings[0]);
        const { updatedAt: _a, ...rest } = planV7;
        const { updatedAt: _b, ...v6Rest } = fromV6;
        expect(rest).toEqual(v6Rest);
    });
});

describe("migration 7 → 8", () => {
    type RawRoom = Record<string, unknown> & { name: string };
    const planV7 = JSON.parse(planV7Text) as Record<string, unknown> & { roomsByFloor: Record<string, RawRoom[]> };
    const migrated = migratePlanData(structuredClone(planV7), 7, 8) as typeof planV7;

    it("gives every room color: null and passes the schema", () => {
        expect(migrated.schemaVersion).toBe(8);
        const rooms = Object.values(migrated.roomsByFloor).flat();
        expect(rooms).toHaveLength(2);
        for (const r of rooms) expect(r.color).toBeNull();
        expect(PlanSchema.safeParse(migratePlanData(migrated, 8, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps rooms (corners, openings, wall thicknesses), shapes, floors and underlays unchanged", () => {
        const stripped = Object.fromEntries(
            Object.entries(migrated.roomsByFloor).map(([id, rooms]) => [id, rooms.map(({ color: _c, ...r }) => r)]),
        );
        expect(stripped).toEqual(planV7.roomsByFloor);
        const { schemaVersion: _a, roomsByFloor: _b, ...rest } = migrated;
        const { schemaVersion: _c, roomsByFloor: _d, ...v7Rest } = planV7;
        expect(rest).toEqual(v7Rest);
    });

    it("keeps an existing color value as it is", () => {
        const data = { roomsByFloor: { eg: [{ name: "Bad", color: "#BFDBFE" }, { name: "Flur", color: "blau" }] } };
        expect(migratePlanData(structuredClone(data), 7, 8).roomsByFloor).toEqual(data.roomsByFloor);
    });

    it.each([
        ["no roomsByFloor", {}],
        ["a room list that is no array", { roomsByFloor: { eg: "Flur" } }],
        ["entries that are no room objects", { roomsByFloor: { eg: [null, 3, "Flur"] } }],
    ])("leaves %s unchanged", (_name, data) => {
        const { schemaVersion: _v, ...rest } = migratePlanData(structuredClone(data), 7, 8);
        expect(rest).toEqual(data);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV7);
        PLAN_MIGRATIONS[7](input);
        expect(input).toEqual(planV7);
    });

    it("has a migration for every version 1 … 7", () => {
        for (let version = 1; version <= 7; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });

    it("turns plan-v7.json via analyzePlanFile into the current version without any warning but the version (Dateien der Version 7)", () => {
        const result = analyzePlanFile(planV7Text, "plan-v7.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        const rooms = Object.values(result.plan.roomsByFloor).flat();
        expect(rooms.map((r) => [r.name, r.color])).toEqual([
            ["Wohnen", null],
            ["Flur", null],
        ]);
        expect(rooms[1].openings.map((o) => o.kind)).toEqual(["passage"]);
        const { schemaVersion: _a, underlayByFloor: _u, settings: _s, ...rest } = result.plan;
        const current = migratePlanData(structuredClone(planV7), 7, PLAN_SCHEMA_VERSION);
        const { schemaVersion: _b, underlayByFloor: _w, settings: _t, ...v7Rest } = current;
        expect(rest).toEqual(v7Rest);
    });
});

describe("fixture plan-v8.json", () => {
    type RawRoom = { name: string; color: string | null; wallThicknessCm: number[]; openings: { kind: string }[] };
    const planV8 = JSON.parse(planV8Text) as Record<string, unknown> & {
        floors: { id: string }[];
        roomsByFloor: Record<string, RawRoom[]>;
    };

    it("is version 8 with colored rooms, a passage and different wall thicknesses and passes the schema", () => {
        expect(planV8.schemaVersion).toBe(8);
        const rooms = planV8.floors.flatMap((f) => planV8.roomsByFloor[f.id]);
        expect(rooms.map((r) => [r.name, r.color])).toEqual([
            ["Wohnen", "#BBF7D0"],
            ["Flur", "#BFDBFE"],
        ]);
        expect(rooms[1].openings.map((o) => o.kind)).toEqual(["passage"]);
        expect(rooms[1].wallThicknessCm).toEqual([11.5, 11.5, 24, 11.5, 11.5, 11.5]);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV8), 8, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("is the migrated plan-v7.json plus room colors and wall thicknesses in „Flur“", () => {
        const fromV7 = migratePlanData(JSON.parse(planV7Text), 7, 8) as typeof planV8;
        const strip = (plan: typeof planV8) =>
            Object.fromEntries(
                Object.entries(plan.roomsByFloor).map(([id, rooms]) => [
                    id,
                    rooms.map(({ color: _c, wallThicknessCm: _w, ...r }) => r),
                ]),
            );
        expect(strip(planV8)).toEqual(strip(fromV7));
        const { updatedAt: _a, roomsByFloor: _r, ...rest } = planV8;
        const { updatedAt: _b, roomsByFloor: _s, ...v7Rest } = fromV7;
        expect(rest).toEqual(v7Rest);
    });
});

describe("migration 8 → 9", () => {
    const planV8 = JSON.parse(planV8Text) as Record<string, unknown>;
    const migrated = migratePlanData(structuredClone(planV8), 8, 9);

    it("adds the factory settings and passes the schema", () => {
        expect(migrated.schemaVersion).toBe(9);
        expect(migrated.settings).toEqual(FACTORY_SETTINGS);
        expect(PlanSchema.safeParse(migratePlanData(migrated, 9, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps everything else unchanged", () => {
        const { schemaVersion: _a, settings: _s, ...rest } = migrated;
        const { schemaVersion: _b, ...v8Rest } = planV8;
        expect(rest).toEqual(v8Rest);
    });

    it("keeps an existing settings value as it is", () => {
        const data = { settings: { gridStepCm: 0 } };
        expect(migratePlanData(structuredClone(data), 8, 9).settings).toEqual({ gridStepCm: 0 });
    });

    it("gives every plan its own settings object", () => {
        const a = migratePlanData({}, 8, 9).settings as Record<string, unknown>;
        const b = migratePlanData({}, 8, 9).settings as Record<string, unknown>;
        expect(a).not.toBe(b);
        expect(Object.isFrozen(a)).toBe(false);
    });

    it("does not change its input", () => {
        const input = structuredClone(planV8);
        PLAN_MIGRATIONS[8](input);
        expect(input).toEqual(planV8);
    });

    it("has a migration for every version 1 … 8", () => {
        for (let version = 1; version <= 8; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });

    it("turns plan-v8.json via analyzePlanFile into the current version without any warning but the version (Dateien der Version 8)", () => {
        const result = analyzePlanFile(planV8Text, "plan-v8.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        expect(result.plan.settings).toEqual(FACTORY_SETTINGS);
        const rooms = Object.values(result.plan.roomsByFloor).flat();
        expect(rooms.map((r) => [r.name, r.color])).toEqual([
            ["Wohnen", "#BBF7D0"],
            ["Flur", "#BFDBFE"],
        ]);
        const { schemaVersion: _a, underlayByFloor: _u, ...rest } = result.plan;
        const current = migratePlanData(structuredClone(planV8), 8, PLAN_SCHEMA_VERSION);
        const { schemaVersion: _b, underlayByFloor: _w, ...v8Rest } = current;
        expect(rest).toEqual(v8Rest);
    });
});

describe("fixture plan-v9.json", () => {
    type RawOpening = { kind: string; edgeIndex: number; offsetCm: number; widthCm: number };
    type RawRoom = { name: string; pointsCm: { x: number; y: number }[]; openings: RawOpening[] };
    const planV9 = JSON.parse(planV9Text) as Record<string, unknown> & {
        settings: Record<string, unknown>;
        roomsByFloor: Record<string, RawRoom[]>;
    };

    it("is version 9 with changed settings and passes the schema", () => {
        expect(planV9.schemaVersion).toBe(9);
        expect(planV9.settings.defaultWallThicknessCm).toBe(11.5);
        expect(planV9.settings).not.toEqual(FACTORY_SETTINGS);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV9), 9, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("has „Eltern“ with a door and a passage over the whole 330 cm edge", () => {
        const eltern = Object.values(planV9.roomsByFloor)
            .flat()
            .find((r) => r.name === "Eltern");
        expect(eltern?.openings.map((o) => o.kind)).toEqual(["door", "passage"]);
        const passage = eltern!.openings[1];
        const [a, b] = [eltern!.pointsCm[passage.edgeIndex], eltern!.pointsCm[passage.edgeIndex + 1]];
        expect(Math.hypot(b.x - a.x, b.y - a.y)).toBe(330);
        expect([passage.offsetCm, passage.widthCm]).toEqual([0, 330]);
    });

    it("has no remembered sizes, as version 9 did not know them", () => {
        const openings = Object.values(planV9.roomsByFloor).flatMap((rooms) => rooms.flatMap((r) => r.openings));
        expect(openings.some((o) => Object.hasOwn(o, "beforeFullEdge"))).toBe(false);
    });
});

describe("migration 9 → 10", () => {
    type RawOpening = Record<string, unknown> & { kind: string };
    type RawRoom = Record<string, unknown> & { name: string; openings: RawOpening[] };
    const planV9 = JSON.parse(planV9Text) as Record<string, unknown> & { roomsByFloor: Record<string, RawRoom[]> };
    const migrated = migratePlanData(structuredClone(planV9), 9, 10) as typeof planV9;
    const openings = (plan: typeof planV9) => Object.values(plan.roomsByFloor).flatMap((rooms) => rooms.flatMap((r) => r.openings));

    it("gives every opening beforeFullEdge: null and passes the schema", () => {
        expect(migrated.schemaVersion).toBe(10);
        expect(openings(migrated).length).toBeGreaterThan(0);
        expect(openings(migrated).every((o) => o.beforeFullEdge === null)).toBe(true);
        expect(PlanSchema.safeParse(migratePlanData(migrated, 10, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps the settings and everything else unchanged", () => {
        const strip = (plan: typeof planV9) =>
            Object.fromEntries(
                Object.entries(plan.roomsByFloor).map(([id, rooms]) => [
                    id,
                    rooms.map((r) => ({ ...r, openings: r.openings.map(({ beforeFullEdge: _b, ...o }) => o) })),
                ]),
            );
        expect(strip(migrated)).toEqual(strip(planV9));
        const { schemaVersion: _a, roomsByFloor: _r, ...rest } = migrated;
        const { schemaVersion: _b, roomsByFloor: _s, ...v9Rest } = planV9;
        expect(rest).toEqual(v9Rest);
        expect(migrated.settings).toEqual(planV9.settings);
    });

    it("keeps an existing beforeFullEdge value as it is", () => {
        const data = {
            roomsByFloor: { eg: [{ openings: [{ kind: "passage", beforeFullEdge: { offsetCm: 200, widthCm: 100 } }, { kind: "window" }] }] },
        };
        const result = migratePlanData(structuredClone(data), 9, 10) as { roomsByFloor: { eg: { openings: unknown[] }[] } };
        expect(result.roomsByFloor.eg[0].openings).toEqual([
            { kind: "passage", beforeFullEdge: { offsetCm: 200, widthCm: 100 } },
            { kind: "window", beforeFullEdge: null },
        ]);
    });

    it("leaves rooms without opening list and openings that are no objects as they are", () => {
        const data = { roomsByFloor: { eg: [{ name: "A" }, { openings: "keine" }, { openings: ["Tür"] }], og: "weg" } };
        expect(migratePlanData(structuredClone(data), 9, 10)).toEqual({ ...data, schemaVersion: 10 });
    });

    it("does not change its input", () => {
        const input = structuredClone(planV9);
        PLAN_MIGRATIONS[9](input);
        expect(input).toEqual(planV9);
    });

    it("has a migration for every version 1 … 9", () => {
        for (let version = 1; version <= 9; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });

    it("turns plan-v9.json via analyzePlanFile into the current version without any warning but the version, keeping the settings (Dateien der Version 9)", () => {
        const result = analyzePlanFile(planV9Text, "sicherung.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        expect(result.plan.settings).toEqual(planV9.settings);
        const eltern = Object.values(result.plan.roomsByFloor)
            .flat()
            .find((r) => r.name === "Eltern");
        expect(eltern?.openings.map((o) => [o.kind, o.widthCm, o.beforeFullEdge])).toEqual([
            ["door", 80, null],
            ["passage", 330, null],
        ]);
        const { schemaVersion: _a, underlayByFloor: _u, ...rest } = result.plan;
        const current = migratePlanData(structuredClone(planV9), 9, PLAN_SCHEMA_VERSION);
        const { schemaVersion: _b, underlayByFloor: _w, ...v9Rest } = current;
        expect(rest).toEqual(v9Rest);
    });

    it("brings plan-v8.json via 8 → 9 → … to the current version without any warning but the version", () => {
        const result = analyzePlanFile(planV8Text, "plan-v8.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(PLAN_SCHEMA_VERSION);
        expect(result.fileVersion).toBe(8);
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.settingsIssues).toEqual([]);
        expect(result.colorIssues).toEqual([]);
        const all = Object.values(result.plan.roomsByFloor).flatMap((rooms) => rooms.flatMap((r) => r.openings));
        expect(all.every((o) => o.beforeFullEdge === null)).toBe(true);
    });
});

describe("fixture plan-v10.json", () => {
    type RawOpening = Record<string, unknown> & { kind: string; beforeFullEdge: unknown };
    type RawRoom = Record<string, unknown> & { name: string; color: string | null; openings: RawOpening[] };
    const planV10 = JSON.parse(planV10Text) as Record<string, unknown> & {
        settings: Record<string, unknown>;
        roomsByFloor: Record<string, RawRoom[]>;
    };
    const rooms = Object.values(planV10.roomsByFloor).flat();

    it("is version 10 with changed settings and passes the schema", () => {
        expect(planV10.schemaVersion).toBe(10);
        expect(planV10.settings).not.toEqual(FACTORY_SETTINGS);
        expect(PlanSchema.safeParse(migratePlanData(structuredClone(planV10), 10, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("has „Wohnen“ with a door, a red „Bad“ and a passage with remembered sizes", () => {
        expect(rooms.find((r) => r.name === "Wohnen")?.openings.some((o) => o.kind === "door")).toBe(true);
        expect(rooms.find((r) => r.name === "Bad")?.color).toBe("#FECACA");
        const passages = rooms.flatMap((r) => r.openings).filter((o) => o.kind === "passage");
        expect(passages.some((o) => o.beforeFullEdge !== null)).toBe(true);
    });

    it("has no room lock, as version 10 did not know it", () => {
        expect(rooms.some((r) => Object.hasOwn(r, "locked"))).toBe(false);
    });
});

describe("migration 10 → 11", () => {
    type RawRoom = Record<string, unknown> & { name: string };
    const planV10 = JSON.parse(planV10Text) as Record<string, unknown> & { roomsByFloor: Record<string, RawRoom[]> };
    const migrated = migratePlanData(structuredClone(planV10), 10, 11) as typeof planV10;
    const rooms = (plan: typeof planV10) => Object.values(plan.roomsByFloor).flat();

    it("gives every room locked: false and passes the schema", () => {
        expect(migrated.schemaVersion).toBe(11);
        expect(rooms(migrated).length).toBeGreaterThan(0);
        expect(rooms(migrated).every((r) => r.locked === false)).toBe(true);
        expect(PlanSchema.safeParse(migratePlanData(migrated, 11, PLAN_SCHEMA_VERSION)).success).toBe(true);
    });

    it("keeps openings, remembered sizes, colors, settings and shapes unchanged", () => {
        const strip = (plan: typeof planV10) =>
            Object.fromEntries(Object.entries(plan.roomsByFloor).map(([id, list]) => [id, list.map(({ locked: _l, ...r }) => r)]));
        expect(strip(migrated)).toEqual(strip(planV10));
        const { schemaVersion: _a, roomsByFloor: _r, ...rest } = migrated;
        const { schemaVersion: _b, roomsByFloor: _s, ...v10Rest } = planV10;
        expect(rest).toEqual(v10Rest);
    });

    it("keeps an existing locked value as it is", () => {
        const data = { roomsByFloor: { eg: [{ name: "A", locked: true }, { name: "B", locked: "ja" }, { name: "C" }] } };
        const result = migratePlanData(structuredClone(data), 10, 11) as { roomsByFloor: { eg: unknown[] } };
        expect(result.roomsByFloor.eg).toEqual([
            { name: "A", locked: true },
            { name: "B", locked: "ja" },
            { name: "C", locked: false },
        ]);
    });

    it("leaves room lists that are no arrays and rooms that are no objects as they are", () => {
        const data = { roomsByFloor: { eg: ["Raum"], og: "weg" } };
        expect(migratePlanData(structuredClone(data), 10, 11)).toEqual({ ...data, schemaVersion: 11 });
    });

    it("does not change its input", () => {
        const input = structuredClone(planV10);
        PLAN_MIGRATIONS[10](input);
        expect(input).toEqual(planV10);
    });

    it("has a migration for every version 1 … 10", () => {
        for (let version = 1; version <= 10; version++) {
            expect(PLAN_MIGRATIONS[version], `migration ${version} → ${version + 1}`).toBeTypeOf("function");
        }
    });

    it("turns plan-v10.json via analyzePlanFile into version 11 without any warning but the version (Dateien der Version 10)", () => {
        const result = analyzePlanFile(planV10Text, "sicherung.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.fileVersion).toBe(10);
        expect(result.relation).toBe("older");
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.invalidFloors).toEqual([]);
        expect(result.underlayIssues.filter((i) => i.reason !== "Vorlagenbild fehlt")).toEqual([]);
        expect(result.unknownFloors).toEqual([]);
        expect(result.settingsIssues).toEqual([]);
        expect(result.colorIssues).toEqual([]);
        expect(result.reassignedIds + result.reassignedRoomIds + result.reassignedOpeningIds).toBe(0);
        const all = Object.values(result.plan.roomsByFloor).flat();
        expect(all.every((r) => r.locked === false)).toBe(true);
        const wohnen = all.find((r) => r.name === "Wohnen");
        expect(wohnen?.openings.some((o) => o.kind === "door")).toBe(true);
        expect(all.find((r) => r.name === "Bad")?.color).toBe("#FECACA");
        const { schemaVersion: _a, underlayByFloor: _u, ...rest } = result.plan;
        const { schemaVersion: _b, underlayByFloor: _w, ...v10Rest } = migrated;
        expect(rest).toEqual(v10Rest);
    });

    it("brings plan-v9.json via 9 → 10 → 11 without any warning but the version", () => {
        const result = analyzePlanFile(planV9Text, "plan-v9.json", { now: new Date(), newId: () => crypto.randomUUID() });
        if (!result.ok) throw new Error(result.error);
        expect(result.plan.schemaVersion).toBe(11);
        expect(result.fileVersion).toBe(9);
        expect(result.invalidRooms).toEqual([]);
        expect(result.invalidOpenings).toEqual([]);
        expect(result.wallIssues).toEqual([]);
        expect(result.invalidShapes).toEqual([]);
        expect(result.settingsIssues).toEqual([]);
        expect(result.colorIssues).toEqual([]);
        const all = Object.values(result.plan.roomsByFloor).flat();
        expect(all.every((r) => r.locked === false)).toBe(true);
        expect(all.flatMap((r) => r.openings).every((o) => o.beforeFullEdge === null)).toBe(true);
    });
});
