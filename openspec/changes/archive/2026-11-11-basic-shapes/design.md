# Design

## Context

- **Voraussetzungen:**
  - `floor-calibration` (umgesetzt): `ToolBar` mit nur „Etage kalibrieren“ unten über die Komponente `ToolButton` (`aria-pressed`, aktiv `bg-selection-bg`/`text-selection`), `CalibrationBanner`, `calibrationDraft` im Store mit `toggleCalibration`/`endCalibration` und das Kalibrier-Overlay als eigener `Layer`.
  - `plan-model` (geplant, muss vor diesem Change umgesetzt sein): `src/lib/plan-schema.ts` (Zod-Schema, Typen `Plan`/`Shape`), `src/lib/plan.ts` (reine Funktionen zum Hinzufügen, Ändern, Löschen), den Plan im Store mit `plan.activeFloorId` und `plan.calibrationByFloor`, die Store-Aktionen `addShape`, `updateShape` und `removeShape` (Rückgabe `true`/`false`, siehe dessen design.md, Entscheidung 4) und das Autosave.
- **Zeichenfläche heute:** Die Stage-Transformation ist der `Viewport` (Bildpixel → Bildschirm, `scale` = Zoom). Die Stage ist `draggable` (Ansicht verschieben), `onDragEnd` reagiert nur auf `e.target === stage`. Tastenkürzel `+`/`-`/`0` stehen in einem `keydown`-Listener in `FloorCanvas` und ignorieren Eingabefelder über `isEditableTarget`.
- **Maßstab:** `plan.calibrationByFloor[floorId]?.pxPerCm` (Bildpixel je cm). `FloorConfig` hat seit `floor-calibration` kein Feld `calibration` mehr. Fehlt der Eintrag, ist die Etage nicht kalibriert. Formen liegen in cm, der Ursprung ist die linke obere Ecke des Grundrissbilds.
- **Visuelle Vorgabe:** Artboard „Hauptansicht – Form ausgewählt“ (Link in `docs/design/README.md`): Werkzeugleiste oben „Auswählen“, Trenner, Form-Werkzeuge; Auswahlrahmen blau `#2563EB` mit weißen, 7 px großen Anfassern und einem runden Dreh-Anfasser oben; im Panel der Kopf mit Formtyp und „Löschen“, darunter die Abschnitte „Maße“ und „Lage“ zweispaltig.
- Anforderungen: `specs/shape-editing`, `specs/shape-outline`, `specs/workspace-layout`, `specs/floor-plan-view`.

## Goals / Non-Goals

**Goals:**
- Die gesamte Rechenlogik (Umriss, Raster, Umrechnung, Ergebnis einer Transformation, neue Form) liegt als reine, getestete Funktionen in `src/lib/`. Die Konva-Komponenten setzen sie nur ein.
- Ein Formtyp kommt später durch dreierlei hinzu: einen Eintrag in `getOutlineCm`, einen Eintrag im Werkzeug-Verzeichnis und (mit `shape-properties`) ein Formular. Zeichnen, Auswahl, Verschieben und Transformer gelten unverändert für jeden Typ.
- Der Plan wird nur beim Loslassen geändert, nicht bei jeder Mausbewegung.

**Non-Goals:**
- Kein allgemeines Befehls- oder Werkzeug-Framework. Ein String-Feld `activeTool` reicht.
- Keine Maßketten oder Live-Zahlen während des Ziehens. Die Übersicht im Panel aktualisiert sich beim Loslassen.

## Decisions

### 1. Darstellung: Umriss in Bildpixeln, eine `Group` je Form
- `ShapesLayer` ist ein eigener `Layer` zwischen Grundriss-Ebene und Kalibrier-Overlay. Er wird nicht gerendert, solange der Kalibrier-Modus aktiv ist oder die Etage keine Kalibrierung hat.
- Je Form eine `Group` mit `id = shape.id`, `x = cmToPx(shape.x)`, `y = cmToPx(shape.y)` und `rotation = rotationDeg`. Darin liegt eine geschlossene `Line`, deren Punkte `getOutlineCm(shape)` liefert, umgerechnet mit `pxPerCm`. Die Umrechnung geschieht also erst beim Zeichnen, wie im Datenmodell gefordert.
- `strokeScaleEnabled={false}`: Die Randstärke gilt in Bildschirmpixeln, unabhängig von Zoom und Maßstab. So legt die Spec „Formen darstellen“ die Bedeutung von `style.strokeWidth` fest. Das Datenformat ändert sich dadurch nicht.
- `fill: null` (kommt erst mit `shape-properties`) wird als `fill="rgba(0,0,0,0)"` gezeichnet. Konva zählt dann auch das Innere als Trefferfläche, und eine Form „nur Rand“ lässt sich weiter anklicken.
- Alternative: Konva `Rect`/`Ellipse`. Verworfen, weil die Projektvorgabe verlangt, dass die Darstellung `getOutlineCm` nutzt, und weil L-/U-Formen ohnehin Polygone werden. Mit Polygonen funktionieren Transformer und Trefferprüfung für alle Typen gleich.

### 2. Umriss: `src/lib/outline.ts`
- `getOutlineCm(shape): PointCm[] | null`. Die Punkte liegen relativ zum Mittelpunkt, ohne Drehung, y nach unten. Bei `mirrored` wird x negiert, die Reihenfolge der Punkte bleibt gleich. So verlangt es `more-shapes`, dessen Tür sich auf feste Punktnummern stützt. Konvas Füllung und Trefferprüfung hängen nicht vom Umlaufsinn ab.
- Rechteck: vier Ecken. Bei `cornerRadiusCm > 0` ersetzt je Ecke ein Viertelbogen die Ecke. Die Segmentzahl je Bogen ist das kleinste `n ≥ 2`, bei dem die Sehnenhöhe `r·(1 − cos(π/4n))` höchstens 0,5 cm beträgt. Die Endpunkte der Bögen liegen exakt auf den Kanten.
- Ellipse: Die Punktanzahl ist ein Vielfaches von 4, damit die vier Scheitel enthalten sind. Sie hat mindestens 32 Punkte und wächst mit dem Umfang, sodass ein Segment höchstens etwa 4 cm lang ist. Der Test prüft die Abweichung an den Sehnenmitten (≤ 0,5 cm) für 10 × 10 cm, 80 × 80 cm, 400 × 60 cm und 1 000 × 1 000 cm.
- Andere `kind`s liefern `null` (`switch` mit `never`-Prüfung, damit ein neuer Typ ohne Umriss nicht unbemerkt bleibt). `ShapesLayer` überspringt sie.

### 3. Raster und Transformation: `src/lib/snap.ts`, `src/lib/shape-transform.ts`
- Konstanten `SNAP_STEP_CM = 5` und `FINE_SNAP_STEP_CM = 1`. `snapStepCm(altKey)` wählt zwischen beiden.
- `snapDelta(deltaCm, stepCm)`: rundet auf das nächste Vielfache und vermeidet `-0`. Damit arbeitet das Raster **relativ zur Startlage** (Entscheidung des Nutzers): 37 cm + 13 cm Zug ergibt 52 cm.
- `snapRotationDeg(deg)`: normalisiert auf 0 bis unter 360 und rastet auf 0/90/180/270 ein, wenn der Abstand höchstens 5° beträgt. Sonst rundet es auf ganze Grad (aus 359,6 wird 0).
- `snapResizeBox(start, next, stepPx, minPx)`: arbeitet mit Konvas Box-Format `{x, y, width, height, rotation}` (x/y = gedrehte linke obere Ecke). Die Funktion dreht beide Boxen ins lokale Achsensystem und erkennt an den Kanten, welche sich gegenüber `start` bewegt haben. Deren Versatz rastet sie auf Vielfache von `stepPx` ein, mit Mindestbreite `minPx`. Unbewegte Kanten bleiben exakt stehen. Danach dreht sie zurück. Die Einheit ist frei wählbar, der Aufrufer rechnet `stepPx = stepCm · pxPerCm · zoom`.
- `applyTransform(shape, { xCm, yCm, widthCm, depthCm, rotationDeg })` in `shape-transform.ts`: rundet Maße und Lage auf 0,1 cm (gegen Gleitkomma-Reste), setzt die Mindestgröße 1 cm durch, rastet die Drehung über `snapRotationDeg` ein und verkleinert `cornerRadiusCm` auf höchstens die halbe kürzere Seite. Heraus kommt eine gültige Form für `updateShape`.
- `moveBy(shape, dxCm, dyCm)`: neue Lage = Startlage + eingerasteter Versatz, gerundet auf 0,1 cm. Die Endlage wird aus cm berechnet, nicht aus Pixeln zurückgerechnet. So bleibt z. B. 37 cm + 15 cm exakt 52 cm.

### 4. Verschieben auf der Zeichenfläche
- Die `Group` ist `draggable`, wenn `activeTool === "select"` gilt und der Kalibrier-Modus aus ist. Konva zieht den obersten ziehbaren Knoten, die Stage bleibt also stehen. Der vorhandene Stage-`onDragEnd` ignoriert fremde Ziele bereits.
- `onDragStart`: Die Form wird ausgewählt, ihre Startlage in absoluten Koordinaten und in cm wird gemerkt.
- `dragBoundFunc(pos)`: Der Versatz zur Startlage wird mit `1 / (zoom · pxPerCm)` in cm umgerechnet, je Achse mit `snapDelta` eingerastet und zurückgerechnet. Die Alt-Taste kommt aus einem Ref, den ein `pointermove`-/`keydown`-/`keyup`-Listener am `window` aktuell hält, denn `dragBoundFunc` erhält kein Event.
- `onDragEnd`: `moveBy` mit dem eingerasteten Versatz in cm, danach `updateShape`.
- Alternative: absolutes Raster (Mittelpunkt auf Vielfache von 5 cm). Vom Nutzer abgewählt, weil eingetippte Werte beim ersten Ziehen verloren gingen und das Raster an der Bildecke statt an einer Wand ausgerichtet ist.

### 5. Transformer: `SelectionTransformer`
- Ein `Transformer` im `ShapesLayer` hängt an der `Group` der ausgewählten Form. Er findet sie per `layer.findOne("#" + id)` nach jedem Render, in dem sich die Auswahl oder die Formenliste ändert.
- Einstellungen: `rotateEnabled`, `flipEnabled={false}`, `keepRatio={false}` (Umschalt hält dann nach Konva-Standard das Seitenverhältnis), `ignoreStroke` (Box = Geometrie ohne Rand), `rotationSnaps={[0, 90, 180, 270]}` mit `rotationSnapTolerance={5}` (Einrasten schon beim Drehen), alle acht Anfasser. Die Farben stammen aus dem Entwurf: `#2563EB`, Anfasser weiß, 7 px.
- `boundBoxFunc(old, next)`: Beim Dreh-Anfasser (`getActiveAnchor() === "rotater"`) wird `next` unverändert übernommen. Sonst gilt `snapResizeBox(startBox, next, …)`, und `startBox` wird in `onTransformStart` gemerkt. Die Schrittweite folgt der Alt-Taste wie beim Verschieben.
- `onTransformEnd`: Aus `scaleX/scaleY` des Knotens ergeben sich neue Breite und Tiefe (`widthCm · scaleX`), aus `x/y` die Lage, aus `rotation()` die Drehung. Danach wird die Skalierung **sofort am Knoten auf 1 zurückgesetzt** und erst dann `applyTransform` → `updateShape` aufgerufen. react-konva setzt unveränderte Props nicht neu. Ohne das Zurücksetzen bliebe die Skalierung doppelt stehen.
- Alternative: nur beim Loslassen einrasten. Verworfen, weil die Form dann beim Loslassen springt. Das Einrasten über `boundBoxFunc` zeigt die Endgröße schon während des Ziehens. Siehe Risiken für den Rückfall.

### 6. Klicks: Einfügen, Auswählen, Auswahl aufheben
- Ein Stage-`onClick` (nur linke Maustaste) unterscheidet die Fälle. Konva löst nach dem Ziehen der Stage oder einer Form kein `click` aus. Deshalb fügt ein Ziehen nichts ein und ändert die Auswahl nicht.
  - Kalibrier-Modus: Das bestehende Verhalten aus `floor-calibration` gilt (Punkt setzen).
  - `rect`/`ellipse`: Die Zeigerposition wird über `screenToImage` umgerechnet. Liegt sie außerhalb von `0…naturalWidth` bzw. `0…naturalHeight`, passiert nichts. Sonst wird über `pxToCm` umgerechnet und `insertShape(kind, pointCm)` aufgerufen.
  - `select`: Gehört `e.target` zu einer Form-`Group` (über `findAncestor(".shape")`), wird diese ausgewählt, sonst die Auswahl aufgehoben.
- Zeiger (nach der ersten Prüfung im Browser angepasst): Bei Form-Werkzeug über dem Grundriss ein Pfeil mit Plus, damit erkennbar ist, dass ein Klick einfügt; neben dem Grundriss bleibt `grab`, weil ein Klick dort nichts einfügt und Ziehen die Ansicht verschiebt. Über Formen bei „Auswählen“ ein Pfeilkreuz (per `onMouseEnter`/`onMouseLeave` am Stage-Container), sonst wie bisher `grab`. Beide Zeiger sind eigene SVGs als CSS-Variablen in `src/index.css` (`--cursor-insert-shape`, `--cursor-move-shape`) mit `copy`/`move` als Rückfall, weil Linux-Zeigerthemen `move` oft als Hand zeichnen. Ob der Zeiger über dem Grundriss steht, merkt sich `FloorCanvas` beim `mousemove` der Stage.

### 7. Neue Form: `src/lib/shape-factory.ts`
- `createShape(kind: "rect" | "ellipse", centerCm, id)`: rundet den Mittelpunkt auf ganze cm. Die Werte stammen aus der Spec „Standardwerte neuer Formen“ (Rechteck 100 × 60 cm ohne Radius, Ellipse 80 × 80 cm, Füllung `#E4E4E7`, Rand `#52525B`, Randstärke 1,5, Deckkraft 1, `rotationDeg: 0`, `mirrored: false`). Die ID wird übergeben, damit der Test ohne Zufall auskommt. Der Store übergibt `crypto.randomUUID()`.
- Der Test prüft zusätzlich, dass das Ergebnis das Zod-Schema aus `plan-model` besteht.

### 8. Store: `src/store/app-store.ts`
- Neue Felder, nur für die Sitzung und nicht im Plan: `activeTool: "select" | "rect" | "ellipse"` (Start `"select"`) und `selectedShapeId: string | null`.
- Aktionen:
  - `setActiveTool(tool)` ist wirkungslos für Form-Werkzeuge, wenn die aktive Etage keine Kalibrierung hat oder der Kalibrier-Modus aktiv ist.
  - `selectShape(id | null)`
  - `insertShape(kind, pointCm)` = `createShape` + `addShape` auf der aktiven Etage, dann die Form auswählen und `activeTool = "select"` setzen.
  - `deleteSelectedShape()` = `removeShape` + Auswahl aufheben.
  - Verschieben und Transformieren laufen direkt über `updateShape` aus `plan-model`.
- Etagenwechsel (`setActiveFloor`) und Start des Kalibrier-Modus (`toggleCalibration`) setzen `selectedShapeId = null` und `activeTool = "select"`. Ein immer gleiches Zurücksetzen ist einfacher als ein Sonderfall nur für nicht kalibrierte Etagen und erfüllt die Spec.
- Abgeleitet statt gespeichert: Die ausgewählte Form wird über ihre ID in `plan.shapesByFloor[activeFloorId]` gesucht. Ist sie nicht (mehr) vorhanden, gilt keine Form als ausgewählt.
- Wenn `updateShape` eine Änderung ablehnt (laut `plan-model` bleibt der Plan dann unverändert), springt die Form beim nächsten Render an ihre alte Lage zurück. Das ist bei den Werten aus `applyTransform` nicht zu erwarten, wäre aber sichtbar und harmlos.

### 9. Tastenkürzel: `src/hooks/useShapeShortcuts.ts`
- Ein eigener `keydown`-Listener nach dem Muster in `FloorCanvas`: ohne Strg/Meta/Alt, nicht in Eingabefeldern. `isEditableTarget` wandert dafür nach `src/hooks/isEditableTarget.ts` und wird von beiden Listenern genutzt.
- `v`/`r`/`e` (unabhängig von Groß-/Kleinschreibung) → `setActiveTool`. `Escape` setzt bei einem Form-Werkzeug zurück auf „Auswählen“, sonst hebt es die Auswahl auf. `Delete`/`Backspace` → `deleteSelectedShape` mit `preventDefault`, denn Backspace darf im Browser nichts anderes auslösen.
- Ein `keydown` auf `Alt` wird mit `preventDefault` abgefangen, damit Firefox beim Loslassen nicht die Menüleiste aktiviert.

### 10. Oberfläche
- **ToolBar:** Ein Verzeichnis `TOOLS = [{ id: "select", label: "Auswählen", key: "V", icon: MousePointer2 }, { id: "rect", label: "Rechteck – Schrank, Bett, Tisch", key: "R", icon: Square }, { id: "ellipse", label: "Ellipse – runder Tisch", key: "E", icon: Circle }]`, darunter ein Trenner (24 × 1 px) wie im Entwurf. Ein späterer Formtyp ergänzt nur einen Eintrag. Jeder Eintrag nutzt den vorhandenen `ToolButton`; aktiv: `aria-pressed` und `bg-selection-bg`/`text-selection` wie die Kalibrier-Schaltfläche. `ToolButton` bekommt dafür eine Eigenschaft für den gesperrten Zustand. Gesperrt: `aria-disabled="true"`, halbe Deckkraft, Klick wirkungslos, Tooltip „Rechteck – Etage zuerst kalibrieren“. Bewusst kein `disabled`-Attribut, weil Firefox an deaktivierten Schaltflächen keinen Tooltip zeigt.
- **PropertiesPanel:** Ohne Auswahl bleibt der bisherige Hinweis. Mit Auswahl zeigt `ShapeSummary` den Kopf mit Icon und Formtyp und rechts die Icon-Schaltfläche „Löschen“ (`Trash2`, `title="Löschen (Entf)"`). Darunter folgen die Abschnitte „Maße“ (Breite, Tiefe) und „Lage“ (X, Y, Drehung) als `<dl>` im Zwei-Spalten-Raster. Es gibt bewusst keine deaktivierten Eingabefelder, damit `shape-properties` den Inhalt der Abschnitte austauschen kann, ohne den Aufbau zu ändern.
- **Formatierung:** `formatCm(v)` → `"424,5 cm"` / `"100 cm"` (höchstens eine Nachkommastelle) und `formatDeg(v)` → `"90°"` in `src/lib/format.ts`.
- **Hinweis ohne Maßstab:** `FloorCanvas` zeigt außerhalb des Kalibrier-Modus mittig oben ein `role="status"`-Kästchen „Möbel dieser Etage werden erst angezeigt, wenn die Etage kalibriert ist.“, wenn die Etage keine Kalibrierung hat und Formen enthält.
- **CalibrationBanner:** Der Satz „Möbel sind ausgeblendet.“ wird angehängt, wie im Entwurf.
- `docs/design/README.md`, Bedienentscheidungen: Die Zeile „Formen ziehen“ wird um „relativ zur Startlage, gilt auch für Breite und Tiefe“ ergänzt. Neu kommen die Zeilen „Formen einfügen – nach dem Einfügen zurück zu ‚Auswählen‘, Standardmaße“ und „Nicht kalibrierte Etage – Form-Werkzeuge gesperrt“.

### Auswirkungen auf Datenmodell und `schemaVersion`
Keine. Dieser Change nutzt das Schema aus `plan-model` (schemaVersion 1) unverändert: `x`, `y`, `rotationDeg`, `widthCm`, `depthCm`, `cornerRadiusCm` und `style`. `activeTool` und `selectedShapeId` sind Sitzungszustand im Store und gelangen weder ins Autosave noch in Export-Dateien. Festgelegt wird nur die Bedeutung von `style.strokeWidth` als Randstärke in Bildschirmpixeln (Spec „Formen darstellen“). Das betrifft die Darstellung, nicht das Format. Lage und Maße können nach dem Ändern der Größe halbe cm enthalten (z. B. X 424,5 cm). Das Schema erlaubt das bereits.

## Risks / Trade-offs

- [`snapResizeBox` liefert bei gedrehten Formen und Eck-Anfassern falsche Boxen, z. B. wenn die stehende Ecke wandert] → Die Funktion ist rein und wird mit 0°, 30° und 90° Drehung und mit Kanten- wie Eck-Anfassern getestet. Im Browser bei 45° prüfen. Rückfall: Einrasten erst in `applyTransform` beim Loslassen, gegebenenfalls mit Sprung.
- [Konva setzt die Skalierung nach `transformend` nicht zurück, die Größe wirkt doppelt] → Skalierung in `onTransformEnd` vor der Store-Änderung explizit auf 1 setzen (Entscheidung 5). Im Browser zweimal hintereinander die Größe ändern.
- [Alt-Taste wird vom System abgefangen: Firefox-Menüleiste, ältere KDE-Versionen verschieben Fenster mit Alt+Ziehen] → `preventDefault` auf `keydown` Alt. Falls der Fenstermanager Alt+Ziehen nutzt, steht das in `docs/design/README.md` mit Hinweis auf die Systemeinstellung. Eine andere Taste wäre eine neue Bedienentscheidung und gehört nicht in diesen Change.
- [Löschen ohne Rückfrage und ohne Undo] → Bewusst in Kauf genommen. Undo kommt mit zundo. Bis dahin lässt sich eine Form schnell neu einfügen.
- [Ein Klick auf eine Form mit Form-Werkzeug fügt eine Form ein, statt auszuwählen] → So festgelegt (Spec). Mit `Esc` oder `V` kommt man sofort zurück zu „Auswählen“.
- [Viele Formen mit vielen Ellipsenpunkten bremsen das Zeichnen] → Bei einem Haus mit unter 200 Formen und höchstens einigen hundert Punkten je Form unkritisch. Bei Bedarf `listening={false}` an der `Line` und Trefferprüfung an der `Group`.
- [Die Umsetzung von `plan-model` weicht bei Namen oder Signaturen der Store-Aktionen von dessen design.md ab] → Aufgabe 1.1 prüft die Schnittstelle vor dem Start und gleicht diesen Change an.

## Migration Plan

Reihenfolge der Umsetzung: `floor-calibration` (umgesetzt) → `plan-model` → `basic-shapes`. Für die Prüfung im Browser muss mindestens eine Etage mit dem Kalibrier-Werkzeug kalibriert sein. Für den Fall „Formen ohne Maßstab“ lässt sich die Kalibrierung einer Etage in den Entwicklerwerkzeugen aus `raumplaner.plan` entfernen, denn die App bietet kein Löschen einer Kalibrierung. Es gibt keine Datenmigration. Zurücknehmen lässt sich der Change durch Zurücksetzen der Commits. Gespeicherte Pläne bleiben gültig, eingefügte Formen bleiben im Plan erhalten.
