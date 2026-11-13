# Spec Delta

## Purpose

Legt fest, wie die App die Tastatur je nach Betriebssystem behandelt. Dazu gehört, welche Befehlstaste (Strg oder ⌘) gilt, wie Tasten angezeigt werden und dass Tastenkürzel nach dem Bearbeiten eines Felds wieder den Plan erreichen, auch auf Geräten mit Touch-Bedienung.

## ADDED Requirements

### Requirement: Apple-Gerät erkennen
Das System SHALL ein Gerät mit macOS oder iPadOS (auch iPhone/iOS) als Apple-Gerät behandeln, alle anderen nicht. Ein iPad, das sich in Safari als Mac ausgibt (Desktop-Website), MUST ebenfalls als Apple-Gerät gelten. Die Erkennung MUST NOT im Plan gespeichert oder exportiert werden.

#### Scenario: iPad mit Desktop-Website
- **GIVEN** Safari auf dem iPad meldet als Plattform „MacIntel“
- **WHEN** die App startet
- **THEN** gilt das Gerät als Apple-Gerät

#### Scenario: Windows
- **GIVEN** der Browser meldet als Plattform „Win32“
- **WHEN** die App startet
- **THEN** gilt das Gerät nicht als Apple-Gerät

### Requirement: Befehle mit Strg oder ⌘
Die Befehle Rückgängig, Wiederholen, Kopieren, Ausschneiden, Einfügen und Duplizieren SHALL auf jedem Gerät sowohl mit Strg als auch mit ⌘ wirken: Z, Umschalt+Z, Y, C, X, V und D. Wo eine Anforderung „Strg+…“ für einen dieser Befehle nennt, MUST dasselbe mit ⌘ gelten.

#### Scenario: Rückgängig auf dem iPad
- **GIVEN** auf dem iPad mit Tastatur wurde ein Rechteck von x = 200 cm nach x = 250 cm gezogen
- **WHEN** der Nutzer ⌘Z drückt
- **THEN** liegt der Mittelpunkt des Rechtecks wieder bei x = 200 cm

#### Scenario: Strg auf dem Mac
- **GIVEN** auf einem Mac ist ein Rechteck ausgewählt
- **WHEN** der Nutzer Ctrl+D drückt
- **THEN** entsteht eine Kopie, 50 cm nach rechts und 50 cm nach unten versetzt

### Requirement: Gedrückte Befehlstaste schaltet Einrasten ab
Auf Apple-Geräten SHALL ⌘ an die Stelle der Strg-Taste treten, wo eine Anforderung das Gedrückthalten von Strg beschreibt: beim Ziehen von Formen und Räumen, beim Ziehen von Wandenden und beim Zeichnen von Räumen und Wänden. Gedrücktes Ctrl MUST dort auf Apple-Geräten wirkungslos sein. Auf anderen Geräten SHALL es bei Strg bleiben, und ⌘ bzw. die Windows-Taste MUST dort wirkungslos sein.

#### Scenario: Mit ⌘ frei ziehen auf dem Mac
- **GIVEN** auf einem Mac liegt ein Schrank 3 cm neben einer Rastlinie, „Einrasten“ ist an
- **WHEN** der Nutzer ihn mit gedrückter ⌘-Taste um 127 cm nach rechts zieht und loslässt
- **THEN** rastet der Schrank an keiner Rastlinie ein und folgt nur dem Raster von 5 cm
- **AND** es erscheint keine Hilfslinie

#### Scenario: Ctrl auf dem Mac wirkungslos
- **GIVEN** auf einem Mac zeichnet der Nutzer einen Raum, „Einrasten“ ist an
- **WHEN** er mit gedrückter Ctrl-Taste den Zeiger 3 cm neben die Hilfslinie durch eine Raumecke bewegt
- **THEN** rastet der nächste Eckpunkt an der Hilfslinie ein

#### Scenario: Strg unter Windows
- **GIVEN** unter Windows liegt ein Schrank 3 cm neben einer Rastlinie, „Einrasten“ ist an
- **WHEN** der Nutzer ihn mit gedrückter Strg-Taste um 127 cm nach rechts zieht
- **THEN** rastet der Schrank an keiner Rastlinie ein

#### Scenario: ⌘ wieder loslassen
- **GIVEN** auf dem iPad zieht der Nutzer eine Form mit gedrückter ⌘-Taste
- **WHEN** er ⌘ während des Ziehens loslässt
- **THEN** rastet die Form wieder an Rastlinien ein

### Requirement: Tastennamen je Gerät
Wo die App Tasten nennt (Liste der Tastenkürzel, Tooltips von „Rückgängig“, „Wiederholen“ und der Anordnung), SHALL sie auf Apple-Geräten Strg als ⌘, Umschalt als ⇧ und Alt als ⌥ zeigen. Sondertasten MUST dort direkt vor der Taste stehen, ohne „+“ und in der Reihenfolge ⌥, ⇧, ⌘. Auf anderen Geräten MUST die Anzeige unverändert bleiben (Strg, Umschalt, Alt mit „+“). Alle anderen Tastennamen MUST gleich bleiben.

#### Scenario: Tooltip auf dem Mac
- **GIVEN** die App läuft auf einem Mac
- **WHEN** der Nutzer mit dem Zeiger auf „Wiederholen“ zeigt
- **THEN** zeigt der Tooltip „Wiederholen (⇧⌘Z)“

#### Scenario: Tooltip unter Windows
- **GIVEN** die App läuft unter Windows
- **WHEN** der Nutzer mit dem Zeiger auf „Wiederholen“ zeigt
- **THEN** zeigt der Tooltip „Wiederholen (Strg+Umschalt+Z)“

#### Scenario: Anordnung auf dem iPad
- **GIVEN** die App läuft auf dem iPad, ein Rechteck ist ausgewählt
- **WHEN** der Nutzer den Tooltip von „Ganz nach vorne“ ansieht
- **THEN** steht dort „Ganz nach vorne (⇧Bild↑)“

### Requirement: Zeichenfläche verlässt Eingabefelder
Drückt der Nutzer auf die Zeichenfläche (Maus, Stift oder Finger), während ein Eingabefeld außerhalb eines Dialogs den Fokus hat, SHALL das Feld den Fokus verlieren, bevor der Druck wirkt. Ein getippter Wert MUST dabei wie beim Verlassen des Felds übernommen oder abgelehnt werden. Danach SHALL jedes Tastenkürzel wieder auf den Plan wirken.

#### Scenario: Nach Tab auf dem iPad
- **GIVEN** auf dem iPad mit Tastatur hat der Nutzer die Breite eines Rechtecks von 120 cm auf 150 cm geändert und Tab gedrückt, sodass „Tiefe“ den Fokus hat
- **WHEN** er mit dem Finger auf das Rechteck tippt und dann ⌘C und ⌘V drückt
- **THEN** ist die Breite des Rechtecks 150 cm
- **AND** auf der Etage liegt eine Kopie des Rechtecks mit 150 cm Breite

#### Scenario: Getippter Wert wird übernommen
- **GIVEN** der Nutzer hat in „Breite“ 180 getippt, ohne Enter zu drücken
- **WHEN** er mit dem Finger auf eine freie Stelle der Zeichenfläche tippt
- **THEN** ist die Breite der Form 180 cm
- **AND** ein Druck auf `M` blendet die Maße aus, statt „m“ in ein Feld zu schreiben

#### Scenario: Dialog bleibt unberührt
- **GIVEN** der Dialog „Einstellungen“ ist offen und ein Feld darin hat den Fokus
- **WHEN** der Nutzer daneben auf die abgedunkelte Fläche tippt
- **THEN** verhält sich der Dialog wie bisher
