# Design

## Context

- **Stand nach `basic-shapes`** (umgesetzt, archiviert):
  - `PropertiesPanel` zeigt bei Auswahl `ShapeSummary`, eine schreibgeschützte Übersicht mit Kopf (Icon, Formtyp, „Löschen“) und den Abschnitten „Maße“ und „Lage“. Die Formtyp-Namen stehen fest in `ShapeSummary.tsx`.
  - Der Store hat `selectSelectedShape`, `updateShape(floorId, id, patch)` (Rückgabe `true`/`false`, das Zod-Schema prüft) und `deleteSelectedShape`.
  - `ShapeNode` zeichnet eine `Group` mit `rotation = rotationDeg` und darin eine geschlossene `Line` aus `getOutlineCm`. `fill: null` erscheint als transparente Füllung. Beschriftungen werden noch nicht gezeichnet.
  - `applyTransform` (`src/lib/shape-transform.ts`) rastet die Drehung über `snapRotationDeg` bei jedem Loslassen des Transformers ein, also auch nach einer reinen Größenänderung.
  - `isEditableTarget` sperrt Tastenkürzel für alle `INPUT`-, `TEXTAREA`- und `SELECT`-Elemente, auch für Kontrollkästchen und Schieberegler.
  - `parseLengthCm` (`src/lib/calibration.ts`) liest positive Längen mit Komma oder Punkt. Für X/Y und Drehung reicht das nicht, weil dort 0 und negative Werte erlaubt sind.
- **Design-Entwurf** (Artboard „Hauptansicht – Form ausgewählt“, Stilvorlage):
  - Kopf mit Icon, Formtyp, „Sperren“ und „Löschen“; darunter das Feld „Beschriftung“
  - „Maße“ und „Lage“ als Raster mit zwei Spalten; Eingabefelder 32 px hoch mit Einheit rechts im Feld; in „Lage“ steht „Spiegeln“ als Schaltfläche „Horizontal“
  - „Darstellung“ mit Farbfeld „Füllung“ (32 × 32 px) und „Nur Rand“, Farbfeld „Rand“ mit Randstärke in px, „Deckkraft“ als Regler mit Prozentanzeige
  - Stilvorlage: 8 Möbel-Voreinstellungen als Paare aus Füllung und Rand
- **Nachfolger** stützen sich auf dieses Formular:
  - `more-shapes`: Abschnitt „Maße“ je Formtyp, Tabelle mit Formtyp-Namen, Beschriftung über `getLabelAnchorCm`, Hinweise „Muss kleiner/größer als … cm sein“
  - `editing-extras`: Felder werden einzeln übernommen und lassen sich schreibgeschützt schalten; „Spiegeln“ gibt es
- Anforderungen: `specs/shape-properties`, `specs/workspace-layout`, `specs/shape-editing`.

## Goals / Non-Goals

**Goals:**
- Einlesen, Prüfen und Umrechnen der Feldwerte sind reine, getestete Funktionen in `src/lib/`. Die Komponenten zeigen nur an und rufen den Store.
- Eine Übernahme ergibt genau einen `updateShape`-Aufruf. Hängt ein zweiter Wert davon ab (Breite und Eckradius), kommen beide im selben Aufruf.
- Ein neuer Formtyp ergänzt das Formular nur im Abschnitt „Maße“, mit einem `case` und einer Komponente.

**Non-Goals:**
- Keine Formular-Bibliothek und kein allgemeines Formular-Framework. Die zwei kleinen Feld-Komponenten reichen.
- Keine Live-Vorschau beim Tippen oder beim Ziehen des Deckkraft-Reglers. Die Zeichenfläche ändert sich erst bei der Übernahme.

## Decisions

### 1. Feldlogik: `src/lib/shape-fields.ts`
- `parseDecimal(text): number | null`: erlaubt Vorzeichen (`-` und `−`), Komma oder Punkt und rundet auf 0,1. Leerer oder anderer Text ergibt `null`. `parseLengthCm` bleibt für die Kalibrierung unverändert.
- `applyNumberField(shape, field, text): FieldResult` mit `field` aus `"widthCm" | "depthCm" | "cornerRadiusCm" | "x" | "y" | "rotationDeg" | "strokeWidth"` und `FieldResult = { ok: true; patch: ShapePatch } | { ok: false; error: string }`:
  - keine Zahl: „Bitte eine Zahl eingeben“
  - Breite, Tiefe: > 0 cm („Muss größer als 0 cm sein“). Beim Rechteck wird ein zu großer Eckradius im selben Patch auf die halbe kürzere Seite verkleinert.
  - Eckradius: ≥ 0 cm („Darf nicht negativ sein“) und ≤ halbe kürzere Seite („Darf höchstens 30 cm sein“). Grenzen mit Gleichheit heißen „höchstens“, ausschließliche Grenzen „kleiner als“/„größer als“; dieselbe Sprache nutzt `more-shapes`.
  - X, Y: jede Zahl
  - Drehung: wird auf 0° bis unter 360° umgerechnet und auf 0,1 gerundet. 359,96 wird so zu 0. Kein Einrasten.
  - Randstärke: > 0 px und ≤ 20 px, wie im Schema
  - Gleicher Wert wie vorher: `patch = {}`. Der Aufrufer ändert dann nichts am Plan.
- `applyLabelField(text): ShapePatch`: Text getrimmt; ein leerer Text ergibt `label: undefined`.
- Die Grenzwerte im Hinweis formatiert `formatCm` bzw. eine px-Variante.
- Gegen das Schema prüft am Ende `updateShape`. Ein Test prüft für jede Grenze, dass der Wert an der Grenze vom Schema angenommen bzw. abgelehnt wird, passend zum Hinweis.
- Alternative: Prüfung allein über das Zod-Schema und dessen Fehlermeldung. Verworfen, weil die Meldungen englisch und technisch sind und die konkrete Grenze in cm fehlt.

### 2. Feld-Komponenten: `NumberField` und `TextField`
- Gesteuerte Komponenten mit eigenem Text-Zustand. Props: `label`, `unit`, `value`, `onCommit(text) → string | null` (Fehlertext oder `null`), `readOnly`.
- Übernahme bei Enter und bei `blur`. Enter lässt den Fokus im Feld. `Esc` setzt Text und Hinweis zurück und nimmt den Fokus aus dem Feld, damit ein zweites `Esc` wie gewohnt die Auswahl aufhebt.
- Abgleich mit dem Store: Hat das Feld keinen Fokus und keinen offenen Hinweis, zeigt es immer den formatierten aktuellen Wert. So stimmen die Werte nach dem Ziehen auf der Zeichenfläche. Während des Tippens bleibt der Text stehen.
- Formatierung im Feld: `formatInputNumber` (neu in `format.ts`) mit höchstens einer Nachkommastelle, Komma und ohne Tausendertrennzeichen („1000“ statt „1 000“), damit sich der Wert leicht überschreiben lässt.
- Fehlerhinweis unter dem Feld (`text-destructive`, 12 px), verbunden über `aria-invalid` und `aria-describedby`, wie im Kalibrier-Panel.
- Das Formular ist per `key={shape.id}` an die ausgewählte Form gebunden. Bei einer anderen Auswahl verschwinden offene Eingaben und Hinweise.
- Wird ein Feld verlassen, weil der Nutzer auf die Zeichenfläche klickt, kommt `blur` vor dem Klick. Die Übernahme betrifft also noch die bisher ausgewählte Form.

### 3. Aufbau des Panels (`src/components/properties/`)
- `ShapeProperties` ersetzt `ShapeSummary`. Die Abschnitte im Stil von `basic-shapes` (`<section>`, Überschrift 11/600 in Versalien, 16 px Innenabstand, Raster mit zwei Spalten):
  - Kopf: Icon, Formtyp-Name, „Löschen“; darunter `TextField` „Beschriftung“ über die volle Breite
  - `DimensionsSection`: `switch (shape.kind)` mit `never`-Prüfung
    - `rect`: Breite, Tiefe, Eckradius
    - `ellipse`: Breite, Tiefe
    - übrige Formtypen: vorerst nichts (`more-shapes` ergänzt je eine Komponente)
  - `PositionSection`: X, Y, Drehung, „Spiegeln“ als `aria-pressed`-Schaltfläche „Horizontal“ mit dem Spiegeln-Icon aus der Stilvorlage
  - `StyleSection`: Voreinstellungen, Füllung, Rand, Deckkraft (Entscheidung 5)
- Store: neue Aktion `updateSelectedShape(patch): boolean`. Sie leitet an `updateShape` für die aktive Etage und die ausgewählte Form weiter; ein leerer Patch ändert nichts und liefert `true`. Das Formular braucht so weder die Etage noch die ID, und `editing-extras` kann die Sperre an einer Stelle prüfen.
- Formtyp-Namen: `SHAPE_KIND_LABELS: Record<ShapeKind, string>` in `src/lib/shape-kinds.ts`, für alle sieben Formtypen vollständig, sodass TypeScript eine Lücke meldet. Die Icons je Formtyp liegen in einer Tabelle in der Komponente; fehlt dort ein Eintrag, erscheint das `Shapes`-Icon aus lucide (`more-shapes` ergänzt die eigenen Icons).

### 4. Beschriftung auf der Zeichenfläche
- `ShapeLabel` ist ein Konva-`Text` **innerhalb** der `Group` von `ShapeNode`. Er folgt der Form beim Ziehen ohne eigenen Code und liegt in der Zeichenreihenfolge: Eine darüberliegende Form verdeckt die Beschriftung einer darunterliegenden, wie die Form selbst.
- Lage: `getLabelAnchorCm(shape)` (neu in `src/lib/outline.ts`, `switch` mit `never`-Prüfung). Vorerst liefert sie für alle Formtypen den Mittelpunkt `(0, 0)` und wird danach wie der Umriss gespiegelt; `more-shapes` ergänzt die eigenen Stellen.
- Feste Bildschirmgröße und waagerecht: `scale = 1 / zoom`, `rotation = −rotationDeg`. Schrift Inter 12 px/500, Farbe = `style.stroke`, einzeilig, mittig über eine feste Breite von 240 Bildschirmpixeln mit `ellipsis`. Längere Texte enden mit „…“.
- `listening={false}`: Klicks gehen an die Form darunter.
- Während der Transformer an den Anfassern zieht, skaliert die `Group`. Ein `onTransform` an der `Group` gleicht deshalb die Skalierung des Textes aus (`1 / (zoom · scaleX)`), damit er nicht verzerrt.
- Alternative: Beschriftungen als eigene Ebene über allen Formen. Verworfen, weil der Text dann während des Ziehens nicht mitliefe (die Ebene wird erst beim Loslassen neu gezeichnet) und eigene Abgleichlogik bräuchte.

### 5. Darstellung
- `src/lib/style-presets.ts`: `STYLE_PRESETS` mit `{ id, name, fill, stroke }`, Werte aus der Stilvorlage:

  | Name | Füllung | Rand |
  | --- | --- | --- |
  | Grau | `#E4E4E7` | `#52525B` |
  | Blau | `#DBEAFE` | `#1E40AF` |
  | Violett | `#E9D5FF` | `#6B21A8` |
  | Gelb | `#FDE68A` | `#92400E` |
  | Türkis | `#CCFBF1` | `#115E59` |
  | Orange | `#FED7AA` | `#9A3412` |
  | Grün | `#D9F99D` | `#3F6212` |
  | Nur Rand | `null` | `#27272A` |

  Grau entspricht dem Standard neuer Formen aus `basic-shapes`. `findActivePreset(style)` vergleicht Füllung und Rand ohne Rücksicht auf Groß-/Kleinschreibung, denn `<input type="color">` liefert Kleinbuchstaben.
- Voreinstellungen erscheinen als Reihe kleiner Farbfelder (24 px, Füllung mit Rand als Innenlinie wie in der Stilvorlage, „Nur Rand“ weiß mit Rand), jeweils `aria-pressed` und mit dem Namen als `title`/`aria-label`.
- Farbfelder: `<input type="color">`, gestaltet als 32 × 32-px-Feld des Entwurfs, mit `aria-label` „Füllfarbe ändern“ bzw. „Randfarbe ändern“. Übernommen wird beim nativen `change`-Ereignis (Auswahl bestätigt), nicht bei `input`. React meldet bei Farbfeldern jede Bewegung als `onChange`, darum bindet ein Ref den nativen Listener.
- „Nur Rand“: Kontrollkästchen. Anhaken setzt `fill: null`. Abwählen setzt die zuletzt in dieser Sitzung gezeigte Füllfarbe der Form, sonst `#E4E4E7`. Gemerkt wird sie in einer `Map` je Form-ID auf Modulebene (nur Sitzung, nicht im Plan). Solange „Nur Rand“ aktiv ist, ist das Füll-Farbfeld gesperrt.
- Randstärke: `NumberField` mit Einheit px (Entscheidung 1).
- Deckkraft: `<input type="range">` von 10 bis 100, Schritt 5, mit Prozentanzeige. Die Anzeige folgt dem Regler sofort, übernommen wird beim nativen `change` (Loslassen bzw. Pfeiltaste). Werte unter 10 % aus älteren Plänen bleiben erhalten, bis der Regler bewegt wird.

### 6. Drehung beim Ändern der Größe
- `applyTransform` rastet die Drehung nur ein, wenn sie sich gegenüber der Form um mehr als 0,01° geändert hat (Vergleich modulo 360). Sonst übernimmt es `shape.rotationDeg` unverändert. So bleibt eine getippte Drehung von 93° beim Ändern der Größe erhalten. Gleitkomma-Reste aus Konva (93,0000001) gelten nicht als Drehung.

### 7. Tastenkürzel neben dem Formular
- `isEditableTarget` sperrt nur noch Texteingaben: `TEXTAREA`, `SELECT`, `contentEditable` und `INPUT` mit den Typen `text`, `search`, `number`, `email`, `tel`, `url`, `password` sowie ohne Typ. Kontrollkästchen, Farbfelder, Regler und Schaltflächen lassen die Kürzel durch. Die Entscheidung steckt in einer reinen Funktion `isTextEntry({ tagName, type, isContentEditable })`, die ohne DOM testbar ist (Vitest läuft mit `environment: "node"`); `isEditableTarget` ruft sie für `HTMLElement`s auf.
- Folge: Auf dem fokussierten Deckkraft-Regler löscht die Rücktaste die Form. Pfeiltasten bedienen weiter den Regler. Das ist gewollt, denn Rücktaste und Entf haben am Regler keine eigene Bedeutung.

### Auswirkungen auf Datenmodell und `schemaVersion`
Keine. Genutzt werden nur vorhandene Felder aus `plan-model`: `label`, `mirrored`, `x`, `y`, `rotationDeg`, `widthCm`, `depthCm`, `cornerRadiusCm` und `style` (`fill`, `stroke`, `strokeWidth`, `opacity`). `schemaVersion` bleibt 1. Festgelegt wird:
- Eine leere Beschriftung wird nicht als `""` gespeichert, sondern entfällt.
- Farben können in Kleinbuchstaben gespeichert sein, das Schema erlaubt beides.
- `rotationDeg` kann nach einer Eingabe eine Nachkommastelle haben.

Alte Pläne bleiben gültig.

## Risks / Trade-offs

- [Farbauswahl meldet `change` je nach Browser unterschiedlich (Chrome beim Schließen, Firefox unter Linux über den GTK-Dialog)] → In beiden Browsern prüfen. Rückfall: zusätzlich bei `blur` des Farbfelds übernehmen, wenn sich der Wert geändert hat.
- [Übernahme bei `blur` kollidiert mit Klicks auf die Zeichenfläche oder auf „Löschen“] → `blur` kommt vor `click`, die Übernahme trifft also die richtige Form. Im Browser prüfen: Breite eintippen, dann direkt eine andere Form anklicken.
- [Lange Beschriftungen ragen über kleine Formen hinaus oder überdecken Nachbarn] → Begrenzung auf 240 px mit „…“. Ein Ausblenden aller Beschriftungen kommt mit `settings-menu`.
- [Beschriftung in der Randfarbe ist bei sehr hellen eigenen Randfarben schlecht lesbar] → Die Voreinstellungen haben alle dunkle Ränder. Für freie Farben gilt: Die Lesbarkeit liegt beim Nutzer.
- [Die Prop `readOnly` der Felder bleibt bis `editing-extras` ungenutzt und ungeprüft; das Projekt hat keine Komponententests] → Die Prop ist klein (setzt `readOnly` am Eingabefeld, keine Übernahme). Geprüft wird sie im Browser mit `editing-extras`.
- [Rücktaste auf dem fokussierten Regler löscht die Form] → Bewusst so (Entscheidung 7). Ohne Undo bis `editing-extras` lässt sich die Form neu einfügen.

## Migration Plan

Reihenfolge: `basic-shapes` (archiviert) → `shape-properties` → `more-shapes` → `editing-extras`. Keine Datenmigration. Zurücknehmen lässt sich der Change durch Zurücksetzen der Commits; Beschriftungen und Farben bleiben im Plan und werden ohne diesen Change nur nicht angezeigt bzw. nicht bearbeitet. Nach dem Archivieren prüft Aufgabe 1.1 von `more-shapes` ihre Annahmen gegen diesen Change: `getLabelAnchorCm` und `SHAPE_KIND_LABELS` sind dann bereits vorhanden.
