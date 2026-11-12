## MODIFIED Requirements

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
- **THEN** zeigt das Panel „Durchgang“, „Eltern“, „Löschen“, Breite „100“, Abstand zur linken Ecke „210“ und das Kästchen „Ganze Kante“ ohne Haken
- **AND** es zeigt weder „Aufschlag“ noch „Anschlag“

#### Scenario: Fenster im Panel
- **GIVEN** in „Wohnen“ liegt ein Fenster mit Breite 120 cm und Abstand 190 cm zur linken Ecke auf einer 500 cm langen Kante
- **WHEN** der Nutzer es auswählt
- **THEN** zeigt das Panel „Fenster“, „Wohnen“, „Löschen“, Breite „120“, Abstand zur linken Ecke „190“ und das Kästchen „Ganze Kante“ ohne Haken

### Requirement: Ganze Kante öffnen
Ist ein Durchgang oder ein Fenster ausgewählt, SHALL das Panel das Kästchen „Ganze Kante“ zeigen; es MUST NOT gesperrt sein. Es MUST einen Haken haben, genau wenn die Öffnung so breit wie ihre Kante ist und den Abstand 0 cm hat. Anhaken MUST sie so breit wie die Kante machen, mit Abstand 0 cm, und Breite und Abstand von vorher merken. Abhaken MUST die gemerkten Maße wiederherstellen. Jedes Mal ist ein Rückgängig-Schritt. Bei Türen MUST NOT es erscheinen.

#### Scenario: Wand fehlt komplett
- **GIVEN** auf der oberen, 500 cm langen Kante von „Küche“ liegt ein Durchgang mit Breite 100 cm und Abstand 200 cm, er ist ausgewählt
- **WHEN** der Nutzer „Ganze Kante“ anhakt
- **THEN** hat der Durchgang die Breite 500 cm und den Abstand 0 cm
- **AND** über der ganzen oberen Kante ist kein Wandband mehr zu sehen
- **AND** „Ganze Kante“ hat einen Haken und ist nicht gesperrt

#### Scenario: Wieder abhaken
- **GIVEN** derselbe Durchgang nimmt nach dem Anhaken die ganze Kante ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat der Durchgang wieder die Breite 100 cm und den Abstand 200 cm
- **AND** „Ganze Kante“ hat keinen Haken

#### Scenario: Gemerkt über Neuladen
- **GIVEN** der Nutzer hat für denselben Durchgang „Ganze Kante“ angehakt
- **WHEN** er die Seite neu lädt, den Durchgang auswählt und „Ganze Kante“ abhakt
- **THEN** hat der Durchgang wieder die Breite 100 cm und den Abstand 200 cm

#### Scenario: Rückgängig
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 200 cm auf einer 500 cm langen Kante
- **AND** der Nutzer hat für ihn „Ganze Kante“ angehakt und danach einen anderen Raum ausgewählt
- **WHEN** er Strg+Z drückt
- **THEN** hat der Durchgang wieder Breite 100 cm und Abstand 200 cm und ist ausgewählt
- **AND** „Ganze Kante“ hat keinen Haken

#### Scenario: Abhaken ist ein Schritt
- **GIVEN** ein Durchgang nimmt nach dem Anhaken von „Ganze Kante“ die ganze 500 cm lange Kante ein
- **AND** der Nutzer hat „Ganze Kante“ abgehakt
- **WHEN** er Strg+Z drückt
- **THEN** hat der Durchgang wieder die Breite 500 cm und den Abstand 0 cm
- **AND** „Ganze Kante“ hat einen Haken

#### Scenario: Ganze Kante per Eingabe
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 0 cm zur linken Ecke auf einer 500 cm langen Kante ist ausgewählt
- **WHEN** der Nutzer die Breite 500 cm eingibt
- **THEN** hat „Ganze Kante“ einen Haken

#### Scenario: Fensterband über die ganze Wand
- **GIVEN** auf der oberen, 500 cm langen Kante von „Wohnen“ liegt ein Fenster mit Breite 120 cm und Abstand 190 cm, es ist ausgewählt
- **WHEN** der Nutzer „Ganze Kante“ anhakt
- **THEN** hat das Fenster die Breite 500 cm und den Abstand 0 cm und zeigt sein Rechteck mit Mittellinie über die ganze Kante
- **WHEN** der Nutzer „Ganze Kante“ wieder abhakt
- **THEN** hat das Fenster wieder die Breite 120 cm und den Abstand 190 cm

#### Scenario: Tür ohne Kästchen
- **WHEN** der Nutzer eine Tür auswählt
- **THEN** zeigt das Panel kein Kästchen „Ganze Kante“

## ADDED Requirements

### Requirement: Ersatzmaße beim Abhaken
Hat ein Durchgang oder Fenster über die ganze Kante keine gemerkten Maße oder passen sie nicht mehr auf die Kante, SHALL Abhaken von „Ganze Kante“ ihm die Standardbreite seiner Art geben (Durchgang 100 cm, Fenster 120 cm), mittig auf der Kante. Ist die Kante höchstens so lang, SHALL die Öffnung halb so breit wie die Kante werden, mittig. Ändert der Nutzer Breite oder Abstand auf anderem Weg als über das Kästchen, MUST die Öffnung ihre gemerkten Maße vergessen.

#### Scenario: Breite per Eingabe, dann abhaken
- **GIVEN** ein Durchgang mit Breite 100 cm und Abstand 0 cm zur linken Ecke auf einer 500 cm langen Kante
- **AND** der Nutzer hat die Breite 500 cm eingegeben
- **WHEN** er „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 100 cm und den Abstand 200 cm zur linken Ecke

#### Scenario: Fenster ohne gemerkte Maße
- **GIVEN** ein Fenster ohne gemerkte Maße nimmt eine 500 cm lange Kante ganz ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat das Fenster die Breite 120 cm und den Abstand 190 cm zur linken Ecke

#### Scenario: Kurze Kante
- **GIVEN** ein Durchgang ohne gemerkte Maße nimmt eine 80 cm lange Kante ganz ein
- **WHEN** der Nutzer „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 40 cm und den Abstand 20 cm zur linken Ecke

#### Scenario: Gemerkte Maße veraltet
- **GIVEN** der Nutzer hat für einen Durchgang mit Breite 100 cm und Abstand 50 cm zur linken Ecke auf einer 500 cm langen Kante „Ganze Kante“ angehakt
- **AND** danach die Breite auf 300 cm geändert und anschließend wieder 500 cm eingegeben
- **WHEN** er „Ganze Kante“ abhakt
- **THEN** hat der Durchgang die Breite 100 cm und den Abstand 200 cm zur linken Ecke (mittig), nicht 50 cm
