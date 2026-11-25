/* WN Team-Bereich – Server-Modus
   Wird nur vom eigenen WN-Server ausgeliefert (/team/wn-server.js). Verbindet die Team-App mit
   der Server-Datenbank, dem Foto-Speicher, der KI (über den API-Schlüssel des Servers) und dem Mikrofon. */
(function () {
  if (window.claude && window.claude.use) return;
  var H = { "Content-Type": "application/json", "x-wn": "1" };
  function zurAnmeldung() { location.href = "/anmelden"; }
  async function api(pfad, opt) {
    opt = opt || {};
    var r = await fetch("/api/" + pfad, Object.assign({ credentials: "same-origin" }, opt, { headers: Object.assign({}, opt.body && !(opt.body instanceof Blob) ? H : { "x-wn": "1" }, opt.headers || {}) }));
    if (r.status === 401) { zurAnmeldung(); throw new Error("Bitte anmelden"); }
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) { var e = new Error(j.fehler || ("Fehler " + r.status)); e.code = j.code || (r.status === 403 ? "forbidden" : r.status === 429 ? "rate_limited" : "fehler"); throw e; }
    return j;
  }
  function cl(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  var n = 0; function nid() { return Date.now().toString(36) + (++n).toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- Datenbank mit Live-Abgleich ---------- */
  var cols = {}, docs = {}, colSubs = {}, docSubs = {};
  function feuerCol(c) { (colSubs[c] || []).forEach(function (s) { s.f(); }); }
  function feuerDoc(c, id) { (docSubs[c + "/" + id] || []).forEach(function (s) { s.f(); }); }
  function setzeLokal(c, id, data) {
    if (cols[c]) { if (data == null) delete cols[c][id]; else cols[c][id] = data; }
    if ((c + "/" + id) in docs) docs[c + "/" + id] = data == null ? null : data;
    feuerCol(c); feuerDoc(c, id);
  }
  async function ladeCol(c) { try { cols[c] = await api("col/" + encodeURIComponent(c)); feuerCol(c); } catch (e) { (colSubs[c] || []).forEach(function (s) { s.err && s.err(e); }); } }
  async function ladeDoc(c, id) { try { var d = await api("doc/" + encodeURIComponent(c) + "/" + encodeURIComponent(id)); docs[c + "/" + id] = d.exists ? d.data : null; feuerDoc(c, id); } catch (e) { (docSubs[c + "/" + id] || []).forEach(function (s) { s.err && s.err(e); }); } }
  function schreib(meth, c, id, data) {
    return api("doc/" + encodeURIComponent(c) + "/" + encodeURIComponent(id), { method: meth, body: data === undefined ? undefined : JSON.stringify({ data: data }) })
      .catch(function (e) { ladeCol(c); ladeDoc(c, id); throw e; });
  }
  function aktuell(c, id) { var k = c + "/" + id; if (k in docs && docs[k]) return docs[k]; return cols[c] ? cols[c][id] : undefined; }
  function ref(c, id) {
    return {
      id: id,
      set: async function (d) { setzeLokal(c, id, cl(d) || {}); await schreib("PUT", c, id, cl(d) || {}); },
      update: async function (d) { setzeLokal(c, id, Object.assign({}, aktuell(c, id) || {}, cl(d))); await schreib("PATCH", c, id, cl(d)); },
      delete: async function () { setzeLokal(c, id, null); await schreib("DELETE", c, id); },
      get: async function () { await ladeDoc(c, id); var v = docs[c + "/" + id]; return { exists: !!v, id: id, data: function () { return cl(v || {}); } }; },
      onSnapshot: function (cb, err) {
        var k = c + "/" + id, s = { f: function () { var v = k in docs ? docs[k] : (cols[c] || {})[id]; cb({ exists: !!v, id: id, data: function () { return cl(v || {}); } }); }, err: err };
        (docSubs[k] = docSubs[k] || []).push(s);
        if (k in docs) setTimeout(s.f, 0); else ladeDoc(c, id);
        return function () { docSubs[k] = docSubs[k].filter(function (x) { return x !== s; }); };
      }
    };
  }
  var db = {
    collection: function (c) {
      return {
        doc: function (id) { return ref(c, id || nid()); },
        onSnapshot: function (cb, err) {
          var s = { f: function () { var o = cols[c] || {}; cb({ docs: Object.keys(o).map(function (id) { return { id: id, data: function () { return cl(o[id]); } }; }), metadata: { fromCache: false } }); }, err: err };
          (colSubs[c] = colSubs[c] || []).push(s);
          if (cols[c]) setTimeout(s.f, 0); else ladeCol(c);
          return function () { colSubs[c] = colSubs[c].filter(function (x) { return x !== s; }); };
        }
      };
    },
    doc: function (p) { var a = p.split("/"); return ref(a[0], a[1]); }
  };
  var es, warOffen = false;
  function verbinde() {
    es = new EventSource("/api/live");
    es.onmessage = function (e) { try { var m = JSON.parse(e.data); setzeLokal(m.col, m.id, m.data); } catch (x) {} };
    es.onopen = function () { if (warOffen) { Object.keys(cols).forEach(ladeCol); Object.keys(docs).forEach(function (k) { var a = k.split("/"); ladeDoc(a[0], a[1]); }); } warOffen = true; };
  }

  /* ---------- Dateien ---------- */
  window.__wnBlob = function (id) { return id ? "/api/datei/" + encodeURIComponent(id) : ""; };
  var assets = { upload: async function (b) { return await api("datei", { method: "POST", body: b, headers: { "Content-Type": (b && b.type) || "application/octet-stream" } }); } };
  var downloads = { save: async function (o) { var d = o.data instanceof Blob ? o.data : new Blob([o.data]); var a = document.createElement("a"); a.href = URL.createObjectURL(d); a.download = o.filename || "download"; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000); } };

  /* ---------- KI ---------- */
  function b64(blob) { return new Promise(function (ok, no) { var fr = new FileReader(); fr.onload = function () { var s = String(fr.result); ok({ media_type: (s.match(/^data:([^;]+)/) || [])[1] || blob.type || "image/jpeg", data: s.split(",")[1] || "" }); }; fr.onerror = no; fr.readAsDataURL(blob); }); }
  async function bildDaten(x) {
    if (!x) return null;
    if (x instanceof Blob) return b64(x);
    if (typeof x === "string") { if (x.indexOf("data:") === 0) return { media_type: x.slice(5, x.indexOf(";")), data: x.split(",")[1] }; var r = await fetch(x, { credentials: "same-origin" }); return b64(await r.blob()); }
    if (x.data && typeof x.data === "string") return { media_type: x.mediaType || x.media_type || "image/jpeg", data: x.data };
    if (x.blob instanceof Blob) return b64(x.blob);
    return null;
  }
  async function frage(prompt, opts, alsJson) {
    var bilder = [];
    for (var i of ((opts && opts.images) || [])) { var d = await bildDaten(i); if (d) bilder.push(d); }
    return api("ki", { method: "POST", body: JSON.stringify({ prompt: String(prompt), bilder: bilder, json: !!alsJson }) });
  }
  function leseJson(t) { t = String(t || "").replace(/```(?:json)?/g, "").trim(); try { return JSON.parse(t); } catch (e) {} var a = t.search(/[\[{]/), b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]")); if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1)); throw new Error("KI-Antwort unlesbar"); }
  var sample = async function (prompt, opts) { var r = await frage(prompt, opts, false); return { text: r.text }; };
  sample.json = async function (prompt, opts) { var r = await frage(prompt, opts, true); return leseJson(r.text); };

  /* ---------- Mikrofon (Spracherkennung des Browsers) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, dictation = null;
  if (SR) {
    var LANG = { de: "de-DE", en: "en-GB", tr: "tr-TR", ar: "ar-SA", ru: "ru-RU", es: "es-ES", fr: "fr-FR", nl: "nl-NL" };
    var cbP = [], cbF = [], cbS = [], rec = null;
    dictation = {
      onPartial: function (f) { cbP.push(f); }, onFinal: function (f) { cbF.push(f); }, onState: function (f) { cbS.push(f); },
      stop: async function () { if (rec) rec.stop(); },
      start: function () {
        return new Promise(function (ok, no) {
          var fehler = null; rec = new SR();
          var l = "de"; try { l = localStorage.getItem("wn_ui_lang") || "de"; } catch (e) {}
          rec.lang = LANG[l] || "de-DE"; rec.interimResults = true; rec.continuous = true;
          rec.onresult = function (e) {
            var zw = "";
            for (var i = e.resultIndex; i < e.results.length; i++) { var t = e.results[i][0].transcript; if (e.results[i].isFinal) cbF.forEach(function (f) { f({ text: t.trim() }); }); else zw += t; }
            if (zw) cbP.forEach(function (f) { f({ text: zw.trim() }); });
          };
          rec.onerror = function (e) { fehler = Object.assign(new Error(e.error), { code: e.error === "not-allowed" || e.error === "service-not-allowed" ? "not_granted" : "fehler" }); };
          rec.onend = function () { rec = null; cbS.forEach(function (f) { f({ state: "idle" }); }); fehler ? no(fehler) : ok(); };
          try { rec.start(); cbS.forEach(function (f) { f({ state: "listening" }); }); } catch (e) { no(e); }
        });
      }
    };
  }

  /* ---------- Anmeldung ---------- */
  var ich = null;
  var bereit = (async function () {
    try { ich = await api("ich"); } catch (e) { return; }
    window.__wnKiLangsam = ich.kiArt === "lokal"; // eigene KI ohne Grafikkarte: Zusatzschritte sparen
    verbinde();
  })();
  var user = {
    isOwner: async function () { await bereit; return !!ich && ich.rolle === "chef"; },
    canEdit: async function () { await bereit; return !!ich; },
    id: async function () { await bereit; return ich && ich.id; },
    profiles: async function (ids) { return api("profile", { method: "POST", body: JSON.stringify({ ids: ids }) }); }
  };
  var caps = { db: db, user: user, assets: assets, downloads: downloads, sample: sample, dictation: dictation };
  window.claude = { use: async function (name) { await bereit; if (name === "sample" && ich && !ich.ki) return null; return Object.prototype.hasOwnProperty.call(caps, name) ? caps[name] : null; } };
  window.__wnServer = true;

  document.addEventListener("DOMContentLoaded", async function () {
    await bereit; if (!ich) return;
    var b = document.createElement("div"); b.className = "no-ui"; b.id = "wnSrvBar";
    b.style.cssText = "background:#0B1220;color:#9FB0C8;font:500 12px Inter,system-ui,sans-serif;padding:5px 12px;display:flex;gap:12px;justify-content:center;align-items:center;flex-wrap:wrap;border-bottom:1px solid #1E293B";
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    b.innerHTML = "<span>👤 " + esc(ich.name) + "</span>" + (ich.rolle === "chef" ? "<a href='/zugaenge' style='color:#93C5FD'>Zugänge verwalten</a>" : "<a href='/zugaenge' style='color:#93C5FD'>Passwort ändern</a>") +
      "<a href='#' id='wnAbm' style='color:#93C5FD'>Abmelden</a>" + (!ich.ki && ich.rolle === "chef" ? "<span style='color:#FBBF24'>KI aus – siehe ANLEITUNG.md</span>" : "");
    document.body.insertBefore(b, document.body.firstChild);
    document.getElementById("wnAbm").onclick = async function (e) { e.preventDefault(); try { await api("logout", { method: "POST" }); } catch (x) {} zurAnmeldung(); };
  });
})();
