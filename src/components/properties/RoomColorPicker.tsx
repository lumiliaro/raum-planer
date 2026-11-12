import { ColorField } from "@/components/properties/StyleSection";
import { findRoomColorPreset, ROOM_COLOR_PRESETS } from "@/lib/room-colors";
import { cn } from "@/lib/utils";

/** Shown in the color picker while there is no color („Standard“). */
const STANDARD_PICKER_COLOR = "#FFFFFF";

interface RoomColorPickerProps {
    /** `null` = „Standard“. */
    value: string | null;
    /** Receives a preset's color (`null` for „Standard“) or a picked color in upper case. */
    onChoose: (color: string | null) => void;
    /** Screen reader name of the color picker. */
    pickerLabel: string;
}

/**
 * The room color presets (the current one marked, none for a free color) and
 * a color picker for any other color. Used by the room panel and the dialog
 * „Einstellungen“ („Farbe neuer Räume“).
 */
export function RoomColorPicker({ value, onChoose, pickerLabel }: RoomColorPickerProps) {
    const active = findRoomColorPreset(value);

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            <div role="group" aria-label="Raumfarben" className="flex flex-wrap gap-1.5">
                {ROOM_COLOR_PRESETS.map((preset) => {
                    const pressed = preset === active;
                    return (
                        <button
                            key={preset.id}
                            type="button"
                            title={preset.name}
                            aria-label={preset.name}
                            aria-pressed={pressed}
                            onClick={() => onChoose(preset.color)}
                            className={cn(
                                "size-6 rounded-[5px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                preset.color === null && "border border-input",
                                pressed && "ring-2 ring-selection ring-offset-1",
                            )}
                            style={{ backgroundColor: preset.color ?? STANDARD_PICKER_COLOR }}
                        />
                    );
                })}
            </div>
            <ColorField
                ariaLabel={pickerLabel}
                value={value ?? STANDARD_PICKER_COLOR}
                onCommit={(hex) => onChoose(hex.toUpperCase())}
            />
        </div>
    );
}
