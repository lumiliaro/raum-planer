import { describe, expect, it } from "vitest";
import { readBoolean, writeBoolean } from "@/lib/ui-prefs";
import { memoryStorage, throwingStorage } from "@/test/memory-storage";

const KEY = "raumplaner.ui.test";

describe("readBoolean", () => {
    it("returns the stored value", () => {
        expect(readBoolean(memoryStorage({ [KEY]: "false" }), KEY, true)).toBe(false);
        expect(readBoolean(memoryStorage({ [KEY]: "true" }), KEY, false)).toBe(true);
    });

    it("falls back when the value is missing", () => {
        expect(readBoolean(memoryStorage(), KEY, true)).toBe(true);
    });

    it("falls back when the value is invalid", () => {
        expect(readBoolean(memoryStorage({ [KEY]: "yes" }), KEY, true)).toBe(true);
    });

    it("falls back when the storage throws", () => {
        expect(readBoolean(throwingStorage(), KEY, true)).toBe(true);
    });

    it("falls back when there is no storage", () => {
        expect(readBoolean(undefined, KEY, true)).toBe(true);
    });
});

describe("writeBoolean", () => {
    it("stores the value as text", () => {
        const storage = memoryStorage();
        writeBoolean(storage, KEY, false);
        expect(storage.getItem(KEY)).toBe("false");
        expect(readBoolean(storage, KEY, true)).toBe(false);
    });

    it("does not throw when the storage throws or is missing", () => {
        expect(() => writeBoolean(throwingStorage(), KEY, true)).not.toThrow();
        expect(() => writeBoolean(undefined, KEY, true)).not.toThrow();
    });
});
