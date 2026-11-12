# Spec Delta

## MODIFIED Requirements

### Requirement: Kopfleiste
Die Kopfleiste SHALL links den App-Namen „Raumplaner“, mittig den Etagen-Umschalter mit der Icon-Schaltfläche „Etagen bearbeiten“ rechts daneben und rechts die Schaltflächen „Importieren“, „Exportieren“ und „PDF“ mit Icon und Text, danach die Icon-Schaltfläche „Einstellungen“ (Zahnrad) und ganz rechts die Icon-Schaltfläche „Hilfe“ (Fragezeichen) zeigen. Während des Kalibrier-Modus MUST „Etagen bearbeiten“, „Importieren“, „Exportieren“, „PDF“ und „Einstellungen“ ausgeblendet sein; „Hilfe“ MUST sichtbar bleiben.

#### Scenario: Inhalt der Kopfleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links in der Kopfleiste „Raumplaner“
- **AND** der Etagen-Umschalter steht mittig in der Kopfleiste, rechts daneben „Etagen bearbeiten“ mit deutschem Tooltip
- **AND** rechts stehen „Importieren“, „Exportieren“ und „PDF“, danach „Einstellungen“ mit dem Tooltip „Einstellungen“
- **AND** ganz rechts steht „Hilfe“ mit dem Tooltip „Hilfe und Tastenkürzel (?)“

#### Scenario: Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus ist aktiv
- **WHEN** der Nutzer auf die Kopfleiste schaut
- **THEN** sind „Etagen bearbeiten“, „Importieren“, „Exportieren“, „PDF“ und „Einstellungen“ nicht zu sehen
- **AND** rechts steht stattdessen „Kalibrierung beenden“, ganz rechts daneben „Hilfe“
