import { useEffect, useState } from "react";
import { useHtmlImage } from "@/hooks/useHtmlImage";
import type { ImageId } from "@/lib/plan-schema";
import type { ImageAvailability } from "@/lib/underlay";
import { loadImage } from "@/storage/image-cache";
import { useAppStore } from "@/store/app-store";

interface ObjectUrl {
    id: ImageId;
    url: string;
}

/**
 * Loads an underlay image from the session cache or IndexedDB as an
 * `HTMLImageElement` for Konva and reports its state to the store
 * (`imageAvailability`), so tool bar, status bar and panel know it without
 * loading it themselves. `null` (no image) counts as missing.
 */
export function useUnderlayImage(imageId: ImageId | null): {
    image: HTMLImageElement | null;
    availability: ImageAvailability;
} {
    const stored = useAppStore((s) => (imageId ? s.imageAvailability[imageId] : undefined));
    const setAvailability = useAppStore((s) => s.setImageAvailability);
    const [objectUrl, setObjectUrl] = useState<ObjectUrl | null>(null);
    // Look again once a missing image was uploaded (the store then says „ready“).
    const knownMissing = stored === "missing";

    useEffect(() => {
        if (!imageId) return;
        let cancelled = false;
        let url: string | null = null;
        void loadImage(imageId).then((blob) => {
            if (cancelled) return;
            if (!blob) {
                setAvailability(imageId, "missing");
                return;
            }
            url = URL.createObjectURL(blob);
            setObjectUrl({ id: imageId, url });
        });
        return () => {
            cancelled = true;
            if (url) URL.revokeObjectURL(url);
        };
    }, [imageId, knownMissing, setAvailability]);

    const src = objectUrl && objectUrl.id === imageId ? objectUrl.url : null;
    const { image, status } = useHtmlImage(src);

    useEffect(() => {
        if (!imageId) return;
        if (status === "loaded") setAvailability(imageId, "ready");
        else if (status === "error") setAvailability(imageId, "missing");
    }, [imageId, status, setAvailability]);

    if (!imageId || stored === "missing") return { image: null, availability: "missing" };
    if (status === "loaded" && image) return { image, availability: "ready" };
    return { image: null, availability: "loading" };
}
