# Website bearbeiten

Alle Inhalte der Website stehen im Ordner `content/`. Du änderst dort Text,
speicherst ("Commit"), und nach etwa einer Minute ist die Website aktualisiert.
Am Aussehen kannst du dabei nichts kaputt machen.

| Datei | Was steht drin |
|---|---|
| `content/waves.yml` | Tanztermine für "Anmeldung zu Wiebkes Waves" |
| `content/de.yml` | alle deutschen Texte |
| `content/en.yml` | alle englischen Texte (gleicher Aufbau wie de.yml) |
| `content/site.yml` | Adresse, Telefon, E-Mail |
| `content/legal/impressum.md` | Impressum |
| `content/legal/datenschutz.md` | Datenschutzerklärung |

---

## Tanztermine ändern (am einfachsten)

1. Öffne **app.pagescms.org** und melde dich mit deinem GitHub-Konto an.
2. Wähle die Website und dann **Tanztermine (Wiebkes Waves)**.
3. Unter **Termine**: Datum im Kalender wählen, Uhrzeit eintippen (z. B. `15.00 – 17.00`).
   Mit **+** fügst du einen Termin hinzu, mit dem Papierkorb löschst du einen.
4. **Save** klicken. Nach etwa einer Minute ist der Termin online.

Vergangene Termine verschwinden von selbst von der Website.

## Tanztermine direkt auf GitHub ändern

1. Öffne auf github.com dein Repository, dann `content` → `waves.yml`.
2. Klicke oben rechts auf den **Stift** (Edit).
3. Neuen Termin einfügen, genau so eingerückt wie die anderen:

   ```yaml
         - date: 2026-12-14
           time: 15.00 – 17.00
   ```

4. Unten auf **Commit changes…** und dann nochmal **Commit changes** klicken.

## Texte ändern

1. `content/de.yml` öffnen, **Stift** klicken.
2. Den Text hinter dem Doppelpunkt ändern. Die Wörter **vor** dem Doppelpunkt nicht ändern.
3. Dieselbe Stelle in `content/en.yml` auf Englisch anpassen.
4. **Commit changes** klicken.

Regeln, damit nichts schiefgeht:

- **Einrückung** (Leerzeichen am Zeilenanfang) nicht verändern.
- Enthält ein Text einen **Doppelpunkt mit Leerzeichen**, den ganzen Text in Anführungszeichen setzen:
  `title: "Frauengesundheit: selbstbewusst achtsam."`
- Lange Absätze stehen hinter `>-`. Darunter einfach weiterschreiben, gleich eingerückt.
- **Fett** schreiben: `**Wort**` · Link: `[Linktext](https://adresse.de)`
- Neuer Listenpunkt (z. B. Beschwerden): neue Zeile mit `- ` und gleicher Einrückung.
  Am besten auch in en.yml ergänzen.

## Hat es geklappt?

Auf GitHub oben im Repository auf **Actions** klicken:

- **grüner Haken** ✓: Website ist aktualisiert.
- **rotes Kreuz** ✗: Die Website wurde **nicht** geändert, die alte Version bleibt online.
  Klicke auf den Eintrag, dann auf **Inhalte prüfen**. Dort steht auf Deutsch, welche Datei
  und welche Zeile zu korrigieren ist. GitHub schickt dir dazu auch eine E-Mail.

Häufige Ursachen für ein rotes Kreuz:

- Einrückung verrutscht
- Doppelpunkt im Text ohne Anführungszeichen
- Datum nicht im Format `2026-12-14`
- In de.yml etwas hinzugefügt, aber in en.yml nicht

Wenn du nicht weiterkommst: Auf der Datei **History** öffnen, dort siehst du deine letzte
Änderung und kannst sie vergleichen.
