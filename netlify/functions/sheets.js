'use strict';

const https   = require('https');
const crypto  = require('crypto');
const nodemailer = require('nodemailer');

// ═══════════════════════════════════════════════════════════
//  GOOGLE AUTH (Service Account JWT → Access Token)
// ═══════════════════════════════════════════════════════════
function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

async function getAccessToken() {
  const email      = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey     = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL oder GOOGLE_PRIVATE_KEY fehlen!');

  // Netlify speichert \n als Literal – wiederherstellen
  const privateKey = rawKey.replace(/\\n/g, '\n');

  const now   = Math.floor(Date.now() / 1000);
  const claim = {
    iss:   email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    exp:   now + 3600,
    iat:   now,
  };

  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(claim));
  const input   = `${header}.${payload}`;

  const signer    = crypto.createSign('RSA-SHA256');
  signer.update(input);
  const signature = signer.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = `${input}.${signature}`;

  const tokenData = await httpPost(
    'https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );

  const parsed = JSON.parse(tokenData);
  if (!parsed.access_token) throw new Error('Kein Access Token: ' + tokenData);
  return parsed.access_token;
}

// ═══════════════════════════════════════════════════════════
//  HTTP HELPERS
// ═══════════════════════════════════════════════════════════
function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u       = new URL(url);
    const bodyBuf = Buffer.from(body);
    const req     = https.request(
      {
        hostname: u.hostname,
        path:     u.pathname + u.search,
        method:   'POST',
        headers:  { ...headers, 'Content-Length': bodyBuf.length },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https
      .get({ hostname: u.hostname, path: u.pathname + u.search, headers }, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

// ═══════════════════════════════════════════════════════════
//  SHEETS API
// ═══════════════════════════════════════════════════════════
const SHEET_COLS = {
  TIMESTAMP:    0,
  DATUM:        1,
  MELDER:       2,
  HL:           3,
  HILFS:        4,
  KINDER:       5,
  LEITER_COUNT: 6,
  DYNAMIK:      7,
  BEMERKUNGEN:  8,
  VERSION:      9,
  EMAIL_SENT:   10,
};

function sheetUrl(path) {
  const id   = process.env.GOOGLE_SHEET_ID;
  const name = encodeURIComponent(process.env.SHEET_NAME || 'Reporting');
  return `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${name}${path}`;
}

async function sheetsAppendRow(token, row) {
  const url    = sheetUrl(':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS');
  const result = await httpPost(
    url,
    JSON.stringify({ values: [row] }),
    { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
  );
  const parsed = JSON.parse(result);
  if (parsed.error) throw new Error(parsed.error.message);
  return parsed;
}

async function sheetsGetAll(token) {
  const raw    = await httpGet(sheetUrl(''), { Authorization: 'Bearer ' + token });
  const parsed = JSON.parse(raw);
  if (parsed.error) throw new Error(parsed.error.message);
  return (parsed.values || []).slice(1); // Header-Zeile überspringen
}

function rowToObject(r) {
  return {
    timestamp:   r[SHEET_COLS.TIMESTAMP]    || '',
    datum:       r[SHEET_COLS.DATUM]         || '',
    leiterName:  r[SHEET_COLS.MELDER]        || '',
    hl:          r[SHEET_COLS.HL]            || '',
    hilfs:       r[SHEET_COLS.HILFS]         || '',
    anzahl:      r[SHEET_COLS.KINDER]        || 0,
    leiterCount: r[SHEET_COLS.LEITER_COUNT]  || 0,
    dynamik:     r[SHEET_COLS.DYNAMIK]       || 1,
    bemerkungen: r[SHEET_COLS.BEMERKUNGEN]   || '',
    version:     r[SHEET_COLS.VERSION]       || '',
    emailSent:   r[SHEET_COLS.EMAIL_SENT] === 'TRUE',
  };
}

// ═══════════════════════════════════════════════════════════
//  MAIL (Nodemailer + Gmail SMTP App-Passwort)
// ═══════════════════════════════════════════════════════════
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error('SMTP_USER oder SMTP_PASS fehlen!');

  return nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   465,
    secure: true,
    auth:   { user, pass },
  });
}

async function sendMail(subject, text) {
  const to = process.env.SCHARLEITUNG_EMAIL;
  if (!to) throw new Error('SCHARLEITUNG_EMAIL fehlt!');

  const transporter = getTransporter();
  await transporter.sendMail({
    from:    `"Jubla Reporting" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
}

function buildAlertMail(body) {
  const stufe = parseInt(body.dynamik);
  const emoji = stufe >= 5 ? '⛔ KRITISCH' : '⚠️ ACHTUNG';
  const subject = `${emoji}: Dynamik ${stufe} – ${body.leiterName} (${body.datum})`;
  const text = `Hoi Scharleitung

Ein Bericht mit Dynamik ${stufe} wurde eingetragen.

Datum:       ${body.datum}
Gemeldet von: ${body.leiterName}
Rolle:       ${body.rolle}
Partner/in:  ${body.hl === body.leiterName ? body.hilfs : body.hl}
Kinder:      ${body.anzahl}
Zusatz-Ltr.: ${body.leiterCount}

Bemerkungen:
${body.bemerkungen || '(keine)'}

──────────────────────────────
Jubla Wald ZH · Reporting Tool
Automatisch generierte Nachricht`;
  return { subject, text };
}

function buildRequestMail(rows, datum, requester, grund) {
  const subject = `Jubla Report-Auszug: ${datum} (angefordert von ${requester})`;
  let text = `Hoi Scharleitung

${requester} hat einen Auszug für das Datum ${datum} angefordert.
Grund: ${grund}

`;

  if (rows.length === 0) {
    text += `⚠️  Keine Berichte für ${datum} gefunden.\n`;
  } else {
    rows.forEach((r, i) => {
      text += `─── Bericht ${i + 1} ──────────────────
Gemeldet von: ${r.leiterName}
Rolle:        ${r.rolle}
E-Mail versendet: ${r.emailSent ? 'Ja' : 'Nein'}
Hauptleitung: ${r.hl}
Hilfsleitung: ${r.hilfs}
Kinder:       ${r.anzahl}
Zusatz-Ltr.:  ${r.leiterCount}
Dynamik:      ${r.dynamik}
Bemerkungen:
${r.bemerkungen || '(keine)'}

`;
    });
  }

  text += `──────────────────────────────
Jubla Wald ZH · Reporting Tool`;
  return { subject, text };
}

// ═══════════════════════════════════════════════════════════
//  HANDLER
// ═══════════════════════════════════════════════════════════
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

function ok(data = {})   { return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true,  ...data }) }; }
function err(msg, code = 500) { return { statusCode: code, headers: CORS_HEADERS, body: JSON.stringify({ ok: false, error: msg }) }; }

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST')    return err('Method not allowed', 405);

  let body;
  try { body = JSON.parse(event.body); }
  catch { return err('Invalid JSON', 400); }

  const { action } = body;

  // ── 1. PIN prüfen ─────────────────────────────────────────
  if (action === 'verifyPin') {
    const correct = process.env.SCHAR_PIN || '1234';
    return ok({ verified: body.pin === correct });
    // Hinweis: Frontend prüft data.ok && data.verified
  }

  // ── 2. Token holen (für alle Sheets-Aktionen) ─────────────
  let token;
  try { token = await getAccessToken(); }
  catch (e) { return err('Google Auth fehlgeschlagen: ' + e.message); }

  // ── 3. Zeile eintragen ────────────────────────────────────
  if (action === 'appendRow') {
    try {
      // Mail bei kritischer Dynamik (4 oder 5)
      let emailSent = false;
      if (parseInt(body.dynamik) >= 4) {
        try {
          const { subject, text } = buildAlertMail(body);
          await sendMail(subject, text);
          emailSent = true;
        } catch (mailErr) {
          // Mail-Fehler loggen, aber Report trotzdem als OK zurückgeben
          console.error('Mail-Fehler:', mailErr.message);
        }
      }

      const row = [
        formatTimestamp(body.timestamp),
        body.datum,
        body.leiterName,
        body.hl,
        body.hilfs,
        body.anzahl       || 0,
        body.leiterCount  || 0,
        body.dynamik,
        body.bemerkungen  || '',
        body.version      || '',
        emailSent ? 'TRUE' : 'FALSE',
      ];

      await sheetsAppendRow(token, row);
      return ok();
    } catch (e) {
      return err('Sheets-Fehler: ' + e.message);
    }
  }

  // ── 4. Auszug für Datum anfordern ─────────────────────────
  if (action === 'requestHistory') {
    try {
      const all  = await sheetsGetAll(token);
      const rows = all
        .filter((r) => r[SHEET_COLS.DATUM] === body.datum)
        .map(rowToObject);

      const { subject, text } = buildRequestMail(rows, body.datum, body.requester, body.grund);
      await sendMail(subject, text);

      return ok({ found: rows.length, rows: rows });
    } catch (e) {
      return err('Fehler: ' + e.message);
    }
  }

  return err('Unbekannte Aktion: ' + action, 400);
};