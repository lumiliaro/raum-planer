# Design

## Context

Das Zeichnen eines Raums ist heute in zwei Teile getrennt (siehe proposal.md – Why):

- `src/lib/room-drawing.ts` (rein, getestet): `resolveDraftPointer(points, pointer, roomCorners, radiusCm, free)` entscheidet, welchen Eckpunkt ein Klick setzt – erst Ecken-Einrasten (Startpunkt, Raumecken), sonst `edgeEndAtPointer` (Richtung 0°/90°/180°/270°, mit `free` frei).
- `RoomDraftLayer.tsx` ruft dieselbe Funktion für die Vorschau auf und verfolgt den Zeiger samt Umschalttaste in einem kleinen Zustand (`useDraftPointer`); `FloorCanvas.tsx` ruft sie beim Klick mit `e.evt.shiftKey` auf.
- Der Schalter „Einrasten“ ist `shapeSnapping` im App-Store (Browser-Einstellung, nicht im Plan).

Vorschau und Klick müssen weiterhin genau dasselbe Ergebnis liefern; deshalb gehört das Einrasten an Hilfslinien in dieselbe reine Funktion.

## Goals / Non-Goals

**Goals:**
- Einrasten an Hilfslinien als reine, testbare Logik in `room-drawing.ts`.
- Vorschau und Klick nutzen eine Auflösung; die Vorschau bekommt zusätzlich die wirksamen Hilfslinien zum Zeichnen.

**Non-Goals:**
- Keine Wiederverwendung der Rastlinien-Logik von Formen (`shape-snap.ts`): Die arbeitet mit umschließenden Rechtecken und Raum-Zugehörigkeit, hier geht es um einzelne Punkte.
- Keine Änderungen am Datenmodell oder am Store-Zustand des Entwurfs (`RoomDraft`).

## Decisions

### 1. Hilfslinien = Koordinaten von Eckpunkten, je Achse

Eine Hilfslinie ist eine Koordinate auf einer Achse plus der Eckpunkt, durch den sie läuft (für die Anzeige):

```ts
interface DraftGuide { axis: "x" | "y"; valueCm: number; from: PointCm }
```

Quellen: alle gesetzten Eckpunkte außer dem letzten (eine Linie durch den letzten Punkt quer zur Kante ergäbe eine Kante von 0 cm, längs zur Kante ist sie die Kante selbst), danach die Ecken der anderen Räume. Gleich weit entfernte Kandidaten: der zuerst gefundene gewinnt, also eigene Eckpunkte vor Raumecken.

*Alternative:* Linien auch durch den letzten Punkt oder durch Kantenmitten – verworfen, siehe Nicht im Umfang.

### 2. Einrasten nach dem Richtungs-Einrasten, nur auf der Querachse

Ablauf in `resolveDraftPointer`:
1. Ecken-Einrasten wie bisher (Vorrang).
2. Endpunkt der Kante wie bisher (`edgeEndAtPointer`), beim ersten Punkt der gerundete Zeiger.
3. Neu, nur wenn Hilfslinien an sind: Ohne `free` und ab dem zweiten Punkt ist die Kante waagerecht oder senkrecht; dann wird nur die Achse quer zur Kante gesucht (waagerechte Kante → senkrechte Hilfslinien, also `x`). Sonst (erster Punkt, `free`) wird jede Achse für sich gesucht. Getroffen wird die nächste Hilfslinie mit Abstand ≤ Toleranz (`CORNER_SNAP_RADIUS_PX / scale`, also dieselben 8 px).

So bleibt eine gerade Kante gerade, und der Abstand wird an der Stelle gemessen, an der der Punkt ohne Hilfslinie läge – nicht am rohen Zeiger. Das Ergebnis wird auf 0,1 cm gerundet; da Eckpunkte schon gerundet sind, ändert das nichts.

Rückgabe erweitert: `DraftPointer` bekommt `guides: DraftGuide[]` (0–2 Einträge, die wirksamen Linien).

*Alternative:* Hilfslinien vor dem Richtungs-Einrasten auf den rohen Zeiger anwenden – verworfen, weil dann ein Punkt nahe einer waagerechten Hilfslinie eine senkrechte Kante „verbiegen“ könnte.

### 3. Optionen statt weiterer Positionsparameter

`resolveDraftPointer` hat schon fünf Parameter. Neu: `resolveDraftPointer(points, pointer, roomCorners, { radiusCm, free, guides })` mit einem Optionsobjekt statt weiterer Positionsparameter. `guides` ist `shapeSnapping && !ctrlKey`. Bestehende Aufrufer (`FloorCanvas`, `RoomDraftLayer`) und Tests werden angepasst.

### 4. Strg im Zeiger-Zustand

`useDraftPointer` bekommt `ctrl` wie `shift` (aus `mousemove` und aus `keydown`/`keyup` für `Control`), damit die Vorschau beim Drücken von Strg ohne Mausbewegung umschaltet. `FloorCanvas` liest beim Klick `e.evt.ctrlKey`. Die Tasten-Behandlung des Entwurfs (`useRoomDraftKeys`) ignoriert Strg-Kombinationen schon heute; Strg+Klick ist im Werkzeug „Raum“ sonst nicht belegt.

### 5. Darstellung

In `RoomDraftLayer` je wirksamer Hilfslinie eine gestrichelte `Line` von `guide.from` bis zum Vorschau-Endpunkt, Farbe `SNAP_COLOR` (Auswahlfarbe, schon vorhanden), `strokeScaleEnabled={false}`, dünner als die Kante. Bei eingetippter Länge (`previewFor`-Zweig mit `typed`) gibt es keine Hilfslinien. Ist der Punkt ungültig (rot), wird die Hilfslinie trotzdem gezeigt – sie erklärt, wo der Punkt liegt.

### 6. Schalter-Tooltip

`ZoomControls.tsx`: „Einrasten von Möbeln ausschalten/einschalten“ → „Einrasten von Möbeln und Hilfslinien beim Raumzeichnen ausschalten/einschalten“ (kurz genug für einen Tooltip).

### Datenmodell und schemaVersion

Keine Auswirkung: Hilfslinien sind reiner Ansichts- und Eingabezustand. Plan, `schemaVersion`, Speicherung, Export/Import und Rückgängig bleiben unverändert; gesetzte Eckpunkte sind normale gerundete Punkte wie bisher.

## Risks / Trade-offs

- [Viele Räume → viele Kandidaten] → Linearer Durchlauf über alle Ecken je Mausbewegung; bei Wohnungsgrößen (≪ 1000 Ecken) unkritisch. Ecken werden wie heute per `useMemo` gesammelt.
- [Hilfslinie zieht ungewollt] → 8 px wie beim Ecken-Einrasten, Abschalten mit Strg oder Schalter; Ecken behalten Vorrang.
- [Schalter heißt „Einrasten“, wirkt aber jetzt auf zwei Dinge] → Tooltip nennt beides; die Hilfe-Liste nennt Strg.
- [Strg+Klick unter macOS = Rechtsklick] → Zielplattform ist Desktop-Browser unter Windows/Linux; unter macOS bleibt der Schalter als Weg zum Abschalten.
