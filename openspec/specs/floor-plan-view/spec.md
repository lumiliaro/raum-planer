# floor-plan-view Specification

## Purpose

Zeigt die Grundrisse der fest vorgegebenen Etagen des Hauses an und erlaubt, zwischen ihnen umzuschalten sowie die Ansicht zu zoomen und zu verschieben – als Grundlage für Kalibrierung und Möbelplanung.

## Requirements

### Requirement: Start mit der zuletzt aktiven Etage
Das System SHALL beim Start die Etage als aktive Etage anzeigen, die im gespeicherten Plan zuletzt aktiv war. Gibt es keinen gespeicherten Plan oder ist er unlesbar, MUST die einzige Etage des neuen leeren Plans (Erdgeschoss) aktiv sein.

#### Scenario: App-Start
- **GIVEN** in diesem Browser ist kein Plan gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Erdgeschoss“ im Umschalter aktiv markiert und die einzige Etage

#### Scenario: App-Start nach Arbeit im Dachgeschoss
- **GIVEN** der Nutzer hat zuletzt im Dachgeschoss gearbeitet
- **WHEN** er die Seite neu lädt
- **THEN** ist „Dachgeschoss“ im Umschalter aktiv markiert
- **AND** die Zeichenfläche zeigt den Grundriss des Dachgeschosses

### Requirement: Etage umschalten
Der Etagen-Umschalter SHALL alle Etagen des Plans in ihrer Reihenfolge mit ihrem Namen zeigen. Beim Auswählen einer Etage SHALL das System deren Grundriss und Formen anzeigen und die Etage als aktiv markieren.

#### Scenario: Wechsel ins Obergeschoss
- **GIVEN** das Erdgeschoss ist aktiv
- **WHEN** der Nutzer „Obergeschoss“ anklickt
- **THEN** zeigt die Zeichenfläche den Grundriss des Obergeschosses
- **AND** „Obergeschoss“ ist im Umschalter aktiv markiert

#### Scenario: Umbenannte Etage
- **GIVEN** der Nutzer hat das Dachgeschoss in „Studio“ umbenannt
- **THEN** zeigt der Umschalter „Studio“ an der Stelle des Dachgeschosses

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
Das System SHALL die Ansicht verschieben, wenn der Nutzer mit gedrückter linker Maustaste auf der Zeichenfläche zieht; der Grundriss und alle sichtbaren Formen folgen dabei der Mausbewegung. Beginnt das Ziehen auf einer Form, während das Werkzeug „Auswählen“ aktiv ist, MUST stattdessen die Form verschoben werden und die Ansicht stillstehen.

#### Scenario: Ziehen nach rechts
- **WHEN** der Nutzer auf der Zeichenfläche an einer Stelle ohne Form mit gedrückter Maustaste 100 Bildschirmpixel nach rechts zieht
- **THEN** verschiebt sich der Grundriss um 100 Bildschirmpixel nach rechts
- **AND** der Zoomwert bleibt unverändert

#### Scenario: Ziehen auf einer Form
- **GIVEN** „Auswählen“ ist aktiv
- **WHEN** der Nutzer auf einem Rechteck mit gedrückter Maustaste nach rechts zieht
- **THEN** bewegt sich das Rechteck
- **AND** der Grundriss bleibt an seiner Stelle

#### Scenario: Ziehen auf einer Form mit Form-Werkzeug
- **GIVEN** „Rechteck“ ist aktiv
- **WHEN** der Nutzer auf einer vorhandenen Form mit gedrückter Maustaste zieht
- **THEN** verschiebt sich die Ansicht
- **AND** die Form behält ihre Lage

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
