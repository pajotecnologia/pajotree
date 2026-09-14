import nodemailer from "nodemailer";
import { db } from "@/lib/db";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  ativo: boolean;
}

/**
 * Obtém as configurações SMTP (Tenant, White Label Pai ou Global)
 */
export async function getOrganizationSmtpConfig(organizationId?: string): Promise<{
  config: SmtpConfig;
  source: "ORGANIZATION" | "WHITE_LABEL_PARENT" | "GLOBAL";
}> {
  if (organizationId) {
    try {
      const org = await db.organization.findUnique({
        where: { id: organizationId },
        include: {
          smtpConfig: true,
          whiteLabelParent: {
            include: { smtpConfig: true },
          },
        },
      });

      // 1. Próprio SMTP da Organização
      if (org?.smtpConfig && org.smtpConfig.ativo && org.smtpConfig.host && org.smtpConfig.user) {
        return {
          config: {
            host: org.smtpConfig.host,
            port: org.smtpConfig.port || 587,
            user: org.smtpConfig.user,
            pass: org.smtpConfig.pass,
            fromEmail: org.smtpConfig.fromEmail || org.smtpConfig.user,
            fromName: org.smtpConfig.fromName || org.tradeName || org.name || "Pajotree",
            secure: Boolean(org.smtpConfig.secure),
            ativo: true,
          },
          source: "ORGANIZATION",
        };
      }

      // 2. SMTP do Parceiro White Label Pai
      if (
        org?.whiteLabelParent?.smtpConfig &&
        org.whiteLabelParent.smtpConfig.ativo &&
        org.whiteLabelParent.smtpConfig.host
      ) {
        const parentSmtp = org.whiteLabelParent.smtpConfig;
        return {
          config: {
            host: parentSmtp.host,
            port: parentSmtp.port || 587,
            user: parentSmtp.user,
            pass: parentSmtp.pass,
            fromEmail: parentSmtp.fromEmail || parentSmtp.user,
            fromName: parentSmtp.fromName || org.whiteLabelParent.tradeName || org.whiteLabelParent.name,
            secure: Boolean(parentSmtp.secure),
            ativo: true,
          },
          source: "WHITE_LABEL_PARENT",
        };
      }
    } catch (e) {
      console.error("Erro ao obter SMTP da organização:", e);
    }
  }

  // 3. Fallback Global (.env)
  const envHost = process.env.SMTP_HOST || "";
  const envPort = Number(process.env.SMTP_PORT || 587);
  const envUser = process.env.SMTP_USER || "";
  const envPass = process.env.SMTP_PASS || "";
  const envFromEmail = process.env.SMTP_FROM || envUser || "no-reply@pajotree.com";
  const envFromName = process.env.SMTP_FROM_NAME || "Pajotree";
  const envSecure = process.env.SMTP_SECURE === "true" || envPort === 465;

  return {
    config: {
      host: envHost,
      port: envPort,
      user: envUser,
      pass: envPass,
      fromEmail: envFromEmail,
      fromName: envFromName,
      secure: envSecure,
      ativo: Boolean(envHost && envUser && envPass),
    },
    source: "GLOBAL",
  };
}

/**
 * Cria o transporter Nodemailer
 */
export function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert issues
    },
  });
}

/**
 * Envia um e-mail genérico
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  organizationId,
  configOverride,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  organizationId?: string;
  configOverride?: SmtpConfig;
}) {
  const { config } = configOverride
    ? { config: configOverride }
    : await getOrganizationSmtpConfig(organizationId);

  if (!config.host || !config.user || !config.pass) {
    console.warn("⚠️ Servidor SMTP não configurado. Simulação de envio:", { to, subject });
    return {
      success: true,
      simulated: true,
      message: "Servidor SMTP não configurado. E-mail simulado com sucesso.",
    };
  }

  const transporter = createTransporter(config);

  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]+>/g, ""),
    html,
  });

  return {
    success: true,
    messageId: info.messageId,
    simulated: false,
  };
}

/**
 * Envia o e-mail oficial de Recuperação de Senha com template premium
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
  brandName = "Pajotree",
  logoUrl,
  organizationId,
}: {
  to: string;
  name: string;
  resetUrl: string;
  brandName?: string;
  logoUrl?: string | null;
  organizationId?: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperação de Senha - ${brandName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; line-height: 1.6; }
    .container { max-width: 580px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
    .content { padding: 40px 36px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; margin: 24px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); text-align: center; }
    .footer { padding: 24px 36px; background-color: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .card-url { background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 48px; max-width: 160px; margin-bottom: 12px; object-contain: contain;">` : ""}
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">${brandName}</h1>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 13px;">Redefinição de Senha de Acesso</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; font-weight: 600; margin-top: 0;">Olá, ${name || "Usuário"}!</p>
      <p style="color: #475569; font-size: 14px;">Recebemos uma solicitação para redefinir a senha da sua conta em <strong>${brandName}</strong>. Clique no botão abaixo para cadastrar uma nova senha segura:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn" target="_blank">Redefinir Minha Senha</a>
      </div>

      <p style="color: #64748b; font-size: 13px;">Este link é seguro e expira em <strong>1 hora</strong>. Se você não solicitou a redefinição de senha, nenhuma ação é necessária e sua senha atual continuará segura.</p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
      <p style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
      <div class="card-url">${resetUrl}</div>
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} ${brandName}. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to,
    subject: `🔐 Recuperação de Senha - ${brandName}`,
    html,
    organizationId,
  });
}
