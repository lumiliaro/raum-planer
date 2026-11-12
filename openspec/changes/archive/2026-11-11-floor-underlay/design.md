# Design

## Context

- **Ausgangslage nach `floors-in-plan`** (Voraussetzung, siehe dessen design.md):
  - `PlanSchema` v2 mit `floors`, `calibrationByFloor: partialRecord(FloorId, Calibration)` und `shapesByFloor`.
  - Migration beim Laden mit Sicherung unter `raumplaner.plan.pre-migration`. Fixture `plan-v2.json`.
  - `src/config/legacy-floor-images.ts` ordnet `eg`/`og`/`dg` den PNGs in `public/plans/` zu. Etagen ohne Bild zeigen einen Hinweis und sind nicht kalibrierbar.
- **Zeichenfläche heute** (`FloorCanvas`):
  - Die Stage rechnet in **Bildpixeln**: `Viewport.scale` ist Bildschirmpixel je Bildpixel, `fitViewport(imageSize, view)`.
  - Formen werden in `ShapeNode`, `SelectionTransformer` und `label-transform.ts` über `cmToPx(…, pxPerCm)` umgerechnet.
  - `ShapesLayer` wird nur bei kalibrierter Etage gerendert, Form-Werkzeuge sind über `isToolEnabled`/`isFloorCalibrated` gesperrt.
  - Klicks außerhalb des Bilds (`pointerOnImage`) fügen nichts ein.
- **Kalibrierung**:
  - `CalibrationDraft { p1, p2, lengthText }` im Store, `computeCalibration` in `src/lib/calibration.ts`.
  - `CalibrationOverlay` zeichnet Punkte in Bildpixeln mit `1 / scale` gegenskaliert.
- **Export/Import**:
  - `serializePlan(plan)` ist das reine Plan-JSON.
  - `analyzePlanFile(text, …)` ist synchron und rein. `MAX_IMPORT_BYTES = 5 MB`.
  - `PlanFileActions` liest die Datei und zeigt `ImportDialog`.
- **Verlauf**: `zundo` speichert `{ plan }`. `sameContent` und `resolveHistoryFocus` (`plan-diff.ts`) vergleichen Formen und Kalibrierung je Etage per Referenz.
- **Tests** laufen in Vitest mit `environment: "node"`, ohne DOM. IndexedDB und `createImageBitmap` gibt es dort nicht, `crypto.subtle` schon.
- Anforderungen: alle Deltas unter `specs/`, vor allem `specs/floor-underlay/spec.md`.

## Goals / Non-Goals

**Goals:**
- Eine einzige Welt-Einheit: Stage, Formen, Raster und später Räume arbeiten in cm. Pixel gibt es nur noch innerhalb der Vorlage.
- Die Geometrie der Vorlage (Maßstab, Drehung um die Bildmitte, Umrechnung Bild ↔ cm) ist eine reine, getestete Funktion. Canvas und Kalibrier-Overlay nutzen dieselbe Transformation.
- Bilder sind vom Plan getrennt: Der Plan bleibt klein (`localStorage`), Bilder liegen in IndexedDB und werden nur beim Export bzw. Import als Base64 bewegt.
- Für bestehende Pläne ändert die Umstellung keine Möbelkoordinate.

**Non-Goals:**
- Kein Web Worker für Base64 und Hashing. Ein Haus hat wenige Bilder von einigen MB.
- Keine Bildbearbeitung (Zuschneiden, Kontrast, Entfernen von Bemaßungen).
- Kein Testgerüst für IndexedDB (`fake-indexeddb` wäre eine neue Abhängigkeit). Die IndexedDB-Hülle ist dünn und wird im Browser geprüft.

## Decisions

### 1. Datenmodell Version 3

```ts
export const ImageIdSchema = z.string().regex(/^[0-9a-f]{64}$/); // SHA-256 (hex) der Bilddatei

export const CalibrationSchema = z.object({
    p1: ImagePointSchema, p2: ImagePointSchema,
    realLengthCm: z.number().positive(),
    pxPerCm: z.number().positive(),
    align: z.enum(["horizontal", "vertical"]).optional(),   // neu
});

export const UnderlaySchema = z.object({
    imageId: ImageIdSchema.nullable(),          // null = kein Bild („Vorlage fehlt“)
    imageWidthPx: z.number().int().positive().nullable(),
    imageHeightPx: z.number().int().positive().nullable(),
    calibration: CalibrationSchema.nullable(),
    visible: z.boolean(),
    opacity: z.number().min(0.1).max(1),
}).refine(bothOrNoDims).refine((u) => u.imageId === null || u.imageWidthPx !== null);

PlanSchema v3 = v2 ohne calibrationByFloor, plus
    underlayByFloor: z.partialRecord(FloorIdSchema, UnderlaySchema)
// checkFloorConsistency: Schlüssel von underlayByFloor ⊆ Etagen-IDs
```

- **`schemaVersion` 2 → 3.** `calibrationByFloor` entfällt, `underlayByFloor` ist neu, `Calibration.align` ist optional neu.
- **Bildmaße im Plan**: Sie werden für die Drehung um die Bildmitte, das Einpassen und die Regel „gleiche Maße behalten die Kalibrierung“ gebraucht. Das gilt auch, solange das Bild noch lädt oder fehlt.
- **Bild-Kennung = SHA-256 der Datei**: Dasselbe Bild auf zwei Etagen oder ein erneuter Import erzeugt keinen zweiten Eintrag. Kollisionen sind praktisch ausgeschlossen.
  - Alternative: UUID je Upload. Verworfen, weil dann jeder Import Duplikate im Speicher erzeugt und die Prüfung „ist dieses Bild schon da“ fehlt.
- **Drehung wird nicht gespeichert, sondern aus `p1`, `p2` und `align` berechnet.** Es gibt eine einzige Quelle; eine gespeicherte Drehung könnte den Punkten widersprechen.
- **Sichtbar und Deckkraft liegen im Plan**, nicht in den UI-Einstellungen. Sie gehören zum Arbeitsstand einer Etage (Scan an, halbtransparent zum Nachzeichnen) und sollen Neuladen und Export überstehen.
- **Der Browser-Speicher (`raumplaner.plan`) bleibt reines Plan-JSON ohne Bilder**, auch ohne `images`-Feld.

### 2. Migration 2 → 3

`PLAN_MIGRATIONS[2]`, auf Rohdaten:

```ts
(data) => {
  const cal = isRecord(data.calibrationByFloor) ? data.calibrationByFloor : {};
  const underlayByFloor = {};
  for (const id of ["eg", "og", "dg"]) if (floorIds(data).includes(id))
    underlayByFloor[id] = { imageId: null, imageWidthPx: null, imageHeightPx: null,
                            calibration: cal[id] ?? null, visible: true, opacity: 1 };
  const { calibrationByFloor, ...rest } = data;
  return { ...rest, underlayByFloor };
}
```

- Nur die drei alten Etagen bekommen eine Vorlage, und nur wenn sie in `floors` stehen. Eine selbst angelegte Etage hatte nie ein Bild.
- Eine ungültige alte Kalibrierung wird roh übernommen. Die Prüfung danach (Import: Entscheidung 9; Laden: `PlanSchema`) behandelt sie. Beim Laden würde das den ganzen Plan als unlesbar sichern. Deshalb setzt die Migration `calibration: null`, wenn `CalibrationSchema.safeParse` scheitert. Das ist die einzige Stelle, an der die Migration ein Schema nutzt, und das aktuelle `CalibrationSchema` ist dafür eine Obermenge des alten.
- Ohne `align` bleibt Bildpixel (0, 0) bei (0 cm, 0 cm), genau wie heute bei `cm = px / pxPerCm`. Möbel liegen nach dem Hochladen desselben PNGs exakt wie vorher.
- Fixtures:
  - `plan-v2.json` (von `floors-in-plan`) wird mit einem Test bis Version 3 importiert.
  - Neu ist `src/lib/__fixtures__/plan-v3.json`: migriertes `plan-v2.json` plus eine Vorlage mit Bild-Kennung, Maßen, Kalibrierung mit `align` und Deckkraft 0,4 auf „Keller“. Sie ist für die nächste Migration in `floor-rooms` gedacht.

### 3. Geometrie der Vorlage (`src/lib/underlay.ts`)

```
k = calibration?.pxPerCm ?? 1        θ = underlayRotationDeg(calibration)
c = (imageWidthPx / 2, imageHeightPx / 2)     // Bildmitte in px
cm(p) = c / k + R(θ) · (p − c) / k           // θ = 0  →  cm(p) = p / k
```

| Funktion | Zweck |
| --- | --- |
| `underlayRotationDeg(cal)` | `a = atan2(dy, dx)` der Strecke P1→P2. Waagerecht: `θ = −a`, senkrecht: `θ = 90° − a`, jeweils auf (−90°, 90°] normiert (kleinste Drehung). Ohne `align` oder Kalibrierung: 0 |
| `imagePointToCm(p, underlay)` / `cmToImagePoint(p, underlay)` | Umrechnung nach obiger Formel und zurück |
| `underlayBoundsCm(underlay)` | achsparalleles Rechteck der gedrehten Bildecken in cm. Ohne Maße `null` |
| `underlayGroupAttrs(underlay)` | Konva-Gruppe: `x = c.x / k`, `y = c.y / k`, `offsetX = c.x`, `offsetY = c.y`, `scaleX = scaleY = 1 / k`, `rotation = θ` |
| `referencedImageIds(plan)` | alle `imageId` ≠ null in `underlayByFloor` |
| `underlayWithImage(current, image)` | Vorlage nach dem Hochladen/Ersetzen (Entscheidung 7), plus `needsCalibrationReset(current, image)` |

- **Konva**: Bild und Kalibrier-Overlay liegen in einer gemeinsamen Gruppe mit `underlayGroupAttrs`. Klicks im Kalibrier-Modus lesen `group.getRelativePointerPosition()` und liefern damit direkt Bildpixel, auch bei Drehung. Marker und Beschriftungen im Overlay werden mit `k / vp.scale` gegenskaliert und mit `−θ` gegengedreht, damit sie aufrecht und gleich groß bleiben.
- **Pivot Bildmitte**: Ein gedrehter Scan bleibt ungefähr an seiner Stelle. Bei einem Pivot (0, 0) würde er beim Drehen aus dem Bild wandern.
  - Alternative: Pivot P1. Verworfen, weil sich das Bild bei jedem Verschieben von P1 mitbewegen würde.
- **Während des Kalibrier-Modus** gilt die gespeicherte Transformation, nicht die des Entwurfs. Das Bild springt also nicht, während man Punkte zieht. Nach dem Speichern wird der Viewport der Etage verworfen, sodass beim nächsten Rendern neu eingepasst wird (Spec „Kalibrierung speichern“).

### 4. Zeichenfläche in cm

- `Viewport` behält die Form `{ scale, x, y }`, bedeutet aber: Bildschirmpixel je cm und Bildschirmlage von (0 cm, 0 cm). `MIN_SCALE`/`MAX_SCALE` bleiben 0,1/8 (10–800 %).
- `viewport.ts`:
  - `fitViewport(bounds: RectCm, view)` statt `(imageSize, view)`.
  - `screenToImage` wird zu `screenToWorld`, `imageToScreen` zu `worldToScreen`.
  - Neu: `visibleRectCm(vp, view)` für das Raster.
- `src/lib/content-bounds.ts`: `floorContentBounds({ underlayRect, shapes })` ist die Vereinigung von `underlayBoundsCm` (nur bei sichtbarer Vorlage mit Bild) und den gedrehten Umrissen aller Formen (über `getOutlineCm`). Leer → `{ x: 0, y: 0, width: 1000, height: 1000 }`. `floor-rooms` ergänzt später die Räume.
- **Erstes Einpassen**: wenn der Viewport der Etage fehlt und die Inhalte bekannt sind, also das Bild geladen oder als fehlend erkannt ist.
- **Formen**: `pxPerCm` verschwindet aus `ShapesLayer`, `ShapeNode`, `SelectionTransformer` und `label-transform.ts`. Formen werden direkt in cm gezeichnet, Randstärken bleiben über `strokeScaleEnabled = false` in Bildschirmpixeln. `cmPerScreenPx = 1 / vp.scale`. `units.ts` (`cmToPx`/`pxToCm`) entfällt samt Test, wenn danach ungenutzt.
- **Ebenen**: Vorlage → Raster → (Räume, `floor-rooms`) → Formen → Kalibrier-Overlay. Im Kalibrier-Modus sind Formen ausgeblendet, die Vorlage ist voll deckend und sichtbar.
- **Einfügen**: `FloorCanvas` fügt bei jedem Klick auf die Stage ein (`screenToWorld`), die Prüfung „auf dem Bild“ entfällt.
- **Sperre**: `isToolEnabled` prüft nur noch den Kalibrier-Modus, `isFloorCalibrated` und der Tooltip-Zweig „Etage zuerst kalibrieren“ in `tools.ts` entfallen.

### 5. Raster (`src/lib/grid.ts`)

- `gridLines(visible: RectCm, stepCm = 100)` liefert `{ xs: number[], ys: number[] }`, die Vielfachen von 100 im sichtbaren Bereich.
- `GridLayer` zeichnet sie als Konva-`Line` mit `strokeScaleEnabled = false`, Breite 1 und `listening = false`:
  - Farbe Token `--grid` (zinc-200)
  - die Linien x = 0 und y = 0 kräftiger in zinc-300
- Sichtbar, wenn auf der Etage keine Vorlage mit geladenem Bild sichtbar ist. Bei 10 % Zoom liegen die Linien 10 Bildschirmpixel auseinander. Eine Ausdünnung ist nicht nötig, höchstens etwa 300 Linien.
- Kein Einrasten an Rasterlinien, keine Einstellung (`settings-menu`).

### 6. Bilder: Prüfen, Speichern, Laden

- **`src/lib/image-data.ts`** (rein, getestet):
  - `MAX_IMAGE_BYTES = 20 MB`
  - `sniffImageType(bytes)`: PNG, JPEG und WebP an den Magic Bytes erkennen, nicht an `file.type` oder der Endung
  - `bytesToBase64`, `base64ToBytes`, `toDataUrl(type, bytes)`, `parseDataUrl(text)` → `{ type, bytes } | null`, nur für `image/png|jpeg|webp;base64`
  - `imageIdFor(bytes)` (async, `crypto.subtle.digest("SHA-256")`, hex)
- **`src/storage/image-db.ts`** (Browser, nicht in `src/lib/`):
  - IndexedDB `raumplaner` Version 1, Object Store `images` (Schlüssel = `imageId`, Wert = `Blob`)
  - `putImage`, `getImage`, `listImageIds`, `deleteImages` als Promises
  - Öffnen schlägt fehl (Privatmodus, blockiert) → alle Aufrufe werden abgelehnt.
- **`src/storage/image-cache.ts`**: eine `Map<imageId, Blob>` für die Sitzung.
  - `storeImage(id, blob)` legt das Bild in den Cache und schreibt es nach IndexedDB. Scheitert das, setzt es `imageStoreStatus = "failed"` im Store. Das Bild bleibt in der Sitzung sichtbar (Spec „Bildspeicher nicht verfügbar“).
  - `loadImage(id)`: zuerst Cache, dann IndexedDB, sonst `null`.
- **`useUnderlayImage(underlay)`** (Hook in `src/components/underlay/`):
  - `Blob` → Object-URL → `HTMLImageElement` über `useHtmlImage`, URL-Freigabe beim Wechsel
  - liefert `"loading" | "ready" | "missing"`
  - schreibt den Zustand in `imageAvailability[imageId]` im Store, damit Werkzeugleiste, Statusleiste und Panel ohne eigenes Laden wissen, ob das Bild da ist
- **`read-image.ts`** (Browser): `readImageFile(file)`.
  - prüft zuerst Größe und Typ (`sniffImageType`), dekodiert dann mit `createImageBitmap` für Breite und Höhe und berechnet die Kennung
  - Ergebnis: `{ id, blob, widthPx, heightPx }` oder ein Fehler `"type" | "too-large" | "unreadable"`
  - Die deutschen Hinweise kommen aus der Spec.
- **Aufräumen beim Start** (`src/main.tsx`, nach dem Anlegen des Stores):
  - `listImageIds()` minus `referencedImageIds(plan)` wird gelöscht.
  - Das geschieht nur bei den Lade-Ergebnissen `restored`, `migrated` und `empty`. Bei `backed-up`/`backup-failed`/`unavailable` könnte die Sicherung noch auf Bilder verweisen, deshalb wird dort nichts gelöscht.
  - In der Sitzung wird nie gelöscht. So kann Rückgängig ein ersetztes oder entferntes Bild wiederherstellen.

### 7. Vorlage bearbeiten (Store und Plan-Operationen)

- `src/lib/plan.ts`:
  - `setUnderlay(plan, floorId, underlay | null, now)` und `updateUnderlay(plan, floorId, patch, now)` (Sichtbar, Deckkraft)
  - `setCalibration(plan, floorId, cal, now)` schreibt in `underlayByFloor[floorId].calibration` und lehnt Etagen ohne Vorlage ab.
  - `removeFloor` entfernt auch die Vorlage.
  - Alle sind rein, liefern bei Ablehnung dasselbe Objekt und setzen sonst `updatedAt`.
- `underlayWithImage(current, image)` (`underlay.ts`):
  - **Keine Vorlage** → neue Vorlage: sichtbar, Deckkraft 1, ohne Kalibrierung.
  - **Vorlage ohne vorhandenes Bild** (`imageId === null` oder im Browser nicht gefunden) **oder gleiche Pixelmaße** → Bild und Maße tauschen, Kalibrierung behalten.
  - **Sonst** liefert `needsCalibrationReset = true`. Die Oberfläche fragt nach und ruft dann mit `resetCalibration` auf.
  - „Bild fehlt im Browser“ entscheidet der Aufrufer anhand von `imageAvailability`.
- Store-Aktionen:
  - `applyUnderlayImage(floorId, image, { resetCalibration })`: Ist die Vorlage danach nicht kalibriert, startet sie den Kalibrier-Modus und verwirft den Viewport der Etage.
  - außerdem `removeUnderlay(floorId)`, `setUnderlayVisible(floorId, visible)`, `setUnderlayOpacity(floorId, opacity)`
  - Jede Aktion ist über `applyPlan` genau ein Verlaufsschritt. Der automatische Start des Kalibrier-Modus gehört nicht zum Plan und ist kein Schritt.
- `CalibrationDraft` bekommt `align: "horizontal" | "vertical" | null`, vorbelegt aus der gespeicherten Kalibrierung.
  - `saveCalibration` übernimmt `align`.
  - Danach verwirft es den Viewport der Etage (Neu-Einpassen).
  - `canCalibrate(state)`: Vorlage mit `imageId` und `imageAvailability` = `"ready"`.
- **`plan-diff.ts`**: `sameContent` und `resolveHistoryFocus` vergleichen `underlayByFloor[id]` statt `calibrationByFloor[id]` per Referenz.
- **Taste `B`** in `useShapeShortcuts`: blendet die Vorlage der aktiven Etage um. Sie wirkt nicht in Eingabefeldern, nicht im Kalibrier-Modus und nicht ohne Vorlage.

### 8. Oberfläche

- **`UnderlaySection`** (`src/components/underlay/`) unter dem Hinweis „Wähle eine Form aus“ im `PropertiesPanel`. Bedienelemente aus `properties/` werden wiederverwendet (Deckkraft-Regler wie in `StyleSection`, 10–100 % in 5-%-Schritten, Übernahme beim Loslassen). Inhalt:
  - Dateizeile: „1240 × 1754 px“ bzw. „Bild fehlt“
  - „Bild hochladen“ / „Bild ersetzen“, „Vorlage entfernen“ (destruktiv, ohne Rückfrage)
  - Schalter „Sichtbar (B)“, Regler „Deckkraft“
  - „Maßstab: 0,9986 px/cm“ oder „nicht kalibriert“, „Ausrichtung: keine/waagerecht/senkrecht“
  - „Vorlage kalibrieren“
- **`useUnderlayUpload(floorId)`** kapselt Dateiauswahl (`accept="image/png,image/jpeg,image/webp"`), `readImageFile`, `storeImage`, die Rückfrage bei anderen Pixelmaßen (shadcn `dialog`: „Kalibrierung zurücksetzen?“, Text nennt alte und neue Pixelmaße) und die Fehlermeldung. Panel und Canvas-Hinweis nutzen denselben Hook.
- **`MissingImageHint`**: eine Karte mittig auf der Zeichenfläche mit „Vorlage fehlt – Bild laden“ und der Schaltfläche „Bild laden“. Die Fläche um die Karte bleibt bedienbar, Formen werden gezeichnet.
- **`ToolBar`**: „Vorlage kalibrieren“ (Icon `Ruler`), gesperrt mit Tooltip laut Spec, wenn `canCalibrate` falsch ist.
- **`CalibrationPanel`**:
  - Unter der Länge eine Gruppe aus drei Optionsfeldern „Ausrichtung“ und die Zeile „Drehung −1,1°“ (`formatDegrees`, eine Nachkommastelle).
  - Neuer Fußtext: „Möbel bleiben in cm – ein neuer Maßstab oder eine Ausrichtung verändert nur die Lage der Vorlage darunter.“
- **`StatusBar`**: links der Vorlagenstatus laut Spec. Rechts erscheint „Nicht gespeichert“ auch bei `imageStoreStatus === "failed"`, mit dem eigenen Tooltip „Vorlagenbilder können in diesem Browser nicht gespeichert werden.“.

### 9. Export und Import

- **Dateiformat**: `{ ...plan, images: { [imageId]: "data:image/png;base64,…" } }`, wobei `images` als letzter Schlüssel steht.
  - `buildExportFile(plan, images)` in `plan-export.ts` setzt `imageId` auf `null` (Maße bleiben), wenn das Bild nicht vorliegt. So meldet ein Re-Import kein fehlendes Bild, sondern zeigt still „Vorlage fehlt“, wie in der App selbst.
  - `serializeExport` rückt wie bisher ein, Data-URLs stehen einzeilig.
  - `exportPlan` in `download.ts` wird `async`: Es lädt jedes referenzierte Bild über `loadImage` und baut `toDataUrl`.
  - Alternative ZIP (Plan plus Bilddateien): verworfen. Es bräuchte eine neue Abhängigkeit, und die Datei wäre nicht mehr in einem Editor lesbar. Der Base64-Aufschlag von 33 % ist für wenige Scans unkritisch (siehe Risiken).
- **`analyzePlanFile` bleibt synchron und rein.** Neue Schritte nach den Etagen:
  1. **Vorlagen**: Jeder Eintrag von `underlayByFloor` einer übernommenen Etage geht durch `UnderlaySchema`.
     - Scheitert nur `calibration`, wird die Vorlage mit `calibration: null` übernommen und mit dem Grund aus `describeCalibrationIssue` gemeldet.
     - Scheitert die Vorlage selbst, wird sie nicht übernommen. Den Grund liefert das neue `describeUnderlayIssue`, z. B. „Deckkraft ungültig“.
     - Schlüssel ohne übernommene Etage ergeben „Etage unbekannt“.
  2. **Bilder**: Zu jeder übernommenen Vorlage mit `imageId` wird `images[imageId]` mit `parseDataUrl` gelesen.
     - Fehlt der Eintrag → `imageId = null`, Meldung „Vorlagenbild fehlt“.
     - Ist er unlesbar → „Vorlagenbild unlesbar“.
     - Sonst steht er als `pendingImages: Map<imageId, { type, bytes }>` im Ergebnis.
     - Nicht referenzierte Bilder werden übergangen.
  3. `ImportSuccess` bekommt `underlayIssues` und `pendingImages`. `hasWarnings` berücksichtigt `underlayIssues`.
- **Asynchrone Bildprüfung** in `PlanFileActions` vor dem Dialog: Jedes `pendingImages`-Bild wird mit `createImageBitmap` dekodiert (Maße) und mit `imageIdFor` gehasht. Das reine `applyImageCheck(analysis, results)` in `plan-import.ts` (getestet) führt die Ergebnisse zusammen:
  - setzt die echten Bildmaße
  - ordnet eine abweichende Kennung der berechneten zu
  - setzt bei Dekodierfehlern `imageId = null` mit „Vorlagenbild unlesbar“
  - berechnet `hasWarnings` neu
- **Bestätigen**: Zuerst `storeImage` für alle Bilder, dann `replacePlan`. Scheitert IndexedDB, läuft der Import trotzdem durch (Cache, Statusleiste „Nicht gespeichert“).
- `MAX_IMPORT_BYTES = 50 MB`.
- **`ImportDialog`**:
  - Die Zeile „Vorlage für n von m Etagen“ ersetzt „Kalibrierung für …“, mit Details je Etage: „Bild, 0,9986 px/cm“, „Bild, nicht kalibriert“, „ohne Bild, 0,9986 px/cm“, „ohne Vorlage“.
  - Neue Problemzeile „Vorlagen nicht oder nur teilweise übernommen“.
  - Die Ersetzen-Warnung zählt Formen oder Vorlagen.

### 10. Datenmodell und `schemaVersion` (Zusammenfassung)

- `PLAN_SCHEMA_VERSION` 2 → 3.
- `calibrationByFloor` → `underlayByFloor: Partial<Record<FloorId, Underlay>>`.
- `Calibration.align?` ist neu.
- Migration 2 → 3 in `PLAN_MIGRATIONS`, Fixture `plan-v3.json` neu.
- Exportdatei = Plan-JSON plus `images`, Browser-Speicher = Plan-JSON ohne Bilder. Damit unterscheiden sich die beiden Formate erstmals, aber nur im Zusatzfeld `images`. `analyzePlanFile` liest auch eine Datei ohne `images`, z. B. den Inhalt von `raumplaner.plan.pre-migration`.

## Risks / Trade-offs

- **[Vorhandene Möbel und Ausrichtung]** Die Möbel des Nutzers stehen auf dem ungedrehten Scan. Wählt er nachträglich „waagerecht“, dreht sich der Scan unter den Möbeln weg, die Möbel bleiben in cm. → Die Ausrichtung ist optional und standardmäßig „Keine“. Die Migration setzt keine Ausrichtung, also bewegt sich nichts. Der Fußtext im Kalibrier-Panel sagt es. Empfehlung in `docs/design/README.md`: zuerst ausrichten, dann einrichten. Siehe auch die offenen Fragen.
- **[IndexedDB wird getrennt vom Plan gelöscht]**, z. B. durch Privatmodus oder manuelles Löschen der Website-Daten. → Die Vorlage bleibt mit Kalibrierung erhalten, der Hinweis „Vorlage fehlt – Bild laden“ und der Export mit Bildern decken das ab.
- **[Große Exportdateien]** Drei Scans mit je etwa 0,5 MB ergeben etwa 1,5 MB, Fotos mit 8 MB über 30 MB. → Die Importgrenze liegt bei 50 MB, die Bildgrenze bei 20 MB. `JSON.stringify` und `atob` laufen synchron, das dauert bei 30 MB etwa eine Sekunde und ist für einen gelegentlichen Export vertretbar.
- **[Aufräumen löscht ein noch gebrauchtes Bild]** → Gelöscht wird nur beim Start und nur bei sauber geladenem Plan (Entscheidung 6). In der Sitzung wird nie gelöscht.
- **[Bild-Verfügbarkeit ist asynchron]** Werkzeugleiste und Statusleiste zeigen kurz „lädt“ statt „Vorlage fehlt“. → Während `"loading"` zeigt die Statusleiste den Maßstab bzw. „Vorlage nicht kalibriert“, und „Vorlage kalibrieren“ ist noch gesperrt. „Vorlage fehlt“ erscheint erst nach `"missing"`.
- **[Großer Change]** Die Aufgaben sind so gruppiert, dass die App nach jeder Gruppe lauffähig ist. Gruppe 3 (cm-Welt) zeigt noch die PNGs aus `public/plans/` als Vorlage, erst Gruppe 4 schaltet auf IndexedDB um. Eine Pause zwischen 3 und 4 ist möglich.
- **[`createImageBitmap` und sehr große Bilder]** Ein 20-MB-JPEG kann mehrere hundert MB dekodiert belegen. → Diese Grenze ist bewusst gewählt. Größere Scans muss der Nutzer vorher verkleinern, und der Hinweis sagt das.

## Migration Plan

1. `floors-in-plan` umsetzen und archivieren. Vorher den Plan exportieren.
2. Die Dateien `public/plans/eg.png`, `og.png` und `dg.png` außerhalb des Repos sichern, z. B. in `~/Dokumente/Grundrisse/`.
3. Diesen Change umsetzen. Beim ersten Start wird der gespeicherte Plan von Version 2 auf 3 umgewandelt (Sicherung unter `raumplaner.plan.pre-migration`). Erdgeschoss, Obergeschoss und Dachgeschoss zeigen „Vorlage fehlt – Bild laden“.
4. Die drei PNGs je Etage über „Bild laden“ hochladen. Die Kalibrierung gilt sofort wieder, die Möbel liegen wie vorher.
5. Erst danach entfernt die letzte Aufgabe `public/plans/` aus dem Repo.
6. **Rückweg**: Eine ältere App-Version liest Version 3 nicht. Dann `raumplaner.plan.pre-migration` zurückspielen oder die vorher exportierte Datei importieren. Die PNGs liegen in der Git-Historie und unter Schritt 2.

## Open Questions

- Soll es später „Möbel mit der Vorlage drehen“ geben, also die Möbel einer Etage beim nachträglichen Ausrichten um die Bildmitte mitzudrehen? Das ändert diesen Change nicht und wäre ein eigener kleiner Change.
- Soll „Einpassen“ bei Etagen mit Räumen (`floor-rooms`) die ausgeblendete Vorlage ignorieren? Heute ignoriert es ausgeblendete Vorlagen schon. `floor-rooms` ergänzt nur seine Räume in `floorContentBounds`.
