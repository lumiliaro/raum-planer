## ADDED Requirements

### Requirement: Gemerkte Maße in der Exportdatei
Die Exportdatei SHALL bei jeder Öffnung ihre gemerkten Maße für „Ganze Kante“ enthalten, als Abstand und Breite in cm oder als leeren Wert. Ein mit dieser Version exportierter Plan MUST beim Import ohne Warnung mit unveränderten gemerkten Maßen übernommen werden.

#### Scenario: Rundreise mit gemerkten Maßen
- **GIVEN** in „Küche“ nimmt ein Durchgang nach dem Anhaken von „Ganze Kante“ die 500 cm lange Kante ein, vorher hatte er Breite 100 cm und Abstand 200 cm
- **AND** in „Wohnen“ nimmt ein Fenster nach dem Anhaken von „Ganze Kante“ die 400 cm lange Kante ein, vorher hatte es Breite 120 cm und Abstand 140 cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Abhaken von „Ganze Kante“ hat der Durchgang die Breite 100 cm und den Abstand 200 cm
- **AND** nach dem Abhaken von „Ganze Kante“ hat das Fenster die Breite 120 cm und den Abstand 140 cm
