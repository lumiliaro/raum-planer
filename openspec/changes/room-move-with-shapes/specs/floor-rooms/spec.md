# Spec Delta

## MODIFIED Requirements

### Requirement: Raum verschieben
Ziehen an einem ausgewählten, nicht gesperrten Raum mit „Auswählen“ SHALL den ganzen Raum verschieben, relativ zur Startlage auf 5 cm gerastert, bei gedrückter Alt-Taste auf 1 cm. Haftet der Raum an einer Nachbarwand (siehe „Raum haftet an der Nachbarwand“), MUST das Haften quer zur Wand Vorrang vor dem Raster haben. Ziehen an einem nicht ausgewählten oder gesperrten Raum MUST die Ansicht verschieben (siehe „Gesperrter Raum auf der Zeichenfläche“). Jede Form der Etage, deren Mittelpunkt zu Beginn des Ziehens innerhalb des Raums liegt, MUST um denselben Versatz wie der Raum (nach Raster und Haften) mitwandern, auch eine gesperrte Form; Drehung, Spiegelung, Maße, Stil und Zeichenreihenfolge bleiben. Formen mit Mittelpunkt außerhalb MUST an ihrer Stelle bleiben. Mitwandernde Formen SHALL schon während des Ziehens an der neuen Stelle erscheinen.

#### Scenario: Raum ziehen
- **GIVEN** „Diele“ ist ausgewählt und ihre linke obere Ecke liegt bei (349 cm, 0 cm)
- **AND** kein anderer Raum der Etage liegt in der Nähe der Diele
- **WHEN** der Nutzer die Diele 23 cm nach rechts zieht
- **THEN** liegt die Ecke bei (374 cm, 0 cm) und alle Kantenlängen sind unverändert

#### Scenario: Möbel im Raum wandern mit
- **GIVEN** „Wohnen“ reicht von (0 cm, 0 cm) bis (400 cm, 500 cm) und ist ausgewählt
- **AND** ein Sofa mit Mittelpunkt (200 cm, 100 cm) und 90° Drehung liegt in „Wohnen“
- **WHEN** der Nutzer „Wohnen“ 50 cm nach rechts und 20 cm nach unten zieht
- **THEN** liegt der Mittelpunkt des Sofas bei (250 cm, 120 cm)
- **AND** das Sofa ist weiterhin um 90° gedreht und hat seine Maße

#### Scenario: Möbel außerhalb bleiben liegen
- **GIVEN** „Wohnen“ reicht von (0 cm, 0 cm) bis (400 cm, 500 cm) und ist ausgewählt
- **AND** ein Tisch mit Mittelpunkt (600 cm, 100 cm) liegt außerhalb von „Wohnen“
- **WHEN** der Nutzer „Wohnen“ 50 cm nach rechts zieht
- **THEN** liegt der Mittelpunkt des Tischs weiterhin bei (600 cm, 100 cm)

#### Scenario: Mittelpunkt entscheidet
- **GIVEN** „Wohnen“ reicht von (0 cm, 0 cm) bis (400 cm, 500 cm) und ist ausgewählt
- **AND** ein Schrank 100 cm breit mit Mittelpunkt (380 cm, 200 cm) ragt 30 cm über die rechte Kante hinaus
- **AND** ein Regal 100 cm breit mit Mittelpunkt (430 cm, 200 cm) ragt 20 cm in „Wohnen“ hinein
- **WHEN** der Nutzer „Wohnen“ 50 cm nach unten zieht
- **THEN** liegt der Mittelpunkt des Schranks bei (380 cm, 250 cm)
- **AND** der Mittelpunkt des Regals liegt weiterhin bei (430 cm, 200 cm)

#### Scenario: Gesperrte Form wandert mit
- **GIVEN** „Bad“ ist ausgewählt und eine gesperrte Wanne mit Mittelpunkt (120 cm, 80 cm) liegt darin
- **WHEN** der Nutzer „Bad“ 30 cm nach links zieht
- **THEN** liegt der Mittelpunkt der Wanne bei (90 cm, 80 cm)
- **AND** die Wanne ist weiterhin gesperrt

#### Scenario: Vorschau beim Ziehen
- **GIVEN** „Wohnen“ ist ausgewählt und ein Sofa liegt darin
- **WHEN** der Nutzer „Wohnen“ zieht und die Maustaste noch gedrückt hält
- **THEN** erscheint das Sofa um denselben Versatz verschoben wie der Raum

#### Scenario: Möbel wandern beim Haften mit
- **GIVEN** „Bad“ ist ausgewählt und eine Wanne liegt darin
- **AND** „Bad“ haftet beim Ziehen an der Wand von „Flur“ und landet dadurch 7 cm weiter rechts als die Mauslage
- **WHEN** der Nutzer loslässt
- **THEN** ist die Wanne um genau denselben Versatz verschoben wie „Bad“

#### Scenario: Gesperrter Raum nimmt nichts mit
- **GIVEN** „Wohnen“ ist gesperrt und ausgewählt, ein Sofa liegt darin
- **WHEN** der Nutzer auf „Wohnen“ an einer Stelle ohne Form zieht
- **THEN** verschiebt sich die Ansicht, Raum und Sofa behalten ihre Lage

#### Scenario: Nicht ausgewählter Raum
- **GIVEN** kein Raum ist ausgewählt
- **WHEN** der Nutzer in „Wohnen“ an einer Stelle ohne Form zieht
- **THEN** verschiebt sich die Ansicht und der Raum behält seine Lage
