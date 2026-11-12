# Spec Delta

## Purpose

Legt fest, wie der aktuelle Plan als Datei aus der App herauskommt, damit er gesichert, auf einen anderen Rechner gebracht und später wieder importiert werden kann.

## ADDED Requirements

### Requirement: Export-Dialog
Die Schaltfläche „Exportieren“ SHALL einen Dialog „Plan exportieren“ mit dem Feld „Name des Plans“ öffnen. Das Feld MUST mit dem aktuellen Plannamen vorausgefüllt sein; heißt der Plan noch „Meine Planung“, MUST es leer sein. Unter dem Feld SHALL der entstehende Dateiname stehen. „Abbrechen“ und `Esc` MUST den Dialog schließen, ohne den Plan zu ändern oder etwas herunterzuladen.

#### Scenario: Späterer Export
- **GIVEN** der Plan heißt „Umzug“
- **WHEN** der Nutzer „Exportieren“ anklickt
- **THEN** ist das Feld „Name des Plans“ mit „Umzug“ vorausgefüllt

#### Scenario: Abbrechen
- **GIVEN** der Dialog „Plan exportieren“ ist offen und im Feld steht „Neu“
- **WHEN** der Nutzer `Esc` drückt
- **THEN** schließt sich der Dialog, nichts wird heruntergeladen und der Planname ist unverändert

### Requirement: Plan exportieren
„Exportieren“ im Dialog oder Enter im Feld SHALL den eingetragenen Namen ohne Leerzeichen am Rand als Plannamen übernehmen, den Dialog schließen und den Plan sofort als JSON-Datei herunterladen, ohne Netzwerkaufruf. Außer dem Namen MUST der Plan unverändert bleiben. Ist der Name leer, MUST der Export abgelehnt werden und der Dialog einen Hinweis zeigen.

#### Scenario: Erster Export
- **GIVEN** der Plan heißt „Meine Planung“
- **WHEN** der Nutzer am 11.11.2026 „Exportieren“ anklickt
- **THEN** öffnet sich der Dialog „Plan exportieren“ mit leerem Feld „Name des Plans“
- **WHEN** der Nutzer „Umzug“ einträgt und Enter drückt
- **THEN** schließt sich der Dialog und der Browser lädt `2026-11-11-umzug_1.json` herunter
- **AND** der Plan heißt „Umzug“, auch nach dem Neuladen der Seite

#### Scenario: Leerer Name
- **GIVEN** der Dialog „Plan exportieren“ ist offen
- **WHEN** der Nutzer das Feld leert bzw. nur Leerzeichen einträgt und „Exportieren“ anklickt
- **THEN** bleibt der Dialog offen mit dem Hinweis „Bitte einen Namen eingeben“
- **AND** nichts wird heruntergeladen

#### Scenario: Export mit Formen
- **GIVEN** das Erdgeschoss enthält ein Rechteck mit Breite 220 cm und Tiefe 95 cm, das Obergeschoss ein Bett mit Breite 180 cm und Tiefe 200 cm
- **WHEN** der Nutzer den Plan exportiert
- **THEN** lädt der Browser eine JSON-Datei herunter
- **AND** die Datei enthält beide Formen mit ihren Maßen in cm unter ihrer jeweiligen Etage

#### Scenario: Export eines leeren Plans
- **GIVEN** der Plan enthält keine Formen
- **WHEN** der Nutzer den Plan exportiert
- **THEN** wird eine gültige Plan-Datei mit drei leeren Formenlisten heruntergeladen

### Requirement: Inhalt der Exportdatei
Die Exportdatei SHALL genau den Plan im aktuellen Datenformat enthalten: Formatversion, Name, Zeitpunkte, aktive Etage, die Kalibrierung je kalibrierter Etage und die Formen je Etage in ihrer Zeichenreihenfolge. Sie MUST NOT Grundrissbilder, Zoom, Ansichtsposition, Bedieneinstellungen oder den Export-Zähler enthalten. Der Inhalt MUST eingerückt und damit in einem Texteditor lesbar sein.

#### Scenario: Keine Ansichtseinstellungen
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet und der Zoom steht auf 200 %
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei weder den Panel-Zustand noch den Zoom
- **AND** sie enthält keine Bilddaten

#### Scenario: Name in der Datei
- **WHEN** der Nutzer den Plan unter dem Namen „Umzug“ exportiert
- **THEN** steht in der Datei der Name „Umzug“

#### Scenario: Formatversion in der Datei
- **WHEN** der Plan exportiert wird
- **THEN** steht in der Datei die aktuelle Formatversion 1

#### Scenario: Kalibrierung in der Datei
- **GIVEN** das Erdgeschoss ist mit 0,9986 px/cm kalibriert (P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm), das Obergeschoss ist nicht kalibriert
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei für das Erdgeschoss beide Punkte, die reale Länge 1 000 cm und den Maßstab 0,9986 px/cm
- **AND** für das Obergeschoss enthält sie keine Kalibrierung

### Requirement: Dateiname
Der Dateiname SHALL die Form `YYYY-MM-DD-<name>_<n>.json` haben. `YYYY-MM-DD` ist das lokale Datum des Exports, `<n>` die Version des Exports. `<name>` ist der Planname in vereinfachter Schreibweise: Kleinbuchstaben, Umlaute und ß ausgeschrieben, andere Zeichen als Buchstaben und Ziffern durch Bindestriche ersetzt. Ergibt der Name keine Buchstaben oder Ziffern, MUST „raumplaner“ verwendet werden.

#### Scenario: Erster Export des Tages
- **GIVEN** der Plan heißt „Meine Planung“ und wurde heute noch nicht exportiert
- **WHEN** er am 11.11.2026 unter diesem Namen exportiert wird
- **THEN** heißt die Datei `2026-11-11-meine-planung_1.json`

#### Scenario: Umlaute
- **GIVEN** der Plan heißt „Möbel Größe/Übersicht“
- **WHEN** er am 03.12.2026 zum ersten Mal an diesem Tag exportiert wird
- **THEN** heißt die Datei `2026-12-03-moebel-groesse-uebersicht_1.json`

### Requirement: Version des Exports
Die Version `<n>` SHALL je Tag und `<name>` mit 1 beginnen und mit jedem Export um 1 steigen. Der Zähler MUST im Browser gespeichert werden, nicht im Plan und nicht in der Datei. Ist der Browser-Speicher nicht verfügbar, SHALL der Zähler bis zum Neuladen der Seite weiterzählen.

#### Scenario: Weitere Exporte am selben Tag
- **GIVEN** „Umzug“ wurde am 11.11.2026 schon zweimal exportiert
- **WHEN** er am selben Tag erneut exportiert wird
- **THEN** heißt die Datei `2026-11-11-umzug_3.json`
- **AND** nach dem Neuladen der Seite heißt der nächste Export `2026-11-11-umzug_4.json`

#### Scenario: Neuer Tag
- **GIVEN** „Umzug“ wurde am 11.11.2026 dreimal exportiert
- **WHEN** er am 12.11.2026 exportiert wird
- **THEN** heißt die Datei `2026-11-12-umzug_1.json`

#### Scenario: Anderer Name am selben Tag
- **GIVEN** „Umzug“ wurde am 11.11.2026 zweimal exportiert
- **WHEN** der Plan am selben Tag unter dem Namen „Umzug neu“ exportiert wird
- **THEN** heißt die Datei `2026-11-11-umzug-neu_1.json`
