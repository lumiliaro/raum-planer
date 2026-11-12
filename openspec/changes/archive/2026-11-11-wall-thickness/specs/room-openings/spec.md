## MODIFIED Requirements

### Requirement: Lücke im Wandband
Jede Öffnung SHALL auf ihrer Breite eine Lücke in alle Wandbänder schneiden, die an dieser Stelle außen an der Kante liegen, auch in das Band eines angrenzenden Raums. Die Lücke MUST mindestens durch die ganze Wanddicke ihrer eigenen Kante reichen. Die Lücke MUST den Blick auf die Vorlage darunter freigeben und darf keine Fläche in Hintergrundfarbe über die Vorlage legen. Raumflächen und Möbel MUST darüber unverändert sichtbar bleiben.

#### Scenario: Tür zwischen zwei Räumen
- **GIVEN** Flur und Bad liegen 12 cm auseinander, beide Wandbänder füllen den Spalt
- **AND** auf der Badkante liegt eine Tür mit Breite 80 cm
- **THEN** ist an dieser Stelle auf 80 cm Breite weder das Band des Bads noch das Band des Flurs zu sehen

#### Scenario: Sehr dicke Wand
- **GIVEN** die obere Kante von „Keller“ hat die Wanddicke 60 cm und darauf liegt ein Fenster mit Breite 100 cm
- **THEN** ist das Band an dieser Stelle auf 100 cm Breite über die ganzen 60 cm geöffnet

#### Scenario: Vorlage bleibt sichtbar
- **GIVEN** unter dem Raum liegt eine sichtbare Vorlage
- **THEN** ist die Vorlage in der Lücke eines Fensters zu sehen

### Requirement: Darstellung von Tür und Fenster
Eine Tür SHALL ihr Türblatt als durchgezogene Linie vom Anschlag senkrecht zur Kante auf die gewählte Seite und den Aufschlag als gestrichelten Viertelkreis bis zum anderen Ende der Lücke zeigen. Ein Fenster SHALL in der Lücke ein Rechteck mit Mittellinie zeigen, das von der Kante über die ganze Wanddicke seiner Kante nach außen reicht. Linien MUST bei jedem Zoom gleich dick erscheinen. Im Kalibrier-Modus MUST Öffnungen wie die Räume ausgeblendet sein.

#### Scenario: Tür nach innen
- **GIVEN** eine Tür mit Breite 80 cm, Anschlag links, Aufschlag nach innen
- **THEN** steht das 80 cm lange Türblatt am linken Ende der Lücke senkrecht in den Raum
- **AND** ein gestrichelter Viertelkreis verbindet sein Ende mit dem rechten Ende der Lücke

#### Scenario: Fenster
- **GIVEN** ein Fenster mit Breite 120 cm auf einer Kante mit 15 cm Wanddicke
- **THEN** zeigt die Lücke ein 120 cm breites und 15 cm tiefes Rechteck mit Mittellinie und kein Türblatt

#### Scenario: Fenster in dicker Außenwand
- **GIVEN** ein Fenster mit Breite 120 cm auf einer Kante mit 36,5 cm Wanddicke
- **THEN** reicht sein Rechteck von der Kante 36,5 cm nach außen, die Mittellinie liegt 18,25 cm vor der Kante
