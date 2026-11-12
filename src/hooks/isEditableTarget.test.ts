import { describe, expect, it } from "vitest";
import { isTextEntry, ownsUndo } from "@/hooks/isEditableTarget";

const input = (type?: string) => ({ tagName: "INPUT", type, isContentEditable: false });

describe("isTextEntry", () => {
    it("blocks shortcuts in text entries", () => {
        expect(isTextEntry(input("text"))).toBe(true);
        expect(isTextEntry(input())).toBe(true);
        expect(isTextEntry(input(""))).toBe(true);
        expect(isTextEntry(input("number"))).toBe(true);
        expect(isTextEntry(input("search"))).toBe(true);
        expect(isTextEntry({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
        expect(isTextEntry({ tagName: "SELECT", isContentEditable: false })).toBe(true);
        expect(isTextEntry({ tagName: "DIV", isContentEditable: true })).toBe(true);
    });

    it("lets shortcuts through on other controls", () => {
        expect(isTextEntry(input("checkbox"))).toBe(false);
        expect(isTextEntry(input("range"))).toBe(false);
        expect(isTextEntry(input("color"))).toBe(false);
        expect(isTextEntry({ tagName: "BUTTON", isContentEditable: false })).toBe(false);
        expect(isTextEntry({ tagName: "DIV", isContentEditable: false })).toBe(false);
    });
});

describe("ownsUndo", () => {
    it("leaves undo to a text entry while it holds uncommitted text", () => {
        expect(ownsUndo({ ...input("text"), commitField: "dirty" })).toBe(true);
        expect(ownsUndo(input("text"))).toBe(true);
        expect(ownsUndo({ tagName: "TEXTAREA", isContentEditable: false })).toBe(true);
    });

    it("lets undo through in a properties field without uncommitted text", () => {
        expect(ownsUndo({ ...input("text"), commitField: "clean" })).toBe(false);
    });

    it("lets undo through on other controls", () => {
        expect(ownsUndo(input("checkbox"))).toBe(false);
        expect(ownsUndo({ tagName: "BUTTON", isContentEditable: false })).toBe(false);
        expect(ownsUndo({ tagName: "BODY", isContentEditable: false })).toBe(false);
    });
});
