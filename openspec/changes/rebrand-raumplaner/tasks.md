# Tasks

## 1. Name

- [ ] 1.1 In `index.html` den `<title>` auf „Raumplaner“ setzen; prüfen: `npm run dev` zeigt „Raumplaner“ im Browser-Tab
- [ ] 1.2 In `README.md` die Überschrift auf „# Raumplaner“ setzen; prüfen: erste Zeile der README lautet so
- [ ] 1.3 In `package.json` `name` auf `raum-planer` setzen und `package-lock.json` angleichen (beide `name`-Einträge); prüfen: `git diff package-lock.json` zeigt nur die zwei `name`-Zeilen
- [ ] 1.4 In `src/lib/plan-import.test.ts` den Testwert `name: "haus-gestalter"` auf `raum-planer` ändern; prüfen: `npm test` grün
- [ ] 1.5 Prüfen, dass `grep -rniI "haus-gestalter\|haus gestalter\|hausgestalter" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=archive .` nur noch Treffer in diesem Change selbst liefert

## 2. Favicon

- [ ] 2.1 `public/favicon.svg` durch ein handgeschriebenes SVG ersetzen (32×32-ViewBox, abgerundete Kachel in `#3F3F46`, heller Grundriss mit Außenrahmen, zwei Innenwänden und einer Türlücke, Striche ≥ 2 Einheiten); prüfen: Datei ist gültiges SVG und enthält keine Vite-Farben (`#863bff`, `#47bfff`)
- [ ] 2.2 Manuell im Browser prüfen (nach hartem Neuladen): Tab zeigt das Grundriss-Icon bei hellem und bei dunklem Farbschema

## 3. Abschluss

- [ ] 3.1 `npm run build` prüfen: `dist/index.html` enthält `<title>Raumplaner</title>` und verweist auf `/raum-planer/favicon.svg`, `dist/favicon.svg` ist das neue Icon
- [ ] 3.2 Letzte Aufgabe: `npm run lint`, `npm run build` und `npm test` laufen fehlerfrei
