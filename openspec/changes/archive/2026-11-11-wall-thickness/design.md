# Design

## Context

- **Ausgangslage nach `room-openings`** (Formatversion 5):
  - `Room { id, name, pointsCm, openings }`.
  - Die Wand hat keine eigenen Daten. `RoomsLayer` zeichnet jeden Umriss als Strich mit `2 × WALL_THICKNESS_CM` (15 cm), `lineJoin = "miter"`, `miterLimit = 2`. Danach schneidet es mit `destination-out` das Innere aller Räume und die Lücken aller Öffnungen aus. Übrig bleibt nur das Band außen.
- **Wo `WALL_THICKNESS_CM` heute vorkommt**:
  - `opening-geometry.ts`: Tiefe des Fenstersymbols
  - `opening-placement.ts`: Band-Treffer in `nearestRoomEdge`
  - `content-bounds.ts`: Rand beim Einpassen
  - `RoomsLayer`: Strichbreite
- **Lücken**: `openingGap` schneidet von 1 cm innen bis `OPENING_CUT_DEPTH_CM = 40` cm außen.
- **Eckenzahl**: Sie ändert sich nach dem Zeichnen nie (`floor-rooms`). Eine Liste mit einem Wert je Kante bleibt also immer gleich lang.
- **Panel**: `RoomProperties` → `EdgesSection` mit `FieldGrid` (zwei Spalten) und einem `NumberField` je Kante. `setHighlightedEdge` hebt beim Fokus die Kante hervor.

## Goals / Non-Goals

**Goals:**
- Die Wanddicke ist eine einfache Liste am Raum. Die Geometrie des Bandumrisses steckt in einer reinen, getesteten Funktion.
- Ein v5-Plan sieht nach der Migration genauso aus wie vorher.
- Die Lücken- und Zusammenspiel-Logik zwischen Nachbarräumen (`destination-out`) bleibt unverändert.

**Non-Goals:**
- Keine Erkennung gemeinsamer Wände zwischen zwei Räumen. Zwei Räume mit 11,5 cm Abstand behalten ihre eigenen Bänder, die sich wie bisher im Spalt überdecken.
- Keine Begrenzung eines dicken Bands an fremden Möbeln oder Bändern.

## Decisions

### 1. Datenmodell und Formatversion 6

```ts
RoomSchema = z.object({
  ...,
  wallThicknessCm: z.array(z.number().positive().max(MAX_WALL_THICKNESS_CM)), // 100
})
  .refine(r => r.wallThicknessCm.length === r.pointsCm.length, { path: ["wallThicknessCm"] })
```

- **Auswirkung auf `schemaVersion`**: 5 → 6. `PLAN_MIGRATIONS[5]` ergänzt bei jedem Raum-Objekt ohne `wallThicknessCm` eine Liste mit `15` je Eckpunkt, wenn `pointsCm` eine Liste ist. Andere Werte bleiben. Die Prüfung danach entscheidet.
- `DEFAULT_WALL_THICKNESS_CM = 15` (bisher `WALL_THICKNESS_CM`) und `MAX_WALL_THICKNESS_CM = 100` liegen in `room-geometry.ts`.
- **Alternative**: `walls: { thicknessCm }[]` je Kante als Objekt. Verworfen: Heute gibt es nur einen Wert. Eine spätere Erweiterung (z. B. Wandfarbe je Kante) kann mit einer eigenen Migration auf Objekte umstellen.
- **Alternative**: Wanddicke je Raum. Verworfen, weil der Nutzer „je Wand“ gewählt hat: Außen- und Innenwände eines Raums sind verschieden dick.
- Ein neu gezeichneter Raum bekommt `Array(n).fill(DEFAULT_WALL_THICKNESS_CM)` in `app-store.ts` dort, wo der Zeichen-Entwurf zum Raum wird (`pointsCm: draft.points`). `app-settings` ersetzt die Konstante später durch die Einstellung.

### 2. Bandumriss: `wallBandOutline(points, thicknesses)` in `room-geometry.ts`

- Liefert ein Polygon, das den Raum samt Band umschließt:
  1. Jede Kante i wird um `t[i]` entlang ihrer Außennormalen verschoben (`edgeFrame(...).outward`).
  2. An jeder Ecke wird der Schnittpunkt der beiden verschobenen Geraden genommen.
- **Sonderfälle**:
  - Nahezu parallele Nachbarkanten (|Kreuzprodukt| < 1e-9) bekommen zwei Punkte: das Ende der einen verschobenen Kante und den Anfang der nächsten. Das ergibt eine Stufe, wenn die Dicken verschieden sind.
  - **Gehrungsgrenze**: Liegt der Schnittpunkt weiter als `2 × max(t[i], t[i+1])` von der Ecke entfernt (sehr spitze Winkel), werden ebenfalls die beiden Endpunkte genommen (Abschrägung). Das entspricht dem bisherigen `miterLimit = 2`.
- **Darstellung**: `RoomsLayer` zeichnet je Raum dieses Polygon gefüllt (`fill = WALL_COLOR`) statt des Strichs. Danach kommen wie bisher die Innenflächen aller Räume und die Lücken mit `destination-out`. Die Innenfläche des eigenen Raums schneidet das Polygon innen frei, übrig bleibt genau das Band.
- **Alternative**: je Kante ein Viereck plus Eckstücke. Verworfen: Bei verschiedenen Dicken müsste man die Eckstücke einzeln berechnen. Das gefüllte Polygon löst Ecken, Stufen und konkave Ecken (L-Raum) in einem Schritt.
- **Tests** (Rechteck (0|0)–(500|400) in beiden Umlaufrichtungen):
  - alle Kanten 15 cm → Ecken (−15|−15), (515|−15), (515|415), (−15|415)
  - oben 36,5 cm, links 15 cm → Ecke (−15|−36,5)
  - L-Raum mit konkaver Ecke
  - drei kollineare Punkte mit 15 cm und 24 cm → Stufe
  - spitzes Dreieck → Abschrägung

### 3. Öffnungen und Wanddicke

- `windowSymbol(frame, o, thicknessCm)`: Das Rechteck reicht von 0 bis `thicknessCm` nach außen, die Mittellinie liegt bei `thicknessCm / 2`.
- `openingGap(frame, o, thicknessCm)`: Die Lücke reicht nach außen bis `max(OPENING_CUT_DEPTH_CM, thicknessCm)`, innen weiter 1 cm. Bei Wänden bis 40 cm ändert sich also nichts.
- `nearestRoomEdge`: Der Band-Treffer gilt von 0 bis `room.wallThicknessCm[edgeIndex]` außen.
- Wer `edgeFrame` mit einer Öffnung nutzt, bekommt die Dicke aus `room.wallThicknessCm[opening.edgeIndex]`, also `OpeningsLayer`, `RoomsLayer` (Lücken) und die Trefferfläche.
- Das Türblatt bleibt, wie es ist. Es beginnt an der Kante (Innenseite der Wand), wie bisher.

### 4. Einpassen

- `floorContentBounds` nimmt je Raum die Bounding-Box von `wallBandOutline` statt „Box ± 15 cm“. Das ist genauer und braucht keine weitere Konstante.

### 5. Panel und Feldlogik

- `applyWallThicknessField(room, index, text)` in `room-fields.ts` → `RoomFieldResult<number[]>`:
  - `parseDecimal`, Rundung auf 0,1 cm (`roundCm`)
  - ≤ 0 → „Muss größer als 0 cm sein“, > 100 → „Darf höchstens 100 cm sein“
  - unveränderter Wert → `value: null`
- `RoomPatch` bekommt `wallThicknessCm?: number[]`. `updateRoom` prüft wie bisher mit `RoomSchema`. Eine Dicke ändert keine Eckpunkte, also gibt es kein `reanchorOpenings`.
- **`EdgesSection`**: Je Kante eine Zeile im `FieldGrid` (2 Spalten): links `Kante n` (Länge), rechts `Wand` (Dicke), beide mit Einheit cm. Ein `onFocus`/`onBlur` um die Zeile setzt die Hervorhebung für beide Felder. Das barrierefreie Label des Wandfelds lautet „Wand an Kante n“, sichtbar ist „Wand“.
- **Verlauf**: Jede übernommene Dicke ist ein `updateRoom` und damit ein Schritt.
  - **Achtung**: `resolveHistoryFocus` in `plan-diff.ts` prüft heute nur Name und `pointsCm` per Referenz. Sind beide gleich, gilt die Änderung als reine Öffnungsänderung. Ohne geänderte Öffnung ist dann nichts ausgewählt, und das widerspräche dem Szenario „Wanddicke rückgängig“.
  - Die Bedingung wird deshalb verallgemeinert: Der Raum ist der Fokus, sobald sich irgendein Feld außer `openings` unterscheidet (Name, Ecken, Wanddicken und später weitere Felder wie `color`). Verglichen wird je Feld per Referenz bzw. Wert. Nur wenn ausschließlich `openings` anders ist, gilt der Öffnungszweig.
  - Tests in `plan-diff.test.ts`: reine Dickenänderung → Raum-Fokus. Reine Öffnungsänderung → weiter Öffnungs-Fokus.

### 6. Import

- `readRoom` in `plan-import.ts` prüft den Raum zuerst ohne `wallThicknessCm`: Die rohe Liste wird vorab durch eine bereinigte ersetzt.
- Bereinigung `sanitizeWallThicknesses(raw, edgeCount)`: Jede gültige Zahl im Bereich (0, 100] an Index i < edgeCount bleibt. Alles andere wird 15 cm, Überzähliges fällt weg.
- Wurde dabei etwas ersetzt oder verworfen (außer ein komplett fehlendes Feld bei Version 6, das wie „ungültig“ zählt), entsteht ein Eintrag in `wallIssues: { floorId, roomName }[]`. `hasWarnings` berücksichtigt ihn.
- Der Dialog listet „„Bad“ (Obergeschoss): Wanddicke ungültig, 15 cm verwendet“.
- Ältere Dateien (≤ 5) erhalten das Feld vorher durch die Migration und erzeugen deshalb keinen Eintrag.
- **Alternative**: ungültigen Raum ganz verwerfen. Verworfen: Ein Raum mit richtigen Innenmaßen ist mehr wert als eine falsche Wanddicke.

## Risks / Trade-offs

- [Sehr dicke Wände an sehr kurzen Kanten können ein Bandpolygon erzeugen, das sich selbst schneidet] → Gefüllt wird mit der Nonzero-Regel von Canvas. Das sichtbare Ergebnis bleibt ein geschlossenes Band, und das Innere wird ohnehin ausgeschnitten. Ein Test mit 100 cm an einer 20-cm-Kante sichert, dass kein Punkt `NaN` ist.
- [Ein dickes Außenband kann in einen Nachbarraum ohne Abstand ragen] → Es wird wie bisher am Inneren jedes Raums abgeschnitten (`destination-out` aller Innenflächen).
- [Lücke ≥ Wanddicke schneidet bei dicken Wänden tiefer in Nachbarbänder] → Nur auf der Breite der Öffnung, wie bisher.
- [Formatversion 6 ist für ältere App-Stände unlesbar] → wie bei jeder Erhöhung: Der Plan wird als unlesbar gesichert, die Sicherung vor der Migration bleibt erhalten.

## Migration Plan

- `PLAN_MIGRATIONS[5]` wandelt Pläne der Version 5 beim Start und beim Import um.
- Fixture `__fixtures__/plan-v5.json` (Räume mit Öffnungen, ohne Wanddicken) wird eingefroren, ein Test hebt sie auf Version 6.
- Zurückrollen: Ein älterer App-Stand liest v6 nicht. Der Plan lässt sich über eine Exportdatei der Version 5 wiederherstellen, sofern vorhanden.
