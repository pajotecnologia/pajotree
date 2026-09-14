import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { AuditService } from "@/server/services/audit.service";

const ALLOWED_FONTS = [
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Open Sans",
  "Lato",
  "Nunito",
  "Playfair Display",
  "DM Sans",
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const imageUrlSchema = z.string().max(2_800_000).refine(
  (value) => {
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return true;
    try {
      const url = new URL(value);
      return url.protocol === "https:";
    } catch {
      return false;
    }
  },
  "Imagem inválida. Use uma imagem HTTPS ou Data URL PNG/JPG/WebP."
);

const schema = z.object({
  brandName: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
  logoUrl: imageUrlSchema.nullable().optional(),
  faviconUrl: imageUrlSchema.nullable().optional(),
  primaryColor: z.string().regex(HEX_COLOR, "Cor primária inválida"),
  secondaryColor: z.string().regex(HEX_COLOR, "Cor secundária inválida"),
  textColor: z.string().regex(HEX_COLOR, "Cor do texto inválida"),
  backgroundValue: z.string().max(3_000_000),
  buttonStyle: z.enum(["square", "rounded", "rounded-xl", "pill", "glass"]),
  fontFamily: z.enum(ALLOWED_FONTS),
});

async function getPageForOrganization(organizationId: string) {
  return db.page.findFirst({
    where: { organizationId, status: "PUBLISHED" },
    orderBy: { createdAt: "asc" },
    include: { settings: true },
  });
}

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const [organization, page, planUsage] = await Promise.all([
      db.organization.findUnique({ where: { id: auth.organization.id } }),
      getPageForOrganization(auth.organization.id),
      PlanLimitService.getPlanAndUsage(auth.organization.id),
    ]);

    if (!organization) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      whiteLabel: {
        brandName: organization.tradeName || organization.name,
        description: organization.description || "",
        logoUrl: organization.logoUrl,
        faviconUrl: page?.settings?.faviconUrl || organization.faviconUrl,
        primaryColor: page?.settings?.primaryColor || "#6366f1",
        secondaryColor: page?.settings?.secondaryColor || "#ec4899",
        textColor: page?.settings?.textColor || "#ffffff",
        backgroundValue:
          page?.settings?.backgroundValue ||
          "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
        buttonStyle: page?.settings?.buttonStyle || "rounded-xl",
        fontFamily: page?.settings?.fontFamily || "Inter",
      },
      plan: {
        name: planUsage.plan?.name || "FREE",
        customDomainAllowed: Boolean(planUsage.features.customDomainAllowed),
        removeBranding: Boolean(planUsage.features.removeBranding),
      },
    });
  } catch (error) {
    console.error("Erro ao obter White Label:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const organizationId = auth.organization.id;
    const page = await getPageForOrganization(organizationId);

    if (!page) {
      return NextResponse.json({ error: "Página pública não encontrada" }, { status: 404 });
    }

    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id: organizationId },
        data: {
          tradeName: data.brandName,
          description: data.description || null,
          logoUrl: data.logoUrl || null,
          faviconUrl: data.faviconUrl || null,
        },
      });

      const settings = await tx.pageSettings.upsert({
        where: { pageId: page.id },
        create: {
          pageId: page.id,
          backgroundType: "gradient",
          backgroundValue: data.backgroundValue,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          textColor: data.textColor,
          buttonStyle: data.buttonStyle,
          fontFamily: data.fontFamily,
          layout: "classic",
          faviconUrl: data.faviconUrl || null,
        },
        update: {
          backgroundValue: data.backgroundValue,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          textColor: data.textColor,
          buttonStyle: data.buttonStyle,
          fontFamily: data.fontFamily,
          faviconUrl: data.faviconUrl || null,
        },
      });

      return { organization, settings };
    });

    await AuditService.log({
      organizationId,
      userId: auth.user.id,
      action: "UPDATE_WHITE_LABEL",
      entity: "Organization",
      entityId: organizationId,
      metadata: {
        brandName: data.brandName,
        fontFamily: data.fontFamily,
        primaryColor: data.primaryColor,
      },
    });

    return NextResponse.json({ success: true, whiteLabel: result });
  } catch (error) {
    console.error("Erro ao salvar White Label:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar White Label" },
      { status: 500 }
    );
  }
}
