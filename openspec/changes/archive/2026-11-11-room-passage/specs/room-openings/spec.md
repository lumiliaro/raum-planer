## ADDED Requirements

### Requirement: Werkzeug „Durchgang“
Die Werkzeugleiste SHALL direkt unter „Fenster“ das Werkzeug „Durchgang“ mit eigenem Icon und dem Tooltip „Durchgang – offene Wand (D)“ anbieten. Die Taste D MUST es aktivieren, außer ein Eingabefeld hat den Fokus. Hat die aktive Etage keinen Raum oder ist der Kalibrier-Modus aktiv, MUST es samt Taste gesperrt sein; der Tooltip lautet dann „Durchgang – zuerst einen Raum zeichnen“.

#### Scenario: Werkzeug per Taste
- **GIVEN** auf der aktiven Etage gibt es den Raum „Eltern“ und „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste D drückt
- **THEN** ist das Werkzeug „Durchgang“ aktiv und markiert

#### Scenario: Etage ohne Raum
- **GIVEN** die aktive Etage hat keinen Raum
- **WHEN** der Nutzer die Taste D drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** der Tooltip von „Durchgang“ lautet „Durchgang – zuerst einen Raum zeichnen“

### Requirement: Durchgang setzen
Mit „Durchgang“ SHALL ein Klick auf eine Raumkante, auf ihr Wandband oder höchstens 10 Bildschirmpixel neben sie einen Durchgang mit Breite 100 cm auf der nächstgelegenen Kante setzen, mittig an der Klickstelle. Er MUST wie Tür und Fenster auf die Kante geschoben und bei kürzerer Kante auf deren Länge verkleinert werden. Danach ist er ausgewählt und „Auswählen“ aktiv.

#### Scenario: Offenes Stück in der Wand
- **GIVEN** der Raum „Eltern“ hat die Ecken (0 cm, 0 cm), (420 cm, 0 cm), (420 cm, 330 cm), (0 cm, 330 cm) und „Durchgang“ ist aktiv
- **WHEN** der Nutzer auf das Wandband der rechten Kante bei y = 260 cm klickt
- **THEN** liegt dort ein Durchgang mit Breite 100 cm von y = 210 cm bis y = 310 cm
- **AND** er ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Kurze Kante
- **GIVEN** ein Raum hat eine 60 cm lange Kante und „Durchgang“ ist aktiv
- **WHEN** der Nutzer auf diese Kante klickt
- **THEN** entsteht ein Durchgang mit Breite 60 cm und Abstand 0 cm

### Requirement: Darstellung eines Durchgangs
Ein Durchgang SHALL wie eine Tür auf seiner Breite eine Lücke in alle Wandbänder schneiden (siehe „Lücke im Wandband“). In der Lücke MUST NOT ein Türblatt, Aufschlag oder Fenstersymbol zu sehen sein. Ist der Durchgang ausgewählt, SHALL die Lücke von der Kante bis zur Außenseite ihrer Wand mit einem Umriss in der Auswahlfarbe gezeigt werden. Mit „Auswählen“ SHALL ein Klick in die Lücke den Durchgang auswählen; eine darüberliegende Möbelform hat Vorrang.

#### Scenario: Offen zum Flur
- **GIVEN** „Eltern“ und „Flur“ liegen 11,5 cm auseinander und auf der Kante von „Eltern“ liegt ein Durchgang mit Breite 100 cm
- **THEN** ist an dieser Stelle auf 100 cm Breite weder das Band von „Eltern“ noch das Band von „Flur“ zu sehen
- **AND** in der Lücke ist kein Symbol zu sehen

#### Scenario: Durchgang auswählen
- **GIVEN** „Auswählen“ ist aktiv und nichts ist ausgewählt
- **WHEN** der Nutzer in die Lücke eines Durchgangs klickt
- **THEN** ist der Durchgang ausgewählt und seine Lücke in der Auswahlfarbe umrandet
- **AND** das Panel zeigt „Durchgang“

### Requirement: Ganze Kante öffnen
Ist ein Durchgang ausgewählt, SHALL das Panel die Schaltfläche „Ganze Kante“ zeigen. Sie MUST den Durchgang so breit wie seine Kante machen, mit Abstand 0 cm, und einen Rückgängig-Schritt bilden. Ist der Durchgang schon so breit wie die Kante, MUST die Schaltfläche gesperrt sein. Bei Türen und Fenstern MUST NOT sie erscheinen.

#### Scenario: Wand fehlt komplett
- **GIVEN** auf der oberen, 500 cm langen Kante von „Küche“ liegt ein Durchgang mit Breite 100 cm und Abstand 200 cm, er ist ausgewählt
- **WHEN** der Nutzer auf „Ganze Kante“ klickt
- **THEN** hat der Durchgang die Breite 500 cm und den Abstand 0 cm
- **AND** über der ganzen oberen Kante ist kein Wandband mehr zu sehen
- **AND** „Ganze Kante“ ist gesperrt

#### Scenario: Rückgängig
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 200 cm auf einer 500 cm langen Kante
- **AND** der Nutzer hat für ihn „Ganze Kante“ gewählt und danach einen anderen Raum ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** hat der Durchgang wieder Breite 100 cm und Abstand 200 cm und ist ausgewählt

## MODIFIED Requirements

### Requirement: Gültige Öffnung
Jeder Raum SHALL eine Liste von Öffnungen haben, die leer sein darf. Eine Öffnung MUST eine im Plan eindeutige ID, die Art „Tür“, „Fenster“ oder „Durchgang“, eine Kante des Raums, eine Breite größer als 0 cm und einen Abstand vom Anfang der Kante von mindestens 0 cm haben; Abstand und Breite zusammen MUST höchstens die Kantenlänge betragen. Eine Tür MUST genau einen Aufschlag haben (Anschlag an einem Ende, nach innen oder außen); ein Fenster und ein Durchgang MUST keinen Aufschlag haben.

#### Scenario: Tür auf der Kante
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** eine Tür mit Breite 80 cm und Abstand 160 cm auf dieser Kante geprüft wird
- **THEN** gilt sie als gültig

#### Scenario: Ragt über die Kante hinaus
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** ein Fenster mit Breite 120 cm und Abstand 400 cm auf dieser Kante geprüft wird
- **THEN** gilt es als ungültig

#### Scenario: Unbekannte Kante
- **GIVEN** ein Raum mit 4 Ecken
- **WHEN** eine Tür auf der fünften Kante geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Fenster mit Aufschlag
- **WHEN** ein Fenster mit einem Aufschlag nach innen geprüft wird
- **THEN** gilt es als ungültig

#### Scenario: Tür ohne Aufschlag
- **WHEN** eine Tür ohne Aufschlag geprüft wird
- **THEN** gilt sie als ungültig

#### Scenario: Durchgang über die ganze Kante
- **GIVEN** ein Raum mit einer 500 cm langen Kante
- **WHEN** ein Durchgang ohne Aufschlag mit Breite 500 cm und Abstand 0 cm auf dieser Kante geprüft wird
- **THEN** gilt er als gültig

#### Scenario: Durchgang mit Aufschlag
- **WHEN** ein Durchgang mit einem Aufschlag nach innen geprüft wird
- **THEN** gilt er als ungültig

### Requirement: Eigenschaften einer Öffnung
Ist eine Öffnung ausgewählt, SHALL das Panel im Kopf „Tür“, „Fenster“ bzw. „Durchgang“, den Raum und „Löschen“ zeigen, darunter „Breite“ und „Abstand zur linken Ecke“ in cm. Links ist das Kantenende, das von innen auf die Wand gesehen links liegt. Felder werden wie im Eigenschaften-Formular der Formen übernommen. Würde die Öffnung nicht mehr auf die Kante passen, MUST der Wert abgelehnt werden und das Feld die Grenze nennen.

#### Scenario: Breite ändern
- **GIVEN** eine Tür mit Breite 80 cm und Abstand 160 cm auf einer 500 cm langen Kante ist ausgewählt
- **WHEN** der Nutzer die Breite auf 90 cm ändert
- **THEN** ist die Tür 90 cm breit und hat weiter den Abstand 160 cm

#### Scenario: Zu breit
- **GIVEN** dieselbe Tür ist ausgewählt
- **WHEN** der Nutzer die Breite 400 cm eingibt
- **THEN** bleibt die Breite 80 cm
- **AND** das Feld zeigt „Darf höchstens 340 cm sein“

#### Scenario: Durchgang im Panel
- **GIVEN** in „Eltern“ liegt ein Durchgang mit Breite 100 cm und Abstand 210 cm zur linken Ecke
- **WHEN** der Nutzer ihn auswählt
- **THEN** zeigt das Panel „Durchgang“, „Eltern“, „Löschen“, Breite „100“, Abstand zur linken Ecke „210“ und „Ganze Kante“
- **AND** es zeigt weder „Aufschlag“ noch „Anschlag“

### Requirement: Öffnungen bei Änderungen am Raum
Ändert sich die Form eines Raums ohne Änderung der Eckenzahl, z. B. über eine Kantenlänge, SHALL jede Öffnung ihren Abstand zu dem Ende ihrer Kante behalten, das liegen geblieben ist; bewegen sich beide Enden gleich, bleibt der Abstand zum Anfang der Kante. Passt eine Öffnung danach nicht mehr auf ihre Kante, MUST die ganze Änderung abgelehnt werden, und das Feld zeigt „Geht nicht: Tür auf Kante n passt nicht mehr“ bzw. „… Fenster …“ oder „… Durchgang …“.

#### Scenario: Raum wird breiter
- **GIVEN** der Raum „Wohnen“ hat die Eckpunkte (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm)
- **AND** auf Kante 3 (unten) liegt ein Fenster von x = 280 cm bis x = 400 cm, sein Abstand zur linken Ecke ist 100 cm
- **WHEN** der Nutzer Kante 1 auf 520 cm setzt
- **THEN** liegt das Fenster weiterhin von x = 280 cm bis x = 400 cm
- **AND** sein Abstand zur linken Ecke ist 120 cm

#### Scenario: Tür passt nicht mehr
- **GIVEN** auf Kante 1 von „Wohnen“ liegt eine Tür von x = 160 cm bis x = 240 cm
- **WHEN** der Nutzer Kante 1 auf 200 cm setzt
- **THEN** wird die Änderung abgelehnt und Kante 1 bleibt 500 cm lang
- **AND** das Feld zeigt „Geht nicht: Tür auf Kante 1 passt nicht mehr“

#### Scenario: Offene Kante wird kürzer
- **GIVEN** auf Kante 1 von „Wohnen“ liegt ein Durchgang mit Breite 500 cm und Abstand 0 cm
- **WHEN** der Nutzer Kante 1 auf 480 cm setzt
- **THEN** wird die Änderung abgelehnt
- **AND** das Feld zeigt „Geht nicht: Durchgang auf Kante 1 passt nicht mehr“

#### Scenario: Raum verschieben
- **GIVEN** „Wohnen“ hat eine Tür mit Abstand 160 cm auf der oberen Kante
- **WHEN** der Nutzer den Raum um 100 cm nach rechts zieht
- **THEN** wandert die Tür mit und hat weiter den Abstand 160 cm
