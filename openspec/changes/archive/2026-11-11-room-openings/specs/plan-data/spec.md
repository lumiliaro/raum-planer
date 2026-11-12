# Spec Delta

## ADDED Requirements

### Requirement: Türen und Fenster im Plan
Ab Formatversion 5 SHALL jeder Raum eine Liste seiner Türen und Fenster enthalten (siehe `room-openings`); ein Raum ohne Öffnungen hat eine leere Liste. IDs von Öffnungen MUST im ganzen Plan eindeutig sein. Hinzufügen, Ändern, Verschieben und Löschen einer Öffnung SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen. Die Formatversion des Plans ist 5.

#### Scenario: Raum ohne Öffnungen
- **WHEN** ein Plan mit dem Raum „Flur“ und einer leeren Liste von Öffnungen geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Doppelte ID einer Öffnung
- **WHEN** ein Plan in „Flur“ und in „Bad“ je eine Tür mit derselben ID enthält
- **THEN** gilt der Plan als ungültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Tür um 20 cm verschoben wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“) und je Etage eine geordnete Liste von Formen. Jede Form, jeder Raum und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 5.

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
Das System SHALL einen neuen Plan mit Formatversion 5, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage, eine leere Raumliste und eine leere Formenliste haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 5 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Raumliste, eine leere Formenliste und keine Vorlage

### Requirement: Räume im Plan
Ein Plan SHALL ab Formatversion 4 je Etage eine geordnete Liste von Räumen enthalten (siehe `floor-rooms`); eine Etage ohne Räume hat eine leere Liste. Jeder Raum MUST genau einer Etage des Plans gehören, und Raum-IDs MUST im ganzen Plan eindeutig sein. Ein neuer leerer Plan SHALL für seine Etage eine leere Raumliste haben.

#### Scenario: Räume je Etage
- **GIVEN** ein Plan mit zwei Räumen im Erdgeschoss und keinem im Obergeschoss
- **WHEN** die Räume des Obergeschosses abgefragt werden
- **THEN** ist die Liste leer
- **AND** die beiden Räume des Erdgeschosses sind unverändert vorhanden

#### Scenario: Raum unter unbekannter Etage
- **WHEN** ein Plan einen Raum unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Doppelte Raum-ID
- **WHEN** ein Plan im Erdgeschoss und im Obergeschoss je einen Raum mit derselben ID enthält
- **THEN** gilt der Plan als ungültig
