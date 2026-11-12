# Spec Delta

## MODIFIED Requirements

### Requirement: Schalter „Einrasten“
Unten rechts neben dem Schalter „Maße“ SHALL ein Schalter „Einrasten“ das Einrasten von Formen an Rastlinien und das Einrasten an Hilfslinien beim Zeichnen von Räumen ein- und ausschalten. Ist er aus, MUST eine gezogene Form wie mit gedrückter Strg-Taste an keiner Rastlinie einrasten und es erscheint keine Hilfslinie; das Raster gilt weiter. Beim Zeichnen eines Raums gilt dann dasselbe wie mit gedrückter Strg-Taste. Der Schalter MUST NOT auf Türen, Fenster, Durchgänge oder das Verschieben von Räumen wirken.

#### Scenario: Einrasten ausgeschaltet
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **AND** der Schalter „Einrasten“ ist aus
- **WHEN** der Nutzer ihn ohne Taste um 127 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 245 cm
- **AND** während des Ziehens war keine Hilfslinie zu sehen

#### Scenario: Raum zeichnen bei ausgeschaltetem Einrasten
- **GIVEN** der Schalter „Einrasten“ ist aus, der Zoom steht auf 100 % und beim Zeichnen eines Raums sind die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) gesetzt
- **WHEN** der Nutzer bei (6 cm, 203 cm) klickt
- **THEN** ist (6 cm, 200 cm) der vierte Eckpunkt
- **AND** es war keine Hilfslinie zu sehen

#### Scenario: Haften an Wänden bleibt
- **GIVEN** der Schalter „Einrasten“ ist aus
- **WHEN** der Nutzer einen Raum neben die Wand eines anderen Raums zieht
- **THEN** haftet der Raum wie bei eingeschaltetem Schalter an der Wand
