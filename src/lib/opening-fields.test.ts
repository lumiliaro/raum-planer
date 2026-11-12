import { describe, expect, it } from "vitest";
import { applyOpeningLeftDistance, applyOpeningWidth, fallbackOpeningSize, isFullEdge, toggleFullEdge } from "@/lib/opening-fields";
import { edgeFrame, OPENING_FIT_EPS_CM } from "@/lib/opening-geometry";
import type { Opening, OpeningPatch } from "@/lib/plan-schema";
import { FACTORY_SETTINGS } from "@/lib/plan-settings";
import { NOT_A_NUMBER } from "@/lib/shape-fields";
import { rectPoints, uuid } from "@/test/plan-fixtures";

/** (0|0)–(500|400) counter-clockwise: edge 0 is the bottom one (x = 0 → 500), edge 2 the top one (x = 500 → 0). */
const CCW = [...rectPoints(0, 0, 500, 400)].reverse();
const CW = rectPoints(0, 0, 500, 400);
/** Door on the top edge (clockwise), 160 cm from the left corner. */
const DOOR: Opening = { id: uuid(1), kind: "door", edgeIndex: 0, offsetCm: 160, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };
const top = edgeFrame(CW, 0);

describe("applyOpeningWidth", () => {
    it("90 cm at a distance of 160 cm on a 500 cm edge keeps the distance", () => {
        expect(applyOpeningWidth(top, DOOR, "90")).toEqual({ ok: true, patch: { widthCm: 90, offsetCm: 160 } });
    });

    it("rejects 400 cm with „Darf höchstens 340 cm sein“", () => {
        expect(applyOpeningWidth(top, DOOR, "400")).toEqual({ ok: false, error: "Darf höchstens 340 cm sein" });
        expect(applyOpeningWidth(top, DOOR, "340")).toMatchObject({ ok: true, patch: { widthCm: 340 } });
    });

    it("rejects „0“ and „abc“", () => {
        expect(applyOpeningWidth(top, DOOR, "0")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
        expect(applyOpeningWidth(top, DOOR, "abc")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });

    it("reads comma and point and rounds to 0,1 cm", () => {
        expect(applyOpeningWidth(top, DOOR, "88,46")).toMatchObject({ ok: true, patch: { widthCm: 88.5 } });
        expect(applyOpeningWidth(top, DOOR, "88.44")).toMatchObject({ ok: true, patch: { widthCm: 88.4 } });
    });

    it("gives an empty patch for the unchanged width", () => {
        expect(applyOpeningWidth(top, DOOR, "80")).toEqual({ ok: true, patch: {} });
    });

    it("keeps the left distance where the left corner is the edge's end", () => {
        const frame = edgeFrame(CCW, 2);
        expect(frame.leftEnd).toBe("end");
        // Left distance 160 cm ↔ offset 500 − 160 − 80 = 260 cm.
        const door = { ...DOOR, edgeIndex: 2, offsetCm: 260 };
        expect(applyOpeningWidth(frame, door, "90")).toEqual({ ok: true, patch: { widthCm: 90, offsetCm: 250 } });
    });
});

describe("applyOpeningLeftDistance", () => {
    it("sets the offset on an edge starting at the left corner", () => {
        expect(applyOpeningLeftDistance(top, DOOR, "200")).toEqual({ ok: true, patch: { offsetCm: 200 } });
    });

    it("gives the right offset on the bottom edge of a counter-clockwise room (left corner = end)", () => {
        const bottom = edgeFrame(CCW, 0);
        expect(bottom.leftEnd).toBe("end");
        expect(bottom.start).toEqual({ x: 0, y: 400 });
        // Left (seen from inside, looking down) is x = 500 cm; 100 cm from there means x = 280 … 400.
        const window: Opening = { id: uuid(2), kind: "window", edgeIndex: 0, offsetCm: 0, widthCm: 120, swing: null, beforeFullEdge: null };
        expect(applyOpeningLeftDistance(bottom, window, "100")).toEqual({ ok: true, patch: { offsetCm: 280 } });
    });

    it("rejects a negative distance, one beyond the edge and text", () => {
        expect(applyOpeningLeftDistance(top, DOOR, "-5")).toEqual({ ok: false, error: "Darf nicht negativ sein" });
        expect(applyOpeningLeftDistance(top, DOOR, "421")).toEqual({ ok: false, error: "Darf höchstens 420 cm sein" });
        expect(applyOpeningLeftDistance(top, DOOR, "420")).toEqual({ ok: true, patch: { offsetCm: 420 } });
        expect(applyOpeningLeftDistance(top, DOOR, "x")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });

    it("reads comma and point, rounds to 0,1 cm and gives an empty patch for the unchanged distance", () => {
        expect(applyOpeningLeftDistance(top, DOOR, "12,34")).toEqual({ ok: true, patch: { offsetCm: 12.3 } });
        expect(applyOpeningLeftDistance(top, DOOR, "160.0")).toEqual({ ok: true, patch: {} });
    });
});

describe("isFullEdge", () => {
    it("is true for offset 0 cm and the edge length, within OPENING_FIT_EPS_CM", () => {
        expect(isFullEdge(top, { offsetCm: 0, widthCm: 500 })).toBe(true);
        expect(isFullEdge(top, { offsetCm: OPENING_FIT_EPS_CM / 2, widthCm: 500 - OPENING_FIT_EPS_CM / 2 })).toBe(true);
    });

    it("is false when only the width or only the offset is off", () => {
        expect(isFullEdge(top, { offsetCm: 0, widthCm: 499 })).toBe(false);
        expect(isFullEdge(top, { offsetCm: 1, widthCm: 499 })).toBe(false);
        expect(isFullEdge(top, { offsetCm: 0, widthCm: 500 - 2 * OPENING_FIT_EPS_CM })).toBe(false);
    });
});

describe("fallbackOpeningSize (Ersatzmaße beim Abhaken)", () => {
    it("gives the default width of the kind, centered", () => {
        expect(fallbackOpeningSize("passage", 500, FACTORY_SETTINGS)).toEqual({ offsetCm: 200, widthCm: 100 });
        expect(fallbackOpeningSize("window", 500, FACTORY_SETTINGS)).toEqual({ offsetCm: 190, widthCm: 120 });
    });

    it("gives half the edge, centered, on an edge at most that long", () => {
        expect(fallbackOpeningSize("passage", 80, FACTORY_SETTINGS)).toEqual({ offsetCm: 20, widthCm: 40 });
        expect(fallbackOpeningSize("passage", 100, FACTORY_SETTINGS)).toEqual({ offsetCm: 25, widthCm: 50 });
        expect(fallbackOpeningSize("window", 120, FACTORY_SETTINGS)).toEqual({ offsetCm: 30, widthCm: 60 });
    });
});

describe("toggleFullEdge (Ganze Kante öffnen)", () => {
    const PASSAGE: Opening = { id: uuid(2), kind: "passage", edgeIndex: 0, offsetCm: 200, widthCm: 100, swing: null, beforeFullEdge: null };
    const WINDOW: Opening = { id: uuid(3), kind: "window", edgeIndex: 0, offsetCm: 190, widthCm: 120, swing: null, beforeFullEdge: null };
    const full = (opening: Opening, beforeFullEdge: Opening["beforeFullEdge"] = null): Opening => ({
        ...opening,
        offsetCm: 0,
        widthCm: 500,
        beforeFullEdge,
    });
    const apply = (opening: Opening, patch: OpeningPatch | null): Opening => ({ ...opening, ...patch });

    it("checking a passage of 100 cm at 200 cm on a 500 cm edge remembers its sizes (Wand fehlt komplett)", () => {
        expect(toggleFullEdge(top, PASSAGE, true, FACTORY_SETTINGS)).toEqual({
            offsetCm: 0,
            widthCm: 500,
            beforeFullEdge: { offsetCm: 200, widthCm: 100 },
        });
    });

    it("unchecking restores the remembered 100/200 (Wieder abhaken)", () => {
        expect(toggleFullEdge(top, full(PASSAGE, { offsetCm: 200, widthCm: 100 }), false, FACTORY_SETTINGS)).toEqual({
            offsetCm: 200,
            widthCm: 100,
            beforeFullEdge: null,
        });
    });

    it("unchecking without remembered sizes on a 500 cm edge gives 100 cm at 200 cm", () => {
        expect(toggleFullEdge(top, full(PASSAGE), false, FACTORY_SETTINGS)).toEqual({ offsetCm: 200, widthCm: 100, beforeFullEdge: null });
    });

    it("unchecking without remembered sizes takes the passage width of the settings: 90 cm at 205 cm", () => {
        const widths = { ...FACTORY_SETTINGS, passageWidthCm: 90 };
        expect(toggleFullEdge(top, full(PASSAGE), false, widths)).toEqual({ offsetCm: 205, widthCm: 90, beforeFullEdge: null });
    });

    it("unchecking a window without remembered sizes on a 500 cm edge gives 120 cm at 190 cm (Fenster ohne gemerkte Maße)", () => {
        expect(toggleFullEdge(top, full(WINDOW), false, FACTORY_SETTINGS)).toEqual({ offsetCm: 190, widthCm: 120, beforeFullEdge: null });
    });

    it("checks and unchecks a window of 120 cm at 190 cm back to 120/190 (Fensterband über die ganze Wand)", () => {
        const checked = apply(WINDOW, toggleFullEdge(top, WINDOW, true, FACTORY_SETTINGS));
        expect(checked).toMatchObject({ offsetCm: 0, widthCm: 500 });
        const unchecked = apply(checked, toggleFullEdge(top, checked, false, FACTORY_SETTINGS));
        expect(unchecked).toEqual(WINDOW);
    });

    it("unchecking on a short edge gives half the edge, centered (Kurze Kante)", () => {
        const kurz = edgeFrame(rectPoints(0, 0, 80, 300), 0);
        const passage = { ...PASSAGE, offsetCm: 0, widthCm: 80 };
        expect(toggleFullEdge(kurz, passage, false, FACTORY_SETTINGS)).toEqual({ offsetCm: 20, widthCm: 40, beforeFullEdge: null });
        const fenster = edgeFrame(rectPoints(0, 0, 120, 300), 0);
        const window = { ...WINDOW, offsetCm: 0, widthCm: 120 };
        expect(toggleFullEdge(fenster, window, false, FACTORY_SETTINGS)).toEqual({ offsetCm: 30, widthCm: 60, beforeFullEdge: null });
    });

    it("unchecking with remembered sizes that no longer fit gives the fallback", () => {
        const edge = edgeFrame(rectPoints(0, 0, 250, 300), 0);
        const passage = { ...PASSAGE, offsetCm: 0, widthCm: 250, beforeFullEdge: { offsetCm: 200, widthCm: 100 } };
        expect(toggleFullEdge(edge, passage, false, FACTORY_SETTINGS)).toEqual({ offsetCm: 75, widthCm: 100, beforeFullEdge: null });
    });

    it("unchecking with remembered sizes that are the whole edge themselves gives the fallback", () => {
        const passage = full(PASSAGE, { offsetCm: 0, widthCm: 500 });
        expect(toggleFullEdge(top, passage, false, FACTORY_SETTINGS)).toEqual({ offsetCm: 200, widthCm: 100, beforeFullEdge: null });
    });

    it("gives null when checking an opening that already covers the edge and when unchecking one that does not", () => {
        expect(toggleFullEdge(top, full(PASSAGE), true, FACTORY_SETTINGS)).toBeNull();
        expect(toggleFullEdge(top, { ...PASSAGE, offsetCm: 1e-9, widthCm: 500 - 1e-9 }, true, FACTORY_SETTINGS)).toBeNull();
        expect(toggleFullEdge(top, PASSAGE, false, FACTORY_SETTINGS)).toBeNull();
    });

    it("still checks when only the width or only the offset is off", () => {
        expect(toggleFullEdge(top, { ...PASSAGE, offsetCm: 0, widthCm: 499 }, true, FACTORY_SETTINGS)).toMatchObject({ offsetCm: 0, widthCm: 500 });
        expect(toggleFullEdge(top, { ...PASSAGE, offsetCm: 1, widthCm: 499 }, true, FACTORY_SETTINGS)).toMatchObject({ offsetCm: 0, widthCm: 500 });
    });

    it("gives null for a door", () => {
        expect(toggleFullEdge(top, DOOR, true, FACTORY_SETTINGS)).toBeNull();
    });
});
