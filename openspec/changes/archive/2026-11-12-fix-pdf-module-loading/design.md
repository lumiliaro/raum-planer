# Design

## Context

- `PdfDialog.submit` lädt `@/components/plan-pdf/create-pdf` per `import()`, und `createPdf` lädt darin `jspdf` per `import()`. Beides steckt in einem gemeinsamen `try/catch`, das jeden Fehler auf „PDF konnte nicht erstellt werden“ abbildet.
- Im Dev-Server liefert Vite `jspdf` aus `node_modules/.vite/deps/jspdf.js?v=<hash>`. Baut Vite diesen Cache während der Laufzeit neu, ist der alte Hash ungültig, und das `import()` im offenen Tab schlägt fehl (Firefox: „error loading dynamically imported module“, Chrome: „Failed to fetch dynamically imported module“).
- Im Build liegen `create-pdf-*.js` und `jspdf.es.min-*.js` als eigene Chunks mit Hash im Namen unter `/raum-planer/assets/`. Nach einem neuen Deploy fehlen die alten Chunks → gleicher Fehler.
- Reproduziert: frischer Dev-Server lädt `jspdf.js` mit HTTP 200, alle Unter-Chunks (html2canvas, purify, index.es) ebenfalls; `npm run build` ist fehlerfrei. Der Fehler ist also ein Lade-, kein Logikproblem.

## Goals / Non-Goals

**Goals:**
- Im Dev-Server tritt der Fehler durch spätes Vorbündeln von `jspdf` nicht mehr auf.
- Wenn das Nachladen dennoch scheitert, sagt der Dialog dem Nutzer, was zu tun ist (Seite neu laden).

**Non-Goals:**
- Erkennen von Nachladefehlern anhand der Fehlermeldung (browserabhängig, fragil).
- Automatisches Neuladen, globaler `vite:preloadError`-Handler.

## Decisions

1. **`optimizeDeps.include: ["jspdf"]` in `vite.config.ts`.**
   Vite bündelt `jspdf` damit beim Start vor, unabhängig davon, ob der Import-Scanner den dynamischen Import findet. Das verhindert einen Neubau des Caches während der Sitzung, sobald der PDF-Dialog zum ersten Mal benutzt wird. Wirkt nur im Dev-Server, der Build ist unverändert.
   *Alternative:* nichts tun und „Server neu starten“ dokumentieren – löst das Problem für den Nutzer nicht und hilft im Deploy-Fall nicht.

2. **Laden und Erstellen strukturell trennen statt Fehlermeldungen zu parsen.**
   `create-pdf.ts` exportiert `loadPdfLibrary(): Promise<typeof import("jspdf").jsPDF>`; `createPdf` bekommt den jsPDF-Konstruktor als ersten Parameter. Der Dialog führt zwei Phasen aus:
   - Phase „load“: `await import("@/components/plan-pdf/create-pdf")` und `await loadPdfLibrary()`. Jeder Fehler hier gilt als Ladefehler.
   - Phase „create“: `createPdf(jsPDF, plan, options, availableImages, now)` und Download. Jeder Fehler hier gilt als Erstellungsfehler.
   *Alternative:* Fehler über `error.message` (enthält „dynamically imported module“ / „Importing a module script failed“) erkennen – browserabhängig und bricht bei Formulierungsänderungen.
   `jspdf` bleibt weiterhin nur bei Bedarf geladen und außerhalb des Haupt-Bundles.

3. **Hinweistext über eine reine Funktion in `src/lib/pdf-layout.ts`.**
   Der Dialog-Zustand `failed: boolean` wird zu `failure: "load" | "create" | null`. Eine Funktion `pdfFailureHint(failure)` liefert „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“, „PDF konnte nicht erstellt werden“ oder `null`; sie wird mit Vitest getestet. Die bestehende Priorität bleibt: „keine Etage“ und „passt nicht auf die Seite“ vor dem Fehlerhinweis. `change()` setzt `failure` wie bisher `failed` zurück.

**Datenmodell / schemaVersion:** keine Auswirkungen; es werden weder Plan noch Export-Format geändert.

**Abhängigkeiten:** keine neuen.

## Risks / Trade-offs

- [Ein Ladefehler kann auch ein echter Netzwerk- oder Server-Ausfall sein] → Der Hinweis „bitte Seite neu laden“ ist auch dann der passende nächste Schritt; der Fehler steht weiterhin in der Konsole.
- [`optimizeDeps.include` ändert den Config-Hash, Vite baut den Cache beim nächsten Start einmal neu] → Einmaliger Effekt beim Start, bevor eine Seite geladen ist.
- [Nach einem Deploy kann der Fehler weiterhin auftreten] → Gewollt nur mit klarem Hinweis abgefangen; automatisches Neuladen ist bewusst ausgeschlossen.
