# Spec Delta

## MODIFIED Requirements

### Requirement: Speicherstatus
Die Statusleiste SHALL rechts den Speicherstatus anzeigen: „Lokal gespeichert“, solange der zuletzt versuchte Speichervorgang des Plans gelungen ist oder seit dem Start nichts zu speichern war und kein Vorlagenbild der Sitzung ungespeichert ist; „Nicht gespeichert“ in Warnfarbe, wenn das Speichern des Plans gescheitert ist, in dieser Sitzung ausgesetzt ist oder ein Vorlagenbild nicht gespeichert werden konnte. Der Warnzustand MUST einen deutschen Tooltip mit dem Grund haben. „Lokal gespeichert“ MUST den Tooltip „Alle Daten bleiben in diesem Browser“ haben. Der Speicherstatus SHALL in beiden Zuständen anklickbar sein und den Dialog „Hilfe“ mit dem Reiter „Datenschutz“ öffnen (siehe app-help).

#### Scenario: Nach erfolgreichem Speichern
- **WHEN** eine Änderung erfolgreich gespeichert wurde
- **THEN** zeigt die Statusleiste rechts „Lokal gespeichert“
- **AND** der Tooltip lautet „Alle Daten bleiben in diesem Browser“

#### Scenario: Speicher voll
- **GIVEN** der Browser-Speicher lässt kein Schreiben mehr zu
- **WHEN** eine Änderung gespeichert werden soll
- **THEN** zeigt die Statusleiste „Nicht gespeichert“ in Warnfarbe
- **AND** die App funktioniert ohne Fehlermeldung weiter
- **AND** sobald ein späterer Speicherversuch gelingt, zeigt sie wieder „Lokal gespeichert“

#### Scenario: Vorlagenbild nicht gespeichert
- **GIVEN** der Plan wird gespeichert, aber ein hochgeladenes Vorlagenbild konnte nicht gespeichert werden
- **THEN** zeigt die Statusleiste „Nicht gespeichert“ in Warnfarbe
- **AND** der Tooltip sagt, dass Vorlagenbilder in diesem Browser nicht gespeichert werden können

#### Scenario: Speicherstatus anklicken
- **GIVEN** die Statusleiste zeigt „Lokal gespeichert“ oder „Nicht gespeichert“
- **WHEN** der Nutzer auf den Speicherstatus klickt
- **THEN** ist der Dialog „Hilfe“ offen und zeigt den Reiter „Datenschutz“
