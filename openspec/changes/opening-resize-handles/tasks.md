# Tasks

## 1. Logik: Ende einer Öffnung ziehen

- [ ] 1.1 `src/lib/opening-resize.ts` anlegen mit `MIN_OPENING_WIDTH_CM = 10`, Typen `ResizeSide` (`"start" | "end"`) und `ResizeTarget { endCm, kind, markAtCm }`; prüfen: `npm run build` kompiliert
- [ ] 1.2 `resizeTargets(lengthCm, fixedEndCm, side, others, defaultWidthCm)` implementieren (Ecke, Nachbarenden, Kantenmitte, mittig `L − fixedEnd`, Standardbreite; nur `0 ≤ t ≤ L` und Breite ≥ 10 cm); Vitest in `opening-resize.test.ts` deckt jede Art, die Filterung und die Seiten `start`/`end` ab
- [ ] 1.3 `resizeOpening(start, side, alongDeltaCm, step, lengthCm, snap)` implementieren (Raster relativ zur Startlage über `snapDelta`, Halt an Kantenende und Mindestbreite, Haltepunkt vor Raster, Rangfolge bei Gleichstand); Vitest bildet die Zahlen aller Szenarien aus „Breite an den Griffen ziehen“, „Haltepunkte beim Ziehen der Breite“ (inkl. Zoom 50 %) und „… abschalten“ nach und läuft grün (`npm test`)

## 2. Zeichenfläche: Griffe, Ziehen, Vorschau

- [ ] 2.1 `OpeningDrag` um `widthCm` erweitern; Verschieben meldet die unveränderte Breite, `RoomsLayer` schneidet die Lücke mit Vorschau-Abstand und -Breite; prüfen: `npm run build`, Verschieben einer Tür im Browser unverändert
- [ ] 2.2 In `OpeningNode` für ausgewählte Fenster/Durchgänge bei „Auswählen“ zwei Griffe (7 px, weiß, Rand Auswahlfarbe, zoomunabhängig) mittig in der Wanddicke an beiden Enden zeichnen, Cursor `ew-resize`/`ns-resize` nach Kantenrichtung; prüfen im Browser: Szenarien „Griffe am Fenster“, „Tür ohne Griffe“, „Nicht ausgewählt“
- [ ] 2.3 Griffe ziehbar machen: `dragBoundFunc` projiziert auf die Kante und ruft `resizeOpening` (Alt = 1 cm, Umschalt = ohne Haltepunkte, Toleranz `SNAP_POINT_TOLERANCE_PX / scale`, Standardbreite aus den Einstellungen); Gruppe wird dabei nicht verschoben; Symbol und Lücke folgen live; prüfen im Browser: „Fenster breiter ziehen“, „Linkes Ende ziehen“, „Mindestbreite“, „Vorschau beim Ziehen“
- [ ] 2.4 Markierung über den vorhandenen `onSnap`/`dragMark`-Weg am gezogenen Ende zeigen und beim Loslassen entfernen; prüfen im Browser: „Markierung an der Ecke“, „Ohne Haltepunkte“ (keine Markierung)
- [ ] 2.5 Beim Loslassen genau ein `updateOpening(floorId, id, { offsetCm, widthCm })`, unverändert kein Aufruf; Store-Test in `src/store/app-store.test.ts`: ein Patch mit Breite und Abstand ist ein Undo-Schritt, verwirft `beforeFullEdge` und wirkt auch bei gesperrtem Raum; prüfen im Browser: „Ein Rückgängig-Schritt“, „Ganze Kante gezogen“, „Gesperrter Raum“

## 3. Hilfe

- [ ] 3.1 Eintrag zu Umschalt in `src/components/help/shortcuts.ts` um das Ziehen der Breite ergänzen („… ohne Einrasten an Rastpunkten, auch beim Ziehen der Breite“) und ggf. `shortcuts.test.ts` anpassen; Tutorial-Schritt „Türen, Fenster und Durchgänge“ um einen Satz zu den Griffen ergänzen; `npm test` grün

## 4. Abschluss

- [ ] 4.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei
