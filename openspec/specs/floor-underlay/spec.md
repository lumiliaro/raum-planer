# floor-underlay Specification

## Purpose

Erlaubt, unter eine Etage ein eingescanntes Grundrissbild als Vorlage zu legen, sie maßstabsgetreu und gerade in die cm-Welt einzupassen, nach Bedarf auszublenden und das Bild dauerhaft im Browser sowie in Export-Dateien mitzuführen.

## Requirements

### Requirement: Vorlage einer Etage
Jede Etage SHALL höchstens eine Vorlage haben. Eine Vorlage besteht aus einem Bild, ihrer Kalibrierung (falls vorhanden), der Angabe „Sichtbar“ und einer Deckkraft. Eine Etage ohne Vorlage MUST vollständig bedienbar sein: Möbel lassen sich einfügen und bearbeiten.

#### Scenario: Etage ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** der Nutzer „Rechteck“ wählt und bei x = 120 cm, y = 80 cm klickt
- **THEN** liegt dort ein Rechteck mit Breite 100 cm und Tiefe 60 cm

### Requirement: Abschnitt „Vorlage“ im Eigenschaften-Panel
Ist keine Form ausgewählt, SHALL das Eigenschaften-Panel den Abschnitt „Vorlage“ für die aktive Etage zeigen. Ohne Vorlage enthält er nur „Bild hochladen“. Mit Vorlage zeigt er den Dateistatus, „Bild ersetzen“, „Vorlage entfernen“, den Schalter „Sichtbar“, den Regler „Deckkraft“, Maßstab und Ausrichtung sowie „Vorlage kalibrieren“.

#### Scenario: Ohne Vorlage
- **GIVEN** die aktive Etage hat keine Vorlage und keine Form ist ausgewählt
- **THEN** zeigt das Panel den Abschnitt „Vorlage“ mit „Bild hochladen“

#### Scenario: Mit kalibrierter Vorlage
- **GIVEN** das Erdgeschoss hat eine sichtbare Vorlage mit 0,9986 px/cm und waagerechter Ausrichtung, keine Form ist ausgewählt
- **THEN** zeigt der Abschnitt „Vorlage“ „Maßstab: 0,9986 px/cm“, „Ausrichtung: waagerecht“, „Sichtbar“ eingeschaltet und „Deckkraft 100 %“

### Requirement: Bild hochladen
„Bild hochladen“ SHALL eine Dateiauswahl für PNG, JPEG und WebP öffnen. Ein lesbares Bild bis 20 MB MUST als Vorlage der aktiven Etage übernommen werden: sichtbar, Deckkraft 100 %, ohne Kalibrierung. Danach SHALL der Kalibrier-Modus starten. Andere Dateitypen, größere oder unlesbare Dateien MUST mit einem Hinweis abgelehnt werden; die Vorlage bleibt dann unverändert.

#### Scenario: Scan hochladen
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** der Nutzer „Bild hochladen“ anklickt und „keller.png“ mit 1240 × 1754 Pixeln wählt
- **THEN** liegt das Bild unter der Etage, seine linke obere Ecke bei (0 cm, 0 cm), 1 Bildpixel = 1 cm
- **AND** der Kalibrier-Modus für den Keller ist aktiv
- **AND** die Statusleiste zeigt „Vorlage nicht kalibriert“, sobald der Modus ohne Speichern beendet wird

#### Scenario: Falscher Dateityp
- **WHEN** der Nutzer „plan.pdf“ wählt
- **THEN** erscheint der Hinweis „Bitte ein Bild im Format PNG, JPEG oder WebP wählen.“
- **AND** die Etage hat weiterhin keine Vorlage

#### Scenario: Zu großes Bild
- **WHEN** der Nutzer ein Bild mit 25 MB wählt
- **THEN** erscheint der Hinweis „Das Bild ist größer als 20 MB.“
- **AND** die Vorlage bleibt unverändert

### Requirement: Bild ersetzen
„Bild ersetzen“ SHALL das Bild der Vorlage austauschen; Sichtbarkeit und Deckkraft bleiben. Hatte die Vorlage kein vorhandenes Bild oder hat das neue Bild dieselben Pixelmaße wie das bisherige, MUST die Kalibrierung samt Ausrichtung erhalten bleiben. Sonst MUST vorher nachgefragt werden, ob die Kalibrierung zurückgesetzt werden darf; „Abbrechen“ lässt die Vorlage unverändert.

#### Scenario: Gleiche Pixelmaße
- **GIVEN** das Erdgeschoss hat eine Vorlage mit einem Bild von 1240 × 1754 Pixeln und 0,9986 px/cm
- **WHEN** der Nutzer ein anderes Bild mit 1240 × 1754 Pixeln wählt
- **THEN** zeigt die Vorlage das neue Bild mit weiterhin 0,9986 px/cm

#### Scenario: Andere Pixelmaße
- **GIVEN** das Erdgeschoss hat eine kalibrierte Vorlage mit 1240 × 1754 Pixeln
- **WHEN** der Nutzer ein Bild mit 2480 × 3508 Pixeln wählt
- **THEN** fragt das System, ob die Kalibrierung zurückgesetzt werden soll
- **WHEN** der Nutzer bestätigt
- **THEN** zeigt die Vorlage das neue Bild und ist nicht kalibriert

### Requirement: Vorlage entfernen
„Vorlage entfernen“ SHALL die Vorlage der aktiven Etage samt Kalibrierung ohne Rückfrage entfernen. Möbel der Etage MUST an ihrer Stelle in cm bleiben. Der Schritt lässt sich rückgängig machen.

#### Scenario: Entfernen und zurückholen
- **GIVEN** das Erdgeschoss hat eine kalibrierte Vorlage und ein Sofa bei x = 300 cm, y = 200 cm
- **WHEN** der Nutzer „Vorlage entfernen“ anklickt
- **THEN** ist kein Bild mehr zu sehen, das Raster erscheint und das Sofa liegt weiter bei x = 300 cm, y = 200 cm
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** ist die Vorlage mit Bild und Kalibrierung wieder da

### Requirement: Vorlage ein- und ausblenden
Der Schalter „Sichtbar“ und die Taste `B` SHALL die Vorlage der aktiven Etage ein- bzw. ausblenden. Eine ausgeblendete Vorlage MUST nicht gezeichnet werden; Kalibrierung und Bild bleiben erhalten. Die Taste MUST wirkungslos sein, solange ein Eingabefeld den Fokus hat oder die Etage keine Vorlage hat. Im Kalibrier-Modus MUST die Vorlage immer sichtbar und voll deckend sein.

#### Scenario: Ausblenden per Taste
- **GIVEN** das Erdgeschoss hat eine sichtbare Vorlage
- **WHEN** der Nutzer `B` drückt
- **THEN** ist die Vorlage nicht mehr zu sehen und der Schalter „Sichtbar“ ist aus
- **AND** das 1-m-Raster erscheint

#### Scenario: Kalibrieren einer ausgeblendeten Vorlage
- **GIVEN** die Vorlage des Erdgeschosses ist ausgeblendet
- **WHEN** der Nutzer „Vorlage kalibrieren“ anklickt
- **THEN** ist das Bild während des Kalibrier-Modus voll deckend zu sehen
- **AND** nach dem Beenden ist es wieder ausgeblendet

### Requirement: Deckkraft der Vorlage
Der Regler „Deckkraft“ SHALL die Deckkraft der Vorlage von 10 % bis 100 % in 5-%-Schritten einstellen. Der Wert MUST beim Loslassen übernommen werden und gilt nur für die Vorlage, nicht für Möbel.

#### Scenario: Halbtransparent nachzeichnen
- **WHEN** der Nutzer den Regler auf 40 % zieht und loslässt
- **THEN** ist die Vorlage zu 40 % deckend
- **AND** die Möbel bleiben voll deckend

### Requirement: Lage der Vorlage in der cm-Welt
Eine Vorlage ohne Kalibrierung SHALL mit 1 Bildpixel = 1 cm und ihrer linken oberen Ecke bei (0 cm, 0 cm) liegen. Mit Kalibrierung SHALL ein Bildpixel 1 / Maßstab cm groß sein. Ohne Ausrichtung MUST Bildpixel (0, 0) bei (0 cm, 0 cm) liegen. Mit Ausrichtung MUST die Vorlage um ihre Bildmitte so gedreht sein, dass die Messstrecke genau waagerecht bzw. senkrecht liegt, mit der kleinsten nötigen Drehung.

#### Scenario: Kalibriert ohne Ausrichtung
- **GIVEN** die Vorlage ist mit 0,5 px/cm ohne Ausrichtung kalibriert
- **THEN** liegt Bildpixel x 100 · y 50 bei x = 200 cm, y = 100 cm

#### Scenario: Schiefer Scan
- **GIVEN** die Messstrecke läuft von Bildpixel x 100 · y 100 nach x 1100 · y 120 und die Ausrichtung ist „waagerecht“
- **THEN** ist die Vorlage um etwa −1,1° um ihre Bildmitte gedreht
- **AND** beide Endpunkte der Strecke liegen in der Ansicht auf gleicher Höhe

#### Scenario: Um 90° gedrehter Scan
- **GIVEN** die Messstrecke läuft senkrecht im Bild und die Ausrichtung ist „waagerecht“
- **THEN** ist die Vorlage um 90° gedreht und die Strecke liegt waagerecht

### Requirement: Vorlagenbild fehlt
Verweist die Vorlage der aktiven Etage auf kein oder ein im Browser nicht vorhandenes Bild, SHALL die Zeichenfläche den Hinweis „Vorlage fehlt – Bild laden“ mit der Schaltfläche „Bild laden“ zeigen; die Statusleiste zeigt „Vorlage fehlt“. Kalibrierung, Ausrichtung, Sichtbarkeit und Deckkraft MUST erhalten bleiben, Möbel bleiben bedienbar. „Bild laden“ wirkt wie „Bild ersetzen“.

#### Scenario: Nach dem Umstieg
- **GIVEN** das Erdgeschoss hat nach der Umwandlung von Version 2 eine Vorlage ohne Bild mit 0,9986 px/cm
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Zeichenfläche „Vorlage fehlt – Bild laden“ und darunter die Möbel des Erdgeschosses
- **WHEN** der Nutzer „Bild laden“ anklickt und `eg.png` wählt
- **THEN** liegt der Scan wieder unter den Möbeln wie vor dem Umstieg, mit 0,9986 px/cm und ohne Rückfrage

### Requirement: Vorlagenbilder im Browser speichern
Das System SHALL jedes übernommene Vorlagenbild im Browser getrennt vom Plan speichern, sodass es nach dem Neuladen wieder erscheint, auch wenn es größer ist als der für den Plan verfügbare Speicher. Dasselbe Bild MUST nur einmal gespeichert werden, auch wenn mehrere Etagen es verwenden. Kann ein Bild nicht gespeichert werden, MUST es für die laufende Sitzung sichtbar bleiben.

#### Scenario: Neuladen
- **GIVEN** der Nutzer hat für das Erdgeschoss ein Bild mit 8 MB hochgeladen
- **WHEN** er die Seite neu lädt
- **THEN** zeigt das Erdgeschoss wieder dieses Bild

#### Scenario: Bildspeicher nicht verfügbar
- **GIVEN** der Browser erlaubt keinen Bildspeicher
- **WHEN** der Nutzer ein Bild hochlädt
- **THEN** ist das Bild in dieser Sitzung zu sehen
- **AND** die Statusleiste zeigt „Nicht gespeichert“ mit einem Tooltip, dass Vorlagenbilder nicht gespeichert werden können

### Requirement: Nicht mehr verwendete Bilder entfernen
Beim Start SHALL das System gespeicherte Vorlagenbilder löschen, auf die der gespeicherte Plan nicht mehr verweist. Während einer Sitzung MUST kein Bild gelöscht werden, damit Rückgängig ein entferntes oder ersetztes Bild wiederherstellen kann.

#### Scenario: Ersetztes Bild
- **GIVEN** der Nutzer hat das Bild des Erdgeschosses ersetzt
- **WHEN** er Strg+Z drückt
- **THEN** erscheint das vorherige Bild wieder
- **WHEN** er stattdessen die Seite neu lädt
- **THEN** ist das vorherige Bild aus dem Browser-Speicher entfernt

### Requirement: Raster ohne Vorlage
Ist auf der aktiven Etage keine Vorlage mit Bild zu sehen, SHALL die Zeichenfläche ein Raster mit Linien alle 100 cm zeigen, mit einer kräftigeren Linie bei x = 0 cm und y = 0 cm. Die Linien MUST bei jedem Zoom 1 Bildschirmpixel stark sein und Klicks nicht abfangen.

#### Scenario: Leere Etage
- **GIVEN** die Etage „Keller“ hat weder Vorlage noch Formen
- **WHEN** sie zum ersten Mal angezeigt wird
- **THEN** zeigt die Zeichenfläche das Raster mit dem Bereich von 0 cm bis 1 000 cm in beiden Richtungen eingepasst
