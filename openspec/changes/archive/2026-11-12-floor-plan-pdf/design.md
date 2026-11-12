# Design

## Context

Siehe proposal.md – Why. Anforderungen in `specs/plan-pdf/spec.md`.

Ausgangslage im Code:

- Der Editor zeichnet mit react-konva. Die Ebenen (`RoomsLayer`, `OpeningsLayer`, `ShapesLayer`, `UnderlayLayer`, `GridLayer`) lesen direkt aus dem Store, sind interaktiv (Auswahl, Ziehen, Fangmarken) und zeichnen Linien und Beschriftungen in fester **Bildschirm**größe (`strokeScaleEnabled={false}`, Schrift über den aktuellen Zoom gegengerechnet).
- Die Wände entstehen nicht als eigene Geometrie, sondern durch Ausschneiden: alle Wandbänder (`wallBandOutline`) füllen, dann alle Rauminnenflächen und Öffnungslücken (`openingGap`) mit `destination-out` herausschneiden.
- Die Geometrie selbst ist rein und liegt in `src/lib/`: `wallBandOutline`, `labelPointCm`, `signedArea2` (room-geometry), `edgeFrame`, `openingGap`, `doorLeaf`, `windowSymbol` (opening-geometry), `getOutlineCm`, `getLabelAnchorCm` (outline), `floorContentBounds` (content-bounds), `underlayBoundsCm`, `underlayGroupAttrs` (underlay), `gridLines` (grid), `roomAreaFill` (room-colors), `exportFileBase`, `localDateKey` (plan-export).
- Vorlagenbilder liegen in IndexedDB (`loadImage(id)` in `src/storage/image-cache.ts`).
- Downloads laufen über eine Blob-URL (`downloadTextFile` in `src/components/plan-file/download.ts`).
- Eine Raumfläche wird bisher nirgends angezeigt; `signedArea2` liefert die doppelte vorzeichenbehaftete Fläche.

## Goals / Non-Goals

**Goals:**
- Exakter Maßstab auf dem Papier, unabhängig von Browser-Druckeinstellungen.
- Zeichnung sieht aus wie im Editor (gleiche Geometrie, gleiche Farben), aber ohne Bedienelemente.
- Seitenaufbau, Maßstab, Passt-Prüfung, Maßstabsbalken, Fläche und Dateiname als reine, getestete Funktionen.
- Haupt-Bundle wächst nicht: die PDF-Bibliothek wird erst beim Klick auf „PDF erstellen“ geladen.

**Non-Goals:**
- Vektor-Grafik für den Grundriss selbst (siehe Entscheidung 2).
- Wiederverwendung der interaktiven Editor-Komponenten für den Druck.
- Gemeinsamer Zeichen-Code zwischen Editor und Druck über die Geometrie- und Farbfunktionen hinaus.

## Decisions

### 1. PDF direkt im Browser mit `jspdf` erzeugen

`jspdf` (aktuelle 3.x, MIT, keine Netzwerkzugriffe) erzeugt die Datei, die über einen Blob heruntergeladen wird. Seitengröße und Platzierung werden in mm angegeben, damit stimmt der Maßstab exakt.

Begründung der neuen Abhängigkeit: Ein PDF-Format von Hand zu schreiben (Seiten, Bilder, Text mit Umlauten) ist deutlich mehr Code als der Rest der Änderung. `jspdf` bringt Standardschrift Helvetica mit WinAnsi-Kodierung mit – „ä ö ü ß – ²“ funktionieren ohne eingebettete Schrift.

Laden per `await import("jspdf")` im Klick-Handler; Vite legt es in einen eigenen Chunk.

Alternativen:
- *Druckdialog des Browsers (`window.print()` + `@page`)*: keine Abhängigkeit, aber Ränder und „An Seite anpassen“ hängen vom Browser ab, Maßstab nicht garantiert; vom Nutzer abgewählt.
- *pdf-lib*: ähnlich groß, aber ohne Textlayout-Hilfen; kein Vorteil.

### 2. Grundriss je Etage als Rasterbild (300 dpi), Kopf/Fuß als Vektor

Für jede Etage wird der Zeichenbereich offscreen in eine Konva-Stage (Konva-Kern, nicht react-konva, kein DOM-Element sichtbar) gezeichnet, als PNG exportiert und mit `addImage` exakt in mm-Größe des Zeichenbereichs auf die Seite gelegt. Kopfzeile, Maßstabstext und Maßstabsbalken zeichnet `jspdf` direkt als Text/Linien.

- Auflösung 300 dpi (≈ 11,81 px/mm): Hochformat-Zeichenbereich 190 × 250 mm → 2244 × 2953 px, Querformat 277 × 163 mm → 3272 × 1925 px.
- Maßstab: `pxPerCm = (10 / N) mm × 11,81 px/mm` bei Maßstab 1:N; die Stage bekommt diesen Faktor als Skalierung und den Zentrierversatz als Position – dieselbe cm-Welt wie im Editor.
- Wände wie im Editor: Bänder füllen, Innenflächen und Öffnungslücken mit `destination-out` ausschneiden, auf eigener Ebene, damit Vorlage und Raster darunter sichtbar bleiben.
- Linienstärken und Schriftgrößen in **mm** statt Bildschirm-px (z. B. Linien 0,25 mm, Raumname 3 mm, Fläche 2,5 mm, Möbelbeschriftung 2,5 mm), umgerechnet in px über die feste Auflösung. Schrift „Inter Variable“ wie im Editor; vor dem Zeichnen wird `document.fonts.ready` abgewartet.

Alternativen:
- *Reine Vektorgrafik mit jspdf*: schärfer und kleinere Dateien, aber die Wandbänder müssten als Polygon-Differenz (Band minus alle Innenflächen und Lücken) berechnet werden. PDF-Clipping mit even-odd scheitert an überlappenden Lücken/Innenflächen; eine Polygon-Boolean-Bibliothek wäre eine zweite Abhängigkeit. Für Ausdruck auf A4 reicht 300 dpi.
- *Editor-Ebenen mit `floorId` offscreen rendern*: spart Zeichencode, zieht aber Auswahl, Fangmarken, Ziehen und bildschirmfeste Größen mit; ein „Druckmodus“ müsste durch alle Ebenen gefädelt werden.

### 3. Reine Logik in `src/lib/pdf-layout.ts`

Alles, was die Specs messbar macht, ist rein und getestet:

- `PdfOptions { floorIds, orientation: "portrait" | "landscape", scale: 50 | 100 | "fit", furniture, roomLabels, underlay, grid }` und `defaultPdfOptions(plan)`.
- `PAGE_MM` (210 × 297), `MARGIN_MM = 10`, Kopfbereich und Fußbereich so, dass der Zeichenbereich 190 × 250 mm (hoch) bzw. 277 × 163 mm (quer) ist; `drawingAreaMm(orientation)`.
- `printContentBounds({ rooms, shapes, underlayRect }, options)` → `RectCm | null` (`null` = Etage ohne Inhalt). Nutzt `floorContentBounds`, gibt aber statt `EMPTY_FLOOR_BOUNDS` `null` zurück.
- `fitScaleDenominator(bounds, area)` → kleinste ganze Zahl N mit `bounds.width / N ≤ area.width·0,1` und Höhe entsprechend (cm vs. mm!), mit Toleranz 1e-9 gegen Rundungsfehler (13850 / 277 muss 50 ergeben, nicht 51).
- `fitsAtScale(bounds, area, N)`, `pageScale(bounds, area, options.scale)` (leere Etage → 100).
- `drawingTransform(bounds, area, N)` → Versatz in mm, sodass der Inhalt zentriert liegt.
- `scaleBarMeters(N)` → größte Länge aus 1, 2, 5, 10, 20, 50 m mit Papierlänge ≤ 100 mm.
- `pdfIssues(...)` → `{ noFloor: boolean, tooLarge: string[] }` (Etagennamen in Etagenreihenfolge) für den Dialog.
- `pdfFileName(planName, date)` → `YYYY-MM-DD-<exportFileBase>-grundriss.pdf`; `formatPrintDate(date)` → `TT.MM.JJJJ`.

Dazu `roomAreaM2(points)` in `room-geometry.ts` (|signedArea2| / 2 / 10 000) und `formatAreaM2(value)` in `format.ts` („12,50 m²“).

### 4. Komponenten unter `src/components/plan-pdf/`

- `PdfDialog.tsx`: Formular mit den Optionen; berechnet `pdfIssues` bei jeder Änderung; neue `session` je Öffnen setzt auf `defaultPdfOptions` zurück (wie beim `ExportDialog`). Beim Öffnen wird einmal geprüft, welche Vorlagenbilder in IndexedDB vorhanden sind; nur deren Rechtecke zählen bei „Vorlage“.
- `render-floor.ts`: zeichnet eine Etage offscreen mit Konva-Kern in einen Canvas und gibt eine PNG-Data-URL zurück (Reihenfolge: Raster, Vorlage, Raumflächen, Wände, Öffnungssymbole, Möbel, Raumnamen/Fläche). Leere Etage: Text „Keine Räume auf dieser Etage“ wird von `jspdf` gesetzt, kein Bild.
- `create-pdf.ts`: lädt `jspdf`, baut je Etage eine Seite (Kopfzeile, Bild, Fußzeile mit Maßstab und Balken) und gibt einen Blob zurück.
- `PdfAction.tsx`: Schaltfläche „PDF“ (Icon `FileDown` o. ä. aus lucide-react) neben „Exportieren“; in `HeaderBar.tsx` im Nicht-Kalibrier-Zweig eingehängt.
- `download.ts`: `downloadTextFile` wird auf ein allgemeines `downloadBlob(name, blob)` gestützt.

Gemeinsame Farbkonstanten aus `RoomsLayer`/`OpeningsLayer`/`ShapeNode`, die der Druck braucht (Beschriftungsfarbe, Aufschlag-Strich), werden in ein kleines Modul gezogen, damit Editor und Druck nicht auseinanderlaufen.

### 5. Kein Store-Zustand, kein Verlauf

Der Dialog liest den Plan aus dem Store, schreibt aber nichts. Die Optionen leben nur im Dialog-State. So entsteht kein Undo-Schritt und der Plan bleibt unverändert.

## Datenmodell und schemaVersion

Keine Änderung am Plan, an `PlanSettings` oder am Export-/Importformat; `schemaVersion` bleibt unverändert. Die Dialog-Auswahl wird weder im Plan noch im localStorage gespeichert.

## Risks / Trade-offs

- [Rasterbild statt Vektor: Linien bei starker Vergrößerung im PDF-Viewer unscharf, Datei mit Vorlage mehrere MB] → 300 dpi reicht für A4-Druck; PNG für Linien. Falls Dateien mit Vorlage zu groß werden, kann später nur die Vorlage als JPEG darunter gelegt werden, ohne Specs zu ändern.
- [Zeichencode für den Druck dupliziert Teile der Editor-Ebenen (Stile, Reihenfolge)] → Geometrie kommt ausschließlich aus `src/lib/`; gemeinsame Farbkonstanten in ein Modul; manuelle Sichtprüfung Editor vs. PDF in den Tasks.
- [Große Canvas-Flächen (≈ 6,6 Mpx je Seite) bei vielen Etagen] → Seiten nacheinander erzeugen und den Canvas nach `toDataURL` freigeben (`stage.destroy()`).
- [Rundung beim Einpassen ergibt N = 51 statt 50] → Toleranz in `fitScaleDenominator`, Test mit genau passenden Maßen.
- [Schrift „Inter Variable“ noch nicht geladen → Ersatzschrift im Bild] → `await document.fonts.ready` vor dem Zeichnen.
- [Umfang knapp an einer Arbeitssitzung] → Aufgaben so geschnitten, dass nach Gruppe 2 die Logik vollständig getestet ist und Gruppe 3/4 nur noch Darstellung sind.

## Migration Plan

Keine Datenmigration. Rückbau = Schaltfläche und `src/components/plan-pdf/` entfernen, `jspdf` aus `package.json` streichen.
