# Spec Delta

## MODIFIED Requirements

### Requirement: Liste der Tastenkürzel
Der Reiter „Tastenkürzel“ SHALL alle Tastenkürzel der App mit Taste und deutscher Beschreibung zeigen, gruppiert in „Allgemein“, „Werkzeuge“, „Auswahl“, „Ansicht“, „Beim Ziehen“ und „Raum zeichnen“. Tasten MUST mit deutschen Namen erscheinen (Strg, Umschalt, Entf, Rücktaste, Bild↑, Bild↓, Esc). Jedes Werkzeug der Werkzeugleiste MUST mit seiner Taste in „Werkzeuge“ stehen.

#### Scenario: Gruppen und Einträge
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** stehen unter „Allgemein“: `?` Hilfe öffnen, Strg+Z Rückgängig, Strg+Umschalt+Z oder Strg+Y Wiederholen, Esc Werkzeug abbrechen bzw. Auswahl aufheben
- **AND** unter „Werkzeuge“: V Auswählen, R Rechteck, E Ellipse, L L-Form, U U-Form, C Ecke, G Raum, T Tür, F Fenster, D Durchgang
- **AND** unter „Auswahl“: Strg+C Kopieren, Strg+X Ausschneiden, Strg+V Einfügen, Strg+D Duplizieren, Entf oder Rücktaste Löschen, Bild↑/Bild↓ eine Ebene nach vorne/hinten, Umschalt+Bild↑/Umschalt+Bild↓ ganz nach vorne/hinten
- **AND** unter „Ansicht“: + Vergrößern, − Verkleinern, 0 Einpassen, Mausrad Zoomen, Ziehen auf freier Fläche Ansicht verschieben, M Maße ein-/ausblenden, B Vorlage ein-/ausblenden
- **AND** unter „Beim Ziehen“: Alt Schritte von 1 cm statt 5 cm, Strg ohne Einrasten an Formen und ohne Haften an Wänden, Umschalt Tür, Fenster oder Durchgang ohne Einrasten an Rastpunkten
- **AND** unter „Raum zeichnen“: Ziffern Länge in cm eingeben, Enter Eckpunkt setzen bzw. bei leerem Feld Umriss schließen, Rücktaste Zeichen bzw. letzten Eckpunkt löschen, Umschalt Kante ohne Einrasten auf 0°/90°/180°/270°, Esc Umriss verwerfen

#### Scenario: Neues Werkzeug erscheint in der Liste
- **GIVEN** die Werkzeugleiste bekommt ein weiteres Werkzeug mit eigener Taste
- **WHEN** der Nutzer den Reiter „Tastenkürzel“ öffnet
- **THEN** steht das Werkzeug mit seiner Taste unter „Werkzeuge“
