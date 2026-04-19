# jubla-reporting
Jubla Reporting Tool

[![Netlify Status](https://api.netlify.com/api/v1/badges/5f437261-5c16-4d69-87a1-6d7bb4cb87f6/deploy-status)](https://app.netlify.com/projects/jubla-wald-reporting/deploys)

## Setup

Dieses Projekt nutzt Netlify Functions und Google Sheets. Sensible Daten wie E-Mail-Adressen und Zugangsdaten werden über Umgebungsvariablen gesteuert.

### Environment

Lege eine Datei `.env` an oder konfiguriere die Variablen in Netlify. Eine Beispiel-Datei liegt in `.env.example`.

Benötigte Variablen:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID`
- `SHEET_NAME`
- `SCHAR_PIN`
- `SMTP_USER`
- `SMTP_PASS`
- `SCHARLEITUNG_EMAIL`
- `CONTACT_EMAIL`
- `CONTACT_PHONE`

### Besonderheiten

- Die Mail-Einstellungen werden nur im Backend verwendet, nicht im Frontend.
- Kontaktinformationen für den Info-Tab werden über die Netlify Function `/.netlify/functions/config` geladen.
- Die Version in der Fußzeile verweist automatisch auf das aktuelle GitHub Release.

## GitHub

- Projekt: https://github.com/flohulo/jubla-reporting
- Issues: https://github.com/flohulo/jubla-reporting/issues

## .github

Es wurden Issue-Templates und eine Pull-Request-Vorlage angelegt:

- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
