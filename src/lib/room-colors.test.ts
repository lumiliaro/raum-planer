import { describe, expect, it } from "vitest";
import { HexColorSchema } from "@/lib/plan-schema";
import { findRoomColorPreset, ROOM_COLOR_PRESETS, roomAreaFill } from "@/lib/room-colors";

describe("ROOM_COLOR_PRESETS", () => {
    it("has 8 entries, the first is „Standard“ without color", () => {
        expect(ROOM_COLOR_PRESETS.map((p) => p.name)).toEqual([
            "Standard",
            "Grau",
            "Blau",
            "Grün",
            "Gelb",
            "Orange",
            "Rosa",
            "Violett",
        ]);
        expect(ROOM_COLOR_PRESETS[0].color).toBeNull();
    });

    it("every other entry is a valid #RRGGBB color", () => {
        for (const { color } of ROOM_COLOR_PRESETS.slice(1)) {
            expect(HexColorSchema.safeParse(color).success).toBe(true);
        }
    });
});

describe("findRoomColorPreset", () => {
    it("finds Grün for #bbf7d0, ignoring case", () => {
        expect(findRoomColorPreset("#bbf7d0")?.name).toBe("Grün");
        expect(findRoomColorPreset("#BBF7D0")?.name).toBe("Grün");
    });

    it("finds „Standard“ for no color", () => {
        expect(findRoomColorPreset(null)?.name).toBe("Standard");
    });

    it("finds nothing for a free color like #7DD3FC", () => {
        expect(findRoomColorPreset("#7DD3FC")).toBeNull();
    });
});

describe("roomAreaFill", () => {
    it("is half-transparent white without color", () => {
        expect(roomAreaFill(null)).toBe("rgba(255,255,255,0.5)");
    });

    it("is the room color at half opacity", () => {
        expect(roomAreaFill("#BBF7D0")).toBe("rgba(187,247,208,0.5)");
        expect(roomAreaFill("#7dd3fc")).toBe("rgba(125,211,252,0.5)");
    });
});
