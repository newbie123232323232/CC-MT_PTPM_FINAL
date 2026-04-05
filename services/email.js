const nodemailer = require('nodemailer');

function getTransport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return null;
  }
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

async function sendPasswordResetEmail({ to, resetLink }) {
  const transport = getTransport();
  if (!transport) {
    throw new Error('SMTP not configured (SMTP_USER / SMTP_PASS)');
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from: `"Netflix clone" <${from}>`,
    to,
    subject: 'Đặt lại mật khẩu',
    text: `Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu. Mở link sau (có hiệu lực 1 giờ):\n\n${resetLink}\n\nNếu không phải bạn, bỏ qua email này.`,
    html: `<p>Đặt lại mật khẩu:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Link hết hạn sau 1 giờ.</p>`,
  });
}

module.exports = {
  sendPasswordResetEmail,
  getTransport,
};
