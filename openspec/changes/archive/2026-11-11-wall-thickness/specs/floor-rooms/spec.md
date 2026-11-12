## ADDED Requirements

### Requirement: Wanddicke je Kante
Jede Kante eines Raums SHALL eine eigene Wanddicke in cm haben, die größer als 0 cm und höchstens 100 cm ist. Ein Raum MUST genau so viele Wanddicken wie Kanten haben; die erste gehört zu Kante 1. Ein neu gezeichneter Raum SHALL an jeder Kante die Wanddicke 15 cm haben.

#### Scenario: Neuer Raum
- **WHEN** der Nutzer einen Raum mit vier Eckpunkten zeichnet und schließt
- **THEN** hat jede der vier Kanten die Wanddicke 15 cm

#### Scenario: Zu dicke Wand
- **WHEN** ein Raum mit vier Kanten und den Wanddicken 36,5 cm, 15 cm, 15 cm und 120 cm geprüft wird
- **THEN** gilt er als ungültig

#### Scenario: Wanddicke fehlt
- **WHEN** ein Raum mit vier Kanten und nur drei Wanddicken geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Wanddicke ändern
Eine im Feld „Wand“ einer Kante übernommene Zahl SHALL die Wanddicke dieser Kante auf den auf 0,1 cm gerundeten Wert setzen, ohne Eckpunkte, Öffnungen oder andere Wanddicken zu ändern. Ein Wert, der nicht größer als 0 cm ist, MUST mit „Muss größer als 0 cm sein“ und ein Wert über 100 cm mit „Darf höchstens 100 cm sein“ abgelehnt werden; die Wanddicke bleibt dann unverändert.

#### Scenario: Außenwand
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und an jeder Kante 15 cm Wanddicke
- **WHEN** der Nutzer im Feld „Wand“ von Kante 1 „36,5“ eingibt und Enter drückt
- **THEN** hat Kante 1 die Wanddicke 36,5 cm und die übrigen Kanten 15 cm
- **AND** die Eckpunkte sind unverändert

#### Scenario: Null
- **WHEN** der Nutzer im Feld „Wand“ „0“ eingibt und das Feld verlässt
- **THEN** zeigt das Feld „Muss größer als 0 cm sein“ und die Wanddicke bleibt unverändert

#### Scenario: Zu dick
- **WHEN** der Nutzer im Feld „Wand“ „150“ eingibt und Enter drückt
- **THEN** zeigt das Feld „Darf höchstens 100 cm sein“ und die Wanddicke bleibt unverändert

## MODIFIED Requirements

### Requirement: Räume darstellen
Das System SHALL jeden Raum der aktiven Etage mit einem dunklen Wandband außen um seinen Umriss, einem halbtransparent weißen Inneren und seinem Namen mittig im Raum in fester Bildschirmgröße zeichnen. Das Band MUST an jeder Kante so breit sein wie deren Wanddicke; an einer Ecke MUST es bis zum Schnittpunkt der Außenlinien beider Kanten reichen. Ein Wandband MUST NOT in das Innere eines Raums ragen. Räume MUST über der Vorlage und unter allen Möbeln liegen. Im Kalibrier-Modus MUST Räume ausgeblendet sein.

#### Scenario: Zwei Räume mit Lücke
- **GIVEN** „Wohnen“ endet rechts bei x = 337,5 cm und „Diele“ beginnt bei x = 349 cm
- **THEN** ist die Lücke von 11,5 cm vollständig als Wand gefüllt
- **AND** im Inneren beider Räume ist kein Wandband zu sehen

#### Scenario: Dicke Außenwand
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), Kante 1 (oben) hat die Wanddicke 36,5 cm, Kante 4 (links) 15 cm
- **THEN** reicht das Band über der oberen Kante von y = 0 cm bis y = −36,5 cm
- **AND** links reicht das Band von x = 0 cm bis x = −15 cm
- **AND** die Ecke oben links ist bis zum Punkt (−15 cm, −36,5 cm) ohne Lücke gefüllt

#### Scenario: Möbel über Raum
- **GIVEN** ein Sofa liegt in „Wohnen“
- **THEN** ist das Sofa über dem Raum vollständig zu sehen

#### Scenario: Vorlage durchscheinend
- **GIVEN** die Etage hat eine sichtbare Vorlage
- **THEN** ist die Vorlage im Inneren der Räume weiterhin zu erkennen

### Requirement: Eigenschaften eines Raums
Ist ein Raum ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Raum“ und „Löschen“, das Feld „Name“ und den Abschnitt „Kanten“ mit je Kante einer Zeile aus Längenfeld und Feld „Wand“ (Wanddicke), beide in cm, beginnend bei „Kante 1“ vom ersten zum zweiten Eckpunkt. Hat ein Kantenfeld oder ein Feld „Wand“ den Fokus, SHALL die Kante auf der Zeichenfläche hervorgehoben sein. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel eines Rechtecks
- **WHEN** der Nutzer den Raum „Wohnen“ mit 337,5 × 560 cm und 15 cm Wanddicke an jeder Kante auswählt
- **THEN** zeigt das Panel „Raum“, „Löschen“, Name „Wohnen“ und die Felder Kante 1 „337,5“, Kante 2 „560“, Kante 3 „337,5“, Kante 4 „560“
- **AND** neben jedem Kantenfeld steht ein Feld „Wand“ mit „15“

#### Scenario: Wandfeld hebt Kante hervor
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** ist Kante 2 auf der Zeichenfläche hervorgehoben

#### Scenario: Umbenennen
- **WHEN** der Nutzer im Feld „Name“ „Küche“ eingibt und Enter drückt
- **THEN** heißt der Raum „Küche“ und die Zeichenfläche zeigt „Küche“

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen löscht und das Feld verlässt
- **THEN** zeigt das Feld „Bitte einen Namen eingeben“ und der bisherige Name bleibt
