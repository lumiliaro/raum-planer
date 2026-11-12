import { temporal } from "zundo";
import { create, useStore } from "zustand";
import { computeCalibration, formatLengthText, parseLengthCm, roundImagePoint } from "@/lib/calibration";
import type { CalibrationAlign, ImagePoint } from "@/lib/calibration-schema";
import { edgeFrame } from "@/lib/opening-geometry";
import { createOpening, nearestRoomEdge, newOpeningSnap } from "@/lib/opening-placement";
import * as planOps from "@/lib/plan";
import { sameContent } from "@/lib/plan-diff";
import { canAppendPoint, canClose, pointAtDistance, roundPointCm, type Direction } from "@/lib/room-drawing";
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
} from "@/lib/plan-schema";
import { loadPlan, savePlan, type LoadOutcome } from "@/lib/plan-storage";
import { createShape, type InsertableKind } from "@/lib/shape-factory";
import { canDeleteRoom, isRoomPatchAllowed } from "@/lib/room-lock";
import { canDelete, isPatchAllowed } from "@/lib/shape-lock";
import { getBrowserStorage, PROPERTIES_PANEL_OPEN_KEY, readBoolean, writeBoolean } from "@/lib/ui-prefs";
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

/** Session-only; never part of the plan. `door-opening`, `window` and `passage` set openings into room walls. */
export type ActiveTool = "select" | InsertableKind | "room" | OpeningTool;

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

export type RoomDraftHint = "length" | "close";

/** A room being drawn with the tool „Raum“: session-only, not in the history. */
export interface RoomDraft {
    /** Corners set so far (at least one), rounded to 0.1 cm. */
    points: PointCm[];
    /** Raw text of the length field; empty = field closed. */
    lengthText: string;
    hint: RoomDraftHint | null;
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
    /** `null` = calibration mode off. */
    calibrationDraft: CalibrationDraft | null;
    /** Session-only, starts as "select". */
    activeTool: ActiveTool;
    /**
     * Session-only. Use `selectSelectedShape` – an id not on the active floor means "nothing selected".
     * At most one of `selectedShapeId`, `selectedRoomId` and `selectedOpeningId` is set.
     */
    selectedShapeId: string | null;
    /** Session-only. Use `selectSelectedRoom`, like `selectedShapeId`. */
    selectedRoomId: string | null;
    /** Session-only. Use `selectSelectedOpening`, like `selectedShapeId`; opening ids are unique across the plan. */
    selectedOpeningId: string | null;
    /** `null` = no room being drawn (also before the first corner). */
    roomDraft: RoomDraft | null;
    /** Edge (0-based) of the selected room whose length field has the focus; highlighted on the canvas. */
    highlightedEdge: number | null;
    /** Session-only, not part of the history: the room being dragged, `null` = none. */
    roomDrag: RoomDrag | null;
    imageStoreStatus: ImageStoreStatus;
    /** Written by the canvas (`useUnderlayImage`), read by tool bar, status bar and panel. */
    imageAvailability: Partial<Record<ImageId, ImageAvailability>>;

    /** Ends calibration mode when the target floor has no underlay with an image that may be there. */
    setActiveFloor: (id: FloorId) => void;
    setViewport: (id: FloorId, vp: Viewport) => void;
    togglePropertiesPanel: () => void;

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
    /** Selects a shape and deselects room and opening; `null` clears the whole selection. */
    selectShape: (id: string | null) => void;
    /** Selects a room and deselects shape and opening; `null` clears the whole selection. */
    selectRoom: (id: string | null) => void;
    /** Selects an opening and deselects shape and room; `null` clears the whole selection. */
    selectOpening: (id: string | null) => void;
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
     * Drawing a room with the tool „Raum“. Corners are session state; only
     * `closeDraft` changes the plan (one undo step).
     * `addDraftPoint` sets the next corner (the first one starts the draft);
     * `false` if the tool is not active or the corner is not allowed.
     */
    addDraftPoint: (point: PointCm) => boolean;
    /** Removes the last corner; the draft ends with the first one. */
    removeLastDraftPoint: () => void;
    setDraftLength: (text: string) => void;
    /**
     * Sets a corner at the typed length from the last one in `direction` and
     * empties the field. `false` (field stays) without direction, for a length
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
                    roomDraft: null,
                    highlightedEdge: null,
                    roomDrag: null,
                } as const;

                const updateRoomDraft = (fn: (draft: RoomDraft) => RoomDraft) => {
                    const draft = get().roomDraft;
                    if (draft) set({ roomDraft: fn(draft) });
                };

                /** Floor list changes are not offered in calibration mode (header buttons hidden). */
                const applyFloorChange = (fn: (plan: Plan) => Plan): boolean =>
                    get().calibrationDraft === null && applyPlan(fn);

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
                    calibrationDraft: null,
                    activeTool: "select",
                    selectedShapeId: null,
                    selectedRoomId: null,
                    selectedOpeningId: null,
                    roomDraft: null,
                    highlightedEdge: null,
                    roomDrag: null,
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
                    selectShape: (id) =>
                        set({ selectedShapeId: id, selectedRoomId: null, selectedOpeningId: null, highlightedEdge: null }),
                    selectRoom: (id) =>
                        set({ selectedRoomId: id, selectedShapeId: null, selectedOpeningId: null, highlightedEdge: null }),
                    selectOpening: (id) =>
                        set({ selectedOpeningId: id, selectedShapeId: null, selectedRoomId: null, highlightedEdge: null }),
                    setHighlightedEdge: (index) => set({ highlightedEdge: index }),
                    setRoomDrag: (drag) => set({ roomDrag: drag }),
                    insertShape: (kind, pointCm) => {
                        if (!isToolEnabled(get(), kind)) return false;
                        const floorId = get().plan.activeFloorId;
                        const shape = createShape(kind, pointCm, crypto.randomUUID());
                        const added = applyPlan((p) => planOps.addShape(p, floorId, shape, now()));
                        if (added) {
                            set({ selectedShapeId: shape.id, selectedRoomId: null, selectedOpeningId: null, activeTool: "select" });
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
                        const state = get();
                        if (state.activeTool !== "room" || !isToolEnabled(state, "room")) return false;
                        const rounded = roundPointCm(point);
                        const points = state.roomDraft?.points ?? [];
                        if (!canAppendPoint(points, rounded)) return false;
                        set({ roomDraft: { points: [...points, rounded], lengthText: "", hint: null } });
                        return true;
                    },
                    removeLastDraftPoint: () => {
                        const draft = get().roomDraft;
                        if (!draft) return;
                        const points = draft.points.slice(0, -1);
                        set({ roomDraft: points.length > 0 ? { ...draft, points, hint: null } : null });
                    },
                    setDraftLength: (text) => updateRoomDraft((draft) => ({ ...draft, lengthText: text, hint: null })),
                    commitDraftLength: (direction) => {
                        const draft = get().roomDraft;
                        if (!draft || !direction) return false;
                        const lengthCm = parseLengthCm(draft.lengthText);
                        if (lengthCm === null) {
                            set({ roomDraft: { ...draft, hint: "length" } });
                            return false;
                        }
                        const point = pointAtDistance(draft.points[draft.points.length - 1], direction, lengthCm);
                        if (!canAppendPoint(draft.points, point)) return false;
                        set({ roomDraft: { points: [...draft.points, point], lengthText: "", hint: null } });
                        return true;
                    },
                    closeDraft: () => {
                        const { roomDraft: draft, plan } = get();
                        if (!draft || draft.points.length < 3) return false;
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

                    // While a room is drawn, undo would pull the plan from under the draft.
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

/** The selected shape on the active floor, or `null` (also when its id is no longer there). */
export function selectSelectedShape(state: Pick<AppState, "plan" | "selectedShapeId">): Shape | null {
    const { plan, selectedShapeId } = state;
    if (!selectedShapeId) return null;
    return plan.shapesByFloor[plan.activeFloorId]?.find((s) => s.id === selectedShapeId) ?? null;
}

export const useAppStore = createAppStore(getBrowserStorage());

/** `true` if there is a step to undo; always `false` in calibration mode and while a room is drawn. */
export function useCanUndo(): boolean {
    const blocked = useAppStore((s) => s.calibrationDraft !== null || s.roomDraft !== null);
    const hasPast = useStore(useAppStore.temporal, (s) => s.pastStates.length > 0);
    return hasPast && !blocked;
}

/** `true` if there is a step to redo; always `false` in calibration mode and while a room is drawn. */
export function useCanRedo(): boolean {
    const blocked = useAppStore((s) => s.calibrationDraft !== null || s.roomDraft !== null);
    const hasFuture = useStore(useAppStore.temporal, (s) => s.futureStates.length > 0);
    return hasFuture && !blocked;
}
