# Proposal

## Why

Möbel lassen sich schon sperren, Räume nicht. Ist ein Raum einmal sauber nach der Vorlage nachgezeichnet, verschiebt ein versehentliches Ziehen oder eine Eingabe im falschen Kantenfeld ihn leicht, und der Grundriss passt nicht mehr. Eine Sperre schützt fertige Räume, bis der Nutzer sie bewusst wieder entsperrt.

## What Changes

- Der Panel-Kopf eines ausgewählten Raums bekommt neben „Löschen“ dieselbe Schloss-Schaltfläche wie bei Möbeln („Sperren“ / „Entsperren“). Sperren und Entsperren ist je ein Rückgängig-Schritt.
- Ein gesperrter Raum lässt sich weiter auswählen, aber nicht verschieben: Ziehen auf ihm verschiebt die Ansicht.
- Bei einem gesperrten Raum sind die Felder „Kante n“ (Kantenlängen) und „Wand“ (Wanddicken) schreibgeschützt. Name und Farbe bleiben änderbar.
- Ein gesperrter Raum lässt sich nicht löschen: „Löschen“ ist gesperrt mit dem Tooltip „Gesperrt – zuerst entsperren“, `Entf` und Rücktaste wirken nicht.
- Die Sperre gilt für jeden Bearbeitungsweg (Store-Aktionen, nicht nur die Oberfläche). Rückgängig, Wiederholen und Import sind ausgenommen.
- Datenformat: Jeder Raum bekommt das Feld `locked` (Ja/Nein). `schemaVersion` steigt von 10 auf 11; ältere Pläne und Dateien bekommen beim Umwandeln für jeden Raum „nicht gesperrt“.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `floor-rooms`: Raum sperren und entsperren; gesperrter Raum lässt sich nicht verschieben, in Kantenlängen und Wanddicken nicht ändern und nicht löschen; Panel-Kopf mit Schloss-Schaltfläche.
- `plan-data`: Formatversion 11; Sperre eines Raums als Teil des Plans.
- `plan-import`: Umwandlung von Dateien der Version 10; Sperre eines Raums aus der Datei übernehmen.

## Nicht im Umfang

- Türen, Fenster und Durchgänge eines gesperrten Raums bleiben voll bearbeitbar (setzen, ziehen, ändern, löschen). Die Sperre betrifft nur den Raum selbst.
- Kein Schloss-Symbol oder andere Kennzeichnung gesperrter Räume auf der Zeichenfläche (wie bei Möbeln).
- Keine Sperre für mehrere Räume auf einmal, für ganze Etagen oder für die Vorlage.
- Keine Änderung an der Möbel-Sperre und am PDF-Export.

## Impact

- `src/lib/plan-schema.ts`: `RoomSchema.locked`, `PLAN_SCHEMA_VERSION = 11`.
- `src/lib/plan-migration.ts`: Migration 10 → 11, neues Fixture `src/lib/__fixtures__/plan-v10.json`.
- `src/lib/plan-import.ts`: `locked` bereinigen (fehlend oder ungültig → nicht gesperrt, ohne Hinweis).
- Neue reine Logik für die Raum-Sperre (z. B. `src/lib/room-lock.ts`), genutzt von `src/store/app-store.ts` (`updateRoom`, `moveRoom`, `removeRoom`, `deleteSelectedRoom`).
- `src/lib/plan.ts` / Raum-Erzeugung beim Schließen eines Raums: neue Räume mit `locked: false`.
- Oberfläche: `src/components/properties/RoomProperties.tsx` (Kopf mit `LockToggle`, schreibgeschützte Kantenfelder), `src/components/canvas/RoomsLayer.tsx` (nicht ziehbar, wenn gesperrt).
- Tests und Fixtures, die Raum-Literale der aktuellen Version enthalten.
- Keine neuen Abhängigkeiten.
