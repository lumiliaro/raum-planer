# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `PLAN_SCHEMA_VERSION` 10 ist und `PLAN_MIGRATIONS[9]` sowie `plan-v9.json` existieren. Die MODIFIED-Anforderungen („Raum verschieben“, „Eigenschaften eines Raums“, „Raum löschen“, „Aufbau des Plans“, „Neuer leerer Plan“) mit dem aktuellen Wortlaut in `openspec/specs/` vergleichen. Prüfen mit `openspec validate room-lock --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v10.json` einfrieren: Version 10 mit den Räumen „Wohnen“ (mit Tür) und „Bad“ (Farbe rot), einem Durchgang mit gemerkten Maßen und geänderten Einstellungen. Die Datei muss vor dem Hochzählen das v10-Schema bestehen. Prüfen mit einem Test in `plan-migration.test.ts`.
- [x] 2.2 `RoomSchema.locked: z.boolean()` und `PLAN_SCHEMA_VERSION = 11` in `src/lib/plan-schema.ts`; Doku-Kommentar am Raum ergänzen. Tests in `plan-schema.test.ts`:
  - Raum mit `locked: true` gültig, mit `locked: false` gültig
  - Raum ohne `locked` ungültig
  - Raum mit `locked: "ja"` ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[10]` in `src/lib/plan-migration.ts` (über `mapRooms`, design.md Entscheidung 1). Tests in `plan-migration.test.ts`:
  - Jeder Raum ohne Feld bekommt `locked: false`, ein vorhandener Wert bleibt.
  - Öffnungen, gemerkte Maße, Farben, Einstellungen und Formen bleiben unverändert.
  - Für jede Version 1…10 gibt es eine Migration.
  - `plan-v10.json` wird über `analyzePlanFile` ohne Warnung außer der Version zu Version 11 („Dateien der Version 10“).
  - `plan-v9.json` kommt über 9 → 10 → 11 ohne weitere Warnung an.

  Prüfen mit `npm test`.
- [x] 2.4 Neue Räume beim Schließen im Store (`src/store/app-store.ts`, Raum-Literal mit `color: plan.settings.defaultRoomColor`) mit `locked: false` anlegen. Raum-Literale in `src/test/plan-fixtures.ts` und in den Tests (`plan.test.ts`, `plan-schema.test.ts`, `plan-import.test.ts`, `plan-export.test.ts`, `plan-diff.test.ts`, `plan-storage.test.ts`, `pdf-layout.test.ts`, `app-store.test.ts`) ergänzen. Store-Test: ein neu gezeichneter Raum hat `locked: false` („Neuer Raum“). Prüfen mit `npx tsc -b` und `npm test`.

## 3. Logik

- [x] 3.1 `src/lib/room-lock.ts` mit `ROOM_LOCK_ALLOWED_FIELDS = ["name", "color", "locked"]`, `isRoomPatchAllowed(room, patch)` und `canDeleteRoom(room)` (design.md Entscheidung 3). Tests in `room-lock.test.ts`:
  - Nicht gesperrter Raum: jeder Patch erlaubt (`pointsCm`, `wallThicknessCm`)
  - Gesperrter Raum: `name`, `color`, `locked` und leerer Patch erlaubt
  - Gesperrter Raum: `pointsCm`, `wallThicknessCm` und gemischter Patch `{ name, pointsCm }` abgelehnt
  - `canDeleteRoom` false bei gesperrtem, true bei nicht gesperrtem Raum

  Prüfen mit `npm test`.
- [x] 3.2 `RoomPatch` in `src/lib/plan.ts` um `locked?: boolean` erweitern; `updateRoom` vergleicht zusätzlich `locked` bei der Prüfung auf „keine Änderung“. Tests in `plan.test.ts`:
  - `{ locked: true }` sperrt den Raum, setzt `updatedAt` und behält Ecken, Öffnungen, Farbe
  - `{ locked: true }` bei bereits gesperrtem Raum gibt denselben Plan zurück

  Prüfen mit `npm test`.
- [x] 3.3 Import in `src/lib/plan-import.ts`: in `readRoom` `locked` vor der Raumprüfung bereinigen (Boolean bleibt, sonst `false`, ohne Hinweis; design.md Entscheidung 2). Tests in `plan-import.test.ts`:
  - Gesperrter Raum bleibt gesperrt, ohne Hinweis
  - `locked: "ja"` → Raum übernommen, nicht gesperrt, kein Hinweis
  - Fehlendes `locked` in einer Datei der Version 11 → nicht gesperrt, kein Hinweis
  - Rundreise Export → Import behält `locked: true` (Test in `plan-export.test.ts`)

  Prüfen mit `npm test`.

## 4. Store

- [x] 4.1 In `src/store/app-store.ts` die Sperre durchsetzen (design.md Entscheidung 4): `updateRoom` prüft `isRoomPatchAllowed`, `moveRoom` prüft den Patch `{ pointsCm }`, `removeRoom` prüft `canDeleteRoom`; `deleteSelectedRoom` hebt die Auswahl nur auf, wenn gelöscht wurde oder der Raum fehlt. Doku-Kommentare der Raum-Aktionen anpassen. Tests in `app-store.test.ts`:
  - Gesperrten Raum verschieben, Kantenlänge oder Wanddicke ändern → `false`, Plan unverändert, kein Rückgängig-Schritt
  - Gesperrten Raum umbenennen und einfärben → möglich, bleibt gesperrt
  - `deleteSelectedRoom` bei gesperrtem Raum → Raum vorhanden und weiterhin ausgewählt
  - Sperren ist ein Rückgängig-Schritt; Raum verschieben, sperren, zweimal Rückgängig → nicht gesperrt und an Ausgangslage
  - Tür in gesperrten Raum setzen, Öffnung ändern und löschen → möglich, Raum unverändert und gesperrt
  - Etage mit gesperrtem Raum löschen → Etage samt Raum entfernt

  Prüfen mit `npm test`.

## 5. Oberfläche

- [x] 5.1 `src/components/properties/RoomProperties.tsx`: Panel-Kopf mit `LockToggle` vor „Löschen“; „Löschen“ bei Sperre per `aria-disabled` gesperrt mit Tooltip „Gesperrt – zuerst entsperren“ (Stil wie `ShapeProperties.tsx`); in `EdgesSection` beide `NumberField`s mit `readOnly={room.locked}`. Doku-Kommentar anpassen. Prüfen mit `npx tsc -b`; im Browser prüft der Nutzer selbst „Raum sperren“, „Raum entsperren“, „Kantenlänge schreibgeschützt“, „Wanddicke schreibgeschützt“, „Gesperrten Raum umbenennen“, „Gesperrten Raum einfärben“ und „Löschen-Schaltfläche gesperrt“.
- [x] 5.2 `src/components/canvas/RoomsLayer.tsx`: `RoomArea` nur ziehbar, wenn der Raum nicht gesperrt ist; Doku-Kommentar der Komponente ergänzen. Prüfen mit `npx tsc -b`; im Browser prüft der Nutzer selbst „Gesperrten Raum ziehen“ (Ansicht verschiebt sich, Raum bleibt), „Gesperrten Raum auswählen“, „Entf bei gesperrtem Raum“ und „Fenster in gesperrtem Raum ziehen“.

## 6. Abschluss

- [x] 6.1 `openspec/config.yaml` (Abschnitt Datenmodell) um `locked: boolean` am Raum und den Change `room-lock` ergänzen. Prüfen durch Lesen der Datei.
- [x] 6.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei; `openspec validate room-lock --strict` meldet keinen Fehler.
