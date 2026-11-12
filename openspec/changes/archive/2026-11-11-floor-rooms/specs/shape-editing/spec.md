# Spec Delta

## MODIFIED Requirements

### Requirement: Auswahl aufheben
Das System SHALL die Auswahl aufheben bei einem Klick auf eine Stelle ohne Form und ohne Raum, bei `Esc`, beim Wechsel der Etage und beim Start des Kalibrier-Modus. Ein Klick in einen Raum ohne Form SHALL die Form abwählen und den Raum auswählen (siehe `floor-rooms`). Die Auswahl MUST NOT gespeichert werden; nach dem Neuladen ist keine Form ausgewählt.

#### Scenario: Klick ins Leere
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer auf eine Stelle der Zeichenfläche ohne Form und ohne Raum klickt
- **THEN** ist keine Form mehr ausgewählt

#### Scenario: Klick in einen Raum
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer in einen Raum an eine Stelle ohne Form klickt
- **THEN** ist die Form nicht mehr ausgewählt und der Raum ist ausgewählt

#### Scenario: Etagenwechsel
- **GIVEN** im Erdgeschoss ist eine Form ausgewählt
- **WHEN** der Nutzer ins Obergeschoss und zurück ins Erdgeschoss wechselt
- **THEN** ist keine Form ausgewählt
