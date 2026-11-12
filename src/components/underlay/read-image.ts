/**
 * Checks an image file chosen by the user and reads what the underlay needs.
 * Browser only (`createImageBitmap`).
 */

import { imageIdFor, MAX_IMAGE_BYTES, sniffImageType, SNIFF_BYTES } from "@/lib/image-data";
import type { UnderlayImage } from "@/lib/underlay";

export type ReadImageError = "type" | "too-large" | "unreadable";

export type ReadImageResult = ({ ok: true; blob: Blob } & UnderlayImage) | { ok: false; error: ReadImageError };

/** German hint for a rejected file (spec `floor-underlay`, „Bild hochladen“). */
export const READ_IMAGE_MESSAGES: Record<ReadImageError, string> = {
    type: "Bitte ein Bild im Format PNG, JPEG oder WebP wählen.",
    "too-large": "Das Bild ist größer als 20 MB. Bitte verkleinere es vorher, z. B. mit einem Bildprogramm.",
    unreadable: "Das Bild konnte nicht gelesen werden.",
};

/** Pixel size of a decodable image, else `null`. */
export async function decodeImageSize(blob: Blob): Promise<{ widthPx: number; heightPx: number } | null> {
    try {
        const bitmap = await createImageBitmap(blob);
        const size = { widthPx: bitmap.width, heightPx: bitmap.height };
        bitmap.close();
        return size.widthPx > 0 && size.heightPx > 0 ? size : null;
    } catch {
        return null;
    }
}

/**
 * Type by its first bytes (not the name), then size (at most 20 MB), then
 * decoding for width and height, then the id (SHA-256 of the file).
 */
export async function readImageFile(file: Blob): Promise<ReadImageResult> {
    try {
        const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
        const type = sniffImageType(head);
        if (!type) return { ok: false, error: "type" };
        if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too-large" };
        const bytes = new Uint8Array(await file.arrayBuffer());
        const blob = new Blob([bytes], { type });
        const size = await decodeImageSize(blob);
        if (!size) return { ok: false, error: "unreadable" };
        return { ok: true, blob, id: await imageIdFor(bytes), ...size };
    } catch {
        return { ok: false, error: "unreadable" };
    }
}
