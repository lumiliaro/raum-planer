# Proposal

## Why

Beim Zeichnen eines Raums rastet die Kante heute nur auf 0°/90°/180°/270° und an vorhandenen Ecken ein. Wer ohne eingetippte Maße zeichnet, trifft die Länge der Gegenkante nur ungefähr: Ein Rechteck wird leicht schief, und eine Wand endet ein paar Zentimeter neben der Flucht des Nachbarraums. Hilfslinien durch schon gesetzte Eckpunkte und durch die Ecken anderer Räume machen es leicht, parallele Kanten mit gleicher Länge zu zeichnen und Räume bündig an Nachbarräume anzusetzen.

## What Changes

- Beim Zeichnen mit „Raum“ gibt es Hilfslinien: waagerechte und senkrechte Linien durch die bereits gesetzten Eckpunkte des Umrisses und durch die Ecken der anderen Räume der Etage.
- Liegt der nächste Eckpunkt höchstens 8 Bildschirmpixel neben einer Hilfslinie, rastet er genau darauf ein. Beispiel: Nach (0 cm, 0 cm) → (300 cm, 0 cm) → (300 cm, 200 cm) rastet die Kante nach links bei (0 cm, 200 cm) ein; die untere Kante ist dann genau so lang wie die obere (300 cm).
- Bei gerader Kante (0°/90°/180°/270°) rastet nur die Achse quer zur Kante ein; die Kante bleibt gerade. Mit Umschalttaste (freier Winkel) und beim ersten Punkt rastet jede Achse für sich ein, auch an zwei Hilfslinien gleichzeitig.
- Die wirksame Hilfslinie wird gestrichelt in der Auswahlfarbe vom Eckpunkt, durch den sie läuft, bis zum neuen Eckpunkt gezeigt, höchstens eine je Achse.
- Vorrang: Eckpunkt-Einrasten (Startpunkt, Raumecke) vor Hilfslinie vor bloßer Richtung. Eine eingetippte Länge gilt unverändert, ohne Hilfslinie.
- Abschalten: Strg gedrückt halten oder Schalter „Einrasten“ aus → keine Hilfslinien beim Zeichnen; das Einrasten an Ecken und auf 0°/90°/180°/270° bleibt.
- Der Schalter „Einrasten“ wirkt damit auch auf das Zeichnen von Räumen; sein Tooltip wird entsprechend angepasst.
- Hilfe „Tastenkürzel“, Gruppe „Raum zeichnen“: neuer Eintrag „Strg – Ohne Hilfslinien“.
- Kein neues Datenformat: `schemaVersion` bleibt unverändert, Export und Import ändern sich nicht.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `floor-rooms`: neue Anforderungen „Hilfslinien beim Zeichnen“, „Vorrang beim Einrasten während des Zeichnens“, „Hilfslinie beim Zeichnen anzeigen“ und „Hilfslinien beim Zeichnen abschalten“.
- `shape-snapping`: „Schalter ‚Einrasten‘“ wirkt künftig auch auf die Hilfslinien beim Zeichnen von Räumen.
- `app-help`: „Liste der Tastenkürzel“ bekommt unter „Raum zeichnen“ den Eintrag Strg.

## Nicht im Umfang

- Keine Hilfslinien beim Verschieben von Räumen oder beim Ändern von Kantenlängen im Eigenschaften-Panel (dort gilt das Haften an Wänden).
- Keine Hilfslinien in schrägen Richtungen (nur waagerecht und senkrecht), kein Einrasten an Kantenmitten oder auf der Verlängerung schräger Kanten.
- Kein eigenes Einrasten auf „gleiche Länge wie Kante n“ ohne gemeinsame Flucht; gleiche Längen ergeben sich über die Hilfslinien.
- Keine Hilfslinien durch Möbel, Öffnungen oder die Vorlage.
- Kein eigener Schalter nur für Raum-Hilfslinien, keine einstellbare Toleranz.

## Impact

- `src/lib/room-drawing.ts`: Hilfslinien bestimmen und in `resolveDraftPointer` einrasten (reine Logik, Tests in `room-drawing.test.ts`).
- `src/components/canvas/RoomDraftLayer.tsx`: Strg im Zeiger-Zustand verfolgen, Hilfslinien zeichnen.
- `src/components/canvas/FloorCanvas.tsx`: Klick nutzt dieselbe Auflösung mit Hilfslinien, Schalter und Strg.
- `src/components/canvas/ZoomControls.tsx`: Tooltip des Schalters „Einrasten“.
- `src/components/help/shortcuts.ts` (+ Test): Eintrag Strg unter „Raum zeichnen“.
- Keine neuen Abhängigkeiten, kein Einfluss auf Plan, Speicherung, Export oder Undo.
