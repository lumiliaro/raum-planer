# Spec Delta

## MODIFIED Requirements

### Requirement: Grundriss in Originalproportionen
Die Zeichenfläche SHALL in cm arbeiten: Ein Zoomwert von 100 % MUST 1 Bildschirmpixel je cm entsprechen. Eine Vorlage MUST unverzerrt in ihren Originalproportionen und in der Größe dargestellt werden, die sich aus ihrer Kalibrierung ergibt.

#### Scenario: Anzeige bei 100 %
- **GIVEN** eine Vorlage mit 1240 × 1754 Pixeln ist mit 0,5 px/cm ohne Ausrichtung kalibriert
- **WHEN** der Zoom auf 100 % steht
- **THEN** wird sie 2480 × 3508 Bildschirmpixel groß dargestellt

#### Scenario: Möbel bei 100 %
- **GIVEN** der Zoom steht auf 100 %
- **WHEN** ein Rechteck mit Breite 100 cm und Tiefe 60 cm angezeigt wird
- **THEN** ist es 100 × 60 Bildschirmpixel groß

### Requirement: Einpassen
Das System SHALL bei der ersten Anzeige einer Etage alles Sichtbare der Etage (Vorlage und Formen) vollständig und zentriert in die Zeichenfläche einpassen. Ist nichts zu sehen, MUST der Bereich von 0 cm bis 1 000 cm in beiden Richtungen eingepasst werden. Dieselbe Einpassung SHALL über die Schaltfläche „Einpassen“ und die Taste `0` erreichbar sein.

#### Scenario: Erste Anzeige
- **WHEN** eine Etage mit Vorlage in der Sitzung zum ersten Mal angezeigt wird
- **THEN** sind die gesamte Vorlage und alle Formen sichtbar und in der Zeichenfläche zentriert

#### Scenario: Einpassen nach Zoomen
- **GIVEN** der Nutzer hat hineingezoomt und die Ansicht verschoben
- **WHEN** er „Einpassen“ anklickt oder `0` drückt
- **THEN** sind Vorlage und Formen wieder vollständig sichtbar und zentriert

#### Scenario: Möbel außerhalb der Vorlage
- **GIVEN** die Vorlage reicht bis x = 1 200 cm und ein Schrank liegt bei x = 1 500 cm
- **WHEN** der Nutzer „Einpassen“ anklickt
- **THEN** sind Vorlage und Schrank vollständig sichtbar

#### Scenario: Leere Etage
- **GIVEN** die Etage „Keller“ hat weder Vorlage noch Formen
- **WHEN** der Nutzer „Einpassen“ anklickt
- **THEN** ist der Bereich von 0 cm bis 1 000 cm in beiden Richtungen sichtbar und zentriert

## REMOVED Requirements

### Requirement: Fehlendes Grundrissbild
**Reason**: Grundrissbilder liegen nicht mehr als Dateien im Repo, sondern als Vorlagen im Browser.
**Migration**: Ein fehlendes Vorlagenbild meldet die Zeichenfläche mit „Vorlage fehlt – Bild laden“ (siehe `floor-underlay`, „Vorlagenbild fehlt“).

### Requirement: Etage ohne Grundriss
**Reason**: Eine Etage ohne Vorlage ist jetzt vollständig bedienbar und zeigt das 1-m-Raster statt eines Hinweises.
**Migration**: Siehe `floor-underlay`, „Raster ohne Vorlage“ und „Vorlage einer Etage“.
