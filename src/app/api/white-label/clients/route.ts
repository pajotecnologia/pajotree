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

    const clients = await db.organization.findMany({
      where: { whiteLabelParentId: orgId },
      include: {
        plan: {
          select: { id: true, name: true, priceMonthly: true, priceYearly: true },
        },
        pages: {
          select: { id: true, slug: true, title: true, name: true, status: true },
          take: 5,
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, status: true, lastLoginAt: true },
            },
          },
        },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            pages: true,
            links: true,
            leads: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalClients = clients.length;
    const activeClients = clients.filter((c) => c.status === "ACTIVE").length;
    const trialClients = clients.filter((c) => c.status === "TRIAL").length;
    const monthlyRevenue = clients.reduce((acc, c) => {
      const price = Number(c.plan?.priceMonthly || 0);
      return acc + (c.status === "ACTIVE" ? price : 0);
    }, 0);

    return NextResponse.json({
      summary: {
        totalClients,
        activeClients,
        trialClients,
        monthlyRevenue,
      },
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        document: c.document,
        status: c.status,
        planName: c.plan?.name || "Sem Plano",
        planPrice: Number(c.plan?.priceMonthly || 0),
        subscriptionStatus: c.subscriptions[0]?.status || "TRIAL",
        usersCount: c.users.length,
        pagesCount: c._count.pages,
        pageSlug: c.pages[0]?.slug || null,
        pageTitle: c.pages[0]?.title || c.pages[0]?.name || null,
        pages: c.pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title || p.name,
          status: p.status,
        })),
        linksCount: c._count.links,
        leadsCount: c._count.leads,
        owner: c.users[0]?.user || null,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao listar clientes White Label:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
