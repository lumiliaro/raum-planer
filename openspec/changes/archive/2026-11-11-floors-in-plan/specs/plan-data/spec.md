# Spec Delta

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Kalibrierung und je Etage eine geordnete Liste von Formen. Jede Form und jede Kalibrierung MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 2.

#### Scenario: Formen je Etage
- **GIVEN** ein Plan mit zwei Formen im Erdgeschoss und einer Form im Obergeschoss
- **WHEN** die Formen des Dachgeschosses abgefragt werden
- **THEN** ist die Liste des Dachgeschosses leer
- **AND** die Formen von Erdgeschoss und Obergeschoss sind unverändert vorhanden

#### Scenario: Unbekannte Etage
- **WHEN** ein Plan Formen unter einer Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Etagen ohne Kalibrierung
- **WHEN** ein Plan nur für das Erdgeschoss eine Kalibrierung enthält
- **THEN** gilt der Plan als gültig
- **AND** Obergeschoss und Dachgeschoss gelten als nicht kalibriert

#### Scenario: Kalibrierung einer unbekannten Etage
- **WHEN** ein Plan eine Kalibrierung unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Aktive Etage fehlt
- **WHEN** ein Plan als aktive Etage eine Kennung nennt, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

### Requirement: Neuer leerer Plan
Das System SHALL einen neuen Plan mit Formatversion 2, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Kalibrierung und eine leere Formenliste haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 2 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Formenliste und ist nicht kalibriert

### Requirement: Änderungszeitpunkt
Das System SHALL den Änderungszeitpunkt des Plans bei jedem Hinzufügen, Ändern, Löschen oder Umordnen einer Form, beim Setzen einer Kalibrierung und beim Anlegen, Umbenennen, Sortieren oder Löschen einer Etage auf den aktuellen Zeitpunkt setzen. Das Umschalten der aktiven Etage und abgelehnte Änderungen MUST den Änderungszeitpunkt nicht verändern.

#### Scenario: Form hinzugefügt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Form hinzugefügt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Kalibrierung gesetzt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Kalibrierung für das Erdgeschoss gesetzt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage umbenannt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Etage „Neue Etage“ in „Keller“ umbenannt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage gewechselt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** der Nutzer ins Obergeschoss wechselt
- **THEN** bleibt der Änderungszeitpunkt 01.11.2026, 10:00 Uhr
