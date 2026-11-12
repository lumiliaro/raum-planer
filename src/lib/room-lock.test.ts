import { describe, expect, it } from "vitest";
import type { RoomPatch } from "@/lib/plan";
import { canDeleteRoom, isRoomPatchAllowed } from "@/lib/room-lock";
import { rectPoints, room } from "@/test/plan-fixtures";

const open = room(1);
const locked = { ...room(2), locked: true };

describe("isRoomPatchAllowed", () => {
    it("allows everything for a room that is not locked", () => {
        expect(isRoomPatchAllowed(open, { pointsCm: rectPoints(10, 0, 337.5, 560) })).toBe(true);
        expect(isRoomPatchAllowed(open, { wallThicknessCm: [24, 15, 15, 15] })).toBe(true);
    });

    it.each<[string, RoomPatch]>([
        ["name", { name: "Wohnzimmer" }],
        ["color", { color: "#BBF7D0" }],
        ["locked", { locked: false }],
        ["an empty patch", {}],
    ])("allows %s on a locked room", (_, patch) => {
        expect(isRoomPatchAllowed(locked, patch)).toBe(true);
    });

    it.each<[string, RoomPatch]>([
        ["pointsCm", { pointsCm: rectPoints(10, 0, 337.5, 560) }],
        ["wallThicknessCm", { wallThicknessCm: [24, 15, 15, 15] }],
        ["a mixed patch", { name: "Wohnzimmer", pointsCm: rectPoints(10, 0, 337.5, 560) }],
    ])("rejects %s on a locked room", (_, patch) => {
        expect(isRoomPatchAllowed(locked, patch)).toBe(false);
    });
});

describe("canDeleteRoom", () => {
    it("is false for a locked room and true for one that is not locked", () => {
        expect(canDeleteRoom(locked)).toBe(false);
        expect(canDeleteRoom(open)).toBe(true);
    });
});
