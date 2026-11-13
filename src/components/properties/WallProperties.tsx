import { Trash2 } from "lucide-react";
import { WallIcon } from "@/components/icons/shape-icons";
import { NumberField } from "@/components/properties/NumberField";
import { FieldGrid, PropertySection } from "@/components/properties/PropertySection";
import type { Wall } from "@/lib/plan-schema";
import { roundCm } from "@/lib/room-geometry";
import { applyWallLengthField, applyWallThicknessOfWallField } from "@/lib/wall-fields";
import { wallLengthCm } from "@/lib/wall-geometry";
import { useAppStore } from "@/store/app-store";

/** Fallback hint when the plan rejects a value the field checks let through. */
const REJECTED = "Wert nicht möglich";

/**
 * Properties of the selected free wall: head with „Wand“ and „Löschen“ and
 * the fields „Länge“ (the start stays, the end moves along the wall) and
 * „Dicke“. Every commit is one undo step.
 * Mount with `key={wall.id}` so open input and hints belong to one wall.
 */
export function WallProperties({ wall }: { wall: Wall }) {
    const floorId = useAppStore((s) => s.plan.activeFloorId);
    const updateWall = useAppStore((s) => s.updateWall);
    const deleteSelectedWall = useAppStore((s) => s.deleteSelectedWall);

    const commitLength = (text: string): string | null => {
        const result = applyWallLengthField(wall, text);
        if (!result.ok) return result.error;
        if (result.value === null) return null;
        return updateWall(floorId, wall.id, { endCm: result.value }) ? null : REJECTED;
    };

    const commitThickness = (text: string): string | null => {
        const result = applyWallThicknessOfWallField(wall, text);
        if (!result.ok) return result.error;
        if (result.value === null) return null;
        return updateWall(floorId, wall.id, { thicknessCm: result.value }) ? null : REJECTED;
    };

    return (
        <div className="flex flex-col">
            <section className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <WallIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    <span className="text-xs font-medium">Wand</span>
                </div>
                <button
                    type="button"
                    aria-label="Löschen"
                    title="Löschen (Entf)"
                    onClick={deleteSelectedWall}
                    className="-my-1 inline-flex size-[30px] items-center justify-center rounded-md text-destructive outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </button>
            </section>
            <PropertySection title="Maße">
                <FieldGrid>
                    <NumberField label="Länge" unit="cm" value={roundCm(wallLengthCm(wall))} onCommit={commitLength} />
                    <NumberField label="Dicke" unit="cm" value={wall.thicknessCm} onCommit={commitThickness} />
                </FieldGrid>
            </PropertySection>
        </div>
    );
}
