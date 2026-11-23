/* WN Entrümpelung – App
   Alles läuft im Browser. Gespeichert wird nur im Browser dieses Geräts (localStorage, Schlüssel beginnen mit "wn_"),
   damit es nie mit anderen Apps auf derselben GitHub-Pages-Adresse (z. B. JoumHome, "hv_...") kollidiert. */
(function () {
  "use strict";

  var C = window.WN_CONFIG || {};
  var LANGS = window.WN_LANGS, IDX = window.WN_IDX, T = window.WN_T;
  var $app = document.getElementById("app");

  /* ---------- Speicher ---------- */
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem("wn_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("wn_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  function guessLang() { var n = String(navigator.language || "de").slice(0, 2).toLowerCase(); return IDX[n] != null ? n : "de"; }
  function newDraft() { var c = LS.get("contact", null) || {}; return { services: [], obj: "flat", area: "", floor: 0, elevator: false, fill: "normal", mode: "onsite", date: "", time: "", name: c.name || "", phone: c.phone || "", address: c.address || "", note: "", consent: !!c.name }; }

  var S = {
    lang: LS.get("lang", null) || guessLang(),
    screen: "home", step: 1, orderId: null,
    draft: Object.assign(newDraft(), LS.get("draft", {})),
    photos: [], query: "", filter: "all",
    settings: Object.assign({ auto: false, rate: 1, theme: "night", accent: "auto" }, LS.get("settings", {})),
    orders: LS.get("orders", []), recent: LS.get("recent", []),
    convo: [], listening: false, tip: -1, sheet: false, lightbox: -1
  };
  if (IDX[S.lang] == null) S.lang = "de";

  /* ---------- Hilfsfunktionen ---------- */
  function t(k, vars) {
    var row = T[k], s = row ? (row[IDX[S.lang]] || row[0]) : k;
    if (vars) for (var v in vars) s = s.split("{" + v + "}").join(vars[v]);
    return s;
  }
  function plain(s) { return String(s).replace(/­/g, ""); }        // ohne weiche Trennstriche (für Vorlesen, WhatsApp)
  function de(k) { return T[k] ? plain(T[k][0]) : k; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function L() { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === S.lang) return LANGS[i]; return LANGS[0]; }
  function norm(s) {
    return String(s || "").replace(/­/g, "").replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .toLowerCase().normalize("NFD").replace(/[̀-ًͯ-ٰٟ]/g, "").replace(/[إأآ]/g, "ا");
  }
  function saveDraft() { LS.set("draft", S.draft); }
  function saveSettings() { LS.set("settings", S.settings); }

  var P = {
    back: '<path d="m15 18-6-6 6-6"/>', chev: '<path d="m9 18 6-6-6-6"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z"/>',
    speaker: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    speak1: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
    house: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    office: '<rect x="4" y="3" width="10" height="18"/><path d="M14 9h6v12h-6M7 7h4M7 11h4M7 15h4"/>',
    recycle: '<path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L7.4 9"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7l-1.2-2"/><path d="m14 16-3 3 3 3"/><path d="M8.3 13.6 7.4 9l-4.6.9"/><path d="m9.3 5.5 1.3-2.2a1.8 1.8 0 0 1 3 0l3.9 6.7"/><path d="m13.4 9.1 4.1 1-1.1-4.1"/>',
    broom: '<path d="M19 2 11.5 13"/><path d="M8 12.5 14 16l-2.5 6L3 17z"/>',
    truck: '<rect x="1" y="6" width="14" height="10"/><path d="M15 9h4l3 3.5V16h-7"/><circle cx="5.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    add: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/>',
    list: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>', globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    team: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5"/>',
    boss: '<path d="M3 7h18v13H3z"/><path d="M8 7V4h8v3M3 12h18"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    palette: '<path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/><circle cx="7.5" cy="11.5" r="1.3"/><circle cx="10.5" cy="7" r="1.3"/><circle cx="15.5" cy="7.5" r="1.3"/>'
  };
  function ic(n, s, cls) { s = s || 22; return '<svg class="ic ' + (cls || "") + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; }

  var SERVICES = [
    { id: "household", icon: "house" }, { id: "office", icon: "office" }, { id: "disposal", icon: "recycle" },
    { id: "cleaning", icon: "broom" }, { id: "transport", icon: "truck" }, { id: "basement", icon: "box" }
  ];
  var OBJECTS = ["flat", "house", "cellar", "office"];
  var TIMES = ["08:00", "10:00", "12:00", "14:00", "16:00"];
  /* Volumen-Schätzung: m³ je m² Wohnfläche nach Füllgrad (Erfahrungswerte, unverbindlich) */
  var FILL = { wenig: 0.25, normal: 0.5, voll: 0.8, messie: 1.2 };
  function estimate(d) {
    var a = parseFloat(String(d.area || "").replace(",", ".")), f = FILL[d.fill || "normal"] || 0.5;
    if (!a || a <= 0) return null;
    var m = a * f, lo = Math.max(1, Math.round(m * 0.8)), hi = Math.max(lo + 1, Math.round(m * 1.2)), cap = (window.WN_CONFIG && Number(window.WN_CONFIG.transporterM3)) || 12;
    return { lo: lo, hi: hi, n: Math.max(1, Math.ceil(hi / cap)) };
  }
  function estBox(d) {
    var e = estimate(d);
    if (!e) return '<div class="muted xs">' + esc(t("estNeedArea")) + '</div>';
    return '<b>' + esc(t("estText", { a: e.lo, b: e.hi, n: e.n })) + '</b><span class="muted xs" style="display:block;margin-top:4px">' + esc(t("estNote")) + '</span>';
  }
  var VEHICLE = [["links", "v_left"], ["rechts", "v_right"], ["vorne", "v_front"], ["hinten", "v_back"]];
  function vimg(i) { return "bilder/fahrzeug-" + VEHICLE[i][0] + ".jpg"; }

  /* Logo: einfarbig (ohne Verläufe) – wird auf allen Handys richtig angezeigt und passt sich dem Design an */
  function logo() {
    var s = 'style="fill:var(--logo)"', a = 'style="fill:var(--logoAcc)"';
    return '<svg viewBox="170 50 700 300" role="img" aria-label="WN Entrümpelung">' +
      '<path ' + a + ' d="M470,330 C300,352 160,322 178,250 C192,200 258,170 330,160 C252,192 214,238 230,278 C250,318 352,330 470,330 Z"/>' +
      '<path ' + s + ' d="M540,130 V88 H564 V144"/>' +
      '<polyline points="228,172 420,60 612,172" style="fill:none;stroke:var(--logo)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<rect ' + s + ' x="404" y="98" width="13" height="13"/><rect ' + s + ' x="420" y="98" width="13" height="13"/><rect ' + s + ' x="404" y="114" width="13" height="13"/><rect ' + s + ' x="420" y="114" width="13" height="13"/>' +
      '<text ' + s + ' x="420" y="318" text-anchor="middle" font-family="Montserrat,Arial Black,sans-serif" font-weight="900" font-size="190" letter-spacing="-8" direction="ltr">WN</text>' +
      '<rect ' + s + ' x="604" y="178" width="158" height="122" rx="6"/><path ' + s + ' d="M766,212 H818 L854,256 V300 H766 Z"/>' +
      '<circle cx="646" cy="304" r="22" style="fill:var(--bg);stroke:var(--logo)" stroke-width="7"/><circle cx="814" cy="304" r="22" style="fill:var(--bg);stroke:var(--logo)" stroke-width="7"/></svg>';
  }

  /* ---------- Designs & Farben ---------- */
  var THEMES = {
    night:    { dark: true,  accent: "blue",  pv: ["#0B0D11", "#161A21", "#D6DBE2"] },
    light:    { dark: false, accent: "blue",  pv: ["#F4F6FA", "#FFFFFF", "#0F2A4A"] },
    silver:   { dark: false, accent: "blue",  pv: ["#E3E7ED", "#F5F7FA", "#0B1B33"] },
    navy:     { dark: true,  accent: "amber", pv: ["#0B1B33", "#12284A", "#E8EDF4"] },
    contrast: { dark: true,  accent: null,    pv: ["#000000", "#000000", "#FFFFFF"] }
  };
  var ACCENTS = {
    blue:   { a: "#2563EB", dl: "#93C5FD", dbg: "#0F2547", ll: "#1D4ED8", lbg: "#DBEAFE", on: "#FFFFFF" },
    teal:   { a: "#0E7C86", dl: "#5EEAD4", dbg: "#0B2F33", ll: "#0B5F67", lbg: "#CCFBF1", on: "#FFFFFF" },
    green:  { a: "#15803D", dl: "#86EFAC", dbg: "#0F2E1B", ll: "#166534", lbg: "#DCFCE7", on: "#FFFFFF" },
    orange: { a: "#C2410C", dl: "#FDBA74", dbg: "#3A1D0B", ll: "#9A3412", lbg: "#FFEDD5", on: "#FFFFFF" },
    red:    { a: "#DC2626", dl: "#FCA5A5", dbg: "#3A1212", ll: "#B91C1C", lbg: "#FEE2E2", on: "#FFFFFF" },
    purple: { a: "#7C3AED", dl: "#C4B5FD", dbg: "#24124A", ll: "#6D28D9", lbg: "#EDE9FE", on: "#FFFFFF" },
    amber:  { a: "#F59E0B", dl: "#FCD34D", dbg: "#3A2A06", ll: "#B45309", lbg: "#FEF3C7", on: "#111827" }
  };
  var ACCENT_LIST = ["blue", "teal", "green", "orange", "red", "purple"];
  function applyTheme() {
    var th = THEMES[S.settings.theme] ? S.settings.theme : "night", root = document.documentElement, st = root.style;
    root.setAttribute("data-theme", th);
    ["--accent", "--accent2", "--accentL", "--accentBg", "--onAccent", "--logoAcc"].forEach(function (p) { st.removeProperty(p); });
    if (th !== "contrast") {
      var key = S.settings.accent !== "auto" && ACCENTS[S.settings.accent] ? S.settings.accent : THEMES[th].accent;
      var A = ACCENTS[key], dark = THEMES[th].dark;
      st.setProperty("--accent", A.a); st.setProperty("--accent2", A.a);
      st.setProperty("--accentL", dark ? A.dl : A.ll); st.setProperty("--accentBg", dark ? A.dbg : A.lbg);
      st.setProperty("--onAccent", A.on); st.setProperty("--logoAcc", dark ? A.dl === "#93C5FD" ? "#3B82F6" : A.a : A.a);
    }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", THEMES[th].pv[0]);
  }

  /* ---------- Sprachausgabe (Ansage) ---------- */
  var hasTTS = "speechSynthesis" in window, voices = [];
  function loadVoices() { try { voices = window.speechSynthesis.getVoices() || []; } catch (e) {} }
  if (hasTTS) { loadVoices(); try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
  function pickVoice(locale) {
    var l = locale.toLowerCase(), two = l.slice(0, 2), i;
    for (i = 0; i < voices.length; i++) if (String(voices[i].lang).toLowerCase().replace("_", "-") === l) return voices[i];
    for (i = 0; i < voices.length; i++) if (String(voices[i].lang).toLowerCase().indexOf(two) === 0) return voices[i];
    return null;
  }
  function speak(text) {
    if (!hasTTS) { toast(t("noTts")); return; }
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(plain(text).replace(/\n/g, " ").slice(0, 3000));
      u.lang = L().locale;
      var v = pickVoice(u.lang); if (v) u.voice = v;
      u.rate = S.settings.rate || 1;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function stopSpeak() { try { if (hasTTS) window.speechSynthesis.cancel(); } catch (e) {} }
  function screenSay() {
    var m = { home: "say_home", orders: "say_orders", order: "say_orders", search: "say_search", help: "say_help", ansage: "say_ansage" };
    if (S.screen === "request") return t("say_s" + S.step);
    return m[S.screen] ? t(m[S.screen]) : "";
  }
  function readText() {
    var s = screenSay();
    if (S.screen === "home") s = t("heroTitle") + ". " + t("heroText") + " " + s + " " + t("voiceHint") + ".";
    if (S.screen === "order") { var o = findOrder(S.orderId); if (o) s += " " + t("orderNo", { n: o.no }) + ". " + t("st" + o.status) + ". " + t("waitOffer"); }
    return s;
  }

  /* ---------- Auftrag per Sprache: versteht Leistung, Objekt, m², Etage, Aufzug (alle 8 Sprachen) ---------- */
  // Muster: "wort" = ganzes Wort, "wort*" = Wortanfang, "*wort" = Wortende, Wörter mit Leerzeichen = Wortgruppe
  var KW_SVC = {
    household: ["haushalt*", "wohnungsaufl*", "wohnungsraum*", "nachlass*", "*haushaltsauflosung", "house clearance", "household*", "flat clearance", "ev bosalt*", "ev esya*", "تفريغ منزل", "تفريغ المنازل", "تفريغ شقة", "تفريغ البيت", "расчистка квартир*", "расчистк*", "вывоз мебел*", "vaciado de vivienda*", "vaciar piso", "vaciar casa", "vaciado*", "debarras de logement", "debarras*", "woningontruim*", "inboedel*", "ontruim*"],
    office: ["buro*", "*buroauflosung", "gewerbe*", "office", "office clearance", "ofis*", "مكتب", "المكتب", "المكاتب", "офис*", "oficina*", "bureau*", "kantoor*", "bedrijfsruimte*"],
    disposal: ["entsorg*", "sperrmull*", "mull*", "*mull", "disposal", "rubbish", "waste", "junk", "atik*", "cop*", "التخلص", "نفايات", "утилиз*", "мусор*", "residuo*", "basura*", "dechet*", "encombrant*", "evacuation*", "afval*", "grofvuil*"],
    cleaning: ["reinig*", "putz*", "besenrein*", "clean*", "temizl*", "تنظيف", "уборк*", "limpi*", "nettoy*", "schoonm*", "bezemschoon*"],
    transport: ["transport*", "abtransport*", "umzug*", "truck", "tasi*", "نقل", "перевоз*", "вывез*", "вывоз*", "demenag*", "verhuiz*"],
    basement: ["keller*", "dachboden*", "garage*", "basement*", "attic*", "cellar*", "bodrum*", "cati*", "قبو", "القبو", "علية", "العلية", "مرآب", "подвал*", "чердак*", "гараж*", "sotano*", "desvan*", "garaje*", "cave", "caves", "grenier*", "kelder*", "zolder*"]
  };
  var KW_OBJ = {
    flat: ["wohnung", "*wohnung", "apartment", "flat", "daire*", "شقة", "الشقة", "شقتي", "квартир*", "piso", "apartamento", "appartement", "woning"],
    house: ["haus", "*haus", "hauses", "house", "ev", "evi", "evim", "mustakil*", "منزل", "المنزل", "بيت", "البيت", "дом", "дома", "доме", "casa", "maison", "huis", "woonhuis"],
    cellar: ["keller", "*keller", "basement", "cellar", "bodrum*", "قبو", "القبو", "подвал*", "sotano", "cave", "kelder"],
    office: ["buro", "office", "ofis*", "مكتب", "المكتب", "офис*", "oficina", "bureau", "kantoor"]
  };
  var LIFT_NO = ["ohne aufzug", "kein aufzug", "keinen aufzug", "ohne lift", "kein lift", "ohne fahrstuhl", "no lift", "no elevator", "without lift", "without elevator", "asansorsuz", "asansor yok", "بدون مصعد", "لا يوجد مصعد", "без лифта", "нет лифта", "sin ascensor", "sans ascenseur", "pas d ascenseur", "geen lift", "zonder lift"];
  var LIFT = ["aufzug*", "*aufzug", "fahrstuhl*", "lift*", "elevator*", "asansor*", "مصعد", "المصعد", "лифт*", "ascensor*", "ascenseur*"];
  var CREATE = ["erstell", "neue", "neuen", "anleg", "create", "new", "olustur", "yeni", "انشاء", "جديد", "созда", "нов", "crear", "nuevo", "nueva", "creer", "nouvel", "nouvelle", "maak", "nieuw", "aanmaken"];
  var FLOOR = "etage|stock|stockwerk|og|obergeschoss|floor|kat|katta|الطابق|طابق|этаж|этаже|planta|piso|verdieping|verd";
  var GROUND = ["erdgeschoss", "parterre", "ground floor", "zemin", "الطابق الارضي", "ارضي", "первый этаж", "цокол", "planta baja", "bajo", "rez de chaussee", "rez-de-chaussee", "rdc", "begane grond"];

  function tokens(n) { return n.split(/[^0-9a-z\u00C0-\u024F\u0400-\u04FF\u0620-\u064A\u0671-\u06D3\u0131\u015F\u011F\u00B2]+/).filter(Boolean); }
  function matchKw(n, toks, kw) {
    kw = norm(kw);
    if (kw.indexOf(" ") >= 0) { var ph = kw.replace(/\*/g, ""); return (" " + toks.join(" ") + " ").indexOf(" " + ph + (kw.slice(-1) === "*" ? "" : " ")) >= 0; }
    var pre = kw.charAt(kw.length - 1) === "*", suf = kw.charAt(0) === "*", core = kw.replace(/\*/g, "");
    for (var i = 0; i < toks.length; i++) {
      var w = toks[i];
      if (pre && suf ? w.indexOf(core) >= 0 : pre ? w.indexOf(core) === 0 : suf ? w.length > core.length && w.slice(-core.length) === core : w === core) return true;
    }
    return false;
  }
  function anyKw(n, toks, list) { for (var i = 0; i < list.length; i++) if (matchKw(n, toks, list[i])) return true; return false; }
  function parseOrder(text) {
    var n = norm(text), toks = tokens(n), r = { services: [], obj: null, area: null, floor: null, elevator: null };
    for (var s in KW_SVC) if (anyKw(n, toks, KW_SVC[s])) r.services.push(s);
    for (var o in KW_OBJ) if (anyKw(n, toks, KW_OBJ[o])) { r.obj = o; break; }
    var am = n.match(/(\d+(?:[.,]\d+)?)\s*(?:m²|m2|qm|quadrat\w*|square|sq\s*m|sqm|metrekare|metre\s*kare|متر|م2|кв\w*|metros?|metres?|meters?|vierkante|m\b)/);
    if (am) r.area = am[1].replace(",", ".");
    if (anyKw(n, toks, GROUND)) r.floor = 0;
    else {
      var fa = n.match(new RegExp("(\\d{1,2})\\s*(?:\\.|st|nd|rd|th|e|er|eme|°|º|-?[йм]|-?ий|-?ом)?\\s*(?:" + FLOOR + ")(?![a-z])"));
      var fb = n.match(new RegExp("(?:^|[^a-z])(?:" + FLOOR + ")\\s*(?:nr\\.?|no\\.?|nummer|number|رقم)?\\s*(\\d{1,2})(?!\\d)"));
      var f = fa || fb; if (f) r.floor = Math.min(30, parseInt(f[1], 10));
    }
    if (anyKw(n, toks, LIFT_NO)) r.elevator = false; else if (anyKw(n, toks, LIFT)) r.elevator = true;
    r.found = !!(r.services.length || r.area != null || (r.obj && (r.floor != null || r.elevator != null)));
    return r;
  }
  function describe(r) {
    var parts = r.services.map(function (s) { return plain(t("svc_" + s)); });
    if (r.obj) parts.push(t("obj_" + r.obj));
    if (r.area != null) parts.push(r.area + " m²");
    if (r.floor != null) parts.push(t("floor") + " " + (r.floor ? r.floor : t("ground")));
    if (r.elevator != null) parts.push(r.elevator ? t("elevator") : t("noLift"));
    return parts.join(", ");
  }
  function applyOrder(r) {
    var d = S.draft;
    r.services.forEach(function (s) { if (d.services.indexOf(s) < 0) d.services.push(s); });
    if (r.obj) d.obj = r.obj;
    if (r.area != null) d.area = r.area;
    if (r.floor != null) d.floor = r.floor;
    if (r.elevator != null) d.elevator = r.elevator;
    saveDraft();
  }
  window.WN_parseOrder = parseOrder; // für Tests

  /* ---------- Spracheingabe ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null;
  function listen() {
    if (!SR) { toast(t("noMic")); return; }
    if (S.listening) { try { rec && rec.stop(); } catch (e) {} return; }
    stopSpeak();
    try {
      rec = new SR();
      rec.lang = L().locale; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = function (e) { var txt = e.results[0][0].transcript; S.listening = false; handleUtterance(txt); };
      rec.onend = function () { if (S.listening) { S.listening = false; if (S.screen === "ansage") render(); } };
      rec.onerror = function () { S.listening = false; if (S.screen === "ansage") render(); };
      S.listening = true; render(); rec.start();
    } catch (e) { S.listening = false; render(); }
  }
  function hasKw(text, key) {
    var n = norm(text), lists = [T[key][IDX[S.lang]], T[key][0], T[key][1]];
    for (var i = 0; i < lists.length; i++) {
      var ws = String(lists[i]).split(",");
      for (var j = 0; j < ws.length; j++) { var w = norm(ws[j]).trim(); if (w && n.indexOf(w) >= 0) return true; }
    }
    return false;
  }
  function handleUtterance(text) {
    text = String(text || "").trim(); if (!text) return;
    var n = norm(text), toks = tokens(n), reply, action, order = parseOrder(text);
    if (hasKw(text, "kw_call") && !order.found) { reply = t("r_call"); action = call; }
    else if (order.found) {
      applyOrder(order);
      reply = t("r_prepared", { x: describe(order) });
      action = function () { S.step = 1; go("request", { force: true, silent: true }); };
    }
    else if (hasKw(text, "kw_offer") || anyKw(n, toks, CREATE.map(function (w) { return w + "*"; }))) { reply = t("r_offer"); action = function () { startRequest(); }; }
    else if (hasKw(text, "kw_help")) { reply = t("r_help"); action = function () { go("help"); }; }
    else if (hasKw(text, "kw_orders")) { reply = t("r_orders"); action = function () { go("orders"); }; }
    else if (hasKw(text, "kw_home")) { reply = t("r_home"); action = function () { go("home"); }; }
    else { reply = t("r_search", { q: text }); action = function () { S.query = text; addRecent(text); go("search"); }; }
    S.convo.push({ who: "you", text: text }, { who: "wn", text: reply });
    S.convo = S.convo.slice(-4);
    if (S.screen !== "ansage") S.screen = "ansage";
    render();
    speak(reply);
    setTimeout(action, order.found ? 2200 : 1400);
  }

  /* ---------- Navigation ---------- */
  function go(screen, opts) {
    opts = opts || {};
    if (screen !== S.screen || opts.force) {
      S.screen = screen;
      if (!opts.noHistory) try { history.pushState({ s: screen, step: S.step, id: S.orderId }, ""); } catch (e) {}
    }
    S.sheet = false; S.lightbox = -1;
    render();
    window.scrollTo(0, 0);
    if (S.settings.auto && !opts.silent) speak(screenSay());
    if (screen === "search") { var q = document.getElementById("q"); if (q && !("ontouchstart" in window)) q.focus(); }
  }
  window.addEventListener("popstate", function (e) {
    var st = e.state || { s: "home" };
    S.screen = st.s || "home"; if (st.step) S.step = st.step; if (st.id) S.orderId = st.id;
    S.sheet = false; S.tip = -1; S.lightbox = -1; render();
  });
  function startRequest(svc) {
    if (svc && S.draft.services.indexOf(svc) < 0) S.draft.services.push(svc);
    saveDraft(); S.step = 1; go("request", { force: true });
  }

  /* ---------- Kontakt ---------- */
  function digits(s) { return String(s || "").replace(/[^\d+]/g, ""); }
  function call() { var p = digits(C.phone); if (!p) { toast(t("noPhone")); return; } location.href = "tel:" + p; }
  function whatsapp(text) {
    var p = digits(C.whatsapp || C.phone).replace(/^\+/, "").replace(/^00/, "");
    if (!p) { toast(t("noPhone")); return false; }
    window.open("https://wa.me/" + p + (text ? "?text=" + encodeURIComponent(text) : ""), "_blank", "noopener");
    return true;
  }

  /* ---------- Aufträge ---------- */
  function findOrder(id) { for (var i = 0; i < S.orders.length; i++) if (S.orders[i].id === id) return S.orders[i]; return null; }
  function fmtDate(iso, long) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    try { return d.toLocaleDateString(L().locale, long ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" }); }
    catch (e) { return iso; }
  }
  function summaryDE(o) {
    var d = o.d, sv = d.services.map(function (s) { return de("svc_" + s); }).join(", ");
    var dd = new Date(d.date + "T12:00:00");
    var dateDe = isNaN(dd) ? d.date : dd.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
    var LEIST = { household: "Haushaltsauflösung", office: "Büroauflösung", disposal: "Entsorgung", cleaning: "Reinigung", transport: "Transport", basement: "Keller/Dachboden" };
    var dd2 = isNaN(dd) ? "-" : String(dd.getDate()).padStart(2, "0") + "." + String(dd.getMonth() + 1).padStart(2, "0") + "." + dd.getFullYear();
    var now = new Date(), stamp = now.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    /* Aufbau passt zum Team-Bereich: dort wird die Nachricht mit "Aus Kunden-Anfrage" automatisch als Ticket übernommen */
    return [
      "[WN-Anfrage] Neue Anfrage über die WN-App (Nr. " + o.no + ")",
      "Name: " + d.name, "Telefon: " + d.phone, "Adresse: " + d.address,
      "Leistung: " + (LEIST[d.services[0]] || "Entrümpelung"),
      "Leistungen: " + sv,
      "Objekt: " + de("obj_" + d.obj) + (d.area ? ", ca. " + d.area + " m²" : ""),
      (function () { var e = estimate(d); return e ? "Volumen: ca. " + e.lo + "–" + e.hi + " m³ (Füllgrad " + de("fill_" + (d.fill || "normal")) + ", Schätzung Kunde)" : ""; })(),
      "Etage/Aufzug: " + (d.floor ? d.floor + ". OG" : "EG") + ", " + (d.elevator ? "mit Aufzug" : "kein Aufzug"),
      "Besichtigung: " + (d.mode === "video" ? "per Video" : "vor Ort") + " (" + dateDe + ")",
      "Wunschtermin: " + dd2, "Uhrzeit: " + (d.time || "-"),
      o.photos ? "Fotos: " + o.photos + " (bitte im Chat nachsenden)" : "",
      "Sprache: " + L().name,
      "", d.note || "-", "",
      "Einwilligung: " + (d.consent ? "ja, Daten automatisch übernehmen (" + stamp + ")" : "nein")
    ].filter(function (x, i) { return x !== "" || i > 13; }).join("\n");
  }
  function sendRequest() {
    var o = { id: Date.now(), no: String(Date.now()).slice(-5), created: new Date().toISOString(), d: JSON.parse(JSON.stringify(S.draft)), photos: S.photos.length, status: 0, lang: S.lang };
    S.orders.unshift(o); LS.set("orders", S.orders);
    if (S.draft.consent) LS.set("contact", { name: S.draft.name, phone: S.draft.phone, address: S.draft.address }); else try { localStorage.removeItem("wn_contact"); } catch (e) {}
    var msg = summaryDE(o);
    if (C.whatsapp || C.phone) whatsapp(msg);
    else if (C.email) location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent("Anfrage Nr. " + o.no) + "&body=" + encodeURIComponent(msg);
    S.photos.forEach(function (p) { try { URL.revokeObjectURL(p.url); } catch (e) {} });
    S.photos = []; S.draft = newDraft(); saveDraft();
    S.orderId = o.id; S.step = 1;
    go("order", { force: true, silent: true });
    toast(t("sent")); if (S.settings.auto) speak(t("sent") + " " + t("waitOffer"));
  }

  /* ---------- Bildschirme ---------- */
  function headBtns(small) {
    return '<button class="round" data-act="langsheet" data-tip="lang" aria-label="' + esc(t("language")) + ': ' + esc(L().name) + '">' + window.WN_FLAG(S.lang, small ? 24 : 26) + '</button>' +
      '<button class="round" data-act="designsheet" data-tip="design" aria-label="' + esc(t("designTitle")) + '">' + ic("palette", 21) + '</button>' +
      '<button class="round" data-act="read" data-tip="read" aria-label="' + esc(t("readAloud")) + '">' + ic("speaker", 20) + '</button>';
  }
  function header() {
    return '<header class="top">' +
      '<button class="logo" data-go="home" aria-label="WN Entrümpelung – ' + esc(t("nav_home")) + '">' + logo() + '<span class="logo-sub">ENTRÜMPELUNG</span></button>' +
      '<div class="acts">' + headBtns() +
      '<button class="round" data-go="help" data-tip="help" aria-label="' + esc(t("nav_help")) + '">' + ic("help", 21) + '</button>' +
      '</div></header>';
  }
  function bar(title, sub, backAct) {
    return '<header class="bar">' +
      '<button class="round ghost" data-act="' + (backAct || "back") + '" aria-label="' + esc(t("back")) + '">' + ic("back", 22, "flip") + '</button>' +
      '<div class="grow">' + (sub ? '<span class="muted xs">' + esc(sub) + '</span>' : '') + '<h1>' + esc(title) + '</h1></div>' +
      '<div class="acts">' + headBtns(true) + '</div></header>';
  }
  function nav() {
    var items = [["home", "home", "nav_home"], ["request", "add", "nav_request"], ["orders", "list", "nav_orders"], ["help", "help", "nav_help"]];
    var cur = S.screen === "order" ? "orders" : S.screen;
    return '<nav class="nav" aria-label="Navigation">' + items.map(function (it) {
      var a = it[0] === "request" ? 'data-act="newreq"' : 'data-go="' + it[0] + '"';
      return '<button ' + a + (cur === it[0] ? ' aria-current="page"' : '') + '>' + ic(it[1], 22) + esc(t(it[2])) + '</button>';
    }).join("") + '</nav>';
  }

  function scrHome() {
    var last = S.orders[0];
    return header() + '<main>' + roleBar() +
      '<div class="searchbar" role="search" data-tip="search">' +
      '<button class="fake" data-go="search">' + ic("search", 20) + '<span>' + esc(t("searchPh")) + '</span></button>' +
      '<button class="micbtn" data-act="voice" data-tip="mic" aria-label="' + esc(t("voiceOrder")) + '">' + ic("mic", 20) + '</button></div>' +
      '<p class="vhint">' + ic("mic", 14) + esc(t("voiceHint")) + '</p>' +
      '<section class="card hero">' +
      '<button class="heroimg" data-act="photo" data-i="0" aria-label="' + esc(t("vehicle")) + '"><img src="' + vimg(0) + '" alt="WN Entrümpelung – ' + esc(t("vehicle")) + '" width="1000" height="287"></button>' +
      '<h1>' + esc(t("heroTitle")) + '</h1><p class="soft sm">' + esc(t("heroText")) + '</p>' +
      '<button class="btn" data-act="newreq" data-tip="offer">' + ic("plus", 20) + esc(t("requestOffer")) + '</button>' +
      '<div class="row2"><button class="btn out" data-act="call">' + ic("phone", 18) + esc(t("call")) + '</button>' +
      '<button class="btn out" data-act="wa">' + ic("chat", 18) + esc(t("whatsapp")) + '</button></div></section>' +
      '<section style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + esc(t("services")) + '</h2><div class="grid3">' +
      SERVICES.map(function (s) { return '<button class="tile" data-act="svcstart" data-id="' + s.id + '">' + ic(s.icon, 28) + '<span>' + esc(t("svc_" + s.id)) + '</span></button>'; }).join("") +
      '</div></section>' +
      '<section style="display:flex;flex-direction:column;gap:12px"><h2 class="h2">' + esc(t("vehicle")) + '</h2><div class="gallery">' +
      VEHICLE.map(function (v, i) { return '<button class="gal" data-act="photo" data-i="' + i + '"><img src="' + vimg(i) + '" alt="WN Entrümpelung – ' + esc(t(v[1])) + '" loading="lazy"><span>' + esc(t(v[1])) + '</span></button>'; }).join("") +
      '</div></section>' +
      (last ? '<button class="card lastcard" data-act="openorder" data-id="' + last.id + '">' +
        '<span class="ib">' + ic("list", 20) + '</span><span style="flex:1;display:flex;flex-direction:column;gap:3px"><span class="muted xs">' + esc(t("lastRequest")) + '</span>' +
        '<b>' + esc(t("orderNo", { n: last.no })) + ' · ' + esc(t("st" + last.status)) + '</b></span>' + ic("chev", 20, "flip") + '</button>' : '') +
      '<section class="card" style="flex-direction:row;align-items:center;gap:14px"><img src="qr-code.svg" alt="' + esc(t("qrTitle")) + '" width="112" height="112" style="border-radius:10px;background:#fff;flex:none">' +
      '<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><h2 class="h2">' + esc(t("qrTitle")) + '</h2><p class="soft xs">' + esc(t("qrText")) + '</p>' +
      '<button class="btn out" data-act="copylink" style="min-height:40px">' + ic("copy", 16) + esc(t("copyLink")) + '</button>' +
      '<a class="btn out" href="qr-code.png" download="WN-Entruempelung-QR-Code.png" style="min-height:40px">' + ic("dl", 16) + esc(t("qrDownload")) + '</a></div></section>' +
      '<p class="note">' + esc(t("testNote")) + '</p>' +
      (C.teamApp ? '<p class="note"><a href="' + esc(C.teamApp) + '" target="_blank" rel="noopener">' + esc(t("teamArea")) + '</a></p>' : '') +
      legalLinks() + '</main>' + nav();
  }

  function roleBar() {
    return '<div class="seg" role="group" aria-label="' + esc(t("viewAs")) + '">' +
      [["kunde", "user"], ["ma", "team"], ["chef", "boss"]].map(function (r) {
        var on = r[0] === "kunde";
        return '<button class="' + (on ? "on" : "") + '" aria-pressed="' + on + '" data-act="role" data-id="' + r[0] + '" style="display:flex;align-items:center;justify-content:center;gap:6px">' + ic(r[1], 17) + esc(t("role_" + r[0])) + '</button>';
      }).join("") + '</div>';
  }
  function roleSheet() {
    var r = S.sheet === "role_chef" ? "chef" : "ma";
    return '<div class="sheetbg" data-act="closesheet"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="rt">' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><h2 id="rt">' + esc(t("role_" + r)) + '</h2>' +
      '<button class="round" data-act="closesheet" aria-label="' + esc(t("close")) + '">' + ic("x", 18) + '</button></div>' +
      '<p class="soft" style="margin:14px 0 6px">' + esc(t("role_" + r + "D")) + '</p>' +
      '<p class="muted xs" style="margin:0 0 16px">' + esc(t("loginNote")) + '</p>' +
      (C.teamApp ? '<a class="btn" href="' + esc(C.teamApp) + '" target="_blank" rel="noopener">' + ic(r === "chef" ? "boss" : "team", 20) + esc(t("openTeam")) + '</a>' : '<p class="warnbox">' + esc(t("noPhone")) + '</p>') +
      '<button class="btn out" data-act="closesheet" style="width:100%;margin-top:10px">' + ic("user", 18) + esc(t("role_kunde")) + '</button>' +
      '</div></div>';
  }

  function scrRequest() {
    var d = S.draft, n = S.step, pct = Math.round(n / 3 * 100), body = "", foot = "";
    var head = bar(t(n === 1 ? "s1Title" : n === 2 ? "s2Title" : "s3Title"), t("step", { n: n, m: 3 })) +
      '<div class="progress" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div>';
    if (n === 1) {
      body =
        '<fieldset><legend>' + esc(t("servicesMulti")) + '</legend><div class="chips">' +
        SERVICES.map(function (s) { var on = d.services.indexOf(s.id) >= 0; return '<button class="chip' + (on ? " on" : "") + '" aria-pressed="' + on + '" data-act="svc" data-id="' + s.id + '">' + (on ? ic("check", 16) : "") + esc(plain(t("svc_" + s.id))) + '</button>'; }).join("") +
        '</div></fieldset>' +
        '<fieldset><legend>' + esc(t("object")) + '</legend><div class="seg" role="radiogroup">' +
        OBJECTS.map(function (o) { var on = d.obj === o; return '<button role="radio" aria-checked="' + on + '" class="' + (on ? "on" : "") + '" data-act="obj" data-id="' + o + '">' + esc(t("obj_" + o)) + '</button>'; }).join("") +
        '</div></fieldset>' +
        '<div class="row2"><div class="field"><label class="lbl" for="f-area">' + esc(t("area")) + '</label><input class="inp" id="f-area" data-field="area" inputmode="numeric" placeholder="' + esc(t("areaPh")) + '" value="' + esc(d.area) + '"></div>' +
        '<div class="field"><span class="lbl" id="fl">' + esc(t("floor")) + '</span><div class="stepper" role="group" aria-labelledby="fl">' +
        '<button data-act="floor" data-d="-1" aria-label="' + esc(t("less")) + '">−</button><span>' + (d.floor ? d.floor : esc(t("ground"))) + '</span>' +
        '<button data-act="floor" data-d="1" aria-label="' + esc(t("more")) + '">+</button></div></div></div>' +
        '<label class="switch"><span class="tx"><b>' + esc(t("elevator")) + '</b><span class="muted xs">' + esc(t("elevatorHint")) + '</span></span>' +
        '<span class="tg"><input type="checkbox" data-field="elevator"' + (d.elevator ? " checked" : "") + '><i></i></span></label>' +
        '<fieldset><legend>' + esc(t("fill")) + '</legend><div class="seg" role="radiogroup">' +
        ["wenig", "normal", "voll", "messie"].map(function (f) { var on = (d.fill || "normal") === f; return '<button role="radio" aria-checked="' + on + '" class="' + (on ? "on" : "") + '" data-act="fill" data-id="' + f + '">' + esc(t("fill_" + f)) + '</button>'; }).join("") +
        '</div></fieldset>' +
        '<div class="field" style="background:var(--s1,rgba(127,127,127,.08));border-radius:14px;padding:12px 14px"><span class="lbl">' + esc(t("estTitle")) + '</span><div id="est">' + estBox(d) + '</div></div>' +
        '<div class="field"><span class="lbl">' + esc(t("photos")) + ' <span class="muted" style="font-weight:500">(' + esc(t("photosHint")) + ')</span></span><div class="photos">' +
        '<label class="addph">' + ic("camera", 26) + esc(t("addPhoto")) + '<input type="file" id="photoIn" accept="image/*" multiple class="sr"></label>' +
        S.photos.map(function (p, i) { return '<div class="ph"><img src="' + p.url + '" alt=""><button data-act="rmphoto" data-i="' + i + '" aria-label="' + esc(t("removePhoto")) + '">' + ic("x", 16) + '</button></div>'; }).join("") +
        '</div></div>';
      foot = '<div class="foot"><button class="btn" data-act="next">' + esc(t("next")) + ic("chev", 18, "flip") + '</button></div>';
    } else if (n === 2) {
      var days = [], base = new Date(); base.setHours(12, 0, 0, 0);
      for (var i = 1; days.length < 21; i++) { var x = new Date(base); x.setDate(base.getDate() + i); if (!days.length && x.getDay() === 0) continue; days.push(x); }
      var lead = (days[0].getDay() + 6) % 7, cells = "";
      for (var k = 0; k < lead; k++) cells += '<span></span>';
      days.forEach(function (x) {
        var iso = x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
        var sun = x.getDay() === 0, on = d.date === iso, wd = "";
        try { wd = x.toLocaleDateString(L().locale, { weekday: "short" }); } catch (e) {}
        cells += '<button class="day' + (on ? " on" : "") + '" data-act="day" data-d="' + iso + '"' + (sun ? " disabled" : "") + ' aria-pressed="' + on + '" aria-label="' + esc(fmtDate(iso, true)) + '"><small>' + esc(wd) + '</small><b>' + x.getDate() + '</b></button>';
      });
      var mon = ""; try { mon = days[0].toLocaleDateString(L().locale, { month: "long", year: "numeric" }); var m2 = days[20].toLocaleDateString(L().locale, { month: "long", year: "numeric" }); if (m2 !== mon) mon += " – " + m2; } catch (e) {}
      body =
        '<div class="mode" role="radiogroup">' +
        '<button role="radio" aria-checked="' + (d.mode === "onsite") + '" class="' + (d.mode === "onsite" ? "on" : "") + '" data-act="mode" data-id="onsite">' + ic("home", 22) + '<b>' + esc(t("onsite")) + '</b><span class="muted xs">' + esc(t("onsiteD")) + '</span></button>' +
        '<button role="radio" aria-checked="' + (d.mode === "video") + '" class="' + (d.mode === "video" ? "on" : "") + '" data-act="mode" data-id="video">' + ic("video", 22) + '<b>' + esc(t("video")) + '</b><span class="muted xs">' + esc(t("videoD")) + '</span></button></div>' +
        '<div class="field"><span class="lbl">' + esc(t("pickDay")) + '</span><span class="mon">' + esc(mon) + '</span><div class="days">' + cells + '</div></div>' +
        '<div class="field"><span class="lbl">' + esc(t("pickTime")) + (d.date ? ' · <span class="soft" style="font-weight:600">' + esc(fmtDate(d.date, true)) + '</span>' : '') + '</span><div class="times">' +
        TIMES.map(function (tm) { var on = d.time === tm; return '<button class="' + (on ? "on" : "") + '" aria-pressed="' + on + '" data-act="time" data-t="' + tm + '">' + tm + '</button>'; }).join("") + '</div></div>';
      foot = '<div class="foot">' + (d.date && d.time ? '<div class="sum">' + ic("cal", 16) + esc(t(d.mode === "video" ? "video" : "onsite")) + ' · ' + esc(fmtDate(d.date)) + ' · ' + d.time + '</div>' : '') +
        '<button class="btn" data-act="next">' + esc(t("next")) + ic("chev", 18, "flip") + '</button></div>';
    } else {
      body =
        '<div class="field"><label class="lbl" for="f-name">' + esc(t("name")) + ' *</label><input class="inp" id="f-name" data-field="name" autocomplete="name" value="' + esc(d.name) + '"></div>' +
        '<div class="field"><label class="lbl" for="f-phone">' + esc(t("phone")) + ' *</label><input class="inp" id="f-phone" data-field="phone" type="tel" autocomplete="tel" dir="ltr" value="' + esc(d.phone) + '"></div>' +
        '<div class="field"><label class="lbl" for="f-addr">' + esc(t("address")) + ' *</label><input class="inp" id="f-addr" data-field="address" autocomplete="street-address" value="' + esc(d.address) + '"></div>' +
        '<div class="field"><label class="lbl" for="f-note">' + esc(t("note")) + '</label><textarea class="inp" id="f-note" data-field="note" placeholder="' + esc(t("notePh")) + '">' + esc(d.note) + '</textarea></div>' +
        '<label class="switch" style="align-items:flex-start;padding:14px 16px"><span class="tx"><b style="font-weight:600;line-height:1.45">' + esc(t("consent")) + '</b><span class="muted xs">' + esc(t("consentHint")) + '</span></span>' +
        '<span class="tg"><input type="checkbox" data-field="consent"' + (d.consent ? " checked" : "") + '><i></i></span></label>' +
        '<p class="muted xs" style="margin:0">' + esc(t("legal_req")) + ' <button data-act="legal" data-id="datenschutz" style="background:none;border:0;color:inherit;text-decoration:underline;font:inherit;padding:0;cursor:pointer">' + esc(t("legal_ds")) + '</button> · <button data-act="legal" data-id="widerruf" style="background:none;border:0;color:inherit;text-decoration:underline;font:inherit;padding:0;cursor:pointer">' + esc(t("legal_wr")) + '</button></p>';
      foot = '<div class="foot"><button class="btn" data-act="next">' + ic("send", 18, "flip") + esc(t("send")) + '</button></div>';
    }
    return head + '<main>' + body + '</main>' + foot;
  }

  function scrOrders() {
    return bar(t("orders"), "", "home") + '<main>' +
      (S.orders.length ? '<div class="list">' + S.orders.map(function (o) {
        return '<button class="item" data-act="openorder" data-id="' + o.id + '"><span class="ib g">' + ic("list", 20) + '</span><span class="tx"><span class="tt">' + esc(t("orderNo", { n: o.no })) + '</span>' +
          '<span class="ds">' + esc(o.d.services.map(function (s) { return plain(t("svc_" + s)); }).join(", ")) + ' · ' + esc(t("st" + o.status)) + '</span></span>' + ic("chev", 18, "flip") + '</button>';
      }).join("") + '</div>' : '<p class="soft" style="text-align:center;padding:30px 0">' + esc(t("noOrders")) + '</p>') +
      '<button class="btn" data-act="newreq">' + ic("plus", 20) + esc(t("newRequest")) + '</button></main>' + nav();
  }

  function scrOrder() {
    var o = findOrder(S.orderId);
    if (!o) return scrOrders();
    var d = o.d;
    var tl = '<ol class="timeline">' + [0, 1, 2, 3, 4].map(function (i) {
      var cls = i <= o.status ? "ok" : (i === o.status + 1 ? "now" : "");
      return '<li class="' + cls + '"' + (cls === "now" ? ' aria-current="step"' : '') + '><span class="dot"><i>' + (cls === "ok" ? ic("check", 14) : "") + '</i><span></span></span><b>' + esc(t("st" + i)) + '</b></li>';
    }).join("") + '</ol>';
    var kv = [
      [t("services"), d.services.map(function (s) { return plain(t("svc_" + s)); }).join(", ")],
      [t("object"), t("obj_" + d.obj) + (d.area ? " · " + d.area + " m²" : "")],
      [t("floor"), (d.floor ? d.floor : t("ground")) + " · " + (d.elevator ? t("elevator") : t("noLift"))],
      estimate(d) ? [t("estTitle"), t("estText", { a: estimate(d).lo, b: estimate(d).hi, n: estimate(d).n })] : null,
      [t("st1"), t(d.mode === "video" ? "video" : "onsite") + " · " + fmtDate(d.date, true) + " · " + d.time],
      [t("name"), d.name], [t("phone"), d.phone], [t("address"), d.address],
      d.note ? [t("note"), d.note] : null,
      o.photos ? [t("photos"), t("photosCount", { n: o.photos })] : null
    ].filter(Boolean);
    return bar(t("orderNo", { n: o.no }), t("orders"), "orders") + '<main>' +
      '<section class="card">' + tl + '<p class="soft sm">' + esc(t("waitOffer")) + '</p></section>' +
      '<section class="card"><h2 class="h2">' + esc(t("summary")) + '</h2><dl class="kv">' + kv.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join("") + '</dl></section>' +
      '<div class="row2"><button class="btn out" data-act="call">' + ic("phone", 18) + esc(t("call")) + '</button><button class="btn out" data-act="wa">' + ic("chat", 18) + esc(t("whatsapp")) + '</button></div>' +
      '<button class="btn warn" data-act="delorder" data-id="' + o.id + '">' + ic("trash", 18) + esc(t("deleteOrder")) + '</button>' +
      '</main>' + nav();
  }

  var HELP = [
    ["plus", "requestOffer", "h_offer_d"], ["mic", "voiceOrder", "h_voiceorder_d"], ["search", "search", "h_search_d"],
    ["speaker", "ansage", "h_ansage_d"], ["globe", "language", "h_lang_d"], ["palette", "designTitle", "h_design_d"],
    ["camera", "photos", "h_photos_d"], ["cal", "s2Title", "h_appt_d"], ["list", "nav_orders", "h_orders_d"],
    ["chat", "contactT", "h_contact_d"], ["help", "faq1_t", "faq1_d"], ["help", "faq2_t", "faq2_d"]
  ];
  function searchIndex() {
    var out = [];
    SERVICES.forEach(function (s) {
      out.push({ cat: "services", icon: s.icon, cls: "", title: plain(t("svc_" + s.id)), desc: t("d_" + s.id), extra: de("svc_" + s.id) + " " + de("d_" + s.id), attrs: 'data-act="svcstart" data-id="' + s.id + '"' });
    });
    S.orders.forEach(function (o) {
      var sv = o.d.services.map(function (s) { return plain(t("svc_" + s)) + " " + de("svc_" + s); }).join(" ");
      out.push({ cat: "orders", icon: "list", cls: "g", title: t("orderNo", { n: o.no }), desc: o.d.services.map(function (s) { return plain(t("svc_" + s)); }).join(", ") + " · " + t("st" + o.status), extra: sv + " " + o.d.address + " " + o.no, attrs: 'data-act="openorder" data-id="' + o.id + '"' });
    });
    HELP.forEach(function (h) { out.push({ cat: "help", icon: "help", cls: "a", title: t(h[1]), desc: t(h[2]), extra: de(h[1]) + " " + de(h[2]), attrs: 'data-go="help"' }); });
    return out;
  }
  function results() {
    var q = norm(S.query).trim(), words = q.split(/\s+/).filter(Boolean);
    var list = searchIndex().filter(function (it) {
      if (S.filter !== "all" && it.cat !== S.filter) return false;
      if (!words.length) return it.cat !== "help";
      var hay = norm(it.title + " " + it.desc + " " + it.extra);
      return words.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    var html = "";
    if (!words.length) {
      html += '<button class="example" data-act="utter" data-text="' + esc(t("ex_order")) + '" style="margin-bottom:12px"><small>' + esc(t("voiceOrder")) + ' · ' + esc(t("exampleLbl")) + '</small>„' + esc(t("ex_order")) + '“</button>';
      if (S.recent.length) html += '<section style="display:flex;flex-direction:column;gap:10px;margin-bottom:8px"><h2 class="h2">' + esc(t("recent")) + '</h2><div class="chips">' +
        S.recent.map(function (r) { return '<button class="chip sm" data-act="recent" data-q="' + esc(r) + '">' + esc(r) + '</button>'; }).join("") + '</div></section>';
    }
    if (!list.length) return html + '<p class="soft" style="text-align:center;padding:24px 0">' + esc(t("noResults")) + '</p>';
    ["services", "orders", "help"].forEach(function (cat) {
      var part = list.filter(function (i) { return i.cat === cat; });
      if (!part.length) return;
      var cap = cat === "services" ? t("services") : cat === "orders" ? t("orders") : t("nav_help");
      html += '<section style="display:flex;flex-direction:column;gap:2px;margin-top:6px"><h2 class="h2">' + esc(cap) + '</h2><div class="list">' +
        part.map(function (i) { return '<button class="item" ' + i.attrs + '><span class="ib ' + i.cls + '">' + ic(i.icon, 20) + '</span><span class="tx"><span class="tt">' + esc(i.title) + '</span><span class="ds">' + esc(i.desc) + '</span></span>' + ic("chev", 18, "flip") + '</button>'; }).join("") +
        '</div></section>';
    });
    return html;
  }
  function scrSearch() {
    var f = [["all", "all"], ["services", "services"], ["orders", "nav_orders"], ["help", "nav_help"]];
    return '<header class="bar"><button class="round ghost" data-act="home" aria-label="' + esc(t("back")) + '">' + ic("back", 22, "flip") + '</button>' +
      '<form class="searchbar" role="search" id="qform" style="flex:1;min-width:0;border-color:var(--accent)">' + ic("search", 20) +
      '<input id="q" type="search" enterkeyhint="search" aria-label="' + esc(t("search")) + '" placeholder="' + esc(t("searchPh")) + '" value="' + esc(S.query) + '">' +
      (S.query ? '<button type="button" class="round ghost" style="width:40px;height:40px" data-act="clearq" aria-label="' + esc(t("clearInput")) + '">' + ic("x", 18) + '</button>' : '') +
      '<button type="button" class="micbtn" data-act="voice" aria-label="' + esc(t("voiceOrder")) + '">' + ic("mic", 19) + '</button></form></header>' +
      '<div class="chips" style="padding:0 20px 8px">' + f.map(function (x) { return '<button class="chip sm' + (S.filter === x[0] ? " on" : "") + '" aria-pressed="' + (S.filter === x[0]) + '" data-act="filter" data-f="' + x[0] + '">' + esc(t(x[1])) + '</button>'; }).join("") + '</div>' +
      '<main><div id="results">' + results() + '</div></main>' + nav();
  }

  function scrHelp() {
    return bar(t("helpTitle"), "", "home") + '<main>' +
      '<button class="btn soft2" data-act="readall">' + ic("speaker", 18) + esc(t("readAll")) + '</button>' +
      '<div class="list">' + HELP.map(function (h, i) {
        return '<div class="item" style="align-items:flex-start"><span class="ib' + (i > 9 ? " a" : "") + '">' + ic(h[0], 20) + '</span><span class="tx"><span class="tt">' + esc(t(h[1])) + '</span><span class="ds">' + esc(t(h[2])) + '</span></span>' +
          '<button class="say" data-act="say" data-a="' + h[1] + '" data-b="' + h[2] + '" aria-label="' + esc(t("listen")) + ': ' + esc(t(h[1])) + '">' + ic("speak1", 18) + '</button></div>';
      }).join("") + '</div>' +
      '<div class="row2"><button class="btn out" data-act="tips">' + esc(t("showTips")) + '</button><button class="btn out" data-act="voice">' + ic("mic", 18) + esc(t("ansage")) + '</button></div>' +
      '<button class="btn" data-act="call">' + ic("phone", 18) + esc(t("call")) + '</button>' +
      (C.teamApp ? '<section class="card" style="gap:10px"><h2 class="h2">' + esc(t("teamArea")) + '</h2><p class="soft sm">' + esc(t("teamAreaD")) + '</p><a class="btn out" href="' + esc(C.teamApp) + '" target="_blank" rel="noopener">' + ic("list", 18) + esc(t("teamArea")) + '</a></section>' : '') +
      legalLinks() + '</main>' + nav();
  }

  function scrAnsage() {
    var ex = ["requestOffer", "nav_orders", "nav_help", "call"];
    return bar(t("ansage"), "", "home") + '<main style="gap:16px">' +
      (SR ? '' : '<div class="warnbox">' + esc(t("noMic")) + '</div>') +
      '<div class="micwrap' + (S.listening ? " live" : "") + '"><button class="bigmic' + (S.listening ? " live" : "") + '" data-act="listen" aria-label="' + esc(t("mic")) + '" aria-pressed="' + S.listening + '">' + ic("mic", 40) + '</button></div>' +
      '<p class="status" aria-live="polite">' + esc(S.listening ? t("listening") : t("voiceHint")) + '</p>' +
      '<div class="convo">' + S.convo.map(function (m) {
        return '<div class="bub ' + m.who + '"><span class="who">' + esc(m.who === "you" ? t("you") : t("wnSays")) + '</span>' + esc(m.text) + '</div>';
      }).join("") + '</div>' +
      '<button class="example" data-act="utter" data-text="' + esc(t("ex_order")) + '"><small>' + esc(t("voiceOrder")) + ' · ' + esc(t("exampleLbl")) + '</small>„' + esc(t("ex_order")) + '“</button>' +
      '<div class="field"><span class="muted xs">' + esc(t("trySay")) + '</span><div class="chips">' +
      ex.map(function (k) { return '<button class="chip sm" data-act="utter" data-text="' + esc(t(k)) + '">' + esc(t(k)) + '</button>'; }).join("") + '</div></div>' +
      '<form id="sayform" class="searchbar"><input id="saytext" aria-label="' + esc(t("typeHere")) + '" placeholder="' + esc(t("typeHere")) + '"><button class="micbtn" aria-label="' + esc(t("send")) + '">' + ic("send", 18, "flip") + '</button></form>' +
      '<label class="switch"><span class="tx"><b>' + esc(t("autoAnnounce")) + '</b><span class="muted xs">' + esc(t("autoAnnounceD")) + '</span></span>' +
      '<span class="tg"><input type="checkbox" data-field="auto"' + (S.settings.auto ? " checked" : "") + '><i></i></span></label>' +
      '<div class="field"><span class="lbl">' + esc(t("speed")) + '</span><div class="seg" role="radiogroup">' +
      [[0.8, "slow"], [1, "normal"], [1.25, "fast"]].map(function (r) { var on = S.settings.rate === r[0]; return '<button role="radio" aria-checked="' + on + '" class="' + (on ? "on" : "") + '" data-act="rate" data-r="' + r[0] + '">' + esc(t(r[1])) + '</button>'; }).join("") +
      '</div></div></main>';
  }

  function langSheet() {
    return '<div class="sheetbg" data-act="closesheet"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lt">' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><h2 id="lt">' + esc(t("langTitle")) + '</h2>' +
      '<button class="round" data-act="closesheet" aria-label="' + esc(t("close")) + '">' + ic("x", 18) + '</button></div>' +
      '<div class="langs">' + LANGS.map(function (l) {
        var on = l.code === S.lang;
        return '<button class="' + (on ? "on" : "") + '" data-act="setlang" data-code="' + l.code + '" lang="' + l.code + '" dir="' + l.dir + '" aria-pressed="' + on + '">' + window.WN_FLAG(l.code, 30) + '<span>' + esc(l.name) + '</span>' + (on ? '<span class="ck">' + ic("check", 20) + '</span>' : '') + '</button>';
      }).join("") + '</div></div></div>';
  }
  function designSheet() {
    var th = S.settings.theme, contrast = th === "contrast";
    var cards = Object.keys(THEMES).map(function (k) {
      var pv = THEMES[k].pv, acc = k === "contrast" ? "#FFD400" : (ACCENTS[S.settings.accent] || ACCENTS[THEMES[k].accent]).a, on = th === k;
      return '<button class="thm' + (on ? " on" : "") + '" data-act="theme" data-id="' + k + '" aria-pressed="' + on + '">' +
        '<span class="pv" style="background:' + pv[0] + '"><i style="background:' + pv[2] + ';width:46%"></i><i style="background:' + pv[1] + ';border:1px solid rgba(127,127,127,.35);height:16px"></i><b style="background:' + acc + '"></b></span>' +
        '<span class="nm">' + esc(t("theme_" + k)) + (on ? '<span style="color:var(--accentL)">' + ic("check", 18) + '</span>' : '') + '</span></button>';
    }).join("");
    var sw = '<button class="sw auto' + (S.settings.accent === "auto" ? " on" : "") + '" data-act="accent" data-id="auto" aria-pressed="' + (S.settings.accent === "auto") + '" aria-label="' + esc(t("c_auto")) + '"' + (contrast ? " disabled" : "") + '><i></i></button>' +
      ACCENT_LIST.map(function (a) {
        var on = S.settings.accent === a;
        return '<button class="sw' + (on ? " on" : "") + '" data-act="accent" data-id="' + a + '" aria-pressed="' + on + '" aria-label="' + esc(t("c_" + a)) + '" title="' + esc(t("c_" + a)) + '"' + (contrast ? " disabled" : "") + '><i style="background:' + ACCENTS[a].a + '"></i></button>';
      }).join("");
    return '<div class="sheetbg" data-act="closesheet"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="dt">' +
      '<div style="display:flex;align-items:center;justify-content:space-between"><h2 id="dt">' + esc(t("designTitle")) + '</h2>' +
      '<button class="round" data-act="closesheet" aria-label="' + esc(t("close")) + '">' + ic("x", 18) + '</button></div>' +
      '<h3>' + esc(t("design")) + '</h3><div class="themes">' + cards + '</div>' +
      '<h3>' + esc(t("color")) + '</h3><div class="swatches">' + sw + '</div>' +
      (contrast ? '<p class="muted xs" style="margin-top:10px">' + esc(t("contrastNote")) + '</p>' : '') +
      '<button class="btn" data-act="closesheet" style="width:100%;margin-top:18px">' + ic("check", 18) + esc(t("done")) + '</button>' +
      '</div></div>';
  }
  function lightbox() {
    var i = S.lightbox, v = VEHICLE[i];
    return '<div class="lightbox" role="dialog" aria-modal="true" aria-label="' + esc(t("vehicle")) + '">' +
      '<img src="' + vimg(i) + '" alt="WN Entrümpelung – ' + esc(t(v[1])) + '"><span class="cap">' + esc(t(v[1])) + ' · ' + (i + 1) + '/' + VEHICLE.length + '</span>' +
      '<div class="nav2"><button class="round" data-act="lbprev" aria-label="' + esc(t("prev")) + '">' + ic("back", 20, "flip") + '</button>' +
      '<button class="round" data-act="lbclose" aria-label="' + esc(t("close")) + '">' + ic("x", 20) + '</button>' +
      '<button class="round" data-act="lbnext" aria-label="' + esc(t("nextPic")) + '">' + ic("chev", 20, "flip") + '</button></div></div>';
  }

  /* ---------- Rechtliches: Impressum, Datenschutz, Widerruf (Deutsch / Niederländisch) ---------- */
  function firmaCfg() { return { name: C.firma || "WN Entrümpelung", rechtsform: C.rechtsform, inhaber: C.inhaber, strasse: C.strasse, plz: C.plz, ort: C.ort, tel: C.phone || C.whatsapp, email: C.email, ustid: C.ustid, steuernr: C.steuernr, anzeige53: C.anzeige53, erlaubnis54: C.erlaubnis54, vihb: C.vihb }; }
  function legalLinks() {
    return '<nav class="legal" aria-label="' + esc(t("legal_nav")) + '" style="display:flex;flex-wrap:wrap;gap:6px 16px;justify-content:center;padding:6px 0 2px">' +
      [["impressum", "legal_imp"], ["datenschutz", "legal_ds"], ["widerruf", "legal_wr"]].map(function (x) { return '<button class="linkbtn" data-act="legal" data-id="' + x[0] + '" style="background:none;border:0;color:inherit;text-decoration:underline;font:inherit;font-size:13px;opacity:.85;cursor:pointer;padding:6px 2px">' + esc(t(x[1])) + '</button>'; }).join("") + '</nav>';
  }
  function scrLegal() {
    var R = window.WN_RECHT, f = firmaCfg(), lg = S.lang === "nl" ? "nl" : "de", k = S.legal || "impressum", h = "";
    if (!R) return bar(t("legal_imp"), "", "home") + '<main><p class="note">–</p></main>' + nav();
    var note = (S.lang !== "de" && S.lang !== "nl") ? '<p class="note">' + esc(t("legal_lang")) + '</p>' : "";
    function sec(a) { return a.map(function (x) { return '<section class="card" style="gap:8px"><h2 class="h2">' + esc(x.h) + '</h2>' + x.p.map(function (p) { return '<p class="soft sm" style="margin:0">' + esc(p) + '</p>'; }).join("") + '</section>'; }).join(""); }
    var title;
    if (k === "impressum") {
      var im = R.impressum(lg, f); title = im.titel;
      var missing = !f.strasse || !f.inhaber;
      h = (im.untertitel ? '<p class="muted xs">' + esc(im.untertitel) + '</p>' : '') + '<section class="card"><dl style="display:grid;grid-template-columns:minmax(110px,auto) 1fr;gap:8px 14px;margin:0">' +
        im.rows.map(function (r) { return '<dt class="muted xs">' + esc(r[0]) + '</dt><dd style="margin:0">' + esc(r[1]) + '</dd>'; }).join("") + '</dl></section>' +
        im.p.map(function (p) { return '<p class="soft sm">' + esc(p) + '</p>'; }).join("") +
        (missing ? '<p class="note">' + esc(t("legal_missing")) + '</p>' : '');
    } else if (k === "datenschutz") { var ds = R.datenschutz(lg, f); title = ds.titel; h = sec(ds.abschnitte); }
    else { var w = R.widerruf(lg, f); title = w.titel; h = sec(w.abschnitte) + '<section class="card" style="gap:6px"><h2 class="h2">' + esc(w.formularTitel) + '</h2>' + w.formular.map(function (p) { return '<p class="soft sm" style="margin:0">' + esc(p) + '</p>'; }).join("") + '</section>'; }
    return bar(title, "", "home") + '<main>' + note + h + legalLinks() + '</main>' + nav();
  }
  var SCREENS = { home: scrHome, request: scrRequest, orders: scrOrders, order: scrOrder, search: scrSearch, help: scrHelp, ansage: scrAnsage, legal: scrLegal };

  function render() {
    var l = L();
    document.documentElement.lang = l.code;
    document.documentElement.dir = l.dir;
    var html = '<div class="screen">' + (SCREENS[S.screen] || scrHome)() + '</div>';
    if (S.sheet === "lang") html += langSheet();
    if (S.sheet === "design") html += designSheet();
    if (S.sheet === "role_ma" || S.sheet === "role_chef") html += roleSheet();
    if (S.lightbox >= 0) html += lightbox();
    if (S.tip >= 0) html += '<div class="tipblock"></div><div class="tipring" id="tipring"></div><div class="tipcard" id="tipcard"></div>';
    html += '<div class="toast" id="toast" role="status" aria-live="polite"></div>';
    $app.innerHTML = html;
    if (S.tip >= 0) drawTip();
  }

  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById("toast"); if (!el) return;
    el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3200);
  }

  /* ---------- Tipps auf dem Bildschirm ---------- */
  var TIPS = [["lang", "tip_lang"], ["design", "tip_design"], ["read", "tip_read"], ["help", "tip_help"], ["mic", "tip_mic"], ["offer", "tip_offer"]];
  function startTips() { S.tip = 0; S.sheet = false; S.screen = "home"; render(); }
  function endTips() { S.tip = -1; LS.set("tipsSeen", 2); render(); }
  function drawTip() {
    var tip = TIPS[S.tip], el = document.querySelector('[data-tip="' + tip[0] + '"]');
    var ring = document.getElementById("tipring"), card = document.getElementById("tipcard");
    if (!el || !ring || !card) return;
    el.scrollIntoView({ block: "center" });
    var r = el.getBoundingClientRect(), pad = 6;
    ring.style.left = (r.left - pad) + "px"; ring.style.top = (r.top - pad) + "px";
    ring.style.width = (r.width + pad * 2) + "px"; ring.style.height = (r.height + pad * 2) + "px";
    var last = S.tip === TIPS.length - 1;
    card.innerHTML = '<span class="muted xs">' + esc(t("tipOf", { n: S.tip + 1, m: TIPS.length })) + '</span><p>' + esc(t(tip[1])) + '</p>' +
      '<div class="row2"><button class="btn out" data-act="tipskip">' + esc(t("skip")) + '</button><button class="btn amber" data-act="tipnext">' + esc(last ? t("done") : t("next")) + '</button></div>';
    if (r.top + r.height / 2 > window.innerHeight / 2) { card.style.top = "16px"; card.style.bottom = "auto"; }
    else { card.style.bottom = "24px"; card.style.top = "auto"; }
    if (S.settings.auto) speak(t(tip[1]));
  }
  window.addEventListener("resize", function () { if (S.tip >= 0) drawTip(); });

  /* ---------- Sprache wechseln ---------- */
  function setLang(code) {
    if (IDX[code] == null) return;
    S.lang = code; LS.set("lang", code); S.sheet = false;
    if (rec) try { rec.abort(); } catch (e) {}
    S.listening = false;
    render();
    speak(t("langSay")); // Ansage sofort in der neuen Sprache
  }
  function addRecent(q) {
    q = String(q || "").trim(); if (q.length < 2) return;
    S.recent = [q].concat(S.recent.filter(function (r) { return r.toLowerCase() !== q.toLowerCase(); })).slice(0, 6);
    LS.set("recent", S.recent);
  }

  /* ---------- Aktionen ---------- */
  var ACT = {
    home: function () { go("home"); },
    orders: function () { go("orders"); },
    langsheet: function () { S.sheet = "lang"; render(); var b = document.querySelector(".langs button.on"); if (b) b.focus(); },
    designsheet: function () { S.sheet = "design"; render(); var b = document.querySelector(".thm.on"); if (b) b.focus(); },
    closesheet: function (el, e) {
      if (e.target.closest(".sheet") && !e.target.closest('.sheet [data-act="closesheet"]')) return;
      S.sheet = false; render();
    },
    setlang: function (el) { setLang(el.getAttribute("data-code")); },
    theme: function (el) { S.settings.theme = el.getAttribute("data-id"); saveSettings(); applyTheme(); render(); },
    accent: function (el) { S.settings.accent = el.getAttribute("data-id"); saveSettings(); applyTheme(); render(); },
    read: function () { speak(readText()); },
    newreq: function () { startRequest(); },
    svcstart: function (el) { startRequest(el.getAttribute("data-id")); },
    svc: function (el) { var id = el.getAttribute("data-id"), a = S.draft.services, i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); saveDraft(); render(); },
    obj: function (el) { S.draft.obj = el.getAttribute("data-id"); saveDraft(); render(); },
    fill: function (el) { S.draft.fill = el.getAttribute("data-id"); saveDraft(); render(); },
    legal: function (el) { S.legal = el.getAttribute("data-id"); go("legal", { force: true }); },
    floor: function (el) { S.draft.floor = Math.max(0, Math.min(30, (S.draft.floor || 0) + Number(el.getAttribute("data-d")))); saveDraft(); render(); },
    mode: function (el) { S.draft.mode = el.getAttribute("data-id"); saveDraft(); render(); },
    day: function (el) { S.draft.date = el.getAttribute("data-d"); saveDraft(); render(); },
    time: function (el) { S.draft.time = el.getAttribute("data-t"); saveDraft(); render(); },
    rmphoto: function (el) { var p = S.photos.splice(Number(el.getAttribute("data-i")), 1)[0]; if (p) try { URL.revokeObjectURL(p.url); } catch (e) {} render(); },
    next: function () {
      var d = S.draft;
      if (S.step === 1 && !d.services.length) return toast(t("errService"));
      if (S.step === 2 && !(d.date && d.time)) return toast(t("errDate"));
      if (S.step === 3) { if (!(d.name.trim() && d.phone.trim() && d.address.trim())) return toast(t("errContact")); return sendRequest(); }
      S.step++; go("request", { force: true });
    },
    back: function () { if (S.screen === "request" && S.step > 1) { S.step--; go("request", { force: true }); } else go("home"); },
    call: function () { call(); },
    wa: function () { whatsapp(""); },
    openorder: function (el) { S.orderId = Number(el.getAttribute("data-id")); go("order", { force: true }); },
    delorder: function (el) {
      if (!window.confirm(t("confirmDelete"))) return;
      var id = Number(el.getAttribute("data-id"));
      S.orders = S.orders.filter(function (o) { return o.id !== id; }); LS.set("orders", S.orders); go("orders");
    },
    filter: function (el) { S.filter = el.getAttribute("data-f"); render(); },
    recent: function (el) { S.query = el.getAttribute("data-q"); render(); },
    clearq: function () { S.query = ""; render(); var q = document.getElementById("q"); if (q) q.focus(); },
    listen: function () { listen(); },
    voice: function () { go("ansage", { silent: true }); listen(); },
    utter: function (el) { handleUtterance(el.getAttribute("data-text")); },
    say: function (el) { speak(t(el.getAttribute("data-a")) + ". " + t(el.getAttribute("data-b"))); },
    readall: function () { speak(HELP.map(function (h) { return t(h[1]) + ". " + t(h[2]); }).join(" ")); },
    rate: function (el) { S.settings.rate = Number(el.getAttribute("data-r")); saveSettings(); render(); speak(t("say_ansage")); },
    photo: function (el) { S.lightbox = Number(el.getAttribute("data-i")); render(); },
    lbclose: function () { S.lightbox = -1; render(); },
    lbprev: function () { S.lightbox = (S.lightbox + VEHICLE.length - 1) % VEHICLE.length; render(); },
    lbnext: function () { S.lightbox = (S.lightbox + 1) % VEHICLE.length; render(); },
    tips: function () { startTips(); },
    role: function (el) { var r = el.getAttribute("data-id"); if (r === "kunde") return; S.sheet = "role_" + r; render(); },
    copylink: function () {
      var url = "https://gijouma-maker.github.io/wn-entruempelung/";
      try { navigator.clipboard.writeText(url).then(function () { toast(t("linkCopied")); }, function () { toast(url); }); } catch (e) { toast(url); }
    },
    tipnext: function () { if (S.tip >= TIPS.length - 1) endTips(); else { S.tip++; drawTip(); } },
    tipskip: function () { endTips(); }
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act],[data-go]");
    if (!el || !$app.contains(el) || el.disabled) return;
    if (S.tip >= 0 && !el.closest("#tipcard")) return; // während der Tipps nur die Tipp-Karte bedienbar
    if (S.screen === "search" && el.closest("#results")) addRecent(S.query);
    var g = el.getAttribute("data-go");
    if (g) { e.preventDefault(); go(g); return; }
    var a = ACT[el.getAttribute("data-act")];
    if (a) { e.preventDefault(); a(el, e); }
  });
  function onField(e) {
    var el = e.target, f = el.getAttribute && el.getAttribute("data-field");
    if (el.id === "q") { S.query = el.value; var r = document.getElementById("results"); if (r) r.innerHTML = results(); return; }
    if (!f) return;
    if (f === "auto") { S.settings.auto = el.checked; saveSettings(); if (el.checked) speak(t("autoAnnounce")); return; }
    if (f === "elevator" || f === "consent") S.draft[f] = el.checked; else S.draft[f] = el.value;
    if (f === "area") { var eb = document.getElementById("est"); if (eb) eb.innerHTML = estBox(S.draft); }
    saveDraft();
  }
  document.addEventListener("input", function (e) { if (e.target.type !== "checkbox") onField(e); });
  document.addEventListener("change", function (e) {
    if (e.target.type === "checkbox") { onField(e); return; }
    if (e.target.id === "photoIn") {
      Array.prototype.slice.call(e.target.files || []).slice(0, 12 - S.photos.length).forEach(function (f) { S.photos.push({ url: URL.createObjectURL(f), name: f.name }); });
      render();
    }
  });
  document.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.id === "qform") { addRecent(S.query); var q = document.getElementById("q"); if (q) q.blur(); }
    if (e.target.id === "sayform") { var i = document.getElementById("saytext"); if (i && i.value.trim()) handleUtterance(i.value); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (S.lightbox >= 0) { S.lightbox = -1; render(); } else if (S.sheet) { S.sheet = false; render(); } else if (S.tip >= 0) endTips();
  });

  /* ---------- Start ---------- */
  applyTheme();
  try { history.replaceState({ s: "home" }, ""); } catch (e) {}
  render();
  if (LS.get("tipsSeen", 0) !== 2) setTimeout(startTips, 600);
})();
