# Tasks

Großer Change, eher zwei Arbeitssitzungen. Nach jeder Gruppe ist die App lauffähig. Eine sinnvolle Pause liegt nach Gruppe 3.

## 1. Voraussetzungen

- [x] 1.1 Prüfen:
  - `floors-in-plan` ist umgesetzt und archiviert: `openspec/specs/floor-management/spec.md` existiert, `PLAN_SCHEMA_VERSION` ist 2, `src/config/legacy-floor-images.ts` und `plan-v2.json` sind vorhanden.
  - Der aktuelle Plan ist über „Exportieren“ gesichert.
  - `public/plans/eg.png`, `og.png` und `dg.png` sind außerhalb des Repos kopiert (design.md, „Migration Plan“).

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/calibration-schema.ts` und `src/lib/plan-schema.ts`: `align` in `CalibrationSchema`, `ImageIdSchema`, `UnderlaySchema` (Typ `Underlay`) und `PlanSchema` v3 mit `underlayByFloor` statt `calibrationByFloor` (Schlüssel ⊆ Etagen), `PLAN_SCHEMA_VERSION = 3` (design.md, Entscheidung 1). Tests in `plan-schema.test.ts` und `calibration.test.ts` gegen `specs/plan-data/spec.md`:
  - Vorlage ohne Bild mit unbekannten Maßen und Kalibrierung → gültig
  - Deckkraft 0,05 → ungültig, Bild ohne Maße → ungültig, nur eine Bildangabe → ungültig, Kennung kein SHA-256-Hex → ungültig
  - Ausrichtung „waagerecht“ → gültig, „schräg“ → ungültig
  - Vorlage unter „keller“ ohne Etage → ungültig

  Prüfen mit `npm test`.
- [x] 2.2 `src/lib/plan-migration.ts`: Migration `2 → 3` (design.md, Entscheidung 2). Tests in `plan-migration.test.ts`:
  - `plan-v2.json` → eg/og/dg bekommen Vorlagen ohne Bild mit ihrer Kalibrierung bzw. `null`, „Keller“ bekommt keine, `calibrationByFloor` ist entfernt.
  - Alle Formen sind unverändert (Koordinaten, Maße, Reihenfolge).
  - `plan-v1.json` läuft über 1 → 2 → 3 und besteht `PlanSchema`.
  - Eine ungültige alte Kalibrierung wird zu `calibration: null`.
  - Die Etage `og` fehlt in `floors` → keine Vorlage für `og`.

  Prüfen mit `npm test`.
- [x] 2.3 Fixture `src/lib/__fixtures__/plan-v3.json` (design.md, Entscheidung 2). Test: Die Datei besteht `PlanSchema`. Prüfen mit `npm test`.
- [x] 2.4 `src/lib/plan.ts`: `setUnderlay`, `updateUnderlay`, `setCalibration` auf `underlayByFloor` umgestellt (lehnt Etagen ohne Vorlage ab), `removeFloor` entfernt die Vorlage, `createEmptyPlan` ohne Vorlage. Tests in `plan.test.ts`:
  - Vorlage setzen, ändern, entfernen: andere Etagen und Formen per Referenz unverändert, `updatedAt` gesetzt
  - unbekannte Etage und ungültige Vorlage → dasselbe Objekt
  - Kalibrierung ersetzen behält Bild, Sichtbarkeit und Deckkraft; Keller ohne Vorlage → abgelehnt
  - leerer Plan: Version 3, keine Vorlage

  Prüfen mit `npm test`.
- [x] 2.5 `src/lib/plan-diff.ts`: `sameContent` und `resolveHistoryFocus` vergleichen `underlayByFloor` je Etage. Tests in `plan-diff.test.ts`:
  - Ausblenden der Vorlage ist kein gleicher Inhalt.
  - Der Fokus liegt danach auf dieser Etage, ohne Auswahl.

  Prüfen mit `npm test`.
- [x] 2.6 Store und Komponenten auf das neue Feld umstellen:
  - `saveCalibration`, `draftFor`, `StatusBar`, `FloorCanvas` und `ImportDialog` lesen bzw. schreiben `underlayByFloor[id].calibration`.
  - Die PNG-Zuordnung über `legacy-floor-images.ts` bleibt vorerst.
  - `app-store.test.ts` und `plan-storage.test.ts` angepasst: Ein gespeicherter Plan der Version 2 wird beim Start auf Version 3 umgewandelt.

  Prüfen mit `npm test`, `npm run build` und im Browser (manuell): Nach dem Neuladen zeigt das Erdgeschoss seinen Scan, seine Möbel und „Maßstab: …“ wie vorher.

## 3. Zeichenfläche in cm

- [x] 3.1 `src/lib/underlay.ts` mit `underlayRotationDeg`, `imagePointToCm`, `cmToImagePoint`, `underlayBoundsCm`, `underlayGroupAttrs`, `referencedImageIds` (design.md, Entscheidung 3). Tests in `underlay.test.ts`:
  - **ohne Kalibrierung**: 1 px = 1 cm
  - **0,5 px/cm ohne Ausrichtung**: Bildpixel (100, 50) → (200 cm, 100 cm), Bildpixel (0, 0) → (0 cm, 0 cm)
  - **Drehung**: Strecke (100, 100) → (1100, 120) waagerecht → etwa −1,15°, danach gleiche y-Werte in cm; senkrechte Strecke waagerecht → ±90°; fast senkrechte Strecke senkrecht → kleine Drehung; Drehung immer in (−90°, 90°]
  - Rundreise `cmToImagePoint(imagePointToCm(p))` = p
  - Bounds eines um 90° gedrehten Bilds: Breite und Höhe vertauscht, Mitte unverändert
  - `referencedImageIds` ohne `null` und ohne Duplikate

  Prüfen mit `npm test`.
- [x] 3.2 `src/lib/viewport.ts`: `fitViewport(bounds, view)`, `screenToWorld`, `worldToScreen`, `visibleRectCm`. Neu `src/lib/content-bounds.ts` mit `floorContentBounds` (design.md, Entscheidung 4). Tests in `viewport.test.ts` und `content-bounds.test.ts`:
  - Einpassen eines Rechtecks mit Versatz zentriert es
  - leere Etage → 0–1 000 cm
  - Schrank bei x = 1 500 cm außerhalb einer 1 240 cm breiten Vorlage ist enthalten
  - gedrehte Form zählt mit ihrem gedrehten Umriss
  - ausgeblendete Vorlage zählt nicht

  Prüfen mit `npm test`.
- [x] 3.3 `src/lib/grid.ts` mit `gridLines` plus `grid.test.ts`:
  - Bereich −50 … 250 cm → Linien bei 0, 100, 200
  - Schritt 100
  - leerer Bereich → keine Linien

  Prüfen mit `npm test`.
- [x] 3.4 Canvas in cm umbauen:
  - `FloorCanvas`: Viewport in cm, Einpassen über `floorContentBounds`, Einfügen überall.
  - `UnderlayLayer`: Gruppe mit `underlayGroupAttrs`, vorerst mit dem PNG aus `legacy-floor-images.ts`, Deckkraft und Sichtbar beachten.
  - `GridLayer`.
  - `ShapesLayer`, `ShapeNode`, `SelectionTransformer` und `label-transform.ts` ohne `pxPerCm`.
  - `CalibrationOverlay` in der Vorlagen-Gruppe mit `getRelativePointerPosition`, Marker gegenskaliert und gegengedreht.
  - `units.ts` samt Test entfernen, falls ungenutzt.

  Prüfen mit `npm test`, `npm run build` und im Browser (manuell) gegen `specs/floor-plan-view/spec.md` und `specs/shape-editing/spec.md`:
  - Erdgeschoss: Möbel liegen exakt wie vor dem Umbau auf dem Scan.
  - Bei 100 % ist ein Rechteck von 100 × 60 cm 100 × 60 Bildschirmpixel groß.
  - „Einpassen“ und `0` zeigen Scan und Möbel.
  - Mausrad-Zoom bleibt unter dem Zeiger, die Randstärke bleibt beim Zoomen gleich.
  - Ein Klick neben den Scan fügt ein Rechteck ein.
  - „Keller“ zeigt das Raster mit kräftigeren Achsen, 0–10 m eingepasst.
  - Kalibrierpunkte setzen und ziehen funktioniert bei 200 % wie bisher.
- [x] 3.5 Sperre ohne Kalibrierung entfernen: `isToolEnabled` nur noch Kalibrier-Modus, `isFloorCalibrated` und der Tooltip-Zweig in `tools.ts` entfernen, Hinweis „Möbel … erst nach der Kalibrierung“ entfernen. Tests in `tools.test.ts` und `app-store.test.ts`:
  - Werkzeuge auf einer Etage ohne Vorlage frei
  - im Kalibrier-Modus alle gesperrt, auch „Tür“ per T

  Prüfen mit `npm test` und im Browser (manuell): Im „Keller“ lässt sich eine L-Form einfügen.
- [x] 3.6 `docs/design/README.md`: Die Zeile „Nicht kalibrierte Etage“ wird durch „Zeichenfläche in cm“ ersetzt:
  - 100 % = 1 px je cm
  - Einpassen auf den Inhalt, leer 0–10 m
  - 1-m-Raster ohne sichtbare Vorlage
  - Möbel ohne Kalibrierung

  Prüfen, dass die Zeile zu design.md passt.

## 4. Vorlagenbilder

- [x] 4.1 `src/lib/image-data.ts` mit `MAX_IMAGE_BYTES`, `sniffImageType`, `bytesToBase64`, `base64ToBytes`, `toDataUrl`, `parseDataUrl`, `imageIdFor` plus `image-data.test.ts`:
  - PNG-, JPEG- und WebP-Kopfbytes erkannt, PDF und Text nicht
  - Base64-Rundreise
  - Data-URL-Rundreise
  - `data:text/plain…`, fehlendes `;base64` und kaputtes Base64 → `null`
  - SHA-256 von „abc“ = `ba7816bf…15ad`, Länge 64

  Prüfen mit `npm test`.
- [x] 4.2 `src/lib/underlay.ts`: `underlayWithImage` und `needsCalibrationReset` (design.md, Entscheidung 7). Tests in `underlay.test.ts`:
  - keine Vorlage → neu, sichtbar, Deckkraft 1, ohne Kalibrierung
  - Vorlage ohne Bild mit Kalibrierung → Kalibrierung bleibt, Maße gesetzt
  - Bild im Browser fehlt (Parameter) → Kalibrierung bleibt
  - gleiche Maße → bleibt
  - andere Maße → `needsCalibrationReset`; mit `resetCalibration` → `calibration: null`
  - Sichtbar und Deckkraft bleiben in allen Fällen

  Prüfen mit `npm test`.
- [x] 4.3 `src/storage/image-db.ts` und `src/storage/image-cache.ts` (design.md, Entscheidung 6). Store: `imageStoreStatus` und `imageAvailability`. Prüfen mit `npm run build` und im Browser (manuell, DevTools → Application → IndexedDB): Nach einem Upload (4.5) liegt ein Eintrag mit 64-stelliger Kennung unter `raumplaner/images`.
- [x] 4.4 Store-Aktionen `applyUnderlayImage`, `removeUnderlay`, `setUnderlayVisible` und `setUnderlayOpacity`, `canCalibrate`. Nach `applyUnderlayImage` ohne Kalibrierung startet der Kalibrier-Modus und der Viewport der Etage wird verworfen. Tests in `app-store.test.ts`:
  - je Aktion ein Verlaufsschritt; Rückgängig stellt Bild-Kennung und Kalibrierung wieder her
  - Kalibrier-Modus startet nach dem ersten Upload, nicht beim Ersetzen mit behaltener Kalibrierung
  - `canCalibrate` falsch ohne Vorlage und bei `imageAvailability` „missing“
  - Etagenwechsel im Kalibrier-Modus auf eine Etage ohne Bild beendet den Modus

  Prüfen mit `npm test`.
- [x] 4.5 Oberfläche:
  - `read-image.ts`, `useUnderlayImage`, `useUnderlayUpload`
  - `UnderlaySection` im `PropertiesPanel` ohne Auswahl, `MissingImageHint`
  - `UnderlayLayer` liest jetzt das Bild aus dem Cache bzw. IndexedDB
  - Taste `B` in `useShapeShortcuts`
  - `ToolBar` „Vorlage kalibrieren“ mit Sperre und Tooltip
  - `StatusBar` mit Vorlagenstatus und `imageStoreStatus`
  - `legacy-floor-images.ts` samt Test entfernen

  Prüfen im Browser (manuell) gegen `specs/floor-underlay/spec.md` und `specs/workspace-layout/spec.md`:
  - Nach dem Start zeigen EG/OG/DG „Vorlage fehlt – Bild laden“ und die Statusleiste „Vorlage fehlt“. Möbel sind sichtbar und bedienbar.
  - „Bild laden“ mit `eg.png` → Scan und Möbel liegen wie vorher, ohne Rückfrage, ohne Kalibrier-Modus. Statusleiste „Maßstab: …“. Für OG und DG wiederholen.
  - Keller: „Bild hochladen“ → Bild bei 1 px = 1 cm, Kalibrier-Modus startet. Beenden ohne Speichern → „Vorlage nicht kalibriert“.
  - `plan.pdf` → Typ-Hinweis. Bild mit mehr als 20 MB → Größen-Hinweis.
  - Ein Bild mit anderen Maßen ersetzen → Rückfrage. „Abbrechen“ lässt alles unverändert, Bestätigen setzt die Kalibrierung zurück.
  - `B` und „Sichtbar“ blenden aus, das Raster erscheint. Deckkraft 40 % wirkt nur auf die Vorlage. Jeweils Strg+Z.
  - „Vorlage entfernen“ → Raster, Möbel bleiben; Strg+Z holt die Vorlage zurück.
  - Neuladen: Bilder, Sichtbarkeit und Deckkraft bleiben.
  - Firefox im privaten Fenster: Upload sichtbar, Statusleiste „Nicht gespeichert“ mit Tooltip zu Vorlagenbildern.
- [x] 4.6 Aufräumen beim Start in `src/main.tsx` (design.md, Entscheidung 6). Prüfen im Browser (manuell):
  - Bild ersetzen, dann Strg+Z → altes Bild wieder da.
  - Bild ersetzen und neu laden → in IndexedDB liegt nur noch das neue Bild.
  - Bei einem unlesbaren gespeicherten Plan (Hinweisleiste) wird nichts gelöscht.
- [x] 4.7 `docs/design/README.md`: neue Zeile „Vorlage“:
  - Abschnitt im Panel ohne Auswahl, Bedienelemente
  - Formate und Grenze 20 MB
  - Kalibrier-Modus nach dem ersten Upload
  - Regel für das Behalten der Kalibrierung
  - „Vorlage fehlt“, Taste `B`, Speicherung in IndexedDB und Aufräumen beim Start

  Zeile „Speichern“ um IndexedDB ergänzen. Prüfen, dass beides zu design.md passt.

## 5. Kalibrierung mit Ausrichtung

- [x] 5.1 `CalibrationDraft.align`, Vorbelegung aus der gespeicherten Kalibrierung, `setCalibrationAlign`. `saveCalibration` übernimmt `align` und verwirft den Viewport der Etage. `formatDegrees` in `src/lib/format.ts`. Tests in `app-store.test.ts` und `format.test.ts`:
  - `align` wird gespeichert und beim erneuten Start vorbelegt.
  - Beenden ohne Speichern verwirft die Ausrichtung.
  - Möbel-Koordinaten bleiben beim Speichern unverändert.
  - `formatDegrees(-1.146)` = „−1,1°“, `formatDegrees(0)` = „0,0°“.

  Prüfen mit `npm test`.
- [x] 5.2 `CalibrationPanel`: Gruppe „Ausrichtung“ (Keine/waagerecht/senkrecht), Zeile „Drehung …°“, neuer Fußtext; `CalibrationBanner` unverändert. Prüfen im Browser (manuell) gegen `specs/floor-calibration/spec.md`:
  - Schiefe Strecke + „waagerecht“ → Drehung angezeigt, nach dem Speichern liegt die Wand waagerecht und die Ansicht ist neu eingepasst.
  - Den um 90° gedrehten EG-Scan an einer senkrechten Wand mit „waagerecht“ ausrichten → Scan steht quer.
  - „Keine“ → keine Drehung.
  - Kalibrierpunkte lassen sich auf dem gedrehten Bild setzen und ziehen.
  - Die Beschriftungen bleiben aufrecht.
- [x] 5.3 `docs/design/README.md`, Zeile „Kalibrierung“:
  - „Vorlage kalibrieren“, nur mit Bild
  - Ausrichtung waagerecht/senkrecht mit kleinster Drehung um die Bildmitte
  - Neu-Einpassen nach dem Speichern
  - Hinweis „zuerst ausrichten, dann einrichten“

  Prüfen, dass die Zeile zu design.md passt.

## 6. Export und Import mit Bildern

- [x] 6.1 `src/lib/plan-export.ts`: `buildExportFile(plan, images)` und `serializeExport` (design.md, Entscheidung 9). Tests in `plan-export.test.ts`:
  - `images` steht als letzter Schlüssel.
  - Ein Bild, das zwei Etagen nutzen, steht nur einmal in der Datei.
  - Eine Vorlage ohne vorhandenes Bild wird mit `imageId: null` und Kalibrierung exportiert.
  - Formatversion 3 und Etagen sind enthalten, Ansichtszustand nicht.

  Prüfen mit `npm test`.
- [x] 6.2 `src/lib/plan-import.ts` und `src/lib/shape-issues.ts`: Schritte „Vorlagen“ und „Bilder“, `underlayIssues`, `pendingImages`, `describeUnderlayIssue`, `applyImageCheck`, `MAX_IMPORT_BYTES = 50 MB`. Tests in `plan-import.test.ts` und `shape-issues.test.ts` gegen `specs/plan-import/spec.md`:
  - Rundreise mit Bild, ausgeblendeter Vorlage, Deckkraft 0,4 und `align` → keine Warnung, gleicher Plan
  - Bild fehlt in `images` → `imageId: null`, „Vorlagenbild fehlt“, Kalibrierung bleibt
  - unlesbare Data-URL → „Vorlagenbild unlesbar“
  - Maßstab 0 in der Kalibrierung → Vorlage ohne Kalibrierung, Grund nennt den Maßstab
  - Deckkraft 3 → Vorlage nicht übernommen, „Deckkraft ungültig“
  - Vorlage unter „kg“ → „Etage unbekannt“
  - Datei ohne Vorlagen → keine Warnung
  - `plan-v2.json` → Vorlagen ohne Bild für eg/og/dg ohne Warnung „Vorlagenbild fehlt“
  - `applyImageCheck`: echte Maße übernommen, abweichende Kennung umgeschrieben, Dekodierfehler → „unlesbar“, `hasWarnings` neu berechnet

  Prüfen mit `npm test`.
- [x] 6.3 Oberfläche:
  - `download.ts` `exportPlan` async mit Bildern
  - `PlanFileActions`: Bildprüfung vor dem Dialog, beim Bestätigen zuerst `storeImage`, dann `replacePlan`, Größengrenze 50 MB
  - `ImportDialog`: Zeile „Vorlage für n von m Etagen“, Problemzeile „Vorlagen nicht oder nur teilweise übernommen“, Ersetzen-Warnung bei Formen oder Vorlagen

  Prüfen im Browser (manuell) gegen `specs/plan-export/spec.md` und `specs/plan-import/spec.md`:
  - Export mit drei Scans enthält drei Data-URLs, die Datei ist im Editor lesbar.
  - Nach dem Löschen der Website-Daten zeigt der Re-Import derselben Datei alle Scans samt Kalibrierung, auch nach dem Neuladen.
  - Datei mit gelöschtem Bildeintrag → „Obergeschoss: Vorlagenbild fehlt“, „Trotzdem importieren“, danach „Vorlage fehlt – Bild laden“.
  - Datei über 50 MB → Fehlerdialog.
  - Alte Sicherung der Version 1 bzw. 2 → wie in den Szenarien.
  - Strg+Z nach dem Import stellt den vorherigen Plan samt Bildern her.
- [x] 6.4 `docs/design/README.md`, Zeile „Export/Import“: Bilder als Base64 unter `images`, fehlende Bilder als `imageId: null`, Grenze 50 MB, Vorlagen-Zeile im Prüf-Dialog. Prüfen, dass die Zeile zu design.md passt.

## 7. Bilder aus dem Repo entfernen

- [x] 7.1 Nachdem EG, OG und DG im Browser ihre Bilder haben (4.5): `public/plans/` löschen, keine Verweise mehr. Prüfen:
  - `grep -r "plans/" src` findet nichts.
  - `npm run build`: `dist/` enthält keine PNGs der Grundrisse.
  - Im Browser zeigen alle drei Etagen weiter ihre Scans.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Deltas unter `specs/`. `npm run lint` ohne neue Warnungen.
- [x] 8.2 `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Change nach der Prüfung mit `/opsx:archive` archivieren, nach `floors-in-plan`.
- `floor-rooms` ergänzt seine Räume in `floorContentBounds`, legt die Raum-Ebene zwischen Raster und Formen und bringt die Migration 3 → 4 mit `plan-v3.json` mit.
