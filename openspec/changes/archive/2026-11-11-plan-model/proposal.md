# Proposal

## Why

Bisher gibt es nur Etagen und Grundrisse, aber keinen Ort, an dem Möbelformen leben. Jede folgende Funktion – Form-Werkzeuge, Eigenschaften-Panel, Export/Import, Undo – braucht dasselbe verbindliche Datenmodell (`Plan`, `Shape`) und einen Plan, der einen Neustart des Browsers übersteht. Auch die Kalibrierung der Etagen gehört zur Planung: `floor-calibration` speichert sie vorerst unter einem eigenen Schlüssel, damit sie bis hierher nutzbar ist; mit diesem Change wird sie Teil des Plans und damit später der Exportdatei. Dieses Fundament kommt deshalb vor dem ersten Form-Werkzeug.

## What Changes

- **Zod-Schema für den Plan** in `src/lib/`: `Plan` (schemaVersion 1, Name, Zeitstempel, aktive Etage, Kalibrierung je Etage, Formen je Etage) und `Shape` als diskriminierte Union über `kind` mit allen sieben Formtypen (`rect`, `ellipse`, `l-shape`, `u-shape`, `corner`, `door-swing`, `polygon`). Die TypeScript-Typen werden aus dem Schema abgeleitet. Das Schema prüft auch Plausibilität (z. B. Maße > 0 cm, Eckradius nicht größer als die halbe kürzere Seite).
- **Reine Plan-Funktionen** in `src/lib/`: leeren Plan anlegen, Form hinzufügen, ändern, löschen, in der Zeichenreihenfolge nach vorne/hinten bzw. ganz nach vorne/hinten verschieben, Kalibrierung einer Etage setzen. Ungültige Änderungen lassen den Plan unverändert.
- **Plan im zentralen Store**: `useAppStore` erhält den Plan und Aktionen, die diese Funktionen nutzen. Die aktive Etage wandert aus dem bisherigen UI-Zustand in `plan.activeFloorId`, die gespeicherten Kalibrierungen aus `calibrations` in `plan.calibrationByFloor`.
- **Kalibrierung im Plan**: „Kalibrierung speichern“ schreibt in den Plan; gespeichert wird sie mit dem Plan. Scheitert das Speichern, zeigt das wie bei Formen der allgemeine Speicherstatus; der eigene Hinweis im Kalibrier-Panel entfällt.
- **Übernahme der bisherigen Kalibrierung**: Beim ersten Start ohne gespeicherten Plan übernimmt der neue Plan die Kalibrierungen aus `raumplaner.calibration`; der Schlüssel wird nach dem erfolgreichen Speichern des Plans entfernt.
- **Automatisches Speichern** im `localStorage` (kurz verzögert nach jeder Änderung und beim Verlassen der Seite) und **Wiederherstellen beim Start** – einschließlich der zuletzt aktiven Etage.
- **Unlesbarer gespeicherter Plan**: Die Rohdaten werden unter einem Sicherungsschlüssel abgelegt, die App startet mit einem leeren Plan und zeigt eine Hinweisleiste unter der Kopfleiste mit „Schließen“.
- **Speicherstatus** rechts in der Statusleiste: „Lokal gespeichert“ bzw. eine Warnung, wenn das Speichern scheitert.
- **BREAKING** (Verhalten): Die App startet nicht mehr immer im Erdgeschoss, sondern auf der zuletzt aktiven Etage.

## Nicht im Umfang

- Keine Form-Werkzeuge, kein Zeichnen von Formen auf der Zeichenfläche, keine Auswahl, kein Eigenschaften-Formular. Nach diesem Change sind noch keine Formen sichtbar.
- Keine Umriss-Berechnung `getOutlineCm` – sie kommt je Formtyp mit dem jeweiligen Form-Werkzeug.
- Keine Standardmaße/Vorlagen für neue Formen.
- Kein Löschen einer Kalibrierung.
- Kein Export/Import als Datei, keine Migration zwischen `schemaVersion`s (ein gespeicherter Plan mit anderer Version gilt vorerst als unlesbar und wird gesichert).
- Keine Anzeige und kein Umbenennen des Plannamens in der Kopfleiste; der Name bleibt vorerst intern („Meine Planung“).
- Keine Oberfläche, um einen gesicherten Plan wiederherzustellen; die Sicherung liegt nur im Browser-Speicher.
- Kein Undo/Redo (zundo), kein Abgleich zwischen mehreren offenen Tabs (der zuletzt speichernde Tab gewinnt).

## Capabilities

### New Capabilities
- `plan-data`: Aufbau und Gültigkeitsregeln des Plans und seiner Formen, Zeichenreihenfolge und die Grundoperationen zum Hinzufügen, Ändern, Löschen und Umordnen von Formen.
- `plan-persistence`: Automatisches Speichern des Plans im Browser, Wiederherstellen beim Start, Umgang mit unlesbaren Daten und Anzeige des Speicherstatus.

### Modified Capabilities
- `floor-plan-view`: Die Anforderung „Start mit dem Erdgeschoss“ wird zu „Start mit der zuletzt aktiven Etage“; das Erdgeschoss gilt nur noch, wenn kein Plan gespeichert ist.
- `floor-calibration`: Gespeichert wird in den Plan statt unter einem eigenen Schlüssel; die Anforderung zum Speichern bei blockiertem Browser-Speicher entfällt zugunsten des allgemeinen Speicherstatus. Setzt voraus, dass `floor-calibration` vorher archiviert ist.

## Impact

- Neu: `src/lib/plan-schema.ts`, `src/lib/plan.ts`, `src/lib/plan-storage.ts` (jeweils mit Vitest-Test), Komponente `PlanRecoveryBanner`.
- Geändert: `src/store/app-store.ts` (Plan, Aktionen, Speicherstatus, Autosave; `activeFloorId` und `calibrations` entfallen zugunsten von `plan.activeFloorId` und `plan.calibrationByFloor`, `saveFailed` im Kalibrier-Entwurf entfällt), `FloorSwitcher`, `FloorCanvas`, `StatusBar`, `AppShell`, `CalibrationPanel`, `src/lib/calibration-storage.ts` (nur noch Lesen und Entfernen des alten Schlüssels), `src/store/app-store.test.ts`.
- Aufbauend auf `floor-calibration` (umgesetzt): `CalibrationSchema` aus `src/lib/calibration-schema.ts` wird im `PlanSchema` verwendet.
- Abhängigkeiten: keine neuen (Zod und Zustand sind bereits installiert).
- Datenmodell: führt `Plan` mit `schemaVersion` 1 ein – die erste Fassung des Datenformats, einschließlich `calibrationByFloor`.
