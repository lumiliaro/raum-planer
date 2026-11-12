# Spec Delta

## ADDED Requirements

### Requirement: Raumänderungen als Schritte
Einen Raum zeichnen (ab dem Schließen), verschieben (vom Drücken bis zum Loslassen), umbenennen, eine Kantenlänge ändern und löschen SHALL je genau einen Schritt bilden. Das Setzen einzelner Eckpunkte während des Zeichnens MUST keinen Schritt bilden, und Strg+Z MUST während des Zeichnens wirkungslos sein.

#### Scenario: Kante rückgängig
- **GIVEN** der Nutzer hat Kante 1 von „Wohnen“ von 337,5 cm auf 350 cm geändert
- **WHEN** er Strg+Z drückt
- **THEN** ist Kante 1 wieder 337,5 cm lang

#### Scenario: Gezeichneter Raum rückgängig
- **GIVEN** der Nutzer hat einen Raum mit vier Eckpunkten gezeichnet und geschlossen
- **WHEN** er einmal Strg+Z drückt
- **THEN** ist der ganze Raum verschwunden

### Requirement: Raum nach Rückgängig und Wiederholen
Betrifft ein Rückgängig oder Wiederholen genau einen Raum einer Etage, der danach vorhanden ist, SHALL das System diese Etage aktiv machen und den Raum auswählen; eine ausgewählte Form MUST dann abgewählt sein. Ist der betroffene Raum danach nicht vorhanden, MUST weder Raum noch Form ausgewählt sein.

#### Scenario: Verschieben rückgängig
- **GIVEN** der Nutzer hat im Erdgeschoss „Diele“ verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv, „Diele“ liegt an ihrer Ausgangslage und ist ausgewählt

#### Scenario: Löschen wiederholen
- **GIVEN** der Nutzer hat „Diele“ gelöscht und danach Rückgängig gemacht
- **WHEN** er Strg+Umschalt+Z drückt
- **THEN** ist „Diele“ wieder gelöscht und nichts ist ausgewählt
