# Spec Delta

## MODIFIED Requirements

### Requirement: Raster beim Verschieben
Beim Ziehen SHALL sich eine Form relativ zu ihrer Startlage in Schritten von 5 cm je Achse bewegen, außer sie rastet auf dieser Achse an einer Rastlinie ein (siehe „Einrasten je Achse mit Vorrang vor dem Raster“ in shape-snapping). Bei gedrückter Alt-Taste MUST die Schrittweite 1 cm betragen. Die Startlage MUST NOT vorher auf das Raster gezogen werden.

#### Scenario: 5-cm-Schritte
- **GIVEN** ein Schrank hat den Mittelpunkt x = 37 cm, y = 120 cm
- **WHEN** der Nutzer ihn ohne Alt-Taste um 13 cm nach rechts und 2 cm nach unten zieht
- **THEN** liegt sein Mittelpunkt bei x = 52 cm, y = 120 cm

#### Scenario: 1-cm-Schritte mit Alt
- **GIVEN** ein Schrank hat den Mittelpunkt x = 37 cm, y = 120 cm
- **WHEN** der Nutzer ihn mit gedrückter Alt-Taste um 13,4 cm nach rechts zieht
- **THEN** liegt sein Mittelpunkt bei x = 50 cm, y = 120 cm
