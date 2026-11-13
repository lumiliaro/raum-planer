# Proposal

## Why

Auf dem iPad mit Tastatur reagieren die Befehle mit ⌘ (Kopieren, Einfügen, Rückgängig …) nach dem Bearbeiten eines Felds nicht mehr. Auf dem Mac lässt sich das Einrasten beim Ziehen nicht abschalten: Dort öffnet Ctrl+Klick das Kontextmenü, und die App reagiert nicht auf ⌘. Außerdem nennt die App überall „Strg“, obwohl Mac- und iPad-Nutzer ⌘ drücken.

Ein Test in Safari auf dem iPad hat gezeigt:

- Safari gibt ⌘+Taste und ctrl+Taste ganz normal an die Seite weiter. Direkt nach dem Laden funktionieren alle Befehle, auch mit ⌘.
- Der Fehler tritt auf, nachdem der Nutzer „Breite“ oder „Tiefe“ geändert und Tab gedrückt hat. Der Fokus liegt dann im nächsten Feld. Tippen mit dem Finger auf die Zeichenfläche holt ihn auf dem iPad nicht heraus, anders als ein Mausklick am Desktop. Deshalb landen ⌘C, ⌘V und die Einzeltasten im Feld, und die App ignoriert sie, wie es die Spec für Textfelder vorsieht.

## What Changes

- **Zeichenfläche nimmt den Fokus:** Ein Druck auf die Zeichenfläche (Maus, Stift oder Finger) verlässt ein fokussiertes Eingabefeld. Ein getippter Wert wird dabei übernommen wie beim Verlassen des Felds. Danach wirken alle Tastenkürzel wieder auf den Plan. Am Desktop passierte das bisher schon durch den Browser. Jetzt gilt es auf allen Geräten.
- **⌘ beim Gedrückthalten auf Apple-Geräten:** Auf macOS und iPadOS schaltet gedrücktes ⌘ statt Strg das Einrasten ab. Das gilt beim Ziehen von Formen und Räumen, beim Ziehen von Wandenden und beim Zeichnen von Räumen und Wänden. Ctrl hat dort auf Apple-Geräten keine Wirkung mehr. Auf Windows und Linux bleibt es bei Strg.
- **Befehle unverändert:** Strg+Z/Y/C/X/V/D und ⌘+Z/Y/C/X/V/D wirken wie bisher auf allen Geräten. Das wird jetzt ausdrücklich festgehalten.
- **Tastennamen je Gerät:** Auf Apple-Geräten zeigen die Hilfe („Tastenkürzel“), die Tooltips von „Rückgängig“ und „Wiederholen“ und die Tooltips der Anordnung ⌘, ⇧ und ⌥ statt Strg, Umschalt und Alt, in Mac-Schreibweise (z. B. „⇧⌘Z“). Auf anderen Geräten bleibt alles wie bisher.

## Capabilities

### New Capabilities

- `keyboard-input`: Tastatur je Betriebssystem. Dazu gehören die Befehlstaste (Strg oder ⌘) für Befehle und zum Gedrückthalten, die Schreibweise der Tasten und der Fokus, damit Tastenkürzel nach dem Bearbeiten eines Felds wieder den Plan erreichen.

### Modified Capabilities

- `app-help`: Die Liste der Tastenkürzel zeigt auf Apple-Geräten ⌘, ⇧ und ⌥.

## Nicht im Umfang

- Neue Tastenkürzel oder andere Tastenbelegungen. Bild↑/Bild↓, Entf und Rücktaste behalten ihre Namen, auch auf Apple-Geräten.
- Fokus verlassen beim Tippen auf andere Flächen außerhalb der Zeichenfläche, z. B. die Werkzeugleiste, die Kopfleiste oder leere Bereiche des Panels.
- Touch-Gesten als Ersatz für Tastenkürzel (z. B. Zwei-Finger-Tippen für Rückgängig).
- Die Zwischenablage des Systems. Kopieren bleibt in der Zwischenablage der App.
- Eine Einstellung, mit der der Nutzer das Betriebssystem selbst wählt.

## Impact

- Code: `src/hooks/useModifierKeyRef.ts`, `src/components/canvas/FloorCanvas.tsx`, `RoomDraftLayer.tsx`, `ShapesLayer.tsx`/`ShapeNode.tsx`, `RoomsLayer.tsx`, `WallsLayer.tsx`, `src/components/help/HelpDialog.tsx`, `src/components/layout/HistoryButtons.tsx`, `src/components/properties/ArrangeSection.tsx`. Neue reine Logik in `src/lib/` (Erkennung Apple-Gerät, Befehlstaste, Tastennamen) mit Vitest-Tests.
- Datenmodell, `schemaVersion`, Import und Export: unverändert.
- Abhängigkeiten: keine neuen.
