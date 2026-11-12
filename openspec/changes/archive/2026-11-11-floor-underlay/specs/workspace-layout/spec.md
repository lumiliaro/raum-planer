# Spec Delta

## MODIFIED Requirements

### Requirement: Aufbau der Arbeitsoberfläche
Das System SHALL das Browserfenster ohne Seiten-Scrollen vollständig ausfüllen und aufteilen in: Kopfleiste oben, Statusleiste unten, dazwischen von links nach rechts die Werkzeugleiste, die Zeichenfläche und das Eigenschaften-Panel.

#### Scenario: Bereiche sichtbar
- **WHEN** die App in einem Desktop-Browserfenster geöffnet wird
- **THEN** sind Kopfleiste, Werkzeugleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste sichtbar
- **AND** die Seite selbst hat keinen Scrollbalken

#### Scenario: Werkzeugleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links neben der Zeichenfläche eine schmale, senkrechte Werkzeugleiste
- **AND** an ihrem unteren Ende befindet sich die Schaltfläche „Vorlage kalibrieren“ mit deutschem Tooltip

### Requirement: Eigenschaften-Panel mit Leerzustand
Das Eigenschaften-Panel SHALL standardmäßig sichtbar sein. Solange keine Form ausgewählt ist, SHALL es den Hinweis „Wähle eine Form aus“ und darunter den Abschnitt „Vorlage“ der aktiven Etage zeigen (siehe `floor-underlay`). Ist eine Form ausgewählt, SHALL es das Eigenschaften-Formular der Form zeigen (siehe `shape-properties`). Zahlen MUST mit höchstens einer Nachkommastelle und deutschem Dezimalkomma erscheinen.

#### Scenario: Erster Start
- **GIVEN** die App wurde in diesem Browser noch nie geöffnet
- **WHEN** die App geladen wird
- **THEN** ist das Eigenschaften-Panel sichtbar
- **AND** es zeigt den Hinweis „Wähle eine Form aus“ und den Abschnitt „Vorlage“ mit „Bild hochladen“

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

#### Scenario: Auswahl aufgehoben
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** zeigt das Panel wieder „Wähle eine Form aus“ und den Abschnitt „Vorlage“

### Requirement: Statusleiste mit Kalibrierstatus
Die Statusleiste SHALL den Vorlagenstatus der aktiven Etage anzeigen: „Keine Vorlage“ ohne Vorlage, „Vorlage fehlt“ in Warnfarbe, wenn das Bild der Vorlage nicht vorhanden ist, „Vorlage nicht kalibriert“ in Warnfarbe für eine Vorlage mit Bild ohne Kalibrierung, sonst den Maßstab in px/cm mit deutschem Dezimalkomma.

#### Scenario: Etage ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** der Keller aktiv ist
- **THEN** zeigt die Statusleiste „Keine Vorlage“ ohne Warnfarbe

#### Scenario: Etage ohne Kalibrierung
- **GIVEN** das Erdgeschoss hat eine Vorlage mit Bild ohne Kalibrierung
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Vorlage nicht kalibriert“ in Warnfarbe

#### Scenario: Etage mit Kalibrierung
- **GIVEN** für die Vorlage des Erdgeschosses ist ein Maßstab von 0,9986 px/cm hinterlegt (1 000 cm entsprechen 998,6 px)
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Maßstab: 0,9986 px/cm“

#### Scenario: Bild fehlt
- **GIVEN** die Vorlage des Erdgeschosses ist mit 0,9986 px/cm kalibriert, ihr Bild ist aber nicht vorhanden
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Vorlage fehlt“ in Warnfarbe
