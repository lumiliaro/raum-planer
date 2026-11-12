# Tasks

## 1. Logik der Maße

- [ ] 1.1 `src/lib/dimensions.ts` mit `DimensionLabel`, `roomDimensions(pointsCm)` und `shapeDimensions(shape)` anlegen (design.md Entscheidung 2; `edgeFrame` und `formatCm` wiederverwenden). Tests in `src/lib/dimensions.test.ts`:
  - Raum 400 cm × 312,5 cm: 4 Einträge mit „400 cm“, „312,5 cm“, „400 cm“, „312,5 cm“, Mitte jeder Kante, `inward` zeigt ins Innere – für Eckpunkte im und gegen den Uhrzeigersinn
  - Schräge Kante (0 cm, 0 cm) → (300 cm, 400 cm): Länge 500 cm, Text „500 cm“, Winkel ≈ 53,13°
  - Rechteck 180 cm × 200 cm: Breite an y = 100 cm mit `inward (0, −1)`, Tiefe an x = −90 cm mit `inward (1, 0)`
  - Gespiegelte L-Form 280 cm × 200 cm: Tiefe an x = +140 cm mit `inward (−1, 0)`
  - Ellipse, U-Form, Ecke: Breite und Tiefe aus den Formfeldern
  - Tür 80 cm: genau ein Eintrag „80 cm“ an der unteren Kante
  - Polygon: leere Liste

  Prüfen mit `npm test`.
- [ ] 1.3 `dimensionCenterCm` und `placeRoomDimensions` in `src/lib/dimensions.ts` (design.md Entscheidung 2). Tests:
  - Raum 400 cm × 312,5 cm mit 15 cm Wand ohne Nachbarn: alle vier Maße außen, Mitte z. B. oben bei y = −(15 cm + Abstand + Höhe/2)
  - „Küche“ und „Flur“ mit 15 cm gemeinsamer Wand: rechtes Küchenmaß und linkes Flurmaß innen, übrige außen
  - L-förmiger Raum: das Maß an der Innenecke, das außen auf der eigenen Wand läge, steht innen
  - Ein Raum, dessen Außenmaß einen Nachbarn nur mit einer Ecke des Texts berührt, steht innen
  - Ergebnis je Raum in der Reihenfolge von `rooms`, je Kante ein Eintrag

  Prüfen mit `npm test`.
- [ ] 1.2 `readableRotationDeg(edgeAngleDeg, groupRotationDeg)` und `dimensionFits(textLength, edgeLength)` in `src/lib/dimensions.ts`. Tests:
  - Summe 0° → 0°, 180° → 0°, 90° → −90°, −90° → −90°, 270° → −90°, 135° → −45°, 45° → 45° (Ergebnis + Gruppendrehung immer in [−90°, 90°))
  - Rechteck um 90° gedreht: Breite liest sich senkrecht von unten nach oben, Tiefe waagerecht
  - `dimensionFits`: passt bei Text deutlich kürzer als die Kante, nicht bei Text länger als die Kante, Grenzfall mit Rand

  Prüfen mit `npm test`.

## 2. Zustand und Bedienung

- [ ] 2.1 `SHOW_DIMENSIONS_KEY = "raumplaner.ui.showDimensions"` in `src/lib/ui-prefs.ts`; im Store `showDimensions` (Start aus `readBoolean(…, false)`) und `toggleDimensions()` mit `writeBoolean`, analog zu `togglePropertiesPanel` (design.md Entscheidung 4). Tests in `src/store/app-store.test.ts`:
  - Ohne gespeicherten Wert ist `showDimensions` false; mit `"true"` true; mit ungültigem Wert false
  - `toggleDimensions()` schaltet um und speichert; blockierter Speicher wirft nicht
  - Umschalten ändert weder `plan` noch `updatedAt` und legt keinen Verlaufs-Schritt an (Rückgängig macht die vorige Planänderung rückgängig)

  Prüfen mit `npm test`.
- [ ] 2.2 Schaltfläche „Maße“ in `src/components/canvas/ZoomControls.tsx` rechts von „Einpassen“ mit Trennstrich, lucide `Ruler`, `aria-pressed`, gedrückter Hintergrund, Beschriftung/Tooltip „Maße einblenden (M)“ / „Maße ausblenden (M)“; nicht von `scale === null` gesperrt. Props aus `FloorCanvas` (Store-Selektor). Prüfen mit `npx tsc -b` und im Browser: Klick schaltet den Zustand, Tooltip wechselt.
- [ ] 2.3 Taste `M` in `src/hooks/useShapeShortcuts.ts` im Zweig neben `B`; Doku-Kommentar der Funktion ergänzen. Prüfen mit `npx tsc -b` und im Browser: `M` schaltet um, im Feld „Name“ wird „m“ getippt statt umgeschaltet, in einem offenen Dialog wirkt `M` nicht.

## 3. Maße auf der Zeichenfläche

- [ ] 3.1 `src/components/canvas/DimensionText.tsx` anlegen (design.md Entscheidung 3): Inter 11 px, feste Bildschirmgröße über `1 / scale`, Abstand zur Kante über `inward`, `rotation` aus `readableRotationDeg`, `listening={false}`, `excludeFromBounds`, `perfectDrawEnabled={false}`; zeichnet nichts, wenn `dimensionFits(gemessene Textbreite, lengthCm × scale)` false ist. Prüfen mit `npx tsc -b`.
- [ ] 3.2 Raummaße in `RoomArea` (`src/components/canvas/RoomsLayer.tsx`) bei `showDimensions`, Farbe `ROOM_LABEL_COLOR`, Lage aus `placeRoomDimensions` (in `RoomsLayer` je Etage und Zoom memoisiert). Prüfen im Browser: Raum 400 cm × 312,5 cm ohne Nachbarn zeigt alle vier Maße außen vor der Wand, lesbar; an einer gemeinsamen Wand stehen beide Maße innen im jeweiligen Raum; an der Innenecke eines L-förmigen Raums steht das Maß innen; Maße wandern beim Ziehen des Raums mit; Klick auf ein Maß wählt den Raum; nach Ändern von „Kante 1“ und nach Strg+Z stimmen die Werte.
- [ ] 3.3 Möbelmaße in `ShapeNode` (Gruppe nach der Form, vor `ShapeLabel`) bei `showDimensions`, Farbe `style.stroke`, aus `shapeDimensions(shape)`; Maß-Gruppe in `onTransformStart` aus- und in `onTransformEnd` wieder einblenden. `showDimensions` in `ShapesLayer` lesen und weitergeben. Prüfen im Browser: Bett 180 cm × 200 cm (auch um 90° und 180° gedreht), gespiegelte L-Form, Tür (nur Breite), Polygon (keine Maße); Auswahlrahmen bleibt am Umriss; beim Ziehen an Griffen sind die Maße weg und danach neu; herausgezoomt verschwindet „40 cm“ an einem 40 cm breiten Regal; im Kalibrier-Modus keine Maße.

## 4. Maße im PDF

- [ ] 4.1 `PdfOptions.dimensions` in `src/lib/pdf-layout.ts`, `defaultPdfOptions` → `false`; `fitAreaMm(area, options)` verkleinert die Zeichenfläche mit „Maße“ an jeder Seite um 3,3 mm (design.md Entscheidung 5), genutzt von `pdfIssues` und in `create-pdf.ts` für `pageScale`. Tests in `src/lib/pdf-layout.test.ts`: Voreinstellung `dimensions: false`; `printContentBounds` gleich mit und ohne „Maße“; `fitAreaMm` ohne „Maße“ unverändert, mit „Maße“ 6,6 mm schmaler und niedriger; Inhalt, der bei 1:50 genau passt, bekommt mit „Maße“ beim Einpassen einen kleineren Maßstab und gilt bei festem 1:50 als zu groß. Prüfen mit `npm test`.
- [ ] 4.2 Häkchen „Maße“ in `src/components/plan-pdf/PdfDialog.tsx` (`CONTENT`, zwischen „Raumnamen und Fläche“ und „Vorlage“). Prüfen im Browser: Reihenfolge der Häkchen, nach „Abbrechen“ und erneutem Öffnen nicht angehakt, auch bei eingeschalteter Maßanzeige im Editor.
- [ ] 4.3 `FloorDrawing.dimensions` in `floorDrawing(...)`; in `renderFloor` (`src/components/plan-pdf/render-floor.ts`) Raummaße nach den Öffnungssymbolen (Lage aus `placeRoomDimensions`) und Möbelmaße in der Gruppe des Möbels zeichnen, Schrift 2 mm, Abstand 0,8 mm, `readableRotationDeg` und `dimensionFits` in mm (design.md Entscheidung 5). Prüfen im Browser: PDF 1:100 mit „Maße“ zeigt „400 cm“/„312,5 cm“ außen an der Küche, an gemeinsamen Wänden innen; mit „Maße“ ohne „Möbel“ keine Möbelmaße; ohne „Maße“ keine Maße trotz Maßanzeige im Editor; bei „Auf Seite einpassen“ liegen auch die Maße an den Außenwänden ganz auf der Seite.

## 5. Abschluss

- [ ] 5.1 `openspec validate show-dimensions --strict` läuft fehlerfrei.
- [ ] 5.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
