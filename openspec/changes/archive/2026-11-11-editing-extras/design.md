# Design

## Context

- **Voraussetzungen:**
  - `plan-model`: Plan als eigenes, unveränderlich ersetztes Teilobjekt `plan` im Store. Reine Funktionen in `src/lib/plan.ts` geben bei Ablehnung dasselbe Objekt zurück; `reorderShape(plan, floorId, id, "forward" | "backward" | "front" | "back", now)`. Autosave reagiert auf eine neue `plan`-Referenz. `locked?: boolean` steht schon im Schema. Die Kalibrierung liegt in `plan.calibrationByFloor`; `saveCalibration` setzt sie über `setCalibration` und beendet den Kalibrier-Modus.
  - `basic-shapes`: `selectedShapeId` und `activeTool` im Store (nur Sitzung), `ShapeNode` (`Group`, `draggable` bei „Auswählen“), `SelectionTransformer`, `ShapeProperties` mit Panel-Kopf (Formtyp, „Löschen“), `useShapeShortcuts` mit `isEditableTarget`. Der Plan ändert sich erst beim Loslassen, nicht während des Ziehens.
  - `shape-properties` (noch nicht geplant): Eigenschaften-Formular mit Abschnitten „Maße“, „Lage“, „Darstellung“; jede Eingabe wird einzeln übernommen.
  - `export-import`: Store-Aktion `replacePlan(plan)`. Außerdem übernimmt der Export-Dialog den eingetragenen Namen über `renamePlan` als Plannamen.
  - `floor-calibration` (umgesetzt): Kalibrier-Entwurf `calibrationDraft` im Store, Kalibrier-Modus über `toggleCalibration`/`endCalibration`.
- **zundo 2.3** (geprüft in `node_modules/zundo/dist/index.js`):
  - `temporal(config, { partialize, equality, limit })` hängt `store.temporal` an.
  - Jedes `set` speichert vorher den partialisierten Zustand als Vergangenheit, außer `equality` meldet „gleich“ oder `pause()` ist aktiv.
  - `undo()`/`redo()` schreiben den alten Zustand über das **unumhüllte** `set` zurück und werden also selbst nicht aufgezeichnet.
  - `limit` entfernt den ältesten Eintrag.
- Anforderungen: siehe `specs/edit-history`, `specs/shape-editing`.

## Goals / Non-Goals

**Goals:**
- Der Verlauf verfolgt nur `plan`, einschließlich der Kalibrierung, die seit `plan-model` dazugehört. Alle übrigen Store-Felder (Auswahl, Werkzeug, Viewports, Panel, Kalibrier-Entwurf, Speicherstatus) bleiben unberührt.
- Die Entscheidungen „welche Etage, welche Auswahl nach Rückgängig“ und „was darf an einer gesperrten Form geändert werden“ sind reine, getestete Funktionen in `src/lib/`.
- Die Sperre wird an **einer** Stelle im Store durchgesetzt, nicht nur über deaktivierte Bedienelemente.

**Non-Goals:**
- Kein Zusammenfassen schneller Formular-Eingaben zu einem Schritt (jede übernommene Eingabe ist ein Schritt).
- Kein Speichern des Verlaufs.

## Decisions

### 1. zundo-Konfiguration

`createAppStore` wird mit `temporal(…, options)` umhüllt:

- `partialize: (s) => ({ plan: s.plan })`.
- `equality: (a, b) => sameContent(a.plan, b.plan)` aus `src/lib/plan-diff.ts`. Verglichen werden `createdAt`, `calibrationByFloor` je Etage über die Referenz des Eintrags und `shapesByFloor` je Etage über die Referenz der Formenliste. `name`, `activeFloorId` und `updatedAt` werden ignoriert. Dadurch erzeugt ein reiner Etagenwechsel (`setActiveFloor` ändert nur `activeFloorId`) keinen Schritt, ebenso wenig ein Umbenennen im Export-Dialog (`renamePlan` ändert nur `name`) oder abgelehnte Änderungen (gleiches Objekt).
  - Voraussetzung: Die Funktionen aus `plan.ts` übernehmen die Formenlisten und Kalibrierungen unveränderter Etagen per Referenz. Ein Test in `plan.test.ts` sichert das ab.
- `limit: 100`. zundo verwirft dann den ältesten Eintrag.
- Neue Schritte leeren die Zukunft (zundo-Standard). Das erfüllt „Neue Änderung verwirft Wiederholen“.
- Alternative **eigener Verlaufs-Stapel**: ca. 40 Zeilen, aber die Projektvorgabe nennt zundo, und es ist schon installiert.
- Alternative **`diff`-Option (nur Unterschiede speichern)**: unnötig. Ein Plan hat wenige hundert Formen, 100 Schnappschüsse teilen sich unveränderte Formen ohnehin per Referenz.

### 2. Rückgängig/Wiederholen mit Nacharbeit: `src/store/history.ts`

`undo(store, now)` und `redo(store, now)`:

1. Nichts tun, wenn der Kalibrier-Modus aktiv ist oder kein Schritt vorliegt.
2. `before = store.getState().plan`, dann `store.temporal.getState().undo()` (bzw. `redo()`), dann `after = store.getState().plan`.
3. `resolveHistoryFocus(before, after)` aus `plan-diff.ts`:
   - `floorId`: die einzige Etage, deren Formenliste oder Kalibrierung sich unterscheidet. Bei mehreren oder keiner gilt `after.activeFloorId`.
   - `shapeId`: die einzige Form dieser Etage, die hinzugekommen ist oder sich geändert hat (Referenzvergleich je ID), sonst `null`. Eine gelöschte Form zählt nicht, sie ist ja nicht mehr vorhanden. Bei einer reinen Kalibrier-Änderung ist keine Form betroffen.
4. Nacharbeit unter `temporal.pause()` … `resume()`:
   - `plan = { ...after, name, activeFloorId: floorId, updatedAt: now }` mit `name = resolveHistoryName(before, after)` aus `plan-diff.ts`: Bei gleichem `createdAt` (derselbe Plan) bleibt `before.name`, sonst (Import rückgängig bzw. wiederholt) gilt `after.name`.
   - `selectedShapeId = shapeId`
   - `activeTool = "select"`

   Ohne `pause` würde die Nacharbeit selbst als Schritt aufgezeichnet (Store-`set` ist umhüllt) und die Zukunft leeren.
5. Etagenwechsel über das Feld, nicht über `setActiveFloor`, damit der Kalibrier-Entwurf und andere Nebenwirkungen von `setActiveFloor` nicht greifen. Die Viewports bleiben je Etage erhalten.

Store-Aktionen `undo()`/`redo()` rufen diese Funktionen mit `now()` aus den Store-Optionen auf. Für die Oberfläche gibt es `useCanUndo()`/`useCanRedo()` über `useStore(useAppStore.temporal, s => s.pastStates.length > 0)`, zusätzlich falsch im Kalibrier-Modus.

- **Planname außerhalb des Verlaufs**: Der Name wird nur im Export-Dialog gesetzt und beschreibt die Datei, nicht den Inhalt. Wäre er ein Schritt, würde Strg+Z nach einem Export zuerst unsichtbar den Namen zurücksetzen. Ignoriert man ihn nur beim Vergleich, würde ein späteres Rückgängig ihn stillschweigend mit einem älteren Schnappschuss zurückdrehen; deshalb behält die Nacharbeit den aktuellen Namen. Ein Import bringt ein anderes `createdAt` mit; nur dann wechselt der Name mit, damit Rückgängig den vorherigen Plan vollständig herstellt.
- `updatedAt = now` bei jedem Rückgängig/Wiederholen (siehe Spec): Der Plan wurde inhaltlich verändert. Ohne das würde die Export-Datei einen veralteten Zeitpunkt tragen.
- Alternative **Etagenwechsel als eigener Verlaufsschritt** (zundo verfolgt `activeFloorId` mit): verworfen. Strg+Z würde dann zuerst nur Etagen zurückblättern.

### 3. Was ein Schritt ist

- Ein Schritt entsteht automatisch bei jedem erfolgreichen `set` auf `plan` mit geändertem Inhalt. Die Store-Aktionen ändern dafür nichts:
  - `insertShape`, `updateShape`, `removeShape`, `reorderShape`, `replacePlan`
  - die Sperre, ein `updateShape` mit `{ locked }`
  - `saveCalibration` (über `setCalibration` aus `plan-model`)
- Ziehen, Drehen, Größe: `basic-shapes` ruft `updateShape` einmal beim Loslassen auf → ein Schritt.
- Formular: Annahme, dass `shape-properties` bei Enter/Verlassen übernimmt. Schreibt es stattdessen bei jedem Tastendruck, muss dort vor der Umsetzung auf „übernehmen bei Enter/Verlassen“ umgestellt werden (Aufgabe 1.1 prüft das).
- Tür-Breite aus `more-shapes` ändert Breite und Mittelpunkt in einem `updateShape`-Aufruf → ein Schritt.
- Import: `replacePlan` ist ein `set` → ein Schritt. Der Verlauf wird beim Import **nicht** geleert, sonst ließe er sich nicht rückgängig machen.
- Der Start (`loadPlan` in `createAppStore`) erzeugt keinen Schritt, der Verlauf beginnt leer.
- **Kalibrierung als Schritt**: Der Verlauf speichert ganze Pläne. Würde `sameContent` die Kalibrierung übersehen, entstünde beim Speichern kein Schritt, und ein späteres Rückgängig einer Form-Änderung würde die neue Kalibrierung stillschweigend durch den älteren Stand ersetzen. Deshalb vergleicht `sameContent` auch `calibrationByFloor`. Punkte setzen und Länge eingeben im Kalibrier-Modus ändern nur den Entwurf und bilden keinen Schritt.

### 4. Tastenkürzel

In `useShapeShortcuts`, nach dem Muster von `basic-shapes`. Rückgängig/Wiederholen wirken überall wie die Schaltflächen, außer `targetOwnsUndo(e.target)` meldet ein Textfeld mit nicht übernommenem Text oder ein Textfeld außerhalb des Eigenschaften-Panels (z. B. im Export-Dialog); dann ist das native Rückgängig im Feld zuständig. Die Felder des Panels kennzeichnen sich dafür über `useCommitField` mit `data-commit-field="clean" | "dirty"`: Nach Enter bleibt der Cursor im Feld, und ohne diese Kennzeichnung würde Strg+Z dort den Plan nie erreichen. Die Bild↑/Bild↓- und Werkzeugtasten bleiben in allen Textfeldern gesperrt.

| Taste | Wirkung |
| --- | --- |
| Strg/⌘+Z | `undo()` |
| Strg/⌘+Umschalt+Z, Strg/⌘+Y | `redo()` |
| Bild↑ / Bild↓ | `reorderShape(…, "forward" / "backward")` bei Auswahl |
| Umschalt+Bild↑ / Umschalt+Bild↓ | `"front"` / `"back"` |

- Alle mit `preventDefault`, damit der Browser nichts anderes auslöst.
- Für Strg+Z wird `e.key.toLowerCase() === "z"` geprüft, denn mit Umschalt liefert `key` „Z“. Auf deutscher Tastatur liegen Z und Y vertauscht; `e.key` meldet die beschriftete Taste und passt damit zu den Tooltips.
- Die bisherige Regel „ohne Strg/Meta/Alt“ gilt weiter für die Werkzeugtasten. Die neuen Kürzel werden davor ausgewertet.
- Alternative **Strg+]/Strg+[ für die Anordnung**: Auf deutscher Tastatur sind die Klammern nur mit AltGr erreichbar. Bild↑/Bild↓ sind ohne Umgreifen erreichbar und sonst in der App unbelegt.

### 5. Sperre: `src/lib/shape-lock.ts`

- `LOCK_ALLOWED_FIELDS = ["label", "style", "locked"]` als **Erlaubnisliste**. Jedes andere Feld gilt als Geometrie, auch Maß-Felder späterer Formtypen (z. B. Polygon-Punkte), ohne dass diese Liste angepasst werden muss.
- `isPatchAllowed(shape, patch)`: `true`, wenn die Form nicht gesperrt ist oder der Patch nur erlaubte Felder enthält.
- `canDelete(shape)`: `!shape.locked`.
- Durchsetzung in den Store-Aktionen `updateShape` und `removeShape`: Bei Verstoß liefern sie `false`, der Plan bleibt gleich und es entsteht kein Schritt.
  - `src/lib/plan.ts` bleibt unverändert. Die Sperre ist eine Bearbeitungsregel, keine Gültigkeitsregel des Datenformats; Import, Rückgängig und Wiederholen sollen gesperrte Formen frei setzen können.
  - `reorderShape` ist für gesperrte Formen erlaubt.
- Entsperren schreibt `locked: false` statt das Feld zu entfernen, ein einfacher Patch. Beides ist laut Schema gültig.
- Alternative **Sperre nur über die Oberfläche**: verworfen. Ein vergessenes Tastenkürzel oder ein späteres Werkzeug würde die Sperre unbemerkt umgehen.

### 6. Gesperrte Form auf der Zeichenfläche

- `ShapeNode`: `draggable = activeTool === "select" && !shape.locked && !calibration`. Ist die `Group` nicht ziehbar, greift Konvas Ziehen auf der Stage: Die Ansicht wird verschoben. Das passt zur Spec, ohne eigenen Code.
- Zeiger über einer gesperrten Form: `default` statt `move`.
- `SelectionTransformer` für gesperrte Formen:
  - `enabledAnchors={[]}`, `rotateEnabled={false}`, damit der blaue Rahmen bleibt.
  - `boundBoxFunc` gibt immer den alten Rahmen zurück. Das schützt zusätzlich, falls Konva doch eine Transformation startet.
- Spiegeln (aus `shape-properties`) ist Geometrie (`mirrored`) und wird von `isPatchAllowed` abgelehnt; die Schaltfläche ist gesperrt.

### 7. Oberfläche

- **Kopfleiste** (`HistoryButtons`): zwei Icon-Schaltflächen 36 px, `Undo2`/`Redo2` aus `lucide-react`, rechts vor „Importieren/Exportieren“ wie im Entwurf.
  - Tooltip über `title`: „Rückgängig (Strg+Z)“, „Wiederholen (Strg+Umschalt+Z)“.
  - Gesperrt über `aria-disabled` und halbe Deckkraft; kein `disabled`, damit Firefox den Tooltip zeigt (wie bei `basic-shapes`).
  - Im Kalibrier-Modus ausgeblendet wie Import/Export, denn dort steht nur „Kalibrierung beenden“; gesperrt wären sie ohnehin.
- **Panel-Kopf** (`LockToggle`): Icon-Schaltfläche 30 px links neben „Löschen“ wie im Entwurf, `Lock`/`LockOpen`, `aria-pressed`, `title` „Sperren“/„Entsperren“. Bei gesperrter Form ist „Löschen“ `aria-disabled` mit `title` „Gesperrt – zuerst entsperren“.
- **Abschnitt „Anordnung“** (`ArrangeSection`) am Ende des Panels: 2 × 2-Raster mit „Nach vorne“, „Nach hinten“, „Ganz nach vorne“, „Ganz nach hinten“ (Icons `BringToFront`/`SendToBack`/`ArrowUpToLine`/`ArrowDownToLine`). Gesperrt über `canReorder` (neu in `src/lib/plan.ts`).
  - Der Entwurf zeigt nur „Nach vorne/hinten“. Die beiden „Ganz“-Schaltflächen kommen dazu, weil `plan-model` sie bereits anbietet und sie ohne Tastenkürzel sonst nicht auffindbar wären.
- **Formular bei gesperrter Form**: Die Abschnitte „Maße“ und „Lage“ erhalten `readOnly` (Eingabefelder) bzw. `disabled` (Spiegeln, so schon in `PositionSection` vorbereitet; ohne Tooltip, daher kein `aria-disabled` nötig). „Beschriftung“ (in `ShapeProperties` bisher mit `readOnly` verbunden, wird davon getrennt), „Darstellung“ und „Anordnung“ bleiben bedienbar.
- `docs/design/README.md`, Bedienentscheidungen, neue Zeilen:
  - „Rückgängig“: nur Plan-Änderungen, 100 Schritte, wechselt zur betroffenen Etage
  - „Sperren“: Lage und Maße fest, Beschriftung/Farbe/Anordnung frei
  - „Anordnung“: Bild↑/Bild↓, mit Umschalt ganz

### 8. Datenmodell und `schemaVersion`

**Keine Änderung, `schemaVersion` bleibt 1.**
- `locked` ist seit `plan-model` ein optionales Feld und wird jetzt erstmals gesetzt.
- Die Zeichenreihenfolge ist wie bisher die Reihenfolge im Array.
- Der Verlauf (`store.temporal`) liegt nur im Arbeitsspeicher. Autosave speichert weiterhin nur `plan`, und die Exportdatei enthält nur den Plan.

## Risks / Trade-offs

- [`shape-properties` übernimmt Eingaben bei jedem Tastendruck → viele Mini-Schritte] → Aufgabe 1.1 prüft das. Bei Bedarf wird dort auf Übernahme bei Enter/Verlassen umgestellt, bevor dieser Change umgesetzt wird.
- [Eine Plan-Funktion kopiert unveränderte Etagenlisten neu → `equality` hält einen Etagenwechsel für eine Änderung, `resolveHistoryFocus` meldet mehrere Etagen] → Ein Test in `plan.test.ts` sichert die Referenzgleichheit unveränderter Etagen für alle Plan-Funktionen.
- [Strg+Z während eines laufenden Ziehens ersetzt den Plan unter der gezogenen Form] → Während Ziehen/Transformieren (`Konva.isDragging()`/`Konva.isTransforming()`, also Konvas eigener Zustand statt eines eigenen Merkers, der hängen bleiben könnte) werden die Tastenkürzel für Rückgängig/Wiederholen ignoriert.
- [Strg+Y öffnet in manchen Browsern den Verlauf] → `preventDefault`; Firefox/Chrome unter Linux und Windows belegen Strg+Y auf einer Seite nicht hart. Im Browser prüfen.
- [Rückgängig über eine Sperre hinweg ändert eine gesperrte Form] → bewusst so (Spec): Rückgängig stellt einen früheren Stand wieder her, zu dem auch der damalige Sperrzustand gehört.
- [Nacharbeit nach `undo()` ist ein zweites `set` → zwei Renders, Autosave zweimal angestoßen] → Autosave entprellt (300 ms); das Rendern ist unkritisch.

## Migration Plan

- Keine Datenmigration. Gespeicherte Pläne bleiben gültig. Formen ohne `locked` gelten als nicht gesperrt.
- Reihenfolge: nach `basic-shapes`, `shape-properties`, `more-shapes` und `export-import` (die beiden letzten sind optional, siehe proposal.md).
- Rückbau: Change zurücknehmen. Gesperrte Formen bleiben gültig gespeichert, werden dann aber nicht mehr geschützt.
