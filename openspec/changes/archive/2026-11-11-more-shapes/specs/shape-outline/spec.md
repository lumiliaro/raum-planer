# Spec Delta

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Formtypen ohne Umriss
**Reason**: L-Form, U-Form, Ecke und Tür haben mit diesem Change einen Umriss; „kein Umriss“ gilt nur noch für die freie Form.
**Migration**: Ersetzt durch „Freie Form ohne Umriss“.
