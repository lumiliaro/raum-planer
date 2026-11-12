# room-openings Specification

## Purpose
Ergänzt Räume um Türen und Fenster als Öffnungen auf einer Raumkante, damit Durchgänge, Türaufschläge und Fenster im Plan sichtbar sind und die Möbelplanung sich nach ihnen richten kann.

## Requirements

### Requirement: Gültige Öffnung
Jeder Raum SHALL eine Liste von Öffnungen haben, die leer sein darf. Eine Öffnung MUST eine im Plan eindeutige ID, die Art „Tür“, „Fenster“ oder „Durchgang“, eine Kante des Raums, eine Breite größer als 0 cm und einen Abstand vom Anfang der Kante von mindestens 0 cm haben; Abstand und Breite zusammen MUST höchstens die Kantenlänge betragen. Eine Tür MUST genau einen Aufschlag haben (Anschlag an einem Ende, nach innen oder außen); ein Fenster und ein Durchgang MUST keinen Aufschlag haben.

#### Scenario: Tür auf der Kante
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** eine Tür mit Breite 80 cm und Abstand 160 cm auf dieser Kante geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Ragt über die Kante hinaus
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** ein Fenster mit Breite 120 cm und Abstand 400 cm auf dieser Kante geprüft wird
- **THEN** gilt es als ungültig

#### Scenario: Unbekannte Kante
- **GIVEN** ein Raum mit 4 Ecken
- **WHEN** eine Tür auf der fünften Kante geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Fenster mit Aufschlag
- **WHEN** ein Fenster mit einem Aufschlag nach innen geprüft wird
- **THEN** gilt es als ungültig

#### Scenario: Tür ohne Aufschlag
- **WHEN** eine Tür ohne Aufschlag geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Durchgang über die ganze Kante
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** ein Durchgang ohne Aufschlag mit Breite 500 cm und Abstand 0 cm auf dieser Kante geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Durchgang mit Aufschlag
- **WHEN** ein Durchgang mit einem Aufschlag nach innen geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Lücke im Wandband
Jede Öffnung SHALL auf ihrer Breite eine Lücke in alle Wandbänder schneiden, die an dieser Stelle außen an der Kante liegen, auch in das Band eines angrenzenden Raums. Die Lücke MUST mindestens durch die ganze Wanddicke ihrer eigenen Kante reichen. Die Lücke MUST den Blick auf die Vorlage darunter freigeben und darf keine Fläche in Hintergrundfarbe über die Vorlage legen. Raumflächen und Möbel MUST darüber unverändert sichtbar bleiben.

#### Scenario: Tür zwischen zwei Räumen
- **GIVEN** Flur und Bad liegen 12 cm auseinander, beide Wandbänder füllen den Spalt
- **AND** auf der Badkante liegt eine Tür mit Breite 80 cm
- **THEN** ist an dieser Stelle auf 80 cm Breite weder das Band des Bads noch das Band des Flurs zu sehen

#### Scenario: Sehr dicke Wand
- **GIVEN** die obere Kante von „Keller“ hat die Wanddicke 60 cm und darauf liegt ein Fenster mit Breite 100 cm
- **THEN** ist das Band an dieser Stelle auf 100 cm Breite über die ganzen 60 cm geöffnet

#### Scenario: Vorlage bleibt sichtbar
- **GIVEN** unter dem Raum liegt eine sichtbare Vorlage
- **THEN** ist die Vorlage in der Lücke eines Fensters zu sehen

### Requirement: Darstellung von Tür und Fenster
Eine Tür SHALL ihr Türblatt als durchgezogene Linie vom Anschlag senkrecht zur Kante auf die gewählte Seite und den Aufschlag als gestrichelten Viertelkreis bis zum anderen Ende der Lücke zeigen. Ein Fenster SHALL in der Lücke ein Rechteck mit Mittellinie zeigen, das von der Kante über die ganze Wanddicke seiner Kante nach außen reicht. Linien MUST bei jedem Zoom gleich dick erscheinen. Im Kalibrier-Modus MUST Öffnungen wie die Räume ausgeblendet sein.

#### Scenario: Tür nach innen
- **GIVEN** eine Tür mit Breite 80 cm, Anschlag links, Aufschlag nach innen
- **THEN** steht das 80 cm lange Türblatt am linken Ende der Lücke senkrecht in den Raum
- **AND** ein gestrichelter Viertelkreis verbindet sein Ende mit dem rechten Ende der Lücke

#### Scenario: Fenster
- **GIVEN** ein Fenster mit Breite 120 cm auf einer Kante mit 15 cm Wanddicke
- **THEN** zeigt die Lücke ein 120 cm breites und 15 cm tiefes Rechteck mit Mittellinie und kein Türblatt

#### Scenario: Fenster in dicker Außenwand
- **GIVEN** ein Fenster mit Breite 120 cm auf einer Kante mit 36,5 cm Wanddicke
- **THEN** reicht sein Rechteck von der Kante 36,5 cm nach außen, die Mittellinie liegt 18,25 cm vor der Kante

### Requirement: Werkzeuge „Tür“ und „Fenster“
Die Werkzeugleiste SHALL direkt unter „Raum“ die Werkzeuge „Tür“ und „Fenster“ mit eigenem Icon und den Tooltips „Tür – in der Raumwand (T)“ und „Fenster (F)“ anbieten. Die Tasten T und F MUST sie aktivieren, außer ein Eingabefeld hat den Fokus. Hat die aktive Etage keinen Raum oder ist der Kalibrier-Modus aktiv, MUST beide samt Taste gesperrt sein; der Tooltip nennt dann „zuerst einen Raum zeichnen“.

#### Scenario: Werkzeug per Taste
- **GIVEN** auf der aktiven Etage gibt es den Raum „Wohnen“ und „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste F drückt
- **THEN** ist das Werkzeug „Fenster“ aktiv und markiert

#### Scenario: Etage ohne Raum
- **GIVEN** die aktive Etage hat keinen Raum
- **WHEN** der Nutzer auf „Tür“ klickt oder die Taste T drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** der Tooltip lautet „Tür – zuerst einen Raum zeichnen“

### Requirement: Öffnung setzen
Mit „Tür“ oder „Fenster“ SHALL ein Klick auf eine Raumkante, auf ihr Wandband oder höchstens 10 Bildschirmpixel neben sie eine Öffnung auf der nächstgelegenen Kante setzen, mittig an der Klickstelle, außer sie rastet an einem Rastpunkt ein (siehe „Rastpunkte für Öffnungen“). Eine Tür ist 80 cm breit, Anschlag links, Aufschlag nach innen; ein Fenster ist 120 cm breit. Die Öffnung MUST auf die Kante geschoben und bei kürzerer Kante auf deren Länge verkleinert werden. Danach ist sie ausgewählt und „Auswählen“ aktiv.

#### Scenario: Tür in die obere Wand
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und „Tür“ ist aktiv
- **WHEN** der Nutzer auf das Wandband der oberen Kante bei x = 200 cm klickt
- **THEN** liegt dort eine Tür mit Breite 80 cm und Abstand zur linken Ecke 160 cm
- **AND** sie schlägt nach innen auf, mit Anschlag links
- **AND** sie ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Klick nahe der Ecke
- **GIVEN** „Fenster“ ist aktiv
- **WHEN** der Nutzer auf die obere Kante von „Wohnen“ bei x = 20 cm klickt
- **THEN** entsteht ein Fenster mit Breite 120 cm und Abstand zur linken Ecke 0 cm

#### Scenario: Kurze Kante
- **GIVEN** ein Raum hat eine 60 cm lange Kante und „Tür“ ist aktiv
- **WHEN** der Nutzer auf diese Kante klickt
- **THEN** entsteht eine Tür mit Breite 60 cm und Abstand 0 cm

#### Scenario: Klick in den Raum
- **GIVEN** „Tür“ ist aktiv
- **WHEN** der Nutzer in die Mitte von „Wohnen“ klickt, mehr als 10 Bildschirmpixel von jeder Kante entfernt
- **THEN** entsteht keine Öffnung und „Tür“ bleibt aktiv

#### Scenario: Esc bricht ab
- **GIVEN** „Fenster“ ist aktiv
- **WHEN** der Nutzer Esc drückt
- **THEN** ist „Auswählen“ aktiv und es wurde keine Öffnung gesetzt

### Requirement: Öffnung auswählen
Mit „Auswählen“ SHALL ein Klick auf die Lücke, das Türblatt, den Aufschlag oder das Fenstersymbol einer Öffnung diese auswählen und hervorheben; eine darüberliegende Möbelform hat Vorrang. Es MUST höchstens eine Form, ein Raum oder eine Öffnung ausgewählt sein. Das Panel MUST dann die Öffnung zeigen. Esc und ein Klick auf eine leere Stelle heben die Auswahl auf.

#### Scenario: Fenster anklicken
- **GIVEN** in „Wohnen“ gibt es ein Fenster auf Kante 1, und „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer auf das Fenstersymbol klickt
- **THEN** ist das Fenster in der Auswahlfarbe hervorgehoben und „Wohnen“ nicht mehr ausgewählt
- **AND** das Panel zeigt „Fenster“ mit Breite und Abstand

### Requirement: Öffnung entlang der Kante ziehen
Ziehen einer ausgewählten oder angeklickten Öffnung SHALL sie entlang ihrer Kante verschieben, relativ zur Startlage in 5-cm-Schritten, mit gedrückter Alt-Taste in 1-cm-Schritten, außer sie rastet an einem Rastpunkt ein (siehe „Rastpunkte für Öffnungen“). Die Öffnung MUST auf ihrer Kante bleiben und an deren Enden anhalten. Ein vollständiges Ziehen MUST genau einen Rückgängig-Schritt bilden.

#### Scenario: Tür verschieben
- **GIVEN** der Zoom steht auf 100 % und eine Tür mit Breite 80 cm und Abstand zur linken Ecke 160 cm liegt auf einer 500 cm langen Kante
- **WHEN** der Nutzer sie um 37 cm nach rechts zieht
- **THEN** hat sie den Abstand 195 cm

#### Scenario: Am Kantenende
- **GIVEN** dieselbe Tür
- **WHEN** der Nutzer sie um 400 cm nach rechts zieht
- **THEN** hat sie den Abstand 420 cm und endet genau an der rechten Ecke

### Requirement: Eigenschaften einer Öffnung
Ist eine Öffnung ausgewählt, SHALL das Panel im Kopf „Tür“, „Fenster“ bzw. „Durchgang“, den Raum und „Löschen“ zeigen, darunter „Breite“ und „Abstand zur linken Ecke“ in cm. Links ist das Kantenende, das von innen auf die Wand gesehen links liegt. Felder werden wie im Eigenschaften-Formular der Formen übernommen. Würde die Öffnung nicht mehr auf die Kante passen, MUST der Wert abgelehnt werden und das Feld die Grenze nennen.

#### Scenario: Breite ändern
- **GIVEN** eine Tür mit Breite 80 cm und Abstand 160 cm auf einer 500 cm langen Kante ist ausgewählt
- **WHEN** der Nutzer die Breite auf 90 cm ändert
- **THEN** ist die Tür 90 cm breit und hat weiter den Abstand 160 cm

#### Scenario: Zu breit
- **GIVEN** dieselbe Tür ist ausgewählt
- **WHEN** der Nutzer die Breite 400 cm eingibt
- **THEN** bleibt die Breite 80 cm
- **AND** das Feld zeigt „Darf höchstens 340 cm sein“

#### Scenario: Durchgang im Panel
- **GIVEN** in „Eltern“ liegt ein Durchgang mit Breite 100 cm und Abstand 210 cm zur linken Ecke
- **WHEN** der Nutzer ihn auswählt
- **THEN** zeigt das Panel „Durchgang“, „Eltern“, „Löschen“, Breite „100“, Abstand zur linken Ecke „210“ und das Kästchen „Ganze Kante“ ohne Haken
- **AND** es zeigt weder „Aufschlag“ noch „Anschlag“

#### Scenario: Fenster im Panel
- **GIVEN** in „Wohnen“ liegt ein Fenster mit Breite 120 cm und Abstand 190 cm zur linken Ecke auf einer 500 cm langen Kante
- **WHEN** der Nutzer es auswählt
- **THEN** zeigt das Panel „Fenster“, „Wohnen“, „Löschen“, Breite „120“, Abstand zur linken Ecke „190“ und das Kästchen „Ganze Kante“ ohne Haken

### Requirement: Aufschlag einer Tür
Ist eine Tür ausgewählt, SHALL das Panel „Aufschlag“ mit „Nach innen“ und „Nach außen“ und „Anschlag“ mit „Links“ und „Rechts“ zeigen, jeweils von innen gesehen; die aktuelle Wahl ist markiert. Eine Tür ohne Aufschlag MUST NOT wählbar sein. Jede Auswahl wirkt sofort und ist ein Rückgängig-Schritt.

#### Scenario: Nach außen
- **GIVEN** eine Tür mit Aufschlag nach innen und Anschlag links ist ausgewählt
- **WHEN** der Nutzer „Nach außen“ wählt
- **THEN** zeigt das Türblatt aus dem Raum heraus, weiterhin am linken Ende

#### Scenario: Anschlag wechseln
- **GIVEN** eine Tür mit Breite 80 cm, Anschlag links und Aufschlag nach innen ist ausgewählt
- **WHEN** der Nutzer „Rechts“ wählt
- **THEN** steht das Türblatt am rechten Ende der Lücke und schlägt weiterhin nach innen auf

### Requirement: Öffnung löschen
„Löschen“ im Panel und die Tasten Entf und Rücktaste ohne Fokus in einem Eingabefeld SHALL die ausgewählte Öffnung ohne Rückfrage entfernen und die Auswahl aufheben. Das Wandband MUST danach an dieser Stelle wieder geschlossen sein. Wird ein Raum gelöscht, MUST das System seine Öffnungen mitlöschen.

#### Scenario: Fenster löschen
- **GIVEN** ein Fenster ist ausgewählt
- **WHEN** der Nutzer Entf drückt
- **THEN** ist das Fenster entfernt und das Wandband an seiner Stelle geschlossen

### Requirement: Öffnungen bei Änderungen am Raum
Ändert sich die Form eines Raums ohne Änderung der Eckenzahl, z. B. über eine Kantenlänge, SHALL jede Öffnung ihren Abstand zu dem Ende ihrer Kante behalten, das liegen geblieben ist; bewegen sich beide Enden gleich, bleibt der Abstand zum Anfang der Kante. Passt eine Öffnung danach nicht mehr auf ihre Kante, MUST die ganze Änderung abgelehnt werden, und das Feld zeigt „Geht nicht: Tür auf Kante n passt nicht mehr“ bzw. „… Fenster …“ oder „… Durchgang …“.

#### Scenario: Raum wird breiter
- **GIVEN** der Raum „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm)
- **AND** auf Kante 3 (unten) liegt ein Fenster von x = 280 cm bis x = 400 cm, sein Abstand zur linken Ecke ist 100 cm
- **WHEN** der Nutzer Kante 1 auf 520 cm setzt
- **THEN** liegt das Fenster weiterhin von x = 280 cm bis x = 400 cm
- **AND** sein Abstand zur linken Ecke ist 120 cm

#### Scenario: Tür passt nicht mehr
- **GIVEN** auf Kante 1 von „Wohnen“ liegt eine Tür von x = 160 cm bis x = 240 cm
- **WHEN** der Nutzer Kante 1 auf 200 cm setzt
- **THEN** wird die Änderung abgelehnt und Kante 1 bleibt 500 cm lang
- **AND** das Feld zeigt „Geht nicht: Tür auf Kante 1 passt nicht mehr“

#### Scenario: Offene Kante wird kürzer
- **GIVEN** auf Kante 1 von „Wohnen“ liegt ein Durchgang mit Breite 500 cm und Abstand 0 cm
- **WHEN** der Nutzer Kante 1 auf 480 cm setzt
- **THEN** wird die Änderung abgelehnt
- **AND** das Feld zeigt „Geht nicht: Durchgang auf Kante 1 passt nicht mehr“

#### Scenario: Raum verschieben
- **GIVEN** „Wohnen“ hat eine Tür mit Abstand 160 cm auf der oberen Kante
- **WHEN** der Nutzer den Raum um 100 cm nach rechts zieht
- **THEN** wandert die Tür mit und hat weiter den Abstand 160 cm

### Requirement: Öffnungen im Verlauf
Setzen, Ziehen, eine übernommene Eingabe oder Auswahl im Panel und Löschen einer Öffnung SHALL je einen Rückgängig-Schritt bilden. Betrifft ein Rückgängig oder Wiederholen genau eine Öffnung, die danach vorhanden ist, MUST deren Etage aktiv und die Öffnung ausgewählt sein.

#### Scenario: Tür verschieben rückgängig
- **GIVEN** der Nutzer hat im Erdgeschoss eine Tür verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv
- **AND** die Tür liegt an ihrer Ausgangslage und ist ausgewählt

#### Scenario: Setzen rückgängig
- **GIVEN** der Nutzer hat ein Fenster gesetzt, es ist ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Fenster verschwunden und nichts ist ausgewählt

### Requirement: Werkzeug „Durchgang“
Die Werkzeugleiste SHALL direkt unter „Fenster“ das Werkzeug „Durchgang“ mit eigenem Icon und dem Tooltip „Durchgang – offene Wand (D)“ anbieten. Die Taste D MUST es aktivieren, außer ein Eingabefeld hat den Fokus. Hat die aktive Etage keinen Raum oder ist der Kalibrier-Modus aktiv, MUST es samt Taste gesperrt sein; der Tooltip lautet dann „Durchgang – zuerst einen Raum zeichnen“.

#### Scenario: Werkzeug per Taste
- **GIVEN** auf der aktiven Etage gibt es den Raum „Eltern“ und „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste D drückt
- **THEN** ist das Werkzeug „Durchgang“ aktiv und markiert

#### Scenario: Etage ohne Raum
- **GIVEN** die aktive Etage hat keinen Raum
- **WHEN** der Nutzer die Taste D drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** der Tooltip von „Durchgang“ lautet „Durchgang – zuerst einen Raum zeichnen“

### Requirement: Durchgang setzen
Mit „Durchgang“ SHALL ein Klick auf eine Raumkante, auf ihr Wandband oder höchstens 10 Bildschirmpixel neben sie einen Durchgang mit Breite 100 cm auf der nächstgelegenen Kante setzen, mittig an der Klickstelle. Er MUST wie Tür und Fenster auf die Kante geschoben und bei kürzerer Kante auf deren Länge verkleinert werden. Danach ist er ausgewählt und „Auswählen“ aktiv.

#### Scenario: Offenes Stück in der Wand
- **GIVEN** der Raum „Eltern“ hat die Ecken (0 cm, 0 cm), (420 cm, 0 cm), (420 cm, 330 cm), (0 cm, 330 cm) und „Durchgang“ ist aktiv
- **WHEN** der Nutzer auf das Wandband der rechten Kante bei y = 260 cm klickt
- **THEN** liegt dort ein Durchgang mit Breite 100 cm von y = 210 cm bis y = 310 cm
- **AND** er ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Kurze Kante
- **GIVEN** ein Raum hat eine 60 cm lange Kante und „Durchgang“ ist aktiv
- **WHEN** der Nutzer auf diese Kante klickt
- **THEN** entsteht ein Durchgang mit Breite 60 cm und Abstand 0 cm

### Requirement: Darstellung eines Durchgangs
Ein Durchgang SHALL wie eine Tür auf seiner Breite eine Lücke in alle Wandbänder schneiden (siehe „Lücke im Wandband“). In der Lücke MUST NOT ein Türblatt, Aufschlag oder Fenstersymbol zu sehen sein. Ist der Durchgang ausgewählt, SHALL die Lücke von der Kante bis zur Außenseite ihrer Wand mit einem Umriss in der Auswahlfarbe gezeigt werden. Mit „Auswählen“ SHALL ein Klick in die Lücke den Durchgang auswählen; eine darüberliegende Möbelform hat Vorrang.

#### Scenario: Offen zum Flur
- **GIVEN** „Eltern“ und „Flur“ liegen 11,5 cm auseinander und auf der Kante von „Eltern“ liegt ein Durchgang mit Breite 100 cm
- **THEN** ist an dieser Stelle auf 100 cm Breite weder das Band von „Eltern“ noch das Band von „Flur“ zu sehen
- **AND** in der Lücke ist kein Symbol zu sehen

#### Scenario: Durchgang auswählen
- **GIVEN** „Auswählen“ ist aktiv und nichts ist ausgewählt
- **WHEN** der Nutzer in die Lücke eines Durchgangs klickt
- **THEN** ist der Durchgang ausgewählt und seine Lücke in der Auswahlfarbe umrandet
- **AND** das Panel zeigt „Durchgang“

### Requirement: Ganze Kante öffnen
Ist ein Durchgang oder ein Fenster ausgewählt, SHALL das Panel das Kästchen „Ganze Kante“ zeigen; es MUST NOT gesperrt sein. Es MUST einen Haken haben, genau wenn die Öffnung so breit wie ihre Kante ist und den Abstand 0 cm hat. Anhaken MUST sie so breit wie die Kante machen, mit Abstand 0 cm, und Breite und Abstand von vorher merken. Abhaken MUST die gemerkten Maße wiederherstellen. Jedes Mal ist ein Rückgängig-Schritt. Bei Türen MUST NOT es erscheinen.

#### Scenario: Wand fehlt komplett
- **GIVEN** auf der oberen, 500 cm langen Kante von „Küche“ liegt ein Durchgang mit Breite 100 cm und Abstand 200 cm, er ist ausgewählt
- **WHEN** der Nutzer „Ganze Kante“ anhakt
- **THEN** hat der Durchgang die Breite 500 cm und den Abstand 0 cm
- **AND** über der ganzen oberen Kante ist kein Wandband mehr zu sehen
- **AND** „Ganze Kante“ hat einen Haken und ist nicht gesperrt

#### Scenario: Wieder abhaken
- **GIVEN** derselbe Durchgang nimmt nach dem Anhaken die ganze Kante ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat der Durchgang wieder die Breite 100 cm und den Abstand 200 cm
- **AND** „Ganze Kante“ hat keinen Haken

#### Scenario: Gemerkt über Neuladen
- **GIVEN** der Nutzer hat für denselben Durchgang „Ganze Kante“ angehakt
- **WHEN** er die Seite neu lädt, den Durchgang auswählt und „Ganze Kante“ abhakt
- **THEN** hat der Durchgang wieder die Breite 100 cm und den Abstand 200 cm

#### Scenario: Rückgängig
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 200 cm auf einer 500 cm langen Kante
- **AND** der Nutzer hat für ihn „Ganze Kante“ angehakt und danach einen anderen Raum ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** hat der Durchgang wieder Breite 100 cm und Abstand 200 cm und ist ausgewählt
- **AND** „Ganze Kante“ hat keinen Haken

#### Scenario: Abhaken ist ein Schritt
- **GIVEN** ein Durchgang nimmt nach dem Anhaken von „Ganze Kante“ die ganze 500 cm lange Kante ein
- **AND** der Nutzer hat „Ganze Kante“ abgehakt
- **WHEN** er Strg+Z drückt
- **THEN** hat der Durchgang wieder die Breite 500 cm und den Abstand 0 cm
- **AND** „Ganze Kante“ hat einen Haken

#### Scenario: Ganze Kante per Eingabe
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 0 cm zur linken Ecke auf einer 500 cm langen Kante ist ausgewählt
- **WHEN** der Nutzer die Breite 500 cm eingibt
- **THEN** hat „Ganze Kante“ einen Haken

#### Scenario: Fensterband über die ganze Wand
- **GIVEN** auf der oberen, 500 cm langen Kante von „Wohnen“ liegt ein Fenster mit Breite 120 cm und Abstand 190 cm, es ist ausgewählt
- **WHEN** der Nutzer „Ganze Kante“ anhakt
- **THEN** hat das Fenster die Breite 500 cm und den Abstand 0 cm und zeigt sein Rechteck mit Mittellinie über die ganze Kante
- **WHEN** der Nutzer „Ganze Kante“ wieder abhakt
- **THEN** hat das Fenster wieder die Breite 120 cm und den Abstand 190 cm

#### Scenario: Tür ohne Kästchen
- **WHEN** der Nutzer eine Tür auswählt
- **THEN** zeigt das Panel kein Kästchen „Ganze Kante“

### Requirement: Rastpunkte für Öffnungen
Beim Setzen und Ziehen einer Tür, eines Fensters oder eines Durchgangs SHALL die Öffnung am nächsten Rastpunkt ihrer Kante einrasten, wenn ihre Lage ohne Raster höchstens 8 Bildschirmpixel davon entfernt ist. Rastpunkte: mittig auf der Kante, bündig an jeder Ecke, bündig links oder rechts an jeder anderen Öffnung derselben Kante, soweit die Öffnung dort passt. Ein Rastpunkt MUST Vorrang vor dem 5-cm- bzw. 1-cm-Raster haben.

#### Scenario: Fenster mittig setzen
- **GIVEN** der Zoom steht auf 100 %, „Fenster“ ist aktiv und die obere Kante von „Wohnen“ ist 500 cm lang
- **WHEN** der Nutzer auf diese Kante bei x = 245 cm klickt
- **THEN** liegt ein 120 cm breites Fenster von x = 190 cm bis x = 310 cm, mittig auf der Kante

#### Scenario: Bündig an die Ecke ziehen
- **GIVEN** der Zoom steht auf 100 % und eine Tür mit Breite 80 cm liegt mit Abstand 160 cm vom Anfang einer 500 cm langen Kante
- **WHEN** der Nutzer sie um 154 cm in Richtung Anfang zieht
- **THEN** hat die Tür den Abstand 0 cm und schließt bündig an die Ecke an

#### Scenario: Fensterband
- **GIVEN** der Zoom steht auf 100 %, auf einer 500 cm langen Kante liegt Fenster A von 50 cm bis 170 cm und Fenster B mit Breite 120 cm von 300 cm bis 420 cm
- **WHEN** der Nutzer Fenster B um 127 cm in Richtung Fenster A zieht
- **THEN** liegt Fenster B von 170 cm bis 290 cm und schließt bündig an Fenster A an

#### Scenario: Toleranz hängt vom Zoom ab
- **GIVEN** der Zoom steht auf 50 %, „Fenster“ ist aktiv und die obere Kante von „Wohnen“ ist 500 cm lang
- **WHEN** der Nutzer auf diese Kante bei x = 236 cm klickt
- **THEN** liegt das Fenster mittig von x = 190 cm bis x = 310 cm, weil 14 cm bei 50 % nur 7 Bildschirmpixel sind

### Requirement: Rastpunkte abschalten
Bei gedrückter Umschalttaste MUST NOT eine Öffnung beim Setzen oder Ziehen an Rastpunkten einrasten; es gilt dann nur das Raster, und es erscheint keine Markierung.

#### Scenario: Ohne Rastpunkte
- **GIVEN** der Zoom steht auf 100 %, „Fenster“ ist aktiv und die obere Kante von „Wohnen“ ist 500 cm lang
- **WHEN** der Nutzer mit gedrückter Umschalttaste bei x = 245 cm klickt
- **THEN** liegt das Fenster von x = 185 cm bis x = 305 cm

#### Scenario: Ziehen ohne Rastpunkte
- **GIVEN** der Zoom steht auf 100 % und eine Tür mit Breite 80 cm liegt mit Abstand 160 cm vom Anfang einer 500 cm langen Kante
- **WHEN** der Nutzer sie mit gedrückter Umschalttaste um 154 cm in Richtung Anfang zieht
- **THEN** hat die Tür den Abstand 5 cm

### Requirement: Markierung des Rastpunkts
Solange eine gezogene Öffnung an einem Rastpunkt eingerastet ist, SHALL an der Raststelle eine kurze Linie in der Auswahlfarbe quer über die Wand erscheinen: bei „Mitte“ in der Mitte der Kante, sonst an der bündigen Kante der Öffnung. Mit aktivem Werkzeug „Tür“, „Fenster“ oder „Durchgang“ SHALL die Markierung schon beim Überfahren einer Kante erscheinen, wenn eine dort gesetzte Öffnung einrasten würde. Sonst MUST keine Markierung zu sehen sein.

#### Scenario: Markierung beim Überfahren
- **GIVEN** der Zoom steht auf 100 %, „Fenster“ ist aktiv und die obere Kante von „Wohnen“ ist 500 cm lang
- **WHEN** der Nutzer den Mauszeiger auf diese Kante bei x = 247 cm bewegt
- **THEN** erscheint eine Markierung in der Auswahlfarbe bei x = 250 cm quer über die Wand
- **WHEN** er den Mauszeiger nach x = 300 cm bewegt
- **THEN** ist keine Markierung mehr zu sehen

#### Scenario: Markierung endet mit dem Ziehen
- **GIVEN** eine Tür ist beim Ziehen an der Ecke eingerastet und die Markierung ist zu sehen
- **WHEN** der Nutzer die Maustaste loslässt
- **THEN** ist keine Markierung mehr zu sehen

### Requirement: Ersatzmaße beim Abhaken
Hat ein Durchgang oder Fenster über die ganze Kante keine gemerkten Maße oder passen sie nicht mehr auf die Kante, SHALL Abhaken von „Ganze Kante“ ihm die Standardbreite seiner Art geben (Durchgang 100 cm, Fenster 120 cm), mittig auf der Kante. Ist die Kante höchstens so lang, SHALL die Öffnung halb so breit wie die Kante werden, mittig. Ändert der Nutzer Breite oder Abstand auf anderem Weg als über das Kästchen, MUST die Öffnung ihre gemerkten Maße vergessen.

#### Scenario: Breite per Eingabe, dann abhaken
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 0 cm zur linken Ecke auf einer 500 cm langen Kante
- **AND** der Nutzer hat die Breite 500 cm eingegeben
- **WHEN** er „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 100 cm und den Abstand 200 cm zur linken Ecke

#### Scenario: Fenster ohne gemerkte Maße
- **GIVEN** ein Fenster ohne gemerkte Maße nimmt eine 500 cm lange Kante ganz ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat das Fenster die Breite 120 cm und den Abstand 190 cm zur linken Ecke

#### Scenario: Kurze Kante
- **GIVEN** ein Durchgang ohne gemerkte Maße nimmt eine 80 cm lange Kante ganz ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 40 cm und den Abstand 20 cm zur linken Ecke

#### Scenario: Gemerkte Maße veraltet
- **GIVEN** der Nutzer hat für einen Durchgang mit Breite 100 cm und Abstand 50 cm zur linken Ecke auf einer 500 cm langen Kante „Ganze Kante“ angehakt
- **AND** danach die Breite auf 300 cm geändert und anschließend wieder 500 cm eingegeben
- **WHEN** er „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 100 cm und den Abstand 200 cm zur linken Ecke (mittig), nicht 50 cm
