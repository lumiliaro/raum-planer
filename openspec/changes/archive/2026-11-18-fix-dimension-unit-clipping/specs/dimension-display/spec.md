# Spec Delta

## MODIFIED Requirements

### Requirement: Lesbare Maße
Jedes Maß SHALL in fester Bildschirmgröße bei jedem Zoom stehen und MUST NOT auf dem Kopf stehen: waagerechte und geneigte Maße lesen sich von links nach rechts, senkrechte von unten nach oben. Ein angezeigtes Maß MUST vollständig mit Zahl und Einheit zu sehen sein und MUST NOT abgeschnitten werden, auch nicht beim ersten Anzeigen nach dem Laden der App. Ist ein Maß auf dem Bildschirm länger als seine Kante, MUST es weggelassen werden.

#### Scenario: Obere Kante bei 180° gedrehtem Möbel
- **GIVEN** die Maßanzeige ist an und ein Rechteck mit Breite 180 cm ist um 180° gedreht
- **THEN** steht „180 cm“ an der nun oberen Kante, von links nach rechts lesbar

#### Scenario: Herausgezoomt
- **GIVEN** die Maßanzeige ist an und ein Regal hat die Breite 40 cm
- **WHEN** der Nutzer so weit herauszoomt, dass die 40 cm auf dem Bildschirm kürzer sind als der Text „40 cm“
- **THEN** wird „40 cm“ an dieser Kante nicht angezeigt
- **WHEN** der Nutzer wieder hineinzoomt, bis die Kante länger als der Text ist
- **THEN** steht „40 cm“ wieder an der Kante

#### Scenario: Einheit vollständig
- **GIVEN** die Maßanzeige ist an und der Raum „Küche“ hat eine 312,5 cm lange Kante
- **WHEN** die App neu geladen wird
- **THEN** steht an dieser Kante „312,5 cm“ vollständig, nicht „312,5 c“
- **AND** jedes andere angezeigte Raum- oder Möbelmaß endet ebenso mit „cm“
