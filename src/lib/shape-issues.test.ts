import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CalibrationSchema } from "@/lib/calibration-schema";
import { OpeningSchema, RoomSchema, ShapeSchema, UnderlaySchema } from "@/lib/plan-schema";
import {
    describeCalibrationIssue,
    describeOpeningIssue,
    describeRoomIssue,
    describeShapeIssue,
    describeUnderlayIssue,
} from "@/lib/shape-issues";
import { CAL_EG, rect, rectPoints, room, STYLE, underlay, uuid } from "@/test/plan-fixtures";

const shapeReason = (raw: unknown) => {
    const result = ShapeSchema.safeParse(raw);
    if (result.success) throw new Error("shape unexpectedly valid");
    return describeShapeIssue(result.error, raw);
};

const calibrationReason = (raw: unknown) => {
    const result = CalibrationSchema.safeParse(raw);
    if (result.success) throw new Error("calibration unexpectedly valid");
    return describeCalibrationIssue(result.error, raw);
};

const without = <T extends object>(obj: T, key: keyof T) => {
    const copy = { ...obj };
    delete copy[key];
    return copy;
};

describe("describeShapeIssue", () => {
    it("names a missing width", () => {
        expect(shapeReason(without(rect(1), "widthCm" as never))).toBe("Breite fehlt");
    });

    it("names the corner radius when it is too large", () => {
        expect(shapeReason(rect(1, { widthCm: 200, depthCm: 90, cornerRadiusCm: 50 }))).toBe("Eckradius ungültig");
    });

    it("names an unknown kind", () => {
        expect(shapeReason({ ...rect(1), kind: "schraege-wand" })).toBe("Formtyp „schraege-wand“ unbekannt");
    });

    it("names a missing kind", () => {
        expect(shapeReason(without(rect(1), "kind"))).toBe("Formtyp fehlt");
    });

    it("names an invalid fill color", () => {
        expect(shapeReason({ ...rect(1), style: { ...STYLE, fill: "blau" } })).toBe("Füllfarbe ungültig");
    });

    it("names an invalid opacity", () => {
        expect(shapeReason({ ...rect(1), style: { ...STYLE, opacity: 1.5 } })).toBe("Deckkraft ungültig");
    });

    it("names the points of a polygon for an invalid single point", () => {
        const polygon = { ...without(rect(1), "widthCm" as never), kind: "polygon", pointsCm: [{ x: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }] };
        expect(shapeReason(polygon)).toBe("Punkte ungültig");
    });

    it("falls back for an unknown path", () => {
        const error = new z.ZodError([{ code: "custom", path: ["foo"], message: "x", input: undefined }]);
        expect(describeShapeIssue(error, {})).toBe("Angaben ungültig");
    });

    it("falls back when the shape is no object", () => {
        expect(shapeReason("Sofa")).toBe("Angaben ungültig");
    });
});

describe("describeCalibrationIssue", () => {
    it("names a scale of 0 px/cm", () => {
        expect(calibrationReason({ ...CAL_EG, pxPerCm: 0 })).toBe("Maßstab ungültig");
    });

    it("names a missing point 2", () => {
        expect(calibrationReason(without(CAL_EG, "p2"))).toBe("Punkt 2 fehlt");
    });

    it("names point 2 for an invalid coordinate", () => {
        expect(calibrationReason({ ...CAL_EG, p2: { x: -1, y: 0 } })).toBe("Punkt 2 ungültig");
    });
});

describe("describeUnderlayIssue", () => {
    const underlayReason = (raw: unknown) => {
        const result = UnderlaySchema.safeParse(raw);
        if (result.success) throw new Error("underlay unexpectedly valid");
        return describeUnderlayIssue(result.error, raw);
    };

    it("names the opacity", () => {
        expect(underlayReason(underlay(null, { opacity: 3 }))).toBe("Deckkraft ungültig");
        const { opacity: _, ...noOpacity } = underlay();
        expect(underlayReason(noOpacity)).toBe("Deckkraft fehlt");
    });

    it("names the image id, the size and the visibility", () => {
        expect(underlayReason(underlay(null, { imageId: "eg.png" }))).toBe("Bild-Kennung ungültig");
        expect(underlayReason(underlay(null, { imageWidthPx: null, imageHeightPx: null }))).toBe("Bildbreite ungültig");
        expect(underlayReason({ ...underlay(), visible: "ja" })).toBe("Sichtbar ungültig");
    });

    it("names the calibration as a whole", () => {
        expect(underlayReason(underlay({ ...CAL_EG, pxPerCm: 0 }))).toBe("Kalibrierung ungültig");
    });

    it("falls back to the generic reason", () => {
        expect(underlayReason("Vorlage")).toBe("Angaben ungültig");
    });
});

describe("describeRoomIssue", () => {
    const roomReason = (raw: unknown) => {
        const result = RoomSchema.safeParse(raw);
        if (result.success) throw new Error("room unexpectedly valid");
        return describeRoomIssue(result.error, raw);
    };
    const pts = (...coords: [number, number][]) => coords.map(([x, y]) => ({ x, y }));

    it("names a missing name and an invalid one", () => {
        expect(roomReason(without(room(1), "name"))).toBe("Name fehlt");
        expect(roomReason({ ...room(1), name: "  " })).toBe("Name ungültig");
        expect(roomReason({ ...room(1), name: 42 })).toBe("Name ungültig");
    });

    it("names fewer than 3 corners", () => {
        expect(roomReason({ ...room(1), pointsCm: pts([0, 0], [300, 0]) })).toBe("Weniger als 3 Eckpunkte");
        expect(roomReason(without(room(1), "pointsCm"))).toBe("Weniger als 3 Eckpunkte");
    });

    it("names a broken corner", () => {
        expect(roomReason({ ...room(1), pointsCm: [{ x: 0, y: "0" }, ...pts([300, 0], [300, 200])] })).toBe("Eckpunkt ungültig");
        expect(roomReason({ ...room(1), pointsCm: [null, ...pts([300, 0], [300, 200])] })).toBe("Eckpunkt ungültig");
    });

    it("names a self-intersecting outline", () => {
        expect(roomReason({ ...room(1), pointsCm: pts([0, 0], [300, 300], [300, 0], [0, 300]) })).toBe(
            "Umriss überschneidet sich",
        );
    });

    it("names a doubled corner as an edge of 0 cm", () => {
        expect(roomReason({ ...room(1), pointsCm: pts([0, 0], [300, 0], [300, 0], [300, 200]) })).toBe("Kante mit 0 cm");
    });

    it("falls back to „Angaben ungültig“", () => {
        expect(roomReason({ ...room(1), id: "wohnen" })).toBe("Angaben ungültig");
        expect(roomReason({ ...room(1), pointsCm: "eckig" })).toBe("Angaben ungültig");
        expect(roomReason(null)).toBe("Angaben ungültig");
    });
});

describe("describeOpeningIssue", () => {
    /** „Flur“ with 4 corners; edge 0 is 180 cm long. */
    const FLUR = room(40, "Flur", rectPoints(0, 0, 180, 300));
    const DOOR = { id: uuid(41), kind: "door", edgeIndex: 0, offsetCm: 50, widthCm: 80, swing: { hinge: "start", side: "inside" }, beforeFullEdge: null };
    const WINDOW = { id: uuid(42), kind: "window", edgeIndex: 0, offsetCm: 30, widthCm: 120, swing: null, beforeFullEdge: null };

    /** Reason via the room check, as the import does it. */
    const reason = (raw: unknown) => {
        const result = RoomSchema.safeParse({ ...FLUR, openings: [raw] });
        if (result.success) throw new Error("opening unexpectedly valid");
        return describeOpeningIssue(result.error, raw);
    };

    it("accepts the valid door, window and passage", () => {
        const passage = { ...WINDOW, id: uuid(43), kind: "passage" };
        expect(RoomSchema.safeParse({ ...FLUR, openings: [DOOR, WINDOW, passage] }).success).toBe(true);
    });

    it.each([
        ["a door on the eighth edge", { ...DOOR, edgeIndex: 7 }, "Kante unbekannt"],
        ["a window of 120 cm at 100 cm on a 180 cm edge", { ...WINDOW, offsetCm: 100 }, "passt nicht auf die Kante"],
        ["a width of 0 cm", { ...DOOR, widthCm: 0 }, "Breite ungültig"],
        ["a width as text", { ...DOOR, widthCm: "80" }, "Breite ungültig"],
        ["a negative offset", { ...DOOR, offsetCm: -5 }, "Abstand ungültig"],
        ["a door with swing: null", { ...DOOR, swing: null }, "Aufschlag fehlt"],
        ["a door without swing", { ...DOOR, swing: undefined }, "Aufschlag fehlt"],
        ["a window with swing", { ...WINDOW, swing: DOOR.swing }, "Aufschlag ungültig"],
        ["a passage with swing", { ...WINDOW, kind: "passage", swing: DOOR.swing }, "Aufschlag ungültig"],
        ["a passage of 120 cm at 100 cm on a 180 cm edge", { ...WINDOW, kind: "passage", offsetCm: 100 }, "passt nicht auf die Kante"],
        ["a door with hinge „left“", { ...DOOR, swing: { hinge: "left", side: "inside" } }, "Aufschlag ungültig"],
        ["an unknown kind", { ...WINDOW, kind: "dachfenster" }, "Art unbekannt"],
        ["a missing kind", { ...WINDOW, kind: undefined }, "Art unbekannt"],
        ["no object", "Tür", "Angaben ungültig"],
        ["a broken id", { ...DOOR, id: "tuer-1" }, "Angaben ungültig"],
    ])("names %s", (_name, raw, text) => {
        expect(reason(raw)).toBe(text);
    });

    it("also reads an error of OpeningSchema alone", () => {
        const raw = { ...DOOR, swing: null };
        const result = OpeningSchema.safeParse(raw);
        if (result.success) throw new Error("opening unexpectedly valid");
        expect(describeOpeningIssue(result.error, raw)).toBe("Aufschlag fehlt");
    });
});
