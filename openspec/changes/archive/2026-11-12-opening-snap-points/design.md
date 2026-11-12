# Design

## Context

- **Ausgangslage nach `room-color`** (Formatversion 8, Öffnungsarten Tür, Fenster und Durchgang):
  - **Setzen**: `insertOpening(kind, pointCm, toleranceCm)` im Store → `nearestRoomEdge` → `createOpening(kind, edgeIndex, frame, tCm, id)`. Die Mitte liegt bei `round(tCm)`, danach wird auf `[0, L − w]` geklemmt.
  - **Ziehen**: `OpeningNode.dragBound` projiziert die Mausbewegung auf `frame.dir`, `dragOffset(start, along, step, L, w)` rastet relativ zur Startlage auf `snapStepCm(alt)` ein und klemmt.
  - Die Alt-Taste kommt aus `useAltKeyRef`.
  - **Vorbild**: Das Zeichnen von Räumen rastet an Ecken mit einer Toleranz von 8 Bildschirmpixeln ein, Umschalt schaltet dort das Einrasten der Richtung ab. Die Markierung ist dort ein Ring.
- Die Zeichenfläche kennt den Zoom (`scale` = Bildschirmpixel je cm).

## Goals / Non-Goals

**Goals:**
- Eine reine Funktion bestimmt die Rastpunkte und das Einrasten. Setzen, Ziehen und Hover nutzen dieselbe Funktion.
- Ohne Rastpunkt in der Nähe verhalten sich Setzen und Ziehen genau wie bisher, und bestehende Tests bleiben gültig.

**Non-Goals:**
- Kein Einrasten am Zeigerpunkt, nur an der Lage der Öffnung (ihrem Abstand `offsetCm`).
- Keine Rastpunkte über Kanten oder Räume hinweg.

## Decisions

### 1. `src/lib/opening-snap.ts`

```ts
type SnapKind = "center" | "corner" | "neighbor";
interface SnapTarget { offsetCm: number; kind: SnapKind; markAtCm: number }  // markAtCm = Stelle der Markierung auf der Kante

openingSnapTargets(lengthCm, widthCm, others: { offsetCm, widthCm }[]): SnapTarget[]
//   center:   offset (L − w) / 2,          Markierung bei L / 2
//   corner:   offset 0 → Markierung 0;     offset L − w → Markierung L
//   neighbor: offset o.offset + o.width → Markierung dort; offset o.offset − w → Markierung o.offset
//   nur Ziele mit 0 ≤ offset ≤ L − w (Toleranz 1e-6)

snapOpeningOffset(rawOffsetCm, targets, toleranceCm): SnapTarget | null
//   nächstes Ziel mit |raw − offset| ≤ toleranceCm. Bei gleichem Abstand gilt die
//   Reihenfolge center, corner, neighbor.
```

- `others` sind die übrigen Öffnungen derselben Kante, ohne die gezogene selbst.
- `toleranceCm = SNAP_POINT_TOLERANCE_PX / scale` mit `SNAP_POINT_TOLERANCE_PX = 8`, wie beim Zeichnen von Räumen.
- **Alternative**: Einrasten an der Mausposition statt an der Lage der Öffnung. Verworfen: Beim Ziehen packt man die Öffnung irgendwo an, gemeint ist aber die Lage der ganzen Öffnung.

### 2. Einbindung

- **Setzen**: `createOpening` bekommt optional ein `SnapTarget`. Der Store rechnet `raw = tCm − w/2` (vor dem Runden und Klemmen) und fragt `snapOpeningOffset` mit den Öffnungen der getroffenen Kante. Ein Treffer setzt `offsetCm = target.offsetCm`, sonst gilt der bisherige Weg (Mitte auf ganze cm gerundet, geklemmt).
  - `insertOpening(kind, pointCm, toleranceCm, { snap: boolean, snapToleranceCm })`: Die Zeichenfläche übergibt `snap = !shiftKey`.
- **Ziehen**: `dragOffset` bekommt optional `targets` und `toleranceCm`. `raw = start + along`. Ein Treffer gibt sein Ziel zurück, sonst gilt wie bisher `start + snapDelta(along, step)`, geklemmt.
  - Die Ziele werden einmal zu Beginn des Ziehens berechnet, weil sich die übrigen Öffnungen dabei nicht bewegen.
  - Die Umschalttaste kommt aus einem `useShiftKeyRef` analog zu `useAltKeyRef`, oder `useAltKeyRef` wird zu `useModifierKeysRef` verallgemeinert.
- `dragOffset` und `createOpening` geben das getroffene Ziel mit zurück, damit die Komponente die Markierung zeigen kann.

### 3. Markierung

- `OpeningsLayer` hält `snapMark: { roomId, edgeIndex, atCm } | null`. Gezeichnet wird eine Linie von `pointOnEdge(frame, atCm, −4 / scale)` bis `pointOnEdge(frame, atCm, thickness + 4 / scale)` in `SELECTION_COLOR`, 2 px, `strokeScaleEnabled = false`, `listening = false`. Sie ragt also 4 Bildschirmpixel über Kante und Wand hinaus.
- **Beim Ziehen**: `dragBound` setzt die Markierung, bei jedem Ziel-Wechsel neu. `onDragEnd` löscht sie.
- **Beim Überfahren mit aktivem Werkzeug**: Die Komponente, die heute den Einfüge-Cursor über Kanten setzt, rechnet bei `mousemove` dieselbe Kette (`nearestRoomEdge` → `raw` → `snapOpeningOffset`) und setzt die Markierung. Verlässt der Zeiger die Kante oder wechselt das Werkzeug, wird sie gelöscht. Die Breite kommt aus `defaultOpeningWidthCm(kind)` und wird wie in `createOpening` auf die Kantenlänge begrenzt.
- **Alternative**: Ring am Rastpunkt wie beim Zeichnen von Räumen. Verworfen: Bei einer Öffnung ist die Raststelle eine Linie quer zur Wand, kein Punkt.

## Risks / Trade-offs

- [Bei kleinem Zoom liegen Rastpunkte dicht beieinander (8 px = 32 cm bei 25 %)] → Der nächste gewinnt, und Umschalt schaltet ab. Das Panel bleibt für exakte Werte.
- [Rastpunkt und Raster können um wenige cm springen, wenn man an der Toleranzgrenze zieht] → Wie beim Einrasten von Ecken üblich. Die Markierung zeigt an, wann gerastet ist.
- [Umschalt beim Klick verändert in Konva nicht die Auswahl, ist im Werkzeug aber noch frei] → Es gibt heute keine Umschalt-Funktion bei Öffnungen. Ein Test sichert, dass Umschalt+Klick weiterhin genau eine Öffnung setzt.

## Migration Plan

- Keine Datenänderung und keine Migration. `schemaVersion` bleibt 8.
