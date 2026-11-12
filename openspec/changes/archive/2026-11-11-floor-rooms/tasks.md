# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `editing-extras`, `floors-in-plan` und `floor-underlay` umgesetzt und archiviert sind: `PLAN_SCHEMA_VERSION` ist 3, `plan.floors` existiert, die Zeichenfläche arbeitet in cm, `openspec/specs/edit-history` und `openspec/specs/floor-management` existieren. Prüfen, ob `src/lib/__fixtures__/plan-v3.json` existiert (sonst in 2.4 anlegen). Prüfen mit `npm test` und `ls openspec/specs`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/room-geometry.ts` mit `edgeLengthsCm`, `hasNoZeroEdges`, `segmentsIntersect`, `isSimplePolygon`, `boundsCm`, `containsPoint`, `labelPointCm`, `translatePoints` plus `room-geometry.test.ts`:
  - Rechteck 337,5 × 560 cm: Kantenlängen 337,5/560/337,5/560
  - Schleife (0,0),(300,300),(300,0),(0,300) ist nicht einfach
  - Rückläufer auf derselben Linie ist nicht einfach
  - L-Form ist einfach
  - doppelter Punkt → `hasNoZeroEdges` falsch
  - `labelPointCm` liegt bei Rechteck und L-Form im Raum
  - `boundsCm` und `translatePoints` stimmen

  Prüfen mit `npm test`.
- [x] 2.2 `setEdgeLength` in `room-geometry.ts` plus Tests:
  - Rechteck: Kante 1 auf 350 cm → Kante 3 ebenfalls 350 cm, Winkel bleiben 90°
  - Dreieck (0,0),(300,0),(0,400), Kante 1 auf 400 cm → (0,0),(400,0),(100,400)
  - L-Form aus der Spec, Kante 1 von 400 auf 280 cm → `too-short` mit Kante 3
  - Änderung, die eine Schleife erzeugt → `intersects`
  - letzte Kante (Index n−1) verschiebt die Punkte 0 und 1
  - Ergebnis auf 0,1 cm gerundet

  Prüfen mit `npm test`.
- [x] 2.3 `RoomSchema` und `PlanSchema` v4 (`roomsByFloor`, Schlüssel = Etagen-IDs, planweit eindeutige Raum-IDs) in `src/lib/plan-schema.ts`, `PLAN_SCHEMA_VERSION = 4`, `createEmptyPlan` mit leerer Raumliste, plus Tests in `plan-schema.test.ts` gegen die Szenarien „Gültiger Raum“ (`specs/floor-rooms`) und „Räume im Plan“ (`specs/plan-data`). Prüfen mit `npm test`.
- [x] 2.4 Migration `PLAN_MIGRATIONS[3]` in `src/lib/plan-migration.ts` plus Tests:
  - v3-Fixture → v4 mit leerer Raumliste je Etage, sonst unverändert
  - v1-Fixture importiert über alle Schritte bis v4
  - fehlende/kaputte `floors` → `roomsByFloor` `{}`, Schema entscheidet
  - für jede Version 1 … `PLAN_SCHEMA_VERSION − 1` gibt es einen Eintrag

  Falls nötig `__fixtures__/plan-v3.json` einfrieren. Laden aus dem Browser-Speicher mit einem v3-Plan in `plan-storage.test.ts` prüfen. Prüfen mit `npm test`.
- [x] 2.5 Raum-Operationen in `src/lib/plan.ts` (`addRoom`, `updateRoom`, `moveRoom`, `removeRoom`, `nextRoomName`; `removeFloor` entfernt die Raumliste) plus Tests in `plan.test.ts`:
  - Raum hinzufügen liegt oben
  - doppelte ID oder ungültiger Raum → dasselbe Objekt
  - Umbenennen trimmt, leer → abgelehnt
  - `moveRoom` verschiebt alle Punkte, Formen unverändert
  - `updatedAt` gesetzt
  - `nextRoomName` mit „Raum 1“, „Raum 3“ vorhanden → „Raum 2“
  - Etage löschen entfernt ihre Räume

  Prüfen mit `npm test`.

## 3. Zeichnen-Logik

- [x] 3.1 `src/lib/room-drawing.ts` mit `roundPointCm`, `snapDirection`, `pointAtDistance`, `snapToCorner`, `canAppendPoint`, `canClose` plus `room-drawing.test.ts`:
  - (100,100) → Zeiger (430,108) ergibt waagerecht (430,100)
  - frei → unverändert
  - Abstand 0 → `null`
  - 337,5 cm nach rechts → (337,5; 0)
  - Einrasten innerhalb des Radius, außerhalb nicht, nächste Ecke gewinnt
  - kreuzende Kante und 0-cm-Kante → `canAppendPoint` falsch
  - `canClose` erst ab 3 Punkten und nur ohne Überschneidung der Schlusskante

  Prüfen mit `npm test`.

## 4. Store und Verlauf

- [x] 4.1 `src/store/app-store.ts`:
  - `selectedRoomId`, `selectRoom`, `selectSelectedRoom`, gegenseitiges Zurücksetzen mit `selectShape`
  - `ActiveTool` um „room“ erweitert, `isToolEnabled`
  - `roomDraft` mit `addDraftPoint`, `removeLastDraftPoint`, `setDraftLength`, `commitDraftLength`, `closeDraft`, `cancelDraft`
  - `updateRoom`, `moveRoom`, `removeRoom`, `deleteSelectedRoom`
  - Etagenwechsel, Werkzeugwechsel, Kalibrier-Modus und Import verwerfen Draft und Raum-Auswahl

  Tests in `app-store.test.ts`:
  - Raum zeichnen und schließen ergibt genau einen Rückgängig-Schritt, der Raum ist ausgewählt, das Werkzeug ist „select“
  - Draft-Punkte erzeugen keinen Schritt
  - `selectShape` hebt `selectedRoomId` auf und umgekehrt
  - Etagenwechsel verwirft den Draft

  Prüfen mit `npm test`.
- [x] 4.2 `src/lib/plan-diff.ts` (`sameContent` mit Räumen, `resolveHistoryFocus` mit `roomId`) und `src/store/history.ts` (setzt `selectedRoomId`) plus Tests:
  - verschobenen Raum auf anderer Etage rückgängig → Etage aktiv, Raum ausgewählt, keine Form ausgewählt
  - gelöschten Raum wiederholen → nichts ausgewählt

  Prüfen mit `npm test`.

## 5. Import

- [x] 5.1 `describeRoomIssue` in `src/lib/shape-issues.ts` plus Tests:
  - Name fehlt → „Name fehlt“
  - 2 Eckpunkte → „Weniger als 3 Eckpunkte“
  - Schleife → „Umriss überschneidet sich“
  - doppelter Punkt → „Kante mit 0 cm“
  - unbekannt → „Angaben ungültig“

  Prüfen mit `npm test`.
- [x] 5.2 `analyzePlanFile` um Räume erweitern (`roomCountsByFloor`, `invalidRooms`, Raum-Namen bei `unknownFloors`, `reassignedRoomIds`, `hasWarnings`) plus Tests in `plan-import.test.ts` gegen `specs/plan-import`:
  - 5 + 3 Räume gezählt
  - überschneidender „Abstellraum“ gemeldet
  - „Waschküche“ unter „kg“ gemeldet
  - doppelte Raum-ID neu vergeben
  - Datei ohne `roomsByFloor` → leere Listen ohne Warnung
  - v3-Datei → „older“, umgewandelt
  - Rundreise Export → Import mit Räumen ohne Warnung und gleich

  Prüfen mit `npm test`.

## 6. Oberfläche

- [x] 6.1 `RoomsLayer` (Wand-Ebene mit `destination-out`, Flächen-Ebene mit Namen und Auswahl-Umriss) in `FloorCanvas` zwischen Vorlage und Formen, im Kalibrier-Modus ausgeblendet. Prüfen im Browser (manuell) mit zwei von Hand angelegten Räumen (über die Konsole oder nach 6.3):
  - Wandband 15 cm außen
  - Lücke von 11,5 cm vollständig gefüllt
  - kein Band im Inneren
  - Vorlage im Raum sichtbar
  - Möbel liegen darüber
  - Namen in fester Größe beim Zoomen
- [x] 6.2 Werkzeug „Raum“ in `tools.ts` und `ToolBar` (Taste G, Tooltip „Raum – Innenmaße nachzeichnen (G)“, Fadenkreuz), plus Test in `tools.test.ts` (`toolForKey("g")`, Tooltip). Prüfen mit `npm test` und im Browser: G wählt das Werkzeug, im Kalibrier-Modus gesperrt.
- [x] 6.3 `RoomDraftLayer` und Tastaturbehandlung bei aktivem Draft (Ziffern/Komma/Punkt, Enter, Rücktaste, Esc, Umschalt über `useShiftKeyRef`; Strg+Z wirkungslos). Prüfen im Browser (manuell) gegen „Kanten zeichnen“, „Länge eintippen“, „Eckpunkte einrasten“, „Raum schließen“ und „Zeichnen korrigieren und abbrechen“ in `specs/floor-rooms`:
  - Wohnzimmer mit 337,5 / 560 / 337,5 tippen und am Start schließen → „Raum 1“ ausgewählt
  - zweiten Raum an einer Ecke des ersten ansetzen
  - Umschalt für freien Winkel
  - kreuzende Kante bleibt rot und wird nicht gesetzt
  - Etagenwechsel verwirft
- [x] 6.4 Auswählen und Verschieben von Räumen in `FloorCanvas` (Klick-Reihenfolge Anfasser → Form → Raum → leer; nur der ausgewählte Raum ist ziehbar, 5-cm/1-cm-Raster über `snapDelta`; `Entf` löscht). Prüfen im Browser (manuell) gegen „Raum auswählen“, „Raum verschieben“, „Raum löschen“ und `specs/shape-editing` „Auswahl aufheben“:
  - Ziehen auf nicht ausgewähltem Raum verschiebt die Ansicht
  - Diele 23 cm ziehen → 25 cm bzw. mit Alt 23 cm
  - Möbel bleiben liegen
- [x] 6.5 `RoomProperties` mit `EdgesSection` und Hervorhebung der fokussierten Kante; `PropertiesPanel`-Leertext „Wähle eine Form oder einen Raum aus“. Prüfen im Browser (manuell) gegen „Eigenschaften eines Raums“, „Kantenlänge ändern“ und `specs/workspace-layout`:
  - Rechteck Kante 1 → 350 cm
  - L-Form-Fall zeigt „Geht nicht: Kante 3 würde zu kurz“
  - Name leer → Hinweis
  - Esc setzt Feld zurück
- [x] 6.6 `ImportDialog` mit Raum-Zeilen und ungültigen Räumen; `FloorsDialog`-Rückfrage mit Räumen; Einpassen mit Räumen. Prüfen im Browser (manuell):
  - Datei mit 5/3 Räumen und überschneidendem Raum → Zeilen und „Trotzdem importieren“
  - Etage nur mit Räumen löschen fragt nach
  - `0` passt auf zwei Räume ohne Vorlage ein
- [x] 6.7 Rückgängig im Browser (manuell) gegen `specs/edit-history`:
  - Raum zeichnen, verschieben, umbenennen, Kante ändern, löschen → je ein Strg+Z
  - Etage und Auswahl springen richtig

## 7. Dokumentation

- [x] 7.1 `docs/design/README.md`, Bedienentscheidungen: Zeile „Räume“ ergänzen.
  - Werkzeug G und Zeichnen mit Einrasten und getippter Länge
  - Wandband 15 cm außen, halbtransparentes Inneres
  - Auswahl mit Klick, nur ausgewählte Räume ziehbar
  - Regel zum Ändern von Kantenlängen
  - Esc/Rücktaste

  Prüfen, dass die Zeile zu design.md passt.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien in `specs/floor-rooms/spec.md` und den Deltas. `npm run lint` ohne neue Warnungen.
- [x] 8.2 `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Vor dem Archivieren: `floors-in-plan` und `floor-underlay` sind archiviert. In `openspec/specs/plan-data/spec.md` die Formatversion in „Aufbau des Plans“ an „Räume im Plan“ (Version 4) angleichen, falls der Archiv-Lauf das nicht abdeckt.
- `room-openings` baut auf diesem Change auf (Version 5, Öffnungen auf Raumkanten, Verhalten beim Ändern von Kantenlängen).
