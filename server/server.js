/* WN Entrümpelung – eigener Server
   Läuft mit Node.js 22 (ohne Zusatzpakete). Liefert die Kunden-App (/) und die Team-App (/team/),
   speichert alle Daten in einer Datenbank (data/wn.db), Fotos in data/dateien/,
   und leitet KI-Anfragen mit Ihrem eigenen API-Schlüssel an Claude (Anthropic) weiter.
   Start:  node --no-warnings server.js        Einstellungen: Datei .env (siehe .env.example) */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

/* ---------- Einstellungen ---------- */
const HIER = __dirname;
const WEB = path.resolve(HIER, "..");
(function ladeEnv() {
  const f = path.join(HIER, ".env");
  if (!fs.existsSync(f)) return;
  for (const z of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = z.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
})();
const CFG = {
  port: +process.env.PORT || 8080,
  host: process.env.HOST || "127.0.0.1",
  daten: path.resolve(HIER, process.env.WN_DATEN || "data"),
  kiKey: process.env.ANTHROPIC_API_KEY || "",
  kiModell: process.env.WN_KI_MODELL || "claude-sonnet-5-5",
  kiUrl: process.env.WN_KI_URL || "https://api.anthropic.com/v1/messages",
  kiLimit: +process.env.WN_KI_LIMIT_TAG || 400,
  setupCode: process.env.WN_SETUP_CODE || "",
  https: process.env.WN_HTTPS !== "0",
};
fs.mkdirSync(path.join(CFG.daten, "dateien"), { recursive: true });
fs.mkdirSync(path.join(CFG.daten, "sicherung"), { recursive: true });

/* ---------- Datenbank ---------- */
const db = new DatabaseSync(path.join(CFG.daten, "wn.db"));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS docs(col TEXT, id TEXT, data TEXT, geaendert TEXT, von TEXT, PRIMARY KEY(col,id));
CREATE TABLE IF NOT EXISTS nutzer(id TEXT PRIMARY KEY, login TEXT UNIQUE, name TEXT, rolle TEXT, hash TEXT, aktiv INTEGER DEFAULT 1, angelegt TEXT);
CREATE TABLE IF NOT EXISTS sitzungen(token TEXT PRIMARY KEY, uid TEXT, bis INTEGER);
CREATE TABLE IF NOT EXISTS dateien(id TEXT PRIMARY KEY, typ TEXT, groesse INTEGER, von TEXT, angelegt TEXT);
CREATE TABLE IF NOT EXISTS kilog(uid TEXT, tag TEXT, anzahl INTEGER, PRIMARY KEY(uid,tag));`);
const Q = {
  docGet: db.prepare("SELECT data FROM docs WHERE col=? AND id=?"),
  docAll: db.prepare("SELECT id,data FROM docs WHERE col=?"),
  docSet: db.prepare("INSERT INTO docs(col,id,data,geaendert,von) VALUES(?,?,?,?,?) ON CONFLICT(col,id) DO UPDATE SET data=excluded.data,geaendert=excluded.geaendert,von=excluded.von"),
  docDel: db.prepare("DELETE FROM docs WHERE col=? AND id=?"),
  nGet: db.prepare("SELECT * FROM nutzer WHERE id=?"),
  nLogin: db.prepare("SELECT * FROM nutzer WHERE login=?"),
  nAll: db.prepare("SELECT id,login,name,rolle,aktiv,angelegt FROM nutzer ORDER BY angelegt"),
  nCount: db.prepare("SELECT COUNT(*) n FROM nutzer"),
  nNew: db.prepare("INSERT INTO nutzer(id,login,name,rolle,hash,aktiv,angelegt) VALUES(?,?,?,?,?,1,?)"),
  sGet: db.prepare("SELECT * FROM sitzungen WHERE token=?"),
  sNew: db.prepare("INSERT INTO sitzungen(token,uid,bis) VALUES(?,?,?)"),
  sDel: db.prepare("DELETE FROM sitzungen WHERE token=?"),
  sDelUid: db.prepare("DELETE FROM sitzungen WHERE uid=?"),
  sClean: db.prepare("DELETE FROM sitzungen WHERE bis<?"),
  fNew: db.prepare("INSERT INTO dateien(id,typ,groesse,von,angelegt) VALUES(?,?,?,?,?)"),
  fGet: db.prepare("SELECT * FROM dateien WHERE id=?"),
  kiGet: db.prepare("SELECT anzahl FROM kilog WHERE uid=? AND tag=?"),
  kiInc: db.prepare("INSERT INTO kilog(uid,tag,anzahl) VALUES(?,?,1) ON CONFLICT(uid,tag) DO UPDATE SET anzahl=anzahl+1"),
};
const jetzt = () => new Date().toISOString();
const neueId = (p = "") => p + Date.now().toString(36) + crypto.randomBytes(5).toString("hex");

/* ---------- Rechte (wie in der Claude-Version) ----------
   staff = Chef und Mitarbeiter, chef = nur Chef, self = Mitarbeiter nur das eigene Dokument (id = eigene Nutzer-ID) */
const RECHTE = {
  tickets: { r: "staff", w: "staff" }, belege: { r: "staff", w: "staff" }, einnahmen: { r: "staff", w: "staff" }, personen: { r: "staff", w: "staff" },
  einstellungen: { r: "staff", w: "chef" }, team: { r: "staff", w: "chef" },
  urlaub: { r: "staff", w: "chef", sw: true }, urlaubok: { r: "staff", w: "chef" }, status: { r: "staff", w: "chef", sw: true },
  profil: { r: "chef", w: "chef", sr: true, sw: true }, vbest: { r: "chef", w: "chef", sr: true, sw: true }, zeiten: { r: "chef", w: "chef", sr: true, sw: true },
  krank: { r: "chef", w: "chef", sr: true, sw: true }, vertraege: { r: "chef", w: "chef", sr: true },
};
function darf(u, col, id, art) {
  if (!u) return false;
  if (u.rolle === "chef") return true;
  const r = RECHTE[col]; if (!r) return false;
  if (r[art] === "staff") return true;
  return id != null && id === u.id && !!r[art === "r" ? "sr" : "sw"];
}

/* ---------- Passwörter & Sitzungen ---------- */
function hashPw(pw) { const salt = crypto.randomBytes(16); const h = crypto.scryptSync(String(pw), salt, 64); return salt.toString("hex") + ":" + h.toString("hex"); }
function pruefPw(pw, gespeichert) {
  const [s, h] = String(gespeichert || "").split(":"); if (!s || !h) return false;
  const neu = crypto.scryptSync(String(pw), Buffer.from(s, "hex"), 64);
  return crypto.timingSafeEqual(neu, Buffer.from(h, "hex"));
}
const SITZUNG_TAGE = 60;
function cookies(req) { const o = {}; (req.headers.cookie || "").split(";").forEach(c => { const i = c.indexOf("="); if (i > 0) o[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim()); }); return o; }
function nutzerAus(req) {
  const t = cookies(req).wn_sitzung; if (!t) return null;
  const s = Q.sGet.get(t); if (!s || s.bis < Date.now()) return null;
  const u = Q.nGet.get(s.uid); if (!u || !u.aktiv) return null;
  return { id: u.id, name: u.name, rolle: u.rolle, login: u.login, token: t };
}
function setzeSitzung(res, uid) {
  const t = crypto.randomBytes(32).toString("hex");
  Q.sNew.run(t, uid, Date.now() + SITZUNG_TAGE * 864e5);
  res.setHeader("Set-Cookie", `wn_sitzung=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SITZUNG_TAGE * 86400}${CFG.https ? "; Secure" : ""}`);
}
const fehlVersuche = new Map();
function bremse(ip) { const v = fehlVersuche.get(ip) || { n: 0, t: Date.now() }; if (Date.now() - v.t > 15 * 60e3) { v.n = 0; v.t = Date.now(); } return v; }

/* ---------- Live-Verbindungen (Server-Sent Events) ---------- */
const live = new Set();
function melde(col, id, data) {
  const msg = `data: ${JSON.stringify({ col, id, data })}\n\n`;
  for (const c of live) if (darf(c.u, col, id, "r")) { try { c.res.write(msg); } catch (e) {} }
}
setInterval(() => { for (const c of live) { try { c.res.write(": ping\n\n"); } catch (e) {} } }, 25e3);

/* ---------- Hilfen ---------- */
function json(res, code, obj) { const b = JSON.stringify(obj); res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(b); }
function body(req, max = 25e6) {
  return new Promise((ok, no) => {
    const teile = []; let n = 0;
    req.on("data", d => { n += d.length; if (n > max) { no(Object.assign(new Error("zu groß"), { code: 413 })); req.destroy(); } else teile.push(d); });
    req.on("end", () => ok(Buffer.concat(teile))); req.on("error", no);
  });
}
async function bodyJson(req, max) { const b = await body(req, max); try { return JSON.parse(b.toString("utf8") || "{}"); } catch (e) { throw Object.assign(new Error("ungültige Daten"), { code: 400 }); } }
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json" };
function datei(res, f, extra = {}) {
  fs.stat(f, (e, s) => {
    if (e || !s.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Nicht gefunden"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream", "Content-Length": s.size, ...extra });
    fs.createReadStream(f).pipe(res);
  });
}
function mergeTief(a, b) { return Object.assign({}, a || {}, b || {}); } // wie Firestore update(): oberste Ebene ersetzen

/* ---------- KI (Claude über Ihren API-Schlüssel) ---------- */
async function kiAnfrage(u, { prompt, bilder, json: alsJson }) {
  if (!CFG.kiKey) throw Object.assign(new Error("KI ist auf dem Server noch nicht eingerichtet (ANTHROPIC_API_KEY fehlt in .env)."), { status: 503, code: "no_key" });
  const tag = jetzt().slice(0, 10);
  if ((Q.kiGet.get(u.id, tag)?.anzahl || 0) >= CFG.kiLimit) throw Object.assign(new Error("Tageslimit für KI erreicht."), { status: 429, code: "rate_limited" });
  Q.kiInc.run(u.id, tag);
  const inhalt = [];
  for (const b of (bilder || []).slice(0, 8)) if (b && b.data) inhalt.push({ type: "image", source: { type: "base64", media_type: /^image\/(jpeg|png|gif|webp)$/.test(b.media_type) ? b.media_type : "image/jpeg", data: b.data } });
  inhalt.push({ type: "text", text: String(prompt || "") + (alsJson ? "\n\nAntworte ausschließlich mit gültigem JSON, ohne Erklärung und ohne Codeblock." : "") });
  const r = await fetch(CFG.kiUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": CFG.kiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: CFG.kiModell, max_tokens: 4096, messages: [{ role: "user", content: inhalt }] }),
  });
  if (r.status === 429 || r.status === 529) throw Object.assign(new Error("KI gerade ausgelastet – bitte gleich nochmal."), { status: 429, code: "rate_limited" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error("KI-Fehler: " + (j?.error?.message || r.status)), { status: 502, code: "ki_fehler" });
  return (j.content || []).filter(c => c.type === "text").map(c => c.text).join("\n");
}

/* ---------- API ---------- */
const COL_OK = /^[a-z0-9_]{1,40}$/i, ID_OK = /^[A-Za-z0-9_\-.:@]{1,120}$/;
async function api(req, res, url) {
  const p = url.pathname.replace(/^\/api\//, "").split("/").map(decodeURIComponent);
  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;

  /* Anmelden / Ersteinrichtung (ohne Sitzung) */
  if (p[0] === "status" && req.method === "GET") return json(res, 200, { eingerichtet: Q.nCount.get().n > 0, setupCode: !!CFG.setupCode, ki: !!CFG.kiKey });
  if (p[0] === "setup" && req.method === "POST") {
    if (Q.nCount.get().n > 0) return json(res, 409, { fehler: "Es gibt schon einen Chef-Zugang." });
    const d = await bodyJson(req, 1e5);
    if (CFG.setupCode && d.code !== CFG.setupCode) return json(res, 403, { fehler: "Einrichtungs-Code stimmt nicht." });
    if (!d.login || String(d.pass || "").length < 8) return json(res, 400, { fehler: "Benutzername und Passwort (mind. 8 Zeichen) eingeben." });
    const id = neueId("u_"); Q.nNew.run(id, String(d.login).trim().toLowerCase(), String(d.name || "Chef").trim(), "chef", hashPw(d.pass), jetzt());
    setzeSitzung(res, id); return json(res, 200, { ok: true });
  }
  if (p[0] === "login" && req.method === "POST") {
    const v = bremse(ip); if (v.n >= 10) return json(res, 429, { fehler: "Zu viele Versuche – bitte 15 Minuten warten." });
    const d = await bodyJson(req, 1e5);
    const u = Q.nLogin.get(String(d.login || "").trim().toLowerCase());
    if (!u || !u.aktiv || !pruefPw(d.pass, u.hash)) { v.n++; fehlVersuche.set(ip, v); return json(res, 401, { fehler: "Benutzername oder Passwort falsch." }); }
    fehlVersuche.delete(ip); setzeSitzung(res, u.id); return json(res, 200, { ok: true, rolle: u.rolle });
  }

  const u = nutzerAus(req);
  if (!u) return json(res, 401, { fehler: "Bitte anmelden." });
  if (req.method !== "GET" && req.headers["x-wn"] !== "1") return json(res, 403, { fehler: "Ungültige Anfrage." }); // Schutz gegen fremde Seiten (CSRF)

  if (p[0] === "logout") { Q.sDel.run(u.token); res.setHeader("Set-Cookie", "wn_sitzung=; Path=/; Max-Age=0"); return json(res, 200, { ok: true }); }
  if (p[0] === "ich") return json(res, 200, { id: u.id, name: u.name, rolle: u.rolle, login: u.login, ki: !!CFG.kiKey });
  if (p[0] === "passwort" && req.method === "POST") {
    const d = await bodyJson(req, 1e5); const n = Q.nGet.get(u.id);
    if (!pruefPw(d.alt, n.hash)) return json(res, 403, { fehler: "Altes Passwort stimmt nicht." });
    if (String(d.neu || "").length < 8) return json(res, 400, { fehler: "Neues Passwort: mindestens 8 Zeichen." });
    db.prepare("UPDATE nutzer SET hash=? WHERE id=?").run(hashPw(d.neu), u.id); return json(res, 200, { ok: true });
  }
  if (p[0] === "profile" && req.method === "POST") {
    const d = await bodyJson(req, 1e5); const o = {};
    for (const id of (d.ids || []).slice(0, 500)) { const n = Q.nGet.get(String(id)); if (n) o[id] = { name: n.name }; }
    return json(res, 200, o);
  }

  /* Zugänge verwalten (nur Chef) */
  if (p[0] === "nutzer") {
    if (u.rolle !== "chef") return json(res, 403, { fehler: "Nur für den Chef." });
    if (req.method === "GET") return json(res, 200, Q.nAll.all());
    if (req.method === "POST") {
      const d = await bodyJson(req, 1e5); const login = String(d.login || "").trim().toLowerCase();
      if (!/^[a-z0-9._@-]{3,40}$/.test(login)) return json(res, 400, { fehler: "Benutzername: 3–40 Zeichen, nur Buchstaben, Zahlen, Punkt, Strich." });
      if (String(d.pass || "").length < 8) return json(res, 400, { fehler: "Passwort: mindestens 8 Zeichen." });
      if (Q.nLogin.get(login)) return json(res, 409, { fehler: "Diesen Benutzernamen gibt es schon." });
      const id = neueId("u_"); Q.nNew.run(id, login, String(d.name || login).trim(), d.rolle === "chef" ? "chef" : "mitarbeiter", hashPw(d.pass), jetzt());
      return json(res, 200, { ok: true, id });
    }
    if (req.method === "PATCH" && p[1]) {
      const d = await bodyJson(req, 1e5); const n = Q.nGet.get(p[1]); if (!n) return json(res, 404, { fehler: "Unbekannt." });
      if (p[1] === u.id && (d.aktiv === false || (d.rolle && d.rolle !== "chef"))) return json(res, 400, { fehler: "Den eigenen Chef-Zugang kann man nicht sperren." });
      if (d.name) db.prepare("UPDATE nutzer SET name=? WHERE id=?").run(String(d.name).trim(), p[1]);
      if (d.rolle) db.prepare("UPDATE nutzer SET rolle=? WHERE id=?").run(d.rolle === "chef" ? "chef" : "mitarbeiter", p[1]);
      if (d.pass) { if (String(d.pass).length < 8) return json(res, 400, { fehler: "Passwort: mindestens 8 Zeichen." }); db.prepare("UPDATE nutzer SET hash=? WHERE id=?").run(hashPw(d.pass), p[1]); Q.sDelUid.run(p[1]); }
      if (typeof d.aktiv === "boolean") { db.prepare("UPDATE nutzer SET aktiv=? WHERE id=?").run(d.aktiv ? 1 : 0, p[1]); if (!d.aktiv) Q.sDelUid.run(p[1]); }
      return json(res, 200, { ok: true });
    }
  }

  /* Live-Änderungen */
  if (p[0] === "live") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("retry: 3000\n\n");
    const c = { u, res }; live.add(c); req.on("close", () => live.delete(c)); return;
  }

  /* Datenbank */
  if (p[0] === "col" && req.method === "GET") {
    const col = p[1]; if (!COL_OK.test(col)) return json(res, 400, { fehler: "?" });
    const o = {};
    if (darf(u, col, null, "r")) { for (const z of Q.docAll.all(col)) o[z.id] = JSON.parse(z.data); }
    else if (darf(u, col, u.id, "r")) { const z = Q.docGet.get(col, u.id); if (z) o[u.id] = JSON.parse(z.data); }
    else return json(res, 403, { fehler: "Keine Berechtigung." });
    return json(res, 200, o);
  }
  if (p[0] === "doc") {
    const col = p[1], id = p[2];
    if (!COL_OK.test(col) || !ID_OK.test(id || "")) return json(res, 400, { fehler: "?" });
    if (req.method === "GET") {
      if (!darf(u, col, id, "r")) return json(res, 403, { fehler: "Keine Berechtigung." });
      const z = Q.docGet.get(col, id); return json(res, 200, { exists: !!z, data: z ? JSON.parse(z.data) : null });
    }
    if (!darf(u, col, id, "w")) return json(res, 403, { fehler: "Keine Berechtigung." });
    if (req.method === "DELETE") { Q.docDel.run(col, id); melde(col, id, null); return json(res, 200, { ok: true }); }
    const d = await bodyJson(req, 8e6);
    let neu = d.data && typeof d.data === "object" ? d.data : {};
    if (req.method === "PATCH") { const alt = Q.docGet.get(col, id); neu = mergeTief(alt ? JSON.parse(alt.data) : {}, neu); }
    Q.docSet.run(col, id, JSON.stringify(neu), jetzt(), u.id); melde(col, id, neu);
    return json(res, 200, { ok: true });
  }

  /* Dateien (Fotos, Belege, Verträge) */
  if (p[0] === "datei") {
    if (req.method === "POST") {
      const b = await body(req, 30e6); const id = neueId("f_");
      const typ = String(req.headers["content-type"] || "application/octet-stream").slice(0, 100);
      fs.writeFileSync(path.join(CFG.daten, "dateien", id), b); Q.fNew.run(id, typ, b.length, u.id, jetzt());
      return json(res, 200, { id });
    }
    if (req.method === "GET" && p[1]) {
      const f = Q.fGet.get(p[1]); if (!f) return json(res, 404, { fehler: "Nicht gefunden" });
      return datei(res, path.join(CFG.daten, "dateien", f.id), { "Content-Type": f.typ, "Cache-Control": "private, max-age=31536000, immutable" });
    }
  }

  /* KI */
  if (p[0] === "ki" && req.method === "POST") {
    const d = await bodyJson(req, 30e6);
    try { return json(res, 200, { text: await kiAnfrage(u, d) }); }
    catch (e) { return json(res, e.status || 500, { fehler: e.message, code: e.code || "fehler" }); }
  }
  return json(res, 404, { fehler: "Unbekannte Adresse" });
}

/* ---------- Server ---------- */
const OEFFENTLICH_VERBOTEN = /(^|\/)(\.|server\/|data\/|node_modules\/)/;
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  try {
    const url = new URL(req.url, "http://x");
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (url.pathname === "/team/wn-server.js") return datei(res, path.join(HIER, "client.js"), { "Cache-Control": "no-cache" });
    if (url.pathname === "/anmelden" || url.pathname === "/zugaenge") return datei(res, path.join(HIER, url.pathname.slice(1) + ".html"), { "Cache-Control": "no-cache" });
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    if (rel === "team") { res.writeHead(302, { Location: "/team/" }); return res.end(); }
    if (OEFFENTLICH_VERBOTEN.test(rel)) { res.writeHead(404); return res.end(); }
    if (rel === "team/index.html" && !nutzerAus(req)) { res.writeHead(302, { Location: "/anmelden" }); return res.end(); }
    const f = path.resolve(WEB, rel);
    if (!f.startsWith(WEB + path.sep)) { res.writeHead(404); return res.end(); }
    datei(res, f, { "Cache-Control": rel.endsWith(".html") ? "no-cache" : "public, max-age=3600" });
  } catch (e) {
    if (!res.headersSent) json(res, e.code === 413 ? 413 : e.code === 400 ? 400 : 500, { fehler: e.code === 413 ? "Datei zu groß" : e.code === 400 ? e.message : "Serverfehler" });
    if (!e.code) console.error(e);
  }
});

/* ---------- Tägliche Sicherung (14 Tage) ---------- */
function sichern() {
  try {
    const ziel = path.join(CFG.daten, "sicherung", "wn-" + jetzt().slice(0, 10) + ".db");
    if (!fs.existsSync(ziel)) db.exec(`VACUUM INTO '${ziel.replace(/'/g, "''")}'`);
    const alle = fs.readdirSync(path.join(CFG.daten, "sicherung")).filter(f => /^wn-.*\.db$/.test(f)).sort();
    for (const f of alle.slice(0, Math.max(0, alle.length - 14))) fs.unlinkSync(path.join(CFG.daten, "sicherung", f));
    Q.sClean.run(Date.now());
  } catch (e) { console.error("Sicherung:", e.message); }
}
setInterval(sichern, 6 * 3600e3); setTimeout(sichern, 5e3);

server.listen(CFG.port, CFG.host, () => {
  console.log(`WN-Server läuft auf http://${CFG.host}:${CFG.port}  ·  KI: ${CFG.kiKey ? "an (" + CFG.kiModell + ")" : "AUS – ANTHROPIC_API_KEY in .env eintragen"}`);
  if (!Q.nCount.get().n) console.log("Noch kein Zugang – bitte /anmelden öffnen und den Chef-Zugang anlegen" + (CFG.setupCode ? " (Einrichtungs-Code aus .env)." : "."));
});
