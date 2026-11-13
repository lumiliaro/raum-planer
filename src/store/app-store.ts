import { temporal } from "zundo";
import { create, useStore } from "zustand";
import { computeCalibration, formatLengthText, parseLengthCm, roundImagePoint } from "@/lib/calibration";
import type { CalibrationAlign, ImagePoint } from "@/lib/calibration-schema";
import {
    copyRoom,
    copyShape,
    isFirstPasteAfterCut,
    PASTE_OFFSET_CM,
    pasteOffsetSteps,
    type ClipboardItem,
    type ClipboardState,
} from "@/lib/clipboard";
import { edgeFrame } from "@/lib/opening-geometry";
import { createOpening, nearestRoomEdge, newOpeningSnap } from "@/lib/opening-placement";
import * as planOps from "@/lib/plan";
import { sameContent } from "@/lib/plan-diff";
import { TUTORIAL_STEPS } from "@/components/tutorial/tutorial-steps";
import {
    canAppendPoint,
    canClose,
    parseOffsetCm,
    pointAtDistance,
    pointOnWall,
    roundPointCm,
    wallLineFor,
    wallLines,
    type Direction,
    type WallAnchor,
} from "@/lib/room-drawing";
import { distanceCm, GEOMETRY_EPS_CM, MIN_EDGE_CM } from "@/lib/room-geometry";
import { freeWallLines } from "@/lib/wall-drawing";
import type { PlanSettings, SettingsPatch } from "@/lib/plan-settings";
import {
    PlanSchema,
    type Floor,
    type FloorId,
    type ImageId,
    type Opening,
    type OpeningKind,
    type OpeningPatch,
    type Plan,
    type PointCm,
    type Room,
    type Shape,
    type ShapePatch,
    type Wall,
} from "@/lib/plan-schema";
import { loadPlan, savePlan, type LoadOutcome } from "@/lib/plan-storage";
import { createShape, type InsertableKind } from "@/lib/shape-factory";
import { canDeleteRoom, isRoomPatchAllowed } from "@/lib/room-lock";
import { canDelete, isPatchAllowed } from "@/lib/shape-lock";
import {
    getBrowserStorage,
    PROPERTIES_PANEL_OPEN_KEY,
    readBoolean,
    SHAPE_SNAPPING_KEY,
    SHOW_DIMENSIONS_KEY,
    shouldAutoStartTutorial,
    TUTORIAL_SEEN_KEY,
    writeBoolean,
} from "@/lib/ui-prefs";
import { underlayWithImage, type ImageAvailability, type UnderlayImage } from "@/lib/underlay";
import type { Viewport } from "@/lib/viewport";
import * as history from "@/store/history";

/** In-progress calibration of the active floor. Only `saveCalibration` stores a result. */
export interface CalibrationDraft {
    p1: ImagePoint | null;
    p2: ImagePoint | null;
    /** Raw text of the length field, parsed with `parseLengthCm`. */
    lengthText: string;
    /** `null` = „Keine“ (no rotation). */
    align: CalibrationAlign | null;
}

export type CalibrationPointKey = "p1" | "p2";

/**
 * Session-only; never part of the plan. `door-opening`, `window` and `passage` set openings into room walls,
 * `wall` draws a free wall.
 */
export type ActiveTool = "select" | InsertableKind | "room" | "wall" | OpeningTool;

export type OpeningTool = "door-opening" | "window" | "passage";

/** The tool that sets openings of this kind. */
export const OPENING_TOOL: Readonly<Record<OpeningKind, OpeningTool>> = {
    door: "door-opening",
    window: "window",
    passage: "passage",
};

/** The opening kind each opening tool sets. */
export const OPENING_KIND_OF_TOOL: Readonly<Record<OpeningTool, OpeningKind>> = {
    "door-opening": "door",
    window: "window",
    passage: "passage",
};

export function isOpeningTool(tool: ActiveTool): tool is OpeningTool {
    return Object.hasOwn(OPENING_KIND_OF_TOOL, tool);
}

/**
 * - `length`: the typed length is not greater than 0 cm
 * - `close`: the closed outline would be invalid
 */
/** Snap points when setting an opening: on/off (off while Shift is held) and the tolerance in cm. */
export interface OpeningSnapOptions {
    snap: boolean;
    snapToleranceCm: number;
}

export type RoomDraftHint = "length" | "close" | "wallTooLong";

/**
 * A room being drawn with the tool „Raum“, or the start point of a free wall
 * being drawn with „Wand“ (then at most one point): session-only, not in the history.
 */
export interface RoomDraft {
    /**
     * Corners set so far (with „Wand“: the start point), rounded to 0.1 cm; none
     * only while a distance on a wall is typed (`wallAnchor`).
     */
    points: PointCm[];
    /** Raw text of the length field (with `wallAnchor`: the distance on the wall); empty = field closed. */
    lengthText: string;
    hint: RoomDraftHint | null;
    /** Before the first corner: the wall line and end the typed distance is measured on/from. */
    wallAnchor: WallAnchor | null;
}

/** Why the stored plan was replaced by an empty one at start; `null` = nothing to report. */
export type RecoveryNotice = null | "backed-up" | "backup-failed";

/**
 * - `saved`: the last save attempt succeeded, or nothing had to be saved yet
 * - `failed`: the last save attempt failed (storage full or blocked)
 * - `suspended`: saving is off for this session (unreadable plan could not be backed up)
 */
export type SaveStatus = "saved" | "failed" | "suspended";

/** Whether underlay images could be written to the browser's image store this session. */
export type ImageStoreStatus = "ok" | "failed";


/** A wall of another room that the dragged room sticks to. */
export interface StuckEdge {
    roomId: string;
    edgeIndex: number;
}

/**
 * A room being dragged on the canvas: its offset in cm after grid and wall
 * sticking, and the walls it sticks to. Shapes inside the room show the same
 * offset as a preview.
 */
export interface RoomDrag {
    floorId: FloorId;
    id: string;
    dx: number;
    dy: number;
    stuckEdges: StuckEdge[];
}

/** Tabs of the dialog „Hilfe“. */
export type HelpTab = "shortcuts" | "privacy";

export interface AppState {
    /** The user's plan. Replaced as a whole on every change (autosave and later undo track it). */
    plan: Plan;
    recoveryNotice: RecoveryNotice;
    /** How the plan was loaded at the start; decides whether unused images may be cleaned up. Never changes. */
    loadOutcome: LoadOutcome;
    saveStatus: SaveStatus;
    /** Session-only view per floor; a missing entry means "fit on next display". */
    viewports: Partial<Record<string, Viewport>>;
    propertiesPanelOpen: boolean;
    /** Dimensions of rooms and shapes on the canvas; a browser preference, not part of the plan or its history. */
    showDimensions: boolean;
    /** Dragged shapes snap to snap lines (room center, openings, walls, shapes); a browser preference like `showDimensions`. */
    shapeSnapping: boolean;
    /** Session-only, not part of the history: the open tab of „Hilfe“, `null` = dialog closed. */
    helpTab: HelpTab | null;
    /**
     * Session-only, not part of the history: index into `TUTORIAL_STEPS`, `null` = tutorial off.
     * Starts at 0 on a first visit (`shouldAutoStartTutorial`).
     */
    tutorialStep: number | null;
    /** `null` = calibration mode off. */
    calibrationDraft: CalibrationDraft | null;
    /** Session-only, starts as "select". */
    activeTool: ActiveTool;
    /**
     * Session-only. Use `selectSelectedShape` – an id not on the active floor means "nothing selected".
     * At most one of `selectedShapeId`, `selectedRoomId`, `selectedOpeningId` and `selectedWallId` is set.
     */
    selectedShapeId: string | null;
    /** Session-only. Use `selectSelectedRoom`, like `selectedShapeId`. */
    selectedRoomId: string | null;
    /** Session-only. Use `selectSelectedOpening`, like `selectedShapeId`; opening ids are unique across the plan. */
    selectedOpeningId: string | null;
    /** Session-only. Use `selectSelectedWall`, like `selectedShapeId`. */
    selectedWallId: string | null;
    /** `null` = no room or wall being drawn (also before the first point). */
    roomDraft: RoomDraft | null;
    /** Edge (0-based) of the selected room whose length field has the focus; highlighted on the canvas. */
    highlightedEdge: number | null;
    /** Session-only, not part of the history: the room being dragged, `null` = none. */
    roomDrag: RoomDrag | null;
    /**
     * Session-only, not part of the history, never saved or exported: the app's
     * own clipboard (`@/lib/clipboard`), `null` = empty.
     */
    clipboard: ClipboardState | null;
    imageStoreStatus: ImageStoreStatus;
    /** Written by the canvas (`useUnderlayImage`), read by tool bar, status bar and panel. */
    imageAvailability: Partial<Record<ImageId, ImageAvailability>>;

    /** Ends calibration mode when the target floor has no underlay with an image that may be there. */
    setActiveFloor: (id: FloorId) => void;
    setViewport: (id: FloorId, vp: Viewport) => void;
    togglePropertiesPanel: () => void;
    toggleDimensions: () => void;
    /** Turns snapping of dragged shapes on or off and remembers it in the browser. */
    toggleShapeSnapping: () => void;
    /** Opens „Hilfe“ on the given tab, or switches to it while open. */
    openHelp: (tab: HelpTab) => void;
    closeHelp: () => void;
    /** Starts the tutorial at step 1, also when it was finished or skipped before. */
    startTutorial: () => void;
    /** No effect on the last step or while the tutorial is off. */
    nextTutorialStep: () => void;
    /** No effect on the first step or while the tutorial is off. */
    prevTutorialStep: () => void;
    /** Ends the tutorial (skip, done, Esc) and remembers in the browser that it was seen. */
    endTutorial: () => void;

    /**
     * Shape actions return `false` and leave `plan` unchanged when the change is
     * rejected – also for geometry changes and deletion of a locked shape (`@/lib/shape-lock`).
     */
    addShape: (floorId: FloorId, shape: Shape) => boolean;
    updateShape: (floorId: FloorId, id: string, patch: ShapePatch) => boolean;
    removeShape: (floorId: FloorId, id: string) => boolean;
    reorderShape: (floorId: FloorId, id: string, direction: planOps.ReorderDirection) => boolean;

    /** No effect in calibration mode. Discards a room being drawn. */
    setActiveTool: (tool: ActiveTool) => void;
    /** Selects a shape and deselects room, opening and wall; `null` clears the whole selection. */
    selectShape: (id: string | null) => void;
    /** Selects a room and deselects shape, opening and wall; `null` clears the whole selection. */
    selectRoom: (id: string | null) => void;
    /** Selects an opening and deselects shape, room and wall; `null` clears the whole selection. */
    selectOpening: (id: string | null) => void;
    /** Selects a free wall and deselects shape, room and opening; `null` clears the whole selection. */
    selectWall: (id: string | null) => void;
    setHighlightedEdge: (index: number | null) => void;
    /** Written by the canvas while a room is dragged; no history step. */
    setRoomDrag: (drag: RoomDrag | null) => void;
    /**
     * Inserts a new shape centered at `pointCm` on top of the active floor,
     * selects it and switches back to "select". Not in calibration mode.
     */
    insertShape: (kind: InsertableKind, pointCm: PointCm) => boolean;
    /**
     * Applies `patch` to the selected shape on the active floor. `false` without a
     * selection or for an invalid patch; an empty patch changes nothing and returns `true`.
     */
    updateSelectedShape: (patch: ShapePatch) => boolean;
    /** Removes the selected shape and clears the selection; `false` without a selection. */
    deleteSelectedShape: () => boolean;

    /**
     * Clipboard actions for the selected room or shape of the active floor
     * (not for an opening); `false` (no effect) without one. `copySelection`
     * puts a snapshot into `clipboard` and changes no plan. `cutSelection` also
     * deletes it (one undo step) – a locked one stays selected and is only
     * copied. `pasteClipboard` adds a copy on the active floor (offset per
     * `pasteOffsetSteps`), selects it and switches to "select"; `false` with an
     * empty clipboard. `duplicateSelection` adds a copy 50 cm right and down
     * and selects it, leaving `clipboard` alone. Paste, cut and duplicate are
     * blocked in calibration mode, while a room is drawn or dragged.
     */
    copySelection: () => boolean;
    cutSelection: () => boolean;
    pasteClipboard: () => boolean;
    duplicateSelection: () => boolean;

    /**
     * Room actions, one undo step each; `false` (no effect) when rejected
     * (invalid result, unknown room, no change) – also for moving, changing
     * corners or wall thicknesses and deleting a locked room (`@/lib/room-lock`).
     * Name, color and the lock itself stay changeable.
     */
    updateRoom: (floorId: FloorId, id: string, patch: planOps.RoomPatch) => boolean;
    moveRoom: (floorId: FloorId, id: string, dx: number, dy: number) => boolean;
    removeRoom: (floorId: FloorId, id: string) => boolean;
    /**
     * Removes the selected room and clears the selection; `false` without a
     * selection. A locked room stays and stays selected.
     */
    deleteSelectedRoom: () => boolean;

    /**
     * Sets a door or window on the room edge of the active floor nearest to
     * `pointCm` (in the wall band or closer than `toleranceCm`), selects it and
     * switches back to "select". `false` (nothing set, tool stays) without such
     * an edge or while the tool is locked. With `snap.snap` the opening snaps to
     * the nearest snap point of the edge within `snap.snapToleranceCm`
     * (canvas: `snap = !shiftKey`); without `snap` it never snaps.
     */
    insertOpening: (kind: OpeningKind, pointCm: PointCm, toleranceCm: number, snap?: OpeningSnapOptions) => boolean;
    /** Opening actions, one undo step each; `false` (no effect) when rejected (no fit, unknown opening, no change). */
    updateOpening: (floorId: FloorId, openingId: string, patch: OpeningPatch) => boolean;
    removeOpening: (floorId: FloorId, openingId: string) => boolean;
    /** Removes the selected opening and clears the selection; `false` without a selection. */
    deleteSelectedOpening: () => boolean;

    /**
     * Free wall actions, one undo step each; `false` (no effect) when rejected
     * (invalid result, unknown wall, no change). Drawing a wall: see `addDraftPoint`.
     */
    updateWall: (floorId: FloorId, id: string, patch: planOps.WallPatch) => boolean;
    moveWall: (floorId: FloorId, id: string, dx: number, dy: number) => boolean;
    removeWall: (floorId: FloorId, id: string) => boolean;
    /** Removes the selected wall and clears the selection; `false` without a selection. */
    deleteSelectedWall: () => boolean;

    /**
     * Drawing a room with the tool „Raum“. Corners are session state; only
     * `closeDraft` changes the plan (one undo step).
     * `addDraftPoint` sets the next corner (the first one starts the draft);
     * `false` if the tool is not active or the corner is not allowed.
     * With „Wand“ the first point is the start of a free wall and the second
     * one adds the wall (thickness from the settings, one undo step), selects
     * it and switches to "select"; a wall shorter than 0.1 cm is not added.
     */
    addDraftPoint: (point: PointCm) => boolean;
    /** Removes the last corner; the draft ends with the first one. */
    removeLastDraftPoint: () => void;
    /** Sets the field's text; an empty distance field (no corner yet) ends the draft. */
    setDraftLength: (text: string) => void;
    /**
     * Sets a corner (with „Wand“: the end, adding the wall) at the typed length
     * from the last one in `direction` and empties the field. `false` (field stays) without direction, for a length
     * not greater than 0 cm (with hint) or a corner that is not allowed.
     */
    commitDraftLength: (direction: Direction | null) => boolean;
    /**
     * Closes the outline: adds „Raum n“ on top of the active floor's rooms,
     * selects it and switches to "select". `false` (drawing goes on) with
     * fewer than 3 corners or for an invalid outline (with hint).
     */
    closeDraft: () => boolean;
    cancelDraft: () => void;
    /**
     * Before the first corner: opens the field „Abstand“ with `text`, fixed on
     * the anchor's wall line and end. `false` if neither „Raum“ nor „Wand“ is
     * active or a draft already exists. With „Wand“ the sides of the free walls
     * are wall lines too.
     */
    startWallOffset: (anchor: WallAnchor, text: string) => boolean;
    /** Measures the typed distance from the other end of the wall. */
    toggleWallOffsetEnd: () => void;
    /**
     * Sets the first corner at the typed distance from the anchor's end. `false`
     * (field stays) for an invalid text or a distance over the edge's length
     * (with hint); discards the draft if the wall line is gone.
     */
    commitWallOffset: () => boolean;

    /**
     * Replaces the whole plan (import), including calibrations, timestamps and
     * active floor; `updatedAt` stays as given. Clears selection and tool, keeps
     * the viewports. `false` (no effect) for a plan failing `PlanSchema`.
     */
    replacePlan: (plan: Plan) => boolean;
    /** Sets the trimmed plan name; `false` (no effect) for an empty or unchanged name. */
    renamePlan: (name: string) => boolean;

    /**
     * Changes the plan's settings, one undo step; `false` (no effect) for
     * invalid or unchanged values. Existing rooms and openings stay as they are.
     */
    updateSettings: (patch: SettingsPatch) => boolean;
    /** All settings back to the factory settings in one undo step; `false` if they already are. */
    resetSettings: () => boolean;

    /**
     * Floor list actions (`@/lib/plan`), one undo step each. They return
     * `false` (no effect) when rejected and in calibration mode.
     */
    /** Appends „Neue Etage“ (or „Neue Etage n“), makes it active, clears selection and tool. */
    addFloor: () => boolean;
    renameFloor: (id: FloorId, name: string) => boolean;
    moveFloor: (id: FloorId, direction: planOps.FloorMoveDirection) => boolean;
    /** Removes the floor with shapes, calibration and viewport; clears selection and tool. */
    removeFloor: (id: FloorId) => boolean;

    /**
     * Undo/redo of plan changes (session only, see `@/store/history`). `false`
     * without a step or in calibration mode.
     */
    undo: () => boolean;
    redo: () => boolean;

    dismissRecoveryNotice: () => void;
    /** Used by the autosave. */
    setSaveStatus: (status: SaveStatus) => void;
    /** Used by the image cache when writing an image failed. */
    setImageStoreStatus: (status: ImageStoreStatus) => void;
    /** Ends calibration mode when the image of the active floor's underlay turns out to be missing. */
    setImageAvailability: (id: ImageId, availability: ImageAvailability) => void;

    /**
     * Underlay actions, one undo step each; `false` (no effect) when rejected.
     * `applyUnderlayImage` uploads or replaces the image (the image must be in
     * the image cache already). Without a calibration afterwards it starts
     * calibration mode on the active floor and drops the floor's viewport.
     */
    applyUnderlayImage: (floorId: FloorId, image: UnderlayImage, options?: { resetCalibration?: boolean }) => boolean;
    removeUnderlay: (floorId: FloorId) => boolean;
    setUnderlayVisible: (floorId: FloorId, visible: boolean) => boolean;
    setUnderlayOpacity: (floorId: FloorId, opacity: number) => boolean;

    /** Starts calibration mode (only if `canCalibrate`) or ends it. */
    toggleCalibration: () => void;
    endCalibration: () => void;
    /** Sets P1, then P2; no effect once both are set. */
    addCalibrationPoint: (point: ImagePoint) => void;
    moveCalibrationPoint: (key: CalibrationPointKey, point: ImagePoint) => void;
    /** Removes both points, keeps the length. */
    resetCalibrationPoints: () => void;
    setCalibrationLength: (text: string) => void;
    setCalibrationAlign: (align: CalibrationAlign | null) => void;
    /**
     * Sets the draft's result (with alignment) as the calibration of the active
     * floor's underlay, ends the mode and drops the floor's viewport, so the
     * view is fitted again. Saving to the browser is left to the autosave.
     * Returns `false` (no effect) without a result.
     */
    saveCalibration: () => boolean;
}

/** Steps kept for undo; older ones are dropped. */
export const HISTORY_LIMIT = 100;

export interface AppStoreOptions {
    /** Clock for `updatedAt`; tests pass a fixed one. */
    now?: () => Date;
    /** Ids of new floors; tests pass a fixed one. */
    newId?: () => string;
}

export function createAppStore(
    storage: Storage | undefined,
    { now = () => new Date(), newId = () => crypto.randomUUID() }: AppStoreOptions = {},
) {
    // Loaded synchronously so the last active floor is known on the first render.
    const { plan, outcome } = loadPlan(storage, now(), newId);
    // A converted plan is written right away, so the next start need not convert again.
    const initialSaveStatus: SaveStatus =
        outcome === "backup-failed"
            ? "suspended"
            : outcome === "migrated" && !savePlan(storage, plan)
              ? "failed"
              : "saved";

    return create<AppState>()(
        temporal(
            (set, get, api) => {
                // `api` carries `temporal` once the middleware has run; the actions below only use it later.
                const historyHost = api as unknown as history.HistoryHost<AppState>;
                const draftFor = (id: FloorId): CalibrationDraft => {
                    const saved = get().plan.underlayByFloor[id]?.calibration;
                    return saved
                        ? {
                              p1: saved.p1,
                              p2: saved.p2,
                              lengthText: formatLengthText(saved.realLengthCm),
                              align: saved.align ?? null,
                          }
                        : { p1: null, p2: null, lengthText: "", align: null };
                };

                const updateDraft = (fn: (draft: CalibrationDraft) => CalibrationDraft) => {
                    const draft = get().calibrationDraft;
                    if (draft) set({ calibrationDraft: fn(draft) });
                };

                const RESET_TOOL_AND_SELECTION = {
                    activeTool: "select",
                    selectedShapeId: null,
                    selectedRoomId: null,
                    selectedOpeningId: null,
                    selectedWallId: null,
                    roomDraft: null,
                    highlightedEdge: null,
                    roomDrag: null,
                } as const;

                const NO_SELECTION = {
                    selectedShapeId: null,
                    selectedRoomId: null,
                    selectedOpeningId: null,
                    selectedWallId: null,
                    highlightedEdge: null,
                } as const;

                /** „Raum“ or „Wand“ is the active, usable drawing tool. */
                const drawingTool = (): "room" | "wall" | null => {
                    const state = get();
                    const tool = state.activeTool;
                    return (tool === "room" || tool === "wall") && isToolEnabled(state, tool) ? tool : null;
                };

                /** The wall lines a start point snaps to: the rooms' walls, with „Wand“ also the free walls' sides. */
                const drawingWallLines = () => {
                    const { plan, activeTool } = get();
                    const floorId = plan.activeFloorId;
                    const lines = wallLines(plan.roomsByFloor[floorId] ?? []);
                    return activeTool === "wall" ? [...lines, ...freeWallLines(plan.wallsByFloor[floorId] ?? [])] : lines;
                };

                /**
                 * Adds the free wall from `start` to `end` with the default thickness on top of the
                 * active floor's walls, selects it and switches to "select"; `false` for a wall of 0 cm.
                 */
                const finishWall = (start: PointCm, end: PointCm): boolean => {
                    if (distanceCm(start, end) < MIN_EDGE_CM - GEOMETRY_EPS_CM) return false;
                    const { plan: current } = get();
                    const floorId = current.activeFloorId;
                    const wall: Wall = {
                        id: crypto.randomUUID(),
                        startCm: start,
                        endCm: roundPointCm(end),
                        thicknessCm: current.settings.defaultWallThicknessCm,
                    };
                    const added = applyPlan((p) => planOps.addWall(p, floorId, wall, now()));
                    if (added) set({ ...RESET_TOOL_AND_SELECTION, selectedWallId: wall.id });
                    return added;
                };

                const updateRoomDraft = (fn: (draft: RoomDraft) => RoomDraft) => {
                    const draft = get().roomDraft;
                    if (draft) set({ roomDraft: fn(draft) });
                };

                /** Floor list changes are not offered in calibration mode (header buttons hidden). */
                const applyFloorChange = (fn: (plan: Plan) => Plan): boolean =>
                    get().calibrationDraft === null && applyPlan(fn);

                /** Calibration mode, a room being drawn or dragged: no paste, cut or duplicate. */
                const clipboardBlocked = () => {
                    const { calibrationDraft, roomDraft, roomDrag } = get();
                    return calibrationDraft !== null || roomDraft !== null || roomDrag !== null;
                };

                const selectedItem = (): ClipboardItem | null => {
                    const shape = selectSelectedShape(get());
                    if (shape) return { kind: "shape", shape };
                    const room = selectSelectedRoom(get());
                    return room ? { kind: "room", room } : null;
                };

                /**
                 * Adds a copy of `item` moved by `steps` × `PASTE_OFFSET_CM` on top of
                 * the floor and selects it, together with `extra` in one `set` (one undo step).
                 */
                const insertCopy = (
                    floorId: FloorId,
                    item: ClipboardItem,
                    steps: number,
                    keepName: boolean,
                    extra: Partial<AppState> = {},
                ): boolean => {
                    const d = steps * PASTE_OFFSET_CM;
                    const prev = get().plan;
                    if (item.kind === "shape") {
                        const copy = copyShape(item.shape, d, d, crypto.randomUUID());
                        const next = planOps.addShape(prev, floorId, copy, now());
                        if (next === prev) return false;
                        set({ plan: next, ...RESET_TOOL_AND_SELECTION, selectedShapeId: copy.id, ...extra });
                    } else {
                        const copy = copyRoom(item.room, d, d, () => crypto.randomUUID(), { keepName });
                        const next = planOps.addRoom(prev, floorId, copy, now());
                        if (next === prev) return false;
                        set({ plan: next, ...RESET_TOOL_AND_SELECTION, selectedRoomId: copy.id, ...extra });
                    }
                    return true;
                };

                /** Applies a pure plan operation; `false` if it returned the same plan (rejected). */
                const applyPlan = (fn: (plan: Plan) => Plan): boolean => {
                    const prev = get().plan;
                    const next = fn(prev);
                    if (next === prev) return false;
                    set({ plan: next });
                    return true;
                };

                return {
                    plan,
                    recoveryNotice: outcome === "backed-up" || outcome === "backup-failed" ? outcome : null,
                    loadOutcome: outcome,
                    saveStatus: initialSaveStatus,
                    viewports: {},
                    propertiesPanelOpen: readBoolean(storage, PROPERTIES_PANEL_OPEN_KEY, true),
                    showDimensions: readBoolean(storage, SHOW_DIMENSIONS_KEY, false),
                    shapeSnapping: readBoolean(storage, SHAPE_SNAPPING_KEY, true),
                    helpTab: null,
                    tutorialStep: shouldAutoStartTutorial(outcome, readBoolean(storage, TUTORIAL_SEEN_KEY, false))
                        ? 0
                        : null,
                    calibrationDraft: null,
                    activeTool: "select",
                    selectedShapeId: null,
                    selectedRoomId: null,
                    selectedOpeningId: null,
                    selectedWallId: null,
                    roomDraft: null,
                    highlightedEdge: null,
                    roomDrag: null,
                    clipboard: null,
                    imageStoreStatus: "ok",
                    imageAvailability: {},

                    setActiveFloor: (id) => {
                        const changed = applyPlan((p) => planOps.setActiveFloor(p, id));
                        if (!changed) return;
                        set(RESET_TOOL_AND_SELECTION);
                        if (get().calibrationDraft) {
                            set({ calibrationDraft: mayHaveImage(get(), id) ? draftFor(id) : null });
                        }
                    },
                    setViewport: (id, vp) => set((state) => ({ viewports: { ...state.viewports, [id]: vp } })),
                    togglePropertiesPanel: () => {
                        const open = !get().propertiesPanelOpen;
                        writeBoolean(storage, PROPERTIES_PANEL_OPEN_KEY, open);
                        set({ propertiesPanelOpen: open });
                    },
                    toggleDimensions: () => {
                        const show = !get().showDimensions;
                        writeBoolean(storage, SHOW_DIMENSIONS_KEY, show);
                        set({ showDimensions: show });
                    },
                    toggleShapeSnapping: () => {
                        const on = !get().shapeSnapping;
                        writeBoolean(storage, SHAPE_SNAPPING_KEY, on);
                        set({ shapeSnapping: on });
                    },
                    openHelp: (tab) => set({ helpTab: tab }),
                    closeHelp: () => set({ helpTab: null }),
                    startTutorial: () => set({ tutorialStep: 0 }),
                    nextTutorialStep: () => {
                        const step = get().tutorialStep;
                        if (step !== null && step < TUTORIAL_STEPS.length - 1) set({ tutorialStep: step + 1 });
                    },
                    prevTutorialStep: () => {
                        const step = get().tutorialStep;
                        if (step !== null && step > 0) set({ tutorialStep: step - 1 });
                    },
                    endTutorial: () => {
                        writeBoolean(storage, TUTORIAL_SEEN_KEY, true);
                        set({ tutorialStep: null });
                    },

                    addShape: (floorId, shape) => applyPlan((p) => planOps.addShape(p, floorId, shape, now())),
                    // The lock is enforced here, for every way of editing; the plan operations stay lock-agnostic.
                    updateShape: (floorId, id, patch) => {
                        const shape = findShape(get().plan, floorId, id);
                        if (shape && !isPatchAllowed(shape, patch)) return false;
                        return applyPlan((p) => planOps.updateShape(p, floorId, id, patch, now()));
                    },
                    removeShape: (floorId, id) => {
                        const shape = findShape(get().plan, floorId, id);
                        if (shape && !canDelete(shape)) return false;
                        return applyPlan((p) => planOps.removeShape(p, floorId, id, now()));
                    },
                    reorderShape: (floorId, id, direction) =>
                        applyPlan((p) => planOps.reorderShape(p, floorId, id, direction, now())),

                    setActiveTool: (tool) => {
                        if (isToolEnabled(get(), tool)) set({ activeTool: tool, roomDraft: null });
                    },
                    selectShape: (id) => set({ ...NO_SELECTION, selectedShapeId: id }),
                    selectRoom: (id) => set({ ...NO_SELECTION, selectedRoomId: id }),
                    selectOpening: (id) => set({ ...NO_SELECTION, selectedOpeningId: id }),
                    selectWall: (id) => set({ ...NO_SELECTION, selectedWallId: id }),
                    setHighlightedEdge: (index) => set({ highlightedEdge: index }),
                    setRoomDrag: (drag) => set({ roomDrag: drag }),
                    insertShape: (kind, pointCm) => {
                        if (!isToolEnabled(get(), kind)) return false;
                        const floorId = get().plan.activeFloorId;
                        const shape = createShape(kind, pointCm, crypto.randomUUID());
                        const added = applyPlan((p) => planOps.addShape(p, floorId, shape, now()));
                        if (added) {
                            set({ ...NO_SELECTION, selectedShapeId: shape.id, activeTool: "select" });
                        }
                        return added;
                    },
                    updateSelectedShape: (patch) => {
                        const shape = selectSelectedShape(get());
                        if (!shape) return false;
                        if (Object.keys(patch).length === 0) return true;
                        return get().updateShape(get().plan.activeFloorId, shape.id, patch);
                    },
                    deleteSelectedShape: () => {
                        const { selectedShapeId, plan } = get();
                        if (!selectedShapeId) return false;
                        const removed = get().removeShape(plan.activeFloorId, selectedShapeId);
                        // A locked shape stays selected; a stale id is cleared.
                        if (removed || !selectSelectedShape(get())) set({ selectedShapeId: null });
                        return removed;
                    },

                    copySelection: () => {
                        const item = selectedItem();
                        if (!item) return false;
                        const sourceFloorId = get().plan.activeFloorId;
                        set({ clipboard: { item, sourceFloorId, cut: false, pastesByFloor: {} } });
                        return true;
                    },
                    cutSelection: () => {
                        const item = selectedItem();
                        if (!item || clipboardBlocked()) return false;
                        const sourceFloorId = get().plan.activeFloorId;
                        // A locked original stays (and stays selected): then the entry acts like a copy.
                        const cut = item.kind === "shape" ? get().deleteSelectedShape() : get().deleteSelectedRoom();
                        set({ clipboard: { item, sourceFloorId, cut, pastesByFloor: {} } });
                        return true;
                    },
                    pasteClipboard: () => {
                        const clip = get().clipboard;
                        if (!clip || clipboardBlocked()) return false;
                        const floorId = get().plan.activeFloorId;
                        const pastesByFloor = { ...clip.pastesByFloor, [floorId]: (clip.pastesByFloor[floorId] ?? 0) + 1 };
                        return insertCopy(floorId, clip.item, pasteOffsetSteps(clip, floorId), isFirstPasteAfterCut(clip), {
                            clipboard: { ...clip, pastesByFloor },
                        });
                    },
                    duplicateSelection: () => {
                        const item = selectedItem();
                        if (!item || clipboardBlocked()) return false;
                        return insertCopy(get().plan.activeFloorId, item, 1, false);
                    },

                    // Like the shape lock: enforced here, the plan operations stay lock-agnostic.
                    updateRoom: (floorId, id, patch) => {
                        const room = findRoom(get().plan, floorId, id);
                        if (room && !isRoomPatchAllowed(room, patch)) return false;
                        return applyPlan((p) => planOps.updateRoom(p, floorId, id, patch, now()));
                    },
                    moveRoom: (floorId, id, dx, dy) => {
                        const room = findRoom(get().plan, floorId, id);
                        if (room && !isRoomPatchAllowed(room, { pointsCm: room.pointsCm })) return false;
                        return applyPlan((p) => planOps.moveRoom(p, floorId, id, dx, dy, now()));
                    },
                    removeRoom: (floorId, id) => {
                        const room = findRoom(get().plan, floorId, id);
                        if (room && !canDeleteRoom(room)) return false;
                        return applyPlan((p) => planOps.removeRoom(p, floorId, id, now()));
                    },
                    deleteSelectedRoom: () => {
                        const { selectedRoomId, plan } = get();
                        if (!selectedRoomId) return false;
                        const removed = get().removeRoom(plan.activeFloorId, selectedRoomId);
                        // A locked room stays selected; a stale id is cleared.
                        if (removed || !selectSelectedRoom(get())) set({ selectedRoomId: null, highlightedEdge: null });
                        return removed;
                    },

                    insertOpening: (kind, pointCm, toleranceCm, snap) => {
                        const state = get();
                        if (!isToolEnabled(state, OPENING_TOOL[kind])) return false;
                        const floorId = state.plan.activeFloorId;
                        const rooms = state.plan.roomsByFloor[floorId] ?? [];
                        const hit = nearestRoomEdge(rooms, pointCm, toleranceCm);
                        const room = hit && rooms.find((r) => r.id === hit.roomId);
                        if (!hit || !room) return false;
                        const frame = edgeFrame(room.pointsCm, hit.edgeIndex);
                        const target = snap?.snap
                            ? newOpeningSnap(
                                  kind,
                                  frame,
                                  hit.tCm,
                                  room.openings.filter((o) => o.edgeIndex === hit.edgeIndex),
                                  snap.snapToleranceCm,
                                  state.plan.settings,
                              )
                            : null;
                        const opening: Opening = createOpening(
                            kind,
                            hit.edgeIndex,
                            frame,
                            hit.tCm,
                            crypto.randomUUID(),
                            state.plan.settings,
                            target,
                        );
                        const added = applyPlan((p) => planOps.addOpening(p, floorId, room.id, opening, now()));
                        if (added) set({ ...RESET_TOOL_AND_SELECTION, selectedOpeningId: opening.id });
                        return added;
                    },

                    updateWall: (floorId, id, patch) => applyPlan((p) => planOps.updateWall(p, floorId, id, patch, now())),
                    moveWall: (floorId, id, dx, dy) => applyPlan((p) => planOps.moveWall(p, floorId, id, dx, dy, now())),
                    removeWall: (floorId, id) => applyPlan((p) => planOps.removeWall(p, floorId, id, now())),
                    deleteSelectedWall: () => {
                        const { selectedWallId, plan } = get();
                        if (!selectedWallId) return false;
                        const removed = get().removeWall(plan.activeFloorId, selectedWallId);
                        set({ selectedWallId: null });
                        return removed;
                    },
                    updateOpening: (floorId, openingId, patch) =>
                        applyPlan((p) => planOps.updateOpening(p, floorId, openingId, patch, now())),
                    removeOpening: (floorId, openingId) => applyPlan((p) => planOps.removeOpening(p, floorId, openingId, now())),
                    deleteSelectedOpening: () => {
                        const { selectedOpeningId, plan } = get();
                        if (!selectedOpeningId) return false;
                        const removed = get().removeOpening(plan.activeFloorId, selectedOpeningId);
                        set({ selectedOpeningId: null });
                        return removed;
                    },

                    addDraftPoint: (point) => {
                        const tool = drawingTool();
                        if (!tool) return false;
                        const rounded = roundPointCm(point);
                        const points = get().roomDraft?.points ?? [];
                        if (tool === "wall" && points.length > 0) return finishWall(points[0], rounded);
                        if (!canAppendPoint(points, rounded)) return false;
                        set({ roomDraft: { points: [...points, rounded], lengthText: "", hint: null, wallAnchor: null } });
                        return true;
                    },
                    removeLastDraftPoint: () => {
                        const draft = get().roomDraft;
                        if (!draft) return;
                        const points = draft.points.slice(0, -1);
                        set({ roomDraft: points.length > 0 ? { ...draft, points, hint: null } : null });
                    },
                    setDraftLength: (text) => {
                        const draft = get().roomDraft;
                        if (draft?.wallAnchor && !text) set({ roomDraft: null });
                        else updateRoomDraft((d) => ({ ...d, lengthText: text, hint: null }));
                    },
                    commitDraftLength: (direction) => {
                        const draft = get().roomDraft;
                        if (!draft || !direction || draft.points.length === 0) return false;
                        const lengthCm = parseLengthCm(draft.lengthText);
                        if (lengthCm === null) {
                            set({ roomDraft: { ...draft, hint: "length" } });
                            return false;
                        }
                        const point = pointAtDistance(draft.points[draft.points.length - 1], direction, lengthCm);
                        if (get().activeTool === "wall") return finishWall(draft.points[0], point);
                        if (!canAppendPoint(draft.points, point)) return false;
                        set({ roomDraft: { points: [...draft.points, point], lengthText: "", hint: null, wallAnchor: null } });
                        return true;
                    },
                    closeDraft: () => {
                        const { roomDraft: draft, plan, activeTool } = get();
                        if (activeTool !== "room" || !draft || draft.points.length < 3) return false;
                        if (!canClose(draft.points)) {
                            set({ roomDraft: { ...draft, hint: "close" } });
                            return false;
                        }
                        const floorId = plan.activeFloorId;
                        const room: Room = {
                            id: crypto.randomUUID(),
                            name: planOps.nextRoomName(plan.roomsByFloor[floorId] ?? []),
                            pointsCm: draft.points,
                            openings: [],
                            wallThicknessCm: draft.points.map(() => plan.settings.defaultWallThicknessCm),
                            color: plan.settings.defaultRoomColor,
                            locked: false,
                        };
                        const added = applyPlan((p) => planOps.addRoom(p, floorId, room, now()));
                        if (!added) {
                            set({ roomDraft: { ...draft, hint: "close" } });
                            return false;
                        }
                        set({ ...RESET_TOOL_AND_SELECTION, selectedRoomId: room.id });
                        return true;
                    },
                    cancelDraft: () => set({ roomDraft: null }),
                    startWallOffset: (anchor, text) => {
                        if (!drawingTool() || get().roomDraft) return false;
                        set({ roomDraft: { points: [], lengthText: text, hint: null, wallAnchor: { ...anchor } } });
                        return true;
                    },
                    toggleWallOffsetEnd: () =>
                        updateRoomDraft((draft) =>
                            draft.wallAnchor
                                ? {
                                      ...draft,
                                      hint: null,
                                      wallAnchor: {
                                          ...draft.wallAnchor,
                                          fromEnd: draft.wallAnchor.fromEnd === "start" ? "end" : "start",
                                      },
                                  }
                                : draft,
                        ),
                    commitWallOffset: () => {
                        const { roomDraft: draft } = get();
                        if (!draft?.wallAnchor) return false;
                        const line = wallLineFor(drawingWallLines(), draft.wallAnchor);
                        if (!line) {
                            set({ roomDraft: null });
                            return false;
                        }
                        const offsetCm = parseOffsetCm(draft.lengthText);
                        if (offsetCm === null) return false;
                        if (offsetCm > line.lengthCm + GEOMETRY_EPS_CM) {
                            set({ roomDraft: { ...draft, hint: "wallTooLong" } });
                            return false;
                        }
                        const point = pointOnWall(line, draft.wallAnchor.fromEnd, Math.min(offsetCm, line.lengthCm));
                        set({ roomDraft: { points: [point], lengthText: "", hint: null, wallAnchor: null } });
                        return true;
                    },

                    replacePlan: (next) => {
                        const parsed = PlanSchema.safeParse(next);
                        if (!parsed.success) return false;
                        set({ plan: parsed.data, ...RESET_TOOL_AND_SELECTION });
                        return true;
                    },

                    renamePlan: (name) => applyPlan((p) => planOps.renamePlan(p, name, now())),

                    updateSettings: (patch) => applyPlan((p) => planOps.updateSettings(p, patch, now())),
                    resetSettings: () => applyPlan((p) => planOps.resetSettings(p, now())),

                    addFloor: () => {
                        const added = applyFloorChange((p) =>
                            planOps.addFloor(p, newId(), planOps.nextFloorName(p.floors), now()),
                        );
                        if (added) set(RESET_TOOL_AND_SELECTION);
                        return added;
                    },
                    renameFloor: (id, name) => applyFloorChange((p) => planOps.renameFloor(p, id, name, now())),
                    moveFloor: (id, direction) => applyFloorChange((p) => planOps.moveFloor(p, id, direction, now())),
                    removeFloor: (id) => {
                        const removed = applyFloorChange((p) => planOps.removeFloor(p, id, now()));
                        if (removed) {
                            const { [id]: _removed, ...viewports } = get().viewports;
                            set({ viewports, ...RESET_TOOL_AND_SELECTION });
                        }
                        return removed;
                    },

                    // While a room or wall is drawn, undo would pull the plan from under the draft.
                    undo: () => get().roomDraft === null && history.undo(historyHost, now()),
                    redo: () => get().roomDraft === null && history.redo(historyHost, now()),

                    dismissRecoveryNotice: () => set({ recoveryNotice: null }),
                    setSaveStatus: (status) => set({ saveStatus: status }),
                    setImageStoreStatus: (status) => set({ imageStoreStatus: status }),
                    setImageAvailability: (id, availability) => {
                        const state = get();
                        if (state.imageAvailability[id] === availability) return;
                        set({ imageAvailability: { ...state.imageAvailability, [id]: availability } });
                        const activeImage = state.plan.underlayByFloor[state.plan.activeFloorId]?.imageId;
                        if (availability === "missing" && state.calibrationDraft && activeImage === id) {
                            set({ calibrationDraft: null });
                        }
                    },

                    applyUnderlayImage: (floorId, image, { resetCalibration = false } = {}) => {
                        const { plan, imageAvailability, calibrationDraft } = get();
                        const current = plan.underlayByFloor[floorId];
                        const imageMissing = !!current?.imageId && imageAvailability[current.imageId] === "missing";
                        const next = underlayWithImage(current, image, { imageMissing, resetCalibration });
                        const applied = applyPlan((p) => planOps.setUnderlay(p, floorId, next, now()));
                        if (!applied) return false;
                        // The image was checked and decoded on upload and lies in the image cache.
                        set({ imageAvailability: { ...get().imageAvailability, [image.id]: "ready" } });
                        if (next.calibration === null && floorId === get().plan.activeFloorId && !calibrationDraft) {
                            const { [floorId]: _dropped, ...viewports } = get().viewports;
                            set({ viewports, calibrationDraft: draftFor(floorId), ...RESET_TOOL_AND_SELECTION });
                        }
                        return true;
                    },
                    removeUnderlay: (floorId) => applyPlan((p) => planOps.setUnderlay(p, floorId, null, now())),
                    setUnderlayVisible: (floorId, visible) =>
                        applyPlan((p) => planOps.updateUnderlay(p, floorId, { visible }, now())),
                    setUnderlayOpacity: (floorId, opacity) =>
                        applyPlan((p) => planOps.updateUnderlay(p, floorId, { opacity }, now())),

                    toggleCalibration: () => {
                        const { calibrationDraft, plan } = get();
                        if (calibrationDraft) set({ calibrationDraft: null });
                        else if (canCalibrate(get())) {
                            set({ calibrationDraft: draftFor(plan.activeFloorId), ...RESET_TOOL_AND_SELECTION });
                        }
                    },
                    endCalibration: () => set({ calibrationDraft: null }),
                    addCalibrationPoint: (point) =>
                        updateDraft((draft) => {
                            if (!draft.p1) return { ...draft, p1: roundImagePoint(point) };
                            if (!draft.p2) return { ...draft, p2: roundImagePoint(point) };
                            return draft;
                        }),
                    moveCalibrationPoint: (key, point) =>
                        updateDraft((draft) => (draft[key] ? { ...draft, [key]: roundImagePoint(point) } : draft)),
                    resetCalibrationPoints: () => updateDraft((draft) => ({ ...draft, p1: null, p2: null })),
                    setCalibrationLength: (text) => updateDraft((draft) => ({ ...draft, lengthText: text })),
                    setCalibrationAlign: (align) => updateDraft((draft) => ({ ...draft, align })),
                    saveCalibration: () => {
                        const { calibrationDraft: draft, plan } = get();
                        const lengthCm = draft ? parseLengthCm(draft.lengthText) : null;
                        const result =
                            draft?.p1 && draft.p2 && lengthCm !== null
                                ? computeCalibration(draft.p1, draft.p2, lengthCm, draft.align)
                                : null;
                        if (!result) return false;

                        const floorId = plan.activeFloorId;
                        const saved = applyPlan((p) => planOps.setCalibration(p, floorId, result, now()));
                        if (saved) {
                            // Scale and rotation moved the underlay: fit the view again on the next render.
                            const { [floorId]: _dropped, ...viewports } = get().viewports;
                            set({ calibrationDraft: null, viewports });
                        }
                        return saved;
                    },
                };
            },
            {
                partialize: (state): history.HistoryEntry => ({ plan: state.plan }),
                equality: (a, b) => sameContent(a.plan, b.plan),
                limit: HISTORY_LIMIT,
            },
        ),
    );
}

/**
 * All tools are locked in calibration mode; otherwise every tool works, also
 * without underlay or calibration. „Tür“, „Fenster“ and „Durchgang“ need a room on the active floor.
 */
export function isToolEnabled(state: Pick<AppState, "calibrationDraft" | "plan">, tool: ActiveTool): boolean {
    if (state.calibrationDraft !== null) return false;
    if (!isOpeningTool(tool)) return true;
    return (state.plan.roomsByFloor[state.plan.activeFloorId]?.length ?? 0) > 0;
}

type ImageState = Pick<AppState, "plan" | "imageAvailability">;

/** „Vorlage kalibrieren“ is possible: the active floor's underlay has an image that is loaded. */
export function canCalibrate(state: ImageState): boolean {
    const imageId = state.plan.underlayByFloor[state.plan.activeFloorId]?.imageId;
    return !!imageId && state.imageAvailability[imageId] === "ready";
}

/** The floor's underlay refers to an image not known to be missing (it may still load). */
function mayHaveImage(state: ImageState, floorId: FloorId): boolean {
    const imageId = state.plan.underlayByFloor[floorId]?.imageId;
    return !!imageId && state.imageAvailability[imageId] !== "missing";
}

function findShape(plan: Plan, floorId: FloorId, id: string): Shape | undefined {
    return plan.shapesByFloor[floorId]?.find((s) => s.id === id);
}

function findRoom(plan: Plan, floorId: FloorId, id: string): Room | undefined {
    return plan.roomsByFloor[floorId]?.find((r) => r.id === id);
}

/** The plan's settings (defaults, grid, snap steps, wall color). */
export function selectSettings(state: Pick<AppState, "plan">): PlanSettings {
    return state.plan.settings;
}

export function selectFloors(state: Pick<AppState, "plan">): Floor[] {
    return state.plan.floors;
}

/** Name of a floor of the plan, `""` for an unknown id. */
export function selectFloorName(state: Pick<AppState, "plan">, floorId: FloorId): string {
    return state.plan.floors.find((f) => f.id === floorId)?.name ?? "";
}

/** The selected room on the active floor, or `null` (also when its id is no longer there). */
export function selectSelectedRoom(state: Pick<AppState, "plan" | "selectedRoomId">): Room | null {
    const { plan, selectedRoomId } = state;
    if (!selectedRoomId) return null;
    return plan.roomsByFloor[plan.activeFloorId]?.find((r) => r.id === selectedRoomId) ?? null;
}

/** The selected opening with its room on the active floor, or `null` (also when its id is no longer there). */
export function selectSelectedOpening(
    state: Pick<AppState, "plan" | "selectedOpeningId">,
): { room: Room; opening: Opening } | null {
    const { plan, selectedOpeningId } = state;
    if (!selectedOpeningId) return null;
    const found = planOps.findOpening(plan, plan.activeFloorId, selectedOpeningId);
    return found && { room: found.room, opening: found.opening };
}

/** The selected free wall on the active floor, or `null` (also when its id is no longer there). */
export function selectSelectedWall(state: Pick<AppState, "plan" | "selectedWallId">): Wall | null {
    const { plan, selectedWallId } = state;
    if (!selectedWallId) return null;
    return plan.wallsByFloor[plan.activeFloorId]?.find((w) => w.id === selectedWallId) ?? null;
}

/** The selected shape on the active floor, or `null` (also when its id is no longer there). */
export function selectSelectedShape(state: Pick<AppState, "plan" | "selectedShapeId">): Shape | null {
    const { plan, selectedShapeId } = state;
    if (!selectedShapeId) return null;
    return plan.shapesByFloor[plan.activeFloorId]?.find((s) => s.id === selectedShapeId) ?? null;
}

export const useAppStore = createAppStore(getBrowserStorage());

/** `true` if there is a step to undo; always `false` in calibration mode and while a room or wall is drawn. */
export function useCanUndo(): boolean {
    const blocked = useAppStore((s) => s.calibrationDraft !== null || s.roomDraft !== null);
    const hasPast = useStore(useAppStore.temporal, (s) => s.pastStates.length > 0);
    return hasPast && !blocked;
}

/** `true` if there is a step to redo; always `false` in calibration mode and while a room or wall is drawn. */
export function useCanRedo(): boolean {
    const blocked = useAppStore((s) => s.calibrationDraft !== null || s.roomDraft !== null);
    const hasFuture = useStore(useAppStore.temporal, (s) => s.futureStates.length > 0);
    return hasFuture && !blocked;
}
