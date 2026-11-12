# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `plan-model` umgesetzt ist (`PLAN_SCHEMA_VERSION`, `ShapeSchema`, `PlanSchema` mit `calibrationByFloor`, Plan und Autosave im Store). Prüfen, dass jede `.refine`-Regel in `src/lib/plan-schema.ts` das betroffene Feld als `path` angibt (z. B. `["cornerRadiusCm"]`), sonst ergänzen und in `plan-schema.test.ts` den Pfad für den Fall „Eckradius 50 cm bei 200 × 90 cm“ prüfen. Prüfen mit `npm test`.

## 2. Export-Logik

- [x] 2.1 `src/lib/plan-export.ts` mit `serializePlan`, `exportFileBase`, `localDateKey` und `exportFileName` plus `plan-export.test.ts`:
  - Ausgabe ist eingerückt und endet mit Zeilenumbruch.
  - `JSON.parse(serializePlan(p))` ergibt `p`.
  - Die Ausgabe enthält keine Schlüssel außer denen des Plans.
  - Ein Plan mit Kalibrierung im Erdgeschoss enthält sie unter `calibrationByFloor.eg`. Das nicht kalibrierte Obergeschoss hat keinen Eintrag.
  - „Meine Planung“ am 11.11.2026, Version 1 → `2026-11-11-meine-planung_1.json`.
  - „Möbel Größe/Übersicht“ am 03.12.2026, Version 1 → `2026-12-03-moebel-groesse-uebersicht_1.json`.
  - „  “ und „!!!“ → `…-raumplaner_1.json`.
  - Lokales Datum kurz vor Mitternacht.

  Prüfen mit `npm test`.
- [x] 2.2 `formatShapeCount` in `src/lib/format.ts` plus Test in `format.test.ts` („0 Formen“, „1 Form“, „23 Formen“). Prüfen mit `npm test`.
- [x] 2.3 `src/lib/export-counter.ts` mit `createExportCounter(storage)` (`peek`, `take`) plus `export-counter.test.ts`:
  - erster Export des Tages → 1, danach 2, 3
  - `peek` zählt nicht hoch
  - neuer Tag → wieder 1
  - anderer Name am selben Tag → 1; „Umzug“ und „umzug“ zählen zusammen
  - neuer Zähler auf demselben Speicher (Neuladen) zählt weiter
  - blockierter Speicher (`throwingStorage`) und voller Speicher (`failingWrites`) zählen in der Sitzung weiter
  - kaputter Wert im Speicher → beginnt bei 1

  Prüfen mit `npm test`.

## 3. Migration und Prüfung

- [x] 3.1 `src/lib/plan-migration.ts` mit `PlanMigration`, leerem `PLAN_MIGRATIONS`, `migratePlanData` und `MigrationError` plus `plan-migration.test.ts`:
  - zwei Test-Migrationen 1→2→3 werden nacheinander angewendet, `schemaVersion` ist danach 3
  - fehlender Schritt → `MigrationError`
  - werfender Schritt → `MigrationError`
  - Rückgabe ohne Objekt → `MigrationError`
  - `from === to` lässt die Daten unverändert
  - für jede Version 1 … `PLAN_SCHEMA_VERSION − 1` existiert ein Eintrag (heute leer erfüllt)

  Prüfen mit `npm test`.
- [x] 3.2 `src/lib/shape-issues.ts` mit `describeShapeIssue` und `describeCalibrationIssue` plus `shape-issues.test.ts`:
  - Rechteck ohne `widthCm` → „Breite fehlt“
  - Eckradius 50 cm bei 200 × 90 cm → „Eckradius ungültig“
  - `kind` „schraege-wand“ → „Formtyp „schraege-wand“ unbekannt“
  - fehlendes `kind` → „Formtyp fehlt“
  - Füllfarbe „blau“ → „Füllfarbe ungültig“
  - Deckkraft 1,5 → „Deckkraft ungültig“
  - unbekannter Pfad → „Angaben ungültig“
  - Kalibrierung mit `pxPerCm` 0 → „Maßstab ungültig“
  - Kalibrierung ohne `p2` → „Punkt 2 fehlt“

  Prüfen mit `npm test`.
- [x] 3.3 `src/lib/__fixtures__/plan-v1.json` anlegen: Version 1, alle drei Etagen, alle sieben Formtypen, darunter eines mit Beschriftung und eines mit `fill: null`, Kalibrierung für Erdgeschoss und Obergeschoss, Dachgeschoss ohne. Die Datei muss `PlanSchema` bestehen. Prüfen mit einem Test in 3.5.
- [x] 3.4 `src/lib/plan-import.ts` mit `analyzePlanFile` und dem Typ `ImportAnalysis` umsetzen (Ablauf laut design.md, Entscheidung 4).
- [x] 3.5 `src/lib/plan-import.test.ts` mit festem `now` und zählendem `newId` gegen alle Szenarien in `specs/plan-import/spec.md`:
  - **Fehler**:
    - kein JSON → `not-json`
    - `{"name":"x"}`, `package.json`-artiger Inhalt, `schemaVersion` 0, „1“ als String und 1,5 → `not-a-plan`
    - Etagenwert ist kein Array → `not-a-plan`
  - **Fixture**: wird ohne Warnungen und gleich `PlanSchema.parse(fixture)` übernommen. Export→Import-Rundreise mit Kalibrierung: gleicher Plan, `hasWarnings` falsch.
  - **Zählung**: 14/9/0 Formen ergeben „23“ und `countsByFloor` in Etagen-Reihenfolge.
  - **Unbekannte Etage** „kg“ mit drei beschrifteten Formen: Namen in Reihenfolge, nicht im Plan.
  - **Ungültige Form**: „Teppich“ ohne Breite zwischen A und B → aufgelistet mit „Breite fehlt“, Obergeschoss enthält A, B. Ein Rechteck ohne Beschriftung heißt „Rechteck“.
  - **Doppelte ID** im Erdgeschoss und doppelte ID über zwei Etagen: zweite Form neue ID, `reassignedIds` 1.
  - **Plan-Angaben**: fehlender Name, ungültiges `createdAt`, aktive Etage „kg“ → Ersatzwerte und `filledMetadata`. Fehlende Etage `dg` → leere Liste ohne Warnung.
  - **Kalibrierung**: gültige Einträge übernommen. `pxPerCm` 0 im Obergeschoss → Eintrag in `invalidCalibrations` mit „Maßstab ungültig“, Obergeschoss nicht kalibriert, `hasWarnings` wahr. Eintrag unter „kg“ → „Etage unbekannt“. Fehlendes `calibrationByFloor` → keine Kalibrierung, keine Warnung. `calibrationByFloor` als Array → ein Eintrag „Angaben ungültig“.
  - **Ältere Version**: `appVersion` 2 mit Test-Migration 1→2 → `relation` „older“, Migration angewendet. Ohne Migration → `migration-failed` mit Versionen.
  - **Neuere Version**: Version 2 bei `appVersion` 1 mit 5 Rechtecken und einer „schraege-wand“ → 5 übernommen, 1 ungültig, `relation` „newer“.

  Prüfen mit `npm test`.

## 4. Store

- [x] 4.1 `replacePlan` in `src/store/app-store.ts` (defensive Schema-Prüfung, Rückgabe `true`/`false`; hebt Auswahl und Werkzeug auf, falls `basic-shapes` umgesetzt ist) plus Tests in `app-store.test.ts`:
  - Plan wird ersetzt, aktive Etage kommt aus dem neuen Plan, `updatedAt` bleibt der Wert aus der Datei.
  - Ein ungültiger Plan wird abgelehnt, der alte bleibt.
  - Die Kalibrierung kommt aus dem neuen Plan. Eine vorher kalibrierte Etage ohne Kalibrierung im neuen Plan ist danach nicht kalibriert.
  - Viewports bleiben erhalten.
  - Autosave speichert den neuen Plan (mit Fake-Timern).

  Prüfen mit `npm test`.
- [x] 4.2 `renamePlan(plan, name, now)` in `src/lib/plan.ts` und Store-Aktion `renamePlan(name)` plus Tests in `plan.test.ts` und `app-store.test.ts`:
  - Name wird getrimmt übernommen, `updatedAt` gesetzt, Formen und Kalibrierung bleiben.
  - Leerer bzw. nur aus Leerzeichen bestehender Name und unveränderter Name → dasselbe Objekt, Store liefert `false`.
  - Autosave speichert den neuen Namen.

  Prüfen mit `npm test`.

## 5. Oberfläche

- [x] 5.1 `npx shadcn@latest add dialog` ausführen. Prüfen: `git diff package.json` zeigt keine neuen Pakete, `npm run build` läuft.
- [x] 5.2 `src/components/plan-file/download.ts` und `PlanFileActions` mit „Importieren“/„Exportieren“ in der rechten Spalte der `HeaderBar`, im Kalibrier-Modus ausgeblendet. Prüfen im Browser (manuell):
  - Nach dem Export-Dialog (5.6) lädt der Browser `<heute>-<name>_1.json` herunter, ohne Netzwerkaufruf im Netzwerk-Tab.
  - Die Datei ist im Editor lesbar und enthält weder Zoom noch Panel-Zustand.
  - Nach dem Kalibrieren des Erdgeschosses enthält die Datei dessen Kalibrierung.
  - Im Kalibrier-Modus sind beide Schaltflächen verschwunden.
- [x] 5.3 `ImportErrorDialog` und Dateiauswahl (Größengrenze 5 MB, `value` zurücksetzen). Prüfen im Browser (manuell):
  - `package.json` des Projekts → „keine Raumplaner-Datei“.
  - Eine Textdatei mit „kaputt“ als `.json` → „kein gültiges JSON“.
  - Plan danach unverändert.
  - Dateiauswahl abbrechen → nichts passiert.
- [x] 5.4 `ImportDialog` nach dem Artboard „Import“ (Symbol, Titel und Text je Version, Kasten „Ergebnis der Prüfung“, Ersetzen-Hinweis, drei Schaltflächen). Prüfen im Browser (manuell) mit von Hand vorbereiteten Dateien (Kopien der Fixture):
  - **Eigener Export, leerer Plan**: „Plan importieren“, nur die Zeilen zu Formen und Kalibrierung, keine Ersetzen-Warnung, „Importieren“.
  - **Datei mit Etage „kg“, „Teppich“ ohne Breite, doppelter ID, Maßstab 0 im Obergeschoss und `schemaVersion` 2**: „Datei aus einer neueren Version“ mit allen Zeilen, „Trotzdem importieren“.
  - **Aktueller Plan nur mit Kalibrierung**: Die Ersetzen-Warnung erscheint.
  - **Aktueller Plan mit Formen**: Warnung mit Planname, „Aktuellen Plan exportieren“ lädt ohne Namensabfrage `<heute>-<name>_<n>.json` herunter und der Dialog bleibt offen.
  - **Bedienung**: Esc, Overlay-Klick und „Abbrechen“ lassen den Plan unverändert. Dieselbe Datei lässt sich sofort erneut wählen. Tastatur: Tab erreicht alle Schaltflächen, der Fokus bleibt im Dialog.
- [x] 5.5 Bestätigen ersetzt den Plan. Prüfen im Browser (manuell):
  - Nach „Importieren“ erscheint der Plan aus der Datei mit dessen aktiver Etage.
  - Die Statusleiste zeigt „Lokal gespeichert“.
  - Die Statusleiste zeigt den Maßstab aus der Datei. Eine Etage ohne Kalibrierung in der Datei zeigt „Nicht kalibriert“.
  - Nach dem Neuladen ist der importierte Plan noch da.
  - Zoom je Etage bleibt erhalten.
- [x] 5.6 `ExportDialog` („Plan exportieren“, Feld „Name des Plans“, Dateiname-Vorschau) und `exportPlan`/`previewExportFileName` in `download.ts`; „Exportieren“ in der Kopfleiste öffnet den Dialog. Prüfen im Browser (manuell) gegen `specs/plan-export/spec.md`:
  - Plan „Meine Planung“: Feld leer und fokussiert, Vorschau `…-raumplaner_1.json` bzw. nach Eingabe „Umzug“ `<heute>-umzug_1.json`.
  - Enter lädt `<heute>-umzug_1.json` herunter, der Dialog schließt sich. Erneut „Exportieren“: Feld zeigt „Umzug“, Vorschau `_2`, Download `_2`.
  - Nach dem Neuladen zählt der Export bei `_3` weiter und der Plan heißt noch „Umzug“.
  - Name „Umzug neu“ → `<heute>-umzug-neu_1.json`.
  - Leeres Feld bzw. nur Leerzeichen → Hinweis „Bitte einen Namen eingeben“, kein Download.
  - `Esc`, Overlay-Klick und „Abbrechen“: kein Download, Name unverändert.
  - Ein importierter Plan mit Namen „Umzug Musterhaus“ füllt das Feld damit vor.

## 6. Dokumentation

- [x] 6.1 `docs/design/README.md`, Bedienentscheidungen: Zeile „Export/Import“ ergänzen.
  - Export fragt jedes Mal nach dem Namen (vorausgefüllt, leer bei „Meine Planung“), übernimmt ihn als Planname und lädt sofort herunter.
  - Dateiname `YYYY-MM-DD-<name>_<n>.json`, Version n je Tag und Name ab 1, Zähler im Browser.
  - Import immer mit Prüf-Dialog.
  - Doppelte IDs bekommen eine neue ID.
  - Unbekannte Etagen und ungültige Formen werden aufgelistet.
  - Die Kalibrierung wird mit exportiert und importiert. Fehlt sie in der Datei, ist die Etage danach nicht kalibriert.
  - Regel: jede Erhöhung der `schemaVersion` bringt eine Migration und eine Fixture mit.

  Prüfen, dass die Zeile zu design.md passt.

## 7. Abschluss

- [x] 7.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien in `specs/plan-export/spec.md`, `specs/plan-import/spec.md` und `specs/workspace-layout/spec.md`. `npm run lint` ohne neue Warnungen.
- [x] 7.2 `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Change nach der Prüfung mit `/opsx:archive` archivieren (nach `plan-model`).
- Bei der ersten Formatänderung: Migration in `PLAN_MIGRATIONS` eintragen, neue Fixture anlegen und die Migration auch beim Laden aus dem `localStorage` anwenden (heute „Nicht im Umfang“).
