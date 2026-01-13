import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  secure: boolean;
  from: string;
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const from = process.env.SMTP_FROM;

  if (!host || !portRaw || !from) return null;

  const port = Number(portRaw);
  if (!Number.isFinite(port)) return null;

  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return {
    host,
    port,
    secure,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
  };
}

export function isSmtpConfigured() {
  return Boolean(getSmtpConfig());
}

export async function sendResetPasswordEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const cfg = getSmtpConfig();
  if (!cfg) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.5">
      <h2 style="margin:0 0 8px">Reset Password Matchia</h2>
      <p>Halo ${escapeHtml(params.name)},</p>
      <p>Kami menerima permintaan reset password untuk akun kamu.</p>
      <p>
        <a href="${params.resetUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#FF4B3E;color:white;font-weight:700">
          Reset Password
        </a>
      </p>
      <p style="color:#555">Jika kamu tidak merasa meminta reset, abaikan email ini.</p>
    </div>
  `;

  await transporter.sendMail({
    from: cfg.from,
    to: params.to,
    subject: "Reset Password - Matchia",
    html,
  });
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
