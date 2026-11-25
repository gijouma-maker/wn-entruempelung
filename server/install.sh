#!/usr/bin/env bash
# Installation auf einem eigenen Server (Ubuntu 22.04/24.04 oder Debian 12)
# Aufruf auf dem Server als root:
#   curl -fsSL https://raw.githubusercontent.com/gijouma-maker/wn-entruempelung/main/server/install.sh | bash
# Mehrere Apps (WN Entrümpelung, JoumHome) können auf demselben Server laufen – jede mit eigener Domain,
# alle nutzen dieselbe eigene KI.
set -euo pipefail
# ---- je App anders ----
APP_NAME="WN Entrümpelung"; KURZ=wn; PORT_STD=8080
REPO="${APP_REPO:-https://github.com/gijouma-maker/wn-entruempelung.git}"
START_PFAD="/team/"
# ------------------------
ZIEL=/opt/$KURZ
[ "$(id -u)" = 0 ] || { echo "Bitte als root ausführen (sudo -i)."; exit 1; }

echo "== $APP_NAME – Einrichtung =="
read -rp "Ihre Domain (z. B. app.wn-entruempelung.de): " DOMAIN </dev/tty
echo "KI für Belege, Volumen und Sprache:"
echo "  1) Eigene KI auf diesem Server – kostenlos, keine Daten nach außen (empfohlen)"
echo "  2) Claude über Anthropic-API-Schlüssel – genauer und schneller, kostet pro Foto"
read -rp "Auswahl [1]: " KIWAHL </dev/tty; KIWAHL=${KIWAHL:-1}
KEY=""; KIART=lokal
if [ "$KIWAHL" = "2" ]; then KIART=anthropic; read -rp "Anthropic API-Schlüssel (sk-ant-…): " KEY </dev/tty; fi
RAM_GB=$(( $(awk '/MemTotal/{print $2}' /proc/meminfo) / 1024 / 1024 ))
if   [ "$RAM_GB" -ge 15 ]; then MODELL=qwen3-vl:8b
elif [ "$RAM_GB" -ge 7 ];  then MODELL=qwen3-vl:4b
else MODELL=qwen3-vl:2b; fi

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

if [ "$KIART" = "lokal" ]; then
  echo "== Eigene KI installieren (Ollama, Modell $MODELL – Download einige GB) =="
  command -v ollama >/dev/null || curl -fsSL https://ollama.com/install.sh | sh
  systemctl enable --now ollama
  sleep 3
  ollama pull "$MODELL"
fi

echo "== App holen =="
id "$KURZ" >/dev/null 2>&1 || useradd --system --home "$ZIEL" --shell /usr/sbin/nologin "$KURZ"
if [ -d "$ZIEL/.git" ]; then git -C "$ZIEL" pull --ff-only; else git clone "$REPO" "$ZIEL"; fi
mkdir -p "$ZIEL/server/data"
if [ ! -f "$ZIEL/server/.env" ]; then
  CODE=$(tr -dc 'A-Z0-9' </dev/urandom | head -c 8)
  cat > "$ZIEL/server/.env" <<EOF
WN_KI=$KIART
WN_OLLAMA_MODELL=${MODELL}
ANTHROPIC_API_KEY=$KEY
WN_KI_MODELL=claude-sonnet-5-5
WN_KI_LIMIT_TAG=400
WN_SETUP_CODE=$CODE
PORT=$PORT_STD
EOF
else
  CODE=$(grep -oP '^WN_SETUP_CODE=\K.*' "$ZIEL/server/.env" || true)
fi
chmod 600 "$ZIEL/server/.env"
chown -R "$KURZ:$KURZ" "$ZIEL"
PORT=$(grep -oP '^PORT=\K.*' "$ZIEL/server/.env" || echo "$PORT_STD")

echo "== Dienst einrichten =="
cat > /etc/systemd/system/$KURZ.service <<EOF
[Unit]
Description=$APP_NAME App
After=network.target
[Service]
User=$KURZ
WorkingDirectory=$ZIEL/server
ExecStart=/usr/bin/node --no-warnings $ZIEL/server/server.js
Restart=always
RestartSec=3
[Install]
WantedBy=multi-user.target
EOF
mkdir -p /etc/caddy/apps
grep -q "import apps/\*" /etc/caddy/Caddyfile 2>/dev/null || { [ -f /etc/caddy/Caddyfile ] && ! grep -q "apps/" /etc/caddy/Caddyfile && mv /etc/caddy/Caddyfile /etc/caddy/Caddyfile.alt || true; echo "import apps/*" > /etc/caddy/Caddyfile; }
cat > /etc/caddy/apps/$KURZ <<EOF
$DOMAIN {
  encode gzip
  request_body {
    max_size 600MB
  }
  reverse_proxy 127.0.0.1:$PORT {
    flush_interval -1
  }
}
EOF
cat > /usr/local/bin/$KURZ-update <<EOF
#!/bin/sh
# Neue Version von GitHub holen und neu starten
set -e
sudo -u $KURZ git -C $ZIEL pull --ff-only && systemctl restart $KURZ && echo "$APP_NAME aktualisiert."
EOF
chmod +x /usr/local/bin/$KURZ-update
ufw allow OpenSSH >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null
systemctl daemon-reload
systemctl enable --now "$KURZ"
systemctl restart "$KURZ"
systemctl restart caddy

echo
echo "=============================================================="
echo " Fertig!  $APP_NAME:  https://$DOMAIN$START_PFAD"
echo " Beim ersten Öffnen den Inhaber-Zugang anlegen."
echo " Einrichtungs-Code:    $CODE"
echo " KI:                   $([ "$KIART" = lokal ] && echo "eigene KI ($MODELL), kostenlos" || echo "Anthropic-API")"
echo " Update später:        $KURZ-update"
echo " Daten & Sicherungen:  $ZIEL/server/data  (täglich, 14 Tage)"
echo "=============================================================="
