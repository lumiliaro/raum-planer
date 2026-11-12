# Tasks

## 1. Store-Zustand

- [x] 1.1 In `src/store/app-store.ts` `helpTab: "shortcuts" | "privacy" | null` (Start `null`) mit `openHelp(tab)` und `closeHelp()` ergänzen, nicht in localStorage und nicht in `partialize`. Prüfen mit Tests in `app-store.test.ts`: `openHelp("privacy")` setzt den Reiter, `closeHelp()` setzt `null`, und `pastStates` bleibt dabei unverändert (kein Rückgängig-Schritt).

## 2. Kürzel-Liste

- [x] 2.1 `src/components/help/shortcuts.ts` mit `SHORTCUT_GROUPS` anlegen (Gruppen und Einträge wie im Szenario „Gruppen und Einträge“ in `specs/app-help`). „Werkzeuge“ wird aus `TOOLS` erzeugt. Tastennamen sind deutsch (Strg, Umschalt, Entf, Rücktaste, Bild↑, Bild↓, Esc).
- [x] 2.2 `src/components/help/shortcuts.test.ts`: Gruppentitel in der Reihenfolge der Spec, jede `TOOLS`-Taste steht unter „Werkzeuge“ mit dem Werkzeugnamen, `?` steht unter „Allgemein“, keine Taste doppelt innerhalb einer Gruppe. `npm test` ist grün.
- [x] 2.3 Kurzen Kommentar in `useShapeShortcuts.ts`, `FloorCanvas.tsx` (Zoom-Tasten) und `RoomDraftLayer.tsx` ergänzen: „neue Tasten auch in `components/help/shortcuts.ts` eintragen“.

## 3. Hilfe-Dialog

- [x] 3.1 `src/components/help/HelpDialog.tsx`: Dialog „Hilfe“ auf Basis von `ui/dialog.tsx` mit gesteuerten Reitern aus `@base-ui/react/tabs` („Tastenkürzel“, „Datenschutz“), gebunden an `helpTab`/`openHelp`/`closeHelp`. Die Tastenkürzel werden je Gruppe als Tabelle mit `<kbd>` gezeigt, mehrere Alternativen mit „oder“ dazwischen. Unten steht „Schließen“. Prüfen im Browser: Esc, „Schließen“ und Klick daneben schließen den Dialog, Reiterwechsel funktioniert.
- [x] 3.2 Den Datenschutztext im Reiter „Datenschutz“ gemäß Requirement „Datenschutzhinweis“ schreiben (läuft komplett im Browser, kein Konto, kein Server, nichts wird übertragen, eigener Stand je Browser/Gerät, Browser kann Speicher leeren → „Exportieren“ als Sicherung). Prüfen: Text gegen die Szenarien in `specs/app-help` lesen.
- [x] 3.3 `HelpDialog` einmal in `AppShell.tsx` rendern. Prüfen: `npm run build` ist fehlerfrei.

## 4. Einstiege

- [x] 4.1 `HeaderBar.tsx`: Icon-Schaltfläche „Hilfe“ (`CircleHelp`) ganz rechts nach „Einstellungen“, außerhalb des Kalibrier-Zweigs, `title`/`aria-label` „Hilfe und Tastenkürzel (?)“, öffnet `openHelp("shortcuts")`. Prüfen im Browser: sichtbar normal und im Kalibrier-Modus.
- [x] 4.2 `useShapeShortcuts.ts`: Bei `e.key === "?"` (nach Dialog- und Textfeld-Prüfung) `openHelp("shortcuts")` aufrufen. Prüfen im Browser: `?` öffnet die Hilfe. Im Feld „Beschriftung“ wird „?“ getippt, ohne dass sich die Hilfe öffnet. Im offenen Dialog „Einstellungen“ passiert nichts. Beim Raum-Zeichnen bleiben die Eckpunkte nach `?` und `Esc` erhalten.
- [x] 4.3 `StatusBar.tsx`: Speicherstatus als `<button type="button">` in unveränderter Optik mit Fokusring. `title` ist „Alle Daten bleiben in diesem Browser“ bzw. der bisherige Grund, Klick ruft `openHelp("privacy")` auf. Prüfen im Browser: Klick öffnet den Reiter „Datenschutz“.

## 5. Abschluss

- [x] 5.1 README: Im Abschnitt „Online nutzen“ einen Satz ergänzen, dass derselbe Hinweis in der App unter „Hilfe → Datenschutz“ steht.
- [x] 5.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
