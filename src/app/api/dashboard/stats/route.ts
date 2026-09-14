import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;

    // Buscar Métricas Consolidadas
    const [
      totalPageViews,
      totalLinkClicks,
      totalLeads,
      totalCustomers,
      recentLeads,
      topLinks,
      opportunities,
      activePage,
    ] = await Promise.all([
      db.analyticsEvent.count({
        where: { organizationId: orgId, eventType: "PageView" },
      }),
      db.analyticsEvent.count({
        where: { organizationId: orgId, eventType: "LinkClick" },
      }),
      db.lead.count({
        where: { organizationId: orgId },
      }),
      db.customer.count({
        where: { organizationId: orgId },
      }),
      db.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.link.findMany({
        where: { organizationId: orgId, status: "ACTIVE" },
        include: {
          shortLinks: true,
          _count: {
            select: { analyticsEvents: true },
          },
        },
        orderBy: {
          analyticsEvents: {
            _count: "desc",
          },
        },
        take: 5,
      }),
      db.opportunity.findMany({
        where: { organizationId: orgId },
        include: {
          stage: true,
          lead: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.page.findFirst({
        where: { organizationId: orgId, status: "PUBLISHED" },
      }),
    ]);

    // Calcular Taxa de Conversão (Leads / PageViews)
    const conversionRate = totalPageViews > 0 ? ((totalLeads / totalPageViews) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      metrics: {
        pageViews: totalPageViews,
        linkClicks: totalLinkClicks,
        leads: totalLeads,
        customers: totalCustomers,
        conversionRate: `${conversionRate}%`,
      },
      pageSlug: activePage?.slug || "minha-empresa",
      recentLeads,
      topLinks: topLinks.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        shortCode: l.shortLinks[0]?.code,
        clicks: l._count.analyticsEvents,
      })),
      opportunities,
    });
  } catch (error: any) {
    console.error("Erro ao carregar estatísticas do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar métricas" },
      { status: 500 }
    );
  }
}
