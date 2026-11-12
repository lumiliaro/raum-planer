# Spec Delta

## ADDED Requirements

### Requirement: Hilfslinien beim Zeichnen
Beim Zeichnen mit „Raum“ SHALL es waagerechte und senkrechte Hilfslinien durch die gesetzten Eckpunkte außer dem letzten und durch die Ecken der anderen Räume der Etage geben. Liegt der Eckpunkt, den ein Klick setzen würde, höchstens 8 Bildschirmpixel neben einer Hilfslinie, SHALL er auf der nächstliegenden liegen. Bei gerader Kante MUST nur die Achse quer zur Kante einrasten; mit Umschalttaste und beim ersten Punkt rastet jede Achse für sich ein.

#### Scenario: Gegenkante gleich lang
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (6 cm, 203 cm) bewegt
- **THEN** zeigt die Zeichenfläche eine waagerechte Kante bis (0 cm, 200 cm) mit der Beschriftung „300 cm“
- **WHEN** der Nutzer klickt
- **THEN** ist (0 cm, 200 cm) der vierte Eckpunkt und die untere Kante ist so lang und parallel wie die obere

#### Scenario: Außerhalb der Toleranz
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer bei (12 cm, 203 cm) klickt
- **THEN** ist (12 cm, 200 cm) der vierte Eckpunkt

#### Scenario: Bündig mit dem Nachbarraum
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm)
- **AND** beim Zeichnen sind die Eckpunkte (600 cm, 0 cm) und (900 cm, 0 cm) gesetzt
- **WHEN** der Nutzer bei (902 cm, 395 cm) klickt
- **THEN** ist (900 cm, 400 cm) der dritte Eckpunkt

#### Scenario: Erster Punkt in der Flucht
- **GIVEN** der Zoom steht auf 100 % und der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm)
- **WHEN** der Nutzer mit „Raum“ ohne gesetzten Eckpunkt bei (600 cm, 404 cm) klickt
- **THEN** liegt der Startpunkt bei (600 cm, 400 cm)

#### Scenario: Freier Winkel an der Hilfslinie
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm) sind gesetzt
- **WHEN** der Nutzer mit gedrückter Umschalttaste bei (4 cm, 197 cm) klickt
- **THEN** ist (0 cm, 197 cm) der dritte Eckpunkt

### Requirement: Vorrang beim Einrasten während des Zeichnens
Das Einrasten am Startpunkt oder an einer Raumecke MUST Vorrang vor dem Einrasten an einer Hilfslinie haben. Ist eine Länge eingetippt, MUST der Eckpunkt genau im eingetippten Abstand liegen und keine Hilfslinie wirken oder erscheinen.

#### Scenario: Startpunkt vor Hilfslinie
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer 5 Bildschirmpixel neben dem Startpunkt (0 cm, 0 cm) klickt
- **THEN** wird der Umriss geschlossen

#### Scenario: Eingetippte Länge
- **GIVEN** der Zoom steht auf 100 %, die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt und der Mauszeiger steht bei (6 cm, 203 cm)
- **WHEN** der Nutzer „295“ tippt und Enter drückt
- **THEN** ist (5 cm, 200 cm) der vierte Eckpunkt
- **AND** während der Eingabe war keine Hilfslinie zu sehen

### Requirement: Hilfslinie beim Zeichnen anzeigen
Solange der nächste Eckpunkt an einer Hilfslinie eingerastet ist, SHALL die Hilfslinie als gestrichelte Linie in der Auswahlfarbe vom Eckpunkt, durch den sie läuft, bis zum nächsten Eckpunkt zu sehen sein, höchstens eine je Achse. Rastet die Achse aus, MUST die Hilfslinie verschwinden.

#### Scenario: Hilfslinie zum Startpunkt
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (6 cm, 203 cm) bewegt
- **THEN** ist eine gestrichelte senkrechte Linie in der Auswahlfarbe von (0 cm, 0 cm) bis (0 cm, 200 cm) zu sehen
- **WHEN** er den Mauszeiger nach (40 cm, 203 cm) bewegt
- **THEN** ist keine Hilfslinie mehr zu sehen

### Requirement: Hilfslinien beim Zeichnen abschalten
Bei gedrückter Strg-Taste oder ausgeschaltetem Schalter „Einrasten“ MUST der nächste Eckpunkt an keiner Hilfslinie einrasten und es MUST keine Hilfslinie erscheinen. Das Einrasten am Startpunkt, an Raumecken und auf 0°, 90°, 180° oder 270° MUST dabei unverändert wirken. Wird Strg losgelassen, SHALL das Einrasten an Hilfslinien wieder wirken.

#### Scenario: Mit Strg ohne Hilfslinie
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer mit gedrückter Strg-Taste bei (6 cm, 203 cm) klickt
- **THEN** ist (6 cm, 200 cm) der vierte Eckpunkt
- **AND** es war keine Hilfslinie zu sehen

#### Scenario: Schalter „Einrasten“ aus
- **GIVEN** der Schalter „Einrasten“ ist aus, der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer bei (6 cm, 203 cm) klickt
- **THEN** ist (6 cm, 200 cm) der vierte Eckpunkt

#### Scenario: Ecken rasten weiter ein
- **GIVEN** der Schalter „Einrasten“ ist aus und ein Raum hat eine Ecke bei (350 cm, 0 cm)
- **WHEN** der Nutzer mit „Raum“ 5 Bildschirmpixel neben dieser Ecke klickt
- **THEN** liegt der Startpunkt genau bei (350 cm, 0 cm)
