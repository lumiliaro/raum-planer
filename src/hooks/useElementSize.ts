import { useCallback, useEffect, useState } from "react";
import type { Size } from "@/lib/viewport";

/** Tracks an element's content size via ResizeObserver. Use the returned callback as `ref`. */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, Size, T | null] {
    const [element, setElement] = useState<T | null>(null);
    const [size, setSize] = useState<Size>({ width: 0, height: 0 });

    const ref = useCallback((el: T | null) => setElement(el), []);

    useEffect(() => {
        if (!element) return;
        const update = (width: number, height: number) =>
            setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
        const observer = new ResizeObserver((entries) => {
            const box = entries[0]?.contentRect;
            if (box) update(Math.floor(box.width), Math.floor(box.height));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [element]);

    return [ref, size, element];
}
