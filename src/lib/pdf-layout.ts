/**
 * Page layout of the PDF printout: options of the dialog, the A4 page with
 * header, drawing area and footer, the scale of each floor and where its
 * content lies on the paper. Pure; paper sizes in mm, plan sizes in cm.
 */

import { getOutlineCm } from "@/lib/outline";
import { floorContentBounds } from "@/lib/content-bounds";
import { exportFileBase, localDateKey } from "@/lib/plan-export";
import type { FloorId, ImageId, Plan, Room, Shape, Underlay } from "@/lib/plan-schema";
import { underlayBoundsCm } from "@/lib/underlay";
import type { RectCm } from "@/lib/viewport";

export type PdfOrientation = "portrait" | "landscape";
/** 1:50, 1:100 or „Auf Seite einpassen“ (each floor its own scale). */
export type PdfScaleChoice = 50 | 100 | "fit";

export interface PdfOptions {
    /** Selected floors; pages follow the order of `plan.floors`, not of this list. */
    floorIds: FloorId[];
    orientation: PdfOrientation;
    scale: PdfScaleChoice;
    furniture: boolean;
    roomLabels: boolean;
    /** „Maße“: room dimensions, with „Möbel“ also those of the shapes. */
    dimensions: boolean;
    underlay: boolean;
    grid: boolean;
}

/** What the dialog starts with on every opening. */
export function defaultPdfOptions(plan: Pick<Plan, "floors">): PdfOptions {
    return {
        floorIds: plan.floors.map((f) => f.id),
        orientation: "portrait",
        scale: 100,
        furniture: true,
        roomLabels: true,
        dimensions: false,
        underlay: false,
        grid: false,
    };
}

/** DIN A4 in portrait, in mm. */
export const PAGE_MM = { width: 210, height: 297 } as const;
/** Margin on every side, in mm. */
export const MARGIN_MM = 10;
/** Header band below the top margin (title line and gap), in mm. */
export const HEADER_MM = 10;
/** Footer band above the bottom margin (scale text and bar), in mm. */
export const FOOTER_MM = 17;

export interface SizeMm {
    width: number;
    height: number;
}

/** A rectangle on the page, in mm from its top left corner. */
export interface RectMm extends SizeMm {
    x: number;
    y: number;
}

/** Page size in the orientation. */
export function pageSizeMm(orientation: PdfOrientation): SizeMm {
    return orientation === "portrait" ? { ...PAGE_MM } : { width: PAGE_MM.height, height: PAGE_MM.width };
}

/** Drawing area between header and footer: 190 × 250 mm (portrait) or 277 × 163 mm (landscape). */
export function drawingAreaMm(orientation: PdfOrientation): RectMm {
    const page = pageSizeMm(orientation);
    return {
        x: MARGIN_MM,
        y: MARGIN_MM + HEADER_MM,
        width: page.width - 2 * MARGIN_MM,
        height: page.height - 2 * MARGIN_MM - HEADER_MM - FOOTER_MM,
    };
}

/** Dimensions on paper: font size, line height (text height) and distance from the wall or edge, in mm. */
export const DIMENSION_FONT_MM = 2;
export const DIMENSION_HEIGHT_MM = 2.5;
export const DIMENSION_GAP_MM = 0.8;
/** How far a dimension outside a wall reaches beyond it on paper, at any scale. */
export const DIMENSION_MARGIN_MM = DIMENSION_GAP_MM + DIMENSION_HEIGHT_MM;

/**
 * The size the content has to fit: the drawing area, with „Maße“ less
 * `DIMENSION_MARGIN_MM` on every side so the dimensions outside the outer
 * walls stay on the page. The content is still centered in the whole area.
 */
export function fitAreaMm(area: SizeMm, options: Pick<PdfOptions, "dimensions">): SizeMm {
    const margin = options.dimensions ? DIMENSION_MARGIN_MM : 0;
    return { width: area.width - 2 * margin, height: area.height - 2 * margin };
}

/** What of a floor may end up on its page. */
export interface PrintFloorContent {
    rooms: readonly Room[];
    shapes: readonly Shape[];
    underlay: Underlay | undefined;
    /** The underlay's image is in this browser. */
    imageAvailable: boolean;
}

/** The floor's content in the plan, with `imageAvailable` from the set of images found in the browser. */
export function floorPrintContent(plan: Plan, floorId: FloorId, availableImages: ReadonlySet<ImageId>): PrintFloorContent {
    const underlay = plan.underlayByFloor[floorId];
    return {
        rooms: plan.roomsByFloor[floorId] ?? [],
        shapes: plan.shapesByFloor[floorId] ?? [],
        underlay,
        imageAvailable: !!underlay?.imageId && availableImages.has(underlay.imageId),
    };
}

/** The underlay's rectangle if it is printed: „Vorlage“ checked, image there and its size known. */
export function printedUnderlayRect(
    content: Pick<PrintFloorContent, "underlay" | "imageAvailable">,
    options: Pick<PdfOptions, "underlay">,
): RectCm | null {
    if (!options.underlay || !content.underlay || !content.imageAvailable) return null;
    return underlayBoundsCm(content.underlay);
}

/**
 * What the page has to show: the rooms with their walls, with „Möbel“ the
 * shapes, with „Vorlage“ the underlay if its image is there. `null` if
 * nothing is left (the page then says „Keine Räume auf dieser Etage“).
 */
export function printContentBounds(content: PrintFloorContent, options: Pick<PdfOptions, "furniture" | "underlay">): RectCm | null {
    const shapes = options.furniture ? content.shapes.filter((s) => getOutlineCm(s) !== null) : [];
    const underlayRect = printedUnderlayRect(content, options);
    if (content.rooms.length === 0 && shapes.length === 0 && !underlayRect) return null;
    return floorContentBounds({ rooms: content.rooms, shapes, underlayRect });
}

/** Tolerance of the fit checks in mm, against rounding errors (13850 / 277 must give 50). */
const FIT_EPS = 1e-9;

/** Length on paper in mm of `cm` in the plan at 1:N. */
export const paperMm = (cm: number, denominator: number) => (cm * 10) / denominator;

/** `true` if the content at 1:N fits the drawing area. */
export function fitsAtScale(bounds: RectCm, area: SizeMm, denominator: number): boolean {
    return (
        paperMm(bounds.width, denominator) <= area.width + FIT_EPS &&
        paperMm(bounds.height, denominator) <= area.height + FIT_EPS
    );
}

/** Smallest whole N ≥ 1 at which the content fits the drawing area. */
export function fitScaleDenominator(bounds: RectCm, area: SizeMm): number {
    const needed = Math.max((bounds.width * 10) / area.width, (bounds.height * 10) / area.height);
    return Math.max(1, Math.ceil(needed - FIT_EPS));
}

/** Scale denominator of a page: the fixed one, the fitted one, or 100 for a floor without content. */
export function pageScale(bounds: RectCm | null, area: SizeMm, scale: PdfScaleChoice): number {
    if (!bounds) return 100;
    return scale === "fit" ? fitScaleDenominator(bounds, area) : scale;
}

/** Maps plan cm into the drawing area: `mm = origin + cm · mmPerCm`, relative to the area's top left corner. */
export interface DrawingTransform {
    /** Where the plan's (0 cm, 0 cm) lies, in mm from the drawing area's top left corner. */
    originMm: { x: number; y: number };
    mmPerCm: number;
}

/** Puts the content at 1:N in the middle of the drawing area. */
export function drawingTransform(bounds: RectCm, area: SizeMm, denominator: number): DrawingTransform {
    const mmPerCm = 10 / denominator;
    return {
        originMm: {
            x: (area.width - bounds.width * mmPerCm) / 2 - bounds.x * mmPerCm,
            y: (area.height - bounds.height * mmPerCm) / 2 - bounds.y * mmPerCm,
        },
        mmPerCm,
    };
}

const SCALE_BAR_LENGTHS_M = [1, 2, 5, 10, 20, 50] as const;
/** Longest the scale bar may be on paper, in mm. */
export const MAX_SCALE_BAR_MM = 100;

/**
 * Length of the scale bar in m: the largest of 1, 2, 5, 10, 20, 50 m that is
 * at most 10 cm on paper at 1:N; 1 m below 1:10, where even 1 m is longer.
 */
export function scaleBarMeters(denominator: number): number {
    let best: number = SCALE_BAR_LENGTHS_M[0];
    for (const meters of SCALE_BAR_LENGTHS_M) {
        if (paperMm(meters * 100, denominator) <= MAX_SCALE_BAR_MM + FIT_EPS) best = meters;
    }
    return best;
}

export interface PdfIssues {
    /** No floor checked. */
    noFloor: boolean;
    /** Names of checked floors that do not fit at the fixed scale, in floor order. */
    tooLarge: string[];
}

/** What blocks „PDF erstellen“; `availableImages` = underlay images found in the browser. */
export function pdfIssues(plan: Plan, options: PdfOptions, availableImages: ReadonlySet<ImageId>): PdfIssues {
    const selected = plan.floors.filter((f) => options.floorIds.includes(f.id));
    const tooLarge: string[] = [];
    if (options.scale !== "fit") {
        const area = fitAreaMm(drawingAreaMm(options.orientation), options);
        for (const floor of selected) {
            const bounds = printContentBounds(floorPrintContent(plan, floor.id, availableImages), options);
            if (bounds && !fitsAtScale(bounds, area, options.scale)) tooLarge.push(floor.name);
        }
    }
    return { noFloor: selected.length === 0, tooLarge };
}

/** `"Umzug"`, 12.11.2026 → `"2026-11-12-umzug-grundriss.pdf"` (local date, name as in the plan export). */
export function pdfFileName(planName: string, date: Date): string {
    return `${localDateKey(date)}-${exportFileBase(planName)}-grundriss.pdf`;
}

/** 12.11.2026 → `"12.11.2026"` (local date). */
export function formatPrintDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}
