import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuditService } from "@/server/services/audit.service";
import { OrganizationStatus } from "@prisma/client";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    const organizations = await db.organization.findMany({
      include: {
        plan: true,
        _count: {
          select: {
            users: true,
            leads: true,
            links: true,
            whatsappInstances: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const plans = await db.plan.findMany({ orderBy: { priceMonthly: "asc" } });

    return NextResponse.json({ organizations, plans });
  } catch (error: any) {
    console.error("Erro ao listar organizações admin:", error);
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
    const { organizationId, status, planId } = body;

    const org = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const updated = await db.organization.update({
      where: { id: organizationId },
      data: {
        status: status ? (status as OrganizationStatus) : org.status,
        planId: planId !== undefined ? planId : org.planId,
      },
      include: { plan: true },
    });

    await AuditService.log({
      organizationId,
      userId: auth.user.id,
      action: "ADMIN_UPDATE_ORGANIZATION",
      entity: "Organization",
      entityId: organizationId,
      metadata: { status, planId },
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar empresa admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
