import { describe, expect, it } from "vitest";
import { NOT_A_NUMBER } from "@/lib/shape-fields";
import { applyWallLengthField, applyWallThicknessOfWallField } from "@/lib/wall-fields";
import { wall } from "@/test/plan-fixtures";

/** (100|100)→(430|100), 15 cm. */
const W = wall(1);

describe("applyWallLengthField (Wandlänge ändern)", () => {
    it("moves the end to (400|100) for 300 cm, the start stays (Wand kürzen)", () => {
        expect(applyWallLengthField(W, "300")).toEqual({ ok: true, value: { x: 400, y: 100 } });
    });

    it("accepts a comma and rounds to 0.1 cm", () => {
        expect(applyWallLengthField(W, "237,54")).toEqual({ ok: true, value: { x: 337.5, y: 100 } });
    });

    it("rejects 0 with „Muss größer als 0 cm sein“ (Null)", () => {
        expect(applyWallLengthField(W, "0")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
    });

    it("rejects text that is no number", () => {
        expect(applyWallLengthField(W, "lang")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });

    it("gives no change for the length shown", () => {
        expect(applyWallLengthField(W, "330")).toEqual({ ok: true, value: null });
    });
});

describe("applyWallThicknessOfWallField (Wanddicke einer Wand ändern)", () => {
    it("sets 24 cm (Dicke ändern)", () => {
        expect(applyWallThicknessOfWallField(W, "24")).toEqual({ ok: true, value: 24 });
    });

    it("rounds to 0.1 cm", () => {
        expect(applyWallThicknessOfWallField(W, "11,54")).toEqual({ ok: true, value: 11.5 });
    });

    it("rejects 0 and 150 cm (Zu dick)", () => {
        expect(applyWallThicknessOfWallField(W, "0")).toEqual({ ok: false, error: "Muss größer als 0 cm sein" });
        expect(applyWallThicknessOfWallField(W, "150")).toEqual({ ok: false, error: "Darf höchstens 100 cm sein" });
    });

    it("gives no change for the thickness shown", () => {
        expect(applyWallThicknessOfWallField(W, "15")).toEqual({ ok: true, value: null });
    });

    it("rejects text that is no number", () => {
        expect(applyWallThicknessOfWallField(W, "")).toEqual({ ok: false, error: NOT_A_NUMBER });
    });
});
