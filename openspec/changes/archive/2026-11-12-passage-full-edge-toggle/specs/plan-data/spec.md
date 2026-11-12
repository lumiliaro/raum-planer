## ADDED Requirements

### Requirement: Gemerkte Maße für Ganze Kante im Plan
Ab Formatversion 10 SHALL jede Öffnung gemerkte Maße für „Ganze Kante“ enthalten (siehe `room-openings`): einen Abstand von mindestens 0 cm und eine Breite größer als 0 cm, oder einen leeren Wert. Nur Durchgänge und Fenster MUST gemerkte Maße haben dürfen, Türen nicht. Ob die gemerkten Maße auf die Kante passen, MUST NOT geprüft werden; das geschieht erst beim Abhaken.

#### Scenario: Durchgang mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem ein Durchgang mit Breite 500 cm und Abstand 0 cm die gemerkten Maße Breite 100 cm und Abstand 200 cm hat
- **THEN** gilt er als gültig

#### Scenario: Fenster mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem ein Fenster mit Breite 500 cm und Abstand 0 cm die gemerkten Maße Breite 120 cm und Abstand 190 cm hat
- **THEN** gilt er als gültig

#### Scenario: Tür mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem eine Tür die gemerkten Maße Breite 80 cm und Abstand 100 cm hat
- **THEN** gilt er als ungültig

#### Scenario: Öffnung ohne gemerkte Maße
- **WHEN** ein Plan mit einer Tür und einem Durchgang geprüft wird, die beide keine gemerkten Maße haben
- **THEN** gilt er als gültig

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“), je Etage eine geordnete Liste von Formen und die Einstellungen des Plans (siehe `app-settings`). Jede Form, jeder Raum und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 10.

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
Das System SHALL einen neuen Plan mit Formatversion 10, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage, eine leere Raumliste und eine leere Formenliste haben, und der Plan MUST die Werkseinstellungen haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 10 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Raumliste, eine leere Formenliste und keine Vorlage
- **AND** der Plan hat die Werkseinstellungen, z. B. Wanddicke neuer Räume 15 cm
