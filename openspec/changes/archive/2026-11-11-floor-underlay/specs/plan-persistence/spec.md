# Spec Delta

## MODIFIED Requirements

### Requirement: Wiederherstellen beim Start
Das System SHALL beim Start einen gültigen, im Browser gespeicherten Plan vollständig wiederherstellen, einschließlich seiner Etagen in ihrer Reihenfolge, aller Formen jeder Etage, ihrer Reihenfolge, der Vorlage jeder Etage samt Kalibrierung, Sichtbarkeit und Deckkraft und der aktiven Etage. Die Vorlagenbilder kommen aus dem Bildspeicher des Browsers (siehe `floor-underlay`). Ist kein Plan gespeichert, MUST das System mit einem neuen leeren Plan starten, ohne einen Hinweis anzuzeigen.

#### Scenario: Neuladen
- **GIVEN** der Plan enthält im Obergeschoss ein Bett mit Breite 180 cm und Tiefe 200 cm, und das Obergeschoss ist aktiv
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** enthält der Plan wieder dieses Bett mit Breite 180 cm und Tiefe 200 cm
- **AND** das Obergeschoss ist aktiv

#### Scenario: Selbst angelegte Etage nach dem Neuladen
- **GIVEN** der Nutzer hat eine Etage „Keller“ angelegt und an die erste Stelle verschoben
- **WHEN** er die Seite neu lädt
- **THEN** steht „Keller“ an erster Stelle im Umschalter

#### Scenario: Kalibrierung nach dem Neuladen
- **GIVEN** die Vorlage des Erdgeschosses ist im Plan mit 0,9986 px/cm kalibriert
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** zeigt die Statusleiste für das Erdgeschoss „Maßstab: 0,9986 px/cm“

#### Scenario: Ausgeblendete Vorlage nach dem Neuladen
- **GIVEN** die Vorlage des Erdgeschosses ist ausgeblendet und hat die Deckkraft 40 %
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist die Vorlage weiterhin ausgeblendet und hat die Deckkraft 40 %

#### Scenario: Erster Start
- **GIVEN** in diesem Browser ist kein Plan gespeichert
- **WHEN** die App geladen wird
- **THEN** startet sie mit einem leeren Plan mit der einzigen Etage „Erdgeschoss“
- **AND** es erscheint kein Hinweis

### Requirement: Speicherstatus
Die Statusleiste SHALL rechts den Speicherstatus anzeigen: „Lokal gespeichert“, solange der zuletzt versuchte Speichervorgang des Plans gelungen ist oder seit dem Start nichts zu speichern war und kein Vorlagenbild der Sitzung ungespeichert ist; „Nicht gespeichert“ in Warnfarbe, wenn das Speichern des Plans gescheitert ist, in dieser Sitzung ausgesetzt ist oder ein Vorlagenbild nicht gespeichert werden konnte. Der Warnzustand MUST einen deutschen Tooltip mit dem Grund haben.

#### Scenario: Nach erfolgreichem Speichern
- **WHEN** eine Änderung erfolgreich gespeichert wurde
- **THEN** zeigt die Statusleiste rechts „Lokal gespeichert“

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
