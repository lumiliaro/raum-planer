# Design

## Context

- **Voraussetzung `plan-model`** (geplant, noch nicht umgesetzt):
  - `src/lib/plan-schema.ts` mit `PLAN_SCHEMA_VERSION = 1`, `ShapeSchema` (diskriminierte Union über `kind`, flache Maßfelder, Plausibilität per `.refine`) und `PlanSchema` (`schemaVersion` als Literal 1, `calibrationByFloor` als `z.partialRecord(z.enum(FLOOR_IDS), CalibrationSchema)`, Pflichtfeld, darf leer sein; `shapesByFloor` als vollständiger Record über `FLOOR_IDS`; unbekannte Felder werden entfernt).
  - Store mit `plan`, `saveStatus`, Autosave bei neuer `plan`-Referenz. Die Kalibrierung liegt in `plan.calibrationByFloor`, die Statusleiste liest den Maßstab dort.
  - Laut dessen design.md ist das Speicherformat im Browser bereits das spätere Exportformat (reines Plan-JSON einschließlich Kalibrierung). Ein Plan mit anderer `schemaVersion` gilt beim Start als unlesbar.
- **Kopfleiste heute**: `HeaderBar` ist ein Raster `[1fr_auto_1fr]` mit leerer rechter Spalte. `floor-calibration` (umgesetzt) zeigt dort im Kalibrier-Modus „Kalibrierung beenden“.
- **Bedienelemente**: Bisher gibt es nur `src/components/ui/button.tsx` (shadcn, Stil `base-vega` auf `@base-ui/react`). Einen Dialog gibt es noch nicht.
- **Visuelle Vorgabe**: Artboard „Import – abweichende Version“ (Link in `docs/design/README.md`):
  - Dialog 520 px breit, Radius 10 px, Overlay `rgba(24,24,27,.45)`
  - Warnsymbol im runden, bernsteinfarbenen Kreis, Titel 16/600
  - Kasten „Ergebnis der Prüfung“ mit Zeilen: grüner Haken bzw. Warndreieck, fette Kurzzeile, graue Detailzeile
  - roter Hinweis zum Ersetzen
  - Fußzeile: „Aktuellen Plan exportieren“ links, „Abbrechen“ und die dunkle Hauptschaltfläche rechts
- Anforderungen: `specs/plan-export`, `specs/plan-import`, `specs/workspace-layout`.

## Goals / Non-Goals

**Goals:**
- Die ganze Prüfung einer Datei ist eine reine Funktion. Sie liefert entweder einen Fehler oder einen fertigen, gültigen Plan samt Prüfergebnis. Der Dialog zeigt nur noch an, der Store ersetzt nur noch.
- Der Migrationsmechanismus ist sofort fertig und getestet. Eine künftige Formatänderung trägt nur einen Eintrag ein.
- Eine Beispieldatei in Version 1 wird eingefroren, damit spätere Migrationen gegen eine echte alte Datei getestet werden können.

**Non-Goals:**
- Kein Streaming oder Web Worker für große Dateien. Ein Plan für ein Haus ist klein, die Grenze liegt bei 5 MB.
- Keine Prüfung, ob Formen außerhalb des Grundrisses liegen oder sich überlappen.

## Decisions

### 1. Module

| Datei | Inhalt |
| --- | --- |
| `src/lib/plan-export.ts` | `serializePlan(plan)`, `exportFileBase(planName)`, `localDateKey(date)`, `exportFileName(planName, date, version)` |
| `src/lib/export-counter.ts` | `createExportCounter(storage)`: Version des Exports je Tag und Name, im Browser gespeichert |
| `src/lib/plan-migration.ts` | Typ `PlanMigration`, `PLAN_MIGRATIONS` (leer), `migratePlanData(raw, from, to, migrations)` |
| `src/lib/plan-import.ts` | `analyzePlanFile(text, fileName, options)` → `ImportAnalysis` |
| `src/lib/shape-issues.ts` | `describeShapeIssue(zodError, rawShape)` und `describeCalibrationIssue(zodError, rawCalibration)` → deutscher Grund |
| `src/lib/__fixtures__/plan-v1.json` | eingefrorene Beispieldatei in Version 1 (alle sieben Formtypen, Beschriftungen, `fill: null`, Kalibrierung für Erdgeschoss und Obergeschoss, Dachgeschoss ohne) |
| `src/components/plan-file/download.ts` | `downloadTextFile(name, text)`, `exportPlan(plan)`, `previewExportFileName(name)`: Browser-Download und Zähler der Sitzung, nicht rein, daher nicht in `src/lib/` |
| `src/components/plan-file/PlanFileActions.tsx` | Schaltflächen, verstecktes Datei-Feld, Dialogzustand |
| `src/components/plan-file/ExportDialog.tsx`, `ImportDialog.tsx`, `ImportErrorDialog.tsx` | Darstellung |
| `src/components/ui/dialog.tsx` | shadcn-Komponente `dialog` |

### 2. Export
- `serializePlan(plan) = JSON.stringify(plan, null, 2) + "\n"`. Das ist genau das Plan-Objekt aus dem Store einschließlich `calibrationByFloor`. Ansichtszustand (Viewports, Panel, Auswahl, Werkzeug) liegt außerhalb von `plan` und kann gar nicht hineingeraten.
- **Name**: „Exportieren“ fragt jedes Mal nach dem Namen (Entscheidung 7). Der Name ist der Planname, denn er soll in der Datei stehen und nach einem Import weiter gelten. Er wird über `renamePlan` übernommen (Entscheidung 6). Damit ändert der Export den Plan nur am Namen.
- `exportFileBase(name)` erzeugt den Namensteil:
  - Zuerst werden ä/ö/ü/ß ersetzt (ae, oe, ue, ss, Großbuchstaben vorher klein).
  - Danach folgen NFKD-Zerlegung mit Entfernen der Akzente, `[^a-z0-9]+` → `-` und Kürzen der Bindestriche am Rand.
  - Ist das Ergebnis leer, lautet er „raumplaner“.
- `exportFileName(name, date, version)` = `` `${localDateKey(date)}-${exportFileBase(name)}_${version}.json` ``, z. B. `2026-11-11-umzug_1.json`. `localDateKey` liefert `YYYY-MM-DD` aus dem **lokalen** Datum.
- **Version des Exports** (`export-counter.ts`):
  - Gespeichert im Browser unter `raumplaner.ui.exportCounter` als `{ "date": "2026-11-11", "counts": { "umzug": 2 } }`. Nur der aktuelle Tag wird gehalten; an einem neuen Tag beginnen alle Namen wieder bei 1. Schlüssel ist `exportFileBase(name)`, damit „Umzug“ und „umzug“ zusammen zählen, genau wie ihre Dateinamen.
  - `createExportCounter(storage)` liefert `peek(name, date)` (nächste Version, ohne zu zählen; für die Vorschau im Dialog) und `take(name, date)` (zählt hoch und speichert).
  - Zusätzlich hält der Zähler seinen Stand im Speicher der Sitzung. Gelesen wird der neuere von beiden Ständen (bei gleichem Tag je Name der größere Wert). Ist der Browser-Speicher blockiert oder voll, zählt die Version so bis zum Neuladen weiter.
  - Der Zähler gehört nicht in den Plan: Er beschreibt Downloads dieses Browsers, nicht den Plan. Ein Feld im Plan wäre außerdem eine Formatänderung (`schemaVersion` 2).
- **„Aktuellen Plan exportieren“** im Import-Dialog lädt ohne Namensabfrage unter dem aktuellen Plannamen herunter (gleicher Dateiname und Zähler). Ein zweiter Dialog über dem Import-Dialog wäre umständlich.
- `downloadTextFile`: Ein `Blob` mit dem Typ `application/json` wird über `URL.createObjectURL` an ein temporäres `<a download>` gehängt, dann folgt `click()`. `revokeObjectURL` läuft im nächsten Tick. Das ist ein reiner Browser-Download ohne Netzwerkaufruf.
- Alternative: File System Access API (`showSaveFilePicker`). Verworfen, weil sie in Firefox fehlt und ein Download für eine Sicherungsdatei genügt.

### 3. Migration
- `type PlanMigration = (data: Record<string, unknown>) => Record<string, unknown>`. `PLAN_MIGRATIONS: Readonly<Record<number, PlanMigration>>` hat als Schlüssel die **Ausgangsversion**, z. B. `1` für 1 → 2. Heute ist die Liste leer.
- `migratePlanData(raw, from, to, migrations)` wendet nacheinander `migrations[from]`, `migrations[from + 1]`, … an und setzt nach jedem Schritt `schemaVersion = v + 1`. Fehlt ein Schritt, wirft ein Schritt oder liefert er kein Objekt, entsteht ein `MigrationError` mit Ausgangs- und Zielversion.
- Migrationen arbeiten auf rohen Daten, nicht auf Zod-Typen alter Versionen. So muss kein altes Schema im Code bleiben. Danach prüft die aktuelle Formprüfung jede Form einzeln.
- **Regel für die Zukunft** (wird in `docs/design/README.md` festgehalten): Wer `PLAN_SCHEMA_VERSION` erhöht, trägt die Migration von der Vorgängerversion ein. Dazu gehört ein Test, der `__fixtures__/plan-v1.json` (und spätere Fixtures) bis zur aktuellen Version importiert. Ein Test prüft schon jetzt, dass für jede Version von 1 bis `PLAN_SCHEMA_VERSION − 1` eine Migration existiert.
- Neuere Dateien werden nicht umgewandelt. Eine Rückwärts-Migration kann es nicht geben, weil die alte App die neue Version nicht kennt. Stattdessen wird jede Form einzeln geprüft (Entscheidung 4). Unbekannte Felder entfernt Zod, und der Dialog warnt davor.

### 4. Prüfung: `analyzePlanFile`
Optionen: `{ appVersion = PLAN_SCHEMA_VERSION, migrations = PLAN_MIGRATIONS, now: Date, newId: () => string }`. Sie sind nur zum Testen einstellbar. Die App ruft die Funktion mit den Standardwerten, `new Date()` und `crypto.randomUUID` auf.

Ablauf:
1. **JSON lesen**: Scheitert `JSON.parse`, ist das Ergebnis der Fehler `not-json`.
2. **Hülle prüfen**: Verlangt werden ein Objekt, `schemaVersion` als ganze Zahl ≥ 1 und `shapesByFloor` als Objekt, dessen Werte alle Arrays sind. Sonst ist das Ergebnis `not-a-plan`.
3. **Version**: Die Beziehung ist `same`, `older` oder `newer`. Bei `older` läuft `migratePlanData` bis `appVersion`. Scheitert sie, ist das Ergebnis `migration-failed`.
4. **Formen**: Die konfigurierten Etagen werden in `FLOORS`-Reihenfolge durchlaufen, eine fehlende Etage ergibt eine leere Liste. Jede Form geht durch `ShapeSchema.safeParse`:
   - **Ungültig**: Es entsteht ein Eintrag `{ floorId, name, reason }`. `name` ist die Beschriftung, falls sie ein nicht leerer String ist, sonst der deutsche Name des Formtyps, sonst „Form“.
   - **Gültig, ID schon vergeben**: Die Form bekommt eine neue ID über `newId()`, der Zähler `reassignedIds` steigt.
   - Die Reihenfolge bleibt erhalten.
5. **Unbekannte Etagen**: Schlüssel außerhalb `FLOOR_IDS` ergeben `{ floorId, names[] }`. Ihre Formen werden nicht geprüft und nicht übernommen.
6. **Kalibrierungen**:
   - Fehlt `calibrationByFloor`, hat der Plan keine Kalibrierung, ohne Warnung.
   - Ist es kein Objekt (z. B. Array oder String), entsteht ein Eintrag `{ floorId: null, reason: "Angaben ungültig" }`, und keine Kalibrierung wird übernommen.
   - Sonst wird jeder Eintrag geprüft: Ein Schlüssel außerhalb `FLOOR_IDS` ergibt `{ floorId, reason: "Etage unbekannt" }`. Scheitert `CalibrationSchema.safeParse`, entsteht `{ floorId, reason }` über `describeCalibrationIssue`. Gültige Einträge kommen in `calibrationByFloor`.
   - Eine Etage ohne gültigen Eintrag ist nach dem Import nicht kalibriert, auch wenn sie es im aktuellen Plan war. Der Import ersetzt den ganzen Plan.
7. **Plan-Angaben**: `name` (getrimmt, nicht leer), `createdAt`/`updatedAt` (`z.iso.datetime()`) und `activeFloorId` (∈ `FLOOR_IDS`) werden übernommen oder ersetzt. Ersatzwerte sind „Meine Planung“, `now` (beide Zeitpunkte gemeinsam) und `"eg"`. Jeder Ersatz wird in `filledMetadata: ("name" | "timestamps" | "activeFloor")[]` vermerkt.
8. **Plan bauen** mit `schemaVersion: PLAN_SCHEMA_VERSION` und `PlanSchema.parse`. Das muss nach den Schritten 4 bis 7 gelingen. Wirft es dennoch, wird es als `not-a-plan` gemeldet, statt die App abstürzen zu lassen.

Ergebnis:
- `{ ok: false, fileName, error, fromVersion?, toVersion? }` oder
- `{ ok: true, fileName, fileVersion, appVersion, relation, plan, countsByFloor, unknownFloors, invalidShapes, invalidCalibrations, reassignedIds, filledMetadata, hasWarnings }`. `hasWarnings` ist wahr, sobald die Version abweicht oder eine der Listen bzw. Zähler nicht leer ist. Dann heißt die Hauptschaltfläche „Trotzdem importieren“, sonst „Importieren“.

Die Größe (5 MB) prüft `PlanFileActions` über `file.size`, bevor gelesen wird (Fehler `too-large`). Eine falsch gewählte Riesendatei wird so gar nicht erst in den Speicher geladen.

Alternative: den ganzen Plan mit `PlanSchema.safeParse` prüfen und bei einem Fehler ablehnen. Verworfen, weil die Projektvorgabe verlangt, nicht übernehmbare Formen aufzulisten statt die Datei zu verwerfen.

### 5. Deutscher Grund: `shape-issues.ts`
- Feldnamen-Tabelle:

  | Feld | Anzeige |
  | --- | --- |
  | `widthCm` | Breite |
  | `depthCm` | Tiefe |
  | `cornerRadiusCm` | Eckradius |
  | `legAWidthCm` | Schenkel A |
  | `legBWidthCm` | Schenkel B |
  | `baseWidthCm` | Basis |
  | `sideWidthCm` | Seiten |
  | `pointsCm` | Punkte |
  | `x` / `y` | X-Position / Y-Position |
  | `rotationDeg` | Drehung |
  | `mirrored` | Spiegelung |
  | `style.fill` | Füllfarbe |
  | `style.stroke` | Randfarbe |
  | `style.strokeWidth` | Randstärke |
  | `style.opacity` | Deckkraft |
  | `label` | Beschriftung |
  | `locked` | Sperre |
  | `id` | ID |
  | `p1` / `p2` | Punkt 1 / Punkt 2 |
  | `realLengthCm` | Reale Länge |
  | `pxPerCm` | Maßstab |

- Es zählt nur das erste Problem. Unbekanntes oder fehlendes `kind` wird zu „Formtyp „…“ unbekannt“ bzw. „Formtyp fehlt“. Ein fehlender Wert (Eingabe `undefined`) wird zu „<Feld> fehlt“, alles andere zu „<Feld> ungültig“. Ist der Pfad unbekannt, lautet der Grund „Angaben ungültig“.
- `describeCalibrationIssue` nutzt dieselbe Tabelle und dieselben Regeln ohne die Formtyp-Fälle, z. B. „Maßstab ungültig“ oder „Punkt 2 fehlt“.
- Die Plausibilitätsregeln aus `plan-model` (`.refine`) müssen das betroffene Feld als `path` angeben, z. B. `path: ["cornerRadiusCm"]`. Sonst heißt der Grund nur „Angaben ungültig“. Aufgabe 1.1 prüft das und ergänzt den Pfad, falls er fehlt. Das ist eine kleine Änderung im Code von `plan-model`, nicht am Format.

### 6. Store: `replacePlan` und `renamePlan`
- `replacePlan(plan: Plan)` prüft defensiv mit `PlanSchema.safeParse`, ersetzt `state.plan` als neues Objekt und liefert `true`/`false`. Zeitpunkte und aktive Etage kommen aus der Datei, `updatedAt` wird nicht neu gesetzt: Die Datei beschreibt ihren eigenen Stand.
- Die Kalibrierung kommt mit dem Plan. Da „Importieren“ im Kalibrier-Modus ausgeblendet ist, gibt es beim Ersetzen keinen offenen Kalibrier-Entwurf. Die Statusleiste zeigt danach den Maßstab aus der Datei.
- Ist `basic-shapes` umgesetzt, setzt `replacePlan` außerdem `selectedShapeId = null` und `activeTool = "select"`. Die Viewports je Etage bleiben, denn die Grundrisse sind dieselben.
- Das Autosave aus `plan-model` sieht die neue `plan`-Referenz und speichert. Bei `saveStatus = "suspended"` (Sicherung beim Start gescheitert) wird auch der importierte Plan nach den Regeln von `plan-model` nicht gespeichert. Die Statusleiste zeigt das bereits.
- `renamePlan(plan, name, now)` in `src/lib/plan.ts` (rein) übernimmt den getrimmten Namen und setzt `updatedAt`, denn der Name ist Inhalt des Plans. Ein leerer oder unveränderter Name liefert dasselbe Objekt. Die Store-Aktion `renamePlan(name)` ruft sie über `applyPlan` auf; das Autosave speichert.

### 7. Oberfläche
- **HeaderBar**: Die rechte Spalte zeigt (`justify-end`) im Kalibrier-Modus „Kalibrierung beenden“, sonst `PlanFileActions`.
- **PlanFileActions**:
  - zwei `Button` mit Variante `outline` und Höhe 32 px: „Importieren“ (Icon `Upload`) und „Exportieren“ (Icon `Download`)
  - ein verstecktes `<input type="file" accept=".json,application/json">`. Nach jeder Auswahl wird `value = ""` gesetzt, damit dieselbe Datei erneut ein `change` auslöst.
  - Dialogzustand lokal per `useState` (Export-Dialog offen, `analysis | null`, Fehler). Er gehört nicht in den Store, weil ihn nur diese Komponente braucht.
  - Abbrechen der Dateiauswahl löst kein `change` aus, es passiert also nichts.
- **Dialog**: `npx shadcn@latest add dialog`. Das erzeugt `src/components/ui/dialog.tsx` auf Basis von `@base-ui/react/dialog`, das schon installiert ist. Fokusfalle, `Esc`, Klick aufs Overlay und `aria-modal` kommen damit mit. Prüfen, dass der Befehl keine neuen Pakete in `package.json` einträgt. Ein Netzwerkzugriff der CLI zur Entwicklungszeit ist kein Laufzeit-Netzwerkaufruf. Alternative: natives `<dialog>`. Verworfen, weil shadcn/ui laut Projektvorgabe die UI-Basis ist und spätere Dialoge (z. B. Einstellungen) denselben Baustein nutzen.
- **ExportDialog** (gleicher Rahmen wie der Import-Dialog, 520 px):
  - Titel „Plan exportieren“, Feld „Name des Plans“ (`FieldShell`/`INPUT_CLASS` aus dem Eigenschaften-Panel), beim Öffnen fokussiert und markiert. Vorausgefüllt mit dem Plannamen, leer bei „Meine Planung“ (Platzhalter „z. B. Umzug“).
  - Darunter grau „Dateiname: 2026-11-11-umzug_1.json“, live aus `previewExportFileName`.
  - „Abbrechen“ und Hauptschaltfläche „Exportieren“; Enter im Feld wirkt wie „Exportieren“ (`<form onSubmit>`).
  - Leerer Name (nach Trimmen): Hinweis „Bitte einen Namen eingeben“ unter dem Feld (`aria-invalid`), kein Download.
  - Sonst `renamePlan(name)`, Dialog schließen, `exportPlan` mit dem Plan aus dem Store.
- **ImportDialog** nach Artboard:
  - **Symbol**: Warndreieck auf `bg-warning/15 text-warning`, wenn `hasWarnings` gilt, sonst `FileJson` neutral.
  - **Titel**: „Plan importieren“ / „Datei aus einer älteren Version“ / „Datei aus einer neueren Version“.
  - **Text**:
    - gleiche Version: „„<Datei>“ enthält die Planung „<Name>“.“
    - ältere Version: „„<Datei>“ verwendet Datenformat **Version n**, diese App **Version m**. Beim Import wird die Datei automatisch umgewandelt.“
    - neuere Version: „… Angaben, die diese Version nicht kennt, gehen beim Import verloren.“
  - **Kasten „Ergebnis der Prüfung“** (ab 40vh scrollbar), Zeilen in dieser Reihenfolge:
    - Haken: „23 Formen werden übernommen“ / „Erdgeschoss 14 · Obergeschoss 9 · Dachgeschoss 0“
    - Kalibrierung: Haken „Kalibrierung für 2 von 3 Etagen“ / „Erdgeschoss 0,9986 px/cm · Obergeschoss 0,7480 px/cm · Dachgeschoss nicht kalibriert“ (Maßstab über `formatPxPerCm`). Ohne jede Kalibrierung neutral „Keine Kalibrierung“ / „Alle Etagen sind nach dem Import nicht kalibriert.“
    - je unbekannter Etage: „Unbekannte Etage „kg“ – 3 Formen“ / „Werden nicht übernommen: Regal, Waschmaschine, Trockner“
    - ungültige Formen: „1 Form ungültig“ mit je Form einer Detailzeile „„Teppich“ (Obergeschoss): Breite fehlt“
    - nicht übernommene Kalibrierungen: „1 Kalibrierung nicht übernommen“ mit je Eintrag „Obergeschoss: Maßstab ungültig“ bzw. „„kg“: Etage unbekannt“
    - „1 Form bekommt eine neue ID“ / „Die ID kam in der Datei mehrfach vor.“
    - „Plan-Angaben ergänzt“ / „Name, Zeitpunkte, aktive Etage“ (nur die betroffenen)
    - Einzahl/Mehrzahl über `formatShapeCount(n)` in `src/lib/format.ts` („1 Form“, „0 Formen“, „23 Formen“).
  - **Ersetzen-Hinweis** (nur wenn der aktuelle Plan Formen oder eine Kalibrierung hat), in `bg-destructive/10 text-destructive`: „Dein aktueller Plan „<Name>“ wird dabei mit allen Formen und Kalibrierungen ersetzt. Exportiere ihn vorher, wenn du ihn behalten willst.“
  - **Fußzeile**:
    - „Aktuellen Plan exportieren“ (nur mit Ersetzen-Hinweis) ruft `exportPlan` mit dem aktuellen Plan auf, ohne Namensabfrage (Entscheidung 2). Der Dialog bleibt offen.
    - „Abbrechen“
    - Hauptschaltfläche (`variant="default"`, dunkel): „Importieren“ oder „Trotzdem importieren“ ruft `replacePlan` auf und schließt den Dialog.
- **ImportErrorDialog**: Titel „Datei kann nicht importiert werden“, Schaltfläche „Schließen“. Text je Fehler:
  - `too-large`: „„x“ ist größer als 5 MB und keine Raumplaner-Datei.“
  - `not-json`: „„x“ konnte nicht gelesen werden – die Datei ist kein gültiges JSON.“
  - `not-a-plan`: „„x“ ist keine Raumplaner-Datei.“
  - `migration-failed`: „„x“ verwendet Datenformat Version n und konnte nicht in Version m umgewandelt werden.“
  - Lesefehler von `file.text()` werden wie `not-json` behandelt.

### Auswirkungen auf Datenmodell und `schemaVersion`
Keine Änderung am Format, `schemaVersion` bleibt 1. Die Exportdatei ist byte-genau das eingerückte Plan-JSON aus `plan-model` einschließlich `calibrationByFloor`. Neu sind zwei verbindliche Regeln:
- Jede Erhöhung von `schemaVersion` bringt eine Migration von der Vorgängerversion mit.
- `__fixtures__/plan-v1.json` wird nie verändert und dient als Prüfstein für spätere Migrationen.

Geprüft wird ein Import immer gegen das aktuelle Schema. Ein importierter Plan ist damit ein gewöhnlicher Plan der aktuellen Version.

## Risks / Trade-offs

- [Die `.refine`-Regeln aus `plan-model` geben keinen Pfad an, der Grund ist dann nur „Angaben ungültig“] → Aufgabe 1.1 prüft das und ergänzt `path`. Der Test zu „Eckradius zu groß“ sichert es ab.
- [Bei Dateien gleicher Version entfernt Zod unbekannte Felder stillschweigend, z. B. ein von Hand vertipptes `widht`] → Die Form fehlt dann mit „Breite fehlt“ in der Liste. Der Fehler wird also sichtbar, nur nicht der Tippfehler selbst. Für eine selbst geschriebene App mit einem Nutzer genügt das.
- [Mit `appVersion` als Testoption läuft die Prüfung trotzdem gegen das echte Schema der Version 1] → Die Tests für „älter“ und „neuer“ arbeiten mit Test-Migrationen, deren Ergebnis Version-1-Formen sind. Das prüft den Ablauf, nicht echte künftige Formate. Die echte Prüfung bringt die erste Formatänderung mit ihrer Fixture mit.
- [Der Import ersetzt den Plan, und es gibt noch kein Undo] → Der Dialog warnt und bietet den Export an. Undo kommt mit zundo.
- [Eine Datei ohne Kalibrierung entfernt die bestehende Kalibrierung, man muss neu kalibrieren] → Die Kalibrierzeile zeigt je Etage, was die Datei mitbringt. Hat der aktuelle Plan eine Kalibrierung, erscheinen die Ersetzen-Warnung und „Aktuellen Plan exportieren“. Ein Behalten der bisherigen Kalibrierung wäre ein Zusammenführen und ist nicht im Umfang.
- [Der Browser blockiert den Download, z. B. durch eine Download-Abfrage in Firefox] → Das ist das Verhalten des Browsers, die App ändert nichts. Im Browser prüfen, dass ein Klick genügt, wenn der Browser so eingestellt ist.
- [Die shadcn-CLI erzeugt Code für eine andere `@base-ui/react`-Version oder trägt Pakete ein] → Nach dem Befehl `git diff package.json` prüfen. Notfalls die Komponente von Hand aus der shadcn-Vorlage übernehmen.

## Migration Plan

- Reihenfolge: nach `plan-model`, unabhängig von `basic-shapes`/`more-shapes`. `floor-calibration` ist bereits umgesetzt.
- Es gibt keine Datenmigration. Rückbau: Change zurücknehmen. Exportierte Dateien bleiben gültige Plan-JSONs.
