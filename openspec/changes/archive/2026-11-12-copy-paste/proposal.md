# Proposal

## Why

Wer mehrere gleiche Möbel (z. B. vier Stühle) oder gleich geschnittene Räume (übereinanderliegende Zimmer auf mehreren Etagen) braucht, muss jedes Stück neu einfügen und alle Maße erneut eintippen. Kopieren und Einfügen mit den gewohnten Tasten spart diese Arbeit.

## What Changes

- **Strg+C** kopiert den ausgewählten Raum oder die ausgewählte Form in eine Zwischenablage der App.
- **Strg+V** fügt den Inhalt der Zwischenablage auf der **aktiven Etage** ein und wählt die Kopie aus. Mehrfaches Einfügen ist möglich.
  - Auf derselben Etage liegt die Kopie **versetzt**: 50 cm nach rechts und 50 cm nach unten, jedes weitere Einfügen um weitere 50 cm.
  - Auf einer **anderen Etage** liegt die erste Kopie an **derselben Stelle** wie das Original, weitere jeweils 50 cm weiter versetzt.
- **Strg+X** schneidet aus: kopiert und löscht das Original. Ein gesperrter Raum bzw. eine gesperrte Form wird nur kopiert und bleibt stehen. Das erste Einfügen nach dem Ausschneiden setzt die Kopie wieder an die alte Stelle.
- **Strg+D** dupliziert: legt sofort eine um 50 cm versetzte Kopie des Ausgewählten auf derselben Etage an und wählt sie aus. Die Zwischenablage bleibt dabei unverändert.
- Eine **Raumkopie** übernimmt Umriss, Wanddicken, Farbe sowie alle Türen, Fenster und Durchgänge (mit neuen IDs). Ihr Name bekommt den Zusatz „ (Kopie)“, außer beim ersten Einfügen nach dem Ausschneiden (dann ist es ein Verschieben). Eine **Formkopie** übernimmt Art, Maße, Drehung, Spiegelung, Stil und Beschriftung.
- Kopien sind **nie gesperrt**, auch wenn das Original gesperrt ist.
- Einfügen, Ausschneiden und Duplizieren bilden je **einen Rückgängig-Schritt**. Kopieren ändert den Plan nicht.
- Die Liste der Tastenkürzel in „Hilfe“ nennt die vier neuen Kürzel.

**Nicht im Umfang:**
- Keine Nutzung der System-Zwischenablage: Kopieren zwischen Browser-Tabs oder in andere Programme geht nicht. Die Zwischenablage gilt nur für die laufende Sitzung und ist nach dem Neuladen leer.
- Kein Kopieren einzelner Türen, Fenster oder Durchgänge und keine Mehrfachauswahl.
- Möbel, die in einem kopierten oder ausgeschnittenen Raum stehen, werden nicht mitkopiert bzw. mitverschoben; sie bleiben, wo sie sind.
- Kein Einfügen an der Mausposition und keine Menüeinträge oder Schaltflächen für Kopieren/Einfügen; nur Tastenkürzel.
- Strg+C/V/X in Eingabefeldern bleibt beim Browser (Text kopieren und einfügen).
- Kein Einfügen im Kalibrier-Modus und nicht, während ein Raum gezeichnet wird.
- Keine Änderung am Datenmodell, an `schemaVersion`, Export oder Import. Keine neue Abhängigkeit.

## Capabilities

### New Capabilities
- `clipboard`: Kopieren, Ausschneiden, Einfügen und Duplizieren von Räumen und Formen: was eine Kopie übernimmt, wo sie landet, wie die Zwischenablage über Etagen hinweg wirkt und wie das mit Sperre und Rückgängig zusammenspielt.

### Modified Capabilities
- `app-help`: Die Liste der Tastenkürzel nennt unter „Auswahl“ zusätzlich Strg+C, Strg+X, Strg+V und Strg+D.

## Impact

- Neu: reine Logik in `src/lib/` (Kopie eines Raums bzw. einer Form erzeugen, Versatz berechnen) mit Vitest-Tests.
- Geändert: `src/store/app-store.ts` (Zwischenablage als Sitzungszustand, Aktionen Kopieren/Ausschneiden/Einfügen/Duplizieren), `src/hooks/useShapeShortcuts.ts` (Tasten), `src/components/help/shortcuts.ts` (Liste).
- Datenmodell und `schemaVersion` bleiben unverändert.
