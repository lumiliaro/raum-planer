# Spec Delta

## Purpose

Macht jede Änderung am Plan während einer Sitzung umkehrbar, damit Fehlgriffe wie versehentliches Löschen, Verschieben oder ein ungewollter Import ohne Datenverlust zurückgenommen werden können.

## ADDED Requirements

### Requirement: Rückgängig machen
Das System SHALL die letzte Änderung am Plan rückgängig machen, wenn der Nutzer „Rückgängig“ in der Kopfleiste klickt oder Strg+Z drückt. Mehrfaches Rückgängig MUST die Änderungen in umgekehrter Reihenfolge zurücknehmen, bis der Stand vom Beginn der Sitzung erreicht ist.

#### Scenario: Verschieben rückgängig
- **GIVEN** ein Rechteck mit Mittelpunkt x = 200 cm wurde auf x = 250 cm gezogen
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** liegt der Mittelpunkt des Rechtecks wieder bei x = 200 cm

#### Scenario: Löschen rückgängig
- **GIVEN** im Erdgeschoss liegen die Formen A, B, C und B wurde gelöscht
- **WHEN** der Nutzer auf „Rückgängig“ klickt
- **THEN** enthält das Erdgeschoss wieder A, B, C in dieser Reihenfolge
- **AND** B hat dieselbe ID und dieselben Werte wie vor dem Löschen

#### Scenario: Mehrere Schritte
- **GIVEN** der Nutzer hat ein Rechteck eingefügt und danach seine Breite von 100 cm auf 150 cm geändert
- **WHEN** er zweimal Strg+Z drückt
- **THEN** ist das Rechteck nicht mehr vorhanden

### Requirement: Wiederholen
Das System SHALL eine rückgängig gemachte Änderung wiederherstellen, wenn der Nutzer „Wiederholen“ in der Kopfleiste klickt, Strg+Umschalt+Z oder Strg+Y drückt. Sobald nach einem Rückgängig eine neue Änderung am Plan erfolgt, MUST das Wiederholen der verworfenen Schritte entfallen.

#### Scenario: Wiederholen nach Rückgängig
- **GIVEN** ein Rechteck wurde von Breite 100 cm auf 150 cm geändert und das wurde rückgängig gemacht
- **WHEN** der Nutzer Strg+Umschalt+Z drückt
- **THEN** hat das Rechteck wieder die Breite 150 cm

#### Scenario: Neue Änderung verwirft Wiederholen
- **GIVEN** eine Änderung wurde rückgängig gemacht
- **WHEN** der Nutzer eine Form verschiebt
- **THEN** ist „Wiederholen“ gesperrt

### Requirement: Umfang eines Schritts
Jede abgeschlossene Änderung am Plan SHALL genau einen Schritt bilden: Einfügen, ein vollständiges Ziehen, Drehen oder Ändern der Größe (vom Drücken bis zum Loslassen), eine übernommene Eingabe im Eigenschaften-Formular, Löschen, Umordnen, Sperren oder Entsperren, das Speichern einer Kalibrierung und ein Import. Abgelehnte Änderungen MUST keinen Schritt bilden.

#### Scenario: Ziehen ist ein Schritt
- **GIVEN** der Nutzer zieht eine Form in einem Zug über 120 cm nach rechts
- **WHEN** er danach einmal Strg+Z drückt
- **THEN** liegt die Form wieder an ihrer Ausgangslage

#### Scenario: Ungültige Eingabe
- **GIVEN** eine Eingabe im Formular wurde als ungültig abgelehnt
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** wird die Änderung davor rückgängig gemacht

#### Scenario: Kalibrierung rückgängig
- **GIVEN** das Erdgeschoss ist mit 0,7480 px/cm kalibriert und der Nutzer hat eine neue Kalibrierung mit 0,9986 px/cm gespeichert
- **AND** er ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv und die Statusleiste zeigt „Maßstab: 0,7480 px/cm“

#### Scenario: Kalibrierung bleibt bei späterem Rückgängig
- **GIVEN** der Nutzer hat das Erdgeschoss mit 0,9986 px/cm kalibriert und danach einen Schrank um 50 cm verschoben
- **WHEN** er einmal Strg+Z drückt
- **THEN** liegt der Schrank wieder an seiner Ausgangslage
- **AND** die Statusleiste zeigt weiterhin „Maßstab: 0,9986 px/cm“

### Requirement: Kein Schritt für Ansicht und Auswahl
Etagenwechsel, Auswahl, Werkzeugwahl, Zoom, Ansicht verschieben und Ein-/Ausblenden des Panels MUST keinen Schritt bilden und MUST durch Rückgängig oder Wiederholen nicht verändert werden, außer dem Wechsel der Etage nach der folgenden Anforderung.

#### Scenario: Etagenwechsel wird übersprungen
- **GIVEN** der Nutzer hat im Erdgeschoss eine Form gedreht und danach nur zwischen den Etagen gewechselt und gezoomt
- **WHEN** er Strg+Z drückt
- **THEN** ist die Drehung zurückgenommen
- **AND** der Zoom bleibt unverändert

### Requirement: Planname außerhalb des Verlaufs
Das Umbenennen des Plans im Export-Dialog MUST keinen Schritt bilden. Rückgängig und Wiederholen MUST den aktuellen Plannamen beibehalten. Ausgenommen ist das Rückgängigmachen oder Wiederholen eines Imports: Dann SHALL der Name des wiederhergestellten Plans gelten.

#### Scenario: Export nach einer Änderung
- **GIVEN** der Nutzer hat ein Rechteck verschoben und den Plan danach unter dem neuen Namen „Umzug“ exportiert
- **WHEN** er einmal Strg+Z drückt
- **THEN** liegt das Rechteck wieder an seiner Ausgangslage
- **AND** der Plan heißt weiterhin „Umzug“

#### Scenario: Import rückgängig mit Namen
- **GIVEN** der Plan heißt „Meine Planung“ und der Nutzer hat eine Datei mit dem Plan „Umzug Musterhaus“ importiert
- **WHEN** er Strg+Z drückt
- **THEN** heißt der Plan wieder „Meine Planung“

### Requirement: Etage und Auswahl nach Rückgängig und Wiederholen
Betrifft ein Rückgängig oder Wiederholen Formen oder die Kalibrierung genau einer Etage, SHALL das System diese Etage aktiv machen. Ist danach genau eine Form betroffen und auf dieser Etage vorhanden, MUST sie ausgewählt sein; sonst MUST keine Form ausgewählt sein. Betrifft der Schritt mehrere Etagen, gilt die aktive Etage des wiederhergestellten Stands.

#### Scenario: Änderung auf anderer Etage
- **GIVEN** der Nutzer hat im Erdgeschoss ein Sofa verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv
- **AND** das Sofa liegt an seiner Ausgangslage und ist ausgewählt

#### Scenario: Einfügen rückgängig
- **GIVEN** der Nutzer hat ein Rechteck eingefügt, es ist ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** ist keine Form ausgewählt

### Requirement: Import als Schritt
Das Ersetzen des Plans durch einen Import SHALL ein einziger Schritt sein. Rückgängig MUST danach den vorherigen Plan vollständig wiederherstellen, mit allen Etagen, Formen, Kalibrierungen und Reihenfolgen.

#### Scenario: Import rückgängig
- **GIVEN** der Plan enthält im Erdgeschoss 6 Formen und eine Kalibrierung mit 0,9986 px/cm, und der Nutzer hat eine Datei mit 20 Formen auf drei Etagen ohne Kalibrierung importiert
- **WHEN** er Strg+Z drückt
- **THEN** enthält der Plan wieder genau den Stand vor dem Import mit 6 Formen im Erdgeschoss
- **AND** das Erdgeschoss ist wieder mit 0,9986 px/cm kalibriert

### Requirement: Änderungszeitpunkt bei Rückgängig und Wiederholen
Rückgängig und Wiederholen SHALL als inhaltliche Änderung gelten: Der Änderungszeitpunkt des Plans MUST auf den aktuellen Zeitpunkt gesetzt werden, und der Plan MUST wie nach jeder Änderung automatisch gespeichert werden.

#### Scenario: Gespeichert nach Rückgängig
- **GIVEN** der Nutzer hat eine gelöschte Form mit Strg+Z wiederhergestellt
- **WHEN** er die Seite neu lädt
- **THEN** ist die Form vorhanden

### Requirement: Grenzen des Verlaufs
Der Verlauf SHALL die letzten 100 Schritte umfassen; ältere Schritte entfallen. Der Verlauf MUST nur für die laufende Sitzung gelten: Nach dem Neuladen sind Rückgängig und Wiederholen gesperrt. Der Verlauf MUST weder im Browser-Speicher noch in einer Export-Datei landen.

#### Scenario: Nach dem Neuladen
- **GIVEN** der Nutzer hat mehrere Änderungen gemacht
- **WHEN** er die Seite neu lädt
- **THEN** sind „Rückgängig“ und „Wiederholen“ gesperrt

#### Scenario: 101 Schritte
- **GIVEN** der Nutzer hat eine Form 101-mal nacheinander um je 5 cm verschoben
- **WHEN** er so oft wie möglich Strg+Z drückt
- **THEN** werden 100 Verschiebungen zurückgenommen und die Form liegt 5 cm neben ihrer Ausgangslage

### Requirement: Schaltflächen in der Kopfleiste
Die Kopfleiste SHALL rechts die Icon-Schaltflächen „Rückgängig“ und „Wiederholen“ mit den Tooltips „Rückgängig (Strg+Z)“ und „Wiederholen (Strg+Umschalt+Z)“ zeigen. Gibt es nichts rückgängig zu machen bzw. zu wiederholen, MUST die jeweilige Schaltfläche gesperrt sein.

#### Scenario: Start der Sitzung
- **WHEN** die App geladen wird
- **THEN** sind „Rückgängig“ und „Wiederholen“ sichtbar und gesperrt

#### Scenario: Nach einer Änderung
- **GIVEN** die App wurde gerade geladen
- **WHEN** der Nutzer eine Form einfügt
- **THEN** ist „Rückgängig“ verfügbar und „Wiederholen“ gesperrt

### Requirement: Tastenkürzel für Rückgängig und Wiederholen
Strg+Z, Strg+Umschalt+Z und Strg+Y SHALL überall in der App wie die Schaltflächen „Rückgängig“ und „Wiederholen“ wirken, auch in einem Feld des Eigenschaften-Panels, dessen Eingabe übernommen ist. Enthält das fokussierte Eingabefeld noch nicht übernommenen Text oder liegt es außerhalb des Eigenschaften-Panels, MUST das Kürzel dem Feld überlassen bleiben und den Plan nicht verändern.

#### Scenario: Tippfehler im Feld
- **GIVEN** der Nutzer tippt im Feld „Beschriftung“
- **WHEN** er Strg+Z drückt
- **THEN** macht der Browser die letzte Eingabe im Feld rückgängig
- **AND** der Plan bleibt unverändert

#### Scenario: Nach übernommener Eingabe
- **GIVEN** der Nutzer hat im Feld „Breite“ 150 eingetippt und mit Enter übernommen, der Cursor steht noch im Feld
- **WHEN** er Strg+Z drückt
- **THEN** hat die Form wieder ihre vorherige Breite
- **AND** Strg+Umschalt+Z stellt 150 cm wieder her

### Requirement: Kein Rückgängig im Kalibrier-Modus
Im Kalibrier-Modus MUST das System Rückgängig und Wiederholen sperren, auch per Tastenkürzel. Die Schaltflächen sind dort wie Importieren und Exportieren ausgeblendet.

#### Scenario: Kalibrier-Modus
- **GIVEN** es gibt einen Schritt zum Rückgängigmachen und der Kalibrier-Modus ist aktiv
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** bleibt der Plan unverändert
- **AND** „Rückgängig“ und „Wiederholen“ sind in der Kopfleiste nicht zu sehen
