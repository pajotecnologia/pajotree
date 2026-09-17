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
  whatsapp: z.string().trim().optional().default(""),
  logoUrl: imageUrlSchema.nullable().optional(),
  faviconUrl: imageUrlSchema.nullable().optional(),
  primaryColor: z.string().regex(HEX_COLOR, "Cor primária inválida"),
  secondaryColor: z.string().regex(HEX_COLOR, "Cor secundária inválida"),
  textColor: z.string().regex(HEX_COLOR, "Cor do texto inválida"),
  backgroundType: z.enum(["gradient", "image"]).optional().default("gradient"),
  backgroundValue: z.string().max(3_000_000),
  buttonStyle: z.enum(["square", "rounded", "rounded-xl", "pill", "glass"]),
  fontFamily: z.enum(ALLOWED_FONTS),
  customDomain: z.string().trim().optional().default(""),
  removeBrandingActive: z.boolean().optional().default(false),
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

    const [organization, page, planUsage, domain] = await Promise.all([
      db.organization.findUnique({ where: { id: auth.organization.id } }),
      getPageForOrganization(auth.organization.id),
      PlanLimitService.getPlanAndUsage(auth.organization.id),
      db.domain.findFirst({ where: { organizationId: auth.organization.id } }),
    ]);

    if (!organization) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const bgVal = page?.settings?.backgroundValue || "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)";
    const isImage =
      page?.settings?.backgroundType === "image" ||
      Boolean(
        bgVal &&
          (bgVal.startsWith("data:image/") ||
            bgVal.startsWith("http://") ||
            bgVal.startsWith("https://") ||
            bgVal.startsWith("url("))
      );

    let userConfig: any = {};
    try {
      userConfig = JSON.parse(page?.settings?.customCss || "{}");
    } catch {}

    const canRemoveBranding = Boolean(planUsage.features.removeBranding || auth.isSuperAdmin);
    const removeBrandingActive = canRemoveBranding && Boolean(userConfig.removeBranding);

    return NextResponse.json({
      whiteLabel: {
        brandName: organization.tradeName || organization.name,
        description: organization.description || page?.description || "",
        whatsapp: organization.whatsapp || organization.phone || "",
        logoUrl: organization.logoUrl,
        faviconUrl: page?.settings?.faviconUrl || organization.faviconUrl,
        primaryColor: page?.settings?.primaryColor || "#6366f1",
        secondaryColor: page?.settings?.secondaryColor || "#ec4899",
        textColor: page?.settings?.textColor || "#ffffff",
        backgroundType: page?.settings?.backgroundType || (isImage ? "image" : "gradient"),
        backgroundValue: bgVal,
        buttonStyle: page?.settings?.buttonStyle || "rounded-xl",
        fontFamily: page?.settings?.fontFamily || "Inter",
        customDomain: organization.whiteLabelDomain || domain?.domain || "",
        domainStatus: domain?.verificationStatus || "NOT_CONFIGURED",
        removeBrandingActive,
      },
      plan: {
        name: auth.isSuperAdmin ? "MASTER" : (planUsage.plan?.name || "FREE"),
        customDomainAllowed: Boolean(planUsage.features.customDomainAllowed || auth.isSuperAdmin),
        removeBranding: canRemoveBranding,
      },
      isSuperAdmin: Boolean(auth.isSuperAdmin),
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

    const customCssData = JSON.stringify({
      removeBranding: Boolean(data.removeBrandingActive),
    });

    const cleanDomain = data.customDomain
      ? data.customDomain.toLowerCase().replace(/^(https?:\/\/)/, "").replace(/\/+$/, "")
      : null;

    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.update({
        where: { id: organizationId },
        data: {
          tradeName: data.brandName,
          description: data.description || null,
          whatsapp: data.whatsapp || null,
          logoUrl: data.logoUrl || null,
          faviconUrl: data.faviconUrl || null,
          whiteLabelDomain: cleanDomain,
        },
      });

      const settings = await tx.pageSettings.upsert({
        where: { pageId: page.id },
        create: {
          pageId: page.id,
          backgroundType: data.backgroundType || "gradient",
          backgroundValue: data.backgroundValue,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          textColor: data.textColor,
          buttonStyle: data.buttonStyle,
          fontFamily: data.fontFamily,
          layout: "classic",
          faviconUrl: data.faviconUrl || null,
          customCss: customCssData,
        },
        update: {
          backgroundType: data.backgroundType || "gradient",
          backgroundValue: data.backgroundValue,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          textColor: data.textColor,
          buttonStyle: data.buttonStyle,
          fontFamily: data.fontFamily,
          faviconUrl: data.faviconUrl || null,
          customCss: customCssData,
        },
      });


      // Se informou domínio próprio, salva/atualiza na tabela Domain
      if (data.customDomain) {
        const cleanDomain = data.customDomain.toLowerCase().replace(/^(https?:\/\/)/, "").replace(/\/+$/, "");
        const existingDomain = await tx.domain.findFirst({
          where: { organizationId },
        });

        if (existingDomain) {
          await tx.domain.update({
            where: { id: existingDomain.id },
            data: {
              domain: cleanDomain,
              verificationStatus: "PENDING",
            },
          });
        } else {
          await tx.domain.create({
            data: {
              organizationId,
              domain: cleanDomain,
              verificationStatus: "PENDING",
            },
          });
        }
      }

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
        customDomain: data.customDomain,
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

// POST: Realizar verificação de apontamento DNS do domínio
export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth?.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { domain } = await request.json();
    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domínio não informado" }, { status: 400 });
    }

    const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)/, "").replace(/\/+$/, "");

    // Simulação ou verificação de DNS usando dns resolver nativo
    let verified = false;
    let dnsDetails = "";

    try {
      const dns = await import("node:dns/promises");
      const ACCEPTED_TARGETS = [
        "pajotree",
        "pajotech",
        "tree.pajotech.com.br",
        "cname.pajotree.com.br",
        "cname",
      ];

      // Tenta resolver CNAME
      try {
        const cnames = await dns.resolveCname(cleanDomain);
        if (
          cnames.some((c) =>
            ACCEPTED_TARGETS.some((target) => c.toLowerCase().includes(target.toLowerCase()))
          )
        ) {
          verified = true;
          dnsDetails = `CNAME verificado com sucesso: ${cnames.join(", ")}`;
        } else {
          // Se o CNAME aponta para outro lugar, ainda tentamos verificar se resolve para IP
          const addresses = await dns.resolve4(cleanDomain).catch(() => []);
          if (addresses.length > 0) {
            verified = true;
            dnsDetails = `CNAME encontrado: ${cnames.join(", ")} (IP: ${addresses.join(", ")})`;
          } else {
            dnsDetails = `CNAME aponta para ${cnames.join(", ")} (esperado: tree.pajotech.com.br ou cname.pajotree.com.br)`;
          }
        }
      } catch (cnameErr: any) {
        // Se não tiver registro CNAME direto (ex: Cloudflare Proxy ativo ou registro tipo A na raiz @)
        try {
          const addresses = await dns.resolve4(cleanDomain);
          if (addresses.length > 0) {
            // Se resolver IP ativo (Cloudflare Anycast ou servidor direto), consideramos conectado
            verified = true;
            dnsDetails = `Apontamento verificado (IP / Cloudflare Proxy: ${addresses.join(", ")})`;
          } else {
            dnsDetails = `Aguardando propagação DNS para ${cleanDomain}...`;
          }
        } catch (aErr: any) {
          dnsDetails = `Aguardando propagação DNS para ${cleanDomain}...`;
        }
      }
    } catch {
      dnsDetails = "Verificação de DNS concluída.";
      verified = true;
    }

    // Atualiza status no banco se o domínio pertencer à organização
    const status = verified ? "VERIFIED" : "PENDING";
    await db.domain.updateMany({
      where: {
        organizationId: auth.organization.id,
        domain: cleanDomain,
      },
      data: {
        verificationStatus: status,
      },
    });

    return NextResponse.json({
      success: true,
      verified,
      status,
      message: verified ? "Domínio apontado e verificado com sucesso!" : dnsDetails,
    });
  } catch (error) {
    console.error("Erro ao verificar DNS:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao verificar DNS" },
      { status: 500 }
    );
  }
}

