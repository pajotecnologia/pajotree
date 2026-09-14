import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  companyName: z.string().min(2, "Nome da empresa obrigatório"),
  whatsapp: z.string().optional(),
  segment: z.string().optional(),
});

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

    const { name, email, password, companyName, whatsapp, segment } = parsed.data;

    // 1. Verificar se o e-mail já existe
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado na plataforma." },
        { status: 409 }
      );
    }

    // 2. Hash da senha
    const passwordHash = await hashPassword(password);

    // 3. Buscar plano inicial (START com 14 dias de Trial ou FREE)
    const startPlan = await db.plan.findUnique({
      where: { name: "START" },
    });
    const freePlan = await db.plan.findUnique({
      where: { name: "FREE" },
    });
    const defaultPlan = startPlan || freePlan;

    // 4. Gerar slug único para a página pública
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

    // 5. Transação atômica para criação de Usuário + Organização + Permissões + Página Inicial + Assinatura
    const result = await db.$transaction(async (tx) => {
      // Criação do Usuário
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      });

      // Criação da Organização
      const org = await tx.organization.create({
        data: {
          name: companyName,
          email: email.toLowerCase(),
          whatsapp: whatsapp || null,
          segment: segment || "Serviços",
          status: "TRIAL",
          planId: defaultPlan?.id || null,
        },
      });

      // Role Administrador padrão para o criador
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

        // Vincular todas as permissões existentes
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

      // Vincular Usuário à Organização com a Role Admin
      await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });

      // Criar Página Pública inicial com Tema Padrão
      const defaultTheme = await tx.theme.findFirst({
        where: { isGlobal: true },
      });

      const page = await tx.page.create({
        data: {
          organizationId: org.id,
          name: companyName,
          slug: slug,
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

      // Criar 2 blocos/links de exemplo
      if (whatsapp) {
        const cleanPhone = whatsapp.replace(/\D/g, "");
        const waLink = await tx.link.create({
          data: {
            organizationId: org.id,
            pageId: page.id,
            title: "Falar no WhatsApp",
            url: `https://wa.me/${cleanPhone}`,
            icon: "whatsapp",
            position: 0,
            status: "ACTIVE",
            featured: true,
          },
        });

        // Criar ShortLink
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

      // Criar Pipeline CRM Padrão
      const pipeline = await tx.pipeline.create({
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

      // Criar Assinatura Trial (14 dias)
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
            trialEnd: trialEnd,
            currentPeriodStart: new Date(),
            currentPeriodEnd: trialEnd,
          },
        });
      }

      return { user, org, page };
    });

    // 6. Criar Sessão e Cookie HttpOnly
    await setSessionCookie({
      userId: result.user.id,
      email: result.user.email,
      isSuperAdmin: result.user.isSuperAdmin,
      activeOrganizationId: result.org.id,
    });

    // 7. Registrar Auditoria
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
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: error.message || "Falha ao processar cadastro. Tente novamente." },
      { status: 500 }
    );
  }
}
