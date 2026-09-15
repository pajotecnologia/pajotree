import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { ensureDatabaseSchema } from "@/lib/db-migrate";

export class EvolutionService {
  /**
   * Resolves the Evolution API configuration strictly from tenant Settings (OrganizationEvolutionConfig).
   */
  static async getEffectiveEvolutionConfig(organizationId?: string): Promise<{
    isConfigured: boolean;
    apiUrl: string;
    apiKey: string;
    instanceName?: string | null;
  }> {
    if (organizationId) {
      try {
        const config = await db.organizationEvolutionConfig.findUnique({
          where: { organizationId },
        });
        if (config && config.ativo && config.apiUrl?.trim()) {
          return {
            isConfigured: true,
            apiUrl: config.apiUrl.trim().replace(/\/+$/, ""),
            apiKey: config.apiKey?.trim() || "",
            instanceName: config.instanceName?.trim() || null,
          };
        }
      } catch (err) {
        console.warn("Erro ao carregar OrganizationEvolutionConfig, executando ensureDatabaseSchema:", err);
        try {
          await ensureDatabaseSchema();
        } catch {}
      }
    }

    // Fallback para variáveis de ambiente apenas se existirem explicitamente no servidor
    const envUrl = process.env.DEFAULT_EVOLUTION_API_URL || process.env.EVOLUTION_API_URL;
    const envKey = process.env.DEFAULT_EVOLUTION_API_KEY || process.env.EVOLUTION_API_KEY;

    if (envUrl) {
      return {
        isConfigured: true,
        apiUrl: envUrl.trim().replace(/\/+$/, ""),
        apiKey: envKey?.trim() || "",
        instanceName: null,
      };
    }

    return {
      isConfigured: false,
      apiUrl: "",
      apiKey: "",
      instanceName: null,
    };
  }

  /**
   * Creates a new instance in the Evolution API configured in Settings.
   */
  static async createInstance(params: {
    organizationId: string;
    name: string;
    instanceName: string;
    apiUrl?: string;
    apiKey?: string;
  }) {
    const effectiveConfig = await this.getEffectiveEvolutionConfig(params.organizationId);
    const apiUrl = (params.apiUrl || effectiveConfig.apiUrl).replace(/\/+$/, "");
    const apiKey = params.apiKey || effectiveConfig.apiKey;

    if (!apiUrl || !apiKey) {
      throw new Error(
        "Evolution API não está configurada. Por favor, acesse Configurações > Evolution API e cadastre a URL e a Chave Global da sua Evolution API antes de criar conexões."
      );
    }

    // Cria a instância remotamente no servidor Evolution API configurado
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
        const errJson = await createRes.json().catch(() => null);
        const errText = errJson?.response?.message?.[0] || errJson?.message || errJson?.error || `Status HTTP ${createRes.status}`;
        console.warn(`Evolution API /instance/create retornou erro (${createRes.status}):`, errText);
        // Se a instância já existe no Evolution API (403 ou similar), permitimos continuar
        if (createRes.status !== 403 && !String(errText).toLowerCase().includes("already in use") && !String(errText).toLowerCase().includes("já existe")) {
          throw new Error(`Falha no servidor Evolution API (${createRes.status}): ${errText}`);
        }
      }
    } catch (e: any) {
      if (e.message?.startsWith("Falha no servidor Evolution API")) {
        throw e;
      }
      console.warn("Evolution API create instance fetch error:", e);
      throw new Error(`Não foi possível conectar ao servidor Evolution API em "${apiUrl}". Verifique se a URL e a Chave estão corretas em Configurações.`);
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
   * Deletes / disconnects an instance from Evolution API and database.
   */
  static async deleteInstance(instanceId: string, organizationId: string) {
    const instance = await db.whatsappInstance.findFirst({
      where: { id: instanceId, organizationId },
    });

    if (!instance) {
      throw new Error("Instância WhatsApp não encontrada.");
    }

    const effectiveConfig = await this.getEffectiveEvolutionConfig(organizationId);
    const apiUrl = (instance.apiUrl || effectiveConfig.apiUrl).replace(/\/+$/, "");
    const apiKey = instance.credentialsEncrypted
      ? decryptSecret(instance.credentialsEncrypted)
      : effectiveConfig.apiKey;

    if (apiUrl && apiKey) {
      try {
        await fetch(`${apiUrl}/instance/logout/${instance.instanceName}`, {
          method: "DELETE",
          headers: { apikey: apiKey },
        });
        await fetch(`${apiUrl}/instance/delete/${instance.instanceName}`, {
          method: "DELETE",
          headers: { apikey: apiKey },
        });
      } catch (e) {
        console.warn("Aviso ao remover instância no Evolution API:", e);
      }
    }

    await db.whatsappInstance.delete({
      where: { id: instance.id },
    });

    return { success: true };
  }

  /**
   * Updates an instance's name, instanceName, or custom server settings.
   */
  static async updateInstance(params: {
    instanceId: string;
    organizationId: string;
    name?: string;
    instanceName?: string;
    apiUrl?: string;
    apiKey?: string;
  }) {
    const instance = await db.whatsappInstance.findFirst({
      where: { id: params.instanceId, organizationId: params.organizationId },
    });

    if (!instance) {
      throw new Error("Instância WhatsApp não encontrada.");
    }

    const encryptedKey = params.apiKey ? encryptSecret(params.apiKey) : undefined;
    const cleanInstanceName = params.instanceName?.trim()
      ? params.instanceName.trim().replace(/[^a-zA-Z0-9_-]/g, "_")
      : undefined;

    const updated = await db.whatsappInstance.update({
      where: { id: params.instanceId },
      data: {
        ...(params.name ? { name: params.name } : {}),
        ...(cleanInstanceName ? { instanceName: cleanInstanceName } : {}),
        ...(params.apiUrl ? { apiUrl: params.apiUrl.replace(/\/+$/, "") } : {}),
        ...(encryptedKey !== undefined ? { credentialsEncrypted: encryptedKey } : {}),
      },
    });

    return updated;
  }

  /**
   * Generates a pairing QR Code string for an instance from the Evolution API configured in Settings.
   */
  static async getQrCode(instanceName: string, organizationId?: string) {
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

    const effectiveConfig = await this.getEffectiveEvolutionConfig(instance?.organizationId || organizationId);
    const apiUrl = (instance?.apiUrl || effectiveConfig.apiUrl).replace(/\/+$/, "");
    const apiKey = instance?.credentialsEncrypted
      ? decryptSecret(instance.credentialsEncrypted)
      : effectiveConfig.apiKey;

    if (!apiUrl || !apiKey) {
      throw new Error("Evolution API não está configurada. Acesse Configurações > Evolution API para configurar seu servidor.");
    }

    try {
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
        const pairingCode = json.pairingCode || json.code || "CONECTADO";

        if (qrBase64) {
          return {
            isRealEvolution: true,
            pairingCode,
            qrCodeData: qrBase64,
          };
        }
      }

      const errText = await res.text().catch(() => "");
      console.warn(`Evolution API /instance/connect retornou status ${res.status}:`, errText);
      throw new Error(`Servidor Evolution API (${res.status}): Não foi possível obter o QR Code da instância "${instanceName}". Verifique se o servidor está ativo.`);
    } catch (err: any) {
      console.warn("Evolution API connect request error:", err);
      throw new Error(err.message || `Erro ao conectar com o servidor Evolution API em "${apiUrl}".`);
    }
  }

  /**
   * Sends a WhatsApp text message via the Evolution API configured in Settings.
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

    const effectiveConfig = await this.getEffectiveEvolutionConfig(instance.organizationId);
    const apiUrl = (instance.apiUrl || effectiveConfig.apiUrl).replace(/\/+$/, "");
    const apiKey = instance.credentialsEncrypted
      ? decryptSecret(instance.credentialsEncrypted)
      : effectiveConfig.apiKey;

    if (!apiUrl || !apiKey) {
      throw new Error("Evolution API não configurada em Configurações. Configure seu servidor antes de enviar mensagens.");
    }

    // Envia mensagem HTTP diretamente pelo servidor Evolution API configurado
    try {
      const formattedNumber = params.remoteJid.replace(/\D/g, "");
      const res = await fetch(`${apiUrl}/message/sendText/${instance.instanceName}`, {
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

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`Evolution API sendText retornou status ${res.status}:`, errText);
      }
    } catch (err) {
      console.warn("Evolution API sendText fetch warning:", err);
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
