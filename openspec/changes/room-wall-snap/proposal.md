# Proposal

## Why

Räume werden einzeln gezeichnet und danach zusammengeschoben. Heute bewegt sich ein Raum beim Ziehen nur im 5-cm-Raster; ihn so an einen Nachbarraum zu legen, dass genau eine gemeinsame Wand dazwischen liegt und die Fluchten stimmen, braucht viel Fummeln oder das 1-cm-Raster. Ein Raum, der beim Heranschieben an der Nachbarwand „haftet“, macht das Zusammenlegen von Räumen einfach und genau.

## What Changes

- Beim Ziehen eines Raums haftet er an einer parallelen, gegenüberliegenden Kante eines anderen Raums derselben Etage, sobald er ihr nahe kommt (8 Bildschirmpixel): Der Abstand der Innenkanten ist dann genau die gemeinsame Wanddicke (die dickere der beiden Kanten), die Wandbänder liegen übereinander und sehen aus wie eine Wand.
- Ein haftender Raum lässt sich entlang der Wand weiterziehen und bleibt dabei an ihr.
- Lösen: Der Raum löst sich erst, wenn der Mauszeiger mehr als 24 Bildschirmpixel quer zur Wand von der Haftlage entfernt ist („Losreißen“), dann springt er zur Mauslage. Er löst sich auch, wenn er entlang der Wand so weit gezogen wird, dass sich die beiden Kanten nicht mehr gegenüberliegen.
- Haftet ein Raum an einer Wand, rasten seine Ecken entlang der Wand bündig mit den Ecken der Nachbarkante ein (8 Bildschirmpixel), z. B. beide Oberkanten auf einer Linie.
- Ein Raum kann gleichzeitig an zwei nicht parallelen Wänden haften (z. B. in einer Ecke zwischen zwei Räumen).
- Während er haftet, ist die Nachbarkante auf der Zeichenfläche markiert.
- Mit gedrückter Strg-Taste haftet beim Ziehen nichts; Alt bleibt das feine Raster.

Nicht im Umfang:
- Haften beim Zeichnen eines Raums (dort gibt es schon das Einrasten an Ecken) und beim Ändern von Kantenlängen.
- Haften von Möbeln an Wänden oder an anderen Möbeln.
- Automatisches Zusammenführen von Räumen, gemeinsame Wandobjekte oder Wandverbindungen (bleibt bewusst „Räume statt Wände“).
- Verhindern von Überlappungen: Ein Raum darf weiterhin über einen anderen gezogen werden.
- Einstellbare Haft- oder Löseabstände in den Einstellungen.

## Capabilities

### New Capabilities

(keine)

### Modified Capabilities

- `floor-rooms`: „Raum verschieben“ berücksichtigt das Haften; neue Anforderungen für Haften an der Nachbarwand, Lösen, bündige Ecken, Markierung und Abschalten mit Strg.

## Impact

- Neue reine Logik in `src/lib/room-snap.ts` (Haftziele, Haften/Lösen mit Hysterese, bündige Ecken) mit Vitest-Tests.
- `src/components/canvas/RoomsLayer.tsx`: `dragBoundFunc` des Raums nutzt die Haftlogik, Markierung der Nachbarkante.
- `src/hooks/useModifierKeyRef.ts`: Ref für die Strg-Taste.
- Kein Einfluss auf Datenmodell, Speicherung, Export/Import; `schemaVersion` bleibt unverändert. Keine neuen Abhängigkeiten.
