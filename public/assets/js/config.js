/**
 * Globale App-Konfiguration für Branding und Texte.
 * Hier können Namen, Titel und Bezeichnungen zentral angepasst werden.
 */
window.APP_CONFIG = {
    branding: {
        appName: "Jubla Wald ZH – Tool",
        orgName: "Jubla Wald ZH",
        heroTitle: "Reporting Tool",
        heroSubtitle: "Einfach und schnell Berichte erfassen.",
        reportIcon: "🏕",
        strikeIcon: "⚡",
    },

    tabs: {
        report: "Bericht",
        request: "Auszug",
        info: "Info"
    },

    labels: {
        // Titles
        contactTitle: "Kontakt & Support",
        generalInfoTitle: "Allgemeines",
        privacyTitle: "Datenschutz & Dienste",
        linksTitle: "Wichtige Links",
        emergencyTitle: "📞 Notrufnummern",
        helpTopicsTitle: "❓ Hilfe-Themen",
        legalTitle: "📋 Rechtliche Hinweise",

        // Form Section Titles
        loginTitle: "🔒 Anmelden",
        requestTitle: "📨 Auszug anfordern",
        infoSectionTitle: "ℹ️ Allgemeine Infos",
        helpTipsBtn: "💡 Hilfe & Tipps",

        // Form Labels
        nameLabel: "Dein Name",
        pinLabel: "Schar-PIN",
        dateLabel: "Datum",
        reportForOthersLabel: "Report für andere",
        roleLabel: "Meine Rolle",
        partnerLabel: "Partner/in",
        hlLabel: "Hauptleitung",
        hilfsLabel: "Hilfsleitung",
        kidsCountLabel: "Anzahl Kinder",
        leadersCountLabel: "Zusätzliche Leiter",
        dynamicsLabel: "Gruppendynamik",
        remarksLabel: "Bemerkungen",
        emailLabel: "Deine E-Mail",
        requestDateLabel: "Datum der Berichte",
        requestReasonLabel: "Grund der Anforderung",
        verificationCodeLabel: "Bitte gib den 6-stelligen Code aus deiner E-Mail ein:",

        // Buttons
        loginBtn: "Anmelden",
        submitReportBtn: "Report absenden 🚀",
        requestCodeBtn: "Verifizierungs-Code anfordern 🔑",
        showReportsBtn: "Berichte anzeigen 📧",
        newReportBtn: "Neuer Bericht",
        newRequestBtn: "Neue Anforderung",

        // Loading states
        checking: "Prüfe…",
        sending: "Wird gesendet… ⏳",
        verifying: "Wird verifiziert… ⏳",
        saving: "Wird gespeichert…",
        checkingAuth: "Prüfe Berechtigung…",

        // History Display
        reportedBy: "von {name} ({role})",
        defaultRole: "Leitung",
        noEntriesFound: "Keine Einträge gefunden.",
        entriesFound: "{count} Einträge",

        // Strikes specific
        strikeSystemTitle: "Strike-System",
        strikeSystemSub: "{org}",
        bannedTag: "🚫 Ausschluss",
        kidsLabel: "Kinder",
        strikesLabel: "Strikes",
        attentionLabel: "Achtung",
        bannedLabel: "Ausgeschlossen",
        addKidPlaceholder: "Name des Kindes...",
        completeGruStuBtn: "GruStu abschliessen & speichern 💾",
        newGruStuBtn: "Neue GruStu starten",
        noKidsOnList: "Noch keine Kinder auf der Liste.<br>Gib oben einen Namen ein.",
        successTitle: "GruStu gespeichert!",
        successSub: "Alle Strikes wurden erfolgreich in Google Sheets übertragen.",
        strikeMailSent: "Scharleitung wurde informiert.",
        backToReporting: "← Reporting",
        backToStrikes: "Reporting", // Footer link in strikes.html
        versionLabel: "Version",
    },

    placeholders: {
        name: "Dein Name",
        pin: "••••",
        partnerName: "Name",
        leaderName: "Name",
        kidsCount: "z.B. 12",
        leadersCount: "z.B. 2",
        email: "max@muster.ch",
        requestReason: "Warum brauchst du den Auszug?",
        verificationCode: "123456"
    },

    dynamikOptions: [
        { value: "1", label: "1 – Alles top 😊" },
        { value: "2", label: "2 – Gut 🙂" },
        { value: "3", label: "3 – Intensiv 😐" },
        { value: "4", label: "4 – Schwierig 😬" },
        { value: "5", label: "5 – Kritisch ⛔" }
    ],

    roles: [
        { value: "Hauptleitung", label: "Hauptleitung" },
        { value: "Hilfsleitung", label: "Hilfsleitung" }
    ],

    messages: {
        loginSuccess: "Hoi {name}! 👋",
        loginError: "Falscher PIN. Bitte nochmal versuchen.",
        loginMissing: "Bitte Name und PIN eingeben.",
        reportSuccess: "Bericht gesendet!",
        reportSuccessSub: "Vielen Dank für deine Meldung. Die Scharleitung wurde informiert.",
        requestSuccess: "Angefordert!",
        requestSuccessSub: "Der Auszug für {date} wurde per E-Mail gesendet.",
        emailMissing: "Bitte E-Mail-Adresse eingeben.",
        codeSent: "Code wurde gesendet. Bitte E-Mail prüfen.",
        fieldsMissing: "Bitte alle Felder ausfüllen.",
        connectionError: "Verbindungsfehler. Bitte später nochmal versuchen.",
        genericError: "Fehler.",
        saveError: "Fehler beim Speichern.",

        // Dynamik warnings
        dynamikWarn: "⚠️ Bitte beschreibe die Situation ausführlich.",
        dynamikCrit: "⛔ Bitte melde dich zusätzlich bei der Scharleitung!",

        // Strikes specific
        strikeSuccess: "GruStu gespeichert!",
        strikeSuccessSub: "Alle Strikes wurden erfolgreich in Google Sheets übertragen.",
        strikeMailSent: "Scharleitung wurde informiert.",
        noStrikes: "Keine Strikes heute. Alles vorbildlich! 🌟",
        noKidsInList: "Keine Kinder in der Liste."
    },

    validationMessages: {
        allFieldsRequired: "Bitte alle Pflichtfelder ausfüllen.",
        leadersRequired: "Bitte Hauptleitung und Hilfsleitung ausfüllen.",
        partnerRequired: "Bitte Partner/in ausfüllen.",
        remarksRequired: "Bei Dynamik 4/5 sind Bemerkungen Pflicht."
    },

    descriptions: {
        requestInfo: "Fordere einen Bericht für ein bestimmtes Datum an. Du siehst ihn anschliessend direkt. Diese Funktion ist für Fälle gedacht, in denen du einen älteren Bericht brauchst. Bitte gib immer einen Grund an, damit die Scharleitung nachvollziehen kann, warum der Bericht angefordert wurde.",
        generalInfo: "Dieses Reporting-Tool dient zur Erfassung der Gruppenstunden-Dynamik und zur Meldung kritischer Situationen an die Scharleitung. Bitte fülle alle Pflichtfelder aus und beschreibe Vorfälle bei Dynamik 4 und 5 so präzise wie möglich."
    },

    emergencyNumbers: [
        { label: "Polizei", number: "117" },
        { label: "Feuerwehr", number: "118" },
        { label: "Sanität", number: "144" },
        { label: "Kinder- und Jugendnotruf", number: "147" },
        { label: "Vergiftungsnotruf", number: "145" },
        { label: "REGA", number: "1414" },
        { label: "Jubla Zürich Krisentelefon", number: "0800 505 202" },
        { label: "Jubla Krisentelefon national", number: "079 259 76 90" }
    ],

    helpPoints: [
        "Erfasse nach jeder Gruppenstunde einen kurzen Bericht.",
        "Beschreibe bei Dynamik 4 oder 5 die Situation genau.",
        "Bei Dynamik 5 melde dich zusätzlich bei der Scharleitung.",
        "Partnerfeld: trage den Namen der Begleitperson ein.",
        "Diese Einträge helfen bei Problemen die Situation nachzuverfolgen."
    ],

    accordionContent: {
        dynamics: {
            title: "Gruppendynamik:",
            text: "Nutze die Dynamik-Skala 1-5 um dies zu dokumentieren. 1 bedeutet alles super, 5 bedeutet kritische Situationen. Bei 4 oder 5 bitte immer eine genaue Beschreibung der Situation angeben, damit die Scharleitung die Lage einschätzen und gegebenenfalls Unterstützung anbieten kann."
        },
        conflicts: {
            title: "Konflikte:",
            text: "Nimm Konflikte ernst. Höre beiden Seiten zu, bleibe ruhig und fair. Versuche schnell zu deeskalieren durch klare Regeln und positive Verstärkung."
        },
        safety: {
            title: "Sicherheit:",
            text: "Achte auf Aufsichtspflicht – Kinder dürfen nicht unbeaufsichtigt sein. Beachte Altersgerechtheit von Aktivitäten, stelle Material sicher und kenne Erste-Hilfe-Grundlagen. Im Notfall 144 oder 117 anrufen."
        },
        emergencies: {
            title: "Notfälle:",
            text: "Bleibe ruhig und überlegt. Sicherheit first – Stelle sicher dass keine weiteren Personen in Gefahr sind. Rufe sofort den Notruf an (117/118/144). Informiere die Scharleitung und gib ihr alle wichtigen Informationen. Dokumentiere was passiert ist."
        },
        legal: [
            "Diese Anwendung sammelt Daten zur Qualitätssicherung der Gruppenstunden. Alle Daten werden vertraulich behandelt und nur zur internen Nutzung verwendet.",
            "Bei kritischen Berichten wird die Scharleitung automatisch informiert.",
            "Das Melden ersetzt NICHT den Kontakt zu Ansprechpersonen in Notfällen."
        ]
    },

    links: {
        website: { label: "Jubla Schweiz Webseite", url: "https://www.jubla.ch" },
        github: { label: "Projekt auf GitHub", url: "https://github.com/flohulo/jubla-reporting" },
        license: { label: "Lizenz", url: "https://github.com/flohulo/jubla-reporting/blob/main/LICENSE" },
        legal: { label: "Rechtliche Hinweise", url: "https://github.com/flohulo/jubla-reporting/blob/main/LEGAL.md" },
        reportIssue: "Fehler melden",
        strikes: "Strikes",
        legalText: "Rechtliches",
        githubShort: "GitHub"
    }
};
