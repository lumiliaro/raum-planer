import type Konva from "konva";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Group, Line } from "react-konva";
import { DIMENSION_GAP_PX, DIMENSION_HEIGHT_PX } from "@/components/canvas/dimension-measure";
import { DimensionText } from "@/components/canvas/DimensionText";
import { counterGroupTransform, labelAttrs } from "@/components/canvas/label-transform";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import { dimensionCenterCm, readableRotationDeg, shapeDimensions } from "@/lib/dimensions";
import type { FloorId, Room } from "@/lib/plan-schema";
import { getLabelAnchorCm, shapeBoundsCm } from "@/lib/outline";
import type { PointCm, Shape } from "@/lib/plan-schema";
import { boundsCm, shapeIdsInRoom } from "@/lib/room-geometry";
import {
    roomAtPoint,
    roomSnapLines,
    SHAPE_SNAP_TOLERANCE_PX,
    snapShapeMove,
    type ShapeExtent,
    type SnapAxis,
    type SnapLine,
} from "@/lib/shape-snap";
import { moveBy } from "@/lib/shape-transform";
import type { RectCm } from "@/lib/viewport";
import { snapDelta, snapStepCm } from "@/lib/snap";
import { selectSettings, useAppStore } from "@/store/app-store";
import { NO_FILL, SWING_DASH } from "@/components/canvas/canvas-style";

/** Konva name of every shape group; clicks find their shape via `findAncestor(".shape")`. */
export const SHAPE_NODE_NAME = "shape";

/** Four-headed arrow, defined in `index.css`. */
const MOVE_CURSOR = "var(--cursor-move-shape)";

interface ShapeNodeProps {
    floorId: FloorId;
    shape: Shape;
    outlineCm: PointCm[];
    /** Current stage scale (screen px per cm). */
    scale: number;
    draggable: boolean;
    /** Show width and depth at the outline. */
    showDimensions: boolean;
    altRef: RefObject<boolean>;
    /** „Einrasten“ switch: `false` = no snapping to snap lines, only the grid. */
    snapping: boolean;
    /** Strg (Apple: ⌘) held: no snapping to snap lines, only the grid. */
    snapOffRef: RefObject<boolean>;
    /** Rooms of the floor; the one under the dragged center gives the snap lines. */
    rooms: readonly Room[];
    /** All shapes of the floor; those in the same room are snap targets. */
    shapes: readonly Shape[];
    /** Reports the snap lines hit while dragging (only on change), `null` when none or on release. */
    onSnapGuides: (guides: SnapGuides | null) => void;
    /** Preview offset in cm while the shape's room is dragged; drawn at `x + dx`, `y + dy`. */
    previewOffsetCm?: PointCm;
}

/** Snap lines hit by a dragged shape, drawn over the bounding box of its room. */
export interface SnapGuides {
    roomBoundsCm: RectCm;
    /** `x = …` of the vertical guide, `null` = none. */
    xCm: number | null;
    /** `y = …` of the horizontal guide, `null` = none. */
    yCm: number | null;
}

interface DragStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    snappedCm: PointCm;
    /** Snap lines per room id, computed once per room and drag. */
    linesByRoom: Map<string, SnapLine[]>;
    /** Identifies the last reported guides, to report only changes. */
    guidesKey: string;
}

function newDrag(abs: Konva.Vector2d): DragStart {
    return { abs, snappedCm: { x: 0, y: 0 }, linesByRoom: new Map(), guidesKey: "" };
}

/** Sides of the shape's rotated bounding box relative to its center; `null` without outline. */
function shapeExtent(shape: Shape): Record<SnapAxis, ShapeExtent> | null {
    const b = shapeBoundsCm(shape);
    if (!b) return null;
    return {
        x: { min: b.x - shape.x, max: b.x + b.width - shape.x },
        y: { min: b.y - shape.y, max: b.y + b.height - shape.y },
    };
}

/**
 * One shape: a group at the shape's center (cm) with its rotation, a
 * closed line from `getOutlineCm`, its dimensions (with the display on) and the label, if any. A door is drawn from
 * the same points as a filled swing area, a solid leaf and a dashed swing. Dragging moves it relative to its start in
 * 5-cm steps (1 cm with Alt); the plan changes only on release. Per axis, a snap line of the room under the
 * unsnapped center (room center, opening middles, walls, other shapes in the room; `roomSnapLines`) within
 * `SHAPE_SNAP_TOLERANCE_PX` screen pixels takes precedence over the grid (`snapShapeMove`); the lines hit are
 * reported via `onSnapGuides`. With the „Einrasten“ switch off, Strg (Apple: ⌘) held, outside every room or without outline only the grid applies. While the
 * room the shape lies in is dragged, `previewOffsetCm` draws it moved along;
 * on release the plan carries the move, so the shape does not jump.
 * While the transformer scales or rotates the shape, its dimensions are hidden;
 * after release they show the new values.
 */
export function ShapeNode({
    floorId,
    shape,
    outlineCm,
    scale,
    draggable,
    showDimensions,
    altRef,
    snapping,
    snapOffRef,
    rooms,
    shapes,
    onSnapGuides,
    previewOffsetCm,
}: ShapeNodeProps) {
    const selectShape = useAppStore((s) => s.selectShape);
    const updateShape = useAppStore((s) => s.updateShape);
    const settings = useAppStore(selectSettings);
    const groupRef = useRef<Konva.Group>(null);
    const dragRef = useRef<DragStart | null>(null);
    const labelRef = useRef<Konva.Text>(null);
    const dimensionsRef = useRef<Konva.Group>(null);
    const dimensions = useMemo(() => (showDimensions ? shapeDimensions(shape) : []), [showDimensions, shape]);

    const points = useMemo(() => outlineCm.flatMap((p) => [p.x, p.y]), [outlineCm]);

    // Reset the move cursor when the shape stops being draggable or disappears while hovered.
    useEffect(() => {
        const container = groupRef.current?.getStage()?.container();
        return () => {
            if (container) container.style.cursor = "";
        };
    }, [draggable]);

    const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, cursor: string) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = cursor;
    };

    const cmPerScreenPx = 1 / scale;

    const extent = useMemo(() => shapeExtent(shape), [shape]);

    /** Snap lines of `room` without the dragged shape, cached for the drag. */
    const linesOf = (drag: DragStart, room: Room): SnapLine[] => {
        let lines = drag.linesByRoom.get(room.id);
        if (!lines) {
            const others = shapes.filter((s) => s.id !== shape.id);
            const inRoom = new Set(shapeIdsInRoom(room.pointsCm, others));
            lines = roomSnapLines(room, others.filter((s) => inRoom.has(s.id)));
            drag.linesByRoom.set(room.id, lines);
        }
        return lines;
    };

    const reportGuides = (drag: DragStart, guides: SnapGuides | null) => {
        const key = guides ? `${guides.xCm}|${guides.yCm}|${JSON.stringify(guides.roomBoundsCm)}` : "";
        if (key === drag.guidesKey) return;
        drag.guidesKey = key;
        onSnapGuides(guides);
    };

    const dragBound = function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
        dragRef.current ??= newDrag(this.absolutePosition());
        const drag = dragRef.current;
        const step = snapStepCm(altRef.current, settings);
        const rawCm = { x: (pos.x - drag.abs.x) * cmPerScreenPx, y: (pos.y - drag.abs.y) * cmPerScreenPx };
        const room = !snapping || snapOffRef.current || !extent ? null : roomAtPoint(rooms, { x: shape.x + rawCm.x, y: shape.y + rawCm.y });
        let snappedCm: PointCm;
        if (room && extent) {
            const result = snapShapeMove({
                startCm: { x: shape.x, y: shape.y },
                rawDeltaCm: rawCm,
                stepCm: step,
                extentCm: extent,
                lines: linesOf(drag, room),
                toleranceCm: SHAPE_SNAP_TOLERANCE_PX * cmPerScreenPx,
            });
            snappedCm = result.deltaCm;
            const { x, y } = result.hits;
            reportGuides(drag, x || y ? { roomBoundsCm: boundsCm(room.pointsCm), xCm: x?.valueCm ?? null, yCm: y?.valueCm ?? null } : null);
        } else {
            snappedCm = { x: snapDelta(rawCm.x, step), y: snapDelta(rawCm.y, step) };
            reportGuides(drag, null);
        }
        drag.snappedCm = snappedCm;
        return {
            x: drag.abs.x + snappedCm.x / cmPerScreenPx,
            y: drag.abs.y + snappedCm.y / cmPerScreenPx,
        };
    };

    const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragRef.current = newDrag(e.target.absolutePosition());
        selectShape(shape.id);
    };

    const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const drag = dragRef.current;
        dragRef.current = null;
        onSnapGuides(null);
        if (!drag) return;
        const { x: dx, y: dy } = drag.snappedCm;
        const moved = dx !== 0 || dy !== 0;
        const next = moveBy(shape, dx, dy);
        const ok = moved && updateShape(floorId, shape.id, next);
        // Put the node exactly where the plan says (also when the change was rejected).
        const final = ok ? next : shape;
        e.target.position({ x: final.x, y: final.y });
    };

    const anchorCm = getLabelAnchorCm(shape);
    const labelPlacement = { anchorCm, scale, rotationDeg: shape.rotationDeg };

    // While the transformer scales or rotates the group, keep the label upright and undistorted.
    const onTransform = () => {
        const label = labelRef.current;
        const group = groupRef.current;
        if (label && group) {
            counterGroupTransform(label, group, anchorCm);
        }
    };

    // Several rotated texts would each need their own counter transform: hide them instead.
    const onTransformStart = () => dimensionsRef.current?.visible(false);

    // Back to this render's attrs; react-konva then applies only the props that change with the new plan.
    const onTransformEnd = () => {
        labelRef.current?.setAttrs(labelAttrs(labelPlacement));
        dimensionsRef.current?.visible(true);
    };

    const { style } = shape;
    const strokeProps = {
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeScaleEnabled: false,
        opacity: style.opacity,
        lineJoin: "round" as const,
    };
    return (
        <Group
            ref={groupRef}
            id={shape.id}
            name={SHAPE_NODE_NAME}
            x={shape.x + (previewOffsetCm?.x ?? 0)}
            y={shape.y + (previewOffsetCm?.y ?? 0)}
            rotation={shape.rotationDeg}
            draggable={draggable}
            dragBoundFunc={dragBound}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onTransformStart={onTransformStart}
            onTransform={onTransform}
            onTransformEnd={onTransformEnd}
            onMouseEnter={(e) => draggable && setCursor(e, MOVE_CURSOR)}
            onMouseLeave={(e) => setCursor(e, "")}
        >
            {shape.kind === "door-swing" ? (
                <>
                    {/* Swing area: fill and click target, no stroke (the wall opening stays undrawn). */}
                    <Line points={points} closed fill={style.fill ?? NO_FILL} opacity={style.opacity} />
                    {/* Point 0 = hinge, point 1 = end of the open leaf, then the swing arc. */}
                    <Line points={points.slice(0, 4)} {...strokeProps} />
                    <Line points={points.slice(2)} dash={SWING_DASH} {...strokeProps} />
                </>
            ) : (
                <Line points={points} closed fill={style.fill ?? NO_FILL} {...strokeProps} />
            )}
            {dimensions.length > 0 && (
                <Group ref={dimensionsRef} listening={false}>
                    {dimensions.map((label, i) => (
                        <DimensionText
                            key={i}
                            text={label.text}
                            centerCm={dimensionCenterCm(label, "inside", DIMENSION_GAP_PX / scale, DIMENSION_HEIGHT_PX / scale)}
                            rotationDeg={readableRotationDeg(label.edgeAngleDeg, shape.rotationDeg)}
                            lengthCm={label.lengthCm}
                            scale={scale}
                            color={style.stroke}
                        />
                    ))}
                </Group>
            )}
            {shape.label && <ShapeLabel ref={labelRef} text={shape.label} color={style.stroke} {...labelPlacement} />}
        </Group>
    );
}
