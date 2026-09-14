import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const plans = await db.plan.findMany({
      include: { features: true, _count: { select: { organizations: true } } },
      orderBy: { priceMonthly: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Erro ao listar planos admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const body = await request.json();
    const { id, priceMonthly, priceYearly, description, features } = body;

    const updatedPlan = await db.plan.update({
      where: { id },
      data: {
        priceMonthly: priceMonthly !== undefined ? priceMonthly : undefined,
        priceYearly: priceYearly !== undefined ? priceYearly : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    if (features) {
      await db.planFeature.updateMany({
        where: { planId: id },
        data: features,
      });
    }

    await AuditService.log({
      userId: auth.user.id,
      action: "ADMIN_UPDATE_PLAN",
      entity: "Plan",
      entityId: id,
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error: any) {
    console.error("Erro ao atualizar plano admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
