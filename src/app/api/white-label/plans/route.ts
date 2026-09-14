import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";

const planFeatureSchema = z.object({
  maxPages: z.number().int().min(1).default(1),
  maxLinks: z.number().int().min(1).default(10),
  maxUsers: z.number().int().min(1).default(1),
  maxLeads: z.number().int().min(0).default(100),
  maxForms: z.number().int().min(0).default(1),
  maxWhatsappInstances: z.number().int().min(0).default(0),
  maxMetaPixels: z.number().int().min(0).default(1),
  maxAutomations: z.number().int().min(0).default(0),
  maxStorageMb: z.number().int().min(10).default(50),
  customDomainAllowed: z.boolean().default(false),
  crmAllowed: z.boolean().default(false),
  whatsappInboxAllowed: z.boolean().default(false),
  advancedAnalytics: z.boolean().default(false),
  removeBranding: z.boolean().default(false),
});

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(50),
  description: z.string().trim().max(255).optional().default(""),
  priceMonthly: z.number().min(0).default(0),
  priceYearly: z.number().min(0).default(0),
  trialDays: z.number().int().min(0).max(90).default(14),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  features: planFeatureSchema,
});

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const plans = await db.plan.findMany({
      where: { organizationId: orgId },
      include: {
        features: true,
        _count: {
          select: {
            organizations: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { priceMonthly: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Erro ao listar planos White Label:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const parsed = planSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados do plano inválidos" },
        { status: 400 }
      );
    }

    const { name, description, priceMonthly, priceYearly, trialDays, status, features } = parsed.data;
    const orgId = auth.organization.id;

    const plan = await db.plan.create({
      data: {
        organizationId: orgId,
        name,
        description: description || null,
        priceMonthly,
        priceYearly,
        trialDays,
        status,
        features: {
          create: features,
        },
      },
      include: { features: true },
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "CREATE_CUSTOM_PLAN",
      entity: "Plan",
      entityId: plan.id,
      metadata: { name, priceMonthly, priceYearly },
    });

    return NextResponse.json({ success: true, plan }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar plano White Label:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar plano" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const parsed = planSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json(
        { error: "ID do plano é obrigatório e dados devem ser válidos" },
        { status: 400 }
      );
    }

    const { id, name, description, priceMonthly, priceYearly, trialDays, status, features } = parsed.data;
    const orgId = auth.organization.id;

    const existing = await db.plan.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Plano não encontrado ou sem permissão" }, { status: 404 });
    }

    const plan = await db.$transaction(async (tx) => {
      const updatedPlan = await tx.plan.update({
        where: { id },
        data: {
          name,
          description: description || null,
          priceMonthly,
          priceYearly,
          trialDays,
          status,
        },
      });

      await tx.planFeature.upsert({
        where: { planId: id },
        create: {
          planId: id,
          ...features,
        },
        update: features,
      });

      return updatedPlan;
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "UPDATE_CUSTOM_PLAN",
      entity: "Plan",
      entityId: id,
      metadata: { name, priceMonthly, priceYearly },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error("Erro ao atualizar plano White Label:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar plano" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID do plano não informado" }, { status: 400 });
    }

    const orgId = auth.organization.id;
    const plan = await db.plan.findFirst({
      where: { id, organizationId: orgId },
      include: {
        _count: { select: { organizations: true } },
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    if (plan._count.organizations > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir um plano com clientes ativos vinculados. Desative o plano." },
        { status: 400 }
      );
    }

    await db.plan.delete({ where: { id } });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "DELETE_CUSTOM_PLAN",
      entity: "Plan",
      entityId: id,
      metadata: { name: plan.name },
    });

    return NextResponse.json({ success: true, message: "Plano excluído com sucesso" });
  } catch (error: any) {
    console.error("Erro ao excluir plano White Label:", error);
    return NextResponse.json({ error: error.message || "Erro ao excluir plano" }, { status: 500 });
  }
}
