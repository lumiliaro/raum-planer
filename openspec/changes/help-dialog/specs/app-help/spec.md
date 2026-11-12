# Spec Delta

## Purpose

Bündelt die Hilfe in der App: eine vollständige Liste der Tastenkürzel und den Hinweis, dass alle Daten nur lokal im Browser liegen. Dazu die Wege, diese Hilfe zu öffnen.

## ADDED Requirements

### Requirement: Hilfe-Dialog
Das System SHALL einen Dialog „Hilfe“ mit den beiden Reitern „Tastenkürzel“ und „Datenschutz“ bieten. Es MUST immer genau ein Reiter sichtbar sein. „Schließen“, `Esc` und ein Klick neben den Dialog SHALL ihn schließen. Öffnen, Reiterwechsel und Schließen MUST NOT den Plan verändern und MUST NOT einen Rückgängig-Schritt bilden.

#### Scenario: Dialog schließen
- **GIVEN** der Dialog „Hilfe“ ist offen
- **WHEN** der Nutzer `Esc` drückt
- **THEN** ist der Dialog geschlossen
- **AND** Auswahl, Werkzeug und Plan sind unverändert

#### Scenario: Reiter wechseln
- **GIVEN** der Dialog „Hilfe“ zeigt den Reiter „Tastenkürzel“
- **WHEN** der Nutzer auf „Datenschutz“ klickt
- **THEN** zeigt der Dialog den Datenschutzhinweis und nicht mehr die Tastenkürzel

#### Scenario: Kein Rückgängig-Schritt
- **GIVEN** der Nutzer hat ein Rechteck auf 200 cm Breite geändert
- **WHEN** er den Dialog „Hilfe“ öffnet, schließt und dann Strg+Z drückt
- **THEN** ist die Breitenänderung rückgängig gemacht

### Requirement: Liste der Tastenkürzel
Der Reiter „Tastenkürzel“ SHALL alle Tastenkürzel der App mit Taste und deutscher Beschreibung zeigen, gruppiert in „Allgemein“, „Werkzeuge“, „Auswahl“, „Ansicht“, „Beim Ziehen“ und „Raum zeichnen“. Tasten MUST mit deutschen Namen erscheinen (Strg, Umschalt, Entf, Rücktaste, Bild↑, Bild↓, Esc). Jedes Werkzeug der Werkzeugleiste MUST mit seiner Taste in „Werkzeuge“ stehen.

#### Scenario: Gruppen und Einträge
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** stehen unter „Allgemein“: `?` Hilfe öffnen, Strg+Z Rückgängig, Strg+Umschalt+Z oder Strg+Y Wiederholen, Esc Werkzeug abbrechen bzw. Auswahl aufheben
- **AND** unter „Werkzeuge“: V Auswählen, R Rechteck, E Ellipse, L L-Form, U U-Form, C Ecke, G Raum, T Tür, F Fenster, D Durchgang
- **AND** unter „Auswahl“: Entf oder Rücktaste Löschen, Bild↑/Bild↓ eine Ebene nach vorne/hinten, Umschalt+Bild↑/Umschalt+Bild↓ ganz nach vorne/hinten
- **AND** unter „Ansicht“: + Vergrößern, − Verkleinern, 0 Einpassen, Mausrad Zoomen, Ziehen auf freier Fläche Ansicht verschieben, M Maße ein-/ausblenden, B Vorlage ein-/ausblenden
- **AND** unter „Beim Ziehen“: Alt Schritte von 1 cm statt 5 cm, Strg ohne Einrasten an Formen und ohne Haften an Wänden, Umschalt Tür, Fenster oder Durchgang ohne Einrasten an Rastpunkten
- **AND** unter „Raum zeichnen“: Ziffern Länge in cm eingeben, Enter Eckpunkt setzen bzw. bei leerem Feld Umriss schließen, Rücktaste Zeichen bzw. letzten Eckpunkt löschen, Umschalt Kante ohne Einrasten auf 0°/90°/180°/270°, Esc Umriss verwerfen

#### Scenario: Neues Werkzeug erscheint in der Liste
- **GIVEN** die Werkzeugleiste bekommt ein weiteres Werkzeug mit eigener Taste
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** steht das Werkzeug mit seiner Taste unter „Werkzeuge“

### Requirement: Datenschutzhinweis
Der Reiter „Datenschutz“ SHALL in deutscher Sprache erklären, dass die App vollständig im Browser läuft, dass es kein Konto und keinen Server gibt und dass Plan und Vorlagenbilder nur im Speicher dieses Browsers liegen und nicht übertragen werden. Er MUST außerdem sagen, dass jeder Browser und jedes Gerät einen eigenen Stand hat, dass der Browser seinen Speicher leeren kann und dass „Exportieren“ eine Sicherung als Datei erstellt.

#### Scenario: Inhalt des Hinweises
- **WHEN** der Nutzer den Reiter „Datenschutz“ öffnet
- **THEN** steht dort, dass alle Daten nur in diesem Browser gespeichert und nicht an einen Server geschickt werden
- **AND** dass es kein Konto gibt
- **AND** dass ein anderer Browser oder ein anderes Gerät den Plan nicht kennt
- **AND** dass „Exportieren“ eine Sicherungsdatei erstellt, weil der Browser seinen Speicher leeren kann

### Requirement: Hilfe per Schaltfläche öffnen
Die Schaltfläche „Hilfe“ in der Kopfleiste SHALL den Dialog mit dem Reiter „Tastenkürzel“ öffnen. Ihr Tooltip MUST „Hilfe und Tastenkürzel (?)“ lauten.

#### Scenario: Klick auf Hilfe
- **WHEN** der Nutzer auf die Schaltfläche „Hilfe“ klickt
- **THEN** ist der Dialog „Hilfe“ offen und zeigt den Reiter „Tastenkürzel“

### Requirement: Hilfe per Taste öffnen
Die Taste `?` SHALL den Dialog mit dem Reiter „Tastenkürzel“ öffnen, auch im Kalibrier-Modus und während ein Raum gezeichnet wird. Sie MUST NOT wirken, wenn ein Textfeld den Fokus hat oder ein anderer Dialog offen ist. Ein angefangener Raum-Umriss MUST beim Öffnen und Schließen der Hilfe erhalten bleiben.

#### Scenario: Taste ? öffnet die Hilfe
- **GIVEN** kein Eingabefeld hat den Fokus
- **WHEN** der Nutzer `?` drückt
- **THEN** ist der Dialog „Hilfe“ offen und zeigt den Reiter „Tastenkürzel“

#### Scenario: Im Textfeld
- **GIVEN** das Feld „Beschriftung“ im Eigenschaften-Panel hat den Fokus
- **WHEN** der Nutzer `?` tippt
- **THEN** steht „?“ im Feld und der Dialog „Hilfe“ öffnet sich nicht

#### Scenario: Während ein Raum gezeichnet wird
- **GIVEN** der Nutzer hat mit „Raum“ zwei Eckpunkte gesetzt
- **WHEN** er `?` drückt und den Dialog danach mit `Esc` schließt
- **THEN** sind beide Eckpunkte noch gesetzt und das Werkzeug „Raum“ ist weiter aktiv

#### Scenario: Anderer Dialog offen
- **GIVEN** der Dialog „Einstellungen“ ist offen
- **WHEN** der Nutzer `?` drückt
- **THEN** öffnet sich der Dialog „Hilfe“ nicht

### Requirement: Hilfe über den Speicherstatus öffnen
Ein Klick auf den Speicherstatus in der Statusleiste SHALL den Dialog mit dem Reiter „Datenschutz“ öffnen, sowohl bei „Lokal gespeichert“ als auch bei „Nicht gespeichert“.

#### Scenario: Klick auf „Lokal gespeichert“
- **GIVEN** die Statusleiste zeigt „Lokal gespeichert“
- **WHEN** der Nutzer darauf klickt
- **THEN** ist der Dialog „Hilfe“ offen und zeigt den Reiter „Datenschutz“
