/**
 * Builds the PDF printout: one DIN-A4 page per selected floor, in the order
 * of the plan's floors. Header and footer are vector text and lines from
 * `jspdf`, the floor itself an image of the drawing area (`renderFloor`) at
 * its exact size in mm, so the scale on paper is exact. `jspdf` is loaded
 * only here, on demand, and does no network requests.
 */

import { floorDrawing, renderFloor } from "@/components/plan-pdf/render-floor";
import {
    drawingAreaMm,
    drawingTransform,
    floorPrintContent,
    formatPrintDate,
    MARGIN_MM,
    pageScale,
    pageSizeMm,
    paperMm,
    printContentBounds,
    printedUnderlayRect,
    scaleBarMeters,
    type PdfOptions,
    type RectMm,
} from "@/lib/pdf-layout";
import type { ImageId, Plan } from "@/lib/plan-schema";
import { loadImage } from "@/storage/image-cache";

type JsPdf = import("jspdf").jsPDF;

const TEXT_COLOR = "#18181B";
const MUTED_COLOR = "#71717A";
const HEADER_PT = 11;
const FOOTER_PT = 9;
const EMPTY_PT = 12;
/** Height of the scale bar, in mm. */
const BAR_HEIGHT_MM = 2;
/** Where the scale bar starts, in mm right of the left margin (after „Maßstab 1:N“). */
const BAR_OFFSET_MM = 35;
const BAR_LINE_MM = 0.2;
const EMPTY_FLOOR_TEXT = "Keine Räume auf dieser Etage";

/**
 * The PDF of `plan` with `options` as Blob. `availableImages` = underlay
 * images found in the browser when the dialog opened; `now` = print date.
 */
export async function createPdf(
    plan: Plan,
    options: PdfOptions,
    availableImages: ReadonlySet<ImageId>,
    now: Date,
): Promise<Blob> {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: options.orientation, unit: "mm", format: "a4", compress: true });
    const floors = plan.floors.filter((f) => options.floorIds.includes(f.id));
    const area = drawingAreaMm(options.orientation);
    const date = formatPrintDate(now);

    for (const [index, floor] of floors.entries()) {
        if (index > 0) doc.addPage("a4", options.orientation);
        const content = floorPrintContent(plan, floor.id, availableImages);
        const bounds = printContentBounds(content, options);
        const denominator = pageScale(bounds, area, options.scale);

        drawHeader(doc, `${plan.name} – ${floor.name}`, date, options);
        if (bounds) {
            const image = printedUnderlayRect(content, options) ? await loadUnderlayImage(content.underlay?.imageId) : null;
            try {
                const drawing = floorDrawing(content, image, options, plan.settings);
                const png = await renderFloor(drawing, area, drawingTransform(bounds, area, denominator));
                doc.addImage(png, "PNG", area.x, area.y, area.width, area.height, undefined, "FAST");
            } finally {
                image?.close();
            }
        } else {
            drawEmptyFloor(doc, area);
        }
        drawFooter(doc, denominator, area);
    }
    return doc.output("blob");
}

/** The underlay image decoded for drawing, `null` if it is gone or cannot be decoded (page without underlay). */
async function loadUnderlayImage(imageId: ImageId | null | undefined): Promise<ImageBitmap | null> {
    if (!imageId) return null;
    try {
        const blob = await loadImage(imageId);
        return blob ? await createImageBitmap(blob) : null;
    } catch {
        return null;
    }
}

/** „Plan – Etage“ at the top left, the print date at the top right, 1 cm below the page's edge. */
function drawHeader(doc: JsPdf, title: string, date: string, options: Pick<PdfOptions, "orientation">) {
    const page = pageSizeMm(options.orientation);
    doc.setFontSize(HEADER_PT);
    doc.setTextColor(TEXT_COLOR);
    const right = page.width - MARGIN_MM;
    doc.setFont("helvetica", "normal");
    const dateWidth = doc.getTextWidth(date);
    doc.text(date, right, MARGIN_MM, { align: "right", baseline: "top" });
    doc.setFont("helvetica", "bold");
    // Keep the title clear of the date.
    const maxTitle = right - MARGIN_MM - dateWidth - 5;
    doc.text(fitText(doc, title, maxTitle), MARGIN_MM, MARGIN_MM, { baseline: "top" });
}

/** „Keine Räume auf dieser Etage“ in the middle of the drawing area. */
function drawEmptyFloor(doc: JsPdf, area: RectMm) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(EMPTY_PT);
    doc.setTextColor(MUTED_COLOR);
    doc.text(EMPTY_FLOOR_TEXT, area.x + area.width / 2, area.y + area.height / 2, {
        align: "center",
        baseline: "middle",
    });
}

/**
 * „Maßstab 1:N“ and right of it the scale bar (`scaleBarMeters`), exactly its
 * length at 1:N on paper, in alternating black and white segments, labeled
 * „0“ and „<n> m“ above its ends.
 */
function drawFooter(doc: JsPdf, denominator: number, area: RectMm) {
    const footerTop = area.y + area.height;
    const barY = footerTop + 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FOOTER_PT);
    doc.setTextColor(TEXT_COLOR);
    doc.text(`Maßstab 1:${denominator}`, MARGIN_MM, barY + BAR_HEIGHT_MM, { baseline: "bottom" });

    const meters = scaleBarMeters(denominator);
    const length = paperMm(meters * 100, denominator);
    const x = MARGIN_MM + BAR_OFFSET_MM;
    const segments = meters <= 2 ? meters * 2 : 5;
    const segment = length / segments;
    doc.setDrawColor(TEXT_COLOR);
    doc.setFillColor(TEXT_COLOR);
    doc.setLineWidth(BAR_LINE_MM);
    for (let i = 0; i < segments; i += 2) doc.rect(x + i * segment, barY, segment, BAR_HEIGHT_MM, "F");
    doc.rect(x, barY, length, BAR_HEIGHT_MM, "S");

    const labelY = barY - 1;
    doc.text("0", x, labelY, { align: "center", baseline: "bottom" });
    doc.text(`${meters} m`, x + length, labelY, { align: "center", baseline: "bottom" });
}

/** `text`, shortened with „…“ until it is at most `maxMm` wide in the current font. */
function fitText(doc: JsPdf, text: string, maxMm: number): string {
    if (doc.getTextWidth(text) <= maxMm) return text;
    let end = text.length;
    while (end > 0 && doc.getTextWidth(`${text.slice(0, end)}…`) > maxMm) end--;
    return `${text.slice(0, end).trimEnd()}…`;
}
