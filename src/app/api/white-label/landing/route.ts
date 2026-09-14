import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";
import { z } from "zod";

const landingSchema = z.object({
  headline: z.string().trim().max(120).optional(),
  subtitle: z.string().trim().max(300).optional(),
  badgeText: z.string().trim().max(60).optional(),
  ctaText: z.string().trim().max(40).optional(),
  ctaSecondaryText: z.string().trim().max(40).optional(),
  whatsappContact: z.string().trim().optional(),
  themeColor: z.string().trim().optional(),
  heroImageUrl: z.string().trim().url().optional().nullable(),
  showHero: z.boolean().optional().default(true),
  showFeatures: z.boolean().optional().default(true),
  showPricing: z.boolean().optional().default(true),
  showTestimonials: z.boolean().optional().default(true),
  showFaq: z.boolean().optional().default(true),
  customFaqJson: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      await ensureDatabaseSchema();
    } catch {
      // Non-blocking
    }

    const orgId = auth.organization.id;
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        tradeName: true,
        logoUrl: true,
        faviconUrl: true,
        whiteLabelDomain: true,
        whiteLabelLandingJson: true,
        customPlans: {
          include: { features: true },
          orderBy: { priceMonthly: "asc" },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    let config = null;
    if (org.whiteLabelLandingJson) {
      try {
        config = JSON.parse(org.whiteLabelLandingJson);
      } catch {
        config = null;
      }
    }

    // Default configuration if not customized yet
    const brandName = org.tradeName || org.name || "Sua Marca";
    const defaultConfig = {
      headline: `A Plataforma Tudo-em-Um de Páginas, WhatsApp e CRM para ${brandName}`,
      subtitle: "Transforme visitantes em clientes fiéis com bio links profissionais, atendimento WhatsApp centralizado, CRM com funis e rastreamento completo.",
      badgeText: "🚀 O Sistema Completo de Conversão",
      ctaText: "Começar Gratuitamente",
      ctaSecondaryText: "Falar com Especialista",
      whatsappContact: "",
      themeColor: "#4f46e5",
      showHero: true,
      showFeatures: true,
      showPricing: true,
      showTestimonials: true,
      showFaq: true,
      ...config,
    };

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const slug = org.whiteLabelDomain || org.id;
    const publicUrl = `${protocol}://${host}/wl/${slug}`;

    return NextResponse.json({
      success: true,
      config: defaultConfig,
      publicUrl,
      brandName,
      plansCount: org.customPlans.length,
    });
  } catch (error: any) {
    console.error("Erro ao carregar configuração da Landing Page:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      await ensureDatabaseSchema();
    } catch {
      // Non-blocking
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const parsed = landingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const landingJson = JSON.stringify(parsed.data);

    await db.organization.update({
      where: { id: orgId },
      data: {
        whiteLabelLandingJson: landingJson,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Landing Page atualizada com sucesso!",
      config: parsed.data,
    });
  } catch (error: any) {
    console.error("Erro ao salvar configuração da Landing Page:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
