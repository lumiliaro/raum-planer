# Spec Delta

## Purpose

Erlaubt, Möbel als Formen auf den Grundriss der aktiven Etage zu stellen und sie direkt auf der Zeichenfläche auszuwählen, zu verschieben, zu drehen, in der Größe zu ändern und zu löschen – mit Einrasten auf ganze Zentimeter-Schritte, damit Maße exakt bleiben.

## ADDED Requirements

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
Ist „Rechteck“ oder „Ellipse“ aktiv, SHALL ein Klick auf den Grundriss eine neue Form dieses Typs in der aktiven Etage einfügen. Ihr Mittelpunkt liegt an der Klickstelle, auf ganze cm gerundet. Die neue Form liegt oben, ist danach ausgewählt, und das Werkzeug wechselt zu „Auswählen“. Klicks neben den Grundriss MUST keine Form einfügen.

#### Scenario: Rechteck einfügen
- **GIVEN** das Erdgeschoss ist kalibriert und „Rechteck“ ist aktiv
- **WHEN** der Nutzer auf die Stelle im Grundriss klickt, die 412,4 cm vom linken und 188,6 cm vom oberen Bildrand entfernt ist
- **THEN** gibt es im Erdgeschoss ein neues Rechteck mit Mittelpunkt x = 412 cm, y = 189 cm
- **AND** das Rechteck ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Klick auf eine vorhandene Form
- **GIVEN** „Ellipse“ ist aktiv
- **WHEN** der Nutzer auf eine vorhandene Form klickt
- **THEN** wird an dieser Stelle eine neue Ellipse eingefügt, die über der vorhandenen Form liegt

#### Scenario: Klick neben den Grundriss
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer auf die graue Fläche neben dem Grundriss klickt
- **THEN** wird keine Form eingefügt und „Rechteck“ bleibt aktiv

#### Scenario: Ansicht ziehen mit Form-Werkzeug
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer mit gedrückter Maustaste über den Grundriss zieht
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
Die Zeichenfläche SHALL alle Formen der aktiven Etage über dem Grundriss in ihrer Zeichenreihenfolge zeigen, maßstabsgetreu über den Maßstab (px/cm) der Etage. Formen folgen Zoom und Verschiebung der Ansicht. Die Randstärke MUST in Bildschirmpixeln gelten, unabhängig vom Zoom.

#### Scenario: Maßstabsgetreue Größe
- **GIVEN** das Erdgeschoss hat den Maßstab 0,5 px/cm und der Zoom steht auf 100 %
- **WHEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm und Mittelpunkt x = 200 cm, y = 100 cm angezeigt wird
- **THEN** ist es 50 × 30 Bildschirmpixel groß
- **AND** sein Mittelpunkt liegt auf dem Bildpixel x 100 · y 50 des Grundrisses

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
Das System SHALL die Auswahl aufheben bei einem Klick auf eine Stelle ohne Form, bei `Esc`, beim Wechsel der Etage und beim Start des Kalibrier-Modus. Die Auswahl MUST NOT gespeichert werden; nach dem Neuladen ist keine Form ausgewählt.

#### Scenario: Klick ins Leere
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer auf eine Stelle des Grundrisses ohne Form klickt
- **THEN** ist keine Form mehr ausgewählt

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
Beim Ziehen SHALL sich eine Form relativ zu ihrer Startlage in Schritten von 5 cm je Achse bewegen. Bei gedrückter Alt-Taste MUST die Schrittweite 1 cm betragen. Die Startlage MUST NOT vorher auf das Raster gezogen werden.

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

### Requirement: Nicht kalibrierte Etage
Ist für die aktive Etage keine Kalibrierung hinterlegt, MUST das System „Rechteck“ und „Ellipse“ sperren und im Tooltip auf „Etage zuerst kalibrieren“ hinweisen; ihre Tastenkürzel sind wirkungslos. Gespeicherte Formen dieser Etage MUST NOT gezeichnet werden und MUST im Plan erhalten bleiben. Gibt es solche Formen, SHALL die Zeichenfläche einen Hinweis zeigen.

#### Scenario: Werkzeuge gesperrt
- **GIVEN** das Dachgeschoss ist nicht kalibriert
- **WHEN** der Nutzer ins Dachgeschoss wechselt
- **THEN** sind „Rechteck“ und „Ellipse“ gesperrt und ihr Tooltip nennt „Etage zuerst kalibrieren“
- **AND** `R` wählt kein Werkzeug

#### Scenario: Wechsel mit aktivem Form-Werkzeug
- **GIVEN** im kalibrierten Erdgeschoss ist „Rechteck“ aktiv
- **WHEN** der Nutzer ins nicht kalibrierte Dachgeschoss wechselt
- **THEN** ist „Auswählen“ aktiv

#### Scenario: Formen ohne Maßstab
- **GIVEN** im Plan stehen zwei Formen im Dachgeschoss, und das Dachgeschoss ist nicht kalibriert
- **WHEN** das Dachgeschoss aktiv ist
- **THEN** werden die Formen nicht gezeichnet
- **AND** die Zeichenfläche zeigt einen Hinweis, dass Möbel dieser Etage erst nach der Kalibrierung angezeigt werden
- **AND** beide Formen sind weiterhin im Plan vorhanden

### Requirement: Formen im Kalibrier-Modus
Während des Kalibrier-Modus MUST das System alle Formen ausblenden und die Werkzeuge „Auswählen“, „Rechteck“ und „Ellipse“ samt Tastenkürzeln sperren. Die Hinweisleiste SHALL zusätzlich „Möbel sind ausgeblendet.“ zeigen. Nach dem Beenden SHALL „Auswählen“ aktiv sein und die Formen wieder sichtbar.

#### Scenario: Kalibrieren mit Möbeln
- **GIVEN** im Erdgeschoss ist ein Rechteck ausgewählt
- **WHEN** der Nutzer den Kalibrier-Modus startet
- **THEN** ist das Rechteck nicht mehr zu sehen und keine Form ausgewählt
- **AND** die Hinweisleiste enthält „Möbel sind ausgeblendet.“
- **WHEN** der Nutzer die Kalibrierung beendet
- **THEN** ist das Rechteck wieder zu sehen und „Auswählen“ ist aktiv
