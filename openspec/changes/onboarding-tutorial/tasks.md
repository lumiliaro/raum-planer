# Tasks

## 1. Vorliebe und Store-Zustand

- [ ] 1.1 `src/lib/ui-prefs.ts`: `TUTORIAL_SEEN_KEY = "raumplaner.ui.tutorialSeen"` und reine Funktion `shouldAutoStartTutorial(outcome: LoadOutcome, seen: boolean)` (nur `"empty"` und nicht gesehen → `true`). Prüfen mit Vitest in `ui-prefs.test.ts`: alle sechs `LoadOutcome`-Werte mit `seen` true/false.
- [ ] 1.2 `src/store/app-store.ts`: `tutorialStep: number | null` (Startwert über `shouldAutoStartTutorial`) mit `startTutorial()`, `nextTutorialStep()`, `prevTutorialStep()`, `endTutorial()` (schreibt `tutorialSeen`), nicht in `partialize`. Prüfen mit Tests in `app-store.test.ts`: Autostart nur bei leerem Speicher ohne „gesehen“, nicht bei gespeichertem Plan und nicht bei `throwingStorage`; Weiter/Zurück bleiben in den Grenzen; Beenden schreibt den Schlüssel und ein neuer Store startet dann nicht; Start/Weiter/Beenden ändern weder `plan` noch `pastStates`.

## 2. Schritte

- [ ] 2.1 `src/components/tutorial/tutorial-steps.ts` mit `TutorialTarget` und `TUTORIAL_STEPS` (11 Schritte, Titel, Texte in Du-Form, Ziele wie in `specs/app-tutorial`). Texte für „Raum zeichnen“ und „Automatisch gespeichert“ decken die Szenarien der Spec ab.
- [ ] 2.2 `src/components/tutorial/tutorial-steps.test.ts`: Titel in der Reihenfolge der Spec, 11 Schritte, eindeutige IDs, nur „Willkommen“ ohne Ziel, jedes Ziel höchstens einmal, kein leerer Text. `npm test` ist grün.

## 3. Ziele markieren

- [ ] 3.1 `data-tutorial`-Attribute an `FloorSwitcher` (`floors`), Abschnitt „Vorlage“ in `UnderlaySection` (`underlay`), „Vorlage kalibrieren“ und die Werkzeuge Raum/Tür/Rechteck in `ToolBar` (`calibrate`, `tool-room`, `tool-door`, `tool-rect`), `PropertiesPanel` (`properties`), Speicherstatus in `StatusBar` (`save-status`), „Exportieren“ in `PlanFileActions` (`export`), „Hilfe“ in `HeaderBar` (`help`). Prüfen: in den Browser-Entwicklertools gibt `document.querySelectorAll("[data-tutorial]").length` bei leerem Plan und offenem Panel 10 zurück.

## 4. Sprechblase

- [ ] 4.1 `src/components/tutorial/TutorialCoach.tsx`: Hervorhebungs-Rahmen (`fixed`, `pointer-events: none`, folgt `ResizeObserver`/`resize`) und Sprechblase über Base UI `Popover` (gesteuert, nicht modal, `anchor` = Ziel, sonst mittig über der Zeichenfläche). Inhalt: Titel, Text, „Schritt N von M“, „Überspringen“, „Zurück“, „Weiter“/„Fertig“ gemäß Requirement „Bedienung des Tutorials“; Klick daneben schließt nicht, Esc in der Sprechblase ruft `endTutorial()`; Fokus auf „Weiter“/„Fertig“ beim Schrittwechsel. Prüfen im Browser: alle 11 Schritte durchklicken, Zurück/Weiter/Überspringen/Fertig, Esc in der Sprechblase; bei ausgeblendetem Panel steht „Eigenschaften“ mittig ohne Rahmen; während der Schritte lässt sich ein Rechteck zeichnen.
- [ ] 4.2 `TutorialCoach` einmal in `AppShell.tsx` rendern, unterhalb der Dialoge in der Stapelreihenfolge. Prüfen im Browser: Mit leerem `localStorage` startet das Tutorial beim Laden bei „Willkommen“; nach „Überspringen“ und Neuladen nicht mehr; mit vorhandenem Plan nicht. `npm run build` ist fehlerfrei.

## 5. Einstellungen

- [ ] 5.1 `SettingsDialog.tsx`: Abschnitt „Tutorial“ als letzter Abschnitt mit „Tutorial neu starten“ (schließt den Dialog, ruft `startTutorial()`). Prüfen im Browser: Klick schließt „Einstellungen“ und zeigt Schritt 1 von 11; eine geänderte Wanddicke bleibt erhalten; „Auf Werkseinstellungen zurücksetzen“ ändert am Tutorial nichts.

## 6. Abschluss

- [ ] 6.1 README: Im Abschnitt „Online nutzen“ einen Satz ergänzen, dass beim ersten Start ein Tutorial erscheint und es sich unter „Einstellungen → Tutorial neu starten“ erneut starten lässt.
- [ ] 6.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
