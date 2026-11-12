# floor-calibration Specification

## Purpose

Ermittelt den Maßstab (px/cm) einer Etage aus zwei Punkten im Grundriss und einer bekannten realen Länge und speichert ihn im Browser, sodass er nach dem Neuladen weiter gilt.

## Requirements

### Requirement: Kalibrier-Modus starten
Das System SHALL in der Werkzeugleiste und im Abschnitt „Vorlage“ des Eigenschaften-Panels eine Schaltfläche „Vorlage kalibrieren“ anbieten, die den Kalibrier-Modus für die Vorlage der aktiven Etage startet. Während der Modus aktiv ist, SHALL die Schaltfläche in der Werkzeugleiste als gedrückt markiert sein.

#### Scenario: Modus starten
- **GIVEN** das Erdgeschoss ist aktiv und hat eine Vorlage mit Bild
- **WHEN** der Nutzer „Vorlage kalibrieren“ anklickt
- **THEN** ist der Kalibrier-Modus aktiv und die Schaltfläche als gedrückt markiert
- **AND** unter der Kopfleiste erscheint der Hinweis „Kalibrier-Modus“ mit der Aufforderung, zwei Punkte auf einer Strecke mit bekannter Länge zu klicken
- **AND** rechts erscheint das Kalibrier-Panel mit der Überschrift „Erdgeschoss kalibrieren“

### Requirement: Kalibrier-Panel ersetzt das Eigenschaften-Panel
Während des Kalibrier-Modus SHALL rechts das Kalibrier-Panel anstelle des Eigenschaften-Panels angezeigt werden, auch wenn das Eigenschaften-Panel zuvor ausgeblendet war. Der Griff zum Ein- und Ausblenden MUST währenddessen verborgen sein. Der gespeicherte Zustand des Eigenschaften-Panels MUST unverändert bleiben.

#### Scenario: Panel war ausgeblendet
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet
- **WHEN** der Nutzer den Kalibrier-Modus startet
- **THEN** ist das Kalibrier-Panel sichtbar und kein Panel-Griff zu sehen
- **WHEN** der Nutzer den Kalibrier-Modus beendet
- **THEN** ist das Eigenschaften-Panel wieder ausgeblendet

### Requirement: Kalibrier-Modus beenden
Das System SHALL den Kalibrier-Modus über die Schaltfläche „Kalibrierung beenden“ in der Kopfleiste oder einen erneuten Klick auf „Vorlage kalibrieren“ in der Werkzeugleiste beenden. Nicht gespeicherte Punkte, Längen und Ausrichtungen MUST dabei verworfen werden; eine gespeicherte Kalibrierung MUST unverändert bleiben.

#### Scenario: Beenden ohne Speichern
- **GIVEN** für die Vorlage des Erdgeschosses ist keine Kalibrierung gespeichert
- **AND** im Kalibrier-Modus sind beide Punkte gesetzt und 1 000 cm eingegeben
- **WHEN** der Nutzer „Kalibrierung beenden“ anklickt
- **THEN** sind Hinweisleiste und Kalibrier-Panel verschwunden
- **AND** die Statusleiste zeigt weiterhin „Vorlage nicht kalibriert“
- **WHEN** der Nutzer den Kalibrier-Modus erneut startet
- **THEN** sind keine Punkte gesetzt und das Längenfeld ist leer

#### Scenario: Gespeicherte Kalibrierung bleibt beim Beenden erhalten
- **GIVEN** für die Vorlage des Erdgeschosses ist eine Kalibrierung mit 1 000 cm gespeichert
- **AND** im Kalibrier-Modus hat der Nutzer P2 verschoben und 500 cm eingegeben
- **WHEN** der Nutzer „Kalibrierung beenden“ anklickt
- **THEN** zeigt die Statusleiste weiterhin den gespeicherten Maßstab
- **WHEN** der Nutzer den Kalibrier-Modus erneut startet
- **THEN** zeigt das Panel die gespeicherten Punkte und 1 000 cm

### Requirement: Gespeicherte Kalibrierung als Ausgangspunkt
Startet der Kalibrier-Modus für eine Etage mit gespeicherter Kalibrierung, SHALL das System deren Punkte und reale Länge vorbelegen, sodass Messstrecke und Ergebnis sofort sichtbar sind. Die Länge MUST dabei mit deutschem Dezimalkomma im Längenfeld stehen.

#### Scenario: Erneut kalibrieren
- **GIVEN** für das Erdgeschoss ist P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px und 412,5 cm gespeichert
- **WHEN** der Nutzer den Kalibrier-Modus startet
- **THEN** sind P1 und P2 an diesen Stellen gesetzt und durch die Messstrecke verbunden
- **AND** das Längenfeld zeigt „412,5“
- **AND** das Ergebnis wird angezeigt

### Requirement: Punkte setzen
Im Kalibrier-Modus SHALL ein Klick auf den Grundriss zuerst Punkt 1 und danach Punkt 2 setzen. Die Koordinaten MUST sich auf die Originalpixel des Grundrissbilds beziehen, unabhängig von Zoom und Verschiebung. Klicks außerhalb des Grundrissbilds und weitere Klicks bei zwei gesetzten Punkten MUST keine Wirkung haben.

#### Scenario: Zwei Punkte setzen
- **GIVEN** der Kalibrier-Modus ist aktiv und kein Punkt gesetzt
- **WHEN** der Nutzer auf den Grundriss klickt
- **THEN** erscheint dort die Markierung „P1“ und das Panel zeigt „Punkt 1 gesetzt“ mit den Bildkoordinaten in px
- **WHEN** der Nutzer ein zweites Mal auf den Grundriss klickt
- **THEN** erscheint dort die Markierung „P2“, beide Punkte sind durch eine Messstrecke verbunden und das Panel zeigt „Punkt 2 gesetzt“

#### Scenario: Koordinaten unabhängig vom Zoom
- **GIVEN** der Zoom steht auf 200 % und die Ansicht ist verschoben
- **WHEN** der Nutzer auf die Stelle klickt, die im Originalbild bei x 120,0 px · y 160,4 px liegt
- **THEN** zeigt das Panel für diesen Punkt „x 120,0 · y 160,4 px“

#### Scenario: Klick neben den Grundriss
- **WHEN** der Nutzer im Kalibrier-Modus auf die graue Fläche neben dem Grundriss klickt
- **THEN** wird kein Punkt gesetzt

### Requirement: Messstrecke anzeigen
Sind beide Punkte gesetzt, SHALL das System die Strecke zwischen ihnen auf dem Grundriss anzeigen und ihre Länge in Bildpixeln mit einer Nachkommastelle und deutschem Dezimalkomma beschriften. Markierungen und Beschriftungen MUST bei jedem Zoomwert gleich groß auf dem Bildschirm erscheinen.

#### Scenario: Beschriftung der Strecke
- **GIVEN** P1 liegt bei x 120,0 · y 160,4 px und P2 bei x 1 118,6 · y 160,4 px
- **THEN** ist die Messstrecke mit „998,6 px“ beschriftet

### Requirement: Punkte nachträglich verschieben
Gesetzte Punkte SHALL sich mit der Maus verschieben lassen; Ziehen an einem Punkt MUST den Punkt bewegen und nicht die Ansicht. Ein Punkt MUST dabei innerhalb des Grundrissbilds bleiben. Koordinaten, Messstrecke und Ergebnis SHALL sich während des Ziehens fortlaufend aktualisieren.

#### Scenario: Punkt 2 nachjustieren
- **GIVEN** beide Punkte sind gesetzt und 1 000 cm eingegeben
- **WHEN** der Nutzer P2 mit der Maus an eine andere Stelle zieht
- **THEN** bleibt die Ansicht unverändert
- **AND** Koordinaten von Punkt 2, Beschriftung der Messstrecke und Ergebnis zeigen die neuen Werte

### Requirement: Punkte neu setzen
Das Kalibrier-Panel SHALL eine Schaltfläche „Punkte neu setzen“ anbieten, die beide Punkte entfernt, sodass der nächste Klick wieder Punkt 1 setzt. Die eingegebene Länge MUST erhalten bleiben.

#### Scenario: Neu beginnen
- **GIVEN** beide Punkte sind gesetzt und 1 000 cm eingegeben
- **WHEN** der Nutzer „Punkte neu setzen“ anklickt
- **THEN** sind keine Punkte mehr gesetzt und das Längenfeld zeigt weiterhin 1 000 cm

### Requirement: Reale Länge eingeben
Das Kalibrier-Panel SHALL ein Eingabefeld „Reale Länge der Strecke“ in cm anbieten, das ganze Zahlen und Dezimalzahlen mit Komma oder Punkt annimmt. Ist die Eingabe leer, keine Zahl oder nicht größer als 0 cm, MUST kein Ergebnis angezeigt werden; bei einer ungültigen, nicht leeren Eingabe SHALL ein Hinweis erscheinen.

#### Scenario: Dezimalkomma
- **WHEN** der Nutzer „412,5“ eingibt
- **THEN** wird die Länge als 412,5 cm verwendet

#### Scenario: Ungültige Länge
- **WHEN** der Nutzer „0“ oder „abc“ eingibt
- **THEN** wird kein Ergebnis angezeigt
- **AND** das Panel weist darauf hin, dass eine Länge größer als 0 cm nötig ist

### Requirement: Ergebnis berechnen
Sind beide Punkte gesetzt, liegen sie nicht aufeinander und ist eine gültige Länge eingegeben, SHALL das System den Maßstab als Bildpixel pro cm berechnen und anzeigen: `pxPerCm` mit vier Nachkommastellen und „Raster 1 m entspricht … px“ mit einer Nachkommastelle, jeweils mit deutschem Dezimalkomma. Die Berechnung MUST auf den auf eine Nachkommastelle gerundeten Punktkoordinaten beruhen, die auch angezeigt werden.

#### Scenario: Außenwand mit 1 000 cm
- **GIVEN** P1 liegt bei x 120,0 · y 160,4 px und P2 bei x 1 118,6 · y 160,4 px
- **WHEN** der Nutzer als reale Länge 1 000 cm eingibt
- **THEN** zeigt das Panel „pxPerCm 0,9986“
- **AND** „Raster 1 m entspricht 99,9 px“
- **AND** die Statusleiste zeigt weiterhin den gespeicherten Stand der Etage

#### Scenario: Punkte aufeinander
- **GIVEN** P1 und P2 liegen auf denselben Bildkoordinaten
- **WHEN** der Nutzer eine gültige Länge eingibt
- **THEN** wird kein Ergebnis angezeigt

### Requirement: Kalibrierung speichern
Das Kalibrier-Panel SHALL eine Schaltfläche „Kalibrierung speichern“ anbieten, die nur bei vorliegendem Ergebnis bedienbar ist. Speichern SHALL Punkte, reale Länge in cm, `pxPerCm` und Ausrichtung als Kalibrierung der Vorlage der aktiven Etage übernehmen, eine vorher gespeicherte ersetzen, den Modus beenden und die Ansicht neu einpassen. Möbel MUST ihre Lage in cm behalten. Die Kalibrierung MUST mit dem Plan gespeichert werden.

#### Scenario: Speichern
- **GIVEN** P1 liegt bei x 120,0 · y 160,4 px, P2 bei x 1 118,6 · y 160,4 px und die reale Länge ist 1 000 cm
- **WHEN** der Nutzer „Kalibrierung speichern“ anklickt
- **THEN** ist der Kalibrier-Modus beendet und die Ansicht zeigt Vorlage und Möbel eingepasst
- **AND** die Statusleiste zeigt für das Erdgeschoss „Maßstab: 0,9986 px/cm“
- **WHEN** der Nutzer die App neu lädt
- **THEN** zeigt die Statusleiste für das Erdgeschoss weiterhin „Maßstab: 0,9986 px/cm“

#### Scenario: Möbel bleiben in cm
- **GIVEN** im Erdgeschoss steht ein Sofa bei x = 300 cm, y = 200 cm und die Vorlage hat 0,7480 px/cm
- **WHEN** der Nutzer eine Kalibrierung mit 0,9986 px/cm speichert
- **THEN** steht das Sofa weiter bei x = 300 cm, y = 200 cm
- **AND** die Vorlage ist darunter kleiner geworden

#### Scenario: Ohne Ergebnis nicht speicherbar
- **GIVEN** im Kalibrier-Modus ist nur Punkt 1 gesetzt
- **THEN** ist „Kalibrierung speichern“ nicht bedienbar

#### Scenario: Andere Etagen bleiben unberührt
- **GIVEN** die Vorlage des Obergeschosses ist kalibriert
- **WHEN** der Nutzer eine Kalibrierung für das Erdgeschoss speichert
- **THEN** bleibt die Kalibrierung des Obergeschosses unverändert

#### Scenario: Browser-Speicher blockiert
- **GIVEN** der Browser verweigert das Schreiben in den Speicher und ein Ergebnis liegt vor
- **WHEN** der Nutzer „Kalibrierung speichern“ anklickt
- **THEN** ist der Kalibrier-Modus beendet und die Statusleiste zeigt den neuen Maßstab
- **AND** die Statusleiste zeigt rechts „Nicht gespeichert“

### Requirement: Etage wechseln im Kalibrier-Modus
Der Etagen-Umschalter SHALL im Kalibrier-Modus bedienbar bleiben. Ein Etagenwechsel MUST nicht gespeicherte Punkte und Längen verwerfen; der Modus bleibt aktiv und gilt für die neue Etage, vorbelegt mit deren gespeicherter Kalibrierung, sofern vorhanden.

#### Scenario: Wechsel ins nicht kalibrierte Obergeschoss
- **GIVEN** für das Obergeschoss ist keine Kalibrierung gespeichert
- **AND** im Kalibrier-Modus für das Erdgeschoss ist Punkt 1 gesetzt
- **WHEN** der Nutzer „Obergeschoss“ anklickt
- **THEN** zeigt das Panel „Obergeschoss kalibrieren“ ohne gesetzte Punkte und mit leerem Längenfeld

#### Scenario: Wechsel ins kalibrierte Obergeschoss
- **GIVEN** für das Obergeschoss ist eine Kalibrierung mit 737 cm gespeichert
- **WHEN** der Nutzer im Kalibrier-Modus „Obergeschoss“ anklickt
- **THEN** zeigt das Panel „Obergeschoss kalibrieren“ mit den gespeicherten Punkten und „737“ im Längenfeld

### Requirement: Navigation im Kalibrier-Modus
Zoomen mit Mausrad, Zoom-Leiste und Tasten sowie Verschieben der Ansicht durch Ziehen auf dem Grundriss SHALL im Kalibrier-Modus wie gewohnt funktionieren. Ein Ziehen der Ansicht MUST keinen Punkt setzen.

#### Scenario: Ansicht ziehen setzt keinen Punkt
- **GIVEN** der Kalibrier-Modus ist aktiv und kein Punkt gesetzt
- **WHEN** der Nutzer mit gedrückter Maustaste über den Grundriss zieht
- **THEN** verschiebt sich die Ansicht
- **AND** es wird kein Punkt gesetzt

### Requirement: Kalibrieren nur mit Grundriss
Hat die aktive Etage keine Vorlage mit vorhandenem Bild, SHALL „Vorlage kalibrieren“ gesperrt sein und als Tooltip „Vorlage kalibrieren – zuerst ein Bild hochladen“ zeigen. Wechselt der Nutzer im Kalibrier-Modus auf eine Etage ohne Vorlage mit vorhandenem Bild, MUST der Kalibrier-Modus enden; nicht gespeicherte Punkte und Längen werden verworfen.

#### Scenario: Neue Etage
- **GIVEN** die Etage „Keller“ hat keine Vorlage und ist aktiv
- **THEN** ist „Vorlage kalibrieren“ gesperrt und zeigt den Tooltip „Vorlage kalibrieren – zuerst ein Bild hochladen“

#### Scenario: Vorlagenbild fehlt
- **GIVEN** das Erdgeschoss hat eine Vorlage ohne vorhandenes Bild
- **THEN** ist „Vorlage kalibrieren“ gesperrt

#### Scenario: Wechsel im Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus für das Erdgeschoss ist aktiv
- **WHEN** der Nutzer in die Etage „Keller“ ohne Vorlage wechselt
- **THEN** ist der Kalibrier-Modus beendet und das Eigenschaften-Panel wieder zu sehen

### Requirement: Ausrichtung der Strecke
Das Kalibrier-Panel SHALL unter der Länge die Auswahl „Ausrichtung“ mit „Keine“, „Strecke ist waagerecht“ und „Strecke ist senkrecht“ anbieten, vorbelegt mit der gespeicherten Ausrichtung, sonst „Keine“. Bei gesetzten Punkten SHALL das Panel die sich ergebende Drehung der Vorlage in Grad mit einer Nachkommastelle zeigen. Die Ausrichtung wird mit der Kalibrierung gespeichert.

#### Scenario: Schiefen Scan gerade stellen
- **GIVEN** P1 liegt bei x 100,0 · y 100,0 px und P2 bei x 1 100,0 · y 120,0 px
- **WHEN** der Nutzer „Strecke ist waagerecht“ wählt
- **THEN** zeigt das Panel „Drehung −1,1°“
- **WHEN** er die Kalibrierung speichert
- **THEN** liegt die Messstrecke in der Ansicht waagerecht

#### Scenario: Ohne Ausrichtung
- **WHEN** „Keine“ gewählt ist
- **THEN** zeigt das Panel „Drehung 0,0°“ und die Vorlage wird nicht gedreht
