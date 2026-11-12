# Spec Delta

## MODIFIED Requirements

### Requirement: Raum nach Rückgängig und Wiederholen
Betrifft ein Rückgängig oder Wiederholen genau einen Raum einer Etage, der danach vorhanden ist, SHALL das System diese Etage aktiv machen und den Raum auswählen; eine ausgewählte Form MUST dann abgewählt sein. Das gilt auch, wenn derselbe Schritt Formen betrifft, die mit dem Raum verschoben wurden. Ist der betroffene Raum danach nicht vorhanden, MUST weder Raum noch Form ausgewählt sein.

#### Scenario: Verschieben rückgängig
- **GIVEN** der Nutzer hat im Erdgeschoss „Diele“ verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv, „Diele“ liegt an ihrer Ausgangslage und ist ausgewählt

#### Scenario: Verschieben mit Möbel rückgängig
- **GIVEN** der Nutzer hat „Bad“ samt einer Wanne mit Mittelpunkt (120 cm, 80 cm) um 30 cm nach links verschoben
- **WHEN** er einmal Strg+Z drückt
- **THEN** liegt „Bad“ an seiner Ausgangslage und der Mittelpunkt der Wanne wieder bei (120 cm, 80 cm)
- **AND** „Bad“ ist ausgewählt und die Wanne nicht

#### Scenario: Löschen wiederholen
- **GIVEN** der Nutzer hat „Diele“ gelöscht und danach Rückgängig gemacht
- **WHEN** er Strg+Umschalt+Z drückt
- **THEN** ist „Diele“ wieder gelöscht und nichts ist ausgewählt
