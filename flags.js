/* WN Entrümpelung – Flaggen als SVG (funktionieren auf allen Geräten, auch Windows) */
(function () {
  function star(cx, cy, R, r) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = Math.PI / 5 * i + Math.PI; // eine Spitze zeigt zum Halbmond
      var rad = i % 2 ? r : R;
      p.push((cx + rad * Math.cos(a)).toFixed(2) + "," + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return p.join(" ");
  }
  var F = {
    de: '<rect width="30" height="20" fill="#FFCE00"/><rect width="30" height="13.33" fill="#DD0000"/><rect width="30" height="6.67" fill="#000"/>',
    en: '<rect width="30" height="20" fill="#012169"/><path d="M0,0 30,20 M30,0 0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 30,20 M30,0 0,20" stroke="#C8102E" stroke-width="1.6"/><path d="M15,0V20M0,10H30" stroke="#fff" stroke-width="6"/><path d="M15,0V20M0,10H30" stroke="#C8102E" stroke-width="3.6"/>',
    tr: '<rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#E30A17"/><polygon fill="#fff" points="' + star(17.6, 10, 2.5, 1) + '"/>',
    /* Vereinigte Arabische Emirate (Dubai) */
    ar: '<rect width="30" height="20" fill="#000"/><rect width="30" height="13.33" fill="#fff"/><rect width="30" height="6.67" fill="#00732F"/><rect width="7.5" height="20" fill="#FF0000"/>',
    ru: '<rect width="30" height="20" fill="#D52B1E"/><rect width="30" height="13.33" fill="#0039A6"/><rect width="30" height="6.67" fill="#fff"/>',
    es: '<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>',
    fr: '<rect width="30" height="20" fill="#EF4135"/><rect width="20" height="20" fill="#fff"/><rect width="10" height="20" fill="#0055A4"/>',
    nl: '<rect width="30" height="20" fill="#21468B"/><rect width="30" height="13.33" fill="#fff"/><rect width="30" height="6.67" fill="#AE1C28"/>'
  };
  window.WN_FLAG = function (code, w, h) {
    w = w || 26; h = h || Math.round(w * 2 / 3);
    return '<svg class="flag" width="' + w + '" height="' + h + '" viewBox="0 0 30 20" aria-hidden="true" preserveAspectRatio="none">' + (F[code] || "") + '</svg>';
  };
})();
