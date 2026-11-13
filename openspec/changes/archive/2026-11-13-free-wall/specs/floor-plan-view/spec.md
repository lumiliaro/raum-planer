# Spec Delta

## MODIFIED Requirements

### Requirement: Einpassen
Das System SHALL bei der ersten Anzeige einer Etage alles Sichtbare der Etage (Vorlage, Räume samt Wandband, freie Wände und Formen) vollständig und zentriert in die Zeichenfläche einpassen. Ist nichts zu sehen, MUST der Bereich von 0 cm bis 1 000 cm in beiden Richtungen eingepasst werden. Dieselbe Einpassung SHALL über die Schaltfläche „Einpassen“ und die Taste `0` erreichbar sein.

#### Scenario: Erste Anzeige
- **WHEN** eine Etage mit Vorlage in der Sitzung zum ersten Mal angezeigt wird
- **THEN** sind die gesamte Vorlage und alle Formen sichtbar und in der Zeichenfläche zentriert

#### Scenario: Einpassen nach Zoomen
- **GIVEN** der Nutzer hat hineingezoomt und die Ansicht verschoben
- **WHEN** er „Einpassen“ anklickt oder `0` drückt
- **THEN** sind Vorlage und Formen wieder vollständig sichtbar und zentriert

#### Scenario: Möbel außerhalb der Vorlage
- **GIVEN** die Vorlage reicht bis x = 1 200 cm und ein Schrank liegt bei x = 1 500 cm
- **WHEN** der Nutzer „Einpassen“ anklickt
- **THEN** sind Vorlage und Schrank vollständig sichtbar

#### Scenario: Leere Etage
- **GIVEN** die Etage „Keller“ hat weder Vorlage noch Formen
- **WHEN** der Nutzer „Einpassen“ anklickt
- **THEN** ist der Bereich von 0 cm bis 1 000 cm in beiden Richtungen sichtbar und zentriert

#### Scenario: Nur eine freie Wand
- **GIVEN** die Etage „Keller“ hat nur eine Wand von (2 000 cm, 0 cm) nach (2 000 cm, 600 cm) mit 24 cm Dicke
- **WHEN** der Nutzer „Einpassen“ anklickt
- **THEN** ist die ganze Wand samt ihrer Dicke sichtbar und zentriert
