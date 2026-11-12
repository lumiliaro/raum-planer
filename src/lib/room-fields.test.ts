import { describe, expect, it } from "vitest";
import { applyEdgeLengthField, applyRoomNameField, applyWallThicknessField } from "@/lib/room-fields";
import type { Opening } from "@/lib/plan-schema";
import { NOT_A_NUMBER } from "@/lib/shape-fields";
import { rectPoints, room, uuid } from "@/test/plan-fixtures";

const WOHNEN = room(1);
const L_ROOM = room(2, "Flur", [
    { x: 0, y: 0 },
    { x: 400, y: 0 },
    { x: 400, y: 120 },
    { x: 280, y: 120 },
    { x: 280, y: 300 },
    { x: 0, y: 300 },
]);

describe("applyRoomNameField", () => {
    it("trims the name", () => {
        expect(applyRoomNameField(WOHNEN, "  Küche ")).toEqual({ ok: true, value: "Küche" });
    });

    it("rejects an empty name with „Bitte einen Namen eingeben“", () => {
        expect(applyRoomNameField(WOHNEN, "   ")).toEqual({ ok: false, error: "Bitte einen Namen eingeben" });
    });

    it("rejects more than 40 characters", () => {
        expect(applyRoomNameField(WOHNEN, "x".repeat(41))).toEqual({ ok: false, error: "Höchstens 40 Zeichen" });
        expect(applyRoomNameField(WOHNEN, "x".repeat(40)).ok).toBe(true);
    });

    it("gives no change for the same name", () => {
        expect(applyRoomNameField(WOHNEN, " Wohnen")).toEqual({ ok: true, value: null });
    });
});

describe("applyEdgeLengthField", () => {
    it("sets Kante 1 of „Wohnen“ to 350 cm, Kante 3 follows", () => {
        expect(applyEdgeLengthField(WOHNEN, 0, "350")).toEqual({ ok: true, value: rectPoints(0, 0, 350, 560) });
    });

    it("accepts a comma", () => {
        expect(applyEdgeLengthField(WOHNEN, 1, "562,5")).toEqual({ ok: true, value: rectPoints(0, 0, 337.5, 562.5) });
    });

    it("rejects shortening Kante 1 of the L-shape to 280 cm with „Geht nicht: Kante 3 würde zu kurz“", () => {
        expect(applyEdgeLengthField(L_ROOM, 0, "280")).toEqual({ ok: false, error: "Geht nicht: Kante 3 würde zu kurz" });
    });

    it("rejects a change creating a loop", () => {
        const notch = room(3, "Nische", [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 0 },
            { x: 300, y: 0 },
            { x: 300, y: 200 },
            { x: 0, y: 200 },
        ]);
        expect(applyEdgeLengthField(notch, 1, "250")).toEqual({
            ok: false,
            error: "Geht nicht: Der Umriss würde sich überschneiden",
        });
    });

    it.each([
        ["0", "Muss größer als 0 cm sein"],
        ["-5", "Muss größer als 0 cm sein"],
        ["abc", "Bitte eine Zahl eingeben"],
    ])("rejects %j", (text, error) => {
        expect(applyEdgeLengthField(WOHNEN, 0, text)).toEqual({ ok: false, error });
    });

    it("gives no change for the shown length", () => {
        expect(applyEdgeLengthField(WOHNEN, 0, "337,5")).toEqual({ ok: true, value: null });
    });
});

describe("applyEdgeLengthField with openings", () => {
    /** Door on Kante 1 from x = 160 to 240 cm, window on Kante 3 from x = 400 to 280 cm. */
    const DOOR: Opening = { id: uuid(20), kind: "door", edgeIndex: 0, offsetCm: 160, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };
    const WINDOW: Opening = { id: uuid(21), kind: "window", edgeIndex: 2, offsetCm: 100, widthCm: 120, swing: null, beforeFullEdge: null };
    const wohnen = (openings: Opening[]) => room(3, "Wohnen", rectPoints(0, 0, 500, 400), openings);

    it("accepts Kante 1 of 520 cm with door and window", () => {
        expect(applyEdgeLengthField(wohnen([DOOR, WINDOW]), 0, "520")).toEqual({ ok: true, value: rectPoints(0, 0, 520, 400) });
    });

    it("rejects Kante 1 of 200 cm: „Geht nicht: Tür auf Kante 1 passt nicht mehr“", () => {
        expect(applyEdgeLengthField(wohnen([DOOR, WINDOW]), 0, "200")).toEqual({
            ok: false,
            error: "Geht nicht: Tür auf Kante 1 passt nicht mehr",
        });
    });

    it("names a window: „Geht nicht: Fenster auf Kante 3 passt nicht mehr“", () => {
        expect(applyEdgeLengthField(wohnen([WINDOW]), 0, "150")).toEqual({
            ok: false,
            error: "Geht nicht: Fenster auf Kante 3 passt nicht mehr",
        });
    });
});

describe("applyEdgeLengthField with a passage (Offene Kante wird kürzer)", () => {
    it("rejects Kante 1 of 480 cm under a 500 cm passage: „Geht nicht: Durchgang auf Kante 1 passt nicht mehr“", () => {
        const passage: Opening = { id: uuid(22), kind: "passage", edgeIndex: 0, offsetCm: 0, widthCm: 500, swing: null, beforeFullEdge: null };
        expect(applyEdgeLengthField(room(3, "Wohnen", rectPoints(0, 0, 500, 400), [passage]), 0, "480")).toEqual({
            ok: false,
            error: "Geht nicht: Durchgang auf Kante 1 passt nicht mehr",
        });
    });
});

describe("applyWallThicknessField", () => {
    /** „Wohnen“ with 15 cm at every edge. */
    const RECT = room(4, "Wohnen", rectPoints(0, 0, 500, 400));

    it("sets edge 1 to 36,5 cm and keeps the others", () => {
        expect(applyWallThicknessField(RECT, 0, "36,5")).toEqual({ ok: true, value: [36.5, 15, 15, 15] });
    });

    it("rejects „0“ with „Muss größer als 0 cm sein“", () => {
        expect(applyWallThicknessField(RECT, 0, "0")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
        expect(applyWallThicknessField(RECT, 0, "-5")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
    });

    it("rejects „150“ with „Darf höchstens 100 cm sein“ and accepts 100", () => {
        expect(applyWallThicknessField(RECT, 2, "150")).toEqual({ ok: false, error: "Darf höchstens 100 cm sein" });
        expect(applyWallThicknessField(RECT, 2, "100")).toEqual({ ok: true, value: [15, 15, 100, 15] });
    });

    it("rejects „abc“", () => {
        expect(applyWallThicknessField(RECT, 0, "abc")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });

    it("gives no change for the shown thickness", () => {
        expect(applyWallThicknessField(RECT, 1, "15")).toEqual({ ok: true, value: null });
        expect(applyWallThicknessField(RECT, 1, "15,0")).toEqual({ ok: true, value: null });
    });

    it("rounds to 0,1 cm", () => {
        expect(applyWallThicknessField(RECT, 3, "11,54")).toEqual({ ok: true, value: [15, 15, 15, 11.5] });
        expect(applyWallThicknessField(RECT, 3, "0,04")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
    });

    it("does not change the room", () => {
        const before = structuredClone(RECT);
        applyWallThicknessField(RECT, 0, "36,5");
        expect(RECT).toEqual(before);
    });
});
