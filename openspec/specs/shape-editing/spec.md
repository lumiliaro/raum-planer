# shape-editing Specification

## Purpose

Erlaubt, Möbel als Formen auf den Grundriss der aktiven Etage zu stellen und sie direkt auf der Zeichenfläche auszuwählen, zu verschieben, zu drehen, in der Größe zu ändern und zu löschen – mit Einrasten auf ganze Zentimeter-Schritte, damit Maße exakt bleiben.

## Requirements

### Requirement: Werkzeuge in der Werkzeugleiste
Die Werkzeugleiste SHALL oben die Werkzeuge „Auswählen“, „Rechteck“ und „Ellipse“ in dieser Reihenfolge anbieten, jeweils mit deutschem Tooltip samt Tastenkürzel. Genau ein Werkzeug MUST als aktiv markiert sein; beim Start ist es „Auswählen“.

#### Scenario: Werkzeugleiste beim Start
- **WHEN** die App geladen wird
- **THEN** stehen oben in der Werkzeugleiste „Auswählen“, „Rechteck“ und „Ellipse“
- **AND** „Auswählen“ ist als aktiv markiert
- **AND** der Tooltip von „Rechteck“ nennt das Tastenkürzel R

#### Scenario: Werkzeug wählen
- **GIVEN** „Auswählen“ ist aktiv
- **WHEN** der Nutzer „Ellipse“ anklickt
- **THEN** ist „Ellipse“ als aktiv markiert und „Auswählen“ nicht mehr

### Requirement: Werkzeuge per Tastatur
Die Tasten `V`, `R` und `E` SHALL die Werkzeuge „Auswählen“, „Rechteck“ und „Ellipse“ wählen. `Esc` SHALL ein gewähltes Form-Werkzeug abbrechen und zu „Auswählen“ zurückkehren. Tastenkürzel MUST NOT wirken, solange ein Eingabefeld den Fokus hat.

#### Scenario: Rechteck per Taste
- **GIVEN** „Auswählen“ ist aktiv
- **WHEN** der Nutzer `R` drückt
- **THEN** ist „Rechteck“ aktiv

#### Scenario: Werkzeug abbrechen
- **GIVEN** „Ellipse“ ist aktiv
- **WHEN** der Nutzer `Esc` drückt
- **THEN** ist „Auswählen“ aktiv und es wurde keine Form eingefügt

#### Scenario: Tippen in einem Eingabefeld
- **GIVEN** ein Eingabefeld hat den Fokus
- **WHEN** der Nutzer `R` tippt
- **THEN** bleibt das aktive Werkzeug unverändert

### Requirement: Form einfügen per Klick
Ist „Rechteck“ oder „Ellipse“ aktiv, SHALL ein Klick auf die Zeichenfläche eine neue Form dieses Typs in der aktiven Etage einfügen, auch neben einer Vorlage und auf einer Etage ohne Vorlage. Ihr Mittelpunkt liegt an der Klickstelle in cm, auf ganze cm gerundet. Die neue Form liegt oben, ist danach ausgewählt, und das Werkzeug wechselt zu „Auswählen“.

#### Scenario: Rechteck einfügen
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer auf die Stelle der Zeichenfläche klickt, die bei x = 412,4 cm und y = 188,6 cm liegt
- **THEN** gibt es im Erdgeschoss ein neues Rechteck mit Mittelpunkt x = 412 cm, y = 189 cm
- **AND** das Rechteck ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Klick auf eine vorhandene Form
- **GIVEN** „Ellipse“ ist aktiv
- **WHEN** der Nutzer auf eine vorhandene Form klickt
- **THEN** wird an dieser Stelle eine neue Ellipse eingefügt, die über der vorhandenen Form liegt

#### Scenario: Klick neben den Grundriss
- **GIVEN** „Rechteck“ ist aktiv und die Vorlage des Erdgeschosses endet bei x = 1 240 cm
- **WHEN** der Nutzer bei x = 1 400 cm, y = 300 cm klickt
- **THEN** liegt dort ein neues Rechteck

#### Scenario: Ansicht ziehen mit Form-Werkzeug
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer mit gedrückter Maustaste über die Zeichenfläche zieht
- **THEN** verschiebt sich die Ansicht und es wird keine Form eingefügt

### Requirement: Standardwerte neuer Formen
Eine neue Form SHALL ohne Drehung, ungespiegelt, ohne Beschriftung und mit Füllfarbe `#E4E4E7`, Randfarbe `#52525B`, Randstärke 1,5 und Deckkraft 1 angelegt werden. Ein neues Rechteck MUST 100 cm breit und 60 cm tief sein und keinen Eckradius haben, eine neue Ellipse MUST 80 cm breit und 80 cm tief sein.

#### Scenario: Neues Rechteck
- **WHEN** ein Rechteck eingefügt wird
- **THEN** ist es 100 cm breit, 60 cm tief, hat einen Eckradius von 0 cm und eine Drehung von 0°

#### Scenario: Neue Ellipse
- **WHEN** eine Ellipse eingefügt wird
- **THEN** ist sie 80 cm breit und 80 cm tief

### Requirement: Formen darstellen
Die Zeichenfläche SHALL alle Formen der aktiven Etage über der Vorlage in ihrer Zeichenreihenfolge zeigen, maßstabsgetreu in cm. Formen folgen Zoom und Verschiebung der Ansicht. Die Randstärke MUST in Bildschirmpixeln gelten, unabhängig vom Zoom.

#### Scenario: Maßstabsgetreue Größe
- **GIVEN** die Vorlage des Erdgeschosses hat den Maßstab 0,5 px/cm ohne Ausrichtung und der Zoom steht auf 100 %
- **WHEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm und Mittelpunkt x = 200 cm, y = 100 cm angezeigt wird
- **THEN** ist es 100 × 60 Bildschirmpixel groß
- **AND** sein Mittelpunkt liegt auf dem Bildpixel x 100 · y 50 der Vorlage

#### Scenario: Zoom ändert die Randstärke nicht
- **GIVEN** ein Rechteck mit Randstärke 1,5 ist sichtbar
- **WHEN** der Nutzer von 100 % auf 400 % zoomt
- **THEN** wird das Rechteck viermal so groß dargestellt
- **AND** sein Rand bleibt 1,5 Bildschirmpixel stark

#### Scenario: Überlappende Formen
- **GIVEN** im Erdgeschoss liegt Form B in der Reihenfolge nach Form A und beide überlappen
- **WHEN** das Erdgeschoss angezeigt wird
- **THEN** verdeckt B im Überlappungsbereich A

#### Scenario: Nur Formen der aktiven Etage
- **GIVEN** im Obergeschoss gibt es ein Bett mit Breite 180 cm und Tiefe 200 cm
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** ist das Bett nicht zu sehen

#### Scenario: Ohne Kalibrierung
- **GIVEN** die Vorlage des Dachgeschosses ist nicht kalibriert und dort stehen zwei Formen
- **WHEN** das Dachgeschoss aktiv ist
- **THEN** werden beide Formen gezeichnet und lassen sich bearbeiten

### Requirement: Form auswählen
Ist „Auswählen“ aktiv, SHALL ein Klick auf eine Form genau diese Form auswählen. Bei überlappenden Formen MUST die oben liegende ausgewählt werden. Die ausgewählte Form SHALL einen blauen Rahmen mit Anfassern zum Ändern der Größe und einem Anfasser zum Drehen zeigen.

#### Scenario: Form anklicken
- **GIVEN** „Auswählen“ ist aktiv und keine Form ausgewählt
- **WHEN** der Nutzer auf ein Rechteck klickt
- **THEN** ist das Rechteck ausgewählt und zeigt den blauen Auswahlrahmen mit Anfassern

#### Scenario: Andere Form anklicken
- **GIVEN** Form A ist ausgewählt
- **WHEN** der Nutzer auf Form B klickt
- **THEN** ist nur noch Form B ausgewählt

### Requirement: Auswahl aufheben
Das System SHALL die Auswahl aufheben bei einem Klick auf eine Stelle ohne Form und ohne Raum, bei `Esc`, beim Wechsel der Etage und beim Start des Kalibrier-Modus. Ein Klick in einen Raum ohne Form SHALL die Form abwählen und den Raum auswählen (siehe `floor-rooms`). Die Auswahl MUST NOT gespeichert werden; nach dem Neuladen ist keine Form ausgewählt.

#### Scenario: Klick ins Leere
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer auf eine Stelle der Zeichenfläche ohne Form und ohne Raum klickt
- **THEN** ist keine Form mehr ausgewählt

#### Scenario: Klick in einen Raum
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer in einen Raum an eine Stelle ohne Form klickt
- **THEN** ist die Form nicht mehr ausgewählt und der Raum ist ausgewählt

#### Scenario: Etagenwechsel
- **GIVEN** im Erdgeschoss ist eine Form ausgewählt
- **WHEN** der Nutzer ins Obergeschoss und zurück ins Erdgeschoss wechselt
- **THEN** ist keine Form ausgewählt

### Requirement: Form verschieben
Ist „Auswählen“ aktiv, SHALL das Ziehen einer Form diese Form verschieben und auswählen; die Ansicht MUST dabei stillstehen. Die neue Lage SHALL nach dem Loslassen im Plan stehen. Größe und Drehung MUST unverändert bleiben.

#### Scenario: Form ziehen
- **GIVEN** ein Rechteck mit Mittelpunkt x = 200 cm, y = 100 cm ist nicht ausgewählt
- **WHEN** der Nutzer es um genau 50 cm nach rechts zieht und loslässt
- **THEN** liegt sein Mittelpunkt bei x = 250 cm, y = 100 cm
- **AND** das Rechteck ist ausgewählt
- **AND** die Ansicht hat sich nicht verschoben

### Requirement: Raster beim Verschieben
Beim Ziehen SHALL sich eine Form relativ zu ihrer Startlage in Schritten von 5 cm je Achse bewegen, außer sie rastet auf dieser Achse an einer Rastlinie ein (siehe „Einrasten je Achse mit Vorrang vor dem Raster“ in shape-snapping). Bei gedrückter Alt-Taste MUST die Schrittweite 1 cm betragen. Die Startlage MUST NOT vorher auf das Raster gezogen werden.

#### Scenario: 5-cm-Schritte
- **GIVEN** ein Schrank hat den Mittelpunkt x = 37 cm, y = 120 cm
- **WHEN** der Nutzer ihn ohne Alt-Taste um 13 cm nach rechts und 2 cm nach unten zieht
- **THEN** liegt sein Mittelpunkt bei x = 52 cm, y = 120 cm

#### Scenario: 1-cm-Schritte mit Alt
- **GIVEN** ein Schrank hat den Mittelpunkt x = 37 cm, y = 120 cm
- **WHEN** der Nutzer ihn mit gedrückter Alt-Taste um 13,4 cm nach rechts zieht
- **THEN** liegt sein Mittelpunkt bei x = 50 cm, y = 120 cm

### Requirement: Größe ändern
Die Anfasser der ausgewählten Form SHALL Breite und Tiefe ändern; die gegenüberliegende Seite bzw. Ecke MUST dabei stehen bleiben, auch bei gedrehter Form. Breite und Tiefe ändern sich relativ zum Ausgangsmaß in Schritten von 5 cm, mit Alt-Taste von 1 cm, und MUST mindestens 1 cm betragen. Wäre der Eckradius danach größer als die halbe kürzere Seite, SHALL er auf diesen Wert verkleinert werden.

#### Scenario: Breite vergrößern
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm und Mittelpunkt x = 200 cm, y = 100 cm ohne Drehung
- **WHEN** der Nutzer den rechten Anfasser um 22 cm nach rechts zieht und loslässt
- **THEN** ist das Rechteck 120 cm breit und 60 cm tief
- **AND** seine linke Kante liegt weiter bei x = 150 cm, sein Mittelpunkt also bei x = 210 cm

#### Scenario: Feine Schritte mit Alt
- **GIVEN** eine Ellipse mit Breite 80 cm und Tiefe 80 cm
- **WHEN** der Nutzer mit gedrückter Alt-Taste den unteren Anfasser um 7,3 cm nach unten zieht
- **THEN** ist die Ellipse 80 cm breit und 87 cm tief

#### Scenario: Eckradius wird angepasst
- **GIVEN** ein Rechteck mit Breite 200 cm, Tiefe 90 cm und Eckradius 40 cm
- **WHEN** der Nutzer die Tiefe über einen Anfasser auf 60 cm verkleinert
- **THEN** ist das Rechteck 60 cm tief und hat einen Eckradius von 30 cm

#### Scenario: Mindestgröße
- **GIVEN** ein Rechteck mit Breite 100 cm
- **WHEN** der Nutzer den rechten Anfasser bis über die linke Kante hinaus zieht
- **THEN** ist das Rechteck mindestens 1 cm breit und nicht gespiegelt

### Requirement: Drehen
Der Dreh-Anfasser der ausgewählten Form SHALL die Form um ihren Mittelpunkt drehen. Die Drehung MUST bei 0°, 90°, 180° und 270° einrasten, wenn sie höchstens 5° davon entfernt ist, und wird sonst auf ganze Grad gerundet. Gespeichert wird ein Wert von 0° bis unter 360°.

#### Scenario: Einrasten bei 90°
- **GIVEN** ein Rechteck mit Drehung 0°
- **WHEN** der Nutzer es auf 93° dreht und loslässt
- **THEN** hat es eine Drehung von 90°
- **AND** sein Mittelpunkt ist unverändert

#### Scenario: Freie Drehung
- **WHEN** der Nutzer eine Form auf 47,6° dreht und loslässt
- **THEN** hat sie eine Drehung von 48°

#### Scenario: Drehen gegen den Uhrzeigersinn
- **GIVEN** ein Rechteck mit Drehung 0°
- **WHEN** der Nutzer es um 30° gegen den Uhrzeigersinn dreht
- **THEN** hat es eine Drehung von 330°

### Requirement: Form löschen
Das System SHALL die ausgewählte Form mit `Entf` oder der Rücktaste sowie über „Löschen“ im Eigenschaften-Panel ohne Rückfrage aus ihrer Etage entfernen. Danach MUST keine Form ausgewählt sein. Ohne Auswahl oder bei Fokus in einem Eingabefeld MUST die Taste wirkungslos sein.

#### Scenario: Löschen per Taste
- **GIVEN** im Erdgeschoss liegen die Formen A, B, C und B ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** enthält das Erdgeschoss die Formen A, C
- **AND** keine Form ist ausgewählt

#### Scenario: Löschen ohne Auswahl
- **GIVEN** keine Form ist ausgewählt
- **WHEN** der Nutzer die Rücktaste drückt
- **THEN** bleiben alle Formen erhalten

### Requirement: Formen im Kalibrier-Modus
Während des Kalibrier-Modus MUST das System alle Formen ausblenden und alle Werkzeuge der Werkzeugleiste außer „Vorlage kalibrieren“ samt Tastenkürzeln sperren. Die Hinweisleiste SHALL zusätzlich „Möbel sind ausgeblendet.“ zeigen. Nach dem Beenden SHALL „Auswählen“ aktiv sein und die Formen wieder sichtbar.

#### Scenario: Kalibrieren mit Möbeln
- **GIVEN** im Erdgeschoss ist ein Rechteck ausgewählt
- **WHEN** der Nutzer den Kalibrier-Modus startet
- **THEN** ist das Rechteck nicht mehr zu sehen und keine Form ausgewählt
- **AND** die Hinweisleiste enthält „Möbel sind ausgeblendet.“
- **WHEN** der Nutzer die Kalibrierung beendet
- **THEN** ist das Rechteck wieder zu sehen und „Auswählen“ ist aktiv

#### Scenario: Tür im Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus ist aktiv
- **WHEN** der Nutzer auf „Tür“ klickt oder die Taste T drückt
- **THEN** bleibt kein Form-Werkzeug aktiv und es wird keine Form eingefügt

### Requirement: Drehung beim Ändern der Größe
Ändert der Nutzer die Größe einer Form über die Anfasser, MUST ihre Drehung unverändert bleiben, auch wenn sie nicht auf 0°, 90°, 180° oder 270° steht. Eingerastet wird nur, wenn die Form über den Dreh-Anfasser gedreht wird.

#### Scenario: Getippte Drehung bleibt
- **GIVEN** ein Rechteck mit Breite 100 cm und Drehung 93°
- **WHEN** der Nutzer den rechten Anfasser um 20 cm nach außen zieht und loslässt
- **THEN** ist das Rechteck 120 cm breit
- **AND** es hat weiter eine Drehung von 93°

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

### Requirement: Form sperren und entsperren
Bei ausgewählter Form SHALL der Panel-Kopf neben „Löschen“ eine Schaltfläche mit Schloss-Icon zeigen. Ist die Form nicht gesperrt, lautet ihr Tooltip „Sperren“ und ein Klick sperrt sie; ist sie gesperrt, zeigt sie ein geschlossenes Schloss als gedrückt, lautet der Tooltip „Entsperren“ und ein Klick entsperrt sie. Der Sperrzustand MUST im Plan gespeichert werden.

#### Scenario: Sperren
- **GIVEN** ein nicht gesperrtes Sofa ist ausgewählt
- **WHEN** der Nutzer im Panel-Kopf auf „Sperren“ klickt
- **THEN** ist das Sofa gesperrt und die Schaltfläche zeigt „Entsperren“

#### Scenario: Sperre bleibt nach dem Neuladen
- **GIVEN** ein Sofa wurde gesperrt
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist das Sofa weiterhin gesperrt

### Requirement: Gesperrte Form auf der Zeichenfläche
Eine gesperrte Form SHALL sich per Klick auswählen lassen. Ihr Auswahlrahmen MUST ohne Anfasser zum Ändern der Größe und ohne Dreh-Anfasser erscheinen. Ziehen auf einer gesperrten Form MUST die Ansicht verschieben statt der Form.

#### Scenario: Ziehen einer gesperrten Form
- **GIVEN** ein gesperrter Schrank mit Mittelpunkt x = 300 cm, y = 120 cm
- **WHEN** der Nutzer ihn mit „Auswählen“ um 50 cm nach rechts zieht
- **THEN** liegt der Mittelpunkt weiterhin bei x = 300 cm, y = 120 cm
- **AND** die Ansicht hat sich verschoben

#### Scenario: Auswahl ohne Anfasser
- **WHEN** der Nutzer einen gesperrten Schrank anklickt
- **THEN** ist er ausgewählt und von einem blauen Rahmen ohne Anfasser umgeben

### Requirement: Gesperrte Form nicht löschen
Eine gesperrte Form MUST sich weder mit `Entf` noch mit der Rücktaste noch über „Löschen“ entfernen lassen. „Löschen“ ist bei gesperrter Form gesperrt und hat den Tooltip „Gesperrt – zuerst entsperren“.

#### Scenario: Entf bei gesperrter Form
- **GIVEN** ein gesperrter Schrank ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist der Schrank weiterhin vorhanden und ausgewählt

### Requirement: Gesperrte Form im Eigenschaften-Panel
Bei einer gesperrten Form MUST das Panel die Felder für Maße und Lage (Breite, Tiefe und die übrigen Maße des Formtyps, X, Y, Drehung, Spiegeln) schreibgeschützt anzeigen. Beschriftung, Darstellung (Füllung, Rand, Randstärke, Deckkraft) und Anordnung SHALL änderbar bleiben.

#### Scenario: Maße schreibgeschützt
- **GIVEN** ein gesperrter Schrank mit Breite 120 cm ist ausgewählt
- **WHEN** der Nutzer das Feld „Breite“ anklickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 120 cm

#### Scenario: Farbe ändern
- **GIVEN** ein gesperrter Schrank ist ausgewählt
- **WHEN** der Nutzer die Füllfarbe ändert
- **THEN** hat der Schrank die neue Füllfarbe und ist weiterhin gesperrt

### Requirement: Sperre gilt für alle Bearbeitungswege
Das System MUST jede Änderung an Lage, Drehung, Spiegelung oder Maßen einer gesperrten Form ablehnen und eine gesperrte Form nicht löschen, unabhängig davon, wie die Änderung ausgelöst wird. Rückgängig, Wiederholen und Import sind davon ausgenommen, weil sie einen ganzen früheren oder geladenen Stand wiederherstellen.

#### Scenario: Rückgängig über die Sperre hinweg
- **GIVEN** ein Schrank wurde verschoben und danach gesperrt
- **WHEN** der Nutzer zweimal Strg+Z drückt
- **THEN** ist der Schrank nicht mehr gesperrt und liegt an seiner Ausgangslage

### Requirement: Anordnung im Eigenschaften-Panel
Bei ausgewählter Form SHALL das Panel einen Abschnitt „Anordnung“ mit den Schaltflächen „Nach vorne“, „Nach hinten“, „Ganz nach vorne“ und „Ganz nach hinten“ zeigen. Sie verschieben die Form in der Zeichenreihenfolge ihrer Etage. Liegt die Form schon am jeweiligen Ziel, MUST die Schaltfläche gesperrt sein. Die Form bleibt danach ausgewählt.

#### Scenario: Nach vorne
- **GIVEN** im Erdgeschoss liegen Teppich, Tisch, Stuhl übereinander (Stuhl oben) und der Teppich ist ausgewählt
- **WHEN** der Nutzer auf „Nach vorne“ klickt
- **THEN** ist die Reihenfolge Tisch, Teppich, Stuhl
- **AND** der Teppich liegt über dem Tisch und ist weiterhin ausgewählt

#### Scenario: Oberste Form
- **WHEN** die oberste Form der Etage ausgewählt ist
- **THEN** sind „Nach vorne“ und „Ganz nach vorne“ gesperrt
- **AND** „Nach hinten“ und „Ganz nach hinten“ sind verfügbar

#### Scenario: Einzige Form
- **WHEN** die einzige Form der Etage ausgewählt ist
- **THEN** sind alle vier Schaltflächen gesperrt

### Requirement: Anordnung per Tastatur
Bei ausgewählter Form SHALL Bild↑ die Form eine Stelle nach vorne und Bild↓ eine Stelle nach hinten verschieben, mit gedrückter Umschalttaste ganz nach vorne bzw. ganz nach hinten. Die Tooltips der Schaltflächen MUST das Kürzel nennen. Bei Fokus in einem Eingabefeld MUST die Taste wirkungslos für die Anordnung bleiben.

#### Scenario: Ganz nach hinten per Taste
- **GIVEN** im Erdgeschoss liegen Teppich, Tisch, Stuhl und der Stuhl ist ausgewählt
- **WHEN** der Nutzer Umschalt+Bild↓ drückt
- **THEN** ist die Reihenfolge Stuhl, Teppich, Tisch

#### Scenario: Tooltips
- **WHEN** der Nutzer mit dem Zeiger über den Schaltflächen der Anordnung verweilt
- **THEN** lauten die Tooltips „Nach vorne (Bild↑)“, „Nach hinten (Bild↓)“, „Ganz nach vorne (Umschalt+Bild↑)“ und „Ganz nach hinten (Umschalt+Bild↓)“

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
