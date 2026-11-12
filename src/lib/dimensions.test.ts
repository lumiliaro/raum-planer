import { describe, expect, it } from "vitest";
import {
    dimensionCenterCm,
    dimensionFits,
    placeRoomDimensions,
    readableRotationDeg,
    roomDimensions,
    shapeDimensions,
    type PlacedDimension,
} from "@/lib/dimensions";
import type { PointCm, Shape } from "@/lib/plan-schema";
import { rect, rectPoints, room, STYLE, uuid } from "@/test/plan-fixtures";

const close = (actual: PointCm, expected: PointCm) => {
    expect(actual.x).toBeCloseTo(expected.x, 9);
    expect(actual.y).toBeCloseTo(expected.y, 9);
};

function shape(fields: Record<string, unknown>): Shape {
    return { id: uuid(9), x: 0, y: 0, rotationDeg: 0, mirrored: false, style: STYLE, ...fields } as Shape;
}

/** Text of 40 cm × 10 cm, 5 cm from wall or edge. */
const TEXT = () => ({ widthCm: 40, heightCm: 10 });
const GAP = 5;
const sides = (placed: PlacedDimension[]) => placed.map((p) => p.side);

describe("roomDimensions", () => {
    const kitchen = rectPoints(0, 0, 400, 312.5);

    it.each([
        ["clockwise", kitchen],
        ["counter-clockwise", [...kitchen].reverse()],
    ])("labels every edge of a 400 cm × 312,5 cm room (%s)", (_, points) => {
        const labels = roomDimensions(points);
        expect(labels).toHaveLength(4);
        const center = { x: 200, y: 156.25 };
        labels.forEach((label, i) => {
            const start = points[i];
            const end = points[(i + 1) % 4];
            close(label.midCm, { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 });
            // `inward` points from the edge's middle towards the room's center.
            const toCenter = { x: center.x - label.midCm.x, y: center.y - label.midCm.y };
            expect(label.inward.x * toCenter.x + label.inward.y * toCenter.y).toBeGreaterThan(0);
            expect(Math.hypot(label.inward.x, label.inward.y)).toBeCloseTo(1, 9);
        });
        const texts = labels.map((l) => l.text);
        expect(texts.filter((t) => t === "400 cm")).toHaveLength(2);
        expect(texts.filter((t) => t === "312,5 cm")).toHaveLength(2);
        expect(texts[0]).not.toBe(texts[1]);
    });

    it("measures a slanted edge along its direction", () => {
        const [edge] = roomDimensions([
            { x: 0, y: 0 },
            { x: 300, y: 400 },
            { x: 0, y: 400 },
        ]);
        expect(edge.lengthCm).toBeCloseTo(500, 9);
        expect(edge.text).toBe("500 cm");
        expect(edge.edgeAngleDeg).toBeCloseTo(53.13, 2);
    });
});

describe("shapeDimensions", () => {
    it("puts the width of a 180 cm × 200 cm rectangle at the bottom and the depth at the left", () => {
        const [width, depth] = shapeDimensions(rect(1, { widthCm: 180, depthCm: 200 }));
        expect(width).toEqual({ text: "180 cm", midCm: { x: 0, y: 100 }, edgeAngleDeg: 0, inward: { x: 0, y: -1 }, lengthCm: 180 });
        expect(depth).toEqual({ text: "200 cm", midCm: { x: -90, y: 0 }, edgeAngleDeg: 90, inward: { x: 1, y: 0 }, lengthCm: 200 });
    });

    it("puts the depth of a mirrored L-shape at the right", () => {
        const labels = shapeDimensions(
            shape({ kind: "l-shape", mirrored: true, widthCm: 280, depthCm: 200, legAWidthCm: 60, legBWidthCm: 60 }),
        );
        expect(labels.map((l) => l.text)).toEqual(["280 cm", "200 cm"]);
        expect(labels[1].midCm).toEqual({ x: 140, y: 0 });
        expect(labels[1].inward).toEqual({ x: -1, y: 0 });
    });

    it.each([
        ["ellipse", { kind: "ellipse", widthCm: 120, depthCm: 80 }],
        ["u-shape", { kind: "u-shape", widthCm: 120, depthCm: 80, baseWidthCm: 30, sideWidthCm: 30 }],
        ["corner", { kind: "corner", widthCm: 120, depthCm: 80 }],
    ])("takes width and depth of a %s from its fields", (_, fields) => {
        const labels = shapeDimensions(shape(fields));
        expect(labels.map((l) => l.text)).toEqual(["120 cm", "80 cm"]);
        expect(labels[0].midCm).toEqual({ x: 0, y: 40 });
        expect(labels[1].midCm).toEqual({ x: -60, y: 0 });
    });

    it("shows only the width of a door, at its bottom edge", () => {
        const labels = shapeDimensions(shape({ kind: "door-swing", widthCm: 80 }));
        expect(labels).toHaveLength(1);
        expect(labels[0]).toMatchObject({ text: "80 cm", midCm: { x: 0, y: 40 }, edgeAngleDeg: 0 });
    });

    it("shows nothing for a polygon", () => {
        const points = [
            { x: -50, y: -50 },
            { x: 50, y: -50 },
            { x: 0, y: 50 },
        ];
        expect(shapeDimensions(shape({ kind: "polygon", pointsCm: points }))).toEqual([]);
    });
});

describe("dimensionCenterCm", () => {
    const [top] = roomDimensions(rectPoints(0, 0, 400, 312.5));

    it("moves the text inwards or outwards by distance plus half its height", () => {
        close(dimensionCenterCm(top, "inside", 5, 10), { x: 200, y: 10 });
        close(dimensionCenterCm(top, "outside", 20, 10), { x: 200, y: -25 });
    });
});

describe("placeRoomDimensions", () => {
    it("puts all dimensions of a room without neighbors outside, in front of the wall", () => {
        const [placed] = placeRoomDimensions([room(1, "Küche", rectPoints(0, 0, 400, 312.5))], TEXT, GAP);
        expect(sides(placed)).toEqual(["outside", "outside", "outside", "outside"]);
        close(placed[0].centerCm, { x: 200, y: -(15 + GAP + 5) });
        close(placed[1].centerCm, { x: 400 + 15 + GAP + 5, y: 156.25 });
    });

    it("puts the dimensions at a shared wall inside each room", () => {
        const kitchen = room(1, "Küche", rectPoints(0, 0, 400, 312.5));
        const hall = room(2, "Flur", rectPoints(415, 0, 200, 312.5));
        const [k, h] = placeRoomDimensions([kitchen, hall], TEXT, GAP);
        expect(sides(k)).toEqual(["outside", "inside", "outside", "outside"]);
        expect(sides(h)).toEqual(["outside", "outside", "outside", "inside"]);
        close(k[1].centerCm, { x: 400 - GAP - 5, y: 156.25 });
        close(h[3].centerCm, { x: 415 + GAP + 5, y: 156.25 });
    });

    it("puts the dimension at an inner corner inside when it would lie on the room's own wall", () => {
        const l = room(1, "L", [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
            { x: 400, y: 100 },
            { x: 100, y: 100 },
            { x: 100, y: 160 },
            { x: 0, y: 160 },
        ]);
        const [placed] = placeRoomDimensions([l], TEXT, GAP);
        expect(sides(placed)).toEqual(["outside", "outside", "outside", "inside", "outside", "outside"]);
    });

    it("puts a dimension inside when only a corner of the text touches a neighbor's wall", () => {
        // Text of the top edge outside: x 180…220, y −30…−20. The neighbor's wall band ends at (x0 − 15, −29).
        const neighbor = (x0: number) => room(2, "B", rectPoints(x0, -344, 100, 300));
        const a = room(1, "A", rectPoints(0, 0, 400, 300));
        expect(placeRoomDimensions([a, neighbor(234)], TEXT, GAP)[0][0].side).toBe("inside");
        expect(placeRoomDimensions([a, neighbor(236)], TEXT, GAP)[0][0].side).toBe("outside");
    });

    it("returns one list per room in the order of the rooms, one entry per edge", () => {
        const tri = room(2, "Dreieck", [
            { x: 1000, y: 0 },
            { x: 1300, y: 400 },
            { x: 1000, y: 400 },
        ]);
        const result = placeRoomDimensions([room(1), tri], TEXT, GAP);
        expect(result.map((r) => r.length)).toEqual([4, 3]);
        expect(result[1][0].label.text).toBe("500 cm");
        expect(placeRoomDimensions([], TEXT, GAP)).toEqual([]);
    });
});

describe("readableRotationDeg", () => {
    it.each([
        [0, 0],
        [180, 0],
        [90, -90],
        [-90, -90],
        [270, -90],
        [135, -45],
        [45, 45],
    ])("turns an absolute angle of %d° into %d°", (angle, expected) => {
        expect(readableRotationDeg(angle, 0)).toBeCloseTo(expected, 9);
    });

    it.each([0, 30, 90, 180, 270, -45, 359])("keeps text plus group rotation %d° within [−90°, 90°)", (group) => {
        for (const edge of [0, 45, 90, 135, 180, 270]) {
            const absolute = readableRotationDeg(edge, group) + group;
            expect(absolute).toBeGreaterThanOrEqual(-90 - 1e-9);
            expect(absolute).toBeLessThan(90);
        }
    });

    it("reads the width of a rectangle turned by 90° bottom to top and its depth horizontally", () => {
        const [width, depth] = shapeDimensions(rect(1, { widthCm: 180, depthCm: 200, rotationDeg: 90 }));
        expect(readableRotationDeg(width.edgeAngleDeg, 90) + 90).toBeCloseTo(-90, 9);
        expect(readableRotationDeg(depth.edgeAngleDeg, 90) + 90).toBeCloseTo(0, 9);
    });
});

describe("dimensionFits", () => {
    it("fits a text much shorter than the edge, not one longer than the edge", () => {
        expect(dimensionFits(40, 200)).toBe(true);
        expect(dimensionFits(60, 50)).toBe(false);
    });

    it("keeps a margin at both ends", () => {
        expect(dimensionFits(42, 50)).toBe(true);
        expect(dimensionFits(42.1, 50)).toBe(false);
        expect(dimensionFits(48, 50, 1)).toBe(true);
        expect(dimensionFits(48.1, 50, 1)).toBe(false);
    });
});
