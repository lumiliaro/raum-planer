import type Konva from "konva";
import { useCallback } from "react";
import { Text } from "react-konva";
import {
    DIMENSION_FONT_FAMILY,
    DIMENSION_FONT_SIZE_PX,
    DIMENSION_HEIGHT_PX,
    dimensionWidthPx,
} from "@/components/canvas/dimension-measure";
import { excludeFromBounds } from "@/components/canvas/label-transform";
import { dimensionFits } from "@/lib/dimensions";
import type { PointCm } from "@/lib/plan-schema";

interface DimensionTextProps {
    text: string;
    /** Center of the text in the parent group's (unscaled) cm coordinates. */
    centerCm: PointCm;
    /** Rotation relative to the group (`readableRotationDeg`). */
    rotationDeg: number;
    /** Length of the edge in cm; the text is left out when it does not fit. */
    lengthCm: number;
    /** Current stage scale (screen px per cm). */
    scale: number;
    color: string;
}

/**
 * One dimension of a room edge or a shape, a child of the room's or shape's
 * group: it moves with it and is covered by what lies above. Same screen size
 * at every zoom; clicks go through, and it does not count towards the
 * group's bounds. Draws nothing when the text is longer than its edge on screen.
 */
export function DimensionText({ text, centerCm, rotationDeg, lengthCm, scale, color }: DimensionTextProps) {
    const setRef = useCallback((node: Konva.Text | null) => {
        if (node) excludeFromBounds(node);
    }, []);
    const width = dimensionWidthPx(text);
    if (!dimensionFits(width, lengthCm * scale)) return null;
    return (
        <Text
            ref={setRef}
            x={centerCm.x}
            y={centerCm.y}
            scaleX={1 / scale}
            scaleY={1 / scale}
            rotation={rotationDeg}
            text={text}
            width={width}
            height={DIMENSION_HEIGHT_PX}
            offsetX={width / 2}
            offsetY={DIMENSION_HEIGHT_PX / 2}
            align="center"
            verticalAlign="middle"
            wrap="none"
            fontFamily={DIMENSION_FONT_FAMILY}
            fontSize={DIMENSION_FONT_SIZE_PX}
            fill={color}
            listening={false}
            perfectDrawEnabled={false}
        />
    );
}
