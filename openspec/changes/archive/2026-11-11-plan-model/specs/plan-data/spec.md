# Spec Delta

## Purpose

Legt fest, wie ein Plan, seine Kalibrierungen und seine Möbelformen aufgebaut sind, welche Werte gültig sind und wie Formen hinzugefügt, geändert, gelöscht und in der Zeichenreihenfolge verschoben werden – die gemeinsame Grundlage für Zeichenfläche, Eigenschaften-Panel, Speichern und Export.

## ADDED Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die aktive Etage, je konfigurierter Etage höchstens eine Kalibrierung und je konfigurierter Etage eine geordnete Liste von Formen. Jede Form und jede Kalibrierung MUST genau einer Etage gehören. Die Formatversion des Plans ist 1.

#### Scenario: Formen je Etage
- **GIVEN** ein Plan mit zwei Formen im Erdgeschoss und einer Form im Obergeschoss
- **WHEN** die Formen des Dachgeschosses abgefragt werden
- **THEN** ist die Liste des Dachgeschosses leer
- **AND** die Formen von Erdgeschoss und Obergeschoss sind unverändert vorhanden

#### Scenario: Unbekannte Etage
- **WHEN** ein Plan Formen unter einer Etage „keller“ enthält, die nicht konfiguriert ist
- **THEN** gilt der Plan als ungültig

#### Scenario: Etagen ohne Kalibrierung
- **WHEN** ein Plan nur für das Erdgeschoss eine Kalibrierung enthält
- **THEN** gilt der Plan als gültig
- **AND** Obergeschoss und Dachgeschoss gelten als nicht kalibriert

#### Scenario: Kalibrierung einer unbekannten Etage
- **WHEN** ein Plan eine Kalibrierung unter der Etage „keller“ enthält
- **THEN** gilt der Plan als ungültig

### Requirement: Neuer leerer Plan
Das System SHALL einen neuen Plan mit Formatversion 1, dem Namen „Meine Planung“, dem Erdgeschoss als aktiver Etage, ohne Kalibrierung und mit einer leeren Formenliste für jede konfigurierte Etage anlegen. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 1 und den Namen „Meine Planung“
- **AND** die aktive Etage ist das Erdgeschoss
- **AND** Erdgeschoss, Obergeschoss und Dachgeschoss haben je eine leere Formenliste
- **AND** keine Etage ist kalibriert

### Requirement: Gültige Kalibrierung
Eine Kalibrierung SHALL zwei Punkte in Pixeln des Grundrissbilds, die reale Länge zwischen ihnen in cm und den Maßstab in Bildpixeln je cm enthalten. Die Koordinaten der Punkte MUST mindestens 0 px sein; reale Länge und Maßstab MUST größer als 0 sein.

#### Scenario: Gültige Kalibrierung
- **WHEN** eine Kalibrierung mit P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm und 0,9986 px/cm geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Maßstab 0
- **WHEN** eine Kalibrierung mit dem Maßstab 0 px/cm geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Kalibrierung setzen
Das System SHALL die Kalibrierung einer Etage setzen und dabei eine vorhandene Kalibrierung dieser Etage ersetzen. Kalibrierungen anderer Etagen und alle Formen MUST unverändert bleiben. Eine ungültige Kalibrierung MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Kalibrierung ersetzen
- **GIVEN** Erdgeschoss und Obergeschoss sind kalibriert, das Erdgeschoss mit 0,7480 px/cm
- **WHEN** für das Erdgeschoss eine Kalibrierung mit 0,9986 px/cm gesetzt wird
- **THEN** hat das Erdgeschoss den Maßstab 0,9986 px/cm
- **AND** die Kalibrierung des Obergeschosses und die Formen aller Etagen sind unverändert

#### Scenario: Ungültige Kalibrierung
- **WHEN** für das Erdgeschoss eine Kalibrierung mit der realen Länge 0 cm gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

### Requirement: Gemeinsame Eigenschaften einer Form
Jede Form SHALL eine eindeutige ID, einen Formtyp, die Position ihres Mittelpunkts (x, y) in cm, eine Drehung in Grad von 0 bis unter 360, einen Spiegel-Schalter, einen Stil (Füllfarbe oder „keine Füllung“, Randfarbe, Randstärke, Deckkraft 0 bis 1) sowie optional eine Beschriftung und eine Sperre haben. Farben MUST im Format `#RRGGBB` angegeben sein.

#### Scenario: Gültige Form ohne Füllung
- **WHEN** eine Form mit Mittelpunkt x = 250 cm, y = 120 cm, Drehung 90°, Füllung „keine“, Randfarbe `#18181B`, Randstärke 1 und Deckkraft 1 geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Ungültige Drehung oder Deckkraft
- **WHEN** eine Form mit Drehung 360° oder mit Deckkraft 1,5 geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Ungültige Farbe
- **WHEN** eine Form mit der Füllfarbe „blau“ geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Formtypen und ihre Maße
Das System SHALL genau die Formtypen Rechteck (Breite, Tiefe, Eckradius), Ellipse (Breite, Tiefe), L-Form (Breite, Tiefe, Stärke von Schenkel A und B), U-Form (Breite, Tiefe, Stärke von Basis und Seiten), Ecke (Breite, Tiefe), Türaufschlag (Breite) und Polygon (Punktliste relativ zum Mittelpunkt) kennen. Alle Maße MUST in cm angegeben sein.

#### Scenario: Rechteck mit Eckradius
- **WHEN** ein Rechteck mit Breite 220 cm, Tiefe 95 cm und Eckradius 10 cm geprüft wird
- **THEN** gilt es als gültig

#### Scenario: Unbekannter Formtyp
- **WHEN** eine Form vom Typ „dreieck“ geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Plausible Maße
Das System MUST Formen mit unplausiblen Maßen als ungültig behandeln: Breite und Tiefe müssen größer als 0 cm sein; der Eckradius darf 0 cm bis höchstens die Hälfte der kürzeren Seite betragen; Schenkel-, Basis- und Seitenstärken müssen größer als 0 cm und kleiner als die Seite sein, in deren Richtung sie gemessen werden (bei der U-Form beide Seiten zusammen kleiner als die Breite); ein Polygon braucht mindestens 3 Punkte.

#### Scenario: Breite 0 cm
- **WHEN** eine Ellipse mit Breite 0 cm und Tiefe 80 cm geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Eckradius zu groß
- **WHEN** ein Rechteck mit Breite 200 cm, Tiefe 90 cm und Eckradius 50 cm geprüft wird
- **THEN** gilt es als ungültig, weil der Eckradius höchstens 45 cm betragen darf

#### Scenario: L-Form mit zu dickem Schenkel
- **WHEN** eine L-Form mit Breite 280 cm, Tiefe 200 cm und einem Schenkel A der Stärke 200 cm geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: U-Form mit zu breiten Seiten
- **WHEN** eine U-Form mit Breite 300 cm und einer Seitenstärke von 150 cm geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Polygon mit zwei Punkten
- **WHEN** ein Polygon mit den Punkten (0 cm, 0 cm) und (100 cm, 0 cm) geprüft wird
- **THEN** gilt es als ungültig

### Requirement: Form hinzufügen
Das System SHALL eine gültige Form am Ende der Formenliste einer Etage hinzufügen, sodass sie oben liegt. Eine Form mit einer ID, die im Plan bereits vorkommt, oder eine ungültige Form MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Neue Form liegt oben
- **GIVEN** das Erdgeschoss enthält die Formen A und B
- **WHEN** die Form C im Erdgeschoss hinzugefügt wird
- **THEN** ist die Reihenfolge A, B, C und C liegt oben

#### Scenario: Doppelte ID
- **GIVEN** im Obergeschoss gibt es eine Form mit der ID X
- **WHEN** im Erdgeschoss eine weitere Form mit der ID X hinzugefügt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

### Requirement: Form ändern
Das System SHALL einzelne Eigenschaften einer vorhandenen Form ändern, ohne ihre ID, ihren Formtyp oder ihre Position in der Zeichenreihenfolge zu verändern. Wäre die Form nach der Änderung ungültig, MUST die Änderung abgelehnt werden und der Plan unverändert bleiben.

#### Scenario: Breite ändern
- **GIVEN** ein Rechteck mit Breite 200 cm und Tiefe 90 cm
- **WHEN** die Breite auf 180 cm geändert wird
- **THEN** hat das Rechteck die Breite 180 cm und die Tiefe 90 cm

#### Scenario: Ungültige Änderung
- **GIVEN** ein Rechteck mit Breite 200 cm, Tiefe 90 cm und Eckradius 40 cm
- **WHEN** die Tiefe auf 60 cm geändert werden soll
- **THEN** wird die Änderung abgelehnt, weil der Eckradius dann größer als 30 cm wäre
- **AND** das Rechteck hat weiterhin die Tiefe 90 cm

### Requirement: Form löschen
Das System SHALL eine Form anhand ihrer ID aus ihrer Etage entfernen; die Reihenfolge der übrigen Formen MUST erhalten bleiben.

#### Scenario: Mittlere Form löschen
- **GIVEN** das Erdgeschoss enthält die Formen A, B, C
- **WHEN** B gelöscht wird
- **THEN** enthält das Erdgeschoss die Formen A, C in dieser Reihenfolge

### Requirement: Zeichenreihenfolge
Die Reihenfolge der Formen einer Etage SHALL ihre Zeichenreihenfolge sein: die letzte Form liegt oben. Das System SHALL eine Form um eine Stelle nach vorne oder hinten sowie ganz nach vorne oder ganz nach hinten verschieben können. Liegt die Form bereits am Ziel, MUST der Plan unverändert bleiben.

#### Scenario: Eine Stelle nach vorne
- **GIVEN** das Erdgeschoss enthält die Formen A, B, C
- **WHEN** A eine Stelle nach vorne verschoben wird
- **THEN** ist die Reihenfolge B, A, C

#### Scenario: Ganz nach hinten
- **GIVEN** das Erdgeschoss enthält die Formen A, B, C
- **WHEN** C ganz nach hinten verschoben wird
- **THEN** ist die Reihenfolge C, A, B

#### Scenario: Bereits ganz vorne
- **GIVEN** das Erdgeschoss enthält die Formen A, B, C
- **WHEN** C nach vorne verschoben wird
- **THEN** bleibt die Reihenfolge A, B, C

### Requirement: Änderungszeitpunkt
Das System SHALL den Änderungszeitpunkt des Plans bei jedem Hinzufügen, Ändern, Löschen oder Umordnen einer Form und beim Setzen einer Kalibrierung auf den aktuellen Zeitpunkt setzen. Das Umschalten der aktiven Etage und abgelehnte Änderungen MUST den Änderungszeitpunkt nicht verändern.

#### Scenario: Form hinzugefügt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Form hinzugefügt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Kalibrierung gesetzt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Kalibrierung für das Erdgeschoss gesetzt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage gewechselt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** der Nutzer ins Obergeschoss wechselt
- **THEN** bleibt der Änderungszeitpunkt 01.11.2026, 10:00 Uhr
