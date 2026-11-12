# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `plan-model` umgesetzt ist (`plan-schema.ts`, `plan.ts`, Plan im Store mit `plan.activeFloorId` und `plan.calibrationByFloor`, Store-Aktionen `addShape`/`updateShape`/`removeShape`). Weichen Namen oder Signaturen von design.md (Entscheidung 8) ab, design.md und die folgenden Aufgaben angleichen. Prüfen: `npm test` läuft vor Beginn fehlerfrei.

## 2. Reine Logik in `src/lib/`

- [x] 2.1 `src/lib/units.ts` mit `cmToPx` und `pxToCm` plus `units.test.ts` (Hin- und Rückweg, Beispiel 0,5 px/cm: 200 cm → 100 px). Prüfen mit `npm test`.
- [x] 2.2 `src/lib/outline.ts` mit `getOutlineCm` (Rechteck mit/ohne Eckradius, Ellipse, `mirrored`, `null` für übrige Typen) plus `outline.test.ts` mit allen Szenarien aus `specs/shape-outline/spec.md`. Dazu Sehnenhöhe ≤ 0,5 cm für Ellipsen 10 × 10, 80 × 80, 400 × 60 und 1 000 × 1 000 cm und Rechteckbögen mit 2, 10 und 45 cm Radius sowie gespiegelt = an der y-Achse gespiegelt. Prüfen mit `npm test`.
- [x] 2.3 `src/lib/snap.ts` mit `SNAP_STEP_CM`, `FINE_SNAP_STEP_CM`, `snapStepCm`, `snapDelta`, `snapRotationDeg` plus Tests: 13 → 15, 2 → 0, −13 → −15, 13,4 bei 1 cm → 13, kein `-0`; Drehung 93 → 90, 47,6 → 48, −30 → 330, 359,6 → 0, 266 → 270, 264 → 264. Prüfen mit `npm test`.
- [x] 2.4 `snapResizeBox` in `src/lib/snap.ts` plus Tests: rechte Kante +22 bei Schritt 5 → Breite +20, linke Kante bleibt exakt; Eck-Anfasser rastet beide Achsen ein, die gegenüberliegende Ecke bleibt; dieselben Fälle bei 30° und 90° Drehung; Mindestbreite wird eingehalten, wenn über die gegenüberliegende Kante hinausgezogen wird. Prüfen mit `npm test`.
- [x] 2.5 `src/lib/shape-transform.ts` mit `moveBy` und `applyTransform` plus Tests: 37 cm + 15 cm = 52 cm exakt; Rundung auf 0,1 cm; Mindestgröße 1 cm; Eckradius 40 → 30 cm bei Tiefe 60 cm; Drehung eingerastet und normalisiert; Ergebnis besteht das Zod-Schema aus `plan-model`. Prüfen mit `npm test`.
- [x] 2.6 `src/lib/shape-factory.ts` mit `createShape` plus Tests: Standardwerte laut `specs/shape-editing/spec.md` für Rechteck und Ellipse, Mittelpunkt 412,4/188,6 → 412/189, ID wird übernommen, Ergebnis besteht das Zod-Schema. Prüfen mit `npm test`.
- [x] 2.7 `formatCm` und `formatDeg` in `src/lib/format.ts` plus Tests in `format.test.ts`: „100 cm“, „424,5 cm“, „0,1 cm“, „1 000 cm“ (mit geschütztem Leerzeichen wie bei `formatImageCoord`), „90°“, „0°“. Prüfen mit `npm test`.

## 3. Store

- [x] 3.1 `src/store/app-store.ts` um `activeTool`, `selectedShapeId`, `setActiveTool`, `selectShape`, `insertShape`, `deleteSelectedShape` erweitern. Etagenwechsel und Start des Kalibrier-Modus setzen Auswahl und Werkzeug zurück (design.md, Entscheidung 8).
- [x] 3.2 `src/store/app-store.test.ts` erweitern (mit einem Test-Speicher, dessen gespeicherter Plan eine Kalibrierung für das Erdgeschoss enthält): Start mit „select“ und ohne Auswahl; Form-Werkzeug auf nicht kalibrierter Etage und im Kalibrier-Modus wirkungslos; `insertShape` legt die Form oben in der aktiven Etage an, wählt sie aus und setzt „select“; Löschen entfernt die Form und hebt die Auswahl auf; Löschen ohne Auswahl ändert nichts; Etagenwechsel und Kalibrier-Start heben die Auswahl auf; `activeTool`/`selectedShapeId` landen nicht im gespeicherten Plan. Prüfen mit `npm test`.

## 4. Werkzeugleiste und Tastenkürzel

- [x] 4.1 `ToolBar` um das Werkzeug-Verzeichnis (Auswählen, Rechteck, Ellipse, Trenner) mit `aria-pressed`, Tooltips samt Tastenkürzel und Sperre per `aria-disabled` erweitern. Prüfen im Browser (manuell): drei Werkzeuge oben, „Auswählen“ aktiv; auf nicht kalibrierter Etage sind Rechteck/Ellipse halb transparent, Klick wirkungslos, Tooltip „… – Etage zuerst kalibrieren“ in Chrome und Firefox.
- [x] 4.2 `isEditableTarget` nach `src/hooks/isEditableTarget.ts` verschieben, `FloorCanvas` darauf umstellen und `useShapeShortcuts` (V/R/E, Esc, Entf/Rücktaste, Alt abfangen) anlegen. Prüfen im Browser (manuell): Tasten wechseln das Werkzeug; im Längenfeld des Kalibrier-Panels getipptes „r“ wechselt nichts; `+`/`-`/`0` funktionieren weiter; Alt drücken und loslassen öffnet in Firefox keine Menüleiste.

## 5. Zeichenfläche: Darstellen und Einfügen

- [x] 5.1 `ShapesLayer` und `ShapeNode` (Group + geschlossene `Line` aus `getOutlineCm`, `strokeScaleEnabled={false}`, Stil aus `style`) in `FloorCanvas` einhängen; nicht rendern im Kalibrier-Modus oder ohne Kalibrierung. Prüfen im Browser (manuell) mit einer über das Kalibrier-Werkzeug kalibrierten Etage und über die Entwicklerwerkzeuge in `raumplaner.plan` eingefügten Formen: Formen erscheinen maßstabsgetreu, folgen Zoom und Verschieben, Rand bleibt bei 10 % und 800 % gleich stark, Reihenfolge stimmt.
- [x] 5.2 Stage-`onClick` für Form-Werkzeuge: Klick auf den Grundriss fügt ein, Klick daneben nicht, Ziehen fügt nichts ein; Zeiger siehe 9.1. Prüfen im Browser (manuell): Rechteck und Ellipse erscheinen mittig an der Klickstelle, sind danach ausgewählt, Werkzeug springt auf „Auswählen“; nach Neuladen sind sie noch da.
- [x] 5.3 Hinweis „Möbel dieser Etage werden erst angezeigt, wenn die Etage kalibriert ist.“ in `FloorCanvas`. Prüfen im Browser (manuell): Formen einfügen, in den Entwicklerwerkzeugen `calibrationByFloor.eg` aus `raumplaner.plan` entfernen und neu laden → Hinweis sichtbar, Formen nicht gezeichnet; Erdgeschoss neu kalibrieren → Formen wieder da.

## 6. Auswählen, Verschieben, Transformieren, Löschen

- [x] 6.1 Auswahl per Klick (oberste Form), Aufheben per Klick ins Leere und `Esc`, `SelectionTransformer` im Stil des Entwurfs. Prüfen im Browser (manuell): blauer Rahmen mit 8 Anfassern und Dreh-Anfasser; bei überlappenden Formen wird die obere gewählt; Etagenwechsel hebt die Auswahl auf.
- [x] 6.2 Verschieben mit relativem Raster (`dragBoundFunc`, Alt über Ref, `moveBy` beim Loslassen). Prüfen im Browser (manuell): Form springt sichtbar in 5-cm-Schritten, mit Alt in 1-cm-Schritten; Ansicht bleibt stehen; Ziehen auf freier Fläche verschiebt die Ansicht; mit Rechteck-Werkzeug verschiebt Ziehen auf einer Form die Ansicht.
- [x] 6.3 Größe ändern und Drehen (`boundBoxFunc` mit `snapResizeBox`, `rotationSnaps`, `onTransformEnd` mit Skalierung zurücksetzen und `applyTransform`). Prüfen im Browser (manuell): rechter Anfasser ändert nur die Breite in 5-cm-Schritten, linke Kante bleibt stehen; dasselbe bei einer um 45° gedrehten Form; zweimal hintereinander skalieren ergibt keine doppelte Größe; Drehung rastet bei 90° ein; über die Gegenkante ziehen spiegelt nicht.
- [x] 6.4 Löschen per `Entf`/Rücktaste. Prüfen im Browser (manuell): ausgewählte Form verschwindet, andere bleiben in ihrer Reihenfolge; ohne Auswahl passiert nichts; Rücktaste navigiert nicht zurück.

## 7. Panel, Hinweisleiste, Dokumentation

- [x] 7.1 `ShapeSummary` im `PropertiesPanel` (Kopf mit Formtyp und „Löschen“, Abschnitte „Maße“ und „Lage“ mit `formatCm`/`formatDeg`). Prüfen im Browser (manuell) gegen die Szenarien in `specs/workspace-layout/spec.md`: Werte stimmen nach Einfügen, Verschieben, Größe ändern (X „424,5 cm“) und Drehen; „Löschen“ entfernt die Form; ohne Auswahl „Wähle eine Form aus“.
- [x] 7.2 `CalibrationBanner` um „Möbel sind ausgeblendet.“ ergänzen. Prüfen im Browser (manuell): Kalibrier-Modus blendet Formen aus, hebt die Auswahl auf, sperrt alle drei Werkzeuge samt Tasten; nach dem Beenden sind Formen sichtbar und „Auswählen“ ist aktiv.
- [x] 7.3 `docs/design/README.md`, Bedienentscheidungen: „Formen ziehen“ präzisieren (relativ, gilt auch für Breite/Tiefe, Hinweis zu Alt+Ziehen unter Linux), Zeilen „Formen einfügen“ und „Nicht kalibrierte Etage“ ergänzen. Prüfen, dass die Zeilen zu design.md passen.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien in `specs/shape-editing/spec.md` und `specs/floor-plan-view/spec.md`, einschließlich Neuladen (Formen und Lage bleiben erhalten). `npm run lint` ohne neue Warnungen.
- [x] 8.2 `npm run build` und `npm test` laufen fehlerfrei.

## 9. Nachbesserungen nach der Prüfung im Browser

- [x] 9.1 Eigene Zeiger als SVG (`--cursor-insert-shape`, `--cursor-move-shape` in `src/index.css`): Pfeil mit Plus bei Form-Werkzeug über dem Grundriss (daneben Hand), Pfeilkreuz über Formen bei „Auswählen“ (design.md, Entscheidung 6). Prüfen im Browser (manuell) in Chrome und Firefox: Mit „Rechteck“ zeigt der Zeiger über dem Grundriss Pfeil mit Plus, über der grauen Fläche die Hand; die Form erscheint an der Pfeilspitze. Mit „Auswählen“ zeigt er über einer Form das Pfeilkreuz, nach dem Verlassen wieder die Hand; im Kalibrier-Modus weiter das Fadenkreuz.

## Workflow follow-up

- Nächster Change `shape-properties`: bearbeitbare Felder für Maße, Lage, Beschriftung und Farben, dazu die Beschriftung auf der Zeichenfläche.
- Change nach der Prüfung mit `/opsx:archive` archivieren (nach `floor-calibration` und `plan-model`).
