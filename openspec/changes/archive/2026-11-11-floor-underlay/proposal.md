# Proposal

## Why

Die Grundrisse sind heute drei feste, eingescannte PNGs im Repo, und die ganze Zeichenfläche rechnet in deren Bildpixeln. Möbel erscheinen erst, wenn die Etage kalibriert ist. Seit `floors-in-plan` kann man Etagen anlegen, doch neue Etagen haben kein Bild und sind damit unbrauchbar. Dieser Change dreht das Verhältnis um:

- Die Zeichenfläche arbeitet in cm.
- Jede Etage ist ohne Bild sofort benutzbar.
- Ein Scan ist nur noch eine optionale Vorlage, die man hochlädt, kalibriert, gerade ausrichtet und ausblendet.

So lassen sich Räume in `floor-rooms` über dem Scan nachzeichnen, ohne dass dessen Störungen beim Planen bleiben.

## What Changes

- **Zeichenfläche in cm**:
  - Die Ansicht rechnet in cm, 100 % Zoom entspricht 1 Bildschirmpixel je cm.
  - „Einpassen“ zeigt alles, was auf der Etage zu sehen ist (Vorlage und Möbel). Bei einer leeren Etage zeigt es einen Bereich von 10 × 10 m.
  - Ohne sichtbare Vorlage zeigt die Zeichenfläche ein 1-m-Raster.
- **BREAKING – Möbel ohne Kalibrierung**: Form-Werkzeuge und Möbel brauchen keine Kalibrierung mehr. Sperre, Tooltip „Etage zuerst kalibrieren“ und der Hinweis „Möbel … erst nach der Kalibrierung“ entfallen. Formen lassen sich überall auf der Zeichenfläche einfügen, nicht nur auf dem Bild.
- **Vorlage je Etage**: Ist keine Form ausgewählt, zeigt das Eigenschaften-Panel den Abschnitt „Vorlage“ mit:
  - „Bild hochladen“ bzw. „Bild ersetzen“ (PNG, JPEG, WebP, höchstens 20 MB)
  - „Vorlage entfernen“
  - Schalter „Sichtbar“, Taste `B`
  - Regler „Deckkraft“ (10–100 %)
  - „Vorlage kalibrieren“ sowie Maßstab und Ausrichtung
- **Erstes Hochladen**:
  - Ein neues Bild liegt unkalibriert mit 1 Bildpixel = 1 cm.
  - Der Kalibrier-Modus startet sofort.
  - Die Statusleiste zeigt „Vorlage nicht kalibriert“, bis gespeichert ist.
- **Kalibrierung mit Ausrichtung**:
  - Im Kalibrier-Panel gibt es „Strecke ist waagerecht“, „… senkrecht“ und „keine Ausrichtung“.
  - Die Vorlage wird dann so um ihre Bildmitte gedreht, dass die Messstrecke genau waagerecht bzw. senkrecht liegt. So wird ein schief eingescannter oder um 90° gedrehter Plan gerade.
  - Nach dem Speichern wird die Ansicht neu eingepasst.
  - „Etage kalibrieren“ heißt jetzt „Vorlage kalibrieren“ und geht nur mit Bild.
- **Bilder im Browser**: Vorlagenbilder liegen in IndexedDB, nicht im `localStorage`. Der Plan verweist nur auf sie. Nicht mehr verwendete Bilder werden beim Start entfernt. Lässt sich ein Bild nicht speichern, zeigt die Statusleiste „Nicht gespeichert“ mit Grund.
- **Vorlage fehlt**: Verweist eine Vorlage auf ein Bild, das nicht da ist, zeigt die Zeichenfläche „Vorlage fehlt – Bild laden“ mit einer Schaltfläche zum Hochladen. Kalibrierung und Ausrichtung bleiben erhalten. Lädt man ein Bild mit denselben Pixelmaßen hoch (z. B. erneut `eg.png`), gilt die Kalibrierung sofort wieder. Bei anderen Maßen wird nachgefragt und die Kalibrierung zurückgesetzt.
- **BREAKING – Formatversion 3**:
  - `calibrationByFloor` wird zu `underlayByFloor` (Bild-Verweis, Bildgröße, Kalibrierung, Sichtbarkeit, Deckkraft).
  - Migration 2 → 3: Die Etagen `eg`, `og` und `dg` bekommen eine Vorlage ohne Bild mit ihrer bisherigen Kalibrierung. Möbelkoordinaten ändern sich nicht.
- **Export und Import mit Bildern**:
  - Die Exportdatei enthält zusätzlich die verwendeten Vorlagenbilder als Base64-Data-URL.
  - Die Importgrenze steigt von 5 MB auf 50 MB.
  - Der Prüf-Dialog zeigt je Etage, ob eine Vorlage mit Bild und Kalibrierung übernommen wird, und listet fehlende oder unlesbare Bilder auf.
- **Entfernt**: `public/plans/eg.png`, `og.png`, `dg.png` und die Übergangszuordnung `src/config/legacy-floor-images.ts`. Die drei PNGs lädt der Nutzer einmal selbst hoch.
- **Rückgängig**: Hochladen, Ersetzen, Entfernen, Sichtbar, Deckkraft und Kalibrierung sind je ein Schritt.

## Nicht im Umfang

- Räume, Türen und Fenster zeichnen (`floor-rooms`, `room-openings`)
- Freies Drehen, Verschieben oder Zuschneiden der Vorlage mit der Maus. Gedreht wird nur über die Ausrichtung der Kalibrierstrecke, die Lage ergibt sich aus der Kalibrierung.
- Bilder beim Hochladen verkleinern oder umrechnen, PDF als Vorlage
- Mehrere Vorlagen je Etage, Vorlagen zwischen Etagen kopieren (gleiche Bilder werden aber nur einmal gespeichert)
- Ein eigenes Kalibrieren der Etage ohne Vorlage (nicht nötig, die cm-Welt hat keinen Maßstab)
- Raster ein-/ausschalten, Rasterweite einstellen (kommt mit `settings-menu`), Einrasten von Formen am Raster
- ZIP-Export, Export ohne Bilder

## Capabilities

### New Capabilities
- `floor-underlay`: Vorlage einer Etage: Bild hochladen, ersetzen und entfernen, sichtbar und Deckkraft, Lage in der cm-Welt, fehlendes Bild, Speicherung der Bilder im Browser und Aufräumen, Raster ohne Vorlage.

### Modified Capabilities
- `plan-data`: Formatversion 3, Vorlage je Etage statt Kalibrierung je Etage, Ausrichtung in der Kalibrierung, Kalibrierung setzen nur in einer Vorlage, Änderungszeitpunkt bei Vorlagen-Änderungen.
- `plan-persistence`: Der Speicherstatus berücksichtigt das Speichern der Vorlagenbilder.
- `plan-import`: Importgrenze 50 MB, Vorlagen und Bilder aus der Datei, Dateien der Version 2, Prüfergebnis und Ersetzen-Warnung nennen Vorlagen, Rundreise mit Bildern.
- `plan-export`: Die Exportdatei enthält Vorlagen und Vorlagenbilder.
- `floor-plan-view`: Maßstab der Ansicht in cm, Einpassen auf den Inhalt. „Etage ohne Grundriss“ und „Fehlendes Grundrissbild“ entfallen (ersetzt durch Raster bzw. „Vorlage fehlt“).
- `floor-calibration`: „Vorlage kalibrieren“ nur mit Bild, Ausrichtung der Strecke, Speichern in die Vorlage samt Einpassen.
- `shape-editing`: Einfügen überall auf der Zeichenfläche, Darstellung in cm, keine Sperre ohne Kalibrierung, alle Form-Werkzeuge im Kalibrier-Modus gesperrt.
- `workspace-layout`: Werkzeugleiste mit „Vorlage kalibrieren“, Panel ohne Auswahl mit Abschnitt „Vorlage“, Statusleiste mit Vorlagenstatus.
- `floor-management`: Eine neue Etage hat keine Vorlage; Löschen und Rückgängig betreffen die Vorlage samt Kalibrierung, die Rückfrage nennt „mit Vorlage“.
- `edit-history`: Vorlagen-Änderungen sind Schritte. Rückgängig wechselt auch bei Vorlagen-Änderungen zur betroffenen Etage.

## Impact

- **Voraussetzung**: `editing-extras` und `floors-in-plan` sind umgesetzt und archiviert. Dieser Change ändert Anforderungen, die `floors-in-plan` hinzufügt („Etage ohne Grundriss“, „Kalibrieren nur mit Grundriss“), und setzt dessen Formatversion 2, `plan-v2.json` und das Laden mit Migration voraus.
- **Umfang**: Das ist ein großer Change, eher zwei Arbeitssitzungen. Die Aufgaben sind so gruppiert, dass die App nach jeder Gruppe lauffähig ist. Eine Pause ist zwischen Gruppe 3 (cm-Welt) und Gruppe 4 (Bilder) sinnvoll.
- **Geändert**:
  - `src/lib/plan-schema.ts`, `calibration-schema.ts`, `calibration.ts`, `plan.ts`, `plan-migration.ts`, `plan-import.ts`, `plan-export.ts`, `plan-diff.ts`, `viewport.ts`, `units.ts`
  - `src/store/app-store.ts`
  - `FloorCanvas`, `ShapesLayer`, `ShapeNode`, `SelectionTransformer`, `label-transform.ts`, `CalibrationOverlay`, `CalibrationPanel`, `CalibrationBanner`, `ToolBar`/`tools.ts`, `PropertiesPanel`, `StatusBar`, `PlanFileActions`, `ImportDialog`, `download.ts`, `src/main.tsx`
  - zugehörige Tests, `docs/design/README.md`
- **Neu**:
  - In `src/lib/` (jeweils mit Vitest-Test): `underlay.ts` (Lage und Drehung der Vorlage, Umrechnung Bild ↔ cm), `content-bounds.ts` (Einpassen), `grid.ts` (Rasterlinien), `image-data.ts` (Data-URL, Base64, SHA-256-Kennung, Bildtyp)
  - `src/storage/image-db.ts` (IndexedDB) und `src/storage/image-cache.ts`
  - `src/components/underlay/` (`UnderlaySection`, `UnderlayLayer`, `MissingImageHint`, `GridLayer`, `useUnderlayImage`, `read-image.ts`)
  - Fixture `src/lib/__fixtures__/plan-v3.json`
- **Entfernt**: `public/plans/*.png`, `src/config/legacy-floor-images.ts` samt Test
- **Abhängigkeiten**: keine neuen. IndexedDB, `crypto.subtle` und `createImageBitmap` sind im Browser vorhanden, `crypto.subtle` auch in Node für die Tests.
- **Datenmodell**: `schemaVersion` 2 → 3. `calibrationByFloor` entfällt, neu ist `underlayByFloor`. `Calibration` bekommt das optionale Feld `align`. Die Exportdatei ist künftig Plan-JSON plus `images`. Der Browser-Speicher (`raumplaner.plan`) bleibt reines Plan-JSON ohne Bilder.
