/**
 * Underlay images of this session, in front of IndexedDB. An image is put
 * here first, so it stays visible for the session even if the browser cannot
 * store it. Nothing is removed during a session: undo may bring back a
 * replaced or removed image. Old images are cleaned up at the next start.
 */

import type { ImageId } from "@/lib/plan-schema";
import { deleteImages, getImage, listImageIds, putImage } from "@/storage/image-db";
import { useAppStore } from "@/store/app-store";

const cache = new Map<ImageId, Blob>();

/**
 * Keeps the image for the session and writes it to IndexedDB. A failed write
 * sets `imageStoreStatus` to „failed“ (status bar „Nicht gespeichert“) and
 * resolves with `false`; the image stays usable in this session.
 */
export async function storeImage(id: ImageId, blob: Blob): Promise<boolean> {
    cache.set(id, blob);
    try {
        await putImage(id, blob);
        return true;
    } catch {
        useAppStore.getState().setImageStoreStatus("failed");
        return false;
    }
}

/** The image from this session, else from IndexedDB, else `null`. */
export async function loadImage(id: ImageId): Promise<Blob | null> {
    const cached = cache.get(id);
    if (cached) return cached;
    try {
        const blob = await getImage(id);
        if (blob) cache.set(id, blob);
        return blob;
    } catch {
        return null;
    }
}


/**
 * Deletes stored images the plan no longer refers to. Only called once at
 * the start (see `mayCleanUpImages`); images of this session are kept.
 * Failures are ignored: a leftover image does no harm.
 */
export async function removeUnusedImages(referenced: readonly ImageId[]): Promise<void> {
    try {
        const keep = new Set(referenced);
        const unused = (await listImageIds()).filter((id) => !keep.has(id) && !cache.has(id));
        await deleteImages(unused);
    } catch {
        // IndexedDB not available: nothing to clean up.
    }
}
