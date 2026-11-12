# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Werkzeuge für L-Form, U-Form, Ecke und Tür`
- TO: `### Requirement: Werkzeuge für L-Form, U-Form und Ecke`

## MODIFIED Requirements

### Requirement: Werkzeuge für L-Form, U-Form und Ecke
Die Werkzeugleiste SHALL unter „Ellipse“ in dieser Reihenfolge die Werkzeuge „L-Form“, „U-Form“ und „Ecke“ zeigen, jeweils mit eigenem Icon, deutschem Tooltip mit Tastenkürzel und markiertem Zustand, solange das Werkzeug aktiv ist. Die Tastenkürzel MUST L, U und C sein und MUST wirkungslos bleiben, solange ein Eingabefeld den Fokus hat.

#### Scenario: Tooltips
- **WHEN** der Nutzer mit dem Zeiger über den Werkzeugen verweilt
- **THEN** lauten die Tooltips „L-Form – Ecksofa, Eckküche (L)“, „U-Form – U-Küche (U)“ und „Ecke – Eckdusche, Eckregal (C)“

#### Scenario: Werkzeug per Taste
- **GIVEN** „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste U drückt
- **THEN** ist das Werkzeug „U-Form“ aktiv und markiert

#### Scenario: Taste beim Tippen
- **GIVEN** der Fokus liegt im Feld „Beschriftung“
- **WHEN** der Nutzer „Tür“ tippt
- **THEN** bleibt das aktive Werkzeug unverändert

## ADDED Requirements

### Requirement: Einfügen von L-Form, U-Form und Ecke
Mit einem der drei Werkzeuge SHALL ein Klick auf den Grundriss eine Form mit Mittelpunkt an der Klickstelle, Drehung 0° und ohne Spiegelung einfügen. Danach MUST die Form ausgewählt und „Auswählen“ wieder aktiv sein. Standardmaße: L-Form 120 × 100 cm mit Schenkel A und B je 40 cm; U-Form 140 × 100 cm mit Basis und Seiten je 30 cm; Ecke 90 × 90 cm.

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

#### Scenario: Esc bricht ab
- **GIVEN** das Werkzeug „Ecke“ ist aktiv
- **WHEN** der Nutzer Esc drückt
- **THEN** ist „Auswählen“ aktiv und es wurde keine Form eingefügt

### Requirement: Stil neuer L-Formen, U-Formen und Ecken
Eine neu eingefügte L-Form, U-Form oder Ecke SHALL denselben Stil wie ein neues Rechteck erhalten (hellgrau gefüllt, dunkler Rand).

#### Scenario: Neue Ecke
- **WHEN** eine Ecke eingefügt wird
- **THEN** ist sie wie ein neues Rechteck hellgrau gefüllt und hat einen dunklen Rand


### Requirement: Bestehende Türen als Möbel
Formen vom Typ Tür (frei platzierter Türaufschlag) SHALL gültig bleiben: Vorhandene Türen werden wie bisher gezeichnet, lassen sich auswählen, verschieben, drehen, spiegeln, in der Größe ändern, im Panel bearbeiten, sperren und löschen und kommen unverändert in Export und Import. Kein Werkzeug MUST neue Formen dieses Typs einfügen; die Taste T wählt das Werkzeug „Tür“ für Türen in der Raumwand (siehe `room-openings`).

#### Scenario: Tür aus einem älteren Plan
- **GIVEN** der Plan enthält im Erdgeschoss eine als Möbel eingefügte Tür mit Breite 80 cm
- **WHEN** der Nutzer sie anklickt und im Panel die Breite auf 90 cm ändert
- **THEN** ist die Tür ausgewählt und 90 cm breit

#### Scenario: Keine neue Möbel-Tür
- **GIVEN** auf der aktiven Etage gibt es keinen Raum
- **WHEN** der Nutzer die Taste T drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** es wird keine Form vom Typ Tür eingefügt

#### Scenario: Export und Import
- **GIVEN** der Plan enthält eine als Möbel eingefügte Tür mit Breite 80 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** ist die Tür ohne Warnung mit Breite 80 cm vorhanden

## REMOVED Requirements

### Requirement: Einfügen mit Standardmaßen
**Reason**: Das Möbel-Werkzeug „Tür“ entfällt; Türen werden mit `room-openings` in die Raumwand gesetzt. Das Szenario „Tür einfügen“ gilt nicht mehr.
**Migration**: Ersetzt durch „Einfügen von L-Form, U-Form und Ecke“ mit unveränderten Standardmaßen für L-Form, U-Form und Ecke. Türen: siehe `room-openings`, „Öffnung setzen“.

### Requirement: Stil neuer Formen
**Reason**: Ohne Möbel-Werkzeug „Tür“ gibt es keine neu eingefügte Tür mehr, deren Stil „nur Rand“ festgelegt werden müsste.
**Migration**: Ersetzt durch „Stil neuer L-Formen, U-Formen und Ecken“. Vorhandene Möbel-Türen behalten ihren gespeicherten Stil.
