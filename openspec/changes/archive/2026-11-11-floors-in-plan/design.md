# Design

## Context

- **Feste Etagen im Code**: `src/config/house.ts` liefert `FLOOR_IDS = ["eg","og","dg"]`, `FloorId` als Union, `FLOORS` mit Name, Reihenfolge und `imageFile`.
  - Daran hängen `PlanSchema` (`z.enum(FLOOR_IDS)` für `activeFloorId`, die Schlüssel von `calibrationByFloor` und `shapesByFloor`) sowie `plan.ts`, `plan-diff.ts`, `plan-import.ts`, `history.ts`, Store, `FloorSwitcher`, `FloorCanvas`, `ImportDialog`, `StatusBar`, Teile der Canvas- und Properties-Komponenten und ihre Tests.
- **Migration vorbereitet**: `export-import` hat `PLAN_MIGRATIONS` (leer), `migratePlanData` und die Fixture `src/lib/__fixtures__/plan-v1.json` angelegt. Die Regel lautet: Wer `PLAN_SCHEMA_VERSION` erhöht, liefert Migration und Fixture mit. Die Nacharbeit „Migration auch beim Laden aus dem `localStorage`“ ist ausdrücklich der ersten Formatänderung zugeordnet, also diesem Change.
- **Verlauf**: `editing-extras` hält den Plan in `zundo`. `sameContent` und `resolveHistoryFocus` laufen über `FLOOR_IDS` und vergleichen Formen und Kalibrierungen je Etage per Referenz. `history.ts` setzt nach Rückgängig/Wiederholen `activeFloorId` auf die ermittelte Etage.
- **Bilder**: `FloorCanvas` lädt `plans/${floor.imageFile}`. Die Ansicht rechnet in Bildpixeln, Formen werden über `pxPerCm` umgerechnet. Daran ändert dieser Change nichts, das kommt mit `floor-underlay`.
- Anforderungen: alle Deltas unter `specs/`.

## Goals / Non-Goals

**Goals:**
- Etagen sind ein Teil des Plans und werden über reine Funktionen in `src/lib/plan.ts` geändert, wie Formen.
- Die bestehenden Pläne (Browser und Export-Dateien der Version 1) laufen verlustfrei über, ohne dass sich Koordinaten ändern.
- Die App bleibt nach diesem Change voll benutzbar. Die drei bisherigen Etagen zeigen weiter ihre PNGs.

**Non-Goals:**
- Kein Umbau der Ansicht auf cm-Koordinaten (`floor-underlay`).
- Keine Prüfung, dass Etagennamen eindeutig sind.

## Decisions

### 1. Datenmodell Version 2

```ts
const FloorIdSchema = z.string().min(1).max(64);
export const FloorSchema = z.object({
    id: FloorIdSchema,
    name: z.string().trim().min(1).max(40),
});
export const MAX_FLOORS = 8;

PlanSchema = z.object({
    schemaVersion: z.literal(2),
    name, createdAt, updatedAt,           // unverändert
    floors: z.array(FloorSchema).min(1).max(MAX_FLOORS),
    activeFloorId: FloorIdSchema,
    calibrationByFloor: z.partialRecord(FloorIdSchema, CalibrationSchema),
    shapesByFloor: z.record(FloorIdSchema, z.array(ShapeSchema)),
}).superRefine(checkFloorConsistency);
```

`checkFloorConsistency` verlangt:
- Etagen-IDs sind eindeutig.
- `activeFloorId` ist eine Etage des Plans.
- Die Schlüssel von `shapesByFloor` sind **genau** die Etagen-IDs.
- Die Schlüssel von `calibrationByFloor` sind eine Teilmenge davon.
- Eine Form-ID kommt im ganzen Plan höchstens einmal vor. Das war bisher nur Regel von `addShape`. Jetzt prüft es das Schema, damit ein ungültiger Plan nicht über `replacePlan` hereinkommt.

Weitere Festlegungen:
- **`FloorId` wird `string`.** Der Typ bleibt als Alias `type FloorId = string` in `plan-schema.ts` erhalten, damit Signaturen lesbar bleiben.
- **Neue IDs** über `crypto.randomUUID()`, wie bei Formen. Übernommene Etagen behalten `eg`, `og`, `dg`. So bleiben `shapesByFloor` und `calibrationByFloor` bei der Migration unverändert, und die Übergangszuordnung der PNGs (Entscheidung 6) funktioniert über die ID.
- **Reihenfolge = Array-Reihenfolge**, wie bei Formen. Ein Feld `order` entfällt.
- **Die Maps bleiben getrennt** (`shapesByFloor`, `calibrationByFloor`), statt Formen in die Etage zu verschachteln.
  - Alternative: `floors: [{ id, name, shapes, calibration }]`. Verworfen, weil das jede Stelle umbauen würde, die Formen liest (Canvas, Verlauf, Import, Tests). Der Vorteil wäre nur ästhetisch.
  - Die Folgechanges ergänzen ihre Daten nach demselben Muster (`underlayByFloor`, `roomsByFloor`).

### 2. Migration 1 → 2

`PLAN_MIGRATIONS[1] = (data) => ({ ...data, floors: [{ id: "eg", name: "Erdgeschoss" }, { id: "og", name: "Obergeschoss" }, { id: "dg", name: "Dachgeschoss" }] })`.

- Die Migration arbeitet auf Rohdaten (Regel aus `export-import`) und fasst sonst nichts an.
- Fehlende Formenlisten der drei Etagen ergänzt der Import bzw. das Laden (siehe 4 und 5), nicht die Migration.
- Neue Fixture `src/lib/__fixtures__/plan-v2.json`: das Ergebnis der Migration von `plan-v1.json` mit einer zusätzlichen Etage „Keller“ (UUID) an erster Stelle. Sie ist für die nächste Migration gedacht.

### 3. Etagen-Operationen in `src/lib/plan.ts`

Alle Operationen sind rein, liefern bei Ablehnung dasselbe Objekt und setzen sonst `updatedAt`:

| Funktion | Verhalten |
| --- | --- |
| `addFloor(plan, id, name, now)` | hängt `{ id, name }` an, `shapesByFloor[id] = []`, macht sie aktiv. Lehnt ab bei 8 Etagen, vergebener ID oder ungültigem Namen |
| `renameFloor(plan, id, name, now)` | getrimmter Name, 1–40 Zeichen. Lehnt ab, wenn unverändert oder ungültig |
| `moveFloor(plan, id, direction: "up" \| "down", now)` | tauscht mit dem Nachbarn. Lehnt ab am Rand |
| `removeFloor(plan, id, now)` | entfernt Etage, Formen und Kalibrierung. Lehnt die letzte Etage ab. War sie aktiv, wird die nachfolgende Etage aktiv, sonst die vorherige |
| `nextFloorName(floors)` | „Neue Etage“, „Neue Etage 2“, … (erste freie Nummer) |
| `createEmptyPlan(now, newId)` | eine Etage `{ id: newId(), name: "Erdgeschoss" }` |

- `addFloor` setzt die neue Etage aktiv und gilt dennoch als inhaltliche Änderung, weil die Etagenliste neu ist.
- `setActiveFloor` prüft gegen `plan.floors` statt `FLOOR_IDS`.
- `addShape` prüft doppelte IDs über alle Werte von `shapesByFloor`.
- `canMoveFloor` und `canRemoveFloor` geben der Oberfläche die Sperrzustände, analog zu `canReorder`.
- Leerer Plan: Die ID des einzigen Erdgeschosses ist eine UUID, nicht `eg`. Sonst würde ein neuer Plan durch die Übergangszuordnung (Entscheidung 6) das alte EG-PNG zeigen.

### 4. Laden aus dem Browser (`plan-storage.ts`)

Neuer Ablauf von `loadPlan`:

1. Rohtext lesen und JSON parsen.
2. Ist `schemaVersion` eine ganze Zahl kleiner als `PLAN_SCHEMA_VERSION`, folgen diese Schritte:
   1. Den Rohtext unter `raumplaner.plan.pre-migration` ablegen. Gelingt das nicht (Speicher voll), weiter wie bei `backup-failed`: Plan leer, Speichern ausgesetzt. Ohne Sicherung werden alte Daten nie überschrieben.
   2. `migratePlanData` anwenden.
   3. Fehlende Formenlisten der Etagen mit `[]` ergänzen.
   4. Das Ergebnis mit `PlanSchema` prüfen.
3. Ergebnisse:
   - Erfolg → neues Ergebnis `migrated`. Der Store speichert den Plan sofort einmal, damit nicht bei jedem Start erneut umgewandelt wird.
   - Fehlschlag → wie bisher `backed-up` bzw. `backup-failed`.
4. Neuere Versionen und ungültige Daten → wie bisher.

Weitere Punkte:
- `takeOverLegacyCalibrations`, `calibration-storage.ts` und ihr Test entfallen (REMOVED in `plan-persistence`).
- Der Schlüssel `raumplaner.plan.pre-migration` wird bei jeder späteren Migration überschrieben. Er hält immer den Stand vor der letzten Umwandlung.
- Alternative: im Speicher migrieren und erst beim nächsten Autosave schreiben. Verworfen, weil dann bis zur ersten Änderung bei jedem Start migriert würde.

### 5. Import (`plan-import.ts`)

Der Ablauf von `analyzePlanFile` bleibt. Geändert wird:

- **Hülle (Schritt 2)**: unverändert, `shapesByFloor` mit Array-Werten. `floors` wird erst nach der Migration geprüft, weil Dateien der Version 1 keins haben.
- **Neuer Schritt „Etagen“** nach der Migration:
  - `floors` muss ein Array sein, sonst `not-a-plan`.
  - Die Einträge werden der Reihe nach mit `FloorSchema` geprüft:
    - ungültig → `invalidFloors: { label, reason: "Angaben ungültig" | "Name fehlt" | "Name zu lang" | "Kennung fehlt" }`
    - ID schon gesehen → „Kennung doppelt“
    - ab dem 9. gültigen → „Höchstens 8 Etagen“
  - Ohne gültige Etage → `not-a-plan` („Datei ohne Etagen“).
  - `label` ist der Name, sonst die Kennung, sonst „Etage“.
- **Formen (Schritt 4)** laufen über die übernommenen Etagen in Datei-Reihenfolge statt über `FLOORS`.
- **Unbekannte Etagen (Schritt 5)**: Schlüssel von `shapesByFloor`, die keine übernommene Etage sind. Das gilt auch für die Kennung einer verworfenen Etage.
- **Kalibrierungen (Schritt 6)**: „Etage unbekannt“ für Kennungen außerhalb der übernommenen Etagen.
- **Aktive Etage (Schritt 7)**: Ersatz ist die erste übernommene Etage.
- **Ergebnis**: `ImportSuccess` bekommt `floors: Floor[]` (zur Anzeige der Namen) und `invalidFloors`. `countsByFloor` wird `Record<string, number>`. `hasWarnings` berücksichtigt `invalidFloors`.

**`ImportDialog`** liest Etagennamen und Reihenfolge aus `analysis.plan.floors` statt aus `FLOORS`:
- Neue Zeile „Nicht übernommene Etagen“ mit „„Spitzboden“: Kennung doppelt“.
- Der Ersetzen-Hinweis nennt weiterhin Formen und Kalibrierungen. Ein Plan mit mehreren leeren Etagen, aber ohne Formen, gilt weiter als leer. Das ist eine bewusste Vereinfachung, denn leere Etagen sind schnell wieder angelegt.

### 6. Übergang: Bilder der alten Etagen

- `src/config/house.ts` entfällt. Neu ist `src/config/legacy-floor-images.ts` mit `LEGACY_FLOOR_IMAGES: Readonly<Record<string, string>> = { eg: "eg.png", og: "og.png", dg: "dg.png" }` und `floorImageFile(id): string | null`.
- `FloorCanvas`:
  - **Mit Bilddatei**: wie bisher.
  - **Ohne Bilddatei**:
    - Die Zeichenfläche zeigt nur den Hinweis „Für diese Etage gibt es noch keinen Grundriss.“.
    - Es gibt keine Stage-Inhalte. Die Zoom-Leiste bleibt sichtbar, ist aber ohne Bild wirkungslos.
    - Form-Werkzeuge sind über die fehlende Kalibrierung ohnehin gesperrt.
- `ToolBar`: „Etage kalibrieren“ ist gesperrt, wenn `floorImageFile(activeFloorId) === null`. Das Muster mit `aria-disabled` und Tooltip ist wie bei den Werkzeugen.
- Store `setActiveFloor`: Ist der Kalibrier-Modus aktiv und hat die Ziel-Etage kein Bild, endet der Modus (`calibrationDraft = null`).
- `floor-underlay` ersetzt diese Datei durch hochgeladene Vorlagen und entfernt die PNGs.

### 7. Store und Verlauf

- Neue Aktionen: `addFloor()` (ID über `crypto.randomUUID()`, Name über `nextFloorName`), `renameFloor(id, name)`, `moveFloor(id, direction)`, `removeFloor(id)`. Jede liefert `boolean` über `applyPlan`.
  - `addFloor` und `removeFloor` heben Auswahl und Werkzeug auf (`RESET_TOOL_AND_SELECTION`).
  - `removeFloor` entfernt auch den Viewport der Etage.
- `viewports: Partial<Record<string, Viewport>>`.
- **`plan-diff.ts`**:
  - `sameContent` vergleicht zusätzlich `a.floors === b.floors` (Referenz; die Operationen erzeugen nur bei Änderung ein neues Array).
  - Die Schleife geht über die Vereinigung der Etagen-IDs beider Pläne.
  - `resolveHistoryFocus` berücksichtigt geänderte Etagen-Einträge (neu, umbenannt, verschoben = anderer Index):
    - Genau eine betroffene Etage, die in `after` existiert → diese.
    - Sonst `after.activeFloorId`, falls vorhanden.
    - Sonst die erste Etage von `after`.
  - Damit setzt `history.ts` nie eine nicht vorhandene Etage aktiv. Ein Test deckt „Anlegen rückgängig, während die neue Etage aktiv ist“ ab.
- `RESET_TOOL_AND_SELECTION` beim Rückgängig bleibt unverändert.

### 8. Oberfläche

- **`FloorSwitcher`**:
  - Liest `plan.floors`.
  - Rechts neben der Pill-Gruppe steht eine Icon-Schaltfläche (lucide `Pencil`, `aria-label`/Tooltip „Etagen bearbeiten“), die im Kalibrier-Modus nicht gerendert wird.
  - Lange Namen werden nach 160 px mit „…“ gekürzt, der volle Name steht im `title`.
- **`src/components/floors/FloorsDialog.tsx`** (shadcn `dialog`, vorhanden), Breite 440 px. Je Etage eine Zeile:
  - Namensfeld: Wiederverwendung von `TextField` aus `properties/` mit Commit bei Enter/Blur, `Esc` setzt zurück, Hinweise „Bitte einen Namen eingeben“ / „Höchstens 40 Zeichen“.
  - Icon-Schaltflächen `ChevronUp`, `ChevronDown` und `Trash2` mit Tooltips „Nach oben“, „Nach unten“, „Löschen“ bzw. dem Sperrgrund.
  - Die aktive Etage ist durch einen Punkt markiert.
  - Fußzeile: „Etage hinzufügen“ links (Icon `Plus`), „Fertig“ rechts.
- **Löschen mit Inhalt**: eine Rückfrage im selben Dialog (Inline-Bestätigungszeile statt zweitem Dialog): „Etage „Dachgeschoss“ mit 4 Formen löschen?“ mit „Löschen“ (destruktiv) und „Abbrechen“.
  - Bei nur Kalibrierung lautet sie „Etage „Dachgeschoss“ mit Kalibrierung löschen?“.
  - Ein zweiter, gestapelter Dialog wäre umständlicher.
- **Tastenkürzel**: Strg+Z im Dialog wirkt im Namensfeld wie im Browser. Außerhalb von Feldern lässt der Dialog die globalen Kürzel nicht durch (Fokusfalle von base-ui). Rückgängig geht nach dem Schließen.
- **`StatusBar`, `CalibrationPanel`, Canvas-Komponenten**: Sie ersetzen `getFloor(id).name` durch einen Selektor `selectFloorName(state, id)`.

### 9. Datenmodell und `schemaVersion` (Zusammenfassung)

- `PLAN_SCHEMA_VERSION` 1 → 2.
- Neues Pflichtfeld `floors`.
- `activeFloorId` und die Map-Schlüssel sind freie Strings mit Konsistenzprüfung.
- Migration 1 → 2 in `PLAN_MIGRATIONS`, Fixtures `plan-v1.json` (bleibt) und `plan-v2.json` (neu).
- Exportdatei und Browser-Speicher haben weiterhin dasselbe Format.

## Risks / Trade-offs

- **[Die Migration im Browser schreibt über die Daten des Nutzers]** → Der Rohtext wird vorher unter `raumplaner.plan.pre-migration` gesichert. Schlägt das fehl, wird nichts überschrieben und das Speichern ausgesetzt (bestehender Pfad `backup-failed`). Tests decken beides mit `failingWrites` ab.
- **[`editing-extras` ist noch nicht archiviert]** → Die Deltas für `edit-history` setzen dessen Archivierung voraus. Reihenfolge: zuerst `editing-extras` fertigstellen und archivieren, dann diesen Change umsetzen.
- **[Ein Übergangszustand mit Etagen ohne Grundriss]** Neu angelegte Etagen sind bis `floor-underlay` leer und nicht kalibrierbar → Das ist bewusst in Kauf genommen und im Spec mit dem Hinweis abgedeckt. `floor-underlay` folgt direkt.
- **[Gleichnamige Etagen]** Im Prüf-Dialog und im Umschalter sind zwei Etagen mit gleichem Namen nicht zu unterscheiden → Das ist für einen einzelnen Nutzer vertretbar. Er vergibt die Namen selbst.
- **[`FloorId` als `string` verliert Typsicherheit]** → Die Konsistenz prüft `PlanSchema` zur Laufzeit. Die Operationen lehnen unbekannte IDs ab (dasselbe Objekt zurück), wie bisher bei unbekannten Form-IDs.
- **[Undo nach dem Löschen einer Etage]** braucht den Viewport nicht. Die Etage wird beim nächsten Anzeigen neu eingepasst, was akzeptabel ist.

## Migration Plan

1. `editing-extras` abschließen und archivieren.
2. Diesen Change umsetzen. Beim ersten Start wandelt die App den gespeicherten Plan um. Die Sicherung liegt unter `raumplaner.plan.pre-migration`.
3. Rückweg: Eine ältere App-Version kann einen Plan der Version 2 nicht lesen. Sie würde ihn sichern und leer starten. Zum Zurückgehen den Wert aus `raumplaner.plan.pre-migration` wieder unter `raumplaner.plan` eintragen, oder eine vorher exportierte Datei importieren. Empfehlung in `tasks.md`: vor dem Umsetzen einmal exportieren.
