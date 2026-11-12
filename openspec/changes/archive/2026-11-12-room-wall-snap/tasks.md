# Tasks

## 1. Haftlogik in src/lib/room-snap.ts

- [x] 1.1 `room-snap.ts` anlegen mit `WALL_SNAP_CAPTURE_PX = 8`, `WALL_SNAP_RELEASE_PX = 24`, den Typen `WallStick`, `RoomDragSnapInput`, `RoomDragSnapResult` und einem Helfer für die Außennormale je Kante (aus dem Umlaufsinn); Vitest-Test in `room-snap.test.ts` prüft die Normalen eines Rechtecks im und gegen den Uhrzeigersinn
- [x] 1.2 Kandidatensuche umsetzen: parallele, gegenüberliegende, überlappende Kantenpaare, Soll-Abstand = dickere Wanddicke, Fang ≤ `captureCm`, kleinste Abweichung gewinnt; Tests für „An Nachbarwand heranschieben“ (→ 352,5 cm), „Dickere Wand zählt“ (→ 361,5 cm), „Zu weit entfernt“, „Kanten liegen sich nicht gegenüber“ und gleichgerichtete (nicht gegenüberliegende) Kanten laufen grün
- [x] 1.3 `snapRoomDrag` mit Hysterese umsetzen: bestehende Haftungen bleiben bis `releaseCm` quer zur Wand (beide Richtungen) und solange sich die Kanten überlappen, neue erst danach; entlang der Wand gilt `gridDelta`; Tests für „Entlang gleiten“, „Über das Wandende hinaus“, „Leichtes Wegziehen hält“ (20 cm), „Losreißen“ (30 cm), „In die Wand drücken“, Wiederhaften nach Losreißen und Zoom (2 px/cm: 10 cm hält, 15 cm löst)
- [x] 1.4 Bündige Ecken umsetzen (nächste Ecke ≤ `captureCm` entlang der Wand, ohne Hysterese, Wand vor Ecke); Tests für „Oberkanten in einer Flucht“ (5 → 0 cm), „Unterkanten in einer Flucht“ (555 → 560 cm), „Weit weg von jeder Ecke“
- [x] 1.5 Zweite, nicht parallele Haftung umsetzen (senkrecht und schräg über 2×2-System), höchstens zwei Haftungen, unabhängiges Lösen; Tests für „In eine Ecke schieben“ (→ (352,5 cm, 0 cm), beide Haftungen gemeldet), schräge Wände und Lösen nur einer der beiden Haftungen
- [x] 1.6 `npx vitest run src/lib/room-snap.test.ts` läuft fehlerfrei

## 2. Zeichenfläche

- [x] 2.1 `useModifierKeyRef` um `"ctrlKey"` erweitern und `useCtrlKeyRef` exportieren; `npm run build` kompiliert
- [x] 2.2 `RoomArea.dragBoundFunc` in `RoomsLayer.tsx` auf `snapRoomDrag` umstellen: `rawDelta`/`gridDelta` aus der Mausbewegung, `others` = übrige Räume der Etage, `captureCm = 8 / scale`, `releaseCm = 24 / scale`, `sticks` im `dragRef`; mit Strg nur `gridDelta` und `sticks` leeren; `onDragEnd` übergibt den letzten `delta` an `moveRoom`. Im Browser prüfen: Diele haftet an Wohnen, gleitet entlang, reißt nach ~24 px los, Strg schaltet ab, Strg+Z macht das Verschieben in einem Schritt rückgängig
- [x] 2.3 `RoomDrag` um `stuckEdges` erweitern und haftende Nachbarkanten in `SELECTION_COLOR` hervorheben, beim Loslassen entfernen; im Browser prüfen, dass die Markierung beim Haften erscheint und beim Lösen/Loslassen verschwindet
- [x] 2.4 Doc-Kommentar von `RoomsLayer` und `RoomArea` um Haften, Lösen und Strg ergänzen

## 3. Abschluss

- [x] 3.1 `openspec validate room-wall-snap --strict` meldet keine Fehler
- [x] 3.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei
