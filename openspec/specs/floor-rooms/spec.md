# floor-rooms Specification

## Purpose
Bildet den Grundriss einer Etage als Räume mit ihren exakten Innenmaßen in cm ab: Räume zeichnen, darstellen, auswählen, verschieben, umbenennen, über Kantenlängen anpassen und löschen, unabhängig von einer eingescannten Vorlage.

## Requirements

### Requirement: Gültiger Raum
Ein Raum SHALL eine eindeutige ID, einen Namen mit 1 bis 40 Zeichen ohne Leerzeichen am Rand und einen geschlossenen Umriss aus mindestens 3 Eckpunkten mit absoluten Koordinaten in cm haben. Jede Kante MUST länger als 0 cm sein, und der Umriss MUST NOT sich selbst überschneiden. Jeder Raum gehört genau einer Etage.

#### Scenario: Rechteckiger Raum
- **WHEN** ein Raum „Wohnen“ mit den Eckpunkten (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm) geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Zwei Eckpunkte
- **WHEN** ein Raum mit den Eckpunkten (0 cm, 0 cm) und (300 cm, 0 cm) geprüft wird
- **THEN** gilt er als ungültig

#### Scenario: Überschneidung
- **WHEN** ein Raum mit den Eckpunkten (0 cm, 0 cm), (300 cm, 300 cm), (300 cm, 0 cm), (0 cm, 300 cm) geprüft wird
- **THEN** gilt er als ungültig, weil sich zwei Kanten kreuzen

#### Scenario: Doppelter Eckpunkt
- **WHEN** ein Raum mit den Eckpunkten (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) geprüft wird
- **THEN** gilt er als ungültig, weil eine Kante 0 cm lang ist

### Requirement: Werkzeug „Raum“
Die Werkzeugleiste SHALL unter den Form-Werkzeugen das Werkzeug „Raum“ mit dem Tooltip „Raum – Innenmaße nachzeichnen (G)“ anbieten; die Taste `G` SHALL es wählen. Das Werkzeug MUST keine Kalibrierung voraussetzen und MUST im Kalibrier-Modus gesperrt sein.

#### Scenario: Werkzeug per Taste
- **GIVEN** „Auswählen“ ist aktiv und kein Eingabefeld hat den Fokus
- **WHEN** der Nutzer `G` drückt
- **THEN** ist „Raum“ als aktiv markiert

#### Scenario: Etage ohne Vorlage
- **GIVEN** die aktive Etage „Keller“ hat keine Vorlage
- **THEN** ist „Raum“ bedienbar

### Requirement: Kanten zeichnen
Mit „Raum“ SHALL der erste Klick den Startpunkt setzen und danach eine Kante vom letzten Punkt zum Mauszeiger mit ihrer Länge in cm (eine Nachkommastelle) zeigen. Die Kante MUST auf 0°, 90°, 180° oder 270° einrasten, die nächstliegende Richtung, bei gedrückter Umschalttaste nicht. Ein Klick SHALL den Endpunkt der gezeigten Kante als nächsten Eckpunkt setzen. Punkte werden auf 0,1 cm gerundet.

#### Scenario: Waagerechte Kante
- **GIVEN** „Raum“ ist aktiv und der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer den Mauszeiger nach (430 cm, 108 cm) bewegt
- **THEN** zeigt die Zeichenfläche eine waagerechte Kante bis (430 cm, 100 cm) mit der Beschriftung „330 cm“
- **WHEN** der Nutzer klickt
- **THEN** ist (430 cm, 100 cm) der zweite Eckpunkt

#### Scenario: Freier Winkel
- **GIVEN** der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer mit gedrückter Umschalttaste bei (400 cm, 200 cm) klickt
- **THEN** ist (400 cm, 200 cm) der zweite Eckpunkt

### Requirement: Länge eintippen
Während des Zeichnens SHALL das Tippen einer Ziffer ein Längenfeld am Mauszeiger öffnen, das Zahlen mit Komma oder Punkt annimmt. Enter SHALL einen Eckpunkt im eingegebenen Abstand vom letzten Punkt in der aktuell gezeigten Richtung setzen und das Feld leeren. Eine Länge, die nicht größer als 0 cm ist, MUST abgelehnt werden; das Feld bleibt dann mit Hinweis stehen. Rücktaste im Feld löscht das letzte Zeichen.

#### Scenario: Raum mit Maßen vom Scan
- **GIVEN** der Startpunkt liegt bei (0 cm, 0 cm) und der Mauszeiger rechts davon
- **WHEN** der Nutzer „337,5“ tippt und Enter drückt
- **THEN** liegt der zweite Eckpunkt bei (337,5 cm, 0 cm)
- **WHEN** er den Mauszeiger unter diesen Punkt bewegt, „560“ tippt und Enter drückt
- **THEN** liegt der dritte Eckpunkt bei (337,5 cm, 560 cm)

#### Scenario: Ungültige Länge
- **WHEN** der Nutzer „0“ tippt und Enter drückt
- **THEN** wird kein Punkt gesetzt und das Feld zeigt den Hinweis „Muss größer als 0 cm sein“

### Requirement: Eckpunkte einrasten
Liegt der Mauszeiger beim Zeichnen höchstens 8 Bildschirmpixel neben dem Startpunkt oder einer Ecke eines vorhandenen Raums der Etage, SHALL der nächste Eckpunkt genau dort liegen und die Stelle markiert werden. Dieses Einrasten MUST Vorrang vor dem Einrasten der Richtung haben.

#### Scenario: An Nachbarraum ansetzen
- **GIVEN** ein Raum hat eine Ecke bei (350 cm, 0 cm)
- **WHEN** der Nutzer mit „Raum“ 5 Bildschirmpixel neben dieser Ecke klickt
- **THEN** liegt der Startpunkt genau bei (350 cm, 0 cm)

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

### Requirement: Hilfslinie beim Zeichnen anzeigen
Solange der nächste Eckpunkt an einer Hilfslinie eingerastet ist, SHALL die Hilfslinie als gestrichelte Linie in der Auswahlfarbe vom Eckpunkt, durch den sie läuft, bis zum nächsten Eckpunkt zu sehen sein, höchstens eine je Achse. Rastet die Achse aus, MUST die Hilfslinie verschwinden.

#### Scenario: Hilfslinie zum Startpunkt
- **GIVEN** der Zoom steht auf 100 % und die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 200 cm) sind gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (6 cm, 203 cm) bewegt
- **THEN** ist eine gestrichelte senkrechte Linie in der Auswahlfarbe von (0 cm, 0 cm) bis (0 cm, 200 cm) zu sehen
- **WHEN** er den Mauszeiger nach (40 cm, 203 cm) bewegt
- **THEN** ist keine Hilfslinie mehr zu sehen

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

### Requirement: Raum schließen
Ein Klick auf den Startpunkt oder Enter bei leerem Längenfeld SHALL den Umriss schließen, sobald mindestens 3 Eckpunkte gesetzt sind. Der neue Raum SHALL „Raum n“ heißen mit der kleinsten Zahl n ab 1, die auf der Etage frei ist, ausgewählt sein, oben auf die Raumliste der Etage kommen, und das Werkzeug SHALL zu „Auswählen“ wechseln. Wäre der geschlossene Umriss ungültig, MUST er nicht entstehen und ein Hinweis erscheinen.

#### Scenario: Rechteck schließen
- **GIVEN** die Etage hat bereits „Raum 1“ und die Eckpunkte (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm) sind gesetzt
- **WHEN** der Nutzer auf den Startpunkt klickt
- **THEN** gibt es einen Raum „Raum 2“ mit diesen vier Eckpunkten
- **AND** er ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Zu früh geschlossen
- **GIVEN** nur 2 Eckpunkte sind gesetzt
- **WHEN** der Nutzer Enter bei leerem Längenfeld drückt
- **THEN** entsteht kein Raum und das Zeichnen geht weiter

### Requirement: Zeichnen korrigieren und abbrechen
Die Rücktaste bei leerem Längenfeld SHALL den zuletzt gesetzten Eckpunkt entfernen. Ein Eckpunkt, dessen Kante 0 cm lang wäre oder eine vorhandene Kante des Umrisses kreuzen würde, MUST NOT gesetzt werden; die Kante wird dann rot gezeigt. `Esc` SHALL einen angefangenen Umriss verwerfen und ohne angefangenen Umriss zu „Auswählen“ wechseln. Ein Etagenwechsel MUST den angefangenen Umriss verwerfen.

#### Scenario: Letzten Punkt zurücknehmen
- **GIVEN** drei Eckpunkte sind gesetzt
- **WHEN** der Nutzer die Rücktaste drückt
- **THEN** sind noch zwei Eckpunkte gesetzt

#### Scenario: Abbrechen
- **GIVEN** drei Eckpunkte sind gesetzt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** ist kein Eckpunkt mehr gesetzt und es ist kein Raum entstanden
- **WHEN** er erneut `Esc` drückt
- **THEN** ist „Auswählen“ aktiv

#### Scenario: Kreuzende Kante
- **GIVEN** die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (300 cm, 300 cm) sind gesetzt
- **WHEN** der Nutzer mit gedrückter Umschalttaste bei (150 cm, -100 cm) klickt
- **THEN** wird kein Punkt gesetzt, weil die Kante die erste Kante kreuzen würde

### Requirement: Räume darstellen
Das System SHALL jeden Raum der aktiven Etage mit einem dunklen Wandband außen um seinen Umriss, einem halbtransparenten Inneren in seiner Raumfarbe (ohne Raumfarbe weiß) und seinem Namen mittig im Raum in fester Bildschirmgröße zeichnen. Das Band MUST an jeder Kante so breit sein wie deren Wanddicke; an einer Ecke MUST es bis zum Schnittpunkt der Außenlinien beider Kanten reichen. Ein Wandband MUST NOT in das Innere eines Raums ragen. Räume MUST über der Vorlage und unter allen Möbeln liegen. Im Kalibrier-Modus MUST Räume ausgeblendet sein.

#### Scenario: Zwei Räume mit Lücke
- **GIVEN** „Wohnen“ endet rechts bei x = 337,5 cm und „Diele“ beginnt bei x = 349 cm
- **THEN** ist die Lücke von 11,5 cm vollständig als Wand gefüllt
- **AND** im Inneren beider Räume ist kein Wandband zu sehen

#### Scenario: Dicke Außenwand
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), Kante 1 (oben) hat die Wanddicke 36,5 cm, Kante 4 (links) 15 cm
- **THEN** reicht das Band über der oberen Kante von y = 0 cm bis y = −36,5 cm
- **AND** links reicht das Band von x = 0 cm bis x = −15 cm
- **AND** die Ecke oben links ist bis zum Punkt (−15 cm, −36,5 cm) ohne Lücke gefüllt

#### Scenario: Eingefärbter Raum
- **GIVEN** „Kind 1“ hat die Raumfarbe Grün und „Flur“ keine Raumfarbe
- **THEN** ist die Fläche von „Kind 1“ halbtransparent grün und die von „Flur“ halbtransparent weiß
- **AND** Wandband und Name von „Kind 1“ sehen aus wie bei „Flur“

#### Scenario: Möbel über Raum
- **GIVEN** ein Sofa liegt in „Wohnen“
- **THEN** ist das Sofa über dem Raum vollständig zu sehen

#### Scenario: Vorlage durchscheinend
- **GIVEN** die Etage hat eine sichtbare Vorlage
- **THEN** ist die Vorlage im Inneren der Räume weiterhin zu erkennen, auch in eingefärbten Räumen

### Requirement: Raum auswählen
Ist „Auswählen“ aktiv, SHALL ein Klick in das Innere eines Raums, an dem keine Form liegt, den Raum auswählen und eine ausgewählte Form abwählen. Ein ausgewählter Raum SHALL einen blauen Umriss zeigen. Es MUST höchstens eine Form oder ein Raum ausgewählt sein. Eine Form auswählen MUST einen ausgewählten Raum abwählen.

#### Scenario: Raum anklicken
- **GIVEN** ein Sofa ist ausgewählt
- **WHEN** der Nutzer in „Wohnen“ an eine Stelle ohne Form klickt
- **THEN** ist „Wohnen“ ausgewählt und zeigt einen blauen Umriss
- **AND** das Sofa ist nicht mehr ausgewählt

#### Scenario: Form im Raum anklicken
- **GIVEN** „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer auf das Sofa in „Wohnen“ klickt
- **THEN** ist das Sofa ausgewählt und „Wohnen“ nicht mehr

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

### Requirement: Eigenschaften eines Raums
Ist ein Raum ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Raum“, der Schloss-Schaltfläche (siehe „Raum sperren und entsperren“) und „Löschen“, das Feld „Name“, den Abschnitt „Farbe“ (siehe „Raumfarbe wählen“) und den Abschnitt „Kanten“ mit je Kante einer Zeile aus Längenfeld und Feld „Wand“ (Wanddicke), beide in cm, beginnend bei „Kante 1“ vom ersten zum zweiten Eckpunkt. Hat ein Kantenfeld oder ein Feld „Wand“ den Fokus, SHALL die Kante auf der Zeichenfläche hervorgehoben sein. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel eines Rechtecks
- **WHEN** der Nutzer den Raum „Wohnen“ mit 337,5 × 560 cm und 15 cm Wanddicke an jeder Kante auswählt
- **THEN** zeigt das Panel „Raum“, „Sperren“, „Löschen“, Name „Wohnen“ und die Felder Kante 1 „337,5“, Kante 2 „560“, Kante 3 „337,5“, Kante 4 „560“
- **AND** neben jedem Kantenfeld steht ein Feld „Wand“ mit „15“
- **AND** zwischen Name und „Kanten“ steht der Abschnitt „Farbe“

#### Scenario: Wandfeld hebt Kante hervor
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** ist Kante 2 auf der Zeichenfläche hervorgehoben

#### Scenario: Umbenennen
- **WHEN** der Nutzer im Feld „Name“ „Küche“ eingibt und Enter drückt
- **THEN** heißt der Raum „Küche“ und die Zeichenfläche zeigt „Küche“

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen löscht und das Feld verlässt
- **THEN** zeigt das Feld „Bitte einen Namen eingeben“ und der bisherige Name bleibt

### Requirement: Kantenlänge ändern
Eine neue Länge für Kante i SHALL die beiden Eckpunkte nach Kante i um die Differenz in Richtung von Kante i verschieben; die übernächste Kante gleicht die Änderung aus, alle anderen Kanten bleiben gleich. Würde dabei eine Kante 0 cm oder kürzer oder der Umriss sich überschneiden, MUST die Änderung abgelehnt werden und das Feld einen Hinweis zeigen.

#### Scenario: Rechteck bleibt Rechteck
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm)
- **WHEN** der Nutzer Kante 1 auf 350 cm setzt
- **THEN** hat der Raum die Eckpunkte (0 cm, 0 cm), (350 cm, 0 cm), (350 cm, 560 cm), (0 cm, 560 cm)
- **AND** Kante 3 ist ebenfalls 350 cm lang

#### Scenario: Dreieck
- **GIVEN** ein Raum hat die Eckpunkte (0 cm, 0 cm), (300 cm, 0 cm), (0 cm, 400 cm)
- **WHEN** der Nutzer Kante 1 auf 400 cm setzt
- **THEN** hat der Raum die Eckpunkte (0 cm, 0 cm), (400 cm, 0 cm), (100 cm, 400 cm)

#### Scenario: Kante würde verschwinden
- **GIVEN** ein L-förmiger Raum mit den Eckpunkten (0 cm, 0 cm), (400 cm, 0 cm), (400 cm, 120 cm), (280 cm, 120 cm), (280 cm, 300 cm), (0 cm, 300 cm)
- **WHEN** der Nutzer Kante 1 von 400 cm auf 280 cm verkürzt
- **THEN** wird die Eingabe mit dem Hinweis „Geht nicht: Kante 3 würde zu kurz“ abgelehnt
- **AND** der Raum ist unverändert

### Requirement: Wanddicke je Kante
Jede Kante eines Raums SHALL eine eigene Wanddicke in cm haben, die größer als 0 cm und höchstens 100 cm ist. Ein Raum MUST genau so viele Wanddicken wie Kanten haben; die erste gehört zu Kante 1. Ein neu gezeichneter Raum SHALL an jeder Kante die Wanddicke 15 cm haben.

#### Scenario: Neuer Raum
- **WHEN** der Nutzer einen Raum mit vier Eckpunkten zeichnet und schließt
- **THEN** hat jede der vier Kanten die Wanddicke 15 cm

#### Scenario: Zu dicke Wand
- **WHEN** ein Raum mit vier Kanten und den Wanddicken 36,5 cm, 15 cm, 15 cm und 120 cm geprüft wird
- **THEN** gilt er als ungültig

#### Scenario: Wanddicke fehlt
- **WHEN** ein Raum mit vier Kanten und nur drei Wanddicken geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Wanddicke ändern
Eine im Feld „Wand“ einer Kante übernommene Zahl SHALL die Wanddicke dieser Kante auf den auf 0,1 cm gerundeten Wert setzen, ohne Eckpunkte, Öffnungen oder andere Wanddicken zu ändern. Ein Wert, der nicht größer als 0 cm ist, MUST mit „Muss größer als 0 cm sein“ und ein Wert über 100 cm mit „Darf höchstens 100 cm sein“ abgelehnt werden; die Wanddicke bleibt dann unverändert.

#### Scenario: Außenwand
- **GIVEN** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und an jeder Kante 15 cm Wanddicke
- **WHEN** der Nutzer im Feld „Wand“ von Kante 1 „36,5“ eingibt und Enter drückt
- **THEN** hat Kante 1 die Wanddicke 36,5 cm und die übrigen Kanten 15 cm
- **AND** die Eckpunkte sind unverändert

#### Scenario: Null
- **WHEN** der Nutzer im Feld „Wand“ „0“ eingibt und das Feld verlässt
- **THEN** zeigt das Feld „Muss größer als 0 cm sein“ und die Wanddicke bleibt unverändert

#### Scenario: Zu dick
- **WHEN** der Nutzer im Feld „Wand“ „150“ eingibt und Enter drückt
- **THEN** zeigt das Feld „Darf höchstens 100 cm sein“ und die Wanddicke bleibt unverändert

### Requirement: Raumfarbe
Jeder Raum SHALL entweder eine Raumfarbe im Format `#RRGGBB` oder keine Raumfarbe („Standard“) haben. Ein neu gezeichneter Raum SHALL keine Raumfarbe haben.

#### Scenario: Neuer Raum
- **WHEN** der Nutzer einen Raum zeichnet und schließt
- **THEN** hat der Raum keine Raumfarbe und seine Fläche ist halbtransparent weiß

#### Scenario: Ungültige Farbe
- **WHEN** ein Raum mit der Raumfarbe „grün“ geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Raumfarbe wählen
Der Abschnitt „Farbe“ im Panel eines Raums SHALL die Farbfelder „Standard“, „Grau“, „Blau“, „Grün“, „Gelb“, „Orange“, „Rosa“ und „Violett“ und einen Farbwähler für jede andere Farbe zeigen. Das Feld der aktuellen Raumfarbe MUST markiert sein; passt keines, ist keines markiert. Ein Klick auf ein Farbfeld oder eine im Farbwähler bestätigte Farbe SHALL die Raumfarbe sofort setzen, „Standard“ entfernt sie.

#### Scenario: Grün wählen
- **GIVEN** der Raum „Kind 1“ ohne Raumfarbe ist ausgewählt und „Standard“ ist markiert
- **WHEN** der Nutzer auf „Grün“ klickt
- **THEN** ist die Fläche von „Kind 1“ halbtransparent grün und „Grün“ ist markiert

#### Scenario: Eigene Farbe
- **GIVEN** der Raum „Bad“ ist ausgewählt
- **WHEN** der Nutzer im Farbwähler #7DD3FC bestätigt
- **THEN** hat „Bad“ die Raumfarbe #7DD3FC und kein Farbfeld ist markiert

#### Scenario: Zurück auf Standard
- **GIVEN** „Kind 1“ hat die Raumfarbe Grün und ist ausgewählt
- **WHEN** der Nutzer auf „Standard“ klickt
- **THEN** hat „Kind 1“ keine Raumfarbe und seine Fläche ist halbtransparent weiß

### Requirement: Raum löschen
„Löschen“ im Panel und `Entf` bzw. Rücktaste bei ausgewähltem, nicht gesperrtem Raum ohne Fokus in einem Eingabefeld SHALL den Raum ohne Rückfrage löschen und die Auswahl aufheben. Möbel MUST dabei unverändert bleiben. Ein gesperrter Raum bleibt erhalten (siehe „Gesperrten Raum nicht löschen“).

#### Scenario: Raum mit Entf löschen
- **GIVEN** „Diele“ ist ausgewählt und ein Schrank liegt darin
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist „Diele“ gelöscht und nichts ist ausgewählt
- **AND** der Schrank ist unverändert vorhanden

### Requirement: Räume beim Löschen einer Etage
Hat eine Etage Räume, SHALL das Löschen der Etage nachfragen, auch ohne Formen und Kalibrierung, und die Rückfrage MUST die Zahl der Räume nennen. Mit der Etage MUST ihre Raumliste entfernt werden.

#### Scenario: Etage mit Räumen
- **GIVEN** das Dachgeschoss hat 2 Formen und 3 Räume
- **WHEN** der Nutzer es im Dialog „Etagen“ löschen will
- **THEN** fragt das System „Etage „Dachgeschoss“ mit 2 Formen und 3 Räumen löschen?“

### Requirement: Einpassen mit Räumen
Das Einpassen einer Etage SHALL alle Räume der Etage vollständig sichtbar machen, zusammen mit der Vorlage und den Möbeln.

#### Scenario: Räume ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage und zwei Räume, die zusammen von (0 cm, 0 cm) bis (900 cm, 600 cm) reichen
- **WHEN** der Nutzer `0` drückt
- **THEN** sind beide Räume vollständig sichtbar und die Ansicht ist auf sie zentriert

### Requirement: Raum sperren und entsperren
Bei ausgewähltem Raum SHALL der Panel-Kopf neben „Löschen“ eine Schaltfläche mit Schloss-Icon zeigen, wie bei Formen: nicht gesperrt mit Tooltip „Sperren“, gesperrt als gedrücktes geschlossenes Schloss mit Tooltip „Entsperren“. Ein Klick wechselt den Zustand und bildet einen Rückgängig-Schritt. Der Raum MUST ausgewählt bleiben, und der Sperrzustand MUST im Plan gespeichert werden.

#### Scenario: Raum sperren
- **GIVEN** der nicht gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer im Panel-Kopf auf „Sperren“ klickt
- **THEN** ist „Wohnen“ gesperrt und weiterhin ausgewählt
- **AND** die Schaltfläche zeigt ein geschlossenes Schloss mit dem Tooltip „Entsperren“

#### Scenario: Raum entsperren
- **GIVEN** der gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer auf „Entsperren“ klickt
- **THEN** ist „Wohnen“ nicht mehr gesperrt und lässt sich wieder ziehen

#### Scenario: Sperre bleibt nach dem Neuladen
- **GIVEN** „Wohnen“ wurde gesperrt
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist „Wohnen“ weiterhin gesperrt

#### Scenario: Sperren rückgängig machen
- **GIVEN** „Wohnen“ wurde gesperrt
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** ist „Wohnen“ nicht mehr gesperrt

### Requirement: Gesperrter Raum auf der Zeichenfläche
Ein gesperrter Raum SHALL sich per Klick auswählen lassen und den blauen Umriss zeigen. Ziehen an einem gesperrten Raum MUST die Ansicht verschieben statt des Raums, auch wenn er ausgewählt ist.

#### Scenario: Gesperrten Raum ziehen
- **GIVEN** der gesperrte Raum „Diele“ ist ausgewählt und seine linke obere Ecke liegt bei (349 cm, 0 cm)
- **WHEN** der Nutzer mit „Auswählen“ in der Diele 50 cm nach rechts zieht
- **THEN** liegt die Ecke weiterhin bei (349 cm, 0 cm)
- **AND** die Ansicht hat sich verschoben

#### Scenario: Gesperrten Raum auswählen
- **WHEN** der Nutzer in den gesperrten Raum „Diele“ an eine Stelle ohne Form klickt
- **THEN** ist „Diele“ ausgewählt und zeigt einen blauen Umriss

### Requirement: Gesperrter Raum im Eigenschaften-Panel
Bei einem gesperrten Raum MUST das Panel die Kantenlängen („Kante n“) und Wanddicken („Wand“) schreibgeschützt anzeigen. Name und Farbe SHALL änderbar bleiben. Ein Kantenfeld oder Feld „Wand“ mit Fokus SHALL die Kante weiterhin hervorheben.

#### Scenario: Kantenlänge schreibgeschützt
- **GIVEN** der gesperrte Raum „Wohnen“ mit Kante 1 = 337,5 cm ist ausgewählt
- **WHEN** der Nutzer in das Feld „Kante 1“ klickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 337,5 cm
- **AND** Kante 1 ist auf der Zeichenfläche hervorgehoben

#### Scenario: Wanddicke schreibgeschützt
- **GIVEN** der gesperrte Raum „Wohnen“ mit 15 cm Wanddicke an Kante 2 ist ausgewählt
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 15 cm

#### Scenario: Gesperrten Raum umbenennen
- **GIVEN** der gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer im Feld „Name“ „Wohnzimmer“ eingibt und Enter drückt
- **THEN** heißt der Raum „Wohnzimmer“ und ist weiterhin gesperrt

#### Scenario: Gesperrten Raum einfärben
- **GIVEN** der gesperrte Raum „Bad“ ist ausgewählt
- **WHEN** der Nutzer eine andere Raumfarbe wählt
- **THEN** hat „Bad“ die neue Farbe und ist weiterhin gesperrt

### Requirement: Gesperrten Raum nicht löschen
Ein gesperrter Raum MUST sich weder mit `Entf` noch mit der Rücktaste noch über „Löschen“ entfernen lassen. „Löschen“ MUST bei gesperrtem Raum gesperrt sein und den Tooltip „Gesperrt – zuerst entsperren“ zeigen.

#### Scenario: Entf bei gesperrtem Raum
- **GIVEN** der gesperrte Raum „Diele“ ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist „Diele“ weiterhin vorhanden und ausgewählt

#### Scenario: Löschen-Schaltfläche gesperrt
- **WHEN** der gesperrte Raum „Diele“ ausgewählt ist
- **THEN** ist „Löschen“ im Panel-Kopf gesperrt und zeigt den Tooltip „Gesperrt – zuerst entsperren“

### Requirement: Raum-Sperre gilt für alle Bearbeitungswege
Das System MUST jede Änderung an Eckpunkten oder Wanddicken eines gesperrten Raums ablehnen und einen gesperrten Raum nicht löschen, unabhängig davon, wie die Änderung ausgelöst wird; abgelehnte Änderungen bilden keinen Rückgängig-Schritt. Rückgängig, Wiederholen und Import sind ausgenommen, ebenso das Löschen der ganzen Etage.

#### Scenario: Rückgängig über die Sperre hinweg
- **GIVEN** „Diele“ wurde um 20 cm verschoben und danach gesperrt
- **WHEN** der Nutzer zweimal Strg+Z drückt
- **THEN** ist „Diele“ nicht mehr gesperrt und liegt an ihrer Ausgangslage

#### Scenario: Etage mit gesperrtem Raum löschen
- **GIVEN** das Obergeschoss enthält den gesperrten Raum „Bad“
- **WHEN** der Nutzer das Obergeschoss löscht und die Rückfrage bestätigt
- **THEN** ist das Obergeschoss samt „Bad“ gelöscht

### Requirement: Öffnungen in gesperrten Räumen
Türen, Fenster und Durchgänge eines gesperrten Raums SHALL sich wie in einem nicht gesperrten Raum setzen, entlang der Kante ziehen, ändern und löschen lassen. Der Raum selbst MUST dabei unverändert und gesperrt bleiben.

#### Scenario: Tür in gesperrten Raum setzen
- **GIVEN** der Raum „Wohnen“ ist gesperrt und das Werkzeug „Tür“ ist aktiv
- **WHEN** der Nutzer auf Kante 1 von „Wohnen“ klickt
- **THEN** hat „Wohnen“ eine neue Tür auf Kante 1
- **AND** „Wohnen“ hat unveränderte Eckpunkte und ist weiterhin gesperrt

#### Scenario: Fenster in gesperrtem Raum ziehen
- **GIVEN** „Wohnen“ ist gesperrt und hat auf einer 500 cm langen Kante ein Fenster mit Abstand 100 cm
- **WHEN** der Nutzer das Fenster entlang der Kante nach rechts zieht
- **THEN** hat das Fenster einen größeren Abstand als 100 cm
- **AND** „Wohnen“ hat unveränderte Eckpunkte und ist weiterhin gesperrt

### Requirement: Raum haftet an der Nachbarwand
Beim Ziehen SHALL ein Raum an einer Kante eines anderen Raums derselben Etage haften, wenn eine seiner Kanten ihr parallel gegenüberliegt, beide sich entlang der Wand überlappen und seine Mauslage (Lage ohne Raster und Haften) quer zur Wand höchstens 8 Bildschirmpixel von der Haftlage entfernt ist. In der Haftlage MUST der Abstand der Innenkanten der dickeren Wanddicke beider Kanten entsprechen. Gesperrte Räume zählen mit.

#### Scenario: An Nachbarwand heranschieben
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm) und an jeder Kante 15 cm Wanddicke
- **AND** die ausgewählte „Diele“ (200 cm × 300 cm, 15 cm Wanddicke) hat ihre linke obere Ecke bei (400 cm, 100 cm)
- **WHEN** der Nutzer die Diele 50 cm nach links zieht
- **THEN** liegt die linke obere Ecke der Diele bei (352,5 cm, 100 cm)
- **AND** zwischen beiden Räumen ist genau eine 15 cm dicke Wand zu sehen

#### Scenario: Dickere Wand zählt
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** die rechte Kante von „Wohnen“ bei x = 337,5 cm hat 24 cm Wanddicke, die linke Kante der Diele 15 cm
- **WHEN** der Nutzer die Diele so zieht, dass ihre linke Kante in der Mauslage bei x = 365 cm läge
- **THEN** liegt die linke Kante der Diele bei x = 361,5 cm

#### Scenario: Zu weit entfernt
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm und „Wohnen“ endet rechts bei x = 337,5 cm mit 15 cm Wanddicke
- **WHEN** der Nutzer die Diele so zieht, dass ihre linke Kante bei x = 380 cm liegt
- **THEN** haftet die Diele nicht und ihre linke Kante liegt bei x = 380 cm

#### Scenario: Kanten liegen sich nicht gegenüber
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm und „Wohnen“ reicht von y = 0 cm bis y = 560 cm
- **WHEN** der Nutzer die Diele so zieht, dass ihre linke Kante bei x = 355 cm liegt und die Diele vollständig unterhalb von y = 600 cm liegt
- **THEN** haftet die Diele nicht und ihre linke Kante liegt bei x = 355 cm

#### Scenario: Gesperrter Nachbar
- **GIVEN** „Wohnen“ ist gesperrt
- **WHEN** der Nutzer die Diele nahe an die rechte Kante von „Wohnen“ zieht
- **THEN** haftet die Diele an „Wohnen“ und „Wohnen“ bleibt unverändert und gesperrt

#### Scenario: Raum auf anderer Etage
- **GIVEN** im Obergeschoss liegt ein Raum genau über der Stelle neben „Wohnen“ im Erdgeschoss
- **WHEN** der Nutzer im Erdgeschoss die Diele an diese Stelle zieht
- **THEN** haftet die Diele nur an Räumen des Erdgeschosses

### Requirement: Entlang der Wand ziehen
Ein haftender Raum SHALL beim Weiterziehen entlang der Wand an ihr bleiben; entlang der Wand bewegt er sich weiter im Raster. Liegen sich die beiden Kanten nicht mehr gegenüber, MUST sich der Raum lösen.

#### Scenario: Entlang gleiten
- **GIVEN** die Diele haftet mit ihrer linken Kante bei x = 352,5 cm an „Wohnen“
- **WHEN** der Nutzer die Diele weitere 100 cm nach unten und dabei 5 cm nach rechts zieht
- **THEN** liegt die linke Kante der Diele weiterhin bei x = 352,5 cm und die Diele liegt 100 cm tiefer

#### Scenario: Über das Wandende hinaus
- **GIVEN** die Diele haftet an der rechten Kante von „Wohnen“, die bis y = 560 cm reicht
- **WHEN** der Nutzer die Diele so weit nach unten zieht, dass ihre Oberkante unterhalb von y = 600 cm liegt
- **THEN** haftet die Diele nicht mehr

### Requirement: Raum von der Wand lösen
Ein haftender Raum MUST NOT sich lösen, solange der Mauszeiger quer zur Wand höchstens 24 Bildschirmpixel von der Haftlage abweicht, in beide Richtungen. Weicht er weiter ab, SHALL sich der Raum lösen und wieder der Mauslage im Raster folgen. Kommt er der Wand danach wieder auf höchstens 8 Bildschirmpixel nahe, SHALL er erneut haften.

#### Scenario: Leichtes Wegziehen hält
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** die Diele haftet mit ihrer linken Kante bei x = 352,5 cm an „Wohnen“
- **WHEN** der Nutzer die Maus 20 cm nach rechts bewegt
- **THEN** liegt die linke Kante der Diele weiterhin bei x = 352,5 cm

#### Scenario: Losreißen
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** die Diele haftet mit ihrer linken Kante bei x = 352,5 cm an „Wohnen“
- **WHEN** der Nutzer die Maus 30 cm nach rechts bewegt
- **THEN** haftet die Diele nicht mehr und ihre linke Kante folgt der Maus im Raster

#### Scenario: In die Wand drücken
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** die Diele haftet mit ihrer linken Kante bei x = 352,5 cm an „Wohnen“
- **WHEN** der Nutzer die Maus 20 cm nach links bewegt
- **THEN** liegt die linke Kante der Diele weiterhin bei x = 352,5 cm

#### Scenario: Gleich große Wirkung beim Zoomen
- **GIVEN** die Ansicht zeigt 2 Bildschirmpixel je cm und die Diele haftet an „Wohnen“
- **WHEN** der Nutzer die Maus 20 Bildschirmpixel (10 cm) von der Wand weg bewegt
- **THEN** haftet die Diele weiterhin
- **WHEN** er die Maus insgesamt 30 Bildschirmpixel (15 cm) von der Wand weg bewegt
- **THEN** haftet die Diele nicht mehr

### Requirement: Ecken bündig einrasten
Haftet ein Raum an einer Wand, SHALL eine Ecke seiner haftenden Kante entlang der Wand auf eine Ecke der Nachbarkante einrasten, wenn sie in der Mauslage entlang der Wand höchstens 8 Bildschirmpixel davon entfernt liegt. Liegen mehrere Ecken so nahe, MUST die nächste gewinnen.

#### Scenario: Oberkanten in einer Flucht
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** die Diele haftet an der rechten Kante von „Wohnen“ (Ecken bei y = 0 cm und y = 560 cm)
- **WHEN** der Nutzer die Diele so zieht, dass ihre Oberkante in der Mauslage bei y = 5 cm läge
- **THEN** liegt die Oberkante der Diele bei y = 0 cm

#### Scenario: Unterkanten in einer Flucht
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm, die Diele ist 300 cm hoch und haftet an der rechten Kante von „Wohnen“
- **WHEN** der Nutzer die Diele so zieht, dass ihre Unterkante in der Mauslage bei y = 555 cm läge
- **THEN** liegt die Unterkante der Diele bei y = 560 cm

#### Scenario: Weit weg von jeder Ecke
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm und die Diele haftet an der rechten Kante von „Wohnen“
- **WHEN** der Nutzer die Diele so zieht, dass ihre Oberkante bei y = 100 cm liegt
- **THEN** liegt die Oberkante der Diele bei y = 100 cm

### Requirement: An zwei Wänden haften
Ein Raum SHALL gleichzeitig an zwei Kanten anderer Räume haften können, wenn diese Kanten nicht parallel zueinander sind; er liegt dann an beiden in der Haftlage. Jede der beiden Haftungen MUST sich unabhängig von der anderen lösen.

#### Scenario: In eine Ecke schieben
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm
- **AND** „Wohnen“ endet rechts bei x = 337,5 cm, darüber liegt „Küche“ mit ihrer Unterkante bei y = −15 cm von x = 0 cm bis x = 600 cm, beide Kanten mit 15 cm Wanddicke
- **WHEN** der Nutzer die Diele so zieht, dass ihre linke obere Ecke in der Mauslage bei (357 cm, 4 cm) läge
- **THEN** liegt die linke obere Ecke der Diele bei (352,5 cm, 0 cm)
- **AND** sowohl die rechte Kante von „Wohnen“ als auch die Unterkante von „Küche“ sind hervorgehoben

### Requirement: Haftende Wand markieren
Solange ein gezogener Raum an einer Kante haftet, SHALL die Zeichenfläche diese Kante des Nachbarraums in der Auswahlfarbe hervorheben. Löst sich der Raum oder endet das Ziehen, MUST die Markierung verschwinden.

#### Scenario: Markierung beim Haften
- **WHEN** die Diele beim Ziehen an der rechten Kante von „Wohnen“ haftet
- **THEN** ist die rechte Kante von „Wohnen“ hervorgehoben
- **WHEN** der Nutzer die Maustaste loslässt
- **THEN** ist keine Kante von „Wohnen“ mehr hervorgehoben

### Requirement: Haften abschalten
Ist beim Ziehen eines Raums die Strg-Taste gedrückt, MUST der Raum an keiner Wand haften und keine Ecke einrasten; er folgt dann nur dem Raster (mit Alt dem feinen Raster). Wird Strg losgelassen, SHALL das Haften wieder wirken.

#### Scenario: Mit Strg frei ziehen
- **GIVEN** die Ansicht zeigt 1 Bildschirmpixel je cm und „Wohnen“ endet rechts bei x = 337,5 cm mit 15 cm Wanddicke
- **WHEN** der Nutzer die Diele mit gedrückter Strg-Taste so zieht, dass ihre linke Kante bei x = 355 cm liegt
- **THEN** haftet die Diele nicht und ihre linke Kante liegt bei x = 355 cm

### Requirement: Verschieben mit Haften als ein Schritt
Ein Verschieben mit Haften SHALL wie jedes Verschieben erst beim Loslassen den Plan ändern und genau einen Rückgängig-Schritt bilden; die Eckpunkte MUST auf 0,1 cm gerundet werden.

#### Scenario: Haften rückgängig machen
- **GIVEN** die Diele lag mit ihrer linken oberen Ecke bei (400 cm, 100 cm) und wurde an „Wohnen“ haftend nach (352,5 cm, 100 cm) verschoben
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** liegt die linke obere Ecke der Diele wieder bei (400 cm, 100 cm)
