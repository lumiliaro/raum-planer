## ADDED Requirements

### Requirement: Wanddicken aus der Datei
Das System SHALL die Wanddicken jedes übernommenen Raums aus der Datei übernehmen. Fehlt die Wanddicke einer Kante oder ist sie ungültig (keine Zahl, nicht größer als 0 cm oder über 100 cm), SHALL diese Kante 15 cm bekommen. Überzählige Werte MUST verworfen werden. Der Raum MUST trotzdem übernommen werden, und der Dialog SHALL ihn mit Name, Etage und dem Hinweis „Wanddicke ungültig, 15 cm verwendet“ auflisten.

#### Scenario: Wand zu dick
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss vier Kanten mit den Wanddicken 15 cm, 15 cm, 250 cm und 15 cm
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „„Bad“ (Obergeschoss): Wanddicke ungültig, 15 cm verwendet“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** hat „Bad“ an allen vier Kanten 15 cm Wanddicke und unveränderte Eckpunkte

#### Scenario: Zu wenige Werte
- **GIVEN** in der Datei hat der Raum „Flur“ sechs Kanten, aber nur vier Wanddicken mit je 24 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** hat „Flur“ an den Kanten 1 bis 4 die Wanddicke 24 cm und an den Kanten 5 und 6 15 cm

### Requirement: Dateien der Version 5
Eine Datei der Formatversion 5 SHALL beim Umwandeln für jede Kante jedes Raums die Wanddicke 15 cm bekommen. Räume, Öffnungen, Formen, Etagen und Vorlagen MUST dabei unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Wanddicken
- **GIVEN** „sicherung.json“ hat Version 5 und im Erdgeschoss den Raum „Wohnen“ mit vier Ecken und einer Tür
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Wohnen“ unveränderte Ecken, die Tür und an jeder Kante 15 cm Wanddicke
