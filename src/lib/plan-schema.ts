/**
 * Zod schema of the plan – the single source of the plan and shape types.
 * The browser storage and the later export file use exactly this format.
 * Any change to the format increments `PLAN_SCHEMA_VERSION`.
 */

import { z } from "zod";
import { CalibrationSchema } from "@/lib/calibration-schema";
import { HexColorSchema } from "@/lib/color-schema";
import { openingMisfit } from "@/lib/opening-geometry";
import { PlanSettingsSchema } from "@/lib/plan-settings";
import { hasNoZeroEdges, isSimplePolygon, MAX_WALL_THICKNESS_CM } from "@/lib/room-geometry";

export { HexColorSchema };

export const PLAN_SCHEMA_VERSION = 11;

/** Upper limit of floors in a plan. */
export const MAX_FLOORS = 8;
/** Upper limit of a floor name's length (after trimming). */
export const MAX_FLOOR_NAME_LENGTH = 40;

/**
 * Floor ids are free strings: `eg`/`og`/`dg` for floors taken over from
 * version 1, `crypto.randomUUID()` for new ones. Consistency with the plan's
 * floor list is checked by `PlanSchema`.
 */
export type FloorId = string;

const FloorIdSchema = z.string().min(1).max(64);

export const FloorSchema = z.object({
    id: FloorIdSchema,
    name: z.string().trim().min(1).max(MAX_FLOOR_NAME_LENGTH),
});

/** A point in cm. In a polygon: relative to the shape's center; in a room: absolute. */
export const PointCmSchema = z.object({
    x: z.number(),
    y: z.number(),
});

/** Upper limit of a room name's length (after trimming). */
export const MAX_ROOM_NAME_LENGTH = 40;

/**
 * Swing of a door, relative to the edge direction (start → end point):
 * `hinge` = the end of the opening the leaf is hinged at, `side` = whether it
 * opens into the room or out of it. The UI speaks of left/right seen from inside
 * (see `opening-geometry.ts`).
 */
export const SwingSchema = z.object({
    hinge: z.enum(["start", "end"]),
    side: z.enum(["inside", "outside"]),
});

/**
 * Sizes a window or passage had before „Ganze Kante“ was checked; unchecking
 * restores them (see `toggleFullEdge` in `opening-fields.ts`). Whether they
 * still fit on the edge is checked only when unchecking, as the edge may
 * change in between.
 */
export const BeforeFullEdgeSchema = z.object({
    offsetCm: z.number().min(0),
    widthCm: z.number().positive(),
});

/**
 * A door, window or passage (open piece of wall without leaf) on an edge of
 * its room. `offsetCm` runs from the edge's start point to the start of the
 * opening. A door always has a swing, a window or passage never. Only a window
 * or passage may remember sizes for „Ganze Kante“ (`beforeFullEdge`). Whether
 * it fits on its edge is checked by `RoomSchema`.
 */
export const OpeningSchema = z
    .object({
        id: z.uuid(),
        kind: z.enum(["door", "window", "passage"]),
        edgeIndex: z.number().int().min(0),
        offsetCm: z.number().min(0),
        widthCm: z.number().positive(),
        swing: SwingSchema.nullable(),
        /** `null` = no remembered sizes. */
        beforeFullEdge: BeforeFullEdgeSchema.nullable(),
    })
    .refine((o) => (o.kind === "door") === (o.swing !== null), {
        message: "A door needs a swing, a window or passage must not have one",
        path: ["swing"],
    })
    .refine((o) => o.kind !== "door" || o.beforeFullEdge === null, {
        message: "A door does not remember sizes for the full edge",
        path: ["beforeFullEdge"],
    });

/**
 * A room: the closed outline of its inner dimensions, absolute points in cm.
 * The last edge runs from the last point back to the first. No edge of 0 cm,
 * no self-intersection. Every opening lies on an existing edge and fits on it.
 * `wallThicknessCm[i]` is the wall thickness of edge `i`, one value per edge.
 * `color` is the room color; `null` = „Standard“ (half-transparent white).
 * `locked` protects the room: it cannot be moved, its corners and wall
 * thicknesses cannot be changed and it cannot be deleted (enforced by the
 * store, see `room-lock.ts`). Name, color and openings stay editable.
 */
export const RoomSchema = z
    .object({
        id: z.uuid(),
        name: z.string().trim().min(1).max(MAX_ROOM_NAME_LENGTH),
        pointsCm: z.array(PointCmSchema).min(3),
        openings: z.array(OpeningSchema),
        wallThicknessCm: z.array(z.number().positive().max(MAX_WALL_THICKNESS_CM)),
        color: HexColorSchema.nullable(),
        locked: z.boolean(),
    })
    .refine((room) => room.wallThicknessCm.length === room.pointsCm.length, {
        message: "One wall thickness per edge",
        path: ["wallThicknessCm"],
    })
    .refine((room) => hasNoZeroEdges(room.pointsCm), { message: "Edge of 0 cm", path: ["pointsCm"] })
    .refine((room) => isSimplePolygon(room.pointsCm), { message: "Outline intersects itself", path: ["pointsCm"] })
    .superRefine((room, ctx) => {
        room.openings.forEach((opening, index) => {
            const misfit = openingMisfit(room.pointsCm, opening);
            if (misfit === "edge") {
                ctx.addIssue({ code: "custom", message: "Unknown edge", path: ["openings", index, "edgeIndex"] });
            } else if (misfit === "fit") {
                ctx.addIssue({ code: "custom", message: "Does not fit on the edge", path: ["openings", index, "offsetCm"] });
            }
        });
    });

export const ShapeStyleSchema = z.object({
    /** `null` = outline only. */
    fill: HexColorSchema.nullable(),
    stroke: HexColorSchema,
    /** Screen pixels, independent of zoom (drawn with `strokeScaleEnabled = false`). */
    strokeWidth: z.number().positive().max(20),
    opacity: z.number().min(0).max(1),
});

/** Fields every shape has. `x`/`y` = center of the bounding box in cm; rotation around it. */
const shapeBase = {
    id: z.uuid(),
    x: z.number(),
    y: z.number(),
    rotationDeg: z.number().min(0).lt(360),
    /** Mirrors horizontally, e.g. an L-shape left/right. */
    mirrored: z.boolean(),
    label: z.string().optional(),
    style: ShapeStyleSchema,
    locked: z.boolean().optional(),
};

const lengthCm = z.number().positive();

export const RectShapeSchema = z
    .object({
        ...shapeBase,
        kind: z.literal("rect"),
        widthCm: lengthCm,
        depthCm: lengthCm,
        cornerRadiusCm: z.number().min(0),
    })
    .refine((s) => s.cornerRadiusCm <= Math.min(s.widthCm, s.depthCm) / 2, {
        message: "Corner radius exceeds half of the shorter side",
        path: ["cornerRadiusCm"],
    });

export const EllipseShapeSchema = z.object({
    ...shapeBase,
    kind: z.literal("ellipse"),
    widthCm: lengthCm,
    depthCm: lengthCm,
});

/**
 * Leg A runs along the width, its thickness `legAWidthCm` is measured in depth
 * direction; leg B runs along the depth, `legBWidthCm` is measured in width direction.
 */
export const LShapeSchema = z
    .object({
        ...shapeBase,
        kind: z.literal("l-shape"),
        widthCm: lengthCm,
        depthCm: lengthCm,
        legAWidthCm: lengthCm,
        legBWidthCm: lengthCm,
    })
    .refine((s) => s.legAWidthCm < s.depthCm, { message: "Leg A must be thinner than the depth", path: ["legAWidthCm"] })
    .refine((s) => s.legBWidthCm < s.widthCm, { message: "Leg B must be thinner than the width", path: ["legBWidthCm"] });

/** The base runs along the width (thickness in depth direction), the two sides along the depth. */
export const UShapeSchema = z
    .object({
        ...shapeBase,
        kind: z.literal("u-shape"),
        widthCm: lengthCm,
        depthCm: lengthCm,
        baseWidthCm: lengthCm,
        sideWidthCm: lengthCm,
    })
    .refine((s) => s.baseWidthCm < s.depthCm, { message: "Base must be thinner than the depth", path: ["baseWidthCm"] })
    .refine((s) => 2 * s.sideWidthCm < s.widthCm, {
        message: "Both sides together must be narrower than the width",
        path: ["sideWidthCm"],
    });

/** Quarter circle inside a rectangle, e.g. corner shower or corner shelf. */
export const CornerShapeSchema = z.object({
    ...shapeBase,
    kind: z.literal("corner"),
    widthCm: lengthCm,
    depthCm: lengthCm,
});

/** Door leaf plus quarter-circle swing. */
export const DoorSwingShapeSchema = z.object({
    ...shapeBase,
    kind: z.literal("door-swing"),
    widthCm: lengthCm,
});

/** Free shape; points relative to the center. Self-intersection is not checked. */
export const PolygonShapeSchema = z.object({
    ...shapeBase,
    kind: z.literal("polygon"),
    pointsCm: z.array(PointCmSchema).min(3),
});

export const ShapeSchema = z.discriminatedUnion("kind", [
    RectShapeSchema,
    EllipseShapeSchema,
    LShapeSchema,
    UShapeSchema,
    CornerShapeSchema,
    DoorSwingShapeSchema,
    PolygonShapeSchema,
]);

/** SHA-256 (lower-case hex) of the image file; the key of the image in the browser's image store. */
export const ImageIdSchema = z.string().regex(/^[0-9a-f]{64}$/);

/**
 * A scanned floor plan under a floor. Pixel sizes are kept in the plan: the
 * rotation around the image center, fitting and the rule "same size keeps the
 * calibration" need them also while the image loads or is missing.
 */
export const UnderlaySchema = z
    .object({
        /** `null` = no image („Vorlage fehlt“). */
        imageId: ImageIdSchema.nullable(),
        imageWidthPx: z.number().int().positive().nullable(),
        imageHeightPx: z.number().int().positive().nullable(),
        /** `null` = not calibrated (1 image px = 1 cm). */
        calibration: CalibrationSchema.nullable(),
        visible: z.boolean(),
        opacity: z.number().min(0.1).max(1),
    })
    .refine((u) => (u.imageWidthPx === null) === (u.imageHeightPx === null), {
        message: "Width and height must both be known or both unknown",
        path: ["imageWidthPx"],
    })
    .refine((u) => u.imageId === null || u.imageWidthPx !== null, {
        message: "An underlay with image needs its pixel size",
        path: ["imageWidthPx"],
    });

const PlanObjectSchema = z.object({
    schemaVersion: z.literal(PLAN_SCHEMA_VERSION),
    name: z.string().min(1),
    createdAt: z.iso.datetime(),
    /** Last change of content (shapes, underlays, floors); not touched by switching floors. */
    updatedAt: z.iso.datetime(),
    /** Order of the list = order in the floor switcher. */
    floors: z.array(FloorSchema).min(1).max(MAX_FLOORS),
    activeFloorId: FloorIdSchema,
    /** A missing entry means "no underlay". Keys: a subset of the floor ids. */
    underlayByFloor: z.partialRecord(FloorIdSchema, UnderlaySchema),
    /** Keys: exactly the floor ids. Drawing order: the last shape lies on top. */
    shapesByFloor: z.record(FloorIdSchema, z.array(ShapeSchema)),
    /** Keys: exactly the floor ids. Drawing order: the last room lies on top. */
    roomsByFloor: z.record(FloorIdSchema, z.array(RoomSchema)),
    /** Default values, grid, snap steps and wall color (see `plan-settings.ts`). */
    settings: PlanSettingsSchema,
});

/**
 * Floor ids unique, active floor present, `shapesByFloor` and `roomsByFloor`
 * keyed by exactly the floors, `underlayByFloor` by a subset, shape ids,
 * room ids and opening ids unique across the plan.
 */
function checkFloorConsistency(plan: z.infer<typeof PlanObjectSchema>, ctx: z.RefinementCtx): void {
    const floorIds = new Set<string>();
    plan.floors.forEach((floor, index) => {
        if (floorIds.has(floor.id)) {
            ctx.addIssue({ code: "custom", message: "Duplicate floor id", path: ["floors", index, "id"] });
        }
        floorIds.add(floor.id);
    });
    if (!floorIds.has(plan.activeFloorId)) {
        ctx.addIssue({ code: "custom", message: "Active floor is not a floor of the plan", path: ["activeFloorId"] });
    }
    checkKeyedByFloors(plan.shapesByFloor, "shapesByFloor", "shape", floorIds, ctx);
    checkKeyedByFloors(plan.roomsByFloor, "roomsByFloor", "room", floorIds, ctx);
    for (const key of Object.keys(plan.underlayByFloor)) {
        if (!floorIds.has(key)) {
            ctx.addIssue({ code: "custom", message: "Underlay of an unknown floor", path: ["underlayByFloor", key] });
        }
    }
    checkUniqueIds(plan.shapesByFloor, "shapesByFloor", "shape", ctx);
    checkUniqueIds(plan.roomsByFloor, "roomsByFloor", "room", ctx);
    checkUniqueOpeningIds(plan.roomsByFloor, ctx);
}

/** Opening ids are unique across all rooms of all floors. */
function checkUniqueOpeningIds(roomsByFloor: Record<string, { openings: { id: string }[] }[]>, ctx: z.RefinementCtx): void {
    const ids = new Set<string>();
    for (const [floorId, rooms] of Object.entries(roomsByFloor)) {
        rooms.forEach((room, roomIndex) => {
            room.openings.forEach((opening, index) => {
                if (ids.has(opening.id)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Duplicate opening id",
                        path: ["roomsByFloor", floorId, roomIndex, "openings", index, "id"],
                    });
                }
                ids.add(opening.id);
            });
        });
    }
}

/** The record has a list for every floor and none for an unknown floor. */
function checkKeyedByFloors(
    byFloor: Record<string, unknown[]>,
    key: "shapesByFloor" | "roomsByFloor",
    what: "shape" | "room",
    floorIds: ReadonlySet<string>,
    ctx: z.RefinementCtx,
): void {
    const plural = what === "shape" ? "Shapes" : "Rooms";
    for (const floorId of Object.keys(byFloor)) {
        if (!floorIds.has(floorId)) {
            ctx.addIssue({ code: "custom", message: `${plural} of an unknown floor`, path: [key, floorId] });
        }
    }
    for (const floorId of floorIds) {
        if (!Object.hasOwn(byFloor, floorId)) {
            ctx.addIssue({ code: "custom", message: `Missing ${what} list of a floor`, path: [key, floorId] });
        }
    }
}

/** Ids of the items are unique across all floors. */
function checkUniqueIds(
    byFloor: Record<string, { id: string }[]>,
    key: "shapesByFloor" | "roomsByFloor",
    what: "shape" | "room",
    ctx: z.RefinementCtx,
): void {
    const ids = new Set<string>();
    for (const [floorId, items] of Object.entries(byFloor)) {
        items.forEach((item, index) => {
            if (ids.has(item.id)) {
                ctx.addIssue({ code: "custom", message: `Duplicate ${what} id`, path: [key, floorId, index, "id"] });
            }
            ids.add(item.id);
        });
    }
}

export const PlanSchema = PlanObjectSchema.superRefine(checkFloorConsistency);

export type PointCm = z.infer<typeof PointCmSchema>;
export type ShapeStyle = z.infer<typeof ShapeStyleSchema>;
export type Shape = z.infer<typeof ShapeSchema>;
export type ShapeKind = Shape["kind"];
export type Floor = z.infer<typeof FloorSchema>;
export type ImageId = z.infer<typeof ImageIdSchema>;
export type Underlay = z.infer<typeof UnderlaySchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Opening = z.infer<typeof OpeningSchema>;
export type OpeningKind = Opening["kind"];
export type Swing = z.infer<typeof SwingSchema>;
export type BeforeFullEdge = z.infer<typeof BeforeFullEdgeSchema>;
export type Plan = z.infer<typeof PlanSchema>;

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * Changeable fields of a shape; `id` and `kind` stay fixed. `style` is replaced
 * as a whole. The runtime check in `updateShape` is authoritative.
 */
export type ShapePatch = Partial<DistributiveOmit<Shape, "id" | "kind">>;

/**
 * Changeable fields of an opening; `id` and `kind` stay fixed, the swing is
 * replaced as a whole. The runtime check in `updateOpening` is authoritative.
 */
export type OpeningPatch = Partial<Omit<Opening, "id" | "kind">>;
