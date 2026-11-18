# Tasks

## 1. Breite des Textfelds (Logik)

- [x] 1.1 `dimensionBoxWidth(textWidth, fontSize)` in `src/lib/dimensions.ts` ergänzen (Textbreite plus eine Schriftgröße Spielraum) und in `src/lib/dimensions.test.ts` testen (z. B. 40 px Text, 11 px Schrift → 51; Ergebnis immer > Textbreite); `npm test` läuft grün.

## 2. Editor

- [x] 2.1 `DimensionText.tsx`: `width` und `offsetX` des Konva-Texts aus `dimensionBoxWidth(dimensionWidthPx(text), DIMENSION_FONT_SIZE_PX)` setzen; `dimensionFits` weiter mit der reinen Textbreite. Prüfen: `npm run build` fehlerfrei.
- [x] 2.2 `dimension-measure.ts`: Breiten-Cache leeren, wenn `document.fonts.ready` erfüllt ist bzw. `loadingdone` feuert, und eine Abo-Funktion anbieten; die Komponente, die die Maße rendert (`RoomsLayer`/`ShapesLayer` bzw. `FloorCanvas`), abonniert sie und rendert einmal neu. Ohne `document.fonts` keine Wirkung. Prüfen: `npm run build` fehlerfrei.

## 3. PDF

- [x] 3.1 `render-floor.ts` (`DimensionPainter.node`): `width`/`offsetX` aus `dimensionBoxWidth(this.cm(widthMm), this.cm(DIMENSION_FONT_MM))`; `dimensionFits` unverändert mit `widthMm`. Prüfen: `npm run build` fehlerfrei.

## 4. Abschluss

- [x] 4.1 Nutzer prüft im Browser: Maßanzeige an (auch direkt nach Neuladen) zeigt „… cm“ vollständig an Räumen und Möbeln; PDF mit „Maße“ in 1:50, 1:100 und „Auf Seite einpassen“ zeigt „… cm“ vollständig; Maße bleiben mittig an der Kante.
- [x] 4.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
