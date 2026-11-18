# Proposal

## Why

Bei eingeschalteter Maßanzeige steht hinter der Zahl nur „c“ statt „cm“ („312,5 c“) – auf der Zeichenfläche und ebenso im PDF-Export. Der Wert stimmt, aber die Einheit wird abgeschnitten, sodass die Maße unvollständig und unprofessionell wirken, gerade im ausgedruckten Plan.

Ursache (im Code nachvollzogen): Editor (`DimensionText`) und PDF (`DimensionPainter` in `render-floor.ts`) geben dem Konva-Text ein Textfeld, das exakt so breit ist wie die vorab gemessene Textbreite, zusammen mit `wrap: "none"`. Konva schneidet bei fester Breite ohne Umbruch alles ab, was nicht hineinpasst. Fällt die Messung auch nur um Bruchteile eines Pixels zu knapp aus, verschwindet das letzte Zeichen – das breite „m“. Zu knapp wird sie z. B., weil der Editor die Breite einmal pro Text dauerhaft zwischenspeichert (möglicherweise noch bevor die Schrift „Inter Variable“ geladen ist) und weil das PDF bei 100 px misst und auf die winzige Papier-Schriftgröße herunterrechnet, während Konva beim Zeichnen in der echten Größe misst.

## What Changes

- Maßtexte im Editor und im PDF werden immer vollständig dargestellt („312,5 cm“, nie „312,5 c“); das Textfeld bekommt Spielraum, sodass Messabweichungen keinen Text mehr abschneiden. Der Text bleibt mittig an der Kante.
- Die Regel „Maß weglassen, wenn es länger als seine Kante ist“ bleibt unverändert; ein Maß wird also entweder ganz oder gar nicht gezeigt.
- Der Editor misst Maßtexte neu, sobald die Schrift geladen ist, damit Prüfung „passt auf die Kante“ und Lage außen/innen mit der tatsächlich gezeichneten Schrift arbeiten.

Nicht im Umfang:
- Keine Änderung an Schriftgröße, Schriftart, Farbe, Lage oder Format der Maße (weiterhin „cm“ mit höchstens einer Nachkommastelle).
- Keine Änderung an anderen Beschriftungen (Raumnamen, Fläche, Möbelbeschriftungen), die bewusst mit „…“ gekürzt werden.
- Keine Maßketten, keine anderen Einheiten (m, mm).

## Capabilities

### New Capabilities
<!-- keine -->

### Modified Capabilities
- `dimension-display`: „Lesbare Maße“ fordert ausdrücklich, dass ein angezeigtes Maß vollständig mit Einheit erscheint und nie abgeschnitten wird.
- `plan-pdf`: „Maße im PDF“ fordert ebenso, dass jedes gedruckte Maß vollständig mit Einheit erscheint.

## Impact

- `src/components/canvas/DimensionText.tsx` – Textfeld des Maßes nicht mehr exakt messbreit.
- `src/components/canvas/dimension-measure.ts` – Zwischenspeicher der Textbreiten nach dem Laden der Schrift verwerfen.
- `src/components/plan-pdf/render-floor.ts` – `DimensionPainter.node` ebenso.
- Ggf. kleine reine Hilfsfunktion in `src/lib/dimensions.ts` (Breite des Textfelds) mit Vitest-Test.
- Kein Einfluss auf Datenmodell, `schemaVersion`, Export/Import oder Abhängigkeiten.
