# Proposal

## Why

Die App heißt inzwischen „Raumplaner“ (Kopfleiste, Fehlermeldungen, Speicherschlüssel, GitHub-Repo und Pages-Adresse `/raum-planer/`), an einigen Stellen steht aber noch der alte Name „Haus-Gestalter“ – am sichtbarsten im Browser-Tab. Außerdem zeigt der Tab noch das Standard-Logo von Vite statt eines eigenen Icons. Der Rebrand soll diese Reste beseitigen, damit die App überall einheitlich als „Raumplaner“ auftritt.

## What Changes

- Der Seitentitel (Browser-Tab) lautet „Raumplaner“ statt „Haus-Gestalter“.
- Die README-Überschrift lautet „Raumplaner“.
- Der Paketname in `package.json` und `package-lock.json` wird `raum-planer` (passend zu Repo und Pages-Pfad).
- Ein Testwert, der eine fremde `package.json` mit dem alten Namen nachbildet, bekommt den neuen Namen, damit im Repo kein „haus-gestalter“ mehr vorkommt.
- Das Vite-Standard-Favicon (`public/favicon.svg`) wird durch ein schlichtes eigenes SVG-Icon ersetzt: ein stilisierter Grundriss.

Nicht im Umfang:
- Umbenennen des lokalen Arbeitsordners `haus-gestalter` und Entfernen des Git-Remotes `old-private` – das betrifft nur die Entwicklerumgebung, nicht das Repo.
- Speicherschlüssel (`raumplaner.plan`, IndexedDB `raumplaner`), Pages-Pfad `/raum-planer/` und Texte in der Oberfläche – sie tragen schon den neuen Namen und bleiben unverändert. Gespeicherte Pläne bleiben dadurch erhalten.
- Ein Logo in der Kopfleiste, PNG-/Apple-Touch-Icons oder ein Web-App-Manifest.
- Archivierte Changes unter `openspec/changes/archive/` – sie bleiben als Historie unverändert.
- Beispieldaten wie der Planname „Umzug Musterhaus“ in Tests und Fixtures – das ist kein Markenname.

## Capabilities

### New Capabilities

_Keine._

### Modified Capabilities

- `workspace-layout`: Neue Anforderung, dass der Browser-Tab den App-Namen „Raumplaner“ und das eigene App-Icon zeigt.

## Impact

- `index.html` (Titel), `public/favicon.svg` (neues Icon), `README.md`, `package.json`, `package-lock.json`, `src/lib/plan-import.test.ts`.
- Keine Änderung am Datenmodell, an `schemaVersion`, an Speicherschlüsseln oder an der Veröffentlichungsadresse; keine neuen Abhängigkeiten.
