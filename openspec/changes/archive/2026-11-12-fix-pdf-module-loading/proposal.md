# Proposal

## Why

Der PDF-Export bricht im Dev-Server mit „PDF konnte nicht erstellt werden“ ab; in der Konsole steht `TypeError: error loading dynamically imported module: …/node_modules/.vite/deps/jspdf.js?v=…`. Der Code selbst ist intakt (frischer Dev-Server und `npm run build` funktionieren): Vite baut seinen Cache vorgebündelter Bibliotheken während der Laufzeit neu (z. B. nach `npm install` oder wenn das bei Bedarf geladene `jspdf` spät entdeckt wird) und vergibt eine neue Versionskennung; der offene Tab fragt die alte an und erhält einen Fehler. Dasselbe Muster tritt auf GitHub Pages auf, wenn die App vor einem neuen Deploy geöffnet wurde und die nachgeladene Datei nicht mehr existiert. Der Nutzer sieht dann nur eine nichtssagende Fehlermeldung.

## What Changes

- Der Dev-Server bündelt `jspdf` immer schon beim Start vor, sodass es nicht mehr während der Laufzeit neu gebündelt wird.
- Der PDF-Dialog unterscheidet zwei Fehlerfälle:
  - Die PDF-Funktion lässt sich nicht nachladen → Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“.
  - Das Erstellen selbst schlägt fehl → wie bisher „PDF konnte nicht erstellt werden“.
- In beiden Fällen bleibt der Dialog offen, es wird nichts heruntergeladen, der Fehler wird in der Konsole protokolliert.

Nicht im Umfang:
- Kein automatisches Neuladen der Seite (Gefahr von Endlosschleifen; der Plan ist zwar im localStorage, aber der Nutzer soll selbst entscheiden).
- Keine allgemeine Behandlung von Nachladefehlern für andere Teile der App (z. B. globaler `vite:preloadError`-Handler) – nur der PDF-Export lädt derzeit Code bei Bedarf nach.
- Kein Service Worker, kein Caching alter Deploy-Dateien.
- Keine Änderung am Inhalt oder Aussehen des PDFs.

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `plan-pdf`: Anforderung „PDF wird erstellt“ – eigener Hinweis, wenn die PDF-Funktion nicht nachgeladen werden kann.

## Impact

- `vite.config.ts`: `optimizeDeps.include` mit `jspdf` (wirkt nur im Dev-Server).
- `src/components/plan-pdf/PdfDialog.tsx`: Laden der PDF-Funktion und Erstellen getrennt behandeln, zwei Hinweise.
- `src/components/plan-pdf/create-pdf.ts`: `jspdf` über eine eigene Ladefunktion holen, damit der Dialog Lade- von Erstellungsfehlern trennen kann.
- `src/lib/pdf-layout.ts`: reine Funktion für die Auswahl des Hinweistexts, mit Vitest-Test.
- Keine neuen Abhängigkeiten, keine Änderung am Datenmodell oder an `schemaVersion`.
