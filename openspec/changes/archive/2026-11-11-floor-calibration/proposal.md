# Proposal

## Why

Ohne Maßstab (`pxPerCm`) kann keine Möbelform in Zentimetern dargestellt werden – die Kalibrierung blockiert damit alle folgenden Changes. Bisher war geplant, die mit einem Werkzeug ermittelten Werte von Hand in `src/config/house.ts` einzutragen. Das ist umständlich und passt nicht dazu, dass die Kalibrierung zur Planung gehört und mit ihr gesichert und weitergegeben werden soll. Das Werkzeug ermittelt den Maßstab deshalb und speichert ihn selbst im Browser; später wird er Teil des Plans und damit der Exportdatei.

## What Changes

- **Werkzeugleiste** links neben der Zeichenfläche (52 px breit, wie im Design-Entwurf). In diesem Change enthält sie nur die Schaltfläche „Etage kalibrieren“ am unteren Ende; die Form-Werkzeuge folgen in späteren Changes.
- **Kalibrier-Modus** für die aktive Etage nach dem Design-Entwurf („Kalibrier-Modus“):
  - Hinweisleiste unter der Kopfleiste, „Kalibrierung beenden“ rechts in der Kopfleiste,
  - rechts ein Kalibrier-Panel anstelle des Eigenschaften-Panels mit den Schritten Punkt 1, Punkt 2, reale Länge in cm,
  - zwei Klicks auf den Grundriss setzen P1 und P2 (in Originalpixeln des PNG); die Messstrecke wird mit Länge in px angezeigt,
  - P1 und P2 lassen sich nachträglich mit der Maus verschieben, das Ergebnis aktualisiert sich sofort; „Punkte neu setzen“ beginnt von vorn,
  - Zoomen und Verschieben der Ansicht funktionieren weiter, damit Punkte genau gesetzt werden können.
- **Ergebnis**: `pxPerCm` mit deutschem Dezimalkomma und „Raster 1 m entspricht … px“.
- **Speichern**: Schaltfläche „Kalibrierung speichern“ legt die Kalibrierung der aktiven Etage im Browser ab (`localStorage`, Schlüssel `raumplaner.calibration`) und beendet den Modus. Die Statusleiste zeigt danach den gespeicherten Maßstab, auch nach dem Neuladen.
- **Erneut kalibrieren**: Ist für eine Etage schon eine Kalibrierung gespeichert, sind Punkte und Länge beim Start des Modus (und beim Etagenwechsel im Modus) damit vorbelegt.
- **BREAKING** `src/config/house.ts`: Das Feld `calibration` entfällt aus `FloorConfig`; die Haus-Konfiguration beschreibt nur noch die festen Etagen. Eingetragene Werte gehen verloren und werden mit dem Werkzeug neu gemessen.
- Reine Logik in `src/lib/calibration.ts` (Abstand, Ergebnis berechnen und runden, Länge mit Dezimalkomma einlesen und ausgeben), Zod-Schema in `src/lib/calibration-schema.ts`, Lesen/Schreiben im Browser in `src/lib/calibration-storage.ts`, jeweils mit Vitest-Tests.

## Nicht im Umfang

- Export und Import der Kalibrierung. Sie kommen mit `plan-model` (Kalibrierung wird Teil des Plans, Übernahme aus `raumplaner.calibration`) und `export-import` (Kalibrierung in der Exportdatei).
- Löschen einer gespeicherten Kalibrierung, Nachfrage vor dem Überschreiben, Rückgängig/Wiederholen des Speicherns.
- Kein Einrasten waagrecht/senkrecht mit Umschalt.
- Kein Messwerkzeug zum Nachprüfen von Strecken, keine Zeigerposition in cm in der Statusleiste.
- Keine Form-Werkzeuge in der Werkzeugleiste, kein Werkzeug „Ansicht verschieben“.

## Capabilities

### New Capabilities
- `floor-calibration`: Ermitteln des Maßstabs einer Etage über zwei Punkte im Grundriss und eine bekannte Länge und Speichern dieses Maßstabs im Browser.

### Modified Capabilities
- `workspace-layout`: Der Aufbau der Arbeitsoberfläche erhält links neben der Zeichenfläche eine Werkzeugleiste.

## Impact

- Neu: `src/lib/calibration.ts`, `src/lib/calibration-schema.ts`, `src/lib/calibration-storage.ts` (+ Tests), Komponenten `ToolBar`, `CalibrationBanner`, `CalibrationPanel`, Kalibrier-Overlay auf der Konva-Stage.
- Geändert: `src/store/app-store.ts` (gespeicherte Kalibrierungen, Entwurf und Aktionen), `AppShell`, `HeaderBar`, `StatusBar` (Maßstab aus dem Store), `FloorCanvas` (Klick setzt Punkt, Overlay-Ebene), `src/lib/format.ts` (Pixelkoordinaten).
- `src/config/house.ts`: Feld `calibration` und die Typen `Calibration`/`ImagePoint` entfallen dort (Typen kommen aus dem Schema).
- Abhängigkeiten: keine neuen (Zod und `lucide-react` sind vorhanden).
- Datenmodell und `schemaVersion`: In diesem Change gibt es noch kein `Plan`-Modell; die Kalibrierung liegt vorerst unter eigenem Schlüssel. `plan-model` nimmt sie als `calibrationByFloor` in den Plan auf – da `plan-model` noch nicht umgesetzt ist, gehört das Feld direkt zu `schemaVersion` 1.
- Folgeanpassungen in den offenen Changes `plan-model`, `export-import`, `basic-shapes`, `more-shapes` und `editing-extras` (Maßstab aus dem Plan statt aus `house.ts`).
