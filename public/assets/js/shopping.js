/**
 * Core logic for the shared shopping list.
 */
var currentUser = null;
var currentVersion = "";
var shoppingItems = [];
var showDoneItems = true;

function formatTimestamp(value) {
  if (!value) return "â€“";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function shoppingCfg() {
  return (window.APP_CONFIG && window.APP_CONFIG.shopping) || {};
}

function applyShoppingBranding() {
  const cfg = shoppingCfg();

  if (cfg.pageTitle) document.title = cfg.pageTitle;
  if (document.getElementById("appOrgName")) {
    document.getElementById("appOrgName").innerText =
      (window.APP_CONFIG && window.APP_CONFIG.branding && window.APP_CONFIG.branding.orgName) || "Jubla Reporting";
  }
  if (document.getElementById("shoppingSystemTitle")) {
    document.getElementById("shoppingSystemTitle").innerText = cfg.pageTitle || "Schareinkaufliste";
  }
  if (document.getElementById("pageHeading")) {
    document.getElementById("pageHeading").innerText = cfg.pageTitle || "Schareinkaufliste";
  }
  if (document.getElementById("pageSubtitle")) {
    document.getElementById("pageSubtitle").innerText = cfg.pageSubtitle || "";
  }
  if (document.getElementById("shoppingLoginHint")) {
    document.getElementById("shoppingLoginHint").innerText =
      cfg.intro || "Tragt gemeinsam ein, was noch fehlt.";
  }
  if (document.getElementById("shoppingTitle")) {
    document.getElementById("shoppingTitle").innerText = cfg.shoppingTitle || "Einkaufsliste";
  }
  if (document.getElementById("shoppingHint")) {
    document.getElementById("shoppingHint").innerText = cfg.shoppingHint || "";
  }

  const mapping = {
    loginTitle: "loginTitle",
    nameLabel: "nameLabel",
    pinLabel: "pinLabel",
    itemLabel: "itemLabel",
    amountLabel: "amountLabel",
    categoryLabel: "categoryLabel",
    noteLabel: "noteLabel",
    addBtnText: "addBtn",
    loginBtn: "loginBtn",
    statsOpenLabel: "statsOpen",
    statsDoneLabel: "statsDone",
    statsTotalLabel: "statsTotal",
    hideDoneBtn: "hideDoneBtn",
    clearDoneLabel: "clearDoneBtn",
  };

  Object.entries(mapping).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && cfg[key]) el.innerText = cfg[key];
  });

  if (document.getElementById("userNameInput")) {
    document.getElementById("userNameInput").placeholder =
      (window.APP_CONFIG && window.APP_CONFIG.placeholders && window.APP_CONFIG.placeholders.name) || "Vorname";
  }
  if (document.getElementById("pinInput")) document.getElementById("pinInput").placeholder = "••••";
  if (document.getElementById("s_item")) document.getElementById("s_item").placeholder = "z.B. Milch";
  if (document.getElementById("s_amount")) document.getElementById("s_amount").placeholder = "z.B. 2 Packungen";
  if (document.getElementById("s_category")) document.getElementById("s_category").placeholder = "z.B. Lebensmittel";
  if (document.getElementById("s_note")) document.getElementById("s_note").placeholder = "z.B. glutenfrei";
}

function setStatus(message, isError = true) {
  const el = document.getElementById("shoppingError");
  if (!el) return;
  el.style.color = isError ? "var(--red)" : "var(--green)";
  el.innerText = message || "";
}

function setStats(stats) {
  document.getElementById("statOpen").innerText = stats.open ?? 0;
  document.getElementById("statDone").innerText = stats.done ?? 0;
  document.getElementById("statTotal").innerText = stats.total ?? 0;
}

function renderShoppingList() {
  const list = document.getElementById("shoppingList");
  const cfg = shoppingCfg();

  if (!list) return;

  setStats({
    open: shoppingItems.filter((item) => !item.done).length,
    done: shoppingItems.filter((item) => item.done).length,
    total: shoppingItems.length,
  });

  const visibleItems = shoppingItems.filter((item) => showDoneItems || !item.done);

  if (visibleItems.length === 0) {
    const message =
      shoppingItems.length === 0
        ? cfg.emptyState || "Noch keine Artikel auf der Liste."
        : "Keine offenen Artikel sichtbar.";
    list.innerHTML = `
      <div class="empty-state">
        <div><i class="fa-solid fa-basket-shopping"></i></div>
        <p>${message}</p>
      </div>`;
    return;
  }

  list.innerHTML = "";
  visibleItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = `item-card ${item.done ? "done" : ""}`;

    const statusLabel = item.done ? (cfg.updateDone || "Erledigt") : "Offen";
    const ownerLabel = item.user ? HELPERS.escapeHtml(item.user) : HELPERS.escapeHtml(currentUser || "Unbekannt");

    card.innerHTML = `
      <div class="item-top">
        <div class="item-main">
          <div class="item-title ${item.done ? "done" : ""}">${HELPERS.escapeHtml(item.title)}</div>
          <div class="item-subline">
            ${item.amount ? `<span class="tag tag-green">${HELPERS.escapeHtml(item.amount)}</span>` : ""}
            ${item.category ? `<span class="tag tag-blue">${HELPERS.escapeHtml(item.category)}</span>` : ""}
            <span class="tag ${item.done ? "tag-green" : "tag-amber"}">${statusLabel}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="icon-btn done" type="button" title="${item.done ? (cfg.updateUndo || "Wieder offen") : (cfg.updateDone || "Erledigt")}"
            onclick="toggleItemDone('${item.itemId}')">
            <i class="fa-solid ${item.done ? "fa-rotate-left" : "fa-check"}"></i>
          </button>
          <button class="icon-btn remove" type="button" title="${cfg.removeBtn || "Entfernen"}"
            onclick="removeItem('${item.itemId}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
      ${item.note ? `<div class="item-note">${HELPERS.nl2br(item.note)}</div>` : ""}
      <div class="item-meta">
        <span>von ${ownerLabel}</span>
        <span>${formatTimestamp(item.updatedAt || item.createdAt || item.timestamp)}</span>
      </div>
    `;

    list.appendChild(card);
  });
}

async function refreshList(silent = false) {
  try {
    const data = await API_CLIENT.post("shopping", { action: "getList" });
    if (!data.ok) throw new Error(data.error || "Unbekannt");
    shoppingItems = data.items || [];
    renderShoppingList();
    if (!silent) setStatus("");
  } catch (e) {
    setStatus(e.message || (shoppingCfg().genericError || "Fehler."), true);
  }
}

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
  btn.innerText = (cfg.labels && cfg.labels.checking) || "PrÃ¼feâ€¦";

  try {
    const data = await API_CLIENT.post("shopping", { action: "verifyPin", pin });
    if (data.ok && data.verified) {
      currentUser = name;
      AUTH.saveSession(name, pin);
      const loginMsg = (cfg.messages && cfg.messages.loginSuccess) || "Hoi {name}! ðŸ‘‹";
      document.getElementById("headerSubtitle").innerText = loginMsg.replace("{name}", name);
      document.getElementById("loginArea").style.display = "none";
      document.getElementById("mainArea").style.display = "block";
      if (document.getElementById("logoutBtnTop")) document.getElementById("logoutBtnTop").style.display = "flex";
      setStatus("");
      await refreshList(true);
    } else {
      err.innerText = (cfg.messages && cfg.messages.loginError) || "Falscher PIN.";
      document.getElementById("pinInput").value = "";
    }
  } catch (e) {
    err.innerText = (cfg.messages && cfg.messages.genericError) || "Fehler.";
  } finally {
    btn.disabled = false;
    btn.innerText = (cfg.labels && cfg.labels.loginBtn) || "Anmelden";
  }
}

async function autoLogin() {
  const session = AUTH.getSession();
  if (!session) return;

  const { name, pin } = session;
  const cfg = window.APP_CONFIG || {};

  try {
    const data = await API_CLIENT.post("shopping", { action: "verifyPin", pin });
    if (data.ok && data.verified) {
      currentUser = name;
      const loginMsg = (cfg.messages && cfg.messages.loginSuccess) || "Hoi {name}! ðŸ‘‹";
      document.getElementById("headerSubtitle").innerText = loginMsg.replace("{name}", name);
      document.getElementById("loginArea").style.display = "none";
      document.getElementById("mainArea").style.display = "block";
      if (document.getElementById("logoutBtnTop")) document.getElementById("logoutBtnTop").style.display = "flex";
      await refreshList(true);
    } else {
      AUTH.clearSession();
    }
  } catch (e) {
    console.warn("Auto-login failed", e);
  }
}

function logout() {
  AUTH.clearSession();
  location.reload();
}

async function addItem() {
  const cfg = shoppingCfg();
  const item = document.getElementById("s_item").value.trim();
  const amount = document.getElementById("s_amount").value.trim();
  const category = document.getElementById("s_category").value.trim();
  const note = document.getElementById("s_note").value.trim();
  const btn = document.getElementById("addItemBtn");

  if (!item) {
    setStatus(cfg.validationMissing || "Bitte einen Artikel eingeben.", true);
    return;
  }

  btn.disabled = true;
  document.getElementById("addBtnText").innerText = cfg.saving || "Wird gespeichertâ€¦";

  try {
    const data = await API_CLIENT.post("shopping", {
      action: "addItem",
      timestamp: new Date().toISOString(),
      leiterName: currentUser,
      title: item,
      amount,
      category,
      note,
    });

    if (!data.ok) throw new Error(data.error || "Unbekannt");

    document.getElementById("s_item").value = "";
    document.getElementById("s_amount").value = "";
    document.getElementById("s_category").value = "";
    document.getElementById("s_note").value = "";
    shoppingItems = data.items || [];
    renderShoppingList();
    setStatus(cfg.addSuccess || "Artikel hinzugefÃ¼gt.", false);
    document.getElementById("s_item").focus();
  } catch (e) {
    setStatus(e.message || (cfg.genericError || "Fehler."), true);
  } finally {
    btn.disabled = false;
    document.getElementById("addBtnText").innerText = cfg.addBtn || "Zur Liste";
  }
}

async function toggleItemDone(itemId) {
  const cfg = shoppingCfg();

  try {
    const data = await API_CLIENT.post("shopping", {
      action: "toggleItem",
      timestamp: new Date().toISOString(),
      leiterName: currentUser,
      itemId,
    });

    if (!data.ok) throw new Error(data.error || "Unbekannt");
    shoppingItems = data.items || [];
    renderShoppingList();
    setStatus(cfg.actionSuccess || "Liste aktualisiert.", false);
  } catch (e) {
    setStatus(e.message || (cfg.genericError || "Fehler."), true);
  }
}

async function removeItem(itemId) {
  const cfg = shoppingCfg();

  if (!window.confirm("Artikel wirklich entfernen?")) return;

  try {
    const data = await API_CLIENT.post("shopping", {
      action: "removeItem",
      timestamp: new Date().toISOString(),
      leiterName: currentUser,
      itemId,
    });

    if (!data.ok) throw new Error(data.error || "Unbekannt");
    shoppingItems = data.items || [];
    renderShoppingList();
    setStatus(cfg.actionSuccess || "Liste aktualisiert.", false);
  } catch (e) {
    setStatus(e.message || (cfg.genericError || "Fehler."), true);
  }
}

async function clearDoneItems() {
  const cfg = shoppingCfg();
  const doneCount = shoppingItems.filter((item) => item.done).length;

  if (doneCount === 0) {
    setStatus(cfg.noItemsToClear || "Keine erledigten Artikel zum LÃ¶schen vorhanden.", true);
    return;
  }

  if (!window.confirm("Alle erledigten Artikel lÃ¶schen?")) return;

  try {
    const data = await API_CLIENT.post("shopping", {
      action: "clearDone",
      timestamp: new Date().toISOString(),
      leiterName: currentUser,
    });

    if (!data.ok) throw new Error(data.error || "Unbekannt");
    shoppingItems = data.items || [];
    renderShoppingList();
    setStatus(cfg.actionSuccess || "Liste aktualisiert.", false);
  } catch (e) {
    setStatus(e.message || (cfg.genericError || "Fehler."), true);
  }
}

function toggleDoneVisibility() {
  showDoneItems = !showDoneItems;
  const cfg = shoppingCfg();
  const btn = document.getElementById("toggleDoneBtn");
  const label = document.getElementById("hideDoneBtn");

  if (btn && label) {
    label.innerText = showDoneItems ? (cfg.hideDoneBtn || "Erledigte ausblenden") : (cfg.showDoneBtn || "Erledigte anzeigen");
    const icon = btn.querySelector("i");
    if (icon) icon.className = showDoneItems ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  }

  renderShoppingList();
}

window.addEventListener("load", async () => {
  try {
    const vInfo = await API_CLIENT.getVersionInfo();
    currentVersion = vInfo.version;
    const versionEl = document.getElementById("versionLabel");
    if (versionEl) versionEl.innerText = currentVersion;
    HELPERS.checkVersion(vInfo);
  } catch (e) {
    console.warn("Konnte Version nicht laden", e);
  }

  UI.populateLinks();
  applyShoppingBranding();

  const cfg = shoppingCfg();
  if (document.getElementById("clearDoneLabel")) {
    document.getElementById("clearDoneLabel").innerText = cfg.clearDoneBtn || "Erledigte lÃ¶schen";
  }

  const itemInput = document.getElementById("s_item");
  if (itemInput) {
    itemInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addItem();
    });
  }

  autoLogin();
});
