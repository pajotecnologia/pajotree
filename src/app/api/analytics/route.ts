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
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");

    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (range === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0);
      endDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59);
    } else if (range === "7d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    } else if (range === "last_month") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (range === "90d") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "all") {
      startDate = undefined;
      endDate = undefined;
    } else if (range === "custom" && customStart) {
      startDate = new Date(`${customStart}T00:00:00`);
      if (customEnd) {
        endDate = new Date(`${customEnd}T23:59:59`);
      }
    } else {
      // Default: 30d
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const whereClause: any = { organizationId: orgId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const events = await db.analyticsEvent.findMany({
      where: whereClause,
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
    const timelineMap: Record<string, { date: string; pageViews: number; linkClicks: number; leads: number }> = {};

    events.forEach((ev) => {
      if (ev.eventType === "PageView") pageViews++;
      if (ev.eventType === "LinkClick") linkClicks++;
      if (ev.eventType === "Lead") leads++;
      if (ev.ipHash) uniqueVisitors.add(ev.ipHash);

      const dev = (ev.deviceType || "desktop").toLowerCase();
      deviceMap[dev] = (deviceMap[dev] || 0) + 1;

      const src = ev.utmSource || ev.referrer || "Direto / Orgânico";
      sourceMap[src] = (sourceMap[src] || 0) + 1;

      const dayKey = ev.createdAt.toISOString().split("T")[0];
      if (!timelineMap[dayKey]) {
        timelineMap[dayKey] = { date: dayKey, pageViews: 0, linkClicks: 0, leads: 0 };
      }
      if (ev.eventType === "PageView") timelineMap[dayKey].pageViews++;
      if (ev.eventType === "LinkClick") timelineMap[dayKey].linkClicks++;
      if (ev.eventType === "Lead") timelineMap[dayKey].leads++;
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
      timeline: Object.values(timelineMap),
    });
  } catch (error: any) {
    console.error("Erro no analytics API:", error);
    return NextResponse.json({ error: "Erro ao buscar métricas" }, { status: 500 });
  }
}
