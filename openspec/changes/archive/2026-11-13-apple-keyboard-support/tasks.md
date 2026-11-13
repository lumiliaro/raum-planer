# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, ob die MODIFIED-Anforderung „Liste der Tastenkürzel“ (`app-help`) wörtlich mit `openspec/specs/app-help/spec.md` übereinstimmt und ob `useShapeShortcuts` weiterhin `e.ctrlKey || e.metaKey` prüft. Prüfen mit `openspec validate apple-keyboard-support --strict`.

## 2. Logik: Gerät, Befehlstaste, Tastennamen

- [x] 2.1 `src/lib/platform.ts` anlegen (design.md Entscheidungen 1 und 2): `isApplePlatform`, `IS_APPLE` (mit `typeof navigator`-Prüfung), `snapOffHeld`, `SNAP_OFF_KEY`. Tests in `src/lib/platform.test.ts`:
  - „MacIntel“, „iPad“, „iPhone“, „macOS“, „iOS“ → Apple
  - „Win32“, „Linux x86_64“, „Windows“, „“ → kein Apple
  - `snapOffHeld({ ctrlKey: true, metaKey: false }, true)` → false, `({ ctrlKey: false, metaKey: true }, true)` → true
  - `snapOffHeld({ ctrlKey: true, metaKey: false }, false)` → true, `({ ctrlKey: false, metaKey: true }, false)` → false

  Prüfen mit `npm test`.
- [x] 2.2 `src/lib/key-labels.ts` anlegen (design.md Entscheidung 3): `formatKeys`, `formatAriaShortcuts`. Tests in `src/lib/key-labels.test.ts`:
  - Apple: „Strg+Z“ → „⌘Z“, „Strg+Umschalt+Z“ → „⇧⌘Z“, „Strg+Y“ → „⌘Y“, „Strg“ → „⌘“, „Alt“ → „⌥“, „Umschalt“ → „⇧“, „Umschalt+Bild↑“ → „⇧Bild↑“
  - Apple: „+“, „−“, „Bild↓“, „Entf“, „Esc“, „Ziehen auf freier Fläche“ bleiben unverändert
  - Kein Apple: jeder Text bleibt unverändert
  - `formatAriaShortcuts("Control+Shift+Z Control+Y", true)` → „Meta+Shift+Z Meta+Y“; ohne Apple unverändert; „Shift+PageUp“ bleibt

  Prüfen mit `npm test`.

## 3. ⌘ beim Gedrückthalten

- [x] 3.1 `useModifierKeyRef` in `src/hooks/useModifierKeyRef.ts` auf eine Lesefunktion umstellen. `useCtrlKeyRef` durch `useSnapOffKeyRef` (nutzt `snapOffHeld`) ersetzen, und JSDoc anpassen („Strg, auf Apple-Geräten ⌘“). Die Props `ctrlRef` in `ShapesLayer`/`ShapeNode`, `RoomsLayer` und `WallsLayer` in `snapOffRef` umbenennen. Prüfen mit `npx tsc -b`. Außerdem prüfen, dass `grep -rn "useCtrlKeyRef\|ctrlRef" src` leer ist.
- [x] 3.2 In `FloorCanvas.tsx` (Klick mit Raum- und Wandwerkzeug) `e.evt.ctrlKey` durch `snapOffHeld(e.evt)` ersetzen. In `RoomDraftLayer.tsx` das Zeiger-Feld `ctrl` in `snapOff` umbenennen: Mausbewegung mit `snapOffHeld(e.evt)` und `e.key === SNAP_OFF_KEY` statt `"Control"`. Kommentare, die „Ctrl held“ nennen, auf „Strg/⌘ held“ anpassen. Prüfen mit `npx tsc -b`. Außerdem prüfen, dass `grep -rn "ctrlKey" src/components` nur noch den Wheel-Kommentar in `FloorCanvas` und die Befehls-Prüfungen in `FloorCanvas`/`RoomDraftLayer` trifft (dort bleibt `ctrlKey || metaKey`).

## 4. Tastennamen je Gerät

- [x] 4.1 `HelpDialog.tsx` (`Keys`) zeigt jede Taste über `formatKeys`. `HistoryButtons.tsx` baut `title` aus `formatKeys` („Rückgängig (⌘Z)“ bzw. „Rückgängig (Strg+Z)“) und `aria-keyshortcuts` aus `formatAriaShortcuts`. `ArrangeSection.tsx` baut `title` aus `formatKeys`. `shortcuts.ts` und `shortcuts.test.ts` bleiben in Windows-Schreibweise; den JSDoc in `shortcuts.ts` um den Hinweis auf `formatKeys` ergänzen. Prüfen mit `npx tsc -b` und `npm test`.

## 5. Fokus beim Druck auf die Zeichenfläche

- [x] 5.1 In `FloorCanvas.tsx` einen nativen `pointerdown`-Listener (Capture-Phase) auf `container` setzen (design.md Entscheidung 4). Er ruft `blur()` auf, wenn `document.activeElement` ein Texteingabefeld außerhalb eines Dialogs ist. Mit Kommentar, warum: Touch auf Konva-Formen lässt den Fokus sonst im Feld. Prüfen mit `npx tsc -b`, und im Desktop-Browser: Breite tippen (ohne Enter) → auf die Zeichenfläche klicken → Wert ist übernommen, `M` blendet die Maße aus.

## 6. Abschluss

- [x] 6.1 Manuelle Prüfung durch den Nutzer auf dem iPad (Safari, Tastatur):
  - Breite ändern → Tab → Form antippen → ⌘C, ⌘V legen eine Kopie an.
  - ⌘Z macht das rückgängig.
  - `M` blendet die Maße aus.
  - Form mit gehaltenem ⌘ ziehen → kein Einrasten.
  - Hilfe zeigt ⌘Z, ⇧⌘Z, ⌥ und ⌘.

  Im Desktop-Browser unter Linux: Hilfe und Tooltips zeigen weiter „Strg“, und Ziehen mit Strg schaltet das Einrasten ab.
- [x] 6.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Nach der Prüfung archivieren (`openspec archive apple-keyboard-support`) und die Specs `keyboard-input` und `app-help` abgleichen.
