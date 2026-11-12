# Tasks

## 1. Logik der Kopie

- [ ] 1.1 `src/lib/clipboard.ts`: `PASTE_OFFSET_CM = 50`, Typ `ClipboardState` (design.md Entscheidung 1), `pasteOffsetSteps(clip, floorId)`, `copyName(name)`, `copyShape(shape, dx, dy, newId)` und `copyRoom(room, dx, dy, newId, { keepName })` (Entscheidung 2 und 3). Tests in `src/lib/clipboard.test.ts`:
  - `pasteOffsetSteps`: kopiert im EG → EG 1, 2, 3 nach 0, 1, 2 Einfügungen; OG 0, 1; ausgeschnitten im EG → EG 0, 1
  - `copyName`: „Bad“ → „Bad (Kopie)“; „Bad (Kopie)“ bleibt; Name mit 40 Zeichen → gekürzt, Ergebnis genau 40 Zeichen und endet auf „ (Kopie)“
  - `copyShape`: gesperrtes Rechteck 200 cm × 90 cm bei (300 cm, 200 cm), 90° gedreht, gespiegelt, mit Beschriftung → neue ID, (350 cm, 250 cm), nicht gesperrt, Maße/Drehung/Spiegelung/Stil/Beschriftung gleich; Position auf 0,1 cm gerundet
  - `copyRoom`: gesperrter Raum (0 cm, 0 cm)…(400 cm, 300 cm) mit Tür und Fenster, Wanddicke 11,5 cm, Farbe → Punkte um (50 cm, 50 cm) verschoben, neue Raum- und Öffnungs-IDs, Öffnungen sonst gleich, `locked: false`, Name mit „ (Kopie)“; mit `keepName` Name unverändert; Ergebnis besteht `RoomSchema`

  Prüfen mit `npm test`.

## 2. Store

- [ ] 2.1 `src/store/app-store.ts`: Sitzungsfeld `clipboard` (Startwert `null`, nicht in `partialize`) und Aktionen `copySelection`, `cutSelection`, `pasteClipboard`, `duplicateSelection` (design.md Entscheidung 4). Tests in `app-store.test.ts`:
  - Kopieren ändert weder `plan` noch `pastStates`; ohne Auswahl und bei ausgewählter Öffnung `false`, Zwischenablage unverändert
  - Einfügen auf derselben Etage zweimal: Positionen +50 cm und +100 cm, Kopie ausgewählt, „Auswählen“ aktiv, je ein Rückgängig-Schritt
  - Etagenwechsel: erstes Einfügen gleiche Lage, zweites +50 cm; neues Kopieren setzt die Zähler zurück
  - Original nach dem Kopieren geändert: Kopie hat die alten Maße
  - Ausschneiden: Original weg, nichts ausgewählt, ein Rückgängig-Schritt; erstes Einfügen an alter Stelle mit altem Raumnamen, zweites +50 cm mit „ (Kopie)“; Undo stellt das Original her und die Zwischenablage bleibt
  - Ausschneiden gesperrt: Original bleibt und bleibt ausgewählt, kein Rückgängig-Schritt; Einfügen versetzt, nicht gesperrt, „ (Kopie)“
  - Duplizieren zweimal: (100 cm, 100 cm) → (150 cm, 150 cm) → (200 cm, 200 cm), letzte Kopie ausgewählt, Zwischenablage unverändert
  - Raum mit Wanne kopieren und einfügen: weiter genau eine Wanne
  - Einfügen/Duplizieren im Kalibrier-Modus, während ein Raum gezeichnet wird und bei leerer Zwischenablage: `false`, Plan unverändert
  - Rückgängig/Wiederholen ändern `clipboard` nicht

  Prüfen mit `npm test`.

## 3. Tasten und Hilfe

- [ ] 3.1 `src/hooks/useShapeShortcuts.ts`: Strg/⌘+C, X, V, D rufen die Store-Aktionen auf (design.md Entscheidung 5): nicht in Dialogen und Eingabefeldern, nicht beim Ziehen/Transformieren, nicht mit Umschalt oder Alt; `preventDefault` nur, wenn die Aktion `true` liefert. Doc-Kommentar des Hooks ergänzen. Prüfen im Browser:
  - Rechteck kopieren, dreimal einfügen, Strg+Z dreimal
  - Raum mit Tür ins OG kopieren (gleiche Stelle), Raum per Strg+X ins OG verschieben (Name bleibt)
  - Strg+D zweimal auf einem Stuhl
  - Strg+C im Feld „Name“ kopiert Text; Strg+D ohne Auswahl öffnet weiter den Lesezeichen-Dialog des Browsers
- [ ] 3.2 `src/components/help/shortcuts.ts`: Gruppe „Auswahl“ beginnt mit Strg+C Kopieren, Strg+X Ausschneiden, Strg+V Einfügen, Strg+D Duplizieren (design.md Entscheidung 6); `shortcuts.test.ts` anpassen. Prüfen mit `npm test` und im Browser unter „Hilfe → Tastenkürzel“.

## 4. Abschluss

- [ ] 4.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
