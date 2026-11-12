# Tasks

## 1. Logik in `src/lib/room-drawing.ts`

- [ ] 1.1 `WallLine`, `WallPosition` und `wallLines(rooms)` ergänzen: innere Linie = Kante, äußere = Kante um `wallThicknessCm[i]` entlang `edgeOutwardNormals` versetzt, Kanten mit Länge 0 auslassen. Vitest: Rechteck 500 cm × 400 cm mit 15 cm → obere Außenlinie (0 cm, −15 cm)–(500 cm, −15 cm); Raum gegen den Uhrzeigersinn gibt dieselbe Außenseite; unterschiedliche Wanddicken je Kante
- [ ] 1.2 `snapToWall(pointer, lines, { radiusCm, stepCm })` mit Projektion, Querabstand ≤ Radius, `0 ≤ t ≤ L`, näherem Bezugsende, Schritt-Rundung vom Bezugsende, Begrenzung auf `[0, L]` und 0,1-cm-Rundung. Vitest mit den Spec-Fällen: (262 cm, −17 cm) → (260 cm, −15 cm); (262 cm, 4 cm) → (260 cm, 0 cm); (437 cm, −14 cm) → (435 cm, −15 cm) vom rechten Ende; Schritt 1 cm → 262 cm; schräge Kante → (156 cm, 208 cm); neben dem Wandende → `null`; nächste von zwei Linien gewinnt
- [ ] 1.3 `pointOnWall(line, fromEnd, offsetCm)`, `wallDistances(position)` und `parseOffsetCm(text)` (≥ 0 cm, Komma oder Punkt) ergänzen, jeweils mit Vitest (260 cm von links → (260 cm, −15 cm), von rechts → (240 cm, −15 cm); 0 cm → Bezugsende; „260“, „12,5“, „0“ gültig, „“ ungültig)
- [ ] 1.4 `resolveDraftPointer` um `walls` (null = aus) und `stepCm` erweitern und `DraftPointer.wall` zurückgeben. Vorrang: Ecke vor Wand vor Hilfslinie, nur ohne gesetzte Punkte. Vitest: Raumecke vor Wandposition bei (497 cm, 3 cm); Wandposition vor Hilfslinie (Ecke bei x = 263 cm); `walls: null` → (262 cm, −17 cm) ohne `wall`; mit einem gesetzten Punkt keine Wandposition

## 2. Store

- [ ] 2.1 `RoomDraft.wallAnchor` und Hinweis `"wallTooLong"` ergänzen; `addDraftPoint`, `removeLastDraftPoint` und `commitDraftLength` setzen `wallAnchor: null` bzw. reichen ihn weiter
- [ ] 2.2 Aktionen `startWallOffset`, `toggleWallOffsetEnd` und `commitWallOffset` umsetzen. Leerer Text → `roomDraft: null`; zu großer Wert → Hinweis, Feld bleibt; fehlende Linie → Entwurf verwerfen
- [ ] 2.3 Prüfen, dass ein Entwurf ohne Punkte Rückgängig sperrt, beim Etagenwechsel verworfen wird und `Esc` zweistufig wirkt (erst Feld schließen, dann „Auswählen“)

## 3. Zeichenfläche

- [ ] 3.1 `useDraftPointer` um `alt` erweitern (Mausereignis, Keydown/Keyup Alt) und in `previewFor` Wandlinien (per `useMemo` aus den Räumen) sowie `snapStepCm(alt, settings)` an `resolveDraftPointer` übergeben; `walls` ist `null` bei Strg oder ausgeschaltetem „Einrasten“
- [ ] 3.2 Vorschau mit `wallAnchor`: Punkt aus `pointOnWall` mit dem getippten Abstand; Hilfslinien aus
- [ ] 3.3 Anzeige der Wandposition: Ring am Punkt, gefüllter Punkt am Bezugsende, zwei Abstände in der Auswahlfarbe, parallel zur Wand und lesbar (`readableRotationDeg`); 0 cm und zu kurze Strecken weglassen (`dimensionFits`)
- [ ] 3.4 Tasten in `useRoomDraftKeys`: Ziffer ohne Entwurf, aber mit Wandposition in der Vorschau → `startWallOffset`; ohne Wandposition nicht abfangen. Bei `wallAnchor`: Tab (mit `preventDefault`), Enter, Rücktaste und Esc wie in der Spec
- [ ] 3.5 `RoomDraftField`: „Abstand: … cm“ bei `wallAnchor` und Hinweis „Darf höchstens L cm sein“ mit `formatCm` der Kantenlänge
- [ ] 3.6 Klick in `FloorCanvas.tsx`: Wandlinien und `snapStepCm(e.evt.altKey, settings)` übergeben, damit Klick und Vorschau gleich auflösen

## 4. Hilfe

- [ ] 4.1 `src/components/help/shortcuts.ts` in der Gruppe „Raum zeichnen“ nach der Spec ergänzen (Ziffern-Text, Tab, Alt, Strg-Text) und `shortcuts.test.ts` anpassen

## 5. Abschluss

- [ ] 5.1 Manuell im Browser prüfen (durch den Nutzer): 260 cm auf einer 500-cm-Wand per Maus und per Eintippen, Tab, Alt, Strg, Esc und Hinweis bei zu großem Wert
- [ ] 5.2 Letzte Aufgabe: npm run build und npm test laufen fehlerfrei
