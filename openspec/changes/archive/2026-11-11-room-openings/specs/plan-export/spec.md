# Spec Delta

## ADDED Requirements

### Requirement: Türen und Fenster in der Exportdatei
Die Exportdatei SHALL bei jedem Raum seine Türen und Fenster mit Art, Kante, Abstand und Breite in cm und dem Aufschlag enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit allen Öffnungen übernommen werden.

#### Scenario: Tür in der Datei
- **GIVEN** der Raum „Wohnen“ hat auf seiner ersten Kante eine Tür mit Breite 80 cm, Abstand 160 cm, Anschlag links und Aufschlag nach innen
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei beim Raum „Wohnen“ diese Tür mit genau diesen Werten

#### Scenario: Rundreise mit Öffnungen
- **GIVEN** ein Plan mit einer Tür mit Anschlag links, die nach außen öffnet, und einem Fenster mit Breite 120 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import sind Tür und Fenster unverändert vorhanden
