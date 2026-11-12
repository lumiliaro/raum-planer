# Design

## Context

Siehe proposal.md – Why. Die Möbel-Sperre gibt das Muster vor:

- `Shape.locked?: boolean` im Schema; Regeln als reine Funktionen in `src/lib/shape-lock.ts` (`LOCK_ALLOWED_FIELDS`, `isPatchAllowed`, `canDelete`).
- Durchgesetzt wird die Sperre im Store (`updateShape`, `removeShape`); die Plan-Operationen in `src/lib/plan.ts` kennen keine Sperre. Rückgängig/Wiederholen und Import ersetzen den Plan als Ganzes und laufen daher nicht durch die Prüfung.
- Oberfläche: `LockToggle` im Panel-Kopf, „Löschen“ per `aria-disabled` gesperrt (Tooltip bleibt in Firefox sichtbar), Felder über `readOnly` in `NumberField`/`useCommitField`; die Konva-Gruppe ist bei Sperre nicht `draggable`, dadurch verschiebt Ziehen die Stage.

Räume heute: `RoomSchema { id, name, pointsCm, openings, wallThicknessCm, color }`, `PLAN_SCHEMA_VERSION = 10`. `moveRoom` läuft über `planOps.updateRoom` mit neuen `pointsCm`. `planOps.updateRoom` lehnt einen Patch ohne Änderung ab, verglichen werden Name, Ecken, Wanddicken und Farbe. `RoomArea` in `RoomsLayer.tsx` ist ziehbar, wenn „Auswählen“ aktiv und der Raum ausgewählt ist.

## Goals / Non-Goals

**Goals:**
- Raum-Sperre mit demselben Aufbau und Verhalten wie die Möbel-Sperre, damit sich beide gleich anfühlen und gleich gewartet werden.
- Sperre an einer Stelle im Store durchsetzen, nicht nur in der Oberfläche.

**Non-Goals:**
- Keine gemeinsame Abstraktion für Formen- und Raum-Sperre (zwei kleine Erlaubnislisten sind einfacher als ein generisches Modul).
- Öffnungs-Aktionen (`insertOpening`, `updateOpening`, `removeOpening`) prüfen die Raum-Sperre nicht.

## Decisions

### 1. Datenmodell: `locked: boolean` als Pflichtfeld, schemaVersion 10 → 11

`RoomSchema` bekommt `locked: z.boolean()`. `PLAN_SCHEMA_VERSION` wird 11, `PLAN_MIGRATIONS[10]` setzt bei jedem Raumobjekt ohne `locked` den Wert `false` (über `mapRooms`, wie Migration 7 für `color`); ein vorhandener Wert bleibt, die Schema-Prüfung bzw. der Import entscheidet.

Alternative: optionales Feld `locked?: boolean` wie bei Formen, ohne neue Version. Verworfen, weil die Projektregel jede Formatänderung mit einer neuen `schemaVersion` verlangt und die letzten Raum-Felder (`color`, `beforeFullEdge`) ebenfalls Pflichtfelder mit Migration sind. Ein Pflichtfeld erspart außerdem überall `=== true`.

Folgen: neues Fixture `plan-v10.json` (eingefroren vor dem Hochzählen), `locked: false` beim Schließen eines neuen Raums im Store, Raum-Literale in Tests und `src/test/plan-fixtures.ts` ergänzen.

### 2. Import: `locked` vor der Raumprüfung bereinigen

In `readRoom` (`src/lib/plan-import.ts`) wird `locked` wie `color` vorbereitet: ein Boolean bleibt, alles andere (fehlend, Text, Zahl) wird ohne Hinweis zu `false`. So verwirft ein ungültiger Wert nie den ganzen Raum (Spec „Sperre eines Raums aus der Datei“). Kein neuer Hinweistyp im Prüfergebnis: eine verlorene Sperre ist harmlos und sofort wieder setzbar.

### 3. Regeln in `src/lib/room-lock.ts`

```ts
export const ROOM_LOCK_ALLOWED_FIELDS: readonly string[] = Object.freeze(["name", "color", "locked"]);
export function isRoomPatchAllowed(room: Room, patch: RoomPatch): boolean;
export function canDeleteRoom(room: Room): boolean;
```

Erlaubnisliste statt Sperrliste, wie bei Formen: ein künftiges Geometrie-Feld eines Raums ist automatisch gesperrt. `RoomPatch` in `src/lib/plan.ts` bekommt `locked?: boolean`.

### 4. Durchsetzung im Store

- `updateRoom` und `moveRoom` prüfen `isRoomPatchAllowed` (bei `moveRoom` gilt der Patch als `{ pointsCm }`) und geben bei Verstoß `false` zurück, ohne `applyPlan` aufzurufen – kein Rückgängig-Schritt.
- `removeRoom` prüft `canDeleteRoom`. `deleteSelectedRoom` hebt die Auswahl nur auf, wenn wirklich gelöscht wurde oder der Raum nicht mehr existiert (wie `deleteSelectedShape`), damit ein gesperrter Raum ausgewählt bleibt.
- `planOps.updateRoom` vergleicht zusätzlich `locked`, sonst wird `{ locked: true }` als „keine Änderung“ abgelehnt.
- Etage löschen (`removeFloor`) und Öffnungs-Aktionen bleiben unberührt (Spec: Etage samt gesperrtem Raum löschbar, Öffnungen frei bearbeitbar).

Alternative: Prüfung in `planOps`. Verworfen, damit Raum- und Formen-Sperre an derselben Stelle leben und die reinen Plan-Operationen sperr-agnostisch bleiben.

### 5. Oberfläche

- `RoomProperties.tsx`: Panel-Kopf mit `LockToggle` vor „Löschen“, `onToggle` → `updateRoom(floorId, room.id, { locked: !locked })`. „Löschen“ bei Sperre mit `aria-disabled`, Tooltip „Gesperrt – zuerst entsperren“, ohne `onClick`, Stil wie in `ShapeProperties.tsx`.
- `EdgesSection`: `readOnly={room.locked}` an beiden `NumberField`s. Fokus-Hervorhebung der Kante bleibt.
- `RoomsLayer.tsx`: `draggable={selecting && room.id === selected?.id && !room.locked}`. Der bestehende Effekt setzt den Verschiebe-Cursor zurück, wenn `draggable` wechselt.
- `useShapeShortcuts`: keine Änderung; `Entf` ruft `deleteSelectedRoom`, das die Sperre beachtet.

## Datenmodell und schemaVersion

- `Room` bekommt `locked: boolean` (Pflicht).
- `schemaVersion` 10 → 11; Migration 10 → 11 setzt `locked: false` für jeden Raum ohne Feld. Alle anderen Angaben bleiben unverändert.
- Export schreibt `locked` mit; ältere App-Versionen sehen eine neuere Datei (Version 11) und behandeln sie über den bestehenden Weg „Datei aus einer neueren Version“.
- `PlanSettings`, Formen, Vorlagen und Öffnungen ändern sich nicht.

## Risks / Trade-offs

- [Ein vergessenes Raum-Literal ohne `locked` bricht Typprüfung oder Tests] → `npx tsc -b` und `npm test` finden alle Stellen; Liste der betroffenen Dateien in tasks.md.
- [Nutzer wundert sich, warum Ziehen am ausgewählten Raum die Ansicht verschiebt] → Schloss im Panel-Kopf zeigt die Sperre; gleiches Verhalten wie bei Möbeln, daher bekannt. Keine Kennzeichnung auf der Zeichenfläche (außerhalb des Umfangs).
- [Parallel offener Change `floor-plan-pdf`] → ändert das Datenformat nicht; kein Konflikt bei `schemaVersion`. Wird er später archiviert, bleibt Version 11 gültig.

## Migration Plan

Beim Start wandelt die bestehende Logik einen gespeicherten Plan der Version 10 automatisch um und sichert die Rohdaten (Spec `plan-persistence`, „Gespeicherter Plan aus älterer Version“). Rückweg: eine vorher exportierte Datei der Version 10 lässt sich in einer älteren App-Version weiter importieren.
