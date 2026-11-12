# Proposal

## Why

Wer einen neuen Raum an einer bestimmten Stelle einer vorhandenen Wand beginnen will – etwa 260 cm vom Ende einer 500 cm langen Wand –, kann den Startpunkt heute nur schätzen: Der erste Klick liegt frei auf 0,1 cm, es gibt keine Anzeige, wo auf der Wand der Mauszeiger gerade steht, und eine Länge lässt sich erst ab dem zweiten Eckpunkt eintippen. Eine Positionsanzeige auf der Wand mit Einrasten und Eintippen des Abstands macht den Startpunkt zentimetergenau.

## What Changes

- Werkzeug „Raum“, solange noch kein Eckpunkt gesetzt ist: Liegt der Mauszeiger höchstens 8 Bildschirmpixel neben der Innenkante eines vorhandenen Raums oder neben der Außenseite seiner Wand, rastet der Startpunkt auf dieser Linie ein („Wandposition“).
- Auf der Wand rastet der Punkt in Schritten von 5 cm ein (mit Alt 1 cm), gezählt vom Wandende, das dem Mauszeiger näher liegt. Gemessen wird immer zwischen den Innenecken der Kante – also wie die Kantenlänge im Panel und in der Maßanzeige.
- Anzeige: Der Punkt wird mit einem Ring markiert, das Bezugsende mit einem Punkt; entlang der Wand stehen die beiden Abstände zu den Wandenden, z. B. „260 cm“ und „240 cm“, in der Auswahlfarbe.
- Eintippen: Steht der Mauszeiger an einer Wand und wird eine Ziffer getippt, öffnet sich ein Feld „Abstand“. Enter setzt den Startpunkt genau im eingegebenen Abstand vom Bezugsende auf dieser Wand. Tab wechselt das Bezugsende. Wand und Linie bleiben ab der ersten Ziffer fest, auch wenn sich die Maus bewegt.
- Werte über der Wandlänge werden mit „Darf höchstens 500 cm sein“ (jeweilige Wandlänge) abgelehnt; 0 cm setzt den Punkt auf die Ecke.
- Vorrang: Eckpunkt-Einrasten (Raumecke) vor Wandposition vor Hilfslinien. Strg gedrückt oder Schalter „Einrasten“ aus → keine Wandposition (wie heute).
- Hilfe „Tastenkürzel“, Gruppe „Raum zeichnen“: neue Einträge für Abstand eintippen, Tab und Alt; Strg-Eintrag ergänzt.
- Kein neues Datenformat: `schemaVersion` bleibt unverändert, Export und Import ändern sich nicht.

### Nicht im Umfang

- Wandposition für den zweiten und alle weiteren Eckpunkte (dort gibt es schon Längeneingabe und Hilfslinien).
- Ein eigenes Lineal- oder Messwerkzeug (zwei Punkte anklicken, Abstand messen).
- Anzeige der Mauskoordinaten oder Lineale am Rand der Zeichenfläche.
- Wandposition für Türen, Fenster, Durchgänge oder Möbel.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `floor-rooms`: neue Anforderungen „Startpunkt auf einer Wand“, „Lage auf der Wand im Raster“, „Wandposition anzeigen“, „Abstand auf der Wand eintippen“ und „Abstand auf der Wand prüfen und abbrechen“. Außerdem wird „Vorrang beim Einrasten während des Zeichnens“ um die Wandposition ergänzt und „Hilfslinien beim Zeichnen abschalten“ so geändert, dass Strg bzw. der Schalter auch die Wandposition abschaltet.
- `app-help`: In „Liste der Tastenkürzel“ bekommt die Gruppe „Raum zeichnen“ neue Einträge.

## Impact

- `src/lib/room-drawing.ts`: neue reine Funktionen für Wandlinien, das Einrasten auf der Wand und den Punkt im Abstand; `resolveDraftPointer` bekommt die Wandposition mit dem richtigen Vorrang.
- `src/store/app-store.ts`: Ein Entwurf darf vor dem ersten Eckpunkt mit Abstandsfeld und festgehaltener Wand existieren; neue Aktion zum Übernehmen des Abstands.
- `src/components/canvas/RoomDraftLayer.tsx`: Anzeige der Wandposition, Tasten (Ziffern ohne Eckpunkt, Tab), Alt im Zeigerzustand, Feld „Abstand“.
- `src/components/canvas/FloorCanvas.tsx`: Der Klick nutzt dieselbe Auflösung (mit Wandposition und Alt).
- `src/components/help/shortcuts.ts`: neue Einträge.
- Keine neuen Abhängigkeiten.
