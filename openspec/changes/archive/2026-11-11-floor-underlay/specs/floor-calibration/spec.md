# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Kalibrier-Modus starten
Das System SHALL in der Werkzeugleiste und im Abschnitt „Vorlage“ des Eigenschaften-Panels eine Schaltfläche „Vorlage kalibrieren“ anbieten, die den Kalibrier-Modus für die Vorlage der aktiven Etage startet. Während der Modus aktiv ist, SHALL die Schaltfläche in der Werkzeugleiste als gedrückt markiert sein.

#### Scenario: Modus starten
- **GIVEN** das Erdgeschoss ist aktiv und hat eine Vorlage mit Bild
- **WHEN** der Nutzer „Vorlage kalibrieren“ anklickt
- **THEN** ist der Kalibrier-Modus aktiv und die Schaltfläche als gedrückt markiert
- **AND** unter der Kopfleiste erscheint der Hinweis „Kalibrier-Modus“ mit der Aufforderung, zwei Punkte auf einer Strecke mit bekannter Länge zu klicken
- **AND** rechts erscheint das Kalibrier-Panel mit der Überschrift „Erdgeschoss kalibrieren“

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
