# app-settings Specification

## Purpose

Legt die Einstellungen eines Plans fest: Standardwerte für neue Räume und Öffnungen, Raster, Fangschritte und Wandfarbe. Außerdem regelt sie, wie der Nutzer sie im Dialog „Einstellungen“ ändert und wie sie auf die Zeichenfläche wirken.

## Requirements

### Requirement: Gültige Einstellungen
Die Einstellungen eines Plans SHALL enthalten: Wanddicke neuer Räume (größer als 0 cm, höchstens 100 cm), Wandfarbe (`#RRGGBB`), Farbe neuer Räume (`#RRGGBB` oder „Standard“), Rasterabstand (10 cm bis 1 000 cm), Fangschritt (0,1 cm bis 100 cm), feiner Fangschritt (ab 0,1 cm, höchstens so groß wie der Fangschritt) und die Standardbreiten von Tür, Fenster und Durchgang (je größer als 0 cm, höchstens 1 000 cm).

#### Scenario: Gültige Werte
- **WHEN** Einstellungen mit Wanddicke 11,5 cm, Wandfarbe #3F3F46, Farbe neuer Räume „Standard“, Rasterabstand 50 cm, Fangschritt 2,5 cm, feinem Fangschritt 0,5 cm, Tür 88,5 cm, Fenster 101 cm und Durchgang 90 cm geprüft werden
- **THEN** gelten sie als gültig

#### Scenario: Feiner Schritt zu groß
- **WHEN** Einstellungen mit Fangschritt 5 cm und feinem Fangschritt 10 cm geprüft werden
- **THEN** gelten sie als ungültig

### Requirement: Werkseinstellungen
Ein neuer Plan SHALL die Werkseinstellungen haben: Wanddicke neuer Räume 15 cm, Wandfarbe #3F3F46, Farbe neuer Räume „Standard“, Rasterabstand 100 cm, Fangschritt 5 cm, feiner Fangschritt 1 cm, Tür 80 cm, Fenster 120 cm, Durchgang 100 cm. Feste Werte dieser Größen in anderen Anforderungen MUST als Werkseinstellung gelten; ist eine Einstellung geändert, gilt dort stattdessen der eingestellte Wert.

#### Scenario: Neuer Plan
- **WHEN** ein neuer Plan angelegt wird
- **THEN** zeigt der Dialog „Einstellungen“ Wanddicke „15“, Rasterabstand „100“, Fangschritt „5“, feinen Fangschritt „1“, Tür „80“, Fenster „120“ und Durchgang „100“
- **AND** als Farbe neuer Räume ist „Standard“ markiert

#### Scenario: Anforderung mit festem Wert
- **GIVEN** die Standardbreite für Türen ist auf 88,5 cm eingestellt
- **WHEN** der Nutzer mit „Tür“ eine Tür setzt (siehe „Öffnung setzen“ in `room-openings`, dort 80 cm)
- **THEN** ist die neue Tür 88,5 cm breit

### Requirement: Dialog „Einstellungen“
Die Schaltfläche „Einstellungen“ in der Kopfleiste SHALL den Dialog „Einstellungen“ öffnen. Er MUST die Abschnitte „Wände“, „Räume“, „Raster und Fangen“ und „Öffnungen“ mit je einem Feld pro Einstellung, Zahlen mit Einheit cm, und unten „Auf Werkseinstellungen zurücksetzen“ und „Schließen“ zeigen. Esc und „Schließen“ SHALL ihn schließen; bereits übernommene Werte bleiben dabei erhalten.

#### Scenario: Dialog öffnen
- **WHEN** der Nutzer in der Kopfleiste auf „Einstellungen“ klickt
- **THEN** öffnet sich der Dialog „Einstellungen“ mit den Abschnitten „Wände“, „Räume“, „Raster und Fangen“ und „Öffnungen“
- **AND** der Abschnitt „Wände“ zeigt „Wanddicke neuer Räume“ und „Wandfarbe“

#### Scenario: Schließen behält Werte
- **GIVEN** der Nutzer hat im Dialog die Wanddicke neuer Räume auf 11,5 cm geändert und Enter gedrückt
- **WHEN** er Esc drückt
- **THEN** ist der Dialog geschlossen und die Wanddicke neuer Räume ist 11,5 cm

### Requirement: Einstellung ändern
Ein Zahlenfeld im Dialog SHALL wie im Eigenschaften-Panel mit Enter oder beim Verlassen übernommen werden, Komma oder Punkt annehmen und auf 0,1 cm runden. Ein Wert außerhalb seiner Grenzen MUST abgelehnt werden; das Feld zeigt dann die Grenze, z. B. „Muss zwischen 10 cm und 1 000 cm liegen“, und die Einstellung bleibt. Farben SHALL wie im Raum-Panel über Farbfelder bzw. Farbwähler sofort gesetzt werden.

#### Scenario: Rasterabstand zu klein
- **WHEN** der Nutzer im Feld „Rasterabstand“ „5“ eingibt und Enter drückt
- **THEN** zeigt das Feld „Muss zwischen 10 cm und 1 000 cm liegen“ und der Rasterabstand bleibt 100 cm

#### Scenario: Feiner Fangschritt zu groß
- **GIVEN** der Fangschritt ist 5 cm
- **WHEN** der Nutzer im Feld „Feiner Fangschritt (Alt)“ „10“ eingibt und das Feld verlässt
- **THEN** zeigt das Feld „Darf höchstens 5 cm sein“ und der feine Fangschritt bleibt 1 cm

#### Scenario: Wandfarbe
- **WHEN** der Nutzer im Abschnitt „Wände“ als Wandfarbe #1F2937 bestätigt
- **THEN** sind alle Wandbänder aller Etagen in #1F2937 gezeichnet

### Requirement: Auf Werkseinstellungen zurücksetzen
„Auf Werkseinstellungen zurücksetzen“ SHALL ohne Rückfrage alle Einstellungen auf die Werkseinstellungen setzen und einen einzigen Rückgängig-Schritt bilden. Sind bereits alle Einstellungen Werkseinstellungen, MUST die Schaltfläche gesperrt sein.

#### Scenario: Zurücksetzen
- **GIVEN** die Wanddicke neuer Räume ist 11,5 cm und der Fangschritt 2,5 cm
- **WHEN** der Nutzer auf „Auf Werkseinstellungen zurücksetzen“ klickt
- **THEN** ist die Wanddicke neuer Räume 15 cm und der Fangschritt 5 cm
- **AND** die Schaltfläche ist gesperrt
- **WHEN** er Strg+Z drückt
- **THEN** sind die Wanddicke neuer Räume wieder 11,5 cm und der Fangschritt wieder 2,5 cm

### Requirement: Standardwerte für neue Räume und Öffnungen
Ein neu gezeichneter Raum SHALL an jeder Kante die eingestellte Wanddicke neuer Räume und die eingestellte Farbe neuer Räume bekommen. Eine neu gesetzte Tür, ein Fenster oder ein Durchgang SHALL die eingestellte Standardbreite bekommen, bei kürzerer Kante deren Länge. Vorhandene Räume und Öffnungen MUST NOT sich durch eine Änderung der Einstellungen ändern.

#### Scenario: Innenwände
- **GIVEN** die Wanddicke neuer Räume ist auf 11,5 cm eingestellt und „Wohnen“ hat an jeder Kante 15 cm
- **WHEN** der Nutzer einen neuen Raum mit vier Ecken zeichnet
- **THEN** hat der neue Raum an jeder Kante 11,5 cm Wanddicke
- **AND** „Wohnen“ hat weiter an jeder Kante 15 cm

#### Scenario: Farbe neuer Räume
- **GIVEN** als Farbe neuer Räume ist Grün eingestellt
- **WHEN** der Nutzer einen Raum zeichnet und schließt
- **THEN** ist die Fläche des neuen Raums halbtransparent grün

### Requirement: Raster und Fangschritt
Das Raster der Zeichenfläche SHALL Linien im eingestellten Rasterabstand zeigen. Ziehen und Größenänderung von Formen sowie Ziehen von Räumen und Öffnungen SHALL relativ zur Startlage in Schritten des eingestellten Fangschritts erfolgen, bei gedrückter Alt-Taste in Schritten des feinen Fangschritts. Eine Änderung MUST sofort wirken.

#### Scenario: Feineres Raster
- **GIVEN** die aktive Etage hat keine sichtbare Vorlage
- **WHEN** der Nutzer den Rasterabstand auf 50 cm setzt
- **THEN** zeigt die Zeichenfläche Rasterlinien alle 50 cm

#### Scenario: Fangschritt 2,5 cm
- **GIVEN** der Fangschritt ist auf 2,5 cm eingestellt und ein Rechteck liegt bei x = 100 cm
- **WHEN** der Nutzer es um 6 cm nach rechts zieht
- **THEN** liegt es bei x = 105 cm

#### Scenario: Feiner Fangschritt
- **GIVEN** der feine Fangschritt ist auf 0,5 cm eingestellt und ein Rechteck liegt bei x = 100 cm
- **WHEN** der Nutzer es mit gedrückter Alt-Taste um 6,3 cm nach rechts zieht
- **THEN** liegt es bei x = 106,5 cm
