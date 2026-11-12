# Proposal

## Why

Der Grundriss existiert bisher nur auf dem Bildschirm und als JSON-Datei. Für Gespräche mit Handwerkern, den Umzug oder zum Ausmessen mit dem Lineal braucht es einen Ausdruck: je Etage eine DIN-A4-Seite, maßstabsgetreu und ohne Umweg über Screenshots.

## What Changes

- Neue Schaltfläche „PDF“ in der Kopfleiste, die einen Dialog „Grundriss als PDF“ öffnet.
- Im Dialog wählt der Nutzer:
  - **Etagen** (Häkchen je Etage, alle vorausgewählt; mindestens eine)
  - **Format**: Hochformat oder Querformat (Papier immer DIN A4)
  - **Maßstab**: 1:50, 1:100 oder „Auf Seite einpassen“
  - **Inhalt**: „Möbel“ und „Raumnamen und Fläche“ (vorausgewählt), „Vorlage“ und „Raster“ (nicht vorausgewählt)
- „PDF erstellen“ lädt sofort eine PDF-Datei herunter – komplett im Browser, ohne Netzwerkaufruf. Je ausgewählter Etage eine Seite in der Reihenfolge der Etagen.
- Jede Seite zeigt eine Kopfzeile (Planname, Etagenname, Druckdatum), den Maßstab als Text und einen Maßstabsbalken sowie den Grundriss in Farbe wie im Editor: Räume mit Wänden, Türen, Fenstern und Durchgängen; je nach Auswahl Möbel, Raumnamen mit Fläche in m², Vorlage und Raster.
- Passt eine Etage beim gewählten festen Maßstab nicht auf die Seite, nennt der Dialog die betroffenen Etagen und „PDF erstellen“ ist gesperrt.
- Neue Abhängigkeit: eine Bibliothek zum Erzeugen von PDF-Dateien im Browser (Begründung in design.md).

**Nicht im Umfang:**
- Andere Papiergrößen als DIN A4, andere Maßstäbe als 1:50 und 1:100, Aufteilen einer Etage auf mehrere Seiten.
- Bemaßungsketten / Kantenmaße am Raum, Nordpfeil, Legende, Schriftfeld nach Norm.
- Graustufen-/Schwarz-Weiß-Modus.
- Druck über den Druckdialog des Browsers, Bild-Export (PNG/SVG).
- Merken der Dialog-Auswahl über das Schließen des Dialogs hinaus.
- Änderungen am Datenformat des Plans (keine neue schemaVersion).

## Capabilities

### New Capabilities
- `plan-pdf`: PDF-Ausgabe des Grundrisses – Dialog mit Etagen-, Format-, Maßstabs- und Inhaltsauswahl, Seitenaufbau je Etage, Maßstabstreue und Dateiname.

### Modified Capabilities
- `workspace-layout`: Die Kopfleiste bekommt die Schaltfläche „PDF“, die im Kalibrier-Modus wie „Importieren“ und „Exportieren“ ausgeblendet ist.

## Impact

- Neue reine Logik in `src/lib/` (Seitenaufbau und Maßstab, Raumfläche, Dateiname) mit Vitest-Tests.
- Neue Komponenten unter `src/components/plan-pdf/` (Dialog, Erzeugen der Seiten); Kopfleiste in `src/components/layout/HeaderBar.tsx`.
- Wiederverwendung der vorhandenen Geometrie: `wallBandOutline`, `openingGap`, `doorLeaf`, `windowSymbol`, `getOutlineCm`, `labelPointCm`, `floorContentBounds`, `roomAreaFill`, Vorlagenbilder aus IndexedDB.
- `package.json`: neue Laufzeit-Abhängigkeit `jspdf`, nur bei Bedarf nachgeladen.
- Datenformat, Speicherung, Import und Export bleiben unverändert.
