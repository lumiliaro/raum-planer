# Proposal

## Why

Wer die App zum ersten Mal öffnet, sieht eine leere Zeichenfläche und viele Icons, aber keinen Hinweis, womit man anfängt (Etage, Vorlage, Raum zeichnen, Möbel). Die Hilfe listet nur Tastenkürzel. Ein kurzer Rundgang beim ersten Start zeigt die Grundfunktionen direkt an der Oberfläche.

## What Changes

- Neues **Tutorial**: ein Rundgang in Schritten. Jeder Schritt hebt ein Element der Oberfläche hervor (z. B. das Werkzeug „Raum“) und zeigt daneben eine Sprechblase mit Titel, kurzem Text, „Schritt N von M“ sowie „Überspringen“, „Zurück“ und „Weiter“ (im letzten Schritt „Fertig“).
- Die Schritte decken ab: Willkommen, Etagen, Vorlage hochladen, Vorlage kalibrieren, Raum zeichnen, Türen/Fenster/Durchgänge, Möbel platzieren, Eigenschaften-Panel, automatisches Speichern, Exportieren/Importieren/PDF, Hilfe.
- Das Tutorial **erklärt nur**: Es wartet nicht auf Aktionen des Nutzers, ändert den Plan nie und blockiert die Oberfläche nicht. Der Nutzer kann nebenbei ausprobieren.
- **Automatischer Start** nur beim ersten Aufruf: Der Browser hatte noch keinen gespeicherten Plan, und das Tutorial wurde in diesem Browser noch nie beendet oder übersprungen. Bestehende Nutzer mit Plan sehen es nicht ungefragt.
- **Überspringen** ist in jedem Schritt möglich (Schaltfläche oder `Esc` in der Sprechblase). Danach startet es in diesem Browser nicht mehr von selbst.
- Im Dialog **„Einstellungen“** kommt ein Abschnitt „Tutorial“ mit der Schaltfläche „Tutorial neu starten“ dazu. Sie schließt den Dialog und startet das Tutorial bei Schritt 1.

**Nicht im Umfang:**
- Keine interaktiven Schritte, die auf eine Aktion warten (z. B. „zeichne jetzt einen Raum“), und kein Beispielplan.
- Keine Erklärung aller Funktionen; Details bleiben in der Hilfe (Tastenkürzel).
- Kein Neustart aus dem Dialog „Hilfe“ und keine neue Taste für das Tutorial.
- Kein Fortschritt über ein Neuladen hinweg: Wer die Seite mitten im Tutorial neu lädt, beginnt (falls es wieder automatisch startet) bei Schritt 1.
- Keine Änderung am Datenmodell, an `schemaVersion`, Export oder Import. Keine neue Abhängigkeit.
- Keine englische Fassung.

## Capabilities

### New Capabilities
- `app-tutorial`: Rundgang durch die Grundfunktionen – Schritte und ihre Ziele an der Oberfläche, Bedienung (Weiter, Zurück, Überspringen, Fertig), automatischer Start beim ersten Aufruf und das Merken „schon gesehen“ im Browser.

### Modified Capabilities
- `app-settings`: Der Dialog „Einstellungen“ bekommt den Abschnitt „Tutorial“ mit „Tutorial neu starten“. Das ist eine Aktion, keine Einstellung des Plans.

## Impact

- Neu: `src/components/tutorial/` (Schritte als Daten, Sprechblase mit Hervorhebung) mit Vitest-Test der Schrittliste.
- Geändert: `app-store.ts` (Sitzungszustand für den aktuellen Schritt, Start/Weiter/Zurück/Beenden), `ui-prefs.ts` (Schlüssel „Tutorial gesehen“), `SettingsDialog.tsx` (Abschnitt „Tutorial“), `AppShell.tsx` (rendert das Tutorial) und Markierungen (`data-tutorial`) an den Zielelementen in Kopfleiste, Werkzeugleiste, Eigenschaften-Panel und Statusleiste.
- Positionierung über `@base-ui/react` (schon installiert). Datenmodell und `schemaVersion` bleiben unverändert.
