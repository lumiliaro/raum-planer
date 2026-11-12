# Spec Delta

## ADDED Requirements

### Requirement: Räume aus der Datei
Das System SHALL gültige Räume der übernommenen Etagen in ihrer Reihenfolge übernehmen und im Dialog die Zahl der Räume insgesamt und je Etage nennen. Ungültige Räume und Räume unbekannter Etagen MUST NOT übernommen werden; der Dialog SHALL jeden einzeln mit Name, Etage bzw. Kennung und einem deutschen Grund auflisten. Kommt eine Raum-ID mehrfach vor, SHALL jeder weitere Raum eine neue ID bekommen und der Dialog die Zahl nennen.

#### Scenario: Räume werden übernommen
- **GIVEN** die Datei hat im Erdgeschoss 5 Räume und im Obergeschoss 3
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „8 Räume werden übernommen“ mit „Erdgeschoss 5 · Obergeschoss 3“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt das Erdgeschoss die 5 Räume mit unveränderten Namen und Maßen

#### Scenario: Überschneidender Raum
- **GIVEN** die Datei enthält im Erdgeschoss einen Raum „Abstellraum“, dessen Umriss sich überschneidet
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Abstellraum“ (Erdgeschoss) mit dem Grund „Umriss überschneidet sich“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“

#### Scenario: Raum unter unbekannter Etage
- **GIVEN** die Datei enthält unter der Kennung „kg“, die keine Etage der Datei ist, den Raum „Waschküche“
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog „Waschküche“ unter der unbekannten Etage „kg“ als nicht übernommen

### Requirement: Dateien der Version 3
Eine Datei der Formatversion 3 SHALL beim Umwandeln für jede ihrer Etagen eine leere Raumliste bekommen. Alle übrigen Angaben MUST unverändert bleiben.

#### Scenario: Sicherung ohne Räume
- **GIVEN** „sicherung.json“ hat Version 3 mit 14 Formen im Erdgeschoss
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat das Erdgeschoss seine 14 Formen und keine Räume
