## ADDED Requirements

### Requirement: Raumfarbe
Jeder Raum SHALL entweder eine Raumfarbe im Format `#RRGGBB` oder keine Raumfarbe („Standard“) haben. Ein neu gezeichneter Raum SHALL keine Raumfarbe haben.

#### Scenario: Neuer Raum
- **WHEN** der Nutzer einen Raum zeichnet und schließt
- **THEN** hat der Raum keine Raumfarbe und seine Fläche ist halbtransparent weiß

#### Scenario: Ungültige Farbe
- **WHEN** ein Raum mit der Raumfarbe „grün“ geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Raumfarbe wählen
Der Abschnitt „Farbe“ im Panel eines Raums SHALL die Farbfelder „Standard“, „Grau“, „Blau“, „Grün“, „Gelb“, „Orange“, „Rosa“ und „Violett“ und einen Farbwähler für jede andere Farbe zeigen. Das Feld der aktuellen Raumfarbe MUST markiert sein; passt keines, ist keines markiert. Ein Klick auf ein Farbfeld oder eine im Farbwähler bestätigte Farbe SHALL die Raumfarbe sofort setzen, „Standard“ entfernt sie.

#### Scenario: Grün wählen
- **GIVEN** der Raum „Kind 1“ ohne Raumfarbe ist ausgewählt und „Standard“ ist markiert
- **WHEN** der Nutzer auf „Grün“ klickt
- **THEN** ist die Fläche von „Kind 1“ halbtransparent grün und „Grün“ ist markiert

#### Scenario: Eigene Farbe
- **GIVEN** der Raum „Bad“ ist ausgewählt
- **WHEN** der Nutzer im Farbwähler #7DD3FC bestätigt
- **THEN** hat „Bad“ die Raumfarbe #7DD3FC und kein Farbfeld ist markiert

#### Scenario: Zurück auf Standard
- **GIVEN** „Kind 1“ hat die Raumfarbe Grün und ist ausgewählt
- **WHEN** der Nutzer auf „Standard“ klickt
- **THEN** hat „Kind 1“ keine Raumfarbe und seine Fläche ist halbtransparent weiß

## MODIFIED Requirements

### Requirement: Räume darstellen
Das System SHALL jeden Raum der aktiven Etage mit einem dunklen Wandband außen um seinen Umriss, einem halbtransparenten Inneren in seiner Raumfarbe (ohne Raumfarbe weiß) und seinem Namen mittig im Raum in fester Bildschirmgröße zeichnen. Das Band MUST an jeder Kante so breit sein wie deren Wanddicke; an einer Ecke MUST es bis zum Schnittpunkt der Außenlinien beider Kanten reichen. Ein Wandband MUST NOT in das Innere eines Raums ragen. Räume MUST über der Vorlage und unter allen Möbeln liegen. Im Kalibrier-Modus MUST Räume ausgeblendet sein.

#### Scenario: Zwei Räume mit Lücke
- **GIVEN** „Wohnen“ endet rechts bei x = 337,5 cm und „Diele“ beginnt bei x = 349 cm
- **THEN** ist die Lücke von 11,5 cm vollständig als Wand gefüllt
- **AND** im Inneren beider Räume ist kein Wandband zu sehen

#### Scenario: Dicke Außenwand
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), Kante 1 (oben) hat die Wanddicke 36,5 cm, Kante 4 (links) 15 cm
- **THEN** reicht das Band über der oberen Kante von y = 0 cm bis y = −36,5 cm
- **AND** links reicht das Band von x = 0 cm bis x = −15 cm
- **AND** die Ecke oben links ist bis zum Punkt (−15 cm, −36,5 cm) ohne Lücke gefüllt

#### Scenario: Eingefärbter Raum
- **GIVEN** „Kind 1“ hat die Raumfarbe Grün und „Flur“ keine Raumfarbe
- **THEN** ist die Fläche von „Kind 1“ halbtransparent grün und die von „Flur“ halbtransparent weiß
- **AND** Wandband und Name von „Kind 1“ sehen aus wie bei „Flur“

#### Scenario: Möbel über Raum
- **GIVEN** ein Sofa liegt in „Wohnen“
- **THEN** ist das Sofa über dem Raum vollständig zu sehen

#### Scenario: Vorlage durchscheinend
- **GIVEN** die Etage hat eine sichtbare Vorlage
- **THEN** ist die Vorlage im Inneren der Räume weiterhin zu erkennen, auch in eingefärbten Räumen

### Requirement: Eigenschaften eines Raums
Ist ein Raum ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Raum“ und „Löschen“, das Feld „Name“, den Abschnitt „Farbe“ (siehe „Raumfarbe wählen“) und den Abschnitt „Kanten“ mit je Kante einer Zeile aus Längenfeld und Feld „Wand“ (Wanddicke), beide in cm, beginnend bei „Kante 1“ vom ersten zum zweiten Eckpunkt. Hat ein Kantenfeld oder ein Feld „Wand“ den Fokus, SHALL die Kante auf der Zeichenfläche hervorgehoben sein. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel eines Rechtecks
- **WHEN** der Nutzer den Raum „Wohnen“ mit 337,5 × 560 cm und 15 cm Wanddicke an jeder Kante auswählt
- **THEN** zeigt das Panel „Raum“, „Löschen“, Name „Wohnen“ und die Felder Kante 1 „337,5“, Kante 2 „560“, Kante 3 „337,5“, Kante 4 „560“
- **AND** neben jedem Kantenfeld steht ein Feld „Wand“ mit „15“
- **AND** zwischen Name und „Kanten“ steht der Abschnitt „Farbe“

#### Scenario: Wandfeld hebt Kante hervor
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** ist Kante 2 auf der Zeichenfläche hervorgehoben

#### Scenario: Umbenennen
- **WHEN** der Nutzer im Feld „Name“ „Küche“ eingibt und Enter drückt
- **THEN** heißt der Raum „Küche“ und die Zeichenfläche zeigt „Küche“

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen löscht und das Feld verlässt
- **THEN** zeigt das Feld „Bitte einen Namen eingeben“ und der bisherige Name bleibt
