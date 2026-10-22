# Online-Terminbuchung mit Calendly einrichten

Die Website hat einen Bereich "Termin buchen". Solange keine Buchungsseite eingetragen ist,
zeigt er "Online-Buchung folgt in Kürze". Nach dieser Anleitung buchen Patientinnen und Patienten
direkt online, und du verwaltest alle Termine am Handy oder Laptop.

**Calendly Free** (Stand bei Einrichtung prüfen auf calendly.com/pricing):

- unbegrenzt viele Buchungen
- **eine** Terminart: deshalb wählt man die Behandlung im Buchungsformular aus
- Bestätigungs-E-Mails an Patient/in und an dich
- automatische Erinnerungs-E-Mails gibt es nur im bezahlten Tarif

Die Bezeichnungen der Menüpunkte können sich bei Calendly leicht ändern.

## 1. Konto anlegen

1. Auf **https://calendly.com** mit info@wiebke-thiele.de registrieren, Tarif **Free**.
2. Sprache **Deutsch**, Zeitzone **Europe/Berlin**.
3. Calendly fragt nach einem Kalender. Ohne eigenen digitalen Kalender kannst du diesen Schritt
   überspringen; dann ist Calendly selbst dein Terminkalender.
4. Unter *Account → Privacy / Data Processing* den **Auftragsverarbeitungsvertrag (DPA)** annehmen.

## 2. Die eine Terminart anlegen

*Event Types → New → One-on-One*:

| Feld | Eintrag |
|---|---|
| Name | Termin in der Praxis |
| Dauer | 80 Minuten (deckt auch Ersttermine ab; Folgetermine enden einfach früher) |
| Ort | Lehderstraße 60, 13086 Berlin |
| Link | z. B. `calendly.com/wiebke-thiele/termin` |

Falls dein Tarif **mehrere Dauern pro Terminart** anbietet, stattdessen 50, 70 und 80 Minuten
zur Auswahl stellen.

## 3. Buchungsformular

Unter *Invitee Questions* nur das Nötige abfragen:

- Name und E-Mail (Standard)
- **Telefon** (Pflicht)
- **Behandlung** (Pflicht, eine Auswahl):
  - Osteopathie – Ersttermin (70 Min, 110 €)
  - Osteopathie – Folgetermin (50 Min, 90 €)
  - Homöopathie – Ersttermin (80 Min, 130 €)
  - Homöopathie – Folgetermin (50 Min, 90 €)
  - Frauengesundheit – Ersttermin (80 Min, 130 €)
  - Frauengesundheit – Folgetermin (50 Min, 90 €)
  - Einzel-Session Tanzkörper (90 €)

**Keine Fragen nach Beschwerden.** Das wären Gesundheitsdaten bei einem Anbieter in den USA.
Die klärst du im Termin.

## 4. Verfügbarkeit

- **Montag bis Freitag, 8.00 bis 19.00 Uhr**
- **Puffer** zwischen Terminen, z. B. 10 Minuten
- **Vorlaufzeit**, z. B. frühestens 24 Stunden im Voraus
- Urlaub und freie Tage als gesperrte Zeiten (*Date overrides*) eintragen

## 5. Termine am Handy und Laptop verwalten

- **Handy:** App **Calendly** (iPhone und Android) installieren, mit demselben Konto anmelden.
  Neue Buchungen kommen per E-Mail und Mitteilung; Termine lassen sich dort absagen.
- **Laptop/Computer:** https://calendly.com im Browser öffnen.

## 6. Mit der Website verbinden

1. In Calendly den **Link der Terminart** kopieren (z. B. `https://calendly.com/wiebke-thiele/termin`).
2. Auf GitHub `content/site.yml` öffnen, Stift klicken, eintragen:

   ```yaml
   booking_url: "https://calendly.com/wiebke-thiele/termin"
   ```

3. **Commit changes**. Nach etwa einer Minute zeigt die Website den Button "Buchungskalender laden".

Der Kalender lädt erst, wenn jemand auf den Button klickt. Vorher werden keine Daten an Calendly übertragen.

## 7. Datenschutzerklärung ergänzen

In `content/legal/datenschutz.md` einen Abschnitt zu Calendly ergänzen: Anbieter Calendly LLC (USA),
Zweck Terminbuchung, abgefragte Daten (Name, E-Mail, Telefon, gewählte Behandlung), Grundlage der
Übermittlung in die USA (EU-US Data Privacy Framework bzw. Standardvertragsklauseln laut DPA).
Am besten mit einem Datenschutz-Generator oder anwaltlich prüfen lassen.
