# Proposal

## Why

Bisher entsteht eine Wand nur als Rand eines Raums. Viele Grundrisse brauchen aber auch einzelne Wände: eine Trennwand mitten im Raum, eine Halbwand, einen Mauervorsprung oder eine Außenwand, die keinen Raum umschließt. Heute lassen sie sich nur mit einem Möbel-Rechteck behelfsweise nachbilden. Das rastet nicht wie Wände ein, liegt über den Möbeln und hat die falsche Farbe. Ein eigenes Werkzeug „Wand“ mit denselben Hilfslinien wie beim Raumzeichnen schließt diese Lücke.

## What Changes

- Neues Werkzeug „Wand“ (Taste `W`) in der Werkzeugleiste unter „Raum“. Ein Klick setzt den Startpunkt, ein zweiter den Endpunkt; damit ist die Wand fertig. Die gezeichnete Linie ist die **Mittellinie** der Wand; die Wand ist zu beiden Seiten gleich dick, neu mit der Wanddicke aus den Einstellungen.
- Beim Zeichnen gelten dieselben Hilfen wie bei „Raum“: Einrasten auf 0°/90°/180°/270° (Umschalt: frei), Länge eintippen, Einrasten an Raumecken und Wandenden, waagerechte und senkrechte Hilfslinien durch Raumecken, Wandenden und den Startpunkt, Startpunkt auf einer Wandlinie mit Abstandsanzeige und eingetipptem Abstand (Tab wechselt das Bezugsende). Neu: Der Endpunkt rastet an einer Wandlinie ein, auf die die Wand zuläuft. Strg oder der ausgeschaltete Schalter „Einrasten“ schalten Hilfslinien und Wandlinien ab.
- Wände werden als Band in der Wandfarbe des Plans über den Räumen und unter den Möbeln gezeichnet. Treffen sich zwei Wandenden genau, wird die Ecke geschlossen.
- Eine Wand lässt sich auswählen, verschieben (im Raster, Alt: feine Schritte) und löschen (Panel, `Entf`, Rücktaste). An beiden Enden gibt es Griffe; das Ziehen eines Griffs rastet wie beim Zeichnen des Endpunkts ein.
- Eigenschaften-Panel einer Wand: „Länge“ (der Startpunkt bleibt, das Ende wandert in Wandrichtung) und „Dicke“.
- Bei eingeschalteter Maßanzeige steht die Länge an der Wand. Wände erscheinen im PDF und zählen beim Einpassen mit.
- Jede abgeschlossene Wandänderung ist ein Rückgängig-Schritt.
- Datenformat: Der Plan bekommt je Etage eine Liste von Wänden `wallsByFloor`. `schemaVersion` steigt von 11 auf 12; ältere Pläne und Dateien bekommen beim Umwandeln für jede Etage eine leere Wandliste. Import übernimmt gültige Wände und meldet ungültige.
- Der Grundsatz „Räume statt Wände, keine eigenen Wandobjekte“ in der Projektbeschreibung wird gelockert: Räume bleiben der Hauptweg, freie Wände ergänzen sie.

## Capabilities

### New Capabilities

- `floor-walls`: Einzelne (freie) Wände einer Etage: gültige Wand, Werkzeug „Wand“, Zeichnen mit Einrasten und Hilfslinien, Darstellung, Auswahl, Verschieben, Endpunkte ziehen, Länge und Dicke ändern, Löschen, Rückgängig.

### Modified Capabilities

- `plan-data`: Aufbau des Plans mit Wänden je Etage; Formatversion 12.
- `plan-import`: Wände aus der Datei; Umwandlung von Dateien der Version 11.
- `plan-pdf`: Freie Wände gehören zum Inhalt der Zeichnung.
- `floor-plan-view`: „Einpassen“ berücksichtigt Räume und Wände.
- `app-help`: Taste `W` in der Liste der Tastenkürzel; die Tasten beim Zeichnen gelten für Raum und Wand.

## Nicht im Umfang

- **Türen, Fenster und Durchgänge in freien Wänden** – als eigener Folge-Change geplant, weil die Öffnungslogik bisher fest an Raumkanten hängt.
- Wandzüge aus mehreren Stücken in einem Zug (eine L-Wand entsteht aus zwei Wänden).
- Verbinden oder Verschmelzen von freien Wänden mit dem Wandband eines Raums; Wände überlappen sich nur.
- Wand sperren, kopieren, ausschneiden, einfügen, duplizieren.
- Einrasten von Möbeln, Räumen beim Zeichnen oder Räumen beim Ziehen an freien Wänden; Haften einer Wand an Raumwänden beim Verschieben.
- Name oder Farbe je Wand, Wanddicke zu einer Seite, Bögen und schräge Enden.
- Kein neuer Schritt im Einführungs-Tutorial.

## Impact

- `src/lib/plan-schema.ts`: neues `WallSchema`, `wallsByFloor`, Konsistenzprüfung (Etagen, eindeutige IDs), `PLAN_SCHEMA_VERSION = 12`.
- `src/lib/plan-migration.ts`: Migration 11 → 12, neues Fixture `src/lib/__fixtures__/plan-v11.json`.
- `src/lib/plan-import.ts`, `src/lib/plan-diff.ts`, `src/lib/plan.ts` (Wand-Operationen, Etage löschen), `src/lib/content-bounds.ts`, `src/lib/pdf-layout.ts`.
- Neue reine Logik `src/lib/wall-geometry.ts` (Band, Ecken schließen, Länge setzen) und `src/lib/wall-drawing.ts` (Einrasten für Start- und Endpunkt); `src/lib/room-drawing.ts` wird so verallgemeinert, dass Wandlinien auch von freien Wänden kommen können.
- Store `src/store/app-store.ts`: Werkzeug `"wall"`, Entwurf, Auswahl `selectedWallId`, Aktionen.
- Oberfläche: neue `WallsLayer.tsx`, `WallDraftLayer.tsx`, `WallProperties.tsx`; Anpassungen in `FloorCanvas.tsx`, `PropertiesPanel.tsx`, `tools.ts`, `useShapeShortcuts.ts`, `shortcuts.ts`, PDF-Zeichnung.
- Tests und Fixtures, die Plan-Literale der aktuellen Version enthalten.
- Keine neuen Abhängigkeiten.
