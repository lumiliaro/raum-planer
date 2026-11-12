# Spec Delta

## ADDED Requirements

### Requirement: Drehung beim Ändern der Größe
Ändert der Nutzer die Größe einer Form über die Anfasser, MUST ihre Drehung unverändert bleiben, auch wenn sie nicht auf 0°, 90°, 180° oder 270° steht. Eingerastet wird nur, wenn die Form über den Dreh-Anfasser gedreht wird.

#### Scenario: Getippte Drehung bleibt
- **GIVEN** ein Rechteck mit Breite 100 cm und Drehung 93°
- **WHEN** der Nutzer den rechten Anfasser um 20 cm nach außen zieht und loslässt
- **THEN** ist das Rechteck 120 cm breit
- **AND** es hat weiter eine Drehung von 93°
