# Design

## Context

- **Ausgangslage nach `floor-rooms`** (Formatversion 4):
  - `plan.roomsByFloor[floorId]: Room[]` mit `Room { id, name, pointsCm }`, absolute cm, geschlossener Innenumriss ohne Selbstüberschneidung.
  - Die Zeichenfläche arbeitet seit `floor-underlay` in cm.
  - Darstellung von unten nach oben: Vorlage, Wandbänder (15 cm, nur außen, nie im Raum), Raumflächen halbtransparent weiß mit Namen, Möbel. Im Kalibrier-Modus sind Räume ausgeblendet.
  - Auswahl über `selectedShapeId` bzw. `selectedRoomId`; es ist höchstens eines davon gesetzt.
  - Raum-Panel mit „Kante 1 … n“. Die Kantenregel verschiebt bei Kante i die beiden folgenden Eckpunkte entlang Kante i. Hinweise lauten „Geht nicht: …“.
  - Einen Raum verschiebt man durch Ziehen. Eckpunkte lassen sich nicht einzeln ziehen, die Eckenzahl ändert sich nach dem Zeichnen nie.
  - Werkzeug „Raum“ mit Taste G.
- **Vorhandene Bausteine**:
  - `snap.ts` (`snapDelta`, `snapStepCm`): 5-cm- bzw. 1-cm-Raster relativ zur Startlage
  - `shape-fields.ts` (`parseDecimal`, `NOT_A_NUMBER`): Eingaben mit Komma oder Punkt
  - `NumberField`/`useCommitField`: Übernahme mit Enter oder beim Verlassen
  - `SWING_DASH = [6, 4]` und `strokeScaleEnabled = false` in `ShapeNode`: Stil des Möbel-Türaufschlags
  - `shape-issues.ts`: deutsche Gründe für den Import
  - `plan-diff.ts`/`history.ts`: Fokus nach Rückgängig
- **Belegte Tasten**: V, R, E, L, U, C, T, G. Die Taste T geht vom Möbel-Werkzeug „Tür“ auf das neue Werkzeug „Tür“ über, F ist neu.
- Anforderungen: `specs/room-openings`, `specs/plan-data`, `specs/plan-import`, `specs/plan-export`.

## Goals / Non-Goals

**Goals:**
- Die gesamte Geometrie ist in reinen Funktionen gekapselt und getestet: Kante, links/rechts von innen, Lücke, Türblatt, Einsetzen, Ziehen, Neuverankern. Komponenten zeichnen nur.
- Öffnungen hängen am Raum und haben keine eigene Weltposition. Verschieben, Löschen und Rückgängig eines Raums wirken damit automatisch auf seine Öffnungen.
- Die Lücke im Wandband entsteht ohne Fläche in Hintergrundfarbe, damit die Vorlage sichtbar bleibt.

**Non-Goals:**
- Keine Prüfung, ob Möbel im Aufschlag stehen oder Öffnungen sich überlappen.
- Keine Erkennung, welche Kante eines Nachbarraums gegenüberliegt. Die Lücke wird einfach tief genug geschnitten.

## Decisions

### 1. Datenmodell und Formatversion 5

```ts
OpeningSchema = z.object({
  id: z.uuid(),
  kind: z.enum(["door", "window"]),
  edgeIndex: z.number().int().min(0),
  offsetCm: z.number().min(0),        // vom Anfangspunkt der Kante bis zum Anfang der Öffnung
  widthCm: z.number().positive(),
  swing: SwingSchema.nullable(),   // SwingSchema = { hinge: "start" | "end", side: "inside" | "outside" }
}).refine(o => (o.kind === "door") === (o.swing !== null), { path: ["swing"] })

RoomSchema = { ...floor-rooms, openings: z.array(OpeningSchema) }
  .superRefine: edgeIndex < pointsCm.length und offsetCm + widthCm ≤ Kantenlänge (+ 1e-6)
PlanSchema v5: zusätzlich Öffnungs-IDs planweit eindeutig
```

- **Auswirkung auf `schemaVersion`**: 4 → 5. `PLAN_MIGRATIONS[4]` setzt bei jedem Raum-Objekt in `roomsByFloor` `openings: []`, falls das Feld fehlt. Andere Werte bleiben, wie sie sind; die Prüfung danach entscheidet.
- `offsetCm`/`hinge` beziehen sich auf die Kantenrichtung (Anfang → Ende). Die Oberfläche spricht von „links/rechts von innen gesehen“. Die Umrechnung steckt in einer Funktion (Entscheidung 2). So bleibt das Format eindeutig, auch wenn sich die Umlaufrichtung eines Raums nie ändert.
- **Alternative**: Öffnungen als eigene Liste je Etage mit Weltkoordinaten. Verworfen: Eine Tür, die nicht mit dem Raum wandert, wäre ein ständiger Pflegefall, und „auf der Kante“ müsste man dauernd neu prüfen.
- Eine Tür hat immer einen Aufschlag, ein Fenster nie. Die Prüfung erzwingt das. Fehlt der Aufschlag einer Tür beim Import, ist der Grund „Aufschlag fehlt“.
- **Alternative**: diskriminierte Union über `kind`. Verworfen, weil das Panel die Art nie wechselt und eine gemeinsame Form mit einer Regel einfacher zu prüfen und zu migrieren ist.

### 2. Geometrie: `src/lib/opening-geometry.ts`
- `edgeFrame(points, i)` liefert `{ start, end, dir (Einheitsvektor), lengthCm, outward (Einheitsnormale nach außen), leftEnd: "start" | "end" }`.
  - **Außen**: aus dem Vorzeichen der Fläche A (Gaußsche Trapezformel in Bildschirm-Koordinaten, y nach unten). Für A > 0 ist `outward = (dir.y, −dir.x)`, sonst `(−dir.y, dir.x)`.
  - **Links von innen**: Man steht im Raum und blickt nach `outward`, dann ist links `(outward.y, −outward.x)`. Ist `dot(dir, links) > 0`, liegt das Ende links, sonst der Anfang.
  - Getestet mit demselben Rechteck in beiden Umlaufrichtungen: Obere Kante, links ist immer x = 0 cm. Untere Kante, links ist immer x = 500 cm.
- `leftDistanceCm(frame, o)` und `offsetFromLeftDistance(frame, widthCm, d)` rechnen zwischen „Abstand zur linken Ecke“ und `offsetCm` um.
- `hingeFromSide("left" | "right", frame)` und umgekehrt für „Anschlag links/rechts“.
- `openingGap(frame, o)`: Viereck der Lücke von 1 cm innen (gegen Kantenflimmern) bis `OPENING_CUT_DEPTH_CM = 40` cm außen.
- `doorLeaf(frame, o)`: Angelpunkt, Türblatt-Endpunkt (senkrecht zur Kante, Länge = Breite, nach `−outward` für innen bzw. `+outward` für außen), Kreisbogen vom Blattende zum anderen Ende der Öffnung.
- `windowSymbol(frame, o)`: Rechteck von der Kante bis 15 cm (Bandbreite aus `floor-rooms`) nach außen, plus Mittellinie.
- Alles in cm. Gezeichnet wird mit `strokeScaleEnabled = false`.

### 3. Lücke ohne Hintergrundfläche
- Die Wandbänder aus `floor-rooms` werden in einer eigenen Konva-Gruppe gezeichnet (`cache()` bzw. eigener Layer). Für jede Öffnung kommt ein Viereck aus `openingGap` mit `globalCompositeOperation = "destination-out"` in diese Gruppe. Es löscht nur Bandpixel. Vorlage und Raumflächen liegen in anderen Ebenen und bleiben sichtbar.
- **Tiefe 40 cm**: Das deckt das eigene Band (15 cm), eine Innenwand von bis zu 25 cm und das Band des Nachbarraums ab, zwischen Räumen also bis etwa 40 cm Abstand.
- **Alternative**: weißes Rechteck über die Bänder. Verworfen, weil es die Vorlage an dieser Stelle verdeckt (Spec „Vorlage bleibt sichtbar“).
- **Alternative**: Lücke beim Erzeugen des Bandumrisses aussparen. Verworfen, weil das Band des Nachbarraums davon nichts wüsste.
- Die Symbole (Türblatt, Aufschlag, Fenster) liegen in `OpeningsLayer` über den Raumflächen und unter den Möbeln. Jede Öffnung ist ein `OpeningNode` mit einer unsichtbaren Trefferfläche über der Lücke (`hitStrokeWidth` 10 px für Linien).

### 4. Einsetzen: `src/lib/opening-placement.ts`
- `nearestRoomEdge(rooms, pointCm, toleranceCm)`: Für jede Kante jedes Raums wird der Punkt auf die Kante projiziert (t geklemmt auf [0, L]). Zulässig ist ein Treffer im Band, also 0 bis 15 cm außen, oder näher als `toleranceCm` auf beiden Seiten. Es gewinnt der kleinste Abstand. Ergebnis `{ roomId, edgeIndex, tCm } | null`. Die Zeichenfläche übergibt `toleranceCm = 10 / scale`, also 10 Bildschirmpixel.
- `createOpening(kind, frame, tCm, id)`:
  - Breite ist `min(Standard, L)` mit `DEFAULT_DOOR_WIDTH_CM = 80` und `DEFAULT_WINDOW_WIDTH_CM = 120`.
  - Die Mitte liegt bei `tCm`, auf ganze cm gerundet. Danach wird `offsetCm` auf [0, L − Breite] geklemmt.
  - Eine Tür bekommt `swing = { hinge: leftEnd, side: "inside" }`, ein Fenster `null`.
  - 80 cm statt 90 cm passt zur bisherigen Möbel-Tür (ebenfalls 80 cm) und zu üblichen Innentüren.
- `dragOffset(startOffset, alongDeltaCm, step, L, width)`: rastet den Zug über `snapDelta` ein und klemmt auf [0, L − width]. Die Komponente projiziert die Mausbewegung auf `dir` (`dragBoundFunc`). Übernommen wird erst beim Loslassen, also ein Schritt.

### 5. Raumänderungen: `src/lib/opening-reanchor.ts`
- `reanchorOpenings(before, after, openings)` → `{ ok: true, openings } | { ok: false, edgeIndex, kind }`. Die Eckenzahl ist gleich. Je Kante i sind `ds = after[i] − before[i]` und `de = after[i+1] − before[i+1]`:
  - `ds == de` (Verschieben oder unbewegt): `offsetCm` bleibt.
  - `de == 0`, `ds ≠ 0` (Anfang bewegt, Ende liegt): `offsetCm' = L' − (L − offsetCm)`, also gleicher Abstand zum Ende.
  - Sonst: `offsetCm` bleibt.
  - Danach muss `0 ≤ offsetCm'` und `offsetCm' + width ≤ L'` gelten, sonst kommt ein Fehler für die erste solche Kante. Vergleiche mit Toleranz 1e-6 cm.
- Für die Kantenregel aus `floor-rooms` (Kante i ändert sich um Δ) heißt das: Kante i behält den Abstand zum Anfang, Kante i+1 wird verschoben, Kante i+2 behält den Abstand zu ihrem liegengebliebenen Ende. Alle anderen Kanten sind unberührt. Damit bleiben Türen auf dem Grundriss stehen (Spec „Raum wird breiter“).
- **Einbindung**: Die Raum-Operation in `plan.ts`, die Eckpunkte ändert (aus `floor-rooms`), ruft `reanchorOpenings` auf und lehnt bei Fehler ab (gleiches Objekt). Damit das Kantenfeld den Grund nennen kann, ruft die Feldlogik von `floor-rooms` vor dem Übernehmen dieselbe Funktion auf und formuliert „Geht nicht: Tür auf Kante n passt nicht mehr“ (n = edgeIndex + 1).
- **Alternative**: Öffnungen beim Verkürzen automatisch einkürzen oder verschieben. Verworfen: Das System würde stillschweigend Maße ändern, die der Nutzer vom Scan übernommen hat.

### 6. Store und Auswahl
- Neu ist `selectedOpeningId: string | null`. Öffnungs-IDs sind planweit eindeutig, die ID reicht also. Der Selektor `selectSelectedOpening(state)` liefert `{ room, opening } | null` auf der aktiven Etage. Jede Auswahl-Aktion setzt die beiden anderen Auswahlfelder auf `null`, damit immer höchstens eines gesetzt ist.
- Aktionen: `insertOpening(kind, pointCm, toleranceCm)`, `updateOpening(floorId, openingId, patch)`, `removeOpening(floorId, openingId)`. `deleteSelected…` und `Entf`/Rücktaste in `useShapeShortcuts` behandeln die Öffnung.
- Reine Plan-Operationen in `plan.ts`: `addOpening`, `updateOpening` (Merge, danach `RoomSchema` samt Passprüfung, sonst Ablehnung), `removeOpening`. Alle setzen `updatedAt` und behalten unveränderte Räume und Listen per Referenz (für `plan-diff`).
- **Werkzeuge**: `ActiveTool` bekommt `"door-opening"` und `"window"`. `ToolEntry` bekommt `requires: "room"`. `isToolEnabled` verlangt dafür mindestens einen Raum auf der aktiven Etage, und dass der Kalibrier-Modus aus ist. `toolTooltip` nennt dann „– zuerst einen Raum zeichnen“. `DoorIcon` dient dem neuen Werkzeug „Tür“, neu ist `WindowIcon` in `shape-icons.tsx`.
- **Möbel-Werkzeug „Tür“ entfällt** (Entscheidung des Nutzers). Das neue Werkzeug übernimmt Name und Taste („Tür“, T), so bleibt die Gewohnheit „T = Tür“ erhalten, und es gibt keine zwei Werkzeuge gleichen Namens.
  - Der Werkzeug-Eintrag `door-swing` verschwindet aus `TOOLS`.
  - `InsertableKind` und `createShape` in `shape-factory.ts` verlieren `door-swing`.
  - Der Formtyp `door-swing` bleibt in `ShapeSchema`, ebenso Umriss (`outline.ts`), Darstellung (`ShapeNode`), quadratische Größenänderung, Panel und Import. Vorhandene Möbel-Türen funktionieren also unverändert weiter.
  - Die Werkzeug-ID im Code darf `door-opening` heißen.

### 7. Panel: `src/lib/opening-fields.ts` und `OpeningProperties`
- `applyOpeningWidth(frame, opening, text)` und `applyOpeningLeftDistance(frame, opening, text)` liefern `{ ok, patch } | { ok: false, error }`.
  - Eine Breitenänderung hält den Abstand zur linken Ecke fest.
  - Grenzen: Breite > 0 und ≤ L − Abstand („Darf höchstens 340 cm sein“). Abstand ≥ 0 und ≤ L − Breite.
  - Werte werden auf 0,1 cm gerundet wie bei den Formen.
- „Aufschlag“ (Nach innen / Nach außen) und „Anschlag“ (Links / Rechts) sind Segment-Schaltflächen, die die aktuelle Wahl markieren. Jeder Klick ist ein `updateOpening` mit neuem `swing`. Da es keinen Zustand ohne Aufschlag gibt, muss sich das Panel nichts merken.
- Kopf: Icon, „Tür“ bzw. „Fenster“, darunter der Raumname, „Löschen“.

### 8. Verlauf
- `plan-diff.resolveHistoryFocus` wird um Räume erweitert, die `floor-rooms` vorgibt. Zusätzlich gilt: Hat sich genau ein Raum geändert, sind Name und Eckpunkte gleich (Referenz), und ist genau eine Öffnung hinzugekommen oder geändert und danach vorhanden, dann ist der Fokus `{ floorId, openingId }`. `history.ts` setzt dann `selectedOpeningId` statt `selectedRoomId`.
- `sameContent` braucht keine Anpassung: Eine geänderte Öffnung erzeugt ein neues Raum-Objekt und damit eine neue Raumliste.

### 9. Import und Export
- Export: Die Öffnungen sind Teil des Raums und damit automatisch im Plan-JSON.
- `analyzePlanFile`:
  - Jeder Raum wird zuerst ohne `openings` geprüft (Logik aus `floor-rooms`). Danach wird jede Öffnung einzeln mit `OpeningSchema` und der Passprüfung gegen den Raum geprüft.
  - Ungültige Öffnungen kommen nach `invalidOpenings: { floorId, roomName, kind, reason }[]`.
  - Fehlt `openings`, gibt es eine leere Liste ohne Warnung. Ist `openings` keine Liste, entsteht ein Eintrag mit dem Grund „Angaben ungültig“, und der Raum hat keine Öffnungen.
  - Doppelte Öffnungs-IDs bekommen über `newId` eine neue ID, gezählt in `reassignedOpeningIds`.
  - Gezählt wird außerdem `openingCounts: { doors, windows }`.
- `describeOpeningIssue(error, raw, room)` in `shape-issues.ts`: „Art unbekannt“, „Kante unbekannt“, „Breite ungültig“, „Abstand ungültig“, „Aufschlag fehlt“ (Tür ohne `swing`), „Aufschlag ungültig“ (Fenster mit `swing` oder ungültiger Wert), „passt nicht auf die Kante“, sonst `GENERIC_REASON`.
- `formatOpeningCount(doors, windows)` in `format.ts`: „7 Türen und 4 Fenster“, „1 Tür und 1 Fenster“, „0 Türen und 2 Fenster“.
- Fixture `__fixtures__/plan-v4.json` (Räume ohne `openings`) wird eingefroren, ein Test importiert sie bis Version 5.

## Risks / Trade-offs

- [Lückentiefe 40 cm schneidet bei sehr nahen, nicht zusammengehörigen Räumen auch deren Band an] → Nur auf der Breite der Öffnung und nur bei weniger als 40 cm Abstand. Das ist bei Grundrissen eines Hauses unauffällig. Die Konstante ist an einer Stelle änderbar.
- [`destination-out` braucht eine gecachte Gruppe; beim Ziehen eines Raums muss der Cache neu entstehen] → Bei einem Haus mit unter 30 Räumen unkritisch. Notfalls wird während des Ziehens ohne Lücken gezeichnet.
- [Überlappende Öffnungen werden nicht verhindert] → Sie sind sichtbar und leicht zu korrigieren. Die Prüfung ist bewusst nicht im Umfang.
- [Kleine Öffnungen sind bei geringem Zoom schwer zu treffen] → Trefferfläche über die ganze Lücke plus 10 px Linien-Toleranz.
- [Formatversion 5 ist für ältere App-Stände unlesbar] → Wie bei jeder Erhöhung: Die ältere App sichert den Plan als unlesbar, und die Sicherung vor der Migration aus `floors-in-plan` bleibt erhalten.

## Migration Plan

- Beim Start und beim Import wandelt `PLAN_MIGRATIONS[4]` Pläne der Version 4 automatisch um. Die Rohdaten sichert der Mechanismus aus `floors-in-plan`.
- Zurückrollen: Eine Version vor diesem Change liest den v5-Plan nicht. Der Plan lässt sich über eine Exportdatei der Version 4 wiederherstellen, sofern vorhanden.
