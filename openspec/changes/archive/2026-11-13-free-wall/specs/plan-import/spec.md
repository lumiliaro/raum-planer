# Spec Delta

## ADDED Requirements

### Requirement: Wände aus der Datei
Das System SHALL gültige Wände der übernommenen Etagen in ihrer Reihenfolge übernehmen und im Dialog die Zahl der Wände insgesamt nennen, sofern es welche gibt. Ungültige Wände und Wände unbekannter Etagen MUST NOT übernommen werden; der Dialog SHALL ihre Zahl je Etage bzw. Kennung mit einem deutschen Grund nennen. Kommt eine Wand-ID mehrfach vor, SHALL jede weitere Wand eine neue ID bekommen und der Dialog die Zahl nennen.

#### Scenario: Wände werden übernommen
- **GIVEN** die Datei hat im Erdgeschoss 3 Wände und im Obergeschoss 1
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „4 Wände werden übernommen“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt das Erdgeschoss die 3 Wände mit unveränderten Punkten und Dicken

#### Scenario: Wand ohne Länge
- **GIVEN** die Datei enthält im Erdgeschoss eine Wand, deren Start- und Endpunkt gleich sind
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog „1 Wand“ (Erdgeschoss) mit dem Grund „Wand hat keine Länge“ als nicht übernommen
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“

#### Scenario: Wand unter unbekannter Etage
- **GIVEN** die Datei enthält unter der Kennung „kg“, die keine Etage der Datei ist, 2 Wände
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog 2 Wände unter der unbekannten Etage „kg“ als nicht übernommen

#### Scenario: Fehlende Wandliste
- **GIVEN** eine Datei der Version 12 hat für das Obergeschoss keine Wandliste
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat das Obergeschoss ohne Hinweis keine Wände

### Requirement: Dateien der Version 11
Eine Datei der Formatversion 11 SHALL beim Umwandeln für jede Etage eine leere Wandliste bekommen. Alle übrigen Angaben einschließlich Räume, Öffnungen, Sperren und Einstellungen MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Wände
- **GIVEN** „sicherung.json“ hat Version 11 mit dem gesperrten Raum „Wohnen“ im Erdgeschoss und einem Obergeschoss
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** haben Erdgeschoss und Obergeschoss keine Wände
- **AND** „Wohnen“ ist unverändert vorhanden und gesperrt

#### Scenario: Gespeicherter Plan der Version 11
- **GIVEN** im Browser ist ein Plan der Version 11 mit dem Raum „Flur“ gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Flur“ unverändert vorhanden und die Etage hat keine Wände
- **AND** es erscheint keine Hinweisleiste
