import { describe, expect, it } from "vitest";
import { createExportCounter, EXPORT_COUNTER_KEY } from "@/lib/export-counter";
import { failingWrites, memoryStorage, throwingStorage } from "@/test/memory-storage";

const DAY = new Date(2026, 10, 11, 10, 0);
const LATE = new Date(2026, 10, 11, 23, 59);
const NEXT_DAY = new Date(2026, 10, 12, 0, 1);

describe("createExportCounter", () => {
    it("starts at 1 and counts up with each export", () => {
        const counter = createExportCounter(memoryStorage());
        expect(counter.take("Umzug", DAY)).toBe(1);
        expect(counter.take("Umzug", DAY)).toBe(2);
        expect(counter.take("Umzug", LATE)).toBe(3);
    });

    it("peek shows the next version without counting", () => {
        const counter = createExportCounter(memoryStorage());
        expect(counter.peek("Umzug", DAY)).toBe(1);
        expect(counter.peek("Umzug", DAY)).toBe(1);
        counter.take("Umzug", DAY);
        expect(counter.peek("Umzug", DAY)).toBe(2);
    });

    it("starts at 1 again on a new day", () => {
        const counter = createExportCounter(memoryStorage());
        counter.take("Umzug", DAY);
        counter.take("Umzug", DAY);
        counter.take("Umzug", DAY);
        expect(counter.peek("Umzug", NEXT_DAY)).toBe(1);
        expect(counter.take("Umzug", NEXT_DAY)).toBe(1);
    });

    it("counts each name separately; names with the same file name count together", () => {
        const counter = createExportCounter(memoryStorage());
        counter.take("Umzug", DAY);
        counter.take("Umzug", DAY);
        expect(counter.take("Umzug neu", DAY)).toBe(1);
        expect(counter.take("umzug", DAY)).toBe(3);
    });

    it("keeps counting after a reload on the same storage", () => {
        const storage = memoryStorage();
        createExportCounter(storage).take("Umzug", DAY);
        createExportCounter(storage).take("Umzug", DAY);
        expect(createExportCounter(storage).take("Umzug", DAY)).toBe(3);
        expect(JSON.parse(storage.getItem(EXPORT_COUNTER_KEY)!)).toEqual({
            date: "2026-11-11",
            counts: { umzug: 3 },
        });
    });

    it.each([
        ["a blocked storage", () => throwingStorage()],
        ["a full storage", () => failingWrites(memoryStorage())],
        ["no storage", () => undefined],
    ])("keeps counting for the session with %s", (_, makeStorage) => {
        const counter = createExportCounter(makeStorage());
        expect(counter.take("Umzug", DAY)).toBe(1);
        expect(counter.take("Umzug", DAY)).toBe(2);
        expect(counter.peek("Umzug", DAY)).toBe(3);
    });

    it.each(["kaputt", "[]", '{"date":"2026-11-11","counts":{"umzug":"zwei"}}', "null"])(
        "starts at 1 for the stored value %s",
        (raw) => {
            const counter = createExportCounter(memoryStorage({ [EXPORT_COUNTER_KEY]: raw }));
            expect(counter.take("Umzug", DAY)).toBe(1);
        },
    );
});
