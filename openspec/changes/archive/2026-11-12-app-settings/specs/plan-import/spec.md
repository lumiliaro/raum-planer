## ADDED Requirements

### Requirement: Einstellungen aus der Datei
Das System SHALL die Einstellungen aus der Datei übernehmen; nach dem Bestätigen ersetzen sie die bisherigen Einstellungen. Fehlt ein Einzelwert oder ist er ungültig, SHALL dafür die Werkseinstellung gelten, und der Dialog SHALL jeden solchen Wert mit seinem Namen und dem Hinweis „ungültig, Werkseinstellung verwendet“ auflisten. Fehlen die Einstellungen ganz, gelten ohne Hinweis die Werkseinstellungen.

#### Scenario: Einstellungen werden übernommen
- **GIVEN** in der App ist der Fangschritt 5 cm, in der Datei 2,5 cm und die Wanddicke neuer Räume 11,5 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist der Fangschritt 2,5 cm und die Wanddicke neuer Räume 11,5 cm

#### Scenario: Ungültiger Rasterabstand
- **GIVEN** in der Datei ist der Rasterabstand 0 cm, alle anderen Einstellungen sind gültig
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Einstellung „Rasterabstand“: ungültig, Werkseinstellung verwendet“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** ist der Rasterabstand 100 cm und die übrigen Einstellungen kommen aus der Datei

### Requirement: Dateien der Version 8
Eine Datei der Formatversion 8 SHALL beim Umwandeln die Werkseinstellungen bekommen. Alle übrigen Angaben MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Einstellungen
- **GIVEN** „sicherung.json“ hat Version 8 mit eingefärbten Räumen
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat der Plan die Werkseinstellungen und die Räume haben unverändert ihre Farben
