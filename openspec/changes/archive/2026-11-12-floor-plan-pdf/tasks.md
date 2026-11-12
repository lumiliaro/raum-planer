# Tasks

## 1. Abhängigkeit

- [x] 1.1 `jspdf` (3.x) als Laufzeit-Abhängigkeit installieren; prüfen: `package.json`/Lockfile enthalten `jspdf`, `npm run build` läuft weiterhin

## 2. Reine Logik (src/lib/)

- [x] 2.1 `roomAreaM2(points)` in `src/lib/room-geometry.ts` und `formatAreaM2(value)` in `src/lib/format.ts` („12,50 m²“) ergänzen; Vitest: Rechteck 400 × 312,5 cm → 12,5 m² → „12,50 m²“, L-Raum, Punkte gegen den Uhrzeigersinn ergeben dieselbe positive Fläche
- [x] 2.2 `src/lib/pdf-layout.ts` anlegen mit `PdfOptions`, `defaultPdfOptions(plan)`, Seitenkonstanten und `drawingAreaMm(orientation)`; Vitest: Voreinstellungen (alle Etagen, Hochformat, 1:100, Möbel + Raumnamen an, Vorlage + Raster aus), Zeichenbereich 190 × 250 mm bzw. 277 × 163 mm
- [x] 2.3 `printContentBounds`, `fitsAtScale`, `fitScaleDenominator`, `pageScale` und `drawingTransform` ergänzen; Vitest mit den Spec-Szenarien: 1385 × 500 cm quer → 1:50, 2000 × 1000 cm hoch → 1:106, 1200 × 900 cm passt bei 1:50 weder hoch noch quer, bei 1:100 hoch schon; Möbel zählen nur bei „Möbel“, Vorlage nur bei „Vorlage“ und vorhandenem Bild; leere Etage → `null` und Maßstab 100; 430 × 330 cm bei 1:100 liegt zentriert
- [x] 2.4 `scaleBarMeters(N)`, `pdfIssues(...)`, `pdfFileName(planName, date)` und `formatPrintDate(date)` ergänzen; Vitest: 1:100 → 10 m, 1:50 → 5 m, 1:106 → 10 m (9,43 cm), unter 1:10 → 1 m; keine Etage → `noFloor`; zu große Etagen in Etagenreihenfolge; „Umzug“ am 12.11.2026 → `2026-11-12-umzug-grundriss.pdf`, Datum „12.11.2026“; `npm test` grün

## 3. Seiten erzeugen

- [x] 3.1 In `src/components/plan-file/download.ts` `downloadBlob(name, blob)` herausziehen und `downloadTextFile` darauf stützen; prüfen: JSON-Export lädt weiterhin `…_n.json` herunter (Browser), `npm test` grün
- [x] 3.2 Vom Druck benötigte Farb-/Strichkonstanten aus `RoomsLayer`, `OpeningsLayer` und `ShapeNode` in ein gemeinsames Modul unter `src/components/canvas/` ziehen; prüfen: Editor sieht unverändert aus (Browser), `npm run build` läuft
- [x] 3.3 `src/components/plan-pdf/render-floor.ts`: Etage offscreen mit Konva-Kern bei 300 dpi zeichnen (Raster, Vorlage mit Kalibrierung und Deckkraft, Raumflächen in Raumfarbe, Wände mit `destination-out` für Innenflächen und Öffnungslücken, Türen/Fenster/Durchgänge, Möbel in Zeichenreihenfolge mit Beschriftung, Raumname + Fläche), Linien/Schrift in mm, `document.fonts.ready` abwarten, Stage danach zerstören; prüfen über 3.4 im Browser
- [x] 3.4 `src/components/plan-pdf/create-pdf.ts`: `jspdf` per `import()` laden, je gewählter Etage eine A4-Seite im gewählten Format mit Kopfzeile („Plan – Etage“, Datum), Bild des Zeichenbereichs in exakter mm-Größe bzw. Text „Keine Räume auf dieser Etage“, Fußzeile „Maßstab 1:N“ mit Maßstabsbalken; Blob zurückgeben; prüfen: `npm run build` zeigt `jspdf` in eigenem Chunk

## 4. Dialog und Kopfleiste

- [x] 4.1 `src/components/plan-pdf/PdfDialog.tsx`: Etagen-Häkchen, Hoch-/Querformat, Maßstab, Inhalts-Häkchen; bei jedem Öffnen Voreinstellungen; Vorhandensein der Vorlagenbilder beim Öffnen prüfen; Hinweise „Bitte mindestens eine Etage auswählen“ und „Passt nicht auf die Seite: …“ mit gesperrtem „PDF erstellen“; „Wird erstellt …“ während des Erstellens; Fehlerhinweis „PDF konnte nicht erstellt werden“; `Esc`/„Abbrechen“ schließt; prüfen im Browser gegen die Szenarien in `specs/plan-pdf/spec.md`
- [x] 4.2 Schaltfläche „PDF“ mit Icon und Text rechts neben „Exportieren“ in `HeaderBar.tsx`, im Kalibrier-Modus ausgeblendet; „PDF erstellen“ lädt `YYYY-MM-DD-<name>-grundriss.pdf` herunter und schließt den Dialog, ohne Plan oder Verlauf zu ändern; prüfen im Browser (Kopfleiste normal und im Kalibrier-Modus, Rückgängig nach dem Download)

## 5. Abschluss

- [x] 5.1 Sichtprüfung im Browser: PDF mit 2 Etagen hoch und quer, 1:50/1:100/Einpassen, mit und ohne Möbel, Raumnamen, Vorlage, Raster; ausgedruckt eine 500 cm lange Wand bei 1:100 mit dem Lineal = 5 cm; Zeichnung entspricht dem Editor ohne Auswahl-Markierung
- [x] 5.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei
