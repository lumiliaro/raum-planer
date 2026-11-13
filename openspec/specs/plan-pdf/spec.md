# plan-pdf Specification

## Purpose

Legt fest, wie der Grundriss als PDF-Datei aus der App herauskommt – je Etage eine DIN-A4-Seite, maßstabsgetreu oder eingepasst –, damit er ausgedruckt, weitergegeben und mit dem Lineal nachgemessen werden kann.

## Requirements

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

### Requirement: Mindestens eine Etage
Ist keine Etage angehakt, MUST „PDF erstellen“ gesperrt sein und der Dialog den Hinweis „Bitte mindestens eine Etage auswählen“ zeigen.

#### Scenario: Keine Etage gewählt
- **GIVEN** der Dialog ist offen
- **WHEN** der Nutzer alle Etagen-Häkchen entfernt
- **THEN** ist „PDF erstellen“ gesperrt und der Hinweis „Bitte mindestens eine Etage auswählen“ erscheint

### Requirement: PDF herunterladen
„PDF erstellen“ SHALL ohne Netzwerkaufruf eine PDF-Datei `YYYY-MM-DD-<name>-grundriss.pdf` herunterladen (lokales Datum, Name wie beim Plan-Export gebildet) und danach den Dialog schließen. Der Plan MUST unverändert bleiben und kein Schritt im Verlauf (Rückgängig) entstehen.

#### Scenario: Datei herunterladen
- **GIVEN** der Plan heißt „Umzug“
- **WHEN** der Nutzer am 12.11.2026 im Dialog „PDF erstellen“ anklickt
- **THEN** lädt der Browser `2026-11-12-umzug-grundriss.pdf` herunter und der Dialog schließt sich
- **AND** „Rückgängig“ macht danach nichts rückgängig, was vor dem Öffnen des Dialogs nicht schon rückgängig zu machen war

### Requirement: PDF wird erstellt
Während des Erstellens SHALL die Schaltfläche „PDF erstellen“ gesperrt sein und „Wird erstellt …“ mit einem Ladesymbol zeigen; `Esc` und „Abbrechen“ MUST dann nichts bewirken. Schlägt das Erstellen fehl, MUST der Dialog offen bleiben mit dem Hinweis „PDF konnte nicht erstellt werden“. Kann die PDF-Funktion nicht nachgeladen werden (z. B. weil die App inzwischen neu ausgeliefert wurde), MUST der Dialog offen bleiben mit dem Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“. In beiden Fehlerfällen MUST nichts heruntergeladen werden, und eine Änderung an den Einstellungen des Dialogs MUST den Hinweis entfernen.

#### Scenario: Während des Erstellens
- **GIVEN** der Nutzer hat „PDF erstellen“ angeklickt und die Datei wird noch erstellt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** bleibt der Dialog offen und die Schaltfläche zeigt „Wird erstellt …“ mit Ladesymbol

#### Scenario: Erstellen schlägt fehl
- **GIVEN** die PDF-Funktion ist geladen und beim Erstellen des PDFs tritt ein Fehler auf
- **WHEN** das Erstellen abbricht
- **THEN** bleibt der Dialog offen mit dem Hinweis „PDF konnte nicht erstellt werden“ und es wird nichts heruntergeladen

#### Scenario: PDF-Funktion kann nicht geladen werden
- **GIVEN** die App wurde in einer älteren Version geöffnet und die nachzuladende PDF-Funktion ist nicht mehr abrufbar
- **WHEN** der Nutzer „PDF erstellen“ anklickt
- **THEN** bleibt der Dialog offen mit dem Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“, die Schaltfläche „PDF erstellen“ ist wieder bedienbar und es wird nichts heruntergeladen

#### Scenario: Hinweis verschwindet bei Änderung
- **GIVEN** der Dialog zeigt den Hinweis „PDF-Funktion konnte nicht geladen werden – bitte Seite neu laden“
- **WHEN** der Nutzer den Maßstab von 1:100 auf 1:50 ändert
- **THEN** ist der Hinweis verschwunden

### Requirement: Eine Seite je Etage
Die PDF-Datei SHALL je angehakter Etage genau eine Seite enthalten, in der Reihenfolge der Etagen im Plan. Alle Seiten MUST DIN A4 (21,0 cm × 29,7 cm) im gewählten Format haben.

#### Scenario: Zwei von drei Etagen
- **GIVEN** der Plan hat „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“ und im Dialog sind „Erdgeschoss“ und „Dachgeschoss“ angehakt, „Querformat“ gewählt
- **WHEN** der Nutzer „PDF erstellen“ anklickt
- **THEN** hat die Datei 2 Seiten im Querformat 29,7 cm × 21,0 cm
- **AND** Seite 1 zeigt das Erdgeschoss, Seite 2 das Dachgeschoss

### Requirement: Seitenaufbau
Jede Seite SHALL mit 1 cm Rand oben eine Kopfzeile zeigen – links Planname und Etagenname („Umzug – Erdgeschoss“), rechts das Druckdatum (TT.MM.JJJJ) –, unten eine Fußzeile mit dem Maßstab als Text und dem Maßstabsbalken und dazwischen den Zeichenbereich: im Hochformat 19 cm × 25 cm, im Querformat 27,7 cm × 16,3 cm. Der Inhalt der Etage MUST im Zeichenbereich zentriert sein.

#### Scenario: Kopfzeile
- **GIVEN** der Plan heißt „Umzug“
- **WHEN** der Nutzer am 12.11.2026 ein PDF des Erdgeschosses erstellt
- **THEN** steht oben links „Umzug – Erdgeschoss“ und oben rechts „12.11.2026“

#### Scenario: Zentrierter Inhalt
- **GIVEN** das Erdgeschoss besteht aus einem Raum 400 cm × 300 cm mit 15 cm Wanddicke an jeder Kante
- **WHEN** der Nutzer ein PDF im Hochformat mit Maßstab 1:100 erstellt
- **THEN** ist der Raum mit Wänden (430 cm × 330 cm) auf dem Papier 4,3 cm × 3,3 cm groß und liegt in der Mitte des Zeichenbereichs

### Requirement: Fester Maßstab
Bei „1:50“ bzw. „1:100“ SHALL 1 cm auf dem Papier 50 cm bzw. 100 cm im Plan entsprechen; die Fußzeile MUST „Maßstab 1:50“ bzw. „Maßstab 1:100“ zeigen. Als Inhalt der Etage zählen die Räume mit ihren Wänden, bei „Möbel“ zusätzlich die Möbel und bei „Vorlage“ zusätzlich die Vorlage, wenn ihr Bild vorhanden ist.

#### Scenario: Wand messen
- **GIVEN** ein Raum hat eine 500 cm lange Kante
- **WHEN** der Nutzer ein PDF mit Maßstab 1:50 erstellt
- **THEN** ist diese Kante auf dem Papier 10 cm lang
- **AND** in der Fußzeile steht „Maßstab 1:50“

### Requirement: Etage passt nicht auf die Seite
Ist bei festem Maßstab der Inhalt einer angehakten Etage größer als der Zeichenbereich, SHALL der Dialog den Hinweis „Passt nicht auf die Seite: <Etagen>“ zeigen und „PDF erstellen“ MUST gesperrt sein. Der Hinweis MUST sich sofort an jede Änderung von Etagen, Format, Maßstab und Inhalt anpassen.

#### Scenario: Zu groß für 1:50
- **GIVEN** der Inhalt des Erdgeschosses ist 1200 cm breit und 900 cm tief
- **WHEN** der Nutzer im Dialog „Hochformat“ und „1:50“ wählt
- **THEN** erscheint „Passt nicht auf die Seite: Erdgeschoss“ und „PDF erstellen“ ist gesperrt
- **WHEN** der Nutzer „Querformat“ wählt
- **THEN** verschwindet der Hinweis nicht, weil 24 cm × 18 cm größer als 27,7 cm × 16,3 cm ist
- **WHEN** der Nutzer „1:100“ wählt
- **THEN** verschwindet der Hinweis und „PDF erstellen“ ist wieder möglich

#### Scenario: Möbel außerhalb der Räume
- **GIVEN** bei Maßstab 1:100 im Hochformat passen die Räume des Erdgeschosses auf die Seite, ein Möbel liegt aber 3000 cm entfernt
- **WHEN** „Möbel“ angehakt ist
- **THEN** erscheint „Passt nicht auf die Seite: Erdgeschoss“
- **WHEN** der Nutzer „Möbel“ abwählt
- **THEN** verschwindet der Hinweis

### Requirement: Auf Seite einpassen
Bei „Auf Seite einpassen“ SHALL jede Etage den Maßstab 1:N mit der kleinsten ganzen Zahl N bekommen, bei der ihr Inhalt in den Zeichenbereich passt; die Fußzeile MUST „Maßstab 1:N“ zeigen. Jede Etage MUST ihren eigenen Maßstab haben. Eine Etage ohne Inhalt MUST im Maßstab 1:100 gedruckt werden.

#### Scenario: Einpassen im Querformat
- **GIVEN** der Inhalt des Erdgeschosses ist 1385 cm breit und 500 cm tief
- **WHEN** der Nutzer ein PDF im Querformat mit „Auf Seite einpassen“ erstellt
- **THEN** zeigt die Seite das Erdgeschoss im Maßstab 1:50, 27,7 cm × 10 cm groß
- **AND** in der Fußzeile steht „Maßstab 1:50“

#### Scenario: Ungerader Maßstab
- **GIVEN** der Inhalt des Obergeschosses ist 2000 cm breit und 1000 cm tief
- **WHEN** der Nutzer ein PDF im Hochformat mit „Auf Seite einpassen“ erstellt
- **THEN** steht in der Fußzeile „Maßstab 1:106“

### Requirement: Maßstabsbalken
Die Fußzeile SHALL einen Maßstabsbalken zeigen, beschriftet mit „0“ am Anfang und seiner Länge in Metern am Ende. Seine Länge MUST die größte aus 1 m, 2 m, 5 m, 10 m, 20 m und 50 m sein, die auf dem Papier höchstens 10 cm lang ist, und MUST auf dem Papier genau dieser Länge im Maßstab der Seite entsprechen.

#### Scenario: Balken bei 1:100
- **WHEN** der Nutzer ein PDF mit Maßstab 1:100 erstellt
- **THEN** ist der Maßstabsbalken 10 cm lang und mit „0“ und „10 m“ beschriftet

#### Scenario: Balken bei 1:50
- **WHEN** der Nutzer ein PDF mit Maßstab 1:50 erstellt
- **THEN** ist der Maßstabsbalken 10 cm lang und mit „0“ und „5 m“ beschriftet

### Requirement: Inhalt der Zeichnung
Jede Seite SHALL die Räume der Etage in Farbe wie im Editor zeigen: Raumfläche in der Raumfarbe, die Wände als Band in der Wandfarbe des Plans, Türen mit Aufschlag, Fenster und Durchgänge. Die freien Wände der Etage SHALL wie im Editor als Band in der Wandfarbe über den Räumen erscheinen und beim Bemessen der Zeichnung mitzählen. Auswahl-Markierungen, Fanghilfen und Hervorhebungen des Editors MUST NOT erscheinen.

#### Scenario: Raum mit Tür
- **GIVEN** im Erdgeschoss ist ein Raum ausgewählt, der eine Tür mit 80 cm Breite und einen Aufschlag hat
- **WHEN** der Nutzer ein PDF des Erdgeschosses erstellt
- **THEN** zeigt die Seite den Raum mit Wandband, die Türöffnung von 80 cm mit Türblatt und Aufschlag
- **AND** die blaue Auswahl-Umrandung ist nicht zu sehen

#### Scenario: Freie Wand
- **GIVEN** im Erdgeschoss ist eine Wand von (0 cm, 0 cm) nach (0 cm, 300 cm) mit 11,5 cm Dicke ausgewählt
- **WHEN** der Nutzer ein PDF des Erdgeschosses erstellt
- **THEN** zeigt die Seite die Wand als Band in der Wandfarbe ohne Griffe und ohne Auswahl-Umrandung

### Requirement: Möbel im PDF
Ist „Möbel“ angehakt, SHALL jede Seite die Möbel der Etage in ihrer Zeichenreihenfolge über den Räumen zeigen, mit Form, Farben, Deckkraft und Beschriftung wie im Editor. Ist „Möbel“ nicht angehakt, MUST keine Möbel erscheinen.

#### Scenario: Ohne Möbel
- **GIVEN** im Erdgeschoss steht ein Bett mit Breite 180 cm und Tiefe 200 cm
- **WHEN** der Nutzer „Möbel“ abwählt und das PDF erstellt
- **THEN** zeigt die Seite die Räume, aber nicht das Bett

### Requirement: Raumnamen und Fläche im PDF
Ist „Raumnamen und Fläche“ angehakt, SHALL in jedem Raum an der Stelle seines Namens im Editor der Raumname und darunter die Innenfläche in m² mit zwei Nachkommastellen und Komma stehen. Hat der Raum keinen Namen, MUST nur die Fläche stehen. Ist das Häkchen nicht gesetzt, MUST weder Name noch Fläche erscheinen.

#### Scenario: Name und Fläche
- **GIVEN** der Raum „Küche“ ist innen 400 cm × 312,5 cm groß
- **WHEN** der Nutzer das PDF mit „Raumnamen und Fläche“ erstellt
- **THEN** steht im Raum „Küche“ und darunter „12,50 m²“

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

### Requirement: Vorlage im PDF
Ist „Vorlage“ angehakt, SHALL jede Seite die Vorlage der Etage unter den Räumen mit ihrer Kalibrierung und Deckkraft zeigen, auch wenn sie im Editor ausgeblendet ist. Fehlt das Vorlagenbild im Browser, MUST die Seite ohne Vorlage erstellt werden. Ist „Vorlage“ nicht angehakt, MUST keine Vorlage erscheinen.

#### Scenario: Vorlage mit Deckkraft
- **GIVEN** das Erdgeschoss hat eine kalibrierte Vorlage mit 50 % Deckkraft, die im Editor ausgeblendet ist
- **WHEN** der Nutzer „Vorlage“ anhakt und das PDF erstellt
- **THEN** zeigt die Seite des Erdgeschosses das Vorlagenbild mit 50 % Deckkraft passend unter den Räumen

#### Scenario: Bild fehlt
- **GIVEN** das Obergeschoss hat eine Vorlage, deren Bild nicht im Browser vorhanden ist
- **WHEN** der Nutzer „Vorlage“ anhakt und das PDF erstellt
- **THEN** wird die Seite des Obergeschosses ohne Vorlage erstellt

### Requirement: Raster im PDF
Ist „Raster“ angehakt, SHALL der ganze Zeichenbereich jeder Seite ein hellgraues Raster im Rasterabstand der Einstellungen zeigen, ausgerichtet an 0 cm der Plan-Koordinaten und unter den Räumen. Ist „Raster“ nicht angehakt, MUST kein Raster erscheinen.

#### Scenario: Raster 100 cm bei 1:100
- **GIVEN** der Rasterabstand in den Einstellungen ist 100 cm
- **WHEN** der Nutzer das PDF mit Maßstab 1:100 und „Raster“ erstellt
- **THEN** liegen die Rasterlinien auf dem Papier 1 cm auseinander

### Requirement: Etage ohne Inhalt
Eine angehakte Etage ohne Räume und – je nach Auswahl – ohne Möbel und ohne Vorlage SHALL trotzdem eine Seite mit Kopf- und Fußzeile bekommen; der Zeichenbereich MUST mittig den Text „Keine Räume auf dieser Etage“ zeigen.

#### Scenario: Leeres Dachgeschoss
- **GIVEN** das Dachgeschoss hat keine Räume und keine Möbel
- **WHEN** der Nutzer ein PDF mit angehaktem Dachgeschoss erstellt
- **THEN** hat die Datei eine Seite „Umzug – Dachgeschoss“ mit dem Text „Keine Räume auf dieser Etage“
