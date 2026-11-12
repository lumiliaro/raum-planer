import type Konva from "konva";
import { useCallback, type Ref } from "react";
import { Text } from "react-konva";
import { excludeFromBounds, labelAttrs, type LabelPlacement } from "@/components/canvas/label-transform";

/** Fixed screen size of a label: Inter 12 px/500, at most 240 px wide (ends with "…"). */
const FONT_SIZE_PX = 12;
const MAX_WIDTH_PX = 240;
const LINE_HEIGHT_PX = 16;

interface ShapeLabelProps extends LabelPlacement {
    text: string;
    color: string;
    ref?: Ref<Konva.Text>;
}

/**
 * The shape's label, a child of its group: it moves with the shape and is
 * covered by shapes above it. Same screen size at every zoom and always
 * horizontal; clicks go through to the shape. It does not count towards the
 * shape's bounds, so the selection frame fits the outline at every zoom.
 */
export function ShapeLabel({ text, color, ref, ...rest }: ShapeLabelProps) {
    const setRef = useCallback(
        (node: Konva.Text | null) => {
            if (node) excludeFromBounds(node);
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
        },
        [ref],
    );

    return (
        <Text
            ref={setRef}
            {...labelAttrs(rest)}
            text={text}
            width={MAX_WIDTH_PX}
            height={LINE_HEIGHT_PX}
            offsetX={MAX_WIDTH_PX / 2}
            offsetY={LINE_HEIGHT_PX / 2}
            align="center"
            verticalAlign="middle"
            wrap="none"
            ellipsis
            fontFamily="Inter Variable, sans-serif"
            fontSize={FONT_SIZE_PX}
            fontStyle="500"
            fill={color}
            listening={false}
            perfectDrawEnabled={false}
        />
    );
}
