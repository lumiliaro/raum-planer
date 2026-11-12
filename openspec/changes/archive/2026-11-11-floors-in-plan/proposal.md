# Proposal

## Why

Die Etagen sind heute Code (`src/config/house.ts`): genau Erdgeschoss, Obergeschoss und Dachgeschoss, jede mit einem festen, eingescannten PNG. Der Plan soll künftig ohne diese Scans auskommen: Man legt Etagen selbst an, zeichnet die Räume in cm nach und nutzt einen Scan höchstens als ausblendbare Vorlage. Dieser Change ist der erste Schritt dahin. Er macht die Etagen zu Nutzerdaten im Plan. Darauf bauen `floor-underlay` (Bild als Vorlage), `floor-rooms` (Räume zeichnen) und `room-openings` (Türen und Fenster) auf.

## What Changes

- **Etagen im Plan**: Der Plan bekommt eine geordnete Liste `floors` mit ID und Namen. Die Reihenfolge der Liste ist die Reihenfolge im Etagen-Umschalter. Ein Plan hat 1 bis 8 Etagen.
- **Etagen bearbeiten**: Neben dem Etagen-Umschalter öffnet eine Schaltfläche „Etagen bearbeiten“ den Dialog „Etagen“:
  - **Anlegen**: „Etage hinzufügen“ hängt eine Etage „Neue Etage“ hinten an und macht sie aktiv.
  - **Umbenennen**: über ein Namensfeld je Etage, 1 bis 40 Zeichen.
  - **Sortieren**: mit „Nach oben“ und „Nach unten“.
  - **Löschen**: Hat die Etage Formen oder eine Kalibrierung, wird vorher nachgefragt. Die letzte Etage lässt sich nicht löschen.
  - Jede dieser Änderungen ist ein Rückgängig-Schritt. Im Kalibrier-Modus ist die Schaltfläche ausgeblendet.
- **BREAKING – Formatversion 2**: `schemaVersion` steigt auf 2. Das ist die erste echte Migration:
  - Version 1 → 2 ergänzt die Etagen Erdgeschoss, Obergeschoss und Dachgeschoss mit ihren bisherigen IDs `eg`, `og`, `dg`.
  - Formen, Kalibrierungen und Koordinaten bleiben unverändert. Kein Möbelstück verschiebt sich.
- **Migration auch beim Start**: Ein im Browser gespeicherter Plan der Version 1 wird beim Start automatisch umgewandelt und nicht mehr als unlesbar gesichert. Die ursprünglichen Daten bleiben unter einem eigenen Schlüssel erhalten.
- **Import**:
  - Die Etagen kommen aus der Datei, mit Namen und Reihenfolge.
  - Formen und Kalibrierungen unter einer Kennung, die in der Datei nicht als Etage angelegt ist, werden wie bisher als „Unbekannte Etage“ gemeldet.
  - Ungültige oder doppelte Etagen-Einträge werden aufgelistet.
  - Fehlt die aktive Etage, wird die erste Etage der Datei aktiv.
- **Export**: Die Datei enthält zusätzlich die Etagenliste.
- **Neuer leerer Plan**: Er hat genau eine Etage „Erdgeschoss“.
- **Übergang bis `floor-underlay`**:
  - Die Etagen mit den IDs `eg`, `og`, `dg` zeigen weiter die PNGs aus `public/plans/`.
  - Neu angelegte Etagen haben noch kein Bild. Die Zeichenfläche zeigt „Für diese Etage gibt es noch keinen Grundriss“, und „Etage kalibrieren“ ist dort gesperrt.
- **Entfernt**: Die einmalige Übernahme von Kalibrierungen aus der Zeit vor dem Plan (`raumplaner.calibration`). Sie hat ihren Zweck erfüllt.

## Nicht im Umfang

- Bilder hochladen, ersetzen, entfernen oder als Vorlage ausblenden, die cm-basierte Zeichenfläche und das Entfernen der PNGs aus dem Repo (alles `floor-underlay`)
- Räume, Türen und Fenster zeichnen (`floor-rooms`, `room-openings`)
- Formen von einer Etage auf eine andere verschieben oder kopieren, Etagen duplizieren
- Sortieren per Ziehen, Umbenennen direkt im Umschalter (Doppelklick)
- Eindeutige Etagennamen: Zwei Etagen dürfen gleich heißen.
- Mehr als 8 Etagen

## Capabilities

### New Capabilities
- `floor-management`: Etagen als Teil des Plans: Regeln für die Etagenliste, Anlegen, Umbenennen, Sortieren und Löschen, der Dialog „Etagen“.

### Modified Capabilities
- `plan-data`: Der Plan enthält die Etagenliste, Formatversion 2. Der neue leere Plan hat eine Etage „Erdgeschoss“. Etagenänderungen setzen den Änderungszeitpunkt.
- `plan-persistence`: Ein gespeicherter Plan der Version 1 wird beim Start umgewandelt statt gesichert. Die Übernahme der alten Kalibrierdaten entfällt.
- `plan-import`: Die Etagen kommen aus der Datei. Fehlerfälle, Prüfergebnis, unbekannte Etagen, ergänzte Angaben, Kalibrierung, Versionen und Rundreise beziehen sich auf die Etagen der Datei.
- `plan-export`: Die Exportdatei enthält die Etagenliste, Formatversion 2.
- `floor-plan-view`: Keine festen Etagen mehr. Der Umschalter zeigt die Etagen des Plans. Hinweis für Etagen ohne Grundriss.
- `floor-calibration`: Kalibrieren nur bei Etagen mit Grundriss.
- `workspace-layout`: Die Kopfleiste zeigt neben dem Umschalter „Etagen bearbeiten“.
- `edit-history` (entsteht mit `editing-extras`): Etagenänderungen sind Schritte. Nach Rückgängig und Wiederholen ist immer eine vorhandene Etage aktiv.

## Impact

- **Voraussetzung**: `editing-extras` ist umgesetzt und archiviert, damit `edit-history` als Spec existiert. `export-import` ist archiviert.
- **Geändert**:
  - `src/lib/plan-schema.ts`: `FloorSchema`, `PlanSchema` v2 mit Konsistenzprüfung
  - `src/lib/plan.ts`: Etagen-Operationen, leerer Plan
  - `src/lib/plan-migration.ts`: Migration 1 → 2
  - `src/lib/plan-import.ts`: Etagen aus der Datei
  - `src/lib/plan-storage.ts`: Migration beim Laden
  - `src/lib/plan-diff.ts`: Etagenliste im Verlauf
  - `src/store/app-store.ts`, `src/store/history.ts`
  - `FloorSwitcher`, `HeaderBar`, `FloorCanvas`, `ToolBar`, `ImportDialog`, `StatusBar`
  - zugehörige Tests, `docs/design/README.md`
- **Neu**:
  - `src/components/floors/FloorsDialog.tsx`
  - `src/config/legacy-floor-images.ts` (Übergang, entfällt mit `floor-underlay`)
  - `src/lib/__fixtures__/plan-v2.json`
- **Entfernt**: `src/config/house.ts` (samt Test) und `src/lib/calibration-storage.ts` (samt Test). `FloorId` wird zu `string`.
- **Abhängigkeiten**: keine neuen.
- **Datenmodell**: `schemaVersion` 1 → 2, neues Pflichtfeld `floors`. Die Schlüssel von `shapesByFloor` entsprechen genau den Etagen-IDs, die von `calibrationByFloor` sind eine Teilmenge davon.
