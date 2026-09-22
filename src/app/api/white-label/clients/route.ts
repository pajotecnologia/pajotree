import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";
import { OrganizationStatus } from "@prisma/client";
import { z } from "zod";

const updateClientSchema = z.object({
  clientId: z.string().min(1, "ID do cliente é obrigatório"),
  name: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  tradeName: z.string().trim().optional().nullable(),
  document: z.string().trim().optional().nullable(),
  email: z.string().trim().email("E-mail da empresa inválido"),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "BLOCKED"]).default("ACTIVE"),
  planId: z.string().trim().optional().nullable(),
  adminUserId: z.string().trim().optional().nullable(),
  adminName: z.string().trim().min(2, "Nome do responsável é obrigatório").optional(),
  adminUsername: z.string().trim().min(3, "Login deve ter pelo menos 3 caracteres").regex(/^[a-zA-Z0-9._-]+$/, "Login deve conter apenas letras, números, ponto, hífen ou sublinhado").optional(),
  adminEmail: z.string().trim().email("E-mail de acesso inválido").optional(),
  adminPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres").optional().or(z.literal("")),
});

function clean(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const clients = await db.organization.findMany({
      where: { whiteLabelParentId: orgId },
      include: {
        plan: {
          select: { id: true, name: true, priceMonthly: true, priceYearly: true },
        },
        pages: {
          select: { id: true, slug: true, title: true, name: true, status: true },
          take: 5,
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true, status: true, lastLoginAt: true },
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            pages: true,
            links: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
    const trialClients = clients.filter((c) => c.status === "TRIAL").length;
    const monthlyRevenue = clients.reduce((acc, c) => {
      const price = Number(c.plan?.priceMonthly || 0);
      return acc + (c.status === "ACTIVE" ? price : 0);
    }, 0);

    return NextResponse.json({
      summary: {
        totalClients,
        activeClients,
        trialClients,
        monthlyRevenue,
      },
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        document: c.document,
        status: c.status,
        planId: c.planId || null,
        planName: c.plan?.name || "Sem Plano",
        planPrice: Number(c.plan?.priceMonthly || 0),
        subscriptionStatus: c.subscriptions[0]?.status || "TRIAL",
        usersCount: c.users.length,
        pagesCount: c._count.pages,
        pageSlug: c.pages[0]?.slug || null,
        pageTitle: c.pages[0]?.title || c.pages[0]?.name || null,
        pages: c.pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title || p.name,
          status: p.status,
        })),
        linksCount: c._count.links,
        leadsCount: c._count.leads,
        owner: c.users[0]?.user || null,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar clientes White Label:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();

    const parsed = updateClientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }

    const data = parsed.data;

    // Garante que o cliente pertence a esta agência White Label
    const clientOrg = await db.organization.findFirst({
      where: {
        id: data.clientId,
        ...(auth.isSuperAdmin ? {} : { whiteLabelParentId: orgId }),
      },
      include: {
        users: {
          include: { user: true, role: true },
        },
      },
    });

    if (!clientOrg) {
      return NextResponse.json({ error: "Cliente não encontrado ou você não tem permissão para editá-lo." }, { status: 404 });
    }

    // Se informou plano, valida se pertence à agência ou ao catálogo permitido
    let validPlanId: string | null = null;
    if (data.planId) {
      const plan = await db.plan.findFirst({
        where: {
          id: data.planId,
          OR: [
            { organizationId: orgId },
            ...(auth.isSuperAdmin ? [{ organizationId: null }] : []),
          ],
        },
      });

      if (!plan) {
        return NextResponse.json({ error: "O plano selecionado não pertence aos seus planos White Label." }, { status: 400 });
      }
      validPlanId = plan.id;
    }

    // Localiza o usuário administrador do cliente
    let targetUserId = data.adminUserId;
    if (!targetUserId && clientOrg.users && clientOrg.users.length > 0) {
      const adminRoleUser = clientOrg.users.find((u) => u.role?.name === "Administrador") || clientOrg.users[0];
      targetUserId = adminRoleUser?.userId;
    }

    let updatedUserData: { name?: string; username?: string; email?: string; passwordHash?: string } = {};

    if (data.adminName && data.adminName.trim()) {
      updatedUserData.name = data.adminName.trim();
    }

    if (data.adminUsername && data.adminUsername.trim()) {
      const cleanUsername = data.adminUsername.trim().toLowerCase();
      const existingWithUsername = await db.user.findFirst({
        where: {
          username: { equals: cleanUsername, mode: "insensitive" },
          ...(targetUserId ? { id: { not: targetUserId } } : {}),
        },
      });
      if (existingWithUsername) {
        return NextResponse.json({ error: "Este login/usuário já está em uso por outra conta." }, { status: 409 });
      }
      updatedUserData.username = cleanUsername;
    }

    if (data.adminEmail && data.adminEmail.trim()) {
      const cleanEmail = data.adminEmail.trim().toLowerCase();
      const existingWithEmail = await db.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          ...(targetUserId ? { id: { not: targetUserId } } : {}),
        },
      });
      if (existingWithEmail) {
        return NextResponse.json({ error: "Este e-mail já está em uso por outra conta." }, { status: 409 });
      }
      updatedUserData.email = cleanEmail;
    }

    if (data.adminPassword && data.adminPassword.trim().length >= 6) {
      updatedUserData.passwordHash = await hashPassword(data.adminPassword.trim());
    }

    const updated = await db.$transaction(async (tx) => {
      // 1. Atualiza a organização do cliente
      const organization = await tx.organization.update({
        where: { id: clientOrg.id },
        data: {
          name: data.name,
          tradeName: clean(data.tradeName),
          document: clean(data.document),
          email: data.email.trim().toLowerCase(),
          phone: clean(data.phone),
          whatsapp: clean(data.whatsapp),
          status: data.status as OrganizationStatus,
          planId: validPlanId,
        },
      });

      // 2. Se houver dados do usuário para atualizar
      let user = null;
      if (targetUserId && Object.keys(updatedUserData).length > 0) {
        user = await tx.user.update({
          where: { id: targetUserId },
          data: updatedUserData,
        });
      }

      // 3. Atualiza ou cria assinatura se plano foi alterado
      if (validPlanId && validPlanId !== clientOrg.planId) {
        const existingSub = await tx.subscription.findFirst({
          where: { organizationId: clientOrg.id },
          orderBy: { createdAt: "desc" },
        });

        if (existingSub) {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              planId: validPlanId,
              status: "ACTIVE",
            },
          });
        } else {
          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setMonth(periodEnd.getMonth() + 1);
          await tx.subscription.create({
            data: {
              organizationId: clientOrg.id,
              planId: validPlanId,
              status: "ACTIVE",
              billingCycle: "monthly",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });
        }
      }

      return { organization, user };
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "WHITELABEL_UPDATE_CLIENT",
      entity: "Organization",
      entityId: clientOrg.id,
      metadata: {
        name: updated.organization.name,
        targetUserId,
        planId: validPlanId,
        changedPassword: Boolean(data.adminPassword && data.adminPassword.trim().length >= 6),
      },
    });

    return NextResponse.json({
      success: true,
      client: updated.organization,
      user: updated.user,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar cliente White Label:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao salvar alterações" }, { status: 500 });
  }
}
