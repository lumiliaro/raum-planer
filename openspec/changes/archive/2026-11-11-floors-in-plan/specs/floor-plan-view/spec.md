# Spec Delta

## ADDED Requirements

### Requirement: Etage ohne Grundriss
Hat eine Etage kein Grundrissbild, SHALL die Zeichenfläche mittig den Hinweis „Für diese Etage gibt es noch keinen Grundriss.“ zeigen. Zoom-Leiste und Etagen-Umschalter MUST bedienbar bleiben. Grundrissbilder gibt es bis zum Change `floor-underlay` nur für die aus Version 1 übernommenen Etagen Erdgeschoss, Obergeschoss und Dachgeschoss.

#### Scenario: Neue Etage
- **GIVEN** der Nutzer hat die Etage „Keller“ angelegt
- **WHEN** der Keller aktiv ist
- **THEN** zeigt die Zeichenfläche „Für diese Etage gibt es noch keinen Grundriss.“
- **AND** der Umschalter bleibt bedienbar

## MODIFIED Requirements

### Requirement: Start mit der zuletzt aktiven Etage
Das System SHALL beim Start die Etage als aktive Etage anzeigen, die im gespeicherten Plan zuletzt aktiv war. Gibt es keinen gespeicherten Plan oder ist er unlesbar, MUST die einzige Etage des neuen leeren Plans (Erdgeschoss) aktiv sein.

#### Scenario: App-Start
- **GIVEN** in diesem Browser ist kein Plan gespeichert
- **WHEN** die App geladen wird
- **THEN** ist „Erdgeschoss“ im Umschalter aktiv markiert und die einzige Etage

#### Scenario: App-Start nach Arbeit im Dachgeschoss
- **GIVEN** der Nutzer hat zuletzt im Dachgeschoss gearbeitet
- **WHEN** er die Seite neu lädt
- **THEN** ist „Dachgeschoss“ im Umschalter aktiv markiert
- **AND** die Zeichenfläche zeigt den Grundriss des Dachgeschosses

### Requirement: Etage umschalten
Der Etagen-Umschalter SHALL alle Etagen des Plans in ihrer Reihenfolge mit ihrem Namen zeigen. Beim Auswählen einer Etage SHALL das System deren Grundriss und Formen anzeigen und die Etage als aktiv markieren.

#### Scenario: Wechsel ins Obergeschoss
- **GIVEN** das Erdgeschoss ist aktiv
- **WHEN** der Nutzer „Obergeschoss“ anklickt
- **THEN** zeigt die Zeichenfläche den Grundriss des Obergeschosses
- **AND** „Obergeschoss“ ist im Umschalter aktiv markiert

#### Scenario: Umbenannte Etage
- **GIVEN** der Nutzer hat das Dachgeschoss in „Studio“ umbenannt
- **THEN** zeigt der Umschalter „Studio“ an der Stelle des Dachgeschosses

## REMOVED Requirements

### Requirement: Feste Etagen
**Reason**: Etagen sind jetzt Nutzerdaten im Plan und lassen sich anlegen, umbenennen, sortieren und löschen.
**Migration**: Siehe `floor-management`. Bestehende Pläne bekommen beim Umwandeln von Version 1 die Etagen Erdgeschoss, Obergeschoss und Dachgeschoss. Bilder hochladen kommt mit `floor-underlay`.
