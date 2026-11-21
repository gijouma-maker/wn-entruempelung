# WN Entrümpelung – App (Testversion)

Kunden-App für WN Entrümpelung: Angebot anfordern, Besichtigung buchen, Aufträge ansehen, Suche, Ansage (Vorlesen + Sprachsteuerung) und Hilfe.

**Sprachen:** Deutsch, English, Türkçe, العربية, Русский, Español, Français, Nederlands – jeweils mit Flagge.
Wird die Sprache gewechselt, wechselt auch die Ansage (Vorlesen und Spracheingabe) in diese Sprache.

## Auf GitHub hochladen (ohne JoumHome zu stören)

1. Auf github.com oben rechts **+ → New repository**.
2. Name: `wn-entruempelung` → **Public** → **Create repository**.
   (Ein **neues** Repository – nicht in `joumhome-test` hochladen.)
3. Auf **uploading an existing file** klicken und **alle Dateien aus diesem Ordner** hineinziehen
   (`index.html`, `app.js`, `i18n.js`, `flags.js`, `config.js`, `logo-mark.svg`, `README.md`, `.nojekyll`) → **Commit changes**.
4. **Settings → Pages** → Source: **Deploy from a branch** → Branch **main**, Ordner **/ (root)** → **Save**.
5. Nach 1–2 Minuten ist die App erreichbar unter:
   `https://gijouma-maker.github.io/wn-entruempelung/`

JoumHome bleibt unverändert unter `https://gijouma-maker.github.io/joumhome-test/` erreichbar.

### Warum sich die beiden Apps nicht stören
- Eigenes Repository = eigene Adresse und eigene Dateien.
- Die WN-App speichert im Browser nur unter Namen, die mit `wn_` beginnen. JoumHome benutzt `hv_`. Es wird nichts von JoumHome gelesen, überschrieben oder gelöscht.
- Kein Service-Worker, kein Cache, der andere Seiten auf derselben Adresse beeinflussen könnte.

## Einstellungen

In `config.js` die eigene Telefon- und WhatsApp-Nummer eintragen (auf GitHub: Datei öffnen → Stift-Symbol → ändern → **Commit changes**).
Ist eine Nummer eingetragen, wird jede neue Anfrage automatisch als WhatsApp-Nachricht an diese Nummer geschickt (auf Deutsch, mit allen Angaben).

## Gut zu wissen
- **Testversion:** Anfragen werden nur im Browser des Kunden gespeichert (kein Server). Der Status (Besichtigung, Angebot …) wird noch nicht automatisch aktualisiert.
- **Vorlesen** funktioniert in allen modernen Browsern. Welche Stimmen es gibt, hängt vom Gerät ab (z. B. Arabisch oder Niederländisch muss auf dem Handy als Sprache vorhanden sein).
- **Spracheingabe (Mikrofon)** funktioniert in Chrome, Edge und Safari. In Firefox kann man stattdessen schreiben.
- Arabisch wird automatisch von rechts nach links angezeigt.
