import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o Seed do Banco de Dados Pajotree...");

  // 1. Criar Permissões do Sistema
  const permissionsList = [
    { key: "page.view", description: "Visualizar páginas da organização" },
    { key: "page.edit", description: "Criar, editar e publicar páginas" },
    { key: "links.view", description: "Visualizar links" },
    { key: "links.create", description: "Criar novos links" },
    { key: "links.edit", description: "Editar links existentes" },
    { key: "links.delete", description: "Excluir links" },
    { key: "leads.view", description: "Visualizar leads capturados" },
    { key: "leads.edit", description: "Editar e atualizar status de leads" },
    { key: "customers.view", description: "Visualizar clientes da empresa" },
    { key: "crm.view", description: "Acessar o pipeline e Kanban do CRM" },
    { key: "crm.edit", description: "Gerenciar oportunidades e tarefas do CRM" },
    { key: "whatsapp.view", description: "Acessar instâncias e histórico do WhatsApp" },
    { key: "whatsapp.send", description: "Enviar mensagens pela Central de Atendimento" },
    { key: "analytics.view", description: "Visualizar relatórios e eventos de analytics" },
    { key: "team.manage", description: "Convidar e gerenciar membros da equipe" },
    { key: "billing.manage", description: "Gerenciar assinaturas, planos e pagamentos" },
    { key: "settings.manage", description: "Editar configurações gerais da empresa" },
  ];

  for (const perm of permissionsList) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: { key: perm.key, description: perm.description },
    });
  }
  console.log("✓ Permissões criadas/atualizadas.");

  // 2. Criar Planos e Limites
  const plansData = [
    {
      name: "FREE",
      description: "Ideal para começar a centralizar seus links e capturar os primeiros leads.",
      priceMonthly: 0,
      priceYearly: 0,
      trialDays: 0,
      features: {
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
    },
    {
      name: "START",
      description: "Para profissionais e pequenas empresas que precisam de WhatsApp e mais alcance.",
      priceMonthly: 39.9,
      priceYearly: 399.0,
      trialDays: 14,
      features: {
        maxPages: 3,
        maxLinks: 25,
        maxUsers: 3,
        maxLeads: 500,
        maxForms: 3,
        maxWhatsappInstances: 1,
        maxMetaPixels: 2,
        maxAutomations: 2,
        maxStorageMb: 200,
        customDomainAllowed: true,
        crmAllowed: true,
        whatsappInboxAllowed: true,
        advancedAnalytics: false,
        removeBranding: false,
      },
    },
    {
      name: "PRO",
      description: "O mais popular. CRM completo, WhatsApp integrado, pixels ilimitados por link e automação.",
      priceMonthly: 89.9,
      priceYearly: 899.0,
      trialDays: 14,
      features: {
        maxPages: 10,
        maxLinks: 100,
        maxUsers: 10,
        maxLeads: 5000,
        maxForms: 10,
        maxWhatsappInstances: 3,
        maxMetaPixels: 10,
        maxAutomations: 10,
        maxStorageMb: 1024,
        customDomainAllowed: true,
        crmAllowed: true,
        whatsappInboxAllowed: true,
        advancedAnalytics: true,
        removeBranding: true,
      },
    },
    {
      name: "BUSINESS",
      description: "Para grandes operações com alta demanda, múltiplos atendentes e escala total.",
      priceMonthly: 199.9,
      priceYearly: 1999.0,
      trialDays: 14,
      features: {
        maxPages: 50,
        maxLinks: 500,
        maxUsers: 50,
        maxLeads: 50000,
        maxForms: 50,
        maxWhatsappInstances: 10,
        maxMetaPixels: 50,
        maxAutomations: 50,
        maxStorageMb: 10240,
        customDomainAllowed: true,
        crmAllowed: true,
        whatsappInboxAllowed: true,
        advancedAnalytics: true,
        removeBranding: true,
      },
    },
  ];

  for (const p of plansData) {
    const plan = await prisma.plan.upsert({
      where: { name: p.name },
      update: {
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        trialDays: p.trialDays,
      },
      create: {
        name: p.name,
        description: p.description,
        priceMonthly: p.priceMonthly,
        priceYearly: p.priceYearly,
        trialDays: p.trialDays,
      },
    });

    await prisma.planFeature.upsert({
      where: { planId: plan.id },
      update: p.features,
      create: {
        planId: plan.id,
        ...p.features,
      },
    });
  }
  console.log("✓ Planos e Limites configurados.");

  // 3. Criar Temas Globais
  const defaultThemes = [
    {
      name: "Neon Cyberpunk",
      description: "Visual dark moderno com detalhes em neon roxo e ciano de alto contraste.",
      configJson: JSON.stringify({
        backgroundType: "gradient",
        backgroundValue: "linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)",
        primaryColor: "#6366f1",
        secondaryColor: "#06b6d4",
        textColor: "#f8fafc",
        buttonStyle: "rounded-xl",
        fontFamily: "Inter",
      }),
    },
    {
      name: "Minimalist Light",
      description: "Elegante, limpo e profissional com tons neutros e suaves.",
      configJson: JSON.stringify({
        backgroundType: "color",
        backgroundValue: "#f8fafc",
        primaryColor: "#0f172a",
        secondaryColor: "#3b82f6",
        textColor: "#0f172a",
        buttonStyle: "rounded-lg",
        fontFamily: "Inter",
      }),
    },
    {
      name: "Emerald Luxury",
      description: "Paleta esmeralda sofisticada para marcas de alto padrão.",
      configJson: JSON.stringify({
        backgroundType: "gradient",
        backgroundValue: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)",
        primaryColor: "#10b981",
        secondaryColor: "#34d399",
        textColor: "#ffffff",
        buttonStyle: "pill",
        fontFamily: "Inter",
      }),
    },
    {
      name: "Sunset Orange",
      description: "Gradiente vibrante e enérgico com tons quentes de pôr do sol.",
      configJson: JSON.stringify({
        backgroundType: "gradient",
        backgroundValue: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)",
        primaryColor: "#f97316",
        secondaryColor: "#fbbf24",
        textColor: "#ffffff",
        buttonStyle: "rounded-xl",
        fontFamily: "Inter",
      }),
    },
  ];

  for (const theme of defaultThemes) {
    const existing = await prisma.theme.findFirst({ where: { name: theme.name } });
    if (!existing) {
      await prisma.theme.create({
        data: {
          name: theme.name,
          description: theme.description,
          configJson: theme.configJson,
          isGlobal: true,
        },
      });
    }
  }
  console.log("✓ Temas visuais globais criados.");

  // 4. Criar Usuário Super Admin Inicial
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@pajotree.com";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminPassword123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      isSuperAdmin: true,
      name: "Super Administrador",
    },
    create: {
      name: "Super Administrador",
      email: adminEmail,
      passwordHash: passwordHash,
      isSuperAdmin: true,
      status: "ACTIVE",
    },
  });

  console.log(`✓ Super Admin pronto: ${superAdmin.email}`);
  console.log("🚀 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
