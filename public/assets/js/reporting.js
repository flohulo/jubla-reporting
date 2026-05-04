/**
 * Core logic for the main reporting tool.
 */
var currentUser = null;
var currentVersion = "";

// ── Authentication ──
async function login() {
  const name = document.getElementById("userNameInput").value.trim();
  const pin = document.getElementById("pinInput").value.trim();
  const err = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");
  const cfg = window.APP_CONFIG || {};

  if (!name || !pin) {
    err.innerText = (cfg.messages && cfg.messages.loginMissing) || "Bitte Name und PIN eingeben.";
    return;
  }

  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.checking) || "Prüfe…";

  try {
    const data = await API_CLIENT.post("sheets", { action: "verifyPin", pin });
    if (data.ok && data.verified) {
      currentUser = name;
      const loginMsg = (cfg.messages && cfg.messages.loginSuccess) || "Hoi {name}! 👋";
      document.getElementById("headerSubtitle").innerText = loginMsg.replace("{name}", name);
      document.getElementById("f_datum").value = new Date().toISOString().split("T")[0];
      document.getElementById("r_datum").value = new Date().toISOString().split("T")[0];
      document.getElementById("loginArea").style.display = "none";
      document.getElementById("tabBar").style.display = "flex";
      document.getElementById("formTab").style.display = "block";

      // UI Initialisierung nach Login
      UI.populateHelpPoints();
      UI.applyBranding();
    } else {
      err.innerText = (cfg.messages && cfg.messages.loginError) || "Falscher PIN. Bitte nochmal versuchen.";
      document.getElementById("pinInput").value = "";
    }
  } catch (e) {
    err.innerText = (cfg.messages && cfg.messages.connectionError) || "Verbindungsfehler. Bitte später nochmal versuchen.";
  } finally {
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.loginBtn) || "Anmelden";
  }
}

// ── Submit Report ──
async function submitReport() {
  const btn = document.getElementById("submitBtn");
  const err = document.getElementById("formError");
  const checked = document.getElementById("f_fuer_check").checked;
  const cfg = window.APP_CONFIG || {};

  const body = {
    action: "appendRow",
    timestamp: new Date().toISOString(),
    datum: document.getElementById("f_datum").value,
    leiterName: currentUser, // Der Name des angemeldeten Leiters
    rolle: document.getElementById("f_rolle").value,
    partner: document.getElementById("f_partner").value.trim(),
    hl: checked ? document.getElementById("f_hl").value.trim() : (document.getElementById("f_rolle").value === "Hauptleitung" ? currentUser : document.getElementById("f_partner").value.trim()),
    hilfs: checked ? document.getElementById("f_hilfs").value.trim() : (document.getElementById("f_rolle").value === "Hilfsleitung" ? currentUser : document.getElementById("f_partner").value.trim()),
    anzahl: document.getElementById("f_anzahl").value,
    leiterCount: document.getElementById("f_leiter").value, 
    dynamik: document.getElementById("f_dynamik").value,
    bemerkungen: document.getElementById("f_bemerkungen").value.trim(), 
    version: currentVersion,
    checked: checked
  };

  const validationError = VALIDATION.validateReport(body);
  if (validationError) {
    err.innerText = validationError;
    return;
  }

  err.innerText = "";
  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.sending) || "Wird gesendet…";

  try {
    const data = await API_CLIENT.post("sheets", body);
    if (data.ok) {
      const successTitle = (cfg.messages && cfg.messages.reportSuccess) || "Bericht gesendet!";
      const successSub = (cfg.messages && cfg.messages.reportSuccessSub) || "Vielen Dank für deine Meldung. Die Scharleitung wurde informiert.";
      const newReportBtn = (cfg.labels && cfg.labels.newReportBtn) || "Neuer Bericht";
      document.getElementById("formTab").innerHTML = `
        <div class="success-card">
          <div class="success-icon"><i class="fa-solid fa-circle-check"></i></div>
          <h2>${successTitle}</h2>
          <p>${successSub}</p>
          <button class="btn btn-primary" onclick="location.reload()">${newReportBtn}</button>
        </div>`;
    } else {
      throw new Error(data.error || "Unbekannt");
    }
  } catch (e) {
    err.innerText = `Fehler: ${e.message}`;
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.submitReportBtn) || "Report absenden";
  }
}

// ── Request History ──
async function requestCode() {
  const email = document.getElementById("r_email").value.trim();
  const err = document.getElementById("requestError");
  const btn = document.getElementById("requestCodeBtn");
  const cfg = window.APP_CONFIG || {};

  if (!email) {
    err.style.color = "var(--red)";
    err.innerText = (cfg.messages && cfg.messages.emailMissing) || "Bitte E-Mail-Adresse eingeben.";
    return;
  }

  err.innerText = "";
  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.checkingAuth) || "Prüfe Berechtigung…";

  try {
    const data = await API_CLIENT.post("sheets", { action: "requestToken", email });
    if (data.ok) {
      document.getElementById("requestStep1").style.display = "none";
      document.getElementById("requestStep2").style.display = "block";
      err.style.color = "var(--green)";
      err.innerText = (cfg.messages && cfg.messages.codeSent) || "Code wurde gesendet. Bitte E-Mail prüfen.";
    } else {
      throw new Error(data.error);
    }
  } catch (e) {
    err.style.color = "var(--red)";
    err.innerText = e.message;
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.requestCodeBtn) || "Verifizierungs-Code anfordern";
  }
}

async function submitRequest() {
  const btn = document.getElementById("requestBtn");
  const err = document.getElementById("requestError");
  const email = document.getElementById("r_email").value.trim();
  const pin = document.getElementById("r_pin").value.trim();
  const datum = document.getElementById("r_datum").value;
  const grund = document.getElementById("r_grund").value.trim();
  const cfg = window.APP_CONFIG || {};

  err.style.color = "var(--red)";
  err.innerText = "";

  if (!datum || !grund || !pin) {
    err.innerText = (cfg.messages && cfg.messages.fieldsMissing) || "Bitte alle Felder ausfüllen.";
    return;
  }

  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.verifying) || "Wird verifiziert…";

  try {
    const data = await API_CLIENT.post("sheets", {
      action: "requestHistory",
      email,
      pin,
      datum,
      grund,
    });

    if (data.ok) {
      const successTitle = (cfg.messages && cfg.messages.requestSuccess) || "Angefordert!";
      const successSubTemplate = (cfg.messages && cfg.messages.requestSuccessSub) || "Der Auszug für {date} wurde per E-Mail gesendet.";
      const successSub = successSubTemplate.replace("{date}", HELPERS.escapeHtml(HELPERS.formatDate(datum)));
      const noFoundText = (cfg.labels && cfg.labels.noEntriesFound) || "Keine Einträge gefunden.";
      const foundTextTemplate = (cfg.labels && cfg.labels.entriesFound) || "{count} Einträge";
      const newRequestBtn = (cfg.labels && cfg.labels.newRequestBtn) || "Neue Anforderung";

      let html = `
        <div class="success-card">
          <div class="success-icon"><i class="fa-solid fa-envelope-circle-check"></i></div>
          <h2>${successTitle}</h2>
          <p>${successSub}
          ${data.found === 0 ? `<br><em>${noFoundText}</em>` : ` (${foundTextTemplate.replace("{count}", data.found)})`}
          </p>`;

      if (data.rows && data.rows.length > 0) {
        html += '<div class="divider"></div>';
        data.rows.forEach((r) => {
          const reportedByTemplate = (cfg.labels && cfg.labels.reportedBy) || "von {name} ({role})";
          const defaultRole = (cfg.labels && cfg.labels.defaultRole) || "Leitung";
          const reportedBy = reportedByTemplate
            .replace("{name}", HELPERS.escapeHtml(r.leiterName))
            .replace("{role}", HELPERS.escapeHtml(r.rolle || defaultRole));

          html += `
            <div class="report-card dyn-${r.dynamik}">
              <div class="report-meta">
                <span class="report-date">${HELPERS.formatDate(r.datum)}</span>
                <span class="report-by">${reportedBy}</span>
              </div>
              <div class="report-badges">
                <span class="badge badge-blue">${cfg.labels.hlLabel}: ${HELPERS.escapeHtml(r.hl)}</span>
                <span class="badge badge-blue">${cfg.labels.hilfsLabel}: ${HELPERS.escapeHtml(r.hilfs)}</span>
                <span class="badge badge-green">${cfg.labels.kidsCountLabel}: ${r.anzahl}</span>
                <span class="badge badge-green">${cfg.labels.leadersCountLabel}: ${r.leiterCount}</span>
                <span class="badge ${r.dynamik >= 4 ? "badge-crit" : r.dynamik >= 3 ? "badge-warn" : "badge-green"}">
                  ${cfg.labels.dynamicsLabel} ${r.dynamik}
                </span>
              </div>
              <div class="report-note">${HELPERS.escapeHtml(r.bemerkungen || "(keine)")}</div>
            </div>`;
        });
      }

      html += `<button class="btn btn-primary" onclick="location.reload()">${newRequestBtn}</button></div>`;
      document.getElementById("requestTab").innerHTML = html;
    } else {
      throw new Error(data.error || "Unbekannt");
    }
  } catch (e) {
    err.innerText = `Fehler: ${e.message}`;
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.showReportsBtn) || "Berichte anzeigen";
  }
}

// ── Lifecycle ──
window.addEventListener("load", async () => {
  // Version Info laden
  try {
    const vInfo = await API_CLIENT.getVersionInfo();
    currentVersion = vInfo.version;
    const versionEl = document.getElementById("versionLabel");
    if (versionEl) versionEl.innerText = currentVersion;
    
    // Version prüfen
    HELPERS.checkVersion(vInfo);
  } catch (e) {
    console.warn("Konnte Version nicht laden");
  }

  // Support Infos & Branding Initial
  try {
    const config = await API_CLIENT.getConfig();
    if (config.ok) {
      if (document.getElementById("contactPhone")) document.getElementById("contactPhone").innerHTML = config.contactPhone ? `<a href="tel:${config.contactPhone}">${config.contactPhone}</a>` : "N/A";
      if (document.getElementById("contactEmail")) document.getElementById("contactEmail").innerHTML = config.contactEmail ? `<a href="mailto:${config.contactEmail}">${config.contactEmail}</a>` : "N/A";
    }
  } catch (e) { }

  UI.applyBranding();
});
