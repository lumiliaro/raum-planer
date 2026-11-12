## ADDED Requirements

### Requirement: Einstellungen als Schritte
Jede übernommene Änderung einer Einstellung und jedes „Auf Werkseinstellungen zurücksetzen“ SHALL genau einen Schritt bilden, auch nach dem Schließen des Dialogs. Rückgängig und Wiederholen einer Einstellung MUST NOT die aktive Etage oder die Auswahl ändern.

#### Scenario: Fangschritt rückgängig
- **GIVEN** der Nutzer hat den Fangschritt von 5 cm auf 2,5 cm geändert, den Dialog geschlossen und ein Sofa ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** ist der Fangschritt wieder 5 cm
- **AND** das Sofa ist weiter ausgewählt und die Etage unverändert
