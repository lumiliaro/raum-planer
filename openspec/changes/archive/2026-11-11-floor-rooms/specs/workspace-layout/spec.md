# Spec Delta

## MODIFIED Requirements

### Requirement: Eigenschaften-Panel mit Leerzustand
Das Eigenschaften-Panel SHALL standardmäßig sichtbar sein. Solange weder eine Form noch ein Raum ausgewählt ist, SHALL es den Hinweis „Wähle eine Form oder einen Raum aus“ und darunter den Abschnitt „Vorlage“ der aktiven Etage zeigen (siehe `floor-underlay`). Ist eine Form ausgewählt, SHALL es das Eigenschaften-Formular der Form zeigen (siehe `shape-properties`), ist ein Raum ausgewählt, die Eigenschaften des Raums (siehe `floor-rooms`). Zahlen MUST mit höchstens einer Nachkommastelle und deutschem Dezimalkomma erscheinen.

#### Scenario: Erster Start
- **GIVEN** die App wurde in diesem Browser noch nie geöffnet
- **WHEN** die App geladen wird
- **THEN** ist das Eigenschaften-Panel sichtbar
- **AND** es zeigt den Hinweis „Wähle eine Form oder einen Raum aus“ und den Abschnitt „Vorlage“ mit „Bild hochladen“

#### Scenario: Form ausgewählt
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm, Mittelpunkt x = 412 cm, y = 189 cm und Drehung 0°
- **WHEN** der Nutzer das Rechteck auswählt
- **THEN** zeigt das Panel „Rechteck“ und die Schaltfläche „Löschen“
- **AND** es zeigt die Felder Breite „100“, Tiefe „60“, X „412“, Y „189“ und Drehung „0“ mit den Einheiten cm bzw. °
- **AND** der Abschnitt „Vorlage“ ist nicht zu sehen

#### Scenario: Werte nach Größenänderung
- **GIVEN** das Rechteck aus dem vorigen Szenario ist ausgewählt
- **WHEN** der Nutzer die Breite über den rechten Anfasser auf 125 cm vergrößert
- **THEN** zeigt das Panel Breite „125“ und X „424,5“

#### Scenario: Raum ausgewählt
- **WHEN** der Nutzer den Raum „Wohnen“ auswählt
- **THEN** zeigt das Panel „Raum“, den Namen „Wohnen“ und die Kantenlängen
- **AND** der Abschnitt „Vorlage“ ist nicht zu sehen

#### Scenario: Auswahl aufgehoben
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** zeigt das Panel wieder „Wähle eine Form oder einen Raum aus“ und den Abschnitt „Vorlage“
