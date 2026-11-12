import { Group, Image as KonvaImage, Layer } from "react-konva";
import { CalibrationOverlay } from "@/components/calibration/CalibrationOverlay";
import { underlayGroupAttrs, underlayRotationDeg, type UnderlayGeometry } from "@/lib/underlay";
import { UNDERLAY_FRAME_COLOR } from "@/components/canvas/canvas-style";

interface UnderlayLayerProps {
    /** Geometry with a known image size. */
    geometry: UnderlayGeometry & { imageWidthPx: number; imageHeightPx: number };
    image: HTMLImageElement;
    opacity: number;
    /** Current stage scale (screen px per cm). */
    scale: number;
    /** Shows the calibration overlay on top of the image. */
    calibrating: boolean;
}

/**
 * The underlay image in a group placed by `underlayGroupAttrs`: its children
 * are in image pixels, scaled and turned into the cm world. The calibration
 * overlay shares the group, so points and image always match.
 */
export function UnderlayLayer({ geometry, image, opacity, scale, calibrating }: UnderlayLayerProps) {
    const attrs = underlayGroupAttrs(geometry);
    const k = geometry.calibration?.pxPerCm ?? 1;
    return (
        <Layer listening={calibrating}>
            <Group {...attrs}>
                <KonvaImage
                    image={image}
                    width={geometry.imageWidthPx}
                    height={geometry.imageHeightPx}
                    opacity={opacity}
                    stroke={UNDERLAY_FRAME_COLOR}
                    strokeWidth={1}
                    strokeScaleEnabled={false}
                    listening={false}
                />
                {calibrating && (
                    <CalibrationOverlay
                        // Screen size and upright: undo the group's scale (1 / k) and the stage's, and its rotation.
                        inverse={k / scale}
                        rotationDeg={-underlayRotationDeg(geometry.calibration)}
                        imageSize={{ width: geometry.imageWidthPx, height: geometry.imageHeightPx }}
                    />
                )}
            </Group>
        </Layer>
    );
}
