# Design

## Context

- Motivation und Umfang: siehe `proposal.md`. Anforderungen: `specs/app-tutorial`, `specs/app-settings`.
- Der Store lädt den Plan in `createAppStore` und kennt dabei `loadOutcome`. `"empty"` bedeutet: Im Browser lag noch kein Plan. Bei blockiertem Speicher ist das Ergebnis `"unavailable"`.
- Browser-Vorlieben stehen in `src/lib/ui-prefs.ts` (`readBoolean`/`writeBoolean` unter `raumplaner.ui.*`). Sie gehören nicht zum Plan.
- Sitzungszustand ohne Rückgängig steht schon im Store (`helpTab`, `activeTool` …). Die History-`partialize` nimmt nur `plan` auf.
- Globale Tasten ignorieren Ereignisse in `role="dialog"` (`isInDialog`). Dialoge nutzen Base UI. `@base-ui/react` bringt Popover mit Anker-Positionierung (floating-ui) mit.
- Die Zielelemente liegen in `FloorSwitcher`, `UnderlaySection`, `ToolBar`, `PropertiesPanel`, `StatusBar`, `PlanFileActions` und `HeaderBar`. Einige sind zeitweise nicht da: Eigenschaften-Panel ausgeblendet, Abschnitt „Vorlage“ nur ohne Auswahl, im Kalibrier-Modus fehlen Kopfleisten-Schaltflächen.

## Goals / Non-Goals

**Goals:**
- Schritte als reine Daten an einer Stelle, testbar ohne DOM.
- Das Tutorial liest nur die Oberfläche. Es schaltet keine Werkzeuge, öffnet keine Panels und wählt nichts aus.
- Fehlt ein Ziel, gibt es einen festen Rückfall (Sprechblase mittig) statt eines Fehlers.

**Non-Goals:**
- Keine allgemeine Tour-Bibliothek und keine Konfiguration von außen.
- Keine Animation zwischen den Schritten außer der normalen Ein-/Ausblendung.

## Decisions

1. **Zustand im Store:** `tutorialStep: number | null` (`null` = aus) mit `startTutorial()`, `nextTutorialStep()`, `prevTutorialStep()` und `endTutorial()`. `next` im letzten Schritt und `prev` im ersten tun nichts. `endTutorial()` setzt `null` und schreibt `raumplaner.ui.tutorialSeen = "true"` über `writeBoolean`. Der Zustand gehört nicht zu `partialize`, bildet also keinen Rückgängig-Schritt.
   - Startwert beim Erzeugen des Stores: `0`, wenn `loadOutcome === "empty"` und `readBoolean(storage, TUTORIAL_SEEN_KEY, false)` falsch ist, sonst `null`. Die Bedingung steht als reine Funktion `shouldAutoStartTutorial(outcome, seen)` neben den Vorlieben, damit sie ohne Store testbar ist.
   - „Gesehen“ wird erst beim Beenden geschrieben, nicht beim Start. Lädt der Nutzer mitten im Tutorial neu und hat noch nichts gespeichert, startet es wieder bei Schritt 1 (Spec-Szenario). Hat er etwas gezeichnet, liegt ein Plan im Speicher (`"restored"`), und es startet nicht.
   - Alternative: Zustand lokal in einer Komponente. Der Neustart kommt aber aus dem `SettingsDialog`, und der Startwert hängt am `loadOutcome` im Store.

2. **Schritte als Daten** in `src/components/tutorial/tutorial-steps.ts`: `TUTORIAL_STEPS: { id, title, text: string[], target: TutorialTarget | null }[]`. `TutorialTarget` ist eine String-Union (`"floors"`, `"underlay"`, `"calibrate"`, `"tool-room"`, `"tool-door"`, `"tool-rect"`, `"properties"`, `"save-status"`, `"export"`, `"help"`). Ein Test prüft Reihenfolge, Anzahl (11), eindeutige IDs und dass nur „Willkommen“ kein Ziel hat.

3. **Ziele über `data-tutorial`-Attribute:** Jedes Zielelement bekommt `data-tutorial="<target>"`. Die Komponente sucht pro Schritt `document.querySelector('[data-tutorial="…"]')`. Werkzeuge bekommen das Attribut über ein optionales Feld `tutorialTarget` in `ToolBar` (`tool-<id>` für `room`, `door-opening`, `rect`), ohne die Registry `TOOLS` zu ändern.
   - Alternative: React-Refs über einen Context registrieren. Mehr Verdrahtung durch viele Komponenten für denselben Zweck; die Attribute sind lokal und im DOM sichtbar.
   - Ein Ziel gilt als fehlend, wenn das Element nicht existiert oder keine Fläche hat (`getBoundingClientRect` 0 × 0). Dann steht die Sprechblase mittig über der Zeichenfläche ohne Hervorhebung.

4. **Darstellung:** `TutorialCoach.tsx` rendert, solange `tutorialStep !== null`:
   - eine **Hervorhebung**: ein `position: fixed`-Rahmen (Ring in der Akzentfarbe, wenige px Abstand) über dem Ziel, `pointer-events: none`. Kein Abdunkeln der übrigen Fläche, damit das Ausprobieren (Spec „Nebenbei ausprobieren“) nicht blockiert ist. Die Lage folgt Größenänderungen über `ResizeObserver` auf das Ziel und `resize` am Fenster.
   - die **Sprechblase** über Base UI `Popover` mit `open` gesteuert, `modal={false}`, Positionierer mit `anchor` = Zielelement (Seite je nach Lage automatisch, `collisionPadding`). Ohne Ziel wird an einem unsichtbaren Anker in der Mitte der Zeichenfläche positioniert.
   - Popover-Schließen durch Klick daneben ist aus (`onOpenChange` reagiert nur auf Esc, Grund `escape-key` → `endTutorial()`). Klicks auf die Oberfläche beenden das Tutorial also nicht.
   - Beim Schrittwechsel bekommt „Weiter“ (bzw. „Fertig“) den Fokus, damit Enter und Esc direkt wirken. Die Popup-Rolle ist `dialog`; dadurch greifen die globalen Tasten (`isInDialog`) nicht, solange der Fokus in der Sprechblase liegt. Klickt der Nutzer auf die Zeichenfläche, wandert der Fokus dorthin, und die normalen Kürzel wirken wieder.
   - Gerendert einmal in `AppShell`. Über offenen Dialogen liegt die Sprechblase nicht: Sie nutzt einen niedrigeren `z-index` als `ui/dialog`.
   - Alternative: eigene Positionierung ohne Base UI. Base UI ist schon da und löst Kollision und Scrollen.

5. **Einstellungen:** Neuer letzter Abschnitt „Tutorial“ im `SettingsDialog` mit einer `outline`-Schaltfläche „Tutorial neu starten“. Klick: `onClose()` und `startTutorial()`. Der Abschnitt nutzt `SettingsSection`; „Öffnungen“ verliert dafür `last`. `settingsAreFactory` und „Auf Werkseinstellungen zurücksetzen“ bleiben unberührt.

6. **Texte** stehen in `tutorial-steps.ts` in der Du-Form wie die übrige App, je höchstens drei kurze Sätze. Ausnahme „Willkommen“: zwei kurze Absätze (Begrüßung, dann Datenschutzhinweis); dafür bekommt ein Schritt `text: string[]` mit einem Absatz je Eintrag. Der Hinweis deckt sich inhaltlich mit „Hilfe → Datenschutz“, ist aber kürzer. Tastennamen wie in der Hilfe (Enter, Esc, Strg).

**Datenmodell / schemaVersion:** keine Änderung. `tutorialStep` ist Sitzungszustand, `raumplaner.ui.tutorialSeen` eine Browser-Vorliebe wie `showDimensions`. Beides gehört nicht zum Plan, zum Export oder zur History.

## Risks / Trade-offs

- [Ein Ziel wird umbenannt oder entfernt, das Attribut fehlt dann still] → Rückfall „mittig“ verhindert einen Fehler. Die `TutorialTarget`-Union und der Browser-Check je Schritt in `tasks.md` decken die Erstbefüllung ab.
- [Base UI Popover mit externem `anchor`-Element verhält sich anders als erwartet (z. B. Fokus-Rückgabe, Schließen bei Klick daneben)] → Der erste Implementierungsschritt prüft das an einem Schritt im Browser. Notfalls wird nur der Positionierer verwendet und das Schließen selbst gesteuert.
- [Kalibrier-Modus während des Tutorials: Kopfleisten-Ziele fehlen] → Rückfall „mittig“. Kein Sonderfall nötig.
- [Sprechblase verdeckt das Ziel bei kleinem Fenster] → `collisionPadding` und automatische Seitenwahl; Desktop-Browser sind die Zielplattform.
- [Speicher blockiert: „gesehen“ kann nicht gemerkt werden] → Ohne Speicher ist `loadOutcome` `"unavailable"`, das Tutorial startet dann ohnehin nicht automatisch.

## Migration Plan

Keine Migration. Bestehende Nutzer haben einen gespeicherten Plan und sehen das Tutorial nicht automatisch. Rückbau: Komponente und Store-Felder entfernen; der Schlüssel `raumplaner.ui.tutorialSeen` bleibt ungenutzt liegen.
