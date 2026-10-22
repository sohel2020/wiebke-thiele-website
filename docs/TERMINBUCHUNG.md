# Online-Terminbuchung mit Zoho Bookings einrichten

Die Website hat einen Bereich "Termin buchen". Solange keine Buchungsseite eingetragen ist,
zeigt er "Online-Buchung folgt in Kürze". Nach dieser Anleitung buchen Patientinnen und Patienten
direkt online, und du verwaltest alle Termine am Handy oder Laptop.

Zoho Bookings ist im Basistarif kostenlos für eine Person. Prüfe bei der Anmeldung auf der
Preisseite von Zoho, dass der kostenlose Tarif noch Folgendes enthält: mehrere Terminarten,
Online-Buchungsseite, E-Mail-Bestätigungen, App. Die Bezeichnungen der Menüpunkte können
sich bei Zoho leicht ändern.

## 1. Konto anlegen (im EU-Rechenzentrum)

1. Öffne **https://bookings.zoho.eu** (wichtig: **.eu**, dann liegen die Daten in der EU).
2. Mit info@wiebke-thiele.de registrieren, Tarif **Free** wählen.
3. Zeitzone **Europe/Berlin**, Sprache **Deutsch**.
4. In den Kontoeinstellungen den **Auftragsverarbeitungsvertrag (AVV/DPA)** von Zoho annehmen.

## 2. Terminarten anlegen

Unter *Services* je eine Terminart anlegen (Dauer und Preis wie auf der Website):

| Terminart | Dauer | Preis |
|---|---|---|
| Osteopathie Ersttermin | 70 Min | 110 € |
| Osteopathie Folgetermin | 50 Min | 90 € |
| Homöopathie Ersttermin | 80 Min | 130 € |
| Homöopathie Folgetermin | 50 Min | 90 € |
| Frauengesundheit Ersttermin | 80 Min | 130 € |
| Frauengesundheit Folgetermin | 50 Min | 90 € |
| Einzel-Session Tanzkörper | (Dauer festlegen) | 90 € |

Bezahlung: "vor Ort" (keine Online-Zahlung nötig).

## 3. Arbeitszeiten und Regeln

- Arbeitszeiten: **Montag bis Freitag, 8.00 bis 19.00 Uhr**
- **Pause zwischen Terminen** (Puffer), z. B. 10 Minuten
- **Vorlaufzeit**, z. B. frühestens 24 Stunden im Voraus buchbar
- Urlaub und freie Tage als **gesperrte Zeiten** eintragen

## 4. Benachrichtigungen

- Bestätigung per E-Mail an Patient/in **und** an info@wiebke-thiele.de
- Erinnerung an Patient/in, z. B. 24 Stunden vorher
- Im Buchungsformular nur das Nötige abfragen: Name, E-Mail, Telefon.
  Keine Fragen nach Beschwerden (Gesundheitsdaten), die klärst du im Termin.

## 5. Termine am Handy und Laptop verwalten

- **Handy:** App **Zoho Bookings** (iPhone und Android) installieren, mit demselben Konto anmelden.
  Neue Buchungen kommen als Mitteilung, Termine lassen sich verschieben oder absagen.
- **Laptop/Computer:** einfach https://bookings.zoho.eu im Browser öffnen.

## 6. Mit der Website verbinden

1. In Zoho die Adresse deiner **Buchungsseite** kopieren (z. B. `https://wiebke-thiele.zohobookings.eu`).
2. Auf GitHub `content/site.yml` öffnen, Stift klicken, eintragen:

   ```yaml
   booking_url: "https://wiebke-thiele.zohobookings.eu"
   ```

3. **Commit changes**. Nach etwa einer Minute zeigt die Website den Button "Buchungskalender laden".

Der Kalender lädt erst, wenn jemand auf den Button klickt. Vorher werden keine Daten an Zoho übertragen.

## 7. Datenschutzerklärung ergänzen

In `content/legal/datenschutz.md` einen Abschnitt zu Zoho Bookings ergänzen
(Anbieter, Zweck Terminbuchung, Rechenzentrum EU, AVV). Am besten mit einem Datenschutz-Generator
oder anwaltlich prüfen lassen.
