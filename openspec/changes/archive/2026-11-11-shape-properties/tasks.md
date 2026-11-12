# Tasks

## 1. Reine Logik in `src/lib/`

- [x] 1.1 `parseDecimal` und `applyNumberField`/`applyLabelField` in `src/lib/shape-fields.ts` (design.md, Entscheidung 1), dazu `formatInputNumber` in `src/lib/format.ts`. Tests in `shape-fields.test.ts` und `format.test.ts`:
  - Einlesen: „238,5“, „412.44“ → 412,4, „−30“/„-30“, „breit“ → Hinweis „Bitte eine Zahl eingeben“
  - Breite 0 → „Muss größer als 0 cm sein“; Breite 140 bei Mittelpunkt 200/100 → nur `widthCm`
  - Tiefe 90 → 60 bei Eckradius 40 → Patch mit `depthCm: 60`, `cornerRadiusCm: 30`
  - Eckradius 31 bei 100 × 60 cm → „Darf höchstens 30 cm sein“; Eckradius −1 → „Darf nicht negativ sein“
  - Drehung 93 → 93, −30 → 330, 359,96 → 0, 450 → 90
  - Randstärke 25 → „Darf höchstens 20 px sein“, 0 → „Muss größer als 0 px sein“
  - gleicher Wert → leerer Patch
  - Beschriftung „ Sofa “ → „Sofa“, leer → `label: undefined`
  - Für jede Grenze: Wert an der Grenze und knapp daneben gegen `ShapeSchema` passend zum Hinweis
  - `formatInputNumber`: 1000 → „1000“, 424,5 → „424,5“, −0 → „0“

  Prüfen mit `npm test`.
- [x] 1.2 `SHAPE_KIND_LABELS` in `src/lib/shape-kinds.ts` für alle sieben Formtypen und `STYLE_PRESETS` mit `findActivePreset` in `src/lib/style-presets.ts` (Werte aus design.md, Entscheidung 5). Tests:
  - jeder Formtyp hat einen nicht leeren Namen, „Rechteck“ und „Ellipse“ stimmen
  - 8 Voreinstellungen in der Reihenfolge der Stilvorlage
  - der Standardstil aus `shape-factory.ts` ergibt „Grau“; `#fde68a`/`#92400e` ergibt „Gelb“
  - `fill: null` mit `#27272A` ergibt „Nur Rand“; eine freie Farbe ergibt keine Voreinstellung
  - jede Voreinstellung besteht `ShapeStyleSchema`

  Prüfen mit `npm test`.
- [x] 1.3 `getLabelAnchorCm` in `src/lib/outline.ts` (`switch` mit `never`-Prüfung, vorerst `(0, 0)` für alle Formtypen, gespiegelt wie der Umriss) mit Tests in `outline.test.ts`: Rechteck und Ellipse liefern `(0, 0)`, auch gespiegelt, und nie `-0`. Prüfen mit `npm test`.
- [x] 1.4 `applyTransform` in `src/lib/shape-transform.ts` rastet die Drehung nur ein, wenn sie sich um mehr als 0,01° geändert hat (design.md, Entscheidung 6). Neue Tests in `shape-transform.test.ts`: Drehung 93° bei reiner Größenänderung bleibt 93°; 93,0000001° bleibt 93°; 0° → 93° wird 90°; 47,6° nach Drehen wird 48°. Die bestehenden Tests laufen weiter. Prüfen mit `npm test`.

## 2. Store und Tastenkürzel

- [x] 2.1 Store-Aktion `updateSelectedShape(patch)` in `src/store/app-store.ts` (design.md, Entscheidung 3) mit Tests in `app-store.test.ts`: ändert die ausgewählte Form der aktiven Etage; ohne Auswahl `false` und Plan unverändert; leerer Patch → `true` und derselbe Plan (kein `updatedAt`); ungültiger Patch → `false`. Prüfen mit `npm test`.
- [x] 2.2 `isEditableTarget` sperrt nur Texteingaben (design.md, Entscheidung 7). Die Entscheidung steckt in einer reinen Funktion `isTextEntry({ tagName, type, isContentEditable })`, denn Vitest läuft ohne DOM. Test in `src/hooks/isEditableTarget.test.ts`:
  - gesperrt: Textfeld, Feld ohne Typ, Zahlenfeld, Textbereich, `contentEditable`
  - frei: Kontrollkästchen, Regler, Farbfeld, Schaltfläche

  Prüfen mit `npm test`.

## 3. Formular im Panel

- [x] 3.1 `NumberField` und `TextField` in `src/components/properties/` (design.md, Entscheidung 2): Übernahme bei Enter/`blur`, `Esc` setzt zurück und nimmt den Fokus, Hinweis mit `aria-invalid`/`aria-describedby`, Abgleich mit dem Store ohne Fokus, `readOnly`. Prüfen mit `npm run build`.
- [x] 3.2 `ShapeProperties` mit Kopf (Icon, Name aus `SHAPE_KIND_LABELS`, „Löschen“), Feld „Beschriftung“, `DimensionsSection` (`switch` mit `never`-Prüfung: Rechteck Breite/Tiefe/Eckradius, Ellipse Breite/Tiefe) und `PositionSection` (X, Y, Drehung, „Spiegeln – Horizontal“ mit `aria-pressed`) im `PropertiesPanel`; `ShapeSummary` entfernen; per `key={shape.id}` an die Auswahl gebunden. Prüfen mit `npm run build` und im Browser (manuell) gegen die Szenarien in `specs/shape-properties` zu Aufbau, Übernahme, ungültigen Eingaben, Maßen, Eckradius, Lage, Spiegeln, Beschriftung und Werten nach dem Ziehen sowie gegen `specs/workspace-layout`:
  - Breite 238,5 + Enter
  - Tiefe 96, dann Klick in „Breite“
  - `Esc` verwirft
  - „breit“ → Hinweis
  - Eckradius 31 → Hinweis, 12 → runde Ecken
  - Tiefe 60 bei Eckradius 40 → Eckradius 30
  - Drehung 93 → 93°
  - Spiegeln an/aus
  - X folgt dem Ziehen
  - Eingabe in Breite, dann direkt eine andere Form anklicken → die Änderung landet bei der ersten Form
- [x] 3.3 `StyleSection` (design.md, Entscheidung 5): Reihe der Voreinstellungen mit `aria-pressed`, Farbfelder „Füllung“/„Rand“ mit Übernahme beim nativen `change`, „Nur Rand“ mit Wiederherstellung der Füllfarbe, Randstärke als `NumberField` in px, Deckkraft-Regler 10–100 % mit Übernahme beim Loslassen. Prüfen im Browser (manuell) in Chrome und Firefox:
  - „Gelb“ setzt beide Farben und behält die Randstärke
  - neue Form → „Grau“ aktiv; „Nur Rand“ → keine Füllung, innen weiter anklickbar
  - eigene Füllfarbe wird erst nach dem Bestätigen übernommen
  - „Nur Rand“ an/aus stellt die Füllfarbe wieder her
  - Randstärke 25 → Hinweis
  - Deckkraft 70 % nach dem Loslassen, Anzeige „70 %“
  - nach dem Klick auf „Nur Rand“ löscht `Entf` die Form; im Feld „Beschriftung“ löscht `Entf` nichts

## 4. Beschriftung auf der Zeichenfläche

- [x] 4.1 `ShapeLabel` in `ShapeNode` (design.md, Entscheidung 4): Konva-`Text` in der `Group` an `getLabelAnchorCm`, `scale = 1/zoom`, `rotation = −rotationDeg`, Inter 12 px/500 in `style.stroke`, 240 px breit mit „…“, `listening={false}`, Ausgleich der Skalierung in `onTransform`. Prüfen im Browser (manuell):
  - „Bett“ steht mittig und waagerecht, auch bei 90° Drehung
  - gleiche Textgröße bei 25 % und 400 % Zoom
  - Text folgt beim Ziehen und wird beim Ziehen an den Anfassern nicht verzerrt
  - Klick auf den Text wählt die Form
  - leere Beschriftung → kein Text
  - im Kalibrier-Modus mit den Formen ausgeblendet

## 5. Dokumentation

- [x] 5.1 `docs/design/README.md`, Bedienentscheidungen: Zeilen „Eigenschaften-Formular“ (Übernahme mit Enter/Verlassen, `Esc` verwirft, Hinweise mit Grenze, Drehung ohne Einrasten), „Farben“ (8 Voreinstellungen plus freie Farbwahl, „Nur Rand“) und „Beschriftung“ (feste Bildschirmgröße, waagerecht, Randfarbe, 240 px mit „…“) ergänzen; Zeile „Formen ziehen“ um „getippte Drehung bleibt beim Ändern der Größe“ ergänzen. Prüfen, dass die Zeilen zu design.md passen.

## 6. Abschluss

- [x] 6.1 Gesamtprüfung im Browser (manuell): alle Szenarien aus `specs/shape-properties`, `specs/workspace-layout` und `specs/shape-editing` dieses Changes, einschließlich Neuladen (Beschriftung, Farben, Spiegelung, Eckradius, Deckkraft bleiben erhalten). `npm run lint` ohne neue Warnungen.
- [x] 6.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Change nach der Prüfung mit `/opsx:archive` archivieren.
- Danach `/opsx:apply more-shapes`: Aufgabe 1.1 dort gleicht die Annahmen ab (`getLabelAnchorCm` und `SHAPE_KIND_LABELS` existieren bereits, Abschnitt „Maße“ über `DimensionsSection`).
