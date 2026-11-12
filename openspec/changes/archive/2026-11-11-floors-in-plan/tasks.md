# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `editing-extras` umgesetzt und archiviert ist (`openspec/specs/edit-history/spec.md` existiert) und `export-import` archiviert ist. Den aktuellen Plan einmal über „Exportieren“ sichern (Rückweg, siehe design.md „Migration Plan“).

## 2. Datenmodell

- [x] 2.1 `src/lib/plan-schema.ts`: `FloorSchema`, `MAX_FLOORS`, `type FloorId = string`, `PlanSchema` v2 mit `floors` und `superRefine` (eindeutige Etagen-IDs, aktive Etage vorhanden, Schlüssel von `shapesByFloor` genau die Etagen, `calibrationByFloor` Teilmenge, Form-IDs planweit eindeutig), `PLAN_SCHEMA_VERSION = 2`. Tests in `plan-schema.test.ts`:
  - gültiger Plan mit „Keller“, „Erdgeschoss“, „Dachgeschoss“
  - keine Etage → ungültig, 9 Etagen → ungültig
  - Name nur aus Leerzeichen → ungültig, 41 Zeichen → ungültig, Name wird getrimmt
  - doppelte Etagen-ID → ungültig
  - aktive Etage nicht in der Liste → ungültig
  - Formen unter „keller“ ohne Etage → ungültig, fehlende Formenliste einer Etage → ungültig
  - Kalibrierung unter „keller“ → ungültig
  - doppelte Form-ID über zwei Etagen → ungültig

  Prüfen mit `npm test`.
- [x] 2.2 `src/lib/plan-migration.ts`: Migration `1 → 2` (Etagen eg/og/dg) eintragen. Tests in `plan-migration.test.ts`:
  - `plan-v1.json` migriert ergibt nach `PlanSchema.parse` die drei Etagen in Reihenfolge, unveränderte Formen (Koordinaten, Maße, Reihenfolge) und unveränderte Kalibrierungen
  - der vorhandene Test „für jede Version 1 … `PLAN_SCHEMA_VERSION − 1` existiert eine Migration“ ist jetzt mit einem Eintrag erfüllt

  Prüfen mit `npm test`.
- [x] 2.3 Fixture `src/lib/__fixtures__/plan-v2.json`: migriertes `plan-v1.json` plus Etage „Keller“ (UUID) an erster Stelle mit einer Form. Test: Die Datei besteht `PlanSchema`. Prüfen mit `npm test`.

## 3. Plan-Operationen

- [x] 3.1 `src/lib/plan.ts`: `createEmptyPlan(now, newId)`, `addFloor`, `renameFloor`, `moveFloor`, `removeFloor`, `canMoveFloor`, `canRemoveFloor`, `nextFloorName`. Dazu `setActiveFloor`, `addShape` und `setCalibration` auf `plan.floors` umstellen. Tests in `plan.test.ts`:
  - leerer Plan: Version 2, eine Etage „Erdgeschoss“ mit UUID-ID, aktiv, leere Formenliste, keine Kalibrierung
  - `addFloor`: am Ende, aktiv, leere Formenliste, `updatedAt` gesetzt. Abgelehnt bei 8 Etagen, vergebener ID und leerem Namen
  - `nextFloorName`: „Neue Etage“, bei Vorhandensein „Neue Etage 2“, Lücke wird gefüllt
  - `renameFloor`: getrimmt, abgelehnt bei leer, 41 Zeichen und unverändert (dasselbe Objekt, `updatedAt` bleibt)
  - `moveFloor`: „Keller“ zweimal nach oben, aktive Etage bleibt. Am Rand abgelehnt
  - `removeFloor`: Formen und Kalibrierung weg, andere Etagen gleiche Referenz. Aktive Etage → Nachfolger, bei der letzten → Vorgänger. Letzte verbliebene Etage abgelehnt
  - `setActiveFloor` auf unbekannte ID → dasselbe Objekt
  - `addShape` mit einer ID, die auf einer anderen Etage vorkommt → abgelehnt

  Prüfen mit `npm test`.
- [x] 3.2 `src/lib/plan-diff.ts`: `sameContent` und `resolveHistoryFocus` für die Etagenliste (design.md, Entscheidung 7). Tests in `plan-diff.test.ts`:
  - umbenannte Etage → kein gleicher Inhalt, Fokus auf diese Etage
  - angelegte Etage rückgängig (sie fehlt in `after`) → Fokus auf `after.activeFloorId`
  - gelöschte Etage wiederhergestellt → Fokus auf sie
  - Etagenwechsel allein → gleicher Inhalt

  Prüfen mit `npm test`.

## 4. Laden und Import

- [x] 4.1 `src/lib/plan-storage.ts`: Migration beim Laden mit Sicherung unter `raumplaner.plan.pre-migration`, neues Ergebnis `migrated`. `takeOverLegacyCalibrations` entfernen. `src/lib/calibration-storage.ts` und `calibration-storage.test.ts` löschen. Tests in `plan-storage.test.ts`:
  - gespeicherter Plan v1 → `migrated`, Etagen eg/og/dg, Formen und Kalibrierung unverändert, Rohtext unter dem Sicherungsschlüssel
  - Sicherung scheitert (`failingWrites`) → `backup-failed`, Originaldaten unverändert
  - Migration liefert ungültigen Plan → `backed-up`
  - Version 3 → `backed-up`
  - kein Plan gespeichert → leerer Plan mit einer Etage, kein Zugriff auf `raumplaner.calibration`

  Prüfen mit `npm test`.
- [x] 4.2 Store: Bei `migrated` den Plan direkt nach dem Start einmal speichern (über den Autosave-Pfad oder `savePlan`), keine Hinweisleiste. Test in `app-store.test.ts` bzw. `plan-autosave.test.ts`: Nach dem Start mit v1-Daten steht unter `raumplaner.plan` ein Plan der Version 2. Prüfen mit `npm test`.
- [x] 4.3 `src/lib/plan-import.ts`: Etagen-Schritt, `invalidFloors`, `floors` im Ergebnis, Formen, Kalibrierungen, aktive Etage und Zählung über die Etagen der Datei (design.md, Entscheidung 5). Tests in `plan-import.test.ts` gegen die Szenarien in `specs/plan-import/spec.md`:
  - `plan-v1.json` → `relation` „older“, Etagen eg/og/dg, Formen und Kalibrierung unverändert
  - `plan-v2.json` → ohne Warnung, gleich `PlanSchema.parse(fixture)`
  - Rundreise mit „Keller“ vor „Erdgeschoss“ → gleicher Plan, keine Warnung
  - eigene Etagen „Keller“, „Wohnung“ ersetzen alle bisherigen
  - doppelte Kennung „og“ → „Spitzboden“ in `invalidFloors` mit „Kennung doppelt“, Formen unter „og“ gehen an die erste
  - Etage ohne Namen → „Name fehlt“. 9 Etagen → die 9. mit „Höchstens 8 Etagen“, ihre Formen als unbekannte Etage
  - leere Etagenliste in v2 → `not-a-plan`. `floors` kein Array → `not-a-plan`
  - Formen unter „kg“ ohne Etage → `unknownFloors`. Kalibrierung unter „kg“ → „Etage unbekannt“
  - aktive Etage „kg“ → erste Etage der Datei, `filledMetadata` enthält „activeFloor“
  - Etage ohne Formenliste → leere Liste ohne Warnung
  - neuere Datei (Version 3 bei `appVersion` 2) mit „schraege-wand“ → 5 übernommen, 1 ungültig

  Prüfen mit `npm test`.

## 5. Store und Verlauf

- [x] 5.1 `src/store/app-store.ts`: Aktionen `addFloor`, `renameFloor`, `moveFloor`, `removeFloor`. `viewports` mit String-Schlüsseln. Kalibrier-Modus endet beim Wechsel auf eine Etage ohne Bild. Selektoren `selectFloors` und `selectFloorName`. Tests in `app-store.test.ts`:
  - `addFloor` → neue Etage aktiv, Auswahl und Werkzeug zurückgesetzt, ein Rückgängig-Schritt
  - Löschen der aktiven Etage → Nachfolger aktiv, Viewport der Etage entfernt
  - Rückgängig nach dem Löschen → Etage an alter Stelle mit Formen und Kalibrierung, sie ist aktiv
  - Rückgängig nach dem Anlegen, während die neue Etage aktiv ist → vorherige Etage aktiv, keine nicht vorhandene `activeFloorId`
  - Umbenennen rückgängig → alter Name
  - Kalibrier-Modus aktiv, Wechsel auf „Keller“ ohne Bild → Modus beendet

  Prüfen mit `npm test`.
- [x] 5.2 `src/config/house.ts` und `house.test.ts` entfernen. `src/config/legacy-floor-images.ts` mit `floorImageFile(id)` plus Test (eg/og/dg → Dateiname, UUID → `null`). Alle Importe von `@/config/house` umstellen (siehe Liste in design.md, Context), `npm run build` ohne Typfehler. Prüfen mit `npm test` und `npm run build`.

## 6. Oberfläche

- [x] 6.1 `FloorSwitcher` liest `plan.floors`, kürzt lange Namen, und die Schaltfläche „Etagen bearbeiten“ steht rechts daneben (nicht im Kalibrier-Modus). Prüfen im Browser (manuell):
  - Nach dem ersten Start mit dem bisherigen Plan zeigt der Umschalter „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“. Alle Möbel liegen unverändert, Maßstab wie vorher.
  - Im Kalibrier-Modus ist „Etagen bearbeiten“ nicht zu sehen.
- [x] 6.2 `src/components/floors/FloorsDialog.tsx` (design.md, Entscheidung 8). Prüfen im Browser (manuell) gegen `specs/floor-management/spec.md`:
  - „Etage hinzufügen“ → „Neue Etage“ am Ende, aktiv. Erneut → „Neue Etage 2“. Bei 8 Etagen gesperrt mit Tooltip.
  - Umbenennen mit Enter und beim Verlassen. Leer → Hinweis, alter Name bleibt. `Esc` setzt zurück.
  - „Nach oben“/„Nach unten“, an den Rändern gesperrt. Die aktive Etage bleibt aktiv.
  - Leere Etage löschen ohne Rückfrage. Etage mit Formen → Rückfrage mit Name und Anzahl, „Abbrechen“ behält sie. Letzte Etage: „Löschen“ gesperrt mit Tooltip.
  - Nach „Fertig“ macht Strg+Z die letzte Etagenänderung rückgängig.
  - Tastatur: Tab erreicht alle Felder und Schaltflächen, `Esc` schließt.
- [x] 6.3 `FloorCanvas` und `ToolBar` für Etagen ohne Bild (design.md, Entscheidung 6). Prüfen im Browser (manuell):
  - Neue Etage „Keller“ → Hinweis „Für diese Etage gibt es noch keinen Grundriss.“
  - „Etage kalibrieren“ gesperrt mit Tooltip.
  - Wechsel aus dem Kalibrier-Modus des Erdgeschosses in den Keller beendet den Modus.
- [x] 6.4 `ImportDialog`, `StatusBar`, `CalibrationPanel` und übrige Komponenten nutzen die Etagennamen aus dem Plan. Neue Zeile „Nicht übernommene Etagen“ im Import-Dialog. Prüfen im Browser (manuell):
  - Export, dann Import derselben Datei → keine Warnung, Etagen in Reihenfolge.
  - Eine alte Exportdatei (Version 1) → „Datei aus einer älteren Version“, nach dem Bestätigen drei Etagen mit allen Formen.
  - Eine von Hand angepasste Datei mit doppelter Etagen-Kennung → Zeile „Nicht übernommene Etagen“.

## 7. Dokumentation

- [x] 7.1 `docs/design/README.md`, Bedienentscheidungen:
  - Neue Zeile „Etagen“: Dialog, Regeln 1–8 Etagen, 1–40 Zeichen, „Neue Etage n“, Rückfrage beim Löschen, Rückgängig.
  - Zeile „Kalibrierung“ ergänzen: Sie gilt nur für Etagen mit Grundriss.
  - Zeile „Speichern“: Migration beim Start mit Sicherung `raumplaner.plan.pre-migration`.
  - Zeile „Export/Import“: Etagen kommen aus der Datei.

  Prüfen, dass die Zeilen zu design.md passen.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Deltas unter `specs/`. `npm run lint` ohne neue Warnungen.
- [x] 8.2 `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Nach der Prüfung mit `/opsx:archive` archivieren, bevor `floor-underlay` umgesetzt wird.
