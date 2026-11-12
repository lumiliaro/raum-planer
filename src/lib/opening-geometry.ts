/**
 * Pure geometry of openings (doors, windows) on a room edge. An opening lies on
 * edge `edgeIndex` of its room; `offsetCm` runs from the edge's start point to
 * the start of the opening, `hinge` names an end in edge direction. The UI
 * speaks of left/right seen from inside the room; the conversion lives here.
 * All values in cm (y points down), no React or Konva dependencies.
 */

import { sampleEllipseArc } from "@/lib/outline";
import type { PointCm, Swing } from "@/lib/plan-schema";
import { distanceCm, signedArea2 } from "@/lib/room-geometry";

/** Tolerance of the fit check "offset + width ≤ edge length", in cm. */
export const OPENING_FIT_EPS_CM = 1e-6;
/**
 * How far the gap in the wall bands reaches outwards at least: own band, an
 * inner wall and the neighbour's band. A thicker wall is cut through completely.
 */
export const OPENING_CUT_DEPTH_CM = 40;
/** How far the gap reaches into the room, against flickering at the edge. */
export const OPENING_CUT_INSET_CM = 1;

/** Where an opening sits on its edge. */
export interface OpeningPlacement {
    edgeIndex: number;
    offsetCm: number;
    widthCm: number;
}

/** An opening with its swing (`null` for windows). */
export interface OpeningShape extends OpeningPlacement {
    swing: Swing | null;
}

/** Left or right, seen from inside the room looking at the wall. */
export type Hand = "left" | "right";
export type EdgeEnd = Swing["hinge"];

/** An edge of a room with its directions. */
export interface EdgeFrame {
    start: PointCm;
    end: PointCm;
    /** Unit vector from `start` to `end`. */
    dir: PointCm;
    lengthCm: number;
    /** Unit normal pointing out of the room. */
    outward: PointCm;
    /** The end that lies on the left, seen from inside the room. */
    leftEnd: EdgeEnd;
}

/** Length of edge `index` (from point `index` to the next one), or `null` if the room has no such edge. */
export function edgeLengthCm(points: readonly PointCm[], index: number): number | null {
    if (!Number.isInteger(index) || index < 0 || index >= points.length) return null;
    return distanceCm(points[index], points[(index + 1) % points.length]);
}

/**
 * Why an opening does not fit its room: `"edge"` = no such edge,
 * `"fit"` = it sticks out of the edge. `null` = it fits.
 */
export function openingMisfit(points: readonly PointCm[], o: OpeningPlacement): "edge" | "fit" | null {
    const length = edgeLengthCm(points, o.edgeIndex);
    if (length === null) return "edge";
    if (o.offsetCm < -OPENING_FIT_EPS_CM || o.offsetCm + o.widthCm > length + OPENING_FIT_EPS_CM) return "fit";
    return null;
}

/** Edge `index` of the outline with direction, outward normal and the left end seen from inside. */
export function edgeFrame(points: readonly PointCm[], index: number): EdgeFrame {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const lengthCm = distanceCm(start, end);
    const dir = lengthCm === 0 ? { x: 1, y: 0 } : { x: (end.x - start.x) / lengthCm, y: (end.y - start.y) / lengthCm };
    const outward = signedArea2(points) >= 0 ? { x: dir.y, y: -dir.x } : { x: -dir.y, y: dir.x };
    // Standing in the room looking along `outward`, left is `outward` turned a quarter counter-clockwise on screen.
    const left = { x: outward.y, y: -outward.x };
    const leftEnd: EdgeEnd = dir.x * left.x + dir.y * left.y > 0 ? "end" : "start";
    return { start, end, dir, lengthCm, outward, leftEnd };
}

/** Point at distance `t` from the edge's start, moved `depth` outwards. */
export function pointOnEdge(frame: EdgeFrame, t: number, depth = 0): PointCm {
    return {
        x: frame.start.x + frame.dir.x * t + frame.outward.x * depth,
        y: frame.start.y + frame.dir.y * t + frame.outward.y * depth,
    };
}

/** Distance from the left corner (seen from inside) to the near end of the opening. */
export function leftDistanceCm(frame: EdgeFrame, o: Pick<OpeningPlacement, "offsetCm" | "widthCm">): number {
    return frame.leftEnd === "start" ? o.offsetCm : frame.lengthCm - o.offsetCm - o.widthCm;
}

/** `offsetCm` of an opening of width `widthCm` that lies `leftDistance` from the left corner. */
export function offsetFromLeftDistance(frame: EdgeFrame, widthCm: number, leftDistance: number): number {
    return frame.leftEnd === "start" ? leftDistance : frame.lengthCm - leftDistance - widthCm;
}

const otherEnd = (end: EdgeEnd): EdgeEnd => (end === "start" ? "end" : "start");

/** The edge end of a hinge on the `hand` side, seen from inside. */
export function hingeFromSide(hand: Hand, frame: EdgeFrame): EdgeEnd {
    return hand === "left" ? frame.leftEnd : otherEnd(frame.leftEnd);
}

/** Whether a hinge at edge end `hinge` is on the left or right, seen from inside. */
export function sideFromHinge(hinge: EdgeEnd, frame: EdgeFrame): Hand {
    return hinge === frame.leftEnd ? "left" : "right";
}

/** Start and end of the opening along the edge. */
function span(o: Pick<OpeningPlacement, "offsetCm" | "widthCm">): [number, number] {
    return [o.offsetCm, o.offsetCm + o.widthCm];
}

/**
 * Quadrilateral of the gap cut into the wall bands: over the opening's width,
 * from `OPENING_CUT_INSET_CM` inside to `OPENING_CUT_DEPTH_CM` outside, or
 * through the whole wall of `thicknessCm` if that is thicker.
 */
export function openingGap(frame: EdgeFrame, o: Pick<OpeningPlacement, "offsetCm" | "widthCm">, thicknessCm: number): PointCm[] {
    const [t0, t1] = span(o);
    const depth = Math.max(OPENING_CUT_DEPTH_CM, thicknessCm);
    return [
        pointOnEdge(frame, t0, -OPENING_CUT_INSET_CM),
        pointOnEdge(frame, t1, -OPENING_CUT_INSET_CM),
        pointOnEdge(frame, t1, depth),
        pointOnEdge(frame, t0, depth),
    ];
}

/** Door leaf and swing of a door, in cm. */
export interface DoorLeaf {
    /** End of the opening the leaf is hinged at. */
    hinge: PointCm;
    /** Free end of the open leaf, perpendicular to the edge. */
    leafEnd: PointCm;
    /** The other end of the opening, where the swing arc ends. */
    arcEnd: PointCm;
    /** Quarter arc around `hinge` from `leafEnd` to `arcEnd`, both included. */
    arcPoints: PointCm[];
}

const angleDeg = (from: PointCm, to: PointCm) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Leaf (length = width, into the room for "inside", out of it for "outside") and its swing arc. */
export function doorLeaf(frame: EdgeFrame, o: OpeningPlacement & { swing: Swing }): DoorLeaf {
    const [t0, t1] = span(o);
    const atHinge = o.swing.hinge === "start" ? t0 : t1;
    const atOther = o.swing.hinge === "start" ? t1 : t0;
    const hinge = pointOnEdge(frame, atHinge);
    const arcEnd = pointOnEdge(frame, atOther);
    const depth = o.swing.side === "inside" ? -o.widthCm : o.widthCm;
    const leafEnd = pointOnEdge(frame, atHinge, depth);
    const from = angleDeg(hinge, leafEnd);
    let sweep = angleDeg(hinge, arcEnd) - from;
    if (sweep > 180) sweep -= 360;
    if (sweep <= -180) sweep += 360;
    const arcPoints = sampleEllipseArc(hinge.x, hinge.y, o.widthCm, o.widthCm, from, from + sweep);
    arcPoints[0] = leafEnd;
    arcPoints[arcPoints.length - 1] = arcEnd;
    return { hinge, leafEnd, arcEnd, arcPoints };
}

/** Window symbol: a rectangle from the edge to the band's outer side, plus a center line. */
export interface WindowSymbol {
    outline: PointCm[];
    centerLine: [PointCm, PointCm];
}

/** Rectangle over the opening's width from the edge `thicknessCm` (the wall) outwards, with a line along its middle. */
export function windowSymbol(frame: EdgeFrame, o: Pick<OpeningPlacement, "offsetCm" | "widthCm">, thicknessCm: number): WindowSymbol {
    const [t0, t1] = span(o);
    const mid = thicknessCm / 2;
    return {
        outline: [
            pointOnEdge(frame, t0),
            pointOnEdge(frame, t1),
            pointOnEdge(frame, t1, thicknessCm),
            pointOnEdge(frame, t0, thicknessCm),
        ],
        centerLine: [pointOnEdge(frame, t0, mid), pointOnEdge(frame, t1, mid)],
    };
}
