# Spec Delta

## ADDED Requirements

### Requirement: Lage der Beschriftung bei weiteren Formen
Die Beschriftung einer Form auf der Zeichenfläche SHALL innerhalb ihres Umrisses stehen: bei der L-Form in der Mitte von Schenkel A, bei der U-Form in der Mitte der Basis, bei Ecke und Tür im Schwerpunkt der Viertelellipse bzw. des Aufschlags. Bei gespiegelter Form MUST die Lage mitgespiegelt sein.

#### Scenario: Beschriftung einer L-Form
- **GIVEN** eine L-Form mit Mittelpunkt x = 400 cm, y = 250 cm, Drehung 0°, Breite 280 cm, Tiefe 200 cm und Schenkel A 90 cm mit der Beschriftung „Ecksofa“
- **WHEN** sie auf dem Grundriss erscheint
- **THEN** steht „Ecksofa“ mittig bei x = 400 cm, y = 305 cm, also in Schenkel A und nicht in der Aussparung

#### Scenario: Beschriftung einer Ecke
- **GIVEN** eine Ecke mit Mittelpunkt x = 0 cm, y = 0 cm, Drehung 0°, Breite 90 cm und Tiefe 90 cm
- **WHEN** ihre Beschriftung platziert wird
- **THEN** steht sie bei etwa x = −6,8 cm, y = 6,8 cm (Abweichung höchstens 0,1 cm)

### Requirement: Maß-Felder der L-Form
Ist eine L-Form ausgewählt, SHALL der Abschnitt „Maße“ die Felder „Breite“, „Tiefe“, „Schenkel A“ und „Schenkel B“ in cm zeigen. Eine gültige Eingabe MUST die Form sofort ändern; die übrigen Maße und der Mittelpunkt bleiben gleich.

#### Scenario: Schenkel A ändern
- **GIVEN** eine L-Form mit Breite 280 cm, Tiefe 200 cm, Schenkel A 90 cm und Schenkel B 90 cm
- **WHEN** der Nutzer bei „Schenkel A“ 60 cm eingibt
- **THEN** hat die L-Form Schenkel A 60 cm und weiterhin Breite 280 cm, Tiefe 200 cm und Schenkel B 90 cm
- **AND** ihre innere Ecke liegt nun 60 cm über der unteren Kante

### Requirement: Maß-Felder der U-Form
Ist eine U-Form ausgewählt, SHALL der Abschnitt „Maße“ die Felder „Breite“, „Tiefe“, „Basis“ und „Seiten“ in cm zeigen. Eine gültige Eingabe MUST die Form sofort ändern; die übrigen Maße und der Mittelpunkt bleiben gleich.

#### Scenario: Seiten ändern
- **GIVEN** eine U-Form mit Breite 300 cm, Tiefe 240 cm, Basis 60 cm und Seiten 60 cm
- **WHEN** der Nutzer bei „Seiten“ 65 cm eingibt
- **THEN** sind beide Seiten der U-Form 65 cm stark und Breite, Tiefe und Basis unverändert

### Requirement: Maß-Felder der Ecke
Ist eine Ecke ausgewählt, SHALL der Abschnitt „Maße“ die Felder „Breite“ und „Tiefe“ in cm zeigen. Eine gültige Eingabe MUST die Form sofort ändern; der Mittelpunkt bleibt gleich.

#### Scenario: Tiefe ändern
- **GIVEN** eine Ecke mit Breite 90 cm und Tiefe 90 cm
- **WHEN** der Nutzer bei „Tiefe“ 100 cm eingibt
- **THEN** hat die Ecke Breite 90 cm und Tiefe 100 cm

### Requirement: Maß-Feld der Tür
Ist eine Tür ausgewählt, SHALL der Abschnitt „Maße“ nur das Feld „Breite“ in cm zeigen. Eine gültige Eingabe MUST die Breite ändern, wobei die Angel an ihrer Stelle auf dem Grundriss bleibt, auch bei gedrehter oder gespiegelter Tür.

#### Scenario: Tür breiter, Angel bleibt
- **GIVEN** eine nicht gespiegelte Tür mit Breite 80 cm, Drehung 0° und Mittelpunkt x = 100 cm, y = 200 cm (Angel bei x = 60 cm, y = 240 cm)
- **WHEN** der Nutzer bei „Breite“ 90 cm eingibt
- **THEN** hat die Tür die Breite 90 cm und den Mittelpunkt x = 105 cm, y = 195 cm
- **AND** die Angel liegt weiterhin bei x = 60 cm, y = 240 cm

#### Scenario: Gedrehte Tür
- **GIVEN** eine nicht gespiegelte Tür mit Breite 80 cm, Drehung 90° und Mittelpunkt x = 100 cm, y = 200 cm
- **WHEN** der Nutzer bei „Breite“ 90 cm eingibt
- **THEN** liegt die Angel an derselben Stelle wie vorher

### Requirement: Grenzen der Maß-Felder
Das System MUST eine Eingabe ablehnen, die die Form ungültig machen würde. Die Form bleibt dann unverändert, und am Feld erscheint ein Hinweis mit der verletzten Grenze in cm: „Muss kleiner als … cm sein“ oder „Muss größer als … cm sein“. Es gelten die Grenzen aus dem Datenmodell, bei der U-Form ist das Doppelte der Seitenstärke maßgeblich.

#### Scenario: Schenkel A zu stark
- **GIVEN** eine L-Form mit Tiefe 200 cm und Schenkel A 90 cm
- **WHEN** der Nutzer bei „Schenkel A“ 200 cm eingibt
- **THEN** behält die L-Form Schenkel A 90 cm
- **AND** am Feld steht „Muss kleiner als 200 cm sein“

#### Scenario: L-Form schmaler als Schenkel B
- **GIVEN** eine L-Form mit Breite 280 cm und Schenkel B 90 cm
- **WHEN** der Nutzer bei „Breite“ 80 cm eingibt
- **THEN** behält die L-Form die Breite 280 cm
- **AND** am Feld steht „Muss größer als 90 cm sein“

#### Scenario: U-Form-Seiten zu stark
- **GIVEN** eine U-Form mit Breite 300 cm und Seiten 60 cm
- **WHEN** der Nutzer bei „Seiten“ 150 cm eingibt
- **THEN** behält die U-Form Seiten von 60 cm
- **AND** am Feld steht „Muss kleiner als 150 cm sein“

#### Scenario: U-Form zu schmal für ihre Seiten
- **GIVEN** eine U-Form mit Breite 300 cm und Seiten 60 cm
- **WHEN** der Nutzer bei „Breite“ 120 cm eingibt
- **THEN** behält die U-Form die Breite 300 cm
- **AND** am Feld steht „Muss größer als 120 cm sein“

#### Scenario: Tür mit Breite 0 cm
- **GIVEN** eine Tür mit Breite 80 cm
- **WHEN** der Nutzer bei „Breite“ 0 cm eingibt
- **THEN** behält die Tür die Breite 80 cm
- **AND** am Feld steht „Muss größer als 0 cm sein“
