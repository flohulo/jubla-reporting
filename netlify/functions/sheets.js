"use strict";

const { getAccessToken } = require("./lib/google-auth");
const { appendRow, getAllRows } = require("./lib/sheets-api");
const { sendMail } = require("./lib/mailer");

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

// Spalten-Mapping (0-basiert, entspricht Google Sheets Spalten A–K)
const SHEET_COLS = {
  TIMESTAMP: 0,
  DATUM: 1,
  MELDER: 2,
  HL: 3,
  HILFS: 4,
  KINDER: 5,
  LEITER_COUNT: 6,
  DYNAMIK: 7,
  BEMERKUNGEN: 8,
  VERSION: 9,
  EMAIL_SENT: 10,
};

function rowToObject(r) {
  return {
    timestamp: r[SHEET_COLS.TIMESTAMP] || "",
    datum: r[SHEET_COLS.DATUM] || "",
    leiterName: r[SHEET_COLS.MELDER] || "",
    hl: r[SHEET_COLS.HL] || "",
    hilfs: r[SHEET_COLS.HILFS] || "",
    anzahl: r[SHEET_COLS.KINDER] || 0,
    leiterCount: r[SHEET_COLS.LEITER_COUNT] || 0,
    dynamik: r[SHEET_COLS.DYNAMIK] || 1,
    bemerkungen: r[SHEET_COLS.BEMERKUNGEN] || "",
    version: r[SHEET_COLS.VERSION] || "",
    emailSent: r[SHEET_COLS.EMAIL_SENT] === "TRUE",
  };
}

function buildAlertMail(body) {
  const stufe = parseInt(body.dynamik);
  const emoji = stufe >= 5 ? "🚨" : "⚠️";
  const adminLabel = process.env.ORG_ADMIN_LABEL || "Scharleitung";
  const appName = process.env.APP_NAME || "Reporting Tool";
  const subject = `${emoji} Dynamik ${stufe} – ${body.leiterName} (${body.datum})`;
  const text = `Hoi ${adminLabel}

Ein Bericht mit Dynamik ${stufe} wurde eingetragen.

Datum:        ${body.datum}
Gemeldet von: ${body.leiterName}
Hauptleitung: ${body.hl}
Hilfsleitung: ${body.hilfs}
Kinder:       ${body.anzahl}
Zusatz-Ltr.:  ${body.leiterCount}

Bemerkungen:
${body.bemerkungen || "(keine)"}

──────────────────────────────
${appName}
Automatisch generierte Nachricht`;
  return { subject, text };
}

function buildRequestMail(rows, datum, requester, grund) {
  const adminLabel = process.env.ORG_ADMIN_LABEL || "Scharleitung";
  const appName = process.env.APP_NAME || "Reporting Tool";
  const subject = `${appName}-Auszug: ${datum} (angefordert von ${requester})`;
  let text = `Hoi ${adminLabel}

${requester} hat einen Auszug für das Datum ${datum} angefordert.
Grund: ${grund}

`;

  if (rows.length === 0) {
    text += `⚠️  Keine Berichte für ${datum} gefunden.\n`;
  } else {
    rows.forEach((r, i) => {
      text += `─── Bericht ${i + 1} ──────────────────
Gemeldet von: ${r.leiterName}
E-Mail versendet: ${r.emailSent ? "Ja" : "Nein"}
Hauptleitung: ${r.hl}
Hilfsleitung: ${r.hilfs}
Kinder:       ${r.anzahl}
Zusatz-Ltr.:  ${r.leiterCount}
Dynamik:      ${r.dynamik}
Bemerkungen:
${r.bemerkungen || "(keine)"}

`;
    });
  }

  text += `──────────────────────────────\n${appName}`;
  return { subject, text };
}

// ═══════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const ok = (data = {}) => ({ statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, ...data }) });
const err = (msg, code = 500) => ({ statusCode: code, headers: CORS_HEADERS, body: JSON.stringify({ ok: false, error: msg }) });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return err("Invalid JSON", 400);
  }

  const { action } = body;
  const sheetName = process.env.SHEET_NAME || "Reporting";

  // ── 1. PIN prüfen ──────────────────────────────────────────
  if (action === "verifyPin") {
    const correct = process.env.SCHAR_PIN || "1234";
    return ok({ verified: body.pin === correct });
  }

  // ── 2. Alle anderen Aktionen benötigen Google-Token ────────
  try {
    const token = await getAccessToken();

    // ── 2.1 Verifizierungs-Token für Auszug anfordern ────────
    if (action === "requestToken") {
      const { email } = body;
      if (!email) return err("E-Mail fehlt", 400);

      const adminRows = await getAllRows(token, "Admins");
      const isAdmin = adminRows.some((r) => (r[0] || "").toLowerCase() === email.toLowerCase());
      if (!isAdmin) {
        return err("Diese E-Mail-Adresse ist nicht für den Abruf autorisiert.", 403);
      }

      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await appendRow(token, "Tokens", [email, pin, expires]);

      const appName = process.env.APP_NAME || "Reporting Tool";
      const subject = `Dein Verifizierungs-Code: ${pin}`;
      const text = `Hoi!

Dein angeforderter Code für den Berichts-Auszug lautet:

👉 ${pin}

Dieser Code ist 15 Minuten lang gültig. Wenn du diesen Code nicht angefordert hast, kannst du diese Mail ignorieren.

──────────────────────────────
${appName}`;

      await sendMail(subject, text, email);
      return ok({ message: "Code gesendet" });
    }

    // ── 2.2 Bericht erfassen ──────────────────────────────────
    if (action === "appendRow") {
      let emailSent = false;
      if (parseInt(body.dynamik) >= 4) {
        try {
          const { subject, text } = buildAlertMail(body);
          await sendMail(subject, text);
          emailSent = true;
        } catch (mailErr) {
          console.error("Mail-Fehler:", mailErr.message);
        }
      }

      const row = [
        formatTimestamp(body.timestamp),
        body.datum,
        body.leiterName,
        body.hl,
        body.hilfs,
        body.anzahl ?? 0,
        body.leiterCount ?? 0,
        body.dynamik,
        body.bemerkungen || "",
        body.version || "",
        emailSent ? "TRUE" : "FALSE",
      ];

      await appendRow(token, sheetName, row);
      return ok();
    }

    // ── 2.3 Auszug anfordern ──────────────────────────────────
    if (action === "requestHistory") {
      const { email, pin, datum, grund } = body;
      if (!email || !pin) return err("E-Mail oder Code fehlt", 400);

      const tokenRows = await getAllRows(token, "Tokens");
      const validToken = tokenRows.reverse().find(
        (t) =>
          (t[0] || "").toLowerCase() === email.toLowerCase() &&
          t[1] === pin &&
          new Date(t[2]) > new Date()
      );
      if (!validToken) {
        return err("Ungültiger oder abgelaufener Code.", 403);
      }

      const all = await getAllRows(token, sheetName);
      const rows = all.filter((r) => r[SHEET_COLS.DATUM] === datum).map(rowToObject);

      const { subject, text } = buildRequestMail(rows, datum, email, grund);
      await sendMail(subject, text);

      return ok({ found: rows.length, rows });
    }
  } catch (e) {
    return err(e.message);
  }

  return err("Unbekannte Aktion: " + action, 400);
};