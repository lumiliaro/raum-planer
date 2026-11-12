# Design

## Context

- **Ausgangslage nach `room-passage`** (Formatversion 7):
  - `Room { id, name, pointsCm, wallThicknessCm, openings }`.
  - `RoomsLayer` → `RoomArea` füllt jede Fläche mit `AREA_FILL = "rgba(255,255,255,0.5)"`. Die Fläche ist zugleich Klickziel für Auswahl und Ziehen.
- **Vorhandene Bausteine**:
  - `HexColorSchema` (`#RRGGBB`) in `plan-schema.ts`
  - `ColorField` in `StyleSection.tsx` (natives `<input type="color">`, übernimmt erst nach Bestätigung, unkontrolliert)
  - die Farbfelder der Möbel-Voreinstellungen (`STYLE_PRESETS`, `findActivePreset`) als Vorbild für Markierung und Vergleich ohne Groß-/Kleinschreibung
- **Panel**: `RoomProperties` mit Kopf, Name und `EdgesSection` (aus `wall-thickness` mit Feld „Wand“ je Kante).

## Goals / Non-Goals

**Goals:**
- Eine einzige neue Eigenschaft am Raum. Die Darstellung leitet die Füllung aus einer reinen Funktion ab.
- Die Vorlage bleibt in jedem Raum sichtbar, egal welche Farbe gewählt ist.

**Non-Goals:**
- Keine eigene Deckkraft je Raum. Die Transparenz ist für alle Räume gleich.
- Kein Einfluss der Farbe auf Wandband, Namen oder Auswahlumriss.

## Decisions

### 1. Datenmodell und Formatversion 8

```ts
RoomSchema = z.object({ ..., color: HexColorSchema.nullable() })   // null = „Standard“ (weiß)
```

- **Auswirkung auf `schemaVersion`**: 7 → 8. `PLAN_MIGRATIONS[7]` setzt bei jedem Raum-Objekt ohne `color` den Wert `null`.
- Fixture `__fixtures__/plan-v7.json` (mit Durchgang) wird eingefroren.
- `null` statt `"#FFFFFF"` für „Standard“: Dann kann `app-settings` später zwischen „keine eigene Farbe“ und „bewusst weiß“ unterscheiden, und eine geänderte Darstellung von „Standard“ wirkt auf alle Räume ohne Farbe.
- **Alternative**: Raum mit vollem `style` wie Formen (fill, stroke, opacity). Verworfen: Der Nutzer will Räume einfärben. Rand und Deckkraft je Raum wären mehr Oberfläche ohne erkennbaren Nutzen.

### 2. Farbe und Darstellung: `src/lib/room-colors.ts`

- `ROOM_COLOR_PRESETS`:

  | Name | Farbe |
  | --- | --- |
  | Standard | `null` |
  | Grau | `#D4D4D8` |
  | Blau | `#BFDBFE` |
  | Grün | `#BBF7D0` |
  | Gelb | `#FEF08A` |
  | Orange | `#FED7AA` |
  | Rosa | `#FBCFE8` |
  | Violett | `#DDD6FE` |

  Das sind kräftigere Töne als bei den Möbeln, weil die Fläche halbtransparent liegt. Das Auswahlblau `--selection` ist nicht darunter.
- `findRoomColorPreset(color)` vergleicht ohne Groß-/Kleinschreibung, `null` ↔ „Standard“.
- `roomAreaFill(color)` liefert für `null` `"rgba(255,255,255,0.5)"` und sonst die Farbe als `rgba(r,g,b,0.5)`. `RoomArea` nutzt das statt `AREA_FILL`.
  - **Alternative**: Konva-`opacity` am Element. Verworfen, weil Name und Fläche in einer Gruppe liegen und der Name nicht blasser werden soll.

### 3. Panel: `RoomColorSection`

- `PropertySection` „Farbe“ zwischen Kopf/Name und „Kanten“:
  - eine Reihe Farbfelder wie in `StyleSection` (24 × 24 px, `aria-pressed`, Titel = Name). „Standard“ ist weiß mit Rand.
  - am Ende `ColorField` (aus `StyleSection.tsx` exportiert) mit `ariaLabel` „Eigene Raumfarbe wählen“
- Jede Wahl ruft `updateRoom(floorId, id, { color })` auf, das ist ein Schritt. Eine unveränderte Wahl wird verworfen, weil `updateRoom` „ändert nichts“ ablehnt.
- `RoomPatch` bekommt `color?: string | null`.
- **Verlauf**: `resolveHistoryFocus` behandelt seit `wall-thickness` jede Raumänderung außer an `openings` als Raum-Fokus. Eine reine Farbänderung wählt nach Rückgängig also den Raum aus. Ein Test sichert das.

### 4. Neue Räume

- Der Raum aus dem Zeichen-Entwurf bekommt `color: null`. `app-settings` ersetzt das später durch die Standardfarbe aus den Einstellungen.

### 5. Import

- In `readRoom`: Ist `color` vorhanden und besteht `HexColorSchema.nullable()` nicht, wird der Raum mit `color: null` geprüft. Dazu kommt ein Eintrag in `colorIssues: { floorId, roomName }[]` mit dem Text „Farbe ungültig, Standard verwendet“, und `hasWarnings` berücksichtigt ihn.
- Fehlt `color`, wird der Wert ohne Eintrag `null`. Das betrifft nur v8-Dateien, ältere bekommen das Feld schon durch die Migration.
- Die Liste lässt sich mit `wallIssues` aus `wall-thickness` zu einer gemeinsamen Liste `roomIssues: { floorId, roomName, reason }[]` zusammenlegen. Das entscheidet die Umsetzung.

## Risks / Trade-offs

- [Halbtransparente Farben über einer farbigen Vorlage sehen anders aus als im Farbfeld] → So gewollt, damit die Vorlage lesbar bleibt. Für den echten Ton blendet man die Vorlage aus.
- [Eigene, sehr dunkle Farben machen den Raumnamen schwer lesbar] → Der Nutzer wählt bewusst. Die Farbfelder sind alle hell.
- [Formatversion 8 ist für ältere App-Stände unlesbar] → wie bei jeder Erhöhung.

## Migration Plan

- `PLAN_MIGRATIONS[7]` setzt `color: null` beim Start und beim Import.
- Zurückrollen: Ein v7-Stand liest v8 nicht. Über eine Exportdatei der Version 7 wiederherstellen, sofern vorhanden.
