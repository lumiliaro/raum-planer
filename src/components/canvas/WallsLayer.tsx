import type Konva from "konva";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Circle, Group, Layer, Line } from "react-konva";
import { DIMENSION_GAP_PX, DIMENSION_HEIGHT_PX } from "@/components/canvas/dimension-measure";
import { DimensionText } from "@/components/canvas/DimensionText";
import { ROOM_LABEL_COLOR, SELECTION_COLOR } from "@/components/canvas/canvas-style";
import { useAltKeyRef, useSnapOffKeyRef, useShiftKeyRef } from "@/hooks/useModifierKeyRef";
import { readableRotationDeg } from "@/lib/dimensions";
import { formatCm } from "@/lib/format";
import type { FloorId, PointCm, Room, Wall } from "@/lib/plan-schema";
import { CORNER_SNAP_RADIUS_PX, type DraftGuide } from "@/lib/room-drawing";
import { distanceCm, GEOMETRY_EPS_CM, MIN_EDGE_CM } from "@/lib/room-geometry";
import { snapDelta, snapStepCm } from "@/lib/snap";
import { resolveWallPointer, wallSnapTargets } from "@/lib/wall-drawing";
import { joinedEnds, wallBandOutline, wallLengthCm, wallNormal } from "@/lib/wall-geometry";
import { selectSelectedWall, selectSettings, useAppStore } from "@/store/app-store";

/** Konva name of every wall's group; clicks find their wall via `findAncestor(".wall")`. */
export const WALL_NODE_NAME = "wall";

/** Four-headed arrow, defined in `index.css`. */
const MOVE_CURSOR = "var(--cursor-move-shape)";
/** Hit width along the center line in screen px, so thin walls stay clickable when zoomed out. */
const HIT_STROKE_PX = 10;
/** Radius of an end handle in screen px. */
const HANDLE_RADIUS_PX = 5;
const HANDLE_FILL = "#FFFFFF";
/** Radius of the ring at a snapped end, in screen px. */
const RING_RADIUS_PX = 6;
/** Dash of a guide in screen px. */
const GUIDE_DASH = [4, 4];

const flat = (points: readonly PointCm[]) => points.flatMap((p) => [p.x, p.y]);

/** An end of a wall being dragged: its preview position and what it snapped to. */
interface EndDrag {
    wallId: string;
    side: "start" | "end";
    point: PointCm;
    guides: DraftGuide[];
    snapped: boolean;
}

interface WallsLayerProps {
    floorId: FloorId;
    /** Current stage scale (screen px per cm). */
    scale: number;
}

/**
 * The active floor's free walls, above the rooms and below the shapes: each a
 * band in the plan's wall color, half its thickness to each side of the center
 * line. Where an end lies exactly on an end of another wall, both bands reach
 * half their thickness further, so the corner is closed (`joinedEnds`). With
 * the dimensions on, each wall shows its length beside the band.
 *
 * With "select" a click selects a wall (`FloorCanvas`); the selected wall has
 * a blue outline and a handle at each end. Dragging the selected wall moves
 * it in 5-cm steps (1 cm with Alt); dragging a handle moves only that end and
 * snaps it like the end point while drawing (`resolveWallPointer` from the
 * other end; Shift: free angle, Strg (Apple: ⌘) or „Einrasten“ off: no guides and wall
 * lines), showing guides, a ring and the length. The plan changes on release.
 */
export function WallsLayer({ floorId, scale }: WallsLayerProps) {
    const walls = useAppStore((s) => s.plan.wallsByFloor[floorId]) ?? EMPTY_WALLS;
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]) ?? EMPTY_ROOMS;
    const wallColor = useAppStore((s) => s.plan.settings.wallColor);
    const showDimensions = useAppStore((s) => s.showDimensions);
    const selected = useAppStore(selectSelectedWall);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const altRef = useAltKeyRef();
    const shiftRef = useShiftKeyRef();
    const snapOffRef = useSnapOffKeyRef();
    const [endDrag, setEndDrag] = useState<EndDrag | null>(null);

    // A dragged end shows where it will land; the corner caps follow it.
    const shown = useMemo(
        () =>
            walls.map((wall) =>
                endDrag?.wallId === wall.id
                    ? { ...wall, [endDrag.side === "start" ? "startCm" : "endCm"]: endDrag.point }
                    : wall,
            ),
        [walls, endDrag],
    );
    const joined = useMemo(() => joinedEnds(shown), [shown]);

    return (
        <Layer>
            {shown.map((wall) => (
                <WallNode
                    key={wall.id}
                    floorId={floorId}
                    wall={wall}
                    caps={joined.get(wall.id) ?? { start: false, end: false }}
                    color={wallColor}
                    scale={scale}
                    showDimension={showDimensions || endDrag?.wallId === wall.id}
                    selected={wall.id === selected?.id}
                    draggable={selecting && wall.id === selected?.id}
                    rooms={rooms}
                    walls={walls}
                    endDrag={endDrag?.wallId === wall.id ? endDrag : null}
                    onEndDrag={setEndDrag}
                    altRef={altRef}
                    shiftRef={shiftRef}
                    snapOffRef={snapOffRef}
                />
            ))}
        </Layer>
    );
}

const EMPTY_WALLS: readonly Wall[] = [];
const EMPTY_ROOMS: readonly Room[] = [];

interface WallNodeProps {
    floorId: FloorId;
    /** The wall as shown (with a dragged end at its preview position). */
    wall: Wall;
    caps: { start: boolean; end: boolean };
    color: string;
    scale: number;
    showDimension: boolean;
    selected: boolean;
    draggable: boolean;
    /** Snap targets for a dragged end. */
    rooms: readonly Room[];
    walls: readonly Wall[];
    endDrag: EndDrag | null;
    onEndDrag: (drag: EndDrag | null) => void;
    altRef: RefObject<boolean>;
    shiftRef: RefObject<boolean>;
    snapOffRef: RefObject<boolean>;
}

interface MoveStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    snappedCm: PointCm;
}

/**
 * One wall: its band (with a wide hit line along the center), its length with
 * the dimensions on, and when selected its outline and end handles. The group
 * sits at (0, 0) because the points are absolute.
 */
function WallNode({
    floorId,
    wall,
    caps,
    color,
    scale,
    showDimension,
    selected,
    draggable,
    rooms,
    walls,
    endDrag,
    onEndDrag,
    altRef,
    shiftRef,
    snapOffRef,
}: WallNodeProps) {
    const moveWall = useAppStore((s) => s.moveWall);
    const updateWall = useAppStore((s) => s.updateWall);
    const settings = useAppStore(selectSettings);
    const snapping = useAppStore((s) => s.shapeSnapping);
    const groupRef = useRef<Konva.Group>(null);
    const moveRef = useRef<MoveStart | null>(null);
    const px = 1 / scale;

    // Reset the move cursor when the wall stops being draggable or disappears while hovered.
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

    const band = wallBandOutline(wall, caps.start, caps.end);
    if (band.length === 0) return null;

    const moveBound = function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
        moveRef.current ??= { abs: this.absolutePosition(), snappedCm: { x: 0, y: 0 } };
        const move = moveRef.current;
        const step = snapStepCm(altRef.current, settings);
        move.snappedCm = {
            x: snapDelta((pos.x - move.abs.x) * px, step),
            y: snapDelta((pos.y - move.abs.y) * px, step),
        };
        return { x: move.abs.x + move.snappedCm.x * scale, y: move.abs.y + move.snappedCm.y * scale };
    };

    // The handles stop their drag events, so these only see the group's own move.
    const onMoveStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        moveRef.current = { abs: e.target.absolutePosition(), snappedCm: { x: 0, y: 0 } };
    };

    const onMoveEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const move = moveRef.current;
        moveRef.current = null;
        if (move) moveWall(floorId, wall.id, move.snappedCm.x, move.snappedCm.y);
        // The points now carry the move (or the change was rejected): back to the origin.
        e.target.position({ x: 0, y: 0 });
    };

    /** The end `side` for the pointer at the handle's absolute position, snapped from the other end. */
    const resolveEnd = (node: Konva.Node, side: "start" | "end", pos: Konva.Vector2d): EndDrag | null => {
        const layer = node.getLayer();
        if (!layer) return null;
        const pointer = layer.getAbsoluteTransform().copy().invert().point(pos);
        const fixed = side === "start" ? wall.endCm : wall.startCm;
        const resolved = resolveWallPointer(fixed, pointer, wallSnapTargets(rooms, walls, wall.id), {
            radiusCm: CORNER_SNAP_RADIUS_PX * px,
            free: !!shiftRef.current,
            snap: snapping && !snapOffRef.current,
            stepCm: snapStepCm(altRef.current, settings),
        });
        const point = resolved.point;
        if (!point || distanceCm(point, fixed) < MIN_EDGE_CM - GEOMETRY_EPS_CM) return null;
        return { wallId: wall.id, side, point, guides: resolved.guides, snapped: resolved.snapped };
    };

    const handleBound = (side: "start" | "end") =>
        function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
            const next = resolveEnd(this, side, pos);
            // An end on the other end is not allowed: the handle stays at the last valid point.
            const point = next?.point ?? (side === "start" ? wall.startCm : wall.endCm);
            if (next) onEndDrag(next);
            const layer = this.getLayer();
            return layer ? layer.getAbsoluteTransform().point(point) : pos;
        };

    // The handle's drag events must not reach the group (it would treat them as a move) or the stage.
    const onHandleEnd = (side: "start" | "end") => (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const point = endDrag?.side === side ? endDrag.point : null;
        onEndDrag(null);
        if (point) updateWall(floorId, wall.id, side === "start" ? { startCm: point } : { endCm: point });
        const stored = useAppStore.getState().plan.wallsByFloor[floorId]?.find((w) => w.id === wall.id);
        if (stored) e.target.position(side === "start" ? stored.startCm : stored.endCm);
    };

    const normal = wallNormal(wall);
    const lengthCm = wallLengthCm(wall);
    const mid = { x: (wall.startCm.x + wall.endCm.x) / 2, y: (wall.startCm.y + wall.endCm.y) / 2 };
    const labelDistance = wall.thicknessCm / 2 + (DIMENSION_GAP_PX + DIMENSION_HEIGHT_PX / 2) * px;
    const angleDeg = (Math.atan2(wall.endCm.y - wall.startCm.y, wall.endCm.x - wall.startCm.x) * 180) / Math.PI;
    const labelCenter = normal ? { x: mid.x - normal.x * labelDistance, y: mid.y - normal.y * labelDistance } : mid;
    const draggedEnd = endDrag?.point;

    return (
        <>
            <Group
                ref={groupRef}
                id={wall.id}
                name={WALL_NODE_NAME}
                draggable={draggable && !endDrag}
                dragBoundFunc={moveBound}
                onDragStart={onMoveStart}
                onDragEnd={onMoveEnd}
                onMouseEnter={(e) => draggable && setCursor(e, MOVE_CURSOR)}
                onMouseLeave={(e) => setCursor(e, "")}
            >
                <Line points={flat(band)} closed fill={color} perfectDrawEnabled={false} />
                <Line
                    points={flat([wall.startCm, wall.endCm])}
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                    hitStrokeWidth={HIT_STROKE_PX}
                />
                {showDimension && (
                    <DimensionText
                        text={formatCm(lengthCm)}
                        centerCm={labelCenter}
                        rotationDeg={readableRotationDeg(angleDeg, 0)}
                        lengthCm={lengthCm}
                        scale={scale}
                        color={endDrag ? SELECTION_COLOR : ROOM_LABEL_COLOR}
                    />
                )}
                {selected && (
                    <Line
                        points={flat(band)}
                        closed
                        stroke={SELECTION_COLOR}
                        strokeWidth={2}
                        strokeScaleEnabled={false}
                        listening={false}
                    />
                )}
                {selected &&
                    draggable &&
                    (["start", "end"] as const).map((side) => {
                        const at = side === "start" ? wall.startCm : wall.endCm;
                        return (
                            <Circle
                                key={side}
                                x={at.x}
                                y={at.y}
                                radius={HANDLE_RADIUS_PX * px}
                                fill={HANDLE_FILL}
                                stroke={SELECTION_COLOR}
                                strokeWidth={1.25}
                                strokeScaleEnabled={false}
                                draggable
                                dragBoundFunc={handleBound(side)}
                                onDragStart={(e) => (e.cancelBubble = true)}
                                onDragMove={(e) => (e.cancelBubble = true)}
                                onDragEnd={onHandleEnd(side)}
                                onMouseEnter={(e) => setCursor(e, "crosshair")}
                                onMouseLeave={(e) => setCursor(e, MOVE_CURSOR)}
                            />
                        );
                    })}
            </Group>
            {endDrag && draggedEnd && (
                <>
                    {endDrag.guides.map((guide) => (
                        <Line
                            key={guide.axis}
                            points={flat([guide.from, draggedEnd])}
                            stroke={SELECTION_COLOR}
                            strokeWidth={1}
                            strokeScaleEnabled={false}
                            dash={GUIDE_DASH}
                            listening={false}
                        />
                    ))}
                    {endDrag.snapped && (
                        <Circle
                            x={draggedEnd.x}
                            y={draggedEnd.y}
                            radius={RING_RADIUS_PX * px}
                            stroke={SELECTION_COLOR}
                            strokeWidth={2}
                            strokeScaleEnabled={false}
                            listening={false}
                        />
                    )}
                </>
            )}
        </>
    );
}
