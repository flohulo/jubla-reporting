/**
 * Shared API client for communicating with Netlify functions.
 */
const API_CLIENT = {
  /**
   * Helper to perform a POST request to a function.
   */
  async post(endpoint, payload) {
    const response = await fetch(`/.netlify/functions/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  /**
   * Fetches the app configuration.
   */
  async getConfig() {
    const response = await fetch("/.netlify/functions/config");
    return response.json();
  },

  /**
   * Fetches version info from GitHub.
   */
  async getVersionInfo(repo = "flohulo/jubla-reporting") {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      return {
        version: data.tag_name || data.name,
        url: data.html_url,
      };
    } catch (e) {
      // Fallback to latest commit
      const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits/main`);
      const commitData = await commitRes.json();
      return {
        version: `commit ${commitData.sha ? commitData.sha.slice(0, 7) : "main"}`,
        url: `https://github.com/${repo}/commits/main`,
      };
    }
  },
};

/**
 * Common Helpers
 */
const HELPERS = {
  formatDate(dateStr) {
    if (!dateStr) return "–";
    const [year, month, day] = dateStr.split("-");
    return day && month && year ? `${day}.${month}.${year}` : dateStr;
  },
  escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },
  
  // ── Version Check & Update ──
  showUpdatePopup(newVersion) {
    const overlay = document.createElement("div");
    overlay.className = "overlay show";
    overlay.style.zIndex = "9999";
    
    const card = document.createElement("div");
    card.className = "overlay-card";
    card.innerHTML = `
      <div class="overlay-icon">🆕</div>
      <h2>Update verfügbar!</h2>
      <p>Eine neue Version (<strong>${newVersion}</strong>) wurde installiert.</p>
      <p style="font-size: 0.85em; opacity: 0.8;">Die App wird nun aktualisiert um alle neuen Funktionen anzuzeigen.</p>
      <button class="btn btn-primary" id="reloadBtn">Neu laden 🔄</button>
    `;
    
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    
    document.getElementById("reloadBtn").onclick = () => {
      localStorage.clear();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
          location.reload(true);
        });
      } else {
        location.reload(true);
      }
    };
  },

  async checkVersion(vInfo) {
    const savedVersion = localStorage.getItem("app_version");
    const currentV = vInfo.version;
    
    if (savedVersion && savedVersion !== currentV) {
      this.showUpdatePopup(currentV);
    }
    
    localStorage.setItem("app_version", currentV);
  },

  // ── Service Worker ──
  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(console.error);
    }
  }
};

// Auto-Register
window.addEventListener("load", () => {
  HELPERS.registerServiceWorker();
});
