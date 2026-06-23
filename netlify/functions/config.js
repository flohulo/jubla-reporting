// Netlify Function to expose non-sensitive app config from environment variables.
"use strict";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      contactEmail: process.env.CONTACT_EMAIL || "",
      contactPhone: process.env.CONTACT_PHONE || "",
      shoppingUrl: "/shopping.html",
      issueUrl: "/report.html",
      githubUrl: "https://github.com/flohulo/jubla-reporting",
      licenseUrl: "/license.html",
      legalUrl: "/legal.html",
    }),
  };
};
