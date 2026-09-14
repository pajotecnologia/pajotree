import { NextResponse } from "next/server";
import { getCurrentAuthContext } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDatabaseSchema } from "@/lib/db-migrate";

export async function GET() {
  try {
    const auth = await getCurrentAuthContext();
    if (!auth || !auth.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso restrito ao Super Admin" }, { status: 403 });
    }

    try {
      await ensureDatabaseSchema();
    } catch {
      // Non-blocking
    }

    const [subscriptions, payments] = await Promise.all([
      db.subscription.findMany({
        include: {
          organization: { select: { id: true, name: true, email: true } },
          plan: { select: { id: true, name: true, priceMonthly: true, priceYearly: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      db.payment.findMany({
        include: {
          organization: { select: { id: true, name: true } },
          subscription: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ]);

    const activeSubscriptions = subscriptions.filter((item) => item.status === "ACTIVE");
    const monthlyRevenue = payments
      .filter((item) => item.status === "PAID")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return NextResponse.json({
      subscriptions,
      payments,
      summary: {
        activeSubscriptions: activeSubscriptions.length,
        totalSubscriptions: subscriptions.length,
        paidPayments: payments.filter((item) => item.status === "PAID").length,
        paidAmount: monthlyRevenue,
      },
    });
  } catch (error) {
    console.error("Erro ao carregar faturamento admin:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
