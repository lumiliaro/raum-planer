import { useState } from "react";

/**
 * The last non-null `value`. Lets a dialog keep showing its content while it
 * animates out after its source value was set to `null`.
 */
export function useLastValue<T>(value: T | null): T | null {
    const [last, setLast] = useState(value);
    if (value !== null && value !== last) {
        setLast(value);
        return value;
    }
    return last;
}
