# Proposal

## Why

Bei einem Durchgang macht die Schaltfläche „Ganze Kante“ die Öffnung so breit wie ihre Kante. Danach ist die Schaltfläche gesperrt. Zurück geht es nur mit Strg+Z, und auch das nur, solange der Schritt noch im Verlauf liegt. Wer später doch wieder einen schmalen Durchgang will, muss Breite und Abstand neu eintippen und kennt die alten Werte nicht mehr. „Ganze Kante“ soll deshalb ein Kästchen werden, das man an- und wieder abhaken kann. Dasselbe wird für Fenster gebraucht, etwa für ein Fensterband über die ganze Wand; dort gibt es „Ganze Kante“ bisher gar nicht.

## What Changes

- **Kästchen statt Schaltfläche**: Bei Durchgängen und Fenstern steht unter den Feldern das Kästchen „Ganze Kante“ (bei Durchgängen statt der bisherigen Schaltfläche, bei Fenstern neu). Es ist nie gesperrt. Türen bekommen es nicht.
  - Es hat einen Haken, wenn die Öffnung die ganze Kante einnimmt (Breite = Kantenlänge, Abstand 0 cm). Dabei ist egal, wie sie so breit geworden ist (Kästchen, Eingabe der Breite, Import).
  - **Anhaken**: Die Öffnung wird so breit wie die Kante, mit Abstand 0 cm (beim Durchgang wie heute). Dabei merkt sie sich Breite und Abstand von vorher.
  - **Abhaken**: Die Öffnung bekommt die gemerkte Breite und den gemerkten Abstand zurück. Passen sie nicht mehr auf die Kante oder gibt es keine, bekommt sie die Standardbreite ihrer Art aus den Einstellungen (Werkseinstellung Durchgang 100 cm, Fenster 120 cm), mittig auf der Kante. Ist die Kante höchstens so lang, wird sie halb so breit wie die Kante, mittig.
  - Anhaken und Abhaken sind je ein Rückgängig-Schritt.
- **Gemerkte Maße im Plan**: Jede Öffnung hat ein Feld für die gemerkten Maße (Abstand und Breite oder leer). Nur Durchgänge und Fenster dürfen dort Werte haben, Türen nicht. Die gemerkten Maße werden mit dem Plan gespeichert, exportiert und importiert, sie überstehen also Neuladen und Rundreise über eine Datei.
  - Ändern Breite oder Abstand sich auf anderem Weg (Eingabefelder, Ziehen), werden die gemerkten Maße geleert. So bringt ein späteres Abhaken keine veralteten Werte zurück.
- **BREAKING – Formatversion 10**: Öffnungen haben das Pflichtfeld für die gemerkten Maße. Ältere Pläne bekommen beim Laden und Import automatisch „keine gemerkten Maße“.
- Die Beschriftung bleibt „Ganze Kante“.

## Nicht im Umfang

- Ein Durchgang, der dauerhaft „an die Kante gebunden“ ist und mitwächst oder mitschrumpft, wenn sich die Kantenlänge ändert. Es bleibt bei der heutigen Regel: Die Öffnung behält ihre Maße, und eine Raumänderung, nach der sie nicht mehr passt, wird abgelehnt.
- „Ganze Kante“ für Türen (Türblatt und Aufschlag über eine ganze Wand ergeben keinen Sinn).
- Ein Kästchen-Bauteil aus shadcn/ui. Es wird das native Kästchen benutzt, wie bei „Sichtbar“ in der Vorlage.
- Gemerkte Maße für andere Änderungen (z. B. „Breite zurücksetzen“).

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `room-openings`:
  - Geändert: „Ganze Kante öffnen“ (Kästchen für Durchgang und Fenster, Abhaken stellt die gemerkten Maße wieder her)
  - Neu: „Ersatzmaße beim Abhaken“
  - Geändert: „Eigenschaften einer Öffnung“ (Szenarien „Durchgang im Panel“ und neu „Fenster im Panel“ nennen das Kästchen ohne Haken)
- `plan-data`:
  - Geändert: Formatversion 10 in „Aufbau des Plans“ und „Neuer leerer Plan“
  - Neu: „Gemerkte Maße für Ganze Kante im Plan“
- `plan-import`:
  - Neu: „Dateien der Version 9“ und „Gemerkte Maße aus der Datei“
- `plan-export`:
  - Neu: „Gemerkte Maße in der Exportdatei“

## Impact

- **Voraussetzung**: `app-settings` ist archiviert, `PLAN_SCHEMA_VERSION` ist 9 (`Plan.settings`). `app-settings` hat Version 9 belegt, dieser Change hebt daher auf Version 10.
- **Datenmodell**: `schemaVersion` 9 → 10, `Opening.beforeFullEdge: { offsetCm, widthCm } | null`
- **Geändert in `src/lib/`**:
  - `plan-schema.ts`: Feld `beforeFullEdge`, Regel „nicht bei Türen“, `PLAN_SCHEMA_VERSION = 10`
  - `plan-migration.ts`: Migration 9 → 10, Fixture `plan-v9.json`
  - `opening-fields.ts`: `applyFullEdge` wird zu `isFullEdge`, `toggleFullEdge` und `fallbackOpeningSize`
  - `plan.ts`: `updateOpening` leert die gemerkten Maße bei anderen Maßänderungen
  - `plan-import.ts`: ungültige gemerkte Maße werden ohne Hinweis geleert
- **UI**: `OpeningProperties.tsx` (Kästchen statt Schaltfläche, auch bei Fenstern)
- **Doku**: `docs/design/README.md` (Zeile „Türen und Fenster“)
- **Abhängigkeiten**: keine neuen
