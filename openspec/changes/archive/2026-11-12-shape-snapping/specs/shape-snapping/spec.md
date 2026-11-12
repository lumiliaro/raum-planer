# Spec Delta

## Purpose

Lässt Möbelformen beim Ziehen innerhalb eines Raums an Rastlinien einrasten – Raummitte, Mitte von Türen und Fenstern, Wände und andere Möbel –, damit sie sich ohne Nachrechnen mittig, bündig oder fluchtend platzieren lassen.

## ADDED Requirements

### Requirement: Zugehöriger Raum beim Ziehen
Beim Ziehen einer Form SHALL der Raum maßgeblich sein, in dem ihr Mittelpunkt ohne Raster und ohne Einrasten gerade liegt. Nur dessen Rastlinien MUST gelten. Liegt der Mittelpunkt in keinem Raum, MUST die Form nirgends einrasten; es gilt nur das Raster. Freie Formen ohne Umriss MUST NOT einrasten.

#### Scenario: Form außerhalb jedes Raums
- **GIVEN** der Zoom steht auf 100 % und ein Tisch mit Mittelpunkt x = 900 cm, y = 900 cm liegt in keinem Raum
- **WHEN** der Nutzer ihn um 13 cm nach rechts zieht
- **THEN** liegt sein Mittelpunkt bei x = 915 cm, y = 900 cm
- **AND** es ist keine Hilfslinie zu sehen

#### Scenario: Form wechselt beim Ziehen den Raum
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und der Raum „Küche“ die Ecken (600 cm, 0 cm), (900 cm, 0 cm), (900 cm, 400 cm), (600 cm, 400 cm)
- **AND** der Zoom steht auf 100 % und ein Hocker 40 cm × 40 cm liegt mit Mittelpunkt x = 250 cm, y = 300 cm in „Wohnen“
- **WHEN** der Nutzer ihn um 497 cm nach rechts zieht
- **THEN** liegt sein Mittelpunkt bei x = 750 cm, mittig in „Küche“

### Requirement: Rastlinien der Raummitte
Der Mittelpunkt einer gezogenen Form SHALL auf der senkrechten und der waagerechten Mittellinie ihres Raums einrasten können. Die Mittellinien gehen durch die Mitte des umschließenden Rechtecks der Raumecken.

#### Scenario: Tisch mittig in den Raum
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und der Zoom steht auf 100 %
- **AND** ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn um 127 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 250 cm, y = 300 cm

#### Scenario: Beide Achsen rasten ein
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn um 133 cm nach rechts und 96 cm nach oben zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 250 cm, y = 200 cm

#### Scenario: L-förmiger Raum
- **GIVEN** ein Raum hat die Ecken (0 cm, 0 cm), (600 cm, 0 cm), (600 cm, 200 cm), (300 cm, 200 cm), (300 cm, 400 cm), (0 cm, 400 cm)
- **THEN** liegen seine Mittellinien bei x = 300 cm und y = 200 cm

### Requirement: Rastlinien mittig vor Öffnungen
Für jede Tür, jedes Fenster und jeden Durchgang auf einer waagerechten oder senkrechten Kante des Raums SHALL es eine Rastlinie quer zur Wand durch die Mitte der Öffnung geben, auf der der Mittelpunkt einer gezogenen Form einrasten kann. Öffnungen auf schrägen Kanten MUST keine Rastlinie liefern.

#### Scenario: Schreibtisch mittig vor das Fenster
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und auf der oberen Kante liegt ein Fenster von x = 50 cm bis x = 170 cm
- **AND** der Zoom steht auf 100 % und ein Schreibtisch 120 cm × 60 cm hat den Mittelpunkt x = 300 cm, y = 100 cm
- **WHEN** der Nutzer ihn um 186 cm nach links zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 110 cm, y = 100 cm, mittig vor dem Fenster

### Requirement: Rastlinien an den Wänden
Jede waagerechte und senkrechte Kante des Raums SHALL eine Rastlinie auf der Innenseite der Wand liefern. Die Form MUST mit der zugewandten Seite ihres umschließenden achsparallelen Rechtecks – bei gedrehter Form das Rechteck um ihren gedrehten Umriss – bündig daran einrasten können. Schräge Kanten MUST keine Rastlinie liefern.

#### Scenario: Schrank an die Wand
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und der Zoom steht auf 100 %
- **AND** ein Schrank 200 cm × 60 cm hat den Mittelpunkt x = 180 cm, y = 100 cm
- **WHEN** der Nutzer ihn um 66 cm nach oben zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 180 cm, y = 30 cm und seine Oberkante bei y = 0 cm

#### Scenario: Gedrehtes Bett an die Wand
- **GIVEN** der Raum „Wohnen“ wie oben, der Zoom steht auf 100 % und ein Bett 200 cm × 100 cm mit Drehung 90° hat den Mittelpunkt x = 300 cm, y = 200 cm
- **WHEN** der Nutzer es um 146 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 450 cm und seine rechte Seite bei x = 500 cm

### Requirement: Rastlinien an anderen Formen
Jede andere Form, deren Mittelpunkt im selben Raum liegt, SHALL Rastlinien an den Seiten und der Mitte ihres umschließenden achsparallelen Rechtecks liefern. Die gezogene Form MUST mit Seite oder Mitte fluchtend daran einrasten können oder mit einer Seite bündig an die gegenüberliegende Seite der anderen Form. Formen anderer Räume MUST NOT Rastlinien liefern.

#### Scenario: Bündig neben den Tisch
- **GIVEN** im Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) liegt ein Tisch 160 cm × 90 cm mit Mittelpunkt x = 250 cm, y = 200 cm
- **AND** der Zoom steht auf 100 % und eine Kommode 60 cm × 40 cm hat den Mittelpunkt x = 70 cm, y = 200 cm
- **WHEN** der Nutzer sie um 67 cm nach rechts zieht und loslässt
- **THEN** liegt ihr Mittelpunkt bei x = 140 cm und ihre rechte Seite bündig an der linken Seite des Tischs bei x = 170 cm

#### Scenario: Fluchtend mit dem Tisch
- **GIVEN** im Raum „Wohnen“ wie oben liegt der Tisch 160 cm × 90 cm mit Mittelpunkt x = 250 cm, y = 200 cm (Oberkante y = 155 cm)
- **AND** der Zoom steht auf 100 % und eine Leuchte 40 cm × 40 cm hat den Mittelpunkt x = 400 cm, y = 100 cm
- **WHEN** der Nutzer sie um 72 cm nach unten zieht und loslässt
- **THEN** liegt ihr Mittelpunkt bei y = 175 cm und ihre Oberkante fluchtet mit der des Tischs bei y = 155 cm

#### Scenario: Form im Nachbarraum ist kein Rastziel
- **GIVEN** die Räume „Wohnen“ und „Küche“ wie in „Form wechselt beim Ziehen den Raum“ und in „Küche“ liegt ein Regal mit Oberkante y = 155 cm
- **AND** der Zoom steht auf 100 % und eine Leuchte 40 cm × 40 cm in „Wohnen“ hat den Mittelpunkt x = 400 cm, y = 100 cm
- **WHEN** der Nutzer sie um 72 cm nach unten zieht und loslässt
- **THEN** liegt ihr Mittelpunkt bei y = 170 cm

### Requirement: Einrasten je Achse mit Vorrang vor dem Raster
Waagerechte und senkrechte Richtung SHALL getrennt einrasten. Auf einer Achse SHALL die Form an der Rastlinie einrasten, deren Abstand zur Lage ohne Raster am kleinsten ist und höchstens 8 Bildschirmpixel beträgt. Ein Rastziel MUST Vorrang vor dem 5-cm- bzw. 1-cm-Raster haben; auf einer Achse ohne Rastziel gilt das Raster relativ zur Startlage.

#### Scenario: Raster auf der anderen Achse
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn um 127 cm nach rechts und 13 cm nach oben zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 250 cm, y = 285 cm

#### Scenario: Nächste Rastlinie gewinnt
- **GIVEN** im Raum „Wohnen“ wie oben liegt auf der oberen Kante ein Fenster von x = 0 cm bis x = 120 cm, der Zoom steht auf 100 %
- **AND** ein Regal 100 cm × 40 cm hat den Mittelpunkt x = 200 cm, y = 100 cm
- **WHEN** der Nutzer es um 146 cm nach links zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 50 cm und seine linke Seite bündig an der Wand, weil die Wand 4 cm und die Fenstermitte 6 cm entfernt war

#### Scenario: Toleranz hängt vom Zoom ab
- **GIVEN** der Raum „Wohnen“ wie oben und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn bei Zoom 100 % um 116 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 235 cm, weil 14 cm bei 100 % 14 Bildschirmpixel sind
- **WHEN** der Nutzer ihn stattdessen bei Zoom 50 % um 116 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 250 cm, weil 14 cm bei 50 % nur 7 Bildschirmpixel sind

### Requirement: Einrasten abschalten
Bei gedrückter Strg-Taste MUST eine gezogene Form an keiner Rastlinie einrasten; es gilt dann nur das Raster (mit Alt das feine Raster), und es erscheint keine Hilfslinie. Wird Strg während des Ziehens losgelassen, SHALL das Einrasten wieder wirken.

#### Scenario: Mit Strg frei ziehen
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn mit gedrückter Strg-Taste um 127 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 245 cm
- **AND** während des Ziehens war keine Hilfslinie zu sehen

### Requirement: Schalter „Einrasten“
Unten rechts neben dem Schalter „Maße“ SHALL ein Schalter „Einrasten“ das Einrasten von Formen an Rastlinien ein- und ausschalten. Ist er aus, MUST eine gezogene Form wie mit gedrückter Strg-Taste an keiner Rastlinie einrasten und es erscheint keine Hilfslinie; das Raster gilt weiter. Der Schalter MUST NOT auf Türen, Fenster, Durchgänge oder Räume wirken.

#### Scenario: Einrasten ausgeschaltet
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **AND** der Schalter „Einrasten“ ist aus
- **WHEN** der Nutzer ihn ohne Taste um 127 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 245 cm
- **AND** während des Ziehens war keine Hilfslinie zu sehen

### Requirement: Schalter „Einrasten“ wird im Browser gemerkt
Die Stellung des Schalters „Einrasten“ SHALL im Browser gemerkt werden und beim nächsten Start gelten; ohne gemerkten Wert ist er an. Sie MUST NOT Teil des Plans, des Exports oder des Rückgängig-Verlaufs sein.

#### Scenario: Einstellung bleibt erhalten
- **GIVEN** der Nutzer hat den Schalter „Einrasten“ ausgeschaltet
- **WHEN** er die Seite neu lädt
- **THEN** ist der Schalter weiterhin aus

#### Scenario: Kein Rückgängig-Schritt
- **GIVEN** der Nutzer hat einen Schrank verschoben
- **WHEN** er den Schalter „Einrasten“ umschaltet und dann „Rückgängig“ wählt
- **THEN** wird das Verschieben des Schranks zurückgenommen und der Schalter bleibt, wie er ist

### Requirement: Hilfslinie beim Einrasten
Solange eine gezogene Form auf einer Achse eingerastet ist, SHALL ihre Rastlinie als gestrichelte Linie in der Auswahlfarbe über die ganze Breite bzw. Höhe des umschließenden Rechtecks des Raums zu sehen sein, höchstens eine je Achse. Rastet die Achse aus oder lässt der Nutzer los, MUST die Hilfslinie verschwinden.

#### Scenario: Hilfslinie der Raummitte
- **GIVEN** der Raum „Wohnen“ mit den Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm), der Zoom steht auf 100 % und ein Tisch 160 cm × 90 cm hat den Mittelpunkt x = 120 cm, y = 300 cm
- **WHEN** der Nutzer ihn um 127 cm nach rechts zieht und die Maustaste noch hält
- **THEN** ist eine gestrichelte senkrechte Linie in der Auswahlfarbe bei x = 250 cm von y = 0 cm bis y = 400 cm zu sehen
- **WHEN** er weiter bis zu einer Verschiebung von 160 cm nach rechts zieht
- **THEN** ist keine Hilfslinie mehr zu sehen

#### Scenario: Hilfslinie endet mit dem Loslassen
- **GIVEN** eine gezogene Form ist eingerastet und ihre Hilfslinie ist zu sehen
- **WHEN** der Nutzer die Maustaste loslässt
- **THEN** ist keine Hilfslinie mehr zu sehen
