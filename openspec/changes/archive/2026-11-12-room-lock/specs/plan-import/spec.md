## ADDED Requirements

### Requirement: Dateien der Version 10
Eine Datei der Formatversion 10 SHALL beim Umwandeln für jeden Raum „nicht gesperrt“ bekommen. Alle übrigen Angaben einschließlich Einstellungen, Öffnungen und gemerkter Maße MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Raum-Sperren
- **GIVEN** „sicherung.json“ hat Version 10 mit den Räumen „Wohnen“ (mit Tür) und „Bad“ (rot eingefärbt)
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** sind „Wohnen“ und „Bad“ nicht gesperrt
- **AND** „Wohnen“ hat unverändert seine Tür und „Bad“ ist weiter rot

#### Scenario: Gespeicherter Plan der Version 10
- **GIVEN** im Browser ist ein Plan der Version 10 mit dem Raum „Flur“ gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Flur“ unverändert vorhanden und nicht gesperrt
- **AND** es erscheint keine Hinweisleiste

### Requirement: Sperre eines Raums aus der Datei
Das System SHALL die Sperre jedes übernommenen Raums aus der Datei übernehmen. Fehlt die Angabe oder ist sie ungültig, SHALL der Raum ohne Hinweis als nicht gesperrt übernommen werden; der Raum selbst MUST NOT deshalb verworfen werden.

#### Scenario: Gesperrter Raum in der Datei
- **GIVEN** in der Datei ist der Raum „Wohnen“ gesperrt
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist „Wohnen“ gesperrt

#### Scenario: Ungültige Sperrangabe
- **GIVEN** in der Datei der Version 11 hat der Raum „Bad“ als Sperrangabe den Text „ja“
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **WHEN** der Nutzer bestätigt
- **THEN** ist „Bad“ mit unveränderten Ecken vorhanden und nicht gesperrt
