# Tasks

Aufgaben mit **[Nutzer]** kann nur der Nutzer auf github.com erledigen; die
KI hakt sie erst ab, wenn der Nutzer sie bestätigt.

## 1. Build-Pfad

- [x] 1.1 `vite.config.ts` auf die Funktionsform von `defineConfig` umstellen und `base` auf `"/raum-planer/"` nur für `command === "build"` setzen (sonst `"/"`), Test-Konfiguration unverändert lassen; prüfen: `npm run build`, dann verweisen in `dist/index.html` Skript, CSS und Favicon auf `/raum-planer/…`
- [x] 1.2 Lokal mit `npm run preview` prüfen, dass die App unter `/raum-planer/` ohne 404 im Netzwerk-Tab lädt, und mit `npm run dev`, dass sie weiterhin unter `/` lädt (Sichtprüfung durch den Nutzer im Browser)

## 2. Deploy-Workflow

- [x] 2.1 `.github/workflows/deploy.yml` anlegen wie in design.md, Entscheidung 2 (Auslöser `push` auf `main` und `workflow_dispatch`, Rechte, `concurrency`, Job `build` mit `npm ci`, `npm run lint`, `npm test`, `npm run build`, Upload von `dist`, Job `deploy` mit `needs: build`); prüfen: YAML ist gültig (`python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`) und alle vier npm-Befehle laufen lokal fehlerfrei

## 3. Dokumentation

- [x] 3.1 README: Abschnitt „Online nutzen“ mit `https://lumiliaro.github.io/raum-planer/`, Hinweis auf Speicherung nur im Browser und Mitnahme lokaler Pläne per Export/Import, kurzer Hinweis auf das automatische Deployment von `main`; prüfen: Abschnitt vorhanden, URL korrekt
- [x] 3.2 README: veraltete Angaben korrigieren (Zeile zu `public/plans/`, `src/config/house.ts`, „feste Grundrisse (Erdgeschoss, Obergeschoss, Dachgeschoss)“) entsprechend dem heutigen Stand (Etagen und Vorlagen sind Nutzerdaten); prüfen: jeder in der Projektstruktur genannte Pfad existiert im Repo

## 4. Veröffentlichung einrichten

- [x] 4.1 **[Nutzer]** Altes privates Repo `lumiliaro/haus-gestalter` in `haus-gestalter-private` umbenannt
- [x] 4.2 **[Nutzer]** Neues **öffentliches** Repo `lumiliaro/raum-planer` angelegt; geprüft: öffentlich und leer
- [x] 4.3 **[Nutzer]** Lokal `origin` auf das neue Repo setzen (bzw. altes als `old-private` behalten) und `git push -u origin public-main:main` ausführen; prüfen: `main` auf GitHub zeigt genau einen Commit, Autor mit noreply-Adresse, keine Dateien unter `public/plans/`
- [x] 4.4 **[Nutzer]** Repo → Settings → Pages → Source „GitHub Actions“ wählen; prüfen: Einstellung gespeichert
- [x] 4.5 Branch `github-pages` pushen, PR nach `main` öffnen; nach dem Merge durch den Nutzer prüfen: Workflow „Deploy“ läuft grün durch

## 5. Integration

- [x] 5.1 Live-Prüfung durch den Nutzer: `https://lumiliaro.github.io/raum-planer/` und die Adresse ohne abschließenden `/` laden die App, ein angelegter Raum bleibt nach Neuladen erhalten, Export und Import funktionieren
- [x] 5.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei

## Workflow follow-up

- Change nach erfolgreicher Live-Prüfung archivieren (`/opsx:archive`).
- Der abgeschlossene, nicht archivierte Change `room-lock` liegt ebenfalls noch offen und kann separat archiviert werden.
