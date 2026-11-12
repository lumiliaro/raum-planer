# Design

## Context

- **Ausgangslage nach `floors-in-plan` und `floor-underlay`**:
  - Plan v3 `{ schemaVersion, name, createdAt, updatedAt, activeFloorId, floors, underlayByFloor, shapesByFloor }`.
  - Die Zeichenfläche arbeitet in cm (Stage-Skalierung = Bildschirmpixel je cm). Die Vorlage liegt optional darunter.
  - Form-Werkzeuge brauchen keine Kalibrierung mehr.
  - Das Einpassen richtet sich nach dem Inhalt der Etage (Vorlage, Möbel).
- **Formen heute**: Formen sind Konva-Gruppen in `ShapesLayer`/`ShapeNode`, die Auswahl ist `selectedShapeId` im Store, der Transformer ist `SelectionTransformer`.
  - Die Rasterlogik liegt in `src/lib/snap.ts` (`snapDelta`, `snapStepCm`), Alt als Feinraster über `useAltKeyRef`.
  - Formulare bauen auf `NumberField`, `TextField` und `useCommitField` auf: Übernahme mit Enter oder Verlassen, Hinweis bei ungültiger Eingabe.
  - Tastenkürzel liegen in `useShapeShortcuts`. `canvasInteraction.active` sperrt Rückgängig während des Ziehens.
- **Verlauf** (`editing-extras`): `zundo` speichert `{ plan }`, `plan-diff.ts` vergleicht per Referenz je Etage und bestimmt, welche Etage und welche Form nach einem Schritt im Blick sind.
- **Import** (`plan-import.ts`): Formen werden einzeln geprüft, ungültige mit deutschem Grund aus `shape-issues.ts` gemeldet, doppelte IDs neu vergeben.
- Anforderungen: `specs/floor-rooms` sowie die Deltas zu `plan-data`, `plan-import`, `plan-export`, `edit-history`, `shape-editing` und `workspace-layout`.

## Goals / Non-Goals

**Goals:**
- Die gesamte Geometrie ist reine Logik in `src/lib/` und mit Vitest getestet: Gültigkeit, Kantenlänge ändern, Einrasten beim Zeichnen, Namensposition.
- Das Zeichnen eines Raums ist bis zum Schließen reiner Sitzungszustand. Erst der fertige Raum landet im Plan und bildet einen einzigen Rückgängig-Schritt.
- Räume und Formen teilen sich die Zeichenfläche, ohne dass Formen anders zu bedienen sind als bisher.

**Non-Goals:**
- Keine echte Wandgeometrie (Offset-Polygone, Gehrungen). Das Wandband entsteht nur in der Darstellung.
- Keine Prüfung, ob Räume einander überlappen. Überlappende Räume sind erlaubt und sehen eben so aus.
- Keine eigenen Rasterlinien. Die Zeichenfläche bleibt, wie `floor-underlay` sie liefert.

## Decisions

### 1. Datenmodell und Formatversion 4

```ts
const RoomSchema = z.object({
    id: z.uuid(),
    name: z.string().trim().min(1).max(40),
    pointsCm: z.array(PointCmSchema).min(3),
})
    .refine(hasNoZeroEdges, { message: "Edge of 0 cm", path: ["pointsCm"] })
    .refine(isSimplePolygon, { message: "Outline intersects itself", path: ["pointsCm"] });

PlanSchema v4 = v3 + roomsByFloor: z.record(z.string(), z.array(RoomSchema))
```

- `pointsCm` sind **absolut** in cm, nicht relativ zu einem Mittelpunkt wie beim Polygon unter den Formen. Ein Raum hat keine Drehung und keinen Spiegel. Verschieben verschiebt alle Punkte.
  - Alternative: Mittelpunkt plus relative Punkte wie bei `polygon`. Verworfen, weil Räume aneinander anschließen und Ecken auf gemeinsamen absoluten Koordinaten liegen sollen. Absolute Punkte machen Einrasten und Vergleichen einfach.
- Der Umriss ist implizit geschlossen: Die letzte Kante läuft vom letzten zum ersten Punkt. „Kante i“ (1-basiert in der Oberfläche) läuft von Punkt i zu Punkt i+1.
- **Überschneidung wird geprüft**: Nicht benachbarte Kanten dürfen sich nicht schneiden oder berühren, benachbarte nur im gemeinsamen Eckpunkt (keine Rückläufer auf derselben Linie). Gerechnet wird in O(n²), bei Räumen mit unter 50 Ecken vernachlässigbar.
  - Alternative: keine Prüfung. Verworfen, denn die Regel zum Ändern von Kantenlängen kann sonst unbemerkt Schleifen erzeugen, und ein überschnittener Umriss hat kein sinnvolles „Innen“.
- **Toleranz**: Punkte werden auf 0,1 cm gerundet (wie Kalibrierpunkte auf 0,1 px). Eine Kante gilt ab 0,1 cm als vorhanden. Geometrische Vergleiche nutzen ε = 0,01 cm.
- `PlanSchema.superRefine` erweitert die Konsistenzprüfung aus `floors-in-plan`: Die Schlüssel von `roomsByFloor` entsprechen genau den Etagen-IDs, und Raum-IDs sind planweit eindeutig.
- **Migration 3 → 4** in `PLAN_MIGRATIONS[3]`: Sie arbeitet auf Rohdaten und setzt `roomsByFloor = Object.fromEntries(floors.map(f => [f.id, []]))`, sofern `floors` ein Array von Objekten mit String-`id` ist. Sonst bleibt `{}`, und die Importprüfung bzw. `PlanSchema` entscheidet. Gespeicherte Pläne im Browser werden über denselben Mechanismus wie in `floors-in-plan` umgewandelt.
- Eine eingefrorene Fixture `__fixtures__/plan-v3.json` (aus `floor-underlay`, falls dort nicht schon angelegt) wird im Test bis Version 4 importiert.
- Neuere Dateien (v5 aus `room-openings`) enthalten `openings` in Räumen. Zod entfernt unbekannte Felder, und der Dialog warnt wie bisher vor verlorenen Angaben.

### 2. Reine Logik

| Datei | Inhalt |
| --- | --- |
| `src/lib/room-geometry.ts` | `edgeLengthsCm(points)`, `hasNoZeroEdges(points)`, `isSimplePolygon(points)`, `segmentsIntersect(a,b,c,d)`, `boundsCm(points)`, `labelPointCm(points)`, `containsPoint(points, p)`, `translatePoints(points, dx, dy)`, `setEdgeLength(points, index, lengthCm)` |
| `src/lib/room-drawing.ts` | `snapDirection(from, pointer, free)`, `pointAtDistance(from, direction, lengthCm)`, `snapToCorner(pointer, corners, radiusCm)`, `canAppendPoint(points, p)`, `canClose(points)`, `roundPointCm(p)` |
| `src/lib/plan.ts` (erweitert) | `addRoom`, `updateRoom(plan, floorId, id, patch: { name?, pointsCm? }, now)`, `moveRoom(plan, floorId, id, dx, dy, now)`, `removeRoom`, `nextRoomName(rooms)`; `removeFloor` entfernt auch `roomsByFloor[id]` |
| `src/lib/shape-issues.ts` (erweitert) | `describeRoomIssue(zodError, raw)` → „Name fehlt“, „Name ungültig“, „Weniger als 3 Eckpunkte“, „Eckpunkt ungültig“, „Kante mit 0 cm“, „Umriss überschneidet sich“, sonst „Angaben ungültig“ |

- **`setEdgeLength(points, i, L)`** (0-basiert):
  - Es wird `d = L − |P(i+1) − P(i)|` berechnet, mit `u` als Einheitsvektor der Kante i.
  - Die Punkte `P(i+1)` und `P(i+2)` (Indizes modulo n) werden um `d·u` verschoben. Kante i ändert ihre Länge, Kante i+1 wird parallel verschoben, Kante i+2 gleicht aus. Alle übrigen Kanten bleiben unverändert.
  - Ergebnis ist `{ ok: true, points } | { ok: false, reason: "too-short", edgeIndex } | { ok: false, reason: "intersects" }`. Die Punkte werden gerundet.
  - **Rechteck und rechtwinklige Umrisse**: Kante i+2 läuft parallel zu Kante i, also bleiben alle Winkel erhalten.
  - **Schräge Kanten**: Kante i+2 ändert Länge und Winkel. Das ist so gewollt, die Regel bleibt einfach und vorhersehbar.
  - **Dreieck** (n = 3): Verschoben werden die beiden Punkte außer P(i). Kante i+1 wird verschoben und Kante i+2 (von P(i+2) zurück zu P(i)) gleicht aus. Es gibt keinen Sonderfall, das Beispiel steht als Szenario in der Spec.
  - Alternative: den Startpunkt der Kante verschieben oder beide Enden je halb. Verworfen, weil sich dann auch der Raum „davor“ bewegt und man beim Abtragen vom Scan nicht mehr weiß, welche Ecke stehen bleibt.
- **`snapDirection`**: Ohne `free` wird auf die nächste der vier Achsen projiziert (`|dx| ≥ |dy|` → waagerecht), mit `free` bleibt die Richtung des Mauszeigers. Bei Abstand 0 gibt es keine Richtung (`null`), und Enter mit Länge wirkt nicht.
- **`labelPointCm`**: Der Flächenschwerpunkt, falls er im Raum liegt. Sonst die Mitte des längsten waagerechten Schnitts durch die Höhe des Schwerpunkts, z. B. bei L-Formen. Das ist ohne Optimierung gut genug.
- **`nextRoomName`**: kleinstes n ≥ 1, für das kein Raum der Etage „Raum n“ heißt.

### 3. Store

- **Auswahl**: neues Feld `selectedRoomId: string | null` neben `selectedShapeId`.
  - `selectShape(id)` setzt `selectedRoomId = null` und `selectRoom(id)` setzt `selectedShapeId = null`.
  - Selektor `selectSelectedRoom(state)` analog zu `selectSelectedShape`.
  - Etagenwechsel, Kalibrier-Modus und Import setzen beide zurück (`RESET_TOOL_AND_SELECTION` erweitert).
  - Alternative: eine Union `selection: { kind, id } | null`. Verworfen, weil das jede Stelle anfasst, die heute `selectedShapeId` liest (Transformer, Panel, Kürzel, Verlauf). Zwei Felder mit gegenseitigem Zurücksetzen sind in sich genauso eindeutig.
- **Zeichnen**: `roomDraft: { points: PointCm[]; lengthText: string } | null`. Das ist Sitzungszustand und nicht im Verlauf (`partialize` speichert nur `plan`).
  - Aktionen: `addDraftPoint`, `removeLastDraftPoint`, `setDraftLength`, `commitDraftLength(direction)`, `closeDraft()`, `cancelDraft()`.
  - `closeDraft` legt den Raum über `planOps.addRoom` an, wählt ihn aus und setzt das Werkzeug auf „select“.
  - Die Mausposition ist kein Store-Zustand. Sie lebt im `RoomDraftLayer`, um bei jeder Mausbewegung keine Store-Änderung auszulösen.
- **Werkzeug**: `ActiveTool = "select" | InsertableKind | "room"`. `isToolEnabled` gibt für „room“ außerhalb des Kalibrier-Modus immer `true` zurück. `setActiveTool` und Etagenwechsel verwerfen `roomDraft`.
- **Raum-Aktionen**: `updateRoom`, `moveRoom` und `removeRoom` (für den Kopf „Löschen“ auch `deleteSelectedRoom`) über `applyPlan`, damit jede Aktion genau einen Schritt bildet.
- **Kürzel**: `useShapeShortcuts` leitet `Entf`/Rücktaste an den Raum weiter, wenn ein Raum ausgewählt ist.
  - Bei aktivem `roomDraft` gilt eine eigene Behandlung: Ziffern, Komma und Punkt füllen `lengthText`. Rücktaste löscht ein Zeichen oder den letzten Punkt. Enter übergibt die Länge oder schließt den Umriss. Esc verwirft.
  - Strg+Z/Strg+Y sind während des Zeichnens wirkungslos (`canvasInteraction.active` bleibt bei aktivem Draft gesetzt).
  - Die Umschalttaste für „freier Winkel“ wird wie Alt über einen Ref verfolgt (`useShiftKeyRef`).

### 4. Darstellung

Zwei Ebenen unter dem `ShapesLayer`, über der Vorlage:

1. **`RoomsLayer` – Wände** (eigene Konva-`Layer`, also eigene Canvas):
   - Jeder Raum wird als geschlossene `Line` mit `stroke = #3F3F46` und `strokeWidth = 2 × 15 cm` gezeichnet, in cm-Koordinaten mit `strokeScaleEnabled = true`, `lineJoin = "miter"`.
   - Danach wird jedes Raum-Polygon gefüllt mit `globalCompositeOperation = "destination-out"` gezeichnet.
   - So bleibt nur der Teil der Bänder außerhalb aller Räume stehen: Innenhälften und das Hineinragen in Nachbarräume sind ausgestanzt. Eine Lücke von 11,5 cm zwischen zwei Räumen wird von beiden 15-cm-Bändern ganz gefüllt.
   - Diese Ebene hört nicht auf Klicks (`listening = false`).
2. **`RoomsLayer` – Flächen**:
   - Je Raum eine geschlossene `Line` mit `fill = #FFFFFF`, `opacity = 0.5`, ohne Rand. Sie ist Klickfläche für die Auswahl.
   - Dazu der Name an `labelPointCm` in fester Bildschirmgröße wie die Beschriftungen der Formen (Inter 12 px/500, `#52525B`), ohne Klicks.
   - Der ausgewählte Raum bekommt zusätzlich einen 2-px-Umriss in `--selection`. Hat ein Kantenfeld den Fokus, wird diese Kante mit 4 px in `--selection` hervorgehoben (`focusedEdgeIndex` als Sitzungszustand im Panel, über einen kleinen Store-Wert `highlightedEdge`).

- **Alternative zum Ausstanzen**: opake Flächen über den Bändern (ursprüngliche Idee). Verworfen, weil die Vorlage dann im Raum verschwindet und man beim Nachzeichnen nichts mehr sieht.
- **Alternative**: echte Offset-Polygone mit Loch. Verworfen, weil das deutlich mehr Geometrie ist (Gehrungen, Spitzen) und das Hineinragen in Nachbarräume trotzdem gesondert behandelt werden müsste.

- **`RoomDraftLayer`** liegt über allem, solange `activeTool === "room"`:
  - die gesetzten Kanten (2 px dunkel)
  - die Gummiband-Kante zum eingerasteten Punkt (gestrichelt), rot, wenn `canAppendPoint` falsch ist
  - eine Längenbeschriftung in cm mit einer Nachkommastelle in der Mitte der Kante
  - einen Ring am Startpunkt bzw. an einer Einrast-Ecke
  - das Längenfeld als HTML-Overlay am Mauszeiger, sobald `lengthText` nicht leer ist (angezeigter Text plus „cm“, Hinweis bei ungültiger Länge)
  - Der Einrast-Radius von 8 Bildschirmpixeln wird über die aktuelle Skalierung in cm umgerechnet.
- Im Kalibrier-Modus werden beide Ebenen nicht gerendert, wie die Formen.

### 5. Auswählen und Verschieben

- Klick-Reihenfolge in `FloorCanvas.onClick` bei „select“: zuerst Transformer-Anfasser, dann Form (`SHAPE_NODE_NAME`), dann Raum (`ROOM_NODE_NAME` auf der Flächen-`Line`), sonst Auswahl aufheben. Weil Formen über den Räumen liegen, trifft Konva die oberste Form von selbst.
- **Ziehen**: Nur die Flächen-`Line` des **ausgewählten** Raums ist `draggable`. Das Ziehen nutzt dieselbe Logik wie bei Formen: `canvasInteraction.active` während des Ziehens, Versatz relativ zur Startlage mit `snapDelta(…, snapStepCm(alt))`, beim Loslassen `moveRoom(dx, dy)`, also ein Schritt.
  - Nicht ausgewählte Räume sind nicht ziehbar, und das Ziehen verschiebt dann die Stage.
  - Alternative: alle Räume ziehbar. Verworfen, weil Räume fast die ganze Zeichenfläche bedecken und man die Ansicht sonst kaum noch verschieben könnte.
- Kein Transformer und keine Eckpunkt-Anfasser für Räume (siehe Nicht im Umfang).

### 6. Eigenschaften-Panel

- `PropertiesPanel` zeigt `RoomProperties`, wenn `selectSelectedRoom` einen Raum liefert, sonst wie bisher. Der Leertext lautet „Wähle eine Form oder einen Raum aus“.
- `RoomProperties`:
  - Kopf mit Raum-Icon, „Raum“ und „Löschen“
  - `PropertySection` „Name“ mit `TextField`. Leer → „Bitte einen Namen eingeben“, mehr als 40 Zeichen → „Höchstens 40 Zeichen“.
  - `PropertySection` „Kanten“ mit `EdgesSection`: je Kante ein `NumberField` „Kante n“ in cm, größer als 0. Übernahme über `setEdgeLength`. Bei `too-short` lautet der Hinweis „Geht nicht: Kante n würde zu kurz“, bei `intersects` „Geht nicht: Der Umriss würde sich überschneiden“.

### 7. Verlauf

- `plan-diff.ts`:
  - `sameContent` vergleicht zusätzlich `roomsByFloor[id]` je Etage per Referenz.
  - `resolveHistoryFocus` liefert zusätzlich `roomId`: Ist genau eine Etage geändert und darin genau ein Raum hinzugefügt oder geändert, der danach existiert, ist das dieser Raum. Ist in demselben Schritt auch eine Form betroffen, hat die Form Vorrang. Das kommt heute nicht vor, weil kein Schritt beides ändert.
- `history.ts` setzt `selectedRoomId` und `selectedShapeId` entsprechend, sodass höchstens eines gesetzt ist.

### 8. Import, Export, Etagen löschen, Einpassen

- `analyzePlanFile`:
  - Ein neuer Schritt nach den Formen geht `roomsByFloor` je übernommener Etage durch, prüft jeden Raum mit `RoomSchema` und meldet ungültige als `invalidRooms: { floorId, name, reason }`.
  - Name im Bericht: `name`, falls ein nicht leerer String, sonst „Raum“.
  - Räume unter unbekannten Kennungen kommen in `unknownFloors` mit einer eigenen Namensliste `roomNames`. Doppelte Raum-IDs zählen `reassignedRoomIds`.
  - `countsByFloor` bekommt eine Schwester `roomCountsByFloor`. Fehlt `roomsByFloor` oder die Liste einer Etage, gibt es eine leere Liste ohne Warnung.
- `ImportDialog`:
  - Zeile „n Räume werden übernommen“ mit Aufteilung je Etage, nur wenn die Datei Räume hat.
  - Ungültige Räume erscheinen bei den ungültigen Formen.
  - Bei unbekannten Etagen nennt der Dialog die Räume nach den Formen.
- Der Export braucht keine Änderung, weil `serializePlan` den ganzen Plan schreibt. Ein Test prüft `roomsByFloor` in der Datei.
- `FloorsDialog`: Die Rückfrage beim Löschen zählt Räume mit („mit 2 Formen und 3 Räumen“, bei nur Räumen „mit 3 Räumen“). Die Bedingung für die Rückfrage wird um „hat Räume“ erweitert.
- Einpassen: Die Inhaltsgrenzen, wie `floor-underlay` sie bildet, werden um `boundsCm` aller Räume plus 15 cm Wandband erweitert.

### 9. Werkzeugleiste

- Neuer Eintrag in `TOOLS` nach „Tür“, mit Trennlinie davor: `{ id: "room", name: "Raum", hint: "Innenmaße nachzeichnen", key: "G", icon: <lucide SquareDashed oder eigenes Icon>, shapeTool: false }`.
- `G` ist frei (belegt sind V, R, E, L, U, C, T sowie `+`, `-`, `0`).
- Der Cursor über der Zeichenfläche ist bei „Raum“ ein Fadenkreuz.

## Risks / Trade-offs

- [`destination-out` braucht eine eigene Ebene, sonst stanzt es auch die Vorlage aus] → Die Wände bekommen eine eigene Konva-`Layer`. Ein Test der Darstellung ist manuell (Browser-Prüfung in tasks.md).
- [Das Wandband an spitzen Winkeln wird mit `lineJoin = "miter"` sehr lang] → `miterLimit` auf 2 setzen. Bei spitzen Winkeln wird die Ecke abgeschnitten, was optisch genügt.
- [Halbtransparente Flächen machen Möbel- und Raumfarben je nach Vorlage unterschiedlich hell] → Akzeptiert. Wer die Vorlage ausblendet, sieht reines Weiß auf dem Hintergrund der Zeichenfläche.
- [Kantenlänge ändern verschiebt bei schrägen Umrissen auch den Winkel von Kante i+2] → In der Spec dokumentiert. Bei Rechtecken und rechtwinkligen Räumen, dem Normalfall, tritt es nicht auf.
- [Tippen von Ziffern während des Zeichnens kollidiert mit Tastenkürzeln] → Ziffern sind heute nicht belegt, außer `0` für Einpassen. Bei aktivem Draft gilt `0` als Ziffer. Einpassen geht dann über die Zoom-Leiste.
- [Zwei Auswahlfelder im Store können durch einen Fehler gleichzeitig gesetzt sein] → Ein Store-Test prüft, dass `selectShape` und `selectRoom` einander zurücksetzen, ebenso der Verlauf.

## Migration Plan

- `PLAN_SCHEMA_VERSION` 3 → 4, Migration `PLAN_MIGRATIONS[3]`, Fixture der Version 3, Test „v1-Fixture und v3-Fixture importieren bis v4“.
- Der gespeicherte Plan im Browser wird beim ersten Start umgewandelt. Die Rohdaten der Vorgängerversion sichert `floors-in-plan`.
- Rückweg: Eine ältere App-Version hält einen Plan der Version 4 für unlesbar und sichert ihn. Dateien der Version 4 importiert sie als „neuere Version“ ohne Räume.
