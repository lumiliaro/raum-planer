# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Nicht kalibrierte Etage
**Reason**: Die Zeichenfläche arbeitet in cm; Möbel brauchen keinen Maßstab mehr. Die Kalibrierung betrifft nur noch die Lage der Vorlage.
**Migration**: Keine. Formen nicht kalibrierter Etagen werden wieder gezeichnet und sind bedienbar; der Tooltip „Etage zuerst kalibrieren“ entfällt.

### Requirement: Weitere Werkzeuge gesperrt ohne Kalibrierung
**Reason**: Ohne Kalibrierung gibt es keine Sperre mehr. Die Sperre im Kalibrier-Modus gilt jetzt für alle Werkzeuge und steht in „Formen im Kalibrier-Modus“.
**Migration**: Siehe „Formen im Kalibrier-Modus“.
