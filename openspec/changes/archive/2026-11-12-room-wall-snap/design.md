# Design

## Context

Das Ziehen eines Raums steckt in `RoomArea` in `src/components/canvas/RoomsLayer.tsx`: `dragBoundFunc` rechnet die Mausbewegung in cm um (`cmPerScreenPx = 1 / scale`), rastert sie mit `snapDelta` relativ zur Startlage und meldet den Versatz über `onDrag` an `RoomsLayer`, das Wandbänder, Flächen und Öffnungen versetzt zeichnet. Erst `onDragEnd` ruft `moveRoom` (ein Rückgängig-Schritt, `translatePoints` rundet auf 0,1 cm). Die Sperre prüft der Store (`isRoomPatchAllowed`).

Wanddicken liegen je Kante in `room.wallThicknessCm`; die Wand ist ein Band außen um die Innenkante. Zwei Räume mit Innenkanten-Abstand gleich der Wanddicke sehen deshalb wie durch eine gemeinsame Wand getrennt aus (siehe Spec „Zwei Räume mit Lücke“). Modifier-Tasten werden über `useModifierKeyRef` (Alt, Shift) als Ref gelesen, weil `dragBoundFunc` kein Event bekommt.

## Goals / Non-Goals

**Goals:**
- Haften, Lösen mit Hysterese und bündige Ecken als reine, testbare Funktion in `src/lib/`, die Zeichenfläche ruft sie nur auf.
- Gleiches Gefühl bei jedem Zoom: Fang- und Löseabstand in Bildschirmpixeln, die Funktion bekommt sie in cm.
- Funktioniert für Kanten in jedem Winkel, nicht nur waagerecht/senkrecht.

**Non-Goals:**
- Kein Haften bei Größen- oder Kantenänderungen, kein Haften von Möbeln.
- Keine räumliche Indexstruktur: Eine Etage hat wenige Räume mit wenigen Kanten; ein Durchlauf über alle Kantenpaare je Mausbewegung reicht.

## Decisions

### 1. Reine Funktion mit explizitem Haft-Zustand

`src/lib/room-snap.ts` exportiert:

```ts
interface WallStick {        // eine Haftung
  roomId: string;            // Nachbarraum
  edgeIndex: number;         // Kante des Nachbarn
  movingEdgeIndex: number;   // Kante des gezogenen Raums
  normal: PointCm;           // Einheitsnormale der Nachbarkante, zeigt zum gezogenen Raum
  offsetCm: number;          // Versatz entlang normal, der die Haftlage herstellt (in Delta-Koordinaten)
}

interface RoomDragSnapInput {
  points: PointCm[];          // Eckpunkte des gezogenen Raums in der Startlage
  wallThicknessCm: number[];
  others: Room[];             // übrige Räume der Etage (inkl. gesperrter)
  rawDelta: PointCm;          // Mausversatz in cm, ungerastert
  gridDelta: PointCm;         // gerasterter Versatz (snapDelta je Achse)
  sticks: WallStick[];        // Haftungen der vorigen Mausbewegung
  captureCm: number;          // 8 px in cm
  releaseCm: number;          // 24 px in cm
}

interface RoomDragSnapResult {
  delta: PointCm;             // anzuwendender Versatz
  sticks: WallStick[];        // neue Haftungen (für den nächsten Aufruf und die Markierung)
}

function snapRoomDrag(input): RoomDragSnapResult
```

Die Komponente hält `sticks` im `dragRef` zwischen den `dragBoundFunc`-Aufrufen und setzt ihn bei Drag-Start auf `[]`. Ohne React-Zustand in der Logik bleibt sie vollständig mit Vitest testbar (Szenarien der Spec 1:1 als Tests).

*Alternative:* Zustand in der Komponente und nur Geometrie-Helfer in `lib`. Verworfen, weil gerade die Hysterese (wann löst sich was) die fehleranfällige Logik ist und getestet werden soll.

### 2. Haftziele: parallele, gegenüberliegende, überlappende Kanten

Für jede Kante `m` des gezogenen Raums (verschoben um `rawDelta`) und jede Kante `n` jedes anderen Raums:
- parallel (Winkel der Richtungen innerhalb 0,5°) und **gegenüberliegend**: die Außennormalen zeigen in entgegengesetzte Richtungen, die Außenseite von `m` zeigt zu `n`. Außennormalen über den Umlaufsinn (Vorzeichen der Fläche) bestimmen, wie es `wallBandOutline` schon tut.
- Überlappung der Projektionen beider Kanten auf die Kantenrichtung > 0 cm (mit `GEOMETRY_EPS_CM`).
- Soll-Abstand der Innenkanten `gap = max(dicke_m, dicke_n)`.
- Abweichung `d` = (Soll-Abstand − Ist-Abstand) entlang der Nachbar-Normalen; Kandidat, wenn `|d| ≤ captureCm`.

Die Haftlage ersetzt nur die Komponente des Versatzes entlang der Normalen: `delta = gridDelta + (rawDelta·n + d − gridDelta·n)·n`, d. h. quer zur Wand zählt die Haftlage, entlang der Wand das Raster.

Auswahl: kleinste `|d|` gewinnt. Danach darf eine zweite Haftung hinzukommen, deren Normale nicht parallel zur ersten ist (Ecke zwischen zwei Räumen). Sind beide Normalen senkrecht, sind die Korrekturen unabhängig; bei schrägen Normalen wird das 2×2-System aus beiden Bedingungen gelöst. Mehr als zwei Haftungen gibt es nicht.

### 3. Hysterese: Lösen erst nach 24 px

Für jede bestehende Haftung wird zuerst geprüft, ob sie bleibt:
- Kanten liegen sich noch gegenüber und überlappen (in der neuen Lage) → sonst lösen.
- Abweichung der Mauslage von der Haftlage quer zur Wand `|d| ≤ releaseCm` → bleibt, sonst lösen. Gilt in beide Richtungen (wegziehen und hineindrücken).

Erst danach werden neue Haftungen mit `captureCm` gesucht. Weil `releaseCm` (24 px) deutlich größer als `captureCm` (8 px) ist, springt der Raum nach dem Losreißen nicht sofort zurück. Bestehende Haftungen haben Vorrang vor neuen Kandidaten mit gleicher Normalenrichtung.

*Alternative:* Zeitverzögerung beim Lösen. Vom Nutzer verworfen; eine Weg-Schwelle ist vorhersagbarer und braucht keine Timer im `dragBoundFunc`.

*Alternative:* Schwellen in cm. Verworfen, weil das Haften dann beim Herauszoomen kaum spürbar und beim Hineinzoomen zäh wäre. Die Komponente rechnet `captureCm = 8 / scale`, `releaseCm = 24 / scale`; Konstanten `WALL_SNAP_CAPTURE_PX = 8` (wie `SNAP_POINT_TOLERANCE_PX` der Öffnungen) und `WALL_SNAP_RELEASE_PX = 24` in `room-snap.ts`.

### 4. Bündige Ecken entlang der Wand

Für jede Haftung: Die beiden Endpunkte der haftenden Kante `m` werden entlang der Kantenrichtung mit den beiden Endpunkten der Nachbarkante `n` verglichen (Mauslage, nicht gerastert). Liegt der kleinste Abstand ≤ `captureCm`, ersetzt er die Komponente des Versatzes entlang der Wand. Kein Hysterese-Verhalten, normales Einrasten. Bei zwei senkrechten Haftungen ist die Wandrichtung der einen die Normale der anderen; dort gewinnt die Haftung (Wand vor Ecke), die Ecke wird nur auf die noch freie Richtung angewandt.

### 5. Strg schaltet ab

`useModifierKeyRef` bekommt `"ctrlKey"` und einen Export `useCtrlKeyRef`. Ist Strg gedrückt, ruft `dragBoundFunc` `snapRoomDrag` nicht auf, nutzt `gridDelta` und leert `sticks` (Wiederhaften nach Loslassen von Strg über `captureCm`). Strg ist beim Ziehen bisher unbelegt; Strg+Mausrad (Zoom) und Strg-Tastenkürzel greifen nicht beim Ziehen. Auf macOS wäre Cmd üblicher, die App zielt aber auf Desktop-Browser unter allen Systemen; `metaKey` wird nicht ausgewertet (offen, siehe unten).

### 6. Markierung

`RoomDrag` (Zustand in `RoomsLayer`) bekommt zusätzlich `stuckEdges: { roomId, edgeIndex }[]`. `onDrag` meldet sie nur bei Änderung, wie heute beim Versatz. `RoomsLayer` zeichnet diese Kanten wie die hervorgehobene Kante (`SELECTION_COLOR`, 4 px, `strokeScaleEnabled={false}`). `onDrag(null)` beim Loslassen entfernt sie.

### 7. Ende des Ziehens

`onDragEnd` übergibt den zuletzt berechneten `delta` an `moveRoom`; `translatePoints` rundet die Eckpunkte auf 0,1 cm. Ein Rückgängig-Schritt wie bisher; Sperrprüfung bleibt im Store.

### Datenmodell und schemaVersion

Keine Änderung am Datenmodell, keine neuen Felder, `schemaVersion` bleibt unverändert. Haften ist reines Bedienverhalten während des Ziehens; gespeichert wird nur das Ergebnis (verschobene Eckpunkte). Keine neuen Abhängigkeiten.

## Risks / Trade-offs

- [Haftung auf halbe Rasterwerte, z. B. 352,5 cm statt 5-cm-Raster] → gewollt: Innenmaße sind exakt, die gemeinsame Wand zählt mehr als das Raster. Entlang der Wand bleibt das Raster.
- [Viele Kandidaten bei vielen Räumen, Ruckeln] → O(Kanten × Kanten) je Mausbewegung; bei typischen Etagen (≤ 30 Räume, ≤ 10 Kanten) wenige tausend Vergleiche, unkritisch.
- [Schräge Kanten: numerische Ungenauigkeit bei Parallelität] → Winkeltoleranz 0,5° und Rundung der Eckpunkte auf 0,1 cm beim Loslassen.
- [Haften an einer Kante, an der der Raum gar nicht anliegen soll (z. B. beim Durchziehen)] → Strg schaltet ab; Losreißen nach 24 px.
- [Überlappende Räume] → bleiben erlaubt; Haften drückt nicht aktiv auseinander.

## Open Questions

- Soll auf macOS zusätzlich Cmd (metaKey) das Haften abschalten? Lässt sich später ergänzen, ohne Specs für Strg oder den Ansatz zu ändern.
