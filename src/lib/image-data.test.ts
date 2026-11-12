import { describe, expect, it } from "vitest";
import {
    base64ToBytes,
    bytesToBase64,
    imageIdFor,
    MAX_IMAGE_BYTES,
    parseDataUrl,
    sniffImageType,
    toDataUrl,
} from "@/lib/image-data";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

const PNG_HEAD = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13);
const JPEG_HEAD = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1);
const WEBP_HEAD = new Uint8Array([...text("RIFF"), 0x24, 0, 0, 0, ...text("WEBP")]);

describe("sniffImageType", () => {
    it("recognizes PNG, JPEG and WebP by their first bytes", () => {
        expect(sniffImageType(PNG_HEAD)).toBe("image/png");
        expect(sniffImageType(JPEG_HEAD)).toBe("image/jpeg");
        expect(sniffImageType(WEBP_HEAD)).toBe("image/webp");
    });

    it("rejects PDF, text, other RIFF files and too short data", () => {
        expect(sniffImageType(text("%PDF-1.7\n%âãÏÓ"))).toBeNull();
        expect(sniffImageType(text("Hallo Welt, kein Bild"))).toBeNull();
        expect(sniffImageType(new Uint8Array([...text("RIFF"), 0, 0, 0, 0, ...text("WAVE")]))).toBeNull();
        expect(sniffImageType(bytes(0x89, 0x50))).toBeNull();
        expect(sniffImageType(bytes())).toBeNull();
    });
});

describe("Base64", () => {
    it("round-trips any bytes, also more than one chunk", () => {
        const data = new Uint8Array(100_000).map((_, i) => (i * 31) % 256);
        expect(base64ToBytes(bytesToBase64(data))).toEqual(data);
        expect(base64ToBytes(bytesToBase64(bytes()))).toEqual(bytes());
    });

    it("writes standard Base64", () => {
        expect(bytesToBase64(text("abc"))).toBe("YWJj");
        expect(bytesToBase64(text("ab"))).toBe("YWI=");
    });

    it("rejects broken Base64", () => {
        expect(base64ToBytes("YWJ")).toBeNull();
        expect(base64ToBytes("YW*j")).toBeNull();
        expect(base64ToBytes("YWJj\\n")).toBeNull();
    });
});

describe("data URLs", () => {
    it("round-trip type and bytes", () => {
        const url = toDataUrl("image/png", PNG_HEAD);
        expect(url.startsWith("data:image/png;base64,")).toBe(true);
        expect(parseDataUrl(url)).toEqual({ type: "image/png", bytes: PNG_HEAD });
        expect(parseDataUrl(toDataUrl("image/webp", WEBP_HEAD))?.type).toBe("image/webp");
    });

    it.each([
        ["a text data URL", "data:text/plain;base64,YWJj"],
        ["a missing ;base64", "data:image/png,YWJj"],
        ["broken Base64", "data:image/png;base64,YW*j"],
        ["an empty image", "data:image/png;base64,"],
        ["an SVG", "data:image/svg+xml;base64,YWJj"],
        ["no string", 42],
    ])("returns null for %s", (_, value) => {
        expect(parseDataUrl(value)).toBeNull();
    });
});

describe("imageIdFor", () => {
    it("is the SHA-256 of the bytes in lower-case hex", async () => {
        const id = await imageIdFor(text("abc"));
        expect(id).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
        expect(id).toHaveLength(64);
    });

    it("gives the same image the same id", async () => {
        expect(await imageIdFor(PNG_HEAD)).toBe(await imageIdFor(PNG_HEAD.slice()));
    });
});

describe("MAX_IMAGE_BYTES", () => {
    it("is 20 MB", () => {
        expect(MAX_IMAGE_BYTES).toBe(20 * 1024 * 1024);
    });
});
