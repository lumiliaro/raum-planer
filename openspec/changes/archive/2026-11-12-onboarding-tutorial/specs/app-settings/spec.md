# Spec Delta

## MODIFIED Requirements

### Requirement: Dialog „Einstellungen“
Die Schaltfläche „Einstellungen“ in der Kopfleiste SHALL den Dialog „Einstellungen“ öffnen. Er MUST die Abschnitte „Wände“, „Räume“, „Raster und Fangen“ und „Öffnungen“ mit je einem Feld pro Einstellung, Zahlen mit Einheit cm, darunter den Abschnitt „Tutorial“ mit der Schaltfläche „Tutorial neu starten“ (siehe app-tutorial) und unten „Auf Werkseinstellungen zurücksetzen“ und „Schließen“ zeigen. Esc und „Schließen“ SHALL ihn schließen; bereits übernommene Werte bleiben dabei erhalten. „Tutorial neu starten“ MUST NOT die Einstellungen des Plans ändern, und „Auf Werkseinstellungen zurücksetzen“ MUST NOT das Tutorial betreffen.

#### Scenario: Dialog öffnen
- **WHEN** der Nutzer in der Kopfleiste auf „Einstellungen“ klickt
- **THEN** öffnet sich der Dialog „Einstellungen“ mit den Abschnitten „Wände“, „Räume“, „Raster und Fangen“, „Öffnungen“ und „Tutorial“
- **AND** der Abschnitt „Wände“ zeigt „Wanddicke neuer Räume“ und „Wandfarbe“
- **AND** der Abschnitt „Tutorial“ zeigt „Tutorial neu starten“

#### Scenario: Schließen behält Werte
- **GIVEN** der Nutzer hat im Dialog die Wanddicke neuer Räume auf 11,5 cm geändert und Enter gedrückt
- **WHEN** er Esc drückt
- **THEN** ist der Dialog geschlossen und die Wanddicke neuer Räume ist 11,5 cm

#### Scenario: Neustart ändert keine Einstellung
- **GIVEN** die Wanddicke neuer Räume ist 11,5 cm
- **WHEN** der Nutzer auf „Tutorial neu starten“ klickt
- **THEN** ist die Wanddicke neuer Räume weiter 11,5 cm
- **AND** „Auf Werkseinstellungen zurücksetzen“ ist weiter möglich
