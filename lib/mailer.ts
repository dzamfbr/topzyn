import "server-only";

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER ?? process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS ?? process.env.EMAIL_PASSWORD;
  const from = process.env.SMTP_FROM ?? (user ? `TopZyn <${user}>` : undefined);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!user || !pass || !from) {
    throw new Error(
      "SMTP belum lengkap. Isi SMTP_USER/SMTP_PASS (atau EMAIL_USER/EMAIL_PASSWORD) di file .env.",
    );
  }

  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    secure,
    user,
    pass,
    from,
  };
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const config = getSmtpConfig();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter;
}

export async function sendOtpEmail({
  toEmail,
  otpCode,
  ttlMinutes,
}: {
  toEmail: string;
  otpCode: string;
  ttlMinutes: number;
}) {
  const config = getSmtpConfig();
  const smtp = getTransporter();

  await smtp.sendMail({
    from: config.from,
    to: toEmail,
    subject: "Kode OTP TopZyn",
    text: [
      "Halo!",
      "",
      `Kode OTP kamu: ${otpCode}`,
      `Berlaku selama ${ttlMinutes} menit.`,
      "",
      "Kalau bukan kamu yang meminta, abaikan email ini.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2 style="margin: 0 0 12px;">Verifikasi TopZyn</h2>
        <p style="margin: 0 0 12px;">Kode OTP kamu:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #293275; margin: 8px 0 16px;">
          ${otpCode}
        </div>
        <p style="margin: 0 0 8px;">Berlaku selama ${ttlMinutes} menit.</p>
        <p style="margin: 0;">Kalau bukan kamu yang meminta, abaikan email ini.</p>
      </div>
    `,
  });
}
