# Spec Delta

## ADDED Requirements

### Requirement: Räume im Plan
Ein Plan SHALL ab Formatversion 4 je Etage eine geordnete Liste von Räumen enthalten (siehe `floor-rooms`); eine Etage ohne Räume hat eine leere Liste. Jeder Raum MUST genau einer Etage des Plans gehören, und Raum-IDs MUST im ganzen Plan eindeutig sein. Ein neuer leerer Plan SHALL für seine Etage eine leere Raumliste haben. Die Formatversion des Plans ist 4.

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

### Requirement: Räume ändern
Das System SHALL einen gültigen Raum zu einer Etage hinzufügen und Name oder Eckpunkte eines Raums ändern, ohne seine ID zu verändern. Eine Änderung, nach der der Raum ungültig wäre, oder ein Raum mit bereits vergebener ID MUST abgelehnt werden; der Plan bleibt dann unverändert. Hinzufügen, Ändern, Verschieben und Löschen eines Raums SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Ungültige Änderung
- **GIVEN** ein Raum mit vier Eckpunkten
- **WHEN** seine Eckpunkte durch zwei Punkte ersetzt werden sollen
- **THEN** wird die Änderung abgelehnt und der Raum ist unverändert

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr ein Raum umbenannt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr
