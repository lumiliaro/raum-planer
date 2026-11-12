# Spec Delta

## Purpose

Legt das Eigenschaften-Formular einer ausgewählten Form fest – Beschriftung, Maße, Lage und Darstellung mit exakten Werten – und wie die Beschriftung auf der Zeichenfläche erscheint, damit Möbel genau nach Katalogmaß geplant und erkennbar benannt werden können.

## ADDED Requirements

### Requirement: Aufbau des Formulars
Ist eine Form ausgewählt, SHALL das Eigenschaften-Panel von oben nach unten zeigen: einen Kopf mit Icon und Formtyp-Namen sowie der Schaltfläche „Löschen“, das Feld „Beschriftung“, den Abschnitt „Maße“, den Abschnitt „Lage“ und den Abschnitt „Darstellung“.

#### Scenario: Rechteck ausgewählt
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm, Eckradius 0 cm, Mittelpunkt x = 412 cm, y = 189 cm, Drehung 0° und ohne Beschriftung
- **WHEN** der Nutzer es auswählt
- **THEN** zeigt der Kopf „Rechteck“ und „Löschen“
- **AND** das Feld „Beschriftung“ ist leer
- **AND** „Maße“ zeigt Breite 100 cm, Tiefe 60 cm und Eckradius 0 cm
- **AND** „Lage“ zeigt X 412 cm, Y 189 cm, Drehung 0° und „Spiegeln“ ist nicht aktiv

### Requirement: Formtyp-Namen
Das System SHALL die Formtypen mit diesen Namen zeigen: „Rechteck“, „Ellipse“, „L-Form“, „U-Form“, „Ecke“, „Tür“, „Freie Form“.

#### Scenario: Ellipse ausgewählt
- **WHEN** der Nutzer eine Ellipse auswählt
- **THEN** zeigt der Kopf des Panels „Ellipse“

### Requirement: Übernahme von Eingaben
Ein geändertes Feld SHALL mit Enter oder beim Verlassen des Feldes übernommen werden; erst dann ändert sich die Form, und zwar als genau eine Änderung am Plan. `Esc` MUST das Feld auf den aktuellen Wert der Form zurücksetzen, ohne sie zu ändern. Zahlen SHALL mit Komma oder Punkt als Dezimaltrennzeichen angenommen und auf 0,1 genau übernommen werden.

#### Scenario: Breite mit Enter übernehmen
- **GIVEN** ein Rechteck mit Breite 100 cm ist ausgewählt
- **WHEN** der Nutzer im Feld „Breite“ 238,5 eingibt und Enter drückt
- **THEN** ist das Rechteck 238,5 cm breit

#### Scenario: Übernahme beim Verlassen
- **GIVEN** ein Rechteck mit Tiefe 60 cm ist ausgewählt
- **WHEN** der Nutzer im Feld „Tiefe“ 96 eingibt und danach in das Feld „Breite“ klickt
- **THEN** ist das Rechteck 96 cm tief

#### Scenario: Eingabe verwerfen
- **GIVEN** ein Rechteck mit Breite 100 cm ist ausgewählt
- **WHEN** der Nutzer im Feld „Breite“ 150 eingibt und `Esc` drückt
- **THEN** bleibt das Rechteck 100 cm breit
- **AND** das Feld zeigt wieder 100

#### Scenario: Punkt als Dezimaltrennzeichen
- **WHEN** der Nutzer im Feld „X“ 412.44 eingibt und Enter drückt
- **THEN** liegt der Mittelpunkt der Form bei x = 412,4 cm

### Requirement: Ungültige Eingaben
Das System MUST eine Eingabe ablehnen, die keine Zahl ist oder die Form ungültig machen würde. Die Form bleibt dann unverändert, das Feld behält den eingegebenen Text und zeigt einen Hinweis: „Bitte eine Zahl eingeben“ oder die verletzte Grenze mit Einheit, z. B. „Muss größer als 0 cm sein“ oder „Darf höchstens 30 cm sein“. Der Hinweis verschwindet bei der nächsten gültigen Übernahme oder mit `Esc`.

#### Scenario: Keine Zahl
- **GIVEN** ein Rechteck mit Breite 100 cm ist ausgewählt
- **WHEN** der Nutzer im Feld „Breite“ „breit“ eingibt und Enter drückt
- **THEN** bleibt das Rechteck 100 cm breit
- **AND** am Feld steht „Bitte eine Zahl eingeben“

#### Scenario: Breite 0 cm
- **GIVEN** eine Ellipse mit Breite 80 cm ist ausgewählt
- **WHEN** der Nutzer im Feld „Breite“ 0 eingibt und Enter drückt
- **THEN** bleibt die Ellipse 80 cm breit
- **AND** am Feld steht „Muss größer als 0 cm sein“

### Requirement: Maße von Rechteck und Ellipse
Ist ein Rechteck oder eine Ellipse ausgewählt, SHALL der Abschnitt „Maße“ die Felder „Breite“ und „Tiefe“ in cm zeigen, beim Rechteck zusätzlich „Eckradius“ in cm. Eine Änderung von Breite oder Tiefe MUST den Mittelpunkt, die Drehung und die übrigen Maße unverändert lassen. Breite und Tiefe MUST größer als 0 cm sein.

#### Scenario: Breite ändern, Mittelpunkt bleibt
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm und Mittelpunkt x = 200 cm, y = 100 cm
- **WHEN** der Nutzer die Breite auf 140 cm setzt
- **THEN** ist das Rechteck 140 cm breit und 60 cm tief
- **AND** sein Mittelpunkt liegt weiter bei x = 200 cm, y = 100 cm

### Requirement: Eckradius des Rechtecks
Der Eckradius eines Rechtecks MUST mindestens 0 cm und höchstens die halbe kürzere Seite betragen; größere Werte werden mit „Darf höchstens … cm sein“ abgelehnt. Verkleinert der Nutzer Breite oder Tiefe so, dass der Eckradius zu groß wäre, SHALL der Eckradius auf die halbe kürzere Seite verkleinert werden.

#### Scenario: Sofa mit runden Ecken
- **GIVEN** ein Rechteck mit Breite 238 cm, Tiefe 96 cm und Eckradius 0 cm
- **WHEN** der Nutzer den Eckradius auf 12 cm setzt
- **THEN** hat das Rechteck einen Eckradius von 12 cm und bleibt 238 cm breit und 96 cm tief

#### Scenario: Eckradius zu groß
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm und Eckradius 0 cm
- **WHEN** der Nutzer den Eckradius auf 31 cm setzt
- **THEN** behält das Rechteck den Eckradius 0 cm
- **AND** am Feld steht „Darf höchstens 30 cm sein“

#### Scenario: Tiefe kleiner als der doppelte Eckradius
- **GIVEN** ein Rechteck mit Breite 200 cm, Tiefe 90 cm und Eckradius 40 cm
- **WHEN** der Nutzer die Tiefe auf 60 cm setzt
- **THEN** ist das Rechteck 60 cm tief und hat einen Eckradius von 30 cm

### Requirement: Lage
Der Abschnitt „Lage“ SHALL die Felder „X“ und „Y“ in cm für den Mittelpunkt und „Drehung“ in Grad zeigen. Eine Änderung von X oder Y MUST nur die Lage ändern, Maße und Drehung bleiben. Eine eingegebene Drehung SHALL auf 0° bis unter 360° umgerechnet und MUST NOT auf 0°, 90°, 180° oder 270° eingerastet werden.

#### Scenario: Mittelpunkt setzen
- **GIVEN** ein Rechteck mit Mittelpunkt x = 412 cm, y = 189 cm und Breite 100 cm
- **WHEN** der Nutzer bei „X“ 450 eingibt
- **THEN** liegt der Mittelpunkt bei x = 450 cm, y = 189 cm und das Rechteck ist weiter 100 cm breit

#### Scenario: Drehung ohne Einrasten
- **WHEN** der Nutzer bei „Drehung“ 93 eingibt
- **THEN** hat die Form eine Drehung von 93°

#### Scenario: Negative Drehung
- **WHEN** der Nutzer bei „Drehung“ −30 eingibt
- **THEN** hat die Form eine Drehung von 330°

### Requirement: Spiegeln
Der Abschnitt „Lage“ SHALL einen Schalter „Spiegeln – Horizontal“ zeigen, der den Zustand „gespiegelt“ der Form umschaltet und ihn als aktiv markiert anzeigt. Spiegeln MUST die Form an der senkrechten Achse durch ihren Mittelpunkt spiegeln; Lage, Maße und Drehung bleiben unverändert.

#### Scenario: Form spiegeln
- **GIVEN** ein Rechteck mit Mittelpunkt x = 200 cm, y = 100 cm ist nicht gespiegelt
- **WHEN** der Nutzer „Spiegeln“ anklickt
- **THEN** ist das Rechteck gespiegelt und der Schalter als aktiv markiert
- **AND** sein Mittelpunkt liegt weiter bei x = 200 cm, y = 100 cm
- **WHEN** der Nutzer „Spiegeln“ erneut anklickt
- **THEN** ist das Rechteck nicht mehr gespiegelt

### Requirement: Beschriftung
Das Feld „Beschriftung“ SHALL den Text der Form zeigen und ändern; Leerzeichen am Anfang und Ende werden entfernt. Ein leeres Feld MUST die Beschriftung entfernen.

#### Scenario: Beschriftung setzen
- **GIVEN** ein Rechteck ohne Beschriftung ist ausgewählt
- **WHEN** der Nutzer bei „Beschriftung“ „ Sofa “ eingibt und Enter drückt
- **THEN** hat das Rechteck die Beschriftung „Sofa“

#### Scenario: Beschriftung entfernen
- **GIVEN** ein Rechteck mit Beschriftung „Sofa“ ist ausgewählt
- **WHEN** der Nutzer das Feld „Beschriftung“ leert und es verlässt
- **THEN** hat das Rechteck keine Beschriftung mehr

### Requirement: Beschriftung auf der Zeichenfläche
Hat eine Form eine Beschriftung, SHALL die Zeichenfläche den Text einzeilig und mittig an der Beschriftungsstelle der Form zeigen; bei Rechteck und Ellipse ist das der Mittelpunkt. Der Text MUST unabhängig von Zoom und Drehung der Form gleich groß und waagerecht erscheinen, hat die Randfarbe der Form und folgt ihr beim Verschieben. Er MUST NOT Klicks abfangen.

#### Scenario: Beschriftung bei gedrehter Form
- **GIVEN** ein Rechteck mit Beschriftung „Bett“ und Drehung 90°
- **WHEN** das Rechteck angezeigt wird
- **THEN** steht „Bett“ waagerecht lesbar im Mittelpunkt des Rechtecks

#### Scenario: Beschriftung beim Zoomen
- **GIVEN** ein Rechteck mit Beschriftung „Bett“ ist sichtbar
- **WHEN** der Nutzer von 100 % auf 400 % zoomt
- **THEN** wird das Rechteck viermal so groß dargestellt, der Text bleibt gleich groß

#### Scenario: Klick auf die Beschriftung
- **GIVEN** „Auswählen“ ist aktiv und ein Rechteck mit Beschriftung „Bett“ ist nicht ausgewählt
- **WHEN** der Nutzer auf den Text „Bett“ klickt
- **THEN** ist das Rechteck ausgewählt

### Requirement: Voreinstellungen der Darstellung
Der Abschnitt „Darstellung“ SHALL die 8 Möbel-Voreinstellungen „Grau“, „Blau“, „Violett“, „Gelb“, „Türkis“, „Orange“, „Grün“ und „Nur Rand“ anbieten. Ein Klick MUST Füllfarbe und Randfarbe der Form zusammen setzen und Randstärke und Deckkraft unverändert lassen. Stimmen Füll- und Randfarbe der Form mit einer Voreinstellung überein, SHALL diese als aktiv markiert sein.

#### Scenario: Gelb wählen
- **GIVEN** ein Rechteck mit Füllfarbe `#E4E4E7`, Randfarbe `#52525B` und Randstärke 1,5 ist ausgewählt
- **WHEN** der Nutzer die Voreinstellung „Gelb“ anklickt
- **THEN** hat das Rechteck Füllfarbe `#FDE68A`, Randfarbe `#92400E` und weiter Randstärke 1,5
- **AND** „Gelb“ ist als aktiv markiert

#### Scenario: Neue Form
- **WHEN** der Nutzer ein neu eingefügtes Rechteck auswählt
- **THEN** ist die Voreinstellung „Grau“ als aktiv markiert

#### Scenario: Nur Rand wählen
- **WHEN** der Nutzer die Voreinstellung „Nur Rand“ anklickt
- **THEN** hat die Form keine Füllung und die Randfarbe `#27272A`

### Requirement: Füllfarbe und Randfarbe
Der Abschnitt „Darstellung“ SHALL je ein Farbfeld für Füllung und Rand zeigen, das die Farbauswahl des Browsers öffnet; die gewählte Farbe MUST übernommen werden, sobald die Auswahl bestätigt ist. Das Kontrollkästchen „Nur Rand“ MUST die Füllung entfernen; Abwählen SHALL die zuletzt gezeigte Füllfarbe dieser Form wiederherstellen, sonst `#E4E4E7`.

#### Scenario: Eigene Füllfarbe
- **WHEN** der Nutzer im Farbfeld „Füllung“ die Farbe `#A7F3D0` wählt und bestätigt
- **THEN** hat die Form die Füllfarbe `#A7F3D0`

#### Scenario: Nur Rand an und aus
- **GIVEN** ein Rechteck mit Füllfarbe `#FDE68A` ist ausgewählt
- **WHEN** der Nutzer „Nur Rand“ anhakt
- **THEN** hat das Rechteck keine Füllung und bleibt im Inneren anklickbar
- **WHEN** der Nutzer „Nur Rand“ wieder abwählt
- **THEN** hat das Rechteck die Füllfarbe `#FDE68A`

### Requirement: Randstärke und Deckkraft
Der Abschnitt „Darstellung“ SHALL die Randstärke als Feld in px zeigen (größer als 0 px, höchstens 20 px) und die Deckkraft als Schieberegler von 10 % bis 100 % in Schritten von 5 % mit Anzeige des Werts. Die Deckkraft MUST beim Loslassen des Reglers übernommen werden.

#### Scenario: Randstärke zu groß
- **WHEN** der Nutzer bei „Randstärke“ 25 eingibt und Enter drückt
- **THEN** bleibt die Randstärke unverändert
- **AND** am Feld steht „Darf höchstens 20 px sein“

#### Scenario: Deckkraft verringern
- **GIVEN** eine Form mit Deckkraft 100 % ist ausgewählt
- **WHEN** der Nutzer den Regler „Deckkraft“ auf 70 % zieht und loslässt
- **THEN** hat die Form die Deckkraft 70 %
- **AND** neben dem Regler steht „70 %“

### Requirement: Werte nach Änderungen auf der Zeichenfläche
Die Felder des Formulars SHALL nach jedem Verschieben, Drehen und Ändern der Größe auf der Zeichenfläche die aktuellen Werte zeigen. Ein Feld, in dem der Nutzer gerade tippt, MUST seinen Text behalten.

#### Scenario: Nach dem Verschieben
- **GIVEN** ein Rechteck mit Mittelpunkt x = 200 cm ist ausgewählt
- **WHEN** der Nutzer es auf der Zeichenfläche um 50 cm nach rechts zieht
- **THEN** zeigt das Feld „X“ 250

### Requirement: Tastenkürzel neben dem Formular
Tastenkürzel der Zeichenfläche (Werkzeuge, `Esc`, `Entf`/Rücktaste) MUST NOT wirken, solange ein Textfeld des Formulars den Fokus hat. Hat ein Schalter, ein Kontrollkästchen, ein Farbfeld oder der Deckkraft-Regler den Fokus, SHALL sie weiter wirken.

#### Scenario: Entf im Feld Beschriftung
- **GIVEN** eine Form ist ausgewählt und das Feld „Beschriftung“ hat den Fokus
- **WHEN** der Nutzer `Entf` drückt
- **THEN** bleibt die Form erhalten

#### Scenario: Entf nach „Nur Rand“
- **GIVEN** eine Form ist ausgewählt und der Nutzer hat gerade „Nur Rand“ angeklickt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist die Form gelöscht
