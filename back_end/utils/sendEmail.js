// utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * Envoie un email via Nodemailer
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,   // ex: smtp.gmail.com
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: false,                   // true pour port 465
    auth: {
      user: process.env.SMTP_USER,   // votre email
      pass: process.env.SMTP_PASS,   // mot de passe app (Gmail) ou clé API
    },
  });

  await transporter.sendMail({
    from:    `"PoulIA" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`[Email] ✅ Envoyé à ${to}`);
};

module.exports = sendEmail;