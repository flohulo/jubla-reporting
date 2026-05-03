"use strict";

const nodemailer = require("nodemailer");

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER or SMTP_PASS missing in environment!");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/**
 * Sends an email.
 * @param {string} subject
 * @param {string} text
 * @param {string} [to] - Optional recipient. Defaults to SCHARLEITUNG_EMAIL.
 */
async function sendMail(subject, text, to) {
  const recipient = to || process.env.SCHARLEITUNG_EMAIL;
  if (!recipient) throw new Error("SCHARLEITUNG_EMAIL missing in environment and no recipient provided!");

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${process.env.APP_NAME || "Reporting Tool"}" <${process.env.SMTP_USER}>`,
    to: recipient,
    subject,
    text,
  });
}

module.exports = { sendMail };