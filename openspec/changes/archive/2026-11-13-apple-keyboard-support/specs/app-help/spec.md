## MODIFIED Requirements

### Requirement: Liste der Tastenkürzel
Der Reiter „Tastenkürzel“ SHALL alle Tastenkürzel der App mit Taste und deutscher Beschreibung zeigen, gruppiert in „Allgemein“, „Werkzeuge“, „Auswahl“, „Ansicht“, „Beim Ziehen“ und „Raum und Wand zeichnen“. Tasten MUST mit deutschen Namen erscheinen (Strg, Umschalt, Entf, Rücktaste, Bild↑, Bild↓, Esc); auf Apple-Geräten MUST Strg, Umschalt und Alt als ⌘, ⇧ und ⌥ erscheinen. Jedes Werkzeug der Werkzeugleiste MUST mit seiner Taste in „Werkzeuge“ stehen.

#### Scenario: Gruppen und Einträge
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** stehen unter „Allgemein“: `?` Hilfe öffnen, Strg+Z Rückgängig, Strg+Umschalt+Z oder Strg+Y Wiederholen, Esc Werkzeug abbrechen bzw. Auswahl aufheben
- **AND** unter „Werkzeuge“: V Auswählen, R Rechteck, E Ellipse, L L-Form, U U-Form, C Ecke, G Raum, W Wand, T Tür, F Fenster, D Durchgang
- **AND** unter „Auswahl“: Strg+C Kopieren, Strg+X Ausschneiden, Strg+V Einfügen, Strg+D Duplizieren, Entf oder Rücktaste Löschen, Bild↑/Bild↓ eine Ebene nach vorne/hinten, Umschalt+Bild↑/Umschalt+Bild↓ ganz nach vorne/hinten
- **AND** unter „Ansicht“: + Vergrößern, − Verkleinern, 0 Einpassen, Mausrad Zoomen, Ziehen auf freier Fläche Ansicht verschieben, M Maße ein-/ausblenden, B Vorlage ein-/ausblenden
- **AND** unter „Beim Ziehen“: Alt Schritte von 1 cm statt 5 cm, Strg ohne Einrasten an Formen und ohne Haften an Wänden, Umschalt Tür, Fenster oder Durchgang ohne Einrasten an Rastpunkten
- **AND** unter „Raum und Wand zeichnen“: Ziffern Länge in cm eingeben bzw. vor dem ersten Punkt an einer Wand Abstand auf der Wand eingeben, Enter Punkt setzen bzw. bei leerem Feld Umriss schließen, Tab Abstand vom anderen Wandende messen, Rücktaste Zeichen bzw. letzten Punkt löschen, Alt Startpunkt auf der Wand in Schritten von 1 cm statt 5 cm, Umschalt Kante bzw. Wand ohne Einrasten auf 0°/90°/180°/270°, Strg ohne Hilfslinien und ohne Einrasten an Wänden, Esc Umriss bzw. Startpunkt verwerfen

#### Scenario: Neues Werkzeug erscheint in der Liste
- **GIVEN** die Werkzeugleiste bekommt ein weiteres Werkzeug mit eigener Taste
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** steht das Werkzeug mit seiner Taste unter „Werkzeuge“

#### Scenario: Tastenkürzel auf dem Mac
- **GIVEN** die App läuft auf einem Mac oder iPad
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** stehen unter „Allgemein“: ⌘Z Rückgängig, ⇧⌘Z oder ⌘Y Wiederholen
- **AND** unter „Auswahl“: ⌘C Kopieren, ⌘X Ausschneiden, ⌘V Einfügen, ⌘D Duplizieren, ⇧Bild↑/⇧Bild↓ ganz nach vorne/hinten
- **AND** unter „Beim Ziehen“: ⌥ Schritte von 1 cm statt 5 cm, ⌘ ohne Einrasten an Formen und ohne Haften an Wänden, ⇧ Tür, Fenster oder Durchgang ohne Einrasten an Rastpunkten
