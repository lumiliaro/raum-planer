import { describe, expect, it } from "vitest";
import { SHAPE_KIND_LABELS } from "@/lib/shape-kinds";

describe("SHAPE_KIND_LABELS", () => {
    it("names every shape kind", () => {
        expect(Object.keys(SHAPE_KIND_LABELS)).toHaveLength(7);
        for (const name of Object.values(SHAPE_KIND_LABELS)) expect(name.trim()).not.toBe("");
    });

    it("names rectangle and ellipse", () => {
        expect(SHAPE_KIND_LABELS.rect).toBe("Rechteck");
        expect(SHAPE_KIND_LABELS.ellipse).toBe("Ellipse");
    });
});
