const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable");
const { getAccessToken } = require("./lib/google-auth");
const { getAllRows } = require("./lib/sheets-api");
const nodemailer = require("nodemailer");
const { schedule } = require("@netlify/functions");

// Spalten-Mapping
const COL = {
    DATUM: 1,
    MELDER: 2,
    HL: 3,
    KINDER: 5,
    DYNAMIK: 7,
    BEMERKUNGEN: 8,
};

const STRIKE_COL = {
    DATUM: 1,
    NAME: 3,
    STRIKES: 4,
    AUSSCHLUSS: 5,
};

// Mapping für das Alarme-Register
const ALARM_COL = {
    DATUM: 1,
    NAME: 2,
    STRIKES: 3,
    GRUND: 4,
    LEITER: 5
};

/**
 * Netlify Function: mailexport
 */
const mailexport = async () => {
    console.log("Starting monthly Export task (mailexport)...");

    try {
        const token = await getAccessToken();
        const reportingSheet = process.env.SHEET_NAME || "Reporting";
        const orgName = process.env.ORG_NAME || "Jubla";
        const appName = process.env.APP_NAME || "Reporting Tool";
        const adminLabel = process.env.ORG_ADMIN_LABEL || "Scharleitung";

        const allReports = await getAllRows(token, reportingSheet);
        const allStrikes = await getAllRows(token, "Strikes").catch(() => []);
        const allAlarms = await getAllRows(token, "Alarme").catch(() => []); // Alarme abrufen

        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const monthName = firstDayLastMonth.toLocaleString("de-DE", { month: "long", year: "numeric" });

        // Filter für Berichte
        const monthlyReports = allReports.filter((row) => {
            const date = new Date(row[COL.DATUM]);
            return !isNaN(date) && date >= firstDayLastMonth && date <= lastDayLastMonth;
        });

        // Filter für Strikes
        const monthlyStrikes = allStrikes.filter((row) => {
            const date = new Date(row[STRIKE_COL.DATUM]);
            return !isNaN(date) && date >= firstDayLastMonth && date <= lastDayLastMonth;
        });

        // Filter für Alarme (Mustererkennungen)
        const monthlyAlarms = allAlarms.filter((row) => {
            const date = new Date(row[ALARM_COL.DATUM]);
            return !isNaN(date) && date >= firstDayLastMonth && date <= lastDayLastMonth;
        });

        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text(`${orgName} Export – ${monthName}`, 14, 22);
        doc.setFontSize(10);
        doc.text(`Erstellt am: ${now.toLocaleString("de-DE")}`, 14, 30);
        doc.text(`Automatisch erstellt durch das ${appName}.`, 14, 36);

        // --- Tabelle 1: Berichte ---
        doc.setFontSize(14);
        doc.text(`Berichte ${monthName}`, 14, 48);

        const reportData = monthlyReports.map((r) => [
            r[COL.DATUM] || "",
            r[COL.HL] || "",
            r[COL.KINDER] || "0",
            r[COL.DYNAMIK] || "1",
            r[COL.BEMERKUNGEN] || "",
        ]);

        autoTable.default(doc, {
            startY: 53,
            head: [["Datum", "Hauptleitung", "Kinder", "Dyn.", "Bemerkungen"]],
            body: reportData,
            theme: "grid",
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 35 },
                2: { cellWidth: 15 },
                3: { cellWidth: 15 },
                4: { cellWidth: "auto" },
            },
            styles: { overflow: "linebreak" }
        });

        // --- Tabelle 2: Strikes ---
        let currentY = doc.lastAutoTable.finalY || 53;
        doc.setFontSize(14);
        doc.text(`Strikes im ${monthName}`, 14, currentY + 15);

        const strikeData = monthlyStrikes.map((s) => [
            s[STRIKE_COL.DATUM] || "",
            s[STRIKE_COL.NAME] || "",
            s[STRIKE_COL.STRIKES] || "0",
            s[STRIKE_COL.AUSSCHLUSS] || "NEIN",
        ]);

        autoTable.default(doc, {
            startY: currentY + 20,
            head: [["Datum", "Name (Kind)", "Strikes", "Ausschluss"]],
            body: strikeData,
            theme: "striped",
            headStyles: { fillColor: [192, 57, 43] },
            columnStyles: { 0: { cellWidth: 30 } },
        });

        // --- Tabelle 3: Alarme (Mustererkennungen) ---
        currentY = doc.lastAutoTable.finalY || currentY + 20;

        // Check if there's enough space, otherwise add new page
        if (currentY > 240 && monthlyAlarms.length > 0) {
            doc.addPage();
            currentY = 20;
        }

        doc.setFontSize(14);
        doc.text(`Erkannte Verhaltensmuster (Alarme) ${monthName}`, 14, currentY + 15);

        const alarmData = monthlyAlarms.map((a) => [
            a[ALARM_COL.DATUM] || "",
            a[ALARM_COL.NAME] || "",
            a[ALARM_COL.STRIKES] || "0",
            a[ALARM_COL.GRUND] || "",
        ]);

        autoTable.default(doc, {
            startY: currentY + 20,
            head: [["Datum", "Name", "S.", "Erkanntes Muster / Grund"]],
            body: alarmData,
            theme: "grid",
            headStyles: { fillColor: [230, 126, 34] }, // Orange für Alarme
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 35 },
                2: { cellWidth: 10 },
                3: { cellWidth: "auto" }
            },
            styles: { fontSize: 9 }
        });

        const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"${appName}" <${process.env.SMTP_USER}>`,
            to: process.env.SCHARLEITUNG_EMAIL || process.env.SMTP_USER,
            subject: `${orgName} Export – ${monthName}`,
            text: `Hoi ${adminLabel},\n\nanbei findest du den Export für ${monthName} inkl. der erkannten Verhaltensmuster.\n\nLiebe Grüsse,\nDein ${appName}`,
            attachments: [
                {
                    filename: `Export_${monthName.replace(/\s/g, "_")}.pdf`,
                    content: pdfBuffer,
                },
            ],
        });

        return { statusCode: 200, body: "Export gesendet" };
    } catch (error) {
        console.error("Export failed:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};

exports.handler = schedule("0 0 1 * *", mailexport);