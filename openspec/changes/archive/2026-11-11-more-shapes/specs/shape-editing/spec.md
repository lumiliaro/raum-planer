# Spec Delta

## ADDED Requirements

### Requirement: Werkzeuge für L-Form, U-Form, Ecke und Tür
Die Werkzeugleiste SHALL unter „Ellipse“ in dieser Reihenfolge die Werkzeuge „L-Form“, „U-Form“, „Ecke“ und „Tür“ zeigen, jeweils mit eigenem Icon, deutschem Tooltip mit Tastenkürzel und markiertem Zustand, solange das Werkzeug aktiv ist. Die Tastenkürzel MUST L, U, C und T sein und MUST wirkungslos bleiben, solange ein Eingabefeld den Fokus hat.

#### Scenario: Tooltips
- **WHEN** der Nutzer mit dem Zeiger über den Werkzeugen verweilt
- **THEN** lauten die Tooltips „L-Form – Ecksofa, Eckküche (L)“, „U-Form – U-Küche (U)“, „Ecke – Eckdusche, Eckregal (C)“ und „Tür mit Aufschlag (T)“

#### Scenario: Werkzeug per Taste
- **GIVEN** die aktive Etage ist kalibriert und „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste U drückt
- **THEN** ist das Werkzeug „U-Form“ aktiv und markiert

#### Scenario: Taste beim Tippen
- **GIVEN** der Fokus liegt im Feld „Beschriftung“
- **WHEN** der Nutzer „Tür“ tippt
- **THEN** bleibt das aktive Werkzeug unverändert

### Requirement: Weitere Werkzeuge gesperrt ohne Kalibrierung
Auf einer nicht kalibrierten Etage und im Kalibrier-Modus MUST das System die Werkzeuge „L-Form“, „U-Form“, „Ecke“ und „Tür“ genauso sperren wie „Rechteck“ und „Ellipse“, einschließlich ihrer Tastenkürzel.

#### Scenario: Nicht kalibrierte Etage
- **GIVEN** die aktive Etage ist nicht kalibriert
- **WHEN** der Nutzer auf „Tür“ klickt oder die Taste T drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** der Tooltip von „Tür“ nennt „Etage zuerst kalibrieren“

### Requirement: Einfügen mit Standardmaßen
Mit einem der vier Werkzeuge SHALL ein Klick auf den Grundriss eine Form mit Mittelpunkt an der Klickstelle, Drehung 0° und ohne Spiegelung einfügen. Danach MUST die Form ausgewählt und „Auswählen“ wieder aktiv sein. Standardmaße: L-Form 120 × 100 cm mit Schenkel A und B je 40 cm; U-Form 140 × 100 cm mit Basis und Seiten je 30 cm; Ecke 90 × 90 cm; Tür 80 cm breit.

#### Scenario: L-Form einfügen
- **GIVEN** das Werkzeug „L-Form“ ist aktiv
- **WHEN** der Nutzer bei x = 400 cm, y = 250 cm auf den Grundriss klickt
- **THEN** liegt dort eine L-Form mit Breite 120 cm, Tiefe 100 cm, Schenkel A 40 cm und Schenkel B 40 cm
- **AND** sie ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: U-Form einfügen
- **GIVEN** das Werkzeug „U-Form“ ist aktiv
- **WHEN** der Nutzer auf den Grundriss klickt
- **THEN** entsteht eine U-Form mit Breite 140 cm, Tiefe 100 cm, Basis 30 cm und Seiten 30 cm

#### Scenario: Ecke einfügen
- **GIVEN** das Werkzeug „Ecke“ ist aktiv
- **WHEN** der Nutzer auf den Grundriss klickt
- **THEN** entsteht eine Ecke mit Breite 90 cm und Tiefe 90 cm

#### Scenario: Tür einfügen
- **GIVEN** das Werkzeug „Tür“ ist aktiv
- **WHEN** der Nutzer auf den Grundriss klickt
- **THEN** entsteht eine Tür mit Breite 80 cm

#### Scenario: Esc bricht ab
- **GIVEN** das Werkzeug „Ecke“ ist aktiv
- **WHEN** der Nutzer Esc drückt
- **THEN** ist „Auswählen“ aktiv und es wurde keine Form eingefügt

### Requirement: Stil neuer Formen
Eine neu eingefügte L-Form, U-Form oder Ecke SHALL denselben Stil wie ein neues Rechteck erhalten (hellgrau gefüllt, dunkler Rand). Eine neu eingefügte Tür MUST ohne Füllung („nur Rand“) erscheinen, damit sie den Grundriss nicht verdeckt.

#### Scenario: Neue Tür ohne Füllung
- **WHEN** eine Tür eingefügt wird
- **THEN** hat sie keine Füllung und einen dunklen Rand

### Requirement: Darstellung der Tür
Das System SHALL eine Tür als durchgezogene Linie für das Türblatt (von der Angel bis zum Türblattende) und als gestrichelten Bogen für den Aufschlag zeichnen. Die Wandöffnung zwischen Angel und Bogenende MUST ungezeichnet bleiben. Hat die Tür eine Füllung, MUST die Fläche des Aufschlags damit gefüllt sein.

#### Scenario: Tür ohne Füllung
- **GIVEN** eine Tür mit Breite 80 cm, Drehung 0°, ohne Füllung
- **WHEN** sie auf dem Grundriss erscheint
- **THEN** zeigt sie eine durchgezogene Linie entlang ihrer linken Kante und einen gestrichelten Viertelkreis zur unteren rechten Ecke
- **AND** entlang ihrer unteren Kante ist keine Linie zu sehen

### Requirement: Klickfläche entspricht dem Umriss
Ein Klick SHALL eine L-Form, U-Form, Ecke oder Tür genau dann treffen, wenn er innerhalb ihres Umrisses oder auf ihrem Rand liegt, unabhängig davon, ob sie gefüllt ist. Klicks in eine Aussparung außerhalb des Umrisses MUST die darunterliegende Form oder die freie Fläche treffen.

#### Scenario: Klick in den Aufschlag einer Tür
- **GIVEN** eine Tür ohne Füllung ist nicht ausgewählt
- **WHEN** der Nutzer mitten in ihren Aufschlag klickt
- **THEN** ist die Tür ausgewählt

#### Scenario: Klick in die Aussparung einer L-Form
- **GIVEN** eine L-Form mit Breite 280 cm, Tiefe 200 cm und Schenkeln von je 90 cm, darunter keine andere Form
- **WHEN** der Nutzer in die Aussparung oben rechts klickt
- **THEN** wird die L-Form nicht ausgewählt und eine bestehende Auswahl aufgehoben

### Requirement: Größe von L-Form und U-Form ändern
Beim Ändern der Größe einer L-Form oder U-Form über die Anfasser SHALL das System nur Breite und Tiefe ändern. Die Stärken von Schenkeln, Basis und Seiten MUST gleich bleiben. Raster und gegenüberliegende Seite verhalten sich wie beim Rechteck.

#### Scenario: L-Form schmaler
- **GIVEN** eine L-Form mit Breite 280 cm, Tiefe 200 cm und Schenkeln von je 90 cm
- **WHEN** der Nutzer den rechten Anfasser um 80 cm nach links zieht
- **THEN** hat die L-Form Breite 200 cm, Tiefe 200 cm, Schenkel A 90 cm und Schenkel B 90 cm
- **AND** ihre linke Kante ist stehen geblieben

### Requirement: Kleinste Größe von L-Form und U-Form
Damit die Form erkennbar bleibt, MUST sich eine L-Form oder U-Form über die Anfasser nur so weit verkleinern lassen, dass jede Aussparung mindestens so breit bzw. tief bleibt wie der angrenzende Schenkel: die L-Form mindestens doppelt so breit wie Schenkel B und doppelt so tief wie Schenkel A, die U-Form mindestens dreimal so breit wie eine Seite und doppelt so tief wie die Basis.

#### Scenario: L-Form zu schmal
- **GIVEN** eine L-Form mit Breite 280 cm und Schenkel B 90 cm
- **WHEN** der Nutzer den rechten Anfasser so weit nach links zieht, dass die Breite 60 cm wäre
- **THEN** bleibt die Breite bei 180 cm stehen

#### Scenario: L-Form über das Formular schon schmaler
- **GIVEN** eine L-Form mit Breite 150 cm und Schenkel B 90 cm
- **WHEN** der Nutzer den rechten Anfasser nach links zieht
- **THEN** bleibt die Breite bei 150 cm stehen
- **WHEN** der Nutzer den rechten Anfasser um 20 cm nach rechts zieht
- **THEN** hat die L-Form die Breite 170 cm

#### Scenario: U-Form zu schmal
- **GIVEN** eine U-Form mit Breite 300 cm und Seiten von je 60 cm
- **WHEN** der Nutzer die Breite über einen Anfasser auf 100 cm verkleinern will
- **THEN** bleibt die Breite bei 180 cm stehen

### Requirement: Größe der Tür ändern
Eine ausgewählte Tür SHALL nur Eck-Anfasser und den Dreh-Anfasser zeigen. Beim Ziehen eines Eck-Anfassers MUST die Tür quadratisch bleiben und nur ihre Breite ändern, im Raster wie beim Rechteck (5 cm, mit Alt 1 cm). Die gegenüberliegende Ecke bleibt stehen.

#### Scenario: Tür breiter
- **GIVEN** eine Tür mit Breite 80 cm und Drehung 0°
- **WHEN** der Nutzer den oberen rechten Anfasser um etwa 10 cm nach rechts oben zieht
- **THEN** hat die Tür die Breite 90 cm
- **AND** ihre untere linke Ecke (die Angel) ist stehen geblieben

#### Scenario: Keine Seitenanfasser
- **WHEN** eine Tür ausgewählt ist
- **THEN** zeigt der Auswahlrahmen vier Eck-Anfasser und den Dreh-Anfasser, aber keine Anfasser in der Mitte der Seiten

### Requirement: Größe der Ecke ändern
Beim Ändern der Größe einer Ecke über die Anfasser SHALL das System Breite und Tiefe wie beim Rechteck ändern.

#### Scenario: Ecke breiter
- **GIVEN** eine Ecke mit Breite 90 cm und Tiefe 90 cm
- **WHEN** der Nutzer den rechten Anfasser um 30 cm nach rechts zieht
- **THEN** hat die Ecke Breite 120 cm und Tiefe 90 cm
