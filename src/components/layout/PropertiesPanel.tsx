import { useShallow } from "zustand/react/shallow";
import { OpeningProperties } from "@/components/properties/OpeningProperties";
import { RoomProperties } from "@/components/properties/RoomProperties";
import { ShapeProperties } from "@/components/properties/ShapeProperties";
import { UnderlaySection } from "@/components/underlay/UnderlaySection";
import { selectSelectedOpening, selectSelectedRoom, selectSelectedShape, useAppStore } from "@/store/app-store";

/** The selected shape's, room's or opening's properties; without a selection a hint and the active floor's underlay. */
export function PropertiesPanel() {
    const shape = useAppStore(selectSelectedShape);
    const room = useAppStore(selectSelectedRoom);
    const selectedOpening = useAppStore(useShallow(selectSelectedOpening));

    return (
        <aside aria-label="Eigenschaften" data-tutorial="properties" className="flex w-[300px] shrink-0 flex-col border-l bg-background">
            <div className="flex h-10 items-center border-b px-4">
                <h2 className="text-sm font-semibold">Eigenschaften</h2>
            </div>
            {shape ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <ShapeProperties key={shape.id} shape={shape} />
                </div>
            ) : room ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <RoomProperties key={room.id} room={room} />
                </div>
            ) : selectedOpening ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <OpeningProperties
                        key={selectedOpening.opening.id}
                        room={selectedOpening.room}
                        opening={selectedOpening.opening}
                    />
                </div>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <p className="border-b px-4 py-6 text-center text-muted-foreground">Wähle eine Form oder einen Raum aus</p>
                    <UnderlaySection />
                </div>
            )}
        </aside>
    );
}
