# Design

## Context

Siehe proposal.md – Why. Beide Zeichenwege bauen das Maß als `Konva.Text` mit `width = gemessene Textbreite`, `offsetX = width / 2`, `align: "center"`, `wrap: "none"`:

- Editor: `DimensionText.tsx`, Breite aus `dimensionWidthPx(text)` (`dimension-measure.ts`), einmal je Text gemessen und in einer `Map` für die ganze Sitzung gespeichert.
- PDF: `DimensionPainter.node` in `render-floor.ts`, Breite aus `widthMm(text)` – gemessen bei 100 px und auf 2 mm heruntergerechnet.

Konva (`Text._setTextData`) kürzt bei fester Breite eine Zeile, deren mit der *tatsächlichen* Schrift gemessene Breite größer als `width` ist, und bei `wrap: "none"` wird der Rest verworfen. Jede noch so kleine Abweichung zwischen Vorab-Messung und Zeichen-Messung kostet so das letzte Zeichen „m“. Abweichungsquellen: Messung vor dem Laden von „Inter Variable“ (Ersatzschrift, im Cache festgehalten), nicht-lineare Breiten bei sehr kleinen bzw. gebrochenen Schriftgrößen (PDF), Rundung.

## Goals / Non-Goals

**Goals:**
- Das Textfeld eines Maßes ist nie schmaler als der gezeichnete Text – Abschneiden ist ausgeschlossen, unabhängig von kleinen Messfehlern.
- Die Prüfung „passt auf die Kante“ und die Lage außen/innen (`placeRoomDimensions`) bleiben unverändert und nutzen weiterhin die gemessene Textbreite.
- Der Editor misst nach dem Laden der Schrift neu.

**Non-Goals:**
- Kein Umbau von `placeRoomDimensions`, `dimensionFits` oder der Maß-Texte selbst.
- Keine Änderung anderer Textknoten (Raumnamen, Fläche, Möbelbeschriftungen).

## Decisions

1. **Textfeld mit Spielraum statt exakt messbreit.** Neue reine Funktion in `src/lib/dimensions.ts`, z. B. `dimensionBoxWidth(textWidth, fontSize)` = `textWidth + fontSize` (eine Schriftgröße Luft, je eine halbe links und rechts). Editor und PDF setzen `width` und `offsetX` des Konva-Texts damit; `align: "center"` hält den Text mittig, die Lage ändert sich sichtbar nicht. Die Fit-Prüfung nutzt weiter die reine Textbreite.
   - *Alternative:* `width` gar nicht setzen (Konva-Autobreite) und `offsetX` aus `node.width()` nach dem Erzeugen bestimmen. Im PDF einfach, im Editor (react-konva) nur über Ref-Callback mit zusätzlichem Re-Render – mehr Aufwand, kein Vorteil. Verworfen.
   - *Alternative:* nur den Cache reparieren. Behebt die PDF-Abweichung bei kleinen Schriftgrößen nicht und bleibt anfällig für Rundung. Verworfen als alleinige Lösung.
   - Das Textfeld zählt weiterhin nicht zum Auswahlrahmen (`excludeFromBounds`) und fängt keine Klicks (`listening: false`), daher hat die zusätzliche Breite keine Nebenwirkung.

2. **Editor-Messcache nach dem Laden der Schrift verwerfen.** `dimension-measure.ts` leert seine `Map`, sobald `document.fonts.ready` erfüllt ist bzw. ein `loadingdone`-Ereignis eintritt, und benachrichtigt die Zeichenfläche (kleine Abo-Funktion, z. B. `subscribeDimensionFont`), damit die Maße einmal neu gerendert werden – sonst würde die Fit-Prüfung bis zum nächsten Zoom/Ändern mit der alten Breite arbeiten. Ohne `document.fonts` (Tests/alte Browser) passiert nichts.
   - *Alternative:* gar nicht cachen. Messen ist billig, aber bei vielen Maßen und jedem Zoom-Render unnötig; der Cache bleibt.

## Risks / Trade-offs

- [Spielraum zu klein für extreme Abweichungen, z. B. komplett falsche Ersatzschrift] → Eine Schriftgröße entspricht der Breite von rund zwei Ziffern; zusammen mit dem Neumessen nach Schriftladung ausreichend.
- [Ursache im Browser nicht 100 % bestätigt (keine automatischen Browsertests im Projekt)] → Lösung 1 wirkt unabhängig davon, *warum* die Messung zu knapp ist. Prüfung durch den Nutzer im Browser (Editor und PDF) ist Teil der Aufgaben.
- Datenmodell und `schemaVersion`: keine Auswirkungen; nichts wird gespeichert oder exportiert.
