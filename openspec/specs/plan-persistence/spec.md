# plan-persistence Specification

## Purpose

Sorgt dafür, dass der aktuelle Plan ohne Zutun des Nutzers im Browser gespeichert und beim nächsten Start wiederhergestellt wird, dass unlesbare Daten nie stillschweigend verloren gehen und dass der Nutzer jederzeit sieht, ob sein Stand gesichert ist.

## Requirements

### Requirement: Automatisches Speichern
Das System SHALL den Plan nach jeder Änderung (auch nach dem Wechsel der aktiven Etage) automatisch im Browser-Speicher ablegen, spätestens 1 Sekunde nach der letzten Änderung; schnell aufeinanderfolgende Änderungen dürfen gemeinsam gespeichert werden. Beim Schließen oder Neuladen der Seite MUST eine noch ausstehende Speicherung sofort erfolgen.

#### Scenario: Speichern nach Änderung
- **GIVEN** die App ist geöffnet
- **WHEN** im Erdgeschoss ein Rechteck mit Breite 200 cm hinzugefügt wird
- **THEN** ist der Plan mit diesem Rechteck spätestens 1 Sekunde später im Browser-Speicher abgelegt

#### Scenario: Seite wird direkt nach einer Änderung geschlossen
- **GIVEN** eine Änderung wurde vor weniger als 1 Sekunde gemacht und ist noch nicht gespeichert
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist die Änderung nach dem Neuladen vorhanden

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

### Requirement: Unlesbarer gespeicherter Plan
Ist der gespeicherte Plan beim Start unlesbar, ungültig oder hat er eine neuere Formatversion als die App, SHALL das System die gespeicherten Rohdaten unverändert in einer Sicherung im Browser ablegen, mit einem neuen leeren Plan starten und eine Hinweisleiste unter der Kopfleiste anzeigen. Die Hinweisleiste MUST bis zum Klick auf „Schließen“ sichtbar bleiben.

#### Scenario: Beschädigte Daten
- **GIVEN** im Browser-Speicher steht unter dem Plan-Schlüssel ein Text, der kein gültiger Plan ist
- **WHEN** die App geladen wird
- **THEN** ist dieser Text unverändert in der Sicherung abgelegt
- **AND** die App zeigt einen leeren Plan im Erdgeschoss
- **AND** unter der Kopfleiste steht ein Hinweis, dass der gespeicherte Plan nicht gelesen werden konnte und die alten Daten gesichert wurden

#### Scenario: Andere Formatversion
- **GIVEN** die App verwendet Formatversion 2 und der gespeicherte Plan hat die Formatversion 3
- **WHEN** die App geladen wird
- **THEN** wird er wie ein unlesbarer Plan gesichert und die Hinweisleiste erscheint

#### Scenario: Hinweis schließen
- **GIVEN** die Hinweisleiste ist sichtbar
- **WHEN** der Nutzer auf „Schließen“ klickt
- **THEN** verschwindet die Hinweisleiste
- **AND** sie erscheint beim nächsten Start nicht erneut, solange der dann gespeicherte Plan lesbar ist

### Requirement: Sicherung fehlgeschlagen
Kann die Sicherung eines unlesbaren Plans nicht angelegt werden, MUST das System die ursprünglichen Daten im Browser-Speicher unangetastet lassen und für diese Sitzung nicht speichern. Die Hinweisleiste MUST dann darauf hinweisen, dass Änderungen in dieser Sitzung nicht gespeichert werden.

#### Scenario: Speicher voll beim Sichern
- **GIVEN** der gespeicherte Plan ist unlesbar und der Browser-Speicher lässt keinen weiteren Eintrag zu
- **WHEN** die App geladen wird und der Nutzer danach ein Rechteck mit Breite 100 cm hinzufügt
- **THEN** stehen im Browser-Speicher weiterhin die ursprünglichen Daten
- **AND** die Hinweisleiste sagt, dass Änderungen in dieser Sitzung nicht gespeichert werden

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

### Requirement: Browser-Speicher nicht verfügbar
Ist der Browser-Speicher blockiert oder nicht vorhanden, SHALL die App mit einem leeren Plan starten und vollständig bedienbar bleiben; die Statusleiste MUST dann „Nicht gespeichert“ zeigen, sobald etwas zu speichern ist.

#### Scenario: Blockierter Speicher
- **GIVEN** der Browser blockiert jeden Zugriff auf den lokalen Speicher
- **WHEN** die App geladen wird
- **THEN** zeigt sie einen leeren Plan im Erdgeschoss ohne Fehlermeldung
- **AND** nach dem Wechsel ins Obergeschoss zeigt die Statusleiste „Nicht gespeichert“

### Requirement: Plan getrennt von Ansichtseinstellungen
Das System MUST den Plan unter einem eigenen Schlüssel getrennt von Ansichts- und Bedieneinstellungen (z. B. Panel offen/zu, Zoom) speichern. Ansichtseinstellungen MUST NOT Teil des Plans sein.

#### Scenario: Panel-Zustand nicht im Plan
- **GIVEN** der Nutzer hat das Eigenschaften-Panel ausgeblendet
- **WHEN** der Plan gespeichert wird
- **THEN** enthält der gespeicherte Plan keine Angabe zum Panel-Zustand oder zum Zoom

### Requirement: Gespeicherter Plan aus älterer Version
Hat der gespeicherte Plan beim Start eine ältere Formatversion als die App, SHALL das System ihn Version für Version wie beim Import umwandeln und den umgewandelten Plan ohne Hinweis verwenden. Die ursprünglichen Rohdaten MUST vor dem ersten Speichern des umgewandelten Plans unverändert unter einem eigenen Schlüssel im Browser abgelegt werden. Scheitert die Umwandlung oder ist das Ergebnis ungültig, MUST der Plan wie ein unlesbarer Plan behandelt werden.

#### Scenario: Plan der Version 1
- **GIVEN** im Browser ist ein Plan der Version 1 gespeichert, mit 14 Formen im Erdgeschoss und einer Kalibrierung des Erdgeschosses mit 0,9986 px/cm
- **WHEN** die App geladen wird
- **THEN** zeigt der Umschalter „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“
- **AND** das Erdgeschoss hat seine 14 Formen an unveränderter Stelle und den Maßstab 0,9986 px/cm
- **AND** es erscheint keine Hinweisleiste
- **AND** die ursprünglichen Daten der Version 1 liegen unverändert unter dem eigenen Schlüssel

#### Scenario: Umwandlung scheitert
- **GIVEN** im Browser ist ein Plan der Version 1 gespeichert, dessen Umwandlung scheitert
- **WHEN** die App geladen wird
- **THEN** werden die Daten gesichert und die Hinweisleiste für einen unlesbaren Plan erscheint
