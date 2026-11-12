# plan-data Specification

## Purpose

Legt fest, wie ein Plan, seine Kalibrierungen und seine Möbelformen aufgebaut sind, welche Werte gültig sind und wie Formen hinzugefügt, geändert, gelöscht und in der Zeichenreihenfolge verschoben werden – die gemeinsame Grundlage für Zeichenfläche, Eigenschaften-Panel, Speichern und Export.

## Requirements

### Requirement: Aufbau des Plans
Ein Plan SHALL enthalten: die Formatversion `schemaVersion`, einen Namen, Zeitpunkt der Erstellung und der letzten inhaltlichen Änderung, die geordnete Liste seiner Etagen (siehe `floor-management`), die aktive Etage, je Etage höchstens eine Vorlage (siehe `floor-underlay`), je Etage eine geordnete Liste von Räumen (siehe „Räume im Plan“), je Etage eine geordnete Liste von Formen und die Einstellungen des Plans (siehe `app-settings`). Jede Form, jeder Raum und jede Vorlage MUST genau einer Etage des Plans gehören, und die aktive Etage MUST eine Etage des Plans sein. Die Formatversion des Plans ist 10.

#### Scenario: Formen je Etage
- **GIVEN** ein Plan mit zwei Formen im Erdgeschoss und einer Form im Obergeschoss
- **WHEN** die Formen des Dachgeschosses abgefragt werden
- **THEN** ist die Liste des Dachgeschosses leer
- **AND** die Formen von Erdgeschoss und Obergeschoss sind unverändert vorhanden

#### Scenario: Unbekannte Etage
- **WHEN** ein Plan Formen unter einer Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Etagen ohne Kalibrierung
- **WHEN** ein Plan für das Erdgeschoss eine kalibrierte Vorlage und für das Obergeschoss eine Vorlage ohne Kalibrierung enthält
- **THEN** gilt der Plan als gültig
- **AND** das Obergeschoss gilt als nicht kalibriert und das Dachgeschoss hat keine Vorlage

#### Scenario: Kalibrierung einer unbekannten Etage
- **WHEN** ein Plan eine Vorlage samt Kalibrierung unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Aktive Etage fehlt
- **WHEN** ein Plan als aktive Etage eine Kennung nennt, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

### Requirement: Neuer leerer Plan
Das System SHALL einen neuen Plan mit Formatversion 10, dem Namen „Meine Planung“ und genau einer Etage „Erdgeschoss“ anlegen. Diese Etage MUST aktiv sein, keine Vorlage, eine leere Raumliste und eine leere Formenliste haben, und der Plan MUST die Werkseinstellungen haben. Erstellungs- und Änderungszeitpunkt MUST dem Zeitpunkt des Anlegens entsprechen.

#### Scenario: Leerer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** hat er die Formatversion 10 und den Namen „Meine Planung“
- **AND** er hat genau eine Etage „Erdgeschoss“, und sie ist aktiv
- **AND** das Erdgeschoss hat eine leere Raumliste, eine leere Formenliste und keine Vorlage
- **AND** der Plan hat die Werkseinstellungen, z. B. Wanddicke neuer Räume 15 cm

### Requirement: Gültige Kalibrierung
Eine Kalibrierung SHALL zwei Punkte in Pixeln des Vorlagenbilds, die reale Länge zwischen ihnen in cm, den Maßstab in Bildpixeln je cm und optional eine Ausrichtung „waagerecht“ oder „senkrecht“ enthalten. Die Koordinaten der Punkte MUST mindestens 0 px sein; reale Länge und Maßstab MUST größer als 0 sein.

#### Scenario: Gültige Kalibrierung
- **WHEN** eine Kalibrierung mit P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm und 0,9986 px/cm geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Mit Ausrichtung
- **WHEN** dieselbe Kalibrierung mit der Ausrichtung „waagerecht“ geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Maßstab 0
- **WHEN** eine Kalibrierung mit dem Maßstab 0 px/cm geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Unbekannte Ausrichtung
- **WHEN** eine Kalibrierung mit der Ausrichtung „schräg“ geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Kalibrierung setzen
Das System SHALL die Kalibrierung der Vorlage einer Etage setzen und dabei eine vorhandene Kalibrierung dieser Vorlage ersetzen. Bild, Sichtbarkeit und Deckkraft der Vorlage, Vorlagen anderer Etagen und alle Formen MUST unverändert bleiben. Eine ungültige Kalibrierung oder eine Etage ohne Vorlage MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Kalibrierung ersetzen
- **GIVEN** die Vorlagen von Erdgeschoss und Obergeschoss sind kalibriert, das Erdgeschoss mit 0,7480 px/cm
- **WHEN** für das Erdgeschoss eine Kalibrierung mit 0,9986 px/cm gesetzt wird
- **THEN** hat das Erdgeschoss den Maßstab 0,9986 px/cm
- **AND** die Kalibrierung des Obergeschosses und die Formen aller Etagen sind unverändert

#### Scenario: Ungültige Kalibrierung
- **WHEN** für das Erdgeschoss eine Kalibrierung mit der realen Länge 0 cm gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

#### Scenario: Etage ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** für den Keller eine Kalibrierung gesetzt werden soll
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
Das System SHALL den Änderungszeitpunkt des Plans bei jedem Hinzufügen, Ändern, Löschen oder Umordnen einer Form, beim Setzen, Ändern oder Entfernen einer Vorlage einschließlich ihrer Kalibrierung, Sichtbarkeit und Deckkraft und beim Anlegen, Umbenennen, Sortieren oder Löschen einer Etage auf den aktuellen Zeitpunkt setzen. Das Umschalten der aktiven Etage und abgelehnte Änderungen MUST den Änderungszeitpunkt nicht verändern.

#### Scenario: Form hinzugefügt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Form hinzugefügt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Kalibrierung gesetzt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Kalibrierung für das Erdgeschoss gesetzt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Vorlage ausgeblendet
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Vorlage des Erdgeschosses ausgeblendet wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage umbenannt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Etage „Neue Etage“ in „Keller“ umbenannt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

#### Scenario: Etage gewechselt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** der Nutzer ins Obergeschoss wechselt
- **THEN** bleibt der Änderungszeitpunkt 01.11.2026, 10:00 Uhr

### Requirement: Gültige Vorlage
Eine Vorlage SHALL enthalten: einen Verweis auf ihr Bild oder die Angabe „kein Bild“, Breite und Höhe des Bilds in Pixeln (ganze Zahlen größer als 0, oder beide unbekannt), eine Kalibrierung oder „nicht kalibriert“, die Angabe „Sichtbar“ und eine Deckkraft von 0,1 bis 1. Eine Vorlage mit Bild MUST bekannte Bildmaße haben.

#### Scenario: Vorlage ohne Bild
- **WHEN** eine Vorlage ohne Bild, mit unbekannten Bildmaßen, einer Kalibrierung mit 0,9986 px/cm, sichtbar und mit Deckkraft 1 geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Deckkraft zu gering
- **WHEN** eine Vorlage mit Deckkraft 0,05 geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Bild ohne Maße
- **WHEN** eine Vorlage mit Bild, aber unbekannten Bildmaßen geprüft wird
- **THEN** gilt sie als ungültig

### Requirement: Vorlage setzen und entfernen
Das System SHALL die Vorlage einer Etage setzen, ändern und entfernen können; Vorlagen anderer Etagen und alle Formen MUST unverändert bleiben. Eine ungültige Vorlage oder eine Etage, die nicht im Plan steht, MUST abgelehnt werden; der Plan bleibt dann unverändert.

#### Scenario: Vorlage entfernen
- **GIVEN** Erdgeschoss und Obergeschoss haben je eine Vorlage
- **WHEN** die Vorlage des Erdgeschosses entfernt wird
- **THEN** hat das Erdgeschoss keine Vorlage
- **AND** die Vorlage des Obergeschosses und die Formen aller Etagen sind unverändert

#### Scenario: Unbekannte Etage
- **WHEN** für die Kennung „keller“, die nicht im Plan steht, eine Vorlage gesetzt werden soll
- **THEN** wird sie abgelehnt und der Plan bleibt unverändert

### Requirement: Räume im Plan
Ein Plan SHALL ab Formatversion 4 je Etage eine geordnete Liste von Räumen enthalten (siehe `floor-rooms`); eine Etage ohne Räume hat eine leere Liste. Jeder Raum MUST genau einer Etage des Plans gehören, und Raum-IDs MUST im ganzen Plan eindeutig sein. Ein neuer leerer Plan SHALL für seine Etage eine leere Raumliste haben.

#### Scenario: Räume je Etage
- **GIVEN** ein Plan mit zwei Räumen im Erdgeschoss und keinem im Obergeschoss
- **WHEN** die Räume des Obergeschosses abgefragt werden
- **THEN** ist die Liste leer
- **AND** die beiden Räume des Erdgeschosses sind unverändert vorhanden

#### Scenario: Raum unter unbekannter Etage
- **WHEN** ein Plan einen Raum unter der Kennung „keller“ enthält, die nicht in seiner Etagenliste steht
- **THEN** gilt der Plan als ungültig

#### Scenario: Doppelte Raum-ID
- **WHEN** ein Plan im Erdgeschoss und im Obergeschoss je einen Raum mit derselben ID enthält
- **THEN** gilt der Plan als ungültig

### Requirement: Räume ändern
Das System SHALL einen gültigen Raum zu einer Etage hinzufügen und Name oder Eckpunkte eines Raums ändern, ohne seine ID zu verändern. Eine Änderung, nach der der Raum ungültig wäre, oder ein Raum mit bereits vergebener ID MUST abgelehnt werden; der Plan bleibt dann unverändert. Hinzufügen, Ändern, Verschieben und Löschen eines Raums SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Ungültige Änderung
- **GIVEN** ein Raum mit vier Eckpunkten
- **WHEN** seine Eckpunkte durch zwei Punkte ersetzt werden sollen
- **THEN** wird die Änderung abgelehnt und der Raum ist unverändert

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr ein Raum umbenannt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

### Requirement: Türen und Fenster im Plan
Ab Formatversion 5 SHALL jeder Raum eine Liste seiner Türen und Fenster enthalten (siehe `room-openings`); ein Raum ohne Öffnungen hat eine leere Liste. IDs von Öffnungen MUST im ganzen Plan eindeutig sein. Hinzufügen, Ändern, Verschieben und Löschen einer Öffnung SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Raum ohne Öffnungen
- **WHEN** ein Plan mit dem Raum „Flur“ und einer leeren Liste von Öffnungen geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Doppelte ID einer Öffnung
- **WHEN** ein Plan in „Flur“ und in „Bad“ je eine Tür mit derselben ID enthält
- **THEN** gilt der Plan als ungültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr eine Tür um 20 cm verschoben wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

### Requirement: Wanddicken im Plan
Ab Formatversion 6 SHALL jeder Raum je Kante eine Wanddicke in cm enthalten (siehe `floor-rooms`, „Wanddicke je Kante“). Das Ändern einer Wanddicke SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen; eine abgelehnte Änderung MUST den Plan unverändert lassen.

#### Scenario: Raum mit Wanddicken
- **WHEN** ein Plan mit dem Raum „Flur“ mit vier Kanten und den Wanddicken 36,5 cm, 11,5 cm, 11,5 cm und 15 cm geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr die Wanddicke einer Kante von 15 cm auf 24 cm geändert wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

### Requirement: Durchgänge im Plan
Ab Formatversion 7 SHALL eine Öffnung eines Raums auch die Art „Durchgang“ haben können (siehe `room-openings`). Für Durchgänge gelten dieselben Regeln wie für Fenster: kein Aufschlag, planweit eindeutige ID, Breite und Abstand passen auf die Kante.

#### Scenario: Raum mit Durchgang
- **WHEN** ein Plan mit dem Raum „Eltern“ geprüft wird, der auf einer 330 cm langen Kante einen Durchgang mit Breite 100 cm und Abstand 210 cm ohne Aufschlag hat
- **THEN** gilt er als gültig

### Requirement: Raumfarbe im Plan
Ab Formatversion 8 SHALL jeder Raum seine Raumfarbe enthalten, als `#RRGGBB` oder als leeren Wert für „Standard“ (siehe `floor-rooms`). Das Ändern der Raumfarbe SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen.

#### Scenario: Raum ohne Farbe
- **WHEN** ein Plan mit dem Raum „Flur“ ohne Raumfarbe geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr „Bad“ blau eingefärbt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

### Requirement: Einstellungen im Plan
Ab Formatversion 9 SHALL der Plan genau einen Satz gültiger Einstellungen enthalten (siehe `app-settings`). Eine Änderung der Einstellungen SHALL den Änderungszeitpunkt auf den aktuellen Zeitpunkt setzen; eine abgelehnte Änderung MUST den Plan unverändert lassen.

#### Scenario: Plan ohne Einstellungen
- **WHEN** ein Plan der Formatversion 9 ohne Einstellungen geprüft wird
- **THEN** gilt er als ungültig

#### Scenario: Änderungszeitpunkt
- **GIVEN** der Plan wurde zuletzt am 01.11.2026 um 10:00 Uhr geändert
- **WHEN** am 11.11.2026 um 18:30 Uhr der Fangschritt auf 2,5 cm gesetzt wird
- **THEN** ist der Änderungszeitpunkt 11.11.2026, 18:30 Uhr

### Requirement: Gemerkte Maße für Ganze Kante im Plan
Ab Formatversion 10 SHALL jede Öffnung gemerkte Maße für „Ganze Kante“ enthalten (siehe `room-openings`): einen Abstand von mindestens 0 cm und eine Breite größer als 0 cm, oder einen leeren Wert. Nur Durchgänge und Fenster MUST gemerkte Maße haben dürfen, Türen nicht. Ob die gemerkten Maße auf die Kante passen, MUST NOT geprüft werden; das geschieht erst beim Abhaken.

#### Scenario: Durchgang mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem ein Durchgang mit Breite 500 cm und Abstand 0 cm die gemerkten Maße Breite 100 cm und Abstand 200 cm hat
- **THEN** gilt er als gültig

#### Scenario: Fenster mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem ein Fenster mit Breite 500 cm und Abstand 0 cm die gemerkten Maße Breite 120 cm und Abstand 190 cm hat
- **THEN** gilt er als gültig

#### Scenario: Tür mit gemerkten Maßen
- **WHEN** ein Plan geprüft wird, in dem eine Tür die gemerkten Maße Breite 80 cm und Abstand 100 cm hat
- **THEN** gilt er als ungültig

#### Scenario: Öffnung ohne gemerkte Maße
- **WHEN** ein Plan mit einer Tür und einem Durchgang geprüft wird, die beide keine gemerkten Maße haben
- **THEN** gilt er als gültig
