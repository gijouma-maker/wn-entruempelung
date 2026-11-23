/* WN Entrümpelung – Einstellungen
   Hier nur die Werte zwischen den Anführungszeichen ändern. */
window.WN_CONFIG = {
  // Telefonnummer für den Knopf "Anrufen", z. B. "+49 170 1234567"
  phone: "",

  // WhatsApp-Nummer (mit Ländervorwahl), z. B. "+49 170 1234567".
  // Leer lassen = es wird die Telefonnummer von oben benutzt.
  // Ist eine Nummer eingetragen, wird jede neue Anfrage automatisch per WhatsApp an diese Nummer geschickt.
  whatsapp: "",

  // Optional: E-Mail-Adresse. Wird nur benutzt, wenn KEINE Telefon-/WhatsApp-Nummer eingetragen ist.
  email: "",

  // ---- Angaben für Impressum, Datenschutz und Widerrufsbelehrung (Deutsch + Niederländisch) ----
  firma: "WN Entrümpelung",
  rechtsform: "Einzelunternehmen",   // z. B. Einzelunternehmen, GbR, GmbH, UG (haftungsbeschränkt)
  inhaber: "",                       // Vor- und Nachname
  strasse: "",                       // Straße und Hausnummer
  plz: "",
  ort: "Nordhorn",
  ustid: "",                         // USt-IdNr., z. B. DE123456789
  steuernr: "",                      // optional
  anzeige53: "",                     // Aktenzeichen der Anzeige nach § 53 KrWG (Abfallbeförderung)
  erlaubnis54: "",                   // nur falls vorhanden: Erlaubnis für gefährliche Abfälle
  vihb: "",                          // VIHB-Nummer für Abfalltransport in den Niederlanden

  // Link zum Team-Bereich (Aufträge, Arbeitszeit, Urlaub, Verträge) für Chef und Mitarbeiter.
  // Nur Personen, die Sie in Claude eingeladen haben, können ihn öffnen. Leer lassen = kein Knopf.
  // Ladevolumen Ihres Transporters in m³ (für die grobe Schätzung in der Kunden-App)
  transporterM3: 12,

  teamApp: "https://claude.ai/artifact/UAJRavigwn6eVYrqJ6oktT"
};
