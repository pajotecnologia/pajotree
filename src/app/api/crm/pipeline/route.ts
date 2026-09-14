import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlanLimitService } from "@/server/services/plan-limit.service";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    // Verificar se o plano permite CRM
    try {
      await PlanLimitService.assertFeatureEnabled(orgId, "crm");
    } catch (e: any) {
      return NextResponse.json(
        { error: e.message, crmLocked: true },
        { status: 403 }
      );
    }

    let pipeline = await db.pipeline.findFirst({
      where: { organizationId: orgId, isDefault: true },
      include: {
        stages: {
          orderBy: { position: "asc" },
          include: {
            opportunities: {
              include: {
                lead: true,
                customer: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!pipeline) {
      // Criar pipeline padrão se ainda não existir
      pipeline = await db.pipeline.create({
        data: {
          organizationId: orgId,
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
        include: {
          stages: {
            include: {
              opportunities: {
                include: { lead: true, customer: true },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({ pipeline });
  } catch (error: any) {
    console.error("Erro ao buscar pipeline CRM:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { opportunityId, newStageId } = body;

    const opp = await db.opportunity.findFirst({
      where: { id: opportunityId, organizationId: auth.organization.id },
    });

    if (!opp) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 });
    }

    const updated = await db.opportunity.update({
      where: { id: opportunityId },
      data: { stageId: newStageId },
      include: { stage: true, lead: true },
    });

    // Registrar log de atividade
    await db.activityLog.create({
      data: {
        opportunityId: opp.id,
        userId: auth.user.id,
        type: "stage_change",
        content: `Oportunidade movida para a etapa: ${updated.stage.name}`,
      },
    });

    return NextResponse.json({ success: true, opportunity: updated });
  } catch (error: any) {
    console.error("Erro ao mover oportunidade:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
