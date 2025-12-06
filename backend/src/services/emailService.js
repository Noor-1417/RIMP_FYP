const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function renderTemplate(name, vars = {}) {
  const tplPath = path.join(__dirname, '..', 'templates', `${name}.html`);
  let tpl = fs.readFileSync(tplPath, 'utf8');
  Object.keys(vars).forEach((k) => {
    tpl = tpl.replace(new RegExp(`{{${k}}}`, 'g'), vars[k]);
  });
  return tpl;
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return transporter.sendMail({ from, to, subject, html, text });
}

async function sendCertificateIssuedEmail(to, cert, internName, verificationUrl) {
  try {
    const html = renderTemplate('certificateIssued', {
      name: internName,
      certificateNumber: cert.certificateNumber,
      verificationUrl,
      category: cert.category || '',
    });
    await sendMail({ to, subject: 'Your RIMP Certificate', html });
    return true;
  } catch (err) {
    console.error('Error sending certificate email:', err);
    return false;
  }
}

module.exports = {
  sendMail,
  renderTemplate,
  sendCertificateIssuedEmail,
};
