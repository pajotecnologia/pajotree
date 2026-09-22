import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";
import { AuditService } from "@/server/services/audit.service";

const changePlanSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    let parentId = auth.organization.whiteLabelParentId;

    // Se parentId não estiver preenchido diretamente, verifica se a requisição veio de um domínio White Label
    if (!parentId) {
      const hostHeader = request.headers.get("x-custom-host") || request.headers.get("host") || "";
      const cleanHost = hostHeader.split(":")[0].toLowerCase().trim();
      const defaultHost = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/https?:\/\//, "").split(":")[0].toLowerCase().trim();

      if (cleanHost && cleanHost !== defaultHost && cleanHost !== "localhost" && !cleanHost.includes("pajotech.com.br") && !cleanHost.includes("pajotree")) {
        const wlOrg = await db.organization.findFirst({
          where: {
            OR: [
              { whiteLabelDomain: { equals: cleanHost, mode: "insensitive" } },
              { domains: { some: { domain: { equals: cleanHost, mode: "insensitive" } } } },
            ],
          },
        });

        if (wlOrg && wlOrg.id !== orgId) {
          parentId = wlOrg.id;
          try {
            await db.organization.update({
              where: { id: orgId },
              data: { whiteLabelParentId: wlOrg.id },
            });
          } catch {
            // Non-blocking
          }
        }
      }
    }

    const [planAndUsage, allPlans, subscription] = await Promise.all([
      PlanLimitService.getPlanAndUsage(orgId),
      db.plan.findMany({
        where: parentId
          ? { organizationId: parentId, status: { not: "INACTIVE" } }
          : { organizationId: null, status: "ACTIVE", name: { not: "MASTER" } },
        include: { features: true },
        orderBy: { priceMonthly: "asc" },
      }),
      db.subscription.findFirst({
        where: { organizationId: orgId },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const isWhiteLabelClient = Boolean(parentId);

    return NextResponse.json({
      planAndUsage,
      allPlans,
      subscription,
      isSuperAdmin: auth.isSuperAdmin,
      isWhiteLabelClient,
      whiteLabelParentName: auth.organization.whiteLabelParent?.tradeName || auth.organization.whiteLabelParent?.name || null,
    });
  } catch (error) {
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

    const body = await request.json();

    // Check if user requested Banco Inter Bolepix generation
    if (body.action === "emit_bolepix") {
      const { planId, billingCycle, pagador } = body;
      const orgId = auth.organization.id;

      const targetPlan = await db.plan.findUnique({
        where: { id: planId },
        include: { features: true },
      });

      if (!targetPlan) {
        return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
      }

      const price = Number(billingCycle === "yearly" ? targetPlan.priceYearly : targetPlan.priceMonthly);
      if (price <= 0) {
        return NextResponse.json({ error: "Plano gratuito não gera cobrança." }, { status: 400 });
      }

      // 1. Cria o registro de pagamento pendente
      const payment = await db.payment.create({
        data: {
          organizationId: orgId,
          amount: price,
          status: "PENDING",
          provider: "banco_inter",
          paymentMethod: "bolepix",
        },
      });

      try {
        const { emitirBolepixInter } = await import("@/lib/banco-inter");
        const bolepix = await emitirBolepixInter({
          identifier: payment.id,
          valor: price,
          organizationId: orgId,
          dataVencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          pagador: {
            nome: pagador?.nome || auth.organization.name,
            cpfCnpj: pagador?.cpfCnpj || auth.organization.document || "00000000000",
            email: pagador?.email || auth.organization.email,
            telefone: pagador?.telefone || auth.organization.phone || undefined,
            endereco: pagador?.endereco || undefined,
            cidade: pagador?.cidade || undefined,
            uf: pagador?.uf || undefined,
            cep: pagador?.cep || undefined,
          },
          mensagem1: `Upgrade para Plano ${targetPlan.name}`,
          mensagem2: `Assinatura - Ciclo ${billingCycle === "yearly" ? "Anual" : "Mensal"}`,
        });

        await db.payment.update({
          where: { id: payment.id },
          data: {
            externalId: bolepix.codigoSolicitacao,
          },
        });

        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          bolepix,
          pdfUrl: `/api/banco-inter/pdf?paymentId=${payment.id}`,
        });
      } catch (interError: any) {
        console.error("Erro emissão Banco Inter:", interError);
        return NextResponse.json({
          error: `Erro ao emitir cobrança Banco Inter: ${interError.message || "Verifique as credenciais no Painel Mestre."}`,
        }, { status: 400 });
      }
    }

    const parsed = changePlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados do upgrade inválidos" }, { status: 400 });
    }

    const { planId, billingCycle } = parsed.data;
    const orgId = auth.organization.id;

    const [targetPlan, currentPlan] = await Promise.all([
      db.plan.findUnique({
        where: { id: planId },
        include: { features: true },
      }),
      auth.organization.planId
        ? db.plan.findUnique({ where: { id: auth.organization.planId } })
        : null,
    ]);

    if (!targetPlan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
    }

    if (currentPlan?.id === targetPlan.id) {
      return NextResponse.json({ error: "Este já é o plano atual" }, { status: 400 });
    }

    const currentPrice = currentPlan
      ? Number(billingCycle === "yearly" ? currentPlan.priceYearly : currentPlan.priceMonthly)
      : 0;
    const targetPrice = Number(
      billingCycle === "yearly" ? targetPlan.priceYearly : targetPlan.priceMonthly
    );

    if (currentPlan && targetPrice <= currentPrice) {
      return NextResponse.json(
        { error: "Esta ação permite apenas upgrade para um plano superior." },
        { status: 400 }
      );
    }

    const now = new Date();
    const nextPeriod = new Date(now);
    nextPeriod.setDate(nextPeriod.getDate() + (billingCycle === "yearly" ? 365 : 30));

    const subscription = await db.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: orgId },
        data: {
          planId: targetPlan.id,
          status: "ACTIVE",
        },
      });

      const createdSubscription = await tx.subscription.create({
        data: {
          organizationId: orgId,
          planId: targetPlan.id,
          status: "ACTIVE",
          billingCycle,
          currentPeriodStart: now,
          currentPeriodEnd: nextPeriod,
        },
      });

      if (targetPrice > 0) {
        await tx.payment.create({
          data: {
            organizationId: orgId,
            subscriptionId: createdSubscription.id,
            amount: billingCycle === "yearly" ? targetPlan.priceYearly : targetPlan.priceMonthly,
            status: "PAID",
            provider: "mercadopago",
          },
        });
      }

      return createdSubscription;
    });

    await AuditService.log({
      organizationId: orgId,
      userId: auth.user.id,
      action: "CHANGE_PLAN",
      entity: "Plan",
      entityId: targetPlan.id,
      metadata: {
        planName: targetPlan.name,
        billingCycle,
        previousPlanId: currentPlan?.id || null,
        upgrade: true,
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Erro ao alterar plano:", error);
    return NextResponse.json({ error: "Erro ao processar upgrade" }, { status: 500 });
  }
}
