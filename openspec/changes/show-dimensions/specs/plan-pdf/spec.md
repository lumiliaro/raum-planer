## MODIFIED Requirements

### Requirement: PDF-Dialog
Die Schaltfläche „PDF“ in der Kopfleiste SHALL einen Dialog „Grundriss als PDF“ öffnen mit: einem Häkchen je Etage in der Reihenfolge der Etagen, der Wahl „Hochformat“/„Querformat“, der Wahl des Maßstabs „1:50“, „1:100“ oder „Auf Seite einpassen“ und den Häkchen „Möbel“, „Raumnamen und Fläche“, „Maße“, „Vorlage“ und „Raster“. „Abbrechen“ und `Esc` MUST den Dialog schließen, ohne etwas herunterzuladen.

#### Scenario: Dialog öffnen
- **GIVEN** der Plan hat die Etagen „Erdgeschoss“ und „Obergeschoss“
- **WHEN** der Nutzer „PDF“ anklickt
- **THEN** öffnet sich der Dialog „Grundriss als PDF“ mit den Häkchen „Erdgeschoss“ und „Obergeschoss“ in dieser Reihenfolge
- **AND** unter „Inhalt“ stehen die Häkchen „Möbel“, „Raumnamen und Fläche“, „Maße“, „Vorlage“ und „Raster“

#### Scenario: Abbrechen
- **GIVEN** der Dialog „Grundriss als PDF“ ist offen
- **WHEN** der Nutzer `Esc` drückt
- **THEN** schließt sich der Dialog und nichts wird heruntergeladen

### Requirement: Voreinstellungen des PDF-Dialogs
Bei jedem Öffnen SHALL der Dialog mit diesen Werten beginnen: alle Etagen angehakt, „Hochformat“, Maßstab „1:100“, „Möbel“ und „Raumnamen und Fläche“ angehakt, „Maße“, „Vorlage“ und „Raster“ nicht angehakt. Eine Auswahl aus einem früheren Öffnen MUST NOT übernommen werden. Der Zustand der Maßanzeige im Editor MUST NOT die Voreinstellung von „Maße“ beeinflussen.

#### Scenario: Erneutes Öffnen
- **GIVEN** der Nutzer hat im Dialog „Querformat“, „Maße“ und „Raster“ gewählt und ihn mit „Abbrechen“ geschlossen
- **WHEN** er „PDF“ erneut anklickt
- **THEN** sind „Hochformat“ und Maßstab „1:100“ gewählt
- **AND** „Möbel“ und „Raumnamen und Fläche“ sind angehakt, „Maße“, „Vorlage“ und „Raster“ nicht

#### Scenario: Maßanzeige im Editor an
- **GIVEN** die Maßanzeige im Editor ist eingeschaltet
- **WHEN** der Nutzer „PDF“ anklickt
- **THEN** ist „Maße“ im Dialog nicht angehakt

## ADDED Requirements

### Requirement: Maße im PDF
Ist „Maße“ angehakt, SHALL jede Seite an jeder Raumkante deren Innenlänge zeigen und, wenn auch „Möbel“ angehakt ist, an jedem Möbel Breite und Tiefe – mit Text, Lage (Raummaße außen vor der Wand, bei belegter Außenseite innen), Farbe und Lesrichtung wie bei der Maßanzeige im Editor, in fester Schriftgröße auf dem Papier. Ein Maß, das auf dem Papier länger als seine Kante ist, MUST weggelassen werden. Ohne „Maße“ MUST kein Maß erscheinen, unabhängig von der Maßanzeige im Editor.

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

### Requirement: Platz für Maße im PDF
Mit „Maße“ MUST um den Inhalt so viel Platz bleiben, dass auch die Maße außen vor den Außenwänden ganz auf der Zeichenfläche liegen. „Auf Seite einpassen“ und der Hinweis „Passt nicht auf die Seite“ SHALL diesen Platz berücksichtigen.

#### Scenario: Platz für Maße beim Einpassen
- **GIVEN** bei „Auf Seite einpassen“ füllt das Erdgeschoss mit seinen Wänden die Zeichenfläche im Maßstab 1:50 genau aus
- **WHEN** der Nutzer zusätzlich „Maße“ anhakt und das PDF erstellt
- **THEN** ist der Maßstab kleiner als 1:50 und alle Maße außen vor den Außenwänden liegen ganz auf der Zeichenfläche

#### Scenario: Platz für Maße bei festem Maßstab
- **GIVEN** das Erdgeschoss passt im Maßstab 1:50 auf die Zeichenfläche, links und rechts bleiben aber nur je 2 mm frei
- **WHEN** der Nutzer „Maße“ anhakt
- **THEN** erscheint „Passt nicht auf die Seite: Erdgeschoss“ und „PDF erstellen“ ist gesperrt
