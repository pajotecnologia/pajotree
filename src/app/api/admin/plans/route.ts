import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";

const featureSchema = z.object({
  maxPages: z.number().int().min(0),
  maxLinks: z.number().int().min(0),
  maxUsers: z.number().int().min(0),
  maxLeads: z.number().int().min(0),
  maxForms: z.number().int().min(0),
  maxMetaPixels: z.number().int().min(0),
  maxAutomations: z.number().int().min(0),
  maxStorageMb: z.number().int().min(0),
  customDomainAllowed: z.boolean(),
  crmAllowed: z.boolean(),
  advancedAnalytics: z.boolean(),
  removeBranding: z.boolean(),
});

type FeatureData = z.infer<typeof featureSchema>;

const planBaseSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(500).nullable().optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  trialDays: z.number().int().min(0).max(365),
  features: featureSchema,
});

const updateSchema = planBaseSchema.partial().extend({
  id: z.string().min(1),
});

const duplicateSchema = z.object({
  action: z.literal("duplicate"),
  id: z.string().min(1),
  name: z.string().trim().min(2).max(60),
});

async function requireSuperAdmin() {
  const auth = await getCurrentAuthContext();
  if (!auth || !auth.isSuperAdmin) return null;
  return auth;
}

function normalizePlan<T extends { features: unknown }>(plan: T) {
  const features = Array.isArray(plan.features) ? plan.features[0] ?? null : plan.features;
  return { ...plan, features };
}

function getFirstFeature(features: unknown): FeatureData | null {
  if (!features) return null;
  if (Array.isArray(features)) return getFirstFeature(features[0]);
  if (typeof features !== "object") return null;

  const candidate = features as Record<string, unknown>;
  const parsed = featureSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

import { ensureDatabaseSchema } from "@/lib/db-migrate";

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

    let plans = [];
    try {
      plans = await db.plan.findMany({
        include: { features: true, _count: { select: { organizations: true } } },
        orderBy: [{ priceMonthly: "asc" }, { name: "asc" }],
      });
    } catch (queryErr) {
      console.warn("Aviso ao listar planos completos, usando fallback:", queryErr);
      plans = await db.plan.findMany({
        include: { features: true },
        orderBy: [{ priceMonthly: "asc" }, { name: "asc" }],
      });
    }

    return NextResponse.json({ plans: plans.map(normalizePlan) });
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro ao listar planos admin:", error);
    return NextResponse.json({ error: `Erro ao carregar planos: ${msg}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const body = await request.json();
    const duplicate = duplicateSchema.safeParse(body);

    if (duplicate.success) {
      const source = await db.plan.findUnique({
        where: { id: duplicate.data.id },
        include: { features: true },
      });

      if (!source) {
        return NextResponse.json({ error: "Plano de origem não encontrado" }, { status: 404 });
      }

      const sourceFeature = getFirstFeature(source.features);
      const exists = await db.plan.findFirst({ where: { name: duplicate.data.name, organizationId: null } });
      if (exists) {
        return NextResponse.json({ error: "Já existe um plano com este nome" }, { status: 409 });
      }

      const created = await db.plan.create({
        data: {
          name: duplicate.data.name,
          description: source.description,
          priceMonthly: source.priceMonthly,
          priceYearly: source.priceYearly,
          trialDays: source.trialDays,
          features: sourceFeature
            ? {
                create: sourceFeature,
              }
            : undefined,
        },
        include: { features: true },
      });

      await AuditService.log({
        userId: auth.user.id,
        action: "ADMIN_DUPLICATE_PLAN",
        entity: "Plan",
        entityId: created.id,
        metadata: { sourcePlanId: source.id, name: created.name },
      });

      return NextResponse.json({ success: true, plan: normalizePlan(created) }, { status: 201 });
    }

    const parsed = planBaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados do plano inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const exists = await db.plan.findFirst({ where: { name: parsed.data.name, organizationId: null } });
    if (exists) {
      return NextResponse.json({ error: "Já existe um plano com este nome" }, { status: 409 });
    }

    const created = await db.plan.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        priceMonthly: parsed.data.priceMonthly,
        priceYearly: parsed.data.priceYearly,
        trialDays: parsed.data.trialDays,
        features: { create: parsed.data.features },
      },
      include: { features: true },
    });

    await AuditService.log({
      userId: auth.user.id,
      action: "ADMIN_CREATE_PLAN",
      entity: "Plan",
      entityId: created.id,
      metadata: { name: created.name },
    });

    return NextResponse.json({ success: true, plan: normalizePlan(created) }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar/duplicar plano admin:", error);
    return NextResponse.json({ error: "Erro interno ao salvar plano" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados do plano inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { id, features, ...planData } = parsed.data;
    const existing = await db.plan.findUnique({ where: { id }, include: { features: true } });
    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    if (planData.name && planData.name !== existing.name) {
      const nameConflict = await db.plan.findFirst({ where: { name: planData.name, organizationId: null } });
      if (nameConflict && nameConflict.id !== id) {
        return NextResponse.json({ error: "Já existe um plano com este nome" }, { status: 409 });
      }
    }

    const updated = await db.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id },
        data: planData,
      });

      if (features) {
        if (existing.features[0]) {
          await tx.planFeature.update({ where: { planId: id }, data: features });
        } else {
          await tx.planFeature.create({ data: { planId: id, ...features } });
        }
      }

      return tx.plan.findUnique({
        where: { id },
        include: { features: true, _count: { select: { organizations: true } } },
      });
    });

    await AuditService.log({
      userId: auth.user.id,
      action: "ADMIN_UPDATE_PLAN",
      entity: "Plan",
      entityId: id,
      metadata: { changedFields: Object.keys(parsed.data).filter((key) => key !== "id") },
    });

    return NextResponse.json({ success: true, plan: updated ? normalizePlan(updated) : null });
  } catch (error) {
    console.error("Erro ao atualizar plano admin:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar plano" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID do plano é obrigatório" }, { status: 400 });

    const plan = await db.plan.findUnique({
      where: { id },
      include: { _count: { select: { organizations: true, subscriptions: true } } },
    });

    if (!plan) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });

    if (plan._count.organizations > 0 || plan._count.subscriptions > 0) {
      return NextResponse.json(
        { error: "Este plano não pode ser excluído porque possui empresas ou assinaturas vinculadas. Duplique-o ou edite-o para reaproveitar sua configuração.", counts: plan._count },
        { status: 409 }
      );
    }

    await db.plan.delete({ where: { id } });

    await AuditService.log({
      userId: auth.user.id,
      action: "ADMIN_DELETE_PLAN",
      entity: "Plan",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir plano admin:", error);
    return NextResponse.json({ error: "Erro interno ao excluir plano" }, { status: 500 });
  }
}
