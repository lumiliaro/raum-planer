# Design

## Context

- **Heute** (Formatversion 9, nach `app-settings`; der Plan hat `settings`): `applyFullEdge(frame, opening)` in `src/lib/opening-fields.ts` liefert den Patch `{ offsetCm: 0, widthCm: frame.lengthCm }` oder `null`, wenn der Durchgang die Kante schon ganz einnimmt (Toleranz `OPENING_FIT_EPS_CM`). `OpeningProperties.tsx` zeigt dafür nur bei Durchgängen eine Schaltfläche, die bei `null` gesperrt ist. Fenster haben nichts Vergleichbares.
- Alle Maßänderungen einer Öffnung laufen über `updateOpening` in `src/lib/plan.ts` (Store-Aktion `updateOpening` = ein Rückgängig-Schritt): Eingabefelder, Ziehen in `OpeningsLayer.tsx` (Patch `{ offsetCm }`), Aufschlag/Anschlag (Patch `{ swing }`).
- `reanchorOpenings` hält Öffnungen bei Raumänderungen fest; Öffnungen wachsen nicht mit der Kante mit.
- Neue Öffnungen entstehen in `createOpening(kind, edgeIndex, frame, tCm, id, widths, snap)` (`src/lib/opening-placement.ts`); die Standardbreite je Art liefert `defaultOpeningWidthCm(kind, widths)` aus `plan.settings` (Werkseinstellung Durchgang 100 cm, Fenster 120 cm). Feste Zahlen in Specs gelten laut `app-settings` → „Werkseinstellungen“ als Werkseinstellung.
- Native Kästchen gibt es schon (`UnderlaySection.tsx` „Sichtbar“, `StyleSection.tsx`): `<label>` mit `<input type="checkbox" className="size-4 accent-zinc-900">`.

## Goals / Non-Goals

**Goals:**
- „Ganze Kante“ für Durchgang und Fenster an- und abhakbar, Abhaken bringt die Maße von vorher zurück – auch nach Neuladen und über Export/Import.
- Eine Logik für beide Arten, ohne Sonderfall je Art außer der Standardbreite.
- Die Entscheidungslogik liegt rein in `src/lib/` und ist mit Vitest testbar.

**Non-Goals:**
- Kein dauerhafter Zustand „an Kante gebunden“ (siehe proposal.md, Nicht im Umfang).
- Keine neue UI-Bibliothek, kein shadcn-Checkbox-Bauteil.
- Kein „Ganze Kante“ für Türen.

## Decisions

### 1. Haken wird abgeleitet, nicht gespeichert

Der Haken ist `isFullEdge(frame, opening)`: Abstand ≈ 0 und Breite ≈ Kantenlänge (Toleranz `OPENING_FIT_EPS_CM`, wie heute in `applyFullEdge`).

- **Warum**: Ein Durchgang oder Fenster kann auch per Eingabe, per Import oder durch eine Kantenänderung (wird die Kante länger, ist er es nicht mehr) zur ganzen Kante werden oder es nicht mehr sein. Ein gespeichertes Flag müsste bei all diesen Wegen nachgezogen werden und könnte dem Bild widersprechen.
- **Alternative**: Feld `fullEdge: boolean` an der Öffnung. Verworfen aus obigem Grund.

### 2. Datenmodell: `Opening.beforeFullEdge`

```ts
beforeFullEdge: { offsetCm: number /* ≥ 0 */; widthCm: number /* > 0 */ } | null
```

- Pflichtfeld an jeder Öffnung, wie `swing` und `Room.color` als `… | null`. Ein `.refine` verbietet einen Wert bei `kind === "door"` (Meldung „A door does not remember sizes for the full edge“); Durchgang und Fenster dürfen einen haben.
- **Keine** Passt-auf-die-Kante-Prüfung im Schema: Die Kante kann sich ändern, nachdem die Maße gemerkt wurden. Ob sie passen, prüft erst das Abhaken (Entscheidung 3).
- **schemaVersion 9 → 10.** Migration 9 → 10 (`PLAN_MIGRATIONS[9]`, `mapRooms`) setzt bei jeder Öffnung ohne das Feld `beforeFullEdge: null`; vorhandene Werte (auch `settings`) bleiben. Fixture `src/lib/__fixtures__/plan-v9.json` (mit `settings`).
- `OpeningPatch` (`Partial<Omit<Opening, "id" | "kind">>`) enthält das Feld damit automatisch.
- **Alternative**: Gemerkte Maße nur im Speicher der Sitzung (kein Formatwechsel). Vom Nutzer verworfen: Die Maße sollen Neuladen und Export überstehen.
- **Alternative**: optionales Feld ohne Versionssprung. Verworfen: Projektregel „jede Formatänderung erhöht schemaVersion“, und Pflichtfelder mit `null` sind im Projekt üblich.

### 3. Logik in `opening-fields.ts`

`applyFullEdge` wird ersetzt durch:

- `isFullEdge(frame, opening): boolean`
- `toggleFullEdge(frame, opening, checked: boolean): OpeningPatch | null`
  - `checked && !isFullEdge` → `{ offsetCm: 0, widthCm: frame.lengthCm, beforeFullEdge: { offsetCm, widthCm } }` (aktuelle Werte)
  - `!checked && isFullEdge` → gemerkte Maße, wenn vorhanden, auf die Kante passen (`offsetCm + widthCm ≤ lengthCm + EPS`) und selbst nicht die ganze Kante sind; sonst Ersatzmaße. Immer mit `beforeFullEdge: null`.
  - sonst `null` (nichts zu tun)
- **Ersatzmaße** `fallbackOpeningSize(kind, lengthCm, widths)`: Breite = `defaultOpeningWidthCm(kind, widths)` (Werkseinstellung Durchgang 100 cm, Fenster 120 cm), bei `lengthCm ≤` dieser Breite die halbe Kantenlänge; mittig: `offsetCm = (lengthCm − widthCm) / 2`. Bei längerer Kante bleibt ein Rest, sonst ist die halbe Länge immer > 0 und nicht die ganze Kante – Abhaken ist also immer möglich, das Kästchen nie gesperrt. `toggleFullEdge(frame, opening, checked, widths)` bekommt die Standardbreiten als Parameter; `OpeningProperties` liest sie mit `selectSettings`.
- Der gemerkte Abstand ist `offsetCm` (vom Kantenanfang), nicht der angezeigte Abstand zur linken Ecke; so bleibt die Lage exakt, egal wie die Kante orientiert ist.

### 4. Veraltete gemerkte Maße leeren in `plan.updateOpening`

Enthält ein Patch `widthCm` oder `offsetCm`, aber nicht den Schlüssel `beforeFullEdge`, setzt `updateOpening` `beforeFullEdge: null`.

- Damit gilt die Regel für alle Wege (Felder, Ziehen, künftige Rastpunkte aus `opening-snap-points`) an einer Stelle, ohne dass jeder Aufrufer daran denken muss.
- `sameOpening` vergleicht zusätzlich `beforeFullEdge`, damit ein Patch, der nur dieses Feld ändert, nicht als „keine Änderung“ verworfen wird.
- Patches nur mit `swing` lassen das Feld unverändert. `reanchorOpenings` kopiert Öffnungen mit Spread und lässt es ebenfalls stehen.
- **Alternative**: Gemerkte Maße stehen lassen, bis erneut angehakt wird. Verworfen: Wird die ganze Kante per Eingabe erreicht, brächte Abhaken uralte Werte zurück (Spec-Szenario „Gemerkte Maße veraltet“).

### 5. UI in `OpeningProperties.tsx`

- Statt `<Button>` ein `<label>` mit nativem `<input type="checkbox">` wie bei „Sichtbar“ (`size-4 accent-zinc-900`, Text 13 px), bei `kind !== "door"` (Durchgang und Fenster), an derselben Stelle unter dem Hinweis „Links und rechts …“.
- `checked={isFullEdge(frame, opening)}`, `onChange={(e) => { const patch = toggleFullEdge(frame, opening, e.target.checked); if (patch) updateOpening(floorId, opening.id, patch); }}`. Kontrolliert, also folgt der Haken nach Rückgängig/Wiederholen dem Plan.
- `title`: „So breit wie die Kante, Abstand 0 cm; abhaken stellt die Maße von vorher wieder her“ (neutral für beide Arten).
- Doku-Kommentar der Komponente anpassen.

### 6. Import

`plan-import.ts` prüft jede Öffnung einzeln mit `RoomSchema`. Damit ungültige gemerkte Maße die Öffnung nicht verwerfen, wird `beforeFullEdge` vor der Prüfung bereinigt (`sanitizeBeforeFullEdge`): fehlend, kein gültiges `{ offsetCm ≥ 0, widthCm > 0 }` oder Art = `door` → `null`, ohne Hinweis (Spec „Gemerkte Maße aus der Datei“). Muster wie `sanitizeWallThicknesses`, aber ohne Meldung, da der Wert nicht sichtbar ist.

## Risks / Trade-offs

- [Reihenfolge mit `app-settings`] → `app-settings` ist zuerst umgesetzt und hat Version 9 belegt; dieser Change hebt auf 10.
- [Viele Test-Literale von `Opening` brauchen das neue Pflichtfeld] → TypeScript meldet jede Stelle; mechanisch `beforeFullEdge: null` ergänzen. Fixtures älterer Versionen bleiben unverändert.
- [Ändert sich die Kante, während der Durchgang die ganze Kante einnimmt, und wird sie länger, verliert er den Haken; die gemerkten Maße bleiben am Durchgang] → harmlos: Erneutes Anhaken überschreibt sie, jede Feldänderung leert sie.
- [Fenster über die ganze Kante zeichnet sein Rechteck mit Mittellinie über die ganze Kantenlänge; an den Ecken bleibt das Wandband-Eckstück wie beim Durchgang stehen] → gewollt (Fensterband); die bestehende Darstellung braucht dafür keine Änderung, im Browser prüfen.
- [Ersatzmaße statt Fehlermeldung beim Abhaken] → bewusst: Das Kästchen soll nie gesperrt sein; die Ersatzmaße entsprechen einer neu gesetzten Öffnung derselben Art.

## Migration Plan

- Lokaler Plan der Version 9 wird beim Laden automatisch auf 10 gehoben (bestehender Mechanismus in `plan-storage.ts`, Rohtext-Sicherung wie bisher).
- Import von Version-9-Dateien (ältere über die bestehende Kette bis 10): Hinweis zur abweichenden Version wie bei jedem Versionssprung, danach Migration ohne weitere Warnung.
- Kein Rückweg: Ein Plan der Version 10 lässt sich in einer älteren App-Version nicht ohne Versionshinweis importieren (wie bei jedem Formatwechsel).
