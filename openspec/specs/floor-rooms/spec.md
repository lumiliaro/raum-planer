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
Ziehen an einem ausgewählten Raum mit „Auswählen“ SHALL den ganzen Raum verschieben, relativ zur Startlage auf 5 cm gerastert, bei gedrückter Alt-Taste auf 1 cm. Ziehen an einem nicht ausgewählten Raum MUST die Ansicht verschieben. Möbel MUST beim Verschieben eines Raums an ihrer Stelle bleiben.

#### Scenario: Raum ziehen
- **GIVEN** „Diele“ ist ausgewählt und ihre linke obere Ecke liegt bei (349 cm, 0 cm)
- **WHEN** der Nutzer die Diele 23 cm nach rechts zieht
- **THEN** liegt die Ecke bei (374 cm, 0 cm) und alle Kantenlängen sind unverändert

#### Scenario: Nicht ausgewählter Raum
- **GIVEN** kein Raum ist ausgewählt
- **WHEN** der Nutzer in „Wohnen“ an einer Stelle ohne Form zieht
- **THEN** verschiebt sich die Ansicht und der Raum behält seine Lage

### Requirement: Eigenschaften eines Raums
Ist ein Raum ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Raum“ und „Löschen“, das Feld „Name“, den Abschnitt „Farbe“ (siehe „Raumfarbe wählen“) und den Abschnitt „Kanten“ mit je Kante einer Zeile aus Längenfeld und Feld „Wand“ (Wanddicke), beide in cm, beginnend bei „Kante 1“ vom ersten zum zweiten Eckpunkt. Hat ein Kantenfeld oder ein Feld „Wand“ den Fokus, SHALL die Kante auf der Zeichenfläche hervorgehoben sein. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel eines Rechtecks
- **WHEN** der Nutzer den Raum „Wohnen“ mit 337,5 × 560 cm und 15 cm Wanddicke an jeder Kante auswählt
- **THEN** zeigt das Panel „Raum“, „Löschen“, Name „Wohnen“ und die Felder Kante 1 „337,5“, Kante 2 „560“, Kante 3 „337,5“, Kante 4 „560“
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
„Löschen“ im Panel und `Entf` bzw. Rücktaste bei ausgewähltem Raum ohne Fokus in einem Eingabefeld SHALL den Raum ohne Rückfrage löschen und die Auswahl aufheben. Möbel MUST dabei unverändert bleiben.

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
