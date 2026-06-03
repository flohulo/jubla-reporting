# 📊 Google Sheets Setup

Dieses Dokument erklärt, wie du das Google Sheet für das Jubla-Reporting Tool vorbereitest.

> 💡 **Schnellstart:** Eine fertige Vorlage zum Kopieren findest du hier: [Jubla-Reporting Template](https://docs.google.com/spreadsheets/d/14V2PVsaVX6-aAp2w9ChF_-rOMj5yyprowYRqVoql8-U/edit?usp=sharing). Klicke dort einfach auf **Datei > Kopie erstellen**. Anschliessend musst du nur noch Punkt 5 & 6 erledigen.

## 1. Tabelle erstellen
Falls du die Vorlage nicht nutzt: Erstelle eine neue Tabelle und benenne das erste Blatt (Sheet) in `Reporting` um (oder so, wie du es in deiner `.env` definiert hast).

## 2. Spalten definieren
Die Anwendung erwartet folgende Spalten in der ersten Zeile (Achte exakt auf die Schreibweise!):

| Index | Spaltenname | Beschreibung |
|-------|-------------|--------------|
| A | Zeitstempel | Datum/Zeit der Erfassung |
| B | Datum | Datum der Gruppenstunde |
| C | Melder | Name der leitenden Person |
| D | HL | Hauptleitung |
| E | Hilfsleitung | Hilfsleitung |
| F | Kinder | Anzahl Kinder |
| G | Leiter | Anzahl zusätzliche Leitende |
| H | Dynamik | Wert 1-5 |
| I | Bemerkungen | Textfeld (Was wurde gemacht?) |
| J | Version | App-Version (automatisch) |
| K | Mail gesendet| Status für automatische Benachrichtigung |

## 3. Optionale Tabs für Strike-System
Wenn du das Strike-System zur Qualitätssicherung nutzt, lege diese Tabs an:

### Tab `Strikes`
*   Spalten: `Zeitstempel`, `Datum`, `Leiter`, `Name`, `Strikes`, `Ausschluss`, `Version`

### Tab `Alarme`
*   Spalten: `Zeitstempel`, `Datum`, `Name`, `Strikes`, `Gründe`, `Leiter`

### Tab `Marketing` (Spesenabrechnung)
*   Spalten: `Zeitstempel`, `Belegdatum`, `Mitarbeiter`, `Kategorie`, `WB Nr.`, `Beschreibung`, `Betrag`, `Zahlungsart`, `Notiz`, `Beleg vorhanden`, `Abrechnungszeitraum`

## 4. Sicherheit & Zugriff (Token-System)
Damit Berichte sicher abgerufen werden können, braucht es diese Verzeichnis-Tabs:

### Tab `Admins`
Hinterlege hier die E-Mail-Adressen der Personen (z.B. Scharleitung), die Zugriff auf die Auswertungen haben dürfen.
*   Spalte A: `Email`

### Tab `Tokens`
Dient als technischer Zwischenspeicher für die Login-Codes.
*   Spalte A: `Email`, Spalte B: `Token`, Spalte C: `Expires`

## 5. Service Account berechtigen
Damit das Tool (Netlify) in dein Sheet schreiben darf:
1. Erstelle einen **Google Service Account** in der Google Cloud Console.
2. Kopiere die E-Mail-Adresse des Service Accounts (endet auf `.gserviceaccount.com`).
3. Klicke in deinem Google Sheet oben rechts auf **Teilen** und gib dieser E-Mail **Editor-Rechte**.

## 6. Sheet ID hinterlegen
Die ID findest du in der Web-Adresse deines Sheets:
`.../d/DEINE_SHEET_ID/edit`

Kopiere diesen Teil und trage ihn in Netlify oder deine `.env` als `GOOGLE_SHEET_ID` ein.

## 7. Google Drive für Belege (Optional)
Wenn du möchtest, dass Belegfotos automatisch in einem Google Drive Ordner gespeichert werden:
1. Erstelle einen Ordner in Google Drive.
2. Klicke auf den Ordnernamen > **Teilen** und gib dem Service Account (siehe Punkt 5) **Editor-Rechte**.
3. Kopiere die **Folder ID** aus der URL (der Teil nach `.../folders/`).
4. Trage die ID in Netlify oder deine `.env` als `GOOGLE_DRIVE_FOLDER_ID` ein.
5. In der Spesen-Tabelle wird dann automatisch der Link zum Foto in Google Drive hinterlegt.
