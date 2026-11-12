import { NumberField } from "@/components/properties/NumberField";
import { FieldGrid, PropertySection, type CommitText } from "@/components/properties/PropertySection";
import type { Shape } from "@/lib/plan-schema";
import type { NumberFieldKey } from "@/lib/shape-fields";

interface DimensionsSectionProps {
    shape: Shape;
    commit: (field: NumberFieldKey) => CommitText;
    readOnly?: boolean;
}

/** One dimension in cm: label, field key and current value. */
type Dimension = [label: string, field: NumberFieldKey, value: number];

/**
 * "Maße", built per shape kind. A new kind adds a `case` here; kinds without
 * fields yet show no section.
 */
export function DimensionsSection({ shape, commit, readOnly }: DimensionsSectionProps) {
    const dimensions = dimensionsOf(shape);
    if (!dimensions) return null;
    return (
        <PropertySection title="Maße">
            <FieldGrid>
                {dimensions.map(([label, field, value]) => (
                    <NumberField
                        key={field}
                        label={label}
                        unit="cm"
                        value={value}
                        onCommit={commit(field)}
                        readOnly={readOnly}
                    />
                ))}
            </FieldGrid>
        </PropertySection>
    );
}

function dimensionsOf(shape: Shape): Dimension[] | null {
    switch (shape.kind) {
        case "rect":
            return [
                ["Breite", "widthCm", shape.widthCm],
                ["Tiefe", "depthCm", shape.depthCm],
                ["Eckradius", "cornerRadiusCm", shape.cornerRadiusCm],
            ];
        case "ellipse":
        case "corner":
            return [
                ["Breite", "widthCm", shape.widthCm],
                ["Tiefe", "depthCm", shape.depthCm],
            ];
        case "l-shape":
            return [
                ["Breite", "widthCm", shape.widthCm],
                ["Tiefe", "depthCm", shape.depthCm],
                ["Schenkel A", "legAWidthCm", shape.legAWidthCm],
                ["Schenkel B", "legBWidthCm", shape.legBWidthCm],
            ];
        case "u-shape":
            return [
                ["Breite", "widthCm", shape.widthCm],
                ["Tiefe", "depthCm", shape.depthCm],
                ["Basis", "baseWidthCm", shape.baseWidthCm],
                ["Seiten", "sideWidthCm", shape.sideWidthCm],
            ];
        case "door-swing":
            return [["Breite", "widthCm", shape.widthCm]];
        case "polygon":
            return null;
        default: {
            const unhandled: never = shape;
            throw new Error(`Unknown shape kind: ${(unhandled as Shape).kind}`);
        }
    }
}
