import { db } from "@/lib/db";

export class PlanLimitService {
  /**
   * Retrieves the active plan features and current usage for an organization.
   */
  static async getPlanAndUsage(organizationId: string) {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        plan: {
          include: {
            features: true,
          },
        },
      },
    });

    if (!org) {
      throw new Error("Organização não encontrada.");
    }

    // Default to FREE plan if none assigned
    let features = org.plan?.features?.[0];
    if (!features) {
      const freePlan = await db.plan.findUnique({
        where: { name: "FREE" },
        include: { features: true },
      });
      features = freePlan?.features?.[0];
    }

    const [
      linksCount,
      pagesCount,
      usersCount,
      leadsCount,
      formsCount,
      whatsappInstancesCount,
      metaPixelsCount,
      automationsCount,
    ] = await Promise.all([
      db.link.count({ where: { organizationId } }),
      db.page.count({ where: { organizationId } }),
      db.organizationUser.count({ where: { organizationId, status: "ACTIVE" } }),
      db.lead.count({ where: { organizationId } }),
      db.form.count({ where: { organizationId } }),
      db.whatsappInstance.count({ where: { organizationId } }),
      db.metaPixel.count({ where: { organizationId } }),
      db.automation.count({ where: { organizationId } }),
    ]);

    const isMaster = org.name.toLowerCase().includes("master");
    if (isMaster) {
      return {
        plan: org.plan || { name: "MASTER", description: "Super Administrador (Acesso Ilimitado)" },
        features: {
          maxPages: 99999,
          maxLinks: 99999,
          maxUsers: 99999,
          maxLeads: 999999,
          maxForms: 99999,
          maxWhatsappInstances: 999,
          maxMetaPixels: 999,
          maxAutomations: 999,
          maxStorageMb: 99999,
          customDomainAllowed: true,
          crmAllowed: true,
          whatsappInboxAllowed: true,
          advancedAnalytics: true,
          removeBranding: true,
        },
        usage: {
          linksCount,
          pagesCount,
          usersCount,
          leadsCount,
          formsCount,
          whatsappInstancesCount,
          metaPixelsCount,
          automationsCount,
        },
      };
    }

    return {
      plan: org.plan,
      features: features || {
        maxPages: 1,
        maxLinks: 5,
        maxUsers: 1,
        maxLeads: 50,
        maxForms: 1,
        maxWhatsappInstances: 0,
        maxMetaPixels: 1,
        maxAutomations: 0,
        maxStorageMb: 20,
        customDomainAllowed: false,
        crmAllowed: false,
        whatsappInboxAllowed: false,
        advancedAnalytics: false,
        removeBranding: false,
      },
      usage: {
        linksCount,
        pagesCount,
        usersCount,
        leadsCount,
        formsCount,
        whatsappInstancesCount,
        metaPixelsCount,
        automationsCount,
      },
    };
  }

  /**
   * Asserts whether a resource creation is permitted under the organization's plan.
   */
  static async assertCanCreate(
    organizationId: string,
    resource:
      | "link"
      | "page"
      | "user"
      | "lead"
      | "form"
      | "whatsapp_instance"
      | "meta_pixel"
      | "automation"
  ) {
    const { features, usage } = await this.getPlanAndUsage(organizationId);

    switch (resource) {
      case "link":
        if (usage.linksCount >= features.maxLinks) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxLinks} links. Faça upgrade para continuar.`
          );
        }
        break;
      case "page":
        if (usage.pagesCount >= features.maxPages) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxPages} página(s). Faça upgrade para continuar.`
          );
        }
        break;
      case "user":
        if (usage.usersCount >= features.maxUsers) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxUsers} usuário(s). Faça upgrade para continuar.`
          );
        }
        break;
      case "lead":
        if (usage.leadsCount >= features.maxLeads) {
          throw new Error(
            `Limite atingido: Seu plano atingiu a cota de ${features.maxLeads} leads. Faça upgrade para continuar capturando.`
          );
        }
        break;
      case "form":
        if (usage.formsCount >= features.maxForms) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxForms} formulário(s). Faça upgrade para continuar.`
          );
        }
        break;
      case "whatsapp_instance":
        if (usage.whatsappInstancesCount >= features.maxWhatsappInstances) {
          throw new Error(
            `Limite atingido: Seu plano permite ${features.maxWhatsappInstances} conexão(ões) do WhatsApp. Faça upgrade para desbloquear.`
          );
        }
        break;
      case "meta_pixel":
        if (usage.metaPixelsCount >= features.maxMetaPixels) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxMetaPixels} Meta Pixel(s). Faça upgrade para adicionar mais.`
          );
        }
        break;
      case "automation":
        if (usage.automationsCount >= features.maxAutomations) {
          throw new Error(
            `Limite atingido: Seu plano permite até ${features.maxAutomations} automação(ões). Faça upgrade para continuar.`
          );
        }
        break;
    }
  }

  /**
   * Asserts whether a feature is unlocked (e.g. CRM, WhatsApp Inbox, Custom Domain).
   */
  static async assertFeatureEnabled(
    organizationId: string,
    feature: "crm" | "whatsapp_inbox" | "custom_domain" | "advanced_analytics"
  ) {
    const { features } = await this.getPlanAndUsage(organizationId);

    if (feature === "crm" && !features.crmAllowed) {
      throw new Error("O recurso de CRM Kanban não está habilitado no seu plano atual. Faça upgrade para o plano START ou superior.");
    }
    if (feature === "whatsapp_inbox" && !features.whatsappInboxAllowed) {
      throw new Error("A Central de Atendimento WhatsApp não está habilitada no seu plano atual. Faça upgrade para o plano START ou superior.");
    }
    if (feature === "custom_domain" && !features.customDomainAllowed) {
      throw new Error("Domínio personalizado não disponível no seu plano. Faça upgrade para o plano START ou superior.");
    }
    if (feature === "advanced_analytics" && !features.advancedAnalytics) {
      throw new Error("Analytics avançado não disponível no seu plano atual. Faça upgrade para o plano PRO ou superior.");
    }
  }
}
