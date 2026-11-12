# Spec Delta

## MODIFIED Requirements

### Requirement: Inhalt der Exportdatei
Die Exportdatei SHALL genau den Plan im aktuellen Datenformat enthalten: Formatversion, Name, Zeitpunkte, die Etagen mit Kennung und Namen in ihrer Reihenfolge, die aktive Etage, die Kalibrierung je kalibrierter Etage und die Formen je Etage in ihrer Zeichenreihenfolge. Sie MUST NOT Grundrissbilder, Zoom, Ansichtsposition, Bedieneinstellungen oder den Export-Zähler enthalten. Der Inhalt MUST eingerückt und damit in einem Texteditor lesbar sein.

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
- **THEN** steht in der Datei die aktuelle Formatversion 2

#### Scenario: Etagen in der Datei
- **GIVEN** der Plan hat die Etagen „Keller“, „Erdgeschoss“, „Obergeschoss“ in dieser Reihenfolge
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei diese drei Etagen mit Kennung und Namen in dieser Reihenfolge

#### Scenario: Kalibrierung in der Datei
- **GIVEN** das Erdgeschoss ist mit 0,9986 px/cm kalibriert (P1 x 120,0 · y 160,4 px, P2 x 1 118,6 · y 160,4 px, 1 000 cm), das Obergeschoss ist nicht kalibriert
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei für das Erdgeschoss beide Punkte, die reale Länge 1 000 cm und den Maßstab 0,9986 px/cm
- **AND** für das Obergeschoss enthält sie keine Kalibrierung
