## MODIFIED Requirements

### Requirement: Raumänderungen als Schritte
Einen Raum zeichnen (ab dem Schließen), verschieben (vom Drücken bis zum Loslassen), umbenennen, eine Kantenlänge ändern, eine Wanddicke ändern und löschen SHALL je genau einen Schritt bilden. Das Setzen einzelner Eckpunkte während des Zeichnens MUST keinen Schritt bilden, und Strg+Z MUST während des Zeichnens wirkungslos sein.

#### Scenario: Kante rückgängig
- **GIVEN** der Nutzer hat Kante 1 von „Wohnen“ von 337,5 cm auf 350 cm geändert
- **WHEN** er Strg+Z drückt
- **THEN** ist Kante 1 wieder 337,5 cm lang

#### Scenario: Wanddicke rückgängig
- **GIVEN** der Nutzer hat die Wanddicke von Kante 1 von „Wohnen“ von 15 cm auf 36,5 cm geändert und danach „Flur“ ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** hat Kante 1 von „Wohnen“ wieder 15 cm Wanddicke
- **AND** „Wohnen“ ist ausgewählt

#### Scenario: Gezeichneter Raum rückgängig
- **GIVEN** der Nutzer hat einen Raum mit vier Eckpunkten gezeichnet und geschlossen
- **WHEN** er einmal Strg+Z drückt
- **THEN** ist der ganze Raum verschwunden
