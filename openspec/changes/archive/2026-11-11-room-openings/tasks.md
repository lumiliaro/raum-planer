# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `floors-in-plan`, `floor-underlay` und `floor-rooms` umgesetzt und archiviert sind und `PLAN_SCHEMA_VERSION` 4 ist (`RoomSchema`, `roomsByFloor`, `selectedRoomId`, Raum-Panel mit Kantenfeldern, Werkzeug „Raum“ mit G). Danach prüfen, welche Anforderungen in `openspec/specs/plan-data/spec.md` eine Formatversion nennen („Aufbau des Plans“, „Räume im Plan“), und sie in `specs/plan-data/spec.md` dieses Changes als MODIFIED auf Version 5 bzw. ohne feste Nummer angleichen. Prüfen mit `openspec validate room-openings --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `OpeningSchema` in `src/lib/plan-schema.ts`, `RoomSchema.openings` mit Passprüfung (Kante vorhanden, Abstand + Breite ≤ Kantenlänge), planweit eindeutige Öffnungs-IDs in `PlanSchema`, `PLAN_SCHEMA_VERSION = 5`, Typen `Opening`/`OpeningPatch`, plus Tests in `plan-schema.test.ts`:
  - Tür 80 cm mit Abstand 160 cm auf einer 500 cm langen Kante gültig
  - Fenster 120 cm mit Abstand 400 cm ungültig
  - fünfte Kante bei 4 Ecken ungültig
  - Fenster mit Aufschlag ungültig
  - Tür ohne Aufschlag (`swing: null`) ungültig
  - Breite 0 cm ungültig
  - doppelte Öffnungs-ID in zwei Räumen ungültig

  Prüfen mit `npm test`.
- [x] 2.2 `src/lib/__fixtures__/plan-v4.json` einfrieren: Version 4, zwei Etagen, je ein Raum mit 4 bzw. 6 Ecken ohne `openings`, dazu einige Formen und eine Vorlage. Die Datei muss das v4-Schema aus `floor-rooms` bestehen; dafür vor dem Hochzählen von 2.1 einmal prüfen oder die Datei aus einem v4-Export erzeugen. Migration `PLAN_MIGRATIONS[4]` in `src/lib/plan-migration.ts` plus Tests in `plan-migration.test.ts`:
  - Jeder Raum bekommt `openings: []`.
  - Vorhandene Felder bleiben.
  - Kein Raum-Objekt → unverändert.
  - Für jede Version 1…4 gibt es eine Migration.
  - Die Fixture wird über `analyzePlanFile` ohne ungültige Einträge zu Version 5.

  Prüfen mit `npm test`.

## 3. Geometrie

- [x] 3.1 `src/lib/opening-geometry.ts` (`edgeFrame`, `leftDistanceCm`, `offsetFromLeftDistance`, `hingeFromSide`, `sideFromHinge`, `openingGap`, `doorLeaf`, `windowSymbol`, Konstante `OPENING_CUT_DEPTH_CM`) plus `opening-geometry.test.ts`:
  - Rechteck (0|0)–(500|400) im und gegen den Uhrzeigersinn: `outward` der oberen Kante zeigt nach −y, linke Ecke ist x = 0 cm. Bei der unteren Kante ist die linke Ecke x = 500 cm.
  - Abstand-Umrechnung hin und zurück
  - Türblatt nach innen und außen mit Anschlag links und rechts: Endpunkte in cm
  - Lücke reicht von −1 cm bis +40 cm
  - Fenster-Rechteck 15 cm tief

  Prüfen mit `npm test`.
- [x] 3.2 `src/lib/opening-placement.ts` (`nearestRoomEdge`, `createOpening`, `dragOffset`, Standardbreiten) plus `opening-placement.test.ts`:
  - Klick 5 cm außerhalb der oberen Kante → Kante 0, t = Klick-x
  - Klick in der Raummitte → `null`
  - zwei Räume 12 cm auseinander → die nähere Kante gewinnt
  - Tür bei x = 200 cm → Abstand 160 cm, Anschlag links, nach innen
  - Fenster bei x = 20 cm → Abstand 0 cm
  - 60 cm lange Kante → Tür 60 cm, Abstand 0 cm
  - Ziehen +37 cm bei 5-cm-Raster → +35 cm; bei 1-cm-Raster → +37 cm; Klemmen am Kantenende (Abstand 420 cm)

  Prüfen mit `npm test`.
- [x] 3.3 `src/lib/opening-reanchor.ts` (`reanchorOpenings`) plus `opening-reanchor.test.ts`:
  - Kante 1 von 500 auf 520 cm: Fenster auf Kante 3 bleibt bei x = 280 bis 400 cm
  - Tür auf Kante 1 bleibt beim Verlängern
  - Verkürzen von Kante 1 auf 200 cm mit Tür bis 240 cm → Fehler mit Kante 0 und Art „door“
  - Verschieben des ganzen Raums lässt alle Abstände gleich
  - Raum ohne Öffnungen → ok

  Prüfen mit `npm test`.

## 4. Plan-Operationen und Store

- [x] 4.1 `addOpening`, `updateOpening`, `removeOpening` in `src/lib/plan.ts`. Die Eckpunkt-Änderung von Räumen (aus `floor-rooms`) ruft `reanchorOpenings` auf. Tests in `plan.test.ts`:
  - Hinzufügen setzt `updatedAt`.
  - Eine ungültige Öffnung und eine doppelte ID werden abgelehnt (gleiches Objekt).
  - Ändern behält die Reihenfolge.
  - Löschen entfernt nur die eine Öffnung.
  - Kantenänderung mit passender Tür verschiebt den Abstand wie in 3.3.
  - Kantenänderung mit nicht mehr passender Tür → gleiches Objekt.
  - Raum löschen entfernt seine Öffnungen.
  - Unveränderte Räume bleiben per Referenz gleich.

  Prüfen mit `npm test`.
- [x] 4.2 Store in `src/store/app-store.ts`: `selectedOpeningId`, `selectSelectedOpening`, sich gegenseitig ausschließende Auswahl von Form, Raum und Öffnung, Werkzeuge `door-opening`/`window` in `ActiveTool` und `isToolEnabled` (mindestens ein Raum, kein Kalibrier-Modus), `insertOpening`, `updateOpening`, `removeOpening`, Löschen der ausgewählten Öffnung. Tests in `app-store.test.ts`:
  - Einsetzen wählt die Öffnung aus und schaltet auf „Auswählen“.
  - Klick ohne Kante setzt nichts, und das Werkzeug bleibt.
  - Etage ohne Raum → Werkzeug gesperrt.
  - Auswahl einer Form hebt die Öffnungsauswahl auf und umgekehrt.
  - Löschen hebt die Auswahl auf.
  - Autosave speichert Öffnungen (Fake-Timer).

  Prüfen mit `npm test`.
- [x] 4.3 Verlauf: `resolveHistoryFocus` in `src/lib/plan-diff.ts` um den Öffnungs-Fokus erweitern, `src/store/history.ts` setzt `selectedOpeningId`. Tests in `plan-diff.test.ts` und `app-store.test.ts`:
  - Tür im Erdgeschoss verschoben, ins Obergeschoss gewechselt, Strg+Z → Erdgeschoss aktiv, Tür ausgewählt.
  - Setzen rückgängig → nichts ausgewählt.
  - Kantenänderung eines Raums rückgängig → Raum ausgewählt (Regel aus `floor-rooms` bleibt).

  Prüfen mit `npm test`.

## 5. Panel-Logik

- [x] 5.1 `src/lib/opening-fields.ts` (`applyOpeningWidth`, `applyOpeningLeftDistance`) plus `opening-fields.test.ts`:
  - Breite 90 cm bei Abstand 160 cm auf 500 cm → ok, Abstand bleibt 160 cm.
  - Breite 400 cm → „Darf höchstens 340 cm sein“.
  - „0“ → „Muss größer als 0 cm sein“.
  - „abc“ → `NOT_A_NUMBER`.
  - Abstand bei Öffnung, deren linkes Ende das Kantenende ist (untere Kante), ergibt den richtigen `offsetCm`.
  - Komma und Punkt, Rundung auf 0,1 cm.

  Prüfen mit `npm test`.
- [x] 5.2 Hinweis für Kantenfelder: Die Feldlogik der Kantenlänge aus `floor-rooms` meldet bei nicht passender Öffnung „Geht nicht: Tür auf Kante n passt nicht mehr“ bzw. „… Fenster …“. Test in der zugehörigen Testdatei aus `floor-rooms`. Prüfen mit `npm test`.

## 6. Import und Export

- [x] 6.1 `describeOpeningIssue` in `src/lib/shape-issues.ts` und `formatOpeningCount` in `src/lib/format.ts` plus Tests:
  - „Kante unbekannt“, „passt nicht auf die Kante“, „Breite ungültig“, „Aufschlag fehlt“, „Aufschlag ungültig“, „Art unbekannt“
  - „7 Türen und 4 Fenster“, „1 Tür und 1 Fenster“, „0 Türen und 2 Fenster“

  Prüfen mit `npm test`.
- [x] 6.2 `analyzePlanFile` in `src/lib/plan-import.ts`: Öffnungen je Raum einzeln prüfen, `invalidOpenings`, `reassignedOpeningIds`, `openingCounts`, `hasWarnings`. Tests in `plan-import.test.ts`:
  - Fenster 120 cm mit Abstand 100 cm auf 180 cm Kante in „Bad“ → gemeldet, Raum ohne Fenster übernommen.
  - Tür auf achter Kante → „Kante unbekannt“.
  - Fehlendes `openings` → leere Liste, keine Warnung.
  - `openings` kein Array → ein Eintrag, Raum übernommen.
  - Doppelte Fenster-ID → neue ID, Zähler 1.
  - Tür ohne `swing` bzw. mit `swing: null` → „Aufschlag fehlt“, Raum ohne diese Tür übernommen.
  - Rundreise Export → Import mit Tür (Anschlag links, öffnet nach außen) und Fenster 120 cm ohne Warnung.
  - Möbel-Tür (`door-swing`, 80 cm) wird unverändert übernommen.
  - Neuere Version 6 mit unbekannter Öffnungsart → gemeldet.

  Prüfen mit `npm test`.
- [x] 6.3 `ImportDialog`: Zeile „7 Türen und 4 Fenster werden übernommen“ (nur wenn die Datei Räume hat), Liste ungültiger Öffnungen („Fenster in „Bad“ (Obergeschoss): passt nicht auf die Kante“), Zahl neuer IDs. Prüfen im Browser (manuell) mit einer von Hand angepassten Kopie der Fixture.

## 7. Oberfläche

- [x] 7.1 Möbel-Werkzeug „Tür“ entfernen und neue Werkzeuge eintragen:
  - `door-swing` aus `TOOLS`, `InsertableKind` und `createShape` (`shape-factory.ts`) entfernen.
  - Umriss, `ShapeNode`, Größenänderung, Panel und Schema für `door-swing` bleiben.
  - Icon `WindowIcon` neu, `DoorIcon` für das neue Werkzeug wiederverwenden oder anpassen.
  - Einträge „Tür“ (ID `door-opening`, Taste T, Tooltip „Tür – in der Raumwand (T)“) und „Fenster“ (F, „Fenster (F)“) direkt unter „Raum“ in `tools.ts`.
  - Sperr-Tooltip „… – zuerst einen Raum zeichnen“ in `toolTooltip`.
  - Tests in `tools.test.ts`, `shape-factory.test.ts`, `app-store.test.ts`: T wählt `door-opening`; kein Werkzeug fügt `door-swing` ein; eine vorhandene Möbel-Tür lässt sich auswählen und die Breite ändern.

  Prüfen mit `npm test` und im Browser (manuell): Etage ohne Raum → beide gesperrt, Tasten wirkungslos. Die Werkzeugleiste zeigt unter „Ellipse“ nur noch L-Form, U-Form und Ecke. Eine Möbel-Tür aus einem älteren Plan ist sichtbar und bearbeitbar.
- [x] 7.2 Lücken: `destination-out`-Vierecke in der Wandband-Gruppe aus `floor-rooms`. Prüfen im Browser (manuell):
  - Tür zwischen zwei Räumen mit 12 cm Abstand: beide Bänder offen.
  - Fenster mit sichtbarer Vorlage: Vorlage in der Lücke zu sehen, keine weiße Fläche.
  - Raum ziehen: Lücken wandern mit.
  - Kalibrier-Modus: alles ausgeblendet.
- [x] 7.3 `OpeningsLayer`/`OpeningNode` über den Raumflächen und unter den Möbeln: Türblatt durchgezogen, Aufschlag gestrichelt `[6, 4]`, Fenster-Rechteck mit Mittellinie, Auswahl in `--selection`. Klick wählt aus (Möbel darüber haben Vorrang), Ziehen entlang der Kante mit `dragOffset` (Alt = 1 cm), ein Schritt je Zug. Einsetzen per Klick mit aktivem Werkzeug, Einfüge-Cursor nur über einer Kante oder ihrem Band. Prüfen im Browser (manuell) gegen die Szenarien „Tür in die obere Wand“, „Klick nahe der Ecke“, „Kurze Kante“, „Klick in den Raum“, „Esc bricht ab“, „Tür verschieben“, „Am Kantenende“, „Fenster anklicken“.
- [x] 7.4 `OpeningProperties` im `PropertiesPanel`: Kopf (Icon, „Tür“/„Fenster“, Raumname, „Löschen“), Felder „Breite“ und „Abstand zur linken Ecke“, bei Türen „Aufschlag“ (Nach innen / Nach außen) und „Anschlag“ (Links / Rechts), aktuelle Wahl markiert. Entf und Rücktaste in `useShapeShortcuts` löschen die Öffnung, nicht in Textfeldern. Prüfen im Browser (manuell) gegen „Breite ändern“, „Zu breit“, „Nach außen“, „Anschlag wechseln“, „Fenster löschen“, „Raum wird breiter“, „Tür passt nicht mehr“, „Raum verschieben“, „Tür verschieben rückgängig“, „Setzen rückgängig“.

## 8. Dokumentation

- [x] 8.1 `docs/design/README.md`, Bedienentscheidungen: Zeile „Türen und Fenster“ ergänzen:
  - Werkzeuge D/F unter „Raum“
  - Einsetzen per Klick auf Kante oder Band, Tür 80 cm nach innen mit Anschlag links, Fenster 120 cm
  - Ziehen entlang der Kante im 5-/1-cm-Raster
  - Panel-Felder „von innen gesehen“
  - Lücke ohne Hintergrundfläche, 40 cm tief
  - Abstand zum liegengebliebenen Kantenende bei Raumänderungen, Ablehnung, wenn eine Öffnung nicht mehr passt
  - Möbel-Werkzeug „Tür“ entfällt, T setzt eine Tür in die Raumwand. Vorhandene Möbel-Türen bleiben bearbeitbar.
  - Zeile „Formen einfügen“ ohne die Tür (Standardmaße, Stil „nur Rand“)

  Prüfen, dass die Zeile zu design.md passt.

## 9. Abschluss

- [x] 9.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien in `specs/room-openings/spec.md`, `specs/plan-import/spec.md`, `specs/plan-export/spec.md` und `specs/plan-data/spec.md`; zusätzlich Neuladen (Öffnungen bleiben) und Import einer v4-Datei. `npm run lint` ohne neue Warnungen.
- [x] 9.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `editing-extras` → `floors-in-plan` → `floor-underlay` → `floor-rooms` → `room-openings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
