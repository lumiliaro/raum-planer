## ADDED Requirements

### Requirement: Durchgänge im Plan
Ab Formatversion 7 SHALL eine Öffnung eines Raums auch die Art „Durchgang“ haben können (siehe `room-openings`). Für Durchgänge gelten dieselben Regeln wie für Fenster: kein Aufschlag, planweit eindeutige ID, Breite und Abstand passen auf die Kante.

#### Scenario: Raum mit Durchgang
- **WHEN** ein Plan mit dem Raum „Eltern“ geprüft wird, der auf einer 330 cm langen Kante einen Durchgang mit Breite 100 cm und Abstand 210 cm ohne Aufschlag hat
- **THEN** gilt er als gültig

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“) und je Etage eine geordnete Liste von Formen. Jede Form, jeder Raum und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 7.

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
Das System SHALL einen neuen Plan mit Formatversion 7, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage, eine leere Raumliste und eine leere Formenliste haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 7 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Raumliste, eine leere Formenliste und keine Vorlage
