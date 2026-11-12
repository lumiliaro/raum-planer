# Design

## Context

- Motivation und Umfang: siehe `proposal.md`. Anforderungen: `specs/clipboard`, `specs/app-help`.
- Die Auswahl ist einfach: höchstens eines von `selectedShapeId`, `selectedRoomId`, `selectedOpeningId` ist gesetzt (`app-store.ts`).
- Planänderungen laufen über reine Funktionen in `src/lib/plan.ts` (`addShape`, `addRoom`, `removeShape`, `removeRoom`); der Store setzt `plan` als Ganzes, und zundo macht daraus genau einen Rückgängig-Schritt pro `set({ plan })`. Sitzungszustand (`helpTab`, `tutorialStep` …) steht neben `plan` und gehört nicht zu `partialize`.
- Sperre wird im Store geprüft (`canDelete`, `canDeleteRoom`), nicht in `plan.ts`.
- Öffnungen hängen über `edgeIndex` und `offsetCm` an ihrer Raumkante. Eine verschobene Raumkopie nimmt sie deshalb unverändert mit; nur die IDs müssen neu sein (eindeutig im ganzen Plan, `checkUniqueOpeningIds`).
- Tasten mit Strg/⌘ behandelt `useShapeShortcuts` bisher nur für Z und Y; alle anderen Strg-Tasten gehen an den Browser. Eingabefelder (`isEditableTarget`) und Dialoge (`isInDialog`) sind schon ausgenommen.
- `moveRoom` verschiebt Möbel im Raum mit. Für Kopien gilt das nicht: Kopiert wird nur das Ausgewählte.

## Goals / Non-Goals

**Goals:**
- Kopie, Versatz und Name als reine Funktionen in `src/lib/`, ohne Store testbar.
- Ein Einfügen ist genau ein `set({ plan })`, also genau ein Rückgängig-Schritt.

**Non-Goals:**
- Keine Abstraktion für spätere Mehrfachauswahl; die Zwischenablage hält genau ein Objekt.
- Kein Mitkopieren der Möbel, die in einem kopierten Raum stehen.

## Decisions

1. **Zwischenablage im Store, nicht im System:** Neues Sitzungsfeld
   `clipboard: ClipboardState | null` mit
   `{ item: { kind: "shape"; shape: Shape } | { kind: "room"; room: Room }, sourceFloorId, cut: boolean, pastesByFloor: Record<FloorId, number> }`.
   Das Objekt ist eine Momentaufnahme (der Plan ist unveränderlich, ein Verweis genügt). Nicht in `partialize`, nicht in `localStorage`, nicht im Export.
   - Alternative: `navigator.clipboard`. Braucht im Browser je nach Lage eine Erlaubnis, ist asynchron, und Daten aus fremden Quellen müssten wie ein Import geprüft werden. Kopieren zwischen Tabs ist nicht gefordert.

2. **Versatz als reine Funktion** in `src/lib/clipboard.ts`:
   `pasteOffsetSteps(clip, floorId) = (clip.pastesByFloor[floorId] ?? 0) + (floorId === clip.sourceFloorId && !clip.cut ? 1 : 0)`,
   Versatz = Schritte × `PASTE_OFFSET_CM` (50 cm) in x und y. Nach jedem Einfügen erhöht der Store `pastesByFloor[floorId]` um 1. Kopieren und Ausschneiden setzen `pastesByFloor` auf `{}` zurück.
   - Damit gilt: gleiche Etage nach Kopieren 50, 100 … cm; andere Etage 0, 50 … cm; nach Ausschneiden auch auf der Quell-Etage 0, 50 … cm.
   - Der Versatz ist fest und hängt nicht am Raster oder Fangschritt: Er soll vorhersehbar sein. Positionen werden auf 0,1 cm gerundet wie beim Verschieben.
   - Alternative: Versatz je Zwischenablage statt je Etage. Dann würde ein Einfügen im EG den Startpunkt im OG verschieben; die Spec verlangt „gleiche Stelle“ für das erste Einfügen auf der anderen Etage.

3. **Kopie erzeugen** (`src/lib/clipboard.ts`):
   - `copyShape(shape, dx, dy, newId)`: neue `id`, `x + dx`, `y + dy`, `locked` entfällt (`undefined`), alles andere unverändert.
   - `copyRoom(room, dx, dy, newId, { keepName })`: neue Raum-ID, Punkte um (dx, dy) verschoben (`translatePoints` aus `plan.ts`), jede Öffnung mit neuer ID, `locked: false`, Name über `copyName(name)`, außer bei `keepName`.
   - `copyName(name)`: endet `name` auf „ (Kopie)“, bleibt er; sonst wird `name` so gekürzt (nach `trim`), dass `name + " (Kopie)"` höchstens `MAX_ROOM_NAME_LENGTH` (40) Zeichen hat.
   - `keepName` ist wahr beim ersten Einfügen nach einem Ausschneiden, das gelöscht hat (`clip.cut` und noch kein Einfügen in `pastesByFloor`, auf keiner Etage).
   - Hinzufügen über die bestehenden `planOps.addShape`/`addRoom`; sie prüfen Schema und ID-Kollision. Schlägt das fehl, liefert die Store-Aktion `false` und ändert nichts.

4. **Store-Aktionen** in `app-store.ts`, je mit Rückgabe `boolean` wie die übrigen Aktionen:
   - `copySelection()`: Form oder Raum der Auswahl auf der aktiven Etage in `clipboard` legen; mit Öffnung oder ohne Auswahl `false`.
   - `cutSelection()`: wie `copySelection`, dann `deleteSelectedShape`/`deleteSelectedRoom`. `cut: true` nur, wenn tatsächlich gelöscht wurde; bei gesperrtem Objekt verhält sich der Eintrag wie Kopieren (`cut: false`), damit das spätere Einfügen versetzt und mit „ (Kopie)“ erfolgt (Spec „Gesperrt ausschneiden“).
   - `pasteClipboard()`: gesperrt, wenn `clipboard === null`, `calibrationDraft !== null` oder `roomDraft !== null`. Sonst Kopie bilden, hinzufügen, auswählen (`selectShape`/`selectRoom`), `activeTool: "select"`, `pastesByFloor` erhöhen.
   - `duplicateSelection()`: dieselben Sperren wie Einfügen; Kopie mit Versatz 1 × 50 cm direkt aus dem ausgewählten Objekt, `clipboard` bleibt unberührt.
   - Der Zähler `pastesByFloor` und der Plan werden in einem `set` geschrieben; zundo nimmt davon nur `plan` auf. Undo/Redo rühren `clipboard` nicht an.

5. **Tasten** in `useShapeShortcuts`: Der bestehende Strg/⌘-Zweig wird um `c`, `x`, `v`, `d` erweitert, mit denselben Ausnahmen wie bisher (Dialog, Eingabefeld – hier `isEditableTarget` statt `targetOwnsUndo`, weil Kopieren von Text in jedem Textfeld beim Browser bleiben soll). `preventDefault` nur, wenn die Aktion etwas getan hat, damit z. B. Strg+D ohne Auswahl weiter das Lesezeichen anlegt und Strg+C auf markiertem Hilfetext funktioniert. Während `Konva.isDragging()` oder `Konva.isTransforming()` wird wie bei Rückgängig nichts getan. Strg+Umschalt+… und Strg+Alt+… bleiben unbehandelt.
   - Alternative: `copy`/`paste`-Ereignisse des Dokuments. Sie liefern kein Strg+D und hängen vom Fokus ab (Konva-Canvas ist kein Eingabeelement); die Tastatur-Variante passt zu den übrigen Kürzeln.

6. **Hilfe:** `SHORTCUT_GROUPS` bekommt in „Auswahl“ vorne vier Einträge: „Strg+C“ Kopieren, „Strg+X“ Ausschneiden, „Strg+V“ Einfügen, „Strg+D“ Duplizieren. Der bestehende Test der Liste wird angepasst.

**Datenmodell / schemaVersion:** keine Änderung. Kopien sind gewöhnliche Räume und Formen; `clipboard` ist Sitzungszustand und gehört nicht zum Plan, zum Export oder zum Verlauf.

## Risks / Trade-offs

- [Kopie liegt teilweise über anderen Räumen oder außerhalb des sichtbaren Bereichs] → Räume dürfen sich schon heute überlappen; die Kopie ist ausgewählt und kann sofort verschoben werden. Kein automatisches Ausweichen.
- [Strg+D/Strg+C werden dem Browser weggenommen] → nur, wenn eine Aktion wirklich etwas tut (siehe Entscheidung 5).
- [Ausgeschnittener Raum hatte Möbel im Innern] → Die Möbel bleiben auf der alten Etage stehen, wie beim Löschen eines Raums heute. Steht im Proposal als nicht im Umfang.
- [Lange Namen] → `copyName` kürzt vor dem Zusatz, sodass die Kopie nie am Schema scheitert.

## Migration Plan

Keine Migration. Rückbau: Store-Felder, Tasten und Hilfe-Einträge entfernen.
