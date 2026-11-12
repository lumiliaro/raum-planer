# Spec Delta

## ADDED Requirements

### Requirement: Räume in der Exportdatei
Die Exportdatei SHALL je Etage die Räume in ihrer Reihenfolge mit ID, Name und allen Eckpunkten in cm enthalten, auch eine leere Raumliste für Etagen ohne Räume. Ein exportierter Plan mit Räumen MUST beim Import ohne Warnung mit unveränderten Räumen übernommen werden.

#### Scenario: Raum in der Datei
- **GIVEN** das Erdgeschoss hat den Raum „Wohnen“ mit den Eckpunkten (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm)
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei für das Erdgeschoss den Raum „Wohnen“ mit diesen vier Eckpunkten

#### Scenario: Rundreise mit Räumen
- **GIVEN** ein Plan mit zwei Räumen im Erdgeschoss und einem im Keller
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import sind die drei Räume gleich den exportierten
