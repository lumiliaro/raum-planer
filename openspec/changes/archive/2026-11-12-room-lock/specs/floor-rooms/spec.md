## ADDED Requirements

### Requirement: Raum sperren und entsperren
Bei ausgewähltem Raum SHALL der Panel-Kopf neben „Löschen“ eine Schaltfläche mit Schloss-Icon zeigen, wie bei Formen: nicht gesperrt mit Tooltip „Sperren“, gesperrt als gedrücktes geschlossenes Schloss mit Tooltip „Entsperren“. Ein Klick wechselt den Zustand und bildet einen Rückgängig-Schritt. Der Raum MUST ausgewählt bleiben, und der Sperrzustand MUST im Plan gespeichert werden.

#### Scenario: Raum sperren
- **GIVEN** der nicht gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer im Panel-Kopf auf „Sperren“ klickt
- **THEN** ist „Wohnen“ gesperrt und weiterhin ausgewählt
- **AND** die Schaltfläche zeigt ein geschlossenes Schloss mit dem Tooltip „Entsperren“

#### Scenario: Raum entsperren
- **GIVEN** der gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer auf „Entsperren“ klickt
- **THEN** ist „Wohnen“ nicht mehr gesperrt und lässt sich wieder ziehen

#### Scenario: Sperre bleibt nach dem Neuladen
- **GIVEN** „Wohnen“ wurde gesperrt
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist „Wohnen“ weiterhin gesperrt

#### Scenario: Sperren rückgängig machen
- **GIVEN** „Wohnen“ wurde gesperrt
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** ist „Wohnen“ nicht mehr gesperrt

### Requirement: Gesperrter Raum auf der Zeichenfläche
Ein gesperrter Raum SHALL sich per Klick auswählen lassen und den blauen Umriss zeigen. Ziehen an einem gesperrten Raum MUST die Ansicht verschieben statt des Raums, auch wenn er ausgewählt ist.

#### Scenario: Gesperrten Raum ziehen
- **GIVEN** der gesperrte Raum „Diele“ ist ausgewählt und seine linke obere Ecke liegt bei (349 cm, 0 cm)
- **WHEN** der Nutzer mit „Auswählen“ in der Diele 50 cm nach rechts zieht
- **THEN** liegt die Ecke weiterhin bei (349 cm, 0 cm)
- **AND** die Ansicht hat sich verschoben

#### Scenario: Gesperrten Raum auswählen
- **WHEN** der Nutzer in den gesperrten Raum „Diele“ an eine Stelle ohne Form klickt
- **THEN** ist „Diele“ ausgewählt und zeigt einen blauen Umriss

### Requirement: Gesperrter Raum im Eigenschaften-Panel
Bei einem gesperrten Raum MUST das Panel die Kantenlängen („Kante n“) und Wanddicken („Wand“) schreibgeschützt anzeigen. Name und Farbe SHALL änderbar bleiben. Ein Kantenfeld oder Feld „Wand“ mit Fokus SHALL die Kante weiterhin hervorheben.

#### Scenario: Kantenlänge schreibgeschützt
- **GIVEN** der gesperrte Raum „Wohnen“ mit Kante 1 = 337,5 cm ist ausgewählt
- **WHEN** der Nutzer in das Feld „Kante 1“ klickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 337,5 cm
- **AND** Kante 1 ist auf der Zeichenfläche hervorgehoben

#### Scenario: Wanddicke schreibgeschützt
- **GIVEN** der gesperrte Raum „Wohnen“ mit 15 cm Wanddicke an Kante 2 ist ausgewählt
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 15 cm

#### Scenario: Gesperrten Raum umbenennen
- **GIVEN** der gesperrte Raum „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer im Feld „Name“ „Wohnzimmer“ eingibt und Enter drückt
- **THEN** heißt der Raum „Wohnzimmer“ und ist weiterhin gesperrt

#### Scenario: Gesperrten Raum einfärben
- **GIVEN** der gesperrte Raum „Bad“ ist ausgewählt
- **WHEN** der Nutzer eine andere Raumfarbe wählt
- **THEN** hat „Bad“ die neue Farbe und ist weiterhin gesperrt

### Requirement: Gesperrten Raum nicht löschen
Ein gesperrter Raum MUST sich weder mit `Entf` noch mit der Rücktaste noch über „Löschen“ entfernen lassen. „Löschen“ MUST bei gesperrtem Raum gesperrt sein und den Tooltip „Gesperrt – zuerst entsperren“ zeigen.

#### Scenario: Entf bei gesperrtem Raum
- **GIVEN** der gesperrte Raum „Diele“ ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist „Diele“ weiterhin vorhanden und ausgewählt

#### Scenario: Löschen-Schaltfläche gesperrt
- **WHEN** der gesperrte Raum „Diele“ ausgewählt ist
- **THEN** ist „Löschen“ im Panel-Kopf gesperrt und zeigt den Tooltip „Gesperrt – zuerst entsperren“

### Requirement: Raum-Sperre gilt für alle Bearbeitungswege
Das System MUST jede Änderung an Eckpunkten oder Wanddicken eines gesperrten Raums ablehnen und einen gesperrten Raum nicht löschen, unabhängig davon, wie die Änderung ausgelöst wird; abgelehnte Änderungen bilden keinen Rückgängig-Schritt. Rückgängig, Wiederholen und Import sind ausgenommen, ebenso das Löschen der ganzen Etage.

#### Scenario: Rückgängig über die Sperre hinweg
- **GIVEN** „Diele“ wurde um 20 cm verschoben und danach gesperrt
- **WHEN** der Nutzer zweimal Strg+Z drückt
- **THEN** ist „Diele“ nicht mehr gesperrt und liegt an ihrer Ausgangslage

#### Scenario: Etage mit gesperrtem Raum löschen
- **GIVEN** das Obergeschoss enthält den gesperrten Raum „Bad“
- **WHEN** der Nutzer das Obergeschoss löscht und die Rückfrage bestätigt
- **THEN** ist das Obergeschoss samt „Bad“ gelöscht

### Requirement: Öffnungen in gesperrten Räumen
Türen, Fenster und Durchgänge eines gesperrten Raums SHALL sich wie in einem nicht gesperrten Raum setzen, entlang der Kante ziehen, ändern und löschen lassen. Der Raum selbst MUST dabei unverändert und gesperrt bleiben.

#### Scenario: Tür in gesperrten Raum setzen
- **GIVEN** der Raum „Wohnen“ ist gesperrt und das Werkzeug „Tür“ ist aktiv
- **WHEN** der Nutzer auf Kante 1 von „Wohnen“ klickt
- **THEN** hat „Wohnen“ eine neue Tür auf Kante 1
- **AND** „Wohnen“ hat unveränderte Eckpunkte und ist weiterhin gesperrt

#### Scenario: Fenster in gesperrtem Raum ziehen
- **GIVEN** „Wohnen“ ist gesperrt und hat auf einer 500 cm langen Kante ein Fenster mit Abstand 100 cm
- **WHEN** der Nutzer das Fenster entlang der Kante nach rechts zieht
- **THEN** hat das Fenster einen größeren Abstand als 100 cm
- **AND** „Wohnen“ hat unveränderte Eckpunkte und ist weiterhin gesperrt

## MODIFIED Requirements

### Requirement: Raum verschieben
Ziehen an einem ausgewählten, nicht gesperrten Raum mit „Auswählen“ SHALL den ganzen Raum verschieben, relativ zur Startlage auf 5 cm gerastert, bei gedrückter Alt-Taste auf 1 cm. Ziehen an einem nicht ausgewählten oder gesperrten Raum MUST die Ansicht verschieben (siehe „Gesperrter Raum auf der Zeichenfläche“). Möbel MUST beim Verschieben eines Raums an ihrer Stelle bleiben.

#### Scenario: Raum ziehen
- **GIVEN** „Diele“ ist ausgewählt und ihre linke obere Ecke liegt bei (349 cm, 0 cm)
- **WHEN** der Nutzer die Diele 23 cm nach rechts zieht
- **THEN** liegt die Ecke bei (374 cm, 0 cm) und alle Kantenlängen sind unverändert

#### Scenario: Nicht ausgewählter Raum
- **GIVEN** kein Raum ist ausgewählt
- **WHEN** der Nutzer in „Wohnen“ an einer Stelle ohne Form zieht
- **THEN** verschiebt sich die Ansicht und der Raum behält seine Lage

### Requirement: Eigenschaften eines Raums
Ist ein Raum ausgewählt, SHALL das Eigenschaften-Panel zeigen: Kopf mit „Raum“, der Schloss-Schaltfläche (siehe „Raum sperren und entsperren“) und „Löschen“, das Feld „Name“, den Abschnitt „Farbe“ (siehe „Raumfarbe wählen“) und den Abschnitt „Kanten“ mit je Kante einer Zeile aus Längenfeld und Feld „Wand“ (Wanddicke), beide in cm, beginnend bei „Kante 1“ vom ersten zum zweiten Eckpunkt. Hat ein Kantenfeld oder ein Feld „Wand“ den Fokus, SHALL die Kante auf der Zeichenfläche hervorgehoben sein. Felder werden wie im Formular der Formen mit Enter oder beim Verlassen übernommen.

#### Scenario: Panel eines Rechtecks
- **WHEN** der Nutzer den Raum „Wohnen“ mit 337,5 × 560 cm und 15 cm Wanddicke an jeder Kante auswählt
- **THEN** zeigt das Panel „Raum“, „Sperren“, „Löschen“, Name „Wohnen“ und die Felder Kante 1 „337,5“, Kante 2 „560“, Kante 3 „337,5“, Kante 4 „560“
- **AND** neben jedem Kantenfeld steht ein Feld „Wand“ mit „15“
- **AND** zwischen Name und „Kanten“ steht der Abschnitt „Farbe“

#### Scenario: Wandfeld hebt Kante hervor
- **WHEN** der Nutzer in das Feld „Wand“ von Kante 2 klickt
- **THEN** ist Kante 2 auf der Zeichenfläche hervorgehoben

#### Scenario: Umbenennen
- **WHEN** der Nutzer im Feld „Name“ „Küche“ eingibt und Enter drückt
- **THEN** heißt der Raum „Küche“ und die Zeichenfläche zeigt „Küche“

#### Scenario: Leerer Name
- **WHEN** der Nutzer den Namen löscht und das Feld verlässt
- **THEN** zeigt das Feld „Bitte einen Namen eingeben“ und der bisherige Name bleibt

### Requirement: Raum löschen
„Löschen“ im Panel und `Entf` bzw. Rücktaste bei ausgewähltem, nicht gesperrtem Raum ohne Fokus in einem Eingabefeld SHALL den Raum ohne Rückfrage löschen und die Auswahl aufheben. Möbel MUST dabei unverändert bleiben. Ein gesperrter Raum bleibt erhalten (siehe „Gesperrten Raum nicht löschen“).

#### Scenario: Raum mit Entf löschen
- **GIVEN** „Diele“ ist ausgewählt und ein Schrank liegt darin
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist „Diele“ gelöscht und nichts ist ausgewählt
- **AND** der Schrank ist unverändert vorhanden
