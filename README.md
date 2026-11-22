# WN Entrümpelung – App (Testversion)

Kunden-App für WN Entrümpelung: Angebot anfordern, Besichtigung buchen, Aufträge ansehen, Suche, Ansage (Vorlesen + Sprachsteuerung) und Hilfe.

**Sprachen:** Deutsch, English, Türkçe, العربية, Русский, Español, Français, Nederlands – jeweils mit Flagge.
Wird die Sprache gewechselt, wechselt auch die Ansage (Vorlesen und Spracheingabe) in diese Sprache.

## Auf GitHub hochladen (ohne JoumHome zu stören)

1. Auf github.com oben rechts **+ → New repository**.
2. Name: `wn-entruempelung` → **Public** → **Create repository**.
   (Ein **neues** Repository – nicht in `joumhome-test` hochladen.)
3. Auf **uploading an existing file** klicken und **alle Dateien aus diesem Ordner** hineinziehen
   (alle Dateien und den Ordner `bilder`) → **Commit changes**.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main**, Ordner **/ (root)** → **Save**.
5. Nach 1–2 Minuten ist die App erreichbar unter:
   `https://gijouma-maker.github.io/wn-entruempelung/`

JoumHome bleibt unverändert unter `https://gijouma-maker.github.io/joumhome-test/` erreichbar.

### Warum sich die beiden Apps nicht stören
- Eigenes Repository = eigene Adresse und eigene Dateien.
- Die WN-App speichert im Browser nur unter Namen, die mit `wn_` beginnen. JoumHome benutzt `hv_`. Es wird nichts von JoumHome gelesen, überschrieben oder gelöscht.
- Kein Service-Worker, kein Cache, der andere Seiten auf derselben Adresse beeinflussen könnte.

## Neu in dieser Version
- **Zustimmung zur Datenübernahme** (Schritt 3, in allen 8 Sprachen): Stimmt der Kunde zu, kann der Chef die WhatsApp-Anfrage im Team-Bereich mit „Aus Kunden-Anfrage“ einfügen, und das Ticket wird automatisch ausgefüllt. Beim nächsten Mal sind Name, Telefon und Adresse auf dem Handy des Kunden schon eingetragen.
- **Team-Bereich**: Unter „Hilfe“ und unten auf der Startseite gibt es einen Link zum Team-Bereich (Aufträge, Arbeitszeit, Urlaub, Verträge). Öffnen können ihn nur Personen, die der Chef in Claude eingeladen hat. Der Link steht in `config.js` bei `teamApp`.

- **Ansicht wählen**: Oben auf der Startseite „Kunde | Mitarbeiter | Chef“. Mitarbeiter und Chef kommen von dort in den Team-Bereich (an-/abmelden, Pause, Urlaub, krank melden, „Heute im Team“, Tickets, Verträge).
- **QR-Code**: Auf der Startseite mit „Link kopieren“ und „QR herunterladen“. Die Dateien `qr-code.png` und `qr-code.svg` sind zum Drucken (Flyer, Visitenkarte, Auto).

## Neue Version hochladen
1. ZIP entpacken.
2. https://github.com/gijouma-maker/wn-entruempelung/upload/main öffnen.
3. Alle Dateien und den Ordner `bilder` hineinziehen (nicht die ZIP-Datei). Gleichnamige Dateien werden ersetzt.
4. Unten auf **Commit changes** klicken, 1–2 Minuten warten, App neu laden.

## Einstellungen

In `config.js` die eigene Telefon- und WhatsApp-Nummer eintragen (auf GitHub: Datei öffnen → Stift-Symbol → ändern → **Commit changes**).
Ist eine Nummer eingetragen, wird jede neue Anfrage automatisch als WhatsApp-Nachricht an diese Nummer geschickt (auf Deutsch, mit allen Angaben).

## Gut zu wissen
- **Testversion:** Anfragen werden nur im Browser des Kunden gespeichert (kein Server). Der Status (Besichtigung, Angebot …) wird noch nicht automatisch aktualisiert.
- **Vorlesen** funktioniert in allen modernen Browsern. Welche Stimmen es gibt, hängt vom Gerät ab (z. B. Arabisch oder Niederländisch muss auf dem Handy als Sprache vorhanden sein).
- **Spracheingabe (Mikrofon)** funktioniert in Chrome, Edge und Safari. In Firefox kann man stattdessen schreiben.
- Arabisch wird automatisch von rechts nach links angezeigt.
