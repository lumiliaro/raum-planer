# Spec Delta

## ADDED Requirements

### Requirement: Kalibrieren nur mit Grundriss
Hat die aktive Etage kein Grundrissbild, SHALL „Etage kalibrieren“ gesperrt sein und als Tooltip „Etage kalibrieren – diese Etage hat keinen Grundriss“ zeigen. Wechselt der Nutzer im Kalibrier-Modus auf eine Etage ohne Grundrissbild, MUST der Kalibrier-Modus enden; nicht gespeicherte Punkte und Längen werden verworfen.

#### Scenario: Neue Etage
- **GIVEN** die Etage „Keller“ hat kein Grundrissbild und ist aktiv
- **THEN** ist „Etage kalibrieren“ gesperrt und zeigt den Tooltip „Etage kalibrieren – diese Etage hat keinen Grundriss“

#### Scenario: Wechsel im Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus für das Erdgeschoss ist aktiv
- **WHEN** der Nutzer in die Etage „Keller“ ohne Grundrissbild wechselt
- **THEN** ist der Kalibrier-Modus beendet und das Eigenschaften-Panel wieder zu sehen
