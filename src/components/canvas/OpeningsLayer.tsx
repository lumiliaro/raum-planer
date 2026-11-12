import type Konva from "konva";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Group, Line } from "react-konva";
import { doorLeaf, edgeFrame, pointOnEdge, windowSymbol, type EdgeFrame } from "@/lib/opening-geometry";
import { dragOffset } from "@/lib/opening-placement";
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

const flat = (points: readonly PointCm[]) => points.flatMap((p) => [p.x, p.y]);

/** One stroked line of a symbol. */
interface SymbolLine {
    points: number[];
    closed?: boolean;
    dash?: number[];
}

/** An opening being dragged along its edge and its snapped offset (cm from the edge's start). */
export interface OpeningDrag {
    id: string;
    offsetCm: number;
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
    /** Reports the snapped offset while an opening is dragged, `null` when the drag ends. */
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
    /** Reports the snap point while dragging (`null` = on the grid or drag ended). */
    onSnap: (target: SnapTarget | null) => void;
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

/**
 * One opening: an invisible hit area over the gap (edge to the band's outer
 * side, i.e. the wall thickness of its edge), then the door leaf (solid) with its swing (dashed) or the window
 * rectangle with its center line. A passage has no symbol; selected, the hit
 * area's outline shows in the selection color. The group sits at (0, 0); dragging moves it
 * only along the edge, in 5-cm steps relative to the start (1 cm with Alt), and
 * stops at the edge's ends; within 8 screen px of a snap point (center, corner,
 * neighbor) it snaps there instead, unless Shift is held. The plan changes on
 * release (one undo step).
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

    const { hitArea, lines } = useMemo((): { hitArea: number[]; lines: SymbolLine[] } => {
        const symbol = windowSymbol(frame, opening, thicknessCm);
        const hitArea = flat(symbol.outline);
        // A passage shows nothing in its gap; only when selected its outline.
        if (opening.kind === "passage") return { hitArea, lines: selected ? [{ points: hitArea, closed: true }] : [] };
        if (opening.swing === null) {
            return { hitArea, lines: [{ points: hitArea, closed: true }, { points: flat(symbol.centerLine) }] };
        }
        const leaf = doorLeaf(frame, { ...opening, swing: opening.swing });
        return {
            hitArea,
            lines: [{ points: flat([leaf.hinge, leaf.leafEnd]) }, { points: flat(leaf.arcPoints), dash: SWING_DASH }],
        };
    }, [frame, opening, thicknessCm, selected]);

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
            onDrag({ id: opening.id, offsetCm });
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
            onMouseEnter={(e) => draggable && setCursor(e, MOVE_CURSOR)}
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
        </Group>
    );
}
