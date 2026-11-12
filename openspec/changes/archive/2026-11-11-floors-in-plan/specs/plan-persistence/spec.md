# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Wiederherstellen beim Start
Das System SHALL beim Start einen gültigen, im Browser gespeicherten Plan vollständig wiederherstellen, einschließlich seiner Etagen in ihrer Reihenfolge, aller Formen jeder Etage, ihrer Reihenfolge, der Kalibrierung jeder Etage und der aktiven Etage. Ist kein Plan gespeichert, MUST das System mit einem neuen leeren Plan starten, ohne einen Hinweis anzuzeigen.

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
- **GIVEN** das Erdgeschoss ist im Plan mit 0,9986 px/cm kalibriert
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** zeigt die Statusleiste für das Erdgeschoss „Maßstab: 0,9986 px/cm“

#### Scenario: Erster Start
- **GIVEN** in diesem Browser ist kein Plan gespeichert
- **WHEN** die App geladen wird
- **THEN** startet sie mit einem leeren Plan mit der einzigen Etage „Erdgeschoss“
- **AND** es erscheint kein Hinweis

## REMOVED Requirements

### Requirement: Übernahme der bisher gespeicherten Kalibrierung
**Reason**: Kalibrierungen aus der Zeit vor dem Plan wurden beim ersten Start mit `plan-model` übernommen und ihr Schlüssel danach entfernt. Ein neuer leerer Plan hat nur noch eine Etage, sodass die alten Kennungen `eg`, `og` und `dg` dort nicht mehr passen.
**Migration**: Keine. Wer noch Daten unter dem alten Schlüssel hat, kalibriert die Etage neu. Der alte Schlüssel bleibt unangetastet im Browser liegen.
