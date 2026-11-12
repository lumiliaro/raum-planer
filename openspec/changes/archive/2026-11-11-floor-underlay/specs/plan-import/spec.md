# Spec Delta

## ADDED Requirements

### Requirement: Vorlagenbilder aus der Datei
Das System SHALL die Bilder, auf die übernommene Vorlagen verweisen, aus der Datei übernehmen und erst beim Bestätigen im Browser speichern. Fehlt ein solches Bild in der Datei oder ist es kein lesbares PNG-, JPEG- oder WebP-Bild, MUST die Vorlage ohne Bild übernommen werden; der Dialog SHALL das je Etage mit „Vorlagenbild fehlt“ bzw. „Vorlagenbild unlesbar“ auflisten. Bilder, auf die keine Vorlage verweist, werden übergangen.

#### Scenario: Datei mit Scan
- **GIVEN** „umzug.json“ enthält für das Erdgeschoss eine Vorlage mit Bild und 0,9986 px/cm
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt das Erdgeschoss den Scan unter den Möbeln
- **AND** nach dem Neuladen der Seite ist der Scan weiterhin zu sehen

#### Scenario: Bild fehlt in der Datei
- **GIVEN** die Vorlage des Obergeschosses verweist auf ein Bild, das in der Datei fehlt
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Obergeschoss: Vorlagenbild fehlt“ und die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt das Obergeschoss „Vorlage fehlt – Bild laden“ und behält die Kalibrierung aus der Datei

### Requirement: Dateien der Version 2
Eine Datei der Formatversion 2 SHALL beim Umwandeln für die Etagen mit den Kennungen `eg`, `og` und `dg` je eine sichtbare Vorlage ohne Bild mit Deckkraft 100 % und der bisherigen Kalibrierung der Etage bekommen, falls vorhanden. Andere Etagen MUST ohne Vorlage bleiben. Formen MUST mit unveränderten Werten und Koordinaten übernommen werden. Die Umwandlung allein MUST keine Warnung „Vorlagenbild fehlt“ erzeugen.

#### Scenario: Sicherung aus Version 2
- **GIVEN** „sicherung.json“ hat Version 2 mit den Etagen „Keller“, „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“ und einer Kalibrierung des Erdgeschosses mit 0,9986 px/cm
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigen Erdgeschoss, Obergeschoss und Dachgeschoss „Vorlage fehlt – Bild laden“
- **AND** die Vorlage des Erdgeschosses behält den Maßstab 0,9986 px/cm
- **AND** der Keller hat keine Vorlage
- **AND** alle Formen liegen mit unveränderten Maßen und Positionen auf ihren Etagen

## MODIFIED Requirements

### Requirement: Keine Raumplaner-Datei
Ist die Datei größer als 50 MB, kein gültiges JSON, fehlt ihr eine ganzzahlige Formatversion ab 1 oder die Formenliste je Etage, scheitert die Umwandlung einer älteren Version oder enthält sie danach keine gültige Etage, SHALL das System einen Fehlerdialog mit dem Dateinamen und einem verständlichen Grund zeigen. Der aktuelle Plan MUST unverändert bleiben.

#### Scenario: Beliebige JSON-Datei
- **WHEN** der Nutzer die Datei „package.json“ importiert
- **THEN** erscheint ein Dialog, dass „package.json“ keine Raumplaner-Datei ist
- **AND** nach „Schließen“ ist der Plan unverändert

#### Scenario: Kaputte Datei
- **WHEN** der Nutzer eine Datei „plan.json“ importiert, deren Inhalt kein gültiges JSON ist
- **THEN** erscheint ein Dialog, dass „plan.json“ nicht gelesen werden konnte
- **AND** der Plan ist unverändert

#### Scenario: Datei ohne Etagen
- **GIVEN** „leer.json“ hat Formatversion 2 und eine leere Etagenliste
- **WHEN** der Nutzer sie importiert
- **THEN** erscheint ein Dialog, dass „leer.json“ keine Raumplaner-Datei ist
- **AND** der Plan ist unverändert

#### Scenario: Zu große Datei
- **WHEN** der Nutzer eine Datei mit 60 MB importiert
- **THEN** erscheint ein Dialog, dass die Datei größer als 50 MB ist
- **AND** der Plan ist unverändert

### Requirement: Prüfergebnis vor dem Ersetzen
Für jede lesbare Plan-Datei SHALL das System einen Dialog „Ergebnis der Prüfung“ zeigen, auch ohne Probleme und bei leerem aktuellem Plan. Er MUST die Zahl der übernommenen Formen insgesamt und je Etage der Datei mit deren Namen in ihrer Reihenfolge nennen und je Etage zeigen, ob eine Vorlage übernommen wird, ob sie ein Bild hat und ob sie kalibriert ist. Bis zur Bestätigung MUST der aktuelle Plan unverändert bleiben.

#### Scenario: Fehlerfreie Datei
- **GIVEN** die Datei „umzug.json“ hat die aktuelle Formatversion, die Etagen „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“, 14 Formen im Erdgeschoss und 9 im Obergeschoss und eine Vorlage mit Bild nur für das Erdgeschoss, kalibriert mit 0,9986 px/cm
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „23 Formen werden übernommen“ und „Erdgeschoss 14 · Obergeschoss 9 · Dachgeschoss 0“
- **AND** er zeigt „Vorlage für 1 von 3 Etagen“ mit „Erdgeschoss Bild, 0,9986 px/cm · Obergeschoss ohne Vorlage · Dachgeschoss ohne Vorlage“
- **AND** die Hauptschaltfläche heißt „Importieren“
- **AND** im Hintergrund ist noch der bisherige Plan zu sehen

### Requirement: Warnung vor dem Ersetzen
Enthält der aktuelle Plan mindestens eine Form oder eine Vorlage, SHALL der Dialog darauf hinweisen, dass der aktuelle Plan mit seinem Namen samt Formen und Vorlagen ersetzt wird, und die Schaltfläche „Aktuellen Plan exportieren“ anbieten. Sie MUST den aktuellen Plan unter seinem Namen ohne Namensabfrage herunterladen (Dateiname und Zähler wie bei „Exportieren“) und den Dialog offen lassen. Enthält der aktuelle Plan weder Formen noch Vorlagen, MUST beides fehlen.

#### Scenario: Plan mit Formen
- **GIVEN** der aktuelle Plan „Meine Planung“ enthält ein Rechteck mit Breite 100 cm
- **WHEN** der Nutzer eine Datei importiert
- **THEN** steht im Dialog, dass „Meine Planung“ ersetzt wird und man ihn vorher exportieren kann
- **WHEN** der Nutzer „Aktuellen Plan exportieren“ anklickt
- **THEN** lädt der Browser den aktuellen Plan ohne Namensabfrage herunter, z. B. als `2026-11-11-meine-planung_1.json`, und der Dialog bleibt offen

#### Scenario: Plan nur mit Kalibrierung
- **GIVEN** der aktuelle Plan enthält keine Formen, aber das Erdgeschoss hat eine mit 0,9986 px/cm kalibrierte Vorlage
- **WHEN** der Nutzer eine Datei importiert
- **THEN** zeigt der Dialog die Ersetzen-Warnung und „Aktuellen Plan exportieren“

#### Scenario: Leerer Plan
- **GIVEN** der aktuelle Plan enthält keine Formen und keine Vorlage
- **WHEN** der Nutzer eine Datei importiert
- **THEN** zeigt der Dialog weder die Ersetzen-Warnung noch „Aktuellen Plan exportieren“

### Requirement: Kalibrierung aus der Datei
Das System SHALL gültige Vorlagen der übernommenen Etagen samt Kalibrierung aus der Datei übernehmen. Ungültige Vorlagen und Vorlagen unbekannter Etagen MUST NOT übernommen werden; ist nur die Kalibrierung einer Vorlage ungültig, MUST die Vorlage ohne Kalibrierung übernommen werden. Der Dialog SHALL jeden dieser Fälle einzeln mit Etage und einem deutschen Grund auflisten. Eine Etage ohne gültige Vorlage in der Datei MUST nach dem Import keine Vorlage haben, auch wenn sie im bisherigen Plan eine hatte.

#### Scenario: Kalibrierung wird übernommen
- **GIVEN** die Datei enthält für das Erdgeschoss eine Vorlage mit einer Kalibrierung mit 1 000 cm und 0,9986 px/cm
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt die Statusleiste im Erdgeschoss „Maßstab: 0,9986 px/cm“

#### Scenario: Ungültige Kalibrierung
- **GIVEN** die Datei enthält für das Obergeschoss eine Vorlage mit Bild und einer Kalibrierung mit dem Maßstab 0 px/cm und unter der Kennung „kg“, die keine Etage der Datei ist, eine gültige Vorlage
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog das Obergeschoss mit einem Grund, der den Maßstab nennt, und „kg“ als unbekannte Etage
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt das Obergeschoss das Bild der Vorlage und die Statusleiste dort „Vorlage nicht kalibriert“

#### Scenario: Ungültige Vorlage
- **GIVEN** die Datei enthält für das Dachgeschoss eine Vorlage mit der Deckkraft 3
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog das Dachgeschoss mit einem Grund, der die Deckkraft nennt
- **WHEN** der Nutzer bestätigt
- **THEN** hat das Dachgeschoss keine Vorlage

#### Scenario: Datei ohne Kalibrierung
- **GIVEN** das Erdgeschoss des aktuellen Plans hat eine mit 0,9986 px/cm kalibrierte Vorlage
- **AND** die Datei enthält für das Erdgeschoss eine Vorlage mit Bild ohne Kalibrierung
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „Erdgeschoss Bild, nicht kalibriert“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt die Statusleiste im Erdgeschoss „Vorlage nicht kalibriert“

#### Scenario: Datei ohne Vorlage
- **GIVEN** das Erdgeschoss des aktuellen Plans hat eine kalibrierte Vorlage
- **AND** die Datei enthält keine Vorlage
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „Keine Vorlage“
- **WHEN** der Nutzer bestätigt
- **THEN** hat das Erdgeschoss keine Vorlage und die Zeichenfläche zeigt das Raster

### Requirement: Dateien aus neueren Versionen
Bei einer Datei mit neuerer Formatversion SHALL das System alle Etagen und Formen übernehmen, die die aktuelle Version versteht, und die übrigen wie ungültige Etagen bzw. Formen auflisten. Der Dialog MUST darauf hinweisen, dass Angaben, die diese Version nicht kennt, beim Import verloren gehen.

#### Scenario: Neuere Datei
- **GIVEN** die App verwendet Formatversion 3 und „neu.json“ hat Version 4 mit 5 gültigen Rechtecken und einer Form vom Typ „schraege-wand“ im Erdgeschoss
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog „Datei aus einer neueren Version“ mit Version 4 und Version 3
- **AND** „5 Formen werden übernommen“
- **AND** die Form vom Typ „schraege-wand“ ist als nicht übernommen aufgelistet
- **AND** der Dialog weist darauf hin, dass unbekannte Angaben verloren gehen

### Requirement: Export und Import ergeben denselben Plan
Ein mit dieser Version exportierter Plan SHALL beim Import ohne Warnungen und mit allen Etagen samt Namen und Reihenfolge, Formen, Werten, Vorlagen samt Bildern, Kalibrierungen, Sichtbarkeit und Deckkraft, Zeitpunkten, Namen, aktiver Etage und Reihenfolge der Formen übernommen werden.

#### Scenario: Rundreise
- **GIVEN** ein Plan mit den Etagen „Keller“, „Erdgeschoss“, einem Rechteck 220 × 95 cm mit Eckradius 10 cm im Erdgeschoss, einer Ellipse 80 × 80 cm ohne Füllung im Keller und einer ausgeblendeten Vorlage des Erdgeschosses mit Bild, Deckkraft 40 % und einer Kalibrierung mit 1 000 cm, 0,9986 px/cm und Ausrichtung „waagerecht“
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import ist der Plan gleich dem exportierten Plan und das Erdgeschoss hat dasselbe Bild
