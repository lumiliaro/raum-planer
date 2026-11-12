# Tasks

## 1. Voraussetzungen prüfen

- [x] 1.1 Prüfen, dass `basic-shapes` und `shape-properties` umgesetzt sind, und die Annahmen aus design.md (Context) abgleichen:
  - Store-Felder `plan`, `selectedShapeId`, `activeTool`, Kalibrier-Entwurf
  - Aktionen `updateShape`/`removeShape`/`reorderShape`, ggf. `replacePlan` aus `export-import`
  - `useShapeShortcuts`/`isEditableTarget`
  - Formular übernimmt bei Enter/Verlassen, nicht bei jedem Tastendruck
  - Abschnitte „Maße“/„Lage“ lassen sich schreibgeschützt schalten

  Abweichungen in design.md und den folgenden Aufgaben nachziehen; prüfen mit `openspec validate editing-extras --strict`

## 2. Reine Logik in `src/lib/`

- [x] 2.1 `src/lib/plan-diff.ts` mit `sameContent(a, b)`, `resolveHistoryFocus(before, after)` und `resolveHistoryName(before, after)` umsetzen (siehe design.md Entscheidungen 1 und 2); `src/lib/plan-diff.test.ts`:
  - nur `activeFloorId`/`updatedAt`/`name` verschieden → gleich
  - `resolveHistoryName`: gleiches `createdAt` → `before.name`, anderes `createdAt` (Import) → `after.name`
  - andere Formenliste → verschieden
  - andere Kalibrierung einer Etage → verschieden
  - Verschieben im Erdgeschoss rückgängig → Etage `eg`, Form = verschobene Form
  - Einfügen rückgängig → Etage der Form, keine Form
  - Löschen rückgängig → Form wieder ausgewählt
  - Änderung auf zwei Etagen (Import) → `after.activeFloorId`, keine Form
  - zwei geänderte Formen auf einer Etage → Etage, keine Form
  - Kalibrierung des Obergeschosses geändert → Etage `og`, keine Form

  Prüfen mit `npm test`
- [x] 2.2 `src/lib/shape-lock.ts` mit `LOCK_ALLOWED_FIELDS`, `isPatchAllowed`, `canDelete` umsetzen; `src/lib/shape-lock.test.ts`:
  - nicht gesperrt → alles erlaubt
  - gesperrt: `label`, `style`, `locked` erlaubt
  - gesperrt: `x`, `rotationDeg`, `mirrored`, `widthCm`, `legAWidthCm`, `pointsCm` und ein gemischter Patch `{ label, x }` abgelehnt
  - `canDelete` nur ohne Sperre

  Prüfen mit `npm test`
- [x] 2.3 `canReorder(plan, floorId, id, direction)` in `src/lib/plan.ts` ergänzen; in `plan.test.ts` testen:
  - oberste Form: `forward`/`front` falsch, `backward`/`back` wahr
  - einzige Form: alles falsch
  - unbekannte ID: falsch
  - zusätzlich: alle Plan-Funktionen übernehmen die Formenlisten und Kalibrierungen unveränderter Etagen per Referenz (Voraussetzung für Entscheidung 1)

  Prüfen mit `npm test`

## 3. Verlauf im Store

- [x] 3.1 `createAppStore` mit zundo `temporal` umhüllen (`partialize` auf `plan`, `equality` = `sameContent`, `limit: 100`); `src/store/history.ts` mit `undo`/`redo` inkl. Nacharbeit unter `pause`/`resume` (Etage, `updatedAt`, Auswahl, `activeTool`) sowie Store-Aktionen `undo()`/`redo()` und Hooks `useCanUndo`/`useCanRedo` umsetzen (siehe design.md Entscheidung 2); prüfen mit `npm run build`
- [x] 3.2 `src/store/app-store.test.ts` erweitern, mit festem `now`:
  - Start ohne Schritte
  - Einfügen → Rückgängig → Form weg, keine Auswahl → Wiederholen → Form wieder da und ausgewählt
  - Löschen von B aus A, B, C rückgängig → A, B, C mit gleicher ID
  - Verschieben im Erdgeschoss, Wechsel ins Obergeschoss, Rückgängig → Erdgeschoss aktiv, Form ausgewählt, alte Lage, `updatedAt = now`
  - Etagenwechsel allein erzeugt keinen Schritt
  - Umbenennen (`renamePlan`) erzeugt keinen Schritt; verschieben, umbenennen, Rückgängig → alte Lage, neuer Name
  - Import rückgängig stellt auch den alten Namen her
  - Kalibrierung des Erdgeschosses speichern (0,7480 → 0,9986 px/cm) ist ein Schritt; Rückgängig stellt 0,7480 px/cm her und macht das Erdgeschoss aktiv
  - Kalibrierung speichern, dann eine Form verschieben, Rückgängig → Form an alter Lage, Kalibrierung bleibt 0,9986 px/cm
  - abgelehnte Änderung erzeugt keinen Schritt
  - neue Änderung nach Rückgängig leert Wiederholen
  - 101 Verschiebungen → 100 Rückgängig möglich, Form 5 cm neben der Ausgangslage
  - Rückgängig im Kalibrier-Modus wirkungslos
  - `replacePlan` (falls vorhanden) ist ein Schritt und Rückgängig stellt den alten Plan samt Kalibrierungen vollständig her
  - Autosave speichert nach Rückgängig

  Prüfen mit `npm test`

## 4. Sperre im Store

- [x] 4.1 `updateShape` und `removeShape` im Store über `isPatchAllowed`/`canDelete` absichern (siehe design.md Entscheidung 5) und in `app-store.test.ts` testen:
  - gesperrte Form: Verschieben/Größe/Löschen → `false`, Plan gleich, kein Schritt
  - Füllfarbe und Beschriftung ändern → `true`
  - Umordnen → `true`
  - Entsperren → `true`
  - verschieben, sperren, zweimal Rückgängig → nicht gesperrt und alte Lage

  Prüfen mit `npm test`

## 5. Oberfläche

- [x] 5.1 `HistoryButtons` (Undo2/Redo2, Tooltips, `aria-disabled`, im Kalibrier-Modus ausgeblendet) in die `HeaderBar` einbauen und Strg/⌘+Z, Strg/⌘+Umschalt+Z, Strg/⌘+Y in `useShapeShortcuts` ergänzen (nicht in Eingabefeldern, nicht während Ziehen/Transformieren); prüfen im Browser (manuell):
  - nach dem Laden beide gesperrt
  - Rechteck einfügen, verschieben, Breite ändern → dreimal Strg+Z nimmt alles zurück, Strg+Umschalt+Z und Strg+Y stellen es wieder her
  - Löschen per Entf und Strg+Z bringt die Form an gleicher Stelle in der Reihenfolge zurück
  - Änderung im Erdgeschoss, Wechsel ins Obergeschoss, Strg+Z springt ins Erdgeschoss und wählt die Form aus
  - Strg+Z beim Tippen im Feld „Beschriftung“ wirkt nur im Feld; nach Enter (Cursor noch im Feld) nimmt Strg+Z den letzten Plan-Schritt zurück
  - im Kalibrier-Modus keine Schaltflächen, Strg+Z wirkungslos
  - Kalibrierung speichern, Strg+Z → Statusleiste zeigt den vorherigen Maßstab bzw. „Nicht kalibriert“
  - nach dem Neuladen beide gesperrt
- [x] 5.2 `LockToggle` im Panel-Kopf neben „Löschen“, „Löschen“ bei Sperre gesperrt mit Tooltip „Gesperrt – zuerst entsperren“, Entf wirkungslos bei Sperre, `ShapeNode` nicht ziehbar bei Sperre (Zeiger `default`), `SelectionTransformer` ohne Anfasser bei Sperre, Abschnitte „Maße“ und „Lage“ schreibgeschützt (siehe design.md Entscheidungen 6 und 7); prüfen im Browser (manuell):
  - Schrank sperren → Rahmen ohne Anfasser
  - Ziehen verschiebt die Ansicht, nicht den Schrank
  - Entf und „Löschen“ wirkungslos, Tooltip sichtbar
  - Breite/X/Drehung/Spiegeln nicht änderbar
  - Füllfarbe und Beschriftung änderbar
  - nach dem Neuladen weiterhin gesperrt
  - Entsperren stellt alles wieder her
  - mit `more-shapes` auch Schenkel-Felder schreibgeschützt
- [x] 5.3 `ArrangeSection` mit vier Schaltflächen (Tooltips mit Bild↑/Bild↓/Umschalt, Sperrung über `canReorder`) am Ende des Panels und Bild↑/Bild↓/Umschalt+Bild↑/Umschalt+Bild↓ in `useShapeShortcuts`; prüfen im Browser (manuell):
  - drei überlappende Formen: „Nach vorne“ hebt die unterste eine Stelle, „Ganz nach hinten“ legt die oberste ganz nach unten
  - Form bleibt ausgewählt
  - Schaltflächen an den Enden gesperrt
  - Tasten wirken gleich, im Feld „Beschriftung“ nicht
  - gesperrte Form lässt sich umordnen
  - jede Umordnung lässt sich mit Strg+Z zurücknehmen
- [x] 5.4 `docs/design/README.md` um die Bedienentscheidungen „Rückgängig“, „Sperren“ und „Anordnung“ ergänzen (siehe design.md Entscheidung 7); prüfen, dass die Zeilen zu design.md und den Specs passen

## 6. Abschluss

- [x] 6.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei
