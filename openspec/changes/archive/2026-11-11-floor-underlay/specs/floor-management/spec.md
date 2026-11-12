# Spec Delta

## MODIFIED Requirements

### Requirement: Etage anlegen
„Etage hinzufügen“ SHALL eine neue Etage ohne Formen und ohne Vorlage am Ende der Liste anlegen und aktiv machen. Ihr Name MUST „Neue Etage“ sein, und falls eine Etage so heißt, „Neue Etage 2“, „Neue Etage 3“ usw. Hat der Plan bereits 8 Etagen, MUST die Schaltfläche gesperrt sein und als Tooltip „Höchstens 8 Etagen“ zeigen.

#### Scenario: Keller anlegen
- **GIVEN** der Plan hat die Etagen „Erdgeschoss“ und „Obergeschoss“
- **WHEN** der Nutzer „Etage hinzufügen“ anklickt
- **THEN** steht am Ende der Liste eine Etage „Neue Etage“
- **AND** sie ist im Umschalter aktiv markiert und hat weder Formen noch Vorlage

#### Scenario: Name schon vergeben
- **GIVEN** es gibt bereits eine Etage „Neue Etage“
- **WHEN** der Nutzer „Etage hinzufügen“ anklickt
- **THEN** heißt die neue Etage „Neue Etage 2“

#### Scenario: Höchstzahl erreicht
- **GIVEN** der Plan hat 8 Etagen
- **THEN** ist „Etage hinzufügen“ gesperrt und zeigt den Tooltip „Höchstens 8 Etagen“

### Requirement: Etage löschen
„Löschen“ SHALL eine Etage samt ihren Formen und ihrer Vorlage aus dem Plan entfernen; andere Etagen MUST unverändert bleiben. Hat die Etage Formen oder eine Vorlage, MUST vorher eine Rückfrage mit dem Namen erscheinen. War die gelöschte Etage aktiv, SHALL die nachfolgende Etage aktiv werden, bei der letzten die vorherige. Bei nur einer Etage MUST „Löschen“ gesperrt sein und als Tooltip „Mindestens eine Etage muss bleiben“ zeigen.

#### Scenario: Leere Etage löschen
- **GIVEN** die Etage „Neue Etage“ hat weder Formen noch Vorlage
- **WHEN** der Nutzer bei ihr „Löschen“ anklickt
- **THEN** ist sie ohne Rückfrage aus der Liste und dem Umschalter verschwunden

#### Scenario: Etage mit Formen löschen
- **GIVEN** das Dachgeschoss hat 4 Formen und ist aktiv, davor liegt das Obergeschoss, es ist die letzte Etage
- **WHEN** der Nutzer beim Dachgeschoss „Löschen“ anklickt
- **THEN** fragt das System „Etage „Dachgeschoss“ mit 4 Formen löschen?“
- **WHEN** der Nutzer bestätigt
- **THEN** ist das Dachgeschoss mit seinen 4 Formen entfernt
- **AND** das Obergeschoss ist aktiv
- **AND** die Formen der übrigen Etagen sind unverändert

#### Scenario: Etage nur mit Vorlage löschen
- **GIVEN** der Keller hat keine Formen, aber eine Vorlage ohne Kalibrierung
- **WHEN** der Nutzer beim Keller „Löschen“ anklickt
- **THEN** fragt das System „Etage „Keller“ mit Vorlage löschen?“

#### Scenario: Löschen abbrechen
- **GIVEN** die Rückfrage zum Löschen ist offen
- **WHEN** der Nutzer „Abbrechen“ anklickt
- **THEN** ist die Etage samt Formen weiterhin vorhanden

#### Scenario: Letzte Etage
- **GIVEN** der Plan hat nur die Etage „Erdgeschoss“
- **THEN** ist „Löschen“ gesperrt und zeigt den Tooltip „Mindestens eine Etage muss bleiben“

### Requirement: Etagenänderungen sind rückgängig zu machen
Anlegen, Umbenennen, Sortieren und Löschen einer Etage SHALL je einen Rückgängig-Schritt bilden. Rückgängig nach dem Löschen MUST die Etage an ihrer Stelle mit allen Formen und ihrer Vorlage samt Kalibrierung wiederherstellen.

#### Scenario: Löschen rückgängig
- **GIVEN** der Nutzer hat das Dachgeschoss mit 4 Formen und einer kalibrierten Vorlage gelöscht
- **WHEN** er Strg+Z drückt
- **THEN** ist das Dachgeschoss wieder an seiner Stelle in der Liste
- **AND** es hat wieder seine 4 Formen und seine Vorlage samt Kalibrierung
