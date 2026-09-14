import { NextRequest, NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.organization) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const orgId = auth.organization.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";

    let dateFilter = new Date();
    if (range === "today") {
      dateFilter.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (range === "90d") {
      dateFilter.setDate(dateFilter.getDate() - 90);
    } else {
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    const events = await db.analyticsEvent.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: dateFilter },
      },
      include: {
        link: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Agregações
    let pageViews = 0;
    let linkClicks = 0;
    let leads = 0;
    const uniqueVisitors = new Set<string>();
    const deviceMap: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    const sourceMap: Record<string, number> = {};

    events.forEach((ev) => {
      if (ev.eventType === "PageView") pageViews++;
      if (ev.eventType === "LinkClick") linkClicks++;
      if (ev.eventType === "Lead") leads++;
      if (ev.ipHash) uniqueVisitors.add(ev.ipHash);

      const dev = (ev.deviceType || "desktop").toLowerCase();
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;

      const src = ev.utmSource || ev.referrer || "Direto / Orgânico";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const conversionRate = pageViews > 0 ? ((leads / pageViews) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      summary: {
        pageViews,
        linkClicks,
        leads,
        uniqueVisitors: uniqueVisitors.size,
        conversionRate: `${conversionRate}%`,
      },
      devices: Object.entries(deviceMap).map(([name, value]) => ({ name, value })),
      sources: Object.entries(sourceMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
    });
  } catch (error: any) {
    console.error("Erro no analytics API:", error);
    return NextResponse.json({ error: "Erro ao buscar métricas" }, { status: 500 });
  }
}
