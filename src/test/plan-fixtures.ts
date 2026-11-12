/** Shapes, rooms, calibrations and underlays shared by plan-related tests. */

import type { Calibration } from "@/lib/calibration-schema";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { DEFAULT_WALL_THICKNESS_CM } from "@/lib/room-geometry";
import { PLAN_SCHEMA_VERSION, type Opening, type Plan, type PointCm, type Room, type Shape, type ShapeStyle, type Underlay } from "@/lib/plan-schema";

export const STYLE: ShapeStyle = { fill: "#E4E4E7", stroke: "#18181B", strokeWidth: 1, opacity: 1 };

/** Deterministic v4 UUID: `uuid(1)` → `00000000-0000-4000-8000-000000000001`. */
export function uuid(n: number): string {
    return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

export function rect(n: number, overrides: Partial<Extract<Shape, { kind: "rect" }>> = {}): Shape {
    return {
        id: uuid(n),
        kind: "rect",
        x: 100,
        y: 100,
        rotationDeg: 0,
        mirrored: false,
        style: STYLE,
        widthCm: 200,
        depthCm: 90,
        cornerRadiusCm: 0,
        ...overrides,
    };
}

/** Corners of an axis-parallel rectangle, clockwise from the top-left one. */
export function rectPoints(x: number, y: number, width: number, height: number): PointCm[] {
    return [
        { x, y },
        { x: x + width, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
    ];
}

/**
 * Room with id `uuid(n)`; by default a 337,5 × 560 cm rectangle at the origin
 * („Wohnen“ from the spec) with 15 cm wall thickness at every edge, no color
 * and not locked.
 */
export function room(
    n: number,
    name = "Wohnen",
    pointsCm: PointCm[] = rectPoints(0, 0, 337.5, 560),
    openings: Opening[] = [],
    wallThicknessCm: number[] = pointsCm.map(() => DEFAULT_WALL_THICKNESS_CM),
    color: string | null = null,
    locked = false,
): Room {
    return { id: uuid(n), name, pointsCm, openings, wallThicknessCm, color, locked };
}

/** Spec example: 1 000 cm between P1 and P2 → 0,9986 px/cm. */
export const CAL_EG = { p1: { x: 120, y: 160.4 }, p2: { x: 1118.6, y: 160.4 }, realLengthCm: 1000, pxPerCm: 0.9986 };
export const CAL_EG_OLD = { p1: { x: 100, y: 100 }, p2: { x: 848, y: 100 }, realLengthCm: 1000, pxPerCm: 0.748 };
export const CAL_OG = { p1: { x: 10, y: 20 }, p2: { x: 747, y: 20 }, realLengthCm: 737, pxPerCm: 1 };

/** Valid image ids (SHA-256 hex): `imageId(1)` → `"000…001"`. */
export function imageId(n: number): string {
    return n.toString(16).padStart(64, "0");
}

/**
 * Visible, fully opaque underlay with a 1240 × 1754 px image `imageId(1)`.
 * `underlay(CAL_EG)` is calibrated, `underlay()` not.
 */
export function underlay(calibration: Calibration | null = null, overrides: Partial<Underlay> = {}): Underlay {
    return {
        imageId: imageId(1),
        imageWidthPx: 1240,
        imageHeightPx: 1754,
        calibration,
        visible: true,
        opacity: 1,
        ...overrides,
    };
}

/** Underlay without image and with unknown size, as created by the migration 2 → 3. */
export function underlayWithoutImage(calibration: Calibration | null = null): Underlay {
    return underlay(calibration, { imageId: null, imageWidthPx: null, imageHeightPx: null });
}

/** The three floors a version-1 plan gets on migration. */
export const LEGACY_FLOORS = [
    { id: "eg", name: "Erdgeschoss" },
    { id: "og", name: "Obergeschoss" },
    { id: "dg", name: "Dachgeschoss" },
];

/** Empty plan with the floors eg, og, dg (like a migrated version-1 plan), the ground floor active, factory settings. */
export function legacyPlan(now: Date): Plan {
    const timestamp = now.toISOString();
    return {
        schemaVersion: PLAN_SCHEMA_VERSION,
        name: "Meine Planung",
        createdAt: timestamp,
        updatedAt: timestamp,
        floors: LEGACY_FLOORS.map((f) => ({ ...f })),
        activeFloorId: "eg",
        underlayByFloor: {},
        shapesByFloor: { eg: [], og: [], dg: [] },
        roomsByFloor: { eg: [], og: [], dg: [] },
        settings: { ...FACTORY_SETTINGS },
    };
}
