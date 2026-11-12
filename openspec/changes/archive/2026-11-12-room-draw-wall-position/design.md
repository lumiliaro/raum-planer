# Design

## Context

Das Zeichnen eines Raums ist auf drei Stellen verteilt. Die reine Logik steckt in `src/lib/room-drawing.ts`. Dort entscheidet `resolveDraftPointer` über Ecke, Richtung und Hilfslinien. Der Entwurf liegt im Store (`roomDraft: { points, lengthText, hint } | null` in `src/store/app-store.ts`). Anzeige und Tasten übernimmt `src/components/canvas/RoomDraftLayer.tsx`. Der Klick wird in `FloorCanvas.tsx` mit derselben `resolveDraftPointer`-Auflösung verarbeitet. Vor dem ersten Eckpunkt ist `roomDraft` heute `null`. Die Tasten des Entwurfs greifen dann nicht, und Ziffern gehen an die Zoom-Tasten („0“ = Einpassen).

Wanddicken liegen je Kante in `room.wallThicknessCm`. Die Außennormale jeder Kante liefert `edgeOutwardNormals` aus `src/lib/room-snap.ts`, abgestimmt auf die Darstellung des Wandbands.

## Goals / Non-Goals

**Goals:**
- Eine reine, getestete Funktion beantwortet die Frage, wo auf welcher Wand der Startpunkt für einen Zeiger liegt.
- Klick, Vorschau und Enter nutzen dieselbe Auflösung, damit Anzeige und Ergebnis nie auseinanderlaufen.
- Bestehendes Verhalten ab dem zweiten Eckpunkt bleibt unverändert.

**Non-Goals:**
- Kein allgemeines Mess- oder Lineal-Werkzeug, keine Wandposition ab dem zweiten Eckpunkt (siehe proposal.md).
- Keine neue Darstellungsschicht. Die Anzeige bleibt im vorhandenen `RoomDraftLayer`.

## Decisions

### 1. Wandlinien als reine Daten in `room-drawing.ts`

Neue Funktionen in `src/lib/room-drawing.ts`:

- `wallLines(rooms): WallLine[]`: Für jede Kante mit Länge > 0 entstehen zwei Linien, `{ roomId, edgeIndex, face: "inner" | "outer", start, end, lengthCm }`. Die innere Linie ist die Kante selbst. Die äußere ist die Kante, um `wallThicknessCm[i]` entlang `edgeOutwardNormals` versetzt. `start` und `end` der äußeren Linie sind die versetzten Innenecken, nicht die Gehrungsecken des Wandbands. So misst die äußere Linie genau wie die Innenkante (siehe Spec: gemessen zwischen den Innenecken).
- `snapToWall(pointer, lines, { radiusCm, stepCm }): WallPosition | null`: Der Zeiger wird auf jede Linie projiziert (Parameter `t` in cm ab `start`). Kandidaten sind Linien mit `0 ≤ t ≤ lengthCm` und einem Querabstand ≤ `radiusCm`; es gewinnt der kleinste Querabstand, bei Gleichstand die frühere Linie. Das Bezugsende ist das nähere Ende (`t ≤ lengthCm / 2` → `start`, sonst `end`). Vom Bezugsende aus wird der Abstand auf `stepCm` gerundet und auf `[0, lengthCm]` begrenzt. Ergebnis: `{ line, fromEnd: "start" | "end", offsetCm, point }`, mit `point` auf 0,1 cm gerundet.
- `pointOnWall(line, fromEnd, offsetCm): PointCm` liefert den Punkt im Abstand vom Bezugsende. Snap und Enter nutzen beide diese Funktion.
- `wallDistances(position): { fromStartCm, fromEndCm }` liefert die beiden angezeigten Abstände.

Alternative: Die Wandlinien bei jedem Mausereignis im Layer berechnen. Verworfen: Das wäre nicht testbar und würde zwischen Klick und Vorschau dupliziert.

### 2. Vorrang in `resolveDraftPointer`

`DraftPointerOptions` bekommt `walls: readonly WallLine[] | null` (null = aus, also Strg oder Schalter aus) und `stepCm`. Ablauf bei `points.length === 0`: zuerst das Einrasten an Ecken wie bisher, dann `snapToWall`. Bei einem Treffer kommt der Punkt mit `wall: WallPosition` zurück, und die Hilfslinien bleiben aus. Sonst geht es wie bisher mit Hilfslinien weiter. `DraftPointer` erhält das optionale Feld `wall`. Ab dem zweiten Eckpunkt wird `walls` ignoriert.

`stepCm` kommt aus `snapStepCm(alt, settings)` in `src/lib/snap.ts`. Damit gelten die Fangschritte aus den Plan-Einstellungen (Werkseinstellung 5 cm bzw. 1 cm), genau wie beim Ziehen. Die Szenarien nutzen die Werkseinstellungen.

### 3. Entwurf vor dem ersten Eckpunkt im Store

`RoomDraft` wird um `wallAnchor: { roomId, edgeIndex, face, fromEnd } | null` erweitert. Die erste Ziffer an einer Wand erzeugt einen Entwurf `{ points: [], lengthText: "2", hint: null, wallAnchor }`. Neue Store-Aktionen:

- `startWallOffset(anchor, text)` legt diesen Entwurf an.
- `toggleWallOffsetEnd()` tauscht `fromEnd`.
- `commitWallOffset(line)` prüft den Wert mit `parseLengthCm` (0 ist erlaubt). Ist er größer als `lengthCm`, setzt die Aktion `hint: "wallTooLong"` (Text mit der Kantenlänge). Sonst setzt sie den Startpunkt über `pointOnWall`; der Entwurf heißt dann `{ points: [p], lengthText: "", hint: null, wallAnchor: null }`.
- Ein leeres Feld (Rücktaste) oder `Esc` setzt `roomDraft` auf `null`. Der zweite `Esc` wechselt damit wie heute zu „Auswählen“.

Die `WallLine` zu einem Anker wird beim Übernehmen aus dem aktuellen Plan neu berechnet (`wallLines` → `roomId` + `edgeIndex` + `face`). Während eines Entwurfs ist Rückgängig gesperrt, und ein Etagenwechsel verwirft den Entwurf; der Anker bleibt also gültig. Fehlt die Linie trotzdem, wird der Entwurf verworfen.

Alternative: Den Abstandstext nur als Komponentenzustand im Layer halten. Verworfen: Dann gälte „Entwurf läuft“ (Sperre von Rückgängig, Etagenwechsel, Esc-Logik) nicht, und der Text ginge beim Neuzeichnen des Layers verloren.

`parseLengthCm` lehnt heute 0 ab. Für den Abstand braucht es entweder eine Variante, die ≥ 0 zulässt, oder eine eigene Prüfung im Store. Vorgesehen ist ein kleiner Helfer `parseOffsetCm` in `src/lib/room-drawing.ts`, mit Test.

### 4. Tasten und Anzeige in `RoomDraftLayer`

- Der Zeigerzustand `useDraftPointer` bekommt `alt` (Mausereignis und Keydown/Keyup von Alt), damit die Vorschau auf Alt sofort reagiert.
- Der Tasten-Handler (Capture-Phase) behandelt zusätzlich den Fall, dass kein Entwurf existiert, „Raum“ aber aktiv ist: Wenn die aktuelle Vorschau eine Wandposition hat, öffnet eine Ziffer den Abstand. Ohne Wandposition kehrt der Handler zurück, und die Ziffer geht wie bisher an die Zoom-Tasten.
- Bei einem Entwurf mit `wallAnchor` gilt: Tab schaltet das Bezugsende um (`preventDefault`, damit der Fokus bleibt), Enter übernimmt, Rücktaste löscht ein Zeichen, Esc verwirft.
- Die Vorschau mit `wallAnchor` zeigt den Punkt aus `pointOnWall` mit dem getippten Abstand. Ein ungültiger oder zu großer Wert wird nicht angezeigt; bis zur ersten gültigen Zahl gilt der zuletzt eingerastete Punkt bzw. der Bezugspunkt.
- Gezeichnet werden ein Ring am Punkt, ein gefüllter Punkt am Bezugsende und zwei `ShapeLabel`-Abstände entlang der Linie. Drehung und Lesbarkeit übernimmt `readableRotationDeg`, das Weglassen `dimensionFits` mit `dimensionWidthPx` (aus `dimensions.ts` bzw. `dimension-measure.ts`). Die Abstände stehen leicht außerhalb der Linie, damit sie den Ring nicht überdecken.
- `RoomDraftField` zeigt bei `wallAnchor` „Abstand: 260 cm“ statt „260 cm“, dazu den neuen Hinweis.

### 5. Klick

`FloorCanvas` übergibt Wandlinien (gemerkt pro Raumliste) und `stepCm` (aus `e.evt.altKey`) an `resolveDraftPointer`. Ein Klick bei offenem Feld „Abstand“ verhält sich wie ein Klick bei offenem Längenfeld heute: Er setzt den Punkt unter dem Zeiger (mit Wandposition) und leert das Feld.

### Datenmodell und schemaVersion

Keine Auswirkungen. `RoomDraft` ist Sitzungszustand, nicht Teil des Plans, des Verlaufs oder des Exports. `schemaVersion` bleibt unverändert.

## Risks / Trade-offs

- [Zwei Wandlinien eng beieinander (dünne Wand, kleiner Zoom) oder gemeinsame Wand zweier Räume] → Es gewinnt der kleinste Querabstand. Die Anzeige zeigt eindeutig, welche Linie gewählt ist; Strg schaltet bei Bedarf ab.
- [Tab im Browser verschiebt den Fokus] → Nur bei offenem Feld „Abstand“ abfangen (`preventDefault`); sonst bleibt Tab unberührt.
- [Alt öffnet unter Windows/Firefox das Menü] → Wird beim Ziehen schon heute so genutzt; keydown für Alt wird nur beobachtet, nicht verhindert. Das ist kein neues Risiko.
- [Raster vom näheren Ende: Bei 502 cm Wandlänge liegen die Rasterpunkte je nach Hälfte anders] → Gewollt: Es zählt der Abstand, den der Nutzer an diesem Ende misst; die Anzeige nennt beide Abstände exakt.

## Migration Plan

Keine Migration nötig. Es ist eine reine Frontend-Änderung ohne Datenformatänderung; zurückrollen heißt Commit zurücknehmen.
