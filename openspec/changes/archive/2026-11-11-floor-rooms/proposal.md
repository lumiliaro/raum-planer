# Proposal

## Why

Der eingescannte Grundriss ist schief und voller Bemaßungen, Höhenangaben und Möbeln des Architekten, die beim Planen stören. Seit `floor-underlay` liegt er nur noch als ausblendbare Vorlage unter einer Zeichenfläche in cm. Was fehlt, ist der eigentliche Grundriss: die Räume mit ihren exakten Innenmaßen. Für die Möbelplanung zählen nur die Innenmaße, die Wanddicke ist egal. Deshalb besteht der Grundriss aus **Räumen**, nicht aus Wänden. Jeder Raum ist ein geschlossener Umriss seiner Innenmaße, die Wand erscheint nur als Band außen herum.

## What Changes

- **Werkzeug „Raum“** (Taste `G`) in der Werkzeugleiste, unter den Form-Werkzeugen. Gezeichnet wird wie in einem CAD-Programm:
  - Der erste Klick setzt den Startpunkt. Die Kante zum Mauszeiger rastet auf 0°, 90°, 180° und 270° ein, mit gedrückter Umschalttaste nicht. Ihre Länge steht live in cm daneben.
  - Ein Klick setzt den nächsten Eckpunkt an der Mausposition.
  - Ziffern tippen öffnet ein Längenfeld (Komma oder Punkt). Enter setzt eine Kante mit genau dieser Länge in die aktuelle Richtung.
  - Der Endpunkt jeder Kante ist der Start der nächsten. Eckpunkte rasten am Startpunkt und an Ecken vorhandener Räume ein.
  - Ein Klick auf den Startpunkt, oder Enter mit leerem Längenfeld ab 3 Punkten, schließt den Raum.
  - Rücktaste nimmt den letzten Punkt zurück, `Esc` verwirft den angefangenen Umriss.
  - Eine Kante, die den Umriss überschneiden würde, wird nicht gesetzt.
- **Neuer Raum**: Er heißt „Raum 1“, „Raum 2“ usw., ist danach ausgewählt, und das Werkzeug springt zurück auf „Auswählen“, wie beim Einfügen von Formen.
- **Darstellung**:
  - Jeder Raum hat ein dunkles Wandband von 15 cm außen um seinen Umriss und seinen Namen in der Mitte.
  - Das Innere ist halbtransparent weiß, sodass die Vorlage sichtbar bleibt.
  - Wandbänder ragen nie in einen Raum hinein. Liegen zwei Räume mit einer schmalen Lücke nebeneinander, sieht die Lücke wie eine gemeinsame Wand aus.
  - Reihenfolge von unten nach oben: Vorlage, Räume, Möbel.
- **Auswählen und Bearbeiten**:
  - Ein Klick in einen Raum, auf dem keine Form liegt, wählt den Raum aus. Er bekommt einen blauen Umriss.
  - Einen ausgewählten Raum verschiebt man durch Ziehen, mit 5-cm-Raster, mit Alt in 1-cm-Schritten. Ziehen auf einem nicht ausgewählten Raum verschiebt weiterhin die Ansicht.
  - `Entf` löscht den ausgewählten Raum.
- **Eigenschaften-Panel für Räume**:
  - Kopf mit „Raum“ und „Löschen“, Feld „Name“, Abschnitt „Kanten“ mit einem Längenfeld je Kante („Kante 1“ …), dessen Kante auf der Zeichenfläche hervorgehoben ist.
  - Ändert man eine Kantenlänge, verschieben sich die beiden folgenden Eckpunkte parallel zu dieser Kante. So bleibt ein Rechteck ein Rechteck.
  - Würde dabei eine Kante 0 cm oder kürzer, oder würde sich der Umriss überschneiden, wird die Eingabe mit einem Hinweis abgelehnt.
- **Rückgängig**: Raum zeichnen, verschieben, umbenennen, eine Kante ändern und löschen sind je ein Schritt.
- **Etage löschen**: Die Rückfrage nennt auch die Räume der Etage, und die Räume werden mitgelöscht.
- **Einpassen** berücksichtigt die Räume.
- **Import/Export**:
  - Die Datei enthält die Räume je Etage.
  - Ungültige Räume und Räume unbekannter Etagen werden im Prüfdialog aufgelistet, nicht stillschweigend verworfen.
  - Doppelte Raum-IDs bekommen eine neue ID.
- **BREAKING – Formatversion 4**: `schemaVersion` 3 → 4, neues Pflichtfeld `roomsByFloor`. Die Migration 3 → 4 legt für jede Etage eine leere Raumliste an. Gespeicherte Pläne und Dateien werden automatisch umgewandelt.

## Nicht im Umfang

- Türen und Fenster in Raumkanten (`room-openings`)
- Wanddicke als Eingabe, Wände als eigene Objekte, Verbinden oder Verschneiden von Räumen
- Flächenanzeige in m²
- Einzelne Eckpunkte auf der Zeichenfläche ziehen, Eckpunkte nachträglich einfügen oder entfernen. Maße ändert man über die Kantenlängen im Panel.
- Räume drehen, spiegeln, kopieren, sperren oder in der Reihenfolge ändern
- Möbel an Raumkanten einrasten lassen
- Räume auf eine andere Etage verschieben
- Rückgängig einzelner Punkte während des Zeichnens über Strg+Z (dafür gibt es die Rücktaste)

## Capabilities

### New Capabilities
- `floor-rooms`: Räume als Innenumrisse je Etage: Gültigkeit, Zeichnen mit dem Werkzeug „Raum“, Darstellung mit Wandband, Auswählen, Verschieben, Umbenennen, Kantenlängen ändern, Löschen, Rückgängig.

### Modified Capabilities
- `plan-data`: Der Plan enthält je Etage eine Raumliste, Formatversion 4.
- `plan-import`: Räume kommen aus der Datei. Ungültige Räume, Räume unbekannter Etagen und doppelte IDs werden gemeldet. Dateien der Version 3 werden umgewandelt.
- `plan-export`: Die Exportdatei enthält die Räume je Etage.
- `edit-history`: Raumänderungen sind Schritte. Nach Rückgängig und Wiederholen ist der eine betroffene Raum ausgewählt.
- `shape-editing`: Ein Klick in einen Raum hebt die Auswahl einer Form auf und wählt den Raum.
- `workspace-layout`: Das Eigenschaften-Panel zeigt auch ausgewählte Räume. Der Leerzustand lautet „Wähle eine Form oder einen Raum aus“.

## Impact

- **Voraussetzung**: `editing-extras`, `floors-in-plan` und `floor-underlay` sind umgesetzt und archiviert, damit `edit-history`, `floor-management` und die cm-basierte Zeichenfläche als Specs bzw. Code existieren und `schemaVersion` bei 3 steht. `room-openings` baut auf diesem Change auf.
- **Neu** (je mit Vitest-Test):
  - `src/lib/room-geometry.ts`: Kantenlängen, Überschneidung, Begrenzungsrahmen, Namensposition, Kantenlänge ändern, verschieben
  - `src/lib/room-drawing.ts`: Richtung einrasten, Punkt mit Länge, Eckpunkt einrasten, Punkt zulässig, Raum schließen
  - `src/lib/__fixtures__/plan-v3.json`
- **Neue Komponenten**: `RoomsLayer`, `RoomDraftLayer`, `RoomProperties` mit `EdgesSection`
- **Geändert**:
  - `src/lib/plan-schema.ts`: `RoomSchema`, `PlanSchema` v4
  - `src/lib/plan.ts`: Raum-Operationen, `removeFloor` entfernt Räume
  - `src/lib/plan-migration.ts`: 3 → 4
  - `src/lib/plan-import.ts`, `src/lib/shape-issues.ts`, `src/lib/plan-diff.ts`
  - Einpassen auf den Inhalt der Etage
  - `src/store/app-store.ts`: `selectedRoomId`, `roomDraft`, Raum-Aktionen
  - `src/store/history.ts`
  - `tools.ts`, `ToolBar`, `FloorCanvas`, `PropertiesPanel`, `useShapeShortcuts`, `ImportDialog`, `FloorsDialog`
  - `docs/design/README.md`
- **Abhängigkeiten**: keine neuen.
- **Datenmodell**: `schemaVersion` 3 → 4, `roomsByFloor: Record<floorId, Room[]>` mit `Room { id, name, pointsCm }`. Schlüssel genau wie die Etagen-IDs. Koordinaten absolut in cm.
