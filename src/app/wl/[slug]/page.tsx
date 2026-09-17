import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import {
  Zap,
  Check,
  ArrowRight,
  MessageSquare,
  Link2,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Layers,
  HelpCircle,
  Phone,
  ExternalLink,
  ChevronDown,
  KanbanSquare,
  QrCode,
  Globe,
  Sliders,
} from "lucide-react";
import WhiteLabelLandingClient from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const withoutWww = cleanSlug.replace(/^www\./, "");

  try {
    await ensureDatabaseSchema();
    let org = await db.organization.findFirst({
      where: {
        OR: [
          { whiteLabelDomain: cleanSlug },
          { whiteLabelDomain: withoutWww },
          { id: cleanSlug },
        ],
      },
      select: { name: true, tradeName: true, logoUrl: true, faviconUrl: true, whiteLabelLandingJson: true },
    });

    if (!org) {
      const domainRec = await db.domain.findFirst({
        where: {
          OR: [
            { domain: cleanSlug },
            { domain: withoutWww },
          ],
        },
        include: {
          organization: {
            select: { name: true, tradeName: true, logoUrl: true, faviconUrl: true, whiteLabelLandingJson: true },
          },
        },
      });
      if (domainRec?.organization) {
        org = domainRec.organization;
      }
    }

    let landingConfig: any = {};
    if (org?.whiteLabelLandingJson) {
      try {
        landingConfig = JSON.parse(org.whiteLabelLandingJson);
      } catch {}
    }

    const brandName = org?.tradeName || org?.name || "Links Oficiais & Soluções";
    const pageTitle = landingConfig.headline
      ? `${brandName} - ${landingConfig.headline}`
      : `${brandName} - Links Oficiais, Atendimento & CRM`;
    const pageDesc =
      landingConfig.subtitle ||
      `Crie páginas de alta conversão, direcione leads para o WhatsApp e gerencie oportunidades no CRM com ${brandName}.`;

    const iconUrl = org?.faviconUrl || org?.logoUrl || undefined;

    return {
      title: pageTitle,
      description: pageDesc,
      openGraph: {
        title: pageTitle,
        description: pageDesc,
        images: org?.logoUrl ? [{ url: org.logoUrl }] : undefined,
      },
      icons: iconUrl ? [{ rel: "icon", url: iconUrl }] : undefined,
    };
  } catch {
    return { title: "Links Oficiais & Atendimento" };
  }
}

export default async function WhiteLabelPublicLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
  const withoutWww = cleanSlug.replace(/^www\./, "");

  try {
    await ensureDatabaseSchema();
  } catch {
    // Non-blocking
  }

  // Busca a organização White Label por slug/domínio, ID ou tabela Domain
  let org = await db.organization.findFirst({
    where: {
      OR: [
        { whiteLabelDomain: cleanSlug },
        { whiteLabelDomain: withoutWww },
        { id: cleanSlug },
      ],
    },
    include: {
      customPlans: {
        include: { features: true },
        orderBy: { priceMonthly: "asc" },
      },
    },
  });

  if (!org) {
    const domainRec = await db.domain.findFirst({
      where: {
        OR: [
          { domain: cleanSlug },
          { domain: withoutWww },
        ],
      },
      include: {
        organization: {
          include: {
            customPlans: {
              include: { features: true },
              orderBy: { priceMonthly: "asc" },
            },
          },
        },
      },
    });

  if (domainRec?.organization) {
      org = domainRec.organization;
    }
  }

  if (!org) {
    notFound();
  }

  // Se não houver planos cadastrados pelo revendedor, busca os planos padrão
  let plans = org.customPlans;
  if (!plans || plans.length === 0) {
    plans = (await db.plan.findMany({
      where: { name: { not: "MASTER" }, organizationId: null },
      include: { features: true },
      orderBy: { priceMonthly: "asc" },
    })) as any;
  }

  // Parse da configuração da landing page
  let landingConfig: any = {};
  if (org.whiteLabelLandingJson) {
    try {
      landingConfig = JSON.parse(org.whiteLabelLandingJson);
    } catch {
      landingConfig = {};
    }
  }

  const brandName = org.tradeName || org.name || "Nossa Plataforma";

  return (
    <WhiteLabelLandingClient
      org={{
        id: org.id,
        name: org.name,
        tradeName: org.tradeName,
        logoUrl: org.logoUrl,
        faviconUrl: org.faviconUrl,
        whatsapp: org.whatsapp,
        email: org.email,
        phone: org.phone,
        whiteLabelDomain: org.whiteLabelDomain,
      }}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        priceMonthly: Number(p.priceMonthly),
        priceYearly: Number(p.priceYearly),
        trialDays: p.trialDays,
        features: p.features[0] || null,
      }))}
      config={{
        headline: landingConfig.headline || `A Plataforma Tudo-em-Um de Páginas, WhatsApp e CRM para ${brandName}`,
        subtitle: landingConfig.subtitle || "Transforme cliques em vendas reais com páginas modernas, links diretos para WhatsApp, pipeline CRM e métricas avançadas.",
        badgeText: landingConfig.badgeText || "🚀 Revolucione o Atendimento e Vendas do seu Negócio",
        ctaText: landingConfig.ctaText || "Criar Minha Conta Grátis",
        ctaSecondaryText: landingConfig.ctaSecondaryText || "Falar com Especialista",
        whatsappContact: landingConfig.whatsappContact || org.whatsapp || "",
        themeColor: landingConfig.themeColor || "#4f46e5",
        showHero: landingConfig.showHero ?? true,
        showFeatures: landingConfig.showFeatures ?? true,
        showPricing: landingConfig.showPricing ?? true,
        showTestimonials: landingConfig.showTestimonials ?? true,
        showFaq: landingConfig.showFaq ?? true,
      }}
    />
  );
}
