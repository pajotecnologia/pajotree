import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail, SmtpConfig } from "@/lib/email";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [smtp, evolution] = await Promise.all([
      db.organizationSmtpConfig.findUnique({ where: { organizationId: orgId } }),
      db.organizationEvolutionConfig.findUnique({ where: { organizationId: orgId } }),
    ]);

    const globalSmtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    const globalEvolutionConfigured = Boolean(process.env.DEFAULT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL);

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
      evolution: evolution
        ? {
            apiUrl: evolution.apiUrl,
            apiKeyMasked: evolution.apiKey ? `${evolution.apiKey.substring(0, 4)}...${evolution.apiKey.slice(-4)}` : "",
            ativo: evolution.ativo,
            isCustom: true,
          }
        : {
            apiUrl: process.env.DEFAULT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || "http://localhost:8080",
            apiKeyMasked: (process.env.DEFAULT_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY) ? "••••••••••••" : "",
            ativo: globalEvolutionConfigured,
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

    // 2. Teste de Conexão Evolution API
    if (action === "test_evolution") {
      const { apiUrl, apiKey } = body;
      const existingEv = await db.organizationEvolutionConfig.findUnique({ where: { organizationId: orgId } });
      const effectiveApiKey = apiKey || existingEv?.apiKey || process.env.DEFAULT_EVOLUTION_API_KEY || "";
      const effectiveApiUrl = (apiUrl || existingEv?.apiUrl || process.env.DEFAULT_EVOLUTION_API_URL || "http://localhost:8080").replace(/\/+$/, "");

      if (!effectiveApiUrl) {
        return NextResponse.json({ error: "URL da Evolution API é obrigatória." }, { status: 400 });
      }

      try {
        const headers: Record<string, string> = {};
        if (effectiveApiKey) {
          headers["apikey"] = effectiveApiKey;
          headers["Authorization"] = `Bearer ${effectiveApiKey}`;
        }

        const res = await fetch(`${effectiveApiUrl}/instance/fetchInstances`, {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const instances = await res.json();
          return NextResponse.json({
            success: true,
            message: `Evolution API conectada com sucesso! (${Array.isArray(instances) ? instances.length : 0} instâncias ativas no servidor)`,
          });
        } else {
          return NextResponse.json(
            { error: `Evolution API retornou status HTTP ${res.status}. Verifique a Chave de API Global.` },
            { status: 400 }
          );
        }
      } catch (evErr: any) {
        return NextResponse.json(
          { error: `Não foi possível alcançar a Evolution API em ${effectiveApiUrl}: ${evErr.message}` },
          { status: 400 }
        );
      }
    }

    // 3. Salvar SMTP
    if (type === "smtp") {
      const { host, port, user, pass, fromEmail, fromName, secure, ativo } = body;
      const existingSmtp = await db.organizationSmtpConfig.findUnique({ where: { organizationId: orgId } });

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

    // 4. Salvar Evolution API
    if (type === "evolution") {
      const { apiUrl, apiKey, ativo } = body;
      const cleanUrl = (apiUrl || "http://localhost:8080").replace(/\/+$/, "");

      const updated = await db.organizationEvolutionConfig.upsert({
        where: { organizationId: orgId },
        create: {
          organizationId: orgId,
          apiUrl: cleanUrl,
          apiKey: apiKey || "",
          ativo: ativo ?? true,
        },
        update: {
          apiUrl: cleanUrl,
          ...(apiKey ? { apiKey } : {}),
          ativo: ativo ?? true,
        },
      });

      await AuditService.log({
        organizationId: orgId,
        userId: auth.user.id,
        action: "UPDATE_EVOLUTION_CONFIG",
        entity: "OrganizationEvolutionConfig",
        entityId: updated.id,
        metadata: { apiUrl: cleanUrl },
      });

      return NextResponse.json({
        success: true,
        message: "Configurações da Evolution API salvas com sucesso!",
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
