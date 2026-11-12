## ADDED Requirements

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
