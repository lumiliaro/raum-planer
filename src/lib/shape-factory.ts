/** New shapes with default values, inserted by the shape tools. */

import type { PointCm, Shape, ShapeKind, ShapeStyle } from "@/lib/plan-schema";

/**
 * Kinds that have an insert tool. The free polygon follows with its own change;
 * furniture doors (`door-swing`) stay valid but are no longer inserted – doors
 * go into room walls (room openings).
 */
export type InsertableKind = Exclude<ShapeKind, "polygon" | "door-swing">;

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
    fill: "#E4E4E7",
    stroke: "#52525B",
    strokeWidth: 1.5,
    opacity: 1,
};

const roundWhole = (v: number) => {
    const rounded = Math.round(v);
    return rounded === 0 ? 0 : rounded;
};

/**
 * A new shape centered at `centerCm` (rounded to whole cm). The id is passed
 * in so tests stay deterministic; the store uses `crypto.randomUUID()`.
 */
export function createShape(kind: InsertableKind, centerCm: PointCm, id: string): Shape {
    const base = {
        id,
        x: roundWhole(centerCm.x),
        y: roundWhole(centerCm.y),
        rotationDeg: 0,
        mirrored: false,
        style: { ...DEFAULT_SHAPE_STYLE },
    };
    switch (kind) {
        case "rect":
            return { ...base, kind, widthCm: 100, depthCm: 60, cornerRadiusCm: 0 };
        case "ellipse":
            return { ...base, kind, widthCm: 80, depthCm: 80 };
        case "l-shape":
            return { ...base, kind, widthCm: 120, depthCm: 100, legAWidthCm: 40, legBWidthCm: 40 };
        case "u-shape":
            return { ...base, kind, widthCm: 140, depthCm: 100, baseWidthCm: 30, sideWidthCm: 30 };
        case "corner":
            return { ...base, kind, widthCm: 90, depthCm: 90 };
        default: {
            const unhandled: never = kind;
            throw new Error(`No defaults for shape kind ${unhandled as string}`);
        }
    }
}
