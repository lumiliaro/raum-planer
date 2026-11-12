# Spec Delta

## MODIFIED Requirements

### Requirement: Kalibrierung speichern
Das Kalibrier-Panel SHALL eine Schaltfläche „Kalibrierung speichern“ anbieten, die nur bei vorliegendem Ergebnis bedienbar ist. Speichern SHALL die Punkte, die reale Länge in cm und `pxPerCm` als Kalibrierung der aktiven Etage in den Plan übernehmen, eine vorher gespeicherte Kalibrierung dieser Etage ersetzen und den Kalibrier-Modus beenden. Die Kalibrierung MUST mit dem Plan gespeichert werden und nach dem Neuladen der App weiter gelten.

#### Scenario: Speichern
- **GIVEN** P1 liegt bei x 120,0 · y 160,4 px, P2 bei x 1 118,6 · y 160,4 px und die reale Länge ist 1 000 cm
- **WHEN** der Nutzer „Kalibrierung speichern“ anklickt
- **THEN** ist der Kalibrier-Modus beendet
- **AND** die Statusleiste zeigt für das Erdgeschoss „Maßstab: 0,9986 px/cm“
- **WHEN** der Nutzer die App neu lädt
- **THEN** zeigt die Statusleiste für das Erdgeschoss weiterhin „Maßstab: 0,9986 px/cm“

#### Scenario: Ohne Ergebnis nicht speicherbar
- **GIVEN** im Kalibrier-Modus ist nur Punkt 1 gesetzt
- **THEN** ist „Kalibrierung speichern“ nicht bedienbar

#### Scenario: Andere Etagen bleiben unberührt
- **GIVEN** für das Obergeschoss ist eine Kalibrierung gespeichert
- **WHEN** der Nutzer eine Kalibrierung für das Erdgeschoss speichert
- **THEN** bleibt die Kalibrierung des Obergeschosses unverändert

#### Scenario: Browser-Speicher blockiert
- **GIVEN** der Browser verweigert das Schreiben in den Speicher und ein Ergebnis liegt vor
- **WHEN** der Nutzer „Kalibrierung speichern“ anklickt
- **THEN** ist der Kalibrier-Modus beendet und die Statusleiste zeigt den neuen Maßstab
- **AND** die Statusleiste zeigt rechts „Nicht gespeichert“

## REMOVED Requirements

### Requirement: Speichern bei blockiertem Browser-Speicher
**Reason**: Die Kalibrierung ist Teil des Plans; ob er gespeichert ist, zeigt der allgemeine Speicherstatus in der Statusleiste für alle Änderungen gleich.
**Migration**: Kein eigener Hinweis im Kalibrier-Panel mehr; siehe Szenario „Browser-Speicher blockiert“ unter „Kalibrierung speichern“ und die Anforderung „Speicherstatus“ in `plan-persistence`.
