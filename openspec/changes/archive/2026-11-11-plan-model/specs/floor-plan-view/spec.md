# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Start mit dem Erdgeschoss`
- TO: `### Requirement: Start mit der zuletzt aktiven Etage`

## MODIFIED Requirements

### Requirement: Start mit der zuletzt aktiven Etage
Das System SHALL beim Start die Etage als aktive Etage anzeigen, die im gespeicherten Plan zuletzt aktiv war. Gibt es keinen gespeicherten Plan oder ist er unlesbar, MUST die erste Etage der Konfiguration (Erdgeschoss) aktiv sein.

#### Scenario: App-Start
- **GIVEN** in diesem Browser ist kein Plan gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Erdgeschoss“ im Umschalter aktiv markiert
- **AND** die Zeichenfläche zeigt den Grundriss des Erdgeschosses

#### Scenario: App-Start nach Arbeit im Dachgeschoss
- **GIVEN** der Nutzer hat zuletzt im Dachgeschoss gearbeitet
- **WHEN** er die Seite neu lädt
- **THEN** ist „Dachgeschoss“ im Umschalter aktiv markiert
- **AND** die Zeichenfläche zeigt den Grundriss des Dachgeschosses
