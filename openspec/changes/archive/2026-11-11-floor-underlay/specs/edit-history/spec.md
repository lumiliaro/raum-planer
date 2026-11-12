# Spec Delta

## MODIFIED Requirements

### Requirement: Umfang eines Schritts
Jede abgeschlossene Änderung am Plan SHALL genau einen Schritt bilden: Einfügen, ein vollständiges Ziehen, Drehen oder Ändern der Größe (vom Drücken bis zum Loslassen), eine übernommene Eingabe im Eigenschaften-Formular, Löschen, Umordnen, Sperren oder Entsperren, das Speichern einer Kalibrierung, ein Import, das Anlegen, Umbenennen, Sortieren und Löschen einer Etage sowie das Hochladen, Ersetzen und Entfernen eines Vorlagenbilds, das Ein- oder Ausblenden der Vorlage und eine übernommene Deckkraft. Abgelehnte Änderungen MUST keinen Schritt bilden.

#### Scenario: Ziehen ist ein Schritt
- **GIVEN** der Nutzer zieht eine Form in einem Zug über 120 cm nach rechts
- **WHEN** er danach einmal Strg+Z drückt
- **THEN** liegt die Form wieder an ihrer Ausgangslage

#### Scenario: Ungültige Eingabe
- **GIVEN** eine Eingabe im Formular wurde als ungültig abgelehnt
- **WHEN** der Nutzer Strg+Z drückt
- **THEN** wird die Änderung davor rückgängig gemacht

#### Scenario: Kalibrierung rückgängig
- **GIVEN** die Vorlage des Erdgeschosses ist mit 0,7480 px/cm kalibriert und der Nutzer hat eine neue Kalibrierung mit 0,9986 px/cm gespeichert
- **AND** er ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv und die Statusleiste zeigt „Maßstab: 0,7480 px/cm“

#### Scenario: Kalibrierung bleibt bei späterem Rückgängig
- **GIVEN** der Nutzer hat die Vorlage des Erdgeschosses mit 0,9986 px/cm kalibriert und danach einen Schrank um 50 cm verschoben
- **WHEN** er einmal Strg+Z drückt
- **THEN** liegt der Schrank wieder an seiner Ausgangslage
- **AND** die Statusleiste zeigt weiterhin „Maßstab: 0,9986 px/cm“

#### Scenario: Umbenennen einer Etage rückgängig
- **GIVEN** der Nutzer hat das Dachgeschoss in „Studio“ umbenannt
- **WHEN** er Strg+Z drückt
- **THEN** heißt die Etage wieder „Dachgeschoss“

#### Scenario: Deckkraft ist ein Schritt
- **GIVEN** die Vorlage hat die Deckkraft 100 % und der Nutzer zieht den Regler in einem Zug auf 40 %
- **WHEN** er Strg+Z drückt
- **THEN** hat die Vorlage wieder die Deckkraft 100 %

### Requirement: Etage und Auswahl nach Rückgängig und Wiederholen
Betrifft ein Rückgängig oder Wiederholen Formen, die Vorlage oder Name bzw. Lage genau einer Etage, die danach vorhanden ist, SHALL das System diese Etage aktiv machen. Ist danach genau eine Form betroffen und auf dieser Etage vorhanden, MUST sie ausgewählt sein; sonst MUST keine Form ausgewählt sein. Sonst gilt die aktive Etage des wiederhergestellten Stands. In jedem Fall MUST danach eine vorhandene Etage aktiv sein.

#### Scenario: Änderung auf anderer Etage
- **GIVEN** der Nutzer hat im Erdgeschoss ein Sofa verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv
- **AND** das Sofa liegt an seiner Ausgangslage und ist ausgewählt

#### Scenario: Einfügen rückgängig
- **GIVEN** der Nutzer hat ein Rechteck eingefügt, es ist ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** ist keine Form ausgewählt

#### Scenario: Anlegen einer Etage rückgängig
- **GIVEN** der Nutzer hat die Etage „Neue Etage“ angelegt, sie ist aktiv
- **WHEN** er Strg+Z drückt
- **THEN** ist „Neue Etage“ verschwunden
- **AND** die vorher aktive Etage ist wieder aktiv

#### Scenario: Ausblenden auf anderer Etage rückgängig
- **GIVEN** der Nutzer hat die Vorlage des Erdgeschosses ausgeblendet und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv und seine Vorlage wieder sichtbar
