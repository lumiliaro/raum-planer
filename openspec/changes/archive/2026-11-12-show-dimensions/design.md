# Design

## Context

Siehe proposal.md – Why. Anforderungen: `specs/dimension-display/spec.md` und `specs/plan-pdf/spec.md`.

Was es schon gibt und wiederverwendet wird:

- **Beschriftungen in fester Bildschirmgröße:** `ShapeLabel` sitzt in der Konva-Gruppe einer Form bzw. in `RoomArea` (`RoomsLayer.tsx`), wird mit `scaleX/scaleY = 1 / scale` auf Bildschirm-px gebracht (`labelAttrs` in `label-transform.ts`), fängt keine Klicks (`listening={false}`) und zählt nicht zum Auswahlrahmen (`excludeFromBounds`). Während der Transformer zieht, hält `counterGroupTransform` sie aufrecht.
- **Kanten-Geometrie:** `edgeFrame(points, index)` in `src/lib/opening-geometry.ts` liefert Start, Ende, Richtung, Länge und die nach außen zeigende Normale einer Raumkante. `getOutlineCm`/Formmaße liegen in `src/lib/outline.ts`; Mittelpunkt der Form = Mittelpunkt des umschließenden Rechtecks.
- **Ansichts-Vorlieben im Browser:** `src/lib/ui-prefs.ts` (`readBoolean`/`writeBoolean`), genutzt für `propertiesPanelOpen` im Store; nicht Teil des Plans, nicht im Verlauf (zundo verfolgt nur den Plan).
- **Tastenkürzel:** `useShapeShortcuts` behandelt Einzeltasten (Werkzeuge, `B` für die Vorlage) und ignoriert Dialoge, Textfelder und Strg/⌘/Alt. `M` ist frei.
- **PDF:** `PdfOptions` in `src/lib/pdf-layout.ts` mit `defaultPdfOptions`; `PdfDialog.tsx` baut die Häkchen aus der Liste `CONTENT`; `render-floor.ts` zeichnet mit Konva-Core in mm-Größen (`cm(mm)` rechnet Papier-mm in Plan-cm um) und baut die Zeichnung über `floorDrawing(...)`.
- Im Kalibrier-Modus sind Räume und Möbel ohnehin ausgeblendet; Maße, die an ihnen hängen, verschwinden damit von selbst.

## Goals / Non-Goals

**Goals:**
- Eine reine, getestete Geometrie-Funktion je Quelle (Raum, Form), die Editor und PDF gemeinsam nutzen – gleiche Maße, gleiche Lage, gleiche Lesrichtung.
- Maße hängen an denselben Konva-Knoten wie Raum bzw. Form, damit Verschieben, Zeichenreihenfolge und Ausblenden ohne Extra-Logik stimmen.

**Non-Goals:**
- Keine allgemeine Kollisionsvermeidung zwischen Maßen, Raumnamen, Möbeln und Möbel-Beschriftungen. Es gibt nur zwei Regeln: „passt nicht an die Kante → weglassen“ und „Raummaß außen auf einem Raum oder einer Wand → innen“.
- Kein Live-Mitführen der Werte während des Transformers (siehe Spec „Maße folgen Änderungen“).

## Decisions

### 1. Datenmodell: keine Änderung, schemaVersion bleibt 11

Die Maßanzeige ist eine Ansichts-Vorliebe wie das Eigenschaften-Panel und gehört nicht in den Plan oder die Exportdatei (Projektregel „Export ohne Ansichtseinstellungen“). „Maße“ im PDF-Dialog ist eine Option des einen Druckvorgangs. Weder `plan-schema.ts` noch Migration, Import oder Export ändern sich; `PLAN_SCHEMA_VERSION` bleibt 11.

### 2. Reine Logik in `src/lib/dimensions.ts`

```ts
export interface DimensionLabel {
    /** Text, z. B. "312,5 cm" (formatCm). */
    text: string;
    /** Mitte der Kante, in cm (Raum: absolut; Form: relativ zum Mittelpunkt, ungedreht). */
    midCm: PointCm;
    /** Richtung der Kante in Grad (0 = nach rechts, y nach unten). */
    edgeAngleDeg: number;
    /** Einheitsvektor von der Kante ins Innere. */
    inward: PointCm;
    /** Kantenlänge in cm (für die Prüfung „passt“). */
    lengthCm: number;
}

export interface PlacedDimension {
    label: DimensionLabel;
    /** Mittelpunkt des Texts in cm. */
    centerCm: PointCm;
    side: "inside" | "outside";
}

export function roomDimensions(pointsCm: readonly PointCm[]): DimensionLabel[];
export function shapeDimensions(shape: Shape): DimensionLabel[];
/** Mittelpunkt eines Maß-Texts der Höhe `heightCm`, `distanceCm` von der Kante entfernt, nach innen (`inward`) bzw. außen. */
export function dimensionCenterCm(label: DimensionLabel, side: "inside" | "outside", distanceCm: number, heightCm: number): PointCm;
/** Raummaße aller Räume einer Etage mit Lage: außen vor der Wand, innen bei belegter Außenseite. Ergebnis je Raum in Reihenfolge von `rooms`. */
export function placeRoomDimensions(rooms: readonly Room[], textSizeCm: (text: string) => { widthCm: number; heightCm: number }, gapCm: number): PlacedDimension[][];
/** Drehung des Texts relativ zur Gruppe, sodass er absolut in [-90°, 90°) liegt (nie kopfüber, senkrecht von unten nach oben). */
export function readableRotationDeg(edgeAngleDeg: number, groupRotationDeg: number): number;
/** true, wenn der Text (Breite in px bzw. mm) auf die Kante (Länge in px bzw. mm) passt. */
export function dimensionFits(textLength: number, edgeLength: number): boolean;
```

- `roomDimensions`: je Kante ein Eintrag über `edgeFrame`; `inward = −normal`, `text = formatCm(lengthCm)`.
- `shapeDimensions`: Breite an der unteren Kante (y = +Tiefe/2, `inward = (0, −1)`), Tiefe an der linken Kante (x = −Breite/2, `inward = (1, 0)`), bei `mirrored` an der rechten (x = +Breite/2, `inward = (−1, 0)`). Tür: nur Breite an der unteren Kante (Quadrat Breite × Breite). Polygon: leere Liste. Breite/Tiefe kommen aus den Formfeldern, nicht aus dem Umriss – bei L-, U-Form und Ecke sind untere und linke Kante laut Spec „Umriss …“ immer über die ganze Länge belegt, beim gespiegelten L-Schenkel die rechte.
- `dimensionFits`: `textLength + 2 × Rand ≤ edgeLength` (kleiner fester Rand, damit der Text nicht bis in die Ecken reicht). Der Rand ist ein optionaler dritter Parameter (Standard 4 für Bildschirm-px, das PDF übergibt 1 mm), weil Editor und PDF in verschiedenen Einheiten prüfen.
- `placeRoomDimensions`: je Raumkante zuerst außen, Mittelpunkt `mid + outward × (Wanddicke + Abstand + Höhe/2)`; das Text-Rechteck (Breite × Höhe, entlang der Kante gedreht) wird gegen den Umriss samt Wand (`wallBandOutline`) aller Räume der Etage geprüft, auch des eigenen (Innenecken). Überlappt es einen davon (Ecke im Polygon, Polygonecke im Rechteck oder sich schneidende Kanten), steht das Maß innen: `mid + inward × (Abstand + Höhe/2)`. Die Textgröße kommt als Funktion herein, weil Editor (px / Zoom) und PDF (mm / Maßstab) sie verschieden messen; die Prüfung selbst ist rein und getestet.

Alternative: Maße direkt in den Konva-Komponenten berechnen. Verworfen, weil Editor und PDF sonst zwei Rechenwege hätten und die Projektregel Geometrie in `src/lib/` mit Tests verlangt.

### 3. Darstellung im Editor: `DimensionText` als Kind von Raum- bzw. Formgruppe

Neue Komponente `src/components/canvas/DimensionText.tsx` (wie `ShapeLabel`: `listening={false}`, `excludeFromBounds`, Inter 11 px, Höhe 14 px). Platzierung: `x/y = midCm + inward × (Abstand + Höhe/2) / scale`, `scale = 1/scale`, `rotation = readableRotationDeg(edgeAngleDeg, groupRotation)`. Die Textbreite wird einmal je Text über `Konva.Text#getTextWidth()` eines Mess-Knotens bzw. eines gecachten 2D-Kontexts gemessen; `dimensionFits(textPx, lengthCm × scale)` entscheidet über das Zeichnen.

- **Räume:** `RoomsLayer` berechnet die Lage aller Raummaße einmal je Etage und Zoom (`placeRoomDimensions`, Textgröße in cm = px / Zoom) und gibt jedem `RoomArea` seine Liste; dort stehen sie neben dem Namen. `RoomArea` ist die beim Ziehen bewegte Gruppe, die Maße wandern also mit; ob außen oder innen, wird nach dem Loslassen neu bestimmt. Liegen damit in der Raum-Ebene unter allen Möbeln.
- **Möbel:** in der Gruppe von `ShapeNode` nach der Form, vor `ShapeLabel`. Drehung über die Gruppe; `readableRotationDeg` gleicht sie für die Lesrichtung aus.
- **Während des Transformers:** `ShapeNode` blendet seine Maß-Gruppe in `onTransformStart` per Ref aus (`visible(false)`) und in `onTransformEnd` wieder ein; danach rendert React die neuen Werte. Einfacher und robuster als `counterGroupTransform` für mehrere gedrehte Texte.
- Gerendert nur bei `showDimensions`; aus dem Store gelesen in `RoomsLayer` und `ShapesLayer` und als Prop weitergegeben (ein Selektor je Ebene, nicht je Knoten).

### 4. Zustand und Bedienung

- Store: `showDimensions: boolean` (Start: `readBoolean(storage, SHOW_DIMENSIONS_KEY, false)`) und `toggleDimensions()` (schreibt mit `writeBoolean`), analog zu `togglePropertiesPanel`. Schlüssel `raumplaner.ui.showDimensions` in `ui-prefs.ts`. Kein `applyPlan`, daher kein Verlaufs-Schritt und kein `updatedAt`.
- `ZoomControls`: zusätzliche Schaltfläche mit lucide-Icon `Ruler` nach „Einpassen“, Trennstrich davor, `aria-pressed`, gedrückt mit `bg-muted`-Hintergrund; Beschriftung/Tooltip „Maße einblenden (M)“ / „Maße ausblenden (M)“. Die Schaltfläche ist – anders als die Zoom-Knöpfe – nicht an `scale !== null` gebunden.
- `useShapeShortcuts`: `M` (case-insensitive) ruft `toggleDimensions()` auf, im selben Zweig wie `B`, nach den Prüfungen für Dialog, Textfeld und Modifier.

### 5. PDF

- `PdfOptions.dimensions: boolean`, `defaultPdfOptions` → `false`. `PdfDialog`: Eintrag `{ key: "dimensions", label: "Maße" }` in `CONTENT` zwischen „Raumnamen und Fläche“ und „Vorlage“.
- `FloorDrawing.dimensions: boolean` aus `floorDrawing(...)`. `renderFloor` zeichnet in der oberen Ebene erst Öffnungssymbole, dann Raummaße, dann Möbel (in der Möbelgruppe, `drawing.shapes` ist ohne „Möbel“ schon leer), dann Raumnamen – dieselbe Schichtung wie im Editor.
- Größen auf Papier: Schrift 2 mm, Abstand zur Kante 0,8 mm; Textbreite über einen Konva-Text ohne feste Breite gemessen, `dimensionFits(textMm, lengthCm × mmPerCm)`.
- Raummaße über `placeRoomDimensions` mit der Textgröße in cm (gemessene mm / mm je cm) – dieselbe Lage wie im Editor.
- Platz für Maße außen: Ein Maß außen reicht höchstens „Abstand + Texthöhe“ = 0,8 mm + 2,5 mm = 3,3 mm über die Wand hinaus, auf dem Papier unabhängig vom Maßstab. `fitAreaMm(area, options)` verkleinert die Zeichenfläche mit „Maße“ deshalb um diese 3,3 mm an jeder Seite; `pageScale` und `pdfIssues` rechnen mit dieser Fläche, `drawingTransform` zentriert weiter in der ganzen Fläche (gleiche Mitte, also bleiben ringsum mindestens 3,3 mm). `printContentBounds` bleibt unverändert und muss keine Texte messen. Der Platz wird auch dann gelassen, wenn an einer Seite alle Maße innen stehen – einfacher, und es geht nur um wenige mm.

## Risks / Trade-offs

- [Sehr viele Text-Knoten bei vielen Räumen/Möbeln] → Pro Raum ≈ 4–8, pro Möbel 2 Knoten; für ein Haus vertretbar. Knoten sind `listening={false}` und `perfectDrawEnabled={false}`.
- [Maße überdecken Raumnamen oder Möbel-Beschriftung in kleinen Räumen/Möbeln] → Akzeptiert (Non-Goal); Maße liegen am Rand, Namen in der Mitte, und die Anzeige ist abschaltbar.
- [Raummaß außen liegt auf einem Möbel oder einer Tür außerhalb der Räume] → Akzeptiert; geprüft werden nur Räume und Wände.
- [Ob ein Maß außen Platz hat, hängt vom Zoom ab (Textgröße in cm)] → Gewollt; beim Zoomen kann ein Maß zwischen außen und innen wechseln.
- [Möbelmaß auf dunkler Füllung schlecht lesbar] → Randfarbe wie bei der Beschriftung, die dasselbe Problem schon heute löst; keine eigene Farbe.
- [Ellipse: Kante des umschließenden Rechtecks berührt den Umriss nur in einem Punkt, der Text ragt leicht über den Rand] → Akzeptiert; Lage ist für alle Formen einheitlich am umschließenden Rechteck.
- [Konkaver Raum: Text auf der Innenseite einer Kante kann in einem schmalen Zipfel liegen] → Durch „passt nicht → weglassen“ nur bei der Länge abgefangen; selten, akzeptiert.

## Migration Plan

Keine Datenmigration. Nach dem Ausrollen ist die Maßanzeige aus (kein gespeicherter Wert) und das PDF-Häkchen nicht angehakt; bestehende Pläne und Dateien sind unverändert gültig. Rückbau: Schaltfläche, Taste und Häkchen entfernen; der gespeicherte Browser-Schlüssel wird dann einfach nicht mehr gelesen.
