"use strict";

const https = require("https");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const STRIKES_SHEET = "Strikes";
// ═══════════════════════════════════════════════════════════
//  GOOGLE AUTH
// ═══════════════════════════════════════════════════════════
function base64url(str) {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error("Service Account Env-Variablen fehlen!");

  const privateKey = rawKey.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(claim));
  const input = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(input);
  const signature = signer.sign(privateKey, "base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const jwt = `${input}.${signature}`;
  const tokenData = await httpPost(
    "https://oauth2.googleapis.com/token",
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { "Content-Type": "application/x-www-form-urlencoded" },
  );

  const parsed = JSON.parse(tokenData);
  if (!parsed.access_token) throw new Error("Kein Access Token: " + tokenData);
  return parsed.access_token;
}

// ═══════════════════════════════════════════════════════════
//  HTTP HELPERS
// ═══════════════════════════════════════════════════════════
function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = Buffer.from(body);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: "POST",
        headers: { ...headers, "Content-Length": bodyBuf.length },
      },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      },
    );
    req.on("error", reject);
    req.write(bodyBuf);
    req.end();
  });
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https
      .get({ hostname: u.hostname, path: u.pathname + u.search, headers }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve(d));
      })
      .on("error", reject);
  });
}

// ═══════════════════════════════════════════════════════════
//  SHEETS API
// ═══════════════════════════════════════════════════════════
function sheetUrl(sheetName, path) {
  const id = process.env.GOOGLE_SHEET_ID;
  return `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(sheetName)}${path}`;
}

async function appendRow(token, sheetName, row) {
  const url = sheetUrl(sheetName, ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS");
  const result = await httpPost(url, JSON.stringify({ values: [row] }), {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  });
  const parsed = JSON.parse(result);
  if (parsed.error) throw new Error(parsed.error.message);
  return parsed;
}

async function getAllRows(token, sheetName) {
  const raw = await httpGet(sheetUrl(sheetName, ""), { Authorization: "Bearer " + token });
  const parsed = JSON.parse(raw);
  if (parsed.error) throw new Error(parsed.error.message);
  // Skip header row
  return (parsed.values || []).slice(1);
}

// ─── Verlauf eines Kindes aus dem Sheet holen ─────────────
// Spalten: [0]Timestamp [1]Datum [2]Leiter [3]Name [4]Strikes [5]Ausschluss [6]Version
async function getKidHistory(token, kidName) {
  const rows = await getAllRows(token, STRIKES_SHEET);
  return rows
    .filter((r) => (r[3] || "").trim().toLowerCase() === kidName.trim().toLowerCase())
    .map((r) => ({
      datum: r[1] || "",
      strikes: parseInt(r[4]) || 0,
    }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

// ═══════════════════════════════════════════════════════════
//  MUSTER-ANALYSE
// ═══════════════════════════════════════════════════════════
function analyzeKid(kidName, todayStrikes, history) {
  const reasons = [];

  // Letzten 30 Tage
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const recent = history.filter((e) => e.datum >= cutoffStr);

  // Muster 1: 2 aufeinanderfolgende GruStus mit je 2+ Strikes
  if (todayStrikes >= 2 && history.length > 0) {
    const last = history[history.length - 1];
    if (last.strikes >= 2) {
      reasons.push("2+ Strikes an 2 aufeinanderfolgenden GruStus");
    }
  }

  // Muster 2: 3× in 30 Tagen mit Strikes
  const recentWithStrikes = recent.filter((e) => e.strikes > 0).length + (todayStrikes > 0 ? 1 : 0);
  if (recentWithStrikes >= 3) {
    reasons.push(recentWithStrikes + "× in den letzten 30 Tagen mit Strikes");
  }

  // Muster 3: Bereits mehrfach knapp am Ausschluss (genau 2 Strikes)
  if (todayStrikes === 2) {
    const twoCount = recent.filter((e) => e.strikes === 2).length;
    if (twoCount >= 1) {
      reasons.push("Bereits " + (twoCount + 1) + "× mit genau 2 Strikes (Wiederholungsmuster)");
    }
  }

  // Muster 4: Mehr als 50% der GruStus mit Strikes (mind. 4 Einträge)
  if (history.length >= 3) {
    const totalWith = history.filter((e) => e.strikes > 0).length + (todayStrikes > 0 ? 1 : 0);
    const total = history.length + 1;
    const ratio = totalWith / total;
    if (ratio >= 0.5 && total >= 4) {
      reasons.push("Strikes bei " + totalWith + "/" + total + " GruStus (" + Math.round(ratio * 100) + "%)");
    }
  }

  if (reasons.length === 0) return null;
  return { name: kidName, strikes: todayStrikes, history, reasons };
}

// ═══════════════════════════════════════════════════════════
//  MAIL
// ═══════════════════════════════════════════════════════════
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER oder SMTP_PASS fehlen!");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

async function sendMail(subject, text) {
  const to = process.env.SCHARLEITUNG_EMAIL;
  if (!to) throw new Error("SCHARLEITUNG_EMAIL fehlt!");
  const t = getTransporter();
  await t.sendMail({
    from: `"Jubla Strike-System" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}

function buildBannedMail(banned, datum, leiterName) {
  const names = banned.map((k) => k.name).join(", ");
  const subject = `🚫 Ausschluss nächste GruStu – ${names} (${datum})`;
  let text = `Hoi Scharleitung\n\n`;
  text += `An der GruStu vom ${datum} (erfasst von ${leiterName}) haben folgende Kinder\n`;
  text += `3 Strikes erreicht und dürfen bei der nächsten GruStu NICHT teilnehmen:\n\n`;
  banned.forEach((k) => {
    text += `  🚫  ${k.name}\n`;
  });
  text += `\nBitte informiert die Eltern entsprechend.\n\n`;
  text += `──────────────────────\nJubla Wald ZH · Strike-System`;
  return { subject, text };
}

function buildPatternMail(warnings, datum) {
  const subject = `⚠️ Wiederholungsmuster erkannt – GruStu ${datum}`;
  let text = `Hoi Scharleitung\n\n`;
  text += `Das Strike-System hat bei der GruStu vom ${datum} bei folgenden Kindern\n`;
  text += `ein wiederkehrendes Muster erkannt:\n\n`;
  warnings.forEach((w) => {
    text += `👤 ${w.name} (${w.strikes} Strike${w.strikes !== 1 ? "s" : ""} heute)\n`;
    w.reasons.forEach((r) => {
      text += `   → ${r}\n`;
    });
    if (w.history.length > 0) {
      const last5 = w.history.slice(-5);
      text += `   Verlauf (letzte ${last5.length}): ` + last5.map((e) => `${e.datum}=${e.strikes}⚡`).join("  ") + "\n";
    }
    text += "\n";
  });
  text += `──────────────────────\nJubla Wald ZH · Strike-System`;
  return { subject, text };
}

// ═══════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════
function formatDate(s) {
  if (!s) return "–";
  var p = s.split("-");
  return p.length === 3 ? p[2] + "." + p[1] + "." + p[0] : s;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};
const ok = (d = {}) => ({ statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, ...d }) });
const err = (m, c = 500) => ({ statusCode: c, headers: CORS, body: JSON.stringify({ ok: false, error: m }) });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return err("Invalid JSON", 400);
  }

  const { action } = body;

  // ── PIN prüfen ──────────────────────────────────────────
  if (action === "verifyPin") {
    const correct = process.env.SCHAR_PIN || "1234";
    return ok({ verified: body.pin === correct });
  }

  // ── Google Token ────────────────────────────────────────
  let token;
  try {
    token = await getAccessToken();
  } catch (e) {
    return err("Google Auth fehlgeschlagen: " + e.message);
  }

  // ── GruStu speichern ────────────────────────────────────
  if (action === "saveStrikeDay") {
    const { datum, leiterName, timestamp, kids } = body;
    if (!datum || !leiterName || !Array.isArray(kids)) {
      return err("Ungültige Daten", 400);
    }

    try {
      const ts = new Date(timestamp || Date.now());
      const tsFormatted =
        [
          ts.getDate().toString().padStart(2, "0"),
          (ts.getMonth() + 1).toString().padStart(2, "0"),
          ts.getFullYear(),
        ].join(".") +
        " " +
        [ts.getHours().toString().padStart(2, "0"), ts.getMinutes().toString().padStart(2, "0")].join(":");

      // Kinder mit Strikes ins Sheet schreiben
      const kidsWithStrikes = kids.filter((k) => k.strikes > 0);
      for (const kid of kidsWithStrikes) {
        await appendRow(token, STRIKES_SHEET, [
          tsFormatted,
          formatDate(datum),
          leiterName,
          kid.name,
          kid.strikes,
          kid.strikes >= 3 ? "JA" : "NEIN",
          body.version || "1.4",
        ]);
      }

      let mailSent = false;
      let mailErrors = [];

      // Mail: Ausschluss (Dynamik 3 Strikes)
      const banned = kids.filter((k) => k.strikes >= 3);
      if (banned.length > 0) {
        try {
          const { subject, text } = buildBannedMail(banned, datum, leiterName);
          await sendMail(subject, text);
          mailSent = true;
        } catch (e) {
          mailErrors.push("Ausschluss-Mail: " + e.message);
          console.error("Ausschluss-Mail Fehler:", e.message);
        }
      }

      // Muster-Analyse für alle Kinder mit Strikes heute
      const warnings = [];
      for (const kid of kids.filter((k) => k.strikes > 0)) {
        try {
          // Holt bisherigen Verlauf (ohne den heutigen Eintrag, der eben erst gespeichert wurde)
          const history = await getKidHistory(token, kid.name);
          // Heute noch nicht mitzählen – wir haben gerade erst gespeichert,
          // aber appendRow lief schon, also filtern wir das heutige Datum raus
          const histWithoutToday = history.filter((e) => e.datum !== datum);
          const w = analyzeKid(kid.name, kid.strikes, histWithoutToday);
          if (w) warnings.push(w);
        } catch (e) {
          console.error("Muster-Analyse Fehler für", kid.name, ":", e.message);
        }
      }

      if (warnings.length > 0) {
        try {
          const { subject, text } = buildPatternMail(warnings, datum);
          await sendMail(subject, text);
          mailSent = true;
        } catch (e) {
          mailErrors.push("Muster-Mail: " + e.message);
          console.error("Muster-Mail Fehler:", e.message);
        }
      }

      return ok({
        saved: kidsWithStrikes.length,
        banned: banned.length,
        patterns: warnings.length,
        mailSent,
        mailErrors: mailErrors.length > 0 ? mailErrors : undefined,
      });
    } catch (e) {
      return err("Fehler beim Speichern: " + e.message);
    }
  }

  return err("Unbekannte Aktion: " + action, 400);
};
