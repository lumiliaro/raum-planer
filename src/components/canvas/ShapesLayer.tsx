import { useMemo, useState } from "react";
import { Layer, Line } from "react-konva";
import { SELECTION_COLOR } from "@/components/canvas/canvas-style";
import { SelectionTransformer } from "@/components/canvas/SelectionTransformer";
import { ShapeNode, type SnapGuides } from "@/components/canvas/ShapeNode";
import type { FloorId, Room } from "@/lib/plan-schema";
import { useAltKeyRef, useCtrlKeyRef } from "@/hooks/useModifierKeyRef";
import { getOutlineCm } from "@/lib/outline";
import { shapeIdsInRoom } from "@/lib/room-geometry";
import { selectSelectedShape, useAppStore } from "@/store/app-store";

const NO_ROOMS: Room[] = [];

/** Snap guides: stroke width and dash pattern in screen pixels. */
const GUIDE_STROKE_PX = 1;
const GUIDE_DASH_PX = [6, 4];

interface ShapesLayerProps {
    floorId: FloorId;
    /** Current stage scale (screen px per cm). */
    scale: number;
}

/**
 * The active floor's shapes in drawing order (last on top), above underlay
 * and grid, drawn directly in cm. Shapes without an outline are skipped but
 * stay in the plan. Not rendered in calibration mode.
 *
 * While a room of this floor is dragged (`roomDrag`), the shapes whose center
 * lay inside it at drag start (`shapeIdsInRoom`, as `moveRoom` decides on
 * release) are drawn moved by the room's snapped offset, so they follow the
 * room before the plan changes.
 *
 * While a shape is dragged and snapped to a snap line, the line is drawn
 * dashed in the selection color across the bounding box of its room (at most
 * one per axis, above the shapes, below the transformer); it disappears when
 * the shape snaps off or is released. The guides are local state: the store
 * and its undo history never see them.
 */
export function ShapesLayer({ floorId, scale }: ShapesLayerProps) {
    const shapes = useAppStore((s) => s.plan.shapesByFloor[floorId]);
    const selected = useAppStore(selectSelectedShape);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId] ?? NO_ROOMS);
    const altRef = useAltKeyRef();
    const ctrlRef = useCtrlKeyRef();
    const [guides, setGuides] = useState<SnapGuides | null>(null);
    const showDimensions = useAppStore((s) => s.showDimensions);
    const roomDrag = useAppStore((s) => (s.roomDrag?.floorId === floorId ? s.roomDrag : null));
    // The dragged room's corners before the move: they only change on release.
    const draggedRoomPoints = useAppStore((s) =>
        roomDrag ? s.plan.roomsByFloor[floorId]?.find((r) => r.id === roomDrag.id)?.pointsCm : undefined,
    );
    const movingIds = useMemo(
        () => new Set(draggedRoomPoints ? shapeIdsInRoom(draggedRoomPoints, shapes) : []),
        [draggedRoomPoints, shapes],
    );
    const previewOffsetCm = useMemo(
        () => (roomDrag ? { x: roomDrag.dx, y: roomDrag.dy } : undefined),
        [roomDrag],
    );

    const drawable = useMemo(
        () => shapes.flatMap((shape) => {
            const outlineCm = getOutlineCm(shape);
            return outlineCm ? [{ shape, outlineCm }] : [];
        }),
        [shapes],
    );

    return (
        <Layer>
            {drawable.map(({ shape, outlineCm }) => (
                <ShapeNode
                    key={shape.id}
                    floorId={floorId}
                    shape={shape}
                    outlineCm={outlineCm}
                    scale={scale}
                    // A locked shape is not draggable: dragging on it pans the view.
                    draggable={selecting && !shape.locked}
                    showDimensions={showDimensions}
                    altRef={altRef}
                    ctrlRef={ctrlRef}
                    rooms={rooms}
                    shapes={shapes}
                    onSnapGuides={setGuides}
                    previewOffsetCm={movingIds.has(shape.id) ? previewOffsetCm : undefined}
                />
            ))}
            {guides && <SnapGuideLines guides={guides} scale={scale} />}
            {/* Handles only with "select": with a shape tool, dragging pans the view. */}
            {selecting && (
                <SelectionTransformer
                    floorId={floorId}
                    shape={selected}
                    scale={scale}
                    altRef={altRef}
                />
            )}
        </Layer>
    );
}

/** Dashed lines in the selection color across the room's bounding box, one per snapped axis. */
function SnapGuideLines({ guides, scale }: { guides: SnapGuides; scale: number }) {
    const { roomBoundsCm: b, xCm, yCm } = guides;
    const lineProps = {
        stroke: SELECTION_COLOR,
        strokeWidth: GUIDE_STROKE_PX / scale,
        dash: GUIDE_DASH_PX.map((px) => px / scale),
        listening: false,
    };
    return (
        <>
            {xCm !== null && <Line points={[xCm, b.y, xCm, b.y + b.height]} {...lineProps} />}
            {yCm !== null && <Line points={[b.x, yCm, b.x + b.width, yCm]} {...lineProps} />}
        </>
    );
}
