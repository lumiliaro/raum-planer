import type Konva from "konva";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Group, Layer, Line } from "react-konva";
import { DIMENSION_GAP_PX, DIMENSION_HEIGHT_PX, dimensionWidthPx } from "@/components/canvas/dimension-measure";
import { DimensionText } from "@/components/canvas/DimensionText";
import { OpeningsLayer, type OpeningDrag, type SnapMark } from "@/components/canvas/OpeningsLayer";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import { useAltKeyRef, useCtrlKeyRef, useShiftKeyRef } from "@/hooks/useModifierKeyRef";
import { placeRoomDimensions, readableRotationDeg, type PlacedDimension } from "@/lib/dimensions";
import { edgeFrame, openingGap } from "@/lib/opening-geometry";
import type { FloorId, PointCm, Room } from "@/lib/plan-schema";
import { roomAreaFill } from "@/lib/room-colors";
import { labelPointCm, translatePoints, wallBandOutline } from "@/lib/room-geometry";
import { WALL_SNAP_CAPTURE_PX, WALL_SNAP_RELEASE_PX, snapRoomDrag, type WallStick } from "@/lib/room-snap";
import { snapDelta, snapStepCm } from "@/lib/snap";
import { selectSelectedRoom, selectSettings, useAppStore, type RoomDrag } from "@/store/app-store";
import { ROOM_LABEL_COLOR, SELECTION_COLOR } from "@/components/canvas/canvas-style";

/** Konva name of every room's area group; clicks find their room via `findAncestor(".room")`. */
export const ROOM_NODE_NAME = "room";

/** Four-headed arrow, defined in `index.css`. */
const MOVE_CURSOR = "var(--cursor-move-shape)";

const flat = (points: readonly PointCm[], dx = 0, dy = 0) => points.flatMap((p) => [p.x + dx, p.y + dy]);

/** What `RoomArea` reports while dragging; the floor is added by `RoomsLayer`. */
type RoomDragReport = Omit<RoomDrag, "floorId">;

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
 * - Areas: half-transparent white insides as click targets, the edges'
 *   dimensions (`placeRoomDimensions`, once per floor and zoom) and the names in
 *   fixed screen size, the blue outline of the selected room with its
 *   highlighted edge, and on top the door and window symbols (`OpeningsLayer`).
 *
 * Only the selected, unlocked room is draggable (with "select"); dragging moves it
 * relative to its start in 5-cm steps (1 cm with Alt). Near a parallel, opposite
 * edge of another room of the floor it sticks to that wall (`snapRoomDrag`, within
 * 8 screen px) at the thicker wall's distance, slides along it in the grid, snaps
 * its corners flush and tears off beyond 24 screen px across the wall; the walls
 * it sticks to are highlighted. Ctrl switches sticking off. The plan changes on
 * release. Dragging a locked room pans the view like dragging an unselected one.
 * The drag lives in the store (`roomDrag`, only read for this floor), so the
 * shapes layer can preview the shapes moving with the room.
 */
export function RoomsLayer({ floorId, scale, hoverMark }: RoomsLayerProps) {
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]);
    const wallColor = useAppStore((s) => s.plan.settings.wallColor);
    const selected = useAppStore(selectSelectedRoom);
    const selecting = useAppStore((s) => s.activeTool === "select");
    const highlightedEdge = useAppStore((s) => s.highlightedEdge);
    const altRef = useAltKeyRef();
    const shiftRef = useShiftKeyRef();
    const ctrlRef = useCtrlKeyRef();
    const selectedOpeningId = useAppStore((s) => s.selectedOpeningId);
    const storedDrag = useAppStore((s) => s.roomDrag);
    const setRoomDrag = useAppStore((s) => s.setRoomDrag);
    const drag = storedDrag?.floorId === floorId ? storedDrag : null;
    const setDrag = useCallback(
        (report: RoomDragReport | null) => setRoomDrag(report && { ...report, floorId }),
        [setRoomDrag, floorId],
    );
    const [openingDrag, setOpeningDrag] = useState<OpeningDrag | null>(null);
    const showDimensions = useAppStore((s) => s.showDimensions);
    // Whether a dimension fits outside depends on the text's size in cm, so on the zoom.
    const dimensions = useMemo(
        () =>
            showDimensions
                ? placeRoomDimensions(
                      rooms,
                      (text) => ({ widthCm: dimensionWidthPx(text) / scale, heightCm: DIMENSION_HEIGHT_PX / scale }),
                      DIMENSION_GAP_PX / scale,
                  )
                : null,
        [showDimensions, rooms, scale],
    );

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

    const stuckEdges = (drag?.stuckEdges ?? []).flatMap(({ roomId, edgeIndex }) => {
        const points = rooms.find((r) => r.id === roomId)?.pointsCm;
        if (!points || edgeIndex >= points.length) return [];
        return [{ key: `${roomId}:${edgeIndex}`, points: flat([points[edgeIndex], points[(edgeIndex + 1) % points.length]]) }];
    });

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
                {rooms.map((room, i) => (
                    <RoomArea
                        key={room.id}
                        floorId={floorId}
                        room={room}
                        rooms={rooms}
                        scale={scale}
                        dimensions={dimensions?.[i]}
                        draggable={selecting && room.id === selected?.id && !room.locked}
                        altRef={altRef}
                        ctrlRef={ctrlRef}
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
                {stuckEdges.map(({ key, points }) => (
                    <Line
                        key={`stuck-${key}`}
                        points={points}
                        stroke={SELECTION_COLOR}
                        strokeWidth={4}
                        strokeScaleEnabled={false}
                        lineCap="round"
                        listening={false}
                    />
                ))}
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
    /** All rooms of the floor; the others are the walls the room sticks to. */
    rooms: readonly Room[];
    scale: number;
    /** Placed dimensions of the room's edges; `undefined` while the dimensions are hidden. */
    dimensions: readonly PlacedDimension[] | undefined;
    draggable: boolean;
    altRef: RefObject<boolean>;
    /** Ctrl held: no sticking to walls. */
    ctrlRef: RefObject<boolean>;
    /** Reports the snapped offset and stuck walls while dragging, `null` when the drag ends. */
    onDrag: (drag: RoomDragReport | null) => void;
}

interface DragStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    snappedCm: PointCm;
    /** Walls the room sticks to after the last pointer move. */
    sticks: WallStick[];
}

const stickKey = (sticks: readonly WallStick[]) => sticks.map((s) => `${s.roomId}:${s.edgeIndex}`).join("|");

/**
 * One room's area, its dimensions (with the display on; placed by
 * `RoomsLayer`, they move with the dragged group) and its name; the group sits
 * at (0, 0) because the corners are absolute. Not draggable while locked, so a drag on it moves the stage.
 * While dragged, the offset follows the grid; across a wall of another room it
 * sticks (`snapRoomDrag`): captured within 8 screen px, torn off beyond 24 px,
 * corners flush along the wall. The sticks live in `dragRef` between pointer
 * moves. With Ctrl held only the grid applies and all sticks are dropped.
 */
function RoomArea({ floorId, room, rooms, scale, dimensions, draggable, altRef, ctrlRef, onDrag }: RoomAreaProps) {
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
        dragRef.current ??= { abs: this.absolutePosition(), snappedCm: { x: 0, y: 0 }, sticks: [] };
        const drag = dragRef.current;
        const step = snapStepCm(altRef.current, settings);
        const rawDelta = {
            x: (pos.x - drag.abs.x) * cmPerScreenPx,
            y: (pos.y - drag.abs.y) * cmPerScreenPx,
        };
        const gridDelta = { x: snapDelta(rawDelta.x, step), y: snapDelta(rawDelta.y, step) };
        const { delta: snappedCm, sticks } = ctrlRef.current
            ? { delta: gridDelta, sticks: [] }
            : snapRoomDrag({
                  points: room.pointsCm,
                  wallThicknessCm: room.wallThicknessCm,
                  others: rooms.filter((r) => r.id !== room.id),
                  rawDelta,
                  gridDelta,
                  sticks: drag.sticks,
                  captureCm: WALL_SNAP_CAPTURE_PX * cmPerScreenPx,
                  releaseCm: WALL_SNAP_RELEASE_PX * cmPerScreenPx,
              });
        const sticksChanged = stickKey(sticks) !== stickKey(drag.sticks);
        drag.sticks = sticks;
        if (sticksChanged || snappedCm.x !== drag.snappedCm.x || snappedCm.y !== drag.snappedCm.y) {
            drag.snappedCm = snappedCm;
            onDrag({
                id: room.id,
                dx: snappedCm.x,
                dy: snappedCm.y,
                stuckEdges: sticks.map(({ roomId, edgeIndex }) => ({ roomId, edgeIndex })),
            });
        }
        return {
            x: drag.abs.x + snappedCm.x / cmPerScreenPx,
            y: drag.abs.y + snappedCm.y / cmPerScreenPx,
        };
    };

    const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragRef.current = { abs: e.target.absolutePosition(), snappedCm: { x: 0, y: 0 }, sticks: [] };
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
            {dimensions?.map(({ label, centerCm }, i) => (
                <DimensionText
                    key={i}
                    text={label.text}
                    centerCm={centerCm}
                    rotationDeg={readableRotationDeg(label.edgeAngleDeg, 0)}
                    lengthCm={label.lengthCm}
                    scale={scale}
                    color={ROOM_LABEL_COLOR}
                />
            ))}
            <ShapeLabel text={room.name} color={ROOM_LABEL_COLOR} anchorCm={labelCm} scale={scale} rotationDeg={0} />
        </Group>
    );
}
