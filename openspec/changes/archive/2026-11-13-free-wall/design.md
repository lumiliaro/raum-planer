# Design

## Context

Wände gibt es bisher nur als Band um einen Raum (`Room.wallThicknessCm`, gezeichnet über `wallBandOutline` in `RoomsLayer.tsx` und `render-floor.ts`). Das Raumzeichnen bringt bereits alles mit, was eine Wand braucht: Richtungsrasten, eingetippte Länge, Eckenrasten, Hilfslinien (`snapToGuides`), Wandlinien mit Abstand und Bezugsende (`wallLines`, `snapToWall`, `WallAnchor`), zusammengeführt in `resolveDraftPointer` (`src/lib/room-drawing.ts`). Die Darstellung des Entwurfs steckt in `RoomDraftLayer.tsx`, der Entwurfszustand in `roomDraft` im Store. Der Plan hat `schemaVersion` 11 und je Etage `roomsByFloor`/`shapesByFloor`.

Motivation und Umfang: siehe proposal.md. Verhalten: siehe `specs/floor-walls/spec.md`.

## Goals / Non-Goals

**Goals:**
- Die Einrast-Logik des Raumzeichnens wiederverwenden statt eine zweite schreiben. Raum- und Wandzeichnen sollen sich gleich anfühlen.
- Freie Wände als eigenständige Plan-Objekte mit eigener Liste je Etage, damit spätere Öffnungen in Wänden (Folge-Change) dort andocken können.
- Bestehendes Raumverhalten bleibt unverändert, alle vorhandenen Tests laufen weiter.

**Non-Goals:**
- Kein gemeinsames Polygon aus Raum- und Wandbändern (keine Boolesche Geometrie).
- Keine Maße freier Wände im PDF (die Option „Maße“ im PDF bleibt bei Räumen und Möbeln); das Band selbst erscheint im PDF.
- Raumzeichnen und Raumziehen bekommen keine Wandlinien oder Hilfslinien von freien Wänden.

## Decisions

### 1. Datenmodell: `Wall` und `wallsByFloor`

```ts
WallSchema = z.object({
  id: z.string().min(1),
  startCm: PointCmSchema,
  endCm: PointCmSchema,
  thicknessCm: z.number().positive().max(MAX_WALL_THICKNESS_CM),
}).refine(w => distanceCm(w.startCm, w.endCm) >= MIN_EDGE_CM)
```
`Plan.wallsByFloor: Record<FloorId, Wall[]>` mit genau den Etagen-IDs als Schlüssel, wie bei `roomsByFloor`. `checkKeyedByFloors` und `checkUniqueIds` bekommen `"wallsByFloor"` als weiteren Schlüssel. `PLAN_SCHEMA_VERSION` steigt von 11 auf **12**. Migration 11 → 12: `wallsByFloor` mit `[]` für jede Etage aus `data.floors` ergänzen (vorhandene Einträge bleiben). Die Migration ist verlustfrei, deshalb gibt es keinen Hinweis.

- *Alternative: Wand als Shape-Kind.* Verworfen (Nutzerentscheidung): Wände lägen dann über Möbeln, hätten Stil, Drehung und Spiegelung, die bei einer Wand keinen Sinn ergeben, und bekämen keine Wandfarbe aus den Einstellungen.
- *Alternative: Mittelpunkt + Länge + Winkel.* Verworfen: Start und Ende passen direkt zu Einrasten, Endgriffen und späteren Öffnungen (Lage auf einer Strecke), und es gibt keine Rundungsdrift durch Winkel.
- Kein `locked`, kein `name`, keine `openings` jetzt. `openings` kommt im Folge-Change mit eigener Migration.

### 2. Reine Logik in `src/lib/`

- `wall-geometry.ts`: `wallLengthCm`, `wallBandOutline(wall, capStart, capEnd)` (Rechteck um die Mittellinie, je Ende optional um `thickness/2` verlängert), `joinedEnds(walls)` (welche Enden genau auf einem Ende einer anderen Wand liegen, Vergleich nach Rundung auf 0,1 cm), `setWallLength(wall, lengthCm)`, `translateWall`, `wallSideLines(wall)` (zwei Seitenlinien), `wallBounds`.
- `wall-drawing.ts`: `resolveWallPointer(start | null, pointer, ctx, opts)` für Start- und Endpunkt, eine Schicht über den Bausteinen aus `room-drawing.ts`:
  - Startpunkt: `snapToCorner` (Raumecken + Wandenden) → `snapToWall` (Wandlinien) → `snapToGuides` beidachsig.
  - Endpunkt: `snapToCorner` → **neu** `snapEndToWallLine` (Schnitt der Mittellinie in Rastrichtung mit der nächsten nicht-parallelen Wandlinie innerhalb des Radius, Schnittpunkt zwischen deren Enden) → `edgeEndAtPointer` + `snapToGuides` quer zur Wand.
  - Hilfslinien-Quellen: Raumecken und Enden der *anderen* Wände (beim Ziehen eines Endgriffs ohne die Enden der gezogenen Wand). Der Startpunkt ist keine Quelle, weil eine Hilfslinie durch ihn nur die Wand selbst oder eine Länge von 0 cm ergäbe.
  - Dieselbe Funktion bedient das Ziehen eines Endgriffs: Das feste Ende ist dann `start`.
- `room-drawing.ts`: `WallLine` wird verallgemeinert. Statt `roomId`/`edgeIndex`/`face` trägt sie eine Quelle `source: { kind: "room"; roomId; edgeIndex; face: "inner" | "outer" } | { kind: "wall"; wallId; side: "left" | "right" }`. `WallAnchor` und `wallLineFor` lösen über diese Quelle auf. `wallLines(rooms)` bleibt für das Raumzeichnen; neu kommt `freeWallLines(walls)`. Das ist ein reines Umbenennen für den Raum-Pfad; bestehende Tests werden nur angepasst, nicht inhaltlich geändert.
  - *Alternative: eigene Kopie für Wände.* Verworfen, weil Rasterlogik, Abstandsanzeige und Tab-Wechsel identisch sind und sonst auseinanderlaufen.
- `plan.ts`: `addWall`, `updateWall` (Patch: `startCm`, `endCm`, `thicknessCm`, mit Validierung), `moveWall`, `removeWall`; `addFloor`/`createEmptyPlan` legen `[]` an, `removeFloor` entfernt die Liste; `planHasContent` zählt Wände.
- `plan-diff.ts`: `floorContentChanged` vergleicht zusätzlich `wallsByFloor[id]`, damit Rückgängig die richtige Etage aktiviert.
- `content-bounds.ts`: `walls` als weiterer Inhalt (Band inkl. Dicke). `pdf-layout.ts` reicht die Wände durch.
- `plan-import.ts`: Wände je übernommener Etage prüfen (`WallSchema.safeParse`), ungültige mit deutschem Grund zählen, unbekannte Etagen melden, doppelte IDs neu vergeben, fehlende Liste ohne Hinweis zu `[]`. Gründe: „Wand hat keine Länge“, „Dicke ungültig“, „Punkte ungültig“.

### 3. Store

- `ActiveTool` bekommt `"wall"`; `TOOLS` einen Eintrag `{ id: "wall", name: "Wand", hint: "einzelne Wand zeichnen", key: "W" }` direkt nach „Raum“ mit eigenem Symbol in `shape-icons.tsx`.
- Kein eigener `wallDraft`: „Wand“ nutzt den vorhandenen Entwurf `roomDraft` mit höchstens einem Punkt (dem Startpunkt). `addDraftPoint` setzt mit „Wand“ zuerst den Start und legt beim zweiten Punkt die Wand an; `commitDraftLength` legt sie im eingetippten Abstand an; `startWallOffset`/`toggleWallOffsetEnd`/`commitWallOffset` wirken für beide Werkzeuge, mit „Wand“ auch auf den Seiten freier Wände; `closeDraft` wirkt nur mit „Raum“. So gelten Rückgängig-Sperre, Verwerfen bei Etagen-/Werkzeugwechsel und die Tasten (`RoomDraftLayer` mit `tool`-Prop) ohne doppelten Code. *(Beim Umsetzen geändert; ursprünglich war ein eigener `wallDraft` geplant.)*
- Auswahl: `selectedWallId`; `selectShape`/`selectRoom`/`selectOpening` und das neue `selectWall` schließen sich gegenseitig aus. `deleteSelection` (Entf/Rücktaste in `useShapeShortcuts.ts`) löscht eine ausgewählte Wand. Kopieren, Ausschneiden, Duplizieren und Umordnen wirken bei einer Wand nicht.
- `moveWall`, `updateWall`, `deleteSelectedWall`: je ein Verlaufsschritt über das bestehende Plan-Ersetzen (zundo). Ziehen schreibt erst beim Loslassen.

### 4. Zeichenfläche

- `WallsLayer.tsx` zwischen `RoomsLayer` und `ShapesLayer`: je Wand ein `Line` (closed) aus `wallBandOutline` in `settings.wallColor`, Gruppe mit `name="wall"` für die Treffererkennung in `FloorCanvas` (wie `ROOM_NODE_NAME`). Die ausgewählte Wand ist ziehbar (`dragBoundFunc` rastet den Versatz mit `snapDelta`), zeigt eine Umrandung in der Auswahlfarbe und zwei Kreis-Griffe. Ein Griff-Drag ruft `resolveWallPointer` mit dem anderen Ende als `start` auf, zeigt eine Vorschau mit Länge und Hilfslinien und schreibt beim Loslassen.
- Maße: `DimensionText` an der Wandmitte, um `thickness/2 +` Abstand seitlich versetzt, Drehung über `readableRotationDeg`.
- Kein eigener `WallDraftLayer.tsx`: `RoomDraftLayer` bekommt `tool: "room" | "wall"`; mit „Wand“ zeigt er das Band zum Mauszeiger und löst über `resolveWallPointer` auf. Die Einrastziele kommen für Vorschau und Klick aus `draftTargets`/`wallSnapTargets` (`wall-drawing.ts`). *(Beim Umsetzen geändert.)*
- PDF (`render-floor.ts`): Wände nach den Räumen zeichnen, gleiche Bandfunktion, ohne Auswahl.
- Panel: `WallProperties.tsx` mit Kopf „Wand“ + „Löschen“, `NumberField` „Länge“ und „Dicke“; Validierung über eine reine Funktion in `src/lib/wall-fields.ts` (wie `room-fields.ts`).
- Rückfrage beim Etagen-Löschen (`FloorsDialog.tsx`): Wandanzahl mitzählen („mit 2 Wänden“); die Formulierung kommt aus einer reinen, getesteten Funktion.

### 5. Ecken schließen statt Gehrung

Treffen zwei Wandenden genau aufeinander, wird jedes Band an diesem Ende um die halbe Dicke verlängert. Bei 90° und gleicher Dicke ergibt das eine saubere, volle Ecke. Bei anderen Winkeln oder Dicken entsteht eine kleine Überlappung oder Kerbe, die bei gleicher Farbe nicht stört.
- *Alternative: echte Gehrung (Schnitt der Außenlinien) wie bei `wallBandOutline` für Räume.* Verworfen für jetzt: braucht Nachbarschaftsgraph und Sonderfälle bei mehr als zwei Wänden an einem Punkt; der optische Gewinn ist klein.

## Risks / Trade-offs

- [Umbau von `WallLine`/`WallAnchor` berührt das Raumzeichnen] → Zuerst den Umbau ohne neues Verhalten machen und die vorhandenen `room-drawing`-Tests grün halten, erst dann die Wandquellen ergänzen.
- [Plan-Literale in vielen Tests und Fixtures brauchen `wallsByFloor`] → Testhelfer zum Erzeugen leerer Pläne nutzen bzw. ergänzen; Fixture `plan-v11.json` für die Migration anlegen.
- [Treffer auf dünnen Wänden bei kleinem Zoom schwer] → `hitStrokeWidth` in Bildschirmpixeln (mindestens ca. 8 px) für das Band.
- [Wand liegt über einem Raum und verdeckt Klicks auf den Raum] → Gewollt: Klick auf das Band wählt die Wand. Der Raum bleibt über seine übrige Fläche wählbar.
- [Endpunkt rastet an einer Wandlinie weit außerhalb des Zeigers] → Der Radius gilt für den Abstand Zeiger–Wandlinie *und* für den Abstand Zeiger–Schnittpunkt (so in der Spec festgelegt); sonst greift die Hilfslinie bzw. Projektion.

## Migration Plan

- `schemaVersion` 11 → 12, Migration in `PLAN_MIGRATIONS[11]`. Gespeicherte Pläne im localStorage werden beim Laden still migriert, importierte Dateien der Version 11 ebenfalls (Hinweis „ältere Version“ wie bisher, aber keine Warnung durch die Umwandlung).
- Dateien der Version 12 lassen sich in einer älteren App-Version nicht öffnen (wie bei jedem Formatwechsel; dort greift „Dateien aus neueren Versionen“).
- Rückbau: Change zurücknehmen. Bereits gespeicherte Pläne der Version 12 lädt die alte App dann nicht mehr; deshalb vor Auslieferung nicht nötig, aber im Changelog erwähnenswert.

## Open Questions

- Genaues Symbol für das Werkzeug „Wand“ (z. B. ein dicker Strich mit zwei Endpunkten) – beim Umsetzen festlegen.
- Feinschliff der Trefferbreite des Bands und der Griffgröße nach Ausprobieren im Browser.
