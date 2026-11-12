/**
 * Dimension labels of rooms (inner length of every edge) and shapes (width and
 * depth): text, position and reading direction. Shared by the editor and the
 * PDF; pure, sizes in cm. Text sizes come in from outside because the editor
 * measures in screen px and the PDF in mm on paper.
 */

import { formatCm } from "@/lib/format";
import { edgeFrame } from "@/lib/opening-geometry";
import type { PointCm, Room, Shape } from "@/lib/plan-schema";
import { containsPoint, segmentsIntersect, wallBandOutline } from "@/lib/room-geometry";

export interface DimensionLabel {
    /** Text, e.g. "312,5 cm" (`formatCm`). */
    text: string;
    /** Middle of the edge, in cm (room: absolute; shape: relative to its center, without rotation). */
    midCm: PointCm;
    /** Direction of the edge in degrees (0 = to the right, y points down). */
    edgeAngleDeg: number;
    /** Unit vector from the edge into the inside. */
    inward: PointCm;
    /** Length of the edge in cm (for the check whether the text fits). */
    lengthCm: number;
}

export interface PlacedDimension {
    label: DimensionLabel;
    /** Center of the text, in cm. */
    centerCm: PointCm;
    side: "inside" | "outside";
}

export interface TextSizeCm {
    widthCm: number;
    heightCm: number;
}

/** One label per edge of the room, in edge order. */
export function roomDimensions(pointsCm: readonly PointCm[]): DimensionLabel[] {
    if (pointsCm.length < 3) return [];
    return pointsCm.map((_, i) => {
        const frame = edgeFrame(pointsCm, i);
        return {
            text: formatCm(frame.lengthCm),
            midCm: { x: (frame.start.x + frame.end.x) / 2, y: (frame.start.y + frame.end.y) / 2 },
            edgeAngleDeg: (Math.atan2(frame.dir.y, frame.dir.x) * 180) / Math.PI,
            inward: { x: -frame.outward.x + 0, y: -frame.outward.y + 0 },
            lengthCm: frame.lengthCm,
        };
    });
}

/**
 * Width along the bottom edge and depth along the left edge of the shape's
 * bounding rectangle (mirrored: the right edge), both inside. A door shows
 * only its width, a polygon nothing. Sizes come from the shape's fields.
 */
export function shapeDimensions(shape: Shape): DimensionLabel[] {
    if (shape.kind === "polygon") return [];
    const width = shape.widthCm;
    const depth = shape.kind === "door-swing" ? shape.widthCm : shape.depthCm;
    const bottom: DimensionLabel = {
        text: formatCm(width),
        midCm: { x: 0, y: depth / 2 },
        edgeAngleDeg: 0,
        inward: { x: 0, y: -1 },
        lengthCm: width,
    };
    if (shape.kind === "door-swing") return [bottom];
    const side: DimensionLabel = {
        text: formatCm(depth),
        midCm: { x: shape.mirrored ? width / 2 : -width / 2, y: 0 },
        edgeAngleDeg: 90,
        inward: { x: shape.mirrored ? -1 : 1, y: 0 },
        lengthCm: depth,
    };
    return [bottom, side];
}

/** Center of a text of height `heightCm` that keeps `distanceCm` from the edge, inside (`inward`) or outside. */
export function dimensionCenterCm(
    label: DimensionLabel,
    side: "inside" | "outside",
    distanceCm: number,
    heightCm: number,
): PointCm {
    const sign = side === "inside" ? 1 : -1;
    const d = sign * (distanceCm + heightCm / 2);
    return { x: label.midCm.x + label.inward.x * d, y: label.midCm.y + label.inward.y * d };
}

/** Corners of a text rectangle around `center`, its width along `angleDeg`. */
function textCorners(center: PointCm, angleDeg: number, size: TextSizeCm): PointCm[] {
    const rad = (angleDeg * Math.PI) / 180;
    const u = { x: Math.cos(rad) * (size.widthCm / 2), y: Math.sin(rad) * (size.widthCm / 2) };
    const n = { x: -Math.sin(rad) * (size.heightCm / 2), y: Math.cos(rad) * (size.heightCm / 2) };
    return [
        { x: center.x - u.x - n.x, y: center.y - u.y - n.y },
        { x: center.x + u.x - n.x, y: center.y + u.y - n.y },
        { x: center.x + u.x + n.x, y: center.y + u.y + n.y },
        { x: center.x - u.x + n.x, y: center.y - u.y + n.y },
    ];
}

/** `true` if the convex `rect` and the polygon share a point: a corner inside the other or crossing/touching edges. */
function overlaps(rect: readonly PointCm[], polygon: readonly PointCm[]): boolean {
    if (rect.some((p) => containsPoint(polygon, p))) return true;
    if (polygon.some((p) => containsPoint(rect, p))) return true;
    for (let i = 0; i < rect.length; i++) {
        const a = rect[i];
        const b = rect[(i + 1) % rect.length];
        for (let j = 0; j < polygon.length; j++) {
            if (segmentsIntersect(a, b, polygon[j], polygon[(j + 1) % polygon.length])) return true;
        }
    }
    return false;
}

/**
 * Room dimensions of all rooms of a floor with their position: outside in
 * front of the wall, `gapCm` away from it; inside, `gapCm` from the edge, if
 * the outside text would overlap a room or a wall (`wallBandOutline`) of the
 * floor, its own included. One list per room in the order of `rooms`, one
 * entry per edge.
 */
export function placeRoomDimensions(
    rooms: readonly Room[],
    textSizeCm: (text: string) => TextSizeCm,
    gapCm: number,
): PlacedDimension[][] {
    const outlines = rooms.map((room) => wallBandOutline(room.pointsCm, room.wallThicknessCm));
    return rooms.map((room) =>
        roomDimensions(room.pointsCm).map((label, i) => {
            const size = textSizeCm(label.text);
            const wall = room.wallThicknessCm[i] ?? 0;
            const outside = dimensionCenterCm(label, "outside", wall + gapCm, size.heightCm);
            const corners = textCorners(outside, label.edgeAngleDeg, size);
            if (!outlines.some((outline) => overlaps(corners, outline))) {
                return { label, centerCm: outside, side: "outside" as const };
            }
            return { label, centerCm: dimensionCenterCm(label, "inside", gapCm, size.heightCm), side: "inside" as const };
        }),
    );
}

/**
 * Rotation of the text relative to its group, so that its absolute rotation
 * lies in [-90°, 90°): never upside down, vertical texts read bottom to top.
 */
export function readableRotationDeg(edgeAngleDeg: number, groupRotationDeg: number): number {
    const absolute = edgeAngleDeg + groupRotationDeg;
    const readable = ((((absolute + 90) % 180) + 180) % 180) - 90;
    return readable - groupRotationDeg + 0;
}

/** `true` if a text of `textLength` fits the edge with `margin` on both ends (same unit: screen px or mm). */
export function dimensionFits(textLength: number, edgeLength: number, margin = 4): boolean {
    return textLength + 2 * margin <= edgeLength;
}
