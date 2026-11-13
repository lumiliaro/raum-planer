# Design

## Context

Motivation und Testergebnis vom iPad: siehe proposal.md, „Why“.

Ist-Stand im Code:

- `useShapeShortcuts` prüft schon `e.ctrlKey || e.metaKey` für Z/Y/C/X/V/D. Die Befehle selbst brauchen also keine Änderung.
- Das Gedrückthalten liest nur `ctrlKey`. Das betrifft `useCtrlKeyRef` (`ShapesLayer`/`ShapeNode`, `RoomsLayer`, `WallsLayer`), `e.evt.ctrlKey` beim Klick in `FloorCanvas` (Raum- und Wandpunkt) und in `RoomDraftLayer` den Zeiger-Zustand `ctrl` (Mausbewegung und `e.key === "Control"`).
- Tastennamen stehen als feste Texte in `components/help/shortcuts.ts` (Quelle der Hilfe, mit Test), in `HistoryButtons.tsx` (`title`, `aria-keyshortcuts="Control+Z"`) und in `ArrangeSection.tsx` (`Umschalt+Bild↑`).
- Konva ruft bei Touch auf einer Form `preventDefault()` auf `touchstart` auf (`Stage._pointerdown`). Ein Mausklick am Desktop verlässt das Feld beim `mousedown`. Auf dem iPad bleibt der Fokus nach Tab im Feld. `isEditableTarget` lässt deshalb C/X/V/D und Einzeltasten durch, `targetOwnsUndo` bei sauberem Feld nur Z/Y.
- Ein Test-Artefakt hat ein Feld per Antippen fokussiert und dann auf ein Element mit `preventDefault` auf `touchstart` getippt. Dabei ging der Fokus verloren. Im echten Ablauf kam der Fokus per Tab ins Feld, und er blieb dort. Statt dieses Plattformverhalten im Detail nachzubauen, verlässt die App das Feld ausdrücklich (Entscheidung 4).

## Goals / Non-Goals

**Goals:**

- Eine einzige Stelle entscheidet, ob ein Gerät ein Apple-Gerät ist und welche Befehlstaste zum Gedrückthalten gilt.
- Gleiches Verhalten nach dem Bearbeiten von Feldern, egal ob Maus oder Finger.
- Tastennamen bleiben in einer Quelle (`shortcuts.ts` in Windows-Schreibweise) und werden erst beim Anzeigen umgeschrieben.

**Non-Goals:**

- Keine Umstellung der Befehle auf `copy`/`cut`/`paste`-Ereignisse. Der iPad-Test zeigt, dass `keydown` ankommt.
- Keine Erkennung, welche Tastatur angeschlossen ist. Es zählt nur das Betriebssystem.

## Decisions

### 1. Apple-Gerät über die Plattform-Angabe des Browsers

`src/lib/platform.ts`:

- `isApplePlatform(platform: string): boolean` ist rein und testbar. Wahr bei `/^(mac|iphone|ipad|ipod|ios)/i`. Das deckt `"MacIntel"`, `"iPad"`, `"iPhone"` und die `userAgentData`-Werte `"macOS"` und `"iOS"` ab.
- `IS_APPLE: boolean` wird einmal beim Laden berechnet, aus `navigator.userAgentData?.platform || navigator.platform || ""`. Mit `typeof navigator`-Prüfung, damit Vitest im Node-Umfeld nicht scheitert.

iPadOS meldet in Safari standardmäßig „MacIntel“. Das ist hier richtig, weil es auf ⌘ hinausläuft. Eine Unterscheidung Mac/iPad ist nicht nötig.

*Alternativen:* Die User-Agent-Zeichenkette per Regex auswerten wäre fehleranfälliger und lieferte dasselbe Ergebnis. Eine Einstellung zum Wählen wäre zusätzliche Oberfläche ohne Nutzen. Sie steht unter „Nicht im Umfang“.

### 2. Befehlstaste zum Gedrückthalten als reine Funktion

Auch in `src/lib/platform.ts`:

- `snapOffHeld(e: { ctrlKey: boolean; metaKey: boolean }, apple = IS_APPLE): boolean` gibt auf Apple-Geräten `metaKey` zurück, sonst `ctrlKey`.
- `SNAP_OFF_KEY` ist auf Apple-Geräten `"Meta"`, sonst `"Control"`. Das ist der `e.key`-Wert, auf den `RoomDraftLayer` beim Drücken und Loslassen achtet.

Umsetzung:

- `useModifierKeyRef` bekommt statt eines Feldnamens eine Lesefunktion `(e) => boolean`.
- `useCtrlKeyRef` heißt künftig `useSnapOffKeyRef` und nutzt `snapOffHeld`. Die Props `ctrlRef` heißen `snapOffRef`.
- In `FloorCanvas` (zwei Stellen) und `RoomDraftLayer` ersetzt `snapOffHeld(e.evt)` den Ausdruck `e.evt.ctrlKey`. Das Zeiger-Feld `ctrl` heißt `snapOff`.

Die Befehle (`useShapeShortcuts`) behalten `ctrlKey || metaKey`. So geht auf dem Mac kein gewohntes Ctrl-Kürzel verloren (Spec „Befehle mit Strg oder ⌘“).

*Warum nicht beide Tasten auf allen Geräten?* Auf dem Mac ist Ctrl+Klick ein Rechtsklick. Unter Windows öffnet die Windows-Taste beim Loslassen das Startmenü. Der Nutzer hat „nur ⌘“ auf Apple-Geräten gewählt.

### 3. Tastennamen beim Anzeigen umschreiben

`src/lib/key-labels.ts`:

- `formatKeys(combo: string, apple = IS_APPLE): string` nimmt die Windows-Schreibweise („Strg+Umschalt+Z“).
  - Auf anderen Geräten bleibt der Text unverändert.
  - Auf Apple-Geräten wird an „+“ geteilt. Strg, Umschalt und Alt werden zu ⌘, ⇧ und ⌥, sortiert nach ⌥ ⇧ ⌘. Alles wird ohne „+“ zusammengefügt.
  - Beispiele: „Strg+Umschalt+Z“ → „⇧⌘Z“, „Strg“ → „⌘“, „Umschalt+Bild↑“ → „⇧Bild↑“, „+“ → „+“, „Ziehen auf freier Fläche“ bleibt.
- `formatAriaShortcuts(value: string, apple = IS_APPLE): string` ersetzt auf Apple-Geräten in `aria-keyshortcuts` das Wort `Control` durch `Meta`.

`shortcuts.ts` bleibt in Windows-Schreibweise, und die Tests dazu bleiben unverändert. `HelpDialog` (`Keys`), `HistoryButtons` und `ArrangeSection` rufen `formatKeys` beim Rendern auf.

*Alternative:* zwei Listen in `shortcuts.ts`. Die würden auseinanderlaufen, wenn neue Tasten hinzukommen.

Sonderfall: Die Taste „+“ (Vergrößern) darf nicht als Trenner gelesen werden. Ein Text aus genau „+“ bleibt deshalb unverändert. Teile werden nur an einem „+“ zwischen zwei nicht leeren Teilen getrennt.

### 4. Fokus beim Druck auf die Zeichenfläche verlassen

In `FloorCanvas` kommt auf den Container der Zeichenfläche (`container` aus `useElementSize`) ein nativer `pointerdown`-Listener in der Capture-Phase:

- Der Listener reagiert nur, wenn das Ziel das `<canvas>` selbst ist. Die Zoom-Knöpfe und Schalter im selben Container bleiben außen vor.
- Ist `document.activeElement` ein Texteingabefeld (`isEditableTarget`) und nicht in einem Dialog (`isInDialog`), wird `activeElement.blur()` aufgerufen.
- React ruft dann `onBlur` von `useCommitField` auf und übernimmt den Wert oder lehnt ihn ab, bevor Konva den Druck als Auswahl oder Ziehen verarbeitet. Die Reihenfolge ist dieselbe wie am Desktop beim `mousedown`.

Warum `pointerdown` in der Capture-Phase am Container? Der Listener kommt vor Konvas eigenen Handlern und vor dessen `preventDefault`. Er erfasst Maus, Stift und Finger gleich. Am Desktop ist er überflüssig, schadet aber nicht, weil der Browser danach nichts mehr zu verlassen hat.

*Alternativen:*

- `touchstart` global auf `document`: Das würde auch Tippen auf Knöpfe und Panel-Flächen erfassen, was nicht im Umfang ist. Außerdem riskiert es, Felder beim Antippen ihrer eigenen Steuerelemente zu verlassen.
- Den Fokus in `isEditableTarget` ignorieren, wenn die Auswahl sich geändert hat: Das ist schwer zu durchschauen und lässt den Wert ungespeichert.

### Datenmodell und schemaVersion

Keine Auswirkung. Plan, Einstellungen, Import und Export bleiben gleich, und `schemaVersion` bleibt unverändert. Die Erkennung des Geräts wird nicht gespeichert.

## Risks / Trade-offs

- [Ein Browser meldet eine unerwartete Plattform (z. B. leere Angabe in einem Datenschutz-Modus)] → Die App fällt auf Windows/Linux-Verhalten zurück: Strg zum Halten, Anzeige „Strg“. Die Befehle gehen trotzdem mit ⌘, weil sie beide Tasten annehmen.
- [Auf dem Mac feuern Browser bei gehaltenem ⌘ für andere Tasten kein `keyup`] → Betrifft nur Buchstabentasten, nicht ⌘ selbst. Den Zustand von ⌘ liefern `keydown`/`keyup` von „Meta“ und `pointermove`. `blur` setzt ihn zurück, wie heute bei Ctrl.
- [⌘ gedrückt halten und dabei versehentlich C/V/D drücken löst Kopieren, Einfügen oder Duplizieren aus] → Das geht heute unter Windows mit Strg genauso. Hinnehmbar.
- [Fokus verlassen löst bei einem ungültigen Wert den Hinweis aus] → Das ist gewollt und gleich wie beim Verlassen per Maus.
- [Fokusverhalten von iPadOS beim Tippen auf andere Flächen bleibt uneinheitlich] → Nicht im Umfang. Die Werkzeugleiste und die Knöpfe lassen Z/Y bei sauberem Feld weiter zu.

## Migration Plan

Keine Datenmigration. Mit dem nächsten Push auf `main` wird die neue Fassung veröffentlicht. Zurück geht es per Revert des Commits.
