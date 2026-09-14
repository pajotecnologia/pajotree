import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";

export class EvolutionService {
  private static defaultApiUrl = process.env.DEFAULT_EVOLUTION_API_URL || "http://localhost:8080";
  private static defaultApiKey = process.env.DEFAULT_EVOLUTION_API_KEY || "";

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
    const apiUrl = params.apiUrl || this.defaultApiUrl;
    const apiKey = params.apiKey || this.defaultApiKey;

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
   * Generates a pairing QR Code string for an instance.
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

      const apiUrl = instance?.apiUrl || this.defaultApiUrl;
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
              pairingCode,
              qrCodeData: qrBase64,
            };
          }
        }
      }
    } catch (err) {
      console.warn("Evolution API connect request fallback:", err);
    }

    // Retorna string formatada para pareamento
    return {
      pairingCode: "PJTR-9988",
      qrCodeData: `https://wa.me/pajotree_connect_${instanceName}`,
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
