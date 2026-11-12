## ADDED Requirements

### Requirement: Sperre eines Raums im Plan
Ab Formatversion 11 SHALL jeder Raum angeben, ob er gesperrt ist (siehe `floor-rooms`). Ein neu gezeichneter Raum MUST nicht gesperrt sein. Sperren und Entsperren eines Raums SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Gesperrter Raum
- **WHEN** ein Plan geprüft wird, in dem der Raum „Flur“ gesperrt ist
- **THEN** gilt er als gültig

#### Scenario: Raum ohne Sperrangabe
- **WHEN** ein Plan der Formatversion 11 geprüft wird, in dem beim Raum „Flur“ die Angabe zur Sperre fehlt
- **THEN** gilt er als ungültig

#### Scenario: Neuer Raum
- **WHEN** der Nutzer einen Raum mit dem Werkzeug „Raum“ zeichnet und schließt
- **THEN** ist der neue Raum nicht gesperrt

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 12.11.2026 um 18:30 Uhr der Raum „Bad“ gesperrt wird
- **THEN** ist der Änderungszeitpunkt 12.11.2026, 18:30 Uhr

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“), je Etage eine geordnete Liste von Formen und die Einstellungen des Plans (siehe `app-settings`). Jede Form, jeder Raum und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 11.

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
Das System SHALL einen neuen Plan mit Formatversion 11, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage, eine leere Raumliste und eine leere Formenliste haben, und der Plan MUST die Werkseinstellungen haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 11 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Raumliste, eine leere Formenliste und keine Vorlage
- **AND** der Plan hat die Werkseinstellungen, z. B. Wanddicke neuer Räume 15 cm
