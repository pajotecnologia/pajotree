import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Administrador" }, { status: 403 });
    }

    const [
      totalOrgs,
      activeOrgs,
      trialOrgs,
      suspendedOrgs,
      totalUsers,
      totalLeads,
      totalLinks,
      totalWhatsapp,
      activeSubscriptions,
      recentAuditLogs,
    ] = await Promise.all([
      db.organization.count(),
      db.organization.count({ where: { status: "ACTIVE" } }),
      db.organization.count({ where: { status: "TRIAL" } }),
      db.organization.count({ where: { status: "SUSPENDED" } }),
      db.user.count(),
      db.lead.count(),
      db.link.count(),
      db.whatsappInstance.count({ where: { status: "CONNECTED" } }),
      db.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
      db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: true, organization: true },
      }),
    ]);

    // Calcular MRR (Monthly Recurring Revenue)
    let mrr = 0;
    activeSubscriptions.forEach((sub) => {
      const price = Number(sub.plan.priceMonthly || 0);
      mrr += price;
    });

    const arr = mrr * 12;

    return NextResponse.json({
      metrics: {
        totalOrgs,
        activeOrgs,
        trialOrgs,
        suspendedOrgs,
        totalUsers,
        totalLeads,
        totalLinks,
        totalWhatsapp,
        mrr: `R$ ${mrr.toFixed(2).replace(".", ",")}`,
        arr: `R$ ${arr.toFixed(2).replace(".", ",")}`,
      },
      recentAuditLogs,
    });
  } catch (error: any) {
    console.error("Erro nas métricas admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
