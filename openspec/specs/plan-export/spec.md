# plan-export Specification

## Purpose

Legt fest, wie der aktuelle Plan als Datei aus der App herauskommt, damit er gesichert, auf einen anderen Rechner gebracht und später wieder importiert werden kann.

## Requirements

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
Die Exportdatei SHALL den Plan im aktuellen Datenformat enthalten: Formatversion, Name, Zeitpunkte, die Etagen mit Kennung und Namen in ihrer Reihenfolge, die aktive Etage, die Vorlage je Etage samt Kalibrierung, Sichtbarkeit und Deckkraft, die Formen je Etage in ihrer Zeichenreihenfolge und die Einstellungen des Plans (siehe `app-settings`). Dazu SHALL sie jedes Vorlagenbild, auf das eine Vorlage verweist und das im Browser vorhanden ist, genau einmal als Base64-Data-URL enthalten. Sie MUST NOT Zoom, Ansichtsposition, Bedieneinstellungen wie den Panel-Zustand oder den Export-Zähler enthalten. Der Inhalt MUST eingerückt sein.

#### Scenario: Keine Ansichtseinstellungen
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet und der Zoom steht auf 200 %
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei weder den Panel-Zustand noch den Zoom

#### Scenario: Einstellungen in der Datei
- **GIVEN** die Wanddicke neuer Räume ist 11,5 cm und der Fangschritt 2,5 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** danach ist die Wanddicke neuer Räume 11,5 cm und der Fangschritt 2,5 cm

#### Scenario: Name in der Datei
- **WHEN** der Nutzer den Plan unter dem Namen „Umzug“ exportiert
- **THEN** steht in der Datei der Name „Umzug“

#### Scenario: Formatversion in der Datei
- **WHEN** der Plan exportiert wird
- **THEN** steht in der Datei die aktuelle Formatversion der App

#### Scenario: Etagen in der Datei
- **GIVEN** der Plan hat die Etagen „Keller“, „Erdgeschoss“, „Obergeschoss“ in dieser Reihenfolge
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei diese drei Etagen mit Kennung und Namen in dieser Reihenfolge

#### Scenario: Kalibrierung in der Datei
- **GIVEN** die Vorlage des Erdgeschosses ist mit 0,9986 px/cm kalibriert (P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm, Ausrichtung „waagerecht“), das Obergeschoss hat keine Vorlage
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei für die Vorlage des Erdgeschosses beide Punkte, die reale Länge 1 000 cm, den Maßstab 0,9986 px/cm und die Ausrichtung
- **AND** für das Obergeschoss enthält sie keine Vorlage

#### Scenario: Vorlagenbilder in der Datei
- **GIVEN** Erdgeschoss und Obergeschoss verwenden dasselbe Vorlagenbild, das Dachgeschoss ein anderes
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei genau zwei Bilder als Data-URL
- **AND** die Vorlagen verweisen auf diese Bilder

#### Scenario: Fehlendes Bild
- **GIVEN** die Vorlage des Erdgeschosses hat kein vorhandenes Bild, ist aber mit 0,9986 px/cm kalibriert
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei die Vorlage mit Kalibrierung, aber kein Bild dafür

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

### Requirement: Räume in der Exportdatei
Die Exportdatei SHALL je Etage die Räume in ihrer Reihenfolge mit ID, Name und allen Eckpunkten in cm enthalten, auch eine leere Raumliste für Etagen ohne Räume. Ein exportierter Plan mit Räumen MUST beim Import ohne Warnung mit unveränderten Räumen übernommen werden.

#### Scenario: Raum in der Datei
- **GIVEN** das Erdgeschoss hat den Raum „Wohnen“ mit den Eckpunkten (0 cm, 0 cm), (337,5 cm, 0 cm), (337,5 cm, 560 cm), (0 cm, 560 cm)
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei für das Erdgeschoss den Raum „Wohnen“ mit diesen vier Eckpunkten

#### Scenario: Rundreise mit Räumen
- **GIVEN** ein Plan mit zwei Räumen im Erdgeschoss und einem im Keller
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import sind die drei Räume gleich den exportierten

### Requirement: Türen und Fenster in der Exportdatei
Die Exportdatei SHALL bei jedem Raum seine Türen und Fenster mit Art, Kante, Abstand und Breite in cm und dem Aufschlag enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit allen Öffnungen übernommen werden.

#### Scenario: Tür in der Datei
- **GIVEN** der Raum „Wohnen“ hat auf seiner ersten Kante eine Tür mit Breite 80 cm, Abstand 160 cm, Anschlag links und Aufschlag nach innen
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei beim Raum „Wohnen“ diese Tür mit genau diesen Werten

#### Scenario: Rundreise mit Öffnungen
- **GIVEN** ein Plan mit einer Tür mit Anschlag links, die nach außen öffnet, und einem Fenster mit Breite 120 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import sind Tür und Fenster unverändert vorhanden

### Requirement: Wanddicken in der Exportdatei
Die Exportdatei SHALL bei jedem Raum die Wanddicke jeder Kante in cm in der Reihenfolge der Kanten enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten Wanddicken übernommen werden.

#### Scenario: Außenwand in der Datei
- **GIVEN** der Raum „Wohnen“ hat vier Kanten mit den Wanddicken 36,5 cm, 15 cm, 15 cm und 36,5 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** „Wohnen“ hat danach wieder die Wanddicken 36,5 cm, 15 cm, 15 cm und 36,5 cm

### Requirement: Raumfarbe in der Exportdatei
Die Exportdatei SHALL bei jedem Raum seine Raumfarbe als `#RRGGBB` oder als leeren Wert für „Standard“ enthalten. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten Raumfarben übernommen werden.

#### Scenario: Rundreise mit Farben
- **GIVEN** „Kind 1“ hat die Raumfarbe #BBF7D0 und „Flur“ keine Raumfarbe
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** „Kind 1“ hat die Raumfarbe #BBF7D0 und „Flur“ keine

### Requirement: Gemerkte Maße in der Exportdatei
Die Exportdatei SHALL bei jeder Öffnung ihre gemerkten Maße für „Ganze Kante“ enthalten, als Abstand und Breite in cm oder als leeren Wert. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten gemerkten Maßen übernommen werden.

#### Scenario: Rundreise mit gemerkten Maßen
- **GIVEN** in „Küche“ nimmt ein Durchgang nach dem Anhaken von „Ganze Kante“ die 500 cm lange Kante ein, vorher hatte er Breite 100 cm und Abstand 200 cm
- **AND** in „Wohnen“ nimmt ein Fenster nach dem Anhaken von „Ganze Kante“ die 400 cm lange Kante ein, vorher hatte es Breite 120 cm und Abstand 140 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Abhaken von „Ganze Kante“ hat der Durchgang die Breite 100 cm und den Abstand 200 cm
- **AND** nach dem Abhaken von „Ganze Kante“ hat das Fenster die Breite 120 cm und den Abstand 140 cm
