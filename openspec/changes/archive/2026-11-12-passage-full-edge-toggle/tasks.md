# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `app-settings` archiviert ist und `PLAN_SCHEMA_VERSION` 9 ist (`Plan.settings`, `PLAN_MIGRATIONS[8]`, Fixture `plan-v8.json`). Die MODIFIED-Anforderungen („Eigenschaften einer Öffnung“, „Ganze Kante öffnen“, „Aufbau des Plans“, „Neuer leerer Plan“) mit dem aktuellen Wortlaut in `openspec/specs/` vergleichen und angleichen. Prüfen mit `openspec validate passage-full-edge-toggle --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v9.json` einfrieren: Version 9 mit `settings` (geänderte Werte, z. B. Wanddicke 11,5 cm) und einem Raum mit Tür und einem Durchgang über die ganze Kante. Die Datei muss vor dem Hochzählen das v9-Schema bestehen. Prüfen mit einem Test.
- [x] 2.2 `OpeningSchema.beforeFullEdge` (`{ offsetCm ≥ 0, widthCm > 0 } | null`, Wert nur bei `passage`) und `PLAN_SCHEMA_VERSION = 10` in `src/lib/plan-schema.ts`. Tests in `plan-schema.test.ts`:
  - Durchgang mit `null` gültig
  - Fenster mit `{ offsetCm: 190, widthCm: 120 }` gültig
  - Durchgang mit `{ offsetCm: 200, widthCm: 100 }` gültig, auch wenn die Kante nur 150 cm lang ist (keine Passt-Prüfung)
  - Tür mit Wert ungültig
  - `widthCm: 0` und `offsetCm: -1` ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[9]` in `src/lib/plan-migration.ts`. Tests in `plan-migration.test.ts`:
  - Jede Öffnung bekommt `beforeFullEdge: null`.
  - Ein vorhandenes Feld bleibt.
  - `settings` und alle übrigen Angaben bleiben unverändert.
  - Für jede Version 1…9 gibt es eine Migration.
  - `plan-v9.json` wird über `analyzePlanFile` ohne Warnung außer der Version zu Version 10, die Einstellungen bleiben („Dateien der Version 9“).
  - `plan-v8.json` kommt über 8 → 9 → 10 ohne weitere Warnung an.

  `createOpening` in `opening-placement.ts` setzt `beforeFullEdge: null` (Test in `opening-placement.test.ts`); Opening-Literale in Tests und Fixtures der aktuellen Version ergänzen. Prüfen mit `npm test` und `npx tsc -b`.

## 3. Logik

- [x] 3.1 In `src/lib/opening-fields.ts` `applyFullEdge` ersetzen durch `isFullEdge`, `toggleFullEdge` und `fallbackOpeningSize` (design.md, Entscheidung 3). Tests in `opening-fields.test.ts`:
  - Kante 500 cm, Durchgang 100/200: Anhaken → `{ offsetCm: 0, widthCm: 500, beforeFullEdge: { offsetCm: 200, widthCm: 100 } }`
  - Abhaken mit gemerkten 100/200 → `{ offsetCm: 200, widthCm: 100, beforeFullEdge: null }`
  - Abhaken ohne gemerkte Maße, Kante 500 cm → 100 cm bei Abstand 200 cm (Werkseinstellung)
  - Abhaken ohne gemerkte Maße bei Standardbreite Durchgang 90 cm, Kante 500 cm → 90 cm bei Abstand 205 cm
  - Fenster ohne gemerkte Maße, Kante 500 cm → 120 cm bei Abstand 190 cm (Werkseinstellung)
  - Fenster 120/190 anhaken und abhaken → wieder 120/190
  - Abhaken, Kante 80 cm → 40 cm bei Abstand 20 cm (Durchgang) bzw. Kante 120 cm → 60/30 (Fenster)
  - Gemerkte Maße passen nicht mehr (Kante 250 cm, gemerkt 100/200) → Ersatzmaße
  - Anhaken bei schon ganzer Kante und Abhaken bei nicht ganzer Kante → `null`
  - `isFullEdge` mit Toleranz `OPENING_FIT_EPS_CM`

  Prüfen mit `npm test`.
- [x] 3.2 `updateOpening` in `src/lib/plan.ts`: Patch mit `widthCm` oder `offsetCm` ohne Schlüssel `beforeFullEdge` setzt `beforeFullEdge: null`; `sameOpening` vergleicht `beforeFullEdge`. Tests in `plan.test.ts`:
  - Breite ändern leert gemerkte Maße
  - Patch `{ offsetCm }` (Ziehen) leert sie
  - Patch aus `toggleFullEdge` behält den gesetzten Wert
  - Patch nur mit `swing` lässt das Feld unverändert

  Prüfen mit `npm test`.
- [x] 3.3 Import in `src/lib/plan-import.ts`: `beforeFullEdge` vor der Einzelprüfung jeder Öffnung bereinigen (fehlend, ungültig oder Art = `door` → `null`, ohne Hinweis). Tests in `plan-import.test.ts`:
  - Fenster mit gültigen gemerkten Maßen behält sie ohne Hinweis
  - Tür mit gemerkten Maßen wird ohne Hinweis und mit `null` übernommen
  - Durchgang mit gemerkter Breite -10 cm wird mit `null` übernommen
  - Rundreise Export → Import behält gültige gemerkte Maße von Durchgang und Fenster ohne Warnung („Gemerkte Maße in der Exportdatei“, Test in `plan-export.test.ts`)

  Prüfen mit `npm test`.

## 4. Oberfläche

- [x] 4.1 `src/components/properties/OpeningProperties.tsx`: Schaltfläche „Ganze Kante“ durch ein kontrolliertes natives Kästchen ersetzen (`checked={isFullEdge(...)}`, `onChange` → `toggleFullEdge` → `updateOpening`), nie gesperrt, bei Durchgängen und Fenstern (nicht bei Türen), Stil wie „Sichtbar“ in `UnderlaySection.tsx`; Doku-Kommentar anpassen. Store-Test in `app-store.test.ts` auf `toggleFullEdge` umstellen und ergänzen: Anhaken, Abhaken und Rückgängig sind je ein Schritt, nach Rückgängig stimmen Maße und Auswahl, für einen Durchgang und ein Fenster. Prüfen mit `npm test`; im Browser prüft der Nutzer selbst die Szenarien „Wand fehlt komplett“, „Wieder abhaken“, „Gemerkt über Neuladen“, „Ganze Kante per Eingabe“, „Fensterband über die ganze Wand“ und „Tür ohne Kästchen“.
- [x] 4.2 `docs/design/README.md`, Zeile „Türen und Fenster“: „Schaltfläche „Ganze Kante“ (Outline, klein) … gesperrt, wenn …“ ersetzen durch das Kästchen „Ganze Kante“ bei Durchgängen und Fenstern (Haken = Öffnung nimmt die ganze Kante ein; Anhaken merkt Breite und Abstand, Abhaken stellt sie wieder her, sonst Standardbreite der Art aus den Einstellungen bzw. halbe Kantenlänge mittig; je ein Rückgängig-Schritt). Prüfen durch Lesen des Abschnitts.

## 5. Abschluss

- [x] 5.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei, `openspec validate passage-full-edge-toggle --strict` meldet keine Fehler.

## Workflow follow-up

- Nach der Abnahme im Browser den Change archivieren (`/opsx:archive`), damit die Deltas in `openspec/specs/` übernommen werden.
