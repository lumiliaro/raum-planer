# plan-import Specification

## Purpose

Legt fest, wie eine Plan-Datei in die App zurückkommt: Sie wird vollständig geprüft, wenn nötig von einer anderen Formatversion umgewandelt und ersetzt den aktuellen Plan erst nach Rückfrage. Nichts aus der Datei geht stillschweigend verloren.

## Requirements

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
Bei einer Datei mit neuerer Formatversion SHALL das System alle Etagen und Formen übernehmen, die die aktuelle Version versteht, und die übrigen wie ungültige Etagen bzw. Formen auflisten. Der Dialog MUST darauf hinweisen, dass Angaben, die diese Version nicht kennt, beim Import verloren gehen.

#### Scenario: Neuere Datei
- **GIVEN** die App verwendet Formatversion 3 und „neu.json“ hat Version 4 mit 5 gültigen Rechtecken und einer Form vom Typ „schraege-wand“ im Erdgeschoss
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog „Datei aus einer neueren Version“ mit Version 4 und Version 3
- **AND** „5 Formen werden übernommen“
- **AND** die Form vom Typ „schraege-wand“ ist als nicht übernommen aufgelistet
- **AND** der Dialog weist darauf hin, dass unbekannte Angaben verloren gehen

### Requirement: Unbekannte Etagen
Formen unter einer Kennung, die in der Datei nicht als Etage übernommen wird, MUST NOT übernommen werden. Der Dialog SHALL je solcher Kennung diese, die Zahl der Formen und ihre Namen nennen. Als Name dient die Beschriftung, sonst der Formtyp.

#### Scenario: Keller in der Datei
- **GIVEN** die Datei enthält unter der Kennung „kg“ die Formen „Regal“, „Waschmaschine“ und „Trockner“, hat aber keine Etage mit der Kennung „kg“
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

### Requirement: Export und Import ergeben denselben Plan
Ein mit dieser Version exportierter Plan SHALL beim Import ohne Warnungen und mit allen Etagen samt Namen und Reihenfolge, Formen, Werten, Vorlagen samt Bildern, Kalibrierungen, Sichtbarkeit und Deckkraft, Zeitpunkten, Namen, aktiver Etage und Reihenfolge der Formen übernommen werden.

#### Scenario: Rundreise
- **GIVEN** ein Plan mit den Etagen „Keller“, „Erdgeschoss“, einem Rechteck 220 × 95 cm mit Eckradius 10 cm im Erdgeschoss, einer Ellipse 80 × 80 cm ohne Füllung im Keller und einer ausgeblendeten Vorlage des Erdgeschosses mit Bild, Deckkraft 40 % und einer Kalibrierung mit 1 000 cm, 0,9986 px/cm und Ausrichtung „waagerecht“
- **WHEN** der Plan exportiert und die Datei wieder importiert wird
- **THEN** zeigt der Dialog keine Warnung
- **AND** nach dem Import ist der Plan gleich dem exportierten Plan und das Erdgeschoss hat dasselbe Bild

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

### Requirement: Räume aus der Datei
Das System SHALL gültige Räume der übernommenen Etagen in ihrer Reihenfolge übernehmen und im Dialog die Zahl der Räume insgesamt und je Etage nennen. Ungültige Räume und Räume unbekannter Etagen MUST NOT übernommen werden; der Dialog SHALL jeden einzeln mit Name, Etage bzw. Kennung und einem deutschen Grund auflisten. Kommt eine Raum-ID mehrfach vor, SHALL jeder weitere Raum eine neue ID bekommen und der Dialog die Zahl nennen.

#### Scenario: Räume werden übernommen
- **GIVEN** die Datei hat im Erdgeschoss 5 Räume und im Obergeschoss 3
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „8 Räume werden übernommen“ mit „Erdgeschoss 5 · Obergeschoss 3“
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt das Erdgeschoss die 5 Räume mit unveränderten Namen und Maßen

#### Scenario: Überschneidender Raum
- **GIVEN** die Datei enthält im Erdgeschoss einen Raum „Abstellraum“, dessen Umriss sich überschneidet
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Abstellraum“ (Erdgeschoss) mit dem Grund „Umriss überschneidet sich“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“

#### Scenario: Raum unter unbekannter Etage
- **GIVEN** die Datei enthält unter der Kennung „kg“, die keine Etage der Datei ist, den Raum „Waschküche“
- **WHEN** der Nutzer sie importiert
- **THEN** nennt der Dialog „Waschküche“ unter der unbekannten Etage „kg“ als nicht übernommen

### Requirement: Dateien der Version 3
Eine Datei der Formatversion 3 SHALL beim Umwandeln für jede ihrer Etagen eine leere Raumliste bekommen. Alle übrigen Angaben MUST unverändert bleiben.

#### Scenario: Sicherung ohne Räume
- **GIVEN** „sicherung.json“ hat Version 3 mit 14 Formen im Erdgeschoss
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat das Erdgeschoss seine 14 Formen und keine Räume

### Requirement: Türen und Fenster aus der Datei
Das System SHALL die gültigen Öffnungen jedes übernommenen Raums aus der Datei übernehmen. Ungültige Öffnungen MUST NOT übernommen werden; der Raum selbst wird trotzdem übernommen. Der Dialog SHALL jede ungültige Öffnung einzeln mit Art, Raum, Etage und einem deutschen Grund auflisten. Fehlt die Liste der Öffnungen eines Raums, SHALL er ohne Hinweis keine Öffnungen haben.

#### Scenario: Fenster passt nicht
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss eine 180 cm lange Kante mit einem Fenster der Breite 120 cm und dem Abstand 100 cm
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Fenster in „Bad“ (Obergeschoss): passt nicht auf die Kante“
- **WHEN** der Nutzer bestätigt
- **THEN** gibt es den Raum „Bad“ ohne dieses Fenster

#### Scenario: Tür ohne Aufschlag
- **GIVEN** in der Datei hat der Raum „Flur“ im Erdgeschoss eine Tür ohne Angabe zum Aufschlag
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Tür in „Flur“ (Erdgeschoss): Aufschlag fehlt“
- **AND** nach dem Bestätigen hat „Flur“ diese Tür nicht

#### Scenario: Unbekannte Kante
- **GIVEN** in der Datei hat ein Raum „Flur“ mit 4 Ecken eine Tür auf der achten Kante
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Tür in „Flur“ (Erdgeschoss): Kante unbekannt“

#### Scenario: Durchgang mit Aufschlag
- **GIVEN** in der Datei hat der Raum „Eltern“ im Obergeschoss einen Durchgang mit Aufschlag nach innen
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „Durchgang in „Eltern“ (Obergeschoss): Aufschlag ungültig“
- **AND** nach dem Bestätigen hat „Eltern“ diesen Durchgang nicht

### Requirement: Türen und Fenster im Prüfergebnis
Der Dialog „Ergebnis der Prüfung“ SHALL die Zahl der übernommenen Türen und Fenster insgesamt nennen, sofern die Datei Räume enthält. Enthält die Datei gültige Durchgänge, SHALL der Dialog auch deren Zahl nennen.

#### Scenario: Zählung
- **GIVEN** die Datei enthält Räume mit zusammen 7 gültigen Türen und 4 gültigen Fenstern
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „7 Türen und 4 Fenster werden übernommen“

#### Scenario: Zählung mit Durchgängen
- **GIVEN** die Datei enthält Räume mit zusammen 7 gültigen Türen, 4 gültigen Fenstern und 1 gültigen Durchgang
- **WHEN** der Nutzer sie importiert
- **THEN** zeigt der Dialog „7 Türen, 4 Fenster und 1 Durchgang werden übernommen“

### Requirement: Doppelte IDs von Öffnungen
Kommt die ID einer Öffnung in der Datei mehrfach vor, SHALL die zuerst gefundene Öffnung ihre ID behalten und jede weitere eine neue, eindeutige ID bekommen und übernommen werden. Der Dialog MUST die Zahl dieser Öffnungen nennen.

#### Scenario: Kopiertes Fenster
- **GIVEN** zwei Fenster in der Datei haben dieselbe ID
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** meldet der Dialog vorher, dass 1 Tür oder Fenster eine neue ID bekommt
- **AND** danach haben beide Fenster verschiedene IDs

### Requirement: Dateien der Version 4
Eine Datei der Formatversion 4 SHALL beim Umwandeln für jeden Raum eine leere Liste von Öffnungen bekommen. Räume, Formen, Etagen und Vorlagen MUST dabei unverändert bleiben.

#### Scenario: Pläne ohne Öffnungen
- **GIVEN** „raeume.json“ hat Version 4 und im Erdgeschoss die Räume „Wohnen“ und „Flur“
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** gibt es beide Räume mit unveränderten Ecken und ohne Türen und Fenster

### Requirement: Wanddicken aus der Datei
Das System SHALL die Wanddicken jedes übernommenen Raums aus der Datei übernehmen. Fehlt die Wanddicke einer Kante oder ist sie ungültig (keine Zahl, nicht größer als 0 cm oder über 100 cm), SHALL diese Kante 15 cm bekommen. Überzählige Werte MUST verworfen werden. Der Raum MUST trotzdem übernommen werden, und der Dialog SHALL ihn mit Name, Etage und dem Hinweis „Wanddicke ungültig, 15 cm verwendet“ auflisten.

#### Scenario: Wand zu dick
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss vier Kanten mit den Wanddicken 15 cm, 15 cm, 250 cm und 15 cm
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „„Bad“ (Obergeschoss): Wanddicke ungültig, 15 cm verwendet“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** hat „Bad“ an allen vier Kanten 15 cm Wanddicke und unveränderte Eckpunkte

#### Scenario: Zu wenige Werte
- **GIVEN** in der Datei hat der Raum „Flur“ sechs Kanten, aber nur vier Wanddicken mit je 24 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** hat „Flur“ an den Kanten 1 bis 4 die Wanddicke 24 cm und an den Kanten 5 und 6 15 cm

### Requirement: Dateien der Version 5
Eine Datei der Formatversion 5 SHALL beim Umwandeln für jede Kante jedes Raums die Wanddicke 15 cm bekommen. Räume, Öffnungen, Formen, Etagen und Vorlagen MUST dabei unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Wanddicken
- **GIVEN** „sicherung.json“ hat Version 5 und im Erdgeschoss den Raum „Wohnen“ mit vier Ecken und einer Tür
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Wohnen“ unveränderte Ecken, die Tür und an jeder Kante 15 cm Wanddicke

### Requirement: Dateien der Version 6
Eine Datei der Formatversion 6 SHALL beim Umwandeln unverändert übernommen werden: Räume, Wanddicken, Öffnungen, Formen, Etagen und Vorlagen MUST gleich bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Durchgänge
- **GIVEN** „sicherung.json“ hat Version 6 mit dem Raum „Wohnen“, einer Tür und einem Fenster
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Wohnen“ unverändert seine Ecken, Wanddicken, die Tür und das Fenster

### Requirement: Raumfarbe aus der Datei
Das System SHALL die Raumfarbe jedes übernommenen Raums aus der Datei übernehmen. Fehlt sie, SHALL der Raum ohne Hinweis keine Raumfarbe haben. Ist sie ungültig, SHALL der Raum ohne Raumfarbe übernommen werden, und der Dialog SHALL ihn mit Name, Etage und dem Hinweis „Farbe ungültig, Standard verwendet“ auflisten.

#### Scenario: Farbe als Wort
- **GIVEN** in der Datei hat der Raum „Bad“ im Obergeschoss die Raumfarbe „blau“
- **WHEN** der Nutzer die Datei importiert
- **THEN** listet der Dialog „„Bad“ (Obergeschoss): Farbe ungültig, Standard verwendet“
- **WHEN** der Nutzer bestätigt
- **THEN** gibt es „Bad“ mit unveränderten Ecken und ohne Raumfarbe

### Requirement: Dateien der Version 7
Eine Datei der Formatversion 7 SHALL beim Umwandeln für jeden Raum „keine Raumfarbe“ bekommen. Alle übrigen Angaben MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Farben
- **GIVEN** „sicherung.json“ hat Version 7 mit den Räumen „Wohnen“ und „Eltern“, „Eltern“ hat einen Durchgang
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** sind beide Räume halbtransparent weiß, „Eltern“ hat weiter den Durchgang

### Requirement: Einstellungen aus der Datei
Das System SHALL die Einstellungen aus der Datei übernehmen; nach dem Bestätigen ersetzen sie die bisherigen Einstellungen. Fehlt ein Einzelwert oder ist er ungültig, SHALL dafür die Werkseinstellung gelten, und der Dialog SHALL jeden solchen Wert mit seinem Namen und dem Hinweis „ungültig, Werkseinstellung verwendet“ auflisten. Fehlen die Einstellungen ganz, gelten ohne Hinweis die Werkseinstellungen.

#### Scenario: Einstellungen werden übernommen
- **GIVEN** in der App ist der Fangschritt 5 cm, in der Datei 2,5 cm und die Wanddicke neuer Räume 11,5 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist der Fangschritt 2,5 cm und die Wanddicke neuer Räume 11,5 cm

#### Scenario: Ungültiger Rasterabstand
- **GIVEN** in der Datei ist der Rasterabstand 0 cm, alle anderen Einstellungen sind gültig
- **WHEN** der Nutzer sie importiert
- **THEN** listet der Dialog „Einstellung „Rasterabstand“: ungültig, Werkseinstellung verwendet“
- **AND** die Hauptschaltfläche heißt „Trotzdem importieren“
- **WHEN** der Nutzer bestätigt
- **THEN** ist der Rasterabstand 100 cm und die übrigen Einstellungen kommen aus der Datei

### Requirement: Dateien der Version 8
Eine Datei der Formatversion 8 SHALL beim Umwandeln die Werkseinstellungen bekommen. Alle übrigen Angaben MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Einstellungen
- **GIVEN** „sicherung.json“ hat Version 8 mit eingefärbten Räumen
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat der Plan die Werkseinstellungen und die Räume haben unverändert ihre Farben

### Requirement: Dateien der Version 9
Eine Datei der Formatversion 9 SHALL beim Umwandeln für jede Öffnung „keine gemerkten Maße“ bekommen. Alle übrigen Angaben einschließlich der Einstellungen MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne gemerkte Maße
- **GIVEN** „sicherung.json“ hat Version 9 mit dem Raum „Eltern“, der eine Tür und einen Durchgang über die ganze 330 cm lange Kante hat
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** hat „Eltern“ unverändert die Tür und den Durchgang mit Breite 330 cm
- **AND** beim Abhaken von „Ganze Kante“ wird der Durchgang 100 cm breit, mittig auf der Kante

### Requirement: Gemerkte Maße aus der Datei
Das System SHALL die gemerkten Maße jedes übernommenen Durchgangs und Fensters aus der Datei übernehmen. Fehlen sie, sind sie ungültig oder gehören sie zu einer Tür, SHALL die Öffnung ohne gemerkte Maße und ohne Hinweis übernommen werden; die Öffnung selbst MUST NOT deshalb verworfen werden.

#### Scenario: Gemerkte Maße beim Fenster
- **GIVEN** in der Datei nimmt ein Fenster in „Wohnen“ die ganze 500 cm lange Kante ein und hat die gemerkten Maße Breite 120 cm und Abstand 190 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **AND** nach dem Abhaken von „Ganze Kante“ hat das Fenster die Breite 120 cm und den Abstand 190 cm

#### Scenario: Gemerkte Maße bei der Tür
- **GIVEN** in der Datei hat der Raum „Bad“ eine Tür mit Breite 80 cm und gemerkten Maßen
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **WHEN** der Nutzer bestätigt
- **THEN** hat „Bad“ die Tür mit Breite 80 cm und ohne gemerkte Maße

#### Scenario: Negative gemerkte Breite
- **GIVEN** in der Datei hat ein Durchgang über die ganze Kante die gemerkte Breite -10 cm
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist der Durchgang vorhanden und hat keine gemerkten Maße

### Requirement: Dateien der Version 10
Eine Datei der Formatversion 10 SHALL beim Umwandeln für jeden Raum „nicht gesperrt“ bekommen. Alle übrigen Angaben einschließlich Einstellungen, Öffnungen und gemerkter Maße MUST unverändert bleiben, und die Umwandlung allein MUST keine Warnung erzeugen.

#### Scenario: Plan ohne Raum-Sperren
- **GIVEN** „sicherung.json“ hat Version 10 mit den Räumen „Wohnen“ (mit Tür) und „Bad“ (rot eingefärbt)
- **WHEN** der Nutzer sie importiert und bestätigt
- **THEN** sind „Wohnen“ und „Bad“ nicht gesperrt
- **AND** „Wohnen“ hat unverändert seine Tür und „Bad“ ist weiter rot

#### Scenario: Gespeicherter Plan der Version 10
- **GIVEN** im Browser ist ein Plan der Version 10 mit dem Raum „Flur“ gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Flur“ unverändert vorhanden und nicht gesperrt
- **AND** es erscheint keine Hinweisleiste

### Requirement: Sperre eines Raums aus der Datei
Das System SHALL die Sperre jedes übernommenen Raums aus der Datei übernehmen. Fehlt die Angabe oder ist sie ungültig, SHALL der Raum ohne Hinweis als nicht gesperrt übernommen werden; der Raum selbst MUST NOT deshalb verworfen werden.

#### Scenario: Gesperrter Raum in der Datei
- **GIVEN** in der Datei ist der Raum „Wohnen“ gesperrt
- **WHEN** der Nutzer die Datei importiert und bestätigt
- **THEN** ist „Wohnen“ gesperrt

#### Scenario: Ungültige Sperrangabe
- **GIVEN** in der Datei der Version 11 hat der Raum „Bad“ als Sperrangabe den Text „ja“
- **WHEN** der Nutzer die Datei importiert
- **THEN** zeigt der Dialog dazu keinen Hinweis
- **WHEN** der Nutzer bestätigt
- **THEN** ist „Bad“ mit unveränderten Ecken vorhanden und nicht gesperrt
