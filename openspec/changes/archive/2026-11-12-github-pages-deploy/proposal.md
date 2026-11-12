# Proposal

## Why

Die App läuft bisher nur lokal über `npm run dev`. Sie soll ohne eigene
Installation im Browser erreichbar sein, unter
`https://lumiliaro.github.io/raum-planer/`. Weil die App rein statisch ist
(kein Router, kein Backend, Daten in localStorage und IndexedDB), reicht
GitHub Pages dafür aus.

## What Changes

- `vite.config.ts` setzt für den Produktions-Build den Basis-Pfad
  `/raum-planer/`; der Dev-Server bleibt unter `/`.
- Neuer GitHub-Actions-Workflow `.github/workflows/deploy.yml`: bei jedem Push
  auf `main` und manuell startbar. Er prüft (Lint, Tests, Build) und
  veröffentlicht `dist/` auf GitHub Pages. Schlägt eine Prüfung fehl, wird
  nichts veröffentlicht.
- README: Live-URL, Hinweis, dass alle Daten nur im Browser des Besuchers
  liegen, und Korrektur veralteter Angaben (`public/plans/`,
  `src/config/house.ts` gibt es nicht mehr).
- Manuelle Schritte des Nutzers auf github.com (neues öffentliches Repo,
  Branch `public-main` als `main` pushen, Pages-Quelle „GitHub Actions“) sind
  als eigene Aufgaben aufgeführt.

Nicht im Umfang:

- Keine Änderung am App-Code, am Datenmodell oder an `schemaVersion`.
- Keine eigene Domain, kein Service Worker, keine Offline-/PWA-Funktion.
- Keine Übernahme lokaler Pläne nach GitHub Pages: Daten von `localhost`
  wandern nicht mit, der Weg dafür ist der vorhandene Export/Import.
- Kein Umschreiben der alten Git-Historie; die frische Ein-Commit-Historie auf
  `public-main` ist bereits angelegt.
- Keine Änderung an `openspec/config.yaml`.

## Capabilities

### New Capabilities

- `app-deployment`: Wie die App gebaut und ausgeliefert wird – Basis-Pfad der
  veröffentlichten Seite, automatische Veröffentlichung von `main` und die
  Prüfungen, die davor bestehen müssen.

### Modified Capabilities

(keine)

## Impact

- Geändert: `vite.config.ts`, `README.md`.
- Neu: `.github/workflows/deploy.yml`.
- Keine neuen npm-Abhängigkeiten; der Workflow nutzt die offiziellen Actions
  `actions/checkout`, `actions/setup-node`, `actions/configure-pages`,
  `actions/upload-pages-artifact` und `actions/deploy-pages`.
- GitHub: Das Repo `lumiliaro/raum-planer` ist neu und öffentlich;
  Pages muss in den Repo-Einstellungen auf „GitHub Actions“ stehen.
