const https = require('https');
const { google } = require('googleapis');

// ── JWT / Google Auth ──────────────────────────────────────────────────────
async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) throw new Error('Service Account Env-Variablen fehlen!');

  const privateKey = rawKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // JWT Header + Payload
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(claim));
  const input   = header + '.' + payload;

  // Signieren mit crypto (Node.js built-in)
  const { createSign } = require('crypto');
  const sign = createSign('RSA-SHA256');
  sign.update(input);
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  const jwt = input + '.' + signature;

  // JWT gegen Access Token tauschen
  const tokenData = await httpPost('https://oauth2.googleapis.com/token',
    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );

  return JSON.parse(tokenData).access_token;
}

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) throw new Error('Service Account Env-Variablen fehlen!');

  const privateKey = rawKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT(
    email,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/gmail.send'],
    process.env.GMAIL_USER  // Der User, den der Service Account impersoniert
  );

  return auth;
}

// ── HTTPS-Helper ───────────────────────────────────────────────────────────
function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = Buffer.from(body);
    const options = {
      hostname: u.hostname, path: u.pathname + u.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': bodyBuf.length }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get({ hostname: u.hostname, path: u.pathname + u.search, headers }, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ── MAIL ───────────────────────────────────────────────────────────
async function sendMail(to, subject, text) {
  const auth = await getAuthClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const mimeMessage = [
    'To: ' + to,
    'Subject: ' + subject,
    '',
    text
  ].join('\n');

  const encodedMessage = Buffer.from(mimeMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
}

// ── SHEETS API CALLS ───────────────────────────────────────────────────────
async function appendRow(token, row) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Reporting';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const body = JSON.stringify({ values: [row] });
  const result = await httpPost(url, body, {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  });
  return JSON.parse(result);
}

async function getRowsByDate(token, datum) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.SHEET_NAME || 'Reporting';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}`;

  const raw = await httpGet(url, { 'Authorization': 'Bearer ' + token });
  const data = JSON.parse(raw);
  const allRows = (data.values || []).slice(1); // Header überspringen

  // Nur Zeilen für dieses Datum
  return allRows
    .filter((r) => r[1] === datum)
    .map((r) => ({
      timestamp:   r[0]  || '',
      datum:       r[1]  || '',
      leiterName:  r[2]  || '',
      hl:          r[3]  || '',
      hilfs:       r[4]  || '',
      anzahl:      r[5]  || 0,
      leiterCount: r[6]  || 0,
      dynamik:     r[7]  || 1,
      bemerkungen: r[8]  || '',
      rolle:       r[10] || '',
      fuer:        r[11] || ''
    }));
}

// ── HAUPTHANDLER ───────────────────────────────────────────────────────────
exports.handler = async (event) => {
  // CORS für Netlify
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) };
  }

  const { action } = body;

  // ── PIN prüfen (kein Google-Token nötig) ──
  if (action === 'verifyPin') {
    const correct = process.env.SCHAR_PIN || '1234';
    return {
      statusCode: 200, headers,
      body: JSON.stringify({ ok: body.pin === correct })
    };
  }

  // ── Ab hier brauchen wir den Access Token ──
  let token;
  try {
    token = await getAccessToken();
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: 'Auth failed: ' + e.message }) };
  }

  // ── Zeile anhängen ──
  if (action === 'appendRow') {
    try {
      const row = [
        body.timestamp, body.datum, body.leiterName,
        body.hl, body.hilfs,
        body.anzahl, body.leiterCount,
        body.dynamik, body.bemerkungen, '1.4', body.rolle, body.fuer || ''
      ];
      await appendRow(token, row);

      // Mail an Scharleitung bei Dynamik 4 & 5
      if (parseInt(body.dynamik) >= 4) {
        const scharEmail = process.env.SCHARLEITUNG_EMAIL;
        if (scharEmail) {
          const subject = `Jubla Report: Kritische Situation (Dynamik ${body.dynamik})`;
          const text = `Hoi Scharleitung,

Ein Bericht mit Dynamik ${body.dynamik} wurde eingetragen.

Datum: ${body.datum}
Gemeldet von: ${body.leiterName}
Rolle: ${body.rolle}
Für: ${body.fuer || '–'}
Partner: ${body.partner || '–'}
Kinder: ${body.anzahl}
Leiter: ${body.leiterCount}
Bemerkungen: ${body.bemerkungen}

Bitte überprüfen.

Grüsse,
Jubla Reporting Tool`;
          await sendMail(scharEmail, subject, text);
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
    }
  }

  // ── Zeilen lesen ──
  if (action === 'getRows') {
    try {
      const rows = await getRows(token, body.leiterName);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, rows }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
    }
  }

  // ── History anfordern ──
  if (action === 'requestHistory') {
    try {
      const rows = await getRowsByDate(token, body.datum);
      // Mail senden
      const requesterEmail = process.env.REQUEST_EMAIL || 'requester@example.com'; // Placeholder, vielleicht aus body oder env
      // Aber da keine Email-Adressen gespeichert sind, vielleicht an eine feste Adresse oder aus env basierend auf user
      // Für Einfachheit, an SCHARLEITUNG_EMAIL senden, oder eine neue env REQUEST_EMAIL
      const toEmail = process.env.REQUEST_EMAIL;
      if (toEmail) {
        const subject = `Jubla Report Auszug für ${body.datum}`;
        let text = `Hoi ${body.requester},

Hier der Auszug für das Datum ${body.datum}.
Grund: ${body.grund}

`;
        if (rows.length === 0) {
          text += 'Keine Berichte gefunden für dieses Datum.';
        } else {
          rows.forEach(r => {
            text += `
Datum: ${r.datum}
Gemeldet von: ${r.leiterName}
Rolle: ${r.rolle}
Für: ${r.fuer || '–'}
HL: ${r.hl}
Hilfs: ${r.hilfs}
Kinder: ${r.anzahl}
Leiter: ${r.leiterCount}
Dynamik: ${r.dynamik}
Bemerkungen: ${r.bemerkungen}
`;
          });
        }
        text += `

Grüsse,
Jubla Reporting Tool`;
        await sendMail(toEmail, subject, text);
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers, body: JSON.stringify({ ok: false, error: e.message }) };
    }
  }

  return { statusCode: 400, headers, body: JSON.stringify({ ok: false, error: 'Unknown action: ' + action }) };
};
