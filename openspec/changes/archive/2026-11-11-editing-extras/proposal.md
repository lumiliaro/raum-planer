# Proposal

## Why

Mit `basic-shapes`, `shape-properties` und `more-shapes` lässt sich das Haus einrichten, aber jeder Fehlgriff ist endgültig: Eine gelöschte Form ist weg, ein versehentlich verschobener Schrank muss von Hand zurückgesetzt werden, und überlappende Formen liegen in der Reihenfolge, in der sie entstanden sind. Dieser Change ergänzt die drei Komfortfunktionen, die das Arbeiten am Plan sicher machen: Rückgängig/Wiederholen, Nach vorne/hinten und Sperren. Er kommt bewusst zum Schluss, weil er alle vorhandenen Bearbeitungswege einbezieht.

## What Changes

- **Rückgängig/Wiederholen** über `zundo` (bereits installiert):
  - Schaltflächen „Rückgängig (Strg+Z)“ und „Wiederholen (Strg+Umschalt+Z)“ in der Kopfleiste wie im Design-Entwurf. Strg+Y wiederholt ebenfalls.
  - Ein Schritt ist jede Änderung am Plan: einfügen, verschieben, drehen, Größe ändern, ein Feld im Eigenschaften-Formular, löschen, umordnen, sperren/entsperren, eine gespeicherte Kalibrierung und ein ganzer Import.
  - Kein Schritt: Etagenwechsel, Auswahl, Werkzeug, Zoom, Panel.
  - Bis zu 100 Schritte. Der Verlauf gilt nur für die Sitzung und ist nach dem Neuladen leer.
  - Betrifft ein Schritt eine andere Etage, wechselt die Ansicht dorthin, damit man sieht, was rückgängig gemacht wurde. Ist danach genau eine Form betroffen und vorhanden, ist sie ausgewählt.
  - Der Planname gehört nicht zum Verlauf: Umbenennen im Export-Dialog ist kein Schritt, und Rückgängig/Wiederholen lassen den Namen stehen. Nur beim Rückgängigmachen bzw. Wiederholen eines Imports wechselt der Name mit dem ganzen Plan.
  - In Eingabefeldern bleibt Strg+Z das normale Rückgängig des Browsers. Im Kalibrier-Modus sind Rückgängig und Wiederholen gesperrt.
- **Nach vorne/hinten**: Abschnitt „Anordnung“ im Eigenschaften-Panel mit „Nach vorne“, „Nach hinten“, „Ganz nach vorne“ und „Ganz nach hinten“. Tastenkürzel Bild↑/Bild↓, mit Umschalt ganz nach vorne/hinten. Liegt die Form schon am Ziel, ist die Schaltfläche gesperrt.
- **Sperren**: Schaltfläche „Sperren“/„Entsperren“ mit Schloss-Icon im Panel-Kopf neben „Löschen“. Eine gesperrte Form:
  - lässt sich weiterhin auswählen. Der Auswahlrahmen hat dann keine Anfasser.
  - lässt sich nicht verschieben, drehen, in der Größe ändern, spiegeln oder löschen, weder auf der Zeichenfläche noch per Taste oder Formular. Ziehen auf ihr verschiebt die Ansicht.
  - Beschriftung, Darstellung (Farben, Rand, Deckkraft) und Anordnung bleiben änderbar.

## Nicht im Umfang

- **Einstellungs-Menü**: Es wird als eigener Change `settings-menu` geplant, mit vier Einstellungen:
  - Schenkel von L-/U-Formen beim Skalieren mitskalieren
  - Rasterweite
  - Einrasten der Drehung
  - Beschriftungen anzeigen

  Das Zahnrad in der Kopfleiste kommt mit diesem Change.
- Rückgängig für Ansichts- und Bedieneinstellungen (Zoom, Panel, Etagenwechsel ohne Änderung).
- Gespeicherter Verlauf über das Neuladen hinaus, Verlaufsliste mit einzelnen Schritten, getrennter Verlauf je Etage.
- Rückgängig während des Kalibrier-Modus, z. B. für einzelne gesetzte Punkte. Erst „Kalibrierung speichern“ ist ein Schritt.
- Liste „Formen“ im Panel, Mehrfachauswahl, Sperren mehrerer Formen auf einmal, Kopieren/Duplizieren.
- Tastenkürzel zum Sperren.
- Änderungen am Datenformat: `locked` gibt es seit `plan-model`.

## Capabilities

### New Capabilities
- `edit-history`: Rückgängig und Wiederholen von Plan-Änderungen: was ein Schritt ist, Bedienung über Kopfleiste und Tastatur, Etagenwechsel und Auswahl danach, Grenzen des Verlaufs.

### Modified Capabilities
- `shape-editing` (entsteht mit `basic-shapes`; hier kommen nur Anforderungen hinzu): Sperren und Entsperren, Verhalten gesperrter Formen auf der Zeichenfläche, per Taste und im Panel; Anordnung über das Panel und per Tastatur.

## Impact

- **Voraussetzungen**:
  - `basic-shapes` und `shape-properties` müssen umgesetzt sein. `shape-properties` ist noch nicht geplant; angenommen wird ein Formular, dessen Felder einzeln übernommen werden (Enter/Verlassen des Feldes), und dessen Felder sich schreibgeschützt schalten lassen.
  - Ist `more-shapes` umgesetzt, gilt Sperren auch für dessen Maß-Felder.
  - Ist `export-import` umgesetzt, ist ein Import ein Rückgängig-Schritt. Sonst entfällt die zugehörige Aufgabe.
- Neu in `src/lib/` (jeweils mit Vitest-Test):
  - `plan-diff.ts`: betroffene Etagen und Formen zwischen zwei Plänen
  - `shape-lock.ts`: welche Änderungen an einer gesperrten Form erlaubt sind
- Erweitert (mit Test): `src/lib/plan.ts` um `canReorder`.
- Neu: `src/store/history.ts` (Rückgängig/Wiederholen samt Etagenwechsel und Auswahl), Komponenten `HistoryButtons`, `ArrangeSection`, `LockToggle`.
- Geändert:
  - `src/store/app-store.ts`: `temporal`-Middleware, Sperr-Prüfung in den Aktionen
  - `HeaderBar`, `ShapeProperties`/Panel-Kopf, `PropertiesPanel`
  - `ShapeNode` (nicht ziehbar, wenn gesperrt) und `SelectionTransformer` (keine Anfasser, wenn gesperrt)
  - `useShapeShortcuts` (Strg+Z/Strg+Umschalt+Z/Strg+Y, Bild↑/Bild↓, Entf bei gesperrter Form)
  - `src/store/app-store.test.ts`, `docs/design/README.md`
- Abhängigkeiten: keine neuen. `zundo` 2.3 steht bereits in `package.json`; diese Projektvorgabe wird hiermit eingelöst.
- Datenmodell und `schemaVersion`: unverändert (1). Der Verlauf liegt nur im Arbeitsspeicher und gelangt weder ins Autosave noch in Export-Dateien.
