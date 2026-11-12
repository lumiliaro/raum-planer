# Proposal

## Why

Nach `basic-shapes` lassen sich Formen nur mit der Maus platzieren und in 5-cm-Schritten anpassen; das Eigenschaften-Panel zeigt die Werte nur an. Für eine Einzugsplanung braucht man aber exakte Maße aus dem Möbelkatalog („Sofa 238 × 96 cm“), Namen auf den Möbeln und Farben, um Räume oder Zustände (bleibt / kommt neu) zu unterscheiden. Dieser Change macht das Panel zum Formular und ist Voraussetzung für `more-shapes` (Maß-Felder je Formtyp) und `editing-extras` (Sperren, Rückgängig).

## What Changes

- **Eigenschaften-Formular** ersetzt die schreibgeschützte Übersicht im Panel, Aufbau wie im Design-Entwurf:
  - Kopf mit Icon, Formtyp und „Löschen“, darunter das Feld „Beschriftung“
  - **Maße**: „Breite“ und „Tiefe“ in cm für Rechteck und Ellipse, beim Rechteck zusätzlich „Eckradius“ (z. B. für Sofa oder Wanne; höchstens die halbe kürzere Seite). Der Mittelpunkt bleibt beim Ändern stehen. Der Abschnitt ist je Formtyp aufgebaut, damit `more-shapes` eigene Felder einhängen kann.
  - **Lage**: „X“, „Y“ in cm, „Drehung“ in Grad und der Schalter „Spiegeln – Horizontal“
  - **Darstellung**: die 8 Möbel-Voreinstellungen aus der Stilvorlage (Grau, Blau, Violett, Gelb, Türkis, Orange, Grün, Nur Rand), die je Füllung und Rand zusammen setzen. Dazu kommen Füllfarbe mit „Nur Rand“, Randfarbe mit Randstärke in px und Deckkraft in %. Die Farbfelder öffnen die Farbauswahl des Browsers.
- **Übernahme von Eingaben**: Ein Feld wird mit Enter oder beim Verlassen übernommen, mit Esc auf den aktuellen Wert zurückgesetzt. Erlaubt sind Komma und Punkt. Ungültige Werte werden abgelehnt: Die Form bleibt unverändert, und am Feld steht ein Hinweis mit der Grenze, z. B. „Muss größer als 0 cm sein“.
- **Beschriftung auf der Zeichenfläche**: Der Text steht mittig in der Form, immer waagerecht und in fester Bildschirmgröße, unabhängig von Zoom und Drehung. Er hat die Randfarbe der Form. Eine leere Beschriftung entfernt den Text.
- **Formtyp-Namen** aus einer gemeinsamen Tabelle für alle sieben Formtypen. Panel, später `more-shapes` und `export-import` nutzen sie.
- **Korrektur aus `basic-shapes`**: Beim Ändern der Größe über die Anfasser bleibt eine getippte Drehung (z. B. 93°) erhalten. Bisher wurde sie dabei auf 90° eingerastet. Einrasten gilt nur noch, wenn tatsächlich gedreht wurde.
- **Tastenkürzel bei Bedienelementen**: Hat ein Kontrollkästchen, ein Schieberegler oder eine Schaltfläche im Panel den Fokus, wirken Entf/Rücktaste, V/R/E und Esc weiter. Nur Textfelder sperren die Kürzel.

## Nicht im Umfang

- Maß-Felder für L-Form, U-Form, Ecke und Tür sowie die Lage der Beschriftung in diesen Formen. Beides kommt mit `more-shapes`. Hier steht die Beschriftung im Mittelpunkt, über eine Funktion, die `more-shapes` je Formtyp ergänzt.
- Sperren, Nach vorne/hinten, Rückgängig/Wiederholen: kommen mit `editing-extras`. Das Formular bietet dafür nur die Möglichkeit, Felder schreibgeschützt zu schalten.
- Reiter „Formen“ im Panel, Mehrfachauswahl, Kopieren.
- Eigene Farbpaletten, zuletzt benutzte Farben, Schriftgröße oder -farbe der Beschriftung, Ein-/Ausblenden aller Beschriftungen. Letzteres kommt mit `settings-menu`.
- Maßketten und Live-Werte während des Ziehens.
- Änderungen am Datenformat: Alle Felder gibt es seit `plan-model` (`label`, `mirrored`, `style`). `schemaVersion` bleibt 1.

## Capabilities

### New Capabilities
- `shape-properties`: das Eigenschaften-Formular einer ausgewählten Form: Aufbau, Übernahme und Prüfung von Eingaben, Maße samt Eckradius, Lage samt Spiegeln, Darstellung mit Voreinstellungen, Beschriftung samt Anzeige auf der Zeichenfläche, Formtyp-Namen.

### Modified Capabilities
- `workspace-layout`: „Eigenschaften-Panel mit Leerzustand“ zeigt bei ausgewählter Form das Formular statt der schreibgeschützten Übersicht.
- `shape-editing`: neue Anforderung „Drehung beim Ändern der Größe“ – Ändern der Größe über die Anfasser lässt die Drehung unverändert; nur der Dreh-Anfasser rastet ein.

## Impact

- **Voraussetzung**: `basic-shapes` (umgesetzt und archiviert).
- **Nachfolger**:
  - `more-shapes` hängt seine Maß-Felder in den Abschnitt „Maße“ ein. Statt die Funktion `getLabelAnchorCm` neu anzulegen, ergänzt es sie nur noch. Den Eintrag in der Namenstabelle braucht es nicht mehr.
  - `editing-extras` nutzt die schreibgeschützten Felder für gesperrte Formen.
- Neu in `src/lib/` (jeweils mit Vitest-Test):
  - `shape-fields.ts`: Zahlen einlesen, Feldwerte prüfen, daraus eine Änderung an der Form bilden
  - `shape-kinds.ts`: Formtyp-Namen
  - `style-presets.ts`: die 8 Voreinstellungen
- Erweitert (mit Test):
  - `src/lib/outline.ts` um `getLabelAnchorCm`
  - `src/lib/shape-transform.ts`: Drehung nur einrasten, wenn sie sich geändert hat
  - `src/hooks/isEditableTarget.ts`: nur Texteingaben sperren Kürzel
- Neue Komponenten: `ShapeProperties` (ersetzt `ShapeSummary`), `NumberField`, `TextField`, `DimensionsSection`, `PositionSection`, `StyleSection`, `ShapeLabel` (Konva).
- Geändert: `PropertiesPanel`, `ShapeNode` (Beschriftung), `docs/design/README.md` (Bedienentscheidungen).
- Abhängigkeiten: keine neuen. Die Farbauswahl ist `<input type="color">` des Browsers.
