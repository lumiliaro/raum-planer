# Spec Delta

## Purpose

Legt die Bereiche der Arbeitsoberfläche fest – Kopfleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste – sowie das Ein- und Ausblenden des Eigenschaften-Panels, damit alle Funktionen einen festen, vorhersehbaren Platz haben.

## ADDED Requirements

### Requirement: Aufbau der Arbeitsoberfläche
Das System SHALL das Browserfenster ohne Seiten-Scrollen vollständig ausfüllen und aufteilen in: Kopfleiste oben, Statusleiste unten, dazwischen die Zeichenfläche und rechts davon das Eigenschaften-Panel.

#### Scenario: Bereiche sichtbar
- **WHEN** die App in einem Desktop-Browserfenster geöffnet wird
- **THEN** sind Kopfleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste sichtbar
- **AND** die Seite selbst hat keinen Scrollbalken

### Requirement: Kopfleiste
Die Kopfleiste SHALL links den App-Namen „Raumplaner“ und mittig den Etagen-Umschalter zeigen.

#### Scenario: Inhalt der Kopfleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links in der Kopfleiste „Raumplaner“
- **AND** der Etagen-Umschalter steht mittig in der Kopfleiste

### Requirement: Oberfläche auf Deutsch
Alle sichtbaren Texte, Tooltips und Bedienhilfen-Beschriftungen der Oberfläche MUST auf Deutsch sein.

#### Scenario: Beschriftungen
- **WHEN** der Nutzer mit der Maus über die Schaltflächen der Zoom-Leiste fährt
- **THEN** erscheinen deutsche Tooltips wie „Vergrößern“, „Verkleinern“ und „Einpassen“

### Requirement: Eigenschaften-Panel mit Leerzustand
Das Eigenschaften-Panel SHALL standardmäßig sichtbar sein. Solange keine Form ausgewählt werden kann oder ausgewählt ist, SHALL es den Hinweis „Wähle eine Form aus“ zeigen.

#### Scenario: Erster Start
- **GIVEN** die App wurde in diesem Browser noch nie geöffnet
- **WHEN** die App geladen wird
- **THEN** ist das Eigenschaften-Panel sichtbar
- **AND** es zeigt den Hinweis „Wähle eine Form aus“

### Requirement: Panel ein- und ausblenden
Das System SHALL mittig am linken Rand des Eigenschaften-Panels einen Griff anzeigen. Bei sichtbarem Panel zeigt er einen Pfeil nach rechts und blendet das Panel per Klick aus; bei ausgeblendetem Panel steht er am rechten Rand der Zeichenfläche, zeigt einen Pfeil nach links und blendet es per Klick wieder ein.

#### Scenario: Ausblenden
- **GIVEN** das Eigenschaften-Panel ist sichtbar
- **WHEN** der Nutzer auf den Griff mit dem Pfeil nach rechts klickt
- **THEN** wird das Panel ausgeblendet und die Zeichenfläche nutzt die frei gewordene Breite
- **AND** der Griff zeigt einen Pfeil nach links

#### Scenario: Einblenden
- **GIVEN** das Eigenschaften-Panel ist ausgeblendet
- **WHEN** der Nutzer auf den Griff mit dem Pfeil nach links klickt
- **THEN** wird das Panel wieder angezeigt
- **AND** der Griff zeigt einen Pfeil nach rechts

#### Scenario: Bedienung per Tastatur
- **WHEN** der Griff per Tabulator fokussiert und mit Enter oder Leertaste ausgelöst wird
- **THEN** wechselt das Panel zwischen sichtbar und ausgeblendet
- **AND** der Griff hat eine deutsche Beschriftung „Eigenschaften ausblenden“ bzw. „Eigenschaften einblenden“

### Requirement: Panel-Zustand merken
Das System SHALL den Zustand des Eigenschaften-Panels (sichtbar oder ausgeblendet) im Browser speichern und beim nächsten Start wiederherstellen. Ist der gespeicherte Wert nicht lesbar, MUST das Panel sichtbar starten.

#### Scenario: Nach Neuladen
- **GIVEN** der Nutzer hat das Panel ausgeblendet
- **WHEN** er die Seite neu lädt
- **THEN** ist das Panel weiterhin ausgeblendet

#### Scenario: Speicher nicht verfügbar
- **GIVEN** der Browser-Speicher ist blockiert oder enthält einen ungültigen Wert
- **WHEN** die App geladen wird
- **THEN** ist das Panel sichtbar
- **AND** die App funktioniert ohne Fehlermeldung

### Requirement: Statusleiste mit Kalibrierstatus
Die Statusleiste SHALL den Kalibrierstatus der aktiven Etage anzeigen: „Nicht kalibriert“, solange für die Etage keine Kalibrierung hinterlegt ist, sonst den Maßstab in px/cm mit deutschem Dezimalkomma.

#### Scenario: Etage ohne Kalibrierung
- **GIVEN** für das Erdgeschoss ist keine Kalibrierung hinterlegt
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Nicht kalibriert“

#### Scenario: Etage mit Kalibrierung
- **GIVEN** für das Erdgeschoss ist ein Maßstab von 0,9986 px/cm hinterlegt (1 000 cm entsprechen 998,6 px)
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Maßstab: 0,9986 px/cm“
