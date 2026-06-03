export const API_BASE = '/.netlify/functions';

export const AUTH = {
  saveSession(name: string, pin: string) {
    sessionStorage.setItem("auth_name", name);
    sessionStorage.setItem("auth_pin", pin);
  },
  getSession() {
    const name = sessionStorage.getItem("auth_name");
    const pin = sessionStorage.getItem("auth_pin");
    if (name && pin) return { name, pin };
    return null;
  },
  clearSession() {
    sessionStorage.removeItem("auth_name");
    sessionStorage.removeItem("auth_pin");
  }
};

export const apiClient = {
  async post<T>(endpoint: string, payload: Record<string, any>): Promise<T> {
    const session = AUTH.getSession();
    const enrichedPayload = session ? { ...payload, pin: session.pin } : payload;

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedPayload),
    });

    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.error("API Error (Not JSON):", text);
      throw new Error(text || "Server Fehler (Keine JSON-Antwort)");
    }
  },

  async getConfig() {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) throw new Error("Failed to fetch config");
    return response.json();
  }
};
