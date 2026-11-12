## ADDED Requirements

### Requirement: Wanddicken in der Exportdatei
Die Exportdatei SHALL bei jedem Raum die Wanddicke jeder Kante in cm in der Reihenfolge der Kanten enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten Wanddicken übernommen werden.

#### Scenario: Außenwand in der Datei
- **GIVEN** der Raum „Wohnen“ hat vier Kanten mit den Wanddicken 36,5 cm, 15 cm, 15 cm und 36,5 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** „Wohnen“ hat danach wieder die Wanddicken 36,5 cm, 15 cm, 15 cm und 36,5 cm
