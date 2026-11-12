# Spec Delta

## Purpose

Führt neue Nutzer in einem kurzen Rundgang durch die Grundfunktionen der App, direkt an den Elementen der Oberfläche. Legt fest, wann der Rundgang von selbst startet, wie man ihn bedient und überspringt und wie man ihn erneut startet.

## ADDED Requirements

### Requirement: Schritte des Tutorials
Das Tutorial SHALL in dieser Reihenfolge die Schritte „Willkommen“, „Etagen“, „Vorlage hochladen“, „Vorlage kalibrieren“, „Raum zeichnen“, „Türen, Fenster und Durchgänge“, „Möbel platzieren“, „Eigenschaften“, „Automatisch gespeichert“, „Exportieren, Importieren und PDF“ und „Hilfe“ zeigen. Jeder Schritt MUST einen deutschen Titel und einen kurzen deutschen Text haben; „Willkommen“ MUST zusätzlich den Datenschutzhinweis enthalten. Außer „Willkommen“ SHALL jeder Schritt auf ein Element der Oberfläche zeigen: Etagen-Umschalter, Abschnitt „Vorlage“ im Eigenschaften-Panel, „Vorlage kalibrieren“, Werkzeug „Raum“, Werkzeug „Tür“, Werkzeug „Rechteck“, Eigenschaften-Panel, Speicherstatus, „Exportieren“ und „Hilfe“.

#### Scenario: Inhalt des Schritts „Willkommen“
- **GIVEN** das Tutorial ist bei „Willkommen“
- **THEN** steht die Sprechblase mittig über der Zeichenfläche ohne Hervorhebung
- **AND** der Text sagt kurz, wofür die App da ist und dass man das Tutorial jederzeit überspringen kann
- **AND** der Text sagt, dass die App komplett im Browser läuft, es kein Konto gibt und alle Daten nur in diesem Browser gespeichert und nicht an einen Server geschickt werden
- **AND** der Text verweist für Einzelheiten auf „Hilfe → Datenschutz“

#### Scenario: Inhalt des Schritts „Raum zeichnen“
- **GIVEN** das Tutorial ist bei „Raum zeichnen“
- **THEN** ist das Werkzeug „Raum“ hervorgehoben und die Sprechblase steht daneben
- **AND** der Text erklärt, dass man die Ecken des Raums nacheinander anklickt oder eine Länge in cm eintippt und mit Enter bestätigt, und den Umriss am Startpunkt schließt

#### Scenario: Inhalt des Schritts „Automatisch gespeichert“
- **GIVEN** das Tutorial ist bei „Automatisch gespeichert“
- **THEN** ist der Speicherstatus hervorgehoben
- **AND** der Text sagt, dass jede Änderung automatisch in diesem Browser gespeichert wird und „Exportieren“ eine Sicherungsdatei erstellt

#### Scenario: Ziel nicht sichtbar
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet
- **WHEN** das Tutorial den Schritt „Eigenschaften“ zeigt
- **THEN** steht die Sprechblase mittig über der Zeichenfläche ohne Hervorhebung
- **AND** der Text ist derselbe

### Requirement: Bedienung des Tutorials
Die Sprechblase SHALL „Schritt N von M“, „Überspringen“, „Zurück“ und „Weiter“ zeigen; im ersten Schritt MUST „Zurück“ fehlen, im letzten Schritt MUST statt „Weiter“ „Fertig“ stehen und „Überspringen“ fehlen. „Weiter“ und „Zurück“ SHALL einen Schritt vor bzw. zurück gehen. „Überspringen“, „Fertig“ und `Esc` bei Fokus in der Sprechblase SHALL das Tutorial beenden. Das Tutorial MUST NOT den Plan verändern, MUST NOT einen Rückgängig-Schritt bilden und MUST NOT die übrige Oberfläche sperren.

#### Scenario: Weiter und Zurück
- **GIVEN** das Tutorial zeigt Schritt 3 von 11
- **WHEN** der Nutzer auf „Weiter“ und dann zweimal auf „Zurück“ klickt
- **THEN** zeigt das Tutorial Schritt 2 von 11

#### Scenario: Letzter Schritt
- **GIVEN** das Tutorial zeigt Schritt 11 von 11 („Hilfe“)
- **THEN** zeigt die Sprechblase „Zurück“ und „Fertig“, aber weder „Weiter“ noch „Überspringen“
- **WHEN** der Nutzer auf „Fertig“ klickt
- **THEN** ist das Tutorial beendet und nichts ist mehr hervorgehoben

#### Scenario: Überspringen
- **GIVEN** das Tutorial zeigt Schritt 4 von 11
- **WHEN** der Nutzer auf „Überspringen“ klickt
- **THEN** ist das Tutorial beendet

#### Scenario: Esc in der Sprechblase
- **GIVEN** das Tutorial zeigt einen Schritt und der Fokus liegt in der Sprechblase
- **WHEN** der Nutzer `Esc` drückt
- **THEN** ist das Tutorial beendet
- **AND** Werkzeug und Auswahl sind unverändert

#### Scenario: Nebenbei ausprobieren
- **GIVEN** das Tutorial zeigt „Möbel platzieren“
- **WHEN** der Nutzer das Werkzeug „Rechteck“ wählt und auf die Zeichenfläche klickt
- **THEN** wird ein Rechteck angelegt wie ohne Tutorial
- **AND** das Tutorial zeigt weiter „Möbel platzieren“

#### Scenario: Kein Rückgängig-Schritt
- **GIVEN** der Nutzer hat ein Rechteck auf 120 cm Breite geändert
- **WHEN** er das Tutorial neu startet, zweimal auf „Weiter“ klickt, es überspringt und dann Strg+Z drückt
- **THEN** ist die Breitenänderung rückgängig gemacht

### Requirement: Automatischer Start beim ersten Aufruf
Das Tutorial SHALL beim Laden der App automatisch bei Schritt 1 starten, wenn in diesem Browser noch kein Plan gespeichert war und das Tutorial in diesem Browser noch nie beendet oder übersprungen wurde. In allen anderen Fällen MUST es nicht von selbst starten, auch nicht, wenn der Browser-Speicher nicht verfügbar ist. Beenden und Überspringen SHALL sich der Browser merken; diese Angabe MUST NOT Teil des Plans oder des Exports sein.

#### Scenario: Erster Aufruf
- **GIVEN** in diesem Browser ist kein Plan gespeichert und das Tutorial wurde nie beendet
- **WHEN** die App geladen wird
- **THEN** zeigt das Tutorial Schritt 1 von 11 („Willkommen“)

#### Scenario: Nach dem Überspringen
- **GIVEN** der Nutzer hat das Tutorial übersprungen und noch nichts gezeichnet
- **WHEN** er die App neu lädt
- **THEN** startet das Tutorial nicht

#### Scenario: Bestehender Plan
- **GIVEN** in diesem Browser ist ein Plan gespeichert und das Tutorial wurde nie beendet
- **WHEN** die App geladen wird
- **THEN** startet das Tutorial nicht

#### Scenario: Neu geladen mitten im Tutorial
- **GIVEN** das Tutorial wurde automatisch gestartet und zeigt Schritt 5, der Plan ist noch leer und nie gespeichert
- **WHEN** der Nutzer die App neu lädt
- **THEN** zeigt das Tutorial wieder Schritt 1

#### Scenario: Nicht im Export
- **GIVEN** der Nutzer hat das Tutorial beendet
- **WHEN** er den Plan exportiert
- **THEN** enthält die Datei keine Angabe zum Tutorial

### Requirement: Tutorial neu starten
„Tutorial neu starten“ im Dialog „Einstellungen“ SHALL den Dialog schließen und das Tutorial bei Schritt 1 starten, unabhängig davon, ob es schon beendet oder übersprungen wurde.

#### Scenario: Neustart aus den Einstellungen
- **GIVEN** der Nutzer hat das Tutorial früher übersprungen
- **WHEN** er im Dialog „Einstellungen“ auf „Tutorial neu starten“ klickt
- **THEN** ist der Dialog „Einstellungen“ geschlossen
- **AND** das Tutorial zeigt Schritt 1 von 11 („Willkommen“)
