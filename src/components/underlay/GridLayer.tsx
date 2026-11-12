import type Konva from "konva";
import { Layer, Shape } from "react-konva";
import { gridLines, visibleGridStepCm } from "@/lib/grid";
import { visibleRectCm } from "@/lib/viewport";
import { useAppStore } from "@/store/app-store";
import { GRID_AXIS_COLOR, GRID_COLOR } from "@/components/canvas/canvas-style";


/**
 * The part of the world the stage shows right now. Read at draw time, so the
 * grid also covers the view while the stage is dragged or zoomed.
 */
function visibleNow(shape: Konva.Shape) {
    const stage = shape.getStage();
    if (!stage) return null;
    return visibleRectCm(
        { scale: stage.scaleX(), x: stage.x(), y: stage.y() },
        { width: stage.width(), height: stage.height() },
    );
}

/**
 * Draws the grid lines every `stepCm` (thinned out at a small zoom, see
 * `visibleGridStepCm`) picked by `pick` across the visible area.
 */
function drawLines(
    context: Konva.Context,
    shape: Konva.Shape,
    stepCm: number,
    pick: (lines: { xs: number[]; ys: number[] }) => { xs: number[]; ys: number[] },
) {
    const visible = visibleNow(shape);
    const scale = shape.getStage()?.scaleX();
    if (!visible || !scale) return;
    const { xs, ys } = pick(gridLines(visible, visibleGridStepCm(stepCm, scale)));
    context.beginPath();
    for (const x of xs) {
        context.moveTo(x, visible.y);
        context.lineTo(x, visible.y + visible.height);
    }
    for (const y of ys) {
        context.moveTo(visible.x, y);
        context.lineTo(visible.x + visible.width, y);
    }
    context.strokeShape(shape);
}

const isAxis = (value: number) => value === 0;

/**
 * Grid of a floor without visible underlay: lines at the spacing of the
 * plan's settings (factory: 100 cm), x = 0 and y = 0 stronger. 1 screen pixel
 * at every zoom, at least 4 px apart; never catches clicks.
 */
export function GridLayer() {
    const stepCm = useAppStore((s) => s.plan.settings.gridStepCm);
    return (
        <Layer listening={false}>
            <Shape
                sceneFunc={(context, shape) =>
                    drawLines(context, shape, stepCm, ({ xs, ys }) => ({
                        xs: xs.filter((x) => !isAxis(x)),
                        ys: ys.filter((y) => !isAxis(y)),
                    }))
                }
                stroke={GRID_COLOR}
                strokeWidth={1}
                strokeScaleEnabled={false}
                perfectDrawEnabled={false}
            />
            <Shape
                sceneFunc={(context, shape) =>
                    drawLines(context, shape, stepCm, ({ xs, ys }) => ({ xs: xs.filter(isAxis), ys: ys.filter(isAxis) }))
                }
                stroke={GRID_AXIS_COLOR}
                strokeWidth={1}
                strokeScaleEnabled={false}
                perfectDrawEnabled={false}
            />
        </Layer>
    );
}
