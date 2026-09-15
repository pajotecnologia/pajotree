import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { EvolutionService } from "@/server/services/evolution.service";
import QRCode from "qrcode";
import { z } from "zod";

const createInstanceSchema = z.object({
  name: z.string().min(2, "Nome da conexão é obrigatório"),
  instanceName: z.string().optional(),
  apiUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

export async function GET() {
  try {
    await ensureDatabaseSchema();
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    // Verificar se o plano permite WhatsApp
    let whatsappLocked = false;
    try {
      await PlanLimitService.assertFeatureEnabled(orgId, "whatsapp_inbox");
    } catch {
      whatsappLocked = true;
    }

    const [instances, orgEvolutionConfig] = await Promise.all([
      db.whatsappInstance.findMany({
        where: { organizationId: orgId },
        include: {
          conversations: {
            include: {
              contact: true,
              messages: {
                orderBy: { createdAt: "desc" },
                take: 20,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.organizationEvolutionConfig.findUnique({
        where: { organizationId: orgId },
        select: { apiUrl: true, instanceName: true, ativo: true },
      }),
    ]);

    const effectiveConfig = await EvolutionService.getEffectiveEvolutionConfig(orgId);

    return NextResponse.json({
      instances,
      whatsappLocked,
      evolutionConfig: {
        apiUrl: effectiveConfig.apiUrl,
        instanceName: effectiveConfig.instanceName || orgEvolutionConfig?.instanceName || null,
        isCustom: Boolean(orgEvolutionConfig?.apiUrl && orgEvolutionConfig?.ativo),
      },
    });
  } catch (error: any) {
    console.error("Erro ao carregar instâncias WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
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
    const { action } = body;

    // Ação: Criar Instância
    if (action === "create_instance") {
      // 1. Validar limites do plano
      await PlanLimitService.assertCanCreate(orgId, "whatsapp_instance");

      const parsed = createInstanceSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Dados inválidos" },
          { status: 400 }
        );
      }

      const effectiveConfig = await EvolutionService.getEffectiveEvolutionConfig(orgId);
      if (!effectiveConfig.isConfigured || !effectiveConfig.apiUrl) {
        return NextResponse.json(
          {
            error:
              "Evolution API não configurada. Acesse o menu Configurações > Evolution API para salvar a URL e Chave do seu servidor Evolution antes de conectar o WhatsApp.",
          },
          { status: 400 }
        );
      }

      const rawInstanceName = parsed.data.instanceName?.trim() || effectiveConfig.instanceName?.trim() || "";
      const instanceName = rawInstanceName
        ? rawInstanceName.replace(/[^a-zA-Z0-9_-]/g, "_")
        : `pajo_${orgId.slice(-6)}_${Date.now().toString(36)}`;

      const instance = await EvolutionService.createInstance({
        organizationId: orgId,
        name: parsed.data.name,
        instanceName,
        apiUrl: effectiveConfig.apiUrl,
        apiKey: effectiveConfig.apiKey,
      });

      // Gerar QR Code de pareamento
      const qrData = await EvolutionService.getQrCode(instanceName, orgId);
      let qrDataUrl = qrData.qrCodeData;
      if (!qrDataUrl.startsWith("data:image/")) {
        qrDataUrl = await QRCode.toDataURL(qrData.qrCodeData, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });
      }

      return NextResponse.json({
        success: true,
        instance,
        pairingCode: qrData.pairingCode,
        qrCodeUrl: qrDataUrl,
      });
    }

    // Ação: Atualizar Conexão
    if (action === "update_instance") {
      const { instanceId, name, instanceName, apiUrl, apiKey } = body;
      if (!instanceId) {
        return NextResponse.json({ error: "ID da conexão obrigatório" }, { status: 400 });
      }

      const updated = await EvolutionService.updateInstance({
        instanceId,
        organizationId: orgId,
        name,
        instanceName,
        apiUrl,
        apiKey,
      });

      return NextResponse.json({ success: true, instance: updated });
    }

    // Ação: Excluir / Desconectar Conexão
    if (action === "delete_instance") {
      const { instanceId } = body;
      if (!instanceId) {
        return NextResponse.json({ error: "ID da conexão obrigatório" }, { status: 400 });
      }

      await EvolutionService.deleteInstance(instanceId, orgId);
      return NextResponse.json({ success: true, message: "Conexão WhatsApp removida com sucesso!" });
    }

    // Ação: Obter / Atualizar QR Code
    if (action === "refresh_qr") {
      const { instanceName, instanceId } = body;
      let targetInstanceName = instanceName;

      if (!targetInstanceName && instanceId) {
        const inst = await db.whatsappInstance.findFirst({
          where: { id: instanceId, organizationId: orgId },
        });
        targetInstanceName = inst?.instanceName;
      }

      if (!targetInstanceName) {
        return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
      }

      const qrData = await EvolutionService.getQrCode(targetInstanceName, orgId);
      let qrDataUrl = qrData.qrCodeData;
      if (!qrDataUrl.startsWith("data:image/")) {
        qrDataUrl = await QRCode.toDataURL(qrData.qrCodeData, {
          width: 300,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
      }

      return NextResponse.json({
        success: true,
        pairingCode: qrData.pairingCode,
        qrCodeUrl: qrDataUrl,
      });
    }

    // Ação: Enviar Mensagem
    if (action === "send_message") {
      const { instanceId, remoteJid, text } = body;
      if (!instanceId || !remoteJid || !text) {
        return NextResponse.json({ error: "Parâmetros incompletos" }, { status: 400 });
      }

      const message = await EvolutionService.sendMessage({
        instanceId,
        remoteJid,
        text,
      });

      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (error: any) {
    console.error("Erro no WhatsApp endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar requisição" },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const { instanceId, name, instanceName, apiUrl, apiKey } = body;

    if (!instanceId) {
      return NextResponse.json({ error: "ID da conexão obrigatório" }, { status: 400 });
    }

    const updated = await EvolutionService.updateInstance({
      instanceId,
      organizationId: orgId,
      name,
      instanceName,
      apiUrl,
      apiKey,
    });

    return NextResponse.json({ success: true, instance: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar instância WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get("instanceId") || searchParams.get("id");

    if (!instanceId) {
      return NextResponse.json({ error: "ID da conexão obrigatório" }, { status: 400 });
    }

    await EvolutionService.deleteInstance(instanceId, orgId);
    return NextResponse.json({ success: true, message: "Conexão WhatsApp removida com sucesso!" });
  } catch (error: any) {
    console.error("Erro ao excluir instância WhatsApp:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir" }, { status: 400 });
  }
}
