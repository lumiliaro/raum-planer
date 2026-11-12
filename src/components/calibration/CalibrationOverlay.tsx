import type Konva from "konva";
import { useEffect, useRef } from "react";
import { Circle, Group, Line, Rect, Text } from "react-konva";
import type { ImagePoint } from "@/lib/calibration-schema";
import { distancePx } from "@/lib/calibration";
import { formatImageCoord } from "@/lib/format";
import type { Size } from "@/lib/viewport";
import { useAppStore, type CalibrationPointKey } from "@/store/app-store";

/** `--selection`; Konva cannot read CSS variables. */
const COLOR = "#2563EB";
const FONT = "Inter Variable, Inter, system-ui, sans-serif";

interface CalibrationOverlayProps {
    /** Image px per screen px: markers and labels are scaled by it so they keep their screen size. */
    inverse: number;
    /** Turns markers and labels back upright on a rotated underlay. */
    rotationDeg: number;
    imageSize: Size;
}

/**
 * Calibration points and measuring line, drawn in image coordinates inside
 * the underlay group (`UnderlayLayer`), so they follow its scale and rotation.
 */
export function CalibrationOverlay({ inverse, rotationDeg, imageSize }: CalibrationOverlayProps) {
    const draft = useAppStore((s) => s.calibrationDraft);
    if (!draft) return null;
    const { p1, p2 } = draft;

    return (
        <>
            {p1 && p2 && (
                <>
                    <Line
                        points={[p1.x, p1.y, p2.x, p2.y]}
                        stroke={COLOR}
                        strokeWidth={1.5}
                        strokeScaleEnabled={false}
                        dash={[5 * inverse, 3 * inverse]}
                        listening={false}
                    />
                    <DistanceLabel p1={p1} p2={p2} inverse={inverse} rotationDeg={rotationDeg} />
                </>
            )}
            {p1 && <Marker pointKey="p1" point={p1} inverse={inverse} rotationDeg={rotationDeg} imageSize={imageSize} />}
            {p2 && <Marker pointKey="p2" point={p2} inverse={inverse} rotationDeg={rotationDeg} imageSize={imageSize} />}
        </>
    );
}

const LABEL_W = 80;
const LABEL_H = 20;

interface DistanceLabelProps {
    p1: ImagePoint;
    p2: ImagePoint;
    inverse: number;
    rotationDeg: number;
}

function DistanceLabel({ p1, p2, inverse, rotationDeg }: DistanceLabelProps) {
    return (
        <Group
            x={(p1.x + p2.x) / 2}
            y={(p1.y + p2.y) / 2}
            scaleX={inverse}
            scaleY={inverse}
            rotation={rotationDeg}
            offsetX={LABEL_W / 2}
            offsetY={LABEL_H / 2}
            listening={false}
        >
            <Rect width={LABEL_W} height={LABEL_H} cornerRadius={4} fill={COLOR} />
            <Text
                width={LABEL_W}
                height={LABEL_H}
                text={`${formatImageCoord(distancePx(p1, p2))} px`}
                align="center"
                verticalAlign="middle"
                fontSize={10}
                fontStyle="600"
                fontFamily={FONT}
                fill="#FFFFFF"
            />
        </Group>
    );
}

interface MarkerProps {
    pointKey: CalibrationPointKey;
    point: ImagePoint;
    inverse: number;
    rotationDeg: number;
    imageSize: Size;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function Marker({ pointKey, point, inverse, rotationDeg, imageSize }: MarkerProps) {
    const movePoint = useAppStore((s) => s.moveCalibrationPoint);
    const groupRef = useRef<Konva.Group>(null);

    // Reset the "move" cursor if the marker disappears while hovered (mode ended, floor switched).
    useEffect(() => {
        const container = groupRef.current?.getStage()?.container();
        return () => {
            if (container) container.style.cursor = "";
        };
    }, []);
    const label = pointKey === "p1" ? "P1" : "P2";
    // P1 label left below, P2 right below (as in the design draft).
    const labelX = pointKey === "p1" ? -20 : -2;

    const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, cursor: string) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = cursor;
    };

    // Absolute (screen) position, clamped to the image area in image pixels (the group may be rotated).
    const dragBound = function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
        const parent = this.getParent();
        if (!parent) return pos;
        const toScreen = parent.getAbsoluteTransform().copy();
        const local = toScreen.copy().invert().point(pos);
        return toScreen.point({ x: clamp(local.x, 0, imageSize.width), y: clamp(local.y, 0, imageSize.height) });
    };

    return (
        <Group
            ref={groupRef}
            x={point.x}
            y={point.y}
            scaleX={inverse}
            scaleY={inverse}
            rotation={rotationDeg}
            draggable
            dragBoundFunc={dragBound}
            onDragMove={(e) => movePoint(pointKey, { x: e.target.x(), y: e.target.y() })}
            onDragEnd={(e) => movePoint(pointKey, { x: e.target.x(), y: e.target.y() })}
            // A click on a marker must not set the next point.
            onClick={(e) => {
                e.cancelBubble = true;
            }}
            onMouseEnter={(e) => setCursor(e, "move")}
            onMouseLeave={(e) => setCursor(e, "")}
        >
            <Circle radius={9} fill="rgba(255,255,255,0.6)" stroke={COLOR} strokeWidth={1.5} />
            <Line points={[-14, 0, 14, 0]} stroke={COLOR} strokeWidth={1.5} listening={false} />
            <Line points={[0, -14, 0, 14]} stroke={COLOR} strokeWidth={1.5} listening={false} />
            <Group x={labelX} y={16}>
                <Rect width={22} height={16} cornerRadius={3} fill={COLOR} />
                <Text
                    width={22}
                    height={16}
                    text={label}
                    align="center"
                    verticalAlign="middle"
                    fontSize={10}
                    fontStyle="600"
                    fontFamily={FONT}
                    fill="#FFFFFF"
                />
            </Group>
        </Group>
    );
}
