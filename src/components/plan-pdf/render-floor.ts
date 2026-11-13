/**
 * Draws one floor for the PDF: offscreen with Konva core (no react-konva, no
 * visible DOM element) at 300 dpi into the drawing area, as a PNG data URL.
 * Same geometry and colors as the editor, without selection, snap marks or
 * hit areas; lines and text sized in mm on paper instead of screen px.
 */

import Konva from "konva";
import {
    GRID_AXIS_COLOR,
    GRID_COLOR,
    OPENING_SYMBOL_COLOR,
    ROOM_LABEL_COLOR,
    SWING_DASH,
} from "@/components/canvas/canvas-style";
import {
    dimensionCenterCm,
    dimensionFits,
    placeRoomDimensions,
    readableRotationDeg,
    shapeDimensions,
    type DimensionLabel,
} from "@/lib/dimensions";
import { formatAreaM2 } from "@/lib/format";
import { gridLines } from "@/lib/grid";
import { doorLeaf, edgeFrame, openingGap, windowSymbol } from "@/lib/opening-geometry";
import { getLabelAnchorCm, getOutlineCm } from "@/lib/outline";
import {
    DIMENSION_FONT_MM,
    DIMENSION_GAP_MM,
    DIMENSION_HEIGHT_MM,
    type DrawingTransform,
    type PdfOptions,
    type SizeMm,
} from "@/lib/pdf-layout";
import type { PointCm, Room, Shape, Underlay, Wall } from "@/lib/plan-schema";
import { roomAreaFill } from "@/lib/room-colors";
import { labelPointCm, roomAreaM2, wallBandOutline } from "@/lib/room-geometry";
import { underlayGroupAttrs } from "@/lib/underlay";
import { joinedEnds, wallBandOutline as freeWallBandOutline } from "@/lib/wall-geometry";

/** Resolution of the drawing on paper. */
export const PRINT_DPI = 300;
export const PX_PER_MM = PRINT_DPI / 25.4;

/** One screen px of the editor's line widths (shape strokes, opening symbols) on paper, in mm. */
const MM_PER_SCREEN_PX = 0.25;
const GRID_LINE_MM = 0.15;
const ROOM_NAME_MM = 3;
const ROOM_AREA_MM = 2.5;
const SHAPE_LABEL_MM = 2.5;
const LINE_HEIGHT = 1.25;
/** Widest a label may get before it ends with „…“, in mm. */
const MAX_LABEL_WIDTH_MM = 60;
const FONT_FAMILY = "Inter Variable, sans-serif";
/** Width of an opening symbol's line in the editor (unselected), in screen px. */
const OPENING_STROKE_PX = 1.5;
/** Free space at both ends of a dimension on its edge, in mm. */
const DIMENSION_MARGIN_MM = 1;

export interface FloorDrawing {
    rooms: readonly Room[];
    /** Free walls; always drawn, like the rooms. */
    walls: readonly Wall[];
    /** Already filtered by „Möbel“ (empty without). */
    shapes: readonly Shape[];
    /** Underlay to draw, with its decoded image; `null` without „Vorlage“ or image. */
    underlay: { underlay: Underlay; image: CanvasImageSource } | null;
    /** Grid spacing in cm with „Raster“, `null` without. */
    gridStepCm: number | null;
    roomLabels: boolean;
    /** „Maße“: room dimensions, and those of `shapes` (already empty without „Möbel“). */
    dimensions: boolean;
    wallColor: string;
}

/** Builds the `FloorDrawing` of a floor from the dialog's options. */
export function floorDrawing(
    content: { rooms: readonly Room[]; walls: readonly Wall[]; shapes: readonly Shape[]; underlay: Underlay | undefined },
    image: CanvasImageSource | null,
    options: PdfOptions,
    settings: { gridStepCm: number; wallColor: string },
): FloorDrawing {
    return {
        rooms: content.rooms,
        walls: content.walls,
        shapes: options.furniture ? content.shapes : [],
        underlay: options.underlay && content.underlay && image ? { underlay: content.underlay, image } : null,
        gridStepCm: options.grid ? settings.gridStepCm : null,
        roomLabels: options.roomLabels,
        dimensions: options.dimensions,
        wallColor: settings.wallColor,
    };
}

const flat = (points: readonly PointCm[]) => points.flatMap((p) => [p.x, p.y]);

/** Waits for the editor's font (also weight 500), so the image does not fall back to another font. */
async function fontsReady(): Promise<void> {
    try {
        await document.fonts.load(`500 12px "Inter Variable"`);
        await document.fonts.ready;
    } catch {
        // Font API not available: draw with whatever font there is.
    }
}

/** A layer whose canvas is never drawn at the screen's pixel ratio (the export sets its own). */
function offscreenLayer(): Konva.Layer {
    const layer = new Konva.Layer({ listening: false });
    layer.getCanvas().setPixelRatio(1);
    return layer;
}

/**
 * The floor's drawing area as PNG data URL, `area` mm at `PRINT_DPI`, the
 * plan's cm placed by `transform`. Layers from bottom to top: white paper,
 * grid, underlay, room areas; the walls on their own layer (bands minus
 * insides and opening gaps via `destination-out`, so what lies below stays
 * visible), then the free walls on top of them (`WallsLayer`); opening symbols, room dimensions, furniture in drawing order
 * (each with its dimensions), room names with area.
 */
export async function renderFloor(drawing: FloorDrawing, area: SizeMm, transform: DrawingTransform): Promise<string> {
    await fontsReady();
    const width = Math.round(area.width * PX_PER_MM);
    const height = Math.round(area.height * PX_PER_MM);
    const pxPerCm = transform.mmPerCm * PX_PER_MM;
    /** Paper mm → plan cm (the stage scales cm to px). */
    const cm = (mm: number) => mm / transform.mmPerCm;

    // Nothing else may run between building and destroying the stage; without auto draw, Konva
    // does not schedule redraws of the layers' own canvases, only the export below draws.
    const autoDraw = Konva.autoDrawEnabled;
    Konva.autoDrawEnabled = false;
    const stage = new Konva.Stage({
        container: document.createElement("div"),
        width,
        height,
        x: transform.originMm.x * PX_PER_MM,
        y: transform.originMm.y * PX_PER_MM,
        scaleX: pxPerCm,
        scaleY: pxPerCm,
        listening: false,
    });
    try {
        const visible = { x: -transform.originMm.x / transform.mmPerCm, y: -transform.originMm.y / transform.mmPerCm };
        const visibleRect = { ...visible, width: cm(area.width), height: cm(area.height) };

        const below = offscreenLayer();
        below.add(new Konva.Rect({ ...visibleRect, fill: "#FFFFFF" }));
        if (drawing.gridStepCm) addGrid(below, visibleRect, drawing.gridStepCm, cm(GRID_LINE_MM));
        if (drawing.underlay) addUnderlay(below, drawing.underlay.underlay, drawing.underlay.image);
        for (const room of drawing.rooms) {
            below.add(new Konva.Line({ points: flat(room.pointsCm), closed: true, fill: roomAreaFill(room.color) }));
        }

        const walls = offscreenLayer();
        addWalls(walls, drawing.rooms, drawing.wallColor);
        addFreeWalls(walls, drawing.walls, drawing.wallColor);

        const above = offscreenLayer();
        addOpeningSymbols(above, drawing.rooms, cm);
        const dimensions = drawing.dimensions ? new DimensionPainter(transform.mmPerCm) : null;
        dimensions?.addRooms(above, drawing.rooms);
        for (const shape of drawing.shapes) addShape(above, shape, cm, dimensions);
        if (drawing.roomLabels) for (const room of drawing.rooms) addRoomLabel(above, room, cm);

        stage.add(below, walls, above);
        return stage.toDataURL({ pixelRatio: 1, mimeType: "image/png" });
    } finally {
        stage.destroy();
        Konva.autoDrawEnabled = autoDraw;
    }
}

/** Lines every `stepCm` across the whole drawing area, aligned to 0 cm; the axes x = 0 and y = 0 a bit stronger. */
function addGrid(layer: Konva.Layer, rect: { x: number; y: number; width: number; height: number }, stepCm: number, lineCm: number) {
    const { xs, ys } = gridLines(rect, stepCm);
    const lines = (pick: (v: number) => boolean) =>
        new Konva.Shape({
            stroke: pick(0) ? GRID_AXIS_COLOR : GRID_COLOR,
            strokeWidth: lineCm,
            perfectDrawEnabled: false,
            sceneFunc: (context, shape) => {
                context.beginPath();
                for (const x of xs.filter(pick)) {
                    context.moveTo(x, rect.y);
                    context.lineTo(x, rect.y + rect.height);
                }
                for (const y of ys.filter(pick)) {
                    context.moveTo(rect.x, y);
                    context.lineTo(rect.x + rect.width, y);
                }
                context.strokeShape(shape);
            },
        });
    layer.add(lines((v) => v !== 0), lines((v) => v === 0));
}

/** The image in a group placed like in the editor (calibration, alignment), with its opacity. */
function addUnderlay(layer: Konva.Layer, underlay: Underlay, image: CanvasImageSource) {
    if (underlay.imageWidthPx === null || underlay.imageHeightPx === null) return;
    const geometry = { ...underlay, imageWidthPx: underlay.imageWidthPx, imageHeightPx: underlay.imageHeightPx };
    const group = new Konva.Group(underlayGroupAttrs(geometry));
    group.add(
        new Konva.Image({
            image,
            width: geometry.imageWidthPx,
            height: geometry.imageHeightPx,
            opacity: underlay.opacity,
            perfectDrawEnabled: false,
        }),
    );
    layer.add(group);
}

/** Bands filled, then every room's inside and every opening's gap cut out, like `RoomsLayer`. */
function addWalls(layer: Konva.Layer, rooms: readonly Room[], wallColor: string) {
    for (const room of rooms) {
        layer.add(
            new Konva.Line({
                points: flat(wallBandOutline(room.pointsCm, room.wallThicknessCm)),
                closed: true,
                fill: wallColor,
                perfectDrawEnabled: false,
            }),
        );
    }
    const cut = (points: readonly PointCm[]) =>
        new Konva.Line({ points: flat(points), closed: true, fill: "#000", globalCompositeOperation: "destination-out" });
    for (const room of rooms) layer.add(cut(room.pointsCm));
    for (const room of rooms) {
        for (const opening of room.openings) {
            const frame = edgeFrame(room.pointsCm, opening.edgeIndex);
            layer.add(cut(openingGap(frame, opening, room.wallThicknessCm[opening.edgeIndex])));
        }
    }
}

/** Free walls as bands in the wall color, corners between two walls closed, like `WallsLayer`. */
function addFreeWalls(layer: Konva.Layer, walls: readonly Wall[], wallColor: string) {
    const joined = joinedEnds(walls);
    for (const wall of walls) {
        const caps = joined.get(wall.id);
        layer.add(
            new Konva.Line({
                points: flat(freeWallBandOutline(wall, caps?.start, caps?.end)),
                closed: true,
                fill: wallColor,
                perfectDrawEnabled: false,
            }),
        );
    }
}

/** Door leaf with dashed swing, window rectangle with center line; passages show nothing (`OpeningsLayer`). */
function addOpeningSymbols(layer: Konva.Layer, rooms: readonly Room[], cm: (mm: number) => number) {
    const stroke = {
        stroke: OPENING_SYMBOL_COLOR,
        strokeWidth: cm(OPENING_STROKE_PX * MM_PER_SCREEN_PX),
        lineJoin: "round" as const,
        lineCap: "round" as const,
        perfectDrawEnabled: false,
    };
    const dash = SWING_DASH.map((px) => cm(px * MM_PER_SCREEN_PX));
    for (const room of rooms) {
        for (const opening of room.openings) {
            if (opening.kind === "passage") continue;
            const frame = edgeFrame(room.pointsCm, opening.edgeIndex);
            if (opening.swing === null) {
                const symbol = windowSymbol(frame, opening, room.wallThicknessCm[opening.edgeIndex]);
                layer.add(new Konva.Line({ points: flat(symbol.outline), closed: true, ...stroke }));
                layer.add(new Konva.Line({ points: flat(symbol.centerLine), ...stroke }));
            } else {
                const leaf = doorLeaf(frame, { ...opening, swing: opening.swing });
                layer.add(new Konva.Line({ points: flat([leaf.hinge, leaf.leafEnd]), ...stroke }));
                layer.add(new Konva.Line({ points: flat(leaf.arcPoints), dash, ...stroke }));
            }
        }
    }
}

/** One piece of furniture like `ShapeNode`: outline, fill, stroke, opacity, upright label. */
function addShape(layer: Konva.Layer, shape: Shape, cm: (mm: number) => number, dimensions: DimensionPainter | null) {
    const outline = getOutlineCm(shape);
    if (!outline) return;
    const points = flat(outline);
    const { style } = shape;
    const group = new Konva.Group({ x: shape.x, y: shape.y, rotation: shape.rotationDeg });
    const stroke = {
        stroke: style.stroke,
        strokeWidth: cm(style.strokeWidth * MM_PER_SCREEN_PX),
        opacity: style.opacity,
        lineJoin: "round" as const,
    };
    if (shape.kind === "door-swing") {
        if (style.fill) group.add(new Konva.Line({ points, closed: true, fill: style.fill, opacity: style.opacity }));
        group.add(new Konva.Line({ points: points.slice(0, 4), ...stroke }));
        group.add(
            new Konva.Line({ points: points.slice(2), dash: SWING_DASH.map((px) => cm(px * MM_PER_SCREEN_PX)), ...stroke }),
        );
    } else {
        group.add(new Konva.Line({ points, closed: true, fill: style.fill ?? undefined, ...stroke }));
    }
    dimensions?.addShape(group, shape);
    if (shape.label) {
        const anchor = getLabelAnchorCm(shape);
        group.add(
            textNode(shape.label, cm(SHAPE_LABEL_MM), style.stroke, cm, { ...anchor, rotation: -shape.rotationDeg }, "500"),
        );
    }
    layer.add(group);
}

/**
 * Dimensions on paper like the editor's (`DimensionText`): 2 mm text,
 * 0,8 mm from the wall or edge, never upside down, left out when longer than
 * its edge. Room dimensions are placed with `placeRoomDimensions`.
 */
class DimensionPainter {
    private readonly widthsMm = new Map<string, number>();
    private readonly measurer = new Konva.Text({ fontFamily: FONT_FAMILY, fontSize: 100 });

    private readonly mmPerCm: number;

    constructor(mmPerCm: number) {
        this.mmPerCm = mmPerCm;
    }

    private cm(mm: number): number {
        return mm / this.mmPerCm;
    }

    /** Width of the text in mm, measured at 100 px and scaled (tiny font sizes measure badly). */
    private widthMm(text: string): number {
        let width = this.widthsMm.get(text);
        if (width === undefined) {
            width = (this.measurer.measureSize(text).width / 100) * DIMENSION_FONT_MM;
            this.widthsMm.set(text, width);
        }
        return width;
    }

    addRooms(layer: Konva.Layer, rooms: readonly Room[]) {
        const placed = placeRoomDimensions(
            rooms,
            (text) => ({ widthCm: this.cm(this.widthMm(text)), heightCm: this.cm(DIMENSION_HEIGHT_MM) }),
            this.cm(DIMENSION_GAP_MM),
        );
        for (const { label, centerCm } of placed.flat()) {
            const node = this.node(label, centerCm, readableRotationDeg(label.edgeAngleDeg, 0), ROOM_LABEL_COLOR);
            if (node) layer.add(node);
        }
    }

    addShape(group: Konva.Group, shape: Shape) {
        for (const label of shapeDimensions(shape)) {
            const center = dimensionCenterCm(label, "inside", this.cm(DIMENSION_GAP_MM), this.cm(DIMENSION_HEIGHT_MM));
            const node = this.node(label, center, readableRotationDeg(label.edgeAngleDeg, shape.rotationDeg), shape.style.stroke);
            if (node) group.add(node);
        }
    }

    private node(label: DimensionLabel, center: PointCm, rotation: number, color: string): Konva.Text | null {
        const widthMm = this.widthMm(label.text);
        if (!dimensionFits(widthMm, label.lengthCm * this.mmPerCm, DIMENSION_MARGIN_MM)) return null;
        const width = this.cm(widthMm);
        const height = this.cm(DIMENSION_HEIGHT_MM);
        return new Konva.Text({
            ...center,
            rotation,
            text: label.text,
            width,
            height,
            offsetX: width / 2,
            offsetY: height / 2,
            align: "center",
            verticalAlign: "middle",
            wrap: "none",
            fontFamily: FONT_FAMILY,
            fontSize: this.cm(DIMENSION_FONT_MM),
            fill: color,
            perfectDrawEnabled: false,
        });
    }
}

/** Room name and below it the inner area („12,50 m²“), centered on the name's place in the editor. */
function addRoomLabel(layer: Konva.Layer, room: Room, cm: (mm: number) => number) {
    const at = labelPointCm(room.pointsCm);
    const name = room.name.trim();
    const areaText = formatAreaM2(roomAreaM2(room.pointsCm));
    const nameHeight = name ? cm(ROOM_NAME_MM) * LINE_HEIGHT : 0;
    const areaHeight = cm(ROOM_AREA_MM) * LINE_HEIGHT;
    const top = at.y - (nameHeight + areaHeight) / 2;
    if (name) layer.add(textNode(name, cm(ROOM_NAME_MM), ROOM_LABEL_COLOR, cm, { x: at.x, y: top + nameHeight / 2 }, "500"));
    layer.add(textNode(areaText, cm(ROOM_AREA_MM), ROOM_LABEL_COLOR, cm, { x: at.x, y: top + nameHeight + areaHeight / 2 }));
}

/** One line of text centered on `(x, y)`, ending with „…“ beyond `MAX_LABEL_WIDTH_MM`. */
function textNode(
    text: string,
    fontSize: number,
    color: string,
    cm: (mm: number) => number,
    place: { x: number; y: number; rotation?: number },
    fontStyle = "normal",
): Konva.Text {
    const width = cm(MAX_LABEL_WIDTH_MM);
    const height = fontSize * LINE_HEIGHT;
    return new Konva.Text({
        ...place,
        text,
        width,
        height,
        offsetX: width / 2,
        offsetY: height / 2,
        align: "center",
        verticalAlign: "middle",
        wrap: "none",
        ellipsis: true,
        fontFamily: FONT_FAMILY,
        fontSize,
        fontStyle,
        fill: color,
        perfectDrawEnabled: false,
    });
}
