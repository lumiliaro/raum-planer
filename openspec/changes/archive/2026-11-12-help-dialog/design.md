# Design

## Context

- Die Tastenkürzel sind auf mehrere Handler verteilt: `useShapeShortcuts` (Werkzeuge, Esc, Entf, Bild↑/↓, B, M, Strg+Z/Y), `FloorCanvas` (+, −, 0, Mausrad), `RoomDraftLayer` (Ziffern, Enter, Rücktaste, Esc, Umschalt) und die Modifier-Refs beim Ziehen (`useModifierKeyRef`: Alt, Strg, Umschalt). Die Werkzeug-Tasten stehen in der Registry `TOOLS` (`src/components/layout/tools.ts`).
- Globale Handler ignorieren Tasten in Textfeldern (`isEditableTarget`) und in offenen Dialogen (`isInDialog`, prüft `role="dialog"`).
- Dialoge nutzen `src/components/ui/dialog.tsx` (Base UI). `@base-ui/react` enthält auch `tabs`.
- Sitzungszustand ohne Rückgängig steht schon im Store neben dem Plan. Die History-`partialize` nimmt nur `plan` auf.

Zu den Anforderungen siehe `specs/app-help`, `specs/workspace-layout` und `specs/plan-persistence`.

## Goals / Non-Goals

**Goals:**
- Ein Dialog mit drei Einstiegen (Kopfleiste, Taste `?`, Statusleiste), jeweils mit festem Start-Reiter.
- Die Kürzel-Liste steht als Daten an einer Stelle. Werkzeug-Kürzel kommen aus `TOOLS` und können deshalb nicht von der Werkzeugleiste abweichen.

**Non-Goals:**
- Die bestehenden Handler bleiben unverändert. Die Liste ist eine Beschreibung und wird nicht aus den Handlern erzeugt.
- Keine eigene Tooltip-Komponente. Tooltips bleiben `title`-Attribute wie in der übrigen Kopfleiste.

## Decisions

1. **Zustand im Store statt lokal in der Kopfleiste.** `helpTab: "shortcuts" | "privacy" | null` (`null` = geschlossen) mit `openHelp(tab)` und `closeHelp()` im `app-store`. Der Dialog wird von drei Stellen geöffnet (HeaderBar, StatusBar, globaler Key-Handler). Lokaler State wie beim `SettingsDialog` würde Prop-Drilling oder ein eigenes Event nötig machen. Der Zustand gilt nur für die Sitzung: Er wird nicht im localStorage gespeichert und ist nicht Teil von `partialize`, bildet also keinen Rückgängig-Schritt. Den Dialog rendert `AppShell` einmal.
   - Alternative: ein React-Context nur für die Hilfe. Das wäre mehr Code für denselben Zweck, und der Store ist schon der Ort für UI-Sitzungszustand.

2. **Kürzel-Liste als reine Daten** in `src/components/help/shortcuts.ts`: `SHORTCUT_GROUPS: { title, entries: { keys: string[], description }[] }[]`. Die Gruppe „Werkzeuge“ wird aus `TOOLS` erzeugt (`keys: [tool.key]`, `description: tool.name`). Die Datei liegt bei den Komponenten und nicht in `src/lib/`, weil `TOOLS` Icons (React) importiert. Sie ist trotzdem ohne DOM testbar, wie `tools.test.ts`. `keys` ist eine Liste von Alternativen (z. B. `["Strg+Umschalt+Z", "Strg+Y"]`) und wird als `<kbd>`-Elemente mit „oder“ dazwischen dargestellt.
   - Alternative: die Kürzel in jedem Handler annotieren und daraus die Liste sammeln. Das wäre ein großer Umbau, und die Tasten beim Ziehen (Modifier-Refs) lassen sich so nicht erfassen.

3. **Reiter über `@base-ui/react/tabs`** in einer kleinen Hülle, gestaltet mit Tailwind passend zu den bestehenden Dialogen. Der Reiter ist gesteuert (`value = helpTab`), sodass `openHelp("privacy")` direkt den richtigen Reiter zeigt. Ein Reiterwechsel ruft `openHelp(tab)` auf. Keine neue Abhängigkeit.

4. **Taste `?`** in `useShapeShortcuts`: nach der Dialog- und Textfeld-Prüfung und vor den Werkzeug-Tasten gilt `if (e.key === "?") { e.preventDefault(); openHelp("shortcuts"); return; }`. Die Prüfung auf `e.key` statt `e.code` deckt deutsche (Umschalt+ß) und US-Tastatur (Umschalt+/) ab. Umschalt ist kein ausschließender Modifier. Strg, Meta und Alt schließen die Taste schon aus. Der Capture-Handler von `RoomDraftLayer` greift nur Ziffern, Komma, Punkt, Enter, Rücktaste und Esc, also kommt `?` beim Zeichnen durch. Der Entwurf bleibt erhalten, weil Esc im offenen Dialog wegen `isInDialog` nicht beim Zeichen-Handler ankommt.

5. **Statusleiste:** Der Speicherstatus wird ein `<button type="button">` mit unverändertem Aussehen (Text, Häkchen bzw. Warnfarbe) und zusätzlich Hover-Unterstreichung und Fokusring. `title` ist „Alle Daten bleiben in diesem Browser“ bzw. weiterhin der Grund. `onClick = openHelp("privacy")`.

6. **Kopfleiste:** Die Icon-Schaltfläche `CircleHelp` (lucide) steht ganz rechts nach „Einstellungen“ im selben Stil und außerhalb des `calibrating`-Zweigs, damit sie auch im Kalibrier-Modus sichtbar ist.

7. **Datenschutztext** ist statischer JSX-Text im Dialog: kurze Absätze und Stichpunkte. Inhaltlich deckt er sich mit dem Abschnitt „Online nutzen“ der README und nennt Browser-Speicher (localStorage/IndexedDB) ohne Fachjargon als „Speicher dieses Browsers“.

**Datenmodell / schemaVersion:** keine Änderung. `helpTab` ist reiner Sitzungszustand und gehört nicht zum Plan, zum Export oder zum localStorage.

## Risks / Trade-offs

- [Die Liste veraltet, wenn später ein Kürzel außerhalb von `TOOLS` dazukommt] → Ein Test prüft, dass jede `TOOLS`-Taste in der Liste steht und keine Taste doppelt vorkommt. Ein Kommentar in `useShapeShortcuts`/`FloorCanvas`/`RoomDraftLayer` verweist auf `shortcuts.ts`.
- [Die Taste `?` überschneidet sich mit einem Werkzeug-Kürzel] → Werkzeug-Tasten sind Buchstaben, und der Test „keine doppelte Taste“ deckt den Fall ab.
- [Der Text „nichts wird übertragen“ stimmt später nicht mehr, z. B. wenn Analytics dazukommen] → Der Projektrahmen verbietet Netzwerkaufrufe zur Laufzeit. Eine Änderung daran müsste diesen Spec (`app-help`) mit anpassen.
