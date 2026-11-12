import { useEffect, useState } from "react";

/** `none`: no image to load (`src` is `null`). */
export type ImageStatus = "none" | "loading" | "loaded" | "error";

interface LoadResult {
    src: string;
    image: HTMLImageElement | null;
    status: "loaded" | "error";
}

/** Loads an image for use as a Konva image; `null` loads nothing. */
export function useHtmlImage(src: string | null): { image: HTMLImageElement | null; status: ImageStatus } {
    const [result, setResult] = useState<LoadResult | null>(null);

    useEffect(() => {
        if (src === null) return;
        let cancelled = false;
        const img = new window.Image();
        img.onload = () => {
            if (!cancelled) setResult({ src, image: img, status: "loaded" });
        };
        img.onerror = () => {
            if (!cancelled) setResult({ src, image: null, status: "error" });
        };
        img.src = src;
        return () => {
            cancelled = true;
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    if (src === null) return { image: null, status: "none" };
    // A result for a previous src means the current one is still loading.
    if (!result || result.src !== src) return { image: null, status: "loading" };
    return { image: result.image, status: result.status };
}
