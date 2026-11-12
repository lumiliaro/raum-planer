/** Size of the editor's dimension texts (`DimensionText`) in screen px. */

import Konva from "konva";

/** Fixed screen size of a dimension: Inter 11 px, line 14 px high, 4 px from the edge or wall. */
export const DIMENSION_FONT_SIZE_PX = 11;
export const DIMENSION_FONT_FAMILY = "Inter Variable, sans-serif";
export const DIMENSION_HEIGHT_PX = 14;
export const DIMENSION_GAP_PX = 4;

const widths = new Map<string, number>();
let measurer: Konva.Text | null = null;

/** Width of a dimension text in screen px, measured once per text. */
export function dimensionWidthPx(text: string): number {
    let width = widths.get(text);
    if (width === undefined) {
        measurer ??= new Konva.Text({ fontFamily: DIMENSION_FONT_FAMILY, fontSize: DIMENSION_FONT_SIZE_PX });
        width = measurer.measureSize(text).width;
        widths.set(text, width);
    }
    return width;
}
