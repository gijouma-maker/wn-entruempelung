# WN-App auf dem eigenen Server

Damit läuft alles ohne Claude-Konto: eigener Login, eine gemeinsame Datenbank für Chef und Mitarbeiter, Fotos, KI-Belegerkennung, KI-Volumenschätzung, Sprachassistent und Übersetzungen.

## Was Sie brauchen
- **Einen V-Server** mit Ubuntu 24.04, z. B. in Nürnberg (Hetzner oder netcup). 2 GB RAM reichen.
- **Eine Domain oder Subdomain**, z. B. `app.wn-entruempelung.de`. Den DNS-Eintrag (A-Record) auf die IP des Servers setzen.
- **Einen Anthropic-API-Schlüssel** von https://console.anthropic.com. Die KI wird dort nach Verbrauch abgerechnet, getrennt vom Claude-Abo. Ein Beleg kostet etwa 1 bis 2 Cent. Am besten in der Konsole ein Monatslimit setzen.

## Installation (ca. 10 Minuten)
1. Per SSH auf den Server: `ssh root@IP-DES-SERVERS`
2. Diesen Befehl einfügen:
   `curl -fsSL https://raw.githubusercontent.com/gijouma-maker/wn-entruempelung/main/server/install.sh | bash`
3. Das Skript fragt nach Domain und API-Schlüssel. Danach installiert es alles: Node.js, Caddy für das kostenlose HTTPS-Zertifikat, Firewall und den Autostart.
4. `https://IHRE-DOMAIN/team/` öffnen. Den Chef-Zugang mit dem **Einrichtungs-Code** anlegen, den das Skript am Ende anzeigt.
5. Oben auf **„Zugänge verwalten“** tippen. Für jeden Mitarbeiter Name, Benutzername und Start-Passwort anlegen. Meldet er sich an, erscheint er im Team. Dort dann „Ins Team aufnehmen“ tippen.

## Im Alltag
- **Kunden-App:** `https://IHRE-DOMAIN`
- **Team-App:** `https://IHRE-DOMAIN/team/` (auf dem Handy „Zum Startbildschirm hinzufügen“)
- **Mitarbeiter gekündigt?** Unter „Zugänge verwalten“ auf **Sperren** tippen. Der Zugang ist dann sofort abgemeldet.
- **Neue Version einspielen:** Auf dem Server `wn-update` eingeben.
- **Sicherung:** Die Datenbank wird täglich nach `/opt/wn/server/data/sicherung/` gesichert und 14 Tage aufbewahrt. Fotos liegen in `/opt/wn/server/data/dateien/`. Zusätzlich die Backup-Funktion des Hosters einschalten.

## Gut zu wissen
- **Daten:** Die Claude-Version und der eigene Server haben **getrennte Daten**. Was in der Claude-Version eingetragen ist, wird nicht automatisch übernommen.
- **Spracheingabe:** Das Mikrofon nutzt die Spracherkennung des Browsers. Das klappt in Chrome und Edge sowie in Safari auf dem iPhone. In Firefox einfach tippen.
- **Datenschutz:** Für die KI gehen Fotos und Texte an Anthropic (USA). Mit Anthropic einen Auftragsverarbeitungsvertrag abschließen (DPA, in der Konsole verfügbar) und das in der Datenschutzerklärung nennen. Ich bin kein Anwalt, bitte prüfen lassen.
- **Ohne API-Schlüssel** läuft alles außer der KI. Belege werden dann von Hand ausgefüllt.
