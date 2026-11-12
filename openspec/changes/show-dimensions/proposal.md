# Proposal

## Why

Die Maße eines Raums oder Möbels sieht man heute nur im Eigenschaften-Panel, und nur für das, was gerade ausgewählt ist. Beim Planen („passt das Sofa an diese Wand?“) und auf dem ausgedruckten Grundriss fehlen sie: Man muss jedes Teil einzeln anklicken oder mit dem Lineal auf dem Papier nachmessen. Eine zuschaltbare Maßanzeige zeigt alle Längen auf einen Blick, im Editor und im PDF.

## What Changes

- Neue Maßanzeige auf der Zeichenfläche, für alle Räume und Möbel der aktiven Etage gleichzeitig:
  - **Räume:** an jeder Raumkante ihre Innenlänge (z. B. „400 cm“), außen vor der Wand entlang der Kante geschrieben; liegt dort ein Raum oder eine Wand (z. B. bei einer gemeinsamen Wand mit dem Nachbarraum), steht das Maß innen im Raum.
  - **Möbel:** Breite entlang der unteren Kante und Tiefe entlang der linken Kante des Möbels (bei gespiegelten Formen der rechten), innen am Umriss, mit der Form gedreht; die Tür (Möbel) zeigt nur ihre Breite. Freie Formen (Polygon) zeigen keine Maße.
  - Text in fester Bildschirmgröße, nie auf dem Kopf; ein Maß, das nicht neben seine Kante passt, wird weggelassen.
- Ein- und Ausschalten über eine neue Schaltfläche „Maße“ (Lineal-Symbol) in der Zoom-Leiste und über die Taste `M`. Der Zustand wird im Browser gemerkt (wie das Eigenschaften-Panel), nicht im Plan; beim ersten Start ist die Anzeige aus. Ein Schalter gilt für Raum- und Möbelmaße zusammen.
- PDF-Dialog: neues Häkchen „Maße“ in „Inhalt“, standardmäßig nicht angehakt. Angehakt zeigt jede Seite die Raummaße und – wenn auch „Möbel“ angehakt ist – die Möbelmaße, auf Papier in fester Schriftgröße. Damit die Maße außen vor den Außenwänden auf die Seite passen, lässt die Seite um den Inhalt etwas mehr Platz; „Auf Seite einpassen“ kann dadurch einen etwas kleineren Maßstab wählen.
- Kein neues Datenformat: `schemaVersion` bleibt 11, Export und Import ändern sich nicht.

## Capabilities

### New Capabilities

- `dimension-display`: Maßanzeige für Räume und Möbel auf der Zeichenfläche – was angezeigt wird, wo und wie, sowie Ein-/Ausschalten per Schaltfläche und Taste und das Merken des Zustands im Browser.

### Modified Capabilities

- `plan-pdf`: Der PDF-Dialog bekommt das Häkchen „Maße“ (Voreinstellung: nicht angehakt); neue Anforderung „Maße im PDF“.

## Nicht im Umfang

- Keine Wanddicken, keine Außenmaße der Wände und keine Gesamtmaße eines Geschosses (Kettenmaße).
- Keine Maße für Türen, Fenster und Durchgänge in der Wand (Öffnungsbreite, Abstand zur Ecke).
- Keine Abstände zwischen Möbeln und Wänden, kein Messwerkzeug.
- Keine Maßlinien mit Pfeilen oder Hilfslinien außerhalb der Form; nur Text an der Kante.
- Keine Maße bei freien Formen (Polygon) und keine einzelnen Schenkelmaße von L- und U-Form oder Eckradius.
- Keine getrennten Schalter für Raum- und Möbelmaße, keine Einstellung für Schriftgröße oder Einheit.
- Während des Ziehens an den Griffen (Größe ändern, Drehen) wird das Maß der betroffenen Form nicht live mitgeführt.

## Impact

- Neue reine Logik `src/lib/dimensions.ts` (Lage, Richtung und Text der Maße für Räume und Formen) mit Tests.
- `src/lib/ui-prefs.ts`: neuer Schlüssel für die Maßanzeige; `src/store/app-store.ts`: Ansichtszustand `showDimensions` und Aktion zum Umschalten (kein Rückgängig-Schritt).
- Zeichenfläche: neue Ebene bzw. Komponente für Maße in `src/components/canvas/` (Räume in `RoomsLayer`, Möbel in `ShapeNode`), Schaltfläche in `ZoomControls.tsx`, Taste `M` in `src/hooks/useShapeShortcuts.ts`.
- PDF: `src/lib/pdf-layout.ts` (`PdfOptions.dimensions`, Voreinstellung), `src/components/plan-pdf/PdfDialog.tsx` (Häkchen), `src/components/plan-pdf/render-floor.ts` (Maße zeichnen).
- Keine neuen Abhängigkeiten, keine Änderung an `plan-schema.ts`.
