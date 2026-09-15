import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import { sendEmail, SmtpConfig } from "@/lib/email";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const smtp = await db.organizationSmtpConfig.findUnique({ where: { organizationId: orgId } });
    const globalSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    return NextResponse.json({
      smtp: smtp
        ? {
            host: smtp.host,
            port: smtp.port,
            user: smtp.user,
            passMasked: smtp.pass ? "••••••••••••" : "",
            fromEmail: smtp.fromEmail,
            fromName: smtp.fromName,
            secure: smtp.secure,
            ativo: smtp.ativo,
            isCustom: true,
          }
        : {
            host: process.env.SMTP_HOST || "",
            port: Number(process.env.SMTP_PORT || 587),
            user: process.env.SMTP_USER || "",
            passMasked: process.env.SMTP_PASS ? "••••••••••••" : "",
            fromEmail: process.env.SMTP_FROM || "",
            fromName: process.env.SMTP_FROM_NAME || "Pajotree",
            secure: process.env.SMTP_SECURE === "true",
            ativo: globalSmtpConfigured,
            isCustom: false,
          },
    });
  } catch (error) {
    console.error("Erro ao obter configurações de integração:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSchema();
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const { action, type } = body;

    // 1. Teste de Envio SMTP
    if (action === "test_smtp") {
      const { host, port, user, pass, fromEmail, fromName, secure, testEmail } = body;
      const targetEmail = testEmail || auth.user.email;

      const existingSmtp = await db.organizationSmtpConfig.findUnique({ where: { organizationId: orgId } });
      const effectivePass = pass || existingSmtp?.pass || process.env.SMTP_PASS || "";

      if (!host || !user || !effectivePass) {
        return NextResponse.json(
          { error: "Host, Usuário e Senha do SMTP são obrigatórios para realizar o teste." },
          { status: 400 }
        );
      }

      const testConfig: SmtpConfig = {
        host,
        port: Number(port || 587),
        user,
        pass: effectivePass,
        fromEmail: fromEmail || user,
        fromName: fromName || "Teste Pajotree",
        secure: Boolean(secure),
        ativo: true,
      };

      try {
        const result = await sendEmail({
          to: targetEmail,
          subject: "✅ Teste de Configuração SMTP - Pajotree",
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-top: 0;">Conexão SMTP Bem-Sucedida!</h2>
              <p>Este é um e-mail de teste enviado para confirmar que suas configurações de servidor SMTP estão funcionando corretamente.</p>
              <p><strong>Host:</strong> ${host}:${port}</p>
              <p><strong>Remetente:</strong> ${fromName} &lt;${fromEmail || user}&gt;</p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 16px 0;">
              <p style="font-size: 12px; color: #64748b;">Enviado por Pajotree em ${new Date().toLocaleString("pt-BR")}</p>
            </div>
          `,
          configOverride: testConfig,
        });

        return NextResponse.json({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${targetEmail}!`,
          result,
        });
      } catch (smtpErr: any) {
        return NextResponse.json(
          { error: `Falha ao conectar no servidor SMTP: ${smtpErr.message || "Erro de autenticação ou porta"}` },
          { status: 400 }
        );
      }
    }

    // 2. Salvar SMTP
    if (type === "smtp") {
      const { host, port, user, pass, fromEmail, fromName, secure, ativo } = body;

      const updated = await db.organizationSmtpConfig.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          host,
          port: Number(port || 587),
          user,
          pass: pass || "",
          fromEmail: fromEmail || user,
          fromName: fromName || null,
          secure: Boolean(secure),
          ativo: ativo ?? true,
        },
        update: {
          host,
          port: Number(port || 587),
          user,
          ...(pass ? { pass } : {}),
          fromEmail: fromEmail || user,
          fromName: fromName || null,
          secure: Boolean(secure),
          ativo: ativo ?? true,
        },
      });

      await AuditService.log({
        organizationId: orgId,
        userId: auth.user.id,
        action: "UPDATE_SMTP_CONFIG",
        entity: "OrganizationSmtpConfig",
        entityId: updated.id,
        metadata: { host, port, fromEmail },
      });

      return NextResponse.json({
        success: true,
        message: "Configurações do Servidor SMTP salvas com sucesso!",
      });
    }

    return NextResponse.json({ error: "Tipo de integração inválido." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro ao salvar integrações:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao salvar configurações de integração." },
      { status: 500 }
    );
  }
}
