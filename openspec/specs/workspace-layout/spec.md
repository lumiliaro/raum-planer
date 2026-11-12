# workspace-layout Specification

## Purpose

Legt die Bereiche der Arbeitsoberfläche fest – Kopfleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste – sowie das Ein- und Ausblenden des Eigenschaften-Panels, damit alle Funktionen einen festen, vorhersehbaren Platz haben.

## Requirements

### Requirement: Aufbau der Arbeitsoberfläche
Das System SHALL das Browserfenster ohne Seiten-Scrollen vollständig ausfüllen und aufteilen in: Kopfleiste oben, Statusleiste unten, dazwischen von links nach rechts die Werkzeugleiste, die Zeichenfläche und das Eigenschaften-Panel.

#### Scenario: Bereiche sichtbar
- **WHEN** die App in einem Desktop-Browserfenster geöffnet wird
- **THEN** sind Kopfleiste, Werkzeugleiste, Zeichenfläche, Eigenschaften-Panel und Statusleiste sichtbar
- **AND** die Seite selbst hat keinen Scrollbalken

#### Scenario: Werkzeugleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links neben der Zeichenfläche eine schmale, senkrechte Werkzeugleiste
- **AND** an ihrem unteren Ende befindet sich die Schaltfläche „Vorlage kalibrieren“ mit deutschem Tooltip

### Requirement: Kopfleiste
Die Kopfleiste SHALL links den App-Namen „Raumplaner“, mittig den Etagen-Umschalter mit der Icon-Schaltfläche „Etagen bearbeiten“ rechts daneben und rechts die Schaltflächen „Importieren“, „Exportieren“ und „PDF“ mit Icon und Text sowie ganz rechts die Icon-Schaltfläche „Einstellungen“ (Zahnrad) zeigen. Während des Kalibrier-Modus MUST „Etagen bearbeiten“, „Importieren“, „Exportieren“, „PDF“ und „Einstellungen“ ausgeblendet sein.

#### Scenario: Inhalt der Kopfleiste
- **WHEN** die App geöffnet ist
- **THEN** steht links in der Kopfleiste „Raumplaner“
- **AND** der Etagen-Umschalter steht mittig in der Kopfleiste, rechts daneben „Etagen bearbeiten“ mit deutschem Tooltip
- **AND** rechts stehen „Importieren“, „Exportieren“ und „PDF“, ganz rechts „Einstellungen“ mit dem Tooltip „Einstellungen“

#### Scenario: Kalibrier-Modus
- **GIVEN** der Kalibrier-Modus ist aktiv
- **WHEN** der Nutzer auf die Kopfleiste schaut
- **THEN** sind „Etagen bearbeiten“, „Importieren“, „Exportieren“, „PDF“ und „Einstellungen“ nicht zu sehen
- **AND** rechts steht stattdessen „Kalibrierung beenden“

### Requirement: Oberfläche auf Deutsch
Alle sichtbaren Texte, Tooltips und Bedienhilfen-Beschriftungen der Oberfläche MUST auf Deutsch sein.

#### Scenario: Beschriftungen
- **WHEN** der Nutzer mit der Maus über die Schaltflächen der Zoom-Leiste fährt
- **THEN** erscheinen deutsche Tooltips wie „Vergrößern“, „Verkleinern“ und „Einpassen“

### Requirement: Eigenschaften-Panel mit Leerzustand
Das Eigenschaften-Panel SHALL standardmäßig sichtbar sein. Solange weder eine Form noch ein Raum ausgewählt ist, SHALL es den Hinweis „Wähle eine Form oder einen Raum aus“ und darunter den Abschnitt „Vorlage“ der aktiven Etage zeigen (siehe `floor-underlay`). Ist eine Form ausgewählt, SHALL es das Eigenschaften-Formular der Form zeigen (siehe `shape-properties`), ist ein Raum ausgewählt, die Eigenschaften des Raums (siehe `floor-rooms`). Zahlen MUST mit höchstens einer Nachkommastelle und deutschem Dezimalkomma erscheinen.

#### Scenario: Erster Start
- **GIVEN** die App wurde in diesem Browser noch nie geöffnet
- **WHEN** die App geladen wird
- **THEN** ist das Eigenschaften-Panel sichtbar
- **AND** es zeigt den Hinweis „Wähle eine Form oder einen Raum aus“ und den Abschnitt „Vorlage“ mit „Bild hochladen“

#### Scenario: Form ausgewählt
- **GIVEN** ein Rechteck mit Breite 100 cm, Tiefe 60 cm, Mittelpunkt x = 412 cm, y = 189 cm und Drehung 0°
- **WHEN** der Nutzer das Rechteck auswählt
- **THEN** zeigt das Panel „Rechteck“ und die Schaltfläche „Löschen“
- **AND** es zeigt die Felder Breite „100“, Tiefe „60“, X „412“, Y „189“ und Drehung „0“ mit den Einheiten cm bzw. °
- **AND** der Abschnitt „Vorlage“ ist nicht zu sehen

#### Scenario: Werte nach Größenänderung
- **GIVEN** das Rechteck aus dem vorigen Szenario ist ausgewählt
- **WHEN** der Nutzer die Breite über den rechten Anfasser auf 125 cm vergrößert
- **THEN** zeigt das Panel Breite „125“ und X „424,5“

#### Scenario: Raum ausgewählt
- **WHEN** der Nutzer den Raum „Wohnen“ auswählt
- **THEN** zeigt das Panel „Raum“, den Namen „Wohnen“ und die Kantenlängen
- **AND** der Abschnitt „Vorlage“ ist nicht zu sehen

#### Scenario: Auswahl aufgehoben
- **GIVEN** eine Form ist ausgewählt
- **WHEN** der Nutzer `Esc` drückt
- **THEN** zeigt das Panel wieder „Wähle eine Form oder einen Raum aus“ und den Abschnitt „Vorlage“

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
Die Statusleiste SHALL den Vorlagenstatus der aktiven Etage anzeigen: „Keine Vorlage“ ohne Vorlage, „Vorlage fehlt“ in Warnfarbe, wenn das Bild der Vorlage nicht vorhanden ist, „Vorlage nicht kalibriert“ in Warnfarbe für eine Vorlage mit Bild ohne Kalibrierung, sonst den Maßstab in px/cm mit deutschem Dezimalkomma.

#### Scenario: Etage ohne Vorlage
- **GIVEN** die Etage „Keller“ hat keine Vorlage
- **WHEN** der Keller aktiv ist
- **THEN** zeigt die Statusleiste „Keine Vorlage“ ohne Warnfarbe

#### Scenario: Etage ohne Kalibrierung
- **GIVEN** das Erdgeschoss hat eine Vorlage mit Bild ohne Kalibrierung
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Vorlage nicht kalibriert“ in Warnfarbe

#### Scenario: Etage mit Kalibrierung
- **GIVEN** für die Vorlage des Erdgeschosses ist ein Maßstab von 0,9986 px/cm hinterlegt (1 000 cm entsprechen 998,6 px)
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Maßstab: 0,9986 px/cm“

#### Scenario: Bild fehlt
- **GIVEN** die Vorlage des Erdgeschosses ist mit 0,9986 px/cm kalibriert, ihr Bild ist aber nicht vorhanden
- **WHEN** das Erdgeschoss aktiv ist
- **THEN** zeigt die Statusleiste „Vorlage fehlt“ in Warnfarbe

### Requirement: Browser-Tab
Der Browser-Tab der App SHALL den Titel „Raumplaner“ und das eigene App-Icon zeigen, einen stilisierten Grundriss. Der alte Name „Haus-Gestalter“ und das Standard-Logo von Vite MUST NOT mehr erscheinen. Das Icon MUST auf hellen und dunklen Tab-Leisten erkennbar sein.

#### Scenario: Titel im Tab
- **WHEN** die App im Browser geöffnet wird
- **THEN** steht im Browser-Tab „Raumplaner“

#### Scenario: Icon im Tab
- **WHEN** die App im Browser geöffnet wird
- **THEN** zeigt der Tab das Grundriss-Icon der App und nicht das Vite-Logo

#### Scenario: Icon in der veröffentlichten Fassung
- **WHEN** ein Besucher `https://lumiliaro.github.io/raum-planer/` öffnet
- **THEN** zeigt der Tab ebenfalls das Grundriss-Icon
- **AND** die Anfrage nach dem Icon liefert kein 404

#### Scenario: Dunkle Tab-Leiste
- **GIVEN** der Browser nutzt ein dunkles Farbschema
- **WHEN** die App geöffnet wird
- **THEN** ist das Icon im Tab deutlich vom Hintergrund der Tab-Leiste zu unterscheiden
