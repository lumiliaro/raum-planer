# Spec Delta

## Purpose

Legt fest, wie eine Plan-Datei in die App zurückkommt: Sie wird vollständig geprüft, wenn nötig von einer anderen Formatversion umgewandelt und ersetzt den aktuellen Plan erst nach Rückfrage. Nichts aus der Datei geht stillschweigend verloren.

## ADDED Requirements

### Requirement: Datei wählen
Die Schaltfläche „Importieren“ SHALL eine Dateiauswahl öffnen, die JSON-Dateien anbietet. Bricht der Nutzer die Auswahl ab, MUST nichts geschehen. Dieselbe Datei MUST sich direkt nacheinander mehrmals wählen lassen.

#### Scenario: Auswahl abbrechen
- **WHEN** der Nutzer „Importieren“ anklickt und die Dateiauswahl schließt, ohne eine Datei zu wählen
- **THEN** erscheint kein Dialog und der Plan bleibt unverändert

#### Scenario: Dieselbe Datei erneut
- **GIVEN** der Nutzer hat „plan.json“ gewählt und den Dialog mit „Abbrechen“ geschlossen
- **WHEN** er erneut „Importieren“ anklickt und wieder „plan.json“ wählt
- **THEN** erscheint der Dialog erneut

### Requirement: Keine Raumplaner-Datei
Ist die Datei größer als 5 MB, kein gültiges JSON, fehlt ihr eine ganzzahlige Formatversion ab 1 oder die Formenliste je Etage, oder scheitert die Umwandlung einer älteren Version, SHALL das System einen Fehlerdialog mit dem Dateinamen und einem verständlichen Grund zeigen. Der aktuelle Plan MUST unverändert bleiben.

#### Scenario: Beliebige JSON-Datei
- **WHEN** der Nutzer die Datei „package.json“ importiert
- **THEN** erscheint ein Dialog, dass „package.json“ keine Raumplaner-Datei ist
- **AND** nach „Schließen“ ist der Plan unverändert

#### Scenario: Kaputte Datei
- **WHEN** der Nutzer eine Datei „plan.json“ importiert, deren Inhalt kein gültiges JSON ist
- **THEN** erscheint ein Dialog, dass „plan.json“ nicht gelesen werden konnte
- **AND** der Plan ist unverändert

### Requirement: Prüfergebnis vor dem Ersetzen
Für jede lesbare Plan-Datei SHALL das System einen Dialog „Ergebnis der Prüfung“ zeigen, auch ohne Probleme und bei leerem aktuellem Plan. Er MUST die Zahl der übernommenen Formen insgesamt und je Etage in der Reihenfolge der Etagen nennen und je Etage zeigen, ob eine Kalibrierung übernommen wird. Bis zur Bestätigung MUST der aktuelle Plan unverändert bleiben.

#### Scenario: Fehlerfreie Datei
- **GIVEN** die Datei „umzug.json“ hat Formatversion 1, enthält 14 Formen im Erdgeschoss und 9 im Obergeschoss und eine Kalibrierung nur für das Erdgeschoss mit 0,9986 px/cm
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „23 Formen werden übernommen“ und „Erdgeschoss 14 · Obergeschoss 9 · Dachgeschoss 0“
- **AND** er zeigt „Kalibrierung für 1 von 3 Etagen“ mit „Erdgeschoss 0,9986 px/cm · Obergeschoss nicht kalibriert · Dachgeschoss nicht kalibriert“
- **AND** die Hauptschaltfläche heißt „Importieren“
- **AND** im Hintergrund ist noch der bisherige Plan zu sehen

### Requirement: Ersetzen bestätigen oder abbrechen
Die Hauptschaltfläche des Dialogs SHALL den aktuellen Plan vollständig durch den geprüften Plan ersetzen. „Abbrechen“, `Esc` und das Schließen des Dialogs MUST den aktuellen Plan unverändert lassen. Der ersetzte Plan SHALL wie jede Änderung automatisch gespeichert werden.

#### Scenario: Importieren
- **GIVEN** der Dialog zeigt eine Datei mit 23 übernehmbaren Formen, deren aktive Etage das Obergeschoss ist
- **WHEN** der Nutzer „Importieren“ anklickt
- **THEN** schließt sich der Dialog, die App zeigt den Plan aus der Datei und das Obergeschoss ist aktiv
- **AND** nach dem Neuladen der Seite ist der importierte Plan noch vorhanden

#### Scenario: Abbrechen
- **GIVEN** der Dialog ist offen
- **WHEN** der Nutzer `Esc` drückt
- **THEN** schließt sich der Dialog und der bisherige Plan ist unverändert

### Requirement: Warnung vor dem Ersetzen
Enthält der aktuelle Plan mindestens eine Form oder eine Kalibrierung, SHALL der Dialog darauf hinweisen, dass der aktuelle Plan mit seinem Namen samt Formen und Kalibrierungen ersetzt wird, und die Schaltfläche „Aktuellen Plan exportieren“ anbieten. Sie MUST den aktuellen Plan unter seinem Namen ohne Namensabfrage herunterladen (Dateiname und Zähler wie bei „Exportieren“) und den Dialog offen lassen. Enthält der aktuelle Plan weder Formen noch Kalibrierungen, MUST beides fehlen.

#### Scenario: Plan mit Formen
- **GIVEN** der aktuelle Plan „Meine Planung“ enthält ein Rechteck mit Breite 100 cm
- **WHEN** der Nutzer eine Datei importiert
- **THEN** steht im Dialog, dass „Meine Planung“ ersetzt wird und man ihn vorher exportieren kann
- **WHEN** der Nutzer „Aktuellen Plan exportieren“ anklickt
- **THEN** lädt der Browser den aktuellen Plan ohne Namensabfrage herunter, z. B. als `2026-11-11-meine-planung_1.json`, und der Dialog bleibt offen

#### Scenario: Plan nur mit Kalibrierung
- **GIVEN** der aktuelle Plan enthält keine Formen, aber das Erdgeschoss ist mit 0,9986 px/cm kalibriert
- **WHEN** der Nutzer eine Datei importiert
- **THEN** zeigt der Dialog die Ersetzen-Warnung und „Aktuellen Plan exportieren“

#### Scenario: Leerer Plan
- **GIVEN** der aktuelle Plan enthält keine Formen und keine Kalibrierung
- **WHEN** der Nutzer eine Datei importiert
- **THEN** zeigt der Dialog weder die Ersetzen-Warnung noch „Aktuellen Plan exportieren“

### Requirement: Abweichende Formatversion
Weicht die Formatversion der Datei von der Version der App ab, SHALL der Dialog mit Warnsymbol „Datei aus einer älteren Version“ bzw. „Datei aus einer neueren Version“ überschreiben und beide Versionen nennen. Die Hauptschaltfläche MUST dann „Trotzdem importieren“ heißen.

#### Scenario: Ältere Datei
- **GIVEN** die App verwendet Formatversion 2 und „umzug-entwurf.json“ hat Version 1
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog „Datei aus einer älteren Version“ und nennt Version 1 und Version 2
- **AND** er sagt, dass die Datei beim Import automatisch umgewandelt wird
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“

### Requirement: Migration älterer Dateien
Eine Datei mit älterer Formatversion SHALL Version für Version bis zur aktuellen Version umgewandelt werden, bevor ihre Formen geprüft werden. Fehlt für einen Schritt die Umwandlung oder scheitert sie, MUST die Datei als nicht importierbar gelten.

#### Scenario: Umwandlung über zwei Versionen
- **GIVEN** die App verwendet Formatversion 3 und kennt Umwandlungen von 1 nach 2 und von 2 nach 3
- **WHEN** eine Datei mit Version 1 importiert und bestätigt wird
- **THEN** sind beide Umwandlungen nacheinander angewendet
- **AND** der übernommene Plan hat Formatversion 3

#### Scenario: Umwandlung scheitert
- **GIVEN** die Umwandlung von Version 1 nach 2 kann eine Datei nicht verarbeiten
- **WHEN** der Nutzer diese Datei importiert
- **THEN** erscheint der Fehlerdialog und der Plan bleibt unverändert

### Requirement: Dateien aus neueren Versionen
Bei einer Datei mit neuerer Formatversion SHALL das System alle Formen übernehmen, die die aktuelle Version versteht, und die übrigen wie ungültige Formen auflisten. Der Dialog MUST darauf hinweisen, dass Angaben, die diese Version nicht kennt, beim Import verloren gehen.

#### Scenario: Neuere Datei
- **GIVEN** die App verwendet Formatversion 1 und „neu.json“ hat Version 2 mit 5 gültigen Rechtecken und einer Form vom Typ „schraege-wand“ im Erdgeschoss
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog „Datei aus einer neueren Version“ mit Version 2 und Version 1
- **AND** „5 Formen werden übernommen“
- **AND** die Form vom Typ „schraege-wand“ ist als nicht übernommen aufgelistet
- **AND** der Dialog weist darauf hin, dass unbekannte Angaben verloren gehen

### Requirement: Unbekannte Etagen
Formen unter einer Etage, die nicht konfiguriert ist, MUST NOT übernommen werden. Der Dialog SHALL je unbekannter Etage deren Kennung, die Zahl der Formen und ihre Namen nennen. Als Name dient die Beschriftung, sonst der Formtyp.

#### Scenario: Keller in der Datei
- **GIVEN** die Datei enthält unter der Etage „kg“ die Formen „Regal“, „Waschmaschine“ und „Trockner“
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „Unbekannte Etage „kg“ – 3 Formen“ mit „Regal, Waschmaschine, Trockner“
- **AND** nach dem Import enthält der Plan keine dieser drei Formen

### Requirement: Ungültige Formen
Formen, die die Gültigkeitsregeln des Plans nicht erfüllen, MUST NOT übernommen werden. Der Dialog SHALL jede einzeln mit Name, Etage und einem deutschen Grund auflisten, der das betroffene Maß bzw. die Eigenschaft nennt. Alle übrigen Formen derselben Etage SHALL in ihrer Reihenfolge übernommen werden.

#### Scenario: Teppich ohne Breite
- **GIVEN** im Obergeschoss der Datei steht ein Rechteck „Teppich“ ohne Breite zwischen zwei gültigen Formen A und B
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** listet der Dialog vorher „Teppich“ (Obergeschoss) mit dem Grund „Breite fehlt“
- **AND** das Obergeschoss enthält danach A, B in dieser Reihenfolge

#### Scenario: Eckradius zu groß
- **GIVEN** die Datei enthält im Erdgeschoss ein Rechteck ohne Beschriftung mit Breite 200 cm, Tiefe 90 cm und Eckradius 50 cm
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Rechteck“ (Erdgeschoss) mit einem Grund, der den Eckradius nennt

### Requirement: Doppelte IDs
Kommt eine Form-ID in der Datei mehrfach vor, SHALL die zuerst gefundene Form ihre ID behalten und jede weitere eine neue, eindeutige ID bekommen und übernommen werden. Der Dialog MUST die Zahl dieser Formen nennen. Die Etagen werden dabei in ihrer Reihenfolge durchlaufen.

#### Scenario: Kopierter Schrank
- **GIVEN** die Datei enthält im Erdgeschoss zwei Schränke mit derselben ID
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** meldet der Dialog vorher, dass 1 Form eine neue ID bekommt
- **AND** das Erdgeschoss enthält danach beide Schränke mit verschiedenen IDs

### Requirement: Fehlende Plan-Angaben
Fehlen in der Datei der Planname, die Zeitpunkte oder die aktive Etage, oder sind sie ungültig, SHALL das System sie ergänzen: Name „Meine Planung“, Zeitpunkt des Imports, Erdgeschoss. Der Dialog MUST die ergänzten Angaben nennen. Fehlt eine konfigurierte Etage in der Datei, SHALL sie eine leere Formenliste bekommen.

#### Scenario: Ohne Namen und Etage
- **GIVEN** die Datei hat keinen Namen und als aktive Etage „kg“
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog, dass Name und aktive Etage ergänzt werden
- **AND** nach dem Import heißt der Plan „Meine Planung“ und das Erdgeschoss ist aktiv

### Requirement: Kalibrierung aus der Datei
Das System SHALL gültige Kalibrierungen der konfigurierten Etagen aus der Datei übernehmen. Ungültige Kalibrierungen und Kalibrierungen unbekannter Etagen MUST NOT übernommen werden; der Dialog SHALL jede einzeln mit Etage und einem deutschen Grund auflisten. Eine Etage ohne gültige Kalibrierung in der Datei MUST nach dem Import als nicht kalibriert gelten, auch wenn sie im bisherigen Plan kalibriert war.

#### Scenario: Kalibrierung wird übernommen
- **GIVEN** die Datei enthält für das Erdgeschoss eine Kalibrierung mit 1 000 cm und 0,9986 px/cm
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** zeigt die Statusleiste im Erdgeschoss „Maßstab: 0,9986 px/cm“

#### Scenario: Ungültige Kalibrierung
- **GIVEN** die Datei enthält für das Obergeschoss eine Kalibrierung mit dem Maßstab 0 px/cm und unter der Etage „kg“ eine gültige Kalibrierung
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

### Requirement: Export und Import ergeben denselben Plan
Ein mit dieser Version exportierter Plan SHALL beim Import ohne Warnungen und mit allen Formen, Werten, Kalibrierungen, Zeitpunkten, Namen, aktiver Etage und Reihenfolge übernommen werden.

#### Scenario: Rundreise
- **GIVEN** ein Plan mit einem Rechteck 220 × 95 cm mit Eckradius 10 cm im Erdgeschoss, einer Ellipse 80 × 80 cm ohne Füllung im Obergeschoss und einer Kalibrierung des Erdgeschosses mit 1 000 cm und 0,9986 px/cm
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import ist der Plan gleich dem exportierten Plan
