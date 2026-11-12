## ADDED Requirements

### Requirement: Raumfarbe aus der Datei
Das System SHALL die Raumfarbe jedes übernommenen Raums aus der Datei übernehmen. Fehlt sie, SHALL der Raum ohne Hinweis keine Raumfarbe haben. Ist sie ungültig, SHALL der Raum ohne Raumfarbe übernommen werden, und der Dialog SHALL ihn mit Name, Etage und dem Hinweis „Farbe ungültig, Standard verwendet“ auflisten.

#### Scenario: Farbe als Wort
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss die Raumfarbe „blau“
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „„Bad“ (Obergeschoss): Farbe ungültig, Standard verwendet“
- **WHEN** der Nutzer bestätigt
- **THEN** gibt es „Bad“ mit unveränderten Ecken und ohne Raumfarbe

### Requirement: Dateien der Version 7
Eine Datei der Formatversion 7 SHALL beim Umwandeln für jeden Raum „keine Raumfarbe“ bekommen. Alle übrigen Angaben MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Farben
- **GIVEN** „sicherung.json“ hat Version 7 mit den Räumen „Wohnen“ und „Eltern“, „Eltern“ hat einen Durchgang
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** sind beide Räume halbtransparent weiß, „Eltern“ hat weiter den Durchgang
