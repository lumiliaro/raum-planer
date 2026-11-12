# Design

## Context

Siehe proposal.md – Why. Ausgangslage im Code:

- Reine SPA ohne Router: es gibt nur `index.html`, daher keine Unterseiten,
  die auf Pages mit 404 enden könnten.
- Keine eigenen absoluten Pfade im App-Code. Einziger absoluter Verweis ist
  `href="/favicon.svg"` in `index.html` (Datei aus `public/`) sowie das
  Modul-Skript `/src/main.tsx`; beide schreibt Vite beim Build anhand von
  `base` um.
- `vite.config.ts` importiert `defineConfig` aus `vitest/config` und enthält
  auch die Test-Konfiguration.
- Lokal läuft Node 26 über nvm; es gibt keine `.nvmrc` und kein
  `engines`-Feld. Vite 8 braucht mindestens Node 20.19 bzw. 22.12.
- Persistenz-Schlüssel tragen den Präfix `raumplaner.` (localStorage) bzw.
  heißen `raumplaner` (IndexedDB).
- Datenmodell und `schemaVersion` bleiben unverändert: Die Änderung betrifft
  nur Build und Auslieferung.

## Goals / Non-Goals

**Goals:**

- Ein einziger, nachvollziehbarer Weg von `main` zur öffentlichen Seite.
- Lokale Entwicklung und Tests bleiben genau wie bisher.

**Non-Goals:**

- Vorschau-Deployments für Branches oder Pull Requests.
- Caching-Strategie oder Service Worker.

## Decisions

### 1. `base` nur für den Build setzen

`defineConfig` bekommt die Funktionsform `({ command }) => ({ … })` mit
`base: command === "build" ? "/raum-planer/" : "/"`. `vite preview` nutzt
die Build-Konfiguration und zeigt die Seite deshalb unter `/raum-planer/`,
also wie auf Pages.

- Alternative: `base: "/raum-planer/"` immer. Verworfen, weil dann auch
  `npm run dev` unter `/raum-planer/` läuft und die gewohnte Adresse bricht.
- Alternative: relatives `base: "./"`. Verworfen: funktioniert für eine Seite
  ohne Router zwar auch, aber der feste Pfad ist eindeutiger und passt zur
  Spec (Verweise unterhalb `/raum-planer/`).

Der Pfad steht fest im Code statt in einer Umgebungsvariable; eine zweite
Zieladresse ist nicht geplant.

### 2. Offizieller Pages-Workflow mit zwei Jobs

`.github/workflows/deploy.yml`:

- Auslöser: `push` auf `main` und `workflow_dispatch`.
- `permissions`: `contents: read`, `pages: write`, `id-token: write`.
- `concurrency`: Gruppe `pages`, `cancel-in-progress: false`, damit ein
  laufendes Deployment nicht abgebrochen wird.
- Job `build`: `actions/checkout@v4`, `actions/setup-node@v4` mit
  `node-version: 24` und `cache: npm`, dann `npm ci`, `npm run lint`,
  `npm test`, `npm run build`, `actions/configure-pages@v5`,
  `actions/upload-pages-artifact@v3` mit `path: dist`.
- Job `deploy`: `needs: build`, `environment: github-pages` mit der URL aus
  dem Deploy-Schritt, `actions/deploy-pages@v4`.

Weil `deploy` von `build` abhängt, wird bei einem Fehler in Lint, Test oder
Build nichts hochgeladen (Spec: Prüfungen vor der Veröffentlichung).

- Alternative: Branch `gh-pages` mit dem Paket `gh-pages`. Verworfen: neue
  Abhängigkeit, gebaute Dateien landen in der Git-Historie.
- Node 24 statt 26: aktuelle LTS-Linie, erfüllt die Mindestversion von Vite 8.
  Lokal weicht die Version ab; das ist unkritisch, solange Build und Tests in
  CI laufen.

### 3. Keine Laufzeit-Netzwerkaufrufe – Einordnung

Das Projekt sagt „keine Netzwerkaufrufe zur Laufzeit“ und „kein Produkt für
andere Nutzer“. Beides bleibt gültig: GitHub Pages liefert nur einmal die
statischen Dateien aus, danach arbeitet die App wie lokal. Dass die Seite
öffentlich erreichbar ist, macht sie nicht zum Mehrbenutzer-Produkt; jeder
Besucher hat seinen eigenen, getrennten Browser-Speicher.

### 4. README

Kurzer Abschnitt „Online nutzen“ mit der URL, dem Hinweis auf den
Browser-Speicher und darauf, dass lokale Pläne per Export/Import
mitgenommen werden. Die veralteten Zeilen zu `public/plans/` und
`src/config/house.ts` sowie der Satz „auf den festen Grundrissen
(Erdgeschoss, …)“ werden an den heutigen Stand angepasst (Etagen und
Vorlagen sind Nutzerdaten).

## Risks / Trade-offs

- [Gemeinsamer Origin `lumiliaro.github.io` mit allen anderen Pages-Seiten
  des Accounts] → localStorage und IndexedDB werden geteilt. Die Schlüssel
  tragen bereits den Präfix `raumplaner`, Kollisionen sind daher unwahrscheinlich.
- [Pläne von `localhost` erscheinen nicht auf der öffentlichen Seite] → im
  README auf Export/Import hinweisen.
- [Browser-Speicher kann vom Browser geleert werden] → besteht schon lokal;
  Export als Sicherung empfehlen, keine Änderung in diesem Change.
- [Action-Versionen veralten] → Hauptversionen fest angeben; GitHub meldet
  veraltete Actions im Lauf.
- [Pages ist im Repo nicht aktiviert] → erster Lauf schlägt im Schritt
  `configure-pages` fehl; manuelle Aufgabe „Source: GitHub Actions“ vor dem
  ersten Push erledigen bzw. danach den Workflow von Hand neu starten.

## Migration Plan

1. Implementierung auf Branch `github-pages` (abgezweigt von `public-main`).
2. Nutzer: altes privates Repo umbenennen oder löschen, neues öffentliches
   Repo `raum-planer` anlegen (ohne README/Lizenz, damit es leer ist).
3. Nutzer: `origin` auf das neue Repo setzen, `public-main` als `main` pushen,
   Pages-Quelle „GitHub Actions“ einstellen.
4. Branch `github-pages` pushen, PR nach `main`, mergen → erstes Deployment.

Rollback: Workflow-Lauf einer früheren Fassung erneut starten oder Pages in
den Repo-Einstellungen abschalten.
