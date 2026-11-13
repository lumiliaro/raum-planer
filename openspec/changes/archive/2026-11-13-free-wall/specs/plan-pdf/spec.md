# Spec Delta

## MODIFIED Requirements

### Requirement: Inhalt der Zeichnung
Jede Seite SHALL die Räume der Etage in Farbe wie im Editor zeigen: Raumfläche in der Raumfarbe, die Wände als Band in der Wandfarbe des Plans, Türen mit Aufschlag, Fenster und Durchgänge. Die freien Wände der Etage SHALL wie im Editor als Band in der Wandfarbe über den Räumen erscheinen und beim Bemessen der Zeichnung mitzählen. Auswahl-Markierungen, Fanghilfen und Hervorhebungen des Editors MUST NOT erscheinen.

#### Scenario: Raum mit Tür
- **GIVEN** im Erdgeschoss ist ein Raum ausgewählt, der eine Tür mit 80 cm Breite und einen Aufschlag hat
- **WHEN** der Nutzer ein PDF des Erdgeschosses erstellt
- **THEN** zeigt die Seite den Raum mit Wandband, die Türöffnung von 80 cm mit Türblatt und Aufschlag
- **AND** die blaue Auswahl-Umrandung ist nicht zu sehen

#### Scenario: Freie Wand
- **GIVEN** im Erdgeschoss ist eine Wand von (0 cm, 0 cm) nach (0 cm, 300 cm) mit 11,5 cm Dicke ausgewählt
- **WHEN** der Nutzer ein PDF des Erdgeschosses erstellt
- **THEN** zeigt die Seite die Wand als Band in der Wandfarbe ohne Griffe und ohne Auswahl-Umrandung
