import { useMemo } from "react";
import { Layer } from "react-konva";
import { SelectionTransformer } from "@/components/canvas/SelectionTransformer";
import { ShapeNode } from "@/components/canvas/ShapeNode";
import type { FloorId } from "@/lib/plan-schema";
import { useAltKeyRef } from "@/hooks/useModifierKeyRef";
import { getOutlineCm } from "@/lib/outline";
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
 */
export function ShapesLayer({ floorId, scale }: ShapesLayerProps) {
    const shapes = useAppStore((s) => s.plan.shapesByFloor[floorId]);
    const selected = useAppStore(selectSelectedShape);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const altRef = useAltKeyRef();

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
                    altRef={altRef}
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
