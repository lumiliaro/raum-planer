# Spec Delta

## MODIFIED Requirements

### Requirement: Ansicht verschieben
Das System SHALL die Ansicht verschieben, wenn der Nutzer mit gedrückter linker Maustaste auf der Zeichenfläche zieht; der Grundriss und alle sichtbaren Formen folgen dabei der Mausbewegung. Beginnt das Ziehen auf einer Form, während das Werkzeug „Auswählen“ aktiv ist, MUST stattdessen die Form verschoben werden und die Ansicht stillstehen.

#### Scenario: Ziehen nach rechts
- **WHEN** der Nutzer auf der Zeichenfläche an einer Stelle ohne Form mit gedrückter Maustaste 100 Bildschirmpixel nach rechts zieht
- **THEN** verschiebt sich der Grundriss um 100 Bildschirmpixel nach rechts
- **AND** der Zoomwert bleibt unverändert

#### Scenario: Ziehen auf einer Form
- **GIVEN** „Auswählen“ ist aktiv
- **WHEN** der Nutzer auf einem Rechteck mit gedrückter Maustaste nach rechts zieht
- **THEN** bewegt sich das Rechteck
- **AND** der Grundriss bleibt an seiner Stelle

#### Scenario: Ziehen auf einer Form mit Form-Werkzeug
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer auf einer vorhandenen Form mit gedrückter Maustaste zieht
- **THEN** verschiebt sich die Ansicht
- **AND** die Form behält ihre Lage
