# Spec Delta

## Purpose

Liefert für jede Form ihren Umriss als Punktliste in cm, damit Zeichenfläche, Tests und spätere Funktionen dieselbe Geometrie nutzen. Neue Formtypen ergänzen hier ihren Umriss.

## ADDED Requirements

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

### Requirement: Formtypen ohne Umriss
Für Formtypen, deren Umriss noch nicht festgelegt ist (L-Form, U-Form, Ecke, Türaufschlag, Polygon), MUST die Umriss-Berechnung „kein Umriss“ melden statt eines falschen Umrisses. Solche Formen MUST NOT gezeichnet werden und MUST im Plan erhalten bleiben.

#### Scenario: L-Form vor ihrem Werkzeug
- **GIVEN** im Plan steht eine L-Form mit Breite 280 cm und Tiefe 200 cm
- **WHEN** ihr Umriss berechnet wird
- **THEN** meldet die Berechnung „kein Umriss“
- **AND** die L-Form bleibt im Plan erhalten
