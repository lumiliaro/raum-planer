# Proposal

## Why

Nach `floor-calibration` (Maßstab je Etage) und `plan-model` (Plan, Formen, Speichern) gibt es ein Datenmodell für Möbel, aber noch keine Möglichkeit, eines auf den Grundriss zu stellen. Dieser Change macht die App zum ersten Mal nutzbar: Rechteck und Ellipse – die häufigsten Möbelformen (Schrank, Bett, Tisch, runder Tisch) – lassen sich einfügen, auswählen, verschieben, drehen, in der Größe ändern und löschen.

## What Changes

- **Werkzeugleiste** (aus `floor-calibration`) erhält oben die Werkzeuge „Auswählen“ (V), „Rechteck“ (R) und „Ellipse“ (E) mit deutschen Tooltips samt Tastenkürzel. Das aktive Werkzeug ist markiert; Standard ist „Auswählen“.
- **Einfügen per Klick**: Mit Rechteck oder Ellipse fügt ein Klick auf den Grundriss eine Form ein, deren Mittelpunkt an der Klickstelle liegt (Rechteck 100 × 60 cm, Ellipse 80 × 80 cm, hellgrau mit dunklem Rand). Danach ist die neue Form ausgewählt und das Werkzeug springt auf „Auswählen“ zurück. Esc bricht ein gewähltes Werkzeug ab.
- **Darstellung**: Die Formen der aktiven Etage werden in ihrer Zeichenreihenfolge über dem Grundriss gezeichnet, in cm gespeichert und über `pxPerCm` der Etage umgerechnet. Der Umriss kommt aus der reinen Funktion `getOutlineCm` (Rechteck mit Eckradius, Ellipse).
- **Auswählen**: Klick auf eine Form wählt sie aus (blauer Rahmen mit Anfassern), Klick auf eine freie Stelle oder Esc hebt die Auswahl auf. Etagenwechsel hebt die Auswahl auf.
- **Verschieben** durch Ziehen einer Form: Die Bewegung rastet relativ zur Startposition in 5-cm-Schritten ein, mit gedrückter Alt-Taste in 1-cm-Schritten. Ziehen auf einer freien Stelle verschiebt wie bisher die Ansicht.
- **Drehen und Größe ändern** über die Anfasser (Konva-Transformer): Breite und Tiefe ändern sich ebenfalls in 5-cm- bzw. 1-cm-Schritten (Alt), die gegenüberliegende Seite bleibt stehen. Die Drehung rastet bei 0°, 90°, 180° und 270° ein und wird sonst auf ganze Grad gerundet.
- **Löschen** der ausgewählten Form mit Entf oder Rücktaste und über „Löschen“ im Eigenschaften-Panel.
- **Eigenschaften-Panel**: Bei ausgewählter Form zeigt es statt „Wähle eine Form aus“ den Formtyp, die Schaltfläche „Löschen“ und eine schreibgeschützte Übersicht: Breite, Tiefe, X, Y, Drehung. Die Werte aktualisieren sich nach jedem Verschieben, Drehen und Ändern der Größe.
- **Nicht kalibrierte Etage**: Rechteck und Ellipse sind gesperrt (Tooltip „Etage zuerst kalibrieren“). Formen einer solchen Etage werden nicht gezeichnet, und ein Hinweis erklärt, warum.
- **Kalibrier-Modus**: Formen sind ausgeblendet, die Auswahl wird aufgehoben, die Form-Werkzeuge sind gesperrt. Die Hinweisleiste ergänzt „Möbel sind ausgeblendet.“

## Nicht im Umfang

- **Bearbeitbare Eigenschaften**: Felder für Maße, Lage, Beschriftung und Farben folgen im nächsten Change `shape-properties`. Hier zeigt das Panel die Werte nur an.
- **Beschriftung auf der Zeichenfläche**: kommt mit `shape-properties`, weil sich die Beschriftung erst dort eingeben lässt.
- Weitere Formtypen (L-Form, U-Form, Ecke, Tür, Polygon) und ihre Werkzeuge.
- Sperren, Spiegeln, Nach vorne/hinten, Liste „Formen“ im Panel, Kopieren/Duplizieren, Mehrfachauswahl.
- Verschieben mit Pfeiltasten, Maßketten an der ausgewählten Form, Zeigerposition in der Statusleiste, sichtbares Raster.
- Werkzeug „Ansicht verschieben“ (Leertaste): Ziehen auf einer freien Stelle verschiebt die Ansicht bereits.
- Rückgängig/Wiederholen (zundo). Löschen geschieht deshalb ohne Rückfrage, lässt sich aber noch nicht rückgängig machen.
- Änderungen am Datenformat: Es gilt das Schema aus `plan-model` (schemaVersion 1).

## Capabilities

### New Capabilities
- `shape-editing`: Werkzeuge, Einfügen, Darstellen, Auswählen, Verschieben mit Raster, Drehen, Größe ändern und Löschen von Formen auf der Zeichenfläche, samt Verhalten auf nicht kalibrierten Etagen und im Kalibrier-Modus.
- `shape-outline`: Umriss einer Form als Punktliste in cm relativ zu ihrem Mittelpunkt, hier für Rechteck (mit Eckradius) und Ellipse. Spätere Formtypen ergänzen hier ihren Umriss.

### Modified Capabilities
- `workspace-layout`: „Eigenschaften-Panel mit Leerzustand“ zeigt bei ausgewählter Form den Formtyp, „Löschen“ und eine Übersicht der Maße und der Lage.
- `floor-plan-view`: „Ansicht verschieben“ gilt nur noch beim Ziehen auf einer freien Stelle. Ziehen einer Form verschiebt die Form.

## Impact

- **Voraussetzungen**: `floor-calibration` (Werkzeugleiste, Kalibrier-Modus, Hinweisleiste) ist umgesetzt. `plan-model` (Schema, Plan-Funktionen, Store-Aktionen, `plan.activeFloorId`, Kalibrierung in `plan.calibrationByFloor`) muss vorher umgesetzt sein. Für die Prüfung im Browser muss mindestens eine Etage mit dem Kalibrier-Werkzeug kalibriert sein.
- Neu in `src/lib/` (jeweils mit Vitest-Test): `units.ts` (cm ↔ Bildpixel), `outline.ts` (`getOutlineCm`), `snap.ts` (Raster für Verschieben, Größe, Drehung), `shape-transform.ts` (Ergebnis von Verschieben/Transformieren als gültige Form), `shape-factory.ts` (neue Form mit Standardwerten). Erweitert: `format.ts` (cm und Grad).
- Neue Komponenten und Hooks: `ShapesLayer`, `ShapeNode`, `SelectionTransformer`, `ShapeSummary`, `useShapeShortcuts`.
- Geändert: `src/store/app-store.ts` (aktives Werkzeug, Auswahl, Aktionen), `ToolBar`, `FloorCanvas` (Klick zum Einfügen, Formen-Ebene, Hinweis ohne Maßstab), `PropertiesPanel`, `CalibrationBanner`, `src/store/app-store.test.ts`, `docs/design/README.md` (Bedienentscheidungen).
- Abhängigkeiten: keine neuen (Konva-Transformer aus `konva`, Icons aus `lucide-react`).
- Datenmodell und `schemaVersion`: unverändert. Aktives Werkzeug und Auswahl gelten nur für die Sitzung und gehören nicht zum Plan.
