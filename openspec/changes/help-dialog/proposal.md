# Proposal

## Why

Die App hat inzwischen viele Tastenkürzel (Werkzeuge, Zoom, Zeichenreihenfolge, Raum zeichnen, Alt/Strg/Umschalt beim Ziehen). Sie stehen aber nur verstreut in einzelnen Tooltips oder gar nicht in der Oberfläche. Außerdem erfährt der Nutzer nirgends in der App, dass seine Daten nur im eigenen Browser liegen und nichts an einen Server geht. Das steht bisher nur in der README.

## What Changes

- Neuer Dialog „Hilfe“ mit zwei Reitern:
  - **„Tastenkürzel“**: vollständige Liste aller Tastenbefehle, nach Bereichen gruppiert (Allgemein, Werkzeuge, Auswahl, Ansicht, Beim Ziehen, Raum zeichnen).
  - **„Datenschutz“**: Hinweis, dass alles lokal im Browser läuft, nichts extern gespeichert oder übertragen wird, wo die Daten liegen (Browser-Speicher) und dass ein Export als Sicherung dient.
- Neue Icon-Schaltfläche „Hilfe“ (Fragezeichen) ganz rechts in der Kopfleiste, auch im Kalibrier-Modus sichtbar. Sie öffnet den Reiter „Tastenkürzel“.
- Neues Tastenkürzel `?` öffnet den Dialog mit dem Reiter „Tastenkürzel“. Es wirkt nicht in Textfeldern und nicht in einem anderen offenen Dialog.
- Der Speicherstatus in der Statusleiste wird klickbar und öffnet den Dialog mit dem Reiter „Datenschutz“. Bei „Lokal gespeichert“ zeigt er den Tooltip „Alle Daten bleiben in diesem Browser“.
- Die Werkzeug-Kürzel in der Liste werden aus der Werkzeugliste (`TOOLS`) abgeleitet. Ein neues Werkzeug erscheint so automatisch in der Liste.

**Nicht im Umfang:**
- Kein Hinweis, der beim ersten Start von selbst erscheint, keine Einführung und kein Rundgang.
- Keine frei belegbaren Tastenkürzel und keine neuen Kürzel außer `?`.
- Keine Bedienungsanleitung über die Tastenkürzel hinaus (z. B. keine Erklärung der Werkzeuge).
- Keine Änderung an Speicherung, Export oder Datenmodell.
- Keine englische Fassung.

## Capabilities

### New Capabilities
- `app-help`: Hilfe-Dialog mit der Liste der Tastenkürzel und dem Datenschutzhinweis sowie die Wege, ihn zu öffnen (Schaltfläche, Taste `?`, Speicherstatus).

### Modified Capabilities
- `workspace-layout`: Die Kopfleiste bekommt ganz rechts die Schaltfläche „Hilfe“, die auch im Kalibrier-Modus sichtbar bleibt.
- `plan-persistence`: Der Speicherstatus in der Statusleiste wird klickbar (öffnet „Datenschutz“) und bekommt im Zustand „Lokal gespeichert“ einen Tooltip.

## Impact

- Neu: `src/components/help/HelpDialog.tsx` und die Kürzel-Liste `src/components/help/shortcuts.ts` mit Vitest-Test.
- Geändert: `HeaderBar.tsx` (Schaltfläche), `StatusBar.tsx` (klickbarer Status), `useShapeShortcuts.ts` (Taste `?`), `app-store.ts` (Zustand für den offenen Hilfe-Dialog, nicht im Plan, ohne Rückgängig-Schritt).
- Keine neue Abhängigkeit (Reiter über `@base-ui/react`, das schon installiert ist). Datenmodell und `schemaVersion` bleiben unverändert.
