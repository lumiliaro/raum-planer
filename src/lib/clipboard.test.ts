import { describe, expect, it } from "vitest";
import {
    copyName,
    copyRoom,
    copyShape,
    isFirstPasteAfterCut,
    PASTE_OFFSET_CM,
    pasteOffsetSteps,
    type ClipboardState,
} from "@/lib/clipboard";
import { MAX_ROOM_NAME_LENGTH, RoomSchema, type Opening } from "@/lib/plan-schema";
import { rect, rectPoints, room, uuid } from "@/test/plan-fixtures";

const clip = (overrides: Partial<ClipboardState> = {}): ClipboardState => ({
    item: { kind: "shape", shape: rect(1) },
    sourceFloorId: "eg",
    cut: false,
    pastesByFloor: {},
    ...overrides,
});

/** Ids 100, 101, … in call order. */
function idSequence(start = 100) {
    let n = start;
    return () => uuid(n++);
}

describe("pasteOffsetSteps", () => {
    it("is 50 cm", () => {
        expect(PASTE_OFFSET_CM).toBe(50);
    });

    it("copied on the ground floor: there 1, 2, 3 after 0, 1, 2 pastes", () => {
        expect(pasteOffsetSteps(clip(), "eg")).toBe(1);
        expect(pasteOffsetSteps(clip({ pastesByFloor: { eg: 1 } }), "eg")).toBe(2);
        expect(pasteOffsetSteps(clip({ pastesByFloor: { eg: 2 } }), "eg")).toBe(3);
    });

    it("copied on the ground floor: upstairs 0, 1, independent of the ground floor's pastes", () => {
        expect(pasteOffsetSteps(clip({ pastesByFloor: { eg: 2 } }), "og")).toBe(0);
        expect(pasteOffsetSteps(clip({ pastesByFloor: { eg: 2, og: 1 } }), "og")).toBe(1);
    });

    it("cut on the ground floor: there 0, 1", () => {
        expect(pasteOffsetSteps(clip({ cut: true }), "eg")).toBe(0);
        expect(pasteOffsetSteps(clip({ cut: true, pastesByFloor: { eg: 1 } }), "eg")).toBe(1);
    });
});

describe("isFirstPasteAfterCut", () => {
    it("only before the first paste after a cut, on any floor", () => {
        expect(isFirstPasteAfterCut(clip({ cut: true }))).toBe(true);
        expect(isFirstPasteAfterCut(clip({ cut: true, pastesByFloor: { og: 1 } }))).toBe(false);
        expect(isFirstPasteAfterCut(clip())).toBe(false);
    });
});

describe("copyName", () => {
    it("adds „ (Kopie)“", () => {
        expect(copyName("Bad")).toBe("Bad (Kopie)");
    });

    it("keeps a name already ending on „ (Kopie)“", () => {
        expect(copyName("Bad (Kopie)")).toBe("Bad (Kopie)");
    });

    it("shortens a 40-character name to exactly 40 characters ending on „ (Kopie)“", () => {
        const name = "A".repeat(MAX_ROOM_NAME_LENGTH);
        const copy = copyName(name);
        expect(copy).toHaveLength(40);
        expect(copy.endsWith(" (Kopie)")).toBe(true);
        expect(copy).toBe(`${"A".repeat(32)} (Kopie)`);
    });
});

describe("copyShape", () => {
    it("takes over everything but id, position and lock", () => {
        const original = rect(1, {
            x: 300,
            y: 200,
            rotationDeg: 90,
            mirrored: true,
            label: "Bett",
            locked: true,
            style: { fill: "#BFDBFE", stroke: "#1E3A8A", strokeWidth: 2, opacity: 0.8 },
        });
        const copy = copyShape(original, 50, 50, uuid(2));
        expect(copy.id).toBe(uuid(2));
        expect(copy).toMatchObject({ x: 350, y: 250, rotationDeg: 90, mirrored: true, label: "Bett", widthCm: 200, depthCm: 90 });
        expect(copy.style).toEqual(original.style);
        expect(copy.locked).toBeUndefined();
        expect(original.locked).toBe(true);
    });

    it("rounds the position to 0.1 cm", () => {
        const copy = copyShape(rect(1, { x: 100.04, y: 99.96 }), 50, 50, uuid(2));
        expect(copy.x).toBe(150);
        expect(copy.y).toBe(150);
    });
});

describe("copyRoom", () => {
    const DOOR: Opening = {
        id: uuid(30),
        kind: "door",
        edgeIndex: 2,
        offsetCm: 100,
        widthCm: 80,
        swing: { hinge: "start", side: "inside" },
        beforeFullEdge: null,
    };
    const WINDOW: Opening = { id: uuid(31), kind: "window", edgeIndex: 0, offsetCm: 50, widthCm: 120, swing: null, beforeFullEdge: null };
    const BAD = room(10, "Bad", rectPoints(0, 0, 400, 300), [DOOR, WINDOW], [11.5, 11.5, 11.5, 11.5], "#BFDBFE", true);

    it("moves the outline, gives new ids, keeps openings, walls and color, unlocks and renames", () => {
        const copy = copyRoom(BAD, 50, 50, idSequence());
        expect(copy.id).toBe(uuid(100));
        expect(copy.pointsCm).toEqual(rectPoints(50, 50, 400, 300));
        expect(copy.openings.map((o) => o.id)).toEqual([uuid(101), uuid(102)]);
        expect(copy.openings.map(({ id: _id, ...rest }) => rest)).toEqual(BAD.openings.map(({ id: _id, ...rest }) => rest));
        expect(copy.wallThicknessCm).toEqual([11.5, 11.5, 11.5, 11.5]);
        expect(copy.color).toBe("#BFDBFE");
        expect(copy.locked).toBe(false);
        expect(copy.name).toBe("Bad (Kopie)");
        expect(RoomSchema.safeParse(copy).success).toBe(true);
    });

    it("keeps the name with keepName", () => {
        const copy = copyRoom(BAD, 0, 0, idSequence(), { keepName: true });
        expect(copy.name).toBe("Bad");
        expect(copy.pointsCm).toEqual(BAD.pointsCm);
        expect(RoomSchema.safeParse(copy).success).toBe(true);
    });
});
