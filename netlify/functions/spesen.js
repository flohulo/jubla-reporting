"use strict";

// Polyfills für jsPDF in Node.js Umgebung (Netlify Functions) - MÜSSEN VOR JSPDF GELADEN WERDEN
if (typeof global.window === "undefined") {
  global.window = {
    document: {
      createElementNS: () => ({ style: {} }),
      lastModified: new Date().toISOString()
    }
  };
}
if (typeof global.navigator === "undefined") global.navigator = {};
if (typeof global.btoa === "undefined") {
  global.btoa = (str) => Buffer.from(str || "", "utf-8").toString("base64");
}
if (typeof global.atob === "undefined") {
  global.atob = (str) => Buffer.from(str || "", "base64").toString("binary");
}

const { getAccessToken } = require("./lib/google-auth");
const { appendRow } = require("./lib/sheets-api");
const { uploadFile } = require("./lib/drive-api");
const { jsPDF } = require("jspdf");
const nodemailer = require("nodemailer");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");

/**
 * Formatiert den Zeitstempel für Spalte A: YYYY-MM-DD HH:mm:ss
 */
function formatTimestamp(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const ok = (data = {}) => ({ statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ ok: true, ...data }) });
const err = (msg, code = 500) => ({ statusCode: code, headers: CORS_HEADERS, body: JSON.stringify({ ok: false, error: msg }) });

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  if (event.httpMethod !== "POST") return err("Method not allowed", 405);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return err("Invalid JSON", 400);
  }

  try {
    const { action, pin, entries, metadata } = body;
    const sheetName = process.env.SHEET_NAME || "Reporting";
    const correctPin = process.env.SCHAR_PIN || "1234";
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 1. PIN prüfen (String-Vergleich)
    if (String(pin) !== String(correctPin)) {
      return err("Ungültiger PIN. Zugriff verweigert.", 403);
    }

    if (action === "saveExpenses") {
      const token = await getAccessToken();
      const timestamp = formatTimestamp();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      for (const [index, entry] of entries.entries()) {
        let pdfDriveLink = "KEIN PDF";
        
        // 1. PDF Generieren
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Spesenabrechnung - Jubla Wald", 20, 20);
        
        doc.setFontSize(11);
        doc.text(`Leiter/in: ${metadata.name || "Unbekannt"}`, 20, 35);
        doc.text(`Datum Erfassung: ${timestamp}`, 20, 42);
        
        const tableData = [
          ["Beleg-Datum", entry.datum],
          ["Betrag", `${entry.betrag.toFixed(2)} CHF`],
          ["Bereich/Kategorie", entry.kategorie],
          ["Beschreibung", entry.beschreibung],
          ["Zahlungsart", entry.zahlung],
          ["Notiz", entry.notiz || "-"]
        ];
        
        autoTable(doc, {
          startY: 50,
          head: [["Feld", "Wert"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [26, 26, 26] }
        });
        
        if (entry.bild) {
          try {
            const yPos = doc.lastAutoTable.finalY + 10;
            doc.text("Beleg-Foto:", 20, yPos);
            doc.addImage(entry.bild, "JPEG", 20, yPos + 5, 170, 0); 
          } catch (imgErr) {
            console.error("Bild-Fehler im PDF:", imgErr.message);
          }
        }
        
        const pdfBase64 = doc.output("datauristring").split(",")[1];
        const pdfBuffer = Buffer.from(pdfBase64, "base64");

        // 2. PDF auf Drive hochladen
        if (folderId) {
          try {
            const filename = `Spesen_${entry.datum}_${metadata.name || "unbekannt"}_${Date.now()}.pdf`.replace(/\s/g, "_");
            const driveFile = await uploadFile(token, folderId, filename, `data:application/pdf;base64,${pdfBase64}`);
            pdfDriveLink = driveFile.webViewLink || "JA (Link fehlt)";
            
            // 3. Email an Kassier senden
            const mailOptions = {
              from: `"Jubla Spesen Tool" <${process.env.SMTP_USER}>`,
              to: process.env.SCHARLEITUNG_EMAIL,
              subject: `Neue Spesenabrechnung: ${metadata.name} - ${entry.betrag.toFixed(2)} CHF`,
              text: `Hallo Kassier\n\n${metadata.name} hat eine neue Spesenabrechnung eingereicht.\n\nBetrag: ${entry.betrag.toFixed(2)} CHF\nBereich: ${entry.kategorie}\nBeschreibung: ${entry.beschreibung}\n\nDer Beleg wurde im Google Drive gespeichert:\n${pdfDriveLink}\n\nBeste Grüsse\nSpesen-Assistent`,
              attachments: [
                {
                  filename: filename,
                  content: pdfBuffer
                }
              ]
            };
            await transporter.sendMail(mailOptions);
            
          } catch (procErr) {
            console.error("PDF/Mail Fehler:", procErr.message);
            pdfDriveLink = "FEHLER BEI VERARBEITUNG";
          }
        }

        // 4. In Google Sheet eintragen
        const row = [
          timestamp,
          entry.datum,
          metadata.name || "",
          entry.kategorie,
          entry.beschreibung,
          entry.betrag.toString().replace(".", ","),
          entry.zahlung,
          entry.notiz,
          pdfDriveLink
        ];

        await appendRow(token, sheetName, row);
      }

      return ok({ count: entries.length });
    }

    if (action === "verify") {
      return ok({ message: "PIN korrekt" });
    }

    return err("Unbekannte Aktion: " + action, 400);
  } catch (globalErr) {
    console.error("Handler Crash:", globalErr);
    return err(globalErr.message);
  }
};
