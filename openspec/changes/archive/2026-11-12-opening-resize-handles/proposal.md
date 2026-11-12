## Why

Fenster und Durchgänge lassen sich nach dem Setzen nur verschieben; ihre Breite ändert man bisher nur über das Zahlenfeld im Panel. Beim Nachzeichnen eines Grundrisses nach Vorlage will man die Öffnung aber direkt auf der Zeichenfläche an die Vorlage, eine Ecke oder ein Nachbarfenster heranziehen – so wie man Möbel an ihren Griffen größer und kleiner zieht.

## What Changes

- Ein ausgewähltes Fenster oder ein ausgewählter Durchgang zeigt mit „Auswählen“ an beiden Enden seiner Lücke je einen Griff.
- Zieht der Nutzer einen Griff entlang der Kante, wird die Öffnung länger oder kürzer; das andere Ende bleibt liegen. Raster wie beim Verschieben (5 cm, mit Alt 1 cm), Halt an den Kantenenden, Mindestbreite 10 cm. Lücke und Symbol folgen live, die Änderung ist ein Rückgängig-Schritt.
- Haltepunkte für das gezogene Ende: Ecken der Kante, Enden anderer Öffnungen derselben Kante, Mitte der Kante, „Öffnung mittig auf der Kante“ und die Standardbreite der Art aus den Einstellungen. Toleranz 8 Bildschirmpixel, Umschalttaste schaltet sie ab; eine Markierung in der Auswahlfarbe zeigt den Haltepunkt.
- Wie bei einer Eingabe im Panel vergisst die Öffnung dabei ihre für „Ganze Kante“ gemerkten Maße.

Nicht im Umfang:
- Türen bekommen keine Griffe; ihre Breite bleibt über das Panel änderbar.
- Kein Ziehen über die Kante hinaus auf eine andere Kante oder in einen anderen Raum.
- Kein Anhalten an Nachbaröffnungen (Öffnungen dürfen sich wie bisher überlappen); Nachbarn sind nur Haltepunkte.
- Keine Maßzahl an der Öffnung während des Ziehens; die Breite steht nach dem Loslassen im Panel.
- Keine Änderung am Datenformat.

## Capabilities

### New Capabilities

_keine_

### Modified Capabilities

- `room-openings`: neue Anforderungen für Griffe an Fenster und Durchgang, das Ziehen der Breite, Haltepunkte dafür, deren Abschalten und die Markierung beim Ziehen.

## Impact

- `src/lib/`: neue reine Logik für Ziehen eines Endes mit Raster, Grenzen, Mindestbreite und Haltepunkten (neben `opening-snap.ts` / `opening-placement.ts`), mit Vitest-Tests.
- `src/components/canvas/OpeningsLayer.tsx`: Griffe am ausgewählten Fenster/Durchgang, Ziehen, Markierung; `RoomsLayer.tsx`: Lücken-Vorschau nimmt neben dem Abstand auch die Breite einer gezogenen Öffnung.
- Hilfe/Kürzel-Liste (`src/components/help/`), falls dort Öffnungs-Bedienung beschrieben ist.
- Keine neuen Abhängigkeiten, keine Änderung an `plan-schema.ts` oder `schemaVersion`.
