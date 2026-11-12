import { describe, expect, it } from "vitest";
import { ShapeSchema, type Shape } from "@/lib/plan-schema";
import { applyLabelField, applyNumberField, NOT_A_NUMBER, parseDecimal, type NumberFieldKey } from "@/lib/shape-fields";
import { rect, STYLE, uuid } from "@/test/plan-fixtures";

const ellipse: Shape = {
    id: uuid(7),
    kind: "ellipse",
    x: 100,
    y: 100,
    rotationDeg: 0,
    mirrored: false,
    style: STYLE,
    widthCm: 80,
    depthCm: 80,
};

function patchOf(shape: Shape, field: NumberFieldKey, text: string) {
    const result = applyNumberField(shape, field, text);
    if (!result.ok) throw new Error(`expected a patch, got "${result.error}"`);
    return result.patch;
}

function errorOf(shape: Shape, field: NumberFieldKey, text: string) {
    const result = applyNumberField(shape, field, text);
    if (result.ok) throw new Error("expected an error");
    return result.error;
}

describe("parseDecimal", () => {
    it("accepts comma and point and rounds to 0,1", () => {
        expect(parseDecimal("238,5")).toBe(238.5);
        expect(parseDecimal("412.44")).toBe(412.4);
        expect(parseDecimal(" 100 ")).toBe(100);
        expect(parseDecimal("0,05")).toBe(0.1);
    });

    it("accepts both minus signs", () => {
        expect(parseDecimal("-30")).toBe(-30);
        expect(parseDecimal("−30")).toBe(-30);
        expect(Object.is(parseDecimal("-0,01"), 0)).toBe(true);
    });

    it("rejects empty and non-numeric text", () => {
        for (const text of ["", " ", "breit", "1,2,3", "1e3", "12 cm", "-", ","]) {
            expect(parseDecimal(text)).toBeNull();
        }
    });
});

describe("applyNumberField", () => {
    it("asks for a number", () => {
        expect(errorOf(rect(1), "widthCm", "breit")).toBe(NOT_A_NUMBER);
        expect(NOT_A_NUMBER).toBe("Bitte eine Zahl eingeben");
    });

    describe("width and depth", () => {
        it("rejects 0", () => {
            expect(errorOf(ellipse, "widthCm", "0")).toBe("Muss größer als 0 cm sein");
            expect(errorOf(rect(1), "depthCm", "-5")).toBe("Muss größer als 0 cm sein");
        });

        it("changes only the width; the center stays", () => {
            const shape = rect(1, { widthCm: 100, depthCm: 60, x: 200, y: 100 });
            expect(patchOf(shape, "widthCm", "140")).toEqual({ widthCm: 140 });
        });

        it("takes decimals", () => {
            expect(patchOf(rect(1, { widthCm: 100 }), "widthCm", "238,5")).toEqual({ widthCm: 238.5 });
        });

        it("shrinks a too large corner radius in the same patch", () => {
            const shape = rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 40 });
            expect(patchOf(shape, "depthCm", "60")).toEqual({ depthCm: 60, cornerRadiusCm: 30 });
            expect(patchOf(shape, "depthCm", "80")).toEqual({ depthCm: 80 });
        });
    });

    describe("corner radius", () => {
        const shape = rect(1, { widthCm: 100, depthCm: 60, cornerRadiusCm: 0 });

        it("allows at most half the shorter side", () => {
            expect(errorOf(shape, "cornerRadiusCm", "31")).toBe("Darf höchstens 30 cm sein");
            expect(patchOf(shape, "cornerRadiusCm", "30")).toEqual({ cornerRadiusCm: 30 });
            expect(patchOf(shape, "cornerRadiusCm", "12")).toEqual({ cornerRadiusCm: 12 });
        });

        it("rejects negative values", () => {
            expect(errorOf(shape, "cornerRadiusCm", "-1")).toBe("Darf nicht negativ sein");
        });

        it("names a limit that is itself accepted", () => {
            const odd = rect(1, { widthCm: 100, depthCm: 60.1, cornerRadiusCm: 0 });
            expect(errorOf(odd, "cornerRadiusCm", "30,1")).toBe("Darf höchstens 30 cm sein");
            expect(patchOf(odd, "cornerRadiusCm", "30")).toEqual({ cornerRadiusCm: 30 });
        });
    });

    describe("position", () => {
        it("takes any number for X and Y", () => {
            expect(patchOf(rect(1), "x", "412.44")).toEqual({ x: 412.4 });
            expect(patchOf(rect(1), "y", "-20")).toEqual({ y: -20 });
            expect(patchOf(rect(1), "x", "0")).toEqual({ x: 0 });
        });

        it("normalizes the rotation without snapping", () => {
            const at = (text: string) => patchOf(rect(1, { rotationDeg: 10 }), "rotationDeg", text).rotationDeg;
            expect(at("93")).toBe(93);
            expect(at("-30")).toBe(330);
            expect(at("359,96")).toBe(0);
            expect(at("450")).toBe(90);
            expect(at("-0,3")).toBe(359.7);
        });
    });

    describe("stroke width", () => {
        it("allows more than 0 and at most 20 px", () => {
            expect(errorOf(rect(1), "strokeWidth", "25")).toBe("Darf höchstens 20 px sein");
            expect(errorOf(rect(1), "strokeWidth", "0")).toBe("Muss größer als 0 px sein");
        });

        it("replaces the style as a whole", () => {
            expect(patchOf(rect(1), "strokeWidth", "2,5")).toEqual({ style: { ...STYLE, strokeWidth: 2.5 } });
        });
    });

    it("returns an empty patch for the same value", () => {
        const shape = rect(1, { widthCm: 100, depthCm: 60, x: 412, y: 189, rotationDeg: 93, cornerRadiusCm: 12 });
        expect(patchOf(shape, "widthCm", "100")).toEqual({});
        expect(patchOf(shape, "depthCm", "60,0")).toEqual({});
        expect(patchOf(shape, "cornerRadiusCm", "12")).toEqual({});
        expect(patchOf(shape, "x", "412")).toEqual({});
        expect(patchOf(shape, "y", "189")).toEqual({});
        expect(patchOf(shape, "rotationDeg", "453")).toEqual({});
        expect(patchOf(shape, "strokeWidth", String(STYLE.strokeWidth))).toEqual({});
    });

    describe("limits match the plan schema", () => {
        const base = rect(1, { widthCm: 100, depthCm: 60, cornerRadiusCm: 0 });
        const cases: Array<[NumberFieldKey, string, boolean, Partial<Shape>]> = [
            ["widthCm", "0", false, { widthCm: 0 }],
            ["widthCm", "0,1", true, { widthCm: 0.1 }],
            ["cornerRadiusCm", "30", true, { cornerRadiusCm: 30 }],
            ["cornerRadiusCm", "30,1", false, { cornerRadiusCm: 30.1 }],
            ["cornerRadiusCm", "0", true, { cornerRadiusCm: 0 }],
            ["cornerRadiusCm", "-0,1", false, { cornerRadiusCm: -0.1 }],
            ["strokeWidth", "20", true, { style: { ...STYLE, strokeWidth: 20 } }],
            ["strokeWidth", "20,1", false, { style: { ...STYLE, strokeWidth: 20.1 } }],
            ["strokeWidth", "0", false, { style: { ...STYLE, strokeWidth: 0 } }],
            ["strokeWidth", "0,1", true, { style: { ...STYLE, strokeWidth: 0.1 } }],
        ];

        it.each(cases)("%s = %s → accepted: %s", (field, text, accepted, change) => {
            const result = applyNumberField(base, field, text);
            expect(result.ok).toBe(accepted);
            expect(ShapeSchema.safeParse({ ...base, ...change }).success).toBe(accepted);
            if (result.ok) expect(ShapeSchema.safeParse({ ...base, ...result.patch }).success).toBe(true);
        });
    });
});

describe("applyLabelField", () => {
    it("trims the text", () => {
        expect(applyLabelField(" Sofa ")).toEqual({ label: "Sofa" });
    });

    it("removes the label for an empty text", () => {
        expect(applyLabelField("")).toEqual({ label: undefined });
        expect(applyLabelField("   ")).toEqual({ label: undefined });
    });
});

describe("applyNumberField – further shapes", () => {
    const base = { id: uuid(90), x: 0, y: 0, rotationDeg: 0, mirrored: false, style: STYLE };
    const lShape: Shape = { ...base, kind: "l-shape", widthCm: 280, depthCm: 200, legAWidthCm: 90, legBWidthCm: 90 };
    const uShape: Shape = { ...base, kind: "u-shape", widthCm: 300, depthCm: 240, baseWidthCm: 60, sideWidthCm: 60 };
    const corner: Shape = { ...base, kind: "corner", widthCm: 90, depthCm: 90 };
    const door = (overrides: Partial<Shape> = {}): Shape =>
        ({ ...base, kind: "door-swing", widthCm: 80, x: 100, y: 200, ...overrides }) as Shape;

    /** Hinge on the floor plan (bottom left of the unmirrored door). */
    function hinge(shape: Shape) {
        if (shape.kind !== "door-swing") throw new Error("door expected");
        const lx = (shape.mirrored ? 1 : -1) * (shape.widthCm / 2);
        const ly = shape.widthCm / 2;
        const rad = (shape.rotationDeg * Math.PI) / 180;
        return { x: shape.x + lx * Math.cos(rad) - ly * Math.sin(rad), y: shape.y + lx * Math.sin(rad) + ly * Math.cos(rad) };
    }

    it("changes only leg A of an L-shape", () => {
        expect(patchOf(lShape, "legAWidthCm", "60")).toEqual({ legAWidthCm: 60 });
    });

    it("rejects a leg A as thick as the depth", () => {
        expect(errorOf(lShape, "legAWidthCm", "200")).toBe("Muss kleiner als 200 cm sein");
    });

    it("rejects an L-shape narrower than leg B", () => {
        expect(errorOf(lShape, "widthCm", "80")).toBe("Muss größer als 90 cm sein");
        expect(errorOf(lShape, "legBWidthCm", "0")).toBe("Muss größer als 0 cm sein");
    });

    it("changes both sides of a U-shape and checks them against half the width", () => {
        expect(patchOf(uShape, "sideWidthCm", "65")).toEqual({ sideWidthCm: 65 });
        expect(errorOf(uShape, "sideWidthCm", "150")).toBe("Muss kleiner als 150 cm sein");
        expect(errorOf(uShape, "widthCm", "120")).toBe("Muss größer als 120 cm sein");
        expect(errorOf(uShape, "baseWidthCm", "240")).toBe("Muss kleiner als 240 cm sein");
    });

    it("changes the depth of a corner", () => {
        expect(patchOf(corner, "depthCm", "100")).toEqual({ depthCm: 100 });
    });

    it("keeps the hinge of a door when its width changes", () => {
        expect(patchOf(door(), "widthCm", "90")).toEqual({ widthCm: 90, x: 105, y: 195 });
        for (const overrides of [{ rotationDeg: 90 }, { rotationDeg: 217 }, { mirrored: true }]) {
            const before = door(overrides);
            const after = { ...before, ...patchOf(before, "widthCm", "90") } as Shape;
            const h0 = hinge(before);
            const h1 = hinge(after);
            // Center rounded to 0,1 cm: the hinge moves at most half a rounding step per axis.
            expect(Math.abs(h1.x - h0.x)).toBeLessThanOrEqual(0.05 + 1e-9);
            expect(Math.abs(h1.y - h0.y)).toBeLessThanOrEqual(0.05 + 1e-9);
        }
    });

    it("rejects a door width of 0 cm", () => {
        expect(errorOf(door(), "widthCm", "0")).toBe("Muss größer als 0 cm sein");
    });

    it("produces patches that pass the plan schema", () => {
        const accepted: Array<[Shape, NumberFieldKey, string]> = [
            [lShape, "legAWidthCm", "199,9"],
            [lShape, "widthCm", "90,1"],
            [uShape, "sideWidthCm", "149,9"],
            [uShape, "widthCm", "120,1"],
            [door({ rotationDeg: 217 }), "widthCm", "95"],
        ];
        for (const [shape, field, text] of accepted) {
            const patch = patchOf(shape, field, text);
            expect(ShapeSchema.safeParse({ ...shape, ...patch }).success).toBe(true);
        }
    });
});
