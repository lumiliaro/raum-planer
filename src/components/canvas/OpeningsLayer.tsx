import type Konva from "konva";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Group, Line, Rect } from "react-konva";
import { doorLeaf, edgeFrame, pointOnEdge, windowSymbol, type EdgeFrame } from "@/lib/opening-geometry";
import { defaultOpeningWidthCm, dragOffset } from "@/lib/opening-placement";
import { resizeOpening, resizeTargets, type ResizeSide, type ResizeTarget } from "@/lib/opening-resize";
import { openingSnapTargets, SNAP_POINT_TOLERANCE_PX, type SnapTarget } from "@/lib/opening-snap";
import type { FloorId, Opening, PointCm, Room } from "@/lib/plan-schema";
import { translatePoints } from "@/lib/room-geometry";
import { snapStepCm } from "@/lib/snap";
import { selectSettings, useAppStore } from "@/store/app-store";
import { OPENING_SYMBOL_COLOR, SELECTION_COLOR, SWING_DASH } from "@/components/canvas/canvas-style";

/** Konva name of every opening group; clicks find their opening via `findAncestor(".opening")`. */
export const OPENING_NODE_NAME = "opening";

/** Transparent, so the area still reacts to clicks. */
const HIT_FILL = "rgba(0,0,0,0)";
/** Extra hit width of the leaf and swing lines in screen px. */
const HIT_STROKE_PX = 10;
/** Four-headed arrow, defined in `index.css`. */
const MOVE_CURSOR = "var(--cursor-move-shape)";
/** How far the snap mark reaches past the edge and the wall's outer side, in screen px. */
const SNAP_MARK_OVERHANG_PX = 4;
/** Side of a resize handle in screen px, like the shapes' transformer anchors. */
const HANDLE_SIZE_PX = 7;
const HANDLE_STROKE_PX = 1.25;
const HANDLE_FILL = "#FFFFFF";
/** Konva name of the resize handles; the group's hover ignores them. */
const HANDLE_NODE_NAME = "opening-handle";

const flat = (points: readonly PointCm[]) => points.flatMap((p) => [p.x, p.y]);

/** One stroked line of a symbol. */
interface SymbolLine {
    points: number[];
    closed?: boolean;
    dash?: number[];
}

/** An opening being dragged along its edge or resized at a handle: its snapped placement (cm from the edge's start). */
export interface OpeningDrag {
    id: string;
    offsetCm: number;
    widthCm: number;
}

/** Where an opening snapped (or would snap): a line across the wall of edge `edgeIndex` at `atCm` from its start. */
export interface SnapMark {
    roomId: string;
    edgeIndex: number;
    atCm: number;
}

interface OpeningsLayerProps {
    floorId: FloorId;
    rooms: readonly Room[];
    /** Current stage scale (screen px per cm). */
    scale: number;
    /** Offset of a room being dragged; its openings move along. */
    roomOffset: (roomId: string) => { dx: number; dy: number };
    selectedId: string | null;
    draggable: boolean;
    altRef: RefObject<boolean>;
    /** Shift held: no snap points while dragging. */
    shiftRef: RefObject<boolean>;
    /** Reports the snapped placement while an opening is dragged or resized, `null` when the drag ends. */
    onDrag: (drag: OpeningDrag | null) => void;
    /** Snap mark while hovering an edge with „Tür“, „Fenster“ or „Durchgang“; a drag's own mark wins. */
    hoverMark: SnapMark | null;
}

/**
 * Door and window symbols (and passage hit areas) of all rooms, above the room areas and below the
 * shapes (a group in the rooms' area layer). The gaps in the wall bands are cut
 * in the wall layer (`RoomsLayer`). On top, the snap mark of a dragged
 * opening, else the hover mark.
 */
export function OpeningsLayer({
    floorId,
    rooms,
    scale,
    roomOffset,
    selectedId,
    draggable,
    altRef,
    shiftRef,
    onDrag,
    hoverMark,
}: OpeningsLayerProps) {
    const [dragMark, setDragMark] = useState<SnapMark | null>(null);
    const mark = dragMark ?? hoverMark;
    const markRoom = mark && rooms.find((r) => r.id === mark.roomId);
    const markPoints = (() => {
        if (!mark || !markRoom || mark.edgeIndex >= markRoom.pointsCm.length) return null;
        const { dx, dy } = roomOffset(markRoom.id);
        const frame = edgeFrame(translatePoints(markRoom.pointsCm, dx, dy), mark.edgeIndex);
        const overhangCm = SNAP_MARK_OVERHANG_PX / scale;
        const thicknessCm = markRoom.wallThicknessCm[mark.edgeIndex];
        return flat([pointOnEdge(frame, mark.atCm, -overhangCm), pointOnEdge(frame, mark.atCm, thicknessCm + overhangCm)]);
    })();

    return (
        <Group>
            {rooms.flatMap((room) => {
                const { dx, dy } = roomOffset(room.id);
                const points = dx === 0 && dy === 0 ? room.pointsCm : translatePoints(room.pointsCm, dx, dy);
                return room.openings.map((opening) => (
                    <OpeningNode
                        key={opening.id}
                        floorId={floorId}
                        opening={opening}
                        frame={edgeFrame(points, opening.edgeIndex)}
                        thicknessCm={room.wallThicknessCm[opening.edgeIndex]}
                        scale={scale}
                        selected={opening.id === selectedId}
                        draggable={draggable}
                        altRef={altRef}
                        shiftRef={shiftRef}
                        neighbors={room.openings}
                        onDrag={onDrag}
                        onSnap={(target) =>
                            setDragMark(target && { roomId: room.id, edgeIndex: opening.edgeIndex, atCm: target.markAtCm })
                        }
                    />
                ));
            })}
            {markPoints && (
                <Line
                    points={markPoints}
                    stroke={SELECTION_COLOR}
                    strokeWidth={2}
                    strokeScaleEnabled={false}
                    lineCap="round"
                    listening={false}
                />
            )}
        </Group>
    );
}

interface OpeningNodeProps {
    floorId: FloorId;
    opening: Opening;
    frame: EdgeFrame;
    /** Wall thickness of the opening's edge in cm. */
    thicknessCm: number;
    scale: number;
    selected: boolean;
    draggable: boolean;
    altRef: RefObject<boolean>;
    shiftRef: RefObject<boolean>;
    /** All openings of the room; those on the same edge (other than this one) give snap points. */
    neighbors: readonly Opening[];
    onDrag: (drag: OpeningDrag | null) => void;
    /** Reports the snap point while dragging or resizing (`null` = on the grid or drag ended). */
    onSnap: (target: Pick<SnapTarget, "markAtCm"> | null) => void;
}

interface DragStart {
    /** Absolute (screen) position at drag start. */
    abs: Konva.Vector2d;
    /** Last snapped offset in cm, used on release. */
    offsetCm: number;
    /** Snap points, fixed for the drag: the other openings do not move meanwhile. */
    targets: SnapTarget[];
    /** Last snap point reported, `null` = grid. */
    snap: SnapTarget | null;
}

/** Offset and width of an opening, cm along its edge. */
interface Placement {
    offsetCm: number;
    widthCm: number;
}

interface ResizeStart extends Placement {
    side: ResizeSide;
    /** Absolute (screen) position of the handle at drag start. */
    abs: Konva.Vector2d;
    /** Snap points for the dragged end, fixed for the drag. */
    targets: ResizeTarget[];
    /** Last snap point reported, `null` = grid. */
    snap: ResizeTarget | null;
}

/** Position of the `side` end of an opening, cm from the edge's start. */
const endOf = (side: ResizeSide, o: Placement) => (side === "end" ? o.offsetCm + o.widthCm : o.offsetCm);

/**
 * One opening: an invisible hit area over the gap (edge to the band's outer
 * side, i.e. the wall thickness of its edge), then the door leaf (solid) with its swing (dashed) or the window
 * rectangle with its center line. A passage has no symbol; selected, the hit
 * area's outline shows in the selection color. The group sits at (0, 0); dragging moves it
 * only along the edge, in 5-cm steps relative to the start (1 cm with Alt), and
 * stops at the edge's ends; within 8 screen px of a snap point (center, corner,
 * neighbor) it snaps there instead, unless Shift is held. A selected window
 * or passage shows a handle at each end of its gap; dragging one moves only
 * that end (same grid, edge ends, at least 10 cm wide, snap points for the
 * end). The plan changes on release (one undo step).
 */
function OpeningNode({
    floorId,
    opening,
    frame,
    thicknessCm,
    scale,
    selected,
    draggable,
    altRef,
    shiftRef,
    neighbors,
    onDrag,
    onSnap,
}: OpeningNodeProps) {
    const selectOpening = useAppStore((s) => s.selectOpening);
    const updateOpening = useAppStore((s) => s.updateOpening);
    const settings = useAppStore(selectSettings);
    const groupRef = useRef<Konva.Group>(null);
    const dragRef = useRef<DragStart | null>(null);
    const resizeRef = useRef<ResizeStart | null>(null);
    /** Placement while a handle is dragged; the symbol follows it. */
    const [preview, setPreview] = useState<Placement | null>(null);
    const placed = useMemo(() => (preview ? { ...opening, ...preview } : opening), [opening, preview]);

    const { hitArea, lines } = useMemo((): { hitArea: number[]; lines: SymbolLine[] } => {
        const symbol = windowSymbol(frame, placed, thicknessCm);
        const hitArea = flat(symbol.outline);
        // A passage shows nothing in its gap; only when selected its outline.
        if (placed.kind === "passage") return { hitArea, lines: selected ? [{ points: hitArea, closed: true }] : [] };
        if (placed.swing === null) {
            return { hitArea, lines: [{ points: hitArea, closed: true }, { points: flat(symbol.centerLine) }] };
        }
        const leaf = doorLeaf(frame, { ...placed, swing: placed.swing });
        return {
            hitArea,
            lines: [{ points: flat([leaf.hinge, leaf.leafEnd]) }, { points: flat(leaf.arcPoints), dash: SWING_DASH }],
        };
    }, [frame, placed, thicknessCm, selected]);

    // Reset the move cursor when the opening stops being draggable or disappears while hovered.
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

    const startDrag = (abs: Konva.Vector2d): DragStart => {
        const others = neighbors.filter((o) => o.edgeIndex === opening.edgeIndex && o.id !== opening.id);
        const targets = openingSnapTargets(frame.lengthCm, opening.widthCm, others);
        return { abs, offsetCm: opening.offsetCm, targets, snap: null };
    };

    const dragBound = function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
        dragRef.current ??= startDrag(this.absolutePosition());
        const drag = dragRef.current;
        // The stage only scales and pans, so a screen move divided by the scale is the move in cm.
        const alongCm = ((pos.x - drag.abs.x) * frame.dir.x + (pos.y - drag.abs.y) * frame.dir.y) / scale;
        const snapPoints = shiftRef.current ? null : { targets: drag.targets, toleranceCm: SNAP_POINT_TOLERANCE_PX / scale };
        const { offsetCm, snap } = dragOffset(
            opening.offsetCm,
            alongCm,
            snapStepCm(altRef.current, settings),
            frame.lengthCm,
            opening.widthCm,
            snapPoints,
        );
        if (offsetCm !== drag.offsetCm) {
            drag.offsetCm = offsetCm;
            onDrag({ id: opening.id, offsetCm, widthCm: opening.widthCm });
        }
        if (snap !== drag.snap) {
            drag.snap = snap;
            onSnap(snap);
        }
        const movedPx = (offsetCm - opening.offsetCm) * scale;
        return { x: drag.abs.x + frame.dir.x * movedPx, y: drag.abs.y + frame.dir.y * movedPx };
    };

    const onDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
        dragRef.current = startDrag(e.target.absolutePosition());
        selectOpening(opening.id);
    };

    const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (drag && drag.offsetCm !== opening.offsetCm) updateOpening(floorId, opening.id, { offsetCm: drag.offsetCm });
        // The plan now carries the move (or the change was rejected): back to the origin.
        e.target.position({ x: 0, y: 0 });
        onDrag(null);
        onSnap(null);
    };

    const startResize = (side: ResizeSide, abs: Konva.Vector2d): ResizeStart => {
        const others = neighbors.filter((o) => o.edgeIndex === opening.edgeIndex && o.id !== opening.id);
        const fixedEndCm = endOf(side === "end" ? "start" : "end", opening);
        const defaultWidthCm = defaultOpeningWidthCm(opening.kind, settings);
        const targets = resizeTargets(frame.lengthCm, fixedEndCm, side, others, defaultWidthCm);
        return { side, abs, offsetCm: opening.offsetCm, widthCm: opening.widthCm, targets, snap: null };
    };

    const resizeBound = (side: ResizeSide) =>
        function (this: Konva.Node, pos: Konva.Vector2d): Konva.Vector2d {
            resizeRef.current ??= startResize(side, this.absolutePosition());
            const resize = resizeRef.current;
            const alongCm = ((pos.x - resize.abs.x) * frame.dir.x + (pos.y - resize.abs.y) * frame.dir.y) / scale;
            const snapPoints = shiftRef.current
                ? null
                : { targets: resize.targets, toleranceCm: SNAP_POINT_TOLERANCE_PX / scale };
            const result = resizeOpening(
                opening,
                side,
                alongCm,
                snapStepCm(altRef.current, settings),
                frame.lengthCm,
                snapPoints,
            );
            if (result.offsetCm !== resize.offsetCm || result.widthCm !== resize.widthCm) {
                resize.offsetCm = result.offsetCm;
                resize.widthCm = result.widthCm;
                setPreview({ offsetCm: result.offsetCm, widthCm: result.widthCm });
                onDrag({ id: opening.id, offsetCm: result.offsetCm, widthCm: result.widthCm });
            }
            if (result.snap !== resize.snap) {
                resize.snap = result.snap;
                onSnap(result.snap);
            }
            const movedPx = (endOf(side, result) - endOf(side, opening)) * scale;
            return { x: resize.abs.x + frame.dir.x * movedPx, y: resize.abs.y + frame.dir.y * movedPx };
        };

    // The handle's drag events must not reach the group (it would treat them as a move) or the stage.
    const onResizeStart = (side: ResizeSide) => (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        resizeRef.current = startResize(side, e.target.absolutePosition());
    };

    const onResizeEnd = (side: ResizeSide) => (e: Konva.KonvaEventObject<DragEvent>) => {
        e.cancelBubble = true;
        const resize = resizeRef.current;
        resizeRef.current = null;
        const final = resize ?? opening;
        if (final.offsetCm !== opening.offsetCm || final.widthCm !== opening.widthCm) {
            updateOpening(floorId, opening.id, { offsetCm: final.offsetCm, widthCm: final.widthCm });
        }
        e.target.position(pointOnEdge(frame, endOf(side, final), thicknessCm / 2));
        setPreview(null);
        onDrag(null);
        onSnap(null);
    };

    const showHandles = selected && draggable && opening.kind !== "door";
    const color = selected ? SELECTION_COLOR : OPENING_SYMBOL_COLOR;
    return (
        <Group
            ref={groupRef}
            id={opening.id}
            name={OPENING_NODE_NAME}
            draggable={draggable}
            dragBoundFunc={dragBound}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onMouseEnter={(e) => draggable && e.target.name() !== HANDLE_NODE_NAME && setCursor(e, MOVE_CURSOR)}
            onMouseLeave={(e) => setCursor(e, "")}
        >
            <Line points={hitArea} closed fill={HIT_FILL} perfectDrawEnabled={false} />
            {lines.map((line, i) => (
                <Line
                    key={i}
                    points={line.points}
                    closed={line.closed}
                    dash={line.dash}
                    stroke={color}
                    strokeWidth={selected ? 2 : 1.5}
                    strokeScaleEnabled={false}
                    hitStrokeWidth={HIT_STROKE_PX}
                    lineJoin="round"
                    lineCap="round"
                />
            ))}
            {showHandles &&
                (["start", "end"] as const).map((side) => (
                    <ResizeHandle
                        key={side}
                        frame={frame}
                        tCm={endOf(side, placed)}
                        thicknessCm={thicknessCm}
                        scale={scale}
                        dragBoundFunc={resizeBound(side)}
                        onDragStart={onResizeStart(side)}
                        onDragMove={(e) => (e.cancelBubble = true)}
                        onDragEnd={onResizeEnd(side)}
                    />
                ))}
        </Group>
    );
}

interface ResizeHandleProps {
    frame: EdgeFrame;
    /** Position of the handle along the edge, cm from its start. */
    tCm: number;
    thicknessCm: number;
    scale: number;
    dragBoundFunc: (this: Konva.Node, pos: Konva.Vector2d) => Konva.Vector2d;
    onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

/**
 * A resize handle: a small white square with a border in the selection
 * color, centered in the wall at `tCm`, turned with the edge and the same size
 * at every zoom. The cursor is a double arrow along the edge (the nearer axis
 * on slanted edges).
 */
function ResizeHandle({ frame, tCm, thicknessCm, scale, dragBoundFunc, onDragStart, onDragMove, onDragEnd }: ResizeHandleProps) {
    const ref = useRef<Konva.Rect>(null);
    const cursor = Math.abs(frame.dir.x) >= Math.abs(frame.dir.y) ? "ew-resize" : "ns-resize";
    const center = pointOnEdge(frame, tCm, thicknessCm / 2);
    const sizeCm = HANDLE_SIZE_PX / scale;

    // Reset the resize cursor when the handle disappears while hovered.
    useEffect(() => {
        const container = ref.current?.getStage()?.container();
        return () => {
            if (container?.style.cursor === cursor) container.style.cursor = "";
        };
    }, [cursor]);

    const setCursor = (e: Konva.KonvaEventObject<MouseEvent>, value: string) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = value;
    };

    return (
        <Rect
            ref={ref}
            name={HANDLE_NODE_NAME}
            x={center.x}
            y={center.y}
            width={sizeCm}
            height={sizeCm}
            offsetX={sizeCm / 2}
            offsetY={sizeCm / 2}
            rotation={(Math.atan2(frame.dir.y, frame.dir.x) * 180) / Math.PI}
            fill={HANDLE_FILL}
            stroke={SELECTION_COLOR}
            strokeWidth={HANDLE_STROKE_PX}
            strokeScaleEnabled={false}
            draggable
            dragBoundFunc={dragBoundFunc}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onMouseEnter={(e) => setCursor(e, cursor)}
            // Back over the opening: the group's move cursor; leaving the group resets it afterwards.
            onMouseLeave={(e) => setCursor(e, MOVE_CURSOR)}
        />
    );
}
