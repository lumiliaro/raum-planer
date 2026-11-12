import type Konva from "konva";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Circle, Layer, Line } from "react-konva";
import { create } from "zustand";
import { DimensionText } from "@/components/canvas/DimensionText";
import { DIMENSION_GAP_PX, DIMENSION_HEIGHT_PX } from "@/components/canvas/dimension-measure";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import { isEditableTarget, isInDialog } from "@/hooks/isEditableTarget";
import { parseLengthCm } from "@/lib/calibration";
import { readableRotationDeg } from "@/lib/dimensions";
import { formatCm } from "@/lib/format";
import type { FloorId, PointCm, Room } from "@/lib/plan-schema";
import {
    canAppendPoint,
    canClose,
    CORNER_SNAP_RADIUS_PX,
    parseOffsetCm,
    pointAtDistance,
    pointOnWall,
    resolveDraftPointer,
    snapDirection,
    wallAnchorOf,
    wallDistances,
    wallLineFor,
    wallLines,
    type DraftGuide,
    type Direction,
    type WallLine,
    type WallPosition,
} from "@/lib/room-drawing";
import { distanceCm } from "@/lib/room-geometry";
import { snapStepCm } from "@/lib/snap";
import type { Point } from "@/lib/viewport";
import { selectSettings, useAppStore, type RoomDraft } from "@/store/app-store";

/**
 * Where the pointer is while drawing a room. Session state of the canvas
 * only: it changes on every mouse move, so it stays out of the app store.
 */
interface DraftPointerState {
    /** World point (cm) under the pointer; `null` outside the canvas. */
    cm: PointCm | null;
    /** Pointer in screen pixels relative to the canvas. */
    screen: Point | null;
    /** Shift held: free angle instead of 0°/90°/180°/270°. */
    shift: boolean;
    /** Ctrl held: no snapping to guides or wall lines. */
    ctrl: boolean;
    /** Alt held: fine steps along a wall line. */
    alt: boolean;
}

const useDraftPointer = create<DraftPointerState>()(() => ({
    cm: null,
    screen: null,
    shift: false,
    ctrl: false,
    alt: false,
}));

const EDGE_COLOR = "#18181B";
const INVALID_COLOR = "#DC2626";
/** `--selection`; Konva cannot read CSS variables. */
const SNAP_COLOR = "#2563EB";
/** Dash of the edge towards the pointer in screen px. */
const RUBBER_DASH = [6, 4];
/** Dash of a guide in screen px. */
const GUIDE_DASH = [4, 4];
/** Radius of the ring at the start point or a snapped corner, in screen px. */
const RING_RADIUS_PX = 6;
/** The edge length is shown this far above the middle of the edge, in screen px. */
const LENGTH_LABEL_OFFSET_PX = 12;
/** Radius of the filled dot at the reference end of a wall position, in screen px. */
const WALL_END_DOT_PX = 3.5;
/** Distance of the wall distances' center from the wall line, in screen px (clear of the ring). */
const WALL_LABEL_OFFSET_PX = RING_RADIUS_PX + DIMENSION_GAP_PX + DIMENSION_HEIGHT_PX / 2;

/** Digits with at most one comma or point, as typed so far. */
const PARTIAL_LENGTH = /^\d*([.,]\d*)?$/;

/** The edge the canvas shows towards the pointer: the typed length wins over the pointer's distance. */
interface DraftPreview {
    end: PointCm;
    valid: boolean;
    /** Snapped to the start point or a room corner (ring). */
    snapped: boolean;
    closes: boolean;
    /** Guides the end snapped to (none for a typed length). */
    guides: DraftGuide[];
    /** The first corner on a wall line (snapped or at the typed distance). */
    wall?: WallPosition;
}

/**
 * The wall position at the typed distance of a draft with `wallAnchor`. A
 * partial or too large text shows its longest valid beginning ("520" on a
 * 500-cm wall: 52 cm), nothing valid the reference end; `null` if the line is gone.
 */
function typedWallPosition(draft: RoomDraft, rooms: readonly Room[]): WallPosition | null {
    if (!draft.wallAnchor) return null;
    const line = wallLineFor(rooms, draft.wallAnchor);
    if (!line) return null;
    const { fromEnd } = draft.wallAnchor;
    let offsetCm = 0;
    for (let n = draft.lengthText.length; n > 0; n--) {
        const typed = parseOffsetCm(draft.lengthText.slice(0, n));
        if (typed !== null && typed <= line.lengthCm) {
            offsetCm = typed;
            break;
        }
    }
    return { line, fromEnd, offsetCm, point: pointOnWall(line, fromEnd, offsetCm) };
}

interface PreviewInput {
    rooms: readonly Room[];
    roomCorners: readonly PointCm[];
    walls: readonly WallLine[];
    /** Current stage scale (screen px per cm). */
    scale: number;
    /** „Einrasten“ on. */
    snapping: boolean;
    /** Step along a wall line, without and with Alt. */
    settings: { snapStepCm: number; fineSnapStepCm: number };
}

/** Direction of the next edge from the last corner towards the pointer, or `null`. */
function currentDirection(draft: RoomDraft, pointer: DraftPointerState): Direction | null {
    if (!pointer.cm) return null;
    return snapDirection(draft.points[draft.points.length - 1], pointer.cm, pointer.shift);
}

function previewFor(
    draft: RoomDraft | null,
    pointer: DraftPointerState,
    { rooms, roomCorners, walls, scale, snapping, settings }: PreviewInput,
): DraftPreview | null {
    if (draft?.wallAnchor) {
        // The distance is being typed: the line stays fixed wherever the pointer is.
        const wall = typedWallPosition(draft, rooms);
        return wall ? { end: wall.point, valid: true, snapped: false, closes: false, guides: [], wall } : null;
    }
    if (!pointer.cm) return null;
    const points = draft?.points ?? [];
    const typed = draft ? parseLengthCm(draft.lengthText) : null;
    if (draft && typed !== null) {
        const direction = currentDirection(draft, pointer);
        if (!direction) return null;
        const end = pointAtDistance(points[points.length - 1], direction, typed);
        return { end, valid: canAppendPoint(points, end), snapped: false, closes: false, guides: [] };
    }
    const resolved = resolveDraftPointer(points, pointer.cm, roomCorners, {
        radiusCm: CORNER_SNAP_RADIUS_PX / scale,
        free: pointer.shift,
        guides: snapping && !pointer.ctrl,
        walls: snapping && !pointer.ctrl ? walls : null,
        stepCm: snapStepCm(pointer.alt, settings),
    });
    if (!resolved.point) return null;
    const valid = resolved.closes ? canClose(points) : canAppendPoint(points, resolved.point);
    return {
        end: resolved.point,
        valid,
        snapped: resolved.snapped,
        closes: resolved.closes,
        guides: resolved.guides,
        wall: resolved.wall,
    };
}

interface RoomDraftLayerProps {
    floorId: FloorId;
    /** Current stage scale (screen px per cm). */
    scale: number;
}

/**
 * The room being drawn with „Raum“, above everything: the edges set so far,
 * the dashed edge towards the pointer with its length (red where the corner
 * is not allowed), a ring at the start point and at a snapped corner, and
 * dashed guides from the corner the next corner is aligned with. Before the
 * first corner, a start point on a wall line is marked with a ring, its
 * reference end with a dot and both distances to the wall ends. Also
 * handles the keys while drawing: digits, comma and point type a length
 * (before the first corner at a wall: the distance on the wall), Enter sets
 * it (or closes the outline with an empty field), Tab measures the distance
 * from the other wall end, Backspace deletes a character or the last corner,
 * Esc discards the outline.
 * Clicks are handled by the canvas (`FloorCanvas`).
 */
export function RoomDraftLayer({ floorId, scale }: RoomDraftLayerProps) {
    const draft = useAppStore((s) => s.roomDraft);
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]);
    const snapping = useAppStore((s) => s.shapeSnapping);
    const settings = useAppStore(selectSettings);
    const pointer = useDraftPointer();
    const layerRef = useRef<Konva.Layer>(null);

    const roomCorners = useMemo(() => rooms.flatMap((room) => room.pointsCm), [rooms]);
    const walls = useMemo(() => wallLines(rooms), [rooms]);

    // Track the pointer on the stage; Shift, Ctrl and Alt also change the preview without moving the mouse.
    useEffect(() => {
        const stage = layerRef.current?.getStage();
        if (!stage) return;
        const onMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
            useDraftPointer.setState({
                cm: stage.getRelativePointerPosition(),
                screen: stage.getPointerPosition(),
                shift: e.evt.shiftKey,
                ctrl: e.evt.ctrlKey,
                alt: e.evt.altKey,
            });
        };
        const onLeave = () => useDraftPointer.setState({ cm: null, screen: null });
        const onModifier = (e: KeyboardEvent) => {
            if (e.key === "Shift") useDraftPointer.setState({ shift: e.type === "keydown" });
            else if (e.key === "Control") useDraftPointer.setState({ ctrl: e.type === "keydown" });
            else if (e.key === "Alt") useDraftPointer.setState({ alt: e.type === "keydown" });
        };
        stage.on("mousemove.roomDraft", onMove);
        stage.on("mouseleave.roomDraft", onLeave);
        window.addEventListener("keydown", onModifier);
        window.addEventListener("keyup", onModifier);
        return () => {
            stage.off(".roomDraft");
            window.removeEventListener("keydown", onModifier);
            window.removeEventListener("keyup", onModifier);
            useDraftPointer.setState({ cm: null, screen: null, shift: false, ctrl: false, alt: false });
        };
    }, []);

    const preview = previewFor(draft, pointer, { rooms, roomCorners, walls, scale, snapping, settings });
    // The keys open the field „Abstand“ for the wall position currently shown.
    const shownWall = useRef<WallPosition | null>(null);
    shownWall.current = preview?.wall ?? null;
    useRoomDraftKeys(shownWall);

    const points = draft?.points ?? [];
    const last = points.at(-1);
    const px = 1 / scale;

    const rubber = last && preview ? [last.x, last.y, preview.end.x, preview.end.y] : null;
    const length = last && preview ? distanceCm(last, preview.end) : 0;
    const labelCm =
        last && preview ? { x: (last.x + preview.end.x) / 2, y: (last.y + preview.end.y) / 2 - LENGTH_LABEL_OFFSET_PX * px } : null;
    const rubberColor = preview?.valid ? EDGE_COLOR : INVALID_COLOR;

    return (
        <Layer ref={layerRef} listening={false}>
            {points.length >= 2 && (
                <Line
                    points={points.flatMap((p) => [p.x, p.y])}
                    stroke={EDGE_COLOR}
                    strokeWidth={2}
                    strokeScaleEnabled={false}
                    lineJoin="round"
                />
            )}
            {preview?.guides.map((guide) => (
                <Line
                    key={guide.axis}
                    points={[guide.from.x, guide.from.y, preview.end.x, preview.end.y]}
                    stroke={SNAP_COLOR}
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                    dash={GUIDE_DASH}
                />
            ))}
            {rubber && (
                <Line points={rubber} stroke={rubberColor} strokeWidth={2} strokeScaleEnabled={false} dash={RUBBER_DASH} />
            )}
            {labelCm && length > 0 && (
                <ShapeLabel text={formatCm(length)} color={rubberColor} anchorCm={labelCm} scale={scale} rotationDeg={0} />
            )}
            {points[0] && (
                <Circle
                    x={points[0].x}
                    y={points[0].y}
                    radius={RING_RADIUS_PX * px}
                    stroke={EDGE_COLOR}
                    strokeWidth={1.5}
                    strokeScaleEnabled={false}
                    fill="#FFFFFF"
                />
            )}
            {preview?.wall && <WallPositionMark position={preview.wall} scale={scale} />}
            {preview?.snapped && (
                <Circle
                    x={preview.end.x}
                    y={preview.end.y}
                    radius={RING_RADIUS_PX * px}
                    stroke={SNAP_COLOR}
                    strokeWidth={2}
                    strokeScaleEnabled={false}
                />
            )}
        </Layer>
    );
}

/**
 * A start point on a wall line: ring at the point, filled dot at the reference
 * end and the distances to both wall ends along the line (left out at 0 cm or
 * where they do not fit), on the side of the line away from the wall band.
 */
function WallPositionMark({ position, scale }: { position: WallPosition; scale: number }) {
    const px = 1 / scale;
    const { line, fromEnd, point } = position;
    const { fromStartCm, fromEndCm } = wallDistances(position);
    const refEnd = fromEnd === "start" ? line.start : line.end;
    // Outer side: away from the room; inner side: into the room.
    const side = (line.face === "outer" ? 1 : -1) * WALL_LABEL_OFFSET_PX * px;
    const angleDeg = (Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180) / Math.PI;
    const rotationDeg = readableRotationDeg(angleDeg, 0);
    const distances = [
        { key: "start", from: line.start, lengthCm: fromStartCm },
        { key: "end", from: line.end, lengthCm: fromEndCm },
    ];
    return (
        <>
            <Circle
                x={point.x}
                y={point.y}
                radius={RING_RADIUS_PX * px}
                stroke={SNAP_COLOR}
                strokeWidth={2}
                strokeScaleEnabled={false}
            />
            <Circle x={refEnd.x} y={refEnd.y} radius={WALL_END_DOT_PX * px} fill={SNAP_COLOR} />
            {distances.map(
                ({ key, from, lengthCm }) =>
                    lengthCm > 0 && (
                        <DimensionText
                            key={key}
                            text={formatCm(lengthCm)}
                            centerCm={{
                                x: (from.x + point.x) / 2 + line.outwardNormal.x * side,
                                y: (from.y + point.y) / 2 + line.outwardNormal.y * side,
                            }}
                            rotationDeg={rotationDeg}
                            lengthCm={lengthCm}
                            scale={scale}
                            color={SNAP_COLOR}
                        />
                    ),
            )}
        </>
    );
}

/**
 * Keys while a room is drawn; they go to the drawing before any other shortcut.
 * Before the first corner a digit only opens the field „Abstand“ while
 * `shownWall` holds a wall position; otherwise it goes to the other shortcuts.
 * New keys must also be added to `components/help/shortcuts.ts`.
 */
function useRoomDraftKeys(shownWall: RefObject<WallPosition | null>) {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const state = useAppStore.getState();
            const draft = state.roomDraft;
            if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target) || isInDialog(e.target)) return;
            const handled = () => {
                e.preventDefault();
                e.stopPropagation();
            };
            if (!draft) {
                const wall = shownWall.current;
                if (wall && /^[0-9]$/.test(e.key) && state.startWallOffset(wallAnchorOf(wall), e.key)) handled();
                return;
            }
            if (draft.wallAnchor) {
                if (e.key === "Tab") {
                    handled();
                    state.toggleWallOffsetEnd();
                    return;
                }
                if (e.key === "Enter") {
                    handled();
                    state.commitWallOffset();
                    return;
                }
            }
            if (/^[0-9.,]$/.test(e.key)) {
                handled();
                const text = draft.lengthText + e.key;
                if (PARTIAL_LENGTH.test(text)) state.setDraftLength(text);
            } else if (e.key === "Backspace") {
                handled();
                if (draft.lengthText) state.setDraftLength(draft.lengthText.slice(0, -1));
                else state.removeLastDraftPoint();
            } else if (e.key === "Enter") {
                handled();
                if (draft.lengthText) state.commitDraftLength(currentDirection(draft, useDraftPointer.getState()));
                else state.closeDraft();
            } else if (e.key === "Escape") {
                handled();
                state.cancelDraft();
            }
        };
        // Capture phase: digits must not reach the zoom keys (0 = fit), Esc not the tool switch.
        window.addEventListener("keydown", onKeyDown, { capture: true });
        return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
    }, [shownWall]);
}

const HINTS = {
    length: "Muss größer als 0 cm sein",
    close: "Geht nicht: Der Umriss würde sich überschneiden",
} as const;

/** The typed length (or distance on a wall) next to the pointer, with a hint after a rejected Enter. HTML above the canvas. */
export function RoomDraftField() {
    const draft = useAppStore((s) => s.roomDraft);
    const rooms = useAppStore((s) => s.plan.roomsByFloor[s.plan.activeFloorId]);
    const screen = useDraftPointer((s) => s.screen);
    if (!draft || !screen || (!draft.lengthText && !draft.hint)) return null;
    const hint = (h: NonNullable<RoomDraft["hint"]>): string => {
        if (h !== "wallTooLong") return HINTS[h];
        const line = draft.wallAnchor ? wallLineFor(rooms ?? [], draft.wallAnchor) : null;
        return line ? `Darf höchstens ${formatCm(line.lengthCm)} sein` : "";
    };
    return (
        <div
            role="status"
            className="pointer-events-none absolute z-10 rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
            style={{ left: screen.x + 16, top: screen.y + 16 }}
        >
            {draft.lengthText && (
                <div className="font-medium tabular-nums">
                    {draft.wallAnchor ? "Abstand: " : ""}
                    {draft.lengthText} cm
                </div>
            )}
            {draft.hint && <div className="text-destructive">{hint(draft.hint)}</div>}
        </div>
    );
}
