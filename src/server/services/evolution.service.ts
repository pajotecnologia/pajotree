import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

export class EvolutionService {
  private static defaultApiUrl = process.env.DEFAULT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL || "http://localhost:8080";
  private static defaultApiKey = process.env.DEFAULT_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY || "";

  /**
   * Creates a new instance in the Evolution API.
   */
  static async createInstance(params: {
    organizationId: string;
    name: string;
    instanceName: string;
    apiUrl?: string;
    apiKey?: string;
  }) {
    const apiUrl = (params.apiUrl || this.defaultApiUrl).replace(/\/+$/, "");
    const apiKey = params.apiKey || this.defaultApiKey;

    // Se configurada a API do Evolution, tenta criar a instância remotamente
    if (apiUrl && apiKey) {
      try {
        const createRes = await fetch(`${apiUrl}/instance/create`, {
          method: "POST",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instanceName: params.instanceName,
            token: apiKey,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.warn(`Evolution API /instance/create retornou ${createRes.status}:`, errText);
        }
      } catch (e) {
        console.warn("Evolution API create instance fetch error:", e);
      }
    }

    // Encrypt apiKey before saving
    const encryptedKey = apiKey ? encryptSecret(apiKey) : null;

    const instance = await db.whatsappInstance.create({
      data: {
        organizationId: params.organizationId,
        name: params.name,
        instanceName: params.instanceName,
        apiUrl,
        credentialsEncrypted: encryptedKey,
        status: "CONNECTING",
        webhookStatus: "CONFIGURING",
      },
    });

    return instance;
  }

  /**
   * Generates a pairing QR Code string for an instance from Evolution API.
   */
  static async getQrCode(instanceName: string, organizationId?: string) {
    try {
      let instance = null;
      if (organizationId) {
        instance = await db.whatsappInstance.findFirst({
          where: { instanceName, organizationId },
        });
      } else {
        instance = await db.whatsappInstance.findUnique({
          where: { instanceName },
        });
      }

      const apiUrl = (instance?.apiUrl || this.defaultApiUrl).replace(/\/+$/, "");
      const apiKey = instance?.credentialsEncrypted
        ? decryptSecret(instance.credentialsEncrypted)
        : this.defaultApiKey;

      if (apiUrl && apiKey) {
        const res = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
          method: "GET",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const json = await res.json();
          const qrBase64 = json.base64 || json.qrcode?.base64 || json.code;
          const pairingCode = json.pairingCode || json.code || "PJTR-CONNECT";

          if (qrBase64) {
            return {
              isRealEvolution: true,
              pairingCode,
              qrCodeData: qrBase64,
            };
          }
        } else {
          console.warn(`Evolution API /instance/connect retornou status ${res.status}`);
        }
      }
    } catch (err) {
      console.warn("Evolution API connect request fallback:", err);
    }

    // Fallback explicativo quando a Evolution API não estiver conectada
    return {
      isRealEvolution: false,
      pairingCode: "DEMO-MODE",
      qrCodeData: `https://wa.me/pajotree_connect_${instanceName}`,
      message: "Servidor Evolution API não configurado ou inacessível no momento.",
    };
  }

  /**
   * Sends a WhatsApp text message via Evolution API.
   */
  static async sendMessage(params: {
    instanceId: string;
    remoteJid: string;
    text: string;
  }) {
    const instance = await db.whatsappInstance.findUnique({
      where: { id: params.instanceId },
    });

    if (!instance) {
      throw new Error("Instância WhatsApp não encontrada.");
    }

    const apiUrl = (instance.apiUrl || this.defaultApiUrl).replace(/\/+$/, "");
    const apiKey = instance.credentialsEncrypted
      ? decryptSecret(instance.credentialsEncrypted)
      : this.defaultApiKey;

    // Se houver conexão real com Evolution, envia mensagem HTTP
    if (apiUrl && apiKey) {
      try {
        const formattedNumber = params.remoteJid.replace(/\D/g, "");
        await fetch(`${apiUrl}/message/sendText/${instance.instanceName}`, {
          method: "POST",
          headers: {
            apikey: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number: formattedNumber,
            text: params.text,
          }),
        });
      } catch (err) {
        console.warn("Evolution API sendText fetch warning:", err);
      }
    }

    // Save message locally in conversation
    let contact = await db.whatsappContact.findFirst({
      where: {
        organizationId: instance.organizationId,
        remoteJid: params.remoteJid,
      },
    });

    if (!contact) {
      contact = await db.whatsappContact.create({
        data: {
          organizationId: instance.organizationId,
          remoteJid: params.remoteJid,
          name: params.remoteJid.split("@")[0],
        },
      });
    }

    let conversation = await db.whatsappConversation.findFirst({
      where: {
        instanceId: instance.id,
        contactId: contact.id,
      },
    });

    if (!conversation) {
      conversation = await db.whatsappConversation.create({
        data: {
          instanceId: instance.id,
          contactId: contact.id,
          status: "OPEN",
        },
      });
    }

    const message = await db.whatsappMessage.create({
      data: {
        conversationId: conversation.id,
        direction: "outgoing",
        messageType: "text",
        content: params.text,
        status: "SENT",
        externalId: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      },
    });

    return message;
  }
}
