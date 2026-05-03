"use strict";

const { getAccessToken } = require("./lib/google-auth");
const { appendRow, getAllRows } = require("./lib/sheets-api");
const { sendMail } = require("./lib/mailer");

const STRIKES_SHEET = "Strikes";
const ALARMS_SHEET = "Alarme";

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Formatiert den Zeitstempel für Spalte A zu ISO: YYYY-MM-DD HH:mm:ss
 */
function formatTimestamp(tsInput) {
  const ts = new Date(tsInput || Date.now());
  return ts.toISOString().replace("T", " ").split(".")[0];
}

/**
 * Wandelt ein Datum (egal ob ISO oder TT.MM.JJJJ) in ISO YYYY-MM-DD um
 */
function ensureISODate(dateStr) {
  if (!dateStr) return "";
  // Falls das Datum im Format TT.MM.JJJJ kommt:
  if (dateStr.includes(".") && dateStr.split(".").length === 3) {
    const [d, m, y] = dateStr.split(".");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // Falls es schon ISO ist (oder etwas anderes), versuchen wir es zu normalisieren
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch (e) {
    return dateStr;
  }
}

// Spalten: [0]Timestamp [1]Datum [2]Leiter [3]Name [4]Strikes [5]Ausschluss [6]Version
async function getKidHistory(token, kidName) {
  const rows = await getAllRows(token, STRIKES_SHEET);
  return rows
    .filter((r) => (r[3] || "").trim().toLowerCase() === kidName.trim().toLowerCase())
    .map((r) => ({
      datum: r[1] || "", // Hier wird das ISO-Datum aus Spalte B für den Vergleich genutzt
      strikes: parseInt(r[4]) || 0,
    }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

// ═══════════════════════════════════════════════════════════
//  ANALYSIS (bleibt gleich, nutzt jetzt ISO-Vergleiche)
// ═══════════════════════════════════════════════════════════
function analyzeKid(kidName, todayStrikes, history) {
  const reasons = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  // Da die Daten nun in YYYY-MM-DD vorliegen, funktioniert dieser String-Vergleich perfekt:
  const recent = history.filter((e) => e.datum >= cutoffStr);

  if (todayStrikes >= 2 && history.length > 0) {
    const last = history[history.length - 1];
    if (last.strikes >= 2) reasons.push("2+ Strikes an 2 aufeinanderfolgenden GruStus");
  }

  const recentWithStrikes = recent.filter((e) => e.strikes > 0).length + (todayStrikes > 0 ? 1 : 0);
  if (recentWithStrikes >= 3) reasons.push(`${recentWithStrikes}× in den letzten 30 Tagen mit Strikes`);

  if (todayStrikes === 2) {
    const twoCount = recent.filter((e) => e.strikes === 2).length;
    if (twoCount >= 1) reasons.push(`Bereits ${twoCount + 1}× mit genau 2 Strikes (Wiederholungsmuster)`);
  }

  if (history.length >= 3) {
    const totalWith = history.filter((e) => e.strikes > 0).length + (todayStrikes > 0 ? 1 : 0);
    const total = history.length + 1;
    const ratio = totalWith / total;
    if (ratio >= 0.5 && total >= 4) {
      reasons.push(`Strikes bei ${totalWith}/${total} GruStus (${Math.round(ratio * 100)}%)`);
    }
  }

  return reasons.length > 0 ? { name: kidName, strikes: todayStrikes, history, reasons } : null;
}

// ... Mail Builder Funktionen bleiben unverändert ...
function buildBannedMail(banned, datum, leiterName) {
  const names = banned.map((k) => k.name).join(", ");
  const adminLabel = process.env.ORG_ADMIN_LABEL || "Scharleitung";
  const orgName = process.env.ORG_NAME || "Jubla";
  return {
    subject: `🚫 Ausschluss nächste GruStu – ${names} (${datum})`,
    text: `Hoi ${adminLabel}\n\nAn der GruStu vom ${datum} (erfasst von ${leiterName}) haben folgende Kinder\n3 Strikes erreicht und dürfen bei der nächsten GruStu NICHT teilnehmen:\n\n${banned.map((k) => `  🚫  ${k.name}`).join("\n")}\n\nBitte informiert die Eltern entsprechend.\n\n──────────────────────\n${orgName} · Strike-System`,
  };
}

function buildPatternMail(warnings, datum) {
  const adminLabel = process.env.ORG_ADMIN_LABEL || "Scharleitung";
  const orgName = process.env.ORG_NAME || "Jubla";
  let text = `Hoi ${adminLabel}\n\nDas Strike-System hat bei der GruStu vom ${datum} bei folgenden Kindern\nein wiederkehrendes Muster erkannt:\n\n`;
  warnings.forEach((w) => {
    text += `👤 ${w.name} (${w.strikes} Strike${w.strikes !== 1 ? "s" : ""} heute)\n`;
    w.reasons.forEach((r) => (text += `   → ${r}\n`));
    if (w.history.length > 0) {
      const last5 = w.history.slice(-5);
      text += `   Verlauf (letzte ${last5.length}): ` + last5.map((e) => `${e.datum}=${e.strikes}⚡`).join("  ") + "\n";
    }
    text += "\n";
  });
  text += `──────────────────────\n${orgName} · Strike-System`;
  return { subject: `⚠️ Wiederholungsmuster erkannt – GruStu ${datum}`, text };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};
const ok = (d = {}) => ({ statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, ...d }) });
const err = (m, c = 500) => ({ statusCode: c, headers: CORS, body: JSON.stringify({ ok: false, error: m }) });

// ═══════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════
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

  if (action === "verifyPin") {
    return ok({ verified: body.pin === (process.env.SCHAR_PIN || "1234") });
  }

  try {
    const token = await getAccessToken();

    if (action === "saveStrikeDay") {
      const { datum, leiterName, timestamp, kids } = body;
      const tsFormatted = formatTimestamp(timestamp);
      const isoDatum = ensureISODate(datum); // Sicherstellen, dass Spalte B ISO ist

      // 1. Speichern im Hauptblatt
      const kidsWithStrikes = kids.filter((k) => k.strikes > 0);
      for (const kid of kidsWithStrikes) {
        await appendRow(token, STRIKES_SHEET, [
          tsFormatted,
          isoDatum,      // Gespeichert als YYYY-MM-DD
          leiterName,
          kid.name,
          kid.strikes,
          kid.strikes >= 3 ? "JA" : "NEIN",
          body.version || "1.6",
        ]);
      }

      let mailSent = false;
      let mailErrors = [];

      // 2. Mails für Ausschlüsse
      const banned = kids.filter((k) => k.strikes >= 3);
      if (banned.length > 0) {
        try {
          const { subject, text } = buildBannedMail(banned, datum, leiterName);
          await sendMail(subject, text);
          mailSent = true;
        } catch (e) {
          mailErrors.push(e.message);
        }
      }

      // 3. Musteranalyse & Alarme speichern
      const warnings = [];
      for (const kid of kidsWithStrikes) {
        try {
          const history = await getKidHistory(token, kid.name);
          const histWithoutToday = history.filter((e) => e.datum !== isoDatum);
          const w = analyzeKid(kid.name, kid.strikes, histWithoutToday);

          if (w) {
            warnings.push(w);
            // Alarm in das neue Sheet "Alarme" schreiben
            await appendRow(token, ALARMS_SHEET, [
              tsFormatted,
              isoDatum,
              kid.name,
              kid.strikes,
              w.reasons.join(" | "),
              leiterName
            ]);
          }
        } catch (e) {
          console.error("Pattern error:", e.message);
        }
      }

      if (warnings.length > 0) {
        try {
          const { subject, text } = buildPatternMail(warnings, datum);
          await sendMail(subject, text);
          mailSent = true;
        } catch (e) {
          mailErrors.push(e.message);
        }
      }

      return ok({
        saved: kidsWithStrikes.length,
        banned: banned.length,
        patterns: warnings.length,
        mailSent,
        mailErrors: mailErrors.length > 0 ? mailErrors : undefined,
      });
    }
  } catch (e) {
    return err(e.message);
  }

  return err("Unbekannte Aktion: " + action, 400);
};