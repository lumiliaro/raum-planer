## ADDED Requirements

### Requirement: Raumfarbe in der Exportdatei
Die Exportdatei SHALL bei jedem Raum seine Raumfarbe als `#RRGGBB` oder als leeren Wert für „Standard“ enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten Raumfarben übernommen werden.

#### Scenario: Rundreise mit Farben
- **GIVEN** „Kind 1“ hat die Raumfarbe #BBF7D0 und „Flur“ keine Raumfarbe
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** „Kind 1“ hat die Raumfarbe #BBF7D0 und „Flur“ keine
