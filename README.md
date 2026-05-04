# ⚜️ Jubla Reporting Tool

> Das effiziente Tool zur Erfassung von Gruppenstunden-Berichten und zur Qualitätssicherung für Jubla-Scharen – optimiert für die Nutzung auf dem Smartphone.

[![Netlify Status](https://api.netlify.com/api/v1/badges/5f437261-5c16-4d69-87a1-6d7bb4cb87f6/deploy-status)](https://app.netlify.com/projects/jubla-wald-reporting/deploys)
![License](https://img.shields.io/github/license/flohulo/jubla-reporting)
![Release](https://img.shields.io/github/v/release/flohulo/jubla-reporting)

Dieses Tool ermöglicht es Leitenden, Berichte zu Gruppenstunden schnell und unkompliziert digital einzureichen – direkt nach dem Höck oder im Bus. Die Daten landen sicher in einem Google Sheet, und die Scharleitung wird bei kritischen Vorfällen automatisch per Mail benachrichtigt.

---

## ✨ Features
*   📱 **Mobile First:** Schlankes Frontend, das perfekt auf jedem Handy funktioniert.
*   🚀 **Einfaches Reporting:** Berichte sind in weniger als 2 Minuten erfasst.
*   📊 **Google Sheets Integration:** Keine Datenbank-Administration nötig – deine Tabelle ist dein Backend.
*   ⚠️ **Alarm-Funktion:** Automatische Benachrichtigung bei kritischen Situationen (z.B. Unfälle oder Konflikte).
*   🎨 **Einfaches Branding:** Texte und Logos lassen sich via `config.js` ohne Programmierkenntnisse anpassen.
*   ☁️ **Serverless:** Kostenloses Hosting via Netlify Functions.

## 📸 Screenshots
<div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
  <img src="docs/screenshots/login.png" alt="Anmeldung" width="180" style="max-width: 100%; height: auto;">
  <img src="docs/screenshots/bericht.png" alt="Gruppenstunde eintragen" width="180" style="max-width: 100%; height: auto;">
  <img src="docs/screenshots/auszug.png" alt="Auszug anfordern" width="180" style="max-width: 100%; height: auto;">
  <img src="docs/screenshots/strikes.png" alt="Strikes eintragen" width="180" style="max-width: 100%; height: auto;">
</div>

---

## 🤝 Scharen, die uns vertrauen

Wir stehen noch ganz am Anfang, aber das Ziel ist gross! Nutzt deine Schar dieses Tool bereits? Wir freuen uns über jede Schar, die dabei ist.

[![Schar anmelden](https://img.shields.io/badge/Schar-anmelden-orange?style=for-the-badge&logo=googleforms)]([https://forms.gle/KRdkHDU6gAN6WzHbA](https://forms.gle/KRdkHDU6gAN6WzHbA))

### Aktive Scharen:
*Deine Schar könnte die erste sein!*

| | | |
|:---:|:---:|:---:|
| (Platz für dein Logo) | (Platz für dein Logo) | (Platz für dein Logo) |

---

## 🚀 Quick Start (In 5 Minuten online)

1.  **Forke** dieses Repository.
2.  Erstelle ein **Google Sheet** (Vorlage siehe [Setup-Guide](docs/setup-sheets.md)).
3.  Verknüpfe das Repo mit **Netlify**.
4.  Hinterlege die `SHEET_ID` in den Umgebungsvariablen – das sind die "geheimen Schlüssel", damit das Tool mit Google kommunizieren kann.
5.  **Fertig!** Deine Schar hat nun ein eigenes Reporting-System.

---

## 🛠 Setup & Dokumentation

Detaillierte Anleitungen findest du hier:
- 📑 [Google Sheets Setup (Spalten & Tabs)](docs/setup-sheets.md)
- 🎨 [Branding & Anpassungen (config.js)](docs/branding.md)
- ⚖️ [Rechtliche Hinweise & Datenschutz](LEGAL.md)
- 🛡️ [Sicherheitsrichtlinie (Security Policy)](SECURITY.md)

---

## 🏗 Mitwirken (Contributing)

Hast du eine Idee für ein neues Feature?
*   Erstelle ein **Issue** für Fehler oder Vorschläge.
*   Sende einen **Pull Request**, wenn du direkt am Code mithelfen willst.

---

## 📜 Lizenz
Dieses Projekt steht unter der **GPL-3.0 License**. Du darfst es frei verwenden, anpassen und für deine Schar nutzen.

---
*Entwickelt mit ❤️ von Leitern für die Jubla.*
