# Tasks

## 1. Dev-Server

- [x] 1.1 In `vite.config.ts` `optimizeDeps: { include: ["jspdf"] }` ergänzen. Prüfen: `node_modules/.vite` löschen, `npm run dev` starten, `node_modules/.vite/deps/_metadata.json` enthält `jspdf` unter `optimized`, bevor eine Seite geöffnet wurde.

## 2. Hinweistext (Logik)

- [x] 2.1 In `src/lib/pdf-layout.ts` Typ `PdfFailure = "load" | "create"` und Funktion `pdfFailureHint(failure: PdfFailure | null): string | null` mit den Texten „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“ und „PDF konnte nicht erstellt werden“ ergänzen. Prüfen: neuer Test in `src/lib/pdf-layout.test.ts` für `"load"`, `"create"` und `null`; `npm test` grün.

## 3. Laden und Erstellen trennen

- [x] 3.1 In `src/components/plan-pdf/create-pdf.ts` `loadPdfLibrary()` exportieren (gibt `jsPDF` aus `import("jspdf")` zurück) und `createPdf` den Konstruktor als ersten Parameter übergeben statt selbst zu importieren; Kopfkommentar anpassen. Prüfen: `npx tsc -b` fehlerfrei.
- [x] 3.2 In `src/components/plan-pdf/PdfDialog.tsx` `failed` durch `failure: PdfFailure | null` ersetzen, `submit` in Phase „load“ (Modul-Import + `loadPdfLibrary`) und Phase „create“ (`createPdf` + Download) mit je eigenem `catch` aufteilen, Fehler weiter per `console.error` protokollieren, den Hinweis über `pdfFailureHint` bestimmen und `FAILED_HINT` entfernen. Prüfen: im Browser PDF erstellen funktioniert; mit DevTools „Request blocking“ auf `*jspdf*` erscheint „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“, der Dialog bleibt offen, die Schaltfläche ist wieder bedienbar; eine Maßstabsänderung entfernt den Hinweis.

## 4. Abschluss

- [x] 4.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
