# Google Sheets Setup

Dieses Dokument erklärt, wie du das Google Sheet für das Jubla-Reporting Tool vorbereitest.

## 1. Tabelle erstellen
Erstelle eine neue Google Sheets Tabelle. Benenne das erste Blatt (Sheet) in `Reporting` um (oder wie in der `.env` definiert).

## 2. Spalten definieren
Die Anwendung erwartet folgende Spalten in der ersten Zeile:

| Index | Spaltenname | Beschreibung |
|-------|-------------|--------------|
| A | Zeitstempel | Datum/Zeit der Erfassung |
| B | Datum | Datum der Gruppenstunde |
| C | Melder | Name des Leiters |
| D | HL | Hauptleitung |
| E | Hilfsleitung | Hilfsleitung |
| F | Kinder | Anzahl Kinder |
| G | Leiter | Anzahl zusätzliche Leiter |
| H | Dynamik | Wert 1-5 |
| I | Bemerkungen | Textfeld |
| J | Version | App-Version |
| K | Mail gesendet| Status-Flag |

## 3. Optionale Tabs für Strike-System
Wenn du das Strike-System nutzt, solltest du folgende Tabs anlegen:

### Tab `Strikes`
Hier werden alle vergebenen Strikes geloggt.
*   Spalte A: `Zeitstempel`
*   Spalte B: `Datum`
*   Spalte C: `Leiter`
*   Spalte D: `Name`
*   Spalte E: `Strikes`
*   Spalte F: `Ausschluss`
*   Spalte G: `Version`

### Tab `Alarme`
Hier werden automatisch erkannte Muster (z.B. 3x Strikes in 30 Tagen) geloggt.
*   Spalte A: `Zeitstempel`
*   Spalte B: `Datum`
*   Spalte C: `Name`
*   Spalte D: `Strikes`
*   Spalte E: `Gründe`
*   Spalte F: `Leiter`

## 4. Neue Tabs für Sicherheit (Token-System)
Um Berichte sicher abrufen zu können, müssen folgende zusätzliche Tabs angelegt werden:

### Tab `Admins`
Hier werden die E-Mail-Adressen der berechtigten Personen hinterlegt.
*   Spalte A: `Email`

### Tab `Tokens`
Dient als temporärer Speicher für Verifizierungs-Codes.
*   Spalte A: `Email`
*   Spalte B: `Token`
*   Spalte C: `Expires`

## 5. Service Account berechtigen
Damit das Backend (Netlify) in die Tabelle schreiben kann:
1. Erstelle einen Google Service Account in der Google Cloud Console.
2. Kopiere die E-Mail-Adresse des Service Accounts.
3. Gib diese E-Mail-Adresse in deinem Google Sheet als "Mitarbeiter" frei (Editor-Rechte).

## 6. Sheet ID kopieren
Kopiere die ID aus der URL deines Sheets:
`https://docs.google.com/spreadsheets/d/DEINE_SHEET_ID/edit`
Trage diese ID in deine `.env` Datei als `GOOGLE_SHEET_ID` ein.
