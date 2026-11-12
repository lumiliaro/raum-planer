# Haus-Gestalter

Persönliche Web-App zur Einzugs- und Raumplanung für genau ein Haus.
Möbel werden als Formen mit exakten Maßen auf den festen Grundrissen
(Erdgeschoss, Obergeschoss, Dachgeschoss) platziert, verschoben, gedreht,
beschriftet und eingefärbt. Die Planung lässt sich als Datei exportieren
und wieder importieren.

Die App läuft komplett im Browser: kein Backend, keine Accounts, keine
Netzwerkaufrufe zur Laufzeit.

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

- `public/plans/` – Grundrisse als PNG (`eg.png`, `og.png`, `dg.png`)
- `src/config/house.ts` – feste Haus-Konfiguration mit Etagen und Kalibrierung
- `src/components/ui/` – shadcn/ui-Komponenten
- `openspec/` – Spezifikationen und Änderungsvorschläge (OpenSpec)
