import type Konva from "konva";
import { useEffect, useMemo, useRef } from "react";
import { Circle, Layer, Line } from "react-konva";
import { create } from "zustand";
import { ShapeLabel } from "@/components/canvas/ShapeLabel";
import { isEditableTarget, isInDialog } from "@/hooks/isEditableTarget";
import { parseLengthCm } from "@/lib/calibration";
import { formatCm } from "@/lib/format";
import type { FloorId, PointCm } from "@/lib/plan-schema";
import {
    canAppendPoint,
    canClose,
    CORNER_SNAP_RADIUS_PX,
    pointAtDistance,
    resolveDraftPointer,
    snapDirection,
    type Direction,
} from "@/lib/room-drawing";
import { distanceCm } from "@/lib/room-geometry";
import type { Point } from "@/lib/viewport";
import { useAppStore, type RoomDraft } from "@/store/app-store";

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
}

const useDraftPointer = create<DraftPointerState>()(() => ({ cm: null, screen: null, shift: false }));

const EDGE_COLOR = "#18181B";
const INVALID_COLOR = "#DC2626";
/** `--selection`; Konva cannot read CSS variables. */
const SNAP_COLOR = "#2563EB";
/** Dash of the edge towards the pointer in screen px. */
const RUBBER_DASH = [6, 4];
/** Radius of the ring at the start point or a snapped corner, in screen px. */
const RING_RADIUS_PX = 6;
/** The edge length is shown this far above the middle of the edge, in screen px. */
const LENGTH_LABEL_OFFSET_PX = 12;

/** Digits with at most one comma or point, as typed so far. */
const PARTIAL_LENGTH = /^\d*([.,]\d*)?$/;

/** The edge the canvas shows towards the pointer: the typed length wins over the pointer's distance. */
interface DraftPreview {
    end: PointCm;
    valid: boolean;
    /** Snapped to the start point or a room corner (ring). */
    snapped: boolean;
    closes: boolean;
}

/** Direction of the next edge from the last corner towards the pointer, or `null`. */
function currentDirection(draft: RoomDraft, pointer: DraftPointerState): Direction | null {
    if (!pointer.cm) return null;
    return snapDirection(draft.points[draft.points.length - 1], pointer.cm, pointer.shift);
}

function previewFor(
    draft: RoomDraft | null,
    pointer: DraftPointerState,
    roomCorners: readonly PointCm[],
    scale: number,
): DraftPreview | null {
    if (!pointer.cm) return null;
    const points = draft?.points ?? [];
    const typed = draft ? parseLengthCm(draft.lengthText) : null;
    if (draft && typed !== null) {
        const direction = currentDirection(draft, pointer);
        if (!direction) return null;
        const end = pointAtDistance(points[points.length - 1], direction, typed);
        return { end, valid: canAppendPoint(points, end), snapped: false, closes: false };
    }
    const resolved = resolveDraftPointer(points, pointer.cm, roomCorners, CORNER_SNAP_RADIUS_PX / scale, pointer.shift);
    if (!resolved.point) return null;
    const valid = resolved.closes ? canClose(points) : canAppendPoint(points, resolved.point);
    return { end: resolved.point, valid, snapped: resolved.snapped, closes: resolved.closes };
}

interface RoomDraftLayerProps {
    floorId: FloorId;
    /** Current stage scale (screen px per cm). */
    scale: number;
}

/**
 * The room being drawn with „Raum“, above everything: the edges set so far,
 * the dashed edge towards the pointer with its length (red where the corner
 * is not allowed), a ring at the start point and at a snapped corner. Also
 * handles the keys while drawing: digits, comma and point type a length,
 * Enter sets it (or closes the outline with an empty field), Backspace
 * deletes a character or the last corner, Esc discards the outline.
 * Clicks are handled by the canvas (`FloorCanvas`).
 */
export function RoomDraftLayer({ floorId, scale }: RoomDraftLayerProps) {
    const draft = useAppStore((s) => s.roomDraft);
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]);
    const pointer = useDraftPointer();
    const layerRef = useRef<Konva.Layer>(null);

    const roomCorners = useMemo(() => rooms.flatMap((room) => room.pointsCm), [rooms]);

    // Track the pointer on the stage; Shift also changes the preview without moving the mouse.
    useEffect(() => {
        const stage = layerRef.current?.getStage();
        if (!stage) return;
        const onMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
            useDraftPointer.setState({
                cm: stage.getRelativePointerPosition(),
                screen: stage.getPointerPosition(),
                shift: e.evt.shiftKey,
            });
        };
        const onLeave = () => useDraftPointer.setState({ cm: null, screen: null });
        const onShift = (e: KeyboardEvent) => {
            if (e.key === "Shift") useDraftPointer.setState({ shift: e.type === "keydown" });
        };
        stage.on("mousemove.roomDraft", onMove);
        stage.on("mouseleave.roomDraft", onLeave);
        window.addEventListener("keydown", onShift);
        window.addEventListener("keyup", onShift);
        return () => {
            stage.off(".roomDraft");
            window.removeEventListener("keydown", onShift);
            window.removeEventListener("keyup", onShift);
            useDraftPointer.setState({ cm: null, screen: null, shift: false });
        };
    }, []);

    useRoomDraftKeys();

    const preview = previewFor(draft, pointer, roomCorners, scale);
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

/** Keys while a room is drawn; they go to the drawing before any other shortcut. */
function useRoomDraftKeys() {
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const state = useAppStore.getState();
            const draft = state.roomDraft;
            if (!draft || e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target) || isInDialog(e.target)) return;
            const handled = () => {
                e.preventDefault();
                e.stopPropagation();
            };
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
    }, []);
}

const HINTS = {
    length: "Muss größer als 0 cm sein",
    close: "Geht nicht: Der Umriss würde sich überschneiden",
} as const;

/** The typed length next to the pointer, with a hint after a rejected Enter. HTML above the canvas. */
export function RoomDraftField() {
    const draft = useAppStore((s) => s.roomDraft);
    const screen = useDraftPointer((s) => s.screen);
    if (!draft || !screen || (!draft.lengthText && !draft.hint)) return null;
    return (
        <div
            role="status"
            className="pointer-events-none absolute z-10 rounded-md border bg-background px-2 py-1 text-xs shadow-sm"
            style={{ left: screen.x + 16, top: screen.y + 16 }}
        >
            {draft.lengthText && <div className="font-medium tabular-nums">{draft.lengthText} cm</div>}
            {draft.hint && <div className="text-destructive">{HINTS[draft.hint]}</div>}
        </div>
    );
}
