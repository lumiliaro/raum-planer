/**
 * Browser download of a file via a Blob URL – no network request – and
 * the export counter of this browser. Not pure (DOM, storage), so it lives
 * here and not in `src/lib/`.
 */

import { createExportCounter } from "@/lib/export-counter";
import { sniffImageType, toDataUrl } from "@/lib/image-data";
import { buildExportFile, exportFileName, serializeExport } from "@/lib/plan-export";
import type { ImageId, Plan } from "@/lib/plan-schema";
import { getBrowserStorage } from "@/lib/ui-prefs";
import { referencedImageIds } from "@/lib/underlay";
import { loadImage } from "@/storage/image-cache";

const exportCounter = createExportCounter(getBrowserStorage());

export function downloadTextFile(name: string, text: string, type = "application/json"): void {
    downloadBlob(name, new Blob([text], { type }));
}

/** Browser download of a Blob under `name` via a Blob URL, no network request. */
export function downloadBlob(name: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** File name the next export under `planName` would get, without counting it. */
export function previewExportFileName(planName: string, now = new Date()): string {
    return exportFileName(planName, now, exportCounter.peek(planName, now));
}

/** Data URLs of the plan's underlay images that are in this browser. */
async function loadImageDataUrls(plan: Plan): Promise<Map<ImageId, string>> {
    const images = new Map<ImageId, string>();
    for (const id of referencedImageIds(plan)) {
        const blob = await loadImage(id);
        if (!blob) continue;
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const type = sniffImageType(bytes);
        if (type) images.set(id, toDataUrl(type, bytes));
    }
    return images;
}

/**
 * Downloads the plan with its underlay images as `YYYY-MM-DD-<name>_<n>.json`
 * and counts the export. Images not in the browser are left out (`buildExportFile`).
 */
export async function exportPlan(plan: Plan, now = new Date()): Promise<void> {
    const fileName = exportFileName(plan.name, now, exportCounter.take(plan.name, now));
    const images = await loadImageDataUrls(plan);
    downloadTextFile(fileName, serializeExport(buildExportFile(plan, images)));
}
