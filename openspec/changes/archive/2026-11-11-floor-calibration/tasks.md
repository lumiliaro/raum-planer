# Tasks

## 1. Reine Logik in `src/lib/`

- [x] 1.1 `src/lib/calibration.ts` mit `roundImageCoord`, `roundImagePoint`, `distancePx`, `parseLengthCm`, `formatLengthText`, `computeCalibration`, `gridPxPerMeter` umsetzen; `formatCalibrationSnippet` entfernen (siehe design.md, Entscheidung 1)
- [x] 1.2 `src/lib/calibration.test.ts`: Rundung auf 0,1 px; Abstand waagrecht und schräg; `parseLengthCm` für „1000“, „412,5“, „412.5“, „ 80 “ → Zahl und für „“, „0“, „-5“, „abc“, „1,2,3“ → `null`; `formatLengthText` für 1000 → „1000“, 412,5 → „412,5“ und Rückweg über `parseLengthCm`; Beispiel aus der Spec (P1 120,0/160,4, P2 1118,6/160,4, 1 000 cm → `pxPerCm` 0,9986, Raster 99,86); gleiche Punkte → `null`; prüfen mit `npm test`
- [x] 1.3 `formatImageCoord` in `src/lib/format.ts` ergänzen und in `src/lib/format.test.ts` testen („120,0“, „1 118,6“ mit geschütztem Leerzeichen, „998,6“, „99,9“); prüfen mit `npm test`
- [x] 1.4 `src/lib/calibration-schema.ts` (`ImagePointSchema`, `CalibrationSchema`, abgeleitete Typen) und `src/lib/calibration-storage.ts` (`readCalibrations`, `writeCalibrations`, Schlüssel `raumplaner.calibration`) anlegen, mit Tests: Rundweg schreiben/lesen; fehlender Schlüssel, kaputtes JSON, falsche `version`, blockierter Speicher → `{}`; ungültiger Eintrag und unbekannte Etage werden übergangen, gültige bleiben; Schreiben in blockierten Speicher → `false`; prüfen mit `npm test`

## 2. Haus-Konfiguration und Store

- [x] 2.1 `src/config/house.ts`: Feld `calibration` und die Typen `Calibration`/`ImagePoint` entfernen; Verwendungen auf `@/lib/calibration-schema` umstellen; `src/config/house.test.ts` läuft weiter
- [x] 2.2 `src/store/app-store.ts` um `calibrations` (geladen mit `readCalibrations`) und `calibrationDraft` (mit `saveFailed`) sowie die Aktionen `toggleCalibration`, `endCalibration`, `addCalibrationPoint`, `moveCalibrationPoint`, `resetCalibrationPoints`, `setCalibrationLength`, `saveCalibration` erweitern; Start und Etagenwechsel belegen den Entwurf aus der gespeicherten Kalibrierung vor
- [x] 2.3 `src/store/app-store.test.ts` erweitern: gespeicherte Kalibrierungen werden beim Start geladen; Modus startet leer bzw. vorbelegt (Punkte, Länge „412,5“); erster/zweiter Punkt werden gesetzt und gerundet, dritter ist wirkungslos; Verschieben ändert nur den gewählten Punkt; „neu setzen“ behält die Länge; Beenden verwirft den Entwurf und lässt die gespeicherte Kalibrierung unverändert; Speichern ohne Ergebnis ist wirkungslos; Speichern übernimmt die Kalibrierung der aktiven Etage, schreibt den Schlüssel, lässt andere Etagen unberührt und beendet den Modus; Speichern mit blockiertem Speicher übernimmt die Kalibrierung, lässt den Modus offen und setzt `saveFailed`; Etagenwechsel belegt den Entwurf mit der neuen Etage vor (bzw. leer) und lässt den Modus aktiv; `propertiesPanelOpen` und dessen Schlüssel bleiben beim Starten/Beenden unverändert; prüfen mit `npm test`
- [x] 2.4 `StatusBar` liest den Maßstab aus `calibrations` im Store; prüfen mit `npm run build`

## 3. Gerüst: Werkzeugleiste und Modus

- [x] 3.1 `ToolBar` mit Schaltfläche „Etage kalibrieren“ (Icon `Ruler`, unten, `aria-pressed`, deutscher Tooltip) anlegen und `AppShell` auf Spaltenaufbau mit Werkzeugleiste links umstellen; prüfen im Browser (manuell): Werkzeugleiste links sichtbar, Seite ohne Scrollbalken, Zoom/Ziehen/Panel-Griff funktionieren wie zuvor
- [x] 3.2 `CalibrationBanner`, „Kalibrierung beenden“ in der `HeaderBar` und Panel-Wechsel in `AppShell` (Kalibrier-Panel statt Eigenschaften-Panel, Griff verborgen) umsetzen; prüfen im Browser (manuell): Starten zeigt Hinweisleiste und Panel „Erdgeschoss kalibrieren“; Beenden per Kopfleiste und per erneutem Klick auf „Etage kalibrieren“; ausgeblendetes Eigenschaften-Panel ist nach dem Beenden wieder ausgeblendet und bleibt es nach Neuladen
- [x] 3.3 `docs/design/README.md` um eine Zeile „Kalibrierung“ in der Tabelle der Bedienentscheidungen ergänzen (zwei Klicks, Punkte ziehbar, „Kalibrierung speichern“ speichert im Browser und wird mit `plan-model` Teil des Plans, Vorbelegung beim erneuten Kalibrieren); prüfen, dass die Zeile zu design.md passt

## 4. Kalibrier-Panel

- [x] 4.1 `CalibrationPanel` mit Schritten, Koordinatenanzeige, Längenfeld (Einheit cm, Hinweis bei ungültiger Eingabe), „Punkte neu setzen“, Ergebnis (`pxPerCm`, „Raster 1 m entspricht … px“) und Hinweistext anlegen; Code-Block und „Werte kopieren“ entfernen; prüfen im Browser (manuell): ohne Punkte kein Ergebnis, „0“/„abc“ zeigen den Hinweis, „412,5“ wird angenommen
- [x] 4.2 „Kalibrierung speichern“ (primär, ohne Ergebnis gesperrt) und Hinweis bei `saveFailed`; prüfen im Browser (manuell): Speichern beendet den Modus und die Statusleiste zeigt „Maßstab: … px/cm“, auch nach Neuladen; erneuter Start zeigt die gespeicherten Punkte und die Länge; Beenden ohne Speichern lässt den gespeicherten Maßstab unverändert; mit blockiertem Speicher (z. B. Website-Daten in den Browser-Einstellungen sperren) erscheint der Hinweis und das Panel bleibt offen

## 5. Zeichenfläche

- [x] 5.1 Klick auf den Grundriss setzt im Modus P1 und P2 über `screenToImage`, Klicks neben das Bild und dritte Klicks sind wirkungslos, Zeiger als Fadenkreuz; prüfen im Browser (manuell): Punkte erscheinen an der Klickstelle, Koordinaten im Panel stimmen bei 100 % und 200 % mit der Stelle im PNG überein, Ziehen der Ansicht setzt keinen Punkt
- [x] 5.2 `CalibrationOverlay` (Messstrecke, Fadenkreuz-Marker, Etiketten „P1“/„P2“, Beschriftung „… px“) mit gleichbleibender Bildschirmgröße; prüfen im Browser (manuell): Marker und Beschriftung bleiben bei 10 % und 800 % gleich groß, Strecke folgt beim Zoomen und Verschieben dem Grundriss
- [x] 5.3 Marker ziehbar (Stage bewegt sich nicht, Begrenzung auf die Bildfläche, fortlaufende Aktualisierung im Panel); prüfen im Browser (manuell): P2 ziehen ändert Koordinaten, Streckenlänge und Ergebnis live, Marker lässt sich nicht über den Bildrand hinausziehen, Ansicht bleibt dabei stehen
- [x] 5.4 Etagenwechsel im Modus; prüfen im Browser (manuell): Wechsel in ein nicht kalibriertes Obergeschoss zeigt „Obergeschoss kalibrieren“ ohne Punkte und mit leerem Längenfeld, Overlay ist leer; Wechsel in eine kalibrierte Etage zeigt deren gespeicherte Punkte und Länge

## 6. Abschluss

- [x] 6.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien in `specs/floor-calibration/spec.md` und `specs/workspace-layout/spec.md`, dazu alle drei Etagen kalibrieren und speichern; `npm run lint` ohne neue Warnungen
- [x] 6.2 `npm run build` und `npm test` laufen fehlerfrei

## Workflow follow-up

- Mit dem Werkzeug alle drei Etagen messen und speichern.
- Offene Changes an die neue Lage anpassen (`/opsx:update`): `plan-model` (`calibrationByFloor` im Plan, einmalige Übernahme aus `raumplaner.calibration`), `export-import` (Kalibrierung in Export und Import), `basic-shapes`/`more-shapes` (Maßstab aus dem Plan statt aus `house.ts`, Prüfschritte ohne Testwert in `house.ts`), `editing-extras` (ob Speichern einer Kalibrierung rückgängig gemacht werden kann).
- Change nach der Prüfung mit `/opsx:archive` archivieren.
