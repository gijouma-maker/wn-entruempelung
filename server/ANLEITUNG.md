# WN-App auf dem eigenen Server

Damit läuft alles ohne Claude-Konto: eigener Login, eine gemeinsame Datenbank für Chef und Mitarbeiter, Fotos, Belegerkennung, Volumenschätzung, Sprachassistent und Übersetzungen.

## Die KI: eigene KI oder Claude
| | **Eigene KI (Standard)** | **Claude über API-Schlüssel** |
|---|---|---|
| Kosten pro Foto | **keine** | ca. 1–2 Cent |
| Daten | bleiben auf Ihrem Server | gehen an Anthropic (USA) |
| Genauigkeit | gut bei klaren Kassenbons, bei schlechten Fotos öfter nachbessern | sehr gut |
| Geschwindigkeit ohne Grafikkarte | langsamer (Schätzung: ca. 1–2 Minuten pro Bon) | wenige Sekunden |

Die eigene KI ist **Qwen3-VL** (frei, Open Source) und läuft über **Ollama** direkt auf dem Server. Das Installationsskript wählt die Größe passend zum Arbeitsspeicher:
- unter 8 GB RAM: `qwen3-vl:2b`
- ab 8 GB RAM: `qwen3-vl:4b`
- ab 16 GB RAM: `qwen3-vl:8b` (am genauesten)

Korrekturen von Hand merkt sich die App (privat/betrieblich). So wird die Erkennung mit der Zeit besser.

Wechseln lässt sich jederzeit in der Datei `/opt/wn/server/.env` (`WN_KI=lokal` oder `WN_KI=anthropic`), danach `systemctl restart wn` ausführen.

## WN und JoumHome auf einem Server
Der Server-Teil ist bei beiden Apps gleich. Einfach erst das WN-Skript und danach das JoumHome-Skript ausführen (siehe `server/ANLEITUNG.md` bei JoumHome). Jede App bekommt ihre eigene Domain. WN läuft intern auf Port 8080, JoumHome auf 8081. **Beide nutzen dieselbe eigene KI**, egal ob auf dem Server oder auf einem Büro-PC mit Grafikkarte.

## Was Sie brauchen
- **Einen V-Server** mit Ubuntu 24.04, z. B. netcup in Nürnberg. Für die eigene KI am besten **8 GB RAM oder mehr** (z. B. netcup VPS 1000).
- **Eine Domain oder Subdomain**, z. B. `app.wn-entruempelung.de`, mit A-Record auf die IP des Servers.

## Installation (ca. 15 Minuten)
1. Per SSH auf den Server: `ssh root@IP-DES-SERVERS`
2. Diesen Befehl einfügen:
   `curl -fsSL https://raw.githubusercontent.com/gijouma-maker/wn-entruempelung/main/server/install.sh | bash`
3. Das Skript fragt nach der Domain und nach der KI (1 = eigene KI). Danach installiert es alles: Node.js, die eigene KI, Caddy für das kostenlose HTTPS-Zertifikat, Firewall und den Autostart.
4. `https://IHRE-DOMAIN/team/` öffnen. Den Chef-Zugang mit dem **Einrichtungs-Code** anlegen, den das Skript am Ende anzeigt.

## Daten aus der Claude-Version übernehmen
Die Claude-Version und der eigene Server haben **getrennte Daten**. So ziehen Sie alles einmal um:
1. In der **Claude-Version** als Chef auf **Firmendaten → „Alle Daten exportieren“** tippen. Es wird eine Datei `WN-Export-….json` heruntergeladen, mit Aufträgen, Belegen, Einnahmen, Team, Zeiten, Urlaub, Einstellungen und Fotos.
2. Auf dem **eigenen Server** auf **„Zugänge verwalten → Daten übernehmen“** tippen und diese Datei auswählen.
3. Für jeden Mitarbeiter einen Zugang anlegen und bei **„Daten übernehmen von“** seinen Namen wählen. So behält er seine Zeiten, seinen Urlaub und seine Aufträge.

Danach nur noch mit dem eigenen Server arbeiten.

## Im Alltag
- **Kunden-App:** `https://IHRE-DOMAIN`
- **Team-App:** `https://IHRE-DOMAIN/team/` (auf dem Handy „Zum Startbildschirm hinzufügen“)
- **Neuer Mitarbeiter:** Unter „Zugänge verwalten“ einen Zugang anlegen. Er meldet sich an und erscheint im Team. Dort dann „Ins Team aufnehmen“ tippen.
- **Mitarbeiter gekündigt?** Unter „Zugänge verwalten“ auf **Sperren** tippen. Der Zugang ist dann sofort abgemeldet.
- **Neue Version einspielen:** Auf dem Server `wn-update` eingeben.
- **Zugänge verwalten** (Leiste ganz oben, nur Chef): Mitarbeiter anlegen, Passwort zurücksetzen, sperren.
- **Datensicherung (mehrfach):**
  - Die Datenbank wird **3× täglich automatisch gesichert** (6, 14 und 22 Uhr), außerdem bei jedem Neustart und vor jeder Datenübernahme. Die Sicherungen werden **30 Tage** aufbewahrt, in `/opt/wn/server/data/sicherung/`.
  - Gelöschte Fotos und PDFs landen erst im Papierkorb `sicherung/geloescht/` und werden nach 30 Tagen endgültig gelöscht.
  - Unter **„Zugänge verwalten → Datensicherung“** kann man jederzeit von Hand sichern und die neueste Sicherung herunterladen. Diese Datei ab und zu auf dem PC oder einem USB-Stick ablegen.
  - **Wichtig, eine zweite Kopie außerhalb des Servers:** Beim Hoster zusätzlich Speicherplatz buchen (z. B. eine Storage-Box), einbinden und in `.env` `WN_SICHERUNG_KOPIE=/mnt/backup` eintragen. Dann werden alle Sicherungen und Fotos automatisch dorthin kopiert. Zusätzlich die Snapshot- bzw. Backup-Funktion des Hosters einschalten. So sind die Daten auch sicher, wenn der Server ausfällt.
  - Uhrzeiten und Aufbewahrung lassen sich in `.env` ändern (`WN_SICHERUNG_ZEITEN=6,14,22`, `WN_SICHERUNG_TAGE=30`).

## Gut zu wissen
- **Spracheingabe:** Das Mikrofon nutzt die Spracherkennung des Browsers. Das klappt in Chrome und Edge sowie in Safari auf dem iPhone. In Firefox einfach tippen.
- **Datenschutz:** Bei der eigenen KI verlassen keine Fotos den Server. Nur wer auf `WN_KI=anthropic` umstellt, braucht einen Auftragsverarbeitungsvertrag mit Anthropic und einen Hinweis in der Datenschutzerklärung. Ich bin kein Anwalt, bitte prüfen lassen.
- **Schneller mit Grafikkarte:** Die eigene KI kann auch auf einem PC mit Grafikkarte laufen, z. B. im Büro. Dann in `.env` `WN_OLLAMA_URL` auf diesen Rechner setzen. Das muss über eine sichere Verbindung laufen, z. B. per VPN oder Tailscale.
