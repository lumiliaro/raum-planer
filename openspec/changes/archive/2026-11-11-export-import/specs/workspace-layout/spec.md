# Spec Delta

## MODIFIED Requirements

### Requirement: Kopfleiste
Die Kopfleiste SHALL links den App-Namen „Raumplaner“, mittig den Etagen-Umschalter und rechts die Schaltflächen „Importieren“ und „Exportieren“ mit Icon und Text zeigen. Während des Kalibrier-Modus MUST „Importieren“ und „Exportieren“ ausgeblendet sein.

#### Scenario: Inhalt der Kopfleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links in der Kopfleiste „Raumplaner“
- **AND** der Etagen-Umschalter steht mittig in der Kopfleiste
- **AND** rechts stehen „Importieren“ und „Exportieren“

#### Scenario: Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus ist aktiv
- **WHEN** der Nutzer auf die Kopfleiste schaut
- **THEN** sind „Importieren“ und „Exportieren“ nicht zu sehen
- **AND** rechts steht stattdessen „Kalibrierung beenden“
