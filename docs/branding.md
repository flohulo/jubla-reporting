# Branding & Anpassungen

Das Jubla-Reporting Tool lässt sich einfach an deine Schar anpassen, ohne dass du den Programmcode verändern musst. Alle Texte, Logos und Bezeichnungen werden zentral in der Konfigurationsdatei gesteuert.

## Konfigurationsdatei
Die Datei befindet sich unter: `public/assets/js/config.js`

In dieser Datei findest du das Objekt `window.APP_CONFIG`, welches in verschiedene Sektionen unterteilt ist:

### 1. Branding
Hier definierst du die grundlegenden Namen und Icons deiner App.
*   `appName`: Der Titel der Webseite (Browser-Tab).
*   `orgName`: Der Name deiner Schar (wird im Header angezeigt).
*   `heroTitle`: Die Hauptüberschrift auf der Startseite.
*   `heroSubtitle`: Der Untertitel im Header.
*   `reportIcon`: Das Emoji/Symbol für das Reporting-Tool (Standard: 🏕).
*   `strikeIcon`: Das Emoji/Symbol für das Strike-System (Standard: ⚡).

### 2. Tabs
Beschriftung der drei Hauptbereiche:
*   `report`: Bericht erfassen.
*   `request`: Auszug anfordern.
*   `info`: Informationsbereich.

### 3. Labels
Hier kannst du fast jedes Textelement der Benutzeroberfläche anpassen. Dies umfasst:
*   **Titel:** Überschriften für Kontakt, Datenschutz, Notrufe etc.
*   **Formular-Labels:** Beschriftungen für Eingabefelder (Name, PIN, Datum).
*   **Buttons:** Texte auf den Schaltflächen.
*   **Strikes:** Spezifische Begriffe für das Strike-System (Ausschluss, Achtung, etc.).

### 4. Placeholders
Texte, die in leeren Eingabefeldern angezeigt werden (z.B. "z.B. 12" bei der Kinderanzahl).

### 5. Dynamik-Optionen
Die Skala für die Gruppendynamik (1-5). Du kannst die Texte hinter den Zahlen anpassen.

### 6. Rollen
Die zur Auswahl stehenden Rollen (z.B. Hauptleitung, Hilfsleitung).

### 7. Messages & Validierung
Alle Erfolgsmeldungen, Fehlermeldungen und Warnhinweise (z.B. wenn Dynamik 4 oder 5 gewählt wurde).

### 8. Hilfepunkte & Akkordeon
*   `helpPoints`: Eine Liste von Tipps, die in der Hilfe-Box angezeigt werden.
*   `accordionContent`: Die Texte für die ausklappbaren Bereiche (Notfälle, Konflikte, Rechtliches).

### 9. Links
Die Verknüpfungen im Info-Bereich und im Footer (Webseite, GitHub, Rechtliches).

---

## Vorgehen bei Anpassungen
1. Öffne `public/assets/js/config.js`.
2. Suche den entsprechenden Text, den du ändern möchtest.
3. Ändere den Wert in den Anführungszeichen.
4. Speichere die Datei und lade die Webseite neu.

> [!TIP]
> Du kannst in den Texten auch Emojis verwenden, um das Tool freundlicher zu gestalten. Achte darauf, die Struktur der Datei (Klammern und Kommas) nicht zu verletzen.
