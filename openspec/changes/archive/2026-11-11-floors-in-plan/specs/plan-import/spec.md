# Spec Delta

## ADDED Requirements

### Requirement: Etagen aus der Datei
Das System SHALL die Etagen mit Kennung, Namen und Reihenfolge aus der Datei übernehmen; die bisherigen Etagen des Plans entfallen beim Ersetzen. Etagen-Einträge ohne gültige Kennung oder gültigen Namen, Einträge mit bereits vorgekommener Kennung und jede Etage nach der achten MUST NOT übernommen werden; der Dialog SHALL jeden davon einzeln mit Name bzw. Kennung und Grund auflisten. Ihre Formen und Kalibrierung gelten dann als unbekannte Etage.

#### Scenario: Eigene Etagen
- **GIVEN** die Datei hat die Etagen „Keller“, „Wohnung“ in dieser Reihenfolge, der aktuelle Plan hat „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt der Umschalter nur „Keller“ und „Wohnung“ in dieser Reihenfolge

#### Scenario: Doppelte Kennung
- **GIVEN** die Datei hat zwei Etagen mit der Kennung „og“, die erste heißt „Obergeschoss“, die zweite „Spitzboden“
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Spitzboden“ als nicht übernommene Etage mit dem Grund „Kennung doppelt“
- **AND** nach dem Bestätigen gibt es nur die Etage „Obergeschoss“

### Requirement: Dateien der Version 1
Eine Datei der Formatversion 1 SHALL beim Umwandeln die Etagen „Erdgeschoss“, „Obergeschoss“ und „Dachgeschoss“ mit den Kennungen `eg`, `og` und `dg` in dieser Reihenfolge bekommen. Formen und Kalibrierungen MUST dabei mit unveränderten Werten und Koordinaten übernommen werden.

#### Scenario: Alte Sicherung
- **GIVEN** „sicherung.json“ hat Version 1, 14 Formen im Erdgeschoss, 9 im Obergeschoss und eine Kalibrierung des Erdgeschosses
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt der Umschalter „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“
- **AND** alle 23 Formen liegen mit unveränderten Maßen und Positionen auf ihren Etagen
- **AND** das Erdgeschoss ist mit dem Maßstab aus der Datei kalibriert

## MODIFIED Requirements

### Requirement: Keine Raumplaner-Datei
Ist die Datei größer als 5 MB, kein gültiges JSON, fehlt ihr eine ganzzahlige Formatversion ab 1 oder die Formenliste je Etage, scheitert die Umwandlung einer älteren Version oder enthält sie danach keine gültige Etage, SHALL das System einen Fehlerdialog mit dem Dateinamen und einem verständlichen Grund zeigen. Der aktuelle Plan MUST unverändert bleiben.

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

### Requirement: Prüfergebnis vor dem Ersetzen
Für jede lesbare Plan-Datei SHALL das System einen Dialog „Ergebnis der Prüfung“ zeigen, auch ohne Probleme und bei leerem aktuellem Plan. Er MUST die Zahl der übernommenen Formen insgesamt und je Etage der Datei mit deren Namen in ihrer Reihenfolge nennen und je Etage zeigen, ob eine Kalibrierung übernommen wird. Bis zur Bestätigung MUST der aktuelle Plan unverändert bleiben.

#### Scenario: Fehlerfreie Datei
- **GIVEN** die Datei „umzug.json“ hat die aktuelle Formatversion, die Etagen „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“, 14 Formen im Erdgeschoss und 9 im Obergeschoss und eine Kalibrierung nur für das Erdgeschoss mit 0,9986 px/cm
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „23 Formen werden übernommen“ und „Erdgeschoss 14 · Obergeschoss 9 · Dachgeschoss 0“
- **AND** er zeigt „Kalibrierung für 1 von 3 Etagen“ mit „Erdgeschoss 0,9986 px/cm · Obergeschoss nicht kalibriert · Dachgeschoss nicht kalibriert“
- **AND** die Hauptschaltfläche heißt „Importieren“
- **AND** im Hintergrund ist noch der bisherige Plan zu sehen

### Requirement: Unbekannte Etagen
Formen unter einer Kennung, die in der Datei nicht als Etage übernommen wird, MUST NOT übernommen werden. Der Dialog SHALL je solcher Kennung diese, die Zahl der Formen und ihre Namen nennen. Als Name dient die Beschriftung, sonst der Formtyp.

#### Scenario: Keller in der Datei
- **GIVEN** die Datei enthält unter der Kennung „kg“ die Formen „Regal“, „Waschmaschine“ und „Trockner“, hat aber keine Etage mit der Kennung „kg“
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „Unbekannte Etage „kg“ – 3 Formen“ mit „Regal, Waschmaschine, Trockner“
- **AND** nach dem Import enthält der Plan keine dieser drei Formen

### Requirement: Fehlende Plan-Angaben
Fehlen in der Datei der Planname, die Zeitpunkte oder die aktive Etage, oder sind sie ungültig, SHALL das System sie ergänzen: Name „Meine Planung“, Zeitpunkt des Imports, erste übernommene Etage. Der Dialog MUST die ergänzten Angaben nennen. Fehlt die Formenliste einer übernommenen Etage, SHALL die Etage ohne Hinweis eine leere Formenliste bekommen.

#### Scenario: Ohne Namen und Etage
- **GIVEN** die Datei mit den Etagen „Erdgeschoss“ und „Obergeschoss“ hat keinen Namen und als aktive Etage „kg“
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog, dass Name und aktive Etage ergänzt werden
- **AND** nach dem Import heißt der Plan „Meine Planung“ und das Erdgeschoss ist aktiv

#### Scenario: Etage ohne Formenliste
- **GIVEN** die Datei hat die Etage „Dachgeschoss“, aber keine Formenliste dafür
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** gibt es das Dachgeschoss ohne Formen, und der Dialog nennt dafür keine Warnung

### Requirement: Kalibrierung aus der Datei
Das System SHALL gültige Kalibrierungen der übernommenen Etagen aus der Datei übernehmen. Ungültige Kalibrierungen und Kalibrierungen unbekannter Etagen MUST NOT übernommen werden; der Dialog SHALL jede einzeln mit Etage und einem deutschen Grund auflisten. Eine Etage ohne gültige Kalibrierung in der Datei MUST nach dem Import als nicht kalibriert gelten, auch wenn sie im bisherigen Plan kalibriert war.

#### Scenario: Kalibrierung wird übernommen
- **GIVEN** die Datei enthält für das Erdgeschoss eine Kalibrierung mit 1 000 cm und 0,9986 px/cm
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt die Statusleiste im Erdgeschoss „Maßstab: 0,9986 px/cm“

#### Scenario: Ungültige Kalibrierung
- **GIVEN** die Datei enthält für das Obergeschoss eine Kalibrierung mit dem Maßstab 0 px/cm und unter der Kennung „kg“, die keine Etage der Datei ist, eine gültige Kalibrierung
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog das Obergeschoss mit einem Grund, der den Maßstab nennt, und „kg“ als unbekannte Etage
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt die Statusleiste im Obergeschoss „Nicht kalibriert“

#### Scenario: Datei ohne Kalibrierung
- **GIVEN** der aktuelle Plan ist im Erdgeschoss mit 0,9986 px/cm kalibriert
- **AND** die Datei enthält keine Kalibrierung
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „Keine Kalibrierung“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt die Statusleiste im Erdgeschoss „Nicht kalibriert“

### Requirement: Dateien aus neueren Versionen
Bei einer Datei mit neuerer Formatversion SHALL das System alle Etagen und Formen übernehmen, die die aktuelle Version versteht, und die übrigen wie ungültige Etagen bzw. Formen auflisten. Der Dialog MUST darauf hinweisen, dass Angaben, die diese Version nicht kennt, beim Import verloren gehen.

#### Scenario: Neuere Datei
- **GIVEN** die App verwendet Formatversion 2 und „neu.json“ hat Version 3 mit 5 gültigen Rechtecken und einer Form vom Typ „schraege-wand“ im Erdgeschoss
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog „Datei aus einer neueren Version“ mit Version 3 und Version 2
- **AND** „5 Formen werden übernommen“
- **AND** die Form vom Typ „schraege-wand“ ist als nicht übernommen aufgelistet
- **AND** der Dialog weist darauf hin, dass unbekannte Angaben verloren gehen

### Requirement: Export und Import ergeben denselben Plan
Ein mit dieser Version exportierter Plan SHALL beim Import ohne Warnungen und mit allen Etagen samt Namen und Reihenfolge, Formen, Werten, Kalibrierungen, Zeitpunkten, Namen, aktiver Etage und Reihenfolge der Formen übernommen werden.

#### Scenario: Rundreise
- **GIVEN** ein Plan mit den Etagen „Keller“, „Erdgeschoss“, einem Rechteck 220 × 95 cm mit Eckradius 10 cm im Erdgeschoss, einer Ellipse 80 × 80 cm ohne Füllung im Keller und einer Kalibrierung des Erdgeschosses mit 1 000 cm und 0,9986 px/cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import ist der Plan gleich dem exportierten Plan
