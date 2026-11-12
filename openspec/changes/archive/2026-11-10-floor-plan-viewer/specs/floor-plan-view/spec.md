# Spec Delta

## Purpose

Zeigt die Grundrisse der fest vorgegebenen Etagen des Hauses an und erlaubt, zwischen ihnen umzuschalten sowie die Ansicht zu zoomen und zu verschieben – als Grundlage für Kalibrierung und Möbelplanung.

## ADDED Requirements

### Requirement: Feste Etagen
Das System SHALL genau die fest konfigurierten Etagen Erdgeschoss, Obergeschoss und Dachgeschoss in dieser Reihenfolge anbieten. Die Oberfläche MUST keine Möglichkeit bieten, Etagen anzulegen, umzubenennen, zu löschen oder Bilder hochzuladen.

#### Scenario: Etagen im Umschalter
- **WHEN** die App geöffnet wird
- **THEN** zeigt der Etagen-Umschalter die Einträge „Erdgeschoss“, „Obergeschoss“, „Dachgeschoss“ in dieser Reihenfolge
- **AND** es gibt keine Bedienelemente zum Hinzufügen, Umbenennen oder Löschen von Etagen

### Requirement: Start mit dem Erdgeschoss
Das System SHALL beim Start die erste Etage der Konfiguration (Erdgeschoss) als aktive Etage anzeigen.

#### Scenario: App-Start
- **WHEN** die App geladen wird
- **THEN** ist „Erdgeschoss“ im Umschalter aktiv markiert
- **AND** die Zeichenfläche zeigt den Grundriss des Erdgeschosses

### Requirement: Etage umschalten
Das System SHALL beim Auswählen einer Etage im Umschalter deren Grundriss anzeigen und die Etage als aktiv markieren.

#### Scenario: Wechsel ins Obergeschoss
- **GIVEN** das Erdgeschoss ist aktiv
- **WHEN** der Nutzer „Obergeschoss“ anklickt
- **THEN** zeigt die Zeichenfläche den Grundriss des Obergeschosses
- **AND** „Obergeschoss“ ist im Umschalter aktiv markiert

### Requirement: Grundriss in Originalproportionen
Das System SHALL das Grundrissbild der aktiven Etage unverzerrt in seinen Originalproportionen darstellen; ein Zoomwert von 100 % MUST einem Bildpixel pro Bildschirmpixel entsprechen.

#### Scenario: Anzeige bei 100 %
- **GIVEN** ein Grundrissbild mit 1240 × 1754 Pixeln
- **WHEN** der Zoom auf 100 % steht
- **THEN** wird das Bild 1240 × 1754 Bildschirmpixel groß dargestellt

### Requirement: Einpassen
Das System SHALL den Grundriss bei der ersten Anzeige einer Etage vollständig und zentriert in die Zeichenfläche einpassen. Dieselbe Einpassung SHALL über die Schaltfläche „Einpassen“ und die Taste `0` erreichbar sein.

#### Scenario: Erste Anzeige
- **WHEN** eine Etage in der Sitzung zum ersten Mal angezeigt wird
- **THEN** ist der gesamte Grundriss sichtbar und in der Zeichenfläche zentriert

#### Scenario: Einpassen nach Zoomen
- **GIVEN** der Nutzer hat hineingezoomt und die Ansicht verschoben
- **WHEN** er „Einpassen“ anklickt oder `0` drückt
- **THEN** ist der gesamte Grundriss wieder sichtbar und zentriert

### Requirement: Zoomen mit dem Mausrad
Das System SHALL beim Drehen des Mausrads über der Zeichenfläche zoomen, wobei der Bildpunkt unter dem Mauszeiger an derselben Bildschirmposition bleibt. Das Mausrad MUST dabei nicht die Seite scrollen.

#### Scenario: Zoom zur Mausposition
- **GIVEN** der Mauszeiger steht über einer Zimmerecke im Grundriss
- **WHEN** der Nutzer das Mausrad nach vorne dreht
- **THEN** wird die Ansicht vergrößert
- **AND** die Zimmerecke bleibt unter dem Mauszeiger

### Requirement: Zoomen über Leiste und Tasten
Das System SHALL eine Zoom-Leiste mit „Verkleinern“, aktuellem Zoomwert in Prozent, „Vergrößern“ und „Einpassen“ anzeigen. Die Tasten `+` und `-` SHALL wie „Vergrößern“ und „Verkleinern“ wirken und um die Mitte der Zeichenfläche zoomen.

#### Scenario: Vergrößern per Schaltfläche
- **GIVEN** der Zoom steht auf 50 %
- **WHEN** der Nutzer „Vergrößern“ anklickt
- **THEN** steigt der angezeigte Zoomwert über 50 %
- **AND** der Bildpunkt in der Mitte der Zeichenfläche bleibt in der Mitte

#### Scenario: Prozentanzeige
- **WHEN** sich der Zoom ändert
- **THEN** zeigt die Zoom-Leiste den neuen Wert als ganze Zahl mit Prozentzeichen, z. B. „87 %“

### Requirement: Zoom-Grenzen
Das System MUST den Zoom auf den Bereich von 10 % bis 800 % begrenzen.

#### Scenario: Obere Grenze
- **GIVEN** der Zoom steht auf 800 %
- **WHEN** der Nutzer weiter vergrößert
- **THEN** bleibt der Zoom bei 800 %

#### Scenario: Untere Grenze
- **GIVEN** der Zoom steht auf 10 %
- **WHEN** der Nutzer weiter verkleinert
- **THEN** bleibt der Zoom bei 10 %

### Requirement: Ansicht verschieben
Das System SHALL die Ansicht verschieben, wenn der Nutzer mit gedrückter linker Maustaste auf der Zeichenfläche zieht; der Grundriss folgt dabei der Mausbewegung.

#### Scenario: Ziehen nach rechts
- **WHEN** der Nutzer auf der Zeichenfläche mit gedrückter Maustaste 100 Bildschirmpixel nach rechts zieht
- **THEN** verschiebt sich der Grundriss um 100 Bildschirmpixel nach rechts
- **AND** der Zoomwert bleibt unverändert

### Requirement: Ansicht je Etage
Das System SHALL für jede Etage während der Sitzung Zoom und Position getrennt behalten und beim Zurückwechseln wiederherstellen. Nach einem Neuladen der Seite MUST jede Etage wieder eingepasst starten.

#### Scenario: Zurückwechseln
- **GIVEN** der Nutzer hat im Erdgeschoss auf 200 % gezoomt
- **WHEN** er ins Obergeschoss und wieder ins Erdgeschoss wechselt
- **THEN** zeigt das Erdgeschoss wieder 200 % an derselben Stelle

### Requirement: Größenänderung des Fensters
Das System SHALL die Zeichenfläche bei einer Größenänderung des Browserfensters oder beim Ein-/Ausblenden des Eigenschaften-Panels an den verfügbaren Platz anpassen, ohne den Zoomwert zu ändern.

#### Scenario: Panel ausblenden
- **GIVEN** der Zoom steht auf 87 %
- **WHEN** das Eigenschaften-Panel ausgeblendet wird
- **THEN** wird die Zeichenfläche breiter
- **AND** der Zoom bleibt bei 87 %

### Requirement: Fehlendes Grundrissbild
Das System SHALL eine verständliche Meldung in der Zeichenfläche anzeigen, wenn das Grundrissbild einer Etage nicht geladen werden kann, und dabei den Dateinamen nennen.

#### Scenario: Bild fehlt
- **GIVEN** die Datei `og.png` kann nicht geladen werden
- **WHEN** der Nutzer ins Obergeschoss wechselt
- **THEN** zeigt die Zeichenfläche die Meldung, dass der Grundriss „og.png“ nicht geladen werden konnte
- **AND** der Etagen-Umschalter bleibt bedienbar
