import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o Seed do Banco de Dados Pajotree...");

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
    await prisma.permission.upsert({ where: { key: perm.key }, update: { description: perm.description }, create: { key: perm.key, description: perm.description } });
  }
  console.log("✓ Permissões criadas/atualizadas.");

  const plansData = [
    {
      name: "FREE",
      description: "Para quem está começando a organizar sua presença online.",
      priceMonthly: 0,
      priceYearly: 0,
      trialDays: 0,
      features: { maxPages: 1, maxLinks: 5, maxUsers: 1, maxLeads: 50, maxForms: 1, maxWhatsappInstances: 0, maxMetaPixels: 1, maxAutomations: 0, maxStorageMb: 20, customDomainAllowed: false, crmAllowed: false, whatsappInboxAllowed: false, advancedAnalytics: false, removeBranding: false },
    },
    {
      name: "START",
      description: "Ideal para autônomos e pequenos negócios que atendem no WhatsApp.",
      priceMonthly: 39.9,
      priceYearly: 399.0,
      trialDays: 14,
      features: { maxPages: 3, maxLinks: 25, maxUsers: 3, maxLeads: 500, maxForms: 3, maxWhatsappInstances: 1, maxMetaPixels: 2, maxAutomations: 2, maxStorageMb: 200, customDomainAllowed: true, crmAllowed: true, whatsappInboxAllowed: true, advancedAnalytics: false, removeBranding: false },
    },
    {
      name: "PRO",
      description: "A máquina completa de conversão com WhatsApp, CRM e Analytics.",
      priceMonthly: 89.9,
      priceYearly: 898.8,
      trialDays: 14,
      features: { maxPages: 10, maxLinks: 100, maxUsers: 10, maxLeads: 5000, maxForms: 10, maxWhatsappInstances: 3, maxMetaPixels: 10, maxAutomations: 10, maxStorageMb: 1024, customDomainAllowed: true, crmAllowed: true, whatsappInboxAllowed: true, advancedAnalytics: true, removeBranding: true },
    },
    {
      name: "BUSINESS",
      description: "Para agências e empresas de alta escala com múltiplos canais.",
      priceMonthly: 199.9,
      priceYearly: 1998.0,
      trialDays: 14,
      features: { maxPages: 50, maxLinks: 500, maxUsers: 50, maxLeads: 50000, maxForms: 50, maxWhatsappInstances: 10, maxMetaPixels: 50, maxAutomations: 50, maxStorageMb: 10240, customDomainAllowed: true, crmAllowed: true, whatsappInboxAllowed: true, advancedAnalytics: true, removeBranding: true },
    },
    {
      name: "WHITE LABEL",
      description: "Para agências, parceiros e operações que querem oferecer a plataforma com sua própria marca, domínio e identidade visual.",
      priceMonthly: 399.9,
      priceYearly: 3999.0,
      trialDays: 14,
      features: { maxPages: 100, maxLinks: 1000, maxUsers: 100, maxLeads: 100000, maxForms: 100, maxWhatsappInstances: 20, maxMetaPixels: 100, maxAutomations: 100, maxStorageMb: 51200, customDomainAllowed: true, crmAllowed: true, whatsappInboxAllowed: true, advancedAnalytics: true, removeBranding: true },
    },
    {
      name: "MASTER",
      description: "Plano interno exclusivo do Super Admin para gestão global do Pajotree, sem cobrança e sem limitações de recursos.",
      priceMonthly: 0,
      priceYearly: 0,
      trialDays: 0,
      features: { maxPages: 999999, maxLinks: 999999, maxUsers: 999999, maxLeads: 999999, maxForms: 999999, maxWhatsappInstances: 999999, maxMetaPixels: 999999, maxAutomations: 999999, maxStorageMb: 999999, customDomainAllowed: true, crmAllowed: true, whatsappInboxAllowed: true, advancedAnalytics: true, removeBranding: true },
    },
  ];

  for (const p of plansData) {
    const plan = await prisma.plan.upsert({ where: { name: p.name }, update: { description: p.description, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, trialDays: p.trialDays }, create: { name: p.name, description: p.description, priceMonthly: p.priceMonthly, priceYearly: p.priceYearly, trialDays: p.trialDays } });
    await prisma.planFeature.upsert({ where: { planId: plan.id }, update: p.features, create: { planId: plan.id, ...p.features } });
  }
  console.log("✓ Planos comerciais sincronizados, incluindo WHITE LABEL e MASTER interno.");

  const defaultThemes = [
    { name: "Neon Cyberpunk", description: "Visual dark moderno com detalhes em neon roxo e ciano de alto contraste.", configJson: JSON.stringify({ backgroundType: "gradient", backgroundValue: "linear-gradient(135deg, #090d16 0%, #111827 50%, #1e1b4b 100%)", primaryColor: "#6366f1", secondaryColor: "#06b6d4", textColor: "#f8fafc", buttonStyle: "rounded-xl", fontFamily: "Inter" }) },
    { name: "Minimalist Light", description: "Elegante, limpo e profissional com tons neutros e suaves.", configJson: JSON.stringify({ backgroundType: "color", backgroundValue: "#f8fafc", primaryColor: "#0f172a", secondaryColor: "#3b82f6", textColor: "#0f172a", buttonStyle: "rounded-lg", fontFamily: "Inter" }) },
    { name: "Emerald Luxury", description: "Paleta esmeralda sofisticada para marcas de alto padrão.", configJson: JSON.stringify({ backgroundType: "gradient", backgroundValue: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)", primaryColor: "#10b981", secondaryColor: "#34d399", textColor: "#ffffff", buttonStyle: "pill", fontFamily: "Inter" }) },
    { name: "Sunset Orange", description: "Gradiente vibrante e enérgico com tons quentes de pôr do sol.", configJson: JSON.stringify({ backgroundType: "gradient", backgroundValue: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)", primaryColor: "#f97316", secondaryColor: "#fbbf24", textColor: "#ffffff", buttonStyle: "rounded-xl", fontFamily: "Inter" }) },
  ];

  for (const theme of defaultThemes) {
    const existing = await prisma.theme.findFirst({ where: { name: theme.name } });
    if (!existing) await prisma.theme.create({ data: { name: theme.name, description: theme.description, configJson: theme.configJson, isGlobal: true } });
  }
  console.log("✓ Temas visuais globais criados.");

  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "admin@pajotree.com";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "AdminPassword123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const superAdmin = await prisma.user.upsert({ where: { email: adminEmail }, update: { isSuperAdmin: true, name: "Super Administrador" }, create: { name: "Super Administrador", email: adminEmail, passwordHash, isSuperAdmin: true, status: "ACTIVE" } });
  console.log(`✓ Super Admin pronto: ${superAdmin.email}`);
  console.log("🚀 Seed concluído com sucesso!");
}

main().catch((e) => { console.error("Erro durante o seed:", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
