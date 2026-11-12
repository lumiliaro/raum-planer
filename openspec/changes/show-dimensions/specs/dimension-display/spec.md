# Spec Delta

## Purpose

Legt fest, wie die Maße von Räumen (Innenlänge je Kante) und Möbeln (Breite und Tiefe) auf der Zeichenfläche angezeigt und ein- und ausgeschaltet werden, damit Längen ohne Auswählen und Nachmessen auf einen Blick zu sehen sind.

## ADDED Requirements

### Requirement: Schaltfläche „Maße“
Die Zoom-Leiste SHALL rechts von „Einpassen“ eine Umschalt-Schaltfläche mit Lineal-Symbol zeigen, abgetrennt durch einen senkrechten Strich. Ein Klick MUST die Maßanzeige ein- bzw. ausschalten. Eingeschaltet MUST sie gedrückt aussehen; Beschriftung und Tooltip MUST „Maße ausblenden (M)“ lauten, ausgeschaltet „Maße einblenden (M)“.

#### Scenario: Maße einblenden
- **GIVEN** die Maßanzeige ist aus
- **WHEN** der Nutzer in der Zoom-Leiste auf „Maße einblenden“ klickt
- **THEN** zeigt die Zeichenfläche die Maße aller Räume und Möbel der aktiven Etage
- **AND** die Schaltfläche sieht gedrückt aus und hat den Tooltip „Maße ausblenden (M)“

#### Scenario: Maße ausblenden
- **GIVEN** die Maßanzeige ist an
- **WHEN** der Nutzer auf „Maße ausblenden“ klickt
- **THEN** zeigt die Zeichenfläche keine Maße mehr

### Requirement: Taste M
Die Taste `M` (groß oder klein) SHALL die Maßanzeige umschalten wie die Schaltfläche. Sie MUST NOT wirken in Textfeldern, in Dialogen und zusammen mit Strg, ⌘ oder Alt.

#### Scenario: Umschalten per Taste
- **GIVEN** die Maßanzeige ist aus und kein Textfeld hat den Fokus
- **WHEN** der Nutzer `M` drückt
- **THEN** ist die Maßanzeige an
- **WHEN** der Nutzer erneut `M` drückt
- **THEN** ist die Maßanzeige aus

#### Scenario: Im Namensfeld
- **GIVEN** das Feld „Name“ eines Raums hat den Fokus
- **WHEN** der Nutzer „Mm“ tippt
- **THEN** steht „Mm“ im Feld und die Maßanzeige bleibt unverändert

### Requirement: Zustand der Maßanzeige merken
Das System SHALL den Zustand der Maßanzeige im Browser speichern und beim nächsten Start wiederherstellen. Beim ersten Start oder bei nicht lesbarem Wert MUST die Anzeige aus sein. Der Zustand MUST NOT Teil des Plans oder der Exportdatei sein, und Umschalten MUST keinen Rückgängig-Schritt bilden.

#### Scenario: Nach Neuladen
- **GIVEN** der Nutzer hat die Maßanzeige eingeschaltet
- **WHEN** er die Seite neu lädt
- **THEN** ist die Maßanzeige weiterhin an

#### Scenario: Kein Rückgängig-Schritt
- **GIVEN** der Nutzer hat zuletzt einen Raum verschoben und danach die Maßanzeige eingeschaltet
- **WHEN** er Strg+Z drückt
- **THEN** wird das Verschieben des Raums rückgängig gemacht und die Maßanzeige bleibt an

#### Scenario: Speicher blockiert
- **GIVEN** der Browser-Speicher ist blockiert
- **WHEN** die App geladen wird
- **THEN** ist die Maßanzeige aus und lässt sich trotzdem einschalten

### Requirement: Maße der Räume
Bei eingeschalteter Maßanzeige SHALL an jeder Kante jedes Raums der aktiven Etage ihre Innenlänge in cm mit höchstens einer Nachkommastelle und Komma stehen („400 cm“, „312,5 cm“), in der Farbe der Raumnamen, mittig an der Kante und parallel zu ihr, außen vor der Wand mit kleinem Abstand zur Wand.

#### Scenario: Rechteckiger Raum
- **GIVEN** die Maßanzeige ist an und der Raum „Küche“ mit 15 cm Wanddicke hat die Eckpunkte (0 cm, 0 cm), (400 cm, 0 cm), (400 cm, 312,5 cm), (0 cm, 312,5 cm) und keinen Nachbarraum
- **THEN** steht außen vor der oberen und vor der unteren Wand „400 cm“ waagerecht
- **AND** außen vor der linken und vor der rechten Wand steht „312,5 cm“ senkrecht

#### Scenario: Schräge Kante
- **GIVEN** die Maßanzeige ist an und ein Raum ohne Nachbarraum hat eine Kante von (0 cm, 0 cm) nach (300 cm, 400 cm)
- **THEN** steht an dieser Kante „500 cm“ entlang der Kante geneigt, außen vor der Wand

### Requirement: Raummaß innen bei belegter Außenseite
Würde ein Raummaß außen vor der Wand ganz oder teilweise auf der Fläche oder der Wand eines Raums liegen, auch des eigenen, MUST es stattdessen auf der Innenseite seines Raums stehen, mittig an der Kante, parallel zu ihr und mit kleinem Abstand zur Kante.

#### Scenario: Gemeinsame Wand
- **GIVEN** die Maßanzeige ist an, „Küche“ hat die Eckpunkte (0 cm, 0 cm), (400 cm, 0 cm), (400 cm, 312,5 cm), (0 cm, 312,5 cm) und „Flur“ liegt mit 15 cm Wand dazwischen rechts daneben ab x = 415 cm
- **THEN** steht „312,5 cm“ der rechten Küchenkante innen in der Küche
- **AND** das Maß der linken Flurkante steht innen im Flur
- **AND** die übrigen Maße der Küche stehen außen vor der Wand

#### Scenario: Innenecke
- **GIVEN** die Maßanzeige ist an und ein L-förmiger Raum hat eine Innenecke, an der das Maß einer Kante außen auf der Wand des anderen Schenkels läge
- **THEN** steht dieses Maß innen im Raum

### Requirement: Maße der Möbel
Bei eingeschalteter Maßanzeige SHALL jedes Möbel der aktiven Etage seine Breite entlang der unteren Kante und seine Tiefe entlang der linken Kante seines umschließenden Rechtecks zeigen, gespiegelt entlang der rechten, jeweils innen und in der Randfarbe des Möbels. Die Maße MUST sich mit dem Möbel drehen. Eine Tür (Möbel) MUST nur ihre Breite zeigen, eine freie Form keine Maße.

#### Scenario: Bett
- **GIVEN** die Maßanzeige ist an und ein Rechteck mit Breite 180 cm und Tiefe 200 cm ist nicht gedreht
- **THEN** steht innen an seiner unteren Kante „180 cm“ waagerecht und innen an seiner linken Kante „200 cm“ senkrecht

#### Scenario: Gedrehtes Möbel
- **GIVEN** die Maßanzeige ist an und ein Rechteck mit Breite 180 cm und Tiefe 200 cm ist um 90° gedreht
- **THEN** steht „180 cm“ senkrecht an der Kante, die vor der Drehung unten lag
- **AND** „200 cm“ steht waagerecht an der Kante, die vor der Drehung links lag

#### Scenario: Gespiegelte L-Form
- **GIVEN** die Maßanzeige ist an und eine gespiegelte L-Form hat Breite 280 cm und Tiefe 200 cm
- **THEN** steht „280 cm“ innen an der unteren Kante und „200 cm“ innen an der rechten Kante

#### Scenario: Tür
- **GIVEN** die Maßanzeige ist an und eine Tür (Möbel) hat die Breite 80 cm
- **THEN** steht innen an ihrer unteren Kante „80 cm“ und sonst kein Maß

### Requirement: Lesbare Maße
Jedes Maß SHALL in fester Bildschirmgröße bei jedem Zoom stehen und MUST NOT auf dem Kopf stehen: waagerechte und geneigte Maße lesen sich von links nach rechts, senkrechte von unten nach oben. Ist ein Maß auf dem Bildschirm länger als seine Kante, MUST es weggelassen werden.

#### Scenario: Obere Kante bei 180° gedrehtem Möbel
- **GIVEN** die Maßanzeige ist an und ein Rechteck mit Breite 180 cm ist um 180° gedreht
- **THEN** steht „180 cm“ an der nun oberen Kante, von links nach rechts lesbar

#### Scenario: Herausgezoomt
- **GIVEN** die Maßanzeige ist an und ein Regal hat die Breite 40 cm
- **WHEN** der Nutzer so weit herauszoomt, dass die 40 cm auf dem Bildschirm kürzer sind als der Text „40 cm“
- **THEN** wird „40 cm“ an dieser Kante nicht angezeigt
- **WHEN** der Nutzer wieder hineinzoomt, bis die Kante länger als der Text ist
- **THEN** steht „40 cm“ wieder an der Kante

### Requirement: Maße und andere Inhalte
Die Maße eines Raums SHALL mit dem Raum unter allen Möbeln liegen, die Maße eines Möbels mit dem Möbel unter den Möbeln, die darüber liegen. Maße MUST NOT Klicks abfangen und MUST NOT die Größe des Auswahlrahmens verändern. Im Kalibrier-Modus MUST keine Maße zu sehen sein.

#### Scenario: Klick auf ein Maß
- **GIVEN** die Maßanzeige ist an, „Auswählen“ ist aktiv und das Maß „312,5 cm“ an der gemeinsamen Wand von „Küche“ und „Flur“ steht innen in der Küche
- **WHEN** der Nutzer auf dieses Maß klickt, an dem kein Möbel liegt
- **THEN** ist der Raum „Küche“ ausgewählt

#### Scenario: Kalibrier-Modus
- **GIVEN** die Maßanzeige ist an
- **WHEN** der Nutzer den Kalibrier-Modus startet
- **THEN** sind keine Maße zu sehen
- **WHEN** er die Kalibrierung beendet
- **THEN** sind die Maße wieder zu sehen

### Requirement: Maße folgen Änderungen
Die Maße SHALL jede Änderung an Räumen und Möbeln sofort zeigen, auch nach Rückgängig und Wiederholen. Beim Verschieben eines Raums oder Möbels MUST seine Maße mitwandern. Während der Nutzer an den Griffen eines Möbels die Größe ändert oder es dreht, MUST dessen Maße ausgeblendet sein; nach dem Loslassen zeigen sie die neuen Werte.

#### Scenario: Kantenlänge im Panel ändern
- **GIVEN** die Maßanzeige ist an und Kante 1 des Raums „Küche“ ist 400 cm lang
- **WHEN** der Nutzer im Panel „Kante 1“ auf 420 cm ändert
- **THEN** steht an dieser Kante „420 cm“

#### Scenario: Größe ziehen
- **GIVEN** die Maßanzeige ist an und ein Rechteck mit Breite 180 cm ist ausgewählt
- **WHEN** der Nutzer am rechten Griff zieht
- **THEN** sind die Maße dieses Rechtecks ausgeblendet
- **WHEN** er bei Breite 200 cm loslässt
- **THEN** steht an der unteren Kante „200 cm“
