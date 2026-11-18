# Spec Delta

## MODIFIED Requirements

### Requirement: Maße im PDF
Ist „Maße“ angehakt, SHALL jede Seite an jeder Raumkante deren Innenlänge zeigen und, wenn auch „Möbel“ angehakt ist, an jedem Möbel Breite und Tiefe – mit Text, Lage (Raummaße außen vor der Wand, bei belegter Außenseite innen), Farbe und Lesrichtung wie bei der Maßanzeige im Editor, in fester Schriftgröße auf dem Papier. Jedes gedruckte Maß MUST vollständig mit Zahl und Einheit erscheinen und MUST NOT abgeschnitten werden. Ein Maß, das auf dem Papier länger als seine Kante ist, MUST weggelassen werden. Ohne „Maße“ MUST kein Maß erscheinen, unabhängig von der Maßanzeige im Editor.

#### Scenario: Raummaße bei 1:100
- **GIVEN** der Raum „Küche“ ist innen 400 cm × 312,5 cm groß und hat keinen Nachbarraum
- **WHEN** der Nutzer das PDF mit „Maße“ im Maßstab 1:100 erstellt
- **THEN** steht außen vor der oberen und unteren Wand „400 cm“ und vor der linken und rechten Wand „312,5 cm“

#### Scenario: Maße ohne Möbel
- **GIVEN** im Erdgeschoss steht ein Bett mit Breite 180 cm und Tiefe 200 cm
- **WHEN** der Nutzer „Maße“ anhakt, „Möbel“ abwählt und das PDF erstellt
- **THEN** zeigt die Seite die Raummaße, aber weder das Bett noch „180 cm“ oder „200 cm“

#### Scenario: Möbelmaße
- **GIVEN** im Erdgeschoss steht ein Bett mit Breite 180 cm und Tiefe 200 cm
- **WHEN** der Nutzer „Maße“ und „Möbel“ anhakt und das PDF erstellt
- **THEN** steht innen an der unteren Kante des Betts „180 cm“ und innen an der linken Kante „200 cm“

#### Scenario: Ohne Maße trotz Maßanzeige
- **GIVEN** die Maßanzeige im Editor ist eingeschaltet
- **WHEN** der Nutzer das PDF ohne „Maße“ erstellt
- **THEN** zeigt keine Seite ein Maß

#### Scenario: Einheit vollständig im PDF
- **GIVEN** der Raum „Küche“ ist innen 400 cm × 312,5 cm groß
- **WHEN** der Nutzer das PDF mit „Maße“ in den Maßstäben 1:50, 1:100 und „Auf Seite einpassen“ erstellt
- **THEN** steht auf jeder Seite „400 cm“ und „312,5 cm“ vollständig, nie „400 c“ oder „312,5 c“
