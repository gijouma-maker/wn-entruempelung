/* WN Team-Bereich – GitHub-Modus (Testversion)
   Läuft nur, wenn die Seite NICHT in Claude geöffnet ist (z. B. auf GitHub Pages).
   Ersetzt Claudes Datenbank durch Speicher im Browser (localStorage), Fotos durch IndexedDB.
   Rolle über den Link:  ohne Zusatz = Chef,  ?rolle=mitarbeiter = Mitarbeiter,  ?rolle=kunde = Kunde
   KI (Volumen, Belege, Sprachassistent) gibt es nur in der Claude-Version. */
(function(){
  if (window.claude && window.claude.use) return;
  var KEY="wn_team_test_v1",P=new URLSearchParams(location.search),ROLLE=(P.get("rolle")||"chef").toLowerCase();
  var S={};try{S=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){S={}}
  var subs=[],saveT=null;
  function save(){clearTimeout(saveT);saveT=setTimeout(function(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alert("Browser-Speicher voll – bitte Testdaten löschen.")}},200)}
  function fire(){setTimeout(function(){subs.forEach(function(f){f()})},0)}
  function cl(o){return o==null?o:JSON.parse(JSON.stringify(o))}
  var n=0;function nid(){return Date.now().toString(36)+(++n)}
  function ref(c,id){return{id:id,
    set:async function(d){S[c]=S[c]||{};S[c][id]=cl(d)||{};save();fire()},
    update:async function(d){S[c]=S[c]||{};S[c][id]=Object.assign(S[c][id]||{},cl(d));save();fire()},
    delete:async function(){if(S[c])delete S[c][id];save();fire()},
    onSnapshot:function(cb){var f=function(){var v=(S[c]||{})[id];cb({exists:!!v,data:function(){return cl(v||{})}})};subs.push(f);setTimeout(f,0);return function(){}}}}
  var db={collection:function(c){return{doc:function(id){return ref(c,id||nid())},onSnapshot:function(cb){var f=function(){cb({docs:Object.keys(S[c]||{}).map(function(id){return{id:id,data:function(){return cl(S[c][id])}}}),metadata:{fromCache:false}})};subs.push(f);setTimeout(f,0);return function(){}}}},
    doc:function(p){var a=p.split("/");return ref(a[0],a[1])}};
  /* Fotos in IndexedDB, im Speicher als Objekt-URL */
  var urls={},blobs={};
  function idb(){return new Promise(function(ok,no){var r=indexedDB.open("wn_team_dateien",1);r.onupgradeneeded=function(){r.result.createObjectStore("f")};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
  var ready=(async function(){try{var d=await idb();await new Promise(function(ok){var tx=d.transaction("f"),st=tx.objectStore("f"),rq=st.openCursor();rq.onsuccess=function(){var cu=rq.result;if(cu){blobs[cu.key]=cu.value;urls[cu.key]=URL.createObjectURL(cu.value);cu.continue()}else ok()};rq.onerror=function(){ok()}})}catch(e){}})();
  window.__wnBlob=function(id){return urls[id]||""};
  var assets={upload:async function(b){var id="f"+nid();blobs[id]=b;urls[id]=URL.createObjectURL(b);try{var d=await idb();await new Promise(function(ok){var tx=d.transaction("f","readwrite");tx.objectStore("f").put(b,id);tx.oncomplete=ok;tx.onerror=ok})}catch(e){}return{id:id}}};
  var me=ROLLE==="mitarbeiter"?"ma_test":"chef_test";
  var user={isOwner:async function(){return ROLLE==="chef"},canEdit:async function(){return ROLLE!=="kunde"},id:async function(){return me},
    profiles:async function(ids){var o={};ids.forEach(function(i){o[i]={name:i==="ma_test"?"Mitarbeiter (Test)":i==="chef_test"?"Chef (Test)":"Mitarbeiter"}});return o}};
  /* Beispieldaten beim ersten Start */
  if(!S.tickets){S.tickets={demo1:{nr:1001,titel:"Beispiel: Wohnung 3 Zimmer",leistung:"Haushaltsauflösung",quelle:"WhatsApp",status:"Neu",kunde:{name:"Max Mustermann",tel:"",ort:"Nordhorn",adresse:"Musterweg 1, 48529 Nordhorn"},zugewiesen:["ma_test"],fotos:[],beschreibung:"Testauftrag – tippen Sie auf „Kalkulation anlegen“ und probieren Sie Angebot und Rechnung.",verlauf:[{t:new Date().toISOString(),text:"Beispiel angelegt"}],erstellt:new Date().toISOString()}};
    S.personen={chef_test:{rolle:"chef"},ma_test:{rolle:"mitarbeiter"}};S.team={ma_test:{name:"Mitarbeiter (Test)",aktiv:true}};save()}
  var caps={db:db,user:user,assets:assets,downloads:null,sample:null,dictation:null};
  window.claude={use:async function(name){await ready;return caps.hasOwnProperty(name)?caps[name]:null}};
  window.__wnGithub=true;
  document.addEventListener("DOMContentLoaded",function(){var b=document.createElement("div");b.style.cssText="background:#F59E0B;color:#111;font:600 12.5px Inter,system-ui,sans-serif;padding:6px 12px;text-align:center";
    b.innerHTML="Testversion auf GitHub – Daten nur in diesem Browser, KI nur in der Claude-Version. Ansicht: <a style='color:#111' href='?'>Chef</a> · <a style='color:#111' href='?rolle=mitarbeiter'>Mitarbeiter</a>";document.body.insertBefore(b,document.body.firstChild)});
})();
