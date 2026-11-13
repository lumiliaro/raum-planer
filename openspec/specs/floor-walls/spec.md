# floor-walls Specification

## Purpose
Ergänzt die Räume einer Etage um einzelne, freie Wände (z. B. Trennwand, Halbwand, Vorsprung), die als gerades Stück mit Mittellinie und Dicke in cm gezeichnet, dargestellt, verschoben, angepasst und gelöscht werden.

## Requirements

### Requirement: Gültige Wand
Eine Wand SHALL eine eindeutige ID, einen Startpunkt und einen Endpunkt ihrer Mittellinie mit absoluten Koordinaten in cm und eine Dicke in cm haben. Die Mittellinie MUST mindestens 0,1 cm lang sein; die Dicke MUST größer als 0 cm und höchstens 100 cm sein. Jede Wand gehört genau einer Etage.

#### Scenario: Gerade Wand
- **WHEN** eine Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) mit 15 cm Dicke geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Wand ohne Länge
- **WHEN** eine Wand von (100 cm, 100 cm) nach (100 cm, 100 cm) geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Zu dicke Wand
- **WHEN** eine Wand von (0 cm, 0 cm) nach (300 cm, 0 cm) mit 120 cm Dicke geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Werkzeug „Wand“
Die Werkzeugleiste SHALL direkt unter „Raum“ das Werkzeug „Wand“ mit dem Tooltip „Wand – einzelne Wand zeichnen (W)“ anbieten; die Taste `W` SHALL es wählen. Das Werkzeug MUST keinen Raum und keine Kalibrierung voraussetzen und MUST im Kalibrier-Modus gesperrt sein.

#### Scenario: Werkzeug per Taste
- **GIVEN** „Auswählen“ ist aktiv und kein Eingabefeld hat den Fokus
- **WHEN** der Nutzer `W` drückt
- **THEN** ist „Wand“ als aktiv markiert

#### Scenario: Leere Etage
- **GIVEN** die aktive Etage „Keller“ hat weder Vorlage noch Räume
- **THEN** ist „Wand“ bedienbar

### Requirement: Wand zeichnen
Mit „Wand“ SHALL der erste Klick den Startpunkt setzen. Danach SHALL die Zeichenfläche die Wand vom Startpunkt zum Mauszeiger als Band in der neuen Dicke mit der Länge der Mittellinie in cm zeigen. Die Richtung MUST auf 0°, 90°, 180° oder 270° einrasten, bei gedrückter Umschalttaste nicht. Der zweite Klick SHALL den Endpunkt setzen und die Wand anlegen. Punkte werden auf 0,1 cm gerundet.

#### Scenario: Waagerechte Wand
- **GIVEN** „Wand“ ist aktiv, die Wanddicke neuer Räume steht auf 15 cm und der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer den Mauszeiger nach (430 cm, 108 cm) bewegt
- **THEN** zeigt die Zeichenfläche ein waagerechtes Band bis (430 cm, 100 cm) mit der Beschriftung „330 cm“
- **WHEN** der Nutzer klickt
- **THEN** gibt es eine Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) mit 15 cm Dicke

#### Scenario: Freier Winkel
- **GIVEN** der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer mit gedrückter Umschalttaste bei (400 cm, 200 cm) klickt
- **THEN** gibt es eine Wand von (100 cm, 100 cm) nach (400 cm, 200 cm)

### Requirement: Neue Wand übernehmen
Eine neu gezeichnete Wand SHALL die Wanddicke neuer Räume aus den Einstellungen bekommen, ans Ende der Wandliste der Etage kommen und ausgewählt sein, und das Werkzeug SHALL zu „Auswählen“ wechseln.

#### Scenario: Nach dem zweiten Klick
- **GIVEN** die Wanddicke neuer Räume steht auf 11,5 cm und der Startpunkt liegt bei (0 cm, 0 cm)
- **WHEN** der Nutzer bei (0 cm, 250 cm) klickt
- **THEN** hat die neue Wand 11,5 cm Dicke und ist ausgewählt
- **AND** „Auswählen“ ist aktiv

### Requirement: Wandlänge eintippen
Ist der Startpunkt gesetzt, SHALL das Tippen einer Ziffer ein Längenfeld am Mauszeiger öffnen, das Zahlen mit Komma oder Punkt annimmt. Enter SHALL den Endpunkt im eingegebenen Abstand vom Startpunkt in der aktuell gezeigten Richtung setzen und die Wand anlegen. Eine Länge, die nicht größer als 0 cm ist, MUST mit dem Hinweis „Muss größer als 0 cm sein“ abgelehnt werden. Rücktaste im Feld löscht das letzte Zeichen.

#### Scenario: Wand mit Maß vom Scan
- **GIVEN** der Startpunkt liegt bei (0 cm, 0 cm) und der Mauszeiger unterhalb davon
- **WHEN** der Nutzer „237,5“ tippt und Enter drückt
- **THEN** gibt es eine Wand von (0 cm, 0 cm) nach (0 cm, 237,5 cm)

#### Scenario: Ungültige Länge
- **GIVEN** der Startpunkt ist gesetzt
- **WHEN** der Nutzer „0“ tippt und Enter drückt
- **THEN** entsteht keine Wand und das Feld zeigt „Muss größer als 0 cm sein“

### Requirement: Wandpunkte an Ecken und Wandenden einrasten
Liegt der Mauszeiger beim Setzen von Start- oder Endpunkt höchstens 8 Bildschirmpixel neben einer Ecke eines Raums der Etage oder einem Ende einer anderen Wand der Etage, SHALL der Punkt genau dort liegen und die Stelle mit einem Ring markiert werden. Dieses Einrasten MUST Vorrang vor dem Einrasten der Richtung haben.

#### Scenario: An Raumecke ansetzen
- **GIVEN** der Zoom steht auf 100 % und ein Raum hat eine Ecke bei (500 cm, 0 cm)
- **WHEN** der Nutzer mit „Wand“ 5 Bildschirmpixel neben dieser Ecke klickt
- **THEN** liegt der Startpunkt genau bei (500 cm, 0 cm)

#### Scenario: Zwei Wände zu einer Ecke verbinden
- **GIVEN** der Zoom steht auf 100 %, es gibt eine Wand von (0 cm, 0 cm) nach (300 cm, 0 cm) und der Startpunkt einer neuen Wand liegt bei (300 cm, 200 cm)
- **WHEN** der Nutzer bei (303 cm, 4 cm) klickt
- **THEN** gibt es eine neue Wand von (300 cm, 200 cm) nach (300 cm, 0 cm)

### Requirement: Hilfslinien beim Wandzeichnen
Beim Zeichnen mit „Wand“ SHALL es waagerechte und senkrechte Hilfslinien durch die Ecken der Räume und die Enden der Wände der Etage geben. Liegt der Punkt, den ein Klick setzen würde, höchstens 8 Bildschirmpixel neben einer Hilfslinie, SHALL er auf der nächstliegenden liegen. Bei gerader Wand MUST nur die Achse quer zur Wand einrasten; beim Startpunkt und mit Umschalttaste rastet jede Achse für sich ein.

#### Scenario: Wand bis in die Flucht der Raumecke
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und der Startpunkt einer Wand liegt bei (600 cm, 50 cm)
- **WHEN** der Nutzer bei (603 cm, 396 cm) klickt
- **THEN** gibt es eine Wand von (600 cm, 50 cm) nach (600 cm, 400 cm)

#### Scenario: Startpunkt in der Flucht
- **GIVEN** der Zoom steht auf 100 % und der Raum „Wohnen“ wie oben
- **WHEN** der Nutzer mit „Wand“ ohne gesetzten Startpunkt bei (700 cm, 404 cm) klickt
- **THEN** liegt der Startpunkt bei (700 cm, 400 cm)

#### Scenario: In der Flucht eines Wandendes
- **GIVEN** der Zoom steht auf 100 %, es gibt eine Wand von (0 cm, 0 cm) nach (0 cm, 300 cm) und der Startpunkt einer neuen Wand liegt bei (200 cm, 0 cm)
- **WHEN** der Nutzer bei (195 cm, 305 cm) klickt
- **THEN** gibt es eine neue Wand von (200 cm, 0 cm) nach (200 cm, 300 cm)

### Requirement: Hilfslinie beim Wandzeichnen anzeigen
Solange der Punkt an einer Hilfslinie eingerastet ist, SHALL die Hilfslinie als gestrichelte Linie in der Auswahlfarbe von der Ecke bzw. dem Wandende, durch das sie läuft, bis zum Punkt zu sehen sein, höchstens eine je Achse. Rastet die Achse aus, MUST die Hilfslinie verschwinden.

#### Scenario: Hilfslinie zur Raumecke
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ wie oben und der Startpunkt einer Wand liegt bei (600 cm, 50 cm)
- **WHEN** der Nutzer den Mauszeiger nach (603 cm, 396 cm) bewegt
- **THEN** ist eine gestrichelte waagerechte Linie in der Auswahlfarbe von (500 cm, 400 cm) bis (600 cm, 400 cm) zu sehen und die Wand ist mit „350 cm“ beschriftet
- **WHEN** er den Mauszeiger nach (603 cm, 360 cm) bewegt
- **THEN** ist keine Hilfslinie mehr zu sehen

### Requirement: Wandlinien beim Wandzeichnen
Beim Zeichnen mit „Wand“ SHALL es Wandlinien geben: die Innen- und Außenseite jeder Raumkante wie beim Zeichnen eines Raums (siehe `floor-rooms`: „Startpunkt auf einer Wand“) und die beiden Seiten jeder anderen Wand der Etage, also ihre Mittellinie um die halbe Dicke zu beiden Seiten versetzt, gemessen zwischen den Enden der Wand.

#### Scenario: Seiten einer Wand
- **GIVEN** es gibt eine Wand von (100 cm, 200 cm) nach (400 cm, 200 cm) mit 10 cm Dicke
- **THEN** liefert sie die Wandlinien von (100 cm, 195 cm) nach (400 cm, 195 cm) und von (100 cm, 205 cm) nach (400 cm, 205 cm), je 300 cm lang

### Requirement: Startpunkt einer Wand auf einer Wandlinie
Ist noch kein Startpunkt gesetzt, SHALL der Startpunkt auf den Wandlinien einrasten, angezeigt und per eingetipptem Abstand gesetzt werden wie der erste Eckpunkt eines Raums (siehe `floor-rooms`: „Lage auf der Wand im Raster“, „Wandposition anzeigen“, „Abstand auf der Wand eintippen“, „Abstand auf der Wand prüfen und abbrechen“).

#### Scenario: Innenseite einer Raumwand
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und 15 cm Wanddicke, „Wand“ ist aktiv und kein Startpunkt gesetzt
- **WHEN** der Nutzer bei (262 cm, 4 cm) klickt
- **THEN** liegt der Startpunkt bei (260 cm, 0 cm)

#### Scenario: Seite einer anderen Wand
- **GIVEN** der Zoom steht auf 100 %, es gibt eine Wand von (100 cm, 200 cm) nach (400 cm, 200 cm) mit 10 cm Dicke und kein Startpunkt ist gesetzt
- **WHEN** der Nutzer den Mauszeiger nach (232 cm, 207 cm) bewegt
- **THEN** ist bei (230 cm, 205 cm) ein Ring zu sehen und an der Wandseite stehen „130 cm“ und „170 cm“
- **WHEN** er klickt
- **THEN** liegt der Startpunkt bei (230 cm, 205 cm)

#### Scenario: Abstand eintippen
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 %, kein Startpunkt ist gesetzt und der Mauszeiger steht bei (100 cm, −14 cm)
- **WHEN** der Nutzer „260“ tippt und Enter drückt
- **THEN** liegt der Startpunkt bei (260 cm, −15 cm)

### Requirement: Endpunkt einer Wand an einer Wandlinie
Ist der Startpunkt gesetzt und liegt der Mauszeiger höchstens 8 Bildschirmpixel neben einer Wandlinie, SHALL der Endpunkt im Schnittpunkt der Mittellinie (in der gezeigten Richtung) mit dieser Wandlinie liegen und mit einem Ring markiert werden. Der Schnittpunkt MUST zwischen den Enden der Wandlinie und höchstens 8 Bildschirmpixel vom Mauszeiger liegen; Wandlinien parallel zur Wand MUST unberücksichtigt bleiben.

#### Scenario: Trennwand von Wand zu Wand
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ mit 15 cm Wanddicke wie oben und der Startpunkt einer Wand liegt bei (260 cm, 0 cm)
- **WHEN** der Nutzer den Mauszeiger nach (262 cm, 396 cm) bewegt
- **THEN** zeigt die Zeichenfläche die Wand bis (260 cm, 400 cm) mit „400 cm“ und einem Ring am Endpunkt

#### Scenario: Bis an eine andere Wand
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ wie oben, eine Wand von (100 cm, 200 cm) nach (400 cm, 200 cm) mit 10 cm Dicke und der Startpunkt einer neuen Wand liegt bei (250 cm, 0 cm)
- **WHEN** der Nutzer bei (252 cm, 193 cm) klickt
- **THEN** gibt es eine neue Wand von (250 cm, 0 cm) nach (250 cm, 195 cm)

#### Scenario: Schräg zur Wandlinie
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ wie oben und der Startpunkt einer Wand liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer mit gedrückter Umschalttaste den Mauszeiger nach (401 cm, 397 cm) bewegt
- **THEN** zeigt die Zeichenfläche die Wand bis (404 cm, 400 cm)

### Requirement: Vorrang beim Einrasten während des Wandzeichnens
Das Einrasten an einer Raumecke oder einem Wandende MUST Vorrang vor dem Einrasten an einer Wandlinie haben, und das Einrasten an einer Wandlinie MUST Vorrang vor dem Einrasten an einer Hilfslinie haben. Ist eine Länge oder ein Abstand eingetippt, MUST der Punkt genau im eingetippten Abstand liegen und keine Hilfslinie wirken oder erscheinen.

#### Scenario: Wandlinie vor Hilfslinie
- **GIVEN** der Zoom steht auf 100 %, eine Wand von (100 cm, 200 cm) nach (400 cm, 200 cm) mit 10 cm Dicke und der Startpunkt einer neuen Wand liegt bei (250 cm, 0 cm)
- **WHEN** der Nutzer bei (252 cm, 193 cm) klickt
- **THEN** endet die neue Wand bei (250 cm, 195 cm) an der Wandseite, nicht bei (250 cm, 200 cm) auf der Hilfslinie durch die Wandenden

#### Scenario: Eingetippte Länge
- **GIVEN** der Zoom steht auf 100 %, die Wand und der Startpunkt wie oben und der Mauszeiger steht bei (252 cm, 193 cm)
- **WHEN** der Nutzer „180“ tippt und Enter drückt
- **THEN** gibt es eine neue Wand von (250 cm, 0 cm) nach (250 cm, 180 cm)
- **AND** während der Eingabe war weder Hilfslinie noch Ring am Endpunkt zu sehen

### Requirement: Hilfslinien beim Wandzeichnen abschalten
Bei gedrückter Strg-Taste oder ausgeschaltetem Schalter „Einrasten“ MUST der Punkt an keiner Hilfslinie und an keiner Wandlinie einrasten, und es MUST weder Hilfslinie noch Wandposition erscheinen. Das Einrasten an Raumecken, Wandenden und auf 0°, 90°, 180° oder 270° MUST dabei unverändert wirken. Wird Strg losgelassen, SHALL das Einrasten wieder wirken.

#### Scenario: Mit Strg ohne Wandlinie
- **GIVEN** der Zoom steht auf 100 %, eine Wand von (100 cm, 200 cm) nach (400 cm, 200 cm) mit 10 cm Dicke und der Startpunkt einer neuen Wand liegt bei (250 cm, 0 cm)
- **WHEN** der Nutzer mit gedrückter Strg-Taste bei (252 cm, 193 cm) klickt
- **THEN** gibt es eine neue Wand von (250 cm, 0 cm) nach (250 cm, 193 cm)

#### Scenario: Schalter „Einrasten“ aus
- **GIVEN** der Schalter „Einrasten“ ist aus, der Zoom steht auf 100 % und der Raum „Wohnen“ wie oben
- **WHEN** der Nutzer mit „Wand“ ohne gesetzten Startpunkt bei (700 cm, 404 cm) klickt
- **THEN** liegt der Startpunkt bei (700 cm, 404 cm)

### Requirement: Wandzeichnen korrigieren und abbrechen
Die Rücktaste bei leerem Längenfeld SHALL den Startpunkt entfernen; „Wand“ bleibt aktiv. Ein Endpunkt auf dem Startpunkt MUST NOT gesetzt werden. `Esc` SHALL einen gesetzten Startpunkt verwerfen und ohne Startpunkt zu „Auswählen“ wechseln. Ein Etagenwechsel MUST den Startpunkt verwerfen.

#### Scenario: Startpunkt zurücknehmen
- **GIVEN** „Wand“ ist aktiv und der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer die Rücktaste drückt
- **THEN** ist kein Startpunkt gesetzt und „Wand“ weiter aktiv

#### Scenario: Abbrechen
- **GIVEN** der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer `Esc` drückt
- **THEN** ist kein Startpunkt gesetzt und keine Wand entstanden
- **WHEN** er erneut `Esc` drückt
- **THEN** ist „Auswählen“ aktiv

#### Scenario: Klick auf den Startpunkt
- **GIVEN** der Startpunkt liegt bei (100 cm, 100 cm)
- **WHEN** der Nutzer genau auf den Startpunkt klickt
- **THEN** entsteht keine Wand und der Startpunkt bleibt gesetzt

### Requirement: Wände darstellen
Das System SHALL jede Wand der aktiven Etage als Band in der Wandfarbe des Plans zeichnen, je Seite der Mittellinie halb so breit wie ihre Dicke, an freien Enden gerade abgeschnitten. Wände MUST über den Räumen und unter allen Möbeln liegen und im Kalibrier-Modus ausgeblendet sein. Wände und Wandbänder von Räumen MUST sich einfach überlagern, ohne verbunden zu werden.

#### Scenario: Band um die Mittellinie
- **GIVEN** eine Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) mit 15 cm Dicke
- **THEN** füllt sie in der Wandfarbe das Rechteck von (100 cm, 92,5 cm) bis (430 cm, 107,5 cm)

#### Scenario: Wand über einem Raum
- **GIVEN** eine Wand liegt im Raum „Wohnen“ und ein Schrank liegt teilweise auf der Wand
- **THEN** verdeckt die Wand die Raumfläche und der Schrank liegt über der Wand

### Requirement: Ecken zwischen Wänden schließen
Liegt ein Ende einer Wand genau auf einem Ende einer anderen Wand der Etage, SHALL das Band beider Wände an diesem Ende um ihre halbe Dicke über das Ende hinaus verlängert gezeichnet werden, damit die Ecke geschlossen ist. Die gespeicherten Punkte und die angezeigte Länge MUST dabei unverändert bleiben.

#### Scenario: L-Ecke aus zwei Wänden
- **GIVEN** zwei Wände mit je 10 cm Dicke, von (0 cm, 0 cm) nach (300 cm, 0 cm) und von (300 cm, 0 cm) nach (300 cm, 200 cm)
- **THEN** ist das Quadrat von (295 cm, −5 cm) bis (305 cm, 5 cm) vollständig in der Wandfarbe gefüllt
- **AND** die Wände sind mit „300 cm“ und „200 cm“ beschriftet, wenn die Maßanzeige an ist

### Requirement: Maße der Wände
Bei eingeschalteter Maßanzeige SHALL an jeder Wand der aktiven Etage die Länge ihrer Mittellinie in cm mit höchstens einer Nachkommastelle und Komma stehen, mittig und parallel zur Wand, neben dem Band, in der Farbe der Raumnamen und lesbar wie die Maße der Räume.

#### Scenario: Schräge Wand
- **GIVEN** die Maßanzeige ist an und eine Wand verläuft von (0 cm, 0 cm) nach (300 cm, 400 cm)
- **THEN** steht neben ihrer Mitte „500 cm“ entlang der Wand geneigt

### Requirement: Wand auswählen
Ein Klick mit „Auswählen“ auf das Band einer Wand SHALL die Wand auswählen und eine ausgewählte Form, einen ausgewählten Raum oder eine ausgewählte Öffnung abwählen. Die ausgewählte Wand SHALL mit einer Umrandung in der Auswahlfarbe und Griffen an beiden Enden markiert werden. Ein Klick auf eine freie Stelle SHALL die Auswahl aufheben.

#### Scenario: Wand anklicken
- **GIVEN** der Raum „Wohnen“ ist ausgewählt und eine Wand liegt darin
- **WHEN** der Nutzer auf das Band der Wand klickt
- **THEN** ist die Wand ausgewählt und „Wohnen“ nicht mehr

### Requirement: Wand verschieben
Ziehen an einer ausgewählten Wand mit „Auswählen“ SHALL die ganze Wand verschieben, relativ zur Startlage auf den Fangschritt gerastert (Werkseinstellung 5 cm), bei gedrückter Alt-Taste auf den feinen Fangschritt (Werkseinstellung 1 cm). Länge, Richtung und Dicke MUST gleich bleiben. Ziehen an einer nicht ausgewählten Wand MUST die Ansicht verschieben.

#### Scenario: Wand ziehen
- **GIVEN** die Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) ist ausgewählt und die Fangschritte haben die Werkseinstellung
- **WHEN** der Nutzer sie 52 cm nach rechts und 18 cm nach unten zieht
- **THEN** verläuft die Wand von (150 cm, 120 cm) nach (480 cm, 120 cm)

#### Scenario: Feine Schritte
- **GIVEN** die Wand wie oben ist ausgewählt
- **WHEN** der Nutzer sie mit gedrückter Alt-Taste 52 cm nach rechts zieht
- **THEN** verläuft die Wand von (152 cm, 100 cm) nach (482 cm, 100 cm)

### Requirement: Wandende ziehen
Ziehen an einem Griff einer ausgewählten Wand SHALL nur dieses Ende verschieben; das andere Ende MUST bleiben. Das gezogene Ende SHALL vom anderen Ende aus einrasten wie der Endpunkt beim Zeichnen (Richtung, Raumecken, Enden anderer Wände, Wandlinien, Hilfslinien, Umschalt- und Strg-Taste). Während des Ziehens SHALL die Länge an der Wand stehen. Ein Ende auf dem anderen Ende MUST NOT entstehen; die Wand bleibt dann beim letzten gültigen Stand.

#### Scenario: Wand verlängern
- **GIVEN** der Zoom steht auf 100 % und die Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) ist ausgewählt
- **WHEN** der Nutzer den Griff am Ende (430 cm, 100 cm) nach (520 cm, 106 cm) zieht
- **THEN** verläuft die Wand von (100 cm, 100 cm) nach (520 cm, 100 cm)

#### Scenario: Ende frei drehen
- **GIVEN** die Wand wie oben ist ausgewählt
- **WHEN** der Nutzer den Griff am Ende mit gedrückter Umschalttaste nach (400 cm, 250 cm) zieht
- **THEN** verläuft die Wand von (100 cm, 100 cm) nach (400 cm, 250 cm)

#### Scenario: Ende an eine Raumwand
- **GIVEN** der Zoom steht auf 100 %, der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und eine ausgewählte Wand von (260 cm, 0 cm) nach (260 cm, 300 cm)
- **WHEN** der Nutzer den Griff am Ende nach (262 cm, 397 cm) zieht
- **THEN** verläuft die Wand von (260 cm, 0 cm) nach (260 cm, 400 cm)

### Requirement: Eigenschaften einer Wand
Ist eine Wand ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Wand“ und „Löschen“ sowie die Felder „Länge“ und „Dicke“, beide in cm. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel einer Wand
- **WHEN** der Nutzer die Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) mit 15 cm Dicke auswählt
- **THEN** zeigt das Panel „Wand“, „Löschen“, Länge „330“ und Dicke „15“

### Requirement: Wandlänge ändern
Eine im Feld „Länge“ übernommene Zahl SHALL den Endpunkt so in Richtung der Wand verschieben, dass die Mittellinie diese Länge hat, gerundet auf 0,1 cm; der Startpunkt MUST bleiben. Ein Wert, der nicht größer als 0 cm ist, MUST mit „Muss größer als 0 cm sein“ abgelehnt werden.

#### Scenario: Wand kürzen
- **GIVEN** die Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) ist ausgewählt
- **WHEN** der Nutzer im Feld „Länge“ „300“ eingibt und Enter drückt
- **THEN** verläuft die Wand von (100 cm, 100 cm) nach (400 cm, 100 cm)

#### Scenario: Null
- **WHEN** der Nutzer im Feld „Länge“ „0“ eingibt und das Feld verlässt
- **THEN** zeigt das Feld „Muss größer als 0 cm sein“ und die Wand bleibt unverändert

### Requirement: Wanddicke einer Wand ändern
Eine im Feld „Dicke“ übernommene Zahl SHALL die Dicke der Wand auf den auf 0,1 cm gerundeten Wert setzen, ohne Start- und Endpunkt zu ändern. Ein Wert, der nicht größer als 0 cm ist, MUST mit „Muss größer als 0 cm sein“ und ein Wert über 100 cm mit „Darf höchstens 100 cm sein“ abgelehnt werden.

#### Scenario: Dicke ändern
- **GIVEN** die Wand von (100 cm, 100 cm) nach (430 cm, 100 cm) mit 15 cm Dicke ist ausgewählt
- **WHEN** der Nutzer im Feld „Dicke“ „24“ eingibt und Enter drückt
- **THEN** hat die Wand 24 cm Dicke und verläuft weiter von (100 cm, 100 cm) nach (430 cm, 100 cm)

#### Scenario: Zu dick
- **WHEN** der Nutzer im Feld „Dicke“ „150“ eingibt und Enter drückt
- **THEN** zeigt das Feld „Darf höchstens 100 cm sein“ und die Dicke bleibt unverändert

### Requirement: Wand löschen
„Löschen“ im Panel und `Entf` bzw. Rücktaste bei ausgewählter Wand ohne Fokus in einem Eingabefeld SHALL die Wand ohne Rückfrage löschen und die Auswahl aufheben. Räume und Möbel MUST dabei unverändert bleiben.

#### Scenario: Wand mit Entf löschen
- **GIVEN** eine Wand ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist die Wand gelöscht und nichts ist ausgewählt

### Requirement: Wände beim Löschen einer Etage
Hat eine Etage Wände, SHALL das Löschen der Etage nachfragen, auch ohne Formen, Räume und Kalibrierung, und die Rückfrage MUST die Zahl der Wände nennen. Mit der Etage MUST ihre Wandliste entfernt werden.

#### Scenario: Etage nur mit Wänden
- **GIVEN** der Keller hat keine Formen und Räume, aber 2 Wände
- **WHEN** der Nutzer ihn im Dialog „Etagen“ löschen will
- **THEN** fragt das System „Etage „Keller“ mit 2 Wänden löschen?“

### Requirement: Wandänderungen als Schritte
Das Anlegen einer Wand, ein vollständiges Ziehen einer Wand oder eines Wandendes, eine übernommene Länge oder Dicke und das Löschen einer Wand SHALL je genau einen Schritt im Verlauf bilden. Das Setzen des Startpunkts und abgelehnte Eingaben MUST keinen Schritt bilden. Nach Rückgängig oder Wiederholen SHALL die Etage der Änderung aktiv sein.

#### Scenario: Gezeichnete Wand rückgängig
- **GIVEN** der Nutzer hat eine Wand gezeichnet
- **WHEN** er Strg+Z drückt
- **THEN** ist die Wand wieder entfernt
- **WHEN** er Strg+Y drückt
- **THEN** ist die Wand wieder da

#### Scenario: Ende ziehen rückgängig
- **GIVEN** der Nutzer hat das Ende einer Wand in einem Zug von (430 cm, 100 cm) nach (520 cm, 100 cm) gezogen
- **WHEN** er Strg+Z drückt
- **THEN** endet die Wand wieder bei (430 cm, 100 cm)
