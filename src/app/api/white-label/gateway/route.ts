import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BancoInterConfig,
  getInterOAuthToken,
  registrarWebhookInter,
  clearInterTokenCache,
} from "@/lib/banco-inter";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const gateway = await db.organizationPaymentGateway.findUnique({
      where: { organizationId: auth.organization.id },
    });

    const isConfigured = Boolean(
      gateway &&
      gateway.clientId &&
      gateway.clientSecret &&
      gateway.certCrt &&
      gateway.certKey
    );

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      gateway: gateway
        ? {
            provider: gateway.provider,
            ambiente: gateway.ambiente,
            ativo: gateway.ativo,
            clientIdMasked: gateway.clientId
              ? `${gateway.clientId.substring(0, 6)}...${gateway.clientId.slice(-4)}`
              : "",
            chavePix: gateway.chavePix || "",
            contaCorrente: gateway.contaCorrente || "",
            hasCertCrt: Boolean(gateway.certCrt),
            hasCertKey: Boolean(gateway.certKey),
            webhookUrl: gateway.webhookUrl || "",
            updatedAt: gateway.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao obter gateway White Label:", error);
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
    const { action, clientId, clientSecret, certCrt, certKey, chavePix, contaCorrente, ambiente, ativo, webhookUrl } = body;

    const currentGateway = await db.organizationPaymentGateway.findUnique({
      where: { organizationId: orgId },
    });

    const effectiveClientId = clientId || currentGateway?.clientId || "";
    const effectiveClientSecret = clientSecret || currentGateway?.clientSecret || "";
    const effectiveCertCrt = certCrt || currentGateway?.certCrt || "";
    const effectiveCertKey = certKey || currentGateway?.certKey || "";
    const effectiveAmbiente = (ambiente as "PRODUCAO" | "SANDBOX") || currentGateway?.ambiente || "PRODUCAO";

    const testConfig: BancoInterConfig = {
      clientId: effectiveClientId,
      clientSecret: effectiveClientSecret,
      certCrt: effectiveCertCrt,
      certKey: effectiveCertKey,
      ambiente: effectiveAmbiente,
    };

    if (action === "test_connection") {
      if (!effectiveClientId || !effectiveClientSecret || !effectiveCertCrt || !effectiveCertKey) {
        return NextResponse.json(
          { error: "Informe Client ID, Client Secret e os Certificados (.crt e .key) para testar." },
          { status: 400 }
        );
      }
      clearInterTokenCache(`wl_${orgId}`);
      const token = await getInterOAuthToken(testConfig, `wl_${orgId}`);
      return NextResponse.json({
        success: true,
        message: "Conexão mTLS e autenticação OAuth 2.0 estabelecidas com sucesso no Banco Inter!",
        tokenMasked: `${token.substring(0, 8)}...`,
      });
    }

    if (action === "register_webhook") {
      if (!webhookUrl) {
        return NextResponse.json({ error: "URL do Webhook é obrigatória." }, { status: 400 });
      }
      clearInterTokenCache(`wl_${orgId}`);
      const res = await registrarWebhookInter(webhookUrl, testConfig);

      if (currentGateway) {
        await db.organizationPaymentGateway.update({
          where: { organizationId: orgId },
          data: { webhookUrl },
        });
      }

      return NextResponse.json(res);
    }

    // Salvar/Atualizar credenciais do gateway
    const updated = await db.organizationPaymentGateway.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        provider: "BANCO_INTER",
        clientId: effectiveClientId,
        clientSecret: effectiveClientSecret,
        certCrt: effectiveCertCrt,
        certKey: effectiveCertKey,
        chavePix: chavePix || null,
        contaCorrente: contaCorrente || null,
        ambiente: effectiveAmbiente,
        ativo: ativo ?? true,
        webhookUrl: webhookUrl || null,
      },
      update: {
        ...(clientId ? { clientId } : {}),
        ...(clientSecret ? { clientSecret } : {}),
        ...(certCrt ? { certCrt } : {}),
        ...(certKey ? { certKey } : {}),
        ...(chavePix !== undefined ? { chavePix } : {}),
        ...(contaCorrente !== undefined ? { contaCorrente } : {}),
        ...(ambiente ? { ambiente } : {}),
        ...(ativo !== undefined ? { ativo } : {}),
        ...(webhookUrl ? { webhookUrl } : {}),
      },
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "UPDATE_PAYMENT_GATEWAY",
      entity: "OrganizationPaymentGateway",
      entityId: updated.id,
      metadata: {
        provider: "BANCO_INTER",
        ambiente: effectiveAmbiente,
        ativo: updated.ativo,
      },
    });

    clearInterTokenCache(`wl_${orgId}`);

    return NextResponse.json({
      success: true,
      message: "Configurações do Banco Inter salvas com sucesso!",
    });
  } catch (error: any) {
    console.error("Erro ao salvar gateway White Label:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao configurar gateway de pagamento." },
      { status: 400 }
    );
  }
}
