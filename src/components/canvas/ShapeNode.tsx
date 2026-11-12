import type Konva from "konva";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Group, Line } from "react-konva";
import { counterGroupTransform, labelAttrs } from "@/components/canvas/label-transform";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import type { FloorId } from "@/lib/plan-schema";
import { getLabelAnchorCm } from "@/lib/outline";
import type { PointCm, Shape } from "@/lib/plan-schema";
import { moveBy } from "@/lib/shape-transform";
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
    altRef: RefObject<boolean>;
    /** Preview offset in cm while the shape's room is dragged; drawn at `x + dx`, `y + dy`. */
    previewOffsetCm?: PointCm;
}

interface DragStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    snappedCm: PointCm;
}

/**
 * One shape: a group at the shape's center (cm) with its rotation, a
 * closed line from `getOutlineCm` and the label, if any. A door is drawn from
 * the same points as a filled swing area, a solid leaf and a dashed swing. Dragging moves it relative to its start in
 * 5-cm steps (1 cm with Alt); the plan changes only on release. While the
 * room the shape lies in is dragged, `previewOffsetCm` draws it moved along;
 * on release the plan carries the move, so the shape does not jump.
 */
export function ShapeNode({ floorId, shape, outlineCm, scale, draggable, altRef, previewOffsetCm }: ShapeNodeProps) {
    const selectShape = useAppStore((s) => s.selectShape);
    const updateShape = useAppStore((s) => s.updateShape);
    const settings = useAppStore(selectSettings);
    const groupRef = useRef<Konva.Group>(null);
    const dragRef = useRef<DragStart | null>(null);
    const labelRef = useRef<Konva.Text>(null);

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

    const dragBound = function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
        dragRef.current ??= { abs: this.absolutePosition(), snappedCm: { x: 0, y: 0 } };
        const drag = dragRef.current;
        const step = snapStepCm(altRef.current, settings);
        const snappedCm = {
            x: snapDelta((pos.x - drag.abs.x) * cmPerScreenPx, step),
            y: snapDelta((pos.y - drag.abs.y) * cmPerScreenPx, step),
        };
        drag.snappedCm = snappedCm;
        return {
            x: drag.abs.x + snappedCm.x / cmPerScreenPx,
            y: drag.abs.y + snappedCm.y / cmPerScreenPx,
        };
    };

    const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragRef.current = { abs: e.target.absolutePosition(), snappedCm: { x: 0, y: 0 } };
        selectShape(shape.id);
    };

    const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const drag = dragRef.current;
        dragRef.current = null;
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

    // Back to this render's attrs; react-konva then applies only the props that change with the new plan.
    const onTransformEnd = () => labelRef.current?.setAttrs(labelAttrs(labelPlacement));

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
            {shape.label && <ShapeLabel ref={labelRef} text={shape.label} color={style.stroke} {...labelPlacement} />}
        </Group>
    );
}
