# Spec Delta

## Purpose

Ergänzt Räume um Türen und Fenster als Öffnungen auf einer Raumkante, damit Durchgänge, Türaufschläge und Fenster im Plan sichtbar sind und die Möbelplanung sich nach ihnen richten kann.

## ADDED Requirements

### Requirement: Gültige Öffnung
Jeder Raum SHALL eine Liste von Öffnungen haben, die leer sein darf. Eine Öffnung MUST eine im Plan eindeutige ID, die Art „Tür“ oder „Fenster“, eine Kante des Raums, eine Breite größer als 0 cm und einen Abstand vom Anfang der Kante von mindestens 0 cm haben; Abstand und Breite zusammen MUST höchstens die Kantenlänge betragen. Eine Tür MUST genau einen Aufschlag haben (Anschlag an einem Ende, nach innen oder außen); ein Fenster MUST keinen Aufschlag haben.

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

### Requirement: Lücke im Wandband
Jede Öffnung SHALL auf ihrer Breite eine Lücke in alle Wandbänder schneiden, die an dieser Stelle außen an der Kante liegen, auch in das Band eines angrenzenden Raums. Die Lücke MUST den Blick auf die Vorlage darunter freigeben und darf keine Fläche in Hintergrundfarbe über die Vorlage legen. Raumflächen und Möbel MUST darüber unverändert sichtbar bleiben.

#### Scenario: Tür zwischen zwei Räumen
- **GIVEN** Flur und Bad liegen 12 cm auseinander, beide Wandbänder füllen den Spalt
- **AND** auf der Badkante liegt eine Tür mit Breite 80 cm
- **THEN** ist an dieser Stelle auf 80 cm Breite weder das Band des Bads noch das Band des Flurs zu sehen

#### Scenario: Vorlage bleibt sichtbar
- **GIVEN** unter dem Raum liegt eine sichtbare Vorlage
- **THEN** ist die Vorlage in der Lücke eines Fensters zu sehen

### Requirement: Darstellung von Tür und Fenster
Eine Tür SHALL ihr Türblatt als durchgezogene Linie vom Anschlag senkrecht zur Kante auf die gewählte Seite und den Aufschlag als gestrichelten Viertelkreis bis zum anderen Ende der Lücke zeigen. Ein Fenster SHALL in der Lücke ein schmales Rechteck mit Mittellinie zeigen. Linien MUST bei jedem Zoom gleich dick erscheinen. Im Kalibrier-Modus MUST Öffnungen wie die Räume ausgeblendet sein.

#### Scenario: Tür nach innen
- **GIVEN** eine Tür mit Breite 80 cm, Anschlag links, Aufschlag nach innen
- **THEN** steht das 80 cm lange Türblatt am linken Ende der Lücke senkrecht in den Raum
- **AND** ein gestrichelter Viertelkreis verbindet sein Ende mit dem rechten Ende der Lücke

#### Scenario: Fenster
- **GIVEN** ein Fenster mit Breite 120 cm
- **THEN** zeigt die Lücke ein schmales Rechteck mit Mittellinie und kein Türblatt

### Requirement: Werkzeuge „Tür“ und „Fenster“
Die Werkzeugleiste SHALL direkt unter „Raum“ die Werkzeuge „Tür“ und „Fenster“ mit eigenem Icon und den Tooltips „Tür – in der Raumwand (T)“ und „Fenster (F)“ anbieten. Die Tasten T und F MUST sie aktivieren, außer ein Eingabefeld hat den Fokus. Hat die aktive Etage keinen Raum oder ist der Kalibrier-Modus aktiv, MUST beide samt Taste gesperrt sein; der Tooltip nennt dann „zuerst einen Raum zeichnen“.

#### Scenario: Werkzeug per Taste
- **GIVEN** auf der aktiven Etage gibt es den Raum „Wohnen“ und „Auswählen“ ist aktiv
- **WHEN** der Nutzer die Taste F drückt
- **THEN** ist das Werkzeug „Fenster“ aktiv und markiert

#### Scenario: Etage ohne Raum
- **GIVEN** die aktive Etage hat keinen Raum
- **WHEN** der Nutzer auf „Tür“ klickt oder die Taste T drückt
- **THEN** bleibt „Auswählen“ aktiv
- **AND** der Tooltip lautet „Tür – zuerst einen Raum zeichnen“

### Requirement: Öffnung setzen
Mit „Tür“ oder „Fenster“ SHALL ein Klick auf eine Raumkante, auf ihr Wandband oder höchstens 10 Bildschirmpixel neben sie eine Öffnung auf der nächstgelegenen Kante setzen, mittig an der Klickstelle. Eine Tür ist 80 cm breit, Anschlag links, Aufschlag nach innen; ein Fenster ist 120 cm breit. Die Öffnung MUST auf die Kante geschoben und bei kürzerer Kante auf deren Länge verkleinert werden. Danach ist sie ausgewählt und „Auswählen“ aktiv.

#### Scenario: Tür in die obere Wand
- **GIVEN** der Raum „Wohnen“ hat die Ecken (0 cm, 0 cm), (500 cm, 0 cm), (500 cm, 400 cm), (0 cm, 400 cm) und „Tür“ ist aktiv
- **WHEN** der Nutzer auf das Wandband der oberen Kante bei x = 200 cm klickt
- **THEN** liegt dort eine Tür mit Breite 80 cm und Abstand zur linken Ecke 160 cm
- **AND** sie schlägt nach innen auf, mit Anschlag links
- **AND** sie ist ausgewählt und „Auswählen“ ist aktiv

#### Scenario: Klick nahe der Ecke
- **GIVEN** „Fenster“ ist aktiv
- **WHEN** der Nutzer auf die obere Kante von „Wohnen“ bei x = 20 cm klickt
- **THEN** entsteht ein Fenster mit Breite 120 cm und Abstand zur linken Ecke 0 cm

#### Scenario: Kurze Kante
- **GIVEN** ein Raum hat eine 60 cm lange Kante und „Tür“ ist aktiv
- **WHEN** der Nutzer auf diese Kante klickt
- **THEN** entsteht eine Tür mit Breite 60 cm und Abstand 0 cm

#### Scenario: Klick in den Raum
- **GIVEN** „Tür“ ist aktiv
- **WHEN** der Nutzer in die Mitte von „Wohnen“ klickt, mehr als 10 Bildschirmpixel von jeder Kante entfernt
- **THEN** entsteht keine Öffnung und „Tür“ bleibt aktiv

#### Scenario: Esc bricht ab
- **GIVEN** „Fenster“ ist aktiv
- **WHEN** der Nutzer Esc drückt
- **THEN** ist „Auswählen“ aktiv und es wurde keine Öffnung gesetzt

### Requirement: Öffnung auswählen
Mit „Auswählen“ SHALL ein Klick auf die Lücke, das Türblatt, den Aufschlag oder das Fenstersymbol einer Öffnung diese auswählen und hervorheben; eine darüberliegende Möbelform hat Vorrang. Es MUST höchstens eine Form, ein Raum oder eine Öffnung ausgewählt sein. Das Panel MUST dann die Öffnung zeigen. Esc und ein Klick auf eine leere Stelle heben die Auswahl auf.

#### Scenario: Fenster anklicken
- **GIVEN** in „Wohnen“ gibt es ein Fenster auf Kante 1, und „Wohnen“ ist ausgewählt
- **WHEN** der Nutzer auf das Fenstersymbol klickt
- **THEN** ist das Fenster in der Auswahlfarbe hervorgehoben und „Wohnen“ nicht mehr ausgewählt
- **AND** das Panel zeigt „Fenster“ mit Breite und Abstand

### Requirement: Öffnung entlang der Kante ziehen
Ziehen einer ausgewählten oder angeklickten Öffnung SHALL sie entlang ihrer Kante verschieben, relativ zur Startlage in 5-cm-Schritten, mit gedrückter Alt-Taste in 1-cm-Schritten. Die Öffnung MUST auf ihrer Kante bleiben und an deren Enden anhalten. Ein vollständiges Ziehen MUST genau einen Rückgängig-Schritt bilden.

#### Scenario: Tür verschieben
- **GIVEN** eine Tür mit Breite 80 cm und Abstand zur linken Ecke 160 cm auf einer 500 cm langen Kante
- **WHEN** der Nutzer sie um 37 cm nach rechts zieht
- **THEN** hat sie den Abstand 195 cm

#### Scenario: Am Kantenende
- **GIVEN** dieselbe Tür
- **WHEN** der Nutzer sie um 400 cm nach rechts zieht
- **THEN** hat sie den Abstand 420 cm und endet genau an der rechten Ecke

### Requirement: Eigenschaften einer Öffnung
Ist eine Öffnung ausgewählt, SHALL das Panel im Kopf „Tür“ bzw. „Fenster“, den Raum und „Löschen“ zeigen, darunter „Breite“ und „Abstand zur linken Ecke“ in cm. Links ist das Kantenende, das von innen auf die Wand gesehen links liegt. Felder werden wie im Eigenschaften-Formular der Formen übernommen. Würde die Öffnung nicht mehr auf die Kante passen, MUST der Wert abgelehnt werden und das Feld die Grenze nennen.

#### Scenario: Breite ändern
- **GIVEN** eine Tür mit Breite 80 cm und Abstand 160 cm auf einer 500 cm langen Kante ist ausgewählt
- **WHEN** der Nutzer die Breite auf 90 cm ändert
- **THEN** ist die Tür 90 cm breit und hat weiter den Abstand 160 cm

#### Scenario: Zu breit
- **GIVEN** dieselbe Tür ist ausgewählt
- **WHEN** der Nutzer die Breite 400 cm eingibt
- **THEN** bleibt die Breite 80 cm
- **AND** das Feld zeigt „Darf höchstens 340 cm sein“

### Requirement: Aufschlag einer Tür
Ist eine Tür ausgewählt, SHALL das Panel „Aufschlag“ mit „Nach innen“ und „Nach außen“ und „Anschlag“ mit „Links“ und „Rechts“ zeigen, jeweils von innen gesehen; die aktuelle Wahl ist markiert. Eine Tür ohne Aufschlag MUST NOT wählbar sein. Jede Auswahl wirkt sofort und ist ein Rückgängig-Schritt.

#### Scenario: Nach außen
- **GIVEN** eine Tür mit Aufschlag nach innen und Anschlag links ist ausgewählt
- **WHEN** der Nutzer „Nach außen“ wählt
- **THEN** zeigt das Türblatt aus dem Raum heraus, weiterhin am linken Ende

#### Scenario: Anschlag wechseln
- **GIVEN** eine Tür mit Breite 80 cm, Anschlag links und Aufschlag nach innen ist ausgewählt
- **WHEN** der Nutzer „Rechts“ wählt
- **THEN** steht das Türblatt am rechten Ende der Lücke und schlägt weiterhin nach innen auf

### Requirement: Öffnung löschen
„Löschen“ im Panel und die Tasten Entf und Rücktaste ohne Fokus in einem Eingabefeld SHALL die ausgewählte Öffnung ohne Rückfrage entfernen und die Auswahl aufheben. Das Wandband MUST danach an dieser Stelle wieder geschlossen sein. Wird ein Raum gelöscht, MUST das System seine Öffnungen mitlöschen.

#### Scenario: Fenster löschen
- **GIVEN** ein Fenster ist ausgewählt
- **WHEN** der Nutzer Entf drückt
- **THEN** ist das Fenster entfernt und das Wandband an seiner Stelle geschlossen

### Requirement: Öffnungen bei Änderungen am Raum
Ändert sich die Form eines Raums ohne Änderung der Eckenzahl, z. B. über eine Kantenlänge, SHALL jede Öffnung ihren Abstand zu dem Ende ihrer Kante behalten, das liegen geblieben ist; bewegen sich beide Enden gleich, bleibt der Abstand zum Anfang der Kante. Passt eine Öffnung danach nicht mehr auf ihre Kante, MUST die ganze Änderung abgelehnt werden, und das Feld zeigt „Geht nicht: Tür auf Kante n passt nicht mehr“ bzw. „… Fenster …“.

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

#### Scenario: Raum verschieben
- **GIVEN** „Wohnen“ hat eine Tür mit Abstand 160 cm auf der oberen Kante
- **WHEN** der Nutzer den Raum um 100 cm nach rechts zieht
- **THEN** wandert die Tür mit und hat weiter den Abstand 160 cm

### Requirement: Öffnungen im Verlauf
Setzen, Ziehen, eine übernommene Eingabe oder Auswahl im Panel und Löschen einer Öffnung SHALL je einen Rückgängig-Schritt bilden. Betrifft ein Rückgängig oder Wiederholen genau eine Öffnung, die danach vorhanden ist, MUST deren Etage aktiv und die Öffnung ausgewählt sein.

#### Scenario: Tür verschieben rückgängig
- **GIVEN** der Nutzer hat im Erdgeschoss eine Tür verschoben und ist danach ins Obergeschoss gewechselt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Erdgeschoss aktiv
- **AND** die Tür liegt an ihrer Ausgangslage und ist ausgewählt

#### Scenario: Setzen rückgängig
- **GIVEN** der Nutzer hat ein Fenster gesetzt, es ist ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** ist das Fenster verschwunden und nichts ist ausgewählt
