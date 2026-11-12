# Design

## Context

- **Ausgangslage nach `wall-thickness`** (Formatversion 6):
  - `Opening { id, kind: "door" | "window", edgeIndex, offsetCm, widthCm, swing }`. Die Regel lautet `(kind === "door") === (swing !== null)`.
  - Je Kante gibt es eine Wanddicke (`room.wallThicknessCm`).
  - `openingGap(frame, o, thicknessCm)` schneidet jede Öffnung mit `destination-out` aus allen Bändern.
  - `windowSymbol(frame, o, thicknessCm)` liefert das Rechteck von der Kante bis zur Außenseite der Wand.
- **Werkzeuge**:
  - `ActiveTool` enthält `"door-opening"` und `"window"`, `TOOLS` hat Einträge mit `requires: "room"`.
  - `insertOpening(kind, pointCm, toleranceCm)` im Store, `createOpening(kind, edgeIndex, frame, tCm, id)` in `opening-placement.ts`.
  - Belegte Tasten: V, R, E, L, U, C, G, T, F. D ist frei.
- **Panel**: `OpeningProperties` mit Kopf, Breite, Abstand zur linken Ecke, bei Türen zusätzlich Aufschlag und Anschlag.
- **Import**: `describeOpeningIssue` kennt „Art unbekannt“, „Aufschlag fehlt“ und „Aufschlag ungültig“. `openingCounts: { doors, windows }`, `formatOpeningCount(doors, windows)`.

## Goals / Non-Goals

**Goals:**
- Der Durchgang ist nur eine dritte Art von Öffnung. Setzen, Ziehen, Neuverankern, Löschen, Verlauf und Import gelten unverändert für ihn.
- Kein neues Datenfeld, nur ein neuer Wert in `kind`.

**Non-Goals:**
- Keine eigene Geometrie für Ecken: Das Eckstück des Bands an einer Kantenecke bleibt stehen (siehe Risiken).
- Keine Prüfung auf Überlappung mit Türen oder Fenstern derselben Kante, wie bisher.

## Decisions

### 1. Datenmodell und Formatversion 7

```ts
OpeningSchema.kind = z.enum(["door", "window", "passage"])
refine: (o.kind === "door") === (o.swing !== null)   // unverändert, deckt passage ab
```

- **Auswirkung auf `schemaVersion`**: 6 → 7. Ein v7-Plan mit Durchgang ist für einen v6-Stand ungültig, daher erhöht sich die Version.
- `PLAN_MIGRATIONS[6]` gibt die Daten unverändert zurück (`(data) => ({ ...data })`). Damit gilt weiter die Regel „für jede Version eine Migration“.
- Fixture `__fixtures__/plan-v6.json` (mit Wanddicken, Tür und Fenster) wird eingefroren.
- **Alternative**: Flag `open: boolean` je Kante. Verworfen, weil der Nutzer „Durchgang als Öffnungsart“ gewählt hat. Außerdem deckt eine Öffnung mit voller Breite auch die ganz offene Kante ab, ohne zweite Logik.
- **Alternative**: Tür mit `swing: null` als Durchgang. Verworfen: Die Regel „Tür hat immer Aufschlag“ ist schon in Spec und Import verankert, und eine eigene Art ist im Panel und beim Zählen eindeutiger.

### 2. Setzen und Werkzeug

- `DEFAULT_PASSAGE_WIDTH_CM = 100` in `opening-placement.ts`. `defaultOpeningWidthCm` bekommt den dritten Fall, `createOpening("passage", …)` setzt `swing: null`.
- `ActiveTool` bekommt `"passage"`. Der `TOOLS`-Eintrag steht direkt unter „Fenster“: `{ id: "passage", name: "Durchgang", hint: "offene Wand", key: "D", icon: PassageIcon, requires: "room" }`.
  - `toolTooltip` liefert damit „Durchgang – offene Wand (D)“ und gesperrt „Durchgang – zuerst einen Raum zeichnen“.
- Die Stelle, die das Werkzeug auf `insertOpening` abbildet, bekommt `passage → "passage"`.
- `PassageIcon` in `shape-icons.tsx`: zwei Wandstücke mit Lücke, im Stil der übrigen Icons (24 × 24, `strokeWidth` 1,75).

### 3. Darstellung und Treffer

- Die Lücke kommt wie bei jeder Öffnung aus `openingGap` und braucht keine Änderung in `RoomsLayer`.
- `OpeningNode` für `kind === "passage"`:
  - Trefferfläche: das Rechteck aus `windowSymbol(frame, o, thicknessCm).outline`, also von der Kante bis zur Außenseite der Wand, transparent gefüllt.
  - Linien: keine. Ist der Durchgang ausgewählt, kommt der Umriss desselben Rechtecks in `SELECTION_COLOR` (2 px, `strokeScaleEnabled = false`) dazu.
  - Ziehen wie bei Tür und Fenster über `dragOffset`.
- **Alternative**: immer gestrichelte Begrenzungslinien an beiden Enden. Verworfen: Auf Bauplänen steht an offenen Stellen nichts, und die Raumfläche zeigt die Grenze schon.

### 4. Panel: „Ganze Kante“

- `applyFullEdge(frame, opening)` in `opening-fields.ts` liefert `{ offsetCm: 0, widthCm: frame.lengthCm }` oder `null`, wenn beides schon so ist (Toleranz `OPENING_FIT_EPS_CM`).
- `OpeningProperties`:
  - Kopf „Durchgang“ mit `PassageIcon`.
  - Für Durchgänge unter den Feldern eine Schaltfläche „Ganze Kante“ (`variant="outline"`, `size="sm"`), gesperrt bei `null`. Ein Klick ruft `updateOpening` mit dem Patch auf, das ist ein Schritt.
  - Aufschlag und Anschlag nur bei Türen, wie bisher.
- **Hinweistexte**: Den Namen der Art liefert eine Funktion `openingKindName(kind)` („Tür“ | „Fenster“ | „Durchgang“). Sie wird in `room-fields.ts` („Geht nicht: Durchgang auf Kante n passt nicht mehr“), im Panel-Kopf und im Import-Dialog genutzt. Heute steht dort jeweils `kind === "door" ? "Tür" : "Fenster"`.

### 5. Import

- `openingCounts` bekommt `passages`. `formatOpeningCount(doors, windows, passages = 0)`:
  - Ohne Durchgänge bleibt der Text wie bisher.
  - Mit Durchgängen: „7 Türen, 4 Fenster und 1 Durchgang“ bzw. „… und 2 Durchgänge“.
- `describeOpeningIssue`: Bei `kind === "passage"` mit `swing ≠ null` lautet der Grund „Aufschlag ungültig“. Die bestehende Logik für Fenster wird auf „keine Tür“ verallgemeinert.

## Risks / Trade-offs

- [Eckstück bleibt stehen: Endet ein Durchgang an einer Ecke, bleibt das Eckstück des Bands (Dicke × Dicke der Nachbarkante) sichtbar] → Es wirkt wie das Wandende der Nachbarwand und ist auf Bauplänen üblich. Soll es weg, ist das ein kleiner Folge-Change (Lücke an der Ecke um die Dicke der Nachbarkante verlängern).
- [Ein Durchgang über die ganze Kante blockiert das Verkürzen dieser Kante („Geht nicht: Durchgang auf Kante 1 passt nicht mehr“)] → Das ist dieselbe Regel wie bei Türen: Maße ändern sich nie stillschweigend. Der Nutzer verkleinert erst den Durchgang. Falls das im Alltag stört, kann ein Folge-Change Durchgänge mit voller Breite automatisch mitwachsen lassen.
- [Ohne Symbol ist ein nicht ausgewählter Durchgang schwer zu treffen, wenn die Wand dünn ist] → Die Trefferfläche reicht über die ganze Wanddicke. Außerdem sieht man die Lücke im Band.
- [Formatversion 7 ist für ältere App-Stände unlesbar] → wie bei jeder Erhöhung.

## Migration Plan

- `PLAN_MIGRATIONS[6]` ist die Identität. Pläne der Version 6 bekommen beim Start und beim Import nur die neue Versionsnummer.
- Zurückrollen: Ein v6-Stand liest v7 nicht. Ohne Durchgänge im Plan genügt es, in einer Exportdatei die Version von Hand auf 6 zu setzen.
