"use strict";

const { httpPost } = require("./http");
const crypto = require("crypto");

function base64url(str) {
  return Buffer.from(str).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Gets a Google API Access Token using a Service Account.
 */
async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY missing in environment!");
  }

  // Restore newlines from Netlify environment variables
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
  if (!parsed.access_token) {
    throw new Error("Failed to obtain access token: " + tokenData);
  }
  return parsed.access_token;
}

module.exports = { getAccessToken };
