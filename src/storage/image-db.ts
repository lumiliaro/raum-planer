/**
 * Underlay images in the browser's IndexedDB: database `raumplaner`
 * (version 1), object store `images`, key = image id (SHA-256), value = Blob.
 * Kept apart from the plan in `localStorage`, which is too small for scans.
 * If the database cannot be opened (private mode, blocked), every call rejects.
 */

import type { ImageId } from "@/lib/plan-schema";

const DB_NAME = "raumplaner";
const DB_VERSION = 1;
const STORE = "images";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
    dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
            reject(new Error("IndexedDB is not available"));
            return;
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("Cannot open IndexedDB"));
        request.onblocked = () => reject(new Error("IndexedDB is blocked"));
    });
    return dbPromise;
}

/** Runs `fn` in one transaction and resolves with its request's result once the transaction is complete. */
async function inTransaction<T>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
    const db = await openDb();
    return new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request ? request.result : undefined);
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
        tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
    });
}

export async function putImage(id: ImageId, blob: Blob): Promise<void> {
    await inTransaction("readwrite", (store) => store.put(blob, id));
}

/** The stored image, or `null` if there is none under this id. */
export async function getImage(id: ImageId): Promise<Blob | null> {
    const value = await inTransaction<unknown>("readonly", (store) => store.get(id));
    return value instanceof Blob ? value : null;
}

export async function listImageIds(): Promise<ImageId[]> {
    const keys = await inTransaction("readonly", (store) => store.getAllKeys());
    return (keys ?? []).filter((key): key is string => typeof key === "string");
}

export async function deleteImages(ids: readonly ImageId[]): Promise<void> {
    if (ids.length === 0) return;
    await inTransaction("readwrite", (store) => {
        for (const id of ids) store.delete(id);
    });
}
