## ADDED Requirements

### Requirement: Dateien der Version 9
Eine Datei der Formatversion 9 SHALL beim Umwandeln für jede Öffnung „keine gemerkten Maße“ bekommen. Alle übrigen Angaben einschließlich der Einstellungen MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne gemerkte Maße
- **GIVEN** „sicherung.json“ hat Version 9 mit dem Raum „Eltern“, der eine Tür und einen Durchgang über die ganze 330 cm lange Kante hat
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Eltern“ unverändert die Tür und den Durchgang mit Breite 330 cm
- **AND** beim Abhaken von „Ganze Kante“ wird der Durchgang 100 cm breit, mittig auf der Kante

### Requirement: Gemerkte Maße aus der Datei
Das System SHALL die gemerkten Maße jedes übernommenen Durchgangs und Fensters aus der Datei übernehmen. Fehlen sie, sind sie ungültig oder gehören sie zu einer Tür, SHALL die Öffnung ohne gemerkte Maße und ohne Hinweis übernommen werden; die Öffnung selbst MUST NOT deshalb verworfen werden.

#### Scenario: Gemerkte Maße beim Fenster
- **GIVEN** in der Datei nimmt ein Fenster in „Wohnen“ die ganze 500 cm lange Kante ein und hat die gemerkten Maße Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **AND** nach dem Abhaken von „Ganze Kante“ hat das Fenster die Breite 120 cm und den Abstand 190 cm

#### Scenario: Gemerkte Maße bei der Tür
- **GIVEN** in der Datei hat der Raum „Bad“ eine Tür mit Breite 80 cm und gemerkten Maßen
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **WHEN** der Nutzer bestätigt
- **THEN** hat „Bad“ die Tür mit Breite 80 cm und ohne gemerkte Maße

#### Scenario: Negative gemerkte Breite
- **GIVEN** in der Datei hat ein Durchgang über die ganze Kante die gemerkte Breite -10 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist der Durchgang vorhanden und hat keine gemerkten Maße
