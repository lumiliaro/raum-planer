import type Konva from "konva";
import { useEffect, useRef, type RefObject } from "react";
import { Transformer } from "react-konva";
import type { FloorId } from "@/lib/plan-schema";
import type { Shape } from "@/lib/plan-schema";
import { clampToGrid, getMinSizeCm, getSizeCm } from "@/lib/shape-resize";
import { applyTransform, MIN_SIZE_CM } from "@/lib/shape-transform";
import {
    ROTATION_SNAP_TOLERANCE_DEG,
    ROTATION_SNAPS_DEG,
    snapResizeBox,
    snapSquareResizeBox,
    snapStepCm,
    type Box,
} from "@/lib/snap";
import { selectSettings, useAppStore } from "@/store/app-store";

/** `--selection`; Konva cannot read CSS variables. */
const COLOR = "#2563EB";
const ROTATION_SNAPS = [...ROTATION_SNAPS_DEG];
const ALL_ANCHORS = [
    "top-left",
    "top-center",
    "top-right",
    "middle-right",
    "middle-left",
    "bottom-left",
    "bottom-center",
    "bottom-right",
];
const CORNER_ANCHORS = ["top-left", "top-right", "bottom-left", "bottom-right"];
const NO_ANCHORS: string[] = [];

/**
 * Smallest size of one axis while resizing, in cm: the kind's minimum
 * (`getMinSizeCm`) on the grid of the start size (L-shape 280 cm, leg 90 cm →
 * 180 cm), never more than the start size; without a minimum 1 cm.
 */
function minAxisCm(startCm: number, minCm: number, stepCm: number): number {
    if (minCm <= 0) return MIN_SIZE_CM;
    return Math.max(MIN_SIZE_CM, clampToGrid(startCm, 0, minCm, stepCm));
}

interface SelectionTransformerProps {
    floorId: FloorId;
    /** The selected shape, or `null`. */
    shape: Shape | null;
    /** Current stage scale (screen px per cm). */
    scale: number;
    altRef: RefObject<boolean>;
}

/**
 * Blue selection frame with eight resize anchors and a rotate anchor (a door:
 * four corner anchors, stays square; a locked shape: no anchors). Resizing snaps each moved edge relative
 * to its start (5 cm, 1 cm with Alt). Legs, base and sides keep their
 * thickness, and an L or U stops before its gaps get smaller than its legs;
 * the plan changes only on release.
 */
export function SelectionTransformer({ floorId, shape, scale, altRef }: SelectionTransformerProps) {
    const updateShape = useAppStore((s) => s.updateShape);
    const settings = useAppStore(selectSettings);
    const trRef = useRef<Konva.Transformer>(null);
    const startBoxRef = useRef<Box | null>(null);

    // Attach to the selected shape's group after every render that may have
    // replaced it or changed its outline, and refresh the frame.
    useEffect(() => {
        const tr = trRef.current;
        if (!tr) return;
        const id = shape?.id;
        const node = id ? tr.getLayer()?.findOne((n: Konva.Node) => n.id() === id && n !== tr) : undefined;
        tr.nodes(node ? [node] : []);
        tr.forceUpdate();
        tr.getLayer()?.batchDraw();
    }, [shape]);

    const isDoor = shape?.kind === "door-swing";
    // A locked shape keeps the blue frame, without resize or rotate anchors.
    const locked = shape?.locked === true;

    const boundBox = (oldBox: Box, newBox: Box): Box => {
        if (locked) return oldBox;
        if (trRef.current?.getActiveAnchor()?.startsWith("rotater") || !shape) return newBox;
        // The first call after transformstart sees the untouched box.
        startBoxRef.current ??= oldBox;
        const pxPerScreenCm = scale;
        const stepCm = snapStepCm(altRef.current, settings);
        const size = getSizeCm(shape);
        const limit = getMinSizeCm(shape);
        const minWidth = minAxisCm(size.widthCm, limit.widthCm, stepCm) * pxPerScreenCm;
        if (isDoor) return snapSquareResizeBox(startBoxRef.current, newBox, stepCm * pxPerScreenCm, minWidth);
        return snapResizeBox(startBoxRef.current, newBox, stepCm * pxPerScreenCm, {
            width: minWidth,
            height: minAxisCm(size.depthCm, limit.depthCm, stepCm) * pxPerScreenCm,
        });
    };

    const onTransformEnd = () => {
        startBoxRef.current = null;
        const node = trRef.current?.nodes()[0];
        if (!node || !shape) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        // Reset the scale on the node right away: react-konva does not set unchanged
        // props again, so a kept scale would apply on top of the new size.
        node.scale({ x: 1, y: 1 });

        const next = applyTransform(shape, {
            xCm: node.x(),
            yCm: node.y(),
            widthCm: getSizeCm(shape).widthCm * scaleX,
            depthCm: getSizeCm(shape).depthCm * scaleY,
            rotationDeg: node.rotation(),
        });
        const ok = updateShape(floorId, shape.id, next);
        const final = ok ? next : shape;
        node.setAttrs({
            x: final.x,
            y: final.y,
            rotation: final.rotationDeg,
            skewX: 0,
            skewY: 0,
        });
    };

    return (
        <Transformer
            ref={trRef}
            rotateEnabled={!locked}
            flipEnabled={false}
            enabledAnchors={locked ? NO_ANCHORS : isDoor ? CORNER_ANCHORS : ALL_ANCHORS}
            keepRatio={isDoor}
            shiftBehavior={isDoor ? "none" : "default"}
            ignoreStroke
            rotationSnaps={ROTATION_SNAPS}
            rotationSnapTolerance={ROTATION_SNAP_TOLERANCE_DEG}
            borderStroke={COLOR}
            borderStrokeWidth={1.25}
            anchorStroke={COLOR}
            anchorStrokeWidth={1.25}
            anchorFill="#FFFFFF"
            anchorSize={7}
            anchorCornerRadius={0}
            rotateAnchorOffset={17}
            anchorStyleFunc={(anchor) => {
                if (anchor.hasName("rotater")) anchor.cornerRadius(anchor.width() / 2);
            }}
            boundBoxFunc={boundBox}
            onTransformStart={() => {
                startBoxRef.current = null;
            }}
            onTransformEnd={onTransformEnd}
        />
    );
}
