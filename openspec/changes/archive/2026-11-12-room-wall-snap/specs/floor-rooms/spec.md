# Spec Delta

## MODIFIED Requirements

### Requirement: Raum verschieben
Ziehen an einem ausgewählten, nicht gesperrten Raum mit „Auswählen“ SHALL den ganzen Raum verschieben, relativ zur Startlage auf 5 cm gerastert, bei gedrückter Alt-Taste auf 1 cm. Haftet der Raum an einer Nachbarwand (siehe „Raum haftet an der Nachbarwand“), MUST das Haften quer zur Wand Vorrang vor dem Raster haben. Ziehen an einem nicht ausgewählten oder gesperrten Raum MUST die Ansicht verschieben (siehe „Gesperrter Raum auf der Zeichenfläche“). Möbel MUST beim Verschieben eines Raums an ihrer Stelle bleiben.

#### Scenario: Raum ziehen
- **GIVEN** „Diele“ ist ausgewählt und ihre linke obere Ecke liegt bei (349 cm, 0 cm)
- **AND** kein anderer Raum der Etage liegt in der Nähe der Diele
- **WHEN** der Nutzer die Diele 23 cm nach rechts zieht
- **THEN** liegt die Ecke bei (374 cm, 0 cm) und alle Kantenlängen sind unverändert

#### Scenario: Nicht ausgewählter Raum
- **GIVEN** kein Raum ist ausgewählt
- **WHEN** der Nutzer in „Wohnen“ an einer Stelle ohne Form zieht
- **THEN** verschiebt sich die Ansicht und der Raum behält seine Lage

## ADDED Requirements

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
