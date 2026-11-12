import type Konva from "konva";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Group, Layer, Line } from "react-konva";
import { OpeningsLayer, type OpeningDrag, type SnapMark } from "@/components/canvas/OpeningsLayer";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import { useAltKeyRef, useShiftKeyRef } from "@/hooks/useModifierKeyRef";
import { edgeFrame, openingGap } from "@/lib/opening-geometry";
import type { FloorId, PointCm, Room } from "@/lib/plan-schema";
import { roomAreaFill } from "@/lib/room-colors";
import { labelPointCm, translatePoints, wallBandOutline } from "@/lib/room-geometry";
import { snapDelta, snapStepCm } from "@/lib/snap";
import { selectSelectedRoom, selectSettings, useAppStore } from "@/store/app-store";
import { ROOM_LABEL_COLOR, SELECTION_COLOR } from "@/components/canvas/canvas-style";

/** Konva name of every room's area group; clicks find their room via `findAncestor(".room")`. */
export const ROOM_NODE_NAME = "room";

/** Four-headed arrow, defined in `index.css`. */
const MOVE_CURSOR = "var(--cursor-move-shape)";

const flat = (points: readonly PointCm[], dx = 0, dy = 0) => points.flatMap((p) => [p.x + dx, p.y + dy]);

/** A room being dragged and its snapped offset in cm. */
interface RoomDrag {
    id: string;
    dx: number;
    dy: number;
}

interface RoomsLayerProps {
    floorId: FloorId;
    /** Current stage scale (screen px per cm). */
    scale: number;
    /** Snap mark while hovering an edge with an opening tool (`null` = none). */
    hoverMark: SnapMark | null;
}

/**
 * The active floor's rooms, above the underlay and below the shapes, in two
 * layers:
 *
 * - Walls (own canvas, no clicks): every room's outer outline including its
 *   band (`wallBandOutline`, each edge as thick as its wall) filled, then
 *   every room's inside cut out (`destination-out`). Only the band outside all
 *   rooms remains, so a narrow gap between two rooms looks like a shared wall
 *   and no band reaches into a room. Every door and window then cuts its gap
 *   (`openingGap`, 40 cm or the edge's wall thickness outwards) out of all bands
 *   the same way, so the underlay stays visible in it and no background-colored
 *   area is laid over it.
 * - Areas: half-transparent white insides as click targets, the names in
 *   fixed screen size, the blue outline of the selected room with its
 *   highlighted edge, and on top the door and window symbols (`OpeningsLayer`).
 *
 * Only the selected, unlocked room is draggable (with "select"); dragging moves it
 * relative to its start in 5-cm steps (1 cm with Alt). The plan changes on release.
 * Dragging a locked room pans the view like dragging an unselected one.
 */
export function RoomsLayer({ floorId, scale, hoverMark }: RoomsLayerProps) {
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]);
    const wallColor = useAppStore((s) => s.plan.settings.wallColor);
    const selected = useAppStore(selectSelectedRoom);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const highlightedEdge = useAppStore((s) => s.highlightedEdge);
    const altRef = useAltKeyRef();
    const shiftRef = useShiftKeyRef();
    const selectedOpeningId = useAppStore((s) => s.selectedOpeningId);
    const [drag, setDrag] = useState<RoomDrag | null>(null);
    const [openingDrag, setOpeningDrag] = useState<OpeningDrag | null>(null);

    const offsetOf = (id: string) => (drag?.id === id ? drag : { dx: 0, dy: 0 });
    // Bands and insides follow a room being dragged.
    const walls = useMemo(
        () =>
            rooms.map((room) => {
                const offset = drag?.id === room.id ? drag : null;
                return {
                    id: room.id,
                    band: flat(wallBandOutline(room.pointsCm, room.wallThicknessCm), offset?.dx, offset?.dy),
                    inside: flat(room.pointsCm, offset?.dx, offset?.dy),
                };
            }),
        [rooms, drag],
    );
    // Gaps follow a room or an opening being dragged.
    const gaps = useMemo(
        () =>
            rooms.flatMap((room) => {
                const points = drag?.id === room.id ? translatePoints(room.pointsCm, drag.dx, drag.dy) : room.pointsCm;
                return room.openings.map((opening) => {
                    const offsetCm = openingDrag?.id === opening.id ? openingDrag.offsetCm : opening.offsetCm;
                    const frame = edgeFrame(points, opening.edgeIndex);
                    const thicknessCm = room.wallThicknessCm[opening.edgeIndex];
                    return { id: opening.id, points: flat(openingGap(frame, { ...opening, offsetCm }, thicknessCm)) };
                });
            }),
        [rooms, drag, openingDrag],
    );

    const selectedOffset = selected ? offsetOf(selected.id) : null;
    const edge =
        selected && highlightedEdge !== null && highlightedEdge < selected.pointsCm.length
            ? [selected.pointsCm[highlightedEdge], selected.pointsCm[(highlightedEdge + 1) % selected.pointsCm.length]]
            : null;

    return (
        <>
            <Layer listening={false}>
                {walls.map(({ id, band }) => (
                    <Line key={id} points={band} closed fill={wallColor} perfectDrawEnabled={false} />
                ))}
                {walls.map(({ id, inside }) => (
                    <Line key={`inside-${id}`} points={inside} closed fill="#000" globalCompositeOperation="destination-out" />
                ))}
                {gaps.map(({ id, points }) => (
                    <Line key={`gap-${id}`} points={points} closed fill="#000" globalCompositeOperation="destination-out" />
                ))}
            </Layer>
            <Layer>
                {rooms.map((room) => (
                    <RoomArea
                        key={room.id}
                        floorId={floorId}
                        room={room}
                        scale={scale}
                        draggable={selecting && room.id === selected?.id && !room.locked}
                        altRef={altRef}
                        onDrag={setDrag}
                    />
                ))}
                {selected && selectedOffset && (
                    <Line
                        points={flat(selected.pointsCm, selectedOffset.dx, selectedOffset.dy)}
                        closed
                        stroke={SELECTION_COLOR}
                        strokeWidth={2}
                        strokeScaleEnabled={false}
                        listening={false}
                    />
                )}
                {edge && selectedOffset && (
                    <Line
                        points={flat(edge, selectedOffset.dx, selectedOffset.dy)}
                        stroke={SELECTION_COLOR}
                        strokeWidth={4}
                        strokeScaleEnabled={false}
                        lineCap="round"
                        listening={false}
                    />
                )}
                <OpeningsLayer
                    floorId={floorId}
                    rooms={rooms}
                    scale={scale}
                    roomOffset={offsetOf}
                    selectedId={selectedOpeningId}
                    draggable={selecting}
                    altRef={altRef}
                    shiftRef={shiftRef}
                    onDrag={setOpeningDrag}
                    hoverMark={hoverMark}
                />
            </Layer>
        </>
    );
}

interface RoomAreaProps {
    floorId: FloorId;
    room: Room;
    scale: number;
    draggable: boolean;
    altRef: RefObject<boolean>;
    /** Reports the snapped offset while dragging, `null` when the drag ends. */
    onDrag: (drag: RoomDrag | null) => void;
}

interface DragStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    snappedCm: PointCm;
}

/**
 * One room's area and name; the group sits at (0, 0) because the corners are
 * absolute. Not draggable while locked, so a drag on it moves the stage.
 */
function RoomArea({ floorId, room, scale, draggable, altRef, onDrag }: RoomAreaProps) {
    const moveRoom = useAppStore((s) => s.moveRoom);
    const settings = useAppStore(selectSettings);
    const groupRef = useRef<Konva.Group>(null);
    const dragRef = useRef<DragStart | null>(null);
    const points = useMemo(() => flat(room.pointsCm), [room.pointsCm]);
    const labelCm = useMemo(() => labelPointCm(room.pointsCm), [room.pointsCm]);

    // Reset the move cursor when the room stops being draggable or disappears while hovered.
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
        if (snappedCm.x !== drag.snappedCm.x || snappedCm.y !== drag.snappedCm.y) {
            drag.snappedCm = snappedCm;
            onDrag({ id: room.id, dx: snappedCm.x, dy: snappedCm.y });
        }
        return {
            x: drag.abs.x + snappedCm.x / cmPerScreenPx,
            y: drag.abs.y + snappedCm.y / cmPerScreenPx,
        };
    };

    const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragRef.current = { abs: e.target.absolutePosition(), snappedCm: { x: 0, y: 0 } };
    };

    const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (drag) moveRoom(floorId, room.id, drag.snappedCm.x, drag.snappedCm.y);
        // The corners now carry the move (or the change was rejected): back to the origin.
        e.target.position({ x: 0, y: 0 });
        onDrag(null);
    };

    return (
        <Group
            ref={groupRef}
            id={room.id}
            name={ROOM_NODE_NAME}
            draggable={draggable}
            dragBoundFunc={dragBound}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMouseEnter={(e) => draggable && setCursor(e, MOVE_CURSOR)}
            onMouseLeave={(e) => setCursor(e, "")}
        >
            <Line points={points} closed fill={roomAreaFill(room.color)} perfectDrawEnabled={false} />
            <ShapeLabel text={room.name} color={ROOM_LABEL_COLOR} anchorCm={labelCm} scale={scale} rotationDeg={0} />
        </Group>
    );
}
