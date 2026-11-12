# app-deployment Specification

## Purpose

Legt fest, wie die App als statische Seite gebaut und öffentlich ausgeliefert wird: unter welcher Adresse sie erreichbar ist, wann eine neue Fassung veröffentlicht wird und welche Prüfungen davor bestehen müssen.

## Requirements

### Requirement: Öffentliche Adresse
Die veröffentlichte App SHALL unter `https://lumiliaro.github.io/raum-planer/` vollständig laden, mit allen Skripten, Stilen und dem Favicon. Alle Verweise auf eigene Dateien MUST unterhalb von `/raum-planer/` liegen.

#### Scenario: Aufruf der Seite
- **WHEN** ein Besucher `https://lumiliaro.github.io/raum-planer/` öffnet
- **THEN** erscheint die Arbeitsfläche der App
- **AND** keine Anfrage an eine eigene Datei der App liefert 404

#### Scenario: Aufruf ohne abschließenden Schrägstrich
- **WHEN** ein Besucher `https://lumiliaro.github.io/raum-planer` ohne `/` am Ende öffnet
- **THEN** erscheint ebenfalls die Arbeitsfläche der App

### Requirement: Lokale Entwicklung unverändert
Der Dev-Server SHALL die App weiterhin unter dem Wurzelpfad `/` ausliefern.

#### Scenario: Dev-Server
- **WHEN** der Entwickler `npm run dev` startet und die angezeigte Adresse öffnet
- **THEN** lädt die App unter `/` ohne Pfadzusatz

### Requirement: Automatische Veröffentlichung
Jeder Push auf den Branch `main` SHALL eine neue Fassung der Seite veröffentlichen. Eine Veröffentlichung MUST zusätzlich von Hand startbar sein. Pushes auf andere Branches MUST nichts veröffentlichen.

#### Scenario: Push auf main
- **WHEN** ein Commit auf `main` gepusht wird und alle Prüfungen bestehen
- **THEN** zeigt die öffentliche Adresse danach den Stand dieses Commits

#### Scenario: Push auf einen anderen Branch
- **WHEN** ein Commit auf den Branch `github-pages` gepusht wird
- **THEN** bleibt die veröffentlichte Fassung unverändert

#### Scenario: Manueller Start
- **WHEN** der Nutzer die Veröffentlichung auf GitHub von Hand startet
- **THEN** wird der aktuelle Stand von `main` geprüft und veröffentlicht

### Requirement: Prüfungen vor der Veröffentlichung
Vor jeder Veröffentlichung MUST die Lint-Prüfung, die Testsuite und der Produktions-Build (inklusive Typprüfung) fehlerfrei durchlaufen. Schlägt einer davon fehl, MUST die bisher veröffentlichte Fassung unverändert bleiben.

#### Scenario: Fehlschlagender Test
- **GIVEN** ein Commit auf `main` enthält einen fehlschlagenden Vitest-Test
- **WHEN** die Veröffentlichung läuft
- **THEN** bricht sie mit Fehler ab
- **AND** die öffentliche Adresse zeigt weiterhin die vorherige Fassung

### Requirement: Daten bleiben im Browser des Besuchers
Die veröffentlichte Seite SHALL wie die lokale App alle Pläne und Vorlagenbilder ausschließlich im Browser des jeweiligen Besuchers speichern. Die Seite MUST zur Laufzeit keine Plandaten an einen Server senden.

#### Scenario: Zwei Besucher
- **GIVEN** Besucher A legt auf der veröffentlichten Seite einen Raum mit 400 cm × 300 cm an
- **WHEN** Besucher B die Seite in einem anderen Browser öffnet
- **THEN** sieht Besucher B diesen Raum nicht
