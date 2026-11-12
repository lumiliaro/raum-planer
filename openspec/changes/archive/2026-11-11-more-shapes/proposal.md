# Proposal

## Why

Nach `basic-shapes` und `shape-properties` lassen sich nur Rechtecke und Ellipsen planen. Typische Möbel und Einbauten des Hauses – Ecksofa, Eckküche, U-Küche, Eckdusche und vor allem die Aufschlagbereiche der Türen – lassen sich damit nicht oder nur ungenau darstellen. Das Datenmodell kennt diese Formtypen bereits seit `plan-model`. Dieser Change macht vier davon nutzbar und zeigt dabei, dass ein neuer Formtyp nur einen Umriss, ein paar deklarative Einträge und seine Maß-Felder braucht.

## What Changes

- **Vier neue Werkzeuge** in der Werkzeugleiste unter „Ellipse“, mit eigenen Strich-Icons aus dem Design-Entwurf und deutschen Tooltips samt Tastenkürzel:
  - „L-Form – Ecksofa, Eckküche (L)“
  - „U-Form – U-Küche (U)“
  - „Ecke – Eckdusche, Eckregal (C)“
  - „Tür mit Aufschlag (T)“
- **Einfügen per Klick** wie bei Rechteck und Ellipse, mit Standardmaßen in der Größenordnung von Rechteck und Ellipse: L-Form 120 × 100 cm mit Schenkeln von je 40 cm, U-Form 140 × 100 cm mit Basis und Seiten von je 30 cm, Ecke 90 × 90 cm, Tür 80 cm breit. L-Form, U-Form und Ecke erscheinen hellgrau mit dunklem Rand, die Tür nur mit Rand, damit sie den Grundriss nicht verdeckt.
- **Umrisse** über die reine Funktion `getOutlineCm`:
  - L-Form: Schenkel A entlang der unteren Kante, Schenkel B entlang der linken Kante (wie das Werkzeug-Icon)
  - U-Form: offen nach oben, die Basis liegt unten
  - Ecke: Viertelellipse mit dem rechten Winkel unten links (wie das Werkzeug-Icon)
  - Tür: Angel unten links, geöffnetes Türblatt entlang der linken Kante und Aufschlagbogen bis zur unteren rechten Ecke
  - Gespiegelt wird für alle Formtypen im Umriss: links und rechts tauschen.
- **Darstellung der Tür**: Das Türblatt ist eine durchgezogene Linie, der Aufschlag ein gestrichelter Bogen. Die Wandöffnung zwischen Angel und Bogenende wird nicht gezeichnet. Ein Klick irgendwo innerhalb des Aufschlags wählt die Tür aus, auch ohne Füllung.
- **Größe ändern** über die Anfasser:
  - L- und U-Form: Breite und Tiefe ändern sich, die Schenkel-, Basis- und Seitenstärken bleiben gleich (Vorgabe aus `docs/design/README.md`). Die Form lässt sich über die Anfasser nur so weit verkleinern, dass jede Aussparung mindestens so groß bleibt wie der angrenzende Schenkel; so bleibt sie als L bzw. U erkennbar.
  - Tür: bleibt quadratisch und ändert nur ihre Breite.
  - Ecke: verhält sich wie ein Rechteck.
- **Maß-Felder** im Abschnitt „Maße“ des Eigenschaften-Formulars aus `shape-properties`:
  - L-Form: Breite, Tiefe, Schenkel A, Schenkel B
  - U-Form: Breite, Tiefe, Basis, Seiten
  - Ecke: Breite, Tiefe
  - Tür: Breite

  Ungültige Werte werden nicht übernommen, ein Hinweis nennt die Grenze. Formtyp-Namen im Panel: „L-Form“, „U-Form“, „Ecke“, „Tür“.
- **Beschriftung innerhalb der Form**: bei der L-Form in Schenkel A, bei der U-Form in der Basis, bei Ecke und Tür im Schwerpunkt. So steht sie nicht in einer leeren Aussparung.
- **Nicht kalibrierte Etage und Kalibrier-Modus**: Die vier Werkzeuge sind dort gesperrt wie „Rechteck“ und „Ellipse“.

## Nicht im Umfang

- **Freie Form (Polygon)**: Sie braucht ein eigenes Werkzeug zum Setzen der Punkte und kommt als eigener Change (z. B. `polygon-shape`). Werkzeug-Icon und Taste P bleiben bis dahin frei.
- Änderungen am Datenformat: Das Schema aus `plan-model` gilt unverändert (schemaVersion 1).
- Einstellung „Schenkel beim Skalieren mitskalieren“: Sie kommt laut Design-Leitfaden mit dem Einstellungs-Menü.
- Ziehbare Anfasser direkt an den Schenkeln, Basis oder Seiten: Diese Maße ändern sich nur über das Formular.
- Türen mit zwei Flügeln, Schiebetüren, Fenster, Wände, Andocken von Türen an Wände des Grundrisses.
- Neue Bedienelemente für Spiegeln, Sperren oder Anordnung. Diese Bedienelemente stammen aus `shape-properties` bzw. späteren Changes. Dieser Change sorgt nur dafür, dass `mirrored` im Umriss der neuen Formen wirkt.
- Rückgängig/Wiederholen, Mehrfachauswahl, Maßketten.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
Die folgenden Capabilities entstehen erst mit den noch nicht archivierten Changes `basic-shapes` und `shape-properties`. Dieser Change ergänzt sie nur um neue Anforderungen (ADDED) und ändert keine bestehenden.
- `shape-outline`: Umrisse von L-Form, U-Form, Ecke und Tür sowie die Spiegelung im Umriss.
- `shape-editing`: Werkzeuge, Standardmaße beim Einfügen, Darstellung und Auswahl der Tür, Regeln für das Ändern der Größe von L-Form, U-Form und Tür.
- `shape-properties`: Maß-Felder, Formtyp-Namen und Lage der Beschriftung für L-Form, U-Form, Ecke und Tür. Der Capability-Name ist angenommen; er wird angeglichen, sobald `shape-properties` geschrieben ist.

## Impact

- **Voraussetzungen**: `basic-shapes` und `shape-properties` müssen umgesetzt sein. Dieser Change nimmt an:
  - Aus `basic-shapes` (fertig geplant): `src/lib/outline.ts` (`getOutlineCm`), `src/lib/shape-factory.ts`, `src/lib/snap.ts`, `src/lib/shape-transform.ts`, die Werkzeug-Tabelle `TOOLS` in `ToolBar`, `useShapeShortcuts`, `ShapeNode` und `SelectionTransformer`.
  - `shape-properties` (noch nicht geplant) liefert ein Eigenschaften-Formular mit einem Abschnitt „Maße“, dessen Felder je Formtyp ausgewählt werden. Es muss vor diesem Change archiviert sein, damit die Delta-Spec `shape-properties` auf eine vorhandene Haupt-Spec trifft.

  Weicht die Umsetzung davon ab, werden die Aufgaben vor dem Start angepasst.
- Neu in `src/lib/` (jeweils mit Vitest-Test): `shape-resize.ts` (Größe aus dem Transformer in ein gültiges Formmaß umrechnen).
- Erweitert (jeweils mit Test): `outline.ts`, `shape-factory.ts`, `shape-transform.ts`.
- Neue Komponenten: Icons `LShapeIcon`, `UShapeIcon`, `CornerIcon`, `DoorIcon` sowie die Maß-Felder für L-Form, U-Form, Ecke und Tür.
- Geändert: `ToolBar` (vier Einträge in `TOOLS`), `useShapeShortcuts`, `ShapeNode` (Darstellung der Tür, Klickfläche ohne Füllung), `SelectionTransformer` (Größenregeln je Formtyp), `docs/design/README.md` (Icons, Bedienentscheidung „Tür skalieren“).
- Abhängigkeiten: keine neuen.
- Datenmodell und `schemaVersion`: unverändert (1). Die Lage der Schenkel, die Öffnung der U-Form und die Angelseite der Tür werden mit diesem Change verbindlich. Eine spätere Änderung daran würde gespeicherte Formen anders darstellen und erfordert deshalb eine neue `schemaVersion` mit Migration.
