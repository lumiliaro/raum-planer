# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `room-openings` archiviert ist und `PLAN_SCHEMA_VERSION` 5 ist. Die MODIFIED-Anforderungen dieses Changes mit dem aktuellen Wortlaut in `openspec/specs/{floor-rooms,room-openings,plan-data,edit-history}/spec.md` vergleichen und bei Abweichungen angleichen. Prüfen mit `openspec validate wall-thickness --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v5.json` einfrieren: Version 5, zwei Etagen, ein Rechteckraum mit Tür und Fenster und ein L-Raum, dazu einige Formen. Die Datei muss das aktuelle v5-Schema bestehen. Das vor dem Hochzählen in 2.2 einmal prüfen, z. B. mit einem Export der App. Prüfen mit einem Test, der die Datei mit dem v5-Stand von `PlanSchema` liest.
- [x] 2.2 `DEFAULT_WALL_THICKNESS_CM = 15` (Umbenennung von `WALL_THICKNESS_CM`) und `MAX_WALL_THICKNESS_CM = 100` in `src/lib/room-geometry.ts`. `RoomSchema.wallThicknessCm` mit Längenprüfung und `PLAN_SCHEMA_VERSION = 6` in `src/lib/plan-schema.ts`. Tests in `plan-schema.test.ts`:
  - vier Kanten mit 36,5/11,5/11,5/15 cm gültig
  - 120 cm ungültig
  - 0 cm ungültig
  - drei Werte bei vier Kanten ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[5]` in `src/lib/plan-migration.ts`. Tests in `plan-migration.test.ts`:
  - Jeder Raum bekommt 15 cm je Eckpunkt.
  - Ein vorhandenes Feld bleibt.
  - Ein Raum ohne `pointsCm`-Liste bleibt unverändert.
  - Für jede Version 1…5 gibt es eine Migration.
  - Die Fixture wird über `analyzePlanFile` ohne Warnung zu Version 6.

  Prüfen mit `npm test`.
- [x] 2.4 Alle Stellen, die Räume erzeugen, ergänzen: Raum aus dem Zeichen-Entwurf in `app-store.ts` und Testhelfer bzw. Fixtures von Räumen in Tests. Prüfen mit `npm test` (keine Schema-Fehler in bestehenden Tests).

## 3. Geometrie

- [x] 3.1 `wallBandOutline(points, thicknesses)` in `src/lib/room-geometry.ts` (Gehrung, Stufe bei parallelen Nachbarkanten, Abschrägung über 2 × max. Dicke) plus Tests in `room-geometry.test.ts`:
  - Rechteck in beiden Umlaufrichtungen mit 15 cm
  - oben 36,5 cm, links 15 cm → Ecke (−15 cm, −36,5 cm)
  - L-Raum mit konkaver Ecke
  - kollineare Punkte mit 15/24 cm → Stufe
  - spitzes Dreieck → Abschrägung
  - 100 cm an einer 20-cm-Kante → keine `NaN`

  Prüfen mit `npm test`.
- [x] 3.2 `windowSymbol` und `openingGap` in `src/lib/opening-geometry.ts` mit Parameter `thicknessCm`. Tests in `opening-geometry.test.ts`:
  - Fenster bei 15 cm → 15 cm tief
  - Fenster bei 36,5 cm → 36,5 cm tief, Mittellinie bei 18,25 cm
  - Lücke bei 15 cm → bis 40 cm
  - Lücke bei 60 cm → bis 60 cm

  Prüfen mit `npm test`.
- [x] 3.3 `nearestRoomEdge` in `src/lib/opening-placement.ts` mit der Dicke je Kante. Test in `opening-placement.test.ts`: Ein Klick 30 cm außerhalb einer Kante mit 36,5 cm trifft, bei 15 cm (und 10 px Toleranz bei Zoom 100 %) nicht. Prüfen mit `npm test`.
- [x] 3.4 `floorContentBounds` in `src/lib/content-bounds.ts` über `wallBandOutline`. Test in `content-bounds.test.ts`: Ein Raum mit 36,5 cm oben reicht in der Box bis y = −36,5 cm. Prüfen mit `npm test`.

## 4. Plan-Operationen, Feldlogik und Verlauf

- [x] 4.1 `RoomPatch.wallThicknessCm` in `src/lib/plan.ts`. Tests in `plan.test.ts`:
  - Dicke ändern setzt `updatedAt`.
  - Ecken und Öffnungen bleiben gleich.
  - 0 cm bzw. falsche Länge → gleiches Objekt.

  Prüfen mit `npm test`.
- [x] 4.2 `applyWallThicknessField` in `src/lib/room-fields.ts`. Tests in `room-fields.test.ts`:
  - „36,5“ → Liste mit 36,5 an Index 0
  - „0“ → „Muss größer als 0 cm sein“
  - „150“ → „Darf höchstens 100 cm sein“
  - „abc“ → `NOT_A_NUMBER`
  - unveränderter Wert → `null`
  - Rundung auf 0,1 cm

  Prüfen mit `npm test`.
- [x] 4.3 Verlauf: `resolveHistoryFocus` in `src/lib/plan-diff.ts` verallgemeinern. Der Raum ist der Fokus, sobald sich ein Feld außer `openings` ändert (siehe design.md, Abschnitt 5). Tests:
  - `plan-diff.test.ts`: reine Dickenänderung → Raum-Fokus, reine Öffnungsänderung → Öffnungs-Fokus
  - `app-store.test.ts`: Wanddicke von „Wohnen“ ändern, „Flur“ auswählen, Strg+Z → 15 cm, „Wohnen“ ausgewählt

  Prüfen mit `npm test`.

## 5. Import und Export

- [x] 5.1 Bereinigung der Wanddicken in `readRoom` (`src/lib/plan-import.ts`), Liste `wallIssues`, `hasWarnings`, Text in `ImportDialog`. Tests in `plan-import.test.ts`:
  - 250 cm in „Bad“ → Eintrag, alle Kanten 15 cm
  - 4 Werte bei 6 Kanten → Kanten 5 und 6 bekommen 15 cm, Eintrag
  - zu viele Werte → abgeschnitten, Eintrag
  - Rundreise Export → Import mit 36,5/15/15/36,5 ohne Warnung
  - v5-Datei → keine Warnung

  Prüfen mit `npm test` und im Browser (manuell) mit einer von Hand geänderten Exportdatei.

## 6. Oberfläche

- [x] 6.1 `RoomsLayer`: Bänder als gefüllte `wallBandOutline`-Polygone statt Strich, Lücken mit Dicke der Kante, Mitziehen beim Verschieben. `OpeningsLayer`: Fenstersymbol und Trefferfläche mit Dicke der Kante. Prüfen im Browser (manuell) gegen „Zwei Räume mit Lücke“, „Dicke Außenwand“, „Sehr dicke Wand“, „Fenster in dicker Außenwand“ und „Vorlage durchscheinend“, dazu einen v5-Plan (sieht unverändert aus) und Kalibrier-Modus (ausgeblendet).
- [x] 6.2 `RoomProperties` → `EdgesSection`: Zeile je Kante mit „Kante n“ und „Wand“ (Label „Wand an Kante n“), Hervorhebung bei Fokus auf beide Felder, Übernahme mit Enter oder beim Verlassen. Prüfen im Browser (manuell) gegen „Panel eines Rechtecks“, „Wandfeld hebt Kante hervor“, „Außenwand“, „Null“, „Zu dick“, „Wanddicke rückgängig“.

## 7. Dokumentation

- [x] 7.1 `docs/design/README.md`:
  - Zeile „Räume“: Wanddicke je Kante, Standard 15 cm, Feld „Wand“, Gehrung an Ecken
  - Zeile „Türen und Fenster“: Fenster so tief wie die Wand, Lücke mindestens so tief wie die Wand

  `openspec/config.yaml`, Kontext:
  - „Bewusst einfach“: „keine Wanddicken“ ersetzen durch „Wanddicke je Raumkante, aber keine eigenen Wandobjekte und keine Wandverbindungen“
  - Datenmodell: `Room` mit `wallThicknessCm`

  Prüfen, dass beide Stellen zu design.md passen und `openspec validate wall-thickness --strict` weiter fehlerfrei läuft.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Specs dieses Changes, dazu Neuladen (Wanddicken bleiben) und Import der Fixture v5. `npm run lint` ohne neue Warnungen.
- [x] 8.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `room-openings` → `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
