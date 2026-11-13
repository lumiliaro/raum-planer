# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `PLAN_SCHEMA_VERSION` 11 ist und `PLAN_MIGRATIONS[10]` sowie `plan-v10.json` existieren. Die MODIFIED-Anforderungen („Aufbau des Plans“, „Inhalt der Zeichnung“, „Einpassen“, „Liste der Tastenkürzel“) mit dem aktuellen Wortlaut in `openspec/specs/` vergleichen. Prüfen, dass die Taste `W` noch frei ist. Prüfen mit `openspec validate free-wall --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v11.json` einfrieren: Version 11 mit Erdgeschoss (gesperrter Raum „Wohnen“ mit Tür) und Obergeschoss (Raum „Flur“), geänderten Einstellungen. Die Datei muss vor dem Hochzählen das v11-Schema bestehen. Prüfen mit einem Test in `plan-migration.test.ts`.
- [x] 2.2 `WallSchema` und `Wall`-Typ in `src/lib/plan-schema.ts` (design.md Entscheidung 1), `wallsByFloor` im Plan, `checkKeyedByFloors`/`checkUniqueIds` um `"wallsByFloor"` erweitern, `PLAN_SCHEMA_VERSION = 12`. Tests in `plan-schema.test.ts`:
  - Wand (100|100)→(430|100), 15 cm gültig
  - Start = Ende ungültig; Dicke 0 und 120 cm ungültig
  - Wand unter unbekannter Etage ungültig; fehlende Wandliste einer Etage ungültig
  - Doppelte Wand-ID über zwei Etagen ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[11]` in `src/lib/plan-migration.ts`: `wallsByFloor` mit `[]` je Etage ergänzen, vorhandene Einträge behalten. Tests in `plan-migration.test.ts`:
  - Jede Etage bekommt eine leere Wandliste; Räume, Öffnungen, Sperren, Einstellungen und Formen bleiben unverändert
  - Für jede Version 1…11 gibt es eine Migration
  - `plan-v11.json` kommt über `analyzePlanFile` ohne Warnung außer der Version zu Version 12 („Dateien der Version 11“)
  - `plan-v10.json` kommt über 10 → 11 → 12 ohne weitere Warnung an

  Prüfen mit `npm test`.
- [x] 2.4 `createEmptyPlan`, `addFloor`, `removeFloor` und `planHasContent` in `src/lib/plan.ts` um Wände erweitern. Plan-Literale in `src/test/plan-fixtures.ts` und den Tests (`plan.test.ts`, `plan-schema.test.ts`, `plan-import.test.ts`, `plan-export.test.ts`, `plan-diff.test.ts`, `plan-storage.test.ts`, `pdf-layout.test.ts`, `content-bounds.test.ts`, `app-store.test.ts`) um `wallsByFloor` ergänzen. Tests in `plan.test.ts`: neuer Plan und neue Etage haben `[]`; Etage löschen entfernt die Wandliste; `planHasContent` ist mit nur einer Wand wahr. Prüfen mit `npx tsc -b` und `npm test`.

## 3. Logik: Wandgeometrie und Plan-Operationen

- [x] 3.1 `src/lib/wall-geometry.ts` (design.md Entscheidungen 2 und 5): `wallLengthCm`, `wallBandOutline(wall, capStart, capEnd)`, `joinedEnds(walls)`, `setWallLength`, `translateWall`, `wallSideLines`, `wallBounds`. Tests in `wall-geometry.test.ts`:
  - Band von (100|100)→(430|100), 15 cm = Rechteck (100|92,5)…(430|107,5)
  - L-Ecke (0|0)→(300|0) und (300|0)→(300|200), je 10 cm: beide Enden bei (300|0) verbunden, Band deckt (295|−5)…(305|5)
  - Freie Enden ohne Verlängerung; Enden, die nur 0,05 cm auseinanderliegen, gelten nach Rundung als verbunden
  - `setWallLength` 330 → 300 behält den Start; schräge Wand behält die Richtung
  - `wallSideLines` für (100|200)→(400|200), 10 cm: y = 195 und y = 205, je 300 cm

  Prüfen mit `npm test`.
- [x] 3.2 `addWall`, `updateWall`, `moveWall`, `removeWall` in `src/lib/plan.ts` (mit Validierung über `WallSchema`, `updatedAt` setzen, unveränderte Listen per Referenz behalten). Tests in `plan.test.ts`: Hinzufügen ans Ende, ungültiger Patch (Länge 0, Dicke 120) gibt denselben Plan zurück, Verschieben behält Länge und Dicke, Löschen lässt Räume und Formen unverändert, `updatedAt` wird gesetzt. Prüfen mit `npm test`.
- [x] 3.3 `src/lib/plan-diff.ts`: `floorContentChanged` vergleicht `wallsByFloor`. Test in `plan-diff.test.ts`: eine geänderte Wand meldet ihre Etage als geändert. Prüfen mit `npm test`.
- [x] 3.4 `src/lib/content-bounds.ts` und `src/lib/pdf-layout.ts`: Wände (Band inkl. Dicke) zählen zum Inhalt. Tests in `content-bounds.test.ts` („Nur eine freie Wand“: (2000|0)→(2000|600), 24 cm → Grenzen 1988…2012 × 0…600) und `pdf-layout.test.ts` (Etage nur mit Wand ist nicht leer). Prüfen mit `npm test`.
- [x] 3.5 `src/lib/wall-fields.ts` (wie `room-fields.ts`): Länge und Dicke prüfen, Hinweise „Muss größer als 0 cm sein“ / „Darf höchstens 100 cm sein“, Rundung auf 0,1 cm. Tests in `wall-fields.test.ts`. Prüfen mit `npm test`.
- [x] 3.6 Rückfrage beim Löschen einer Etage: die reine Funktion für den Text („mit 2 Formen und 3 Räumen“) um Wände erweitern („Etage „Keller“ mit 2 Wänden löschen?“, Einzahl „1 Wand“). Tests für reine Wände, gemischt und Einzahl. Prüfen mit `npm test`.

## 4. Logik: Einrasten beim Wandzeichnen

- [x] 4.1 `WallLine`/`WallAnchor`/`wallLineFor` in `src/lib/room-drawing.ts` auf eine Quelle `source` umbauen (design.md Entscheidung 2), **ohne** Verhaltensänderung; Store und `RoomDraftLayer.tsx` anpassen. Die bestehenden Tests in `room-drawing.test.ts` und `app-store.test.ts` nur an die neue Form anpassen. Prüfen mit `npx tsc -b` und `npm test` (alle bisherigen Raum-Szenarien grün).
- [x] 4.2 `freeWallLines(walls, exceptId?)` in `src/lib/wall-drawing.ts`: zwei Seitenlinien je Wand, `wallLineFor` löst auch Wand-Quellen auf. Tests: „Seiten einer Wand“; Startpunkt (232|207) → (230|205) mit 130/170 cm; Tab wechselt das Bezugsende.
- [x] 4.3 `snapEndToWallLine(start, direction, pointer, lines, radiusCm)` in `src/lib/wall-drawing.ts`. Tests:
  - „Trennwand von Wand zu Wand“: (260|0), Zeiger (262|396) → (260|400)
  - „Bis an eine andere Wand“: (250|0), Zeiger (252|193) → (250|195)
  - „Schräg zur Wandlinie“: frei (100|100), Zeiger (401|397) → (404|400)
  - parallele Wandlinie ignoriert; Schnittpunkt außerhalb der Wandlinie ignoriert; Schnittpunkt weiter als der Radius vom Zeiger ignoriert; Schnittpunkt auf dem Start ignoriert
- [x] 4.4 `resolveWallPointer(start | null, pointer, ctx, opts)` in `src/lib/wall-drawing.ts` mit dem Vorrang Ecke/Wandende → Wandlinie → Hilfslinie; Hilfslinien-Quellen Raumecken und Enden der anderen Wände (`exceptWallId` beim Endgriff). Tests für jedes Szenario aus „Wandpunkte an Ecken und Wandenden einrasten“, „Hilfslinien beim Wandzeichnen“, „Vorrang beim Einrasten während des Wandzeichnens“ und „Hilfslinien beim Wandzeichnen abschalten“ (Strg/„Einrasten“ aus: ohne Hilfs- und Wandlinien, Ecken und Richtung wirken weiter). Prüfen mit `npm test`.

## 5. Import

- [x] 5.1 `src/lib/plan-import.ts`: Wände je übernommener Etage lesen (design.md Entscheidung 2), ungültige mit Grund zählen („Wand hat keine Länge“, „Dicke ungültig“, „Punkte ungültig“), Wände unbekannter Etagen melden, doppelte IDs neu vergeben, fehlende Liste ohne Hinweis zu `[]`. Prüfergebnis und Dialog (`src/components/plan-file/`) nennen „n Wände werden übernommen“ und die nicht übernommenen Wände. Tests in `plan-import.test.ts` für jedes Szenario aus „Wände aus der Datei“ und „Dateien der Version 11“; Rundreise Export → Import behält Wände (`plan-export.test.ts`). Prüfen mit `npm test`.

## 6. Store

- [x] 6.1 `src/store/app-store.ts`: `ActiveTool` um `"wall"`, `wallDraft` mit Aktionen (design.md Entscheidung 3); Etagen-, Werkzeugwechsel und Kalibrier-Modus verwerfen den Entwurf; `isToolEnabled` sperrt „Wand“ im Kalibrier-Modus. Tests in `app-store.test.ts`:
  - Start setzen, Ende klicken → Wand mit Dicke aus den Einstellungen, ausgewählt, „Auswählen“ aktiv, ein Verlaufsschritt
  - Länge „237,5“ + Enter → (0|0)→(0|237,5); „0“ → Hinweis, keine Wand
  - Rücktaste entfernt den Start; Esc verwirft bzw. wechselt zu „Auswählen“; Etagenwechsel verwirft
  - Ende auf dem Start → keine Wand
  - Abstand auf der Wand: „260“ + Enter setzt den Start; Tab wechselt das Bezugsende
- [x] 6.2 Auswahl `selectedWallId` und `selectWall`, gegenseitiger Ausschluss mit Form/Raum/Öffnung; `moveWall`, `updateWall`, `deleteSelectedWall`; Entf/Rücktaste in `src/hooks/useShapeShortcuts.ts`; Kopieren/Ausschneiden/Duplizieren/Umordnen ohne Wirkung bei Wand. Tests: Auswahlwechsel; Verschieben, Länge, Dicke, Löschen je ein Schritt; abgelehnte Eingabe kein Schritt; Rückgängig nach Etagenwechsel aktiviert die Etage der Wand; Strg+C bei Wand ändert nichts. Prüfen mit `npm test`.

## 7. Oberfläche

- [x] 7.1 Werkzeug: Eintrag in `src/components/layout/tools.ts` nach „Raum“, Symbol in `src/components/icons/shape-icons.tsx`, Tooltip „Wand – einzelne Wand zeichnen (W)“. Test in `tools.test.ts` (Taste `W`, Tooltip, Reihenfolge). Prüfen mit `npm test`.
- [x] 7.2 `src/components/canvas/WallsLayer.tsx` zwischen `RoomsLayer` und `ShapesLayer` in `FloorCanvas.tsx`: Band in der Wandfarbe mit geschlossenen Ecken, Trefferbreite, Auswahl-Umrandung, Klick wählt aus (Treffererkennung über einen Knotennamen wie `ROOM_NODE_NAME`), Ziehen der ausgewählten Wand mit Fangschritt/Alt, Maße bei eingeschalteter Maßanzeige, im Kalibrier-Modus ausgeblendet. Prüfen mit `npx tsc -b`; im Browser prüft der Nutzer selbst „Band um die Mittellinie“, „Wand über einem Raum“, „L-Ecke aus zwei Wänden“, „Schräge Wand“ (Maß), „Wand anklicken“, „Wand ziehen“, „Feine Schritte“.
- [x] 7.3 Endgriffe in `WallsLayer.tsx`: Ziehen eines Griffs über `resolveWallPointer` mit dem anderen Ende als Start, Vorschau mit Länge, Hilfslinien und Ring, Schreiben beim Loslassen. Prüfen mit `npx tsc -b`; im Browser: „Wand verlängern“, „Ende frei drehen“, „Ende an eine Raumwand“, „Ende ziehen rückgängig“.
- [x] 7.4 `src/components/canvas/WallDraftLayer.tsx` und Tastatur beim Zeichnen (Ziffern, Enter, Tab, Rücktaste, Esc, Umschalt, Strg, Alt): gemeinsame Teile aus `RoomDraftLayer.tsx` herausziehen, ohne das Raumzeichnen zu ändern. Prüfen mit `npx tsc -b` und `npm test`; im Browser prüft der Nutzer selbst die Szenarien aus „Wand zeichnen“ bis „Wandzeichnen korrigieren und abbrechen“ sowie stichprobenhaft das Raumzeichnen („Gegenkante gleich lang“, „Startpunkt bei 260 cm“).
- [x] 7.5 `src/components/properties/WallProperties.tsx` und Anbindung in `PropertiesPanel.tsx`: Kopf „Wand“ + „Löschen“, Felder „Länge“ und „Dicke“ über `wall-fields.ts`. Prüfen mit `npx tsc -b`; im Browser: „Panel einer Wand“, „Wand kürzen“, „Null“, „Dicke ändern“, „Zu dick“, „Wand mit Entf löschen“.
- [x] 7.6 PDF: `src/components/plan-pdf/render-floor.ts` zeichnet Wände nach den Räumen ohne Auswahl. Rückfrage in `FloorsDialog.tsx` nutzt den Text aus 3.6. Prüfen mit `npx tsc -b`; im Browser: „Freie Wand“ im PDF, „Etage nur mit Wänden“ löschen, „Nur eine freie Wand“ einpassen.
- [x] 7.7 Hilfe: `src/components/help/shortcuts.ts` um `W` Wand ergänzen, Gruppe in „Raum und Wand zeichnen“ umbenennen und Texte anpassen (Spec `app-help`). Test in `shortcuts.test.ts`. Prüfen mit `npm test`.

## 8. Abschluss

- [x] 8.1 `openspec/config.yaml`: Grundsatz „Räume statt Wände“ anpassen (Räume als Hauptweg, freie Wände als Ergänzung) und im Datenmodell `wallsByFloor`/`Wall { id, startCm, endCm, thicknessCm }` sowie den Change `free-wall` ergänzen. Prüfen durch Lesen der Datei.
- [x] 8.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei; `openspec validate free-wall --strict` meldet keinen Fehler.
