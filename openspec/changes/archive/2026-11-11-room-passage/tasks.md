# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `wall-thickness` archiviert ist und `PLAN_SCHEMA_VERSION` 6 ist (`room.wallThicknessCm`, `openingGap`/`windowSymbol` mit Wanddicke). Die MODIFIED-Anforderungen dieses Changes mit dem aktuellen Wortlaut in `openspec/specs/{room-openings,plan-data,plan-import}/spec.md` vergleichen und angleichen. Prüfen mit `openspec validate room-passage --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v6.json` einfrieren: Version 6, ein Raum mit Wanddicken 36,5/15/15/15 cm, Tür und Fenster. Die Datei muss vor dem Hochzählen das v6-Schema bestehen. Prüfen mit einem Test.
- [x] 2.2 `OpeningSchema.kind` um `"passage"` erweitern, `PLAN_SCHEMA_VERSION = 7`. Tests in `plan-schema.test.ts`:
  - Durchgang 500 cm mit Abstand 0 cm auf 500-cm-Kante gültig
  - Durchgang mit Aufschlag ungültig
  - unbekannte Art „bogen“ ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[6]` (Identität). Tests in `plan-migration.test.ts`:
  - Daten bleiben gleich, Version 7.
  - Für jede Version 1…6 gibt es eine Migration.
  - Die Fixture wird über `analyzePlanFile` ohne Warnung zu Version 7.

  Prüfen mit `npm test`.

## 3. Logik

- [x] 3.1 `DEFAULT_PASSAGE_WIDTH_CM`, `defaultOpeningWidthCm` und `createOpening` für `passage` in `src/lib/opening-placement.ts`. Tests in `opening-placement.test.ts`:
  - Klick bei y = 260 cm auf 330-cm-Kante → Breite 100 cm, von 210 cm bis 310 cm, `swing: null`
  - 60-cm-Kante → 60 cm, Abstand 0 cm

  Prüfen mit `npm test`.
- [x] 3.2 `openingKindName` (z. B. in `src/lib/opening-geometry.ts` oder `format.ts`) und `applyFullEdge` in `src/lib/opening-fields.ts`. Hinweis „Geht nicht: Durchgang auf Kante n passt nicht mehr“ in `room-fields.ts`. Tests:
  - Namen der drei Arten
  - `applyFullEdge` bei 100/200 auf 500 cm → 0/500
  - schon voll → `null`
  - Kante 1 eines Raums mit voller Durchgangsbreite auf 480 cm → Hinweis mit „Durchgang“

  Prüfen mit `npm test`.
- [x] 3.3 `formatOpeningCount` in `src/lib/format.ts` und `describeOpeningIssue` in `src/lib/shape-issues.ts`. Tests:
  - „7 Türen und 4 Fenster“ (ohne Durchgänge)
  - „7 Türen, 4 Fenster und 1 Durchgang“
  - „0 Türen, 0 Fenster und 2 Durchgänge“
  - Durchgang mit `swing` → „Aufschlag ungültig“

  Prüfen mit `npm test`.

## 4. Store und Import

- [x] 4.1 `ActiveTool` um `"passage"` erweitern, Werkzeug auf `insertOpening("passage", …)` abbilden, `isToolEnabled` wie bei Tür und Fenster. Tests in `app-store.test.ts`:
  - D-Werkzeug setzt einen Durchgang, wählt ihn aus und schaltet auf „Auswählen“.
  - ohne Raum gesperrt
  - Strg+Z nach „Ganze Kante“ stellt Breite und Abstand wieder her und wählt den Durchgang aus

  Prüfen mit `npm test`.
- [x] 4.2 `openingCounts.passages` in `src/lib/plan-import.ts`, Text in `ImportDialog`. Tests in `plan-import.test.ts`:
  - Zählung 7/4/1
  - Durchgang mit Aufschlag → gemeldet, Raum ohne ihn übernommen
  - Rundreise mit Durchgang ohne Warnung

  Prüfen mit `npm test`.

## 5. Oberfläche

- [x] 5.1 Werkzeug „Durchgang“ in `tools.ts` unter „Fenster“ mit `PassageIcon` in `shape-icons.tsx`, Tests in `tools.test.ts` (Taste D, Tooltips). Prüfen mit `npm test` und im Browser (manuell) gegen „Werkzeug per Taste“ und „Etage ohne Raum“.
- [x] 5.2 `OpeningNode` für Durchgänge: Trefferfläche über die Wanddicke, keine Linien, Auswahlumriss. Prüfen im Browser (manuell) gegen „Offenes Stück in der Wand“, „Kurze Kante“, „Offen zum Flur“, „Durchgang auswählen“, Ziehen entlang der Kante und Kalibrier-Modus (ausgeblendet).
- [x] 5.3 `OpeningProperties`: Kopf „Durchgang“ mit Icon, „Ganze Kante“ (gesperrt, wenn schon voll), kein Aufschlag und Anschlag. Prüfen im Browser (manuell) gegen „Durchgang im Panel“, „Wand fehlt komplett“, „Rückgängig“ und „Offene Kante wird kürzer“.

## 6. Dokumentation

- [x] 6.1 Die Zeile „Türen und Fenster“ in `docs/design/README.md` um den Durchgang ergänzen (Taste D, 100 cm, kein Symbol, Auswahlumriss, „Ganze Kante“, Eckstück bleibt). In `openspec/config.yaml` im Datenmodell `Opening = Tür, Fenster oder Durchgang` eintragen. Prüfen, dass beides zu design.md passt.

## 7. Abschluss

- [x] 7.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Specs dieses Changes, dazu Neuladen (Durchgänge bleiben) und Import der Fixture v6. `npm run lint` ohne neue Warnungen.
- [x] 7.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
