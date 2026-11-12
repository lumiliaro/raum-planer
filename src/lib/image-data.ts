/**
 * Underlay image files as bytes, Base64 and data URL, and their id. Pure
 * apart from `imageIdFor` (Web Crypto, also in Node). The type is read from
 * the file's first bytes, never from its name or the browser's `file.type`.
 */

import type { ImageId } from "@/lib/plan-schema";

/** Larger images are rejected on upload. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export type ImageType = "image/png" | "image/jpeg" | "image/webp";

const startsWith = (bytes: Uint8Array, prefix: readonly number[], offset = 0) =>
    bytes.length >= offset + prefix.length && prefix.every((b, i) => bytes[offset + i] === b);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

/** Bytes needed by `sniffImageType`. */
export const SNIFF_BYTES = 12;

/** PNG, JPEG or WebP by their magic bytes; `null` for anything else (PDF, text, …). */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
    if (startsWith(bytes, PNG)) return "image/png";
    if (startsWith(bytes, JPEG)) return "image/jpeg";
    if (startsWith(bytes, RIFF) && startsWith(bytes, WEBP, 8)) return "image/webp";
    return null;
}

/** Chunk size for `String.fromCharCode`; larger argument lists overflow the stack. */
const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** Inverse of `bytesToBase64`; `null` for text that is no valid Base64. */
export function base64ToBytes(base64: string): Uint8Array | null {
    if (!BASE64_PATTERN.test(base64)) return null;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export function toDataUrl(type: ImageType, bytes: Uint8Array): string {
    return `data:${type};base64,${bytesToBase64(bytes)}`;
}

const DATA_URL_PATTERN = /^data:(image\/(?:png|jpeg|webp));base64,(.*)$/s;

/** Type and bytes of a PNG, JPEG or WebP data URL in Base64; `null` for anything else. */
export function parseDataUrl(text: unknown): { type: ImageType; bytes: Uint8Array } | null {
    if (typeof text !== "string") return null;
    const match = DATA_URL_PATTERN.exec(text);
    if (!match) return null;
    const bytes = base64ToBytes(match[2]);
    return bytes && bytes.length > 0 ? { type: match[1] as ImageType, bytes } : null;
}

/** SHA-256 of the file as 64 lower-case hex digits: the same image always gets the same id. */
export async function imageIdFor(bytes: Uint8Array): Promise<ImageId> {
    const digest = await crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
