let { Resend } = require('resend');
let { resendApiKey } = require('../config/env');

let resend = new Resend(resendApiKey);

async function sendResetCode(to, code) {
  await resend.emails.send({
    from: 'House of Love <noreply@mail.consoulstudios.com>',
    to,
    subject: 'Your reset code',
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color: #2E2838;">Reset your password</h2>
        <p style="color: #6F6883;">Use this code to reset your password. It expires in 15 minutes.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #8B7BA8;">${code}</p>
        <p style="color: #9A92AC; font-size: 13px;">If you didn't ask for this, you can ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendResetCode };