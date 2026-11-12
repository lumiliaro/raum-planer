# Raumplaner

Web-App zur Raum- und Einrichtungsplanung für die eigene Wohnung oder das
eigene Haus. Den Grundriss erstellt man selbst: Etagen anlegen und je Etage
die Räume mit ihren Innenmaßen in cm zeichnen, optional über einem
eingescannten Grundriss als Vorlage. Möbel werden als Formen mit
exakten Maßen platziert, verschoben, gedreht, beschriftet und eingefärbt.
Die Planung lässt sich als Datei exportieren und wieder importieren und als
PDF drucken.

Die App läuft komplett im Browser: kein Backend, keine Accounts, keine
Netzwerkaufrufe zur Laufzeit.

## Online nutzen

<https://lumiliaro.github.io/raum-planer/>

- Alle Pläne und Vorlagenbilder liegen nur im Browser des Besuchers
  (localStorage und IndexedDB). Es wird nichts an einen Server geschickt,
  und jeder Browser hat seinen eigenen Stand. Derselbe Hinweis steht in der
  App unter „Hilfe → Datenschutz“.
- Pläne aus der lokalen Entwicklung (`localhost`) erscheinen dort nicht von
  selbst: lokal exportieren und online importieren.
- Der Browser kann seinen Speicher leeren. Ein Export dient als Sicherung.
- Jeder Push auf `main` wird über GitHub Actions geprüft (Lint, Tests,
  Build) und anschließend automatisch veröffentlicht
  (`.github/workflows/deploy.yml`).

## Tech-Stack

- Vite, React, TypeScript (strict)
- Konva.js über react-konva für die Zeichenfläche
- Zustand als zentraler Projekt-Store
- Tailwind CSS und shadcn/ui
- Zod für das Import-Schema
- Vitest für die Logik-Tests

## Entwicklung

Node kommt über nvm (siehe `.bashrc`).

```sh
npm install
npm run dev        # Dev-Server
npm run build      # Typecheck und Produktions-Build
npm test           # Tests einmal ausführen
npm run test:watch # Tests im Watch-Modus
npm run lint       # oxlint
```

## Projektstruktur

- `src/lib/` – reine Logik (Geometrie, Kalibrierung, Plan-Schema, Import/Export, PDF-Layout) mit Vitest-Tests
- `src/store/` – zentraler Zustand-Store mit Undo/Redo
- `src/storage/` – Vorlagenbilder in IndexedDB
- `src/components/` – Oberfläche und Zeichenfläche; `src/components/ui/` enthält die shadcn/ui-Komponenten
- `.github/workflows/deploy.yml` – Build und Veröffentlichung auf GitHub Pages
- `openspec/` – Spezifikationen und Änderungsvorschläge (OpenSpec)
