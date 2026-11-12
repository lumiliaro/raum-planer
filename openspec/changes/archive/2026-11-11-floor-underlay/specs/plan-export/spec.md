# Spec Delta

## MODIFIED Requirements

### Requirement: Inhalt der Exportdatei
Die Exportdatei SHALL den Plan im aktuellen Datenformat enthalten: Formatversion, Name, Zeitpunkte, die Etagen mit Kennung und Namen in ihrer Reihenfolge, die aktive Etage, die Vorlage je Etage samt Kalibrierung, Sichtbarkeit und Deckkraft und die Formen je Etage in ihrer Zeichenreihenfolge. Dazu SHALL sie jedes Vorlagenbild, auf das eine Vorlage verweist und das im Browser vorhanden ist, genau einmal als Base64-Data-URL enthalten. Sie MUST NOT Zoom, Ansichtsposition, Bedieneinstellungen oder den Export-Zähler enthalten. Der Inhalt MUST eingerückt sein.

#### Scenario: Keine Ansichtseinstellungen
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet und der Zoom steht auf 200 %
- **WHEN** der Plan exportiert wird
- **THEN** enthält die Datei weder den Panel-Zustand noch den Zoom

#### Scenario: Name in der Datei
- **WHEN** der Nutzer den Plan unter dem Namen „Umzug“ exportiert
- **THEN** steht in der Datei der Name „Umzug“

#### Scenario: Formatversion in der Datei
- **WHEN** der Plan exportiert wird
- **THEN** steht in der Datei die aktuelle Formatversion 3

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
