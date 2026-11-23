/* WN Entrümpelung – Rechtstexte (Impressum, Datenschutz, Widerruf) auf Deutsch und Niederländisch.
   Wird von der Kunden-App und vom Team-Bereich benutzt. Alle Firmendaten kommen aus den Einstellungen
   (Kunden-App: config.js, Team-Bereich: Team & Firma). Leere Felder werden weggelassen.
   Hinweis: Vorlagen ohne Gewähr – bitte von Anwalt/Handwerkskammer prüfen lassen. */
(function () {
  function addr(f) { return [f.strasse, [f.plz, f.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "); }
  function kontakt(f, nl) { return [f.name || "WN Entrümpelung", addr(f), f.tel ? (nl ? "Tel. " : "Tel. ") + f.tel : "", f.email ? "E-Mail: " + f.email : ""].filter(Boolean).join(", "); }
  var RF_NL = { "Einzelunternehmen": "eenmanszaak naar Duits recht (Einzelunternehmen)", "GbR": "vennootschap onder firma naar Duits recht (GbR)", "UG (haftungsbeschränkt)": "besloten vennootschap naar Duits recht (UG haftungsbeschränkt)", "GmbH": "besloten vennootschap naar Duits recht (GmbH)" };

  /* ---------- Widerrufsbelehrung (Muster für Dienstleistungen) ---------- */
  function widerruf(lang, f) {
    var nl = lang === "nl", k = kontakt(f, nl);
    if (nl) return {
      titel: "Herroepingsrecht",
      abschnitte: [
        { h: "Herroepingsrecht", p: ["U heeft het recht binnen een termijn van 14 dagen zonder opgave van redenen deze overeenkomst te herroepen. De herroepingstermijn verstrijkt 14 dagen na de dag van de sluiting van de overeenkomst.",
          "Om het herroepingsrecht uit te oefenen, moet u ons (" + k + ") via een ondubbelzinnige verklaring (bv. schriftelijk per post of e-mail) op de hoogte stellen van uw beslissing de overeenkomst te herroepen. U kunt hiervoor gebruikmaken van het bijgevoegde modelformulier voor herroeping, maar bent hiertoe niet verplicht.",
          "Om de herroepingstermijn na te leven, volstaat het om uw mededeling betreffende uw uitoefening van het herroepingsrecht te verzenden voordat de herroepingstermijn is verstreken."] },
        { h: "Gevolgen van de herroeping", p: ["Als u de overeenkomst herroept, ontvangt u alle betalingen die u tot op dat moment heeft gedaan onverwijld en in ieder geval niet later dan 14 dagen nadat wij op de hoogte zijn gesteld van uw beslissing de overeenkomst te herroepen, van ons terug. Wij betalen u terug met hetzelfde betaalmiddel als waarmee u de oorspronkelijke transactie heeft verricht, tenzij u uitdrukkelijk anders heeft ingestemd; in ieder geval zult u voor zulke terugbetalingen geen kosten hoeven te betalen.",
          "Indien u heeft verzocht om de verrichting van diensten te doen beginnen binnen de herroepingstermijn, betaalt u ons een bedrag dat evenredig is aan hetgeen reeds is geleverd op het moment dat u ons ervan in kennis heeft gesteld dat u de overeenkomst herroept, vergeleken met de volledige uitvoering van de overeenkomst."] }
      ],
      formularTitel: "Modelformulier voor herroeping",
      formular: ["(Dit formulier alleen invullen en terugzenden als u de overeenkomst wilt herroepen.)",
        "— Aan: " + k,
        "— Ik/Wij* deel/delen* u hierbij mede dat ik/wij* onze overeenkomst betreffende de verrichting van de volgende dienst herroep/herroepen*: ______________________",
        "— Besteld op* / ontvangen op*: ____________",
        "— Naam/Namen consument(en): ______________________",
        "— Adres consument(en): ______________________",
        "— Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend): ______________",
        "— Datum: ____________",
        "(*) Doorhalen wat niet van toepassing is."],
      vorzeitig: "Ik verzoek uitdrukkelijk om met de uitvoering van de dienst te beginnen vóór het einde van de herroepingstermijn. Ik weet dat ik bij herroeping een evenredig bedrag betaal voor wat al is uitgevoerd en dat mijn herroepingsrecht vervalt zodra de dienst volledig is uitgevoerd.",
      erhalten: "Ik heb de informatie over het herroepingsrecht en het modelformulier ontvangen."
    };
    return {
      titel: "Widerrufsbelehrung",
      abschnitte: [
        { h: "Widerrufsrecht", p: ["Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.",
          "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (" + k + ") mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.",
          "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden."] },
        { h: "Folgen des Widerrufs", p: ["Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
          "Haben Sie verlangt, dass die Dienstleistungen während der Widerrufsfrist beginnen sollen, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht."] }
      ],
      formularTitel: "Muster-Widerrufsformular",
      formular: ["(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
        "— An: " + k,
        "— Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*): ______________________",
        "— Bestellt am (*) / erhalten am (*): ____________",
        "— Name des/der Verbraucher(s): ______________________",
        "— Anschrift des/der Verbraucher(s): ______________________",
        "— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ______________",
        "— Datum: ____________",
        "(*) Unzutreffendes streichen."],
      vorzeitig: "Ich verlange ausdrücklich, dass Sie vor Ende der Widerrufsfrist mit der Ausführung der beauftragten Leistung beginnen. Mir ist bekannt, dass ich bei einem Widerruf einen angemessenen Betrag für die bis dahin erbrachten Leistungen zahlen muss und mein Widerrufsrecht bei vollständiger Vertragserfüllung erlischt.",
      erhalten: "Ich habe die Widerrufsbelehrung und das Muster-Widerrufsformular erhalten."
    };
  }

  /* ---------- Impressum ---------- */
  function impressum(lang, f) {
    var nl = lang === "nl", rf = f.rechtsform || "Einzelunternehmen", rows = [];
    function r(a, b) { if (b) rows.push([a, b]); }
    if (nl) {
      r("Bedrijf", f.name || "WN Entrümpelung");
      r("Rechtsvorm", RF_NL[rf] || rf + " (Duits recht)");
      r("Eigenaar / vertegenwoordigd door", f.inhaber);
      r("Adres", addr(f) ? addr(f) + ", Duitsland" : "");
      r("Telefoon / WhatsApp", f.tel); r("E-mail", f.email);
      r("Btw-identificatienummer", f.ustid); r("Duits belastingnummer", f.steuernr);
      r("Afvalvervoer Duitsland", f.anzeige53 ? "Melding § 53 KrWG, kenmerk " + f.anzeige53 : "");
      r("VIHB-nummer (Nederland)", f.vihb);
      return { titel: "Bedrijfsgegevens (Impressum)", rows: rows, p: [
        "Gevestigd in Duitsland. Geen vestiging in Nederland; daarom geen inschrijving bij de Kamer van Koophandel (KvK).",
        "Wij nemen niet deel aan geschillenbeslechting voor een consumentengeschillencommissie en zijn daartoe niet verplicht."] };
    }
    r("Firma", f.name || "WN Entrümpelung"); r("Rechtsform", rf); r("Inhaber / vertreten durch", f.inhaber);
    r("Anschrift", addr(f)); r("Telefon / WhatsApp", f.tel); r("E-Mail", f.email);
    r("USt-IdNr. (§ 27a UStG)", f.ustid); r("Steuernummer", f.steuernr);
    r("Abfallbeförderung", f.anzeige53 ? "Anzeige nach § 53 KrWG, Aktenzeichen " + f.anzeige53 : "");
    r("Gefährliche Abfälle", f.erlaubnis54 ? "Erlaubnis nach § 54 KrWG: " + f.erlaubnis54 : "");
    r("VIHB-Nummer (Niederlande)", f.vihb);
    return { titel: "Impressum", untertitel: "Angaben gemäß § 5 DDG", rows: rows, p: [
      "Verbraucherstreitbeilegung: Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."] };
  }

  /* ---------- Datenschutzerklärung ---------- */
  function datenschutz(lang, f) {
    var nl = lang === "nl", k = kontakt(f, nl);
    if (nl) return { titel: "Privacyverklaring", abschnitte: [
      { h: "1. Verwerkingsverantwoordelijke", p: [k + "."] },
      { h: "2. Welke gegevens en waarom", p: ["Als u een aanvraag doet, verwerken wij uw naam, telefoonnummer, adres, de omschrijving van de klus, foto's en uw gewenste afspraak – om u een offerte te maken en de opdracht uit te voeren (art. 6 lid 1 sub b AVG). Als u toestemming geeft, slaan wij uw gegevens op om uw opdracht automatisch aan te maken (art. 6 lid 1 sub a AVG). Facturen bewaren wij vanwege wettelijke verplichtingen (art. 6 lid 1 sub c AVG)."] },
      { h: "3. Opslag in uw browser", p: ["De app slaat uw aanvraag en instellingen alleen op in uw eigen browser (localStorage, sleutels beginnend met \"wn_\"). Dit is nodig voor de werking. U kunt deze gegevens altijd wissen via de browserinstellingen."] },
      { h: "4. WhatsApp", p: ["Als u uw aanvraag via WhatsApp verstuurt, worden de gegevens verwerkt door WhatsApp/Meta. U kiest zelf voor dit communicatiemiddel; u kunt ook bellen of e-mailen."] },
      { h: "5. Hosting", p: ["De app wordt gehost bij GitHub Pages (GitHub Inc., VS). Bij het openen worden technische gegevens zoals uw IP-adres door GitHub verwerkt. GitHub is gecertificeerd onder het EU-VS Data Privacy Framework. Lettertypen worden lokaal geladen, er is geen verbinding met Google Fonts."] },
      { h: "6. Opdrachtverwerking en AI", p: ["Wij beheren opdrachten in een teamomgeving bij Anthropic (Claude). Foto's van te ontruimen ruimtes kunnen daar met AI worden geanalyseerd om het volume te schatten. Het resultaat wordt altijd door een medewerker gecontroleerd; er vindt geen geautomatiseerde besluitvorming plaats."] },
      { h: "7. Bewaartermijnen", p: ["Aanvragen zonder opdracht verwijderen wij na uiterlijk 6 maanden. Opdrachtgegevens en facturen bewaren wij zolang de wettelijke bewaarplicht (Duitsland: tot 8–10 jaar) dat vereist."] },
      { h: "8. Uw rechten", p: ["U heeft recht op inzage, rectificatie, verwijdering, beperking, bezwaar en overdraagbaarheid van uw gegevens en kunt een gegeven toestemming altijd intrekken (bijv. via WhatsApp). U kunt een klacht indienen bij de Autoriteit Persoonsgegevens (Nederland) of bij de Landesbeauftragte für den Datenschutz Niedersachsen (Duitsland)."] },
      { h: "9. Voorlezen en spraakinvoer", p: ["Voorlezen en spraakherkenning gebruiken de functies van uw apparaat/browser. Afhankelijk van uw apparaat kan de spraakherkenning door de browserleverancier (bijv. Google of Apple) worden uitgevoerd."] }
    ] };
    return { titel: "Datenschutzerklärung", abschnitte: [
      { h: "1. Verantwortlicher", p: [k + "."] },
      { h: "2. Welche Daten und wozu", p: ["Wenn Sie eine Anfrage stellen, verarbeiten wir Name, Telefonnummer, Adresse, die Beschreibung des Auftrags, Fotos und Ihren Wunschtermin – um Ihnen ein Angebot zu machen und den Auftrag auszuführen (Art. 6 Abs. 1 lit. b DSGVO). Mit Ihrer Einwilligung speichern wir Ihre Angaben, um den Auftrag automatisch anzulegen (Art. 6 Abs. 1 lit. a DSGVO). Rechnungen bewahren wir wegen gesetzlicher Pflichten auf (Art. 6 Abs. 1 lit. c DSGVO)."] },
      { h: "3. Speicherung in Ihrem Browser", p: ["Die App speichert Ihre Anfrage und Einstellungen nur in Ihrem eigenen Browser (localStorage, Schlüssel beginnen mit \"wn_\"). Das ist für die Funktion technisch notwendig. Sie können diese Daten jederzeit über die Browser-Einstellungen löschen."] },
      { h: "4. WhatsApp", p: ["Wenn Sie Ihre Anfrage per WhatsApp senden, werden die Daten von WhatsApp/Meta verarbeitet. Sie entscheiden selbst über diesen Weg; Sie können uns auch anrufen oder eine E-Mail schreiben."] },
      { h: "5. Hosting", p: ["Die App liegt bei GitHub Pages (GitHub Inc., USA). Beim Aufruf verarbeitet GitHub technische Daten wie Ihre IP-Adresse. GitHub ist unter dem EU-US Data Privacy Framework zertifiziert. Schriftarten werden lokal geladen, es gibt keine Verbindung zu Google Fonts."] },
      { h: "6. Auftragsbearbeitung und KI", p: ["Aufträge verwalten wir in einem Team-Bereich bei Anthropic (Claude). Fotos der zu räumenden Räume können dort mit KI ausgewertet werden, um das Volumen zu schätzen. Das Ergebnis prüft immer ein Mitarbeiter; es gibt keine automatisierte Entscheidung."] },
      { h: "7. Speicherdauer", p: ["Anfragen ohne Auftrag löschen wir spätestens nach 6 Monaten. Auftragsdaten und Rechnungen bewahren wir so lange auf, wie gesetzliche Aufbewahrungsfristen es verlangen (8 bis 10 Jahre)."] },
      { h: "8. Ihre Rechte", p: ["Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Datenübertragbarkeit und können eine Einwilligung jederzeit widerrufen (z. B. per WhatsApp). Sie können sich bei der Landesbeauftragten für den Datenschutz Niedersachsen oder einer anderen Aufsichtsbehörde beschweren (in den Niederlanden: Autoriteit Persoonsgegevens)."] },
      { h: "9. Vorlesen und Spracheingabe", p: ["Vorlesen und Spracheingabe nutzen Funktionen Ihres Geräts bzw. Browsers. Je nach Gerät wird die Spracherkennung vom Browser-Anbieter (z. B. Google oder Apple) durchgeführt."] }
    ] };
  }
  window.WN_RECHT = { widerruf: widerruf, impressum: impressum, datenschutz: datenschutz, RF_NL: RF_NL };
})();
