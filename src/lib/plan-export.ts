/**
 * Content and file name of the export file: the plan JSON (the format of the
 * browser storage) plus, as last key, `images` with every underlay image the
 * plan refers to as Base64 data URL, each once. Indented so it stays readable
 * in a text editor; data URLs stay on one line. View state lives outside
 * `plan` and can never end up in the file.
 */

import type { FloorId, ImageId, Plan, Underlay } from "@/lib/plan-schema";
import { referencedImageIds } from "@/lib/underlay";

/** Used when the plan name yields no letters or digits. */
export const FALLBACK_FILE_BASE = "raumplaner";

export type ExportFile = Plan & { images: Record<ImageId, string> };

/**
 * The export file of `plan`. `images` holds the data URLs of the images that
 * are there. An underlay whose image is not there is exported with
 * `imageId: null` (sizes and calibration stay), so a re-import shows
 * „Vorlage fehlt“ like the app itself instead of reporting a missing image.
 */
export function buildExportFile(plan: Plan, images: ReadonlyMap<ImageId, string>): ExportFile {
    const underlayByFloor: Partial<Record<FloorId, Underlay>> = {};
    for (const [floorId, underlay] of Object.entries(plan.underlayByFloor)) {
        if (!underlay) continue;
        underlayByFloor[floorId] = underlay.imageId && !images.has(underlay.imageId) ? { ...underlay, imageId: null } : underlay;
    }
    const exported = { ...plan, underlayByFloor };
    const files: Record<ImageId, string> = {};
    for (const id of referencedImageIds(exported)) files[id] = images.get(id)!;
    return { ...exported, images: files };
}

export function serializeExport(file: ExportFile): string {
    return `${JSON.stringify(file, null, 2)}\n`;
}

const GERMAN_LETTERS: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };

/**
 * Name part of the file name: lower case, umlauts and ß written out, other
 * characters than letters and digits as hyphens; „raumplaner“ if nothing is left.
 * `"Möbel Größe/Übersicht"` → `"moebel-groesse-uebersicht"`.
 */
export function exportFileBase(planName: string): string {
    return (
        planName
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => GERMAN_LETTERS[c])
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || FALLBACK_FILE_BASE
    );
}

/** `YYYY-MM-DD` in the local time zone. */
export function localDateKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `"Umzug"`, 11.11.2026, version 2 → `"2026-11-11-umzug_2.json"` (local date). */
export function exportFileName(planName: string, date: Date, version: number): string {
    return `${localDateKey(date)}-${exportFileBase(planName)}_${version}.json`;
}
