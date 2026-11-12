# Design

## Context

Siehe proposal.md – Why. Der neue Name ist in Oberfläche, Speicherschlüsseln (`raumplaner.plan`, IndexedDB `raumplaner`) und Pages-Pfad (`/raum-planer/`) bereits umgesetzt. Übrig sind statische Dateien: `index.html`, `README.md`, `package.json`/`package-lock.json`, ein Testwert und `public/favicon.svg` (Vite-Standard-Logo). `index.html` bindet das Icon über `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` ein; Vite schreibt den Pfad beim Build auf `/raum-planer/favicon.svg` um.

## Goals / Non-Goals

**Goals:**
- Kein „Haus-Gestalter“/„haus-gestalter“ mehr außerhalb von `openspec/changes/archive/` und `node_modules/`.
- Ein eigenes, schlichtes Favicon als einzelne SVG-Datei.

**Non-Goals:**
- Kein Icon-Set (PNG, Apple-Touch-Icon, Manifest), kein Logo in der Kopfleiste.

## Decisions

- **Paketname `raum-planer`.** Passt zu Repo-Name und Pages-Pfad. Alternative `raumplaner` (wie die Speicherschlüssel) verworfen, weil der Paketname eher zum Repo gehört. In `package-lock.json` wird der Name an beiden Stellen (oberste Ebene und `packages[""]`) angepasst – am einfachsten über `npm install`, das die Lock-Datei aus `package.json` aktualisiert, ohne Abhängigkeiten zu ändern.
- **Speicherschlüssel und Pages-Pfad bleiben.** Sie tragen schon den neuen Namen; eine Änderung würde gespeicherte Pläne und Vorlagenbilder im Browser verwaisen lassen.
- **Favicon: handgeschriebenes SVG, 32×32-ViewBox.** Ein abgerundetes Quadrat als Hintergrundkachel in der Wandfarbe der App (`#3F3F46`, siehe `FACTORY_SETTINGS`), darauf ein heller Grundriss: Außenrahmen mit zwei Innenwänden, die drei Räume bilden, und einer Türlücke. Die gefüllte Kachel sorgt dafür, dass das Icon auf hellen und dunklen Tab-Leisten gleich gut lesbar ist, ohne `prefers-color-scheme` im SVG. Striche mindestens 2 Einheiten breit, damit sie bei 16 px nicht verschwimmen. Alternativen: Icon-Bibliothek (lucide) als Quelle – verworfen, da es eine Datei ist und keine Abhängigkeit braucht; transparentes Icon mit Medienabfrage – verworfen, weil nicht alle Browser die Medienabfrage im Favicon auswerten.
- **Dateiname bleibt `public/favicon.svg`.** So bleibt der Verweis in `index.html` unverändert, und das Deployment-Szenario „Favicon lädt unter `/raum-planer/`“ gilt weiter.
- **Testwert in `plan-import.test.ts`.** Der Test prüft nur, dass eine beliebige `package.json` keine Plan-Datei ist; der Name ist egal. Er wird auf `raum-planer` geändert, damit die Suche nach dem alten Namen leer bleibt.

**Datenmodell und schemaVersion:** keine Auswirkung. Plan-Schema, Export-Format und `schemaVersion` bleiben unverändert.

## Risks / Trade-offs

- [Browser zeigen das alte Favicon aus dem Cache] → Kein Eingriff im Code (kein Cache-Busting-Parameter); nach einem harten Neuladen bzw. beim nächsten Besuch erscheint das neue Icon. Beim manuellen Prüfen daran denken.
- [`npm install` ändert mehr als den Namen in der Lock-Datei] → Nach dem Lauf per `git diff package-lock.json` prüfen, dass sich nur die beiden `name`-Zeilen geändert haben; sonst die zwei Zeilen von Hand anpassen und die Lock-Datei zurücksetzen.
