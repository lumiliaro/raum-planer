# floor-management Specification

## Purpose

Macht die Etagen des Plans zu Nutzerdaten: Der Nutzer legt Etagen an, benennt sie um, ordnet sie und löscht sie, ohne dass dabei Formen oder Kalibrierungen anderer Etagen verloren gehen.

## Requirements

### Requirement: Etagenliste
Ein Plan SHALL eine geordnete Liste von 1 bis 8 Etagen enthalten. Jede Etage MUST eine im Plan eindeutige Kennung und einen Namen mit 1 bis 40 Zeichen ohne Leerzeichen am Rand haben. Die Reihenfolge der Liste MUST die Reihenfolge im Etagen-Umschalter sein. Zwei Etagen dürfen gleich heißen.

#### Scenario: Gültige Etagenliste
- **WHEN** ein Plan mit den Etagen „Keller“, „Erdgeschoss“ und „Dachgeschoss“ in dieser Reihenfolge geprüft wird
- **THEN** gilt er als gültig
- **AND** der Umschalter zeigt die Etagen in dieser Reihenfolge

#### Scenario: Keine Etage
- **WHEN** ein Plan ohne Etage geprüft wird
- **THEN** gilt er als ungültig

#### Scenario: Leerer Name
- **WHEN** ein Plan mit einer Etage geprüft wird, deren Name nur aus Leerzeichen besteht
- **THEN** gilt er als ungültig

### Requirement: Dialog „Etagen“
Die Kopfleiste SHALL neben dem Etagen-Umschalter eine Icon-Schaltfläche „Etagen bearbeiten“ zeigen, die den Dialog „Etagen“ öffnet. Der Dialog SHALL alle Etagen in ihrer Reihenfolge auflisten, je Etage mit einem Namensfeld und den Schaltflächen „Nach oben“, „Nach unten“ und „Löschen“, darunter „Etage hinzufügen“. Jede Änderung MUST sofort im Plan wirken. „Fertig“, `Esc` und das Schließen beenden den Dialog. Im Kalibrier-Modus MUST die Schaltfläche ausgeblendet sein.

#### Scenario: Dialog öffnen
- **GIVEN** der Plan hat die Etagen „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“
- **WHEN** der Nutzer „Etagen bearbeiten“ anklickt
- **THEN** zeigt der Dialog „Etagen“ drei Zeilen mit diesen Namen in dieser Reihenfolge

#### Scenario: Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus ist aktiv
- **THEN** ist „Etagen bearbeiten“ nicht zu sehen

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

### Requirement: Etage umbenennen
Das Namensfeld einer Etage SHALL den Namen mit Enter oder beim Verlassen des Feldes übernehmen, ohne Leerzeichen am Rand. Ein leerer Name oder einer mit mehr als 40 Zeichen MUST abgelehnt werden: Das Feld zeigt einen Hinweis und der bisherige Name bleibt. `Esc` MUST das Feld auf den aktuellen Namen zurücksetzen.

#### Scenario: Umbenennen
- **GIVEN** eine Etage heißt „Neue Etage“
- **WHEN** der Nutzer im Namensfeld „  Keller “ eingibt und Enter drückt
- **THEN** heißt die Etage „Keller“ und der Umschalter zeigt „Keller“

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen „Keller“ löscht und das Feld verlässt
- **THEN** zeigt das Feld den Hinweis „Bitte einen Namen eingeben“
- **AND** die Etage heißt weiterhin „Keller“

### Requirement: Etagen sortieren
„Nach oben“ SHALL eine Etage um eine Stelle nach vorne verschieben, „Nach unten“ um eine Stelle nach hinten. Bei der ersten Etage MUST „Nach oben“ gesperrt sein, bei der letzten „Nach unten“. Die aktive Etage MUST aktiv bleiben.

#### Scenario: Keller nach vorne
- **GIVEN** die Etagen sind „Erdgeschoss“, „Obergeschoss“, „Keller“ und das Obergeschoss ist aktiv
- **WHEN** der Nutzer beim Keller zweimal „Nach oben“ anklickt
- **THEN** ist die Reihenfolge „Keller“, „Erdgeschoss“, „Obergeschoss“
- **AND** das Obergeschoss ist weiterhin aktiv

#### Scenario: Erste Etage
- **WHEN** der Dialog geöffnet ist
- **THEN** ist „Nach oben“ bei der ersten Etage gesperrt

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
