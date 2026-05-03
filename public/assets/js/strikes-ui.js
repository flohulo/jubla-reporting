/**
 * Core logic for the Strike System UI.
 */
var currentUser = null;
var currentVersion = "";
let kids = []; // { name, strikes }

const UI = {
  togglePin() {
    const el = document.getElementById("loginPin");
    if (el) el.type = el.type === "password" ? "text" : "password";
  },
  
  updateStats() {
    const total = kids.length;
    const withStrikes = kids.filter(k => k.strikes > 0).length;
    const warns = kids.filter(k => k.strikes === 2).length;
    const red = kids.filter(k => k.strikes >= 3).length;

    document.getElementById("statTotal").innerText = total;
    document.getElementById("statWith").innerText = withStrikes;
    document.getElementById("statWarn").innerText = warns;
    document.getElementById("statRed").innerText = red;

    document.getElementById("pillWarn").classList.toggle("active-warn", warns > 0);
    document.getElementById("pillRed").classList.toggle("active-red", red > 0);
  },

  renderKids() {
    const list = document.getElementById("kidsList");
    const cfg = window.APP_CONFIG || {};

    if (kids.length === 0) {
      const emptyMsg = (cfg.labels && cfg.labels.noKidsOnList) || "Noch keine Kinder auf der Liste.<br>Gib oben einen Namen ein.";
      list.innerHTML = `
        <div class="empty-state">
          <div class="ei">🧒</div>
          <p>${emptyMsg}</p>
        </div>`;
      return;
    }

    list.innerHTML = "";
    kids.forEach((k, idx) => {
      const card = document.createElement("div");
      card.className = `kid-card s${k.strikes}`;
      const bannedTag = (cfg.labels && cfg.labels.bannedTag) || "🚫 Ausschluss";
      card.innerHTML = `
        <button class="btn-remove" onclick="removeKid(${idx})">✕</button>
        <div class="kid-name">${HELPERS.escapeHtml(k.name)}</div>
        ${k.strikes >= 3 ? `<span class="banned-tag">${bannedTag}</span>` : ""}
        <div class="dot-row">
          <div class="dot ${k.strikes >= 1 ? "d1" : ""}"></div>
          <div class="dot ${k.strikes >= 2 ? "d2" : ""}"></div>
          <div class="dot ${k.strikes >= 3 ? "d3" : ""}"></div>
        </div>
        <div class="kid-controls">
          <button class="btn-cs minus" onclick="changeStrike(${idx}, -1)" ${k.strikes === 0 ? "disabled" : ""}>–</button>
          <button class="btn-cs plus" onclick="changeStrike(${idx}, 1)" ${k.strikes >= 3 ? "disabled" : ""}>+</button>
        </div>
      `;
      list.appendChild(card);
    });
    this.updateStats();
  },

  applyBranding() {
    const cfg = window.APP_CONFIG || {};
    if (!cfg.labels) return;

    // Header & Titles
    document.title = cfg.branding.appName;
    const orgEl = document.getElementById('appOrgName'); // if present
    if (orgEl) orgEl.innerText = cfg.branding.orgName;

    const iconEl = document.querySelector('.logo-badge');
    if (iconEl && cfg.branding.strikeIcon) iconEl.innerText = cfg.branding.strikeIcon;

    const subEl = document.getElementById('headerSub');
    if (subEl) {
      const template = cfg.labels.strikeSystemSub || "{org} · GruStu";
      subEl.innerText = template.replace("{org}", cfg.branding.orgName);
    }

    const backLink = document.querySelector('.header-back');
    if (backLink && cfg.labels.backToReporting) backLink.innerText = cfg.labels.backToReporting;

    const mapping = {
      "pageTitle": "strikeSystemTitle",
      "strikeSystemTitle": "strikeSystemTitle",
      "loginTitle": "loginTitle",
      "nameLabel": "nameLabel",
      "pinLabel": "pinLabel",
      "loginBtn": "loginBtn",
      "kidsLabel": "kidsLabel",
      "strikesLabel": "strikesLabel",
      "attentionLabel": "attentionLabel",
      "bannedLabel": "bannedLabel",
      "saveBtn": "completeGruStuBtn",
      "successTitle": "strikeSuccess",
      "successSub": "strikeSuccessSub",
      "newGruStuBtn": "newGruStuBtn"
    };

    Object.entries(mapping).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.innerText = cfg.labels[key];
    });

    if (document.getElementById("kidInput")) {
      document.getElementById("kidInput").placeholder = cfg.labels.addKidPlaceholder;
    }
    if (document.getElementById("loginName")) {
      document.getElementById("loginName").placeholder = cfg.placeholders.name;
    }
    if (document.getElementById("loginPin")) {
      document.getElementById("loginPin").placeholder = cfg.placeholders.pin;
    }
    
    // Footer
    if (document.getElementById("issueLink")) document.getElementById("issueLink").innerText = cfg.links.reportIssue;
    if (document.getElementById("footerLegalLink")) document.getElementById("footerLegalLink").innerText = cfg.links.legalText;
    if (document.getElementById("strikesLink")) document.getElementById("strikesLink").innerText = cfg.labels.backToStrikes;
    
    const versionLabel = document.getElementById("versionText");
    if (versionLabel && cfg.labels.versionLabel) versionLabel.innerText = cfg.labels.versionLabel;

    if (document.getElementById("footerGithubLink")) {
      document.getElementById("footerGithubLink").innerText = cfg.links.githubShort;
    }
  }
};

// ── Actions ──
async function login() {
  const name = document.getElementById("loginName").value.trim();
  const pin = document.getElementById("loginPin").value.trim();
  const err = document.getElementById("loginErr");
  const btn = document.getElementById("loginBtn");
  const cfg = window.APP_CONFIG || {};

  if (!name || !pin) {
    err.innerText = (cfg.messages && cfg.messages.loginMissing) || "Name und PIN eingeben.";
    return;
  }

  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.checking) || "Prüfe…";

  try {
    const data = await API_CLIENT.post("strikes", { action: "verifyPin", pin });
    if (data.ok && data.verified) {
      currentUser = name;
      const loginMsg = (cfg.messages && cfg.messages.loginSuccess) || "Hoi {name}! 👋";
      document.getElementById("headerSub").innerText = loginMsg.replace("{name}", name);
      document.getElementById("loginArea").style.display = "none";
      document.getElementById("mainArea").style.display = "block";
      UI.renderKids();
    } else {
      err.innerText = (cfg.messages && cfg.messages.loginError) || "Falscher PIN.";
      document.getElementById("loginPin").value = "";
    }
  } catch (e) {
    err.innerText = (cfg.messages && cfg.messages.genericError) || "Fehler.";
  } finally {
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.loginBtn) || "Anmelden";
  }
}

function addKid() {
  const input = document.getElementById("kidInput");
  const name = input.value.trim();
  if (!name) return;
  kids.push({ name, strikes: 0 });
  input.value = "";
  UI.renderKids();
}

function removeKid(idx) {
  kids.splice(idx, 1);
  UI.renderKids();
}

function changeStrike(idx, delta) {
  const k = kids[idx];
  k.strikes = Math.max(0, Math.min(3, k.strikes + delta));
  UI.renderKids();
}

async function saveDay() {
  const btn = document.getElementById("saveBtn");
  const err = document.getElementById("saveErr");
  const cfg = window.APP_CONFIG || {};
  err.innerText = "";

  if (kids.length === 0) {
    err.innerText = (cfg.messages && cfg.messages.noKidsInList) || "Keine Kinder in der Liste.";
    return;
  }

  btn.disabled = true;
  btn.innerText = (cfg.labels && cfg.labels.saving) || "Wird gespeichert…";

  try {
    const data = await API_CLIENT.post("strikes", {
      action: "saveStrikeDay",
      datum: new Date().toISOString().split("T")[0],
      leiterName: currentUser,
      timestamp: new Date().toISOString(),
      kids: kids,
      version: currentVersion
    });

  if (data.ok) {
    showSummary(data);
  } else {
      throw new Error(data.error);
    }
  } catch (e) {
    err.innerText = (cfg.messages && cfg.messages.saveError) || "Fehler beim Speichern.";
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.completeGruStuBtn) || "GruStu abschliessen & speichern 💾";
  }
}

function showSummary(data) {
  const overlay = document.getElementById("successOverlay");
  const list = document.getElementById("summaryList");
  const cfg = window.APP_CONFIG || {};
  list.innerHTML = "";

  const withStrikes = kids.filter(k => k.strikes > 0);
  if (withStrikes.length === 0) {
    const noStrikesMsg = (cfg.messages && cfg.messages.noStrikes) || "Keine Strikes heute. Alles vorbildlich! 🌟";
    list.innerHTML = `<p style='text-align:center; padding:10px;'>${noStrikesMsg}</p>`;
  } else {
    withStrikes.forEach(k => {
      const row = document.createElement("div");
      row.className = `summary-row ${k.strikes === 3 ? "bad" : k.strikes === 2 ? "warn" : "ok"}`;
      row.innerHTML = `<span class="summary-name">${HELPERS.escapeHtml(k.name)}</span><span class="summary-val">${k.strikes} Strike${k.strikes > 1 ? "s" : ""}</span>`;
      list.appendChild(row);
    });
  }

  if (data.mailSent) {
    const mailMsg = (cfg.messages && cfg.messages.strikeMailSent) || "Scharleitung wurde informiert.";
    document.getElementById("summaryMail").querySelector("span").innerText = mailMsg;
    document.getElementById("summaryMail").style.display = "block";
  } else {
    document.getElementById("summaryMail").style.display = "none";
  }
  overlay.classList.add("show");
}

// ── Lifecycle ──
window.addEventListener("load", async () => {
  try {
    const vInfo = await API_CLIENT.getVersionInfo();
    currentVersion = vInfo.version;
    const versionEl = document.getElementById("versionLabel");
    if (versionEl) versionEl.innerText = currentVersion;
    UI.applyBranding();
    
    // Version prüfen
    HELPERS.checkVersion(vInfo);
  } catch (e) {
    console.warn("Konnte Version nicht laden", e);
    UI.applyBranding();
  }
});
