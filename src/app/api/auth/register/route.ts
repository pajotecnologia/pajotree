import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const MAX_LOGO_DATA_URL_LENGTH = 2_800_000;
const ALLOWED_LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  whatsapp: z.string().optional(),
  segment: z.string().optional(),
  logoDataUrl: z.string().max(MAX_LOGO_DATA_URL_LENGTH, "A logomarca é muito grande").nullable().optional(),
  whiteLabelRef: z.string().optional(),
});

function validateLogoDataUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const match = value.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Logomarca inválida. Use PNG, JPG ou WebP.");
  }

  const mimeType = match[1] as (typeof ALLOWED_LOGO_MIME_TYPES)[number];
  const base64Payload = match[2];
  const estimatedBytes = Math.floor((base64Payload.length * 3) / 4) - (base64Payload.endsWith("==") ? 2 : base64Payload.endsWith("=") ? 1 : 0);

  if (!ALLOWED_LOGO_MIME_TYPES.includes(mimeType) || estimatedBytes > 2 * 1024 * 1024) {
    throw new Error("A logomarca deve ser PNG, JPG ou WebP e ter no máximo 2 MB.");
  }

  return value;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const RESERVED_SLUGS = [
  "admin", "app", "login", "register", "cadastro", "api", "go", "p",
  "planos", "pricing", "suporte", "terms", "privacy", "dashboard", "settings"
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, whatsapp, segment, whiteLabelRef } = parsed.data;
    const logoUrl = validateLogoDataUrl(parsed.data.logoDataUrl);

    // Identifica se o cadastro veio através de um parceiro White Label (via link de indicação ou domínio)
    let parentOrgId: string | null = null;
    let defaultPlan: any = null;

    if (whiteLabelRef) {
      const parentOrg = await db.organization.findFirst({
        where: {
          OR: [
            { id: whiteLabelRef },
            { name: { equals: whiteLabelRef, mode: "insensitive" } },
          ],
        },
        include: {
          customPlans: {
            where: { status: "ACTIVE" },
            orderBy: { priceMonthly: "asc" },
          },
        },
      });

      if (parentOrg) {
        parentOrgId = parentOrg.id;
        if (parentOrg.customPlans.length > 0) {
          defaultPlan = parentOrg.customPlans[0];
        }
      }
    }

    if (!defaultPlan) {
      const startPlan = await db.plan.findFirst({ where: { name: "START", organizationId: null } });
      const freePlan = await db.plan.findFirst({ where: { name: "FREE", organizationId: null } });
      defaultPlan = startPlan || freePlan;
    }

    let baseSlug = generateSlug(companyName);
    if (!baseSlug || RESERVED_SLUGS.includes(baseSlug)) {
      baseSlug = `empresa-${Date.now().toString().slice(-4)}`;
    }

    let slug = baseSlug;
    let counter = 1;
    while (await db.page.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const passwordHash = await hashPassword(password);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      });

      const org = await tx.organization.create({
        data: {
          name: companyName,
          email: email.toLowerCase(),
          whatsapp: whatsapp || null,
          segment: segment || "Serviços",
          logoUrl,
          status: "TRIAL",
          planId: defaultPlan?.id || null,
          whiteLabelParentId: parentOrgId,
        },
      });

      let adminRole = await tx.role.findFirst({
        where: { organizationId: org.id, name: "Administrador" },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            organizationId: org.id,
            name: "Administrador",
            description: "Acesso total à administração da empresa",
            isSystem: true,
          },
        });

        const allPermissions = await tx.permission.findMany();
        if (allPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: allPermissions.map((perm) => ({
              roleId: adminRole!.id,
              permissionId: perm.id,
            })),
          });
        }
      }

      await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });

      const defaultTheme = await tx.theme.findFirst({ where: { isGlobal: true } });

      const page = await tx.page.create({
        data: {
          organizationId: org.id,
          name: companyName,
          slug,
          title: `${companyName} | Links & Contato Oficial`,
          description: `Conecte-se conosco através dos nossos canais oficiais.`,
          status: "PUBLISHED",
          publishedAt: new Date(),
          settings: {
            create: {
              themeId: defaultTheme?.id || null,
              backgroundType: "gradient",
              backgroundValue: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
              primaryColor: "#6366f1",
              secondaryColor: "#ec4899",
              textColor: "#ffffff",
              buttonStyle: "rounded-xl",
              fontFamily: "Inter",
              layout: "classic",
            },
          },
        },
      });

      if (whatsapp) {
        const cleanPhone = whatsapp.replace(/\D/g, "");
        const fullPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`);
        const waLink = await tx.link.create({
          data: {
            organizationId: org.id,
            pageId: page.id,
            title: "Falar no WhatsApp",
            url: `https://wa.me/${fullPhone}`,
            icon: "whatsapp",
            position: 0,
            status: "ACTIVE",
            featured: true,
          },
        });

        await tx.shortLink.create({
          data: {
            organizationId: org.id,
            linkId: waLink.id,
            code: `wa-${Date.now().toString(36).slice(-5)}`,
            destinationUrl: waLink.url,
            status: "ACTIVE",
          },
        });
      }


      await tx.pipeline.create({
        data: {
          organizationId: org.id,
          name: "Funil de Vendas",
          isDefault: true,
          stages: {
            create: [
              { name: "Novo Lead", position: 0, color: "#3b82f6" },
              { name: "Contato Feito", position: 1, color: "#eab308" },
              { name: "Qualificado", position: 2, color: "#8b5cf6" },
              { name: "Proposta Enviada", position: 3, color: "#f97316" },
              { name: "Fechado / Ganho", position: 4, color: "#22c55e" },
            ],
          },
        },
      });

      if (defaultPlan) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + (defaultPlan.trialDays || 14));

        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: defaultPlan.id,
            status: "TRIAL",
            billingCycle: "monthly",
            trialStart: new Date(),
            trialEnd,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          },
        });
      }

      return { user, org, page };
    });

    await setSessionCookie({
      userId: result.user.id,
      email: result.user.email,
      isSuperAdmin: result.user.isSuperAdmin,
      activeOrganizationId: result.org.id,
    });

    await AuditService.log({
      organizationId: result.org.id,
      userId: result.user.id,
      action: "REGISTER",
      entity: "User",
      entityId: result.user.id,
      metadata: { companyName, email },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
      },
      pageSlug: result.page.slug,
    });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao processar cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
