/**
 * Checks a plan file completely before anything changes. The result is either
 * an error or a valid plan of the current version plus a report of everything
 * that is not taken over, or only in changed form. Nothing is dropped silently.
 */

import { z } from "zod";
import { CalibrationSchema } from "@/lib/calibration-schema";
import { formatCm, openingKindName } from "@/lib/format";
import { parseDataUrl, type ImageType } from "@/lib/image-data";
import { DEFAULT_PLAN_NAME } from "@/lib/plan";
import { MigrationError, migratePlanData, PLAN_MIGRATIONS, type PlanMigration } from "@/lib/plan-migration";
import {
    BeforeFullEdgeSchema,
    FloorSchema,
    HexColorSchema,
    MAX_FLOOR_NAME_LENGTH,
    MAX_FLOORS,
    PLAN_SCHEMA_VERSION,
    PlanSchema,
    RoomSchema,
    ShapeSchema,
    type Floor,
    type FloorId,
    type ImageId,
    type Opening,
    type Plan,
    type Room,
    type Shape,
    type Underlay,
    UnderlaySchema,
    type Wall,
    WallSchema,
} from "@/lib/plan-schema";
import {
    describeCalibrationIssue,
    describeOpeningIssue,
    describeRoomIssue,
    describeShapeIssue,
    describeUnderlayIssue,
    GENERIC_REASON,
} from "@/lib/shape-issues";
import {
    FACTORY_SETTINGS,
    SETTING_KEYS,
    SETTING_LABELS,
    SETTING_SCHEMAS,
    type PlanSettings,
    type SettingKey,
} from "@/lib/plan-settings";
import { DEFAULT_WALL_THICKNESS_CM, MAX_WALL_THICKNESS_CM } from "@/lib/room-geometry";
import { SHAPE_KIND_LABELS } from "@/lib/shape-kinds";

/** Larger files are rejected before they are read. */
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;

/** An image from the file, read but not yet decoded or stored. */
export interface PendingImage {
    type: ImageType;
    bytes: Uint8Array;
}

/** Result of decoding and hashing one pending image in the browser (`applyImageCheck`). */
export type ImageCheckResult = { ok: true; id: ImageId; widthPx: number; heightPx: number } | { ok: false };

export const IMAGE_MISSING_REASON = "Vorlagenbild fehlt";
export const IMAGE_UNREADABLE_REASON = "Vorlagenbild unlesbar";
/** Shown after a room whose wall thicknesses were (partly) replaced, e.g. „„Bad“ (Obergeschoss): …“. */
export const WALL_ISSUE_REASON = `Wanddicke ungültig, ${formatCm(DEFAULT_WALL_THICKNESS_CM)} verwendet`;

/** Shown after a room whose room color was invalid, e.g. „„Bad“ (Obergeschoss): …“. */
export const COLOR_ISSUE_REASON = "Farbe ungültig, Standard verwendet";

export type ImportErrorKind = "too-large" | "not-json" | "not-a-plan" | "migration-failed";

export type VersionRelation = "same" | "older" | "newer";

/** Plan data that was missing or invalid in the file and got a default value. */
export type FilledMetadata = "name" | "timestamps" | "activeFloor";

export interface InvalidShape {
    floorId: FloorId;
    /** Label, else the German kind name, else „Form“. */
    name: string;
    reason: string;
}

export interface InvalidRoom {
    floorId: FloorId;
    /** Name, else „Raum“. */
    name: string;
    reason: string;
}

export interface InvalidOpening {
    floorId: FloorId;
    /** Name of the room the opening belongs to (the room is taken over). */
    roomName: string;
    /** „Tür“, „Fenster“, „Durchgang“, „Tür oder Fenster“ (unknown kind) or „Türen und Fenster“ (the list was unusable). */
    label: string;
    reason: string;
}

/** A free wall not taken over. Walls have no name; the dialog calls each „Wand“. */
export interface InvalidWall {
    floorId: FloorId;
    reason: string;
}

/** A room taken over whose wall thicknesses were missing, invalid or too many and got replaced. */
export interface WallIssue {
    floorId: FloorId;
    roomName: string;
}

/** A room taken over whose room color was invalid and got replaced by „Standard“ (`null`). */
export interface ColorIssue {
    floorId: FloorId;
    roomName: string;
}

/** A setting that was missing or invalid in the file and got its factory value. */
export interface SettingsIssue {
    key: SettingKey;
    /** German name, e.g. „Rasterabstand“. */
    label: string;
}

/** Shown after a setting's name, e.g. „Einstellung „Rasterabstand“: …“. */
export const SETTINGS_ISSUE_REASON = "ungültig, Werkseinstellung verwendet";

/** Number of doors, windows and passages taken over, on all floors. */
export interface OpeningCounts {
    doors: number;
    windows: number;
    passages: number;
}

export interface InvalidFloor {
    /** Name, else id, else „Etage“. */
    label: string;
    reason: string;
}

export interface UnknownFloor {
    floorId: string;
    /** Names of its shapes in file order (label, else kind name, else „Form“). */
    names: string[];
    /** Names of its rooms in file order (name, else „Raum“). */
    roomNames: string[];
    /** Number of its free walls. */
    wallCount: number;
}

/** An underlay not taken over, or only in changed form (e.g. without calibration). */
export interface UnderlayIssue {
    /** `null`: `underlayByFloor` as a whole was unusable. */
    floorId: string | null;
    reason: string;
}

export interface ImportFailure {
    ok: false;
    fileName: string;
    error: ImportErrorKind;
    /** Set for `migration-failed`. */
    fromVersion?: number;
    toVersion?: number;
}

export interface ImportSuccess {
    ok: true;
    fileName: string;
    fileVersion: number;
    appVersion: number;
    relation: VersionRelation;
    /** Valid plan of the current version, ready for `replacePlan`. */
    plan: Plan;
    /** The floors taken over, in file order (= `plan.floors`). */
    floors: Floor[];
    /** Number of shapes per floor taken over, in floor order. */
    countsByFloor: Record<FloorId, number>;
    /** Number of rooms per floor taken over, in floor order. */
    roomCountsByFloor: Record<FloorId, number>;
    /** Number of free walls taken over, on all floors. */
    wallCount: number;
    /** Floor entries not taken over, in file order. */
    invalidFloors: InvalidFloor[];
    unknownFloors: UnknownFloor[];
    invalidShapes: InvalidShape[];
    invalidRooms: InvalidRoom[];
    /** Free walls not taken over, in floor and file order. */
    invalidWalls: InvalidWall[];
    /** Openings not taken over (their rooms are), in floor and file order. */
    invalidOpenings: InvalidOpening[];
    /** Rooms taken over with replaced wall thicknesses, in floor and file order. */
    wallIssues: WallIssue[];
    /** Rooms taken over without their invalid room color, in floor and file order. */
    colorIssues: ColorIssue[];
    /** Settings replaced by their factory value, in the order of the dialog. */
    settingsIssues: SettingsIssue[];
    openingCounts: OpeningCounts;
    underlayIssues: UnderlayIssue[];
    /**
     * Images of the file the plan's underlays refer to, by id; stored in the
     * browser only when the import is confirmed. Checked by `applyImageCheck`.
     */
    pendingImages: ReadonlyMap<ImageId, PendingImage>;
    /** Number of shapes whose id already occurred earlier in the file. */
    reassignedIds: number;
    /** Number of rooms whose id already occurred earlier in the file. */
    reassignedRoomIds: number;
    /** Number of openings whose id already occurred earlier in the file. */
    reassignedOpeningIds: number;
    /** Number of free walls whose id already occurred earlier in the file. */
    reassignedWallIds: number;
    filledMetadata: FilledMetadata[];
    /** Version differs or anything above is not empty → „Trotzdem importieren“. */
    hasWarnings: boolean;
}

export type ImportAnalysis = ImportFailure | ImportSuccess;

export interface AnalyzeOptions {
    /** Only adjustable for tests. */
    appVersion?: number;
    migrations?: Readonly<Record<number, PlanMigration>>;
    now: Date;
    newId: () => string;
}

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasShapeLists(data: RawRecord): data is RawRecord & { shapesByFloor: Record<string, unknown[]> } {
    return isRecord(data.shapesByFloor) && Object.values(data.shapesByFloor).every(Array.isArray);
}

/** `roomsByFloor` is missing (no rooms) or a record of lists. */
function hasRoomListsOrNone(data: RawRecord): boolean {
    return data.roomsByFloor === undefined || (isRecord(data.roomsByFloor) && Object.values(data.roomsByFloor).every(Array.isArray));
}

/** Label of an opening in the report by its kind. */
function openingLabel(raw: unknown): string {
    const kind = isRecord(raw) ? raw.kind : undefined;
    if (kind === "door" || kind === "window" || kind === "passage") return openingKindName(kind);
    return "Tür oder Fenster";
}

const isValidWallThickness = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0 && value <= MAX_WALL_THICKNESS_CM;

/**
 * One wall thickness per edge: every valid value (more than 0, at most
 * `MAX_WALL_THICKNESS_CM`) at an index below `edgeCount` stays, every other
 * edge gets `DEFAULT_WALL_THICKNESS_CM`, surplus values are dropped. `changed`
 * if anything was replaced or dropped, also for a missing list.
 */
export function sanitizeWallThicknesses(raw: unknown, edgeCount: number): { values: number[]; changed: boolean } {
    const list = Array.isArray(raw) ? raw : [];
    let changed = !Array.isArray(raw) || list.length !== edgeCount;
    const values = Array.from({ length: edgeCount }, (_, i) => {
        const value: unknown = list[i];
        if (isValidWallThickness(value)) return value;
        changed = true;
        return DEFAULT_WALL_THICKNESS_CM;
    });
    return { values, changed };
}

/**
 * The opening with valid remembered sizes for „Ganze Kante“ or `null` instead:
 * a missing or invalid value and any value of a door become `null`, without a
 * notice, as the value is not visible and the opening itself stays usable.
 * Anything that is no object stays as it is for the opening check.
 */
export function sanitizeBeforeFullEdge(raw: unknown): unknown {
    if (!isRecord(raw)) return raw;
    const parsed = BeforeFullEdgeSchema.safeParse(raw.beforeFullEdge);
    const keep = parsed.success && raw.kind !== "door";
    return { ...raw, beforeFullEdge: keep ? parsed.data : null };
}

/**
 * The room (checked without its openings and with sanitized wall thicknesses,
 * see `sanitizeWallThicknesses`) with every opening that passes
 * `OpeningSchema` (remembered sizes sanitized, see `sanitizeBeforeFullEdge`)
 * and fits the room; the others are reported one by one. A
 * missing list means no openings, a list that is no array is reported once.
 * `wallsReplaced` tells whether wall thicknesses were replaced. A missing room
 * color becomes `null` silently, an invalid one `null` with `colorReplaced`.
 * A lock that is no boolean (missing, text, number) becomes `false` silently,
 * so it never discards the room.
 */
function readRoom(
    raw: unknown,
    floorId: FloorId,
):
    | { room: Room; invalidOpenings: InvalidOpening[]; wallsReplaced: boolean; colorReplaced: boolean }
    | { room: null; error: z.ZodError } {
    const rawOpenings = isRecord(raw) ? raw.openings : undefined;
    const edgeCount = isRecord(raw) && Array.isArray(raw.pointsCm) ? raw.pointsCm.length : 0;
    const walls = sanitizeWallThicknesses(isRecord(raw) ? raw.wallThicknessCm : undefined, edgeCount);
    const rawColor = isRecord(raw) ? raw.color : undefined;
    const colorReplaced = rawColor !== undefined && !HexColorSchema.nullable().safeParse(rawColor).success;
    const color = rawColor === undefined || colorReplaced ? null : rawColor;
    const locked = isRecord(raw) && typeof raw.locked === "boolean" ? raw.locked : false;
    const result = RoomSchema.safeParse(isRecord(raw) ? { ...raw, openings: [], wallThicknessCm: walls.values, color, locked } : raw);
    if (!result.success) return { room: null, error: result.error };
    const room = result.data;
    const invalidOpenings: InvalidOpening[] = [];
    const openings: Opening[] = [];
    if (rawOpenings !== undefined && !Array.isArray(rawOpenings)) {
        invalidOpenings.push({ floorId, roomName: room.name, label: "Türen und Fenster", reason: GENERIC_REASON });
    }
    for (const rawOpening of Array.isArray(rawOpenings) ? rawOpenings : []) {
        const check = RoomSchema.safeParse({ ...room, openings: [sanitizeBeforeFullEdge(rawOpening)] });
        if (check.success) openings.push(check.data.openings[0]);
        else {
            const reason = describeOpeningIssue(check.error, rawOpening);
            invalidOpenings.push({ floorId, roomName: room.name, label: openingLabel(rawOpening), reason });
        }
    }
    return { room: { ...room, openings }, invalidOpenings, wallsReplaced: walls.changed, colorReplaced };
}

/**
 * Gives every opening whose id already occurred (in floor and room order) a
 * new id that occurs nowhere among the file's openings; the first one keeps it.
 */
function reassignDuplicateOpeningIds(
    floors: readonly Floor[],
    roomsByFloor: Record<FloorId, Room[]>,
    newId: () => string,
): { result: Record<FloorId, Room[]>; reassigned: number } {
    const all = floors.flatMap(({ id }) => roomsByFloor[id].flatMap((room) => room.openings));
    const idsInFile = new Set(all.map((o) => o.id));
    const seen = new Set<string>();
    let reassigned = 0;
    const result: Record<FloorId, Room[]> = {};
    for (const { id: floorId } of floors) {
        result[floorId] = roomsByFloor[floorId].map((room) => {
            let changed = false;
            const openings = room.openings.map((opening) => {
                if (!seen.has(opening.id)) {
                    seen.add(opening.id);
                    return opening;
                }
                let id = newId();
                while (seen.has(id) || idsInFile.has(id)) id = newId();
                seen.add(id);
                reassigned++;
                changed = true;
                return { ...opening, id };
            });
            return changed ? { ...room, openings } : room;
        });
    }
    return { result, reassigned };
}

/** Name of a room in the report: its name, else „Raum“. */
function roomName(raw: unknown): string {
    return isRecord(raw) && nonBlank(raw.name) ? raw.name.trim() : "Raum";
}

/**
 * Gives every item whose id already occurred (in floor order) a new id that
 * occurs nowhere in `byFloor`; the first occurrence keeps its id.
 */
function reassignDuplicateIds<T extends { id: string }>(
    floors: readonly Floor[],
    byFloor: ReadonlyMap<FloorId, T[]>,
    newId: () => string,
): { result: Record<FloorId, T[]>; reassigned: number } {
    const idsInFile = new Set([...byFloor.values()].flat().map((item) => item.id));
    const seen = new Set<string>();
    let reassigned = 0;
    const result: Record<FloorId, T[]> = {};
    for (const { id: floorId } of floors) {
        result[floorId] = byFloor.get(floorId)!.map((item) => {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                return item;
            }
            let id = newId();
            while (seen.has(id) || idsInFile.has(id)) id = newId();
            seen.add(id);
            reassigned++;
            return { ...item, id };
        });
    }
    return { result, reassigned };
}

/** `wallsByFloor` as a record; missing or no object means no walls (nothing to report). */
function rawWallLists(raw: unknown): RawRecord {
    return isRecord(raw) ? raw : {};
}

/** German reason why `WallSchema` rejected a free wall. */
export function describeWallIssue(error: z.ZodError, raw: unknown): string {
    if (!isRecord(raw)) return GENERIC_REASON;
    const at = (key: string) => error.issues.some((issue) => issue.path[0] === key);
    if (at("startCm") || at("endCm")) {
        const zeroLength = error.issues.every((issue) => issue.code === "custom" && issue.message === "Wall of 0 cm");
        return zeroLength ? "Wand hat keine Länge" : "Punkte ungültig";
    }
    if (at("thicknessCm")) return "Dicke ungültig";
    return GENERIC_REASON;
}

/** Name of a shape in the report: label, else the German kind name, else „Form“. */
function shapeName(raw: unknown): string {
    if (!isRecord(raw)) return "Form";
    if (typeof raw.label === "string" && raw.label.trim() !== "") return raw.label.trim();
    if (typeof raw.kind === "string" && Object.hasOwn(SHAPE_KIND_LABELS, raw.kind)) {
        return SHAPE_KIND_LABELS[raw.kind as Shape["kind"]];
    }
    return "Form";
}

const IsoDateTimeSchema = z.iso.datetime();

const nonBlank = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** Label of a floor entry in the report: name, else id, else „Etage“. */
function floorLabel(raw: unknown): string {
    if (!isRecord(raw)) return "Etage";
    if (nonBlank(raw.name)) return raw.name.trim();
    if (nonBlank(raw.id)) return raw.id;
    return "Etage";
}

/** German reason why `FloorSchema` rejected a floor entry. */
function describeFloorIssue(raw: unknown): string {
    if (!isRecord(raw)) return "Angaben ungültig";
    if (typeof raw.id !== "string" || raw.id === "") return "Kennung fehlt";
    if (!nonBlank(raw.name)) return "Name fehlt";
    if (raw.name.trim().length > MAX_FLOOR_NAME_LENGTH) return "Name zu lang";
    return "Angaben ungültig";
}

/**
 * Valid floor entries in file order, at most `MAX_FLOORS`, each id once.
 * Every other entry is reported with its reason.
 */
function readFloors(rawFloors: unknown[]): { floors: Floor[]; invalidFloors: InvalidFloor[] } {
    const floors: Floor[] = [];
    const invalidFloors: InvalidFloor[] = [];
    for (const raw of rawFloors) {
        const result = FloorSchema.safeParse(raw);
        const label = floorLabel(raw);
        if (!result.success) invalidFloors.push({ label, reason: describeFloorIssue(raw) });
        else if (floors.some((f) => f.id === result.data.id)) invalidFloors.push({ label, reason: "Kennung doppelt" });
        else if (floors.length >= MAX_FLOORS) invalidFloors.push({ label, reason: `Höchstens ${MAX_FLOORS} Etagen` });
        else floors.push(result.data);
    }
    return { floors, invalidFloors };
}

/**
 * Valid underlays of known floors. An underlay whose only fault is its
 * calibration is taken over without it; every other fault drops the underlay.
 * Both are reported, as are underlays of unknown floors.
 */
function readUnderlays(
    raw: unknown,
    isFloorId: (value: unknown) => value is FloorId,
): { underlayByFloor: Partial<Record<FloorId, Underlay>>; underlayIssues: UnderlayIssue[] } {
    const underlayByFloor: Partial<Record<FloorId, Underlay>> = {};
    const underlayIssues: UnderlayIssue[] = [];
    if (raw === undefined) return { underlayByFloor, underlayIssues };
    if (!isRecord(raw)) return { underlayByFloor, underlayIssues: [{ floorId: null, reason: GENERIC_REASON }] };
    for (const [floorId, rawUnderlay] of Object.entries(raw)) {
        if (!isFloorId(floorId)) {
            underlayIssues.push({ floorId, reason: "Etage unbekannt" });
            continue;
        }
        const result = UnderlaySchema.safeParse(rawUnderlay);
        if (result.success) {
            underlayByFloor[floorId] = result.data;
            continue;
        }
        const withoutCalibration =
            isRecord(rawUnderlay) && rawUnderlay.calibration != null
                ? UnderlaySchema.safeParse({ ...rawUnderlay, calibration: null })
                : null;
        const calibration = CalibrationSchema.safeParse(isRecord(rawUnderlay) ? rawUnderlay.calibration : undefined);
        if (withoutCalibration?.success && !calibration.success) {
            underlayByFloor[floorId] = withoutCalibration.data;
            const reason = describeCalibrationIssue(calibration.error, (rawUnderlay as RawRecord).calibration);
            underlayIssues.push({ floorId, reason: `${reason} – ohne Kalibrierung übernommen` });
        } else {
            // Describe the fault that drops the underlay, not a calibration fault next to it.
            const error = withoutCalibration && !withoutCalibration.success ? withoutCalibration.error : result.error;
            underlayIssues.push({ floorId, reason: describeUnderlayIssue(error, rawUnderlay) });
        }
    }
    return { underlayByFloor, underlayIssues };
}

/**
 * Images of the underlays taken over, from the file's `images`. An underlay
 * whose image is missing or no PNG/JPEG/WebP data URL is taken over without
 * image (sizes and calibration stay) and reported. Images no underlay refers
 * to are skipped.
 */
function readImages(
    rawImages: unknown,
    underlayByFloor: Partial<Record<FloorId, Underlay>>,
    floors: readonly Floor[],
): { underlayByFloor: Partial<Record<FloorId, Underlay>>; imageIssues: UnderlayIssue[]; pendingImages: Map<ImageId, PendingImage> } {
    const images = isRecord(rawImages) ? rawImages : {};
    const pendingImages = new Map<ImageId, PendingImage>();
    const imageIssues: UnderlayIssue[] = [];
    const result: Partial<Record<FloorId, Underlay>> = {};
    // Floor order, so the report lists the floors as the dialog does.
    for (const { id: floorId } of floors) {
        const underlay = underlayByFloor[floorId];
        if (!underlay) continue;
        const { imageId } = underlay;
        if (imageId === null || pendingImages.has(imageId)) {
            result[floorId] = underlay;
            continue;
        }
        const raw = Object.hasOwn(images, imageId) ? images[imageId] : undefined;
        const image = raw === undefined ? null : parseDataUrl(raw);
        if (image) {
            pendingImages.set(imageId, image);
            result[floorId] = underlay;
        } else {
            result[floorId] = { ...underlay, imageId: null };
            imageIssues.push({ floorId, reason: raw === undefined ? IMAGE_MISSING_REASON : IMAGE_UNREADABLE_REASON });
        }
    }
    return { underlayByFloor: result, imageIssues, pendingImages };
}

type WarningParts = Pick<
    ImportSuccess,
    | "relation"
    | "invalidFloors"
    | "unknownFloors"
    | "invalidShapes"
    | "invalidRooms"
    | "invalidOpenings"
    | "invalidWalls"
    | "wallIssues"
    | "colorIssues"
    | "settingsIssues"
    | "underlayIssues"
    | "reassignedIds"
    | "reassignedRoomIds"
    | "reassignedOpeningIds"
    | "reassignedWallIds"
    | "filledMetadata"
>;

/** Version differs or anything is not taken over, or only in changed form → „Trotzdem importieren“. */
function computeHasWarnings(parts: WarningParts): boolean {
    return (
        parts.relation !== "same" ||
        parts.invalidFloors.length > 0 ||
        parts.unknownFloors.length > 0 ||
        parts.invalidShapes.length > 0 ||
        parts.invalidRooms.length > 0 ||
        parts.invalidOpenings.length > 0 ||
        parts.invalidWalls.length > 0 ||
        parts.wallIssues.length > 0 ||
        parts.colorIssues.length > 0 ||
        parts.settingsIssues.length > 0 ||
        parts.underlayIssues.length > 0 ||
        parts.reassignedIds > 0 ||
        parts.reassignedRoomIds > 0 ||
        parts.reassignedOpeningIds > 0 ||
        parts.reassignedWallIds > 0 ||
        parts.filledMetadata.length > 0
    );
}

/**
 * Merges the browser's check of the pending images into the analysis: real
 * pixel sizes, the id computed from the bytes when the file's differs, and an
 * undecodable image becomes „Vorlagenbild unlesbar“ (underlay without image).
 * `results` is keyed by the ids of `pendingImages`.
 */
export function applyImageCheck(analysis: ImportSuccess, results: ReadonlyMap<ImageId, ImageCheckResult>): ImportSuccess {
    const underlayByFloor: Partial<Record<FloorId, Underlay>> = {};
    const pendingImages = new Map<ImageId, PendingImage>();
    const issues: UnderlayIssue[] = [];
    for (const { id: floorId } of analysis.floors) {
        const underlay = analysis.plan.underlayByFloor[floorId];
        if (!underlay) continue;
        const pending = underlay.imageId === null ? undefined : analysis.pendingImages.get(underlay.imageId);
        const check = underlay.imageId === null ? undefined : results.get(underlay.imageId);
        if (!pending || !check) {
            underlayByFloor[floorId] = underlay;
        } else if (!check.ok) {
            underlayByFloor[floorId] = { ...underlay, imageId: null };
            issues.push({ floorId, reason: IMAGE_UNREADABLE_REASON });
        } else {
            underlayByFloor[floorId] = { ...underlay, imageId: check.id, imageWidthPx: check.widthPx, imageHeightPx: check.heightPx };
            pendingImages.set(check.id, pending);
        }
    }
    const underlayIssues = [...analysis.underlayIssues, ...issues];
    const plan = { ...analysis.plan, underlayByFloor };
    const next = { ...analysis, plan, underlayIssues, pendingImages };
    return { ...next, hasWarnings: computeHasWarnings(next) };
}

/**
 * The plan's settings from the file. Missing as a whole → the factory
 * settings without report. Otherwise every value is checked on its own; a
 * missing or invalid one gets its factory value and is reported. A fine snap
 * step larger than the snap step afterwards becomes its factory value, or the
 * snap step if that is smaller, and is reported too.
 */
export function readSettings(raw: unknown): { settings: PlanSettings; settingsIssues: SettingsIssue[] } {
    if (raw === undefined) return { settings: { ...FACTORY_SETTINGS }, settingsIssues: [] };
    const values: RawRecord = isRecord(raw) ? raw : {};
    const invalid = new Set<SettingKey>();
    const settings = { ...FACTORY_SETTINGS } as Record<SettingKey, unknown>;
    for (const key of SETTING_KEYS) {
        const result = SETTING_SCHEMAS[key].safeParse(Object.hasOwn(values, key) ? values[key] : undefined);
        if (result.success) settings[key] = result.data;
        else invalid.add(key);
    }
    const checked = settings as PlanSettings;
    if (checked.fineSnapStepCm > checked.snapStepCm) {
        checked.fineSnapStepCm = Math.min(FACTORY_SETTINGS.fineSnapStepCm, checked.snapStepCm);
        invalid.add("fineSnapStepCm");
    }
    const settingsIssues = SETTING_KEYS.filter((key) => invalid.has(key)).map((key) => ({ key, label: SETTING_LABELS[key] }));
    return { settings: checked, settingsIssues };
}

export function failure(fileName: string, error: ImportErrorKind, versions?: { from: number; to: number }): ImportFailure {
    return versions
        ? { ok: false, fileName, error, fromVersion: versions.from, toVersion: versions.to }
        : { ok: false, fileName, error };
}

export function analyzePlanFile(
    text: string,
    fileName: string,
    { appVersion = PLAN_SCHEMA_VERSION, migrations = PLAN_MIGRATIONS, now, newId }: AnalyzeOptions,
): ImportAnalysis {
    // 1. JSON
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return failure(fileName, "not-json");
    }

    // 2. Envelope
    if (!isRecord(parsed)) return failure(fileName, "not-a-plan");
    const fileVersion = parsed.schemaVersion;
    if (typeof fileVersion !== "number" || !Number.isInteger(fileVersion) || fileVersion < 1) {
        return failure(fileName, "not-a-plan");
    }
    if (!hasShapeLists(parsed) || !hasRoomListsOrNone(parsed)) return failure(fileName, "not-a-plan");

    // 3. Version
    const relation: VersionRelation = fileVersion === appVersion ? "same" : fileVersion < appVersion ? "older" : "newer";
    let data: RawRecord = parsed;
    if (relation === "older") {
        const versions = { from: fileVersion, to: appVersion };
        try {
            data = migratePlanData(parsed, fileVersion, appVersion, migrations);
        } catch (error) {
            if (error instanceof MigrationError) return failure(fileName, "migration-failed", versions);
            throw error;
        }
        if (!hasShapeLists(data) || !hasRoomListsOrNone(data)) return failure(fileName, "migration-failed", versions);
    }
    const rawShapesByFloor = data.shapesByFloor as Record<string, unknown[]>;
    const rawRoomsByFloor = (data.roomsByFloor ?? {}) as Record<string, unknown[]>;

    // Floors: only after the migration, since version-1 files have none
    if (!Array.isArray(data.floors)) return failure(fileName, "not-a-plan");
    const { floors, invalidFloors } = readFloors(data.floors);
    if (floors.length === 0) return failure(fileName, "not-a-plan");
    const floorIds = new Set(floors.map((f) => f.id));
    const isFloorId = (value: unknown): value is FloorId => typeof value === "string" && floorIds.has(value);

    // 4. Shapes of the floors taken over, in floor order
    const invalidShapes: InvalidShape[] = [];
    const validByFloor = new Map<FloorId, Shape[]>();
    for (const { id: floorId } of floors) {
        const rawShapes = Object.hasOwn(rawShapesByFloor, floorId) ? rawShapesByFloor[floorId] : [];
        const valid: Shape[] = [];
        for (const raw of rawShapes) {
            const result = ShapeSchema.safeParse(raw);
            if (result.success) valid.push(result.data);
            else invalidShapes.push({ floorId, name: shapeName(raw), reason: describeShapeIssue(result.error, raw) });
        }
        validByFloor.set(floorId, valid);
    }

    // Duplicate ids: the first occurrence keeps its id; new ids never collide with any id in the file.
    const { result: shapesByFloor, reassigned: reassignedIds } = reassignDuplicateIds(floors, validByFloor, newId);
    const countsByFloor = Object.fromEntries(floors.map(({ id }) => [id, shapesByFloor[id].length]));

    // 5. Rooms of the floors taken over, in floor order; a missing list means no rooms.
    //    Each room is checked without its openings, then each opening on its own.
    const invalidRooms: InvalidRoom[] = [];
    const invalidOpenings: InvalidOpening[] = [];
    const wallIssues: WallIssue[] = [];
    const colorIssues: ColorIssue[] = [];
    const validRoomsByFloor = new Map<FloorId, Room[]>();
    for (const { id: floorId } of floors) {
        const rawRooms = Object.hasOwn(rawRoomsByFloor, floorId) ? rawRoomsByFloor[floorId] : [];
        const valid: Room[] = [];
        for (const raw of rawRooms) {
            const read = readRoom(raw, floorId);
            if (read.room === null) {
                invalidRooms.push({ floorId, name: roomName(raw), reason: describeRoomIssue(read.error, raw) });
                continue;
            }
            valid.push(read.room);
            invalidOpenings.push(...read.invalidOpenings);
            if (read.wallsReplaced) wallIssues.push({ floorId, roomName: read.room.name });
            if (read.colorReplaced) colorIssues.push({ floorId, roomName: read.room.name });
        }
        validRoomsByFloor.set(floorId, valid);
    }
    const { result: roomsWithUniqueIds, reassigned: reassignedRoomIds } = reassignDuplicateIds(floors, validRoomsByFloor, newId);
    const roomCountsByFloor = Object.fromEntries(floors.map(({ id }) => [id, roomsWithUniqueIds[id].length]));
    const { result: roomsByFloor, reassigned: reassignedOpeningIds } = reassignDuplicateOpeningIds(
        floors,
        roomsWithUniqueIds,
        newId,
    );
    const allOpenings = floors.flatMap(({ id }) => roomsByFloor[id].flatMap((room) => room.openings));
    const openingCounts: OpeningCounts = {
        doors: allOpenings.filter((o) => o.kind === "door").length,
        windows: allOpenings.filter((o) => o.kind === "window").length,
        passages: allOpenings.filter((o) => o.kind === "passage").length,
    };

    // 5b. Free walls of the floors taken over, in floor order; a missing list means no walls.
    const rawWallsByFloor = rawWallLists(data.wallsByFloor);
    const invalidWalls: InvalidWall[] = [];
    const validWallsByFloor = new Map<FloorId, Wall[]>();
    for (const { id: floorId } of floors) {
        const rawWalls = Object.hasOwn(rawWallsByFloor, floorId) ? rawWallsByFloor[floorId] : [];
        const valid: Wall[] = [];
        if (!Array.isArray(rawWalls)) invalidWalls.push({ floorId, reason: GENERIC_REASON });
        for (const raw of Array.isArray(rawWalls) ? rawWalls : []) {
            const result = WallSchema.safeParse(raw);
            if (result.success) valid.push(result.data);
            else invalidWalls.push({ floorId, reason: describeWallIssue(result.error, raw) });
        }
        validWallsByFloor.set(floorId, valid);
    }
    const { result: wallsByFloor, reassigned: reassignedWallIds } = reassignDuplicateIds(floors, validWallsByFloor, newId);
    const wallCount = floors.reduce((sum, { id }) => sum + wallsByFloor[id].length, 0);

    // 6. Unknown floors (also those of rejected floor entries): reported with their shapes, rooms and walls, never taken over
    const unknownIds = [
        ...new Set([...Object.keys(rawShapesByFloor), ...Object.keys(rawRoomsByFloor), ...Object.keys(rawWallsByFloor)]),
    ].filter((floorId) => !isFloorId(floorId));
    const unknownFloors: UnknownFloor[] = unknownIds.map((floorId) => {
        const rawWalls = Object.hasOwn(rawWallsByFloor, floorId) ? rawWallsByFloor[floorId] : [];
        return {
            floorId,
            names: (Object.hasOwn(rawShapesByFloor, floorId) ? rawShapesByFloor[floorId] : []).map(shapeName),
            roomNames: (Object.hasOwn(rawRoomsByFloor, floorId) ? rawRoomsByFloor[floorId] : []).map(roomName),
            wallCount: Array.isArray(rawWalls) ? rawWalls.length : 0,
        };
    });

    // 7. Underlays of the floors taken over; only an invalid calibration keeps the underlay (without it)
    const underlays = readUnderlays(data.underlayByFloor, isFloorId);

    // 8. Images of these underlays from the file
    const { underlayByFloor, imageIssues, pendingImages } = readImages(data.images, underlays.underlayByFloor, floors);
    const underlayIssues = [...underlays.underlayIssues, ...imageIssues];

    // 9. Plan data
    const filledMetadata: FilledMetadata[] = [];
    let name = typeof data.name === "string" ? data.name.trim() : "";
    if (name === "") {
        name = DEFAULT_PLAN_NAME;
        filledMetadata.push("name");
    }
    let createdAt = data.createdAt;
    let updatedAt = data.updatedAt;
    if (!IsoDateTimeSchema.safeParse(createdAt).success || !IsoDateTimeSchema.safeParse(updatedAt).success) {
        createdAt = updatedAt = now.toISOString();
        filledMetadata.push("timestamps");
    }
    let activeFloorId = data.activeFloorId;
    if (!isFloorId(activeFloorId)) {
        activeFloorId = floors[0].id;
        filledMetadata.push("activeFloor");
    }

    // 10. Settings; every invalid value gets its factory value
    const { settings, settingsIssues } = readSettings(data.settings);

    // 11. Build the plan; must succeed after the steps above, but never crash the app
    const built = PlanSchema.safeParse({
        schemaVersion: PLAN_SCHEMA_VERSION,
        name,
        createdAt,
        updatedAt,
        floors,
        activeFloorId,
        underlayByFloor,
        shapesByFloor,
        roomsByFloor,
        wallsByFloor,
        settings,
    });
    if (!built.success) return failure(fileName, "not-a-plan");

    const hasWarnings = computeHasWarnings({
        relation,
        invalidFloors,
        unknownFloors,
        invalidShapes,
        invalidRooms,
        invalidOpenings,
        invalidWalls,
        wallIssues,
        colorIssues,
        settingsIssues,
        underlayIssues,
        reassignedIds,
        reassignedRoomIds,
        reassignedOpeningIds,
        reassignedWallIds,
        filledMetadata,
    });

    return {
        ok: true,
        fileName,
        fileVersion,
        appVersion,
        relation,
        plan: built.data,
        floors: built.data.floors,
        countsByFloor,
        roomCountsByFloor,
        wallCount,
        invalidFloors,
        unknownFloors,
        invalidShapes,
        invalidRooms,
        invalidOpenings,
        invalidWalls,
        wallIssues,
        colorIssues,
        settingsIssues,
        openingCounts,
        underlayIssues,
        pendingImages,
        reassignedIds,
        reassignedRoomIds,
        reassignedOpeningIds,
        reassignedWallIds,
        filledMetadata,
        hasWarnings,
    };
}
