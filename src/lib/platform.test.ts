import { describe, expect, it } from "vitest";
import { isApplePlatform, snapOffHeld } from "@/lib/platform";

describe("isApplePlatform", () => {
    it.each(["MacIntel", "iPad", "iPhone", "iPod touch", "macOS", "iOS"])("treats %s as Apple", (platform) => {
        expect(isApplePlatform(platform)).toBe(true);
    });

    it.each(["Win32", "Linux x86_64", "Windows", "Linux", "Android", ""])("does not treat %j as Apple", (platform) => {
        expect(isApplePlatform(platform)).toBe(false);
    });
});

describe("snapOffHeld", () => {
    it("reads ⌘ on Apple devices, not Ctrl", () => {
        expect(snapOffHeld({ ctrlKey: true, metaKey: false }, true)).toBe(false);
        expect(snapOffHeld({ ctrlKey: false, metaKey: true }, true)).toBe(true);
    });

    it("reads Ctrl elsewhere, not ⌘ or the Windows key", () => {
        expect(snapOffHeld({ ctrlKey: true, metaKey: false }, false)).toBe(true);
        expect(snapOffHeld({ ctrlKey: false, metaKey: true }, false)).toBe(false);
    });
});
