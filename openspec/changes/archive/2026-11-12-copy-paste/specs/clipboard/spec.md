# Spec Delta

## Purpose

Legt fest, wie der Nutzer Räume und Formen per Tastatur kopiert, ausschneidet, einfügt und dupliziert: was eine Kopie übernimmt, wo sie landet, wie die Zwischenablage über Etagen hinweg wirkt und wie das mit Sperre und Rückgängig zusammenspielt.

## ADDED Requirements

### Requirement: Kopieren
`Strg+C` SHALL den ausgewählten Raum oder die ausgewählte Form in die Zwischenablage der App legen und dabei deren bisherigen Inhalt ersetzen. Kopieren MUST NOT den Plan ändern und MUST NOT einen Rückgängig-Schritt bilden. Ohne ausgewählten Raum und ohne ausgewählte Form MUST `Strg+C` die Zwischenablage unverändert lassen. Die Zwischenablage SHALL nur für die laufende Sitzung gelten; sie MUST NOT gespeichert, exportiert oder in die Zwischenablage des Systems geschrieben werden.

#### Scenario: Form kopieren
- **GIVEN** im Erdgeschoss ist ein Rechteck 200 cm × 90 cm ausgewählt
- **WHEN** der Nutzer `Strg+C` drückt
- **THEN** enthält das Erdgeschoss weiter genau dieses eine Rechteck
- **AND** „Rückgängig“ macht die letzte Änderung vor dem Kopieren rückgängig

#### Scenario: Kopieren ohne Auswahl
- **GIVEN** die Zwischenablage enthält den Raum „Bad“ und nichts ist ausgewählt
- **WHEN** der Nutzer `Strg+C` drückt
- **THEN** enthält die Zwischenablage weiter „Bad“

#### Scenario: Nach dem Neuladen leer
- **GIVEN** der Nutzer hat einen Raum kopiert
- **WHEN** er die App neu lädt und `Strg+V` drückt
- **THEN** wird nichts eingefügt

### Requirement: Einfügen
`Strg+V` SHALL eine Kopie des Inhalts der Zwischenablage auf der aktiven Etage anlegen, eine Form oben auf alle Formen, einen Raum oben auf alle Räume. Danach SHALL die Kopie ausgewählt und „Auswählen“ aktiv sein. Der Inhalt der Zwischenablage MUST dabei erhalten bleiben, sodass mehrfaches Einfügen möglich ist; spätere Änderungen am Original MUST NOT die Zwischenablage ändern. Bei leerer Zwischenablage MUST `Strg+V` wirkungslos sein.

#### Scenario: Mehrfach einfügen
- **GIVEN** der Nutzer hat einen Stuhl kopiert
- **WHEN** er dreimal `Strg+V` drückt
- **THEN** liegen auf der aktiven Etage vier Stühle
- **AND** der zuletzt eingefügte ist ausgewählt

#### Scenario: Original nach dem Kopieren geändert
- **GIVEN** der Nutzer hat ein Rechteck mit 200 cm Breite kopiert und danach die Breite des Originals auf 120 cm geändert
- **WHEN** er `Strg+V` drückt
- **THEN** ist die Kopie 200 cm breit

### Requirement: Lage der eingefügten Kopie
Auf der Etage, von der kopiert wurde, SHALL die erste eingefügte Kopie gegenüber dem Original um 50 cm nach rechts und 50 cm nach unten versetzt liegen, jede weitere um weitere 50 cm in beide Richtungen. Auf einer anderen Etage SHALL die erste eingefügte Kopie an derselben Stelle wie das Original liegen und jede weitere dort um weitere 50 cm in beide Richtungen versetzt. Der Versatz MUST je Etage zählen und SHALL mit jedem neuen Kopieren oder Ausschneiden von vorn beginnen.

#### Scenario: Versetzt auf derselben Etage
- **GIVEN** im Erdgeschoss liegt ein Rechteck mit Mittelpunkt (300 cm, 200 cm) und der Nutzer hat es kopiert
- **WHEN** er zweimal `Strg+V` drückt
- **THEN** liegt die erste Kopie bei (350 cm, 250 cm) und die zweite bei (400 cm, 300 cm)

#### Scenario: Gleiche Stelle auf anderer Etage
- **GIVEN** der Nutzer hat im Erdgeschoss den Raum „Schlafen“ mit den Ecken (0 cm, 0 cm), (400 cm, 0 cm), (400 cm, 300 cm), (0 cm, 300 cm) kopiert
- **WHEN** er ins Obergeschoss wechselt und `Strg+V` drückt
- **THEN** hat der neue Raum im Obergeschoss die Ecken (0 cm, 0 cm), (400 cm, 0 cm), (400 cm, 300 cm), (0 cm, 300 cm)
- **WHEN** er erneut `Strg+V` drückt
- **THEN** hat der nächste neue Raum die Ecken (50 cm, 50 cm), (450 cm, 50 cm), (450 cm, 350 cm), (50 cm, 350 cm)

#### Scenario: Neues Kopieren beginnt von vorn
- **GIVEN** der Nutzer hat ein Rechteck bei (300 cm, 200 cm) kopiert und zweimal eingefügt
- **WHEN** er das Original erneut auswählt, `Strg+C` und dann `Strg+V` drückt
- **THEN** liegt die neue Kopie bei (350 cm, 250 cm)

### Requirement: Inhalt einer Kopie
Eine Raumkopie SHALL Umriss, Wanddicken je Kante, Farbe sowie alle Türen, Fenster und Durchgänge mit ihren Einstellungen übernehmen; Raum und Öffnungen MUST neue IDs bekommen. Eine Formkopie SHALL Art, Maße, Drehung, Spiegelung, Stil und Beschriftung übernehmen und eine neue ID bekommen. Eine Kopie MUST NOT gesperrt sein, auch wenn das Original gesperrt ist. Formen, die in einem kopierten Raum stehen, MUST NOT mitkopiert werden.

#### Scenario: Raum mit Tür
- **GIVEN** der Raum „Bad“ hat eine Wanddicke von 11,5 cm an jeder Kante, die Farbe Blau und eine Tür 80 cm breit auf seiner unteren Kante
- **WHEN** der Nutzer ihn kopiert und einfügt
- **THEN** heißt der neue Raum „Bad (Kopie)“, hat an jeder Kante 11,5 cm Wanddicke, die Farbe Blau und eine Tür 80 cm breit an derselben Stelle seiner unteren Kante

#### Scenario: Möbel im Raum
- **GIVEN** im Raum „Bad“ steht eine Wanne
- **WHEN** der Nutzer „Bad“ kopiert und einfügt
- **THEN** liegt im Plan weiter genau eine Wanne

#### Scenario: Gesperrtes Original
- **GIVEN** ein gesperrtes Bett 140 cm × 200 cm, gedreht um 90°, ist ausgewählt
- **WHEN** der Nutzer `Strg+C` und `Strg+V` drückt
- **THEN** ist die Kopie ein Bett 140 cm × 200 cm, gedreht um 90°
- **AND** die Kopie ist nicht gesperrt und lässt sich verschieben

### Requirement: Name einer Raumkopie
Der Name einer Raumkopie SHALL der Name des Originals mit dem Zusatz „ (Kopie)“ sein, außer beim ersten Einfügen nach dem Ausschneiden (siehe „Einfügen nach dem Ausschneiden“). Endet der Name schon auf „ (Kopie)“, MUST NOT ein zweiter Zusatz entstehen. Ein Name, der mit dem Zusatz länger als 40 Zeichen würde, SHALL vor dem Zusatz gekürzt werden.

#### Scenario: Kopie einer Kopie
- **GIVEN** der Raum „Bad (Kopie)“ ist ausgewählt
- **WHEN** der Nutzer ihn kopiert und einfügt
- **THEN** heißt der neue Raum „Bad (Kopie)“

#### Scenario: Langer Name
- **GIVEN** ein Raum hat einen Namen mit 40 Zeichen
- **WHEN** der Nutzer ihn kopiert und einfügt
- **THEN** hat der Name der Kopie 40 Zeichen und endet auf „ (Kopie)“

### Requirement: Ausschneiden
`Strg+X` SHALL den ausgewählten Raum oder die ausgewählte Form wie `Strg+C` in die Zwischenablage legen und anschließend wie mit `Entf` löschen; danach MUST nichts ausgewählt sein. Ist das Ausgewählte gesperrt, SHALL es nur kopiert werden; es MUST stehen bleiben und ausgewählt bleiben, und späteres Einfügen verhält sich wie nach `Strg+C`.

#### Scenario: Gesperrt ausschneiden
- **GIVEN** der gesperrte Raum „Küche“ ist ausgewählt
- **WHEN** der Nutzer `Strg+X` drückt
- **THEN** bleibt „Küche“ stehen und ausgewählt
- **WHEN** er `Strg+V` drückt
- **THEN** entsteht der nicht gesperrte Raum „Küche (Kopie)“, 50 cm nach rechts und 50 cm nach unten versetzt

### Requirement: Einfügen nach dem Ausschneiden
Nach einem Ausschneiden, das gelöscht hat, SHALL das erste Einfügen auf der Etage, von der ausgeschnitten wurde, die Kopie an die Stelle des Originals setzen; jedes weitere dort ist wie beim Kopieren um weitere 50 cm versetzt. Beim ersten Einfügen nach einem solchen Ausschneiden, auf welcher Etage auch immer, SHALL ein Raum seinen Namen ohne Zusatz „ (Kopie)“ behalten; jedes weitere Einfügen bekommt den Zusatz.

#### Scenario: Ausschneiden und wieder einfügen
- **GIVEN** im Erdgeschoss ist ein Rechteck bei (300 cm, 200 cm) ausgewählt
- **WHEN** der Nutzer `Strg+X` drückt
- **THEN** ist das Rechteck nicht mehr im Erdgeschoss und nichts ist ausgewählt
- **WHEN** er `Strg+V` drückt
- **THEN** liegt ein Rechteck bei (300 cm, 200 cm) und ist ausgewählt

#### Scenario: In andere Etage verschieben
- **GIVEN** im Erdgeschoss ist der Raum „Flur“ ausgewählt
- **WHEN** der Nutzer `Strg+X` drückt, ins Obergeschoss wechselt und `Strg+V` drückt
- **THEN** hat das Erdgeschoss keinen Raum „Flur“ mehr
- **AND** das Obergeschoss hat einen Raum „Flur“ an derselben Stelle
- **WHEN** er erneut `Strg+V` drückt
- **THEN** entsteht im Obergeschoss zusätzlich „Flur (Kopie)“, 50 cm nach rechts und 50 cm nach unten versetzt

### Requirement: Duplizieren
`Strg+D` SHALL vom ausgewählten Raum oder der ausgewählten Form sofort eine Kopie auf derselben Etage anlegen, um 50 cm nach rechts und 50 cm nach unten versetzt, mit demselben Inhalt wie beim Kopieren und Einfügen, und sie auswählen. Duplizieren MUST NOT die Zwischenablage ändern. Ohne Auswahl MUST `Strg+D` wirkungslos sein.

#### Scenario: Wiederholt duplizieren
- **GIVEN** ein Stuhl bei (100 cm, 100 cm) ist ausgewählt
- **WHEN** der Nutzer zweimal `Strg+D` drückt
- **THEN** liegen Stühle bei (100 cm, 100 cm), (150 cm, 150 cm) und (200 cm, 200 cm)
- **AND** der Stuhl bei (200 cm, 200 cm) ist ausgewählt

#### Scenario: Zwischenablage bleibt
- **GIVEN** die Zwischenablage enthält den Raum „Bad“ und ein Tisch ist ausgewählt
- **WHEN** der Nutzer `Strg+D` und dann `Strg+V` drückt
- **THEN** entstehen ein zweiter Tisch und ein Raum „Bad (Kopie)“

### Requirement: Kopieren und Einfügen im Verlauf
Einfügen, Ausschneiden (sofern es löscht) und Duplizieren SHALL je genau einen Rückgängig-Schritt bilden. Rückgängig und Wiederholen MUST NOT die Zwischenablage ändern.

#### Scenario: Einfügen rückgängig machen
- **GIVEN** der Nutzer hat einen Raum mit zwei Fenstern eingefügt
- **WHEN** er `Strg+Z` drückt
- **THEN** ist der eingefügte Raum samt Fenstern verschwunden
- **WHEN** er `Strg+V` drückt
- **THEN** wird der Raum erneut eingefügt

#### Scenario: Ausschneiden rückgängig machen
- **GIVEN** der Nutzer hat ein Rechteck ausgeschnitten
- **WHEN** er `Strg+Z` drückt
- **THEN** liegt das Rechteck wieder an seiner Stelle
- **AND** die Zwischenablage enthält es weiter

### Requirement: Wann die Tasten wirken
`Strg+C`, `Strg+X`, `Strg+V` und `Strg+D` (auf dem Mac ⌘ statt Strg) SHALL nur wirken, wenn der Fokus nicht in einem Eingabefeld und nicht in einem Dialog liegt; in einem Eingabefeld MUST der Browser Text kopieren, ausschneiden und einfügen wie gewohnt.

#### Scenario: Text im Eigenschaften-Panel
- **GIVEN** ein Raum ist ausgewählt und der Fokus liegt im Feld „Name“
- **WHEN** der Nutzer `Strg+C` drückt
- **THEN** kopiert der Browser den markierten Text und die Zwischenablage der App bleibt unverändert

### Requirement: Gesperrte Situationen
Im Kalibrier-Modus, während ein Raum gezeichnet wird und während eine Form oder ein Raum gezogen wird, MUST NOT eingefügt, ausgeschnitten oder dupliziert werden. Ist eine Tür, ein Fenster oder ein Durchgang ausgewählt, MUST `Strg+C`, `Strg+X` und `Strg+D` wirkungslos sein.

#### Scenario: Beim Zeichnen eines Raums
- **GIVEN** die Zwischenablage enthält ein Rechteck und der Nutzer hat mit „Raum“ zwei Eckpunkte gesetzt
- **WHEN** er `Strg+V` drückt
- **THEN** wird nichts eingefügt und der Umriss bleibt in Arbeit

#### Scenario: Öffnung ausgewählt
- **GIVEN** ein Fenster ist ausgewählt
- **WHEN** der Nutzer `Strg+D` drückt
- **THEN** bleibt der Plan unverändert
