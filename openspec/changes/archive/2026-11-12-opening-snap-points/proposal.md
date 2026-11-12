# Proposal

## Why

Türen und Fenster liegen heute dort, wo man klickt, und lassen sich in 5-cm-Schritten entlang der Wand ziehen. In echten Grundrissen sitzen sie aber oft an festen Stellen: mittig in der Wand, bündig an einer Ecke oder direkt neben einer anderen Öffnung (Fensterband). Diese Stellen genau zu treffen, ist heute Fummelarbeit, oder man muss im Panel nachrechnen. Dieser Change ergänzt Rastpunkte: Kommt eine Öffnung beim Setzen oder Ziehen in die Nähe einer solchen Stelle, rastet sie dort ein. Er ist der vierte von fünf Changes: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.

## What Changes

- **Rastpunkte je Kante** für Tür, Fenster und Durchgang:
  - **Mitte**: Die Öffnung liegt mittig auf der Kante.
  - **Ecke**: Die Öffnung schließt bündig an eine der beiden Ecken an.
  - **Nachbar**: Die Öffnung schließt bündig an eine andere Öffnung derselben Kante an, links oder rechts davon.
- **Einrasten**: Liegt die Öffnung beim Setzen oder Ziehen höchstens 8 Bildschirmpixel von einem Rastpunkt entfernt, liegt sie genau dort.
  - Der nächste Rastpunkt gewinnt. Er hat Vorrang vor dem 5-cm- bzw. 1-cm-Raster.
  - Mit gedrückter Umschalttaste gibt es keine Rastpunkte, nur das Raster.
- **Markierung**: Ist eine Öffnung eingerastet, zeigt eine kurze Linie in der Auswahlfarbe quer über die Wand die Raststelle an.
  - Das gilt beim Ziehen und mit aktivem Werkzeug schon beim Überfahren der Wand, bevor man klickt.
- Keine Änderung am Datenformat.

## Nicht im Umfang

- Vorschau der ganzen Öffnung unter dem Mauszeiger vor dem Klick (nur die Markierung des Rastpunkts)
- Rastpunkte gegenüber Öffnungen eines Nachbarraums oder an Möbeln
- Rastpunkte an frei eingegebenen Abständen (z. B. „30 cm von der Ecke“)
- Einstellbare Toleranz (die Pixelzahl ist fest; der Fangschritt wird mit `app-settings` einstellbar)
- Einrasten beim Zeichnen von Räumen (gibt es schon für Ecken) oder beim Verschieben von Möbeln

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `room-openings`:
  - Neu: „Rastpunkte für Öffnungen“, „Rastpunkte abschalten“ und „Markierung des Rastpunkts“
  - Geändert: „Öffnung setzen“ und „Öffnung entlang der Kante ziehen“ verweisen auf die Rastpunkte und bekommen eigene Szenarien

## Impact

- **Voraussetzung**: `room-color` ist archiviert. Die Formatversion bleibt 8.
- **Neu in `src/lib/`**: `opening-snap.ts` (`openingSnapTargets`, `snapOpeningOffset`) mit Vitest-Test
- **Geändert**:
  - `src/lib/opening-placement.ts`: `createOpening` und `dragOffset` nehmen ein Rast-Ergebnis an
  - `OpeningsLayer` (Ziehen, Markierung)
  - Einsetzen per Klick auf der Zeichenfläche (Hover-Markierung, Umschalttaste)
  - `useAltKeyRef` bzw. ein Gegenstück für die Umschalttaste
  - `src/store/app-store.ts`: `insertOpening` bekommt die Pixel-Toleranz
- **Doku**: `docs/design/README.md` (Zeile „Türen und Fenster“)
- **Abhängigkeiten**: keine neuen
- **Datenmodell**: unverändert, `schemaVersion` bleibt 8
