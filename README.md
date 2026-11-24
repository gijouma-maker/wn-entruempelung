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

## Adressen zum Testen
- Kunden-App: `https://gijouma-maker.github.io/wn-entruempelung/`
- Team-Bereich (Testversion ohne KI, Daten nur im Browser): `https://gijouma-maker.github.io/wn-entruempelung/team/`
  - Mitarbeiter-Ansicht: `…/team/?rolle=mitarbeiter`
- Team-Bereich **mit KI und gemeinsamer Datenbank**: der Claude-Link aus `config.js` (`teamApp`)

## Neu (24.11.2026, Beleg-Scanner, Suche, Sprachen im Team)
- **Beleg-Scanner wie bei JoumHome**: Kamera oder Galerie, mehrere Seiten für lange Bons, Ränder werden erkannt und der Bon gerade gezogen.
- **KI sortiert automatisch**: jede Position einzeln, Privates (Zigaretten, Kaugummi …) getrennt, unsichere Positionen markiert, Summenprüfung gegen den Bon-Betrag. Transporter-/Anhängermiete und Deponie werden erkannt, der Beleg wird dem passenden Auftrag zugeordnet (Deponie-Beleg = Entsorgungsnachweis am Auftrag).
- **Die KI lernt mit**: Wird eine Position von Hand auf privat/betrieblich umgestellt, gilt das beim nächsten Bon automatisch.
- **Schnellsuche** (Lupe oben): Aufträge, Kunden, Belege, Einnahmen, Team und Funktionen; Mitarbeiter sehen nur ihre eigenen Aufträge. Findet sie nichts, kann man die KI fragen.
- **8 Sprachen auch für Chef und Mitarbeiter** (Flagge oben): Deutsch, English, Türkçe, العربية (von rechts nach links), Русский, Español, Français, Nederlands. Jeder stellt seine eigene Sprache ein. Rechtliche Dokumente bleiben in der Sprache des Kunden. Längere Hinweistexte übersetzt in der Claude-Version die KI beim ersten Anzeigen; auf GitHub bleiben diese deutsch.

## Neu (23.11.2026, Recht DE/NL)
- **Widerrufsrecht** (DE + NL): Belehrung + Muster-Formular automatisch im Angebot für Privatkunden, beim Auftrag unterschreiben „Belehrung erhalten“ und „vorzeitiger Beginn“, Anzeige der Frist, Warnung vor Arbeitsbeginn.
- **Impressum, Datenschutzerklärung, Widerrufsrecht** in der Kunden-App (Deutsch + Niederländisch) – Daten in `config.js` eintragen (der Team-Bereich erzeugt die Zeilen unter Team & Firma → Rechtliches).
- **Schriften lokal** (Ordner `fonts`), keine Verbindung mehr zu Google Fonts.
- **Belege nach GoBD**: Monat festschreiben, Stornieren statt Löschen, Änderungsprotokoll.
- **Kassenbuch** für Barzahlungen mit Anfangsbestand, Einlagen/Entnahmen, Kassenzählung und CSV.
- **Entsorgungsnachweis** pro Auftrag (Wiegeschein mit KI auslesen), Hinweise zu Elektrogeräten und Sondermüll, Felder für Anzeige § 53 KrWG, Erlaubnis § 54, VIHB.
- **Niederlande**: Land/Sprache pro Auftrag, Angebot/Rechnung/Mahnung auf Niederländisch, Checkliste (postedworkers.nl, Entsorgung in NL), btw verlegd für NL-Firmen, Mahnung nach WIK (14-Tage-Brief).
- **E-Rechnung (XRechnung-XML)** für Firmenkunden als Vorbereitung auf 2028.
- **Personal**: Hinweis Schriftform bei befristeten Verträgen, Krankmeldung ohne Diagnose, KI-Einweisung zum Bestätigen.
- Ausführliche Übersicht: Dokument „Rechtliche Prüfung WN – DE/NL“ im Claude-Projekt WO.

## Neu (23.11.2026)
**Team-Bereich**
- **KI-Volumen aus Fotos**: m³, Personen, Dauer, Sondermüll, verwertbare Gegenstände. Lernt aus der Nachkalkulation, wenn die KI meist zu hoch oder zu niedrig liegt.
- **Kalkulation** mit Arbeit, Fahrt, Entsorgung, Material und Wertanrechnung; Preise unter Team & Firma → Preise.
- **Festpreis oder Kostenvoranschlag** mit passendem Hinweistext im PDF. **Nachtrag** (Mehrkosten) nur mit Zustimmung des Kunden – per Unterschrift oder WhatsApp. Warnung vor der Rechnung, wenn mehr berechnet wird als im Angebot ohne Zustimmung.
- **Angebot, Rechnung, Zahlungserinnerung/Mahnungen, Vollmacht, Auftrags- und Übergabeprotokoll, Steuerberater-Übersicht** als PDF – **Logo mittig oben**, Firmendaten automatisch in der **Fußzeile** (nur ausgefüllte Felder).
- **§ 35a**: Arbeits- und Fahrtkosten auf Rechnung getrennt ausgewiesen.
- **Belege**: KI liest jede Position einzeln, trennt Privates (Zigaretten, Kaugummi, Snacks …) und unterschiedliche MwSt-Sätze. CSV mit Konto-Vorschlag (SKR03) für den Steuerberater.
- **Mahnwesen**: offene und überfällige Rechnungen unter Finanzen, drei Stufen.
- **Vollmacht** für Erben, Betreuer und Bevollmächtigte mit Unterschrift.
- **Nachkalkulation**: Hat sich der Auftrag gelohnt?
- **Mitarbeiter**: „Erledigt“ nur mit Nachher-Foto, „Problem melden“.
- **Sprachassistent mit KI** (nur Claude-Version).

**Kunden-App**
- **Füllgrad** (wenig, normal, sehr voll, extrem voll) und grobe m³-Schätzung mit Anzahl der Transporter-Ladungen. Wird in der WhatsApp-Anfrage mitgeschickt. Ladevolumen in `config.js` → `transporterM3`.

Hinweis: Rechtliche Texte (Vollmacht, Festpreis/Kostenvoranschlag, Mahnungen) sind Vorlagen und ersetzen keine Rechtsberatung. Kontenvorschläge bitte vom Steuerberater prüfen lassen.

## Frühere Neuerungen
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
