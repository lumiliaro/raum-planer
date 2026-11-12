import type Konva from "konva";
import { useEffect, useMemo, useRef, useState } from "react";
import { Stage } from "react-konva";
import { OPENING_NODE_NAME, type SnapMark } from "@/components/canvas/OpeningsLayer";
import { RoomDraftField, RoomDraftLayer } from "@/components/canvas/RoomDraftLayer";
import { ROOM_NODE_NAME, RoomsLayer } from "@/components/canvas/RoomsLayer";
import { SHAPE_NODE_NAME } from "@/components/canvas/ShapeNode";
import { ShapesLayer } from "@/components/canvas/ShapesLayer";
import { ZoomControls } from "@/components/canvas/ZoomControls";
import { GridLayer } from "@/components/underlay/GridLayer";
import { MissingImageHint } from "@/components/underlay/MissingImageHint";
import { UnderlayLayer } from "@/components/underlay/UnderlayLayer";
import { useUnderlayImage } from "@/components/underlay/useUnderlayImage";
import { useElementSize } from "@/hooks/useElementSize";
import { isEditableTarget, isInDialog } from "@/hooks/isEditableTarget";
import { floorContentBounds, visibleUnderlayRect } from "@/lib/content-bounds";
import { edgeFrame } from "@/lib/opening-geometry";
import { EDGE_HIT_TOLERANCE_PX, nearestRoomEdge, newOpeningSnap } from "@/lib/opening-placement";
import { SNAP_POINT_TOLERANCE_PX } from "@/lib/opening-snap";
import type { PointCm } from "@/lib/plan-schema";
import { CORNER_SNAP_RADIUS_PX, resolveDraftPointer } from "@/lib/room-drawing";
import { cmToImagePoint } from "@/lib/underlay";
import { fitViewport, screenToWorld, wheelFactor, zoomAt, zoomAtCenter, ZOOM_STEP } from "@/lib/viewport";
import { isOpeningTool, OPENING_KIND_OF_TOOL, selectSettings, useAppStore } from "@/store/app-store";

/**
 * The drawing area of the active floor, in cm (100 % = 1 screen px per cm):
 * underlay, the 1-m grid when no underlay is visible, rooms, shapes, the room
 * being drawn and – in calibration mode – only the calibration overlay on the
 * underlay. A missing underlay image is reported by a card with „Bild laden“.
 */
export function FloorCanvas() {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const vp = useAppStore((s) => s.viewports[floorId]);
    const setViewport = useAppStore((s) => s.setViewport);
    const calibrating = useAppStore((s) => s.calibrationDraft !== null);
    const showDimensions = useAppStore((s) => s.showDimensions);
    const toggleDimensions = useAppStore((s) => s.toggleDimensions);
    const shapeSnapping = useAppStore((s) => s.shapeSnapping);
    const toggleShapeSnapping = useAppStore((s) => s.toggleShapeSnapping);
    const addCalibrationPoint = useAppStore((s) => s.addCalibrationPoint);
    const underlay = useAppStore((s) => s.plan.underlayByFloor[floorId]);
    const shapes = useAppStore((s) => s.plan.shapesByFloor[floorId]);
    const rooms = useAppStore((s) => s.plan.roomsByFloor[floorId]);
    const activeTool = useAppStore((s) => s.activeTool);
    const insertShape = useAppStore((s) => s.insertShape);
    const insertOpening = useAppStore((s) => s.insertOpening);
    const selectShape = useAppStore((s) => s.selectShape);
    const selectRoom = useAppStore((s) => s.selectRoom);
    const selectOpening = useAppStore((s) => s.selectOpening);
    const addDraftPoint = useAppStore((s) => s.addDraftPoint);
    const closeDraft = useAppStore((s) => s.closeDraft);
    const settings = useAppStore(selectSettings);

    // With „Tür“, „Fenster“ or „Durchgang“: whether the pointer is over a room edge or its band (insert
    // cursor), and the snap mark where an opening set there would snap.
    const [overEdge, setOverEdge] = useState(false);
    const [hoverMark, setHoverMark] = useState<SnapMark | null>(null);
    const lastPointerCm = useRef<PointCm | null>(null);
    const openingTool = !calibrating && isOpeningTool(activeTool);
    // A new tool starts without a mark; the next pointer move computes it.
    const [markTool, setMarkTool] = useState(activeTool);
    if (markTool !== activeTool) {
        setMarkTool(activeTool);
        setHoverMark(null);
    }

    const { image, availability } = useUnderlayImage(underlay?.imageId ?? null);
    const [containerRef, size, container] = useElementSize<HTMLDivElement>();

    // An underlay with a loaded image always has its pixel size in the plan.
    const geometry = useMemo(() => {
        if (!underlay || !image || underlay.imageWidthPx === null || underlay.imageHeightPx === null) return null;
        return { ...underlay, imageWidthPx: underlay.imageWidthPx, imageHeightPx: underlay.imageHeightPx };
    }, [underlay, image]);
    const imageShown = availability === "ready" && geometry !== null;
    // In calibration mode the underlay is always visible and fully opaque.
    const underlayVisible = imageShown && (calibrating || geometry.visible);
    const hasArea = size.width > 0 && size.height > 0;
    // Fit only once the image is loaded or known to be missing.
    const contentKnown = !underlay || availability !== "loading";

    const contentBounds = useMemo(
        () =>
            floorContentBounds({
                underlayRect: visibleUnderlayRect(geometry ?? undefined, underlayVisible),
                shapes: calibrating ? [] : shapes,
                rooms: calibrating ? [] : rooms,
            }),
        [geometry, underlayVisible, calibrating, shapes, rooms],
    );

    // Fit on first display of a floor, once its content and the stage size are known.
    useEffect(() => {
        if (!vp && contentKnown && hasArea) setViewport(floorId, fitViewport(contentBounds, size));
    }, [vp, contentKnown, hasArea, contentBounds, size, floorId, setViewport]);

    const zoomIn = () => vp && setViewport(floorId, zoomAtCenter(vp, size, ZOOM_STEP));
    const zoomOut = () => vp && setViewport(floorId, zoomAtCenter(vp, size, 1 / ZOOM_STEP));
    const fit = () => hasArea && setViewport(floorId, fitViewport(contentBounds, size));

    // Wheel: native non-passive listener so the page never scrolls or browser-zooms
    // (touchpad pinch arrives as wheel with ctrlKey and is handled the same way).
    useEffect(() => {
        if (!container) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            const { plan, viewports, setViewport: set } = useAppStore.getState();
            const { activeFloorId } = plan;
            const current = viewports[activeFloorId];
            if (!current) return;
            const rect = container.getBoundingClientRect();
            const pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            set(activeFloorId, zoomAt(current, pointer, wheelFactor(e.deltaY)));
        };
        container.addEventListener("wheel", onWheel, { passive: false });
        return () => container.removeEventListener("wheel", onWheel);
    }, [container]);

    // Keyboard shortcuts: + / = zoom in, - zoom out, 0 fit.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target) || isInDialog(e.target)) return;
            let action: (() => unknown) | null = null;
            if (e.key === "+" || e.key === "=") action = zoomIn;
            else if (e.key === "-") action = zoomOut;
            else if (e.key === "0") action = fit;
            if (!action) return;
            e.preventDefault();
            action();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    const onDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
        const stage = e.target.getStage();
        if (!vp || !stage || e.target !== stage) return;
        setViewport(floorId, { scale: vp.scale, x: stage.x(), y: stage.y() });
    };

    /** World point (cm) under the pointer. */
    const pointerCm = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const pointer = e.target.getStage()?.getPointerPosition();
        return pointer && vp ? screenToWorld(vp, pointer) : null;
    };

    // Konva fires no click after the stage or a shape was dragged, so dragging
    // never sets a point, inserts a shape or changes the selection.
    const onClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0) return;
        const pt = pointerCm(e);
        if (calibrating) {
            // A click on the image sets the next calibration point (in image pixels, also on a rotated underlay).
            if (!pt || !geometry || !underlayVisible) return;
            const px = cmToImagePoint(pt, geometry);
            if (px.x >= 0 && px.y >= 0 && px.x <= geometry.imageWidthPx && px.y <= geometry.imageHeightPx) {
                addCalibrationPoint(px);
            }
        } else if (activeTool === "room") {
            // Next corner: a corner nearby wins, else the edge in the snapped direction (Shift: free).
            if (!pt || !vp) return;
            const { roomDraft } = useAppStore.getState();
            const corners = rooms.flatMap((room) => room.pointsCm);
            const radiusCm = CORNER_SNAP_RADIUS_PX / vp.scale;
            const next = resolveDraftPointer(roomDraft?.points ?? [], pt, corners, radiusCm, e.evt.shiftKey);
            if (next.closes) closeDraft();
            else if (next.point) addDraftPoint(next.point);
        } else if (isOpeningTool(activeTool)) {
            // Door or window: set on the room edge at the click (its band or 10 px beside it); elsewhere nothing happens.
            // Snap points unless Shift is held.
            if (pt && vp) {
                insertOpening(OPENING_KIND_OF_TOOL[activeTool], pt, EDGE_HIT_TOLERANCE_PX / vp.scale, {
                    snap: !e.evt.shiftKey,
                    snapToleranceCm: SNAP_POINT_TOLERANCE_PX / vp.scale,
                });
            }
        } else if (activeTool !== "select") {
            // Shape tool: insert centered at the click, anywhere, also on top of other shapes.
            if (pt) insertShape(activeTool, pt);
        } else {
            // Clicks on the selection handles keep the selection; shapes lie above openings, openings above rooms.
            if (e.target.findAncestor("Transformer")) return;
            const shapeNode = e.target.findAncestor(`.${SHAPE_NODE_NAME}`, true);
            const openingNode = shapeNode ? null : e.target.findAncestor(`.${OPENING_NODE_NAME}`, true);
            const roomNode = shapeNode || openingNode ? null : e.target.findAncestor(`.${ROOM_NODE_NAME}`, true);
            if (shapeNode) selectShape(shapeNode.id());
            else if (openingNode) selectOpening(openingNode.id());
            else if (roomNode) selectRoom(roomNode.id());
            else selectShape(null);
        }
    };

    /** Insert cursor and snap mark for the pointer at `pt` with an opening tool (Shift: no mark). */
    const updateHover = (pt: PointCm | null, shiftKey: boolean) => {
        if (!isOpeningTool(activeTool) || !vp) return;
        const hit = pt ? nearestRoomEdge(rooms, pt, EDGE_HIT_TOLERANCE_PX / vp.scale) : null;
        if ((hit !== null) !== overEdge) setOverEdge(hit !== null);
        const room = hit && !shiftKey ? rooms.find((r) => r.id === hit.roomId) : undefined;
        const target =
            hit && room
                ? newOpeningSnap(
                      OPENING_KIND_OF_TOOL[activeTool],
                      edgeFrame(room.pointsCm, hit.edgeIndex),
                      hit.tCm,
                      room.openings.filter((o) => o.edgeIndex === hit.edgeIndex),
                      SNAP_POINT_TOLERANCE_PX / vp.scale,
                      settings,
                  )
                : null;
        const next = hit && target ? { roomId: hit.roomId, edgeIndex: hit.edgeIndex, atCm: target.markAtCm } : null;
        setHoverMark((prev) =>
            prev && next && prev.roomId === next.roomId && prev.edgeIndex === next.edgeIndex && prev.atCm === next.atCm
                ? prev
                : next,
        );
    };

    const onMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!openingTool) return;
        const pt = pointerCm(e);
        lastPointerCm.current = pt;
        updateHover(pt, e.evt.shiftKey);
    };

    const onMouseLeave = () => {
        lastPointerCm.current = null;
        setOverEdge(false);
        setHoverMark(null);
    };

    // Pressing or releasing Shift over an edge hides or shows the mark without moving the pointer.
    useEffect(() => {
        if (!openingTool) return;
        const onShift = (e: KeyboardEvent) => {
            if (e.key === "Shift" && lastPointerCm.current) updateHover(lastPointerCm.current, e.shiftKey);
        };
        window.addEventListener("keydown", onShift);
        window.addEventListener("keyup", onShift);
        return () => {
            window.removeEventListener("keydown", onShift);
            window.removeEventListener("keyup", onShift);
        };
    });

    // Shape tool: arrow with plus (a click inserts); „Tür“/„Fenster“: the same, but only over a room
    // edge or its band, else the plain arrow; room tool: crosshair; otherwise the hand (a drag pans).
    const cursorClass =
        calibrating || activeTool === "room"
            ? "cursor-crosshair"
            : openingTool
              ? overEdge
                  ? "cursor-(--cursor-insert-shape)"
                  : "cursor-default"
              : activeTool !== "select"
                ? "cursor-(--cursor-insert-shape)"
                : "cursor-grab active:cursor-grabbing";

    return (
        <div ref={containerRef} className="absolute inset-0">
            {hasArea && (
                <Stage
                    width={size.width}
                    height={size.height}
                    x={vp?.x ?? 0}
                    y={vp?.y ?? 0}
                    scaleX={vp?.scale ?? 1}
                    scaleY={vp?.scale ?? 1}
                    draggable={!!vp}
                    onDragEnd={onDragEnd}
                    onClick={onClick}
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                    className={cursorClass}
                >
                    {vp && underlayVisible && image && (
                        <UnderlayLayer
                            geometry={geometry}
                            image={image}
                            opacity={calibrating ? 1 : geometry.opacity}
                            scale={vp.scale}
                            calibrating={calibrating}
                        />
                    )}
                    {vp && !underlayVisible && <GridLayer />}
                    {vp && !calibrating && <RoomsLayer floorId={floorId} scale={vp.scale} hoverMark={openingTool ? hoverMark : null} />}
                    {vp && !calibrating && <ShapesLayer floorId={floorId} scale={vp.scale} />}
                    {vp && !calibrating && activeTool === "room" && <RoomDraftLayer floorId={floorId} scale={vp.scale} />}
                </Stage>
            )}
            {!calibrating && activeTool === "room" && <RoomDraftField />}
            {underlay && availability === "missing" && !calibrating && <MissingImageHint floorId={floorId} />}
            <ZoomControls
                scale={vp?.scale ?? null}
                onZoomOut={zoomOut}
                onZoomIn={zoomIn}
                onFit={fit}
                showDimensions={showDimensions}
                onToggleDimensions={toggleDimensions}
                shapeSnapping={shapeSnapping}
                onToggleShapeSnapping={toggleShapeSnapping}
            />
        </div>
    );
}
