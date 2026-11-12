# Design

## Context

- Ausgangslage nach `basic-shapes` (vollständig geplant, noch nicht umgesetzt; Angaben aus dessen design.md):
  - `src/lib/outline.ts` mit `getOutlineCm` für `rect` und `ellipse`: Ellipse mit mindestens 32 Punkten (Vielfaches von 4), Rechteck-Ecken als Viertelbögen nach Sehnenhöhe ≤ 0,5 cm
  - `src/lib/shape-factory.ts` (`createShape` mit Standardwerten)
  - `src/lib/snap.ts` (Raster 5 cm / 1 cm mit Alt, relativ zur Startlage; `snapResizeBox` hält unbewegte Kanten exakt fest) und `src/lib/shape-transform.ts` (`applyTransform`: Rundung, Mindestgröße 1 cm, Eckradius)
  - Werkzeug-Tabelle `TOOLS` in `ToolBar`, Store-Feld `activeTool: "select" | "rect" | "ellipse"` und Auswahl, Tastenkürzel in `src/hooks/useShapeShortcuts.ts`
  - `ShapeNode` (zeichnet `fill: null` für alle Formtypen als transparente Füllung) und `SelectionTransformer` (Konva-Transformer)
- `shape-properties` existiert noch nicht als Change. Angenommen wird ein Eigenschaften-Formular mit Abschnitt „Maße“, dessen Felder je Formtyp ausgewählt werden.
- Das Schema aus `plan-model` (`src/lib/plan-schema.ts`) kennt `l-shape`, `u-shape`, `corner` und `door-swing` bereits samt Plausibilitätsregeln. Der Union-Eintrag existiert also schon.
- Design-Entwurf (`docs/design/README.md` → Artefakt „Raumplaner UI“):
  - Werkzeuge mit Tooltips und Tasten L, U, C, T
  - Icons für L-Form, U-Form, Ecke und Tür in der Stilvorlage
  - Ecksofa als L-Form mit Schenkeln oben und links (im Plan über Drehung bzw. Spiegeln erreichbar; die Grundlage folgt den Icons, siehe Entscheidung 2)
  - Tür mit Angel unten links und gestricheltem Aufschlag
  - Abschnitt „Maße“ mit „Schenkel A“ und „Schenkel B“
- Bedienentscheidung im Leitfaden: „Beim Skalieren bleiben die Schenkelbreiten gleich.“
- Anforderungen: siehe `specs/shape-outline`, `specs/shape-editing`, `specs/shape-properties`.
- **Abgleich mit der Umsetzung (Aufgabe 1.1)**: `basic-shapes` und `shape-properties` sind umgesetzt und archiviert. Die Annahmen oben stimmen mit diesen Abweichungen:
  - `TOOLS` liegt in `src/components/layout/tools.ts`, `useShapeShortcuts` liest die Tasten bereits daraus. Das aktive Werkzeug ist `"select" | InsertableKind` (`shape-factory.ts`); erweitert wird `InsertableKind`.
  - `applyTransform` ist auf Formen mit Breite und Tiefe beschränkt (`SizedShape`) und rastet die Drehung nur beim Drehen ein (`shape-properties`).
  - `shape-properties` hat `SHAPE_KIND_LABELS` (alle sieben Namen), `getLabelAnchorCm` (vorerst Mittelpunkt für alle Formtypen) und `DimensionsSection` (`switch` über `kind`) angelegt. Die Beschriftung wird bereits über `getLabelAnchorCm` gezeichnet. Die Icons im Kopf des Panels stehen in `KIND_ICONS` in `ShapeProperties`.
  - Einlesen und Prüfen der Feldwerte samt Hinweistext macht `applyNumberField` in `src/lib/shape-fields.ts`: Eingabe → Patch oder Hinweis. Siehe Entscheidung 7.
  - Der Tooltip auf einer nicht kalibrierten Etage lautet „<Name> – Etage zuerst kalibrieren“, für die neuen Werkzeuge also z. B. „Tür – Etage zuerst kalibrieren“.
  - Konva zeichnet Ränder mit `strokeScaleEnabled = false` in Bildschirmpixeln, einschließlich des Strichmusters. Siehe Entscheidung 5.

## Goals / Non-Goals

**Goals:**
- Jeder neue Formtyp berührt nur klar benannte Stellen, jeweils ein `case` oder ein Tabelleneintrag (siehe Entscheidung 1). TypeScript meldet eine vergessene Stelle.
- Alle Geometrie-Regeln (Umriss, Größenregeln, Angel festhalten) sind reine Funktionen in `src/lib/` und mit Vitest getestet. React/Konva rechnen nichts selbst.

**Non-Goals:**
- Keine allgemeine Plugin-Architektur und kein Registrierungsmechanismus zur Laufzeit; einfache `switch`/`Record`-Einträge genügen.
- Keine Änderung an Verhalten oder Darstellung von Rechteck und Ellipse.

## Decisions

### 1. Wo ein Formtyp eingetragen wird

| Stelle | Datei | Art des Eintrags |
| --- | --- | --- |
| Union und Plausibilität | `src/lib/plan-schema.ts` | bereits vorhanden (`plan-model`) |
| Umriss | `src/lib/outline.ts` | `case` in `getOutlineCm` |
| Lage der Beschriftung | `src/lib/outline.ts` | `case` in `getLabelAnchorCm` |
| Standardmaße und Stil | `src/lib/shape-factory.ts` | Eintrag in der Tabelle der Standardwerte |
| Größenregel | `src/lib/shape-resize.ts` | `case` in `getSizeCm` / `getMinSizeCm` / `applySizeCm` |
| Werkzeug | Tabelle `TOOLS` in `src/components/layout/tools.ts` | Eintrag (Formtyp, Name, Tooltip, Taste, Icon) |
| Formtyp-Name | `SHAPE_KIND_LABELS` in `src/lib/shape-kinds.ts` | bereits vorhanden (`shape-properties`) |
| Maß-Felder | `DimensionsSection` aus `shape-properties`, Prüfung in `applyNumberField` | `case` mit einer Komponente je Formtyp |

- Alle `switch` über `kind` enden mit einer `never`-Prüfung, die Tabellen sind `Record<…>`-typisiert. So meldet `npm run build` jede vergessene Stelle.
- Die Projektvorgabe „Union-Eintrag, `getOutlineCm`, Formular“ bleibt der Kern. Werkzeug, Standardwerte, Größenregel und Beschriftungslage kommen als je ein deklarativer Eintrag bzw. kleiner `case` dazu. Ohne sie ließe sich eine Form weder einfügen noch sinnvoll skalieren.
- `basic-shapes` legt die Werkzeuge bereits als Tabelle `TOOLS` an; dieser Change ergänzt dort vier Einträge. `useShapeShortcuts` wird darauf umgestellt, die Tasten aus derselben Tabelle zu lesen. Werkzeug-IDs sind die `kind`-Werte, das aktive Werkzeug wird von `"select" | "rect" | "ellipse"` auf `"select" | ShapeKind` erweitert (ohne `polygon`, bis dessen Change kommt).
- Alternative „ein Objekt je Formtyp mit allem (Umriss, Formular, Icon)“: verworfen, weil es React-Komponenten mit der reinen Logik in `src/lib/` vermischen würde.

### 2. Koordinaten und Grundlage der Umrisse

- Lokale Koordinaten in cm, Ursprung im Mittelpunkt, x nach rechts, y nach unten (wie Bildpixel), Breite W, Tiefe D.
- Grundlagen, passend zu den Werkzeug-Icons der Stilvorlage (so sieht eine neu eingefügte Form aus wie ihr Icon):
  - L-Form: Ecke unten links, Schenkel A unten, Schenkel B links
  - U-Form: offen nach oben
  - Ecke: rechter Winkel unten links
  - Tür: Angel unten links, Wand entlang der unteren Kante
- Alternative „L-Form und Ecke oben links wie das Ecksofa im Hauptentwurf“: zuerst so umgesetzt, im Browser verworfen, weil die eingefügte Form dann nicht wie ihr Icon aussieht. Jede andere Lage erreicht man über Spiegeln und Drehen.
- Punktfolgen siehe `specs/shape-outline`. L-Form: 6 Punkte, U-Form: 8 Punkte.

### 3. Bögen (Ecke, Tür)

- Neue Hilfsfunktion `sampleEllipseArc(cx, cy, rx, ry, fromDeg, toDeg)` in `outline.ts`. Sie liefert gleichmäßig über den Parameterwinkel verteilte Punkte einschließlich Anfang und Ende.
- Die Anzahl der Teilstücke ergibt sich aus der Toleranz 0,5 cm: `n = max(6, ceil(Δθ / (2 · acos(1 − 0,5 / max(rx, ry)))))`. Da eine Ellipse ein gestreckter Kreis ist, weicht keine Sehne weiter als `max(rx, ry) · (1 − cos(Δθ/2n))` ab. Für eine Ecke von 90 × 90 cm sind das 8 Teilstücke, für 300 cm Radius 14.
- `basic-shapes` tastet die volle Ellipse und die Rechteck-Ecken jeweils eigens ab. `sampleEllipseArc` ist neu für Ecke und Tür. Die Abtastung von Rechteck und Ellipse bleibt unverändert (Non-Goal), damit sich deren Umrisse nicht ändern.
- Alternative „feste 64 Teilstücke“: unnötig viele Punkte bei kleinen Formen, ohne prüfbare Genauigkeitsgrenze.

### 4. Spiegeln im Umriss

- `getOutlineCm` berechnet zuerst die Grundlage und spiegelt am Ende für **alle** Formtypen x → −x, wenn `mirrored` gesetzt ist. Die Reihenfolge der Punkte bleibt gleich. Die Tür verlässt sich darauf: Punkt 0 ist immer die Angel, Punkt 1 das Türblattende.
- Rechteck und Ellipse sind symmetrisch; für sie ändert sich nichts Sichtbares. `basic-shapes` wendet dieselbe Regel (gleiche Reihenfolge) an.
- Alternative „Spiegeln über `scaleX = −1` am Konva-Knoten“: verworfen. Die Beschriftung würde spiegelverkehrt, der Transformer bekäme negative Skalierung, und Tests über `getOutlineCm` würden die Spiegelung nicht sehen.
- `getLabelAnchorCm` spiegelt auf dieselbe Weise.

### 5. Darstellung in `ShapeNode`

- L-Form, U-Form und Ecke: eine geschlossene `Line` mit den Umrisspunkten (in px über `pxPerCm`), Stil wie beim Rechteck.
- Tür, aus derselben Punktliste:
  1. geschlossene `Line` als Fläche: Füllung aus `style.fill`, kein Rand – dient auch als Klickfläche
  2. offene `Line` aus Punkt 0–1 als Türblatt, durchgezogen
  3. offene `Line` ab Punkt 1 als Aufschlag, gestrichelt

  Die Kante von der Angel zum Bogenende (Wandöffnung) wird nie gezeichnet. Das Strichmuster ist 6/4 px auf dem Bildschirm. Wie `strokeWidth` ist es nicht zoomabhängig: Konva zeichnet Ränder mit `strokeScaleEnabled = false` ohne Skalierung, das Muster gilt also direkt in Bildschirmpixeln und wird nicht umgerechnet.
- **Klickfläche ohne Füllung**: Konva trifft eine Form innen nur, wenn sie gefüllt ist. `ShapeNode` aus `basic-shapes` zeichnet `fill: null` deshalb schon für alle Formtypen als vollständig transparente Füllung (`rgba(0,0,0,0)`). Für die neuen Formtypen gilt das ohne eigenen Code, bei der Tür an der Fläche aus Schritt 1. Sichtbar ändert sich nichts, aber der ganze Umriss ist anklickbar. Aussparungen (L-, U-Form) bleiben nicht anklickbar, weil die Trefferfläche dem Umriss folgt und nicht dem umschließenden Rechteck.
- **Beschriftungslage** über `getLabelAnchorCm` (von `shape-properties` angelegt und beim Zeichnen bereits verwendet; dieser Change ergänzt die `case`s):
  - L-Form: Mitte von Schenkel A, `(0, D/2 − a/2)`
  - U-Form: Mitte der Basis, `(0, D/2 − c/2)`
  - Ecke: Schwerpunkt der Viertelellipse, `(−W/2 + 0,424·W, D/2 − 0,424·D)` mit 4/(3π) ≈ 0,424
  - Tür: entsprechend ab der Angel, `(−W/2 + 0,424·W, W/2 − 0,424·W)`

  Rechteck und Ellipse: Mittelpunkt. Ohne diese Funktion stünde die Beschriftung einer L-Form im Mittelpunkt, also in der leeren Aussparung.

### 6. Größe ändern (`src/lib/shape-resize.ts`)

- `getSizeCm(shape)` → `{ widthCm, depthCm }`; Tür: `{ W, W }`.
- `getMinSizeCm(shape)` → kleinste Größe über die Anfasser (einschließlich), damit die Form erkennbar bleibt: jede Aussparung mindestens so groß wie der angrenzende Schenkel.
  - L-Form: Breite ≥ 2 · B, Tiefe ≥ 2 · A
  - U-Form: Breite ≥ 3 · Seite, Tiefe ≥ 2 · Basis
  - sonst 0 (es gilt die allgemeine Mindestgröße von 1 cm)

  Zuerst galten hier die Grenzen des Schemas (L-Form Breite > B usw.). Im Browser verworfen: Beim Kleinziehen blieb von der Aussparung nur eine Kerbe von wenigen cm, die Form sah nicht mehr wie ein L oder U aus. Das Formular erlaubt weiter alle Werte, die das Schema annimmt (`getDimensionLimits`).
- `applySizeCm(shape, size)` → Patch je Formtyp:
  - L-/U-Form: nur `widthCm`/`depthCm`, Schenkel bleiben
  - Ecke: wie Rechteck
  - Tür: `widthCm = size.widthCm`
- `clampToGrid(start, requested, min, step)` → `requested`, wenn es mindestens `min` ist, sonst der kleinste Rasterwert `start ± k·step`, der mindestens `min` ist. Liegt `start` selbst schon unter `min`, bleibt es bei `start`: Die Form wird beim Anfassen nicht größer. Beispiele: Start 280 cm, Mindestgröße 180 cm, Schritt 5 cm → 180 cm; Start 283 cm → 183 cm; Start 150 cm → 150 cm.
- `resizeKeepingAnchor(shape, size, anchorLocal)` → neuer Mittelpunkt, sodass ein lokaler Punkt (vor der Änderung) nach der Änderung an derselben Stelle auf dem Grundriss liegt. Berücksichtigt Spiegelung und Drehung, Drehsinn wie Konva: im Uhrzeigersinn bei y nach unten. Verwendet für das Feld „Breite“ der Tür: Ankerpunkt ist die Angel `(∓W/2, W/2)`. Beim Transformer hält `snapResizeBox` aus `basic-shapes` die gegenüberliegende Seite bzw. Ecke bereits fest.
- **Transformer** (`SelectionTransformer`):
  - Mindestgröße beim Ziehen: Je Achse ergibt `clampToGrid` aus Startgröße, `getMinSizeCm` und Rasterschritt die kleinste erlaubte Größe auf dem Raster (L-Form 280 cm, Schenkel B 90 cm → 180 cm). `snapResizeBox` bekommt sie als Mindestbreite und -höhe je Achse (bisher ein gemeinsamer Wert von 1 cm) und hält die Form dort an, auch wenn der Zeiger in einem Schritt weit darüber hinaus springt. Den alten Rahmen zurückzugeben, würde die Form bei schnellen Bewegungen zu früh stehen lassen.
  - Beim Loslassen ruft `applyTransform` für die Maße `applySizeCm` auf, statt `widthCm`/`depthCm` direkt zu setzen. `applyTransform` gilt damit für alle Formtypen mit Umriss, nicht mehr nur für `SizedShape`.
  - Tür: `enabledAnchors` nur die vier Ecken, `keepRatio: true`, `shiftBehavior: "none"`. Die Umschalttaste soll das Quadrat nicht aufheben können. Weil `snapResizeBox` die Kanten je Achse einzeln einrastet, sorgt eine Variante `snapSquareResizeBox` in `snap.ts` dafür, dass der Rahmen quadratisch bleibt: Die Breite wird eingerastet, die bewegte Kante der Tiefe folgt, die gegenüberliegende Ecke bleibt stehen.
- Alternative „Schenkel proportional mitskalieren“: widerspricht der Bedienentscheidung im Leitfaden. Diese Variante kommt erst als Einstellung.

### 7. Formular

- Je Formtyp eine kleine Komponente, z. B. `LShapeDimensions`, mit den Zahlenfeldern aus `shape-properties`. Die Komponente legt nur fest, welche Felder es gibt und welche Grenze sie nennen.
- Grenzen kommen aus einer reinen Funktion `getDimensionLimits(shape, field)` → `{ minExclusive?, maxExclusive? }` in `shape-resize.ts`. Beispiele: L-Form „Schenkel A“ → `maxExclusive = D`; „Breite“ → `minExclusive = B`; U-Form „Seiten“ → `maxExclusive = W/2`.
- `applyNumberField` aus `shape-properties` (`src/lib/shape-fields.ts`) bekommt die Felder `legAWidthCm`, `legBWidthCm`, `baseWidthCm` und `sideWidthCm` und prüft Breite, Tiefe und diese Felder über `getDimensionLimits`. Es liefert wie bisher einen Patch oder den Hinweis („Muss kleiner als 200 cm sein“, „Muss größer als 90 cm sein“). Die Komponenten im Abschnitt „Maße“ rufen es wie bei Rechteck und Ellipse auf.
- Die endgültige Prüfung bleibt `updateShape` mit dem Zod-Schema. Die Grenzen müssen zum Schema passen; ein Test prüft das für jede Grenze.
- Tür: Für das Feld „Breite“ liefert `applyNumberField` über `resizeKeepingAnchor` (Angel als Anker) einen Patch mit Breite und Mittelpunkt (auf 0,1 cm gerundet). Er geht in **einem** `updateSelectedShape`-Aufruf an den Store, als eine Änderung.

### 8. Icons

- `src/components/icons/shape-icons.tsx`: `LShapeIcon`, `UShapeIcon`, `CornerIcon`, `DoorIcon` als kleine SVG-Komponenten mit den Pfaden aus der Stilvorlage. Sie haben dieselben Props und dieselbe Strichstärke wie die `lucide-react`-Icons der Werkzeugleiste. Verwendet werden sie in `TOOLS` und in `KIND_ICONS` im Kopf des Eigenschaften-Panels.
- Keine neue Abhängigkeit.

### 9. Datenmodell und `schemaVersion`

- **Keine Änderung am Datenformat, `schemaVersion` bleibt 1.** Es kommen keine Felder hinzu, und es ändern sich keine Grenzen.
- Neu verbindlich wird die **Bedeutung** vorhandener Felder:
  - L-Form: Schenkel A unten, B links
  - U-Form: offen nach oben
  - Ecke: rechter Winkel unten links
  - Tür: Angel unten links
  - `mirrored` spiegelt den Umriss

  Eine spätere Änderung daran würde gespeicherte Formen anders darstellen. Sie verlangt deshalb `schemaVersion` 2 mit einer Migration, die die Formen über Drehung bzw. `mirrored` umrechnet.
- Neue Formen nutzen beim Einfügen `crypto.randomUUID()` und `addShape` wie bisher.

## Risks / Trade-offs

- [Annahmen über `shape-properties` stimmen nicht (Formular-Aufbau, Capability-Name), oder die Umsetzung von `basic-shapes` weicht von dessen design.md ab] → Aufgabe 1.1 prüft die Annahmen vor dem Start und passt Dateinamen und Aufgaben an. Die Anforderungen bleiben gleich. Der Capability-Name `shape-properties` wird an den echten angeglichen.
- [Konva-Transformer mit `keepRatio` und Raster ruckelt bei der Tür] → Nur die Breite wird gerastert, die Tiefe folgt; beim Loslassen wird ein exaktes Quadrat geschrieben.
- [Taste C für „Ecke“ ist nicht naheliegend (E ist schon „Ellipse“)] → so im Design-Entwurf vorgegeben, im Tooltip sichtbar.
- [Beschriftungslage hängt von `shape-properties` ab] → `getLabelAnchorCm` ist eine reine Funktion. Zeichnet `shape-properties` die Beschriftung noch nicht, bleibt sie vorerst ungenutzt, ist aber getestet.

## Migration Plan

- Reihenfolge: nach `basic-shapes` und `shape-properties`. `shape-properties` muss vorher archiviert sein, damit die Delta-Spec `shape-properties` dieses Changes auf eine vorhandene Haupt-Spec trifft.
- Keine Datenmigration: Vorhandene Pläne enthalten keine Formen dieser Typen, weil es bisher kein Werkzeug dafür gab.
- Rückbau: Change zurücknehmen. Bereits eingefügte L-/U-Formen, Ecken und Türen bleiben gültig gespeichert, werden dann aber wie nicht unterstützte Formtypen behandelt (so, wie es `basic-shapes` für Typen ohne Umriss festlegt).

