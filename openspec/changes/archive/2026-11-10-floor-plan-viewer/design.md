# Design

## Context

- Ausgangslage: Vite + React 19 + TypeScript (strict), `@/` zeigt auf `src/`. `konva` 10, `react-konva` 19, `zustand` 5, `lucide-react` und shadcn/ui (base-ui-Variante, `src/components/ui/button.tsx`) sind installiert, aber noch ungenutzt. `src/App.tsx` ist ein Platzhalter.
- Grundrisse: `public/plans/eg.png`, `og.png`, `dg.png`, jeweils 1240 × 1754 px.
- Visuelle Vorgaben und Bedienentscheidungen: Design-Entwurf (Link in `docs/design/README.md`, das dieser Change anlegt).
- Anforderungen: siehe `specs/floor-plan-view/spec.md` und `specs/workspace-layout/spec.md`.

## Goals / Non-Goals

**Goals:**
- Eine Ansichts-Mathematik, die rein und testbar ist und später von Kalibrierung und Formen wiederverwendet wird (Bildschirm ↔ Bildpixel).
- Ein zentraler Store, in den der Plan später ohne Umbau einziehen kann.

**Non-Goals:**
- Keine Abstraktion für beliebige Häuser oder dynamische Etagen.
- Keine Darstellung in cm in diesem Change; die Ansicht arbeitet in Bildpixeln. Die Umrechnung cm ↔ px über `pxPerCm` kommt mit Kalibrierung und Formen.

## Decisions

### 1. Haus-Konfiguration: `src/config/house.ts`
- `FLOOR_IDS = ["eg", "og", "dg"] as const`, `type FloorId = (typeof FLOOR_IDS)[number]`.
- `FloorConfig { id, name, order, imageFile, calibration: Calibration | null }`, `Calibration { p1, p2, realLengthCm, pxPerCm }` mit Punkten in Originalpixeln des PNG.
- `calibration: null` bis zum Kalibrier-Change. **Abweichung** von der Projektkonfiguration, die `calibration` als Pflichtfeld beschreibt: Ein Platzhalterwert wie `pxPerCm: 1` sähe gültig aus und würde später falsche Maße liefern; `null` macht „nicht kalibriert“ sichtbar (Statusleiste).
- `FLOORS` ist ein nach `order` sortiertes, schreibgeschütztes Array; `getFloor(id)` liefert die Konfiguration.
- Alternative: Etagen als JSON-Datei. Verworfen, weil die Projektkonfiguration Code verlangt und TypeScript so die `FloorId` prüft.

### 2. Ansichtsmodell und reine Funktionen: `src/lib/viewport.ts`
- `Viewport { scale, x, y }`: `scale` = Bildschirmpixel pro Bildpixel (1 = 100 %), `x`/`y` = Bildschirmposition der linken oberen Bildecke in der Stage.
- Funktionen (ohne React/Konva):
  - `fitViewport(image: Size, view: Size, paddingPx = 24): Viewport`: einpassen und zentrieren, Ergebnis auf die Grenzen begrenzt.
  - `clampScale(scale): number`: Grenzen `MIN_SCALE = 0.1`, `MAX_SCALE = 8`.
  - `zoomAt(vp, point, factor): Viewport`: neuer `scale` begrenzt; `x`/`y` so verschoben, dass der Bildpunkt unter `point` an derselben Bildschirmposition bleibt.
  - `zoomAtCenter(vp, view, factor)`: Bequemlichkeit für Schaltflächen/Tasten.
  - `wheelFactor(deltaY): number`: `Math.exp(-deltaY * 0.0015)`, damit Mausrad (große Schritte) und Touchpad (viele kleine) sich gleichmäßig anfühlen.
  - `screenToImage(vp, point)`: wird von der Kalibrierung gebraucht; schon hier mit Test, damit `zoomAt` darauf aufbaut.
- Schaltflächen- und Tastenschritt: Faktor `1.25`.
- `src/lib/format.ts`: `formatZoomPercent(scale)` → `"87 %"` (gerundet, deutsches Format), `formatPxPerCm(value)` → `"0,9986"` (4 Nachkommastellen, `Intl.NumberFormat("de-DE")`).

### 3. Store: `src/store/app-store.ts` (Zustand)
- Ein zentraler Store, wie in der Projektkonfiguration vorgesehen. Zustand jetzt:
  - `activeFloorId: FloorId` (Start: erste Etage),
  - `viewports: Partial<Record<FloorId, Viewport>>` (nur im Speicher; fehlt ein Eintrag, wird beim Anzeigen eingepasst),
  - `propertiesPanelOpen: boolean` (Startwert aus `ui-prefs`).
- Aktionen: `setActiveFloor`, `setViewport(floorId, vp)`, `togglePropertiesPanel`.
- `activeFloorId` wandert im Change zum Plan-Modell nach `Plan.activeFloorId`; der Store-Zugriff bleibt gleich, nur die Quelle ändert sich.
- Alternative: Zoom/Position als lokaler React-State der Stage-Komponente. Verworfen, weil die Ansicht je Etage den Etagenwechsel überleben muss und Statusleiste/Zoom-Leiste denselben Wert brauchen.

### 4. Einstellung „Panel offen“: `src/lib/ui-prefs.ts`
- `readBoolean(storage, key, fallback)` / `writeBoolean(storage, key, value)`; `storage` wird übergeben (`Storage | undefined`), damit Tests ohne Browser laufen. Jeder Zugriff in `try/catch`; ungültige Werte → `fallback`.
- Schlüssel: `raumplaner.ui.propertiesPanelOpen`. Bewusst getrennt vom späteren Plan-Speicher: Ansichtseinstellungen gehören nicht in Export-Dateien.
- Der Store schreibt bei `togglePropertiesPanel`.

### 5. Zeichenfläche: `src/components/canvas/FloorCanvas.tsx`
- Größe: Container-`div` mit `ResizeObserver` (kleiner Hook `useElementSize`), Stage bekommt `width`/`height` in Pixeln. Ändert sich die Größe, bleibt `scale` unverändert (Spec „Größenänderung des Fensters“).
- Bild: eigener Hook `useHtmlImage(src)` → `{ image, status: "loading" | "loaded" | "error" }`. Alternative `use-image` verworfen: zusätzliche Abhängigkeit für ~20 Zeilen.
- Pfad: `` `${import.meta.env.BASE_URL}plans/${imageFile}` ``.
- Einpassen beim ersten Anzeigen: sobald Bild geladen **und** Stage-Größe > 0 und kein Viewport für die Etage existiert → `fitViewport` in den Store.
- Verschieben: `Stage draggable`; `onDragEnd` schreibt `x`/`y` in den Store (während des Ziehens bewegt Konva die Stage selbst, das spart Re-Renders). Später, wenn Formen dazukommen, wird das Ziehen auf Klicks auf den Hintergrund begrenzt.
- Mausrad: `onWheel` → `preventDefault()`, `zoomAt(vp, pointer, wheelFactor(deltaY))`. Touchpad-Pinch (`ctrlKey`) wird gleich behandelt.
- Fehler: bei `status === "error"` HTML-Overlay statt Bild mit „Der Grundriss „og.png“ konnte nicht geladen werden.“
- Tasten `+`/`=`, `-`, `0`: `keydown` auf `window`, ignoriert, wenn der Fokus in einem Eingabefeld liegt.

### 6. Gerüst-Komponenten: `src/components/layout/`
- `AppShell` (Raster: Kopfleiste / [Zeichenfläche | Panel] / Statusleiste, `h-svh`, `overflow-hidden`), `HeaderBar`, `FloorSwitcher` (Segment-Schalter aus `button`s mit `aria-pressed`), `PropertiesPanel` (Leerzustand), `PanelToggle` (Griff, absolut am rechten Rand der Zeichenfläche positioniert, damit er in beiden Zuständen am selben Ort sitzt; `aria-expanded`, deutsches `aria-label`), `ZoomControls`, `StatusBar`.
- Icons aus `lucide-react` (`ChevronRight`, `ChevronLeft`, `Minus`, `Plus`, `Scan`), keine eigenen SVGs in diesem Change.

### 7. Design-Tokens: `src/index.css`
- Werte der Stilvorlage in `:root`: `--background #FFFFFF`, `--foreground #18181B`, `--muted #F4F4F5`, `--muted-foreground #52525B`, `--border`/`--input #E4E4E7`, `--primary #18181B`, `--ring #93C5FD`, `--destructive #B91C1C`, `--radius 0.5rem`.
- Neu (mit Abbildung in `@theme inline`): `--selection #2563EB`, `--selection-bg #EFF6FF`, `--warning #B45309`, `--success #15803D`, `--canvas #F4F4F5`.
- Der `.dark`-Block bleibt unverändert (Dunkelmodus nicht im Umfang).
- Schrift bleibt die lokal gebundelte `@fontsource-variable/inter` (keine Netzwerkaufrufe).

### 8. Dokumentation: `docs/design/README.md`
- Link zum Design-Entwurf, Tabelle der Bedienentscheidungen (Panel-Griff, Formen per Klick einfügen, Ziehen mit 5-cm-Schritten / Alt = 1 cm, Schenkel bleiben beim Skalieren gleich, Einstellungen im Browser statt im Plan, Blau nur für Auswahl/Fokus/Maße) und die Token-Tabelle. Spätere Changes verweisen darauf.

### Auswirkungen auf Datenmodell und `schemaVersion`
Keine. Der Change führt weder `Plan` noch `Shape` ein; `schemaVersion` existiert noch nicht. Die Haus-Konfiguration ist Code, nicht Nutzerdaten, und gehört nicht zur Export-Datei. `localStorage` enthält nur den Ansichtsschlüssel `raumplaner.ui.propertiesPanelOpen`.

## Risks / Trade-offs

- [Stage-Ziehen kollidiert später mit dem Ziehen von Formen] → Im Formen-Change nur ziehen lassen, wenn der Klick den Hintergrund trifft (`e.target` ist Stage oder Grundrissbild).
- [Store-Update bei jedem Mausrad-Ereignis erzeugt viele Re-Renders] → Nur die Stage und die Zoom-Leiste abonnieren `viewports[activeFloorId]`; bei spürbarem Ruckeln Updates per `requestAnimationFrame` bündeln.
- [`calibration: null` weicht vom Konfigurationstext ab] → In diesem Design begründet; der Kalibrier-Change trägt echte Werte ein. Danach kann `null` für unkalibrierte Etagen bestehen bleiben.
- [React StrictMode führt Effekte doppelt aus (ResizeObserver, Tasten-Listener)] → Saubere Aufräumfunktionen in jedem Effekt.
- [Einpassen vor bekannter Stage-Größe ergibt Unsinn] → Einpassen erst, wenn Breite und Höhe > 0 sind.

## Open Questions

- Soll später ein Doppelklick auf den Hintergrund ebenfalls einpassen? Kann jederzeit ergänzt werden, ohne Specs oder Aufbau zu ändern.
