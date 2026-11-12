# Design

## Context

- Ausgangslage nach `floor-plan-viewer`: `AppShell` (Raster Kopfleiste / [Zeichenfläche | Panel] / Statusleiste), `FloorCanvas` mit Konva-Stage (Stage-Transform = `Viewport`, Stage `draggable`, Mausrad über nativen Listener), Store `useAppStore` mit `activeFloorId`, `viewports`, `propertiesPanelOpen`. `src/lib/viewport.ts` bietet `screenToImage`/`imageToScreen`.
- `src/config/house.ts` definiert bisher `ImagePoint`, `Calibration { p1, p2, realLengthCm, pxPerCm }` und `FloorConfig.calibration`. Die Statusleiste zeigt den Stand aus `house.ts`.
- Entscheidung des Nutzers: Die Kalibrierung wird nicht mehr von Hand in `house.ts` eingetragen, sondern vom Werkzeug gespeichert. Ziel ist, dass sie Teil des Plans ist (localStorage zusammen mit den Möbeln, gleiche Exportdatei). Da `plan-model` noch nicht umgesetzt ist, speichert dieser Change sie vorerst unter einem eigenen Schlüssel.
- Visuelle Vorgabe: Artboard „Kalibrier-Modus“ im Design-Entwurf (Link in `docs/design/README.md`). Abweichung: Statt Code-Block und „Werte kopieren“ gibt es „Kalibrierung speichern“.
- Anforderungen: `specs/floor-calibration/spec.md`, `specs/workspace-layout/spec.md`.

## Goals / Non-Goals

**Goals:**
- Rechenweg (Abstand, Rundung, Maßstab, Länge ein-/ausgeben) vollständig als reine, getestete Funktionen.
- Gespeicherte Kalibrierungen und Kalibrier-Entwurf im zentralen Store, damit Werkzeugleiste, Kopfleiste, Panel, Zeichenfläche und Statusleiste denselben Stand sehen.
- Format und Prüfung der Kalibrierung so anlegen, dass `plan-model` sie ohne Umbau in den Plan übernimmt.
- Die Werkzeugleiste so anlegen, dass die Form-Werkzeuge später nur als weitere Einträge dazukommen.

**Non-Goals:**
- Kein allgemeines Werkzeug-System (aktives Werkzeug, Tastenkürzel V/R/…); der Kalibrier-Modus ist ein eigener Zustand. Ein Werkzeug-Modell kommt mit den Formen.
- Keine Umrechnung cm ↔ px in der Darstellung; die bleibt Aufgabe des Formen-Changes.
- Kein Export/Import, kein Löschen einer Kalibrierung, kein Rückgängig.

## Decisions

### 1. Reine Logik: `src/lib/calibration.ts`
- `roundImageCoord(v)` → auf 0,1 px; `roundImagePoint(p)`; `distancePx(p1, p2)`.
- `parseLengthCm(text): number | null`: trimmt, akzeptiert `,` und `.` als Dezimaltrenner (`/^\d+([.,]\d+)?$/`), Ergebnis muss > 0 sein, sonst `null`.
- `formatLengthText(cm): string`: Gegenstück für die Vorbelegung des Längenfelds – ohne Tausendertrenner und ohne überflüssige Nullen, deutsches Komma (`1000` → „1000“, `412.5` → „412,5“). `parseLengthCm(formatLengthText(x)) === x` für gespeicherte Werte.
- `computeCalibration(p1, p2, realLengthCm): Calibration | null`: erwartet bereits gerundete Punkte, liefert `null` bei Abstand 0; `pxPerCm = round4(distance / realLengthCm)`.
- `gridPxPerMeter(cal)` = `pxPerCm * 100` aus dem **gerundeten** `pxPerCm`, damit Anzeige und gespeicherter Wert übereinstimmen.
- Rundung von `pxPerCm` auf 4 Stellen: bei ≈ 1 px/cm ist der Fehler über 1 000 cm höchstens ≈ 0,05 px – unerheblich gegenüber der Klickgenauigkeit.
- `formatCalibrationSnippet` entfällt (kein Code-Block mehr).

### 2. Schema: `src/lib/calibration-schema.ts`
- Zod: `ImagePointSchema = z.object({ x: finite ≥ 0, y: finite ≥ 0 })`, `CalibrationSchema = z.object({ p1, p2, realLengthCm: finite > 0, pxPerCm: finite > 0 })`.
- `ImagePoint` und `Calibration` werden per `z.infer` daraus abgeleitet und ziehen von `house.ts` hierher (Projektvorgabe: Schema ist Quelle der TS-Typen).
- `plan-model` verwendet `CalibrationSchema` später für `Plan.calibrationByFloor`.

### 3. Speicherung im Browser: `src/lib/calibration-storage.ts`
- Schlüssel `raumplaner.calibration` (bewusst nicht unter `raumplaner.ui.*`: es sind Plandaten, keine Ansichts-Einstellung). Wert: `{ "version": 1, "byFloor": { "eg": { …Calibration } } }`.
- `readCalibrations(storage): Partial<Record<FloorId, Calibration>>`: liest und prüft mit Zod. Fehlender Schlüssel, blockierter Speicher, kaputtes JSON oder falsche `version` → `{}`; einzelne ungültige Einträge und unbekannte Etagen-IDs werden übergangen (eigene Daten, keine Importdatei – die Meldepflicht gilt für den Import).
- `writeCalibrations(storage, byFloor): boolean`: schreibt den ganzen Wert; `false` bei fehlendem oder blockiertem Speicher oder vollem Kontingent.
- Wie in `ui-prefs.ts` wird der Speicher übergeben, damit die Tests ohne Browser laufen.

### 4. Store-Erweiterung: `src/store/app-store.ts`
- `calibrations: Partial<Record<FloorId, Calibration>>` – beim Erzeugen des Stores mit `readCalibrations(storage)` geladen.
- `calibrationDraft: CalibrationDraft | null` (`null` = Modus aus), `CalibrationDraft { p1: ImagePoint | null; p2: ImagePoint | null; lengthText: string; saveFailed: boolean }`. Bewusst nicht `calibration` genannt, um Verwechslung mit der gespeicherten Kalibrierung zu vermeiden.
- `draftFor(floorId)`: aus `calibrations[floorId]` (Punkte, `formatLengthText(realLengthCm)`) oder leer.
- Aktionen:
  - `toggleCalibration()`: startet mit `draftFor(activeFloorId)` bzw. beendet und verwirft den Entwurf; `endCalibration()`.
  - `addCalibrationPoint(pt)` (setzt p1, dann p2, danach wirkungslos; rundet), `moveCalibrationPoint("p1" | "p2", pt)` (rundet), `resetCalibrationPoints()` (behält `lengthText`), `setCalibrationLength(text)`. Jede Änderung setzt `saveFailed` zurück.
  - `saveCalibration(): boolean`: berechnet das Ergebnis aus dem Entwurf (ohne Ergebnis wirkungslos, `false`), setzt `calibrations[activeFloorId]`, schreibt mit `writeCalibrations`. Erfolg → Modus beenden; Fehler → Kalibrierung gilt im Speicher der Sitzung, Entwurf bleibt mit `saveFailed: true`.
- `setActiveFloor` setzt bei aktivem Modus den Entwurf auf `draftFor(neue Etage)` (nur bei echtem Wechsel).
- `propertiesPanelOpen` und dessen `localStorage`-Schlüssel werden vom Modus nicht angefasst; die Sichtbarkeit wird nur in `AppShell` abgeleitet.
- Der Entwurf selbst wird nicht gespeichert, nur das Ergebnis von `saveCalibration`.
- Alternative: Zustand lokal in einer Kalibrier-Komponente. Verworfen, weil Werkzeugleiste, Kopfleiste, Panel, Stage und Statusleiste ihn teilen und der Etagenwechsel ihn umstellen muss.

### 5. Haus-Konfiguration und Statusleiste
- `FloorConfig` wird zu `{ id, name, order, imageFile }`; `calibration` und die Typen entfallen in `house.ts`. Bisher eingetragene Werte werden nicht übernommen (Entscheidung des Nutzers: neu messen).
- `StatusBar` liest `calibrations[activeFloorId]` aus dem Store statt `getFloor(...).calibration`; Texte bleiben („Nicht kalibriert“ / „Maßstab: … px/cm“).

### 6. Gerüst: Werkzeugleiste, Hinweisleiste, Panel-Wechsel
- `AppShell` wird zur Spalte: Kopfleiste (52 px) / `CalibrationBanner` (nur im Modus) / Zeile [`ToolBar` 52 px | Zeichenfläche | Panel] / Statusleiste (28 px).
- `ToolBar` (`src/components/layout/ToolBar.tsx`): `nav aria-label="Werkzeuge"`, senkrecht, `border-r`; unten (`mt-auto`) die Schaltfläche „Etage kalibrieren“ (`aria-pressed`, `aria-label`, `title`), Icon `Ruler` aus `lucide-react`. Aktiver Zustand wie im Entwurf mit `bg-selection-bg` / `text-selection` – ein aktives Werkzeug zählt als Auswahlzustand.
- `CalibrationBanner`: `bg-selection-bg`, blaue Linie unten, Text „Kalibrier-Modus“ + „Klicke zwei Punkte auf einer Strecke mit bekannter Länge.“ (Der Satz zu ausgeblendeten Möbeln aus dem Entwurf kommt erst mit den Formen.)
- `HeaderBar`: rechte Spalte zeigt im Modus die Schaltfläche „Kalibrierung beenden“ (`Button` aus shadcn, Variante `outline`).
- Panel-Bereich: `calibrationDraft ? <CalibrationPanel/> : propertiesPanelOpen && <PropertiesPanel/>`; `PanelToggle` wird im Modus nicht gerendert.

### 7. Kalibrier-Panel: `src/components/calibration/CalibrationPanel.tsx`
- Aufbau nach Entwurf: Überschrift „<Etage> kalibrieren“ + Erklärsatz; Schritte mit Status-Punkt (erledigt/aktuell) „Punkt 1 gesetzt“ / „Punkt 2 gesetzt“ mit `x … · y … px`, Längenfeld mit Einheit „cm“, „Punkte neu setzen“; Abschnitt „Ergebnis“ mit `pxPerCm` und Raster-Wert.
- Darunter die primäre Schaltfläche „Kalibrierung speichern“ (volle Breite, `disabled` ohne Ergebnis) und der Hinweis „Die Kalibrierung wird im Browser gespeichert. Möbel bleiben in cm – ein neuer Maßstab verschiebt sie auf dem Grundriss.“
- Bei `saveFailed`: Hinweis (`role="alert"`) „Die Kalibrierung gilt bis zum Neuladen, konnte aber nicht im Browser gespeichert werden.“
- Ergebnis wird bei jedem Render aus Store-Werten abgeleitet (`parseLengthCm` + `computeCalibration`), nicht im Entwurf gespeichert.
- Ungültige, nicht leere Länge: Hinweis „Bitte eine Länge größer als 0 cm eingeben.“ unter dem Feld (`aria-describedby`).
- Code-Block, „Werte kopieren“ und Zwischenablage entfallen.

### 8. Zeichenfläche: Punkte setzen, Overlay, Ziehen
- Klick: `Stage onClick` (nur linke Maustaste). Konva löst nach einem Ziehen der Stage kein `click` aus; das erfüllt „Ansicht ziehen setzt keinen Punkt“. Zeigerposition → `screenToImage`; liegt der Punkt außerhalb `0…naturalWidth` / `0…naturalHeight`, passiert nichts.
- Overlay: eigene `CalibrationOverlay`-Komponente als zweiter `Layer` in derselben Stage, in Bildkoordinaten. Für gleichbleibende Bildschirmgröße: Linie mit `strokeScaleEnabled={false}` und Strichmuster geteilt durch `scale`; Markierungen (Fadenkreuz + Kreis, Etikett „P1“/„P2“) und Streckenbeschriftung als `Group` mit `scaleX/scaleY = 1 / scale`. Farbe `#2563EB` (= `--selection`, Konva kann keine CSS-Variablen lesen).
- Ziehen eines Punkts: Marker-`Group` ist `draggable`; Konva zieht den obersten ziehbaren Knoten, daher bewegt sich die Stage dabei nicht (der vorhandene `onDragEnd` der Stage prüft bereits `e.target === stage`). `dragBoundFunc` begrenzt die Position in Bildschirmkoordinaten auf die Bildfläche; `onDragMove` schreibt über `moveCalibrationPoint` in den Store (fortlaufende Aktualisierung).
- Zeiger: im Modus `cursor-crosshair` auf der Stage, `move` über Markern.
- Zoom, Tasten `+`/`-`/`0` und Mausrad bleiben unverändert; das Längenfeld ist ein `input`, die Tastenkürzel ignorieren es bereits.

### 9. Übergang zu `plan-model` und `export-import`
- `plan-model` ergänzt `Plan.calibrationByFloor: Partial<Record<FloorId, Calibration>>` (mit `CalibrationSchema`) in `schemaVersion` 1 – das Format ist noch nicht ausgeliefert, daher keine Versionserhöhung.
- Beim Laden ohne gespeicherten Plan übernimmt `plan-model` den Inhalt von `raumplaner.calibration` einmalig in den neuen Plan und entfernt den Schlüssel danach; `calibrations` im Store wird dann aus dem Plan gelesen und `saveCalibration` schreibt in den Plan.
- `export-import` exportiert und importiert die Kalibrierung als Teil des Plans.
- Diese Punkte werden in den jeweiligen Changes festgehalten, nicht hier umgesetzt.

### Auswirkungen auf Datenmodell und `schemaVersion`
Noch kein `Plan`-Modell im Code; die Kalibrierung liegt bis `plan-model` unter `raumplaner.calibration` mit eigener `version: 1`. Für das spätere Plan-Format bedeutet der Change ein zusätzliches Feld `calibrationByFloor` bereits in `schemaVersion` 1. `FloorConfig` verliert das Feld `calibration` (Code, keine Nutzerdaten).

## Risks / Trade-offs

- [Konva unterdrückt `click` nach Stage-Ziehen nicht zuverlässig (z. B. bei minimaler Mausbewegung)] → Im Test prüfen; falls nötig Abstand zwischen `mousedown` und `click` messen und ab 3 px keinen Punkt setzen.
- [Ziehen eines Markers startet doch die Stage-Verschiebung] → Konva startet kein Ziehen der Stage, solange ein Kind gezogen wird; zusätzlich ignoriert `onDragEnd` der Stage fremde Ziele.
- [`dragBoundFunc` arbeitet in absoluten Koordinaten, die Group ist zusätzlich invers skaliert] → Begrenzung über Stage-Position und -Skalierung rechnen und im Browser bei 10 % und 800 % prüfen.
- [Neuer Maßstab verschiebt vorhandene Möbel] → Möbel liegen in cm; das ist gewollt und wird im Panel erwähnt. Eine Nachfrage vor dem Überschreiben ist nicht im Umfang.
- [Zwei Speicherorte bis `plan-model`] → Übergang in Entscheidung 9 festgelegt; der eigene Schlüssel verschwindet mit der Übernahme.
- [Browser-Daten gelöscht → Kalibrierung weg] → Bis `export-import` gibt es keine Sicherung; danach über die Exportdatei.
- [Werkzeugleiste mit nur einer Schaltfläche wirkt leer] → Bewusst so, die Form-Werkzeuge folgen; entspricht dem Entwurf, in dem „Kalibrieren“ unten abgesetzt sitzt.
