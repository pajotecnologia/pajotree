import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Extrair dados do evento da Evolution API
    const event = payload.event || payload.type;
    const instanceName = payload.instance;
    const data = payload.data || {};

    if (!instanceName) {
      return NextResponse.json({ error: "Instância não identificada" }, { status: 400 });
    }

    const instance = await db.whatsappInstance.findUnique({
      where: { instanceName },
      include: { organization: true },
    });

    if (!instance) {
      return NextResponse.json({ error: "Instância não encontrada" }, { status: 404 });
    }

    const orgId = instance.organizationId;

    // 1. Evento de Conexão / Status
    if (event === "connection.update") {
      const state = data.state; // 'open', 'close', 'connecting'
      let status: "CONNECTED" | "DISCONNECTED" | "CONNECTING" = "CONNECTING";
      if (state === "open") status = "CONNECTED";
      else if (state === "close") status = "DISCONNECTED";

      await db.whatsappInstance.update({
        where: { id: instance.id },
        data: {
          status,
          phone: data.wuid ? data.wuid.split("@")[0] : instance.phone,
        },
      });

      return NextResponse.json({ received: true });
    }

    // 2. Evento de Mensagem Recebida (messages.upsert)
    if (event === "messages.upsert") {
      const msg = data.message || data;
      const key = data.key || msg.key || {};
      const externalId = key.id;

      if (!externalId) {
        return NextResponse.json({ received: true });
      }

      // IDEMPOTÊNCIA: Verificar se já processamos esta mensagem anteriormente
      const existingMessage = await db.whatsappMessage.findUnique({
        where: { externalId },
      });

      if (existingMessage) {
        // Ignora duplicata silenciosamente
        return NextResponse.json({ received: true, duplicate: true });
      }

      const fromMe = key.fromMe;
      const remoteJid = key.remoteJid;
      if (!remoteJid || remoteJid.includes("@g.us")) {
        // Ignorar mensagens de grupos por padrão
        return NextResponse.json({ received: true, ignored: "group_message" });
      }

      const textContent =
        msg.conversation ||
        msg.extendedTextMessage?.text ||
        msg.imageMessage?.caption ||
        "Mensagem de mídia";

      // 1. Criar ou Atualizar Contato
      let contact = await db.whatsappContact.findFirst({
        where: { organizationId: orgId, remoteJid },
      });

      const pushName = data.pushName || remoteJid.split("@")[0];

      if (!contact) {
        contact = await db.whatsappContact.create({
          data: {
            organizationId: orgId,
            remoteJid,
            name: pushName,
          },
        });

        // Criar Lead automaticamente a partir do WhatsApp
        const cleanPhone = remoteJid.split("@")[0];
        await db.lead.create({
          data: {
            organizationId: orgId,
            name: pushName,
            phone: cleanPhone,
            whatsapp: cleanPhone,
            source: "whatsapp_inbox",
            status: "NEW",
          },
        });
      }

      // 2. Criar ou Atualizar Conversa
      let conversation = await db.whatsappConversation.findFirst({
        where: { instanceId: instance.id, contactId: contact.id },
      });

      if (!conversation) {
        conversation = await db.whatsappConversation.create({
          data: {
            instanceId: instance.id,
            contactId: contact.id,
            status: "OPEN",
            unread: 1,
          },
        });
      } else if (!fromMe) {
        await db.whatsappConversation.update({
          where: { id: conversation.id },
          data: { unread: conversation.unread + 1, updatedAt: new Date() },
        });
      }

      // 3. Salvar Mensagem com externalId para idempotência
      await db.whatsappMessage.create({
        data: {
          conversationId: conversation.id,
          direction: fromMe ? "outgoing" : "incoming",
          messageType: "text",
          content: textContent,
          status: "DELIVERED",
          externalId,
        },
      });

      return NextResponse.json({ received: true, processed: true });
    }

    return NextResponse.json({ received: true, unhandled: true });
  } catch (error: any) {
    console.error("Erro no webhook do WhatsApp:", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
