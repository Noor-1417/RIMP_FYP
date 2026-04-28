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
  try {
    let tpl = fs.readFileSync(tplPath, 'utf8');
    Object.keys(vars).forEach((k) => {
      tpl = tpl.replace(new RegExp(`{{${k}}}`, 'g'), vars[k]);
    });
    return tpl;
  } catch (err) {
    console.error(`Email template file not found: ${tplPath}`, err.message);
    throw new Error(`Failed to load email template '${name}': ${err.message}`);
  }
}

async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  
  // In development, if credentials are missing, just log to console
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('-----------------------------------------');
    console.log('📧 DEVELOPMENT MODE: Email not sent (no credentials)');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text: ${text}`);
    console.log('-----------------------------------------');
    return { messageId: 'dev-mode-mock-id' };
  }

  try {
    return await transporter.sendMail({ from, to, subject, html, text });
  } catch (err) {
    console.error('Nodemailer Error:', err.message);
    // Still log to console so developers can see the link
    console.log('-----------------------------------------');
    console.log('📧 EMAIL FAILED: Reset Link below');
    console.log(`To: ${to}`);
    if (text) console.log(`Text: ${text}`);
    console.log('-----------------------------------------');
    throw err; // Re-throw to be handled by controller
  }
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

async function sendPasswordResetEmail(to, name, resetUrl) {
  try {
    const html = renderTemplate('passwordReset', { name, resetUrl });
    await sendMail({
      to,
      subject: 'Password Reset Request - RIMP',
      html,
      text: `You requested a password reset. Please use this link: ${resetUrl}`,
    });
    return true;
  } catch (err) {
    console.error('Error sending password reset email:', err);
    return false;
  }
}

module.exports = {
  sendMail,
  renderTemplate,
  sendCertificateIssuedEmail,
  sendPasswordResetEmail,
};
