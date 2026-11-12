# Proposal

## Why

Die App zeigt bisher nur eine Platzhalter-Überschrift. Alle folgenden Features (Kalibrierung, Möbel platzieren, Export/Import) brauchen eine funktionierende Arbeitsfläche: Die drei festen Grundrisse müssen sichtbar, umschaltbar und navigierbar sein. Gleichzeitig soll das im Design-Entwurf abgestimmte Aussehen samt Bedienentscheidungen ins Repo, damit alle weiteren Changes darauf aufbauen.

## What Changes

- Feste Haus-Konfiguration in `src/config/house.ts` mit den drei Etagen Erdgeschoss, Obergeschoss, Dachgeschoss (`eg`, `og`, `dg`) und ihren PNG-Dateien aus `public/plans/`. Die Kalibrierung ist noch unbekannt und steht als `null` („nicht kalibriert“).
- App-Gerüst nach Design-Entwurf:
  - Kopfleiste mit App-Name und Etagen-Umschalter (Segment-Schalter), mittig,
  - Zeichenfläche (Konva-Stage), die den restlichen Platz füllt,
  - Eigenschaften-Panel rechts, standardmäßig sichtbar, über einen Griff mittig am linken Panelrand aus- und einblendbar (Pfeil nach rechts = ausblenden, Pfeil nach links = einblenden); der Zustand wird im `localStorage` gemerkt,
  - Statusleiste unten mit dem Kalibrierstatus der aktiven Etage.
- Grundriss-Anzeige: Das PNG der aktiven Etage erscheint in der Konva-Stage und wird bei der ersten Anzeige in die Zeichenfläche eingepasst.
- Navigation: Mausrad zoomt zur Mausposition, Ziehen auf der Fläche verschiebt die Ansicht, schwebende Zoom-Leiste (−, Prozentwert, +, „Einpassen“), Tastenkürzel `+`, `-`, `0`. Zoom-Grenzen 10 %–800 %, wobei 100 % einem PNG-Pixel pro Bildschirmpixel entspricht. Jede Etage behält während der Sitzung ihre eigene Ansicht (Zoom und Position).
- Reine Ansichts-Mathematik (Einpassen, Zoom um einen Punkt, Begrenzen, Prozent-Formatierung) in `src/lib/viewport.ts` sowie ein Helfer für Einstellungen im `localStorage` in `src/lib/ui-prefs.ts`, beide mit Vitest-Tests.
- Design-Tokens aus der Stilvorlage in `src/index.css` (neutrale Palette, Auswahl-Blau, Warn-/Erfolgsfarben, Radien), abgebildet auf die shadcn-Variablen.
- `docs/design/README.md`: Link zum Design-Entwurf und die abgestimmten Bedienentscheidungen als Leitfaden für spätere Changes.

## Nicht im Umfang

- Kalibrier-Werkzeug und echte Kalibrierwerte (nächster Change).
- Werkzeugleiste mit Form-Werkzeugen, Möbel/Formen, Auswahl und Transformer.
- Inhalt des Eigenschaften-Panels über einen Leerzustand („Wähle eine Form aus“) hinaus.
- Einstellungs-Menü (Zahnrad) und die Einstellung zum Skalieren von L-/U-Formen.
- Plan-Datenmodell (`Plan`, `Shape`, `schemaVersion`), Speichern des Plans im `localStorage`, Export/Import, Rückgängig/Wiederholen.
- Merken der aktiven Etage über ein Neuladen hinweg (gehört zu `Plan.activeFloorId` im Change zum Plan-Modell).
- Zeigerposition in cm in der Statusleiste (braucht Kalibrierung).
- Dunkelmodus.

## Capabilities

### New Capabilities
- `floor-plan-view`: Anzeige der Grundrissbilder der festen Etagen, Umschalten zwischen Etagen, Zoomen und Verschieben der Ansicht.
- `workspace-layout`: Bereiche des App-Gerüsts (Kopfleiste, Zeichenfläche, Eigenschaften-Panel, Statusleiste) und das ein-/ausblendbare Eigenschaften-Panel.

### Modified Capabilities
<!-- keine: es gibt noch keine Specs -->

## Impact

- Neu: `src/config/house.ts`, `src/lib/viewport.ts`, `src/lib/ui-prefs.ts` (+ Tests), Komponenten für Gerüst und Grundriss-Ansicht unter `src/components/`, ein Zustand-Store unter `src/store/`, `docs/design/README.md`.
- Geändert: `src/App.tsx` (wird durch das Gerüst ersetzt), `src/index.css` (Tokens).
- Abhängigkeiten: nutzt die bereits installierten `konva`, `react-konva`, `zustand`, `lucide-react`; keine neuen Abhängigkeiten.
- Datenmodell und `schemaVersion`: nicht betroffen.
