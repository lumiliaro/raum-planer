/** German names of the shape kinds, shared by the panel and later the import report. */

import type { ShapeKind } from "@/lib/plan-schema";

export const SHAPE_KIND_LABELS: Record<ShapeKind, string> = {
    rect: "Rechteck",
    ellipse: "Ellipse",
    "l-shape": "L-Form",
    "u-shape": "U-Form",
    corner: "Ecke",
    "door-swing": "Tür",
    polygon: "Freie Form",
};
