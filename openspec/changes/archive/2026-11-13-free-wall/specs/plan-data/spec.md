# Spec Delta

## MODIFIED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“), je Etage eine geordnete Liste von Wänden (siehe „Wände im Plan“), je Etage eine geordnete Liste von Formen und die Einstellungen des Plans (siehe `app-settings`). Jede Form, jeder Raum, jede Wand und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 12.

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

## ADDED Requirements

### Requirement: Wände im Plan
Ein Plan SHALL ab Formatversion 12 je Etage eine geordnete Liste von Wänden enthalten (siehe `floor-walls`); eine Etage ohne Wände hat eine leere Liste, und ein neuer leerer Plan sowie eine neue Etage SHALL eine leere Wandliste haben. Wand-IDs MUST im ganzen Plan eindeutig sein. Jede Änderung an einer Wand SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Wände je Etage
- **GIVEN** ein Plan mit einer Wand im Erdgeschoss und keiner im Obergeschoss
- **WHEN** die Wände des Obergeschosses abgefragt werden
- **THEN** ist die Liste leer
- **AND** die Wand des Erdgeschosses ist unverändert vorhanden

#### Scenario: Wand unter unbekannter Etage
- **WHEN** ein Plan eine Wand unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Wandliste fehlt
- **WHEN** ein Plan der Formatversion 12 geprüft wird, dem für das Erdgeschoss die Wandliste fehlt
- **THEN** gilt er als ungültig

#### Scenario: Doppelte Wand-ID
- **WHEN** ein Plan im Erdgeschoss und im Obergeschoss je eine Wand mit derselben ID enthält
- **THEN** gilt der Plan als ungültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 13.11.2026 um 09:15 Uhr eine Wand gezeichnet wird
- **THEN** ist der Änderungszeitpunkt 13.11.2026, 09:15 Uhr
