// Netlify Function – creates a GitHub Issue via the GitHub REST API.
// The GitHub PAT is stored as env var GITHUB_PAT and never exposed to the client.
"use strict";

const GITHUB_OWNER = "flohulo";
const GITHUB_REPO = "jubla-reporting";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  const token = process.env.GITHUB_PAT;
  if (!token) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "GitHub token not configured." }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Invalid JSON body." }),
    };
  }

  const { type, title, body: issueBody } = payload;

  if (!title || !issueBody) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ ok: false, error: "Title and body are required." }),
    };
  }

  // Determine label based on report type
  const labels = type === "feature" ? ["enhancement"] : ["bug"];

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title,
          body: issueBody,
          labels,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("GitHub API error:", res.status, errText);
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({
          ok: false,
          error: `GitHub API responded with ${res.status}`,
        }),
      };
    }

    const issue = await res.json();
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        ok: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
      }),
    };
  } catch (err) {
    console.error("create-issue error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: "Internal server error." }),
    };
  }
};
