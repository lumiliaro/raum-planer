## ADDED Requirements

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

## MODIFIED Requirements

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
