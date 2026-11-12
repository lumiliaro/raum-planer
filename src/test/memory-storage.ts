/** In-memory `Storage` for tests. */
export function memoryStorage(initial: Record<string, string> = {}): Storage {
    const data = new Map(Object.entries(initial));
    return {
        get length() {
            return data.size;
        },
        clear: () => data.clear(),
        getItem: (key) => data.get(key) ?? null,
        key: (index) => [...data.keys()][index] ?? null,
        removeItem: (key) => void data.delete(key),
        setItem: (key, value) => void data.set(key, String(value)),
    };
}

/**
 * Wraps `storage`: reads work, `setItem` throws (quota exceeded) for every key
 * matching `fails` – by default for all keys.
 */
export function failingWrites(storage: Storage, fails: (key: string) => boolean = () => true): Storage {
    return {
        get length() {
            return storage.length;
        },
        clear: () => storage.clear(),
        getItem: (key) => storage.getItem(key),
        key: (index) => storage.key(index),
        removeItem: (key) => storage.removeItem(key),
        setItem: (key, value) => {
            if (fails(key)) throw new Error("QuotaExceededError");
            storage.setItem(key, value);
        },
    };
}

/** `Storage` whose every access throws, like a blocked `localStorage`. */
export function throwingStorage(): Storage {
    const fail = () => {
        throw new Error("SecurityError");
    };
    return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}
