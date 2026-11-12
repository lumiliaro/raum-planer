# Spec Delta

## ADDED Requirements

### Requirement: Form sperren und entsperren
Bei ausgewählter Form SHALL der Panel-Kopf neben „Löschen“ eine Schaltfläche mit Schloss-Icon zeigen. Ist die Form nicht gesperrt, lautet ihr Tooltip „Sperren“ und ein Klick sperrt sie; ist sie gesperrt, zeigt sie ein geschlossenes Schloss als gedrückt, lautet der Tooltip „Entsperren“ und ein Klick entsperrt sie. Der Sperrzustand MUST im Plan gespeichert werden.

#### Scenario: Sperren
- **GIVEN** ein nicht gesperrtes Sofa ist ausgewählt
- **WHEN** der Nutzer im Panel-Kopf auf „Sperren“ klickt
- **THEN** ist das Sofa gesperrt und die Schaltfläche zeigt „Entsperren“

#### Scenario: Sperre bleibt nach dem Neuladen
- **GIVEN** ein Sofa wurde gesperrt
- **WHEN** der Nutzer die Seite neu lädt
- **THEN** ist das Sofa weiterhin gesperrt

### Requirement: Gesperrte Form auf der Zeichenfläche
Eine gesperrte Form SHALL sich per Klick auswählen lassen. Ihr Auswahlrahmen MUST ohne Anfasser zum Ändern der Größe und ohne Dreh-Anfasser erscheinen. Ziehen auf einer gesperrten Form MUST die Ansicht verschieben statt der Form.

#### Scenario: Ziehen einer gesperrten Form
- **GIVEN** ein gesperrter Schrank mit Mittelpunkt x = 300 cm, y = 120 cm
- **WHEN** der Nutzer ihn mit „Auswählen“ um 50 cm nach rechts zieht
- **THEN** liegt der Mittelpunkt weiterhin bei x = 300 cm, y = 120 cm
- **AND** die Ansicht hat sich verschoben

#### Scenario: Auswahl ohne Anfasser
- **WHEN** der Nutzer einen gesperrten Schrank anklickt
- **THEN** ist er ausgewählt und von einem blauen Rahmen ohne Anfasser umgeben

### Requirement: Gesperrte Form nicht löschen
Eine gesperrte Form MUST sich weder mit `Entf` noch mit der Rücktaste noch über „Löschen“ entfernen lassen. „Löschen“ ist bei gesperrter Form gesperrt und hat den Tooltip „Gesperrt – zuerst entsperren“.

#### Scenario: Entf bei gesperrter Form
- **GIVEN** ein gesperrter Schrank ist ausgewählt
- **WHEN** der Nutzer `Entf` drückt
- **THEN** ist der Schrank weiterhin vorhanden und ausgewählt

### Requirement: Gesperrte Form im Eigenschaften-Panel
Bei einer gesperrten Form MUST das Panel die Felder für Maße und Lage (Breite, Tiefe und die übrigen Maße des Formtyps, X, Y, Drehung, Spiegeln) schreibgeschützt anzeigen. Beschriftung, Darstellung (Füllung, Rand, Randstärke, Deckkraft) und Anordnung SHALL änderbar bleiben.

#### Scenario: Maße schreibgeschützt
- **GIVEN** ein gesperrter Schrank mit Breite 120 cm ist ausgewählt
- **WHEN** der Nutzer das Feld „Breite“ anklickt
- **THEN** lässt sich der Wert nicht ändern und bleibt 120 cm

#### Scenario: Farbe ändern
- **GIVEN** ein gesperrter Schrank ist ausgewählt
- **WHEN** der Nutzer die Füllfarbe ändert
- **THEN** hat der Schrank die neue Füllfarbe und ist weiterhin gesperrt

### Requirement: Sperre gilt für alle Bearbeitungswege
Das System MUST jede Änderung an Lage, Drehung, Spiegelung oder Maßen einer gesperrten Form ablehnen und eine gesperrte Form nicht löschen, unabhängig davon, wie die Änderung ausgelöst wird. Rückgängig, Wiederholen und Import sind davon ausgenommen, weil sie einen ganzen früheren oder geladenen Stand wiederherstellen.

#### Scenario: Rückgängig über die Sperre hinweg
- **GIVEN** ein Schrank wurde verschoben und danach gesperrt
- **WHEN** der Nutzer zweimal Strg+Z drückt
- **THEN** ist der Schrank nicht mehr gesperrt und liegt an seiner Ausgangslage

### Requirement: Anordnung im Eigenschaften-Panel
Bei ausgewählter Form SHALL das Panel einen Abschnitt „Anordnung“ mit den Schaltflächen „Nach vorne“, „Nach hinten“, „Ganz nach vorne“ und „Ganz nach hinten“ zeigen. Sie verschieben die Form in der Zeichenreihenfolge ihrer Etage. Liegt die Form schon am jeweiligen Ziel, MUST die Schaltfläche gesperrt sein. Die Form bleibt danach ausgewählt.

#### Scenario: Nach vorne
- **GIVEN** im Erdgeschoss liegen Teppich, Tisch, Stuhl übereinander (Stuhl oben) und der Teppich ist ausgewählt
- **WHEN** der Nutzer auf „Nach vorne“ klickt
- **THEN** ist die Reihenfolge Tisch, Teppich, Stuhl
- **AND** der Teppich liegt über dem Tisch und ist weiterhin ausgewählt

#### Scenario: Oberste Form
- **WHEN** die oberste Form der Etage ausgewählt ist
- **THEN** sind „Nach vorne“ und „Ganz nach vorne“ gesperrt
- **AND** „Nach hinten“ und „Ganz nach hinten“ sind verfügbar

#### Scenario: Einzige Form
- **WHEN** die einzige Form der Etage ausgewählt ist
- **THEN** sind alle vier Schaltflächen gesperrt

### Requirement: Anordnung per Tastatur
Bei ausgewählter Form SHALL Bild↑ die Form eine Stelle nach vorne und Bild↓ eine Stelle nach hinten verschieben, mit gedrückter Umschalttaste ganz nach vorne bzw. ganz nach hinten. Die Tooltips der Schaltflächen MUST das Kürzel nennen. Bei Fokus in einem Eingabefeld MUST die Taste wirkungslos für die Anordnung bleiben.

#### Scenario: Ganz nach hinten per Taste
- **GIVEN** im Erdgeschoss liegen Teppich, Tisch, Stuhl und der Stuhl ist ausgewählt
- **WHEN** der Nutzer Umschalt+Bild↓ drückt
- **THEN** ist die Reihenfolge Stuhl, Teppich, Tisch

#### Scenario: Tooltips
- **WHEN** der Nutzer mit dem Zeiger über den Schaltflächen der Anordnung verweilt
- **THEN** lauten die Tooltips „Nach vorne (Bild↑)“, „Nach hinten (Bild↓)“, „Ganz nach vorne (Umschalt+Bild↑)“ und „Ganz nach hinten (Umschalt+Bild↓)“
