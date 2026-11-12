## MODIFIED Requirements

### Requirement: PDF wird erstellt
Während des Erstellens SHALL die Schaltfläche „PDF erstellen“ gesperrt sein und „Wird erstellt …“ mit einem Ladesymbol zeigen; `Esc` und „Abbrechen“ MUST dann nichts bewirken. Schlägt das Erstellen fehl, MUST der Dialog offen bleiben mit dem Hinweis „PDF konnte nicht erstellt werden“. Kann die PDF-Funktion nicht nachgeladen werden (z. B. weil die App inzwischen neu ausgeliefert wurde), MUST der Dialog offen bleiben mit dem Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“. In beiden Fehlerfällen MUST nichts heruntergeladen werden, und eine Änderung an den Einstellungen des Dialogs MUST den Hinweis entfernen.

#### Scenario: Während des Erstellens
- **GIVEN** der Nutzer hat „PDF erstellen“ angeklickt und die Datei wird noch erstellt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** bleibt der Dialog offen und die Schaltfläche zeigt „Wird erstellt …“ mit Ladesymbol

#### Scenario: Erstellen schlägt fehl
- **GIVEN** die PDF-Funktion ist geladen und beim Erstellen des PDFs tritt ein Fehler auf
- **WHEN** das Erstellen abbricht
- **THEN** bleibt der Dialog offen mit dem Hinweis „PDF konnte nicht erstellt werden“ und es wird nichts heruntergeladen

#### Scenario: PDF-Funktion kann nicht geladen werden
- **GIVEN** die App wurde in einer älteren Version geöffnet und die nachzuladende PDF-Funktion ist nicht mehr abrufbar
- **WHEN** der Nutzer „PDF erstellen“ anklickt
- **THEN** bleibt der Dialog offen mit dem Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“, die Schaltfläche „PDF erstellen“ ist wieder bedienbar und es wird nichts heruntergeladen

#### Scenario: Hinweis verschwindet bei Änderung
- **GIVEN** der Dialog zeigt den Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“
- **WHEN** der Nutzer den Maßstab von 1:100 auf 1:50 ändert
- **THEN** ist der Hinweis verschwunden
