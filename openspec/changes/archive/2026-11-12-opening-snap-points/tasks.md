# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `room-color` archiviert ist (`PLAN_SCHEMA_VERSION` 8, Öffnungsart `passage` vorhanden). Die MODIFIED-Anforderungen „Öffnung setzen“ und „Öffnung entlang der Kante ziehen“ mit dem Wortlaut in `openspec/specs/room-openings/spec.md` vergleichen und angleichen. Prüfen mit `openspec validate opening-snap-points --strict`.

## 2. Logik

- [x] 2.1 `src/lib/opening-snap.ts` (`openingSnapTargets`, `snapOpeningOffset`, `SNAP_POINT_TOLERANCE_PX = 8`) plus `opening-snap.test.ts`:
  - 500-cm-Kante, Breite 120 cm → Mitte 190, Ecken 0 und 380
  - Nachbar 50–170 → Ziele 170 und (ungültig, weil < 0) kein −70
  - raw 185 bei Toleranz 8 cm → Mitte
  - raw 176 bei Toleranz 16 cm → Mitte
  - raw 176 bei Toleranz 8 cm → `null`
  - Gleichstand → Mitte vor Ecke vor Nachbar
  - Markierungsstellen: Mitte L/2, Ecke 0 bzw. L, Nachbar an der gemeinsamen Grenze

  Prüfen mit `npm test`.
- [x] 2.2 `createOpening` und `dragOffset` in `src/lib/opening-placement.ts` mit optionalem Einrasten und Rückgabe des Ziels. Tests in `opening-placement.test.ts`:
  - Fenster bei x = 245 cm (Toleranz 8 cm) → 190–310
  - mit `snap = false` → 185–305
  - Tür 160 cm, Zug −154 cm → 0
  - Fenster B 300, Zug −127 cm neben A (50–170) → 170
  - Tür 160 cm, Zug +37 cm → 195 (kein Rastpunkt in Reichweite)
  - bisherige Tests unverändert grün

  Prüfen mit `npm test`.

## 3. Store

- [x] 3.1 `insertOpening` in `src/store/app-store.ts` mit `snap` und `snapToleranceCm`. Tests in `app-store.test.ts`:
  - Klick bei x = 245 cm mit Zoom 100 % → mittiges Fenster
  - mit Umschalt → 185 cm
  - Zoom 50 %, Klick bei x = 236 cm → mittig

  Prüfen mit `npm test`.

## 4. Oberfläche

- [x] 4.1 Umschalttaste als Ref (Verallgemeinerung von `useAltKeyRef`). Ziehen in `OpeningNode` mit Rastzielen und Markierung, Markierung endet beim Loslassen. Prüfen im Browser (manuell) gegen „Bündig an die Ecke ziehen“, „Fensterband“, „Tür verschieben“, „Am Kantenende“ und „Markierung endet mit dem Ziehen“, dazu Ziehen mit Umschalt (kein Einrasten) und mit Alt (1 cm, Rastpunkte weiter aktiv).
- [x] 4.2 Setzen per Klick mit Umschalt-Info und Hover-Markierung mit aktivem Werkzeug „Tür“, „Fenster“ oder „Durchgang“. Prüfen im Browser (manuell) gegen „Fenster mittig setzen“, „Toleranz hängt vom Zoom ab“, „Ohne Rastpunkte“, „Ziehen ohne Rastpunkte“, „Markierung beim Überfahren“, „Tür in die obere Wand“ und „Klick nahe der Ecke“.

## 5. Dokumentation

- [x] 5.1 Die Zeile „Türen und Fenster“ in `docs/design/README.md` ergänzen: Rastpunkte (Mitte, Ecken, Nachbar), 8 Bildschirmpixel, Vorrang vor dem Raster, Umschalt schaltet ab, Markierung quer zur Wand in `--selection`. Prüfen, dass die Zeile zu design.md passt.

## 6. Abschluss

- [x] 6.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien von `specs/room-openings/spec.md` dieses Changes. `npm run lint` ohne neue Warnungen.
- [x] 6.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
