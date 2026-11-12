import { useMemo } from "react";
import { Layer } from "react-konva";
import { SelectionTransformer } from "@/components/canvas/SelectionTransformer";
import { ShapeNode } from "@/components/canvas/ShapeNode";
import type { FloorId } from "@/lib/plan-schema";
import { useAltKeyRef } from "@/hooks/useModifierKeyRef";
import { getOutlineCm } from "@/lib/outline";
import { shapeIdsInRoom } from "@/lib/room-geometry";
import { selectSelectedShape, useAppStore } from "@/store/app-store";

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
 */
export function ShapesLayer({ floorId, scale }: ShapesLayerProps) {
    const shapes = useAppStore((s) => s.plan.shapesByFloor[floorId]);
    const selected = useAppStore(selectSelectedShape);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const altRef = useAltKeyRef();
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
                    previewOffsetCm={movingIds.has(shape.id) ? previewOffsetCm : undefined}
                />
            ))}
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
