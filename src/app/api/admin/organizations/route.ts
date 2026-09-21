import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";
import { OrganizationStatus } from "@prisma/client";
import { z } from "zod";

const organizationSchema = z.object({
  name: z.string().trim().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  legalName: z.string().trim().optional().nullable(),
  tradeName: z.string().trim().optional().nullable(),
  document: z.string().trim().optional().nullable(),
  email: z.string().trim().email("E-mail da empresa inválido"),
  phone: z.string().trim().optional().nullable(),
  whatsapp: z.string().trim().optional().nullable(),
  website: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
  segment: z.string().trim().optional().nullable(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "BLOCKED"]).default("TRIAL"),
  planId: z.string().trim().optional().nullable(),
  isWhiteLabel: z.boolean().optional().default(false),
  address: z.object({
    zipCode: z.string().trim().optional().nullable(),
    street: z.string().trim().optional().nullable(),
    number: z.string().trim().optional().nullable(),
    complement: z.string().trim().optional().nullable(),
    neighborhood: z.string().trim().optional().nullable(),
    city: z.string().trim().optional().nullable(),
    state: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable(),
  }).optional(),
});

const createSchema = organizationSchema.extend({
  adminName: z.string().trim().min(2, "Nome do administrador é obrigatório"),
  adminUsername: z.string().trim().min(3, "Login do administrador deve ter pelo menos 3 caracteres").regex(/^[a-zA-Z0-9._-]+$/, "Login deve conter apenas letras, números, ponto, hífen ou sublinhado").optional(),
  adminEmail: z.string().trim().email("E-mail do administrador inválido"),
  adminPassword: z.string().min(6, "Senha do administrador deve ter pelo menos 6 caracteres"),
});

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

import { ensureDatabaseSchema } from "@/lib/db-migrate";

async function requireSuperAdmin() {
  const auth = await getCurrentAuthContext();
  if (!auth || !auth.isSuperAdmin) return null;
  return auth;
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    try {
      await ensureDatabaseSchema();
    } catch {
      // Non-blocking
    }

    let organizations = [];
    try {
      organizations = await db.organization.findMany({
        include: {
          plan: true,
          addresses: true,
          whiteLabelParent: { select: { id: true, name: true } },
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                  status: true,
                  createdAt: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              users: true,
              leads: true,
              links: true,
              whiteLabelClients: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (queryErr) {
      console.warn("Aviso ao listar organizações completas, usando query simplificada:", queryErr);
      organizations = await db.organization.findMany({
        include: {
          plan: true,
          addresses: true,
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  email: true,
                  status: true,
                },
              },
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    // MASTER é um plano interno do Super Admin e nunca deve ser atribuído a empresas.
    let plans: any[] = [];
    try {
      plans = await db.plan.findMany({
        where: { name: { not: "MASTER" } },
        orderBy: { priceMonthly: "asc" },
      });
    } catch (planErr) {
      console.warn("Aviso ao listar planos para empresas:", planErr);
    }

    return NextResponse.json({ organizations, plans });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao listar organizações admin:", error);
    return NextResponse.json({ error: `Erro ao carregar empresas: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const adminEmail = data.adminEmail.toLowerCase();
    const adminUsername = (data.adminUsername || adminEmail.split("@")[0] || data.adminName.replace(/[^a-zA-Z0-9]/g, "")).toLowerCase().trim();

    const [existingOrg, existingUser, existingUsernameUser, plan] = await Promise.all([
      db.organization.findFirst({ where: { email } }),
      db.user.findUnique({ where: { email: adminEmail } }),
      db.user.findFirst({ where: { username: { equals: adminUsername, mode: "insensitive" } } }),
      data.planId ? db.plan.findUnique({ where: { id: data.planId } }) : Promise.resolve(null),
    ]);

    if (existingOrg) {
      return NextResponse.json({ error: "Já existe uma empresa cadastrada com este e-mail." }, { status: 409 });
    }
    if (existingUser) {
      return NextResponse.json({ error: "O e-mail do administrador já está cadastrado na plataforma." }, { status: 409 });
    }
    if (existingUsernameUser) {
      return NextResponse.json({ error: "O usuário/login do administrador já está em uso na plataforma." }, { status: 409 });
    }
    if (data.planId && (!plan || plan.name === "MASTER")) {
      return NextResponse.json({ error: "Plano inválido para uma empresa." }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.adminPassword);

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.adminName,
          username: adminUsername,
          email: adminEmail,
          passwordHash,
          status: "ACTIVE",
        },
      });

      const org = await tx.organization.create({
        data: {
          name: data.name,
          legalName: clean(data.legalName),
          tradeName: clean(data.tradeName),
          document: clean(data.document),
          email,
          phone: clean(data.phone),
          whatsapp: clean(data.whatsapp),
          website: clean(data.website),
          description: clean(data.description),
          segment: clean(data.segment),
          status: data.status as OrganizationStatus,
          planId: plan?.id || null,
          addresses: data.address
            ? { create: { ...Object.fromEntries(Object.entries(data.address).map(([key, value]) => [key, clean(value)])) } }
            : undefined,
        },
      });

      const adminRole = await tx.role.create({
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
          data: allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
        });
      }

      await tx.organizationUser.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: adminRole.id,
          status: "ACTIVE",
        },
      });

      if (plan) {
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: plan.id,
            status: "ACTIVE",
            billingCycle: "monthly",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }

      return { org, user };
    });

    await AuditService.log({
      organizationId: result.org.id,
      userId: auth.user.id,
      action: "ADMIN_CREATE_ORGANIZATION",
      entity: "Organization",
      entityId: result.org.id,
      metadata: { name: result.org.name, adminUserId: result.user.id, planId: data.planId || null },
    });

    return NextResponse.json({
      success: true,
      organization: result.org,
      adminUser: { id: result.user.id, name: result.user.name, username: result.user.username, email: result.user.email },
    }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar empresa admin:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const body = await request.json();
    const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
    if (!organizationId) {
      return NextResponse.json({ error: "Empresa não informada" }, { status: 400 });
    }

    const parsed = organizationSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dados inválidos" }, { status: 400 });
    }

    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: { users: { include: { user: true } } },
    });
    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    if (parsed.data.planId) {
      const plan = await db.plan.findUnique({ where: { id: parsed.data.planId } });
      if (!plan || plan.name === "MASTER") {
        return NextResponse.json({ error: "Plano inválido para uma empresa." }, { status: 400 });
      }
    }

    const {
      address,
      adminUserId,
      adminUsername,
      adminEmail,
      adminName,
      adminPassword,
    } = body;

    // Se foram enviados dados para atualizar o usuário admin da empresa
    let targetUserId = adminUserId;
    if (!targetUserId && org.users.length > 0) {
      targetUserId = org.users[0]?.userId;
    }

    let updatedUserData: { name?: string; username?: string; email?: string; passwordHash?: string } = {};

    if (targetUserId) {
      if (adminName && adminName.trim()) {
        updatedUserData.name = adminName.trim();
      }

      if (adminUsername && adminUsername.trim()) {
        const cleanUsername = adminUsername.trim().toLowerCase();
        const existingWithUsername = await db.user.findFirst({
          where: {
            username: { equals: cleanUsername, mode: "insensitive" },
            id: { not: targetUserId },
          },
        });
        if (existingWithUsername) {
          return NextResponse.json({ error: "Este login/usuário já está em uso por outra conta." }, { status: 409 });
        }
        updatedUserData.username = cleanUsername;
      }

      if (adminEmail && adminEmail.trim()) {
        const cleanEmail = adminEmail.trim().toLowerCase();
        const existingWithEmail = await db.user.findFirst({
          where: {
            email: { equals: cleanEmail, mode: "insensitive" },
            id: { not: targetUserId },
          },
        });
        if (existingWithEmail) {
          return NextResponse.json({ error: "Este e-mail já está em uso por outra conta." }, { status: 409 });
        }
        updatedUserData.email = cleanEmail;
      }

      if (adminPassword && adminPassword.trim().length > 0) {
        if (adminPassword.trim().length < 6) {
          return NextResponse.json({ error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
        }
        updatedUserData.passwordHash = await hashPassword(adminPassword.trim());
      }
    }

    const fields = parsed.data;
    const { address: addrField, ...orgFields } = fields;

    const updated = await db.$transaction(async (tx) => {
      // Atualiza os dados da organização
      const organization = await tx.organization.update({
        where: { id: organizationId },
        data: {
          ...Object.fromEntries(
            Object.entries(orgFields).map(([key, value]) => [
              key,
              key === "status" ? value : clean(value as string | null | undefined),
            ])
          ),
          ...(address !== undefined
            ? {
                addresses: {
                  deleteMany: {},
                  ...(address
                    ? {
                        create: {
                          ...Object.fromEntries(
                            Object.entries(address).map(([key, value]) => [key, clean(value as string | null | undefined)])
                          ),
                        },
                      }
                    : {}),
                },
              }
            : {}),
        },
        include: { plan: true, addresses: true },
      });

      // Atualiza os dados do usuário administrador se aplicável
      if (targetUserId && Object.keys(updatedUserData).length > 0) {
        await tx.user.update({
          where: { id: targetUserId },
          data: updatedUserData,
        });
      }

      return organization;
    });

    await AuditService.log({
      organizationId,
      userId: auth.user.id,
      action: "ADMIN_UPDATE_ORGANIZATION",
      entity: "Organization",
      entityId: organizationId,
      metadata: {
        fields: Object.keys(parsed.data),
        userUpdated: targetUserId ? Object.keys(updatedUserData) : [],
      },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error("Erro ao atualizar empresa admin:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 });
  }
}
