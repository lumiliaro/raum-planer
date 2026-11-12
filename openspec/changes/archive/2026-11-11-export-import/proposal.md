# Proposal

## Why

Der Plan lebt bisher nur im `localStorage` eines Browsers. Er lässt sich weder sichern noch auf einen anderen Rechner bringen, und er ist verloren, wenn der Browser-Speicher geleert wird. Mit `plan-model` gibt es jetzt ein festes Datenformat mit `schemaVersion`. Dieser Change macht daraus eine Datei, die man exportieren und wieder importieren kann. Dateien aus anderen Versionen der App werden dabei sicher behandelt: Sie werden geprüft, wenn möglich umgewandelt, und der Plan wird nie ohne Rückfrage ersetzt. Problematische Formen werden aufgelistet, nicht stillschweigend verworfen.

## What Changes

- **Kopfleiste rechts**: Schaltflächen „Importieren“ und „Exportieren“ wie im Design-Entwurf. Im Kalibrier-Modus sind sie ausgeblendet, dort steht nur „Kalibrierung beenden“.
- **Export**:
  - „Exportieren“ öffnet einen kleinen Dialog „Plan exportieren“ mit dem Feld „Name des Plans“. Beim ersten Mal (Plan heißt noch „Meine Planung“) ist es leer, danach mit dem Plannamen vorausgefüllt. Der eingetragene Name wird als Planname übernommen und damit wie jede Änderung gespeichert.
  - Danach lädt der Browser den Plan sofort als JSON-Datei `YYYY-MM-DD-<name>_<n>.json` herunter, z. B. `2026-11-11-umzug_1.json`. `<n>` ist die Version des Exports: Sie beginnt je Tag und Name bei 1 und zählt mit jedem Export hoch. Der Zähler liegt im Browser, nicht im Plan.
  - Die Datei enthält genau den Plan im Format aus `plan-model` (eingerückt, lesbar) einschließlich Name und Kalibrierung je Etage, ohne Grundrisse und ohne Ansichtseinstellungen.
- **Import**: „Importieren“ öffnet die Dateiauswahl für `.json`. Die gewählte Datei wird vollständig geprüft, bevor sich etwas ändert:
  - **Keine Raumplaner-Datei** (kein JSON, kein Plan, nicht unterstützte Version, zu groß): Ein Fehlerdialog erscheint, der aktuelle Plan bleibt unverändert.
  - **Sonst immer der Dialog „Ergebnis der Prüfung“** nach dem Artboard „Import“. Er zeigt, wie viele Formen je Etage übernommen werden und welche Etagen kalibriert sind, und listet alles auf, was nicht oder nur verändert übernommen wird.
- **Versionshinweis**: Weicht die `schemaVersion` der Datei ab, nennt der Dialog beide Versionen („Datei aus einer älteren Version“ / „… neueren Version“). Der Nutzer entscheidet: „Trotzdem importieren“ oder „Abbrechen“.
- **Migration**:
  - Ältere Dateien werden Version für Version auf die aktuelle Version umgewandelt.
  - Bei neueren Dateien wird übernommen, was diese Version versteht. Der Dialog sagt dann, dass unbekannte Angaben verloren gehen.
  - Heute gibt es nur Version 1. Gebaut wird der Mechanismus mit einer leeren Migrationsliste, getestet wird er mit Test-Migrationen.
- **Kalibrierung**: Sie kommt wie alles andere aus der Datei. Fehlt sie dort für eine Etage, ist diese Etage nach dem Import nicht kalibriert. Der Dialog zeigt das je Etage.
- **Was nicht übernommen wird**, erscheint einzeln im Dialog:
  - Formen auf unbekannten Etagen, z. B. „kg“, mit Anzahl und Namen
  - ungültige Formen mit Name, Etage und Grund, z. B. „Teppich (Obergeschoss): Breite fehlt“
  - ungültige Kalibrierungen und Kalibrierungen unbekannter Etagen, z. B. „Obergeschoss: Maßstab ungültig“. Die Etage ist danach nicht kalibriert.
- **Doppelte IDs**: Die zweite Form bekommt eine neue ID und wird übernommen. Der Dialog meldet das.
- **Fehlende Plan-Angaben** (Name, Zeitpunkte, aktive Etage) werden mit Standardwerten ergänzt und im Dialog genannt.
- **Rückfrage vor dem Ersetzen**:
  - Enthält der aktuelle Plan Formen oder Kalibrierungen, warnt der Dialog, dass er ersetzt wird.
  - Der Dialog bietet „Aktuellen Plan exportieren“ an, damit man den bisherigen Stand vorher sichern kann.
  - Erst „Importieren“ bzw. „Trotzdem importieren“ ersetzt den Plan. Danach wird er wie jede Änderung automatisch gespeichert.

## Nicht im Umfang

- Eine echte Migration: Es gibt nur `schemaVersion` 1. Die erste Formatänderung bringt ihre Migration selbst mit.
- Migration beim Start aus dem `localStorage`: Ein gespeicherter Plan mit anderer Version wird weiterhin nach `plan-model` gesichert und als unlesbar behandelt. Das Einbinden der Migration dort gehört zur ersten Formatänderung.
- Zusammenführen: Ein Import ersetzt immer den ganzen Plan. Es gibt kein Anhängen an den bestehenden Plan und keinen Import einzelner Etagen. Auch die bisherige Kalibrierung bleibt für Etagen, die in der Datei fehlen, nicht erhalten.
- Mehrere Pläne verwalten, Namen in der Kopfleiste anzeigen. Umbenennen gibt es nur über den Export-Dialog.
- Import per Ziehen einer Datei ins Fenster, Tastenkürzel (Strg+S/Strg+O), automatische Sicherung des alten Plans vor dem Import (der Dialog bietet dafür den Export an).
- Rückgängig machen eines Imports (kommt mit Undo/Redo).
- Export als Bild oder PDF, Export der Grundrisse.

## Capabilities

### New Capabilities
- `plan-export`: Export des Plans als JSON-Datei, Dateiname und Inhalt der Datei.
- `plan-import`: Import einer Plan-Datei samt Kalibrierung mit Prüfung, Versionshinweis, Migration, Auflistung nicht übernommener Formen und Rückfrage vor dem Ersetzen.

### Modified Capabilities
- `workspace-layout`: Die Kopfleiste zeigt rechts „Importieren“ und „Exportieren“.

## Impact

- **Voraussetzung**: `plan-model` muss umgesetzt sein (`plan-schema.ts` mit `PLAN_SCHEMA_VERSION`, `PlanSchema`, `ShapeSchema`; Plan im Store). `basic-shapes` und `more-shapes` sind nicht nötig, ändern das Format nicht und können vorher oder nachher kommen. `floor-calibration` ist umgesetzt; im Kalibrier-Modus werden die Schaltflächen ausgeblendet.
- Neu in `src/lib/` (jeweils mit Vitest-Test): `plan-export.ts` (Datei-Inhalt, Dateiname), `export-counter.ts` (Version des Exports je Tag und Name), `plan-migration.ts` (Migrationsliste, schrittweise Umwandlung), `plan-import.ts` (Datei prüfen, Plan aufbauen, Prüfergebnis), `shape-issues.ts` (Zod-Fehler als deutscher Grund für Formen und Kalibrierungen).
- Neue Komponenten: `PlanFileActions` (Schaltflächen und Dateiauswahl), `ExportDialog`, `ImportDialog`, `ImportErrorDialog`, shadcn-Komponente `dialog` (`src/components/ui/dialog.tsx`, baut auf dem bereits installierten `@base-ui/react` auf).
- Geändert: `src/lib/plan.ts` (`renamePlan`), `src/store/app-store.ts` (Aktionen `replacePlan` und `renamePlan`), `HeaderBar`, `src/store/app-store.test.ts`, `docs/design/README.md` (Bedienentscheidung „Export/Import“).
- Abhängigkeiten: keine neuen npm-Pakete. Download über Blob-URL, Datei lesen über `File.text()`, keine Netzwerkaufrufe.
- Datenmodell und `schemaVersion`: unverändert (1). Die Exportdatei ist genau das Plan-JSON aus `plan-model` einschließlich `calibrationByFloor`. Neu ist die Regel, dass jede künftige Erhöhung der `schemaVersion` eine Migration von der Vorgängerversion in `plan-migration.ts` mitbringen muss.
