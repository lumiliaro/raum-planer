/**
 * Step-by-step conversion of older plan files to the current format version.
 * Migrations work on raw data, never on Zod types of old versions, so no old
 * schema has to stay in the code; the current schema checks the result.
 *
 * Rule: whoever increments `PLAN_SCHEMA_VERSION` adds the migration from the
 * previous version here, together with a fixture of the previous version
 * (see `src/lib/__fixtures__/`) and a test importing it.
 */

import { CalibrationSchema } from "@/lib/calibration-schema";
import { DEFAULT_WALL_THICKNESS_CM } from "@/lib/room-geometry";

/** Converts the raw data of one version to the next one. May throw. */
export type PlanMigration = (data: Record<string, unknown>) => Record<string, unknown>;

/** The fixed floors of version 1, which knew no floor list. Their ids stay. */
const V1_FLOORS = [
    { id: "eg", name: "Erdgeschoss" },
    { id: "og", name: "Obergeschoss" },
    { id: "dg", name: "Dachgeschoss" },
];

/**
 * The factory settings as of version 9, copied on purpose instead of using
 * `FACTORY_SETTINGS`: a later change of the factory settings must not change
 * what the migration 8 → 9 produces.
 */
const V9_FACTORY_SETTINGS = Object.freeze({
    defaultWallThicknessCm: 15,
    wallColor: "#3F3F46",
    defaultRoomColor: null,
    gridStepCm: 100,
    snapStepCm: 5,
    fineSnapStepCm: 1,
    doorWidthCm: 80,
    windowWidthCm: 120,
    passageWidthCm: 100,
});

/** Keyed by the source version: `1` converts 1 → 2. */
export const PLAN_MIGRATIONS: Readonly<Record<number, PlanMigration>> = Object.freeze({
    /**
     * 1 → 2: floors become user data. Adds the former fixed floors; shapes,
     * calibrations and coordinates stay untouched. Missing shape lists are
     * filled by the caller (import, loading), not here.
     */
    1: (data) => ({ ...data, floors: V1_FLOORS.map((floor) => ({ ...floor })) }),
    /**
     * 2 → 3: the scans become underlays. The former floors eg, og, dg – if they
     * are in `floors` – get an underlay without image that keeps their
     * calibration; floors created by the user never had an image. Image pixel
     * (0, 0) stays at (0 cm, 0 cm), so shapes keep their place on the scan.
     */
    2: (data) => {
        const { calibrationByFloor, ...rest } = data;
        const calibrations = isRecord(calibrationByFloor) ? calibrationByFloor : {};
        const floorIds = new Set(
            (Array.isArray(data.floors) ? data.floors : []).map((floor) => (isRecord(floor) ? floor.id : undefined)),
        );
        const underlayByFloor: Record<string, unknown> = {};
        for (const { id } of V1_FLOORS) {
            if (!floorIds.has(id)) continue;
            const raw = Object.hasOwn(calibrations, id) ? calibrations[id] : undefined;
            // An invalid old calibration would make the whole plan unreadable on loading.
            const calibration = CalibrationSchema.safeParse(raw);
            underlayByFloor[id] = {
                imageId: null,
                imageWidthPx: null,
                imageHeightPx: null,
                calibration: calibration.success ? calibration.data : null,
                visible: true,
                opacity: 1,
            };
        }
        return { ...rest, underlayByFloor };
    },
    /**
     * 3 → 4: floors get rooms. Every floor in `floors` gets an empty room list;
     * everything else stays. Without a usable floor list `roomsByFloor` stays
     * empty and the schema check (or the import report) decides.
     */
    3: (data) => {
        const floors = Array.isArray(data.floors) ? data.floors : [];
        const floorIds = floors.flatMap((floor) => (isRecord(floor) && typeof floor.id === "string" ? [floor.id] : []));
        return { ...data, roomsByFloor: Object.fromEntries(floorIds.map((id) => [id, []])) };
    },
    /**
     * 4 → 5: rooms get openings. Every room object in `roomsByFloor` without an
     * `openings` field gets an empty list; all other values stay as they are and
     * the schema check (or the import report) decides.
     */
    4: (data) => mapRooms(data, (room) => (Object.hasOwn(room, "openings") ? room : { ...room, openings: [] })),
    /**
     * 5 → 6: every edge gets a wall thickness. Every room object in
     * `roomsByFloor` without a `wallThicknessCm` field whose `pointsCm` is a list
     * gets `DEFAULT_WALL_THICKNESS_CM` per point (= per edge); all other values
     * stay as they are and the schema check (or the import report) decides.
     */
    5: (data) =>
        mapRooms(data, (room) =>
            !Object.hasOwn(room, "wallThicknessCm") && Array.isArray(room.pointsCm)
                ? { ...room, wallThicknessCm: room.pointsCm.map(() => DEFAULT_WALL_THICKNESS_CM) }
                : room,
        ),
    /**
     * 6 → 7: openings may be passages. Older files have none, so the data stay
     * as they are; only the version number changes.
     */
    6: (data) => ({ ...data }),
    /**
     * 7 → 8: rooms get a color. Every room object in `roomsByFloor` without a
     * `color` field gets `null` („Standard“), so old plans look unchanged; an
     * existing value stays and the schema check (or the import report) decides.
     */
    7: (data) => mapRooms(data, (room) => (Object.hasOwn(room, "color") ? room : { ...room, color: null })),
    /**
     * 8 → 9: the plan gets settings. Without a `settings` field it gets the
     * factory settings of version 9, so old plans behave exactly as before; an
     * existing value stays and the schema check (or the import) decides.
     */
    8: (data) => (Object.hasOwn(data, "settings") ? { ...data } : { ...data, settings: { ...V9_FACTORY_SETTINGS } }),
    /**
     * 9 → 10: windows and passages remember their sizes for „Ganze Kante“.
     * Every opening object without a `beforeFullEdge` field gets `null` (no
     * remembered sizes); an existing value stays and the schema check (or the
     * import) decides. Settings and everything else stay as they are.
     */
    9: (data) =>
        mapRooms(data, (room) =>
            Array.isArray(room.openings)
                ? {
                      ...room,
                      openings: room.openings.map((opening) =>
                          isRecord(opening) && !Object.hasOwn(opening, "beforeFullEdge") ? { ...opening, beforeFullEdge: null } : opening,
                      ),
                  }
                : room,
        ),
    /**
     * 10 → 11: rooms can be locked. Every room object without a `locked`
     * field gets `false` (not locked); an existing value stays and the schema
     * check (or the import) decides. Everything else stays as it is.
     */
    10: (data) => mapRooms(data, (room) => (Object.hasOwn(room, "locked") ? room : { ...room, locked: false })),
});

/**
 * Applies `change` to every room object in `roomsByFloor`; lists that are no
 * arrays and entries that are no objects stay as they are.
 */
function mapRooms(data: Record<string, unknown>, change: (room: Record<string, unknown>) => unknown): Record<string, unknown> {
    if (!isRecord(data.roomsByFloor)) return { ...data };
    const roomsByFloor = Object.fromEntries(
        Object.entries(data.roomsByFloor).map(([floorId, rooms]) => [
            floorId,
            Array.isArray(rooms) ? rooms.map((room) => (isRecord(room) ? change(room) : room)) : rooms,
        ]),
    );
    return { ...data, roomsByFloor };
}

export class MigrationError extends Error {
    readonly fromVersion: number;
    readonly toVersion: number;

    constructor(fromVersion: number, toVersion: number, cause?: unknown) {
        super(`Cannot migrate plan from version ${fromVersion} to ${toVersion}`, { cause });
        this.name = "MigrationError";
        this.fromVersion = fromVersion;
        this.toVersion = toVersion;
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Applies `migrations[from]`, `migrations[from + 1]`, … and sets
 * `schemaVersion` after each step. Throws a `MigrationError` (with `from`/`to`)
 * if a step is missing, throws or returns no object. `from === to` returns `raw`.
 */
export function migratePlanData(
    raw: Record<string, unknown>,
    from: number,
    to: number,
    migrations: Readonly<Record<number, PlanMigration>> = PLAN_MIGRATIONS,
): Record<string, unknown> {
    let data = raw;
    for (let version = from; version < to; version++) {
        const step = Object.hasOwn(migrations, version) ? migrations[version] : undefined;
        if (!step) throw new MigrationError(from, to);
        let next: unknown;
        try {
            next = step(data);
        } catch (error) {
            throw new MigrationError(from, to, error);
        }
        if (!isRecord(next)) throw new MigrationError(from, to);
        data = { ...next, schemaVersion: version + 1 };
    }
    return data;
}
