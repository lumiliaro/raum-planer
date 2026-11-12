# Spec Delta

## MODIFIED Requirements

### Requirement: Eigenschaften-Panel mit Leerzustand
Das Eigenschaften-Panel SHALL standardmäßig sichtbar sein. Solange keine Form ausgewählt ist, SHALL es den Hinweis „Wähle eine Form aus“ zeigen. Ist eine Form ausgewählt, SHALL es ihren Formtyp („Rechteck“ bzw. „Ellipse“), die Schaltfläche „Löschen“ und eine schreibgeschützte Übersicht mit Breite, Tiefe, X und Y in cm sowie der Drehung in Grad zeigen. Zahlen MUST mit höchstens einer Nachkommastelle und deutschem Dezimalkomma erscheinen. Die Werte MUST nach jedem Verschieben, Drehen und Ändern der Größe aktuell sein.

#### Scenario: Erster Start
- **GIVEN** die App wurde in diesem Browser noch nie geöffnet
- **WHEN** die App geladen wird
- **THEN** ist das Eigenschaften-Panel sichtbar
- **AND** es zeigt den Hinweis „Wähle eine Form aus“

#### Scenario: Form ausgewählt
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm, Mittelpunkt x = 412 cm, y = 189 cm und Drehung 0°
- **WHEN** der Nutzer das Rechteck auswählt
- **THEN** zeigt das Panel „Rechteck“ und die Schaltfläche „Löschen“
- **AND** es zeigt Breite „100 cm“, Tiefe „60 cm“, X „412 cm“, Y „189 cm“ und Drehung „0°“

#### Scenario: Werte nach Größenänderung
- **GIVEN** das Rechteck aus dem vorigen Szenario ist ausgewählt
- **WHEN** der Nutzer die Breite über den rechten Anfasser auf 125 cm vergrößert
- **THEN** zeigt das Panel Breite „125 cm“ und X „424,5 cm“

#### Scenario: Auswahl aufgehoben
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** zeigt das Panel wieder „Wähle eine Form aus“
