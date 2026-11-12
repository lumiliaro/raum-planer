# Spec Delta

## ADDED Requirements

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

### Requirement: Türen und Fenster im Prüfergebnis
Der Dialog „Ergebnis der Prüfung“ SHALL die Zahl der übernommenen Türen und Fenster insgesamt nennen, sofern die Datei Räume enthält.

#### Scenario: Zählung
- **GIVEN** die Datei enthält Räume mit zusammen 7 gültigen Türen und 4 gültigen Fenstern
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „7 Türen und 4 Fenster werden übernommen“

### Requirement: Doppelte IDs von Öffnungen
Kommt die ID einer Öffnung in der Datei mehrfach vor, SHALL die zuerst gefundene Öffnung ihre ID behalten und jede weitere eine neue, eindeutige ID bekommen und übernommen werden. Der Dialog MUST die Zahl dieser Öffnungen nennen.

#### Scenario: Kopiertes Fenster
- **GIVEN** zwei Fenster in der Datei haben dieselbe ID
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** meldet der Dialog vorher, dass 1 Tür oder Fenster eine neue ID bekommt
- **AND** danach haben beide Fenster verschiedene IDs

### Requirement: Dateien der Version 4
Eine Datei der Formatversion 4 SHALL beim Umwandeln für jeden Raum eine leere Liste von Öffnungen bekommen. Räume, Formen, Etagen und Vorlagen MUST dabei unverändert bleiben.

#### Scenario: Pläne ohne Öffnungen
- **GIVEN** „raeume.json“ hat Version 4 und im Erdgeschoss die Räume „Wohnen“ und „Flur“
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** gibt es beide Räume mit unveränderten Ecken und ohne Türen und Fenster
