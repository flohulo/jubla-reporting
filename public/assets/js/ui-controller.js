/**
 * UI Controller for handling simple interface interactions.
 */
const UI = {
    // Tabs umschalten
    showTab(tabId, btn) {
        ["formTab", "requestTab", "infoTab"].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.style.display = "none";
        });
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        const target = document.getElementById(tabId);
        if (target) target.style.display = "block";
        btn.classList.add("active");
    },

    // Warnboxen bei Dynamik-Änderung anzeigen
    onDynamikChange() {
        const val = parseInt(document.getElementById("f_dynamik").value);
        const cfg = window.APP_CONFIG.messages;
        
        const warnBox = document.getElementById("warnBox");
        const critBox = document.getElementById("critBox");
        
        if (warnBox) {
            warnBox.innerText = cfg.dynamikWarn;
            warnBox.classList.toggle("show", val === 4);
        }
        if (critBox) {
            critBox.innerText = cfg.dynamikCrit;
            critBox.classList.toggle("show", val === 5);
        }
    },

    // Formularfelder umschalten (Report für andere)
    toggleReportFor() {
        const checked = document.getElementById("f_fuer_check").checked;
        document.getElementById("rolleGroup").style.display = checked ? "none" : "block";
        document.getElementById("partnerGroup").style.display = checked ? "none" : "block";
        document.getElementById("hlGroup").style.display = checked ? "block" : "none";
        document.getElementById("hilfsGroup").style.display = checked ? "block" : "none";
    },

    // Akkordeon umschalten
    toggleAccordion(button) {
        button.nextElementSibling.classList.toggle("open");
    },

    // Hilfe-Box umschalten
    toggleSupportBox() {
        document.getElementById("supportBox").classList.toggle("open");
    },

    // PIN-Sichtbarkeit umschalten
    togglePin() {
        const el = document.getElementById("pinInput");
        if (el) el.type = el.type === "password" ? "text" : "password";
    },

    // Hilfe-Punkte aus Config laden
    populateHelpPoints() {
        if (window.APP_CONFIG && window.APP_CONFIG.helpPoints) {
            const helpList = document.getElementById("helpPointsList");
            if (helpList) {
                helpList.innerHTML = window.APP_CONFIG.helpPoints.map((p) => `<li>${p}</li>`).join("");
            }
        }
    },

    // Branding aus Config anwenden
    applyBranding() {
        if (!window.APP_CONFIG) return;

        const cfg = window.APP_CONFIG;
        document.title = cfg.branding.appName;

        const orgEl = document.getElementById('appOrgName');
        const subEl = document.getElementById('headerSubtitle');
        const iconEl = document.querySelector('.logo-badge');
        if (orgEl) orgEl.innerText = cfg.branding.orgName;
        if (subEl) subEl.innerText = cfg.branding.heroSubtitle;
        if (iconEl && cfg.branding.reportIcon) iconEl.innerText = cfg.branding.reportIcon;

        const versionLabel = document.getElementById('versionLabelPrefix');
        if (versionLabel && cfg.labels.versionLabel) versionLabel.innerText = cfg.labels.versionLabel + " ";

        this.populateTabs();
        this.populateFormLabels();
        this.populatePlaceholders();
        this.populateDynamikOptions();
        this.populateRoles();
        this.populateDescriptions();
        this.populateEmergencyNumbers();
        this.populateInfoContent();
        this.populateLinks();
    },

    // Tab-Beschriftungen laden
    populateTabs() {
        const cfg = window.APP_CONFIG.tabs;
        if (!cfg) return;
        if (document.getElementById("tabReport")) document.getElementById("tabReport").innerText = cfg.report;
        if (document.getElementById("tabRequest")) document.getElementById("tabRequest").innerText = cfg.request;
        if (document.getElementById("tabInfo")) document.getElementById("tabInfo").innerText = cfg.info;
    },

    // Form Labels laden
    populateFormLabels() {
        const cfg = window.APP_CONFIG.labels;
        if (!cfg) return;

        const mapping = {
            "loginTitle": "loginTitle",
            "requestTitle": "requestTitle",
            "infoSectionTitle": "infoSectionTitle",
            "helpTipsBtn": "helpTipsBtn",
            "nameLabel": "nameLabel",
            "pinLabel": "pinLabel",
            "dateLabel": "dateLabel",
            "reportForOthersLabel": "reportForOthersLabel",
            "roleLabel": "roleLabel",
            "partnerLabel": "partnerLabel",
            "hlLabel": "hlLabel",
            "hilfsLabel": "hilfsLabel",
            "kidsCountLabel": "kidsCountLabel",
            "leadersCountLabel": "leadersCountLabel",
            "dynamicsLabel": "dynamicsLabel",
            "remarksLabel": "remarksLabel",
            "emailLabel": "emailLabel",
            "requestDateLabel": "requestDateLabel",
            "requestReasonLabel": "requestReasonLabel",
            "verificationCodeLabel": "verificationCodeLabel",
            "loginBtn": "loginBtn",
            "submitBtn": "submitReportBtn",
            "requestCodeBtn": "requestCodeBtn",
            "requestBtn": "showReportsBtn",
            "accEmergency": "emergencyTitle",
            "accHelp": "helpTopicsTitle",
            "accLegal": "legalTitle",
            "contactTitle": "contactTitle",
            "generalInfoTitle": "generalInfoTitle",
            "privacyTitle": "privacyTitle",
            "linksTitle": "linksTitle"
        };

        Object.entries(mapping).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.innerText = cfg[key];
        });
    },

    // Placeholders laden
    populatePlaceholders() {
        const cfg = window.APP_CONFIG.placeholders;
        if (!cfg) return;

        const mapping = {
            "userNameInput": "name",
            "pinInput": "pin",
            "f_partner": "partnerName",
            "f_hl": "leaderName",
            "f_hilfs": "leaderName",
            "f_anzahl": "kidsCount",
            "f_leiter": "leadersCount",
            "r_email": "email",
            "r_grund": "requestReason",
            "r_pin": "verificationCode"
        };

        Object.entries(mapping).forEach(([id, key]) => {
            const el = document.getElementById(id);
            if (el) el.placeholder = cfg[key];
        });
    },

    // Dynamik Options laden
    populateDynamikOptions() {
        const list = window.APP_CONFIG.dynamikOptions;
        const select = document.getElementById("f_dynamik");
        if (!list || !select) return;

        select.innerHTML = list.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
    },

    // Rollen laden
    populateRoles() {
        const list = window.APP_CONFIG.roles;
        const select = document.getElementById("f_rolle");
        if (!list || !select) return;

        select.innerHTML = list.map(o => `<option value="${o.value}">${o.label}</option>`).join("");
    },

    // Beschreibungen laden
    populateDescriptions() {
        const cfg = window.APP_CONFIG.descriptions;
        if (!cfg) return;

        if (document.getElementById("requestInfoText")) document.getElementById("requestInfoText").innerText = cfg.requestInfo;
        if (document.getElementById("generalInfoText")) document.getElementById("generalInfoText").innerText = cfg.generalInfo;
        if (document.getElementById("privacyInfoText")) document.getElementById("privacyInfoText").innerText = cfg.privacyInfo;
    },

    // Notrufnummern laden
    populateEmergencyNumbers() {
        const list = window.APP_CONFIG.emergencyNumbers;
        const container = document.getElementById("emergencyContent");
        if (!list || !container) return;

        container.innerHTML = list.map(n => `<p><strong>${n.label}:</strong> ${n.number}</p>`).join("");
    },

    // Info-Inhalte laden (Akkordeon)
    populateInfoContent() {
        const cfg = window.APP_CONFIG.accordionContent;
        if (!cfg) return;

        const helpContainer = document.getElementById("helpTopicsContent");
        if (helpContainer) {
            helpContainer.innerHTML = `
                <p><strong>${cfg.dynamics.title}</strong> ${cfg.dynamics.text}</p>
                <p><strong>${cfg.conflicts.title}</strong> ${cfg.conflicts.text}</p>
                <p><strong>${cfg.safety.title}</strong> ${cfg.safety.text}</p>
                <p><strong>${cfg.emergencies.title}</strong> ${cfg.emergencies.text}</p>
            `;
        }

        const legalContainer = document.getElementById("legalContent");
        if (legalContainer) {
            legalContainer.innerHTML = cfg.legal.map(l => `<p>${l}</p>`).join("");
        }
    },

    // Links laden
    populateLinks() {
        const cfg = window.APP_CONFIG.links;
        if (!cfg) return;

        const mapping = {
            "jublaschweizweb": cfg.website,
            "githubProjectLink": cfg.github,
            "licenseLink": cfg.license,
            "legalLink": cfg.legal
        };

        Object.entries(mapping).forEach(([id, data]) => {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = data.label;
                el.href = data.url;
            }
        });

        if (document.getElementById("footerLegalLink")) document.getElementById("footerLegalLink").href = cfg.legal.url;
        if (document.getElementById("readmeLink")) document.getElementById("readmeLink").href = cfg.github.url + "/blob/main/README.md";
        if (document.getElementById("issueLink")) document.getElementById("issueLink").innerText = cfg.reportIssue;
        if (document.getElementById("strikesLink")) document.getElementById("strikesLink").innerText = cfg.strikes;
        if (document.getElementById("footerLegalLink")) document.getElementById("footerLegalLink").innerText = cfg.legalText;
        
        const vLabel = document.getElementById("versionText");
        if (vLabel && window.APP_CONFIG.labels.versionLabel) vLabel.innerText = window.APP_CONFIG.labels.versionLabel;
    }
};
