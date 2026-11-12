## ADDED Requirements

### Requirement: Dateien der Version 6
Eine Datei der Formatversion 6 SHALL beim Umwandeln unverändert übernommen werden: Räume, Wanddicken, Öffnungen, Formen, Etagen und Vorlagen MUST gleich bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Durchgänge
- **GIVEN** „sicherung.json“ hat Version 6 mit dem Raum „Wohnen“, einer Tür und einem Fenster
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Wohnen“ unverändert seine Ecken, Wanddicken, die Tür und das Fenster

## MODIFIED Requirements

### Requirement: Türen und Fenster aus der Datei
Das System SHALL die gültigen Öffnungen jedes übernommenen Raums aus der Datei übernehmen. Ungültige Öffnungen MUST NOT übernommen werden; der Raum selbst wird trotzdem übernommen. Der Dialog SHALL jede ungültige Öffnung einzeln mit Art, Raum, Etage und einem deutschen Grund auflisten. Fehlt die Liste der Öffnungen eines Raums, SHALL er ohne Hinweis keine Öffnungen haben.

#### Scenario: Fenster passt nicht
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss eine 180 cm lange Kante mit einem Fenster der Breite 120 cm und dem Abstand 100 cm
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Fenster in „Bad“ (Obergeschoss): passt nicht auf die Kante“
- **WHEN** der Nutzer bestätigt
- **THEN** gibt es den Raum „Bad“ ohne dieses Fenster

#### Scenario: Tür ohne Aufschlag
- **GIVEN** in der Datei hat der Raum „Flur“ im Erdgeschoss eine Tür ohne Angabe zum Aufschlag
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Tür in „Flur“ (Erdgeschoss): Aufschlag fehlt“
- **AND** nach dem Bestätigen hat „Flur“ diese Tür nicht

#### Scenario: Unbekannte Kante
- **GIVEN** in der Datei hat ein Raum „Flur“ mit 4 Ecken eine Tür auf der achten Kante
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Tür in „Flur“ (Erdgeschoss): Kante unbekannt“

#### Scenario: Durchgang mit Aufschlag
- **GIVEN** in der Datei hat der Raum „Eltern“ im Obergeschoss einen Durchgang mit Aufschlag nach innen
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Durchgang in „Eltern“ (Obergeschoss): Aufschlag ungültig“
- **AND** nach dem Bestätigen hat „Eltern“ diesen Durchgang nicht

### Requirement: Türen und Fenster im Prüfergebnis
Der Dialog „Ergebnis der Prüfung“ SHALL die Zahl der übernommenen Türen und Fenster insgesamt nennen, sofern die Datei Räume enthält. Enthält die Datei gültige Durchgänge, SHALL der Dialog auch deren Zahl nennen.

#### Scenario: Zählung
- **GIVEN** die Datei enthält Räume mit zusammen 7 gültigen Türen und 4 gültigen Fenstern
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „7 Türen und 4 Fenster werden übernommen“

#### Scenario: Zählung mit Durchgängen
- **GIVEN** die Datei enthält Räume mit zusammen 7 gültigen Türen, 4 gültigen Fenstern und 1 gültigen Durchgang
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „7 Türen, 4 Fenster und 1 Durchgang werden übernommen“
