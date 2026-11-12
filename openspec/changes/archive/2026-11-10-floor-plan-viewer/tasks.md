# Tasks

## 1. Design-Grundlage

- [x] 1.1 `docs/design/README.md` anlegen: Link zum Design-Entwurf, Tabelle der Bedienentscheidungen und Token-Tabelle (siehe design.md, Entscheidung 8); prüfen, dass jede Entscheidung aus design.md dort steht
- [x] 1.2 Tokens der Stilvorlage in `src/index.css` eintragen (`:root`-Werte, neue `--selection`, `--selection-bg`, `--warning`, `--success`, `--canvas` samt Abbildung in `@theme inline`, `--radius: 0.5rem`); prüfen mit `npm run build` und Sichtprüfung, dass `bg-selection` / `text-warning` als Tailwind-Klassen wirken

## 2. Haus-Konfiguration

- [x] 2.1 `src/config/house.ts` mit `FLOOR_IDS`, `FloorId`, `Calibration`, `FloorConfig`, `FLOORS` (eg/og/dg, `calibration: null`) und `getFloor` anlegen
- [x] 2.2 `src/config/house.test.ts`: Reihenfolge eg → og → dg, eindeutige IDs und `order`-Werte, Bilddatei je Etage existiert unter `public/plans/`, `getFloor` liefert die passende Etage; prüfen mit `npm test`

## 3. Reine Logik in `src/lib/`

- [x] 3.1 `src/lib/viewport.ts` mit `Viewport`, `MIN_SCALE`, `MAX_SCALE`, `clampScale`, `fitViewport`, `screenToImage`, `zoomAt`, `zoomAtCenter`, `wheelFactor` umsetzen
- [x] 3.2 `src/lib/viewport.test.ts`: Einpassen eines 1240 × 1754-px-Bilds (Hoch- und Querformat-Ansicht, zentriert, Rand 24 px), Grenzen 0,1/8, `zoomAt` hält den Bildpunkt unter dem Zeiger fest, `screenToImage` ist Umkehrung der Darstellung, `wheelFactor` > 1 für negatives `deltaY`; prüfen mit `npm test`
- [x] 3.3 `src/lib/format.ts` mit `formatZoomPercent` und `formatPxPerCm` sowie `src/lib/format.test.ts` („87 %“, „800 %“, „0,9986“); prüfen mit `npm test`
- [x] 3.4 `src/lib/ui-prefs.ts` mit `readBoolean` / `writeBoolean` (übergebener Speicher, `try/catch`) sowie `src/lib/ui-prefs.test.ts`: gespeicherter Wert, fehlender Wert, ungültiger Wert, werfender Speicher, `undefined` als Speicher → jeweils Rückfallwert; prüfen mit `npm test`

## 4. Store

- [x] 4.1 `src/store/app-store.ts` (Zustand) mit `activeFloorId`, `viewports`, `propertiesPanelOpen` und den Aktionen `setActiveFloor`, `setViewport`, `togglePropertiesPanel` (schreibt über `ui-prefs`) anlegen
- [x] 4.2 `src/store/app-store.test.ts`: Startetage ist `eg`, Viewport bleibt je Etage nach Wechsel erhalten, Umschalten des Panels ändert den Zustand und schreibt den Schlüssel `raumplaner.ui.propertiesPanelOpen`; prüfen mit `npm test`

## 5. Gerüst der Arbeitsoberfläche

- [x] 5.1 `AppShell`, `HeaderBar` („Raumplaner“ links) und `StatusBar` unter `src/components/layout/` anlegen und in `src/App.tsx` einsetzen; prüfen mit `npm run dev`: Seite füllt das Fenster ohne Scrollbalken
- [x] 5.2 `FloorSwitcher` (Segment-Schalter, `aria-pressed`, mittig in der Kopfleiste) an den Store anbinden; prüfen im Browser: drei Einträge in der Reihenfolge Erdgeschoss, Obergeschoss, Dachgeschoss, Erdgeschoss ist beim Start aktiv, Klick wechselt die Markierung
- [x] 5.3 `PropertiesPanel` mit Leerzustand „Wähle eine Form aus“ und `PanelToggle` (Griff mittig, Pfeil rechts/links, `aria-expanded`, deutsches `aria-label`) anlegen; prüfen im Browser: Klick und Enter/Leertaste blenden aus/ein, Zustand übersteht Neuladen, mit gesperrtem Speicher startet das Panel sichtbar
- [x] 5.4 Statusleiste zeigt „Nicht kalibriert“ für Etagen mit `calibration: null`, sonst „Maßstab: … px/cm“ über `formatPxPerCm`; prüfen im Browser (alle drei Etagen „Nicht kalibriert“) und durch kurzzeitiges Eintragen eines Testwerts

## 6. Grundriss-Ansicht

- [x] 6.1 Hooks `useElementSize` (ResizeObserver) und `useHtmlImage` (`loading`/`loaded`/`error`) anlegen
- [x] 6.2 `src/components/canvas/FloorCanvas.tsx`: Stage in Containergröße, Grundriss der aktiven Etage als Konva-Image, Einpassen beim ersten Anzeigen (erst bei bekannter Größe), Fehler-Overlay mit Dateinamen; prüfen im Browser: Grundriss vollständig und zentriert, nach Umbenennen von `og.png` erscheint die Meldung mit „og.png“ und der Umschalter bleibt bedienbar (Datei danach zurückbenennen)
- [x] 6.3 Mausrad-Zoom zur Zeigerposition (`preventDefault`, Touchpad-Pinch gleich behandelt) und Verschieben per Ziehen (`onDragEnd` → Store); prüfen im Browser: Zimmerecke bleibt beim Zoomen unter dem Zeiger, Seite scrollt nicht, Ziehen verschiebt ohne Zoomänderung
- [x] 6.4 `ZoomControls` (Verkleinern, Prozentwert, Vergrößern, Einpassen, deutsche Tooltips) und Tasten `+`/`=`, `-`, `0` (nicht in Eingabefeldern); prüfen im Browser: Werte steigen/fallen um Faktor 1,25 um die Mitte, Grenzen 10 % und 800 % halten, `0` passt ein
- [x] 6.5 Ansicht je Etage und Größenänderung prüfen im Browser: Zoom 200 % im Erdgeschoss bleibt nach Wechsel ins Obergeschoss und zurück erhalten; Ein-/Ausblenden des Panels und Fenstergröße ändern die Fläche, nicht den Zoomwert

## 7. Abschluss

- [x] 7.1 Gesamtprüfung im Browser gegen alle Szenarien in `specs/floor-plan-view/spec.md` und `specs/workspace-layout/spec.md`; `npm run lint` ohne neue Warnungen
- [x] 7.2 `npm run build` und `npm test` laufen fehlerfrei
