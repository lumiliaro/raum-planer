/** Placement of a shape's label on the canvas (see `ShapeLabel`). */

import Konva from "konva";
import type { PointCm } from "@/lib/plan-schema";

export interface LabelPlacement {
    anchorCm: PointCm;
    /** Current stage scale (screen px per cm). */
    scale: number;
    rotationDeg: number;
}

/** Label attrs inside the shape's (unscaled) group: upright and in screen pixels. */
export function labelAttrs({ anchorCm, scale, rotationDeg }: LabelPlacement) {
    return {
        x: anchorCm.x,
        y: anchorCm.y,
        scaleX: 1 / scale,
        scaleY: 1 / scale,
        rotation: -rotationDeg,
        skewX: 0,
        skewY: 0,
    };
}

/**
 * Keeps the label upright and undistorted while the transformer scales or
 * rotates the group: sets the label's local transform so that its absolute
 * transform is a pure translation to the anchor (screen pixels, no rotation).
 */
export function counterGroupTransform(label: Konva.Text, group: Konva.Group, anchorCm: Konva.Vector2d) {
    const groupAbs = group.getAbsoluteTransform().copy();
    const anchorAbs = groupAbs.point(anchorCm);
    const local = groupAbs.invert().multiply(new Konva.Transform().translate(anchorAbs.x, anchorAbs.y));
    const { x, y, rotation, scaleX, scaleY, skewX, skewY } = local.decompose();
    label.setAttrs({ x, y, rotation, scaleX, scaleY, skewX, skewY });
}

const EMPTY_RECT = { x: 0, y: 0, width: 0, height: 0 };

/**
 * Leaves the label out of the shape's bounds: the transformer frame and other
 * measurements of the group see only the outline. Konva skips children with an
 * empty rect. Measurements for drawing (`_forDrawing`) keep the real rect.
 * Without this, a label of fixed screen size widens the frame when zoomed out.
 */
export function excludeFromBounds(label: Konva.Text) {
    const measure = Konva.Text.prototype.getClientRect;
    label.getClientRect = function (config) {
        const forDrawing = (config as { _forDrawing?: boolean } | undefined)?._forDrawing;
        return forDrawing ? measure.call(this, config) : { ...EMPTY_RECT };
    };
}
