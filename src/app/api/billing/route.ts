import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    const [planAndUsage, allPlans, subscription] = await Promise.all([
      PlanLimitService.getPlanAndUsage(orgId),
      db.plan.findMany({
        include: { features: true },
        orderBy: { priceMonthly: "asc" },
      }),
      db.subscription.findFirst({
        where: { organizationId: orgId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      planAndUsage,
      allPlans,
      subscription,
    });
  } catch (error: any) {
    console.error("Erro ao obter dados de faturamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const body = await request.json();
    const { planId, billingCycle } = body;

    const targetPlan = await db.plan.findUnique({
      where: { id: planId },
      include: { features: true },
    });

    if (!targetPlan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    // 1. Atualizar Organização
    await db.organization.update({
      where: { id: orgId },
      data: {
        planId: targetPlan.id,
        status: "ACTIVE",
      },
    });

    // 2. Criar Assinatura Ativa
    const nextPeriod = new Date();
    nextPeriod.setDate(nextPeriod.getDate() + (billingCycle === "yearly" ? 365 : 30));

    const subscription = await db.subscription.create({
      data: {
        organizationId: orgId,
        planId: targetPlan.id,
        status: "ACTIVE",
        billingCycle: billingCycle || "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextPeriod,
      },
    });

    // 3. Registrar Pagamento Simulado
    const amount = billingCycle === "yearly" ? targetPlan.priceYearly : targetPlan.priceMonthly;
    if (Number(amount) > 0) {
      await db.payment.create({
        data: {
          organizationId: orgId,
          subscriptionId: subscription.id,
          amount,
          status: "PAID",
          provider: "mercadopago",
        },
      });
    }

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "CHANGE_PLAN",
      entity: "Plan",
      entityId: targetPlan.id,
      metadata: { planName: targetPlan.name, billingCycle },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error("Erro ao alterar plano:", error);
    return NextResponse.json({ error: "Erro ao processar assinatura" }, { status: 500 });
  }
}
