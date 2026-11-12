# Spec Delta

## MODIFIED Requirements

### Requirement: Aufbau der Arbeitsoberfläche
Das System SHALL das Browserfenster ohne Seiten-Scrollen vollständig ausfüllen und aufteilen in: Kopfleiste oben, Statusleiste unten, dazwischen von links nach rechts die Werkzeugleiste, die Zeichenfläche und das Eigenschaften-Panel.

#### Scenario: Bereiche sichtbar
- **WHEN** die App in einem Desktop-Browserfenster geöffnet wird
- **THEN** sind Kopfleiste, Werkzeugleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste sichtbar
- **AND** die Seite selbst hat keinen Scrollbalken

#### Scenario: Werkzeugleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links neben der Zeichenfläche eine schmale, senkrechte Werkzeugleiste
- **AND** an ihrem unteren Ende befindet sich die Schaltfläche „Etage kalibrieren“ mit deutschem Tooltip
