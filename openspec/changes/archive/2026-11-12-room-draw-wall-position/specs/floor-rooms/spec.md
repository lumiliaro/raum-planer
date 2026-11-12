# Spec Delta

## ADDED Requirements

### Requirement: Startpunkt auf einer Wand
Ist mit „Raum“ noch kein Eckpunkt gesetzt, SHALL jede Kante jedes Raums der aktiven Etage zwei Wandlinien liefern: die Kante selbst (Innenseite der Wand) und die um ihre Wanddicke nach außen versetzte Kante (Außenseite der Wand). Liegt der Mauszeiger höchstens 8 Bildschirmpixel neben einer Wandlinie und zwischen ihren Enden, SHALL der Startpunkt auf der nächstliegenden Wandlinie einrasten. Ab dem zweiten Eckpunkt MUST es keine Wandposition geben.

#### Scenario: Außenseite der Wand
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und an jeder Kante 15 cm Wanddicke
- **AND** „Raum“ ist aktiv und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (262 cm, −17 cm) klickt
- **THEN** liegt der Startpunkt bei (260 cm, −15 cm)

#### Scenario: Innenseite der Wand
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (262 cm, 4 cm) klickt
- **THEN** liegt der Startpunkt bei (260 cm, 0 cm)

#### Scenario: Neben dem Wandende
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (530 cm, −15 cm) klickt
- **THEN** liegt der Startpunkt bei (530 cm, −15 cm), ohne Wandposition

#### Scenario: Zweiter Eckpunkt
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und der Startpunkt liegt bei (100 cm, −200 cm)
- **WHEN** der Nutzer den Mauszeiger nach (102 cm, −17 cm) bewegt
- **THEN** zeigt die Zeichenfläche eine senkrechte Kante bis (100 cm, −17 cm) und keine Wandposition

### Requirement: Lage auf der Wand im Raster
Die Lage auf einer Wandlinie MUST als Abstand zu den Enden der Kante gemessen werden, an der Außenseite zu ihren nach außen versetzten Innenecken. Entlang der Wand SHALL der Startpunkt in Schritten von 5 cm einrasten, bei gedrückter Alt-Taste in Schritten von 1 cm, gezählt vom Wandende, das dem Mauszeiger näher liegt (Bezugsende). Ein Klick SHALL diesen Punkt als Startpunkt setzen, gerundet auf 0,1 cm.

#### Scenario: Gezählt vom näheren Ende
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (437 cm, −14 cm) klickt
- **THEN** liegt der Startpunkt bei (435 cm, −15 cm), 65 cm vom rechten Wandende

#### Scenario: Feine Schritte mit Alt
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer mit gedrückter Alt-Taste bei (262,4 cm, −17 cm) klickt
- **THEN** liegt der Startpunkt bei (262 cm, −15 cm)

#### Scenario: Schräge Wand
- **GIVEN** der Zoom steht auf 100 %, ein Raum hat eine Kante von (0 cm, 0 cm) nach (300 cm, 400 cm) und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer auf der Kante 262 cm von (0 cm, 0 cm) entfernt klickt, bei (157,2 cm, 209,6 cm)
- **THEN** liegt der Startpunkt bei (156 cm, 208 cm), 260 cm von (0 cm, 0 cm) entfernt

### Requirement: Wandposition anzeigen
Solange der Startpunkt an einer Wandlinie eingerastet ist, SHALL die Zeichenfläche ihn mit einem Ring und das Bezugsende mit einem gefüllten Punkt markieren, beide in der Auswahlfarbe. Mittig zwischen dem Punkt und jedem Wandende SHALL dessen Abstand in cm in der Auswahlfarbe stehen, parallel zur Wand und lesbar wie die Maße der Räume. Ein Abstand von 0 cm oder ein Abstand, der nicht auf seine Strecke passt, MUST weggelassen werden. Rastet der Punkt aus, MUST die Anzeige verschwinden.

#### Scenario: 260 cm auf einer 500-cm-Wand
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und 15 cm Wanddicke, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (262 cm, −17 cm) bewegt
- **THEN** ist bei (260 cm, −15 cm) ein Ring zu sehen und bei (500 cm, −15 cm) ein gefüllter Punkt
- **AND** zwischen (0 cm, −15 cm) und dem Ring steht „260 cm“ waagerecht, zwischen dem Ring und (500 cm, −15 cm) steht „240 cm“
- **WHEN** er den Mauszeiger nach (262 cm, −60 cm) bewegt
- **THEN** ist weder Ring noch Abstand zu sehen

#### Scenario: Bezugsende wechselt mit dem Mauszeiger
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (437 cm, −14 cm) bewegt
- **THEN** ist der gefüllte Punkt bei (500 cm, −15 cm) und es stehen „435 cm“ und „65 cm“ an der Wand

### Requirement: Abstand auf der Wand eintippen
Ist noch kein Eckpunkt gesetzt und der Startpunkt an einer Wandlinie eingerastet, SHALL eine getippte Ziffer ein Feld „Abstand“ am Mauszeiger öffnen, das Zahlen mit Komma oder Punkt annimmt. Ab der ersten Ziffer MUST die Wandlinie mit ihrem Bezugsende fest bleiben, auch wenn sich der Mauszeiger bewegt, und die Anzeige SHALL den Punkt im eingetippten Abstand zeigen. Tab SHALL das Bezugsende wechseln. Enter SHALL den Startpunkt im eingetippten Abstand vom Bezugsende setzen, gerundet auf 0,1 cm.

#### Scenario: Startpunkt bei 260 cm
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und 15 cm Wanddicke, der Zoom steht auf 100 % und noch kein Eckpunkt ist gesetzt
- **AND** der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „260“ tippt
- **THEN** zeigt das Feld „Abstand: 260 cm“ und der Ring steht bei (260 cm, −15 cm)
- **WHEN** er Enter drückt
- **THEN** liegt der Startpunkt bei (260 cm, −15 cm)

#### Scenario: Bezugsende mit Tab wechseln
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 %, noch kein Eckpunkt ist gesetzt und der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „260“ tippt, Tab und dann Enter drückt
- **THEN** liegt der Startpunkt bei (240 cm, −15 cm), 260 cm vom rechten Wandende

#### Scenario: Wand bleibt beim Tippen fest
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 %, noch kein Eckpunkt ist gesetzt und der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „2“ tippt, den Mauszeiger nach (800 cm, 800 cm) bewegt, „60“ tippt und Enter drückt
- **THEN** liegt der Startpunkt bei (260 cm, −15 cm)

### Requirement: Abstand auf der Wand prüfen und abbrechen
Ein Abstand über der Länge der Kante MUST mit dem Hinweis „Darf höchstens L cm sein“ (L = Länge der Kante) abgelehnt werden; das Feld bleibt dann stehen. 0 cm SHALL den Startpunkt auf das Bezugsende setzen. Die Rücktaste SHALL das letzte Zeichen löschen und ein leeres Feld schließen. `Esc` SHALL das Feld ohne Punkt schließen. Ohne Wandposition MUST Ziffern vor dem ersten Eckpunkt wie bisher wirken.

#### Scenario: Null cm
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 %, noch kein Eckpunkt ist gesetzt und der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „0“ tippt und Enter drückt
- **THEN** liegt der Startpunkt bei (0 cm, −15 cm)

#### Scenario: Länger als die Wand
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 %, noch kein Eckpunkt ist gesetzt und der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „520“ tippt und Enter drückt
- **THEN** wird kein Punkt gesetzt und das Feld zeigt den Hinweis „Darf höchstens 500 cm sein“

#### Scenario: Eingabe abbrechen
- **GIVEN** der Nutzer hat an einer Wand „260“ getippt und noch kein Eckpunkt ist gesetzt
- **WHEN** er `Esc` drückt
- **THEN** ist das Feld geschlossen, kein Eckpunkt gesetzt und „Raum“ weiter aktiv
- **WHEN** er erneut `Esc` drückt
- **THEN** ist „Auswählen“ aktiv

#### Scenario: Ohne Wand
- **GIVEN** „Raum“ ist aktiv, noch kein Eckpunkt ist gesetzt und der Mauszeiger steht an keiner Wandlinie
- **WHEN** der Nutzer `0` drückt
- **THEN** öffnet sich kein Feld „Abstand“ und die Ansicht wird eingepasst

## MODIFIED Requirements

### Requirement: Vorrang beim Einrasten während des Zeichnens
Das Einrasten am Startpunkt oder an einer Raumecke MUST Vorrang vor dem Einrasten an einer Wandlinie haben, und das Einrasten an einer Wandlinie MUST Vorrang vor dem Einrasten an einer Hilfslinie haben; ein an einer Wandlinie eingerasteter Startpunkt rastet an keiner Hilfslinie ein. Ist eine Länge oder ein Abstand eingetippt, MUST der Eckpunkt genau im eingetippten Abstand liegen und keine Hilfslinie wirken oder erscheinen.

#### Scenario: Startpunkt vor Hilfslinie
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer 5 Bildschirmpixel neben dem Startpunkt (0 cm, 0 cm) klickt
- **THEN** wird der Umriss geschlossen

#### Scenario: Eingetippte Länge
- **GIVEN** der Zoom steht auf 100 %, die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt und der Mauszeiger steht bei (6 cm, 203 cm)
- **WHEN** der Nutzer „295“ tippt und Enter drückt
- **THEN** ist (5 cm, 200 cm) der vierte Eckpunkt
- **AND** während der Eingabe war keine Hilfslinie zu sehen

#### Scenario: Raumecke vor Wandposition
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (497 cm, 3 cm) klickt
- **THEN** liegt der Startpunkt genau bei (500 cm, 0 cm)

#### Scenario: Wandposition vor Hilfslinie
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ wie oben und der Raum „Bad“ hat eine Ecke bei (263 cm, −300 cm), noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer bei (262 cm, −17 cm) klickt
- **THEN** liegt der Startpunkt bei (260 cm, −15 cm)

### Requirement: Hilfslinien beim Zeichnen abschalten
Bei gedrückter Strg-Taste oder ausgeschaltetem Schalter „Einrasten“ MUST der nächste Eckpunkt an keiner Hilfslinie und an keiner Wandlinie einrasten, und es MUST weder eine Hilfslinie noch eine Wandposition erscheinen. Das Einrasten am Startpunkt, an Raumecken und auf 0°, 90°, 180° oder 270° MUST dabei unverändert wirken. Wird Strg losgelassen, SHALL das Einrasten an Hilfslinien und Wandlinien wieder wirken. Ein bereits geöffnetes Feld „Abstand“ MUST davon unberührt bleiben.

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

#### Scenario: Mit Strg ohne Wandposition
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und 15 cm Wanddicke, noch kein Eckpunkt ist gesetzt
- **WHEN** der Nutzer mit gedrückter Strg-Taste bei (262 cm, −17 cm) klickt
- **THEN** liegt der Startpunkt bei (262 cm, −17 cm)
- **AND** es war keine Wandposition zu sehen
