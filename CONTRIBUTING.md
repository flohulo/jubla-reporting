# 🤝 Mitwirken am Jubla Reporting Tool

Vielen Dank, dass du dir die Zeit nimmst, am Jubla Reporting Tool mitzuwirken! Jede Art von Beitrag – sei es das Melden von Fehlern (Bugs), das Vorschlagen neuer Features oder das Schreiben von Code – hilft uns, die Administration für Jubla-Scharen zu vereinfachen.

---

## 📖 Inhaltsverzeichnis
- [Code of Conduct / Verhaltensregeln](#-code-of-conduct--verhaltensregeln)
- [Wie kann ich beitragen?](#-wie-kann-ich-beitragen)
  - [Fehler melden (Bug Reports)](#fehler-melden-bug-reports)
  - [Features vorschlagen](#features-vorschlagen)
  - [Code-Beiträge leisten (Pull Requests)](#code-beiträge-leisten-pull-requests)
- [Lokale Entwicklung (Setup)](#-lokale-entwicklung-setup)
  - [Voraussetzungen](#voraussetzungen)
  - [Installation & Start](#installation--start)
  - [Umgebungsvariablen konfigurieren](#umgebungsvariablen-konfigurieren)
- [Programmier- & Designrichtlinien](#-programmier---designrichtlinien)
- [Pull Request Richtlinien](#-pull-request-richtlinien)

---

## 💬 Code of Conduct / Verhaltensregeln

Wir legen grossen Wert auf ein freundliches, respektvolles und inklusives Miteinander. Bitte gehe respektvoll mit anderen Mitwirkenden um, unabhängig von deren Erfahrungsstufe oder Hintergrund. Es ist jeder/jede herzlich Willkommen.

---

## 💡 Wie kann ich beitragen?

### Fehler melden (Bug Reports)
Falls du einen Fehler im Tool findest:
1. Prüfe in den bestehenden **Issues**, ob der Fehler bereits gemeldet wurde.
2. Falls nicht, erstelle ein neues Issue und nutze die Vorlage für Bug Reports.
3. Beschreibe das Problem so genau wie möglich:
   - Was hast du getan?
   - Was war das erwartete Ergebnis?
   - Was ist stattdessen passiert (inkl. Fehlermeldungen in der Browser-Konsole)?
   - Welches Gerät/welcher Browser wurde verwendet?

### Features vorschlagen
Hast du eine Idee, wie man das Tool noch besser machen könnte?
1. Suche in den **Issues**, ob es einen ähnlichen Vorschlag bereits gibt.
2. Erstelle ein neues Issue vom Typ "Feature Request".
3. Erkläre den Nutzen für die Scharen und skizziere kurz, wie du dir die Umsetzung vorstellst.

### Code-Beiträge leisten (Pull Requests)
Wenn du direkt Änderungen am Code vornehmen möchtest:
1. Wenn du willst, kannst du ein passendes Issue heraussuchen oder eines erstellen, um deine Idee vorab zu besprechen.
2. Forke dieses Repository.
3. Erstelle einen Branch für deine Änderungen (`feature/mein-feature` oder `bugfix/behebung-fehler`).
4. Nimm deine Änderungen vor und teste sie lokal (siehe unten).
5. Erstelle einen Pull Request (PR) gegen den `main`-Branch dieses Repositories.

---

## 💻 Lokale Entwicklung (Setup)

### Voraussetzungen
Um das Projekt lokal auszuführen, benötigst du:
- **Node.js** (aktuelle LTS-Version empfohlen)
- Ein Terminal / eine Kommandozeile
- Optional: Einen Netlify-Account für das serverless Backend

### Installation & Start

1. **Repository klonen / forken:**
   ```bash
   git clone https://github.com/DEIN-BENUTZERNAME/jubla-reporting.git
   cd jubla-reporting
   ```

2. **Dependencies installieren:**
   ```bash
   npm install
   ```

3. **Netlify CLI starten:**
   Dieses Projekt nutzt Netlify-Funktionen als Backend. Um diese lokal zu simulieren, starten wir den Entwicklungsserver mit dem Netlify CLI:
   ```bash
   npm run dev
   ```
   *Hinweis: Dies startet das Frontend standardmässig unter `http://localhost:8888` und stellt die Serverless Functions unter `http://localhost:8888/.netlify/functions/...` bereit.*

### Umgebungsvariablen konfigurieren

Das Tool benötigt bestimmte Schlüssel (z. B. für Google Sheets und E-Mail-Versand).
1. Kopiere die Beispieldatei:
   ```bash
   cp .env.example .env
   ```
2. Trage in der neu erstellten `.env`-Datei deine lokalen Testdaten ein (z. B. Test-Google-Sheet-ID und Zugangsdaten). Eine genaue Anleitung für das Google-Setup findest du in [docs/setup-sheets.md](docs/setup-sheets.md).

---

## 🎨 Programmier- & Designrichtlinien

Um eine konsistente Codebasis und eine gute User Experience zu garantieren, beachte bitte folgende Punkte:

*   📱 **Mobile-First Design:** Das Tool wird primär auf Smartphones während oder direkt nach Gruppenstunden genutzt. Layouts müssen vollständig responsive sein.
*   🛡️ **Datenschutz & Offline-Fähigkeit:**
    *   Externe Bibliotheken (z. B. Icons, Fonts) sollten lokal gehostet werden (siehe self-hosted FontAwesome im `public/assets/`-Verzeichnis), um Datenschutz-Standards zu erfüllen und Offline-Verwendung zu begünstigen.
*   ✍️ **Code-Stil (Javascript):**
    *   Halte clientseitigen Code verständlich und dokumentiere komplexe Logiken mit aussagekräftigen Kommentaren.

---

## 🚀 Pull Request Richtlinien

Bevor du deinen Pull Request einreichst, stelle sicher, dass:
* [ ] Die lokale Entwicklungsumgebung ohne Fehler startet (`npm run dev`).
* [ ] Kein ungenutzter Debugging-Code (z. B. `console.log`) mehr vorhanden ist.
* [ ] Du die Vorlage für Pull Requests vollständig ausgefüllt hast.
* [ ] Deine commits verständlich benannt sind (z. B. `feat: füge Funktion X hinzu` oder `fix: behebe Fehler Y`).

Wir versuchen, alle Pull Requests so schnell wie möglich zu sichten und Feedback zu geben.

---

*Entwickelt mit ❤️ von Leitern für die Jubla. Danke für deine Unterstützung!*
