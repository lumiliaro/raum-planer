/**
 * Operating system of the device, for the modifier keys: on Apple devices
 * (macOS, iPadOS, iOS) ⌘ takes the place of Ctrl, elsewhere Ctrl stays.
 */

/**
 * True for the platform names of Apple devices: `navigator.platform`
 * („MacIntel“, „iPad“, „iPhone“) and `navigator.userAgentData.platform`
 * („macOS“, „iOS“). iPadOS Safari reports „MacIntel“, which counts as Apple, too.
 */
export function isApplePlatform(platform: string): boolean {
    return /^(mac|iphone|ipad|ipod|ios)/i.test(platform);
}

/** Platform name the browser reports; empty outside a browser (tests). */
function browserPlatform(): string {
    if (typeof navigator === "undefined") return "";
    const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
    return data?.platform || navigator.platform || "";
}

/** Whether the app runs on an Apple device; read once at load. */
export const IS_APPLE: boolean = isApplePlatform(browserPlatform());

/**
 * Whether the key that switches snapping off is held: ⌘ on Apple devices
 * (Ctrl+click is a right click there), Ctrl elsewhere.
 */
export function snapOffHeld(e: { ctrlKey: boolean; metaKey: boolean }, apple: boolean = IS_APPLE): boolean {
    return apple ? e.metaKey : e.ctrlKey;
}

/** `KeyboardEvent.key` of the key that switches snapping off (see `snapOffHeld`). */
export const SNAP_OFF_KEY: "Meta" | "Control" = IS_APPLE ? "Meta" : "Control";
