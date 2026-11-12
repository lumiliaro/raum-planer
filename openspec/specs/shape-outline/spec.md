# shape-outline Specification

## Purpose

Liefert für jede Form ihren Umriss als Punktliste in cm, damit Zeichenfläche, Tests und spätere Funktionen dieselbe Geometrie nutzen. Neue Formtypen ergänzen hier ihren Umriss.

## Requirements

### Requirement: Umriss relativ zum Mittelpunkt
Der Umriss einer Form SHALL eine geschlossene Punktliste in cm sein, relativ zum Mittelpunkt der Form und ohne ihre Drehung. Die x-Achse zeigt nach rechts, die y-Achse nach unten (wie im Grundrissbild). Ist die Form gespiegelt, MUST der Umriss an der senkrechten Achse durch den Mittelpunkt gespiegelt sein. Der Umriss MUST für dieselbe Form immer gleich sein.

#### Scenario: Unabhängig von Lage und Drehung
- **GIVEN** zwei Rechtecke mit Breite 100 cm und Tiefe 60 cm, eines bei x = 0 cm, y = 0 cm ohne Drehung, das andere bei x = 400 cm, y = 250 cm mit Drehung 45°
- **WHEN** ihre Umrisse berechnet werden
- **THEN** sind beide Umrisse gleich

### Requirement: Umriss des Rechtecks
Der Umriss eines Rechtecks ohne Eckradius SHALL aus seinen vier Ecken bestehen. Bei einem Eckradius größer als 0 cm SHALL jede Ecke durch einen Viertelkreis mit diesem Radius ersetzt werden, angenähert durch Punkte, die höchstens 0,5 cm vom exakten Bogen abweichen.

#### Scenario: Rechteck ohne Eckradius
- **WHEN** der Umriss eines Rechtecks mit Breite 100 cm, Tiefe 60 cm und Eckradius 0 cm berechnet wird
- **THEN** besteht er aus den Punkten (−50 cm, −30 cm), (50 cm, −30 cm), (50 cm, 30 cm), (−50 cm, 30 cm)

#### Scenario: Rechteck mit Eckradius
- **WHEN** der Umriss eines Rechtecks mit Breite 220 cm, Tiefe 95 cm und Eckradius 10 cm berechnet wird
- **THEN** liegen alle Punkte innerhalb des Bereichs von −110 cm bis 110 cm (x) und −47,5 cm bis 47,5 cm (y)
- **AND** die Punkte (−100 cm, −47,5 cm) und (110 cm, −37,5 cm) gehören zum Umriss
- **AND** jeder Punkt des Bogens oben rechts ist 10 cm vom Bogenmittelpunkt (100 cm, −37,5 cm) entfernt (Abweichung unter 0,01 cm)

### Requirement: Umriss der Ellipse
Der Umriss einer Ellipse SHALL aus Punkten auf der Ellipse mit der halben Breite und der halben Tiefe als Halbachsen bestehen. Die Punkte MUST höchstens 0,5 cm von der exakten Ellipse abweichen und die vier Scheitelpunkte enthalten.

#### Scenario: Runder Tisch
- **WHEN** der Umriss einer Ellipse mit Breite 80 cm und Tiefe 80 cm berechnet wird
- **THEN** enthält er die Punkte (40 cm, 0 cm), (0 cm, 40 cm), (−40 cm, 0 cm) und (0 cm, −40 cm)
- **AND** jeder Punkt ist 40 cm vom Mittelpunkt entfernt (Abweichung unter 0,01 cm)

#### Scenario: Ovaler Tisch
- **WHEN** der Umriss einer Ellipse mit Breite 200 cm und Tiefe 100 cm berechnet wird
- **THEN** reichen die Punkte von −100 cm bis 100 cm in x und von −50 cm bis 50 cm in y

### Requirement: Umriss der L-Form
Das System SHALL den Umriss einer L-Form als geschlossene Punktliste in cm relativ zu ihrem Mittelpunkt liefern (x nach rechts, y nach unten). Schenkel A MUST entlang der unteren Kante über die ganze Breite verlaufen, mit seiner Stärke in Tiefenrichtung; Schenkel B MUST entlang der linken Kante über die ganze Tiefe verlaufen, mit seiner Stärke in Breitenrichtung.

#### Scenario: L-Form mit Standardmaßen
- **GIVEN** eine nicht gespiegelte L-Form mit Breite 280 cm, Tiefe 200 cm, Schenkel A 90 cm und Schenkel B 90 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** besteht er in dieser Reihenfolge aus den Punkten (−140 cm, 100 cm), (140 cm, 100 cm), (140 cm, 10 cm), (−50 cm, 10 cm), (−50 cm, −100 cm), (−140 cm, −100 cm)

#### Scenario: Unterschiedliche Schenkel
- **GIVEN** eine nicht gespiegelte L-Form mit Breite 240 cm, Tiefe 160 cm, Schenkel A 60 cm und Schenkel B 100 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** liegt die innere Ecke bei (−20 cm, 20 cm)

### Requirement: Umriss der U-Form
Das System SHALL den Umriss einer U-Form als geschlossene Punktliste in cm relativ zu ihrem Mittelpunkt liefern. Die Basis MUST entlang der unteren Kante über die ganze Breite verlaufen, mit ihrer Stärke in Tiefenrichtung; die beiden Seiten MUST entlang der linken und rechten Kante über die ganze Tiefe verlaufen, mit gleicher Stärke in Breitenrichtung. Die Öffnung liegt oben.

#### Scenario: U-Form mit Standardmaßen
- **GIVEN** eine U-Form mit Breite 300 cm, Tiefe 240 cm, Basis 60 cm und Seiten 60 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** besteht er in dieser Reihenfolge aus den Punkten (−150 cm, −120 cm), (−90 cm, −120 cm), (−90 cm, 60 cm), (90 cm, 60 cm), (90 cm, −120 cm), (150 cm, −120 cm), (150 cm, 120 cm), (−150 cm, 120 cm)

### Requirement: Umriss der Ecke
Das System SHALL den Umriss einer Ecke als Viertelellipse liefern: Der rechte Winkel MUST in der unteren linken Ecke des umschließenden Rechtecks liegen, die geraden Kanten verlaufen entlang der unteren und der linken Kante, der Bogen verbindet die untere rechte mit der oberen linken Ecke. Der Bogen MUST als Punktfolge angenähert werden, die an keiner Stelle mehr als 0,5 cm von der idealen Kurve abweicht.

#### Scenario: Quadratische Ecke
- **GIVEN** eine nicht gespiegelte Ecke mit Breite 90 cm und Tiefe 90 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** beginnt er mit dem rechten Winkel bei (−45 cm, 45 cm), gefolgt von (45 cm, 45 cm)
- **AND** endet er bei (−45 cm, −45 cm)
- **AND** jeder Punkt dazwischen hat von (−45 cm, 45 cm) den Abstand 90 cm (Abweichung höchstens 0,01 cm)

#### Scenario: Ungleiche Seiten
- **GIVEN** eine Ecke mit Breite 120 cm und Tiefe 80 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** liegt jeder Bogenpunkt auf der Ellipse um (−60 cm, 40 cm) mit den Halbachsen 120 cm und 80 cm
- **AND** zwischen zwei aufeinanderfolgenden Bogenpunkten weicht die Strecke höchstens 0,5 cm von der Ellipse ab

### Requirement: Umriss der Tür
Das System SHALL den Umriss einer Tür als Kreisausschnitt in einem Quadrat mit der Türbreite als Seitenlänge liefern. Die Reihenfolge MUST sein: Angel in der unteren linken Ecke, Ende des geöffneten Türblatts in der oberen linken Ecke, dann die Punkte des Aufschlagbogens um die Angel bis zur unteren rechten Ecke. Für den Bogen gilt dieselbe Genauigkeit wie bei der Ecke.

#### Scenario: Tür mit 80 cm Breite
- **GIVEN** eine nicht gespiegelte Tür mit Breite 80 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** ist der erste Punkt die Angel bei (−40 cm, 40 cm) und der zweite das Türblattende bei (−40 cm, −40 cm)
- **AND** der letzte Punkt liegt bei (40 cm, 40 cm)
- **AND** jeder Bogenpunkt hat von der Angel den Abstand 80 cm (Abweichung höchstens 0,01 cm)

### Requirement: Umschließendes Rechteck der weiteren Formen
Der Umriss einer L-Form, U-Form oder Ecke MUST genau das Rechteck aus Breite und Tiefe um den Mittelpunkt ausfüllen. Der Umriss einer Tür MUST genau das Quadrat aus ihrer Breite ausfüllen. Das gilt gespiegelt wie ungespiegelt.

#### Scenario: Ecke füllt ihr Rechteck
- **GIVEN** eine Ecke mit Breite 120 cm und Tiefe 80 cm
- **WHEN** das kleinste Rechteck um ihren Umriss bestimmt wird
- **THEN** reicht es von −60 cm bis 60 cm in x und von −40 cm bis 40 cm in y

#### Scenario: Tür füllt ihr Quadrat
- **GIVEN** eine Tür mit Breite 90 cm
- **WHEN** das kleinste Rechteck um ihren Umriss bestimmt wird
- **THEN** reicht es von −45 cm bis 45 cm in x und in y

### Requirement: Spiegelung im Umriss
Ist eine Form gespiegelt, MUST ihr Umriss horizontal am Mittelpunkt gespiegelt sein (x wird zu −x), bei unveränderter Reihenfolge der Punkte. Mittelpunkt und umschließendes Rechteck MUST gleich bleiben.

#### Scenario: Gespiegelte L-Form
- **GIVEN** eine gespiegelte L-Form mit Breite 280 cm, Tiefe 200 cm, Schenkel A 90 cm und Schenkel B 90 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** verläuft Schenkel B entlang der rechten Kante: der Umriss enthält (50 cm, −100 cm) und (140 cm, −100 cm), aber nicht (−50 cm, −100 cm)

#### Scenario: Gespiegelte Tür
- **GIVEN** eine gespiegelte Tür mit Breite 80 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** liegt die Angel bei (40 cm, 40 cm) und der Bogen endet bei (−40 cm, 40 cm)

### Requirement: Freie Form ohne Umriss
Für die freie Form (Polygon), deren Umriss noch nicht festgelegt ist, MUST die Umriss-Berechnung „kein Umriss“ melden statt eines falschen Umrisses. Solche Formen MUST NOT gezeichnet werden und MUST im Plan erhalten bleiben.

#### Scenario: Freie Form vor ihrem Werkzeug
- **GIVEN** im Plan steht eine freie Form mit den Punkten (0 cm, 0 cm), (10 cm, 0 cm) und (0 cm, 10 cm)
- **WHEN** ihr Umriss berechnet wird
- **THEN** meldet die Berechnung „kein Umriss“
- **AND** die freie Form bleibt im Plan erhalten
