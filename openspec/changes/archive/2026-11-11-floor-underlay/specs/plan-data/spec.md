# Spec Delta

## ADDED Requirements

### Requirement: Gültige Vorlage
Eine Vorlage SHALL enthalten: einen Verweis auf ihr Bild oder die Angabe „kein Bild“, Breite und Höhe des Bilds in Pixeln (ganze Zahlen größer als 0, oder beide unbekannt), eine Kalibrierung oder „nicht kalibriert“, die Angabe „Sichtbar“ und eine Deckkraft von 0,1 bis 1. Eine Vorlage mit Bild MUST bekannte Bildmaße haben.

#### Scenario: Vorlage ohne Bild
- **WHEN** eine Vorlage ohne Bild, mit unbekannten Bildmaßen, einer Kalibrierung mit 0,9986 px/cm, sichtbar und mit Deckkraft 1 geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Deckkraft zu gering
- **WHEN** eine Vorlage mit Deckkraft 0,05 geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Bild ohne Maße
- **WHEN** eine Vorlage mit Bild, aber unbekannten Bildmaßen geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Vorlage setzen und entfernen
Das System SHALL die Vorlage einer Etage setzen, ändern und entfernen können; Vorlagen anderer Etagen und alle Formen MUST unverändert bleiben. Eine ungültige Vorlage oder eine Etage, die nicht im Plan steht, MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Vorlage entfernen
- **GIVEN** Erdgeschoss und Obergeschoss haben je eine Vorlage
- **WHEN** die Vorlage des Erdgeschosses entfernt wird
- **THEN** hat das Erdgeschoss keine Vorlage
- **AND** die Vorlage des Obergeschosses und die Formen aller Etagen sind unverändert

#### Scenario: Unbekannte Etage
- **WHEN** für die Kennung „keller“, die nicht im Plan steht, eine Vorlage gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`) und je Etage eine geordnete Liste von Formen. Jede Form und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 3.

#### Scenario: Formen je Etage
- **GIVEN** ein Plan mit zwei Formen im Erdgeschoss und einer Form im Obergeschoss
- **WHEN** die Formen des Dachgeschosses abgefragt werden
- **THEN** ist die Liste des Dachgeschosses leer
- **AND** die Formen von Erdgeschoss und Obergeschoss sind unverändert vorhanden

#### Scenario: Unbekannte Etage
- **WHEN** ein Plan Formen unter einer Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Etagen ohne Kalibrierung
- **WHEN** ein Plan für das Erdgeschoss eine kalibrierte Vorlage und für das Obergeschoss eine Vorlage ohne Kalibrierung enthält
- **THEN** gilt der Plan als gültig
- **AND** das Obergeschoss gilt als nicht kalibriert und das Dachgeschoss hat keine Vorlage

#### Scenario: Kalibrierung einer unbekannten Etage
- **WHEN** ein Plan eine Vorlage samt Kalibrierung unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Aktive Etage fehlt
- **WHEN** ein Plan als aktive Etage eine Kennung nennt, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

### Requirement: Neuer leerer Plan
Das System SHALL einen neuen Plan mit Formatversion 3, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage und eine leere Formenliste haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 3 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Formenliste und keine Vorlage

### Requirement: Gültige Kalibrierung
Eine Kalibrierung SHALL zwei Punkte in Pixeln des Vorlagenbilds, die reale Länge zwischen ihnen in cm, den Maßstab in Bildpixeln je cm und optional eine Ausrichtung „waagerecht“ oder „senkrecht“ enthalten. Die Koordinaten der Punkte MUST mindestens 0 px sein; reale Länge und Maßstab MUST größer als 0 sein.

#### Scenario: Gültige Kalibrierung
- **WHEN** eine Kalibrierung mit P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm und 0,9986 px/cm geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Mit Ausrichtung
- **WHEN** dieselbe Kalibrierung mit der Ausrichtung „waagerecht“ geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Maßstab 0
- **WHEN** eine Kalibrierung mit dem Maßstab 0 px/cm geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Unbekannte Ausrichtung
- **WHEN** eine Kalibrierung mit der Ausrichtung „schräg“ geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Kalibrierung setzen
Das System SHALL die Kalibrierung der Vorlage einer Etage setzen und dabei eine vorhandene Kalibrierung dieser Vorlage ersetzen. Bild, Sichtbarkeit und Deckkraft der Vorlage, Vorlagen anderer Etagen und alle Formen MUST unverändert bleiben. Eine ungültige Kalibrierung oder eine Etage ohne Vorlage MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Kalibrierung ersetzen
- **GIVEN** die Vorlagen von Erdgeschoss und Obergeschoss sind kalibriert, das Erdgeschoss mit 0,7480 px/cm
- **WHEN** für das Erdgeschoss eine Kalibrierung mit 0,9986 px/cm gesetzt wird
- **THEN** hat das Erdgeschoss den Maßstab 0,9986 px/cm
- **AND** die Kalibrierung des Obergeschosses und die Formen aller Etagen sind unverändert

#### Scenario: Ungültige Kalibrierung
- **WHEN** für das Erdgeschoss eine Kalibrierung mit der realen Länge 0 cm gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

#### Scenario: Etage ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** für den Keller eine Kalibrierung gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

### Requirement: Änderungszeitpunkt
Das System SHALL den Änderungszeitpunkt des Plans bei jedem Hinzufügen, Ändern, Löschen oder Umordnen einer Form, beim Setzen, Ändern oder Entfernen einer Vorlage einschließlich ihrer Kalibrierung, Sichtbarkeit und Deckkraft und beim Anlegen, Umbenennen, Sortieren oder Löschen einer Etage auf den aktuellen Zeitpunkt setzen. Das Umschalten der aktiven Etage und abgelehnte Änderungen MUST den Änderungszeitpunkt nicht verändern.

#### Scenario: Form hinzugefügt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Form hinzugefügt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Kalibrierung gesetzt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Kalibrierung für das Erdgeschoss gesetzt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Vorlage ausgeblendet
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Vorlage des Erdgeschosses ausgeblendet wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage umbenannt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Etage „Neue Etage“ in „Keller“ umbenannt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage gewechselt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** der Nutzer ins Obergeschoss wechselt
- **THEN** bleibt der Änderungszeitpunkt 01.11.2026, 10:00 Uhr
