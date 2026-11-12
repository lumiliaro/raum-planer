## ADDED Requirements

### Requirement: Griffe an Fenster und Durchgang
Ist ein Fenster oder ein Durchgang ausgewählt und „Auswählen“ aktiv, SHALL an jedem Ende seiner Lücke ein Griff erscheinen: ein kleines weißes Quadrat mit Rand in der Auswahlfarbe, auf der Kante mittig in der Wanddicke, bei jedem Zoom gleich groß. Über einem Griff MUST der Mauszeiger ein Doppelpfeil entlang der Kante sein. Eine Tür MUST NOT Griffe zeigen.

#### Scenario: Griffe am Fenster
- **GIVEN** in „Wohnen“ liegt ein Fenster mit Breite 120 cm von x = 190 cm bis x = 310 cm auf der oberen Kante und „Auswählen“ ist aktiv
- **WHEN** der Nutzer das Fenster auswählt
- **THEN** erscheint je ein Griff bei x = 190 cm und bei x = 310 cm

#### Scenario: Tür ohne Griffe
- **WHEN** der Nutzer eine Tür auswählt
- **THEN** zeigt sie keine Griffe

#### Scenario: Nicht ausgewählt
- **GIVEN** ein Durchgang ist nicht ausgewählt
- **THEN** zeigt er keine Griffe

### Requirement: Breite an den Griffen ziehen
Ziehen eines Griffs SHALL nur dieses Ende entlang der Kante verschieben; das andere Ende bleibt liegen. Das Ende bewegt sich relativ zur Startlage in 5-cm-Schritten, mit Alt in 1-cm-Schritten, außer es rastet an einem Haltepunkt ein. Es MUST an den Kantenenden anhalten, und die Öffnung MUST mindestens 10 cm breit bleiben. Lücke und Symbol MUST beim Ziehen folgen. Ein Ziehen MUST genau einen Rückgängig-Schritt bilden.

#### Scenario: Fenster breiter ziehen
- **GIVEN** der Zoom steht auf 100 % und auf der oberen, 500 cm langen Kante von „Wohnen“ liegt ein ausgewähltes Fenster mit Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer den rechten Griff um 33 cm nach rechts zieht
- **THEN** hat das Fenster die Breite 155 cm und weiter den Abstand 190 cm

#### Scenario: Linkes Ende ziehen
- **GIVEN** dasselbe Fenster
- **WHEN** der Nutzer den linken Griff um 40 cm nach rechts zieht
- **THEN** liegt das Fenster von x = 230 cm bis x = 310 cm, mit Breite 80 cm und Abstand 230 cm

#### Scenario: Am Kantenende
- **GIVEN** dasselbe Fenster
- **WHEN** der Nutzer mit gedrückter Umschalttaste den rechten Griff um 300 cm nach rechts zieht
- **THEN** endet das Fenster genau an der rechten Ecke und hat die Breite 310 cm

#### Scenario: Mindestbreite
- **GIVEN** dasselbe Fenster
- **WHEN** der Nutzer den rechten Griff um 200 cm nach links zieht
- **THEN** hat das Fenster die Breite 10 cm und weiter den Abstand 190 cm

#### Scenario: Vorschau beim Ziehen
- **GIVEN** ein Durchgang mit Breite 100 cm ist ausgewählt
- **WHEN** der Nutzer seinen rechten Griff zieht und die Maustaste noch hält
- **THEN** folgt die Lücke im Wandband dem Griff

#### Scenario: Ein Rückgängig-Schritt
- **GIVEN** der Nutzer hat den rechten Griff eines Fensters mit Breite 120 cm gezogen, es ist jetzt 155 cm breit
- **WHEN** er Strg+Z drückt
- **THEN** ist das Fenster wieder 120 cm breit und ausgewählt

#### Scenario: Ganze Kante gezogen
- **GIVEN** ein Durchgang auf einer 500 cm langen Kante hat für „Ganze Kante“ gemerkte Maße
- **WHEN** der Nutzer den linken Griff an die linke und den rechten Griff an die rechte Ecke zieht
- **THEN** hat „Ganze Kante“ einen Haken
- **AND** die gemerkten Maße sind vergessen

#### Scenario: Gesperrter Raum
- **GIVEN** „Wohnen“ ist gesperrt und eines seiner Fenster ist ausgewählt
- **WHEN** der Nutzer den rechten Griff um 33 cm nach rechts zieht
- **THEN** ist das Fenster 35 cm breiter

### Requirement: Haltepunkte beim Ziehen der Breite
Beim Ziehen eines Griffs SHALL das gezogene Ende am nächsten Haltepunkt einrasten, wenn es ohne Raster höchstens 8 Bildschirmpixel davon entfernt ist. Haltepunkte: Ecken der Kante, Enden anderer Öffnungen derselben Kante, Kantenmitte, Öffnung mittig auf der Kante, Öffnung in Standardbreite ihrer Art (Einstellungen). Es zählen nur Haltepunkte mit mindestens 10 cm Breite. Ein Haltepunkt MUST Vorrang vor dem Raster haben.

#### Scenario: Bis in die Ecke
- **GIVEN** der Zoom steht auf 100 % und auf einer 500 cm langen Kante liegt ein ausgewähltes Fenster mit Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer den rechten Griff um 185 cm nach rechts zieht
- **THEN** endet das Fenster genau an der rechten Ecke und hat die Breite 310 cm

#### Scenario: Bündig an das Nachbarfenster
- **GIVEN** der Zoom steht auf 100 %, auf einer 500 cm langen Kante liegt Fenster A von 50 cm bis 170 cm und Fenster B von 300 cm bis 420 cm, B ist ausgewählt
- **WHEN** der Nutzer den linken Griff von B um 126 cm nach links zieht
- **THEN** liegt Fenster B von 170 cm bis 420 cm und schließt bündig an Fenster A an

#### Scenario: Bis zur Kantenmitte
- **GIVEN** der Zoom steht auf 100 % und auf einer 500 cm langen Kante liegt ein ausgewählter Durchgang von 50 cm bis 150 cm
- **WHEN** der Nutzer den rechten Griff um 97 cm nach rechts zieht
- **THEN** liegt der Durchgang von 50 cm bis 250 cm

#### Scenario: Mittig auf der Kante
- **GIVEN** der Zoom steht auf 100 % und auf einer 500 cm langen Kante liegt ein ausgewähltes Fenster von 100 cm bis 220 cm
- **WHEN** der Nutzer den rechten Griff um 176 cm nach rechts zieht
- **THEN** liegt das Fenster von 100 cm bis 400 cm, mittig auf der Kante

#### Scenario: Standardbreite
- **GIVEN** der Zoom steht auf 100 %, die Standardbreite für Durchgänge in den Einstellungen ist 100 cm und auf einer 500 cm langen Kante liegt ein ausgewählter Durchgang von 20 cm bis 80 cm
- **WHEN** der Nutzer den rechten Griff um 38 cm nach rechts zieht
- **THEN** liegt der Durchgang von 20 cm bis 120 cm und ist 100 cm breit

#### Scenario: Toleranz hängt vom Zoom ab
- **GIVEN** der Zoom steht auf 50 % und auf einer 500 cm langen Kante liegt ein ausgewähltes Fenster mit Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer den rechten Griff um 176 cm nach rechts zieht
- **THEN** endet das Fenster genau an der rechten Ecke, weil 14 cm bei 50 % nur 7 Bildschirmpixel sind

### Requirement: Haltepunkte beim Ziehen der Breite abschalten
Bei gedrückter Umschalttaste MUST NOT das gezogene Ende an Haltepunkten einrasten; es gilt dann nur das Raster, und es erscheint keine Markierung.

#### Scenario: Ohne Haltepunkte
- **GIVEN** der Zoom steht auf 100 % und auf einer 500 cm langen Kante liegt ein ausgewähltes Fenster mit Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer mit gedrückter Umschalttaste den rechten Griff um 185 cm nach rechts zieht
- **THEN** hat das Fenster die Breite 305 cm und endet 5 cm vor der rechten Ecke

### Requirement: Markierung beim Ziehen der Breite
Solange das gezogene Ende an einem Haltepunkt eingerastet ist, SHALL an diesem Ende eine kurze Linie in der Auswahlfarbe quer über die Wand erscheinen, wie beim Verschieben einer Öffnung. Nach dem Loslassen oder ohne Einrasten MUST keine Markierung zu sehen sein.

#### Scenario: Markierung an der Ecke
- **GIVEN** der Nutzer zieht den rechten Griff eines Fensters und das Ende ist an der rechten Ecke eingerastet
- **THEN** ist an der rechten Ecke eine Markierung in der Auswahlfarbe quer über die Wand zu sehen
- **WHEN** der Nutzer die Maustaste loslässt
- **THEN** ist keine Markierung mehr zu sehen
