#!/usr/bin/env bash
# WN Entrümpelung – Installation auf einem eigenen Server (Ubuntu 22.04/24.04 oder Debian 12)
# Aufruf auf dem Server als root:
#   curl -fsSL https://raw.githubusercontent.com/gijouma-maker/wn-entruempelung/main/server/install.sh | bash
# Danach läuft die App unter https://IHRE-DOMAIN  (Kunden-App) und https://IHRE-DOMAIN/team/ (Team).
set -euo pipefail
REPO="${WN_REPO:-https://github.com/gijouma-maker/wn-entruempelung.git}"
ZIEL=/opt/wn
[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen (sudo -i)."; exit 1; }

echo "== WN Entrümpelung – Einrichtung =="
read -rp "Ihre Domain (z. B. app.wn-entruempelung.de): " DOMAIN </dev/tty
read -rp "Anthropic API-Schlüssel (sk-ant-…, kann auch später in $ZIEL/server/.env): " KEY </dev/tty

echo "== Pakete installieren =="
apt-get update -y
apt-get install -y curl git ca-certificates gnupg debian-keyring debian-archive-keyring apt-transport-https ufw
if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "== App holen =="
id wn >/dev/null 2>&1 || useradd --system --home "$ZIEL" --shell /usr/sbin/nologin wn
if [ -d "$ZIEL/.git" ]; then git -C "$ZIEL" pull --ff-only; else git clone "$REPO" "$ZIEL"; fi
mkdir -p "$ZIEL/server/data"
if [ ! -f "$ZIEL/server/.env" ]; then
  CODE=$(tr -dc 'A-Z0-9' </dev/urandom | head -c 8)
  cat > "$ZIEL/server/.env" <<EOF
ANTHROPIC_API_KEY=$KEY
WN_KI_MODELL=claude-sonnet-5-5
WN_KI_LIMIT_TAG=400
WN_SETUP_CODE=$CODE
PORT=8080
EOF
else
  CODE=$(grep -oP '^WN_SETUP_CODE=\K.*' "$ZIEL/server/.env" || true)
fi
chmod 600 "$ZIEL/server/.env"
chown -R wn:wn "$ZIEL"

echo "== Dienst einrichten =="
cat > /etc/systemd/system/wn.service <<EOF
[Unit]
Description=WN Entrümpelung App
After=network.target
[Service]
User=wn
WorkingDirectory=$ZIEL/server
ExecStart=/usr/bin/node --no-warnings $ZIEL/server/server.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
  encode gzip
  reverse_proxy 127.0.0.1:8080 {
    flush_interval -1
  }
}
EOF
cat > /usr/local/bin/wn-update <<EOF
#!/bin/sh
# Neue Version von GitHub holen und neu starten
set -e
sudo -u wn git -C $ZIEL pull --ff-only && systemctl restart wn && echo "WN-App aktualisiert."
EOF
chmod +x /usr/local/bin/wn-update
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null
systemctl daemon-reload
systemctl enable --now wn
systemctl restart caddy

echo
echo "=============================================================="
echo " Fertig!  Kunden-App:  https://$DOMAIN"
echo "          Team-App:    https://$DOMAIN/team/"
echo " Beim ersten Öffnen den Chef-Zugang anlegen."
echo " Einrichtungs-Code:    $CODE"
echo " Update später:        wn-update"
echo " Daten & Sicherungen:  $ZIEL/server/data  (täglich, 14 Tage)"
echo "=============================================================="
