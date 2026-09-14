import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { EvolutionService } from "@/server/services/evolution.service";
import QRCode from "qrcode";
import { z } from "zod";

const createInstanceSchema = z.object({
  name: z.string().min(2, "Nome da conexão é obrigatório"),
  apiUrl: z.string().optional(),
  apiKey: z.string().optional(),
});

export async function GET() {
  try {
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

    const instances = await db.whatsappInstance.findMany({
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
    });

    return NextResponse.json({ instances, whatsappLocked });
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

      const instanceName = `pajo_${orgId.slice(-6)}_${Date.now().toString(36)}`;
      const instance = await EvolutionService.createInstance({
        organizationId: orgId,
        name: parsed.data.name,
        instanceName,
        apiUrl: parsed.data.apiUrl,
        apiKey: parsed.data.apiKey,
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
